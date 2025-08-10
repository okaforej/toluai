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

Last Updated: August 2024