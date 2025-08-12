# PostgreSQL Setup Guide for ToluAI

## Overview
This guide provides comprehensive instructions for setting up PostgreSQL for the ToluAI Insurance Risk Platform. PostgreSQL is used as the primary database for development, testing, and production environments.

## Quick Start

### Automatic Setup (Recommended)
The easiest way to get started is using our automatic setup script:

```bash
# Using Docker (recommended)
./scripts/setup_postgres.sh docker

# Using local PostgreSQL installation
./scripts/setup_postgres.sh local

# For production environment
./scripts/setup_postgres.sh docker production
```

### Python Auto-Setup
Alternatively, use the Python setup script that automatically detects and configures PostgreSQL:

```bash
# Auto-setup and start PostgreSQL if needed
python scripts/check_postgres.py

# Health check only
python scripts/check_postgres.py health
```

## Setup Methods

### Method 1: Docker Setup (Recommended for Development)

1. **Prerequisites**
   - Docker installed: [Get Docker](https://docs.docker.com/get-docker/)
   - Docker Compose installed: [Install Docker Compose](https://docs.docker.com/compose/install/)

2. **Start PostgreSQL with Docker Compose**
   ```bash
   # Start PostgreSQL and Redis
   docker-compose -f docker-compose.dev.yml up -d

   # Check status
   docker-compose -f docker-compose.dev.yml ps

   # View logs
   docker-compose -f docker-compose.dev.yml logs postgres
   ```

3. **Access pgAdmin (Web UI)**
   - URL: http://localhost:5050
   - Email: admin@toluai.local
   - Password: admin123

### Method 2: Local PostgreSQL Installation

1. **Install PostgreSQL**
   
   **macOS:**
   ```bash
   brew install postgresql@15
   brew services start postgresql@15
   ```
   
   **Ubuntu/Debian:**
   ```bash
   sudo apt-get update
   sudo apt-get install postgresql-15 postgresql-client-15
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```
   
   **CentOS/RHEL:**
   ```bash
   sudo yum install postgresql15-server postgresql15
   sudo postgresql-15-setup initdb
   sudo systemctl start postgresql-15
   sudo systemctl enable postgresql-15
   ```

2. **Create Database and User**
   ```bash
   sudo -u postgres psql
   
   CREATE USER toluai_dev WITH PASSWORD 'toluai_dev_pass123';
   CREATE DATABASE toluai_dev OWNER toluai_dev;
   GRANT ALL PRIVILEGES ON DATABASE toluai_dev TO toluai_dev;
   \q
   ```

### Method 3: Production Setup with Docker

1. **Copy and configure environment file**
   ```bash
   cp .env.postgres .env
   # Edit .env and update with production values
   ```

2. **Generate secure keys**
   ```bash
   # Generate secure secret keys
   openssl rand -hex 32  # For SECRET_KEY
   openssl rand -hex 32  # For JWT_SECRET_KEY
   openssl rand -hex 16  # For SECURITY_PASSWORD_SALT
   ```

3. **Start production stack**
   ```bash
   docker-compose up -d
   ```

## Configuration

### Environment Variables
Create a `.env` file in the project root (use `.env.postgres` as template):

```env
# Database Configuration
DATABASE_URI=postgresql://toluai_dev:toluai_dev_pass123@localhost:5432/toluai_dev
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=toluai_dev
POSTGRES_USER=toluai_dev
POSTGRES_PASSWORD=toluai_dev_pass123

# Database Pool Settings
DB_POOL_SIZE=20
DB_POOL_RECYCLE=3600
DB_MAX_OVERFLOW=30

# Redis Configuration
REDIS_URL=redis://:redis_dev_pass123@localhost:6379/0
```

### Application Configuration
The application automatically detects and uses PostgreSQL when `DATABASE_URI` is set. The configuration is handled in `backend/utilities/config.py`.

## Database Schema

### Initial Schema
The database schema includes:
- **Users**: User authentication and authorization
- **Clients**: Customer information
- **Insurance Applications**: Application tracking
- **Risk Assessments**: AI/ML risk evaluations
- **Audit Log**: Activity tracking
- **Sessions**: User session management
- **Permissions**: Role-based access control

### Migrations
Run database migrations using Flask-Migrate:

```bash
# Initialize migrations (first time only)
flask db init

# Create a new migration
flask db migrate -m "Description of changes"

# Apply migrations
flask db upgrade

# Rollback migrations
flask db downgrade
```

## Testing Database Connection

### Using Python
```python
python scripts/check_postgres.py health
```

### Using psql
```bash
PGPASSWORD=toluai_dev_pass123 psql -h localhost -U toluai_dev -d toluai_dev -c "SELECT version();"
```

### Using the Application
```bash
# The application will automatically check and setup PostgreSQL on startup
python run_simple.py
```

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Check if PostgreSQL is running: `docker ps` or `pg_isready`
   - Verify port 5432 is not in use: `lsof -i :5432`

2. **Authentication failed**
   - Check credentials in `.env` file
   - Verify PostgreSQL user exists: `\du` in psql

3. **Database does not exist**
   - Run setup script: `./scripts/setup_postgres.sh`
   - Or create manually: `createdb toluai_dev`

4. **Docker issues**
   - Ensure Docker daemon is running
   - Check Docker Compose version compatibility
   - Clear volumes if needed: `docker-compose -f docker-compose.dev.yml down -v`

### Reset Database
```bash
# Stop containers and remove volumes
docker-compose -f docker-compose.dev.yml down -v

# Restart and reinitialize
./scripts/setup_postgres.sh docker
```

## Maintenance

### Backup Database
```bash
# Backup
pg_dump -h localhost -U toluai_dev -d toluai_dev > backup.sql

# Backup with Docker
docker exec toluai-postgres-dev pg_dump -U toluai_dev toluai_dev > backup.sql
```

### Restore Database
```bash
# Restore
psql -h localhost -U toluai_dev -d toluai_dev < backup.sql

# Restore with Docker
docker exec -i toluai-postgres-dev psql -U toluai_dev toluai_dev < backup.sql
```

### Monitor Performance
```sql
-- Check database size
SELECT pg_database_size('toluai_dev') / 1024 / 1024 as size_mb;

-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

## Security Best Practices

1. **Production Environment**
   - Always use strong, unique passwords
   - Enable SSL/TLS connections
   - Restrict network access
   - Regular security updates
   - Enable audit logging

2. **Connection Security**
   ```env
   # Production DATABASE_URI with SSL
   DATABASE_URI=postgresql://user:pass@host:5432/db?sslmode=require
   ```

3. **User Permissions**
   - Create specific users for different services
   - Grant minimal required permissions
   - Regular permission audits

## Integration with Application

The application automatically:
1. Checks PostgreSQL availability on startup
2. Attempts to start PostgreSQL via Docker if not running
3. Initializes database schema if needed
4. Handles connection pooling and retries
5. Provides health check endpoints

### Health Check Endpoint
```bash
curl http://localhost:5000/health
```

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Flask-SQLAlchemy Documentation](https://flask-sqlalchemy.palletsprojects.com/)
- [Flask-Migrate Documentation](https://flask-migrate.readthedocs.io/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review application logs: `docker-compose -f docker-compose.dev.yml logs`
3. Check PostgreSQL logs: `docker logs toluai-postgres-dev`
4. Consult the main README.md for general setup instructions