# Getting Started with ALPR Barrier Control System

Welcome! This guide will help you get up and running with the ALPR Barrier Control System quickly.

## What You'll Need

### Hardware
- Raspberry Pi 4 (4GB+) or Orange Pi 5
- 2x USB Cameras (1080p)
- Relay module for barrier control
- microSD card (32GB+)
- Basic barrier mechanism (can be simulated initially)

### Software Knowledge
- Basic Linux commands
- Understanding of terminal/SSH
- Basic Python and JavaScript (for customization)

## Quick Start (3 Options)

### Option 1: Docker (Easiest)

If you have Docker installed:

```bash
# Clone or navigate to project
cd ALPR_System_for_barriers

# Copy environment template
cp .env.example .env

# Edit configuration (use nano, vim, or any editor)
nano .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access dashboard
# Open browser: http://localhost:3000
```

### Option 2: Automated Setup Script

```bash
# Run setup script
cd ALPR_System_for_barriers
chmod +x scripts/setup/initial_setup.sh
./scripts/setup/initial_setup.sh

# Follow the on-screen instructions
# Script will check dependencies and set up everything
```

### Option 3: Manual Installation

Follow detailed instructions in [docs/INSTALLATION.md](docs/INSTALLATION.md)

## First Time Configuration

### 1. Environment Variables

Edit the `.env` file:

```bash
nano .env
```

Key settings to configure:

```ini
# Database
POSTGRES_PASSWORD=your_secure_password

# Camera IDs (check with: ls /dev/video*)
ENTRY_CAMERA_ID=0
EXIT_CAMERA_ID=1

# GPIO Pins (if using hardware)
BARRIER_ENTRY_PIN=17
BARRIER_EXIT_PIN=27

# Parking Capacity
TOTAL_PARKING_CAPACITY=100

# Security
SECRET_KEY=generate_random_key_here
```

### 2. Database Setup

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE alpr_system;
CREATE USER alpr_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE alpr_system TO alpr_admin;
\q
```

### 3. Start Services

#### Using Docker:
```bash
docker-compose up -d
```

#### Manual:
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - ALPR Service
cd alpr-service
source venv/bin/activate
python src/main.py

# Terminal 4 - Hardware Controller (if using real hardware)
cd hardware-controller
source venv/bin/activate
python src/main.py
```

## Testing the System

### 1. Access Dashboard

Open browser and go to:
```
http://localhost:3000
```

Default credentials (change immediately):
- Username: `admin`
- Password: `admin`

### 2. Register Test Vehicle

1. Navigate to "Vehicles" page
2. Click "Add Vehicle"
3. Fill in details:
   - Plate Number: TEST123
   - Owner Name: Test User
   - Vehicle Type: Car
4. Save

### 3. Test Camera Detection

1. Navigate to "Dashboard"
2. Check "Camera Status" card
3. Cameras should show as "Online"

### 4. Test Barrier Control (Optional)

1. Navigate to "System" page
2. Use manual barrier control
3. Watch for state changes

## Understanding the Dashboard

### Dashboard Page
- **Live Statistics**: Current occupancy, events today
- **Recent Events**: Latest vehicle detections
- **Camera Status**: Entry/exit camera health
- **Quick Actions**: Manual controls

### Vehicles Page
- **Vehicle List**: All registered vehicles
- **Add/Edit/Delete**: Manage registrations
- **Search & Filter**: Find vehicles quickly
- **Bulk Import**: CSV upload for many vehicles

### Events Page
- **Event History**: All detection events
- **Filters**: By type, date, camera
- **Images**: View captured plates
- **Export**: Download event data

### Analytics Page
- **Occupancy Trends**: Usage over time
- **Peak Hours**: Busiest times
- **Vehicle Types**: Distribution charts
- **Reports**: Generate and export

### Settings Page
- **System Configuration**: Adjust parameters
- **User Management**: Add/remove users
- **Camera Settings**: Configure cameras
- **Barrier Control**: Set durations

## Common Tasks

### Adding Multiple Vehicles

```bash
# Create CSV file: vehicles.csv
plate_number,owner_name,vehicle_type
ABC123,John Doe,car
XYZ789,Jane Smith,suv

# Import via dashboard or API
curl -X POST http://localhost:8000/api/v1/vehicles/bulk-import \
  -F "file=@vehicles.csv" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Viewing Logs

```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f alpr-service

# System service logs
sudo journalctl -u alpr-backend -f
sudo journalctl -u alpr-service -f
```

### Backing Up Database

```bash
# Create backup
pg_dump -h localhost -U alpr_admin alpr_system > backup.sql

# Restore backup
psql -h localhost -U alpr_admin alpr_system < backup.sql
```

### Updating Configuration

```bash
# Edit .env
nano .env

# Restart services
docker-compose restart

# Or for manual installation
sudo systemctl restart alpr-backend
sudo systemctl restart alpr-service
```

## Troubleshooting

### Cameras Not Detected

```bash
# Check available cameras
ls -l /dev/video*

# Test camera
fswebcam -d /dev/video0 test.jpg

# Check permissions
sudo usermod -aG video $USER
# Logout and login again
```

### Database Connection Error

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify credentials in .env
# Test connection
psql -h localhost -U alpr_admin -d alpr_system
```

### OpenALPR Not Working

```bash
# Test OpenALPR
alpr -c us /path/to/test/image.jpg

# Check installation
which alpr

# Reinstall if needed (see INSTALLATION.md)
```

### Barrier Not Responding

```bash
# Check GPIO permissions
sudo usermod -aG gpio $USER

# Test GPIO manually
python3 << EOF
from gpiozero import LED
led = LED(17)
led.on()
# Check if relay activates
led.off()
EOF
```

## Next Steps

1. **Hardware Setup**: [docs/HARDWARE_SETUP.md](docs/HARDWARE_SETUP.md)
2. **Full Installation**: [docs/INSTALLATION.md](docs/INSTALLATION.md)
3. **API Reference**: [docs/API.md](docs/API.md)
4. **Development**: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
5. **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Getting Help

### Documentation
- Check the `docs/` folder for detailed guides
- Review `PROJECT_SUMMARY.md` for system overview

### Common Issues
- Camera not working: Check [HARDWARE_SETUP.md](docs/HARDWARE_SETUP.md)
- Installation problems: See [INSTALLATION.md](docs/INSTALLATION.md)
- Development questions: Read [DEVELOPMENT.md](docs/DEVELOPMENT.md)

### Support
- Review error logs in `/var/log/alpr-system/`
- Check system health: `http://localhost:8000/health`
- View API docs: `http://localhost:8000/api/v1/docs`

## Tips for Success

1. **Start Simple**: Test with simulation mode before connecting hardware
2. **Use Docker**: Easiest way to get started
3. **Check Logs**: Most issues are visible in logs
4. **Test Cameras**: Ensure cameras work before full setup
5. **Secure System**: Change default passwords immediately
6. **Regular Backups**: Set up automated database backups
7. **Monitor Resources**: Keep an eye on CPU/RAM usage
8. **Update Regularly**: Pull latest updates and security patches

## Security Checklist

- [ ] Changed default admin password
- [ ] Updated SECRET_KEY in .env
- [ ] Set strong database password
- [ ] Configured firewall (ufw)
- [ ] Enabled HTTPS (production)
- [ ] Restricted SSH access
- [ ] Regular security updates
- [ ] Reviewed user permissions

## Performance Tips

- Use Ethernet instead of WiFi for stability
- Ensure adequate power supply (5V 3A+)
- Use quality SD card (Class 10+)
- Position cameras for optimal plate capture
- Adjust ALPR confidence threshold as needed
- Monitor system temperature
- Regular maintenance and cleaning

## Production Deployment

Before going to production:

1. Review security settings
2. Set up HTTPS with SSL certificates
3. Configure proper firewall rules
4. Set up automated backups
5. Enable monitoring and alerting
6. Test failover scenarios
7. Document your specific configuration
8. Train operators on the system

## Additional Resources

- **OpenALPR Documentation**: http://doc.openalpr.com/
- **FastAPI Documentation**: https://fastapi.tiangulo.com/
- **React Documentation**: https://react.dev/
- **Raspberry Pi GPIO**: https://gpiozero.readthedocs.io/
- **Docker Documentation**: https://docs.docker.com/

---

**Ready to start? Run the setup script:**

```bash
./scripts/setup/initial_setup.sh
```

Good luck with your ALPR Barrier Control System! 🚗🚧
