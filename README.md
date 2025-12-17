# ALPR Barrier Control System

A comprehensive Automatic License Plate Recognition (ALPR) system for intelligent parking barrier control with real-time monitoring and analytics.

## System Overview

This system provides an automated parking management solution using dual-camera ALPR technology to control entry/exit barriers, track vehicle flow, and provide comprehensive analytics through a modern web dashboard.

### Key Features

- **Dual Camera ALPR**: Entry and exit point monitoring
- **Automated Barrier Control**: Seamless access for registered vehicles
- **Real-time Analytics**: Live parking statistics and insights
- **Modern Web Dashboard**: Intuitive UI for management and monitoring
- **Vehicle Registration Management**: Easy registration and deregistration
- **Historical Data & Reports**: Comprehensive parking flow analysis
- **Occupancy Tracking**: Real-time available/occupied lot monitoring

## Technology Stack

### Hardware Layer
- **Edge Computing Unit**: Raspberry Pi 4 (4GB+) or Orange Pi 5
- **Cameras**: 2x USB/CSI cameras (1080p minimum)
- **Barrier Controller**: GPIO-controlled relay module
- **Network**: Ethernet/WiFi connectivity

### Software Stack
- **ALPR Engine**: OpenALPR (free, open-source)
- **Backend**: Python FastAPI
- **Database**: PostgreSQL + Redis (caching)
- **Frontend**: React.js + TypeScript + Tailwind CSS
- **Real-time Communication**: WebSocket (Socket.IO)
- **Container Orchestration**: Docker + Docker Compose

## Quick Start

```bash
# Clone repository
git clone <repository-url>
cd ALPR_System_for_barriers

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start with Docker Compose
docker-compose up -d

# Access dashboard
# http://localhost:3000
```

## Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [Hardware Setup Guide](docs/HARDWARE_SETUP.md)
- [Software Installation](docs/INSTALLATION.md)
- [API Documentation](docs/API.md)
- [Dashboard User Guide](docs/USER_GUIDE.md)
- [Development Guide](docs/DEVELOPMENT.md)

## Project Structure

```
ALPR_System_for_barriers/
├── backend/                 # FastAPI backend service
├── frontend/               # React dashboard application
├── alpr-service/           # ALPR engine service
├── hardware-controller/    # GPIO and hardware interface
├── docs/                   # Comprehensive documentation
├── docker/                 # Docker configurations
└── scripts/                # Utility scripts
```

## System Requirements

### Minimum Hardware
- Raspberry Pi 4 (4GB RAM) or Orange Pi 5
- 2x USB Cameras (1080p, 30fps)
- 32GB+ microSD card (Class 10)
- Relay module for barrier control
- Stable power supply (5V 3A+)

### Network Requirements
- Static IP configuration recommended
- Internet access for initial setup
- Local network access for dashboard

## License

MIT License - See [LICENSE](LICENSE) file for details

## Support

For issues and questions, please refer to the [documentation](docs/) or create an issue in the repository.
