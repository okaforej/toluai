# Technical Documentation

## API Reference

Base URL: `http://localhost:5001/api/v2`

### Authentication
```http
POST /auth/login
Body: { "email": "user@example.com", "password": "pass123" }
Returns: { "token": "jwt...", "user": {...} }
```

### IRPA Endpoints
```http
GET    /irpa/insured-entities?page=1&per_page=20
POST   /irpa/insured-entities
PUT    /irpa/insured-entities/{id}
DELETE /irpa/insured-entities/{id}

POST   /irpa/assessments
GET    /irpa/assessments/{id}

GET    /irpa/analytics/risk-distribution
GET    /irpa/analytics/assessment-trends
```

### Response Format
```json
{
  "data": {...},
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

## Architecture

### System Overview
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│  Flask API  │────▶│ PostgreSQL  │
│   Frontend  │     │   Backend   │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │    Redis    │
                    │    Cache    │
                    └─────────────┘
```

### Frontend Stack
- **React 18** + TypeScript + Vite
- **State:** Context API (auth), React Query (server)
- **UI:** TailwindCSS, Headless UI
- **Charts:** Recharts, Leaflet (maps)

### Backend Stack
- **Flask 3.0** + SQLAlchemy
- **Auth:** JWT tokens + RBAC
- **Caching:** Redis (sessions, API responses)
- **Queue:** Celery (async tasks)

### Database Schema

```sql
-- Core Tables
users (id, email, password_hash, roles)
companies (id, name, industry_type, state)
insured_entities (id, company_id, name, fico_score, dti_ratio)
risk_assessments (id, entity_id, risk_score, risk_category)

-- Relationships
users ←→ companies (many-to-many)
companies → insured_entities (one-to-many)
insured_entities → risk_assessments (one-to-many)
```

## Security

### Authentication Flow
1. User login → JWT token generated
2. Token included in headers: `Authorization: Bearer <token>`
3. Backend validates token → Returns protected resource

### RBAC Roles
- **System Admin** - Full access
- **Company Admin** - Company management
- **Risk Analyst** - Assessments only
- **Underwriter** - View only
- **Viewer** - Read only

### Security Features
- Password hashing (bcrypt)
- JWT tokens (24h expiry)
- Rate limiting (100 req/min)
- SQL injection protection
- XSS prevention
- CORS configuration

## PRA Algorithm

### Risk Score Calculation
```python
def calculate_pra_score(entity):
    base_score = 50
    
    # FICO Impact (-30 to +20)
    fico_factor = (entity.fico_score - 650) * 0.1
    
    # DTI Impact (-20 to +20)  
    dti_factor = (0.4 - entity.dti_ratio) * 50
    
    # Industry Risk
    industry_factor = entity.industry.risk_factor * 10
    
    # Geographic Risk
    state_factor = entity.state.risk_factor * 5
    
    return max(0, min(100, 
        base_score + fico_factor + dti_factor + 
        industry_factor + state_factor
    ))
```

### Risk Categories
- **Low:** 0-30
- **Medium:** 31-60  
- **High:** 61-80
- **Critical:** 81-100

## Performance

### Optimizations
- Database indexes on foreign keys
- API response pagination (20 items default)
- Redis caching (5min TTL)
- Frontend lazy loading
- Image optimization

### Monitoring Endpoints
```http
GET /health          # Service health
GET /metrics         # Prometheus metrics
GET /ready          # Readiness check
```