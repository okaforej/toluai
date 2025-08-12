#!/bin/bash

# ToluAI Setup Verification Script
# Checks that everything is properly installed and configured

echo "======================================"
echo "   ToluAI Setup Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Track overall status
ALL_GOOD=true

# Check function
check() {
    if eval "$2" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        ALL_GOOD=false
        return 1
    fi
}

# Check with version
check_version() {
    if command -v $2 > /dev/null 2>&1; then
        VERSION=$($3)
        echo -e "${GREEN}✓${NC} $1: $VERSION"
        return 0
    else
        echo -e "${RED}✗${NC} $1: Not installed"
        ALL_GOOD=false
        return 1
    fi
}

echo "🔍 Checking system requirements..."
echo ""

# System checks
check_version "Git" "git" "git --version | cut -d' ' -f3"
check_version "Python" "python3" "python3 --version | cut -d' ' -f2"
check_version "Node.js" "node" "node --version"
check_version "NPM" "npm" "npm --version"

echo ""
echo "🔍 Checking optional tools..."
echo ""

check "Docker" "command -v docker"
check "Docker Compose" "command -v docker-compose"
check "PostgreSQL" "command -v psql"
check "Redis" "command -v redis-cli"
check "Make" "command -v make"

echo ""
echo "🔍 Checking Python environment..."
echo ""

check "Virtual environment" "[ -d 'venv' ]"
check "Requirements installed" "[ -f 'venv/bin/flask' ]"

echo ""
echo "🔍 Checking Node environment..."
echo ""

check "Node modules" "[ -d 'frontend/node_modules' ]"
check "Playwright installed" "[ -d 'frontend/node_modules/@playwright' ]"

echo ""
echo "🔍 Checking configuration files..."
echo ""

check "Backend .env file" "[ -f '.env' ]"
check "Frontend .env file" "[ -f 'frontend/.env' ]"

echo ""
echo "🔍 Checking services (if running)..."
echo ""

# Check if services are running
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend API is running"
    
    # Get health details
    HEALTH=$(curl -s http://localhost:5001/health)
    echo "  Status: Healthy"
else
    echo -e "${YELLOW}○${NC} Backend API is not running (run: make dev-backend)"
fi

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Frontend is running"
else
    echo -e "${YELLOW}○${NC} Frontend is not running (run: make dev-frontend)"
fi

# Check database
if PGPASSWORD=toluai_dev_pass123 psql -h localhost -U toluai_dev -d toluai_dev -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Database is accessible"
    
    # Count tables
    TABLE_COUNT=$(PGPASSWORD=toluai_dev_pass123 psql -h localhost -U toluai_dev -d toluai_dev -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
    echo "  Tables: $TABLE_COUNT"
else
    echo -e "${YELLOW}○${NC} Database is not accessible"
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis is running"
else
    echo -e "${YELLOW}○${NC} Redis is not running"
fi

echo ""
echo "======================================"

if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}✅ All requirements are met!${NC}"
    echo ""
    echo "You can start development with:"
    echo "  make dev          - Start all services"
    echo "  make quickstart   - Complete setup and start"
    echo ""
else
    echo -e "${RED}❌ Some requirements are missing${NC}"
    echo ""
    echo "Run the setup script to install missing components:"
    echo "  ./setup.sh"
    echo ""
fi

echo "======================================"