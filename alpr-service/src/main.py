"""
ALPR Service - Main entry point for license plate detection.
"""
import asyncio
import logging
import os
import time
from datetime import datetime
from pathlib import Path

import cv2
import redis
import aiohttp
from dotenv import load_dotenv

from camera.camera_manager import CameraManager
from detection.alpr_engine import ALPREngine, ALPRPreprocessor

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ALPRService:
    """
    Main ALPR service that manages cameras, detection, and event publishing.
    """

    def __init__(self):
        """Initialize ALPR service."""
        # Configuration
        self.api_url = os.getenv('VITE_API_URL', 'http://localhost:8000')
        self.redis_host = os.getenv('REDIS_HOST', 'localhost')
        self.redis_port = int(os.getenv('REDIS_PORT', 6379))

        # ALPR settings
        self.alpr_country = os.getenv('ALPR_COUNTRY', 'us')
        self.alpr_region = os.getenv('ALPR_REGION', '')
        self.confidence_threshold = float(os.getenv('ALPR_CONFIDENCE_THRESHOLD', 80.0))
        self.process_interval = float(os.getenv('ALPR_PROCESS_INTERVAL', 0.5))

        # Camera settings
        self.entry_camera_id = int(os.getenv('ENTRY_CAMERA_ID', 0))
        self.entry_camera_name = os.getenv('ENTRY_CAMERA_NAME', 'Entry Camera')
        self.exit_camera_id = int(os.getenv('EXIT_CAMERA_ID', 1))
        self.exit_camera_name = os.getenv('EXIT_CAMERA_NAME', 'Exit Camera')

        # Image storage
        self.enable_image_capture = os.getenv('ENABLE_IMAGE_CAPTURE', 'true').lower() == 'true'
        self.image_storage_path = os.getenv('IMAGE_STORAGE_PATH', '/var/alpr-system/images')

        # Initialize components
        self.camera_manager = CameraManager()
        self.alpr_engine = ALPREngine(
            country=self.alpr_country,
            region=self.alpr_region
        )
        self.preprocessor = ALPRPreprocessor()

        # Redis connection
        self.redis_client = None

        # HTTP session
        self.http_session = None

        # Running flag
        self.running = False

        # Statistics
        self.stats = {
            'entry_detections': 0,
            'exit_detections': 0,
            'frames_processed': 0,
            'errors': 0,
            'start_time': None
        }

    async def initialize(self):
        """Initialize service components."""
        logger.info("Initializing ALPR Service...")

        try:
            # Connect to Redis
            self.redis_client = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                decode_responses=True
            )
            self.redis_client.ping()
            logger.info("Connected to Redis")

            # Create HTTP session
            self.http_session = aiohttp.ClientSession()
            logger.info("HTTP session created")

            # Initialize cameras
            logger.info("Initializing cameras...")

            # Entry camera
            entry_success = self.camera_manager.add_camera(
                key='entry',
                camera_id=self.entry_camera_id,
                name=self.entry_camera_name,
                resolution=(1920, 1080),
                fps=30
            )

            if not entry_success:
                logger.warning(f"Failed to initialize {self.entry_camera_name}")

            # Exit camera
            exit_success = self.camera_manager.add_camera(
                key='exit',
                camera_id=self.exit_camera_id,
                name=self.exit_camera_name,
                resolution=(1920, 1080),
                fps=30
            )

            if not exit_success:
                logger.warning(f"Failed to initialize {self.exit_camera_name}")

            # Ensure image storage directory exists
            if self.enable_image_capture:
                Path(self.image_storage_path).mkdir(parents=True, exist_ok=True)
                logger.info(f"Image storage: {self.image_storage_path}")

            logger.info("ALPR Service initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize ALPR service: {e}")
            return False

    async def process_camera(self, camera_key: str, event_type: str):
        """
        Process frames from a specific camera.

        Args:
            camera_key: Camera identifier ('entry' or 'exit')
            event_type: Event type ('entry' or 'exit')
        """
        logger.info(f"Starting {camera_key} camera processing...")

        last_detection_time = {}  # Track last detection time per plate
        cooldown_period = 5  # Seconds between detections of same plate

        while self.running:
            try:
                # Get frame from camera
                frame = self.camera_manager.get_frame(camera_key)

                if frame is None:
                    await asyncio.sleep(0.1)
                    continue

                # Preprocess frame for better detection
                enhanced_frame = self.preprocessor.enhance_frame(frame)

                # Run ALPR detection
                start_time = time.time()
                results = self.alpr_engine.recognize_from_frame(
                    enhanced_frame,
                    top_n=3,
                    min_confidence=self.confidence_threshold
                )
                processing_time = (time.time() - start_time) * 1000  # ms

                self.stats['frames_processed'] += 1

                # Process results
                for result in results:
                    plate_number = result.plate.upper()

                    # Check cooldown
                    last_time = last_detection_time.get(plate_number, 0)
                    current_time = time.time()

                    if current_time - last_time < cooldown_period:
                        continue  # Skip - too soon since last detection

                    # Update last detection time
                    last_detection_time[plate_number] = current_time

                    logger.info(
                        f"Detected plate: {plate_number} "
                        f"(confidence: {result.confidence:.2f}%, "
                        f"camera: {camera_key})"
                    )

                    # Save image if enabled
                    image_path = None
                    if self.enable_image_capture:
                        image_path = await self.save_detection_image(
                            frame, plate_number, camera_key
                        )

                    # Check if vehicle is registered
                    vehicle_registered = await self.check_vehicle_registration(plate_number)

                    barrier_action = 'opened' if vehicle_registered else 'denied'

                    # Send barrier command
                    if vehicle_registered:
                        await self.send_barrier_command(camera_key, 'open')

                    # Create event
                    await self.create_event(
                        plate_number=plate_number,
                        event_type=event_type,
                        camera_id=camera_key,
                        confidence_score=result.confidence,
                        image_path=image_path,
                        barrier_action=barrier_action,
                        processing_time_ms=int(processing_time)
                    )

                    # Update statistics
                    if event_type == 'entry':
                        self.stats['entry_detections'] += 1
                    else:
                        self.stats['exit_detections'] += 1

                # Wait before processing next frame
                await asyncio.sleep(self.process_interval)

            except Exception as e:
                logger.error(f"Error processing {camera_key} camera: {e}")
                self.stats['errors'] += 1
                await asyncio.sleep(1)

    async def save_detection_image(self, frame, plate_number: str, camera_key: str) -> str:
        """
        Save detection image to storage.

        Args:
            frame: OpenCV frame
            plate_number: Detected plate number
            camera_key: Camera identifier

        Returns:
            Path to saved image
        """
        try:
            # Create directory structure: YYYY/MM/DD/
            now = datetime.now()
            date_path = now.strftime('%Y/%m/%d')
            full_path = Path(self.image_storage_path) / date_path
            full_path.mkdir(parents=True, exist_ok=True)

            # Generate filename
            timestamp = now.strftime('%H%M%S')
            filename = f"{camera_key}_{plate_number}_{timestamp}.jpg"
            image_path = full_path / filename

            # Save image
            cv2.imwrite(str(image_path), frame, [cv2.IMWRITE_JPEG_QUALITY, 85])

            # Return relative path
            return str(Path(date_path) / filename)

        except Exception as e:
            logger.error(f"Failed to save image: {e}")
            return None

    async def check_vehicle_registration(self, plate_number: str) -> bool:
        """
        Check if vehicle is registered and active.

        Args:
            plate_number: License plate number

        Returns:
            True if vehicle is registered and active
        """
        try:
            url = f"{self.api_url}/api/v1/vehicles/plate/{plate_number}"
            async with self.http_session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('status') == 'active'
                return False

        except Exception as e:
            logger.error(f"Error checking vehicle registration: {e}")
            return False

    async def create_event(
        self,
        plate_number: str,
        event_type: str,
        camera_id: str,
        confidence_score: float,
        image_path: str,
        barrier_action: str,
        processing_time_ms: int
    ):
        """
        Create event via API.

        Args:
            plate_number: Detected plate number
            event_type: 'entry' or 'exit'
            camera_id: Camera identifier
            confidence_score: Detection confidence
            image_path: Path to saved image
            barrier_action: Action taken on barrier
            processing_time_ms: Processing time in milliseconds
        """
        try:
            url = f"{self.api_url}/api/v1/events"
            data = {
                "plate_number": plate_number,
                "event_type": event_type,
                "camera_id": camera_id,
                "confidence_score": confidence_score,
                "image_path": image_path,
                "barrier_action": barrier_action,
                "processing_time_ms": processing_time_ms
            }

            async with self.http_session.post(url, json=data) as response:
                if response.status == 201:
                    logger.info(f"Event created for plate {plate_number}")
                else:
                    logger.error(f"Failed to create event: {response.status}")

        except Exception as e:
            logger.error(f"Error creating event: {e}")

    async def send_barrier_command(self, camera_key: str, action: str):
        """
        Send command to barrier controller.

        Args:
            camera_key: 'entry' or 'exit'
            action: 'open' or 'close'
        """
        try:
            # Publish command to Redis for hardware controller
            barrier_id = camera_key  # 'entry' or 'exit'
            command = {
                'barrier_id': barrier_id,
                'action': action,
                'timestamp': datetime.utcnow().isoformat()
            }

            self.redis_client.publish('barrier_commands', str(command))
            logger.info(f"Barrier command sent: {barrier_id} - {action}")

        except Exception as e:
            logger.error(f"Failed to send barrier command: {e}")

    async def publish_stats(self):
        """Periodically publish statistics to Redis."""
        while self.running:
            try:
                stats = {
                    **self.stats,
                    'camera_stats': self.camera_manager.get_all_stats(),
                    'uptime': time.time() - self.stats['start_time'] if self.stats['start_time'] else 0
                }

                self.redis_client.set('alpr_service_stats', str(stats))
                await asyncio.sleep(5)

            except Exception as e:
                logger.error(f"Error publishing stats: {e}")
                await asyncio.sleep(5)

    async def run(self):
        """Run the ALPR service."""
        # Initialize
        if not await self.initialize():
            logger.error("Failed to initialize service")
            return

        self.running = True
        self.stats['start_time'] = time.time()

        logger.info("ALPR Service started")

        # Start processing tasks
        tasks = [
            asyncio.create_task(self.process_camera('entry', 'entry')),
            asyncio.create_task(self.process_camera('exit', 'exit')),
            asyncio.create_task(self.publish_stats())
        ]

        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            logger.info("Shutdown requested...")
        finally:
            await self.shutdown()

    async def shutdown(self):
        """Shutdown the service gracefully."""
        logger.info("Shutting down ALPR Service...")

        self.running = False

        # Stop cameras
        self.camera_manager.stop_all()

        # Close HTTP session
        if self.http_session:
            await self.http_session.close()

        # Close Redis connection
        if self.redis_client:
            self.redis_client.close()

        logger.info("ALPR Service stopped")


async def main():
    """Main entry point."""
    service = ALPRService()
    await service.run()


if __name__ == "__main__":
    asyncio.run(main())
