# System Architecture

## Overview

The ALPR Barrier Control System follows a microservices architecture with clear separation of concerns, enabling scalability, maintainability, and fault tolerance.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │           React Dashboard (Port 3000)                     │ │
│  │  - Vehicle Registration Management                        │ │
│  │  - Real-time Monitoring                                   │ │
│  │  - Analytics & Reports                                    │ │
│  │  - System Configuration                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │         FastAPI Backend (Port 8000)                       │ │
│  │  - RESTful API endpoints                                  │ │
│  │  - WebSocket server                                       │ │
│  │  - Authentication & Authorization                         │ │
│  │  - Business logic orchestration                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                              │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────────────┐   │
│  │   ALPR Service       │  │  Hardware Controller Service │   │
│  │  - Camera management │  │  - Barrier control (GPIO)    │   │
│  │  - Plate detection   │  │  - Sensor monitoring         │   │
│  │  - Image processing  │  │  - Status reporting          │   │
│  │  - OpenALPR engine   │  │  - Error handling            │   │
│  └──────────────────────┘  └──────────────────────────────┘   │
│           ↕                           ↕                         │
│  ┌──────────────────────┐  ┌──────────────────────────────┐   │
│  │  Entry Camera        │  │  Exit Camera                 │   │
│  │  (USB/CSI)           │  │  (USB/CSI)                   │   │
│  └──────────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────────────┐   │
│  │  PostgreSQL          │  │  Redis Cache                 │   │
│  │  - Vehicle registry  │  │  - Session data              │   │
│  │  - Event logs        │  │  - Real-time counters        │   │
│  │  - Analytics data    │  │  - Rate limiting             │   │
│  │  - User accounts     │  │  - Queue management          │   │
│  └──────────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Frontend Layer (React Dashboard)

**Technology**: React 18 + TypeScript + Tailwind CSS + Vite

**Key Modules**:
- **Authentication Module**: Login, session management
- **Vehicle Management**: CRUD operations for registered vehicles
- **Live Monitor**: Real-time camera feeds and event stream
- **Analytics Dashboard**: Charts, graphs, and statistics
- **Reports Module**: Historical data and export functionality
- **Settings**: System configuration and user preferences

**Design Patterns**:
- Component-based architecture
- Custom hooks for business logic
- Context API for state management
- React Query for server state
- Lazy loading for performance

### 2. Backend API Layer (FastAPI)

**Technology**: Python 3.11+ FastAPI + SQLAlchemy + Pydantic

**Key Modules**:

```
backend/
├── api/
│   ├── v1/
│   │   ├── endpoints/
│   │   │   ├── vehicles.py      # Vehicle CRUD operations
│   │   │   ├── events.py        # Check-in/out events
│   │   │   ├── analytics.py     # Statistics and reports
│   │   │   ├── auth.py          # Authentication
│   │   │   └── system.py        # System control
│   │   └── websocket/
│   │       └── realtime.py      # WebSocket handlers
├── core/
│   ├── config.py                # Configuration management
│   ├── security.py              # JWT, password hashing
│   └── dependencies.py          # Dependency injection
├── models/
│   ├── vehicle.py               # Vehicle database model
│   ├── event.py                 # Event logging model
│   └── user.py                  # User management model
├── schemas/
│   ├── vehicle.py               # Pydantic schemas
│   ├── event.py
│   └── analytics.py
├── services/
│   ├── alpr_service.py          # ALPR integration
│   ├── barrier_service.py       # Barrier control
│   ├── analytics_service.py     # Data analysis
│   └── notification_service.py  # Alerts and notifications
└── database/
    ├── session.py               # Database connection
    └── migrations/              # Alembic migrations
```

**Design Patterns**:
- Repository pattern for data access
- Service layer for business logic
- Dependency injection
- Async/await for I/O operations

### 3. ALPR Service

**Technology**: Python + OpenALPR + OpenCV

**Responsibilities**:
- Camera stream management
- Frame capture and preprocessing
- License plate detection and recognition
- Result validation and filtering
- Performance optimization

**Processing Pipeline**:
```
Camera Stream → Frame Capture → Preprocessing →
ALPR Detection → Validation → Result Publishing
```

**Key Features**:
- Multi-threaded camera handling
- Frame buffering and queue management
- Confidence threshold filtering
- Country-specific plate recognition
- Error recovery and logging

### 4. Hardware Controller Service

**Technology**: Python + RPi.GPIO/GPIO Zero

**Responsibilities**:
- GPIO pin management
- Barrier motor control (relay)
- Sensor input reading
- Status monitoring
- Safety interlocks

**Control Flow**:
```
API Command → Safety Check → GPIO Activation →
Position Monitoring → Status Update → Confirmation
```

### 5. Database Layer

**PostgreSQL Schema**:

```sql
-- Vehicles table
vehicles
├── id (UUID, PK)
├── plate_number (VARCHAR, UNIQUE, INDEXED)
├── owner_name (VARCHAR)
├── owner_contact (VARCHAR)
├── vehicle_type (ENUM)
├── registration_date (TIMESTAMP)
├── expiry_date (TIMESTAMP)
├── status (ENUM: active, suspended, expired)
├── notes (TEXT)
└── created_at, updated_at

-- Events table
events
├── id (UUID, PK)
├── vehicle_id (UUID, FK)
├── plate_number (VARCHAR, INDEXED)
├── event_type (ENUM: entry, exit)
├── timestamp (TIMESTAMP, INDEXED)
├── camera_id (VARCHAR)
├── confidence_score (FLOAT)
├── image_path (VARCHAR)
├── barrier_action (ENUM: opened, denied)
└── processing_time_ms (INTEGER)

-- Parking sessions table
parking_sessions
├── id (UUID, PK)
├── vehicle_id (UUID, FK)
├── entry_event_id (UUID, FK)
├── exit_event_id (UUID, FK, NULL)
├── entry_time (TIMESTAMP)
├── exit_time (TIMESTAMP, NULL)
├── duration_minutes (INTEGER, NULL)
├── parking_lot_id (VARCHAR)
└── status (ENUM: active, completed)

-- Users table
users
├── id (UUID, PK)
├── username (VARCHAR, UNIQUE)
├── email (VARCHAR, UNIQUE)
├── hashed_password (VARCHAR)
├── role (ENUM: admin, operator, viewer)
├── is_active (BOOLEAN)
└── created_at, updated_at

-- System logs table
system_logs
├── id (UUID, PK)
├── timestamp (TIMESTAMP)
├── level (ENUM: info, warning, error, critical)
├── component (VARCHAR)
├── message (TEXT)
└── metadata (JSONB)
```

**Redis Schema**:
```
# Real-time counters
parking:occupied:count          → INTEGER
parking:available:count         → INTEGER
parking:total_capacity          → INTEGER

# Active sessions (sorted set by entry time)
parking:active_sessions         → ZSET

# Camera status
camera:entry:status             → HASH
camera:exit:status              → HASH

# Rate limiting
ratelimit:api:{user_id}         → STRING (with TTL)

# Recent events (list)
events:recent                   → LIST (last 100)
```

## Communication Patterns

### Synchronous Communication
- **REST API**: Frontend ↔ Backend
- **HTTP Requests**: Backend ↔ Services

### Asynchronous Communication
- **WebSocket**: Real-time updates to dashboard
- **Event Queue**: ALPR detection → Backend processing
- **Message Queue**: Barrier commands (future: MQTT/RabbitMQ)

## Data Flow

### Entry Flow (Vehicle Detection)
```
1. Entry camera captures frame
2. ALPR service detects plate number
3. Service publishes detection event
4. Backend receives event
5. Backend queries database for vehicle
6. If registered:
   a. Create check-in event
   b. Send barrier open command
   c. Update parking occupancy
   d. Broadcast WebSocket update
7. If not registered:
   a. Log denied entry
   b. Send notification
```

### Exit Flow
```
1. Exit camera detects plate
2. Backend finds active parking session
3. Calculate parking duration
4. Update session as completed
5. Open exit barrier
6. Update occupancy count
7. Broadcast real-time update
```

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **Role-Based Access Control (RBAC)**: Admin, Operator, Viewer
- **API Key**: Service-to-service authentication
- **Rate Limiting**: Protection against abuse

### Data Security
- **Password Hashing**: bcrypt/Argon2
- **HTTPS/TLS**: Encrypted communication
- **Input Validation**: Pydantic schemas
- **SQL Injection Prevention**: ORM (SQLAlchemy)
- **CORS Configuration**: Restricted origins

### Physical Security
- **GPIO Pin Protection**: Software interlocks
- **Camera Access Control**: Authenticated streams
- **Barrier Safety**: Timeout and reversal logic

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Load balancer support
- Redis for shared state

### Performance Optimization
- Database indexing on frequently queried fields
- Redis caching for hot data
- Async I/O for camera operations
- Connection pooling for database

### Monitoring & Observability
- Structured logging (JSON format)
- Health check endpoints
- Performance metrics (Prometheus-ready)
- Error tracking and alerting

## Deployment Architecture

### Development Environment
```
Local Machine
├── Docker Compose
│   ├── PostgreSQL container
│   ├── Redis container
│   ├── Backend container
│   ├── Frontend container (dev server)
│   └── ALPR service container
```

### Production Environment (Raspberry Pi/Orange Pi)
```
Edge Device
├── System Services
│   ├── PostgreSQL (native or Docker)
│   ├── Redis (native or Docker)
│   ├── Nginx (reverse proxy)
│   └── Systemd services for Python apps
```

## Fault Tolerance

### Error Handling
- Graceful degradation when cameras fail
- Automatic service restart on crash
- Database connection retry logic
- Manual override for barrier control

### Data Persistence
- Regular database backups
- Event log retention policy
- Image archival strategy

## Future Enhancements

- Mobile application (React Native)
- Multi-site management
- Cloud synchronization
- Advanced analytics (ML-based predictions)
- Integration with payment systems
- License plate recognition improvements (ML models)
- Multi-language support
