"""
Vehicle management API endpoints.
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from datetime import datetime

from database.session import get_db
from models.vehicle import Vehicle, VehicleStatus
from schemas.vehicle import (
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse,
    VehicleListResponse
)
from core.dependencies import get_current_user_id


router = APIRouter()


@router.get("/vehicles", response_model=VehicleListResponse)
async def list_vehicles(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: Optional[VehicleStatus] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """
    List all vehicles with pagination and filtering.

    - **page**: Page number (starts at 1)
    - **page_size**: Number of items per page (max 100)
    - **status**: Filter by status (active, suspended, expired)
    - **search**: Search by plate number or owner name
    """
    # Build query
    query = select(Vehicle)

    # Apply filters
    if status:
        query = query.where(Vehicle.status == status)

    if search:
        search_term = f"%{search.upper()}%"
        query = query.where(
            or_(
                Vehicle.plate_number.ilike(search_term),
                Vehicle.owner_name.ilike(search_term)
            )
        )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    result = await db.execute(count_query)
    total = result.scalar_one()

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    query = query.order_by(Vehicle.created_at.desc())

    # Execute query
    result = await db.execute(query)
    vehicles = result.scalars().all()

    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size

    return VehicleListResponse(
        items=[VehicleResponse.from_orm(v) for v in vehicles],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(
    vehicle_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """Get a specific vehicle by ID."""
    query = select(Vehicle).where(Vehicle.id == vehicle_id)
    result = await db.execute(query)
    vehicle = result.scalar_one_or_none()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    return VehicleResponse.from_orm(vehicle)


@router.get("/vehicles/plate/{plate_number}", response_model=VehicleResponse)
async def get_vehicle_by_plate(
    plate_number: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get vehicle by plate number (public endpoint for ALPR service).
    This endpoint is used by the ALPR service to check if a vehicle is registered.
    """
    query = select(Vehicle).where(Vehicle.plate_number == plate_number.upper())
    result = await db.execute(query)
    vehicle = result.scalar_one_or_none()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not registered"
        )

    return VehicleResponse.from_orm(vehicle)


@router.post("/vehicles", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    vehicle_data: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """
    Create a new vehicle registration.

    - **plate_number**: License plate number (will be converted to uppercase)
    - **owner_name**: Owner's full name
    - **vehicle_type**: Type of vehicle (car, motorcycle, truck, etc.)
    """
    # Check if plate number already exists
    query = select(Vehicle).where(Vehicle.plate_number == vehicle_data.plate_number.upper())
    result = await db.execute(query)
    existing_vehicle = result.scalar_one_or_none()

    if existing_vehicle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle with plate number {vehicle_data.plate_number} already exists"
        )

    # Create new vehicle
    vehicle = Vehicle(
        **vehicle_data.dict(),
        status=VehicleStatus.ACTIVE,
        registration_date=datetime.utcnow()
    )

    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)

    return VehicleResponse.from_orm(vehicle)


@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: UUID,
    vehicle_data: VehicleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """Update an existing vehicle."""
    # Get vehicle
    query = select(Vehicle).where(Vehicle.id == vehicle_id)
    result = await db.execute(query)
    vehicle = result.scalar_one_or_none()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    # Update fields
    update_data = vehicle_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vehicle, field, value)

    vehicle.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(vehicle)

    return VehicleResponse.from_orm(vehicle)


@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """Delete a vehicle registration."""
    # Get vehicle
    query = select(Vehicle).where(Vehicle.id == vehicle_id)
    result = await db.execute(query)
    vehicle = result.scalar_one_or_none()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    await db.delete(vehicle)
    await db.commit()


@router.post("/vehicles/{vehicle_id}/suspend", response_model=VehicleResponse)
async def suspend_vehicle(
    vehicle_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """Suspend a vehicle's access."""
    query = select(Vehicle).where(Vehicle.id == vehicle_id)
    result = await db.execute(query)
    vehicle = result.scalar_one_or_none()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    vehicle.status = VehicleStatus.SUSPENDED
    vehicle.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(vehicle)

    return VehicleResponse.from_orm(vehicle)


@router.post("/vehicles/{vehicle_id}/activate", response_model=VehicleResponse)
async def activate_vehicle(
    vehicle_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """Activate a suspended vehicle."""
    query = select(Vehicle).where(Vehicle.id == vehicle_id)
    result = await db.execute(query)
    vehicle = result.scalar_one_or_none()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    vehicle.status = VehicleStatus.ACTIVE
    vehicle.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(vehicle)

    return VehicleResponse.from_orm(vehicle)


@router.get("/vehicles/stats/summary")
async def get_vehicle_stats(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """Get summary statistics for vehicles."""
    # Total vehicles
    total_query = select(func.count()).select_from(Vehicle)
    total_result = await db.execute(total_query)
    total = total_result.scalar_one()

    # Active vehicles
    active_query = select(func.count()).select_from(Vehicle).where(Vehicle.status == VehicleStatus.ACTIVE)
    active_result = await db.execute(active_query)
    active = active_result.scalar_one()

    # Suspended vehicles
    suspended_query = select(func.count()).select_from(Vehicle).where(Vehicle.status == VehicleStatus.SUSPENDED)
    suspended_result = await db.execute(suspended_query)
    suspended = suspended_result.scalar_one()

    # Expired vehicles
    expired_query = select(func.count()).select_from(Vehicle).where(
        Vehicle.expiry_date < datetime.utcnow()
    )
    expired_result = await db.execute(expired_query)
    expired = expired_result.scalar_one()

    return {
        "total": total,
        "active": active,
        "suspended": suspended,
        "expired": expired
    }
