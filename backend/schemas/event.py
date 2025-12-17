"""
Pydantic schemas for event endpoints.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from models.event import EventType, BarrierAction


class EventCreate(BaseModel):
    """Schema for creating an event."""
    plate_number: str
    event_type: EventType
    camera_id: str
    confidence_score: float = Field(..., ge=0, le=100)
    image_path: Optional[str] = None
    barrier_action: BarrierAction
    processing_time_ms: Optional[int] = None


class EventResponse(BaseModel):
    """Schema for event response."""
    id: str
    vehicle_id: Optional[str]
    plate_number: str
    event_type: EventType
    timestamp: datetime
    camera_id: str
    confidence_score: float
    image_path: Optional[str]
    barrier_action: BarrierAction
    processing_time_ms: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class EventListResponse(BaseModel):
    """Schema for paginated event list."""
    items: list[EventResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ParkingSessionResponse(BaseModel):
    """Schema for parking session response."""
    id: str
    vehicle_id: str
    entry_event_id: str
    exit_event_id: Optional[str]
    entry_time: datetime
    exit_time: Optional[datetime]
    duration_minutes: Optional[int]
    parking_lot_id: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
