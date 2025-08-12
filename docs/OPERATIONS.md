# Operations Guide

## Deployment

### Quick Deploy
```bash
# Production
docker-compose up -d

# With environment
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
Required in production:
- `DATABASE_URL` - PostgreSQL connection
- `SECRET_KEY` - Random 32+ char string  
- `REDIS_URL` - Redis connection
- `ALLOWED_HOSTS` - Domain names

### Health Checks
- `/health` - Service status
- `/metrics` - Prometheus metrics
- `/ready` - Readiness probe

## Monitoring

### Logs
```bash
# Application logs
docker logs toluai-backend -f

# Combined logs
docker-compose logs -f
```

### Metrics
Prometheus endpoints exposed at `/metrics`:
- Request latency
- Error rates
- Database connections
- Cache hit ratio

### Alerts
Key metrics to monitor:
- Response time > 1s
- Error rate > 1%
- Memory usage > 80%
- Database connections > 90%

## Troubleshooting

### Common Issues

**Database connection failed:**
```bash
# Check PostgreSQL
docker exec -it postgres psql -U toluai_dev -c "SELECT 1"

# Reset connections
docker-compose restart backend
```

**High memory usage:**
```bash
# Check processes
docker stats

# Restart services
docker-compose restart
```

**Slow queries:**
```sql
-- Find slow queries
SELECT query, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;
```

### Backup & Recovery

**Database backup:**
```bash
# Backup
docker exec postgres pg_dump -U toluai_dev toluai_dev > backup.sql

# Restore
docker exec -i postgres psql -U toluai_dev toluai_dev < backup.sql
```

**File backup:**
```bash
# Backup uploads
tar -czf uploads-$(date +%Y%m%d).tar.gz uploads/

# Restore
tar -xzf uploads-20240101.tar.gz
```

## Scaling

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
  
  nginx:
    depends_on:
      - backend
```

### Performance Tuning
```python
# gunicorn.conf.py
workers = 4
worker_class = 'gevent'
worker_connections = 1000
```

### Cache Strategy
- Session data: Redis, 24h TTL
- API responses: Redis, 5min TTL
- Static files: CDN, 1 year TTL

## CI/CD

GitHub Actions workflow runs:
1. **Tests** - Unit, integration, E2E
2. **Security** - Trivy, Bandit, npm audit
3. **Build** - Docker image creation
4. **Deploy** - Staging → Production

Manual deployment:
```bash
git push origin main  # Triggers CI/CD
# OR
make deploy-prod     # Direct deployment
```