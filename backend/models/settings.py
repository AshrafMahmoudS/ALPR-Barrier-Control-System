"""
Settings model for storing application configuration.
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from database.session import Base


class Settings(Base):
    """Settings model for application configuration."""

    __tablename__ = "settings"

    # Use a single-row table with a fixed key
    id = Column(String, primary_key=True, default="default")

    # System settings
    site_name = Column(String(255), default="ALPR Parking System")
    timezone = Column(String(50), default="UTC")
    language = Column(String(10), default="en")
    date_format = Column(String(50), default="YYYY-MM-DD")
    time_format = Column(String(10), default="24h")

    # Camera settings
    resolution = Column(String(50), default="1920x1080")
    fps = Column(Integer, default=30)
    exposure = Column(String(50), default="auto")
    contrast = Column(Integer, default=50)
    brightness = Column(Integer, default=50)
    entry_camera_ip = Column(String(50), default="192.168.1.100")
    exit_camera_ip = Column(String(50), default="192.168.1.101")

    # ALPR settings
    confidence_threshold = Column(Float, default=0.75)
    min_plate_size = Column(Integer, default=100)
    max_plate_size = Column(Integer, default=800)
    processing_timeout = Column(Integer, default=5000)
    enable_ocr = Column(Boolean, default=True)
    plate_format = Column(String(50), default="auto")

    # Notification settings
    email_enabled = Column(Boolean, default=False)
    email_address = Column(String(255), nullable=True)
    sms_enabled = Column(Boolean, default=False)
    sms_number = Column(String(50), nullable=True)
    webhook_enabled = Column(Boolean, default=False)
    webhook_url = Column(String(500), nullable=True)
    notify_on_entry = Column(Boolean, default=True)
    notify_on_exit = Column(Boolean, default=False)
    notify_on_denied = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Settings(id={self.id})>"
