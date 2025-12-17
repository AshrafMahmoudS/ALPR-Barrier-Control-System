"""
Barrier controller module for GPIO-based barrier arm control.
"""
import logging
import time
from typing import Optional, Callable
from enum import Enum
from threading import Thread, Event

try:
    from gpiozero import OutputDevice, InputDevice
    GPIO_AVAILABLE = True
except ImportError:
    GPIO_AVAILABLE = False
    logging.warning("GPIO library not available. Running in simulation mode.")


logger = logging.getLogger(__name__)


class BarrierState(str, Enum):
    """Barrier state enumeration."""
    CLOSED = "closed"
    OPENING = "opening"
    OPEN = "open"
    CLOSING = "closing"
    ERROR = "error"
    UNKNOWN = "unknown"


class BarrierController:
    """
    Controls a single barrier arm via GPIO relay.
    """

    def __init__(
        self,
        name: str,
        relay_pin: int,
        sensor_pin: Optional[int] = None,
        open_duration: int = 5,
        timeout: int = 10,
        safety_check: bool = True
    ):
        """
        Initialize barrier controller.

        Args:
            name: Human-readable barrier name (e.g., "Entry Barrier")
            relay_pin: GPIO pin number for relay control
            sensor_pin: Optional GPIO pin for position sensor
            open_duration: How long to keep barrier open (seconds)
            timeout: Maximum time for operation (seconds)
            safety_check: Enable safety checks
        """
        self.name = name
        self.relay_pin = relay_pin
        self.sensor_pin = sensor_pin
        self.open_duration = open_duration
        self.timeout = timeout
        self.safety_check = safety_check

        # Initialize state
        self.state = BarrierState.UNKNOWN
        self.relay: Optional[OutputDevice] = None
        self.sensor: Optional[InputDevice] = None

        # Threading
        self.stop_event = Event()
        self.operation_thread: Optional[Thread] = None

        # Statistics
        self.operation_count = 0
        self.error_count = 0
        self.last_operation_time = 0

        # Callbacks
        self.state_change_callback: Optional[Callable] = None

        self._initialize_gpio()

    def _initialize_gpio(self):
        """Initialize GPIO pins."""
        if not GPIO_AVAILABLE:
            logger.warning(f"{self.name}: GPIO not available, running in simulation mode")
            self.state = BarrierState.CLOSED
            return

        try:
            # Initialize relay (active low - relay triggers on LOW signal)
            self.relay = OutputDevice(self.relay_pin, active_high=False, initial_value=False)

            # Initialize sensor if provided
            if self.sensor_pin is not None:
                self.sensor = InputDevice(self.sensor_pin, pull_up=True)

            self.state = BarrierState.CLOSED
            logger.info(f"{self.name}: GPIO initialized successfully (relay pin: {self.relay_pin})")

        except Exception as e:
            logger.error(f"{self.name}: Failed to initialize GPIO: {e}")
            self.state = BarrierState.ERROR

    def open(self, duration: Optional[int] = None) -> bool:
        """
        Open the barrier.

        Args:
            duration: Optional override for open duration

        Returns:
            True if operation started successfully
        """
        if self.state in [BarrierState.OPENING, BarrierState.OPEN]:
            logger.warning(f"{self.name}: Already open or opening")
            return True

        if self.state == BarrierState.ERROR:
            logger.error(f"{self.name}: Cannot open - barrier in error state")
            return False

        # Safety check
        if self.safety_check and not self._perform_safety_check():
            logger.error(f"{self.name}: Safety check failed")
            return False

        # Stop any ongoing operation
        self._stop_operation()

        # Start open operation in background
        self.operation_thread = Thread(
            target=self._open_operation,
            args=(duration or self.open_duration,),
            daemon=True
        )
        self.operation_thread.start()

        return True

    def _open_operation(self, duration: int):
        """
        Execute barrier open operation.

        Args:
            duration: How long to keep barrier open
        """
        try:
            self._set_state(BarrierState.OPENING)
            self.last_operation_time = time.time()

            # Activate relay to open barrier
            if GPIO_AVAILABLE and self.relay:
                self.relay.on()
            else:
                logger.info(f"{self.name}: [SIMULATION] Opening barrier")

            # Wait for barrier to fully open (simulate motor movement)
            time.sleep(2)

            self._set_state(BarrierState.OPEN)
            self.operation_count += 1

            logger.info(f"{self.name}: Barrier opened, will close in {duration} seconds")

            # Keep barrier open for specified duration
            if not self.stop_event.wait(duration):
                # Auto-close after duration
                self._close_operation()
            else:
                # Manual close requested
                logger.info(f"{self.name}: Manual close requested")
                self._close_operation()

        except Exception as e:
            logger.error(f"{self.name}: Error during open operation: {e}")
            self.error_count += 1
            self._set_state(BarrierState.ERROR)
            self._emergency_stop()

    def close(self) -> bool:
        """
        Close the barrier immediately.

        Returns:
            True if operation started successfully
        """
        if self.state == BarrierState.CLOSED:
            logger.warning(f"{self.name}: Already closed")
            return True

        if self.state == BarrierState.ERROR:
            logger.error(f"{self.name}: Cannot close - barrier in error state")
            return False

        # Signal to close
        self.stop_event.set()
        return True

    def _close_operation(self):
        """Execute barrier close operation."""
        try:
            self._set_state(BarrierState.CLOSING)

            # Deactivate relay to close barrier
            if GPIO_AVAILABLE and self.relay:
                self.relay.off()
            else:
                logger.info(f"{self.name}: [SIMULATION] Closing barrier")

            # Wait for barrier to fully close
            time.sleep(2)

            self._set_state(BarrierState.CLOSED)
            logger.info(f"{self.name}: Barrier closed")

        except Exception as e:
            logger.error(f"{self.name}: Error during close operation: {e}")
            self.error_count += 1
            self._set_state(BarrierState.ERROR)

        finally:
            self.stop_event.clear()

    def _perform_safety_check(self) -> bool:
        """
        Perform safety checks before operation.

        Returns:
            True if safe to operate
        """
        # Check if sensor indicates obstruction (if available)
        if GPIO_AVAILABLE and self.sensor:
            if self.sensor.is_active:
                logger.warning(f"{self.name}: Obstruction detected")
                return False

        # Add more safety checks as needed
        return True

    def _emergency_stop(self):
        """Emergency stop - immediately deactivate relay."""
        logger.error(f"{self.name}: EMERGENCY STOP")
        if GPIO_AVAILABLE and self.relay:
            self.relay.off()
        self._set_state(BarrierState.ERROR)

    def _stop_operation(self):
        """Stop any ongoing operation."""
        if self.operation_thread and self.operation_thread.is_alive():
            self.stop_event.set()
            self.operation_thread.join(timeout=2)

    def _set_state(self, new_state: BarrierState):
        """
        Update barrier state and trigger callback.

        Args:
            new_state: New barrier state
        """
        old_state = self.state
        self.state = new_state

        logger.debug(f"{self.name}: State changed: {old_state} → {new_state}")

        if self.state_change_callback:
            try:
                self.state_change_callback(self.name, old_state, new_state)
            except Exception as e:
                logger.error(f"{self.name}: Error in state change callback: {e}")

    def get_state(self) -> BarrierState:
        """Get current barrier state."""
        return self.state

    def is_operational(self) -> bool:
        """Check if barrier is operational."""
        return self.state != BarrierState.ERROR

    def reset(self):
        """Reset barrier from error state."""
        if self.state == BarrierState.ERROR:
            self._stop_operation()
            if GPIO_AVAILABLE and self.relay:
                self.relay.off()
            self._set_state(BarrierState.CLOSED)
            logger.info(f"{self.name}: Reset to closed state")

    def get_stats(self) -> dict:
        """Get barrier statistics."""
        return {
            "name": self.name,
            "state": self.state.value,
            "operation_count": self.operation_count,
            "error_count": self.error_count,
            "last_operation_time": self.last_operation_time,
            "is_operational": self.is_operational(),
            "gpio_available": GPIO_AVAILABLE
        }

    def cleanup(self):
        """Cleanup GPIO resources."""
        self._stop_operation()

        if GPIO_AVAILABLE:
            if self.relay:
                self.relay.close()
            if self.sensor:
                self.sensor.close()

        logger.info(f"{self.name}: Cleanup complete")


class BarrierManager:
    """
    Manages multiple barrier controllers.
    """

    def __init__(self):
        """Initialize barrier manager."""
        self.barriers: dict[str, BarrierController] = {}

    def add_barrier(
        self,
        key: str,
        name: str,
        relay_pin: int,
        sensor_pin: Optional[int] = None,
        open_duration: int = 5,
        timeout: int = 10,
        safety_check: bool = True
    ) -> bool:
        """
        Add a new barrier controller.

        Args:
            key: Unique key for this barrier (e.g., 'entry', 'exit')
            name: Human-readable name
            relay_pin: GPIO pin for relay
            sensor_pin: Optional sensor pin
            open_duration: Open duration in seconds
            timeout: Operation timeout
            safety_check: Enable safety checks

        Returns:
            True if barrier added successfully
        """
        if key in self.barriers:
            logger.warning(f"Barrier with key '{key}' already exists")
            return False

        barrier = BarrierController(
            name, relay_pin, sensor_pin, open_duration, timeout, safety_check
        )

        if barrier.is_operational():
            self.barriers[key] = barrier
            logger.info(f"Barrier '{name}' added successfully")
            return True

        return False

    def get_barrier(self, key: str) -> Optional[BarrierController]:
        """Get barrier controller by key."""
        return self.barriers.get(key)

    def open_barrier(self, key: str, duration: Optional[int] = None) -> bool:
        """Open specific barrier."""
        barrier = self.barriers.get(key)
        if barrier:
            return barrier.open(duration)
        logger.error(f"Barrier '{key}' not found")
        return False

    def close_barrier(self, key: str) -> bool:
        """Close specific barrier."""
        barrier = self.barriers.get(key)
        if barrier:
            return barrier.close()
        logger.error(f"Barrier '{key}' not found")
        return False

    def get_all_stats(self) -> dict:
        """Get statistics for all barriers."""
        return {
            key: barrier.get_stats()
            for key, barrier in self.barriers.items()
        }

    def cleanup_all(self):
        """Cleanup all barriers."""
        for barrier in self.barriers.values():
            barrier.cleanup()
        self.barriers.clear()
