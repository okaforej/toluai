#!/bin/bash

# PostgreSQL Setup Script for ToluAI
# This script automatically sets up PostgreSQL for development, testing, or production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_ROOT}/.env"
ENV_EXAMPLE="${PROJECT_ROOT}/.env.postgres"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if PostgreSQL is running
is_postgres_running() {
    if command_exists docker; then
        docker ps | grep -q "toluai-postgres" 2>/dev/null
    else
        pg_isready -h localhost -p 5432 >/dev/null 2>&1
    fi
}

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    local max_attempts=30
    local attempt=0
    
    print_info "Waiting for PostgreSQL to be ready..."
    
    while [ $attempt -lt $max_attempts ]; do
        if pg_isready -h localhost -p 5432 -U toluai_dev >/dev/null 2>&1; then
            print_info "PostgreSQL is ready!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    print_error "PostgreSQL failed to start after $max_attempts attempts"
    return 1
}

# Function to setup environment file
setup_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_info "Creating .env file from template..."
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        
        # Generate secure keys for production
        if [ "$1" == "production" ]; then
            print_info "Generating secure keys for production..."
            SECRET_KEY=$(openssl rand -hex 32)
            JWT_SECRET=$(openssl rand -hex 32)
            PASSWORD_SALT=$(openssl rand -hex 16)
            
            # Update .env with secure keys
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s/dev-secret-key-change-in-production-.*/$SECRET_KEY/" "$ENV_FILE"
                sed -i '' "s/dev-jwt-secret-change-in-production-.*/$JWT_SECRET/" "$ENV_FILE"
                sed -i '' "s/dev-salt-change-in-production-.*/$PASSWORD_SALT/" "$ENV_FILE"
            else
                # Linux
                sed -i "s/dev-secret-key-change-in-production-.*/$SECRET_KEY/" "$ENV_FILE"
                sed -i "s/dev-jwt-secret-change-in-production-.*/$JWT_SECRET/" "$ENV_FILE"
                sed -i "s/dev-salt-change-in-production-.*/$PASSWORD_SALT/" "$ENV_FILE"
            fi
        fi
        
        print_info ".env file created. Please review and update database credentials if needed."
    else
        print_warning ".env file already exists. Skipping creation."
    fi
}

# Function to install PostgreSQL locally
install_postgres_local() {
    print_info "Installing PostgreSQL locally..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew install postgresql@15
            brew services start postgresql@15
        else
            print_error "Homebrew is not installed. Please install Homebrew first."
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command_exists apt-get; then
            # Ubuntu/Debian
            sudo apt-get update
            sudo apt-get install -y postgresql-15 postgresql-client-15 postgresql-contrib-15
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
        elif command_exists yum; then
            # CentOS/RHEL
            sudo yum install -y postgresql15-server postgresql15
            sudo postgresql-15-setup initdb
            sudo systemctl start postgresql-15
            sudo systemctl enable postgresql-15
        else
            print_error "Unsupported Linux distribution"
            exit 1
        fi
    else
        print_error "Unsupported operating system"
        exit 1
    fi
}

# Function to setup PostgreSQL with Docker
setup_docker_postgres() {
    print_info "Setting up PostgreSQL with Docker..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        print_info "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_warning "docker-compose not found, trying docker compose..."
        if ! docker compose version >/dev/null 2>&1; then
            print_error "Neither docker-compose nor 'docker compose' is available."
            print_info "Please install Docker Compose: https://docs.docker.com/compose/install/"
            exit 1
        fi
        DOCKER_COMPOSE="docker compose"
    else
        DOCKER_COMPOSE="docker-compose"
    fi
    
    # Start PostgreSQL container
    print_info "Starting PostgreSQL container..."
    cd "$PROJECT_ROOT"
    $DOCKER_COMPOSE -f docker-compose.dev.yml up -d postgres redis
    
    # Wait for PostgreSQL to be ready
    wait_for_postgres
}

# Function to create database and run migrations
setup_database() {
    print_info "Setting up database schema..."
    
    # Load environment variables
    if [ -f "$ENV_FILE" ]; then
        export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
    fi
    
    # Check if database exists
    if PGPASSWORD="${POSTGRES_PASSWORD:-toluai_dev_pass123}" psql -h localhost -U "${POSTGRES_USER:-toluai_dev}" -lqt | cut -d \| -f 1 | grep -qw "${POSTGRES_DB:-toluai_dev}"; then
        print_info "Database ${POSTGRES_DB:-toluai_dev} already exists"
    else
        print_info "Creating database ${POSTGRES_DB:-toluai_dev}..."
        PGPASSWORD="${POSTGRES_PASSWORD:-toluai_dev_pass123}" createdb -h localhost -U "${POSTGRES_USER:-toluai_dev}" "${POSTGRES_DB:-toluai_dev}"
    fi
    
    # Run initialization scripts
    if [ -f "${SCRIPT_DIR}/init_extensions.sql" ]; then
        print_info "Installing PostgreSQL extensions..."
        PGPASSWORD="${POSTGRES_PASSWORD:-toluai_dev_pass123}" psql -h localhost -U "${POSTGRES_USER:-toluai_dev}" -d "${POSTGRES_DB:-toluai_dev}" -f "${SCRIPT_DIR}/init_extensions.sql"
    fi
    
    if [ -f "${SCRIPT_DIR}/init_db.sql" ]; then
        print_info "Creating database schema..."
        PGPASSWORD="${POSTGRES_PASSWORD:-toluai_dev_pass123}" psql -h localhost -U "${POSTGRES_USER:-toluai_dev}" -d "${POSTGRES_DB:-toluai_dev}" -f "${SCRIPT_DIR}/init_db.sql"
    fi
    
    print_info "Database setup completed!"
}

# Function to run Flask migrations
run_migrations() {
    print_info "Running Flask database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Activate virtual environment if it exists
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    fi
    
    # Check if Flask-Migrate is initialized
    if [ ! -d "migrations" ]; then
        print_info "Initializing Flask-Migrate..."
        flask db init
    fi
    
    # Create and apply migrations
    print_info "Creating migration..."
    flask db migrate -m "PostgreSQL setup"
    
    print_info "Applying migrations..."
    flask db upgrade
    
    print_info "Migrations completed!"
}

# Function to test database connection
test_connection() {
    print_info "Testing database connection..."
    
    python3 <<EOF
import os
import sys
from sqlalchemy import create_engine

try:
    db_uri = os.getenv('DATABASE_URI', 'postgresql://toluai_dev:toluai_dev_pass123@localhost:5432/toluai_dev')
    engine = create_engine(db_uri)
    with engine.connect() as conn:
        result = conn.execute("SELECT version()")
        version = result.scalar()
        print(f"✓ Successfully connected to PostgreSQL")
        print(f"  Database version: {version}")
except Exception as e:
    print(f"✗ Failed to connect to database: {e}")
    sys.exit(1)
EOF
}

# Main setup function
main() {
    print_info "ToluAI PostgreSQL Setup Script"
    print_info "=============================="
    
    # Parse command line arguments
    SETUP_MODE="${1:-docker}"  # Default to docker
    ENVIRONMENT="${2:-development}"  # Default to development
    
    print_info "Setup mode: $SETUP_MODE"
    print_info "Environment: $ENVIRONMENT"
    
    # Setup environment file
    setup_env_file "$ENVIRONMENT"
    
    # Check if PostgreSQL is already running
    if is_postgres_running; then
        print_warning "PostgreSQL appears to be already running"
        read -p "Do you want to continue with the setup? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Setup cancelled"
            exit 0
        fi
    fi
    
    # Setup PostgreSQL based on mode
    case "$SETUP_MODE" in
        docker)
            setup_docker_postgres
            ;;
        local)
            if ! command_exists psql; then
                install_postgres_local
            fi
            wait_for_postgres
            ;;
        skip)
            print_info "Skipping PostgreSQL installation (assuming it's already installed)"
            ;;
        *)
            print_error "Invalid setup mode: $SETUP_MODE"
            print_info "Usage: $0 [docker|local|skip] [development|testing|production]"
            exit 1
            ;;
    esac
    
    # Setup database
    setup_database
    
    # Run migrations if Flask app exists
    if [ -f "${PROJECT_ROOT}/app.py" ] || [ -f "${PROJECT_ROOT}/wsgi.py" ]; then
        run_migrations
    fi
    
    # Test connection
    test_connection
    
    print_info ""
    print_info "=========================================="
    print_info "PostgreSQL setup completed successfully!"
    print_info "=========================================="
    print_info ""
    print_info "Database connection string:"
    print_info "  postgresql://toluai_dev:toluai_dev_pass123@localhost:5432/toluai_dev"
    print_info ""
    print_info "pgAdmin (if using Docker):"
    print_info "  URL: http://localhost:5050"
    print_info "  Email: admin@toluai.local"
    print_info "  Password: admin123"
    print_info ""
    print_info "To start the application:"
    print_info "  python run_simple.py"
    print_info ""
    print_info "To stop PostgreSQL (Docker):"
    print_info "  docker-compose -f docker-compose.dev.yml down"
    print_info ""
}

# Run main function
main "$@"