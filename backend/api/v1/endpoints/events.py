"""
Event tracking API endpoints.
"""
from typing import Optional
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from database.session import get_db
from models.event import Event, EventType, BarrierAction, ParkingSession
from models.vehicle import Vehicle
from schemas.event import EventCreate, EventResponse, EventListResponse, ParkingSessionResponse
from core.dependencies import get_current_user_id


router = APIRouter()


@router.get("/events", response_model=EventListResponse)
async def list_events(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    event_type: Optional[EventType] = None,
    barrier_action: Optional[BarrierAction] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    plate_number: Optional[str] = None,
    camera_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """
    List all events with pagination and filtering.
    """
    # Build query
    query = select(Event)

    # Apply filters
    filters = []
    if event_type:
        filters.append(Event.event_type == event_type)
    if barrier_action:
        filters.append(Event.barrier_action == barrier_action)
    if date_from:
        filters.append(Event.timestamp >= date_from)
    if date_to:
        filters.append(Event.timestamp <= date_to)
    if plate_number:
        filters.append(Event.plate_number == plate_number.upper())
    if camera_id:
        filters.append(Event.camera_id == camera_id)

    if filters:
        query = query.where(and_(*filters))

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    result = await db.execute(count_query)
    total = result.scalar_one()

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    query = query.order_by(Event.timestamp.desc())

    # Execute query
    result = await db.execute(query)
    events = result.scalars().all()

    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size

    return EventListResponse(
        items=[EventResponse.from_orm(e) for e in events],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """Get a specific event by ID."""
    query = select(Event).where(Event.id == event_id)
    result = await db.execute(query)
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    return EventResponse.from_orm(event)


@router.post("/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new event (called by ALPR service).
    This endpoint is used by the ALPR service to log detection events.
    """
    # Try to find matching vehicle
    vehicle_query = select(Vehicle).where(Vehicle.plate_number == event_data.plate_number.upper())
    vehicle_result = await db.execute(vehicle_query)
    vehicle = vehicle_result.scalar_one_or_none()

    # Create event
    event = Event(
        vehicle_id=vehicle.id if vehicle else None,
        plate_number=event_data.plate_number.upper(),
        event_type=event_data.event_type,
        timestamp=datetime.utcnow(),
        camera_id=event_data.camera_id,
        confidence_score=event_data.confidence_score,
        image_path=event_data.image_path,
        barrier_action=event_data.barrier_action,
        processing_time_ms=event_data.processing_time_ms
    )

    db.add(event)
    await db.commit()
    await db.refresh(event)

    # Handle parking session logic
    if vehicle and event_data.barrier_action == BarrierAction.OPENED:
        if event_data.event_type == EventType.ENTRY:
            # Create new parking session
            session = ParkingSession(
                vehicle_id=vehicle.id,
                entry_event_id=event.id,
                entry_time=event.timestamp,
                status="active"
            )
            db.add(session)
        elif event_data.event_type == EventType.EXIT:
            # Find and close active session
            session_query = select(ParkingSession).where(
                and_(
                    ParkingSession.vehicle_id == vehicle.id,
                    ParkingSession.status == "active"
                )
            ).order_by(ParkingSession.entry_time.desc())

            session_result = await db.execute(session_query)
            session = session_result.scalar_one_or_none()

            if session:
                session.exit_event_id = event.id
                session.exit_time = event.timestamp
                session.calculate_duration()
                session.status = "completed"

        await db.commit()

    return EventResponse.from_orm(event)


@router.get("/events/recent")
async def get_recent_events(
    limit: int = Query(default=10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """Get most recent events."""
    query = select(Event).order_by(Event.timestamp.desc()).limit(limit)
    result = await db.execute(query)
    events = result.scalars().all()

    return [EventResponse.from_orm(e) for e in events]


@router.get("/sessions/active", response_model=list[ParkingSessionResponse])
async def get_active_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """Get all active parking sessions."""
    query = select(ParkingSession).where(ParkingSession.status == "active")
    query = query.order_by(ParkingSession.entry_time.desc())

    result = await db.execute(query)
    sessions = result.scalars().all()

    return [ParkingSessionResponse.from_orm(s) for s in sessions]


@router.get("/sessions/history", response_model=list[ParkingSessionResponse])
async def get_session_history(
    vehicle_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """Get parking session history."""
    query = select(ParkingSession).where(ParkingSession.status == "completed")

    # Apply filters
    if vehicle_id:
        query = query.where(ParkingSession.vehicle_id == vehicle_id)
    if date_from:
        query = query.where(ParkingSession.entry_time >= date_from)
    if date_to:
        query = query.where(ParkingSession.exit_time <= date_to)

    query = query.order_by(ParkingSession.entry_time.desc()).limit(limit)

    result = await db.execute(query)
    sessions = result.scalars().all()

    return [ParkingSessionResponse.from_orm(s) for s in sessions]


@router.get("/events/stats/today")
async def get_today_stats(
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(get_current_user_id)
):
    """Get event statistics for today."""
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # Total events today
    total_query = select(func.count()).select_from(Event).where(Event.timestamp >= today_start)
    total_result = await db.execute(total_query)
    total = total_result.scalar_one()

    # Entries today
    entries_query = select(func.count()).select_from(Event).where(
        and_(Event.timestamp >= today_start, Event.event_type == EventType.ENTRY)
    )
    entries_result = await db.execute(entries_query)
    entries = entries_result.scalar_one()

    # Exits today
    exits_query = select(func.count()).select_from(Event).where(
        and_(Event.timestamp >= today_start, Event.event_type == EventType.EXIT)
    )
    exits_result = await db.execute(exits_query)
    exits = exits_result.scalar_one()

    # Denied today
    denied_query = select(func.count()).select_from(Event).where(
        and_(Event.timestamp >= today_start, Event.barrier_action == BarrierAction.DENIED)
    )
    denied_result = await db.execute(denied_query)
    denied = denied_result.scalar_one()

    # Success rate
    success_rate = ((total - denied) / total * 100) if total > 0 else 0

    return {
        "total": total,
        "entries": entries,
        "exits": exits,
        "denied": denied,
        "success_rate": round(success_rate, 2)
    }
