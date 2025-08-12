#!/bin/bash

# ToluAI Setup Verification Script
# Checks if everything is properly installed and configured

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASS=0
FAIL=0
WARN=0

# Print functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

check_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Header
echo "╔════════════════════════════════════════╗"
echo "║     ToluAI Setup Verification          ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check Git
echo "Checking Prerequisites..."
echo "─────────────────────────"
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | awk '{print $3}')
    check_pass "Git $GIT_VERSION"
else
    check_fail "Git not installed"
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | awk '{print $2}')
    MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
    if [ "$MAJOR" -eq 3 ] && [ "$MINOR" -ge 9 ]; then
        check_pass "Python $PYTHON_VERSION"
    else
        check_warn "Python $PYTHON_VERSION (3.9+ recommended)"
    fi
else
    check_fail "Python not installed"
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js $NODE_VERSION"
else
    check_fail "Node.js not installed"
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_pass "npm $NPM_VERSION"
else
    check_fail "npm not installed"
fi

echo ""
echo "Checking Databases..."
echo "─────────────────────"

# Check PostgreSQL
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    check_pass "PostgreSQL $PSQL_VERSION"
    
    # Test database connection
    if PGPASSWORD=toluai_dev_pass123 psql -h localhost -U toluai_dev -d toluai_dev -c "SELECT 1" &> /dev/null; then
        check_pass "Database connection works"
    else
        check_warn "Database connection failed (may need setup)"
    fi
else
    # Check if PostgreSQL is in Docker
    if docker ps 2>/dev/null | grep -q postgres; then
        check_pass "PostgreSQL (Docker)"
    else
        check_warn "PostgreSQL not found locally"
    fi
fi

# Check Redis (optional)
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        check_pass "Redis (running)"
    else
        check_warn "Redis (installed but not running)"
    fi
else
    check_info "Redis not installed (optional)"
fi

echo ""
echo "Checking Project Setup..."
echo "─────────────────────"

# Check virtual environment
if [ -d "venv" ]; then
    check_pass "Python virtual environment exists"
    
    # Check if it works
    if venv/bin/python --version &> /dev/null; then
        check_pass "Virtual environment is functional"
    else
        check_fail "Virtual environment is broken"
    fi
else
    check_fail "No Python virtual environment"
fi

# Check backend dependencies
if [ -f "requirements.txt" ]; then
    check_pass "requirements.txt found"
else
    check_fail "requirements.txt missing"
fi

# Check frontend dependencies
if [ -d "frontend/node_modules" ]; then
    check_pass "Node modules installed"
else
    check_warn "Node modules not installed"
fi

# Check environment files
if [ -f ".env" ]; then
    check_pass "Backend .env configured"
else
    check_warn "Backend .env missing"
fi

if [ -f "frontend/.env" ]; then
    check_pass "Frontend .env configured"
else
    check_warn "Frontend .env missing"
fi

echo ""
echo "Checking Services..."
echo "─────────────────────"

# Check backend
if curl -f http://localhost:5001/health &> /dev/null; then
    check_pass "Backend is running (port 5001)"
else
    check_info "Backend not running"
fi

# Check frontend
if curl -f http://localhost:5173 &> /dev/null; then
    check_pass "Frontend is running (port 5173)"
else
    check_info "Frontend not running"
fi

# Check Docker (optional)
if command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        check_pass "Docker is available"
    else
        check_warn "Docker installed but not running"
    fi
else
    check_info "Docker not installed (optional)"
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║           Verification Summary          ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "  ✓ Passed:  $PASS"
echo "  ⚠ Warnings: $WARN"
echo "  ✗ Failed:  $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    if [ $WARN -eq 0 ]; then
        echo -e "${GREEN}✨ Everything looks perfect!${NC}"
    else
        echo -e "${GREEN}✓ Setup is functional${NC} (with some warnings)"
    fi
    echo ""
    echo "Next steps:"
    echo "  1. Run: make dev"
    echo "  2. Open: http://localhost:5173"
    echo "  3. Login: admin@toluai.com / Admin123!"
else
    echo -e "${RED}⚠ Setup needs attention${NC}"
    echo ""
    echo "To fix issues, run:"
    echo "  ./setup.sh"
fi