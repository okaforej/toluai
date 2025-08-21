# ToluAI GCP Migration Strategy Document

## Executive Summary
The current ToluAI application has multiple server implementations (`run_simple.py`, `run_dev.py`, `backend/app.py`) that work locally but fail to properly expose APIs when deployed to Google Cloud Platform App Engine. This document outlines a strategy to migrate to a production-ready architecture.

## Current State Analysis

### 1. Existing Architecture Issues

#### `run_simple.py` (Development Server)
- **Type**: Standalone Flask application with Flask-RESTX
- **Pros**: 
  - Self-contained with working Swagger UI at `/api/docs`
  - All endpoints properly registered under `/api/v1` and `/api/v2`
  - Mock authentication works without database
- **Cons**: 
  - Not integrated with main backend structure
  - Duplicates code and logic
  - Not suitable for production deployment

#### `backend/app.py` (Main Application)
- **Type**: Modular Flask application
- **Pros**:
  - Proper separation of concerns
  - Database integration
  - Production-ready structure
- **Cons**:
  - API routes not properly registered for GCP
  - Missing Swagger/OpenAPI documentation
  - Complex blueprint registration that fails in production

#### `main.py` (GCP Entry Point)
- **Type**: Wrapper for backend.app
- **Issue**: Simply imports backend.app which doesn't have all routes properly exposed

### 2. Reference Architecture (map-database-api)
The LinkedIn map-database-api provides a good reference:
- Uses FastAPI (not Flask)
- Clear route registration in `app_factory.py`
- Versioned API routes under `/api/v1`
- Proper middleware configuration
- Health checks at multiple endpoints

## Migration Strategy

### Phase 1: Consolidate API Registration (Immediate Fix)

#### Option A: Quick Fix for GCP Deployment
1. **Modify `main.py` to use run_simple.py approach**:
```python
# main.py
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

# Import the working simple server configuration
from run_simple import app

# The app is already configured with all routes
```

2. **Update requirements.txt** to ensure Flask-RESTX is included
3. **Redeploy to GCP**

#### Option B: Fix backend/app.py Registration
1. **Import Flask-RESTX into backend/app.py**
2. **Register all API routes directly in create_app()**
3. **Add Swagger documentation**

### Phase 2: Proper API Architecture (1-2 weeks)

#### 1. Create Unified API Module
```
backend/
  api/
    __init__.py          # Main API registration
    v1/
      __init__.py        # Version 1 API blueprint
      auth.py            # Authentication endpoints
      irpa.py            # IRPA endpoints
      companies.py       # Company endpoints
      swagger.py         # Swagger configuration
    v2/
      __init__.py        # Version 2 API blueprint
      irpa.py            # Enhanced IRPA endpoints
    docs.py              # API documentation setup
```

#### 2. Implement Centralized Route Registration
```python
# backend/api/__init__.py
from flask import Flask
from flask_restx import Api

def register_api_routes(app: Flask):
    # Initialize Flask-RESTX
    api = Api(
        app,
        version='2.0',
        title='ToluAI Risk Assessment API',
        description='Insurance Risk Professional Assessment System',
        doc='/api/docs',
        prefix='/api'
    )
    
    # Register v1 namespace
    from .v1 import api_v1_namespace
    api.add_namespace(api_v1_namespace, path='/v1')
    
    # Register v2 namespace
    from .v2 import api_v2_namespace
    api.add_namespace(api_v2_namespace, path='/v2')
    
    return api
```

#### 3. Update backend/app.py
```python
def create_app(config_name='development'):
    app = Flask(__name__)
    
    # ... existing configuration ...
    
    # Register API routes with Swagger
    from backend.api import register_api_routes
    api = register_api_routes(app)
    
    # Add health check
    @app.route('/health')
    def health():
        return {'status': 'healthy'}, 200
    
    return app
```

### Phase 3: Production Optimization (2-4 weeks)

#### 1. Database Migration
- Move from mock data to actual database queries
- Implement proper connection pooling for Cloud SQL
- Add database health checks

#### 2. Authentication & Security
- Implement JWT properly with database-backed users
- Add API key authentication for service-to-service calls
- Configure CORS properly for production domains

#### 3. Performance & Monitoring
- Add caching layer (Redis/Memcache)
- Implement request/response logging
- Add APM (Application Performance Monitoring)
- Configure Cloud Monitoring and Cloud Logging

#### 4. API Documentation
- Generate OpenAPI 3.0 specification
- Add request/response examples
- Document authentication requirements
- Create developer portal

## Implementation Plan

### Immediate Actions (Day 1)
1. **Quick Fix Deployment**:
   ```bash
   # Update main.py to use run_simple configuration
   # Add Flask-RESTX to requirements.txt
   # Deploy to GCP
   gcloud app deploy
   ```

2. **Verify Endpoints**:
   - Health: `https://[project].appspot.com/health`
   - API Docs: `https://[project].appspot.com/api/docs`
   - Auth: `https://[project].appspot.com/api/v1/auth/login`

### Week 1 Tasks
1. Refactor API structure into versioned modules
2. Implement proper Swagger documentation
3. Add comprehensive health checks
4. Set up development/staging/production configs

### Week 2-3 Tasks
1. Migrate to database-backed authentication
2. Implement proper error handling
3. Add request validation
4. Set up CI/CD pipeline

### Week 4 Tasks
1. Performance testing
2. Security audit
3. Documentation completion
4. Production deployment

## Testing Strategy

### Local Testing
```bash
# Test with proper app structure
python main.py

# Verify endpoints
curl http://localhost:8080/health
curl http://localhost:8080/api/docs
curl http://localhost:8080/api/v1/auth/login
```

### GCP Testing
```bash
# Deploy to staging
gcloud app deploy --version=staging --no-promote

# Test staging endpoints
curl https://staging-dot-[project].appspot.com/health
curl https://staging-dot-[project].appspot.com/api/docs
```

## Configuration Management

### Environment Variables for GCP
```yaml
# app.yaml
env_variables:
  FLASK_ENV: "production"
  API_VERSION: "v1"
  SWAGGER_ENABLED: "true"
  DATABASE_URL: "${CLOUD_SQL_CONNECTION}"
  JWT_SECRET_KEY: "${SECRET_KEY}"
  CORS_ORIGINS: "https://[project].appspot.com"
```

### Secret Management
- Use Google Secret Manager for sensitive data
- Rotate secrets regularly
- Never commit secrets to repository

## Success Criteria

1. **Functional Requirements**:
   - ✅ All API endpoints accessible on GCP
   - ✅ Swagger documentation available at `/api/docs`
   - ✅ Authentication working properly
   - ✅ Database connected and operational

2. **Non-Functional Requirements**:
   - ✅ Response time < 500ms for 95% of requests
   - ✅ 99.9% uptime
   - ✅ Proper error handling and logging
   - ✅ Security headers implemented

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| API routes not registering | High | Use proven run_simple.py pattern initially |
| Database connection issues | High | Implement connection pooling and retry logic |
| Authentication failures | High | Keep mock auth as fallback during migration |
| Performance degradation | Medium | Add caching and optimize queries |
| Documentation out of sync | Low | Auto-generate from code annotations |

## Recommended Immediate Action

**Deploy Option A (Quick Fix)** immediately to get APIs working on GCP:

1. Copy working routes from `run_simple.py` to `main.py`
2. Ensure Flask-RESTX is in requirements.txt
3. Deploy to GCP
4. Verify all endpoints are accessible

Then proceed with Phase 2 refactoring while the application is functional in production.

## Conclusion

The migration strategy prioritizes getting a working API on GCP immediately (Option A) while planning for a proper architectural refactoring (Phase 2-3). This approach minimizes downtime and risk while ensuring the application can evolve to meet production requirements.

The key insight from analyzing `run_simple.py` vs `backend/app.py` is that the simpler, more direct API registration in `run_simple.py` works better with App Engine's deployment model. The complex blueprint registration in `backend/app.py` needs refactoring to work properly in the GCP environment.