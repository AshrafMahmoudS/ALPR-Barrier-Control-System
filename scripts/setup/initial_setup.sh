#!/bin/bash

#############################################################
# ALPR Barrier Control System - Initial Setup Script
#############################################################

set -e

echo "======================================"
echo "ALPR System Initial Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${GREEN}Project root: $PROJECT_ROOT${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Warning: Not running as root. Some steps may require sudo.${NC}"
  echo ""
fi

# Function to check command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."
echo ""

# Check Python
if command_exists python3; then
  PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
  echo -e "${GREEN}✓ Python 3 installed: $PYTHON_VERSION${NC}"
else
  echo -e "${RED}✗ Python 3 not found${NC}"
  echo "  Install with: sudo apt install python3 python3-pip python3-venv"
  exit 1
fi

# Check Node.js
if command_exists node; then
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
else
  echo -e "${YELLOW}⚠ Node.js not found${NC}"
  echo "  Install with: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs"
fi

# Check PostgreSQL
if command_exists psql; then
  PG_VERSION=$(psql --version | cut -d' ' -f3)
  echo -e "${GREEN}✓ PostgreSQL installed: $PG_VERSION${NC}"
else
  echo -e "${YELLOW}⚠ PostgreSQL not found${NC}"
  echo "  Install with: sudo apt install postgresql postgresql-contrib"
fi

# Check Redis
if command_exists redis-cli; then
  REDIS_VERSION=$(redis-cli --version | cut -d' ' -f2)
  echo -e "${GREEN}✓ Redis installed: $REDIS_VERSION${NC}"
else
  echo -e "${YELLOW}⚠ Redis not found${NC}"
  echo "  Install with: sudo apt install redis-server"
fi

# Check OpenALPR
if command_exists alpr; then
  ALPR_VERSION=$(alpr --version 2>&1 | head -n1)
  echo -e "${GREEN}✓ OpenALPR installed: $ALPR_VERSION${NC}"
else
  echo -e "${YELLOW}⚠ OpenALPR not found${NC}"
  echo "  See docs/INSTALLATION.md for installation instructions"
fi

echo ""
echo "======================================"
echo "Environment Setup"
echo "======================================"
echo ""

# Create .env file if not exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
  echo "Creating .env file from template..."
  cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
  echo -e "${GREEN}✓ Created .env file${NC}"
  echo -e "${YELLOW}⚠ Please edit .env file with your configuration${NC}"
else
  echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo ""
echo "======================================"
echo "Backend Setup"
echo "======================================"
echo ""

cd "$PROJECT_ROOT/backend"

# Create virtual environment
if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv
  echo -e "${GREEN}✓ Virtual environment created${NC}"
else
  echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate virtual environment and install dependencies
echo "Installing backend dependencies..."
source venv/bin/activate
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

echo ""
echo "======================================"
echo "ALPR Service Setup"
echo "======================================"
echo ""

cd "$PROJECT_ROOT/alpr-service"

# Create virtual environment
if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv
  echo -e "${GREEN}✓ Virtual environment created${NC}"
else
  echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Install dependencies
echo "Installing ALPR service dependencies..."
source venv/bin/activate
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt
echo -e "${GREEN}✓ ALPR service dependencies installed${NC}"

echo ""
echo "======================================"
echo "Hardware Controller Setup"
echo "======================================"
echo ""

cd "$PROJECT_ROOT/hardware-controller"

# Create virtual environment
if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv
  echo -e "${GREEN}✓ Virtual environment created${NC}"
else
  echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi

# Install dependencies
echo "Installing hardware controller dependencies..."
source venv/bin/activate
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt
echo -e "${GREEN}✓ Hardware controller dependencies installed${NC}"

echo ""
echo "======================================"
echo "Frontend Setup"
echo "======================================"
echo ""

cd "$PROJECT_ROOT/frontend"

if command_exists npm; then
  echo "Installing frontend dependencies..."
  npm install
  echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
  echo -e "${YELLOW}⚠ npm not found, skipping frontend setup${NC}"
fi

echo ""
echo "======================================"
echo "Directory Setup"
echo "======================================"
echo ""

# Create required directories
echo "Creating required directories..."
mkdir -p "$PROJECT_ROOT/storage/images"
mkdir -p "$PROJECT_ROOT/logs"
echo -e "${GREEN}✓ Directories created${NC}"

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Edit .env file with your configuration:"
echo "   nano $PROJECT_ROOT/.env"
echo ""
echo "2. Setup PostgreSQL database:"
echo "   sudo -u postgres psql"
echo "   CREATE DATABASE alpr_system;"
echo "   CREATE USER alpr_admin WITH PASSWORD 'your_password';"
echo "   GRANT ALL PRIVILEGES ON DATABASE alpr_system TO alpr_admin;"
echo ""
echo "3. Start services:"
echo "   Option A - Using Docker:"
echo "     docker-compose up -d"
echo ""
echo "   Option B - Manually:"
echo "     cd backend && source venv/bin/activate && python main.py"
echo "     cd frontend && npm run dev"
echo ""
echo "4. Access dashboard:"
echo "   http://localhost:3000"
echo ""
echo "5. Review documentation:"
echo "   docs/INSTALLATION.md"
echo "   docs/HARDWARE_SETUP.md"
echo ""
echo -e "${GREEN}Setup script completed successfully!${NC}"
