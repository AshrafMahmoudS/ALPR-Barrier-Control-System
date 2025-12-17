"""
Pydantic schemas for analytics endpoints.
"""
from typing import List
from pydantic import BaseModel


class HourlyData(BaseModel):
    """Hourly traffic data."""
    hour: str
    entries: int
    exits: int
    occupancy: int


class EventTypeData(BaseModel):
    """Event type distribution."""
    name: str
    value: int


class VehicleTypeData(BaseModel):
    """Vehicle type distribution."""
    name: str
    value: int


class DailyStats(BaseModel):
    """Daily statistics."""
    date: str
    total: int
    entries: int
    exits: int
    denied: int


class SuccessRateData(BaseModel):
    """Success rate over time."""
    date: str
    rate: float


class ProcessingTimeData(BaseModel):
    """Processing time over time."""
    date: str
    time: float


class AnalyticsData(BaseModel):
    """Analytics data container."""
    traffic_by_hour: List[HourlyData]
    events_by_type: List[EventTypeData]
    vehicle_types: List[VehicleTypeData]
    daily_stats: List[DailyStats]
    success_rate: List[SuccessRateData]
    avg_processing_time: List[ProcessingTimeData]


class AnalyticsStats(BaseModel):
    """Summary statistics."""
    total_events: int
    total_entries: int
    total_exits: int
    total_denied: int
    success_rate: float
    avg_processing_time: float
    trend_percentage: float


class AnalyticsResponse(BaseModel):
    """Complete analytics response."""
    data: AnalyticsData
    stats: AnalyticsStats
