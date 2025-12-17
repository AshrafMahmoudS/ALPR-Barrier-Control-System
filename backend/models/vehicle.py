"""
Vehicle database model for registered vehicles.
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid

from database.session import Base


class VehicleType(str, Enum):
    """Vehicle type enumeration."""
    CAR = "car"
    MOTORCYCLE = "motorcycle"
    TRUCK = "truck"
    VAN = "van"
    SUV = "suv"
    BUS = "bus"
    OTHER = "other"


class VehicleStatus(str, Enum):
    """Vehicle registration status."""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    EXPIRED = "expired"
    PENDING = "pending"


class Vehicle(Base):
    """
    Vehicle model representing registered vehicles in the system.
    """
    __tablename__ = "vehicles"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    plate_number = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
        comment="License plate number (unique identifier)"
    )
    owner_name = Column(
        String(255),
        nullable=False,
        comment="Owner's full name"
    )
    owner_contact = Column(
        String(100),
        nullable=True,
        comment="Owner's contact (phone/email)"
    )
    vehicle_type = Column(
        SQLEnum(VehicleType),
        nullable=False,
        default=VehicleType.CAR,
        comment="Type of vehicle"
    )
    vehicle_make = Column(
        String(100),
        nullable=True,
        comment="Vehicle manufacturer"
    )
    vehicle_model = Column(
        String(100),
        nullable=True,
        comment="Vehicle model"
    )
    vehicle_color = Column(
        String(50),
        nullable=True,
        comment="Vehicle color"
    )
    registration_date = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="Date of registration"
    )
    expiry_date = Column(
        DateTime,
        nullable=True,
        comment="Registration expiry date (null = no expiry)"
    )
    status = Column(
        SQLEnum(VehicleStatus),
        nullable=False,
        default=VehicleStatus.ACTIVE,
        index=True,
        comment="Current registration status"
    )
    notes = Column(
        Text,
        nullable=True,
        comment="Additional notes or remarks"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="Record creation timestamp"
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        comment="Record last update timestamp"
    )

    def __repr__(self):
        return f"<Vehicle(plate='{self.plate_number}', owner='{self.owner_name}', status='{self.status}')>"

    def is_active(self) -> bool:
        """Check if vehicle registration is active and not expired."""
        if self.status != VehicleStatus.ACTIVE:
            return False

        if self.expiry_date and self.expiry_date < datetime.utcnow():
            return False

        return True

    def to_dict(self) -> dict:
        """Convert model to dictionary."""
        return {
            "id": str(self.id),
            "plate_number": self.plate_number,
            "owner_name": self.owner_name,
            "owner_contact": self.owner_contact,
            "vehicle_type": self.vehicle_type.value if self.vehicle_type else None,
            "vehicle_make": self.vehicle_make,
            "vehicle_model": self.vehicle_model,
            "vehicle_color": self.vehicle_color,
            "registration_date": self.registration_date.isoformat() if self.registration_date else None,
            "expiry_date": self.expiry_date.isoformat() if self.expiry_date else None,
            "status": self.status.value if self.status else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
