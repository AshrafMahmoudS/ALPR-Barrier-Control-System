# Development Guide

Guide for developers contributing to or extending the ALPR Barrier Control System.

## Development Environment Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Git
- Docker (optional)

### Local Development Setup

```bash
# Clone repository
git clone <repository-url>
cd ALPR_System_for_barriers

# Create environment file
cp .env.example .env
# Edit .env with local settings

# Set up pre-commit hooks (optional)
pip install pre-commit
pre-commit install
```

### Backend Development

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies (including dev dependencies)
pip install -r requirements.txt

# Install development tools
pip install black flake8 mypy pytest-cov

# Run database migrations
alembic upgrade head

# Run development server with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
# Server runs on http://localhost:3000

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### ALPR Service Development

```bash
cd alpr-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run in development mode
python src/main.py
```

## Project Structure Deep Dive

### Backend Architecture

```
backend/
├── api/
│   └── v1/
│       ├── endpoints/          # API route handlers
│       │   ├── vehicles.py     # Vehicle management
│       │   ├── events.py       # Event tracking
│       │   ├── analytics.py    # Statistics
│       │   ├── auth.py         # Authentication
│       │   └── system.py       # System control
│       └── websocket/          # Real-time communication
│           └── realtime.py
├── core/                       # Core functionality
│   ├── config.py              # Configuration management
│   ├── security.py            # Auth & security
│   └── dependencies.py        # DI container
├── models/                     # SQLAlchemy models
│   ├── vehicle.py
│   ├── event.py
│   └── user.py
├── schemas/                    # Pydantic schemas
│   ├── vehicle.py             # Request/response schemas
│   ├── event.py
│   └── analytics.py
├── services/                   # Business logic
│   ├── alpr_service.py        # ALPR integration
│   ├── barrier_service.py     # Barrier control
│   ├── analytics_service.py   # Data analysis
│   └── notification_service.py
├── database/                   # Database management
│   ├── session.py             # Connection handling
│   └── migrations/            # Alembic migrations
└── tests/                     # Unit & integration tests
```

### Frontend Architecture

```
frontend/src/
├── components/
│   ├── common/                # Reusable components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Table.tsx
│   ├── dashboard/             # Dashboard-specific
│   │   ├── OccupancyCard.tsx
│   │   ├── RecentEvents.tsx
│   │   └── LiveStats.tsx
│   ├── vehicles/              # Vehicle management
│   │   ├── VehicleList.tsx
│   │   ├── VehicleForm.tsx
│   │   └── VehicleDetails.tsx
│   ├── analytics/             # Analytics & reports
│   │   ├── Charts.tsx
│   │   ├── Reports.tsx
│   │   └── ExportButton.tsx
│   └── layouts/               # Layout components
│       ├── DashboardLayout.tsx
│       └── Sidebar.tsx
├── hooks/                     # Custom React hooks
│   ├── useVehicles.ts
│   ├── useEvents.ts
│   ├── useWebSocket.ts
│   └── useAuth.ts
├── services/                  # API service layer
│   ├── api.ts                # Axios instance
│   ├── vehicles.ts           # Vehicle API
│   ├── events.ts             # Events API
│   └── auth.ts               # Auth API
├── contexts/                  # React contexts
│   ├── AuthContext.tsx
│   └── WebSocketContext.tsx
├── utils/                     # Utility functions
│   ├── date.ts
│   ├── format.ts
│   └── validation.ts
├── types/                     # TypeScript types
│   └── index.ts
├── App.tsx                    # Root component
└── main.tsx                   # Entry point
```

## Coding Standards

### Python (Backend)

```python
# Follow PEP 8 style guide
# Use type hints
def create_vehicle(
    db: Session,
    vehicle_data: VehicleCreate
) -> Vehicle:
    """
    Create a new vehicle in the database.

    Args:
        db: Database session
        vehicle_data: Vehicle creation data

    Returns:
        Created vehicle instance
    """
    vehicle = Vehicle(**vehicle_data.dict())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

# Use meaningful variable names
# Write docstrings for all functions/classes
# Keep functions small and focused
# Use async/await for I/O operations
```

### TypeScript (Frontend)

```typescript
// Use functional components with hooks
// Type all props and state
interface VehicleCardProps {
  vehicle: Vehicle
  onEdit?: (vehicle: Vehicle) => void
  onDelete?: (id: string) => void
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onEdit,
  onDelete,
}) => {
  // Component logic
  return (
    // JSX
  )
}

// Use meaningful component names
// Extract reusable logic into custom hooks
// Keep components small and focused
```

### Code Formatting

```bash
# Python (Black)
black backend/

# TypeScript (Prettier)
npm run format

# Run before committing
```

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_vehicles.py

# Run specific test
pytest tests/test_vehicles.py::test_create_vehicle
```

Example test:
```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_vehicle():
    """Test vehicle creation endpoint."""
    response = client.post(
        "/api/v1/vehicles",
        json={
            "plate_number": "TEST123",
            "owner_name": "Test User",
            "vehicle_type": "car"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["plate_number"] == "TEST123"
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Database Migrations

### Creating Migrations

```bash
cd backend

# Auto-generate migration from model changes
alembic revision --autogenerate -m "Add vehicle color field"

# Create empty migration
alembic revision -m "Custom migration"

# Edit migration file in database/migrations/versions/
```

### Running Migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history

# View current version
alembic current
```

## API Development

### Adding New Endpoint

1. **Create schema** (backend/schemas/):
```python
from pydantic import BaseModel

class ItemCreate(BaseModel):
    name: str
    description: str

class ItemResponse(BaseModel):
    id: str
    name: str
    description: str
    created_at: datetime
```

2. **Create model** (backend/models/):
```python
from sqlalchemy import Column, String
from database.session import Base

class Item(Base):
    __tablename__ = "items"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String)
```

3. **Create endpoint** (backend/api/v1/endpoints/):
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/items", response_model=ItemResponse)
async def create_item(
    item: ItemCreate,
    db: Session = Depends(get_db)
):
    # Implementation
    pass
```

4. **Register router** (backend/main.py):
```python
from api.v1.endpoints import items
app.include_router(items.router, prefix="/api/v1", tags=["Items"])
```

## Frontend Development Patterns

### Custom Hooks

```typescript
// hooks/useVehicles.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehicleApi } from '@/services/vehicles'

export const useVehicles = () => {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehicleApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: vehicleApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })

  return {
    vehicles: data?.items || [],
    isLoading,
    createVehicle: createMutation.mutate,
  }
}
```

### State Management

```typescript
// Using Zustand for global state
import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({
    sidebarOpen: !state.sidebarOpen
  })),
}))
```

## WebSocket Development

### Backend WebSocket Handler

```python
from fastapi import WebSocket
import json

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Process message
            await websocket.send_text(json.dumps({
                "type": "response",
                "data": "..."
            }))
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()
```

### Frontend WebSocket Hook

```typescript
import { useEffect, useState } from 'react'
import io from 'socket.io-client'

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null)
  const [events, setEvents] = useState([])

  useEffect(() => {
    const newSocket = io('ws://localhost:8000')

    newSocket.on('event', (data) => {
      setEvents((prev) => [...prev, data])
    })

    setSocket(newSocket)
    return () => newSocket.close()
  }, [])

  return { socket, events }
}
```

## Debugging

### Backend Debugging

```python
# Use logging
import logging
logger = logging.getLogger(__name__)

logger.debug("Debug message")
logger.info("Info message")
logger.error("Error message")

# Use pdb for interactive debugging
import pdb; pdb.set_trace()

# Or use breakpoint() in Python 3.7+
breakpoint()
```

### Frontend Debugging

```typescript
// Use console methods
console.log('Debug:', data)
console.error('Error:', error)
console.table(array)

// React DevTools
// Install browser extension for component inspection

// Redux DevTools (if using Redux)
// Install extension for state inspection
```

## Performance Optimization

### Backend

- Use database indexes on frequently queried fields
- Implement caching with Redis
- Use async/await for I/O operations
- Optimize database queries (use joins, avoid N+1)
- Implement pagination for large datasets
- Use connection pooling

### Frontend

- Lazy load routes and components
- Optimize images and assets
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Use proper React keys
- Minimize re-renders with useMemo/useCallback

## Deployment

### Building for Production

```bash
# Backend
cd backend
pip install -r requirements.txt
# No build step needed

# Frontend
cd frontend
npm run build
# Output in dist/
```

### Docker Deployment

```bash
# Build images
docker-compose build

# Run services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=3
```

## Contributing

### Workflow

1. Create feature branch from `develop`
2. Make changes following coding standards
3. Write tests for new features
4. Run tests and linting
5. Commit with meaningful messages
6. Push and create pull request
7. Address code review feedback
8. Merge after approval

### Commit Messages

Follow conventional commits:
```
feat: add vehicle color filter
fix: resolve camera reconnection issue
docs: update API documentation
test: add tests for barrier controller
refactor: simplify ALPR detection logic
```

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [OpenALPR Documentation](http://doc.openalpr.com/)
- [Raspberry Pi GPIO](https://gpiozero.readthedocs.io/)
