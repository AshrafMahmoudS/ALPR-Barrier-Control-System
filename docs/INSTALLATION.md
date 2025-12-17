# Installation Guide

This guide covers the complete installation process for the ALPR Barrier Control System on Raspberry Pi or Orange Pi.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Operating System Setup](#operating-system-setup)
- [System Dependencies](#system-dependencies)
- [OpenALPR Installation](#openalpr-installation)
- [Database Setup](#database-setup)
- [Backend Installation](#backend-installation)
- [ALPR Service Installation](#alpr-service-installation)
- [Hardware Controller Installation](#hardware-controller-installation)
- [Frontend Installation](#frontend-installation)
- [Docker Installation (Alternative)](#docker-installation-alternative)
- [Configuration](#configuration)
- [Starting Services](#starting-services)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Hardware Requirements
- Raspberry Pi 4 (4GB+) or Orange Pi 5
- 2x USB cameras (1080p minimum)
- 32GB+ microSD card (Class 10)
- Stable internet connection for initial setup
- Relay module for barrier control
- Adequate power supply

### Knowledge Requirements
- Basic Linux command line knowledge
- Understanding of GPIO pins
- Basic networking concepts

## Operating System Setup

### For Raspberry Pi

1. **Download Raspberry Pi OS**:
   ```bash
   # Download Raspberry Pi OS Lite (64-bit)
   # Or use Raspberry Pi Imager tool
   ```

2. **Flash SD Card**:
   ```bash
   # Using Raspberry Pi Imager (recommended)
   # Or using dd command on Linux
   sudo dd if=raspios.img of=/dev/sdX bs=4M status=progress
   sync
   ```

3. **Enable SSH** (if using headless):
   ```bash
   # Create empty 'ssh' file in boot partition
   touch /boot/ssh
   ```

4. **First Boot Setup**:
   ```bash
   # SSH into Pi
   ssh pi@raspberrypi.local
   # Default password: raspberry

   # Update system
   sudo apt update && sudo apt upgrade -y

   # Configure Pi
   sudo raspi-config
   # - Change default password
   # - Set hostname
   # - Configure WiFi/Network
   # - Enable Camera interface
   # - Expand filesystem
   ```

### For Orange Pi

1. **Download Armbian** or Orange Pi OS
2. Flash to SD card using Etcher or dd
3. Follow similar setup steps as Raspberry Pi

## System Dependencies

```bash
# Update package list
sudo apt update

# Install system dependencies
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    build-essential \
    cmake \
    curl \
    wget \
    libopencv-dev \
    python3-opencv \
    tesseract-ocr \
    libtesseract-dev \
    libleptonica-dev \
    liblog4cplus-dev \
    libcurl4-openssl-dev \
    postgresql \
    postgresql-contrib \
    redis-server \
    nginx \
    supervisor

# Install Node.js (for frontend)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
python3 --version
node --version
npm --version
```

## OpenALPR Installation

OpenALPR is the core license plate recognition engine.

### Method 1: Build from Source (Recommended for ARM)

```bash
# Install dependencies
sudo apt install -y \
    libopencv-dev \
    libtesseract-dev \
    git \
    cmake \
    build-essential \
    libleptonica-dev \
    liblog4cplus-dev \
    libcurl4-openssl-dev

# Clone OpenALPR repository
cd ~
git clone https://github.com/openalpr/openalpr.git
cd openalpr/src

# Build
mkdir build
cd build
cmake -DCMAKE_INSTALL_PREFIX:PATH=/usr -DCMAKE_INSTALL_SYSCONFDIR:PATH=/etc ..
make -j4  # Use number of CPU cores
sudo make install

# Verify installation
alpr --version
```

### Method 2: Using Pre-built Binaries (Ubuntu/Debian x86_64)

```bash
# Add OpenALPR repository
sudo apt update
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:openalpr/stable
sudo apt update

# Install OpenALPR
sudo apt install -y openalpr openalpr-daemon openalpr-utils libopenalpr-dev

# Verify installation
alpr --version
```

### Configure OpenALPR

```bash
# Edit configuration file
sudo nano /etc/openalpr/openalpr.conf

# Key settings to adjust:
# - country: us (or your country code)
# - state_id_img_width: 1920
# - detect_region: 1
# - max_plate_width_percent: 100
# - max_plate_height_percent: 100

# Test OpenALPR with sample image
alpr -c us /path/to/test/image.jpg
```

## Database Setup

### PostgreSQL

```bash
# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE alpr_system;
CREATE USER alpr_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE alpr_system TO alpr_admin;
ALTER USER alpr_admin WITH SUPERUSER;  # For migrations
\q

# Test connection
psql -h localhost -U alpr_admin -d alpr_system
```

### Redis

```bash
# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping
# Should return: PONG

# Configure Redis (optional)
sudo nano /etc/redis/redis.conf
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis-server
```

## Backend Installation

```bash
# Clone repository (or navigate to backend directory)
cd /home/pi/ALPR_System_for_barriers/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt

# Create .env file
cp ../.env.example .env
nano .env
# Edit configuration values

# Initialize database
python -c "from database.session import init_db; import asyncio; asyncio.run(init_db())"

# Test backend
python main.py
# Should start on http://0.0.0.0:8000
```

## ALPR Service Installation

```bash
# Navigate to ALPR service directory
cd /home/pi/ALPR_System_for_barriers/alpr-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Test camera detection
ls -l /dev/video*
# Should show /dev/video0 and /dev/video1

# Test camera capture
python3 -c "import cv2; cap = cv2.VideoCapture(0); ret, frame = cap.read(); print(f'Camera test: {ret}')"
```

## Hardware Controller Installation

```bash
# Navigate to hardware controller directory
cd /home/pi/ALPR_System_for_barriers/hardware-controller

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Test GPIO access
python3 -c "from gpiozero import LED; led = LED(17); print('GPIO test passed')"
```

## Frontend Installation

```bash
# Navigate to frontend directory
cd /home/pi/ALPR_System_for_barriers/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Or run in development mode
npm run dev
```

## Docker Installation (Alternative)

If you prefer using Docker:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install -y docker-compose

# Navigate to project directory
cd /home/pi/ALPR_System_for_barriers

# Create .env file
cp .env.example .env
nano .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Configuration

### Environment Variables

Edit the `.env` file in the project root:

```bash
nano /home/pi/ALPR_System_for_barriers/.env
```

Key configurations:
- Database credentials
- Redis connection
- Camera IDs
- GPIO pin numbers
- ALPR settings
- API keys

### Nginx Configuration (Production)

```bash
# Create nginx configuration
sudo nano /etc/nginx/sites-available/alpr

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /home/pi/ALPR_System_for_barriers/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/alpr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Starting Services

### Using Systemd (Production)

Create service files for each component:

#### Backend Service

```bash
sudo nano /etc/systemd/system/alpr-backend.service
```

```ini
[Unit]
Description=ALPR Backend API
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/ALPR_System_for_barriers/backend
Environment="PATH=/home/pi/ALPR_System_for_barriers/backend/venv/bin"
ExecStart=/home/pi/ALPR_System_for_barriers/backend/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### ALPR Service

```bash
sudo nano /etc/systemd/system/alpr-service.service
```

```ini
[Unit]
Description=ALPR Detection Service
After=network.target redis.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/ALPR_System_for_barriers/alpr-service
Environment="PATH=/home/pi/ALPR_System_for_barriers/alpr-service/venv/bin"
ExecStart=/home/pi/ALPR_System_for_barriers/alpr-service/venv/bin/python src/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Hardware Controller Service

```bash
sudo nano /etc/systemd/system/alpr-hardware.service
```

```ini
[Unit]
Description=ALPR Hardware Controller
After=network.target redis.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/ALPR_System_for_barriers/hardware-controller
Environment="PATH=/home/pi/ALPR_System_for_barriers/hardware-controller/venv/bin"
ExecStart=/home/pi/ALPR_System_for_barriers/hardware-controller/venv/bin/python src/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable alpr-backend
sudo systemctl enable alpr-service
sudo systemctl enable alpr-hardware

# Start services
sudo systemctl start alpr-backend
sudo systemctl start alpr-service
sudo systemctl start alpr-hardware

# Check status
sudo systemctl status alpr-backend
sudo systemctl status alpr-service
sudo systemctl status alpr-hardware

# View logs
sudo journalctl -u alpr-backend -f
```

## Troubleshooting

### Camera Issues

```bash
# Check camera devices
ls -l /dev/video*
v4l2-ctl --list-devices

# Test camera
ffmpeg -f v4l2 -i /dev/video0 -frames 1 test.jpg

# Check permissions
sudo usermod -aG video $USER
```

### GPIO Issues

```bash
# Check GPIO permissions
sudo usermod -aG gpio $USER

# Test GPIO manually
echo "17" > /sys/class/gpio/export
echo "out" > /sys/class/gpio/gpio17/direction
echo "1" > /sys/class/gpio/gpio17/value
```

### Database Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Reset database
sudo -u postgres psql
DROP DATABASE alpr_system;
CREATE DATABASE alpr_system;
```

### OpenALPR Issues

```bash
# Test OpenALPR
alpr -c us /path/to/test/image.jpg

# Check OpenALPR config
cat /etc/openalpr/openalpr.conf

# Reinstall if needed
sudo apt remove openalpr
# Follow installation steps again
```

### Service Logs

```bash
# View all ALPR logs
sudo journalctl -u alpr-* -f

# View specific service log
sudo journalctl -u alpr-backend -n 100

# Clear old logs
sudo journalctl --vacuum-time=7d
```

## Next Steps

After successful installation:

1. Access the dashboard at `http://your-pi-ip:3000`
2. Default login credentials (change immediately):
   - Username: `admin`
   - Password: `admin`
3. Configure system settings
4. Register test vehicles
5. Test barrier operation
6. Review documentation in [USER_GUIDE.md](USER_GUIDE.md)

## Security Recommendations

- Change all default passwords
- Enable firewall (ufw)
- Use HTTPS with SSL certificates
- Restrict SSH access
- Regular security updates
- Backup database regularly
- Monitor system logs

## Support

For issues and questions:
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Review system logs
- Check GitHub issues
- Contact support team
