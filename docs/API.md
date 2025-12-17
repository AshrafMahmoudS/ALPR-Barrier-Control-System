# API Documentation

RESTful API documentation for the ALPR Barrier Control System.

## Base URL

```
http://your-server:8000/api/v1
```

## Authentication

Most endpoints require authentication using JWT tokens.

### Login

**POST** `/auth/login`

Request:
```json
{
  "username": "admin",
  "password": "your_password"
}
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

### Using Tokens

Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Vehicles

### List Vehicles

**GET** `/vehicles`

Query Parameters:
- `page` (int): Page number (default: 1)
- `page_size` (int): Items per page (default: 20)
- `status` (string): Filter by status (active, suspended, expired)
- `search` (string): Search by plate number or owner name

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "plate_number": "ABC123",
      "owner_name": "John Doe",
      "owner_contact": "john@example.com",
      "vehicle_type": "car",
      "vehicle_make": "Toyota",
      "vehicle_model": "Camry",
      "vehicle_color": "Blue",
      "registration_date": "2024-01-01T00:00:00Z",
      "expiry_date": null,
      "status": "active",
      "notes": "",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "total_pages": 5
}
```

### Get Vehicle

**GET** `/vehicles/{vehicle_id}`

Response:
```json
{
  "id": "uuid",
  "plate_number": "ABC123",
  ...
}
```

### Create Vehicle

**POST** `/vehicles`

Request:
```json
{
  "plate_number": "ABC123",
  "owner_name": "John Doe",
  "owner_contact": "john@example.com",
  "vehicle_type": "car",
  "vehicle_make": "Toyota",
  "vehicle_model": "Camry",
  "vehicle_color": "Blue",
  "expiry_date": "2025-12-31T23:59:59Z",
  "notes": "VIP parking"
}
```

Response:
```json
{
  "id": "uuid",
  "plate_number": "ABC123",
  ...
}
```

### Update Vehicle

**PUT** `/vehicles/{vehicle_id}`

Request: Same as Create Vehicle

Response: Updated vehicle object

### Delete Vehicle

**DELETE** `/vehicles/{vehicle_id}`

Response:
```json
{
  "message": "Vehicle deleted successfully"
}
```

### Suspend Vehicle

**POST** `/vehicles/{vehicle_id}/suspend`

Response:
```json
{
  "id": "uuid",
  "status": "suspended",
  ...
}
```

### Activate Vehicle

**POST** `/vehicles/{vehicle_id}/activate`

Response:
```json
{
  "id": "uuid",
  "status": "active",
  ...
}
```

## Events

### List Events

**GET** `/events`

Query Parameters:
- `page` (int): Page number
- `page_size` (int): Items per page
- `event_type` (string): entry or exit
- `barrier_action` (string): opened, denied, manual, error
- `date_from` (ISO date): Start date
- `date_to` (ISO date): End date
- `plate_number` (string): Filter by plate
- `camera_id` (string): Filter by camera

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "vehicle_id": "uuid",
      "plate_number": "ABC123",
      "event_type": "entry",
      "timestamp": "2024-01-01T12:00:00Z",
      "camera_id": "entry_camera",
      "confidence_score": 95.5,
      "image_path": "/var/alpr-system/images/2024/01/01/img.jpg",
      "barrier_action": "opened",
      "processing_time_ms": 150,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 500,
  "page": 1,
  "page_size": 20,
  "total_pages": 25
}
```

### Get Event

**GET** `/events/{event_id}`

Response: Single event object

### Get Event Image

**GET** `/events/{event_id}/image`

Response: Image file (JPEG)

## Parking Sessions

### List Active Sessions

**GET** `/sessions/active`

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "vehicle_id": "uuid",
      "entry_event_id": "uuid",
      "entry_time": "2024-01-01T08:00:00Z",
      "parking_lot_id": "A1",
      "status": "active",
      "duration_minutes": null
    }
  ],
  "total": 45
}
```

### Get Session History

**GET** `/sessions/history`

Query Parameters:
- `vehicle_id` (uuid): Filter by vehicle
- `date_from` (ISO date): Start date
- `date_to` (ISO date): End date

Response: Paginated list of completed sessions

## Analytics

### Dashboard Statistics

**GET** `/analytics/dashboard`

Response:
```json
{
  "occupancy": {
    "total_capacity": 100,
    "occupied": 45,
    "available": 55,
    "occupancy_rate": 45.0
  },
  "events": {
    "total_events": 1200,
    "entries": 620,
    "exits": 580,
    "denied": 25,
    "success_rate": 97.9
  },
  "active_sessions": 45,
  "recent_events": [...]
}
```

### Occupancy Trend

**GET** `/analytics/occupancy/trend`

Query Parameters:
- `period` (string): hour, day, week, month
- `date_from` (ISO date)
- `date_to` (ISO date)

Response:
```json
{
  "data": [
    {
      "timestamp": "2024-01-01T08:00:00Z",
      "occupied": 30,
      "available": 70,
      "occupancy_rate": 30.0
    },
    ...
  ]
}
```

### Hourly Traffic

**GET** `/analytics/traffic/hourly`

Query Parameters:
- `date` (ISO date): Specific date (default: today)

Response:
```json
{
  "data": [
    {
      "hour": 8,
      "entries": 25,
      "exits": 5,
      "total": 30
    },
    ...
  ]
}
```

### Peak Hours

**GET** `/analytics/peak-hours`

Query Parameters:
- `period` (string): day, week, month

Response:
```json
{
  "busiest_hours": [
    {"hour": 8, "average_vehicles": 45},
    {"hour": 17, "average_vehicles": 52}
  ],
  "quietest_hours": [
    {"hour": 3, "average_vehicles": 2},
    {"hour": 4, "average_vehicles": 3}
  ]
}
```

### Vehicle Type Distribution

**GET** `/analytics/vehicle-types`

Response:
```json
{
  "data": [
    {
      "vehicle_type": "car",
      "count": 750,
      "percentage": 75.0
    },
    {
      "vehicle_type": "suv",
      "count": 150,
      "percentage": 15.0
    },
    ...
  ]
}
```

### Average Parking Duration

**GET** `/analytics/parking-duration`

Query Parameters:
- `date_from` (ISO date)
- `date_to` (ISO date)

Response:
```json
{
  "average_minutes": 125,
  "median_minutes": 90,
  "min_minutes": 5,
  "max_minutes": 720
}
```

### Export Report

**GET** `/analytics/export`

Query Parameters:
- `report_type` (string): events, sessions, analytics
- `format` (string): csv, xlsx, pdf
- `date_from` (ISO date)
- `date_to` (ISO date)

Response: File download

## System Control

### Barrier Control

**POST** `/system/barrier/open`

Request:
```json
{
  "barrier_id": "entry",
  "duration": 5
}
```

Response:
```json
{
  "message": "Barrier opening",
  "barrier_id": "entry",
  "state": "opening"
}
```

**POST** `/system/barrier/close`

Request:
```json
{
  "barrier_id": "entry"
}
```

Response:
```json
{
  "message": "Barrier closing",
  "barrier_id": "entry",
  "state": "closing"
}
```

### Camera Status

**GET** `/system/cameras/status`

Response:
```json
{
  "cameras": [
    {
      "camera_id": "entry",
      "name": "Entry Camera",
      "is_online": true,
      "frame_count": 15234,
      "error_count": 2,
      "last_frame_time": 1234567890
    },
    ...
  ]
}
```

### System Health

**GET** `/system/health`

Response:
```json
{
  "status": "healthy",
  "components": {
    "database": "ok",
    "redis": "ok",
    "cameras": "ok",
    "barriers": "ok",
    "alpr_service": "ok"
  },
  "uptime_seconds": 86400
}
```

### System Configuration

**GET** `/system/config`

Response: Current system configuration

**PUT** `/system/config`

Request: Configuration updates (admin only)

## WebSocket Events

Connect to WebSocket at: `ws://your-server:8000/ws`

### Subscribe to Events

After connecting, send:
```json
{
  "action": "subscribe",
  "channels": ["events", "occupancy", "camera_status", "barrier_status"]
}
```

### Event Messages

**New Detection Event:**
```json
{
  "type": "event",
  "data": {
    "event": {...}
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Occupancy Update:**
```json
{
  "type": "occupancy",
  "data": {
    "occupied": 46,
    "available": 54,
    "occupancy_rate": 46.0
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Camera Status:**
```json
{
  "type": "camera_status",
  "data": {
    "camera_id": "entry",
    "is_online": true
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Barrier Status:**
```json
{
  "type": "barrier_status",
  "data": {
    "barrier_id": "entry",
    "state": "opening"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message",
  "status_code": 400
}
```

Common status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

- Anonymous: 100 requests/hour
- Authenticated: 1000 requests/hour
- Admin: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```

## Pagination

All list endpoints support pagination:

Parameters:
- `page`: Page number (starts at 1)
- `page_size`: Items per page (max 100)

Response includes:
```json
{
  "items": [...],
  "total": 1000,
  "page": 1,
  "page_size": 20,
  "total_pages": 50
}
```

## Interactive API Documentation

Visit these URLs for interactive API documentation:

- **Swagger UI**: `http://your-server:8000/api/v1/docs`
- **ReDoc**: `http://your-server:8000/api/v1/redoc`
- **OpenAPI JSON**: `http://your-server:8000/api/v1/openapi.json`
