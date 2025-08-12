# ToluAI Deployment Guide

## 🚀 Production Deployment

This guide covers deploying ToluAI to production environments.

## Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (optional)
- Nginx or similar reverse proxy

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/toluai.git
cd toluai
```

### 2. Backend Setup

#### Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Configure Environment Variables
```bash
cp .env.example .env
# Edit .env with production values
```

**Important Production Settings:**
- Set `FLASK_ENV=production`
- Set `DEBUG=False`
- Generate strong `SECRET_KEY` and `JWT_SECRET_KEY`
- Configure production database URL
- Set appropriate CORS origins

#### Database Setup
```bash
# Create database
createdb toluai_prod

# Run migrations
flask db upgrade

# Initialize reference data
flask init-reference-data

# Create admin user
flask create-admin
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with production API URL
```

#### Build for Production
```bash
npm run build
# Output will be in frontend/dist/
```

### 4. Docker Deployment (Recommended)

```bash
# Build and start services
docker-compose -f docker-compose.yml up -d

# Check logs
docker-compose logs -f

# Scale workers if needed
docker-compose up -d --scale worker=3
```

## Web Server Configuration

### Nginx Configuration

Create `/etc/nginx/sites-available/toluai`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend
    location / {
        root /var/www/toluai/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Backend
    location /api {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # File uploads
    client_max_body_size 20M;
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/toluai /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Process Management

### Using Systemd

Create `/etc/systemd/system/toluai.service`:

```ini
[Unit]
Description=ToluAI Backend
After=network.target postgresql.service redis.service

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/var/www/toluai
Environment="PATH=/var/www/toluai/venv/bin"
ExecStart=/var/www/toluai/venv/bin/gunicorn \
    --workers 4 \
    --worker-class gevent \
    --bind 127.0.0.1:5001 \
    --timeout 120 \
    --log-file /var/log/toluai/gunicorn.log \
    --access-logfile /var/log/toluai/access.log \
    wsgi:app
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
systemctl enable toluai
systemctl start toluai
systemctl status toluai
```

### Using Supervisor (Alternative)

Create `/etc/supervisor/conf.d/toluai.conf`:

```ini
[program:toluai]
command=/var/www/toluai/venv/bin/gunicorn --workers 4 --bind 127.0.0.1:5001 wsgi:app
directory=/var/www/toluai
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/toluai/supervisor.log
environment=PATH="/var/www/toluai/venv/bin",FLASK_ENV="production"
```

## Database Backup

### Automated Backups

Create `/usr/local/bin/backup-toluai.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/toluai"
DB_NAME="toluai_prod"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

Add to crontab:
```bash
0 2 * * * /usr/local/bin/backup-toluai.sh
```

## Monitoring

### Health Check Endpoint

The API provides health check at `/api/health`:

```bash
curl https://your-domain.com/api/health
```

### Logging

- Application logs: `/var/log/toluai/app.log`
- Access logs: `/var/log/toluai/access.log`
- Error logs: `/var/log/toluai/error.log`

### Monitoring Tools

Recommended monitoring setup:
- **Prometheus** + **Grafana** for metrics
- **Sentry** for error tracking
- **New Relic** or **DataDog** for APM

## Security Checklist

- [ ] SSL/TLS certificate configured
- [ ] Strong passwords for database
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] File upload restrictions
- [ ] SQL injection protection
- [ ] XSS protection headers
- [ ] CSRF protection enabled
- [ ] Regular security updates

## Performance Optimization

### Database
- Create indexes for frequently queried fields
- Enable query caching
- Use connection pooling

### Redis
- Configure maxmemory policy
- Enable persistence if needed

### Frontend
- Enable gzip compression
- Use CDN for static assets
- Implement lazy loading

### Backend
- Use caching for expensive operations
- Implement pagination
- Optimize database queries

## Scaling

### Horizontal Scaling

1. **Load Balancer**: Use HAProxy or Nginx
2. **Multiple App Servers**: Deploy on multiple servers
3. **Database Replication**: Master-slave setup
4. **Redis Cluster**: For session and cache distribution

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database performance
- Use faster storage (SSD)

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check PostgreSQL is running
   - Verify connection string
   - Check firewall rules

2. **Permission Errors**
   - Ensure correct file ownership
   - Check directory permissions

3. **Memory Issues**
   - Adjust worker count
   - Monitor memory usage
   - Enable swap if needed

### Debug Mode

For debugging production issues:
```bash
# Temporarily enable debug mode (be careful!)
export FLASK_DEBUG=1
flask run --host=0.0.0.0 --port=5001
```

## Rollback Procedure

1. Backup current database
2. Note current version
3. Deploy previous version
4. Restore database if needed
5. Clear caches

## Support

For deployment support:
- Documentation: `/docs`
- Issues: GitHub Issues
- Email: support@toluai.com

## Version History

- v1.0.0 - Initial release with core features
  - Company enrichment
  - Risk assessment (PRA/IPRA)
  - PostgreSQL integration
  - Enhanced UI/UX

---

Last Updated: August 2024# ToluAI Deployment Guide

## Overview

This guide covers various deployment strategies for the ToluAI Insurance Risk Assessment Platform, from development to production environments.

## Quick Deployment Options

### Option 1: Docker Compose (Recommended)
```bash
# Clone repository
git clone https://github.com/your-org/toluai.git
cd toluai

# Configure environment
cp .env.example .env
# Edit .env with your production values

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Initialize database
docker-compose exec web flask db upgrade
docker-compose exec web flask create-admin
```

### Option 2: Manual Deployment
```bash
# Install dependencies and run services
pip install -r requirements.txt
cd frontend && npm install && npm run build

# Configure production environment
export FLASK_ENV=production
export DATABASE_URI=postgresql://user:pass@localhost/toluai

# Run with production server
gunicorn -c gunicorn.conf.py wsgi:app
```

## Environment Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=your-super-secret-production-key-here
WTF_CSRF_SECRET_KEY=another-secret-key-for-csrf

# Database Configuration
DATABASE_URI=postgresql://toluai_user:secure_password@localhost:5432/toluai_prod

# Security Configuration
SECURITY_PASSWORD_SALT=your-password-salt-here
JWT_SECRET_KEY=jwt-secret-key-different-from-main

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379/0

# Email Configuration
MAIL_SERVER=smtp.example.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@example.com
MAIL_PASSWORD=your-email-password
MAIL_DEFAULT_SENDER=noreply@toluai.com

# External Services
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Rate Limiting
RATELIMIT_STORAGE_URL=redis://localhost:6379/1
```

### Configuration Classes

The application uses different configurations for different environments:

```python
# config/config.py
class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    DATABASE_URI = os.environ.get('DATABASE_URI')
    SSL_DISABLE = False
    WTF_CSRF_ENABLED = True
```

## Database Setup

### PostgreSQL Setup (Recommended)

1. **Install PostgreSQL**:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib

# macOS
brew install postgresql
```

2. **Create Database and User**:
```sql
-- Connect as postgres user
sudo -u postgres psql

-- Create database and user
CREATE DATABASE toluai_prod;
CREATE USER toluai_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE toluai_prod TO toluai_user;
ALTER USER toluai_user CREATEDB;  -- For running tests
\q
```

3. **Initialize Database**:
```bash
export DATABASE_URI=postgresql://toluai_user:secure_password@localhost:5432/toluai_prod
flask db upgrade
flask create-admin
```

### MySQL Setup (Alternative)

```sql
CREATE DATABASE toluai_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'toluai_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON toluai_prod.* TO 'toluai_user'@'localhost';
FLUSH PRIVILEGES;
```

Environment variable:
```bash
DATABASE_URI=mysql://toluai_user:secure_password@localhost/toluai_prod
```

## Web Server Configuration

### Nginx Configuration

Create `/etc/nginx/sites-available/toluai`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend Static Files
    location / {
        root /var/www/toluai/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Admin Interface
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/toluai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Apache Configuration (Alternative)

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/your-domain.com/cert.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/your-domain.com/privkey.pem
    SSLCertificateChainFile /etc/letsencrypt/live/your-domain.com/chain.pem
    
    # Document Root for React Frontend
    DocumentRoot /var/www/toluai/frontend/dist
    
    # API Proxy
    ProxyPreserveHost On
    ProxyPass /api/ http://127.0.0.1:8000/api/
    ProxyPassReverse /api/ http://127.0.0.1:8000/api/
    
    # Admin Interface
    ProxyPass /admin/ http://127.0.0.1:8000/admin/
    ProxyPassReverse /admin/ http://127.0.0.1:8000/admin/
    
    # Handle React Router
    <Directory "/var/www/toluai/frontend/dist">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

## Application Server Configuration

### Gunicorn Configuration

Create `gunicorn.conf.py`:

```python
import multiprocessing
import os

# Server socket
bind = "127.0.0.1:8000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Restart workers after this many requests
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = "/var/log/toluai/access.log"
errorlog = "/var/log/toluai/error.log"
loglevel = "info"

# Process naming
proc_name = "toluai"

# User/group to run as
user = "toluai"
group = "toluai"

# Preload application
preload_app = True

# Environment variables
raw_env = [
    "FLASK_ENV=production",
    f"DATABASE_URI={os.environ.get('DATABASE_URI')}",
    f"SECRET_KEY={os.environ.get('SECRET_KEY')}",
]
```

### Systemd Service

Create `/etc/systemd/system/toluai.service`:

```ini
[Unit]
Description=ToluAI Insurance Risk Assessment Platform
After=network.target postgresql.service

[Service]
Type=exec
User=toluai
Group=toluai
WorkingDirectory=/var/www/toluai
Environment=PATH=/var/www/toluai/venv/bin
EnvironmentFile=/var/www/toluai/.env
ExecStart=/var/www/toluai/venv/bin/gunicorn -c gunicorn.conf.py wsgi:app
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable toluai.service
sudo systemctl start toluai.service
sudo systemctl status toluai.service
```

## Docker Deployment

### Production Dockerfile

```dockerfile
# Multi-stage build for React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production

COPY frontend/ ./
RUN npm run build

# Python backend
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r toluai && useradd -r -g toluai toluai

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY config/ ./config/
COPY migrations/ ./migrations/
COPY wsgi.py gunicorn.conf.py ./

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./app/static/

# Change ownership
RUN chown -R toluai:toluai /app
USER toluai

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["gunicorn", "-c", "gunicorn.conf.py", "wsgi:app"]
```

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: toluai_prod
      POSTGRES_USER: toluai_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db_backup:/backup
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U toluai_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  web:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - FLASK_ENV=production
      - DATABASE_URI=postgresql://toluai_user:${DB_PASSWORD}@db:5432/toluai_prod
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - WTF_CSRF_SECRET_KEY=${WTF_CSRF_SECRET_KEY}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "8000:8000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
      - nginx_logs:/var/log/nginx
    depends_on:
      - web
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  nginx_logs:
```

## Cloud Deployment

### AWS Deployment

#### Using AWS ECS

1. **Create ECR Repository**:
```bash
aws ecr create-repository --repository-name toluai
```

2. **Build and Push Image**:
```bash
# Get login token
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-west-2.amazonaws.com

# Build and tag image
docker build -t toluai .
docker tag toluai:latest 123456789012.dkr.ecr.us-west-2.amazonaws.com/toluai:latest

# Push image
docker push 123456789012.dkr.ecr.us-west-2.amazonaws.com/toluai:latest
```

3. **Create ECS Task Definition** (`task-definition.json`):
```json
{
  "family": "toluai-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "toluai",
      "image": "123456789012.dkr.ecr.us-west-2.amazonaws.com/toluai:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "FLASK_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-west-2:123456789012:secret:toluai-secrets"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/toluai",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Using AWS RDS

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
    --db-instance-identifier toluai-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username toluai_user \
    --master-user-password secure_password \
    --allocated-storage 20 \
    --storage-type gp2 \
    --vpc-security-group-ids sg-12345678 \
    --db-subnet-group-name toluai-subnet-group
```

### Google Cloud Platform

#### Using Cloud Run

1. **Build and Deploy**:
```bash
# Configure gcloud
gcloud config set project your-project-id

# Build and submit
gcloud builds submit --tag gcr.io/your-project-id/toluai

# Deploy to Cloud Run
gcloud run deploy toluai \
    --image gcr.io/your-project-id/toluai \
    --platform managed \
    --region us-central1 \
    --set-env-vars FLASK_ENV=production \
    --set-env-vars DATABASE_URI=postgresql://user:pass@/toluai?host=/cloudsql/project:region:instance
```

2. **Cloud SQL Setup**:
```bash
# Create Cloud SQL instance
gcloud sql instances create toluai-db \
    --database-version POSTGRES_14 \
    --tier db-f1-micro \
    --region us-central1

# Create database and user
gcloud sql databases create toluai --instance toluai-db
gcloud sql users create toluai_user --instance toluai-db --password secure_password
```

### Azure Deployment

#### Using Container Instances

```bash
# Create resource group
az group create --name toluai-rg --location eastus

# Create container instance
az container create \
    --resource-group toluai-rg \
    --name toluai-app \
    --image your-registry/toluai:latest \
    --cpu 1 \
    --memory 1.5 \
    --ports 8000 \
    --environment-variables FLASK_ENV=production \
    --secure-environment-variables SECRET_KEY=your-secret-key
```

## SSL Certificate Setup

### Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Set up automatic renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL Certificate

If using a purchased SSL certificate:

```bash
# Copy certificate files
sudo cp your-domain.crt /etc/ssl/certs/
sudo cp your-domain.key /etc/ssl/private/
sudo cp ca-bundle.crt /etc/ssl/certs/

# Set proper permissions
sudo chmod 644 /etc/ssl/certs/your-domain.crt
sudo chmod 600 /etc/ssl/private/your-domain.key
```

## Monitoring and Logging

### Log Management

Create log directories:
```bash
sudo mkdir -p /var/log/toluai
sudo chown toluai:toluai /var/log/toluai
```

Configure log rotation (`/etc/logrotate.d/toluai`):
```
/var/log/toluai/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 toluai toluai
    postrotate
        systemctl reload toluai
    endscript
}
```

### Health Checks

Create monitoring script:
```bash
#!/bin/bash
# /usr/local/bin/health-check.sh

HEALTH_URL="https://your-domain.com/api/v1/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$RESPONSE" -eq 200 ]; then
    echo "✓ Application is healthy"
    exit 0
else
    echo "✗ Application is unhealthy (HTTP $RESPONSE)"
    exit 1
fi
```

### Backup Strategy

Database backup script:
```bash
#!/bin/bash
# /usr/local/bin/backup-db.sh

BACKUP_DIR="/var/backups/toluai"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="toluai_prod"
DB_USER="toluai_user"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Perform backup
pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$BACKUP_DIR/toluai_backup_$TIMESTAMP.sql.gz"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "toluai_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: toluai_backup_$TIMESTAMP.sql.gz"
```

Set up cron job:
```bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-db.sh
```

## Security Checklist

- [ ] **SSL/TLS enabled** with strong ciphers
- [ ] **Firewall configured** to allow only necessary ports
- [ ] **Database credentials** stored securely
- [ ] **Secret keys** are random and unique
- [ ] **File permissions** set correctly
- [ ] **Security headers** configured in web server
- [ ] **Rate limiting** enabled
- [ ] **CSRF protection** active
- [ ] **Input validation** implemented
- [ ] **Logging** configured for security events
- [ ] **Regular updates** scheduled
- [ ] **Backup strategy** implemented

## Troubleshooting

### Common Deployment Issues

1. **Database Connection Errors**:
   - Check DATABASE_URI format
   - Verify database server is running
   - Test connectivity from application server

2. **Permission Issues**:
   - Ensure proper file ownership
   - Check systemd service user/group
   - Verify directory permissions

3. **SSL Certificate Problems**:
   - Check certificate validity
   - Verify DNS configuration
   - Test with SSL checker tools

4. **Application Won't Start**:
   - Check application logs
   - Verify all environment variables
   - Test configuration locally

### Performance Optimization

1. **Database Optimization**:
   - Add indexes for frequently queried fields
   - Configure connection pooling
   - Monitor query performance

2. **Application Tuning**:
   - Adjust Gunicorn worker count
   - Enable application-level caching
   - Optimize database queries

3. **Web Server Optimization**:
   - Enable gzip compression
   - Configure proper caching headers
   - Use CDN for static assets