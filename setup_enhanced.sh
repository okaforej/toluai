#!/bin/bash

# ToluAI Enhanced One-Click Setup Script
# Works on brand new laptops with zero prerequisites
# Supports: macOS, Linux, Windows (WSL2)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PYTHON_VERSION="3.11"
NODE_VERSION="18"
POSTGRES_VERSION="15"
MIN_RAM_GB=4
MIN_DISK_GB=10

# Error handling
trap 'handle_error $? $LINENO' ERR

handle_error() {
    print_error "Error occurred at line $2 with exit code $1"
    print_error "Setup failed. Please check the error above and try again."
    cleanup_on_error
    exit 1
}

cleanup_on_error() {
    # Kill any started processes
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
}

# Print functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# ASCII Art Header
show_header() {
    echo -e "${CYAN}"
    cat << "EOF"
╔════════════════════════════════════════════╗
║                                            ║
║        ToluAI Setup Assistant 🚀           ║
║     One-Click Development Environment      ║
║                                            ║
╚════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Check system requirements
check_system_requirements() {
    print_step "Checking system requirements..."
    
    # Check RAM
    if [ "$OS" == "Mac" ]; then
        TOTAL_RAM=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024)}')
    else
        TOTAL_RAM=$(free -g | awk '/^Mem:/{print $2}')
    fi
    
    if [ "$TOTAL_RAM" -lt "$MIN_RAM_GB" ]; then
        print_warning "System has ${TOTAL_RAM}GB RAM. Recommended: ${MIN_RAM_GB}GB+"
    else
        print_success "RAM: ${TOTAL_RAM}GB ✓"
    fi
    
    # Check disk space
    AVAILABLE_DISK=$(df -BG . | awk 'NR==2 {print int($4)}')
    if [ "$AVAILABLE_DISK" -lt "$MIN_DISK_GB" ]; then
        print_error "Insufficient disk space: ${AVAILABLE_DISK}GB available, need ${MIN_DISK_GB}GB+"
        exit 1
    else
        print_success "Disk space: ${AVAILABLE_DISK}GB available ✓"
    fi
    
    # Check internet connection
    if ! ping -c 1 google.com &> /dev/null; then
        print_error "No internet connection detected. Please connect to the internet."
        exit 1
    else
        print_success "Internet connection ✓"
    fi
}

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Darwin*)    
            OS="Mac"
            DISTRO="macOS $(sw_vers -productVersion)"
            ;;
        Linux*)     
            OS="Linux"
            if [ -f /etc/os-release ]; then
                DISTRO=$(grep PRETTY_NAME /etc/os-release | cut -d '"' -f 2)
            else
                DISTRO="Unknown Linux"
            fi
            ;;
        MINGW*|CYGWIN*|MSYS*) 
            OS="Windows"
            DISTRO="Windows (WSL recommended)"
            ;;
        *)          
            OS="Unknown"
            DISTRO="Unknown OS"
            ;;
    esac
    print_status "Detected: $DISTRO"
}

# Check if running in WSL
check_wsl() {
    if grep -qEi "(Microsoft|WSL)" /proc/version &> /dev/null; then
        print_status "Running in WSL environment"
        WSL=true
    else
        WSL=false
    fi
}

# Install command line tools (macOS)
install_xcode_tools() {
    if [ "$OS" == "Mac" ]; then
        if ! xcode-select -p &> /dev/null; then
            print_status "Installing Xcode Command Line Tools..."
            xcode-select --install
            print_warning "Please complete the Xcode tools installation and re-run this script."
            exit 0
        fi
    fi
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Homebrew (macOS)
install_homebrew() {
    if ! command_exists brew; then
        print_status "Installing Homebrew (this may take a few minutes)..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for M1 Macs
        if [ -f "/opt/homebrew/bin/brew" ]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        fi
        
        print_success "Homebrew installed"
    else
        print_success "Homebrew already installed"
        brew update
    fi
}

# Install Git if not present
ensure_git() {
    if ! command_exists git; then
        print_status "Installing Git..."
        if [ "$OS" == "Mac" ]; then
            brew install git
        elif [ "$OS" == "Linux" ]; then
            if command_exists apt-get; then
                sudo apt-get update && sudo apt-get install -y git
            elif command_exists yum; then
                sudo yum install -y git
            fi
        fi
    fi
    print_success "Git is available"
}

# Install Python
install_python() {
    print_status "Checking Python installation..."
    
    # Check for Python 3.11 or compatible version
    PYTHON_CMD=""
    for cmd in python3.11 python3 python; do
        if command_exists $cmd; then
            VERSION=$($cmd --version 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
            MAJOR=$(echo $VERSION | cut -d. -f1)
            MINOR=$(echo $VERSION | cut -d. -f2)
            if [ "$MAJOR" -eq 3 ] && [ "$MINOR" -ge 9 ]; then
                PYTHON_CMD=$cmd
                print_success "Python $VERSION found"
                break
            fi
        fi
    done
    
    if [ -z "$PYTHON_CMD" ]; then
        print_status "Installing Python ${PYTHON_VERSION}..."
        if [ "$OS" == "Mac" ]; then
            brew install python@${PYTHON_VERSION}
            PYTHON_CMD="python3.11"
        elif [ "$OS" == "Linux" ]; then
            if command_exists apt-get; then
                sudo apt-get update
                sudo apt-get install -y python${PYTHON_VERSION} python${PYTHON_VERSION}-venv python3-pip
            elif command_exists yum; then
                sudo yum install -y python${PYTHON_VERSION}
            fi
            PYTHON_CMD="python${PYTHON_VERSION}"
        fi
    fi
    
    # Verify pip
    if ! $PYTHON_CMD -m pip --version &> /dev/null; then
        print_status "Installing pip..."
        curl https://bootstrap.pypa.io/get-pip.py | $PYTHON_CMD
    fi
}

# Install Node.js
install_nodejs() {
    print_status "Checking Node.js installation..."
    
    if command_exists node; then
        NODE_VERSION_INSTALLED=$(node --version | grep -oE '[0-9]+' | head -1)
        if [ "$NODE_VERSION_INSTALLED" -ge 16 ]; then
            print_success "Node.js $(node --version) found"
            return
        fi
    fi
    
    print_status "Installing Node.js ${NODE_VERSION}..."
    if [ "$OS" == "Mac" ]; then
        brew install node@${NODE_VERSION}
    elif [ "$OS" == "Linux" ]; then
        # Use NodeSource repository for consistent Node.js versions
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    print_success "Node.js installed"
}

# Install PostgreSQL
install_postgresql() {
    print_status "Checking PostgreSQL..."
    
    if command_exists psql; then
        print_success "PostgreSQL found"
    else
        print_status "Installing PostgreSQL ${POSTGRES_VERSION}..."
        if [ "$OS" == "Mac" ]; then
            brew install postgresql@${POSTGRES_VERSION}
            brew services start postgresql@${POSTGRES_VERSION}
        elif [ "$OS" == "Linux" ]; then
            if command_exists apt-get; then
                sudo apt-get install -y postgresql-${POSTGRES_VERSION} postgresql-client-${POSTGRES_VERSION}
                sudo systemctl start postgresql
                sudo systemctl enable postgresql
            fi
        fi
    fi
}

# Install Docker (optional)
check_docker() {
    if command_exists docker; then
        print_success "Docker found"
        return 0
    else
        print_warning "Docker not installed (optional)"
        echo "  To install Docker Desktop, visit: https://www.docker.com/products/docker-desktop"
        return 1
    fi
}

# Setup Python environment
setup_python_env() {
    print_step "Setting up Python environment..."
    
    # Remove old venv if it exists and is broken
    if [ -d "venv" ]; then
        if ! venv/bin/python --version &> /dev/null; then
            print_warning "Removing broken virtual environment..."
            rm -rf venv
        fi
    fi
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        $PYTHON_CMD -m venv venv
        print_success "Virtual environment created"
    fi
    
    # Activate and upgrade pip
    source venv/bin/activate
    python -m pip install --upgrade pip setuptools wheel
    
    # Install requirements with error handling
    print_status "Installing Python packages (this may take a few minutes)..."
    if ! pip install -r requirements.txt; then
        print_warning "Some packages failed to install. Trying alternative approach..."
        pip install --no-cache-dir -r requirements.txt
    fi
    
    print_success "Python environment ready"
}

# Setup Node environment
setup_node_env() {
    print_step "Setting up Node.js environment..."
    
    cd frontend
    
    # Clean install
    if [ -d "node_modules" ]; then
        print_status "Cleaning old Node modules..."
        rm -rf node_modules package-lock.json
    fi
    
    # Install dependencies
    print_status "Installing Node packages (this may take a few minutes)..."
    npm install
    
    # Install Playwright browsers (for testing)
    print_status "Installing test browsers..."
    npx playwright install --with-deps chromium
    
    cd ..
    print_success "Node.js environment ready"
}

# Setup database with better error handling
setup_database() {
    print_step "Setting up PostgreSQL database..."
    
    # Try different PostgreSQL connection methods
    DB_SETUP_SUCCESS=false
    
    # Method 1: Try with postgres user
    if command_exists psql; then
        if psql -U postgres -c '\l' &> /dev/null; then
            psql -U postgres <<EOF 2>/dev/null || true
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'toluai_dev') THEN
        CREATE USER toluai_dev WITH PASSWORD 'toluai_dev_pass123';
    END IF;
END\$\$;

DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'toluai_dev') THEN
        CREATE DATABASE toluai_dev OWNER toluai_dev;
    END IF;
END\$\$;

GRANT ALL PRIVILEGES ON DATABASE toluai_dev TO toluai_dev;
EOF
            DB_SETUP_SUCCESS=true
            print_success "Database configured with postgres user"
        fi
    fi
    
    # Method 2: Try with sudo (Linux)
    if [ "$DB_SETUP_SUCCESS" = false ] && [ "$OS" == "Linux" ]; then
        if sudo -u postgres psql -c '\l' &> /dev/null; then
            sudo -u postgres psql <<EOF 2>/dev/null || true
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'toluai_dev') THEN
        CREATE USER toluai_dev WITH PASSWORD 'toluai_dev_pass123';
    END IF;
END\$\$;

DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'toluai_dev') THEN
        CREATE DATABASE toluai_dev OWNER toluai_dev;
    END IF;
END\$\$;

GRANT ALL PRIVILEGES ON DATABASE toluai_dev TO toluai_dev;
EOF
            DB_SETUP_SUCCESS=true
            print_success "Database configured with sudo"
        fi
    fi
    
    # Method 3: Use Docker as fallback
    if [ "$DB_SETUP_SUCCESS" = false ]; then
        print_warning "Local PostgreSQL setup failed. Using Docker for database..."
        if check_docker; then
            docker run -d \
                --name toluai-postgres \
                -e POSTGRES_USER=toluai_dev \
                -e POSTGRES_PASSWORD=toluai_dev_pass123 \
                -e POSTGRES_DB=toluai_dev \
                -p 5432:5432 \
                postgres:${POSTGRES_VERSION}
            
            sleep 5
            DB_SETUP_SUCCESS=true
            print_success "PostgreSQL running in Docker"
        else
            print_error "Could not setup database. Please install PostgreSQL or Docker."
            exit 1
        fi
    fi
}

# Create environment files with auto-detection
create_env_files() {
    print_step "Creating environment configuration..."
    
    # Generate secure keys
    SECRET_KEY=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | head -c 32 | base64)
    SALT=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | head -c 32 | base64)
    
    # Backend .env
    if [ ! -f ".env" ]; then
        cat > .env <<EOF
# Database
DATABASE_URL=postgresql://toluai_dev:toluai_dev_pass123@localhost:5432/toluai_dev

# Redis (optional - will use memory cache if not available)
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=${SECRET_KEY}
SECURITY_PASSWORD_SALT=${SALT}
JWT_SECRET_KEY=${SECRET_KEY}

# Flask
FLASK_ENV=development
FLASK_DEBUG=1

# API
API_VERSION=v2
CORS_ORIGINS=http://localhost:5173,http://localhost:5175,http://127.0.0.1:5173
EOF
        print_success "Backend configuration created"
    else
        print_success "Backend configuration exists"
    fi
    
    # Frontend .env
    if [ ! -f "frontend/.env" ]; then
        cat > frontend/.env <<EOF
VITE_API_URL=http://localhost:5001
VITE_APP_NAME=ToluAI
VITE_APP_VERSION=1.0.0
VITE_MOCK_AUTH_ENABLED=false
EOF
        print_success "Frontend configuration created"
    else
        print_success "Frontend configuration exists"
    fi
}

# Initialize application data
initialize_app() {
    print_step "Initializing application..."
    
    source venv/bin/activate
    
    # Create all tables
    print_status "Setting up database schema..."
    python -c "
from backend.app import create_app, db
app = create_app('development')
with app.app_context():
    db.create_all()
    print('Database tables created')
" || print_warning "Database initialization skipped"
    
    # Load reference data
    if [ -f "init_reference_data.py" ]; then
        print_status "Loading reference data..."
        python init_reference_data.py || print_warning "Reference data already loaded"
    fi
    
    # Create admin user
    if [ -f "init_auth_system.py" ]; then
        print_status "Creating admin user..."
        python init_auth_system.py || print_warning "Admin user already exists"
    fi
    
    print_success "Application initialized"
}

# Quick setup option for experienced developers
quick_setup() {
    print_step "Running quick setup..."
    
    # Parallel installation
    install_python &
    PID1=$!
    install_nodejs &
    PID2=$!
    install_postgresql &
    PID3=$!
    
    wait $PID1 $PID2 $PID3
    
    create_env_files
    setup_python_env
    setup_node_env
    setup_database
    initialize_app
}

# Guided setup for new developers
guided_setup() {
    print_step "Starting guided setup..."
    
    echo ""
    echo "This will install and configure everything needed for ToluAI development."
    echo "Estimated time: 10-15 minutes"
    echo ""
    read -p "Press Enter to continue..."
    
    # Step by step with progress
    steps=("Prerequisites" "Python" "Node.js" "Database" "Backend" "Frontend" "Initialization")
    current=1
    total=${#steps[@]}
    
    for step in "${steps[@]}"; do
        echo ""
        echo "[$current/$total] $step"
        echo "─────────────────────────"
        
        case $step in
            "Prerequisites")
                ensure_git
                ;;
            "Python")
                install_python
                setup_python_env
                ;;
            "Node.js")
                install_nodejs
                setup_node_env
                ;;
            "Database")
                install_postgresql
                setup_database
                ;;
            "Backend")
                create_env_files
                ;;
            "Frontend")
                # Already done in Node.js step
                ;;
            "Initialization")
                initialize_app
                ;;
        esac
        
        current=$((current + 1))
    done
}

# Start services
start_services() {
    print_step "Starting services..."
    
    # Kill any existing processes on our ports
    lsof -ti:5001 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    
    # Start backend
    source venv/bin/activate
    python run_simple.py > backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Start frontend
    cd frontend
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 8
    
    # Health check
    BACKEND_HEALTHY=false
    FRONTEND_HEALTHY=false
    
    if curl -f http://localhost:5001/health &> /dev/null; then
        BACKEND_HEALTHY=true
        print_success "Backend is running"
    else
        print_error "Backend failed to start. Check backend.log"
    fi
    
    if curl -f http://localhost:5173 &> /dev/null; then
        FRONTEND_HEALTHY=true
        print_success "Frontend is running"
    else
        print_error "Frontend failed to start. Check frontend.log"
    fi
    
    if [ "$BACKEND_HEALTHY" = true ] && [ "$FRONTEND_HEALTHY" = true ]; then
        return 0
    else
        return 1
    fi
}

# Main function
main() {
    show_header
    detect_os
    
    if [ "$OS" == "Linux" ]; then
        check_wsl
    fi
    
    check_system_requirements
    
    if [ "$OS" == "Mac" ]; then
        install_xcode_tools
        install_homebrew
    fi
    
    # Setup mode selection
    echo ""
    echo "Choose setup mode:"
    echo ""
    echo "  1) 🚀 Express Setup (Recommended)"
    echo "     - Fully automatic installation"
    echo "     - Best for new laptops"
    echo ""
    echo "  2) 📋 Guided Setup"
    echo "     - Step-by-step with explanations"
    echo "     - Good for learning"
    echo ""
    echo "  3) 🐳 Docker Setup"
    echo "     - Everything in containers"
    echo "     - No local installation needed"
    echo ""
    
    read -p "Enter choice [1-3]: " choice
    
    case $choice in
        1)
            quick_setup
            if start_services; then
                print_success "✨ Setup complete!"
                echo ""
                echo "╔════════════════════════════════════════╗"
                echo "║         ToluAI is Ready! 🎉            ║"
                echo "╠════════════════════════════════════════╣"
                echo "║                                        ║"
                echo "║  🌐 Frontend:  http://localhost:5173   ║"
                echo "║  🔧 Backend:   http://localhost:5001   ║"
                echo "║  📚 API Docs:  http://localhost:5001/api/docs ║"
                echo "║                                        ║"
                echo "║  📧 Login:     admin@toluai.com        ║"
                echo "║  🔑 Password:  Admin123!               ║"
                echo "║                                        ║"
                echo "║  To stop: Press Ctrl+C                ║"
                echo "║  To restart: make dev                 ║"
                echo "╚════════════════════════════════════════╝"
                
                # Keep running
                wait $BACKEND_PID $FRONTEND_PID
            fi
            ;;
            
        2)
            guided_setup
            if start_services; then
                print_success "✨ Setup complete!"
                echo ""
                echo "Access the application at:"
                echo "  Frontend: http://localhost:5173"
                echo "  Backend:  http://localhost:5001"
                echo ""
                echo "Login with: admin@toluai.com / Admin123!"
                
                wait $BACKEND_PID $FRONTEND_PID
            fi
            ;;
            
        3)
            if ! check_docker; then
                print_error "Docker is required for this option."
                echo "Please install Docker Desktop first:"
                echo "https://www.docker.com/products/docker-desktop"
                exit 1
            fi
            
            print_status "Starting Docker setup..."
            docker-compose -f docker-compose.dev.yml up --build
            ;;
            
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Cleanup on exit
trap cleanup_on_error EXIT

# Run main
main