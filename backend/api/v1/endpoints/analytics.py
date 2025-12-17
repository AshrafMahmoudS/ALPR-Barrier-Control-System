"""
Analytics endpoints for statistics and insights.
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case

from database.session import get_db
from models.event import Event, EventType, BarrierAction
from models.vehicle import Vehicle, VehicleType
from schemas.analytics import (
    AnalyticsResponse,
    AnalyticsData,
    AnalyticsStats,
    HourlyData,
    EventTypeData,
    VehicleTypeData,
    DailyStats,
    SuccessRateData,
    ProcessingTimeData
)
from core.dependencies import get_current_user_id


router = APIRouter()


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    date_range: Optional[str] = Query(default="7d", alias="range", regex="^(7d|30d|90d|all)$"),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get comprehensive analytics data.

    Query parameters:
    - range: Predefined date range (7d, 30d, 90d, all)
    - date_from: Custom start date (YYYY-MM-DD)
    - date_to: Custom end date (YYYY-MM-DD)
    """
    # Determine date range
    if date_from and date_to:
        start_date = datetime.fromisoformat(date_from)
        end_date = datetime.fromisoformat(date_to)
    else:
        end_date = datetime.now()
        if date_range == "7d":
            start_date = end_date - timedelta(days=7)
        elif date_range == "30d":
            start_date = end_date - timedelta(days=30)
        elif date_range == "90d":
            start_date = end_date - timedelta(days=90)
        else:  # all
            start_date = datetime(2020, 1, 1)  # Far past date

    # Get all events in range
    events_query = select(Event).where(
        and_(
            Event.timestamp >= start_date,
            Event.timestamp <= end_date
        )
    )
    result = await db.execute(events_query)
    events = result.scalars().all()

    # Calculate hourly traffic
    hourly_traffic = {}
    for event in events:
        hour = event.timestamp.strftime("%H:00")
        if hour not in hourly_traffic:
            hourly_traffic[hour] = {"entries": 0, "exits": 0, "occupancy": 0}

        if event.event_type == EventType.ENTRY and event.barrier_action == BarrierAction.OPENED:
            hourly_traffic[hour]["entries"] += 1
        elif event.event_type == EventType.EXIT and event.barrier_action == BarrierAction.OPENED:
            hourly_traffic[hour]["exits"] += 1

    # Fill in missing hours with zeros
    traffic_by_hour = []
    for i in range(24):
        hour = f"{i:02d}:00"
        data = hourly_traffic.get(hour, {"entries": 0, "exits": 0, "occupancy": 0})
        traffic_by_hour.append(HourlyData(
            hour=hour,
            entries=data["entries"],
            exits=data["exits"],
            occupancy=data.get("occupancy", 0)
        ))

    # Calculate events by type
    event_counts = {}
    for event in events:
        event_type = event.event_type.value
        event_counts[event_type] = event_counts.get(event_type, 0) + 1

    events_by_type = [
        EventTypeData(name=name, value=count)
        for name, count in event_counts.items()
    ]

    # Get vehicle types distribution
    vehicles_query = select(Vehicle)
    vehicles_result = await db.execute(vehicles_query)
    vehicles = vehicles_result.scalars().all()

    vehicle_type_counts = {}
    for vehicle in vehicles:
        vtype = vehicle.vehicle_type.value
        vehicle_type_counts[vtype] = vehicle_type_counts.get(vtype, 0) + 1

    vehicle_types = [
        VehicleTypeData(name=name, value=count)
        for name, count in vehicle_type_counts.items()
    ]

    # Calculate daily stats
    daily_data = {}
    for event in events:
        date = event.timestamp.strftime("%Y-%m-%d")
        if date not in daily_data:
            daily_data[date] = {"total": 0, "entries": 0, "exits": 0, "denied": 0}

        daily_data[date]["total"] += 1

        if event.event_type == EventType.ENTRY:
            if event.barrier_action == BarrierAction.OPENED:
                daily_data[date]["entries"] += 1
            else:
                daily_data[date]["denied"] += 1
        elif event.event_type == EventType.EXIT:
            if event.barrier_action == BarrierAction.OPENED:
                daily_data[date]["exits"] += 1
            else:
                daily_data[date]["denied"] += 1

    daily_stats = [
        DailyStats(
            date=date,
            total=data["total"],
            entries=data["entries"],
            exits=data["exits"],
            denied=data["denied"]
        )
        for date, data in sorted(daily_data.items())
    ]

    # Calculate success rate over time
    success_rate_data = []
    for date, data in sorted(daily_data.items()):
        total = data["total"]
        denied = data["denied"]
        rate = ((total - denied) / total * 100) if total > 0 else 100.0
        success_rate_data.append(SuccessRateData(date=date, rate=round(rate, 2)))

    # Calculate average processing time (mock data for now)
    avg_processing_time_data = [
        ProcessingTimeData(date=date, time=150.0 + (hash(date) % 50))
        for date in sorted(daily_data.keys())
    ]

    # Calculate summary statistics
    total_events = len(events)
    total_entries = sum(1 for e in events if e.event_type == EventType.ENTRY and e.barrier_action == BarrierAction.OPENED)
    total_exits = sum(1 for e in events if e.event_type == EventType.EXIT and e.barrier_action == BarrierAction.OPENED)
    total_denied = sum(1 for e in events if e.barrier_action == BarrierAction.DENIED)

    success_rate = ((total_events - total_denied) / total_events * 100) if total_events > 0 else 100.0

    # Calculate trend (compare last period with previous period)
    mid_date = start_date + (end_date - start_date) / 2
    recent_events = sum(1 for e in events if e.timestamp >= mid_date)
    older_events = total_events - recent_events
    trend_percentage = ((recent_events - older_events) / older_events * 100) if older_events > 0 else 0.0

    return AnalyticsResponse(
        data=AnalyticsData(
            traffic_by_hour=traffic_by_hour,
            events_by_type=events_by_type,
            vehicle_types=vehicle_types,
            daily_stats=daily_stats,
            success_rate=success_rate_data,
            avg_processing_time=avg_processing_time_data
        ),
        stats=AnalyticsStats(
            total_events=total_events,
            total_entries=total_entries,
            total_exits=total_exits,
            total_denied=total_denied,
            success_rate=round(success_rate, 2),
            avg_processing_time=150.0,  # Mock value
            trend_percentage=round(trend_percentage, 2)
        )
    )
