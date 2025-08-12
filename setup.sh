#!/bin/bash

# ToluAI One-Click Development Setup Script
# Supports: macOS, Linux, Windows (WSL2)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PYTHON_VERSION="3.11"
NODE_VERSION="18"
POSTGRES_VERSION="15"

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Header
echo "=========================================="
echo "   ToluAI Development Environment Setup   "
echo "=========================================="
echo ""

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Darwin*)    OS="Mac";;
        Linux*)     OS="Linux";;
        MINGW*|CYGWIN*|MSYS*) OS="Windows";;
        *)          OS="Unknown";;
    esac
    print_status "Detected OS: $OS"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Homebrew (macOS)
install_homebrew() {
    if ! command_exists brew; then
        print_status "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        print_success "Homebrew installed"
    else
        print_status "Homebrew already installed"
    fi
}

# Install dependencies based on OS
install_system_dependencies() {
    print_status "Installing system dependencies..."
    
    if [ "$OS" == "Mac" ]; then
        install_homebrew
        brew update
        
        # Install required tools
        brew install git python@${PYTHON_VERSION} node@${NODE_VERSION} postgresql@${POSTGRES_VERSION} redis docker docker-compose make
        
        # Start services
        brew services start postgresql@${POSTGRES_VERSION}
        brew services start redis
        
    elif [ "$OS" == "Linux" ]; then
        # Update package manager
        if command_exists apt-get; then
            sudo apt-get update
            sudo apt-get install -y \
                git \
                python${PYTHON_VERSION} \
                python${PYTHON_VERSION}-venv \
                python3-pip \
                nodejs \
                npm \
                postgresql-${POSTGRES_VERSION} \
                redis-server \
                docker.io \
                docker-compose \
                make \
                curl \
                build-essential
                
            # Start services
            sudo systemctl start postgresql
            sudo systemctl start redis-server
            
        elif command_exists yum; then
            sudo yum install -y \
                git \
                python${PYTHON_VERSION} \
                nodejs \
                postgresql${POSTGRES_VERSION}-server \
                redis \
                docker \
                docker-compose \
                make
                
            # Initialize and start PostgreSQL
            sudo postgresql-setup initdb
            sudo systemctl start postgresql
            sudo systemctl start redis
        fi
    fi
    
    print_success "System dependencies installed"
}

# Setup Python environment
setup_python_env() {
    print_status "Setting up Python environment..."
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Virtual environment created"
    else
        print_status "Virtual environment already exists"
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install Python dependencies
    pip install -r requirements.txt
    
    print_success "Python environment ready"
}

# Setup Node environment
setup_node_env() {
    print_status "Setting up Node.js environment..."
    
    cd frontend
    
    # Install npm dependencies
    npm install
    
    # Install Playwright browsers
    npx playwright install
    
    cd ..
    
    print_success "Node.js environment ready"
}

# Setup database
setup_database() {
    print_status "Setting up PostgreSQL database..."
    
    # Check if PostgreSQL is running
    if command_exists psql; then
        # Create database and user
        psql -U postgres <<EOF
CREATE USER toluai_dev WITH PASSWORD 'toluai_dev_pass123';
CREATE DATABASE toluai_dev OWNER toluai_dev;
GRANT ALL PRIVILEGES ON DATABASE toluai_dev TO toluai_dev;
EOF
        
        print_success "Database created"
    else
        print_warning "PostgreSQL not found. Using Docker instead."
    fi
}

# Initialize application
initialize_app() {
    print_status "Initializing application..."
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Run database migrations
    print_status "Running database migrations..."
    flask db upgrade
    
    # Initialize reference data
    print_status "Loading reference data..."
    python init_reference_data.py
    
    # Create admin user
    print_status "Creating admin user..."
    python init_auth_system.py
    
    print_success "Application initialized"
}

# Create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Backend .env
    if [ ! -f ".env" ]; then
        cat > .env <<EOF
# Database
DATABASE_URL=postgresql://toluai_dev:toluai_dev_pass123@localhost:5432/toluai_dev

# Redis
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=dev-secret-key-$(openssl rand -hex 32)
SECURITY_PASSWORD_SALT=dev-salt-$(openssl rand -hex 32)

# Flask
FLASK_ENV=development
FLASK_DEBUG=1

# API
API_VERSION=v2
EOF
        print_success "Backend .env created"
    fi
    
    # Frontend .env
    if [ ! -f "frontend/.env" ]; then
        cat > frontend/.env <<EOF
VITE_API_URL=http://localhost:5001
VITE_APP_NAME=ToluAI
VITE_APP_VERSION=1.0.0
EOF
        print_success "Frontend .env created"
    fi
}

# Docker setup option
setup_with_docker() {
    print_status "Setting up with Docker..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker Desktop first."
        echo "Visit: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    # Build and start containers
    docker-compose -f docker-compose.dev.yml up -d --build
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 10
    
    # Run migrations in container
    docker-compose -f docker-compose.dev.yml exec backend flask db upgrade
    docker-compose -f docker-compose.dev.yml exec backend python init_reference_data.py
    docker-compose -f docker-compose.dev.yml exec backend python init_auth_system.py
    
    print_success "Docker environment ready"
}

# Health check
health_check() {
    print_status "Running health checks..."
    
    # Check backend
    if curl -f http://localhost:5001/health >/dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_warning "Backend health check failed"
    fi
    
    # Check frontend
    if curl -f http://localhost:5173 >/dev/null 2>&1; then
        print_success "Frontend is healthy"
    else
        print_warning "Frontend health check failed"
    fi
    
    # Check database
    if PGPASSWORD=toluai_dev_pass123 psql -h localhost -U toluai_dev -d toluai_dev -c "SELECT 1" >/dev/null 2>&1; then
        print_success "Database is accessible"
    else
        print_warning "Database connection failed"
    fi
}

# Main setup flow
main() {
    detect_os
    
    # Ask user for setup preference
    echo ""
    echo "Choose your setup method:"
    echo "1) Local development (recommended for development)"
    echo "2) Docker containers (easier, but slower for development)"
    echo "3) Hybrid (database in Docker, apps local)"
    read -p "Enter choice [1-3]: " choice
    
    case $choice in
        1)
            print_status "Setting up local development environment..."
            install_system_dependencies
            create_env_files
            setup_python_env
            setup_node_env
            setup_database
            initialize_app
            
            # Start services
            print_status "Starting services..."
            
            # Start backend
            source venv/bin/activate
            python run_dev.py &
            BACKEND_PID=$!
            
            # Start frontend
            cd frontend
            npm run dev &
            FRONTEND_PID=$!
            cd ..
            
            sleep 5
            health_check
            
            print_success "Setup complete!"
            echo ""
            echo "=========================================="
            echo "   ToluAI is ready for development!      "
            echo "=========================================="
            echo ""
            echo "🌐 Frontend: http://localhost:5173"
            echo "🔧 Backend:  http://localhost:5001"
            echo "📚 API Docs: http://localhost:5001/api/docs"
            echo ""
            echo "📧 Admin login: admin@toluai.com"
            echo "🔑 Password: Admin123!"
            echo ""
            echo "To stop services: Press Ctrl+C"
            
            # Wait for user to stop
            wait $BACKEND_PID $FRONTEND_PID
            ;;
            
        2)
            print_status "Setting up Docker environment..."
            create_env_files
            setup_with_docker
            health_check
            
            print_success "Setup complete!"
            echo ""
            echo "=========================================="
            echo "   ToluAI is ready in Docker!            "
            echo "=========================================="
            echo ""
            echo "🌐 Frontend: http://localhost:5173"
            echo "🔧 Backend:  http://localhost:5001"
            echo "📚 API Docs: http://localhost:5001/api/docs"
            echo ""
            echo "📧 Admin login: admin@toluai.com"
            echo "🔑 Password: Admin123!"
            echo ""
            echo "To stop: docker-compose -f docker-compose.dev.yml down"
            echo "To view logs: docker-compose -f docker-compose.dev.yml logs -f"
            ;;
            
        3)
            print_status "Setting up hybrid environment..."
            
            # Start only database and redis in Docker
            docker-compose -f docker-compose.dev.yml up -d postgres redis
            
            sleep 5
            
            create_env_files
            setup_python_env
            setup_node_env
            initialize_app
            
            # Start services locally
            source venv/bin/activate
            python run_dev.py &
            BACKEND_PID=$!
            
            cd frontend
            npm run dev &
            FRONTEND_PID=$!
            cd ..
            
            sleep 5
            health_check
            
            print_success "Hybrid setup complete!"
            echo ""
            echo "=========================================="
            echo "   ToluAI Hybrid Environment Ready!      "
            echo "=========================================="
            echo ""
            echo "🌐 Frontend: http://localhost:5173"
            echo "🔧 Backend:  http://localhost:5001"
            echo "🗄️ Database: Docker container"
            echo "📚 API Docs: http://localhost:5001/api/docs"
            echo ""
            echo "📧 Admin login: admin@toluai.com"
            echo "🔑 Password: Admin123!"
            echo ""
            
            wait $BACKEND_PID $FRONTEND_PID
            ;;
            
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Run main function
main