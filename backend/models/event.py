"""
Event database model for tracking vehicle check-in/check-out events.
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, DateTime, Float, Integer, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from database.session import Base


class EventType(str, Enum):
    """Event type enumeration."""
    ENTRY = "entry"
    EXIT = "exit"


class BarrierAction(str, Enum):
    """Barrier action taken during event."""
    OPENED = "opened"
    DENIED = "denied"
    MANUAL = "manual"
    ERROR = "error"


class Event(Base):
    """
    Event model representing vehicle detection and barrier control events.
    """
    __tablename__ = "events"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    vehicle_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vehicles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Reference to registered vehicle (null if unregistered)"
    )
    plate_number = Column(
        String(20),
        nullable=False,
        index=True,
        comment="Detected license plate number"
    )
    event_type = Column(
        SQLEnum(EventType),
        nullable=False,
        index=True,
        comment="Type of event (entry/exit)"
    )
    timestamp = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
        comment="Event occurrence timestamp"
    )
    camera_id = Column(
        String(50),
        nullable=False,
        comment="Camera identifier that detected the plate"
    )
    confidence_score = Column(
        Float,
        nullable=False,
        comment="ALPR confidence score (0-100)"
    )
    image_path = Column(
        String(500),
        nullable=True,
        comment="Path to captured image"
    )
    barrier_action = Column(
        SQLEnum(BarrierAction),
        nullable=False,
        default=BarrierAction.DENIED,
        comment="Action taken on barrier"
    )
    processing_time_ms = Column(
        Integer,
        nullable=True,
        comment="Processing time in milliseconds"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="Record creation timestamp"
    )

    # Relationship to vehicle
    vehicle = relationship("Vehicle", backref="events", lazy="joined")

    def __repr__(self):
        return f"<Event(plate='{self.plate_number}', type='{self.event_type}', action='{self.barrier_action}')>"

    def to_dict(self) -> dict:
        """Convert model to dictionary."""
        return {
            "id": str(self.id),
            "vehicle_id": str(self.vehicle_id) if self.vehicle_id else None,
            "plate_number": self.plate_number,
            "event_type": self.event_type.value if self.event_type else None,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "camera_id": self.camera_id,
            "confidence_score": self.confidence_score,
            "image_path": self.image_path,
            "barrier_action": self.barrier_action.value if self.barrier_action else None,
            "processing_time_ms": self.processing_time_ms,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ParkingSession(Base):
    """
    Parking session model linking entry and exit events.
    """
    __tablename__ = "parking_sessions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    vehicle_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Reference to vehicle"
    )
    entry_event_id = Column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        comment="Reference to entry event"
    )
    exit_event_id = Column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=True,
        comment="Reference to exit event (null if still parked)"
    )
    entry_time = Column(
        DateTime,
        nullable=False,
        index=True,
        comment="Entry timestamp"
    )
    exit_time = Column(
        DateTime,
        nullable=True,
        index=True,
        comment="Exit timestamp (null if still parked)"
    )
    duration_minutes = Column(
        Integer,
        nullable=True,
        comment="Parking duration in minutes"
    )
    parking_lot_id = Column(
        String(50),
        nullable=True,
        comment="Parking lot identifier"
    )
    status = Column(
        String(20),
        nullable=False,
        default="active",
        index=True,
        comment="Session status (active/completed)"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    vehicle = relationship("Vehicle", backref="parking_sessions")
    entry_event = relationship("Event", foreign_keys=[entry_event_id], backref="entry_sessions")
    exit_event = relationship("Event", foreign_keys=[exit_event_id], backref="exit_sessions")

    def __repr__(self):
        return f"<ParkingSession(vehicle_id='{self.vehicle_id}', status='{self.status}')>"

    def calculate_duration(self):
        """Calculate parking duration if session is completed."""
        if self.exit_time and self.entry_time:
            delta = self.exit_time - self.entry_time
            self.duration_minutes = int(delta.total_seconds() / 60)

    def to_dict(self) -> dict:
        """Convert model to dictionary."""
        return {
            "id": str(self.id),
            "vehicle_id": str(self.vehicle_id),
            "entry_event_id": str(self.entry_event_id),
            "exit_event_id": str(self.exit_event_id) if self.exit_event_id else None,
            "entry_time": self.entry_time.isoformat() if self.entry_time else None,
            "exit_time": self.exit_time.isoformat() if self.exit_time else None,
            "duration_minutes": self.duration_minutes,
            "parking_lot_id": self.parking_lot_id,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
