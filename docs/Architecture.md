# ToluAI System Architecture

## Overview

ToluAI is a modern, full-stack insurance risk assessment platform built with a React frontend, Flask backend, and PostgreSQL database. The system follows a microservices-ready architecture with clear separation of concerns and scalable design patterns.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Load Balancer                          │
│                      (Nginx/AWS ALB)                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Layer                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   React SPA     │ │   Static Assets │ │   Service Worker│   │
│  │  (TypeScript)   │ │    (Images,     │ │   (Optional)    │   │
│  │                 │ │   CSS, Fonts)   │ │                 │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS/API Calls
┌─────────────────────────────────────────────────────────────────┐
│                     Backend Layer                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 Flask Application                           │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │ │
│  │  │   API   │ │  Auth   │ │ Client  │ │ Admin   │         │ │
│  │  │Blueprint│ │Blueprint│ │Blueprint│ │Blueprint│         │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  AI/ML Engine                               │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │ │
│  │  │  Risk   │ │ Factor  │ │ Model   │ │Recommend│         │ │
│  │  │ Scorer  │ │Analyzer │ │ Engine  │ │ Engine  │         │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────────────────────┐
│                     Data Layer                                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   PostgreSQL    │ │      Redis      │ │   File Storage  │   │
│  │   (Primary DB)  │ │   (Cache/Jobs)  │ │  (Documents)    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 External Services                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Email Service │ │  Monitoring     │ │   Backup        │   │
│  │   (SMTP/SES)    │ │  (Sentry)       │ │   Service       │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### React Application Structure

```
frontend/src/
├── components/          # Reusable UI components
│   ├── UI/             # Basic UI elements (Button, Input, Modal)
│   ├── Layout/         # Layout components (Header, Sidebar, Footer)
│   ├── Forms/          # Form components
│   └── Charts/         # Data visualization components
├── pages/              # Route-level page components
│   ├── DashboardPage.tsx
│   ├── ClientsPage.tsx
│   ├── AssessmentsPage.tsx
│   └── AdminPage.tsx
├── services/           # API communication layer
│   ├── api.ts          # Axios client configuration
│   ├── auth.ts         # Authentication service
│   └── websocket.ts    # WebSocket client (future)
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication state
│   ├── useClients.ts   # Client data management
│   └── useAssessments.ts # Assessment data management
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # Global auth state
│   └── ThemeContext.tsx # UI theme management
├── types/              # TypeScript type definitions
│   ├── api.ts          # API response types
│   ├── client.ts       # Client entity types
│   └── assessment.ts   # Assessment entity types
├── utils/              # Utility functions
│   ├── formatting.ts   # Data formatting helpers
│   ├── validation.ts   # Form validation
│   └── constants.ts    # Application constants
└── styles/             # Global styles and themes
    ├── globals.css     # Global CSS
    └── tailwind.css    # Tailwind configuration
```

### Key Frontend Technologies

- **React 18**: Component-based UI with concurrent features
- **TypeScript**: Static typing for improved development experience
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Headless UI**: Accessible, unstyled UI components
- **React Router**: Client-side routing and navigation
- **React Query**: Server state management and caching
- **Axios**: HTTP client for API communication
- **React Hook Form**: Performant form management
- **Recharts**: Data visualization and charting library

### State Management Strategy

#### Global State (React Context)
- **Authentication State**: User session and permissions
- **Theme Settings**: UI theme and preferences
- **Application Settings**: Feature flags and configuration

#### Server State (React Query)
- **Client Data**: Cached client information with background updates
- **Assessment Data**: Risk assessment results and history
- **User Data**: Profile and settings information

#### Local Component State
- **Form State**: Form inputs and validation
- **UI State**: Modal visibility, loading states, local filters

## Backend Architecture

### Flask Application Structure

```
app/
├── __init__.py          # Application factory pattern
├── models/              # SQLAlchemy ORM models
│   ├── __init__.py
│   ├── user.py         # User and Role models
│   ├── client.py       # Client entity model
│   ├── assessment.py   # Risk assessment models
│   └── mixins.py       # Common model mixins
├── api/                 # REST API layer
│   ├── __init__.py
│   ├── routes.py       # API route definitions
│   ├── auth.py         # Authentication decorators
│   ├── validation.py   # Request validation
│   └── serializers.py  # Response serialization
├── auth/               # Authentication blueprint
│   ├── __init__.py
│   ├── routes.py       # Login/logout routes
│   └── forms.py        # Authentication forms
├── client/             # Client management blueprint
│   ├── __init__.py
│   ├── routes.py       # Client CRUD operations
│   └── forms.py        # Client forms
├── assessment/         # Risk assessment blueprint
│   ├── __init__.py
│   ├── routes.py       # Assessment management
│   └── tasks.py        # Background assessment tasks
├── admin/              # Admin interface blueprint
│   ├── __init__.py
│   ├── routes.py       # Admin operations
│   └── views.py        # Admin panel views
├── ai/                 # AI/ML risk assessment engine
│   ├── __init__.py
│   ├── engine.py       # Main risk assessment logic
│   ├── factors.py      # Risk factor analysis
│   ├── models.py       # ML model interfaces
│   └── recommendations.py # Recommendation generation
├── utils/              # Utility modules
│   ├── __init__.py
│   ├── decorators.py   # Custom decorators
│   ├── validators.py   # Data validation utilities
│   └── helpers.py      # General helper functions
└── extensions.py       # Flask extension initialization
```

### Backend Technologies

- **Flask**: Lightweight WSGI web application framework
- **SQLAlchemy**: Python SQL toolkit and ORM
- **Flask-Security-Too**: User authentication and authorization
- **Flask-JWT-Extended**: JWT token management
- **Flask-Migrate**: Database migration support
- **Flask-Mail**: Email support
- **Flask-Limiter**: Rate limiting
- **Flask-CORS**: Cross-Origin Resource Sharing
- **Celery**: Distributed task queue (planned)
- **Redis**: Caching and session storage

### API Design Patterns

#### RESTful API Structure
```
/api/v1/
├── /auth/
│   ├── POST /login           # User authentication
│   ├── POST /refresh         # Token refresh
│   └── POST /logout          # User logout
├── /clients/
│   ├── GET /                 # List clients (paginated)
│   ├── POST /                # Create client
│   ├── GET /{id}            # Get client details
│   ├── PUT /{id}            # Update client
│   └── DELETE /{id}         # Delete client
├── /assessments/
│   ├── GET /                # List assessments
│   ├── POST /               # Create assessment
│   ├── GET /{id}           # Get assessment details
│   ├── PUT /{id}           # Update assessment
│   ├── DELETE /{id}        # Delete assessment
│   └── POST /quick/{client_id} # Quick assessment
├── /users/
│   ├── GET /               # List users (admin only)
│   ├── POST /              # Create user (admin only)
│   ├── GET /profile        # Current user profile
│   └── PUT /profile        # Update profile
└── /health                 # Health check endpoint
```

#### Response Format Standardization
```json
{
  "success": true,
  "data": {
    // Response payload
  },
  "message": "Optional success message",
  "pagination": {
    "page": 1,
    "pages": 10,
    "per_page": 20,
    "total": 200
  }
}
```

#### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The provided data is invalid",
    "details": {
      "field_name": ["Field-specific error message"]
    }
  }
}
```

## Data Layer Architecture

### Database Design Principles

1. **Normalization**: Properly normalized to 3NF to reduce redundancy
2. **Referential Integrity**: Foreign key constraints ensure data consistency
3. **Indexing Strategy**: Optimized indexes for common query patterns
4. **Audit Trails**: Comprehensive logging of data changes
5. **Soft Deletes**: Important records marked as deleted rather than removed

### Connection Management

```python
# Connection pooling configuration
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_size': 20,
    'pool_pre_ping': True,
    'pool_recycle': 3600,
    'max_overflow': 30
}
```

### Caching Strategy

#### Application-Level Caching
- **Flask-Caching**: In-memory caching for frequently accessed data
- **Redis**: Distributed caching for multi-instance deployments
- **Query Result Caching**: Cache expensive database queries

#### Database-Level Optimization
- **Query Optimization**: EXPLAIN ANALYZE for query performance tuning
- **Index Optimization**: Strategic indexing for common access patterns
- **Connection Pooling**: Efficient database connection management

## Security Architecture

### Authentication & Authorization Flow

```
1. User Login Request
   ↓
2. Credentials Validation
   ↓
3. JWT Token Generation (Access + Refresh)
   ↓
4. Token Storage (HTTP-only cookies/localStorage)
   ↓
5. API Request with Bearer Token
   ↓
6. Token Validation & User Context
   ↓
7. Role-Based Access Control Check
   ↓
8. Resource Access or Denial
```

### Security Layers

#### Transport Security
- **HTTPS Only**: All communication encrypted in transit
- **HSTS Headers**: HTTP Strict Transport Security
- **Certificate Pinning**: Additional certificate validation

#### Application Security
- **JWT Authentication**: Stateless token-based authentication
- **CSRF Protection**: Cross-Site Request Forgery prevention
- **XSS Protection**: Content Security Policy headers
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Comprehensive data sanitization

#### Database Security
- **Connection Encryption**: SSL/TLS database connections
- **Access Controls**: Role-based database permissions
- **Query Parameterization**: SQL injection prevention
- **Audit Logging**: Comprehensive data access logging

### Permission System

```python
# Role-based permissions
PERMISSIONS = {
    'admin': [
        'user.create', 'user.read', 'user.update', 'user.delete',
        'client.create', 'client.read', 'client.update', 'client.delete',
        'assessment.create', 'assessment.read', 'assessment.update', 'assessment.delete',
        'system.configure'
    ],
    'underwriter': [
        'client.create', 'client.read', 'client.update',
        'assessment.create', 'assessment.read', 'assessment.update'
    ],
    'user': [
        'client.read', 'assessment.read'
    ]
}
```

## Deployment Architecture

### Development Environment
```
┌─────────────────────────────────────────────────┐
│              Developer Machine                   │
│                                                 │
│  ┌─────────────┐  ┌─────────────┐               │
│  │   React     │  │   Flask     │               │
│  │   Dev       │  │   Dev       │               │
│  │   Server    │  │   Server    │               │
│  │  :3000      │  │   :5000     │               │
│  └─────────────┘  └─────────────┘               │
│                                                 │
│  ┌─────────────┐  ┌─────────────┐               │
│  │   SQLite    │  │   Redis     │               │
│  │   Database  │  │   (Optional)│               │
│  └─────────────┘  └─────────────┘               │
└─────────────────────────────────────────────────┘
```

### Production Environment
```
┌───────────────────────────────────────────────────────────┐
│                    Load Balancer                          │
│                  (Nginx/AWS ALB)                         │
└─────────────────────┬─────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────────────────┐
│                Application Servers                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Server 1  │  │   Server 2  │  │   Server N  │         │
│  │             │  │             │  │             │         │
│  │  React UI   │  │  React UI   │  │  React UI   │         │
│  │  Flask API  │  │  Flask API  │  │  Flask API  │         │
│  │  (Docker)   │  │  (Docker)   │  │  (Docker)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────────────────────────────────────────────┐
│                  Data Services                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ PostgreSQL  │  │    Redis    │  │   Backup    │         │
│  │  Cluster    │  │   Cluster   │  │   Storage   │         │
│  │ (Master/    │  │             │  │             │         │
│  │  Replica)   │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Container Architecture

#### Docker Compose Structure
```yaml
services:
  web:          # Flask application + React static files
  db:           # PostgreSQL database
  redis:        # Redis cache/session store
  nginx:        # Reverse proxy and static file serving
  celery:       # Background task worker (future)
  flower:       # Celery monitoring (future)
```

#### Kubernetes Deployment (Future)
```yaml
# Deployments
- toluai-web-deployment      # Web application pods
- toluai-worker-deployment   # Background task workers
- postgres-deployment        # Database
- redis-deployment          # Cache layer

# Services
- toluai-web-service        # Load balancer for web pods
- postgres-service          # Database service
- redis-service            # Cache service

# ConfigMaps & Secrets
- toluai-config            # Application configuration
- toluai-secrets          # Sensitive configuration
```

## Performance Architecture

### Frontend Performance

#### Code Splitting
```typescript
// Route-based code splitting
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const AssessmentsPage = lazy(() => import('./pages/AssessmentsPage'));

// Component-based code splitting
const HeavyChart = lazy(() => import('./components/HeavyChart'));
```

#### Caching Strategy
```typescript
// API response caching
const { data: clients } = useQuery(
  ['clients', filters],
  () => fetchClients(filters),
  {
    staleTime: 5 * 60 * 1000,  // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  }
);
```

### Backend Performance

#### Database Query Optimization
```python
# Eager loading to prevent N+1 queries
clients = db.session.query(Client)\
    .options(joinedload(Client.assessments))\
    .filter(Client.status == 'active')\
    .all()

# Pagination for large datasets
clients = Client.query.paginate(
    page=page, per_page=20, error_out=False
)
```

#### Caching Implementation
```python
from flask_caching import Cache

@cache.memoize(timeout=300)  # 5 minutes
def get_risk_summary(client_id):
    return expensive_risk_calculation(client_id)
```

### Monitoring and Observability

#### Application Metrics
- **Response Times**: API endpoint performance
- **Error Rates**: HTTP 4xx and 5xx responses
- **Throughput**: Requests per second
- **Database Performance**: Query execution times
- **Cache Hit Rates**: Caching effectiveness

#### Health Checks
```python
@app.route('/health')
def health_check():
    return {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': app.config['VERSION'],
        'database': check_database_connection(),
        'redis': check_redis_connection()
    }
```

## Scalability Considerations

### Horizontal Scaling

#### Stateless Application Design
- JWT tokens eliminate server-side session storage
- Database handles all persistent state
- Redis for shared caching across instances

#### Load Balancing Strategies
- **Round Robin**: Equal distribution across instances
- **Least Connections**: Route to least busy instance
- **Health Check Based**: Avoid unhealthy instances

### Vertical Scaling

#### Resource Optimization
- **Memory**: Tune SQLAlchemy connection pools
- **CPU**: Optimize algorithm-heavy risk calculations
- **I/O**: Database query optimization and indexing

### Database Scaling

#### Read Replicas
```python
# Read/Write splitting
class DatabaseConfig:
    SQLALCHEMY_DATABASE_URI = 'postgresql://user:pass@master-db/toluai'
    SQLALCHEMY_BINDS = {
        'read_only': 'postgresql://user:pass@replica-db/toluai'
    }
```

#### Sharding Strategy (Future)
- **Client-based Sharding**: Distribute clients across database shards
- **Geographic Sharding**: Separate databases by region
- **Feature-based Sharding**: Separate assessment data from client data

## Integration Architecture

### External Service Integration

#### Email Services
```python
# SMTP Configuration
MAIL_SERVER = 'smtp.example.com'
MAIL_PORT = 587
MAIL_USE_TLS = True

# AWS SES Integration (Future)
AWS_SES_REGION = 'us-east-1'
AWS_ACCESS_KEY_ID = 'your-key'
```

#### Monitoring Services
```python
# Sentry Error Tracking
SENTRY_DSN = 'https://your-dsn@sentry.io/project'

# Custom Metrics (Future)
DATADOG_API_KEY = 'your-api-key'
NEW_RELIC_LICENSE_KEY = 'your-license-key'
```

### API Integration Patterns

#### Webhook Support (Planned)
```python
# Outgoing webhooks for assessment completion
@assessment.route('/webhook/subscribe', methods=['POST'])
def subscribe_webhook():
    # Register external webhook endpoints
    pass

# Incoming webhooks for external data
@api.route('/webhook/data-update', methods=['POST'])
def handle_data_webhook():
    # Process external data updates
    pass
```

## Future Architecture Enhancements

### Microservices Migration Path

#### Service Decomposition Strategy
1. **User Service**: Authentication and user management
2. **Client Service**: Client data management
3. **Assessment Service**: Risk assessment engine
4. **Notification Service**: Email and messaging
5. **Analytics Service**: Reporting and analytics

#### Event-Driven Architecture
```python
# Event publishing
class EventPublisher:
    def publish(self, event_type, data):
        # Publish to message queue (RabbitMQ/Apache Kafka)
        pass

# Event consumption
class AssessmentEventHandler:
    def handle_client_updated(self, client_data):
        # Trigger assessment recalculation
        pass
```

### AI/ML Enhancement Architecture

#### Model Serving Infrastructure
- **Model Registry**: Version control for ML models
- **Model Serving**: Real-time inference API
- **Feature Store**: Centralized feature management
- **Training Pipeline**: Automated model retraining

#### Batch Processing Architecture
```python
# Apache Airflow DAG for batch processing
dag = DAG(
    'risk_assessment_batch',
    schedule_interval='@daily',
    tasks=[
        'extract_client_data',
        'run_risk_models',
        'update_assessments',
        'generate_reports'
    ]
)
```

This architecture provides a solid foundation for the current ToluAI platform while maintaining flexibility for future enhancements and scaling requirements.