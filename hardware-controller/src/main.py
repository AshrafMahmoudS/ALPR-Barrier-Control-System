"""
Hardware Controller - Main entry point for barrier control.
"""
import asyncio
import logging
import os
import json
from dotenv import load_dotenv
import redis

from gpio.barrier_controller import BarrierManager

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class HardwareController:
    """
    Main hardware controller service for managing barriers.
    """

    def __init__(self):
        """Initialize hardware controller."""
        # Configuration
        self.redis_host = os.getenv('REDIS_HOST', 'localhost')
        self.redis_port = int(os.getenv('REDIS_PORT', 6379))

        # Barrier GPIO pins
        self.entry_barrier_pin = int(os.getenv('BARRIER_ENTRY_PIN', 17))
        self.exit_barrier_pin = int(os.getenv('BARRIER_EXIT_PIN', 27))

        # Sensor pins (optional)
        self.entry_sensor_pin = int(os.getenv('SENSOR_ENTRY_PIN', 22))
        self.exit_sensor_pin = int(os.getenv('SENSOR_EXIT_PIN', 23))

        # Barrier settings
        self.open_duration = int(os.getenv('BARRIER_OPEN_DURATION', 5))
        self.timeout = int(os.getenv('BARRIER_TIMEOUT', 10))
        self.safety_check = os.getenv('BARRIER_SAFETY_CHECK', 'true').lower() == 'true'

        # Initialize components
        self.barrier_manager = BarrierManager()
        self.redis_client = None

        # Running flag
        self.running = False

    async def initialize(self):
        """Initialize controller components."""
        logger.info("Initializing Hardware Controller...")

        try:
            # Connect to Redis
            self.redis_client = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                decode_responses=True
            )
            self.redis_client.ping()
            logger.info("Connected to Redis")

            # Initialize barriers
            logger.info("Initializing barriers...")

            # Entry barrier
            entry_success = self.barrier_manager.add_barrier(
                key='entry',
                name='Entry Barrier',
                relay_pin=self.entry_barrier_pin,
                sensor_pin=self.entry_sensor_pin if self.entry_sensor_pin else None,
                open_duration=self.open_duration,
                timeout=self.timeout,
                safety_check=self.safety_check
            )

            if not entry_success:
                logger.warning("Failed to initialize entry barrier")

            # Exit barrier
            exit_success = self.barrier_manager.add_barrier(
                key='exit',
                name='Exit Barrier',
                relay_pin=self.exit_barrier_pin,
                sensor_pin=self.exit_sensor_pin if self.exit_sensor_pin else None,
                open_duration=self.open_duration,
                timeout=self.timeout,
                safety_check=self.safety_check
            )

            if not exit_success:
                logger.warning("Failed to initialize exit barrier")

            logger.info("Hardware Controller initialized successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize hardware controller: {e}")
            return False

    async def listen_for_commands(self):
        """Listen for barrier commands from Redis pub/sub."""
        logger.info("Starting command listener...")

        pubsub = self.redis_client.pubsub()
        pubsub.subscribe('barrier_commands')

        logger.info("Subscribed to barrier_commands channel")

        while self.running:
            try:
                message = pubsub.get_message()

                if message and message['type'] == 'message':
                    try:
                        # Parse command
                        data = json.loads(message['data'])
                        barrier_id = data.get('barrier_id')
                        action = data.get('action')

                        logger.info(f"Received command: {barrier_id} - {action}")

                        # Execute command
                        if action == 'open':
                            success = self.barrier_manager.open_barrier(barrier_id)
                            if success:
                                logger.info(f"Barrier {barrier_id} opened successfully")
                            else:
                                logger.error(f"Failed to open barrier {barrier_id}")

                        elif action == 'close':
                            success = self.barrier_manager.close_barrier(barrier_id)
                            if success:
                                logger.info(f"Barrier {barrier_id} closed successfully")
                            else:
                                logger.error(f"Failed to close barrier {barrier_id}")

                        # Publish status update
                        await self.publish_barrier_status(barrier_id)

                    except json.JSONDecodeError:
                        logger.error(f"Invalid command format: {message['data']}")
                    except Exception as e:
                        logger.error(f"Error processing command: {e}")

                await asyncio.sleep(0.1)

            except Exception as e:
                logger.error(f"Error in command listener: {e}")
                await asyncio.sleep(1)

    async def publish_barrier_status(self, barrier_id: str):
        """
        Publish barrier status to Redis.

        Args:
            barrier_id: Barrier identifier
        """
        try:
            barrier = self.barrier_manager.get_barrier(barrier_id)
            if barrier:
                stats = barrier.get_stats()
                self.redis_client.publish('barrier_status', json.dumps(stats))

        except Exception as e:
            logger.error(f"Failed to publish barrier status: {e}")

    async def publish_stats(self):
        """Periodically publish statistics to Redis."""
        while self.running:
            try:
                stats = self.barrier_manager.get_all_stats()
                self.redis_client.set('hardware_controller_stats', json.dumps(stats))
                await asyncio.sleep(5)

            except Exception as e:
                logger.error(f"Error publishing stats: {e}")
                await asyncio.sleep(5)

    async def run(self):
        """Run the hardware controller."""
        # Initialize
        if not await self.initialize():
            logger.error("Failed to initialize controller")
            return

        self.running = True
        logger.info("Hardware Controller started")

        # Start tasks
        tasks = [
            asyncio.create_task(self.listen_for_commands()),
            asyncio.create_task(self.publish_stats())
        ]

        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            logger.info("Shutdown requested...")
        finally:
            await self.shutdown()

    async def shutdown(self):
        """Shutdown the controller gracefully."""
        logger.info("Shutting down Hardware Controller...")

        self.running = False

        # Cleanup barriers
        self.barrier_manager.cleanup_all()

        # Close Redis connection
        if self.redis_client:
            self.redis_client.close()

        logger.info("Hardware Controller stopped")


async def main():
    """Main entry point."""
    controller = HardwareController()
    await controller.run()


if __name__ == "__main__":
    asyncio.run(main())
