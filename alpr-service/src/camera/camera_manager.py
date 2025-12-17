"""
Camera management module for handling video streams from multiple cameras.
"""
import cv2
import logging
from typing import Optional, Tuple
from threading import Thread, Lock
import time


logger = logging.getLogger(__name__)


class CameraStream:
    """
    Manages a single camera video stream with thread-safe frame capture.
    """

    def __init__(
        self,
        camera_id: int,
        name: str,
        resolution: Tuple[int, int] = (1920, 1080),
        fps: int = 30
    ):
        """
        Initialize camera stream.

        Args:
            camera_id: Camera device ID (e.g., 0 for /dev/video0)
            name: Human-readable camera name
            resolution: Desired resolution as (width, height)
            fps: Desired frames per second
        """
        self.camera_id = camera_id
        self.name = name
        self.resolution = resolution
        self.fps = fps

        self.capture: Optional[cv2.VideoCapture] = None
        self.frame = None
        self.stopped = False
        self.lock = Lock()

        self.frame_count = 0
        self.error_count = 0
        self.last_frame_time = 0

    def start(self) -> bool:
        """
        Start camera capture and reading thread.

        Returns:
            True if camera started successfully, False otherwise
        """
        try:
            # Initialize video capture
            self.capture = cv2.VideoCapture(self.camera_id)

            if not self.capture.isOpened():
                logger.error(f"Failed to open camera {self.name} (ID: {self.camera_id})")
                return False

            # Set camera properties
            self.capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.resolution[0])
            self.capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
            self.capture.set(cv2.CAP_PROP_FPS, self.fps)

            # Read initial frame to verify camera works
            ret, frame = self.capture.read()
            if not ret:
                logger.error(f"Failed to read initial frame from {self.name}")
                return False

            self.frame = frame
            self.stopped = False

            # Start background thread for continuous frame reading
            Thread(target=self._update, daemon=True).start()

            logger.info(
                f"Camera {self.name} started successfully "
                f"(Resolution: {self.resolution}, FPS: {self.fps})"
            )
            return True

        except Exception as e:
            logger.error(f"Error starting camera {self.name}: {e}")
            return False

    def _update(self):
        """
        Continuously read frames from camera in background thread.
        """
        while not self.stopped:
            try:
                if self.capture is not None and self.capture.isOpened():
                    ret, frame = self.capture.read()

                    if ret:
                        with self.lock:
                            self.frame = frame
                            self.frame_count += 1
                            self.last_frame_time = time.time()
                            self.error_count = 0  # Reset error count on success
                    else:
                        self.error_count += 1
                        logger.warning(
                            f"Failed to read frame from {self.name} "
                            f"(error count: {self.error_count})"
                        )

                        # Attempt to reconnect after multiple errors
                        if self.error_count >= 10:
                            logger.error(f"Too many errors, attempting to reconnect {self.name}")
                            self._reconnect()

                else:
                    time.sleep(0.1)

            except Exception as e:
                logger.error(f"Error reading frame from {self.name}: {e}")
                self.error_count += 1
                time.sleep(0.1)

    def _reconnect(self):
        """Attempt to reconnect to camera."""
        try:
            if self.capture is not None:
                self.capture.release()

            time.sleep(1)
            self.capture = cv2.VideoCapture(self.camera_id)

            if self.capture.isOpened():
                self.capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.resolution[0])
                self.capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.resolution[1])
                self.capture.set(cv2.CAP_PROP_FPS, self.fps)
                self.error_count = 0
                logger.info(f"Successfully reconnected to {self.name}")
            else:
                logger.error(f"Failed to reconnect to {self.name}")

        except Exception as e:
            logger.error(f"Error during reconnection of {self.name}: {e}")

    def read(self) -> Optional[cv2.Mat]:
        """
        Get the latest frame from camera.

        Returns:
            Latest frame or None if no frame available
        """
        with self.lock:
            return self.frame.copy() if self.frame is not None else None

    def stop(self):
        """Stop camera capture and release resources."""
        self.stopped = True

        if self.capture is not None:
            self.capture.release()
            self.capture = None

        logger.info(f"Camera {self.name} stopped")

    def is_alive(self) -> bool:
        """Check if camera is actively capturing frames."""
        if self.stopped or self.capture is None:
            return False

        # Check if we've received frames recently (within last 5 seconds)
        time_since_last_frame = time.time() - self.last_frame_time
        return time_since_last_frame < 5.0

    def get_stats(self) -> dict:
        """Get camera statistics."""
        return {
            "name": self.name,
            "camera_id": self.camera_id,
            "frame_count": self.frame_count,
            "error_count": self.error_count,
            "is_alive": self.is_alive(),
            "last_frame_time": self.last_frame_time,
            "resolution": self.resolution,
            "fps": self.fps
        }


class CameraManager:
    """
    Manages multiple camera streams.
    """

    def __init__(self):
        """Initialize camera manager."""
        self.cameras: dict[str, CameraStream] = {}

    def add_camera(
        self,
        key: str,
        camera_id: int,
        name: str,
        resolution: Tuple[int, int] = (1920, 1080),
        fps: int = 30
    ) -> bool:
        """
        Add and start a new camera stream.

        Args:
            key: Unique key for this camera (e.g., 'entry', 'exit')
            camera_id: Camera device ID
            name: Human-readable name
            resolution: Camera resolution
            fps: Frames per second

        Returns:
            True if camera added and started successfully
        """
        if key in self.cameras:
            logger.warning(f"Camera with key '{key}' already exists")
            return False

        camera = CameraStream(camera_id, name, resolution, fps)
        if camera.start():
            self.cameras[key] = camera
            return True

        return False

    def get_camera(self, key: str) -> Optional[CameraStream]:
        """Get camera stream by key."""
        return self.cameras.get(key)

    def get_frame(self, key: str) -> Optional[cv2.Mat]:
        """Get latest frame from camera."""
        camera = self.cameras.get(key)
        return camera.read() if camera else None

    def stop_camera(self, key: str):
        """Stop a specific camera."""
        camera = self.cameras.get(key)
        if camera:
            camera.stop()
            del self.cameras[key]

    def stop_all(self):
        """Stop all cameras."""
        for camera in self.cameras.values():
            camera.stop()
        self.cameras.clear()

    def get_all_stats(self) -> dict:
        """Get statistics for all cameras."""
        return {
            key: camera.get_stats()
            for key, camera in self.cameras.items()
        }

    def health_check(self) -> bool:
        """Check if all cameras are healthy."""
        return all(camera.is_alive() for camera in self.cameras.values())
