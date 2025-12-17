"""
Pydantic schemas for settings endpoints.
"""
from typing import Optional
from pydantic import BaseModel, Field


class SystemSettings(BaseModel):
    """System configuration settings."""
    site_name: str = Field(default="ALPR Parking System")
    timezone: str = Field(default="UTC")
    language: str = Field(default="en")
    date_format: str = Field(default="YYYY-MM-DD")
    time_format: str = Field(default="24h")


class CameraSettings(BaseModel):
    """Camera configuration settings."""
    resolution: str = Field(default="1920x1080")
    fps: int = Field(default=30, ge=1, le=60)
    exposure: str = Field(default="auto")
    contrast: int = Field(default=50, ge=0, le=100)
    brightness: int = Field(default=50, ge=0, le=100)
    entry_camera_ip: Optional[str] = Field(default="192.168.1.100")
    exit_camera_ip: Optional[str] = Field(default="192.168.1.101")


class ALPRSettings(BaseModel):
    """ALPR processing settings."""
    confidence_threshold: float = Field(default=0.75, ge=0.0, le=1.0)
    min_plate_size: int = Field(default=100, ge=50, le=500)
    max_plate_size: int = Field(default=800, ge=200, le=2000)
    processing_timeout: int = Field(default=5000, ge=1000, le=30000)
    enable_ocr: bool = Field(default=True)
    plate_format: str = Field(default="auto")


class NotificationSettings(BaseModel):
    """Notification settings."""
    email_enabled: bool = Field(default=False)
    email_address: str = Field(default="")
    sms_enabled: bool = Field(default=False)
    sms_number: str = Field(default="")
    webhook_enabled: bool = Field(default=False)
    webhook_url: str = Field(default="")
    notify_on_entry: bool = Field(default=True)
    notify_on_exit: bool = Field(default=False)
    notify_on_denied: bool = Field(default=True)


class SettingsResponse(BaseModel):
    """Complete settings response."""
    system: SystemSettings
    camera: CameraSettings
    alpr: ALPRSettings
    notifications: NotificationSettings


class SettingsUpdate(BaseModel):
    """Settings update request."""
    system: Optional[SystemSettings] = None
    camera: Optional[CameraSettings] = None
    alpr: Optional[ALPRSettings] = None
    notifications: Optional[NotificationSettings] = None
