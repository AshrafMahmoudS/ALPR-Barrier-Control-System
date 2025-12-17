"""
ALPR (Automatic License Plate Recognition) engine using OpenALPR.
"""
import cv2
import logging
import time
from typing import List, Dict, Optional
import subprocess
import json


logger = logging.getLogger(__name__)


class ALPRResult:
    """Container for ALPR detection result."""

    def __init__(self, data: dict):
        """
        Initialize from OpenALPR result dictionary.

        Args:
            data: OpenALPR result dictionary
        """
        self.plate = data.get("plate", "")
        self.confidence = data.get("confidence", 0.0)
        self.matches_template = data.get("matches_template", 0)
        self.coordinates = data.get("coordinates", [])
        self.candidates = data.get("candidates", [])
        self.region = data.get("region", "")
        self.region_confidence = data.get("region_confidence", 0)
        self.processing_time_ms = data.get("processing_time_ms", 0)

    def __repr__(self):
        return f"<ALPRResult(plate='{self.plate}', confidence={self.confidence:.2f})>"

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "plate": self.plate,
            "confidence": self.confidence,
            "matches_template": self.matches_template,
            "coordinates": self.coordinates,
            "region": self.region,
            "region_confidence": self.region_confidence,
            "processing_time_ms": self.processing_time_ms,
            "candidates": self.candidates
        }


class ALPREngine:
    """
    ALPR engine wrapper for OpenALPR.
    """

    def __init__(
        self,
        country: str = "us",
        region: str = "",
        config_file: str = "/etc/openalpr/openalpr.conf",
        runtime_dir: str = "/usr/share/openalpr/runtime_data"
    ):
        """
        Initialize ALPR engine.

        Args:
            country: Country code for plate recognition (us, eu, etc.)
            region: Optional region specification
            config_file: Path to OpenALPR config file
            runtime_dir: Path to OpenALPR runtime data
        """
        self.country = country
        self.region = region
        self.config_file = config_file
        self.runtime_dir = runtime_dir

        # Check if OpenALPR is installed
        self._check_installation()

        logger.info(f"ALPR Engine initialized (country: {country}, region: {region})")

    def _check_installation(self):
        """Check if OpenALPR is properly installed."""
        try:
            result = subprocess.run(
                ["alpr", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                logger.info(f"OpenALPR version: {result.stdout.strip()}")
            else:
                logger.warning("OpenALPR may not be properly installed")
        except FileNotFoundError:
            logger.error(
                "OpenALPR not found. Please install OpenALPR. "
                "See docs/INSTALLATION.md for instructions."
            )
        except Exception as e:
            logger.error(f"Error checking OpenALPR installation: {e}")

    def recognize_from_image(
        self,
        image_path: str,
        top_n: int = 10,
        min_confidence: float = 80.0
    ) -> List[ALPRResult]:
        """
        Recognize license plates from image file.

        Args:
            image_path: Path to image file
            top_n: Maximum number of results to return
            min_confidence: Minimum confidence threshold (0-100)

        Returns:
            List of ALPR results
        """
        try:
            # Build OpenALPR command
            cmd = [
                "alpr",
                "-c", self.country,
                "-n", str(top_n),
                "--config", self.config_file,
                "-j",  # JSON output
                image_path
            ]

            # Add region if specified
            if self.region:
                cmd.extend(["-p", self.region])

            # Execute OpenALPR
            start_time = time.time()
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=5
            )
            processing_time = (time.time() - start_time) * 1000  # Convert to ms

            if result.returncode != 0:
                logger.error(f"OpenALPR error: {result.stderr}")
                return []

            # Parse JSON output
            data = json.loads(result.stdout)
            results = []

            for plate_data in data.get("results", []):
                # Filter by confidence
                if plate_data.get("confidence", 0) >= min_confidence:
                    plate_data["processing_time_ms"] = processing_time
                    results.append(ALPRResult(plate_data))

            logger.debug(
                f"Detected {len(results)} plates from {image_path} "
                f"(processing time: {processing_time:.2f}ms)"
            )

            return results

        except subprocess.TimeoutExpired:
            logger.error(f"OpenALPR timeout for image: {image_path}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenALPR output: {e}")
            return []
        except Exception as e:
            logger.error(f"Error in ALPR recognition: {e}")
            return []

    def recognize_from_frame(
        self,
        frame: cv2.Mat,
        top_n: int = 10,
        min_confidence: float = 80.0,
        temp_path: str = "/tmp/alpr_frame.jpg"
    ) -> List[ALPRResult]:
        """
        Recognize license plates from OpenCV frame.

        Args:
            frame: OpenCV image frame
            top_n: Maximum number of results
            min_confidence: Minimum confidence threshold
            temp_path: Temporary file path for frame

        Returns:
            List of ALPR results
        """
        try:
            # Save frame to temporary file
            cv2.imwrite(temp_path, frame)

            # Process with OpenALPR
            results = self.recognize_from_image(temp_path, top_n, min_confidence)

            return results

        except Exception as e:
            logger.error(f"Error recognizing from frame: {e}")
            return []

    def batch_recognize(
        self,
        image_paths: List[str],
        top_n: int = 10,
        min_confidence: float = 80.0
    ) -> Dict[str, List[ALPRResult]]:
        """
        Recognize license plates from multiple images.

        Args:
            image_paths: List of image file paths
            top_n: Maximum results per image
            min_confidence: Minimum confidence threshold

        Returns:
            Dictionary mapping image paths to results
        """
        results = {}
        for image_path in image_paths:
            results[image_path] = self.recognize_from_image(
                image_path, top_n, min_confidence
            )
        return results


class ALPRPreprocessor:
    """
    Image preprocessing utilities for better ALPR accuracy.
    """

    @staticmethod
    def enhance_frame(frame: cv2.Mat) -> cv2.Mat:
        """
        Enhance frame for better plate detection.

        Args:
            frame: Input frame

        Returns:
            Enhanced frame
        """
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Apply histogram equalization for better contrast
        enhanced = cv2.equalizeHist(gray)

        # Apply bilateral filter to reduce noise while preserving edges
        enhanced = cv2.bilateralFilter(enhanced, 9, 75, 75)

        # Convert back to BGR for OpenALPR
        enhanced_bgr = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)

        return enhanced_bgr

    @staticmethod
    def denoise(frame: cv2.Mat) -> cv2.Mat:
        """
        Remove noise from frame.

        Args:
            frame: Input frame

        Returns:
            Denoised frame
        """
        return cv2.fastNlMeansDenoisingColored(frame, None, 10, 10, 7, 21)

    @staticmethod
    def sharpen(frame: cv2.Mat) -> cv2.Mat:
        """
        Sharpen frame for better edge detection.

        Args:
            frame: Input frame

        Returns:
            Sharpened frame
        """
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        kernel[1, 1] = 5
        return cv2.filter2D(frame, -1, kernel)

    @staticmethod
    def adjust_brightness_contrast(
        frame: cv2.Mat,
        brightness: int = 0,
        contrast: int = 30
    ) -> cv2.Mat:
        """
        Adjust brightness and contrast.

        Args:
            frame: Input frame
            brightness: Brightness adjustment (-100 to 100)
            contrast: Contrast adjustment (0 to 100)

        Returns:
            Adjusted frame
        """
        adjusted = cv2.convertScaleAbs(frame, alpha=1 + contrast / 100, beta=brightness)
        return adjusted
