"""
Pydantic schemas for vehicle endpoints.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, validator, field_serializer
from models.vehicle import VehicleType, VehicleStatus


class VehicleBase(BaseModel):
    """Base vehicle schema with common fields."""
    plate_number: str = Field(..., min_length=1, max_length=20)
    owner_name: str = Field(..., min_length=1, max_length=255)
    owner_contact: Optional[str] = Field(None, max_length=100)
    vehicle_type: VehicleType
    vehicle_make: Optional[str] = Field(None, max_length=100)
    vehicle_model: Optional[str] = Field(None, max_length=100)
    vehicle_color: Optional[str] = Field(None, max_length=50)
    expiry_date: Optional[datetime] = None
    notes: Optional[str] = None

    @validator('plate_number')
    def plate_number_uppercase(cls, v):
        """Convert plate number to uppercase."""
        return v.upper().strip()


class VehicleCreate(VehicleBase):
    """Schema for creating a new vehicle."""
    pass


class VehicleUpdate(BaseModel):
    """Schema for updating a vehicle."""
    owner_name: Optional[str] = Field(None, min_length=1, max_length=255)
    owner_contact: Optional[str] = Field(None, max_length=100)
    vehicle_type: Optional[VehicleType] = None
    vehicle_make: Optional[str] = Field(None, max_length=100)
    vehicle_model: Optional[str] = Field(None, max_length=100)
    vehicle_color: Optional[str] = Field(None, max_length=50)
    expiry_date: Optional[datetime] = None
    status: Optional[VehicleStatus] = None
    notes: Optional[str] = None


class VehicleResponse(VehicleBase):
    """Schema for vehicle response."""
    id: UUID
    registration_date: datetime
    status: VehicleStatus
    created_at: datetime
    updated_at: datetime

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        """Serialize UUID to string."""
        return str(value)

    class Config:
        from_attributes = True


class VehicleListResponse(BaseModel):
    """Schema for paginated vehicle list."""
    items: list[VehicleResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class VehicleSearchParams(BaseModel):
    """Schema for vehicle search parameters."""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    status: Optional[VehicleStatus] = None
    vehicle_type: Optional[VehicleType] = None
    search: Optional[str] = None
