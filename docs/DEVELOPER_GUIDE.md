# ToluAI Developer Guide

## Overview

This guide covers development setup, architecture, and best practices for contributing to the ToluAI Insurance Risk Assessment Platform.

## Development Environment Setup

### Prerequisites

- Python 3.9+ with pip
- Node.js 16+ with npm
- Git
- PostgreSQL (optional, SQLite for development)
- Redis (optional)
- Docker & Docker Compose (optional)

### Quick Start with Docker

```bash
# Clone repository
git clone https://github.com/your-org/toluai.git
cd toluai

# Copy environment configuration
cp .env.example .env

# Start all services
docker-compose up -d

# Initialize database
docker-compose exec web flask db upgrade
docker-compose exec web flask create-admin
```

### Manual Development Setup

#### Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Set environment variables
export FLASK_ENV=development
export DATABASE_URI=sqlite:////absolute/path/to/toluai/instance/toluai.db
export SECRET_KEY=your-development-secret-key

# Initialize database
flask db init  # First time only
flask db migrate -m "Initial migration"
flask db upgrade

# Create admin user
flask create-admin

# Run Flask development server
flask run
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start React development server
npm run dev
```

## Architecture Overview

### Backend Architecture (Flask)

```
app/
├── __init__.py          # Application factory
├── models/              # SQLAlchemy models
│   ├── __init__.py
│   ├── user.py         # User and Role models
│   ├── client.py       # Client model
│   └── assessment.py   # Assessment models
├── auth/               # Authentication blueprint
├── main/               # Main application routes
├── client/             # Client management blueprint
├── assessment/         # Risk assessment blueprint
├── admin/              # Admin interface blueprint
├── api/                # REST API blueprint
└── ai/                 # AI/ML risk engine
```

#### Key Components

**Application Factory**: `app/__init__.py`
- Creates and configures Flask app
- Registers blueprints and extensions
- Sets up error handlers and security

**Database Models**: `app/models/`
- SQLAlchemy ORM models
- Relationships and constraints
- Validation and serialization methods

**API Layer**: `app/api/`
- RESTful endpoints
- JWT authentication
- Request/response serialization
- Rate limiting and validation

### Frontend Architecture (React + TypeScript)

```
frontend/src/
├── components/          # Reusable UI components
│   ├── UI/             # Basic UI elements
│   ├── Layout/         # Layout components
│   ├── Forms/          # Form components
│   └── Modals/         # Modal dialogs
├── pages/              # Page components
├── services/           # API client and utilities
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── contexts/           # React contexts
```

#### Key Technologies

- **React 18**: Modern React with concurrent features
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **Headless UI**: Unstyled, accessible UI components
- **React Router**: Client-side routing
- **React Query**: Server state management
- **Vite**: Fast build tool and dev server

## Database Schema

### Core Models

#### User Model
```python
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True)
    password = db.Column(db.String(255))
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    active = db.Column(db.Boolean(), default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

#### Client Model
```python
class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(255), unique=True)
    industry = db.Column(db.String(100))
    annual_revenue = db.Column(db.Float)
    employee_count = db.Column(db.Integer)
    status = db.Column(db.String(50), default='prospect')
    risk_category = db.Column(db.String(50))
```

#### Risk Assessment Model
```python
class RiskAssessment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    assessment_type = db.Column(db.String(50))
    status = db.Column(db.String(50), default='pending')
    risk_score = db.Column(db.Float)
    risk_category = db.Column(db.String(50))
    confidence_score = db.Column(db.Float)
```

### Relationships

- User → RiskAssessment (1:Many)
- Client → RiskAssessment (1:Many)
- RiskAssessment → RiskFactor (1:Many)
- RiskAssessment → Recommendation (1:Many)

## API Development

### Creating New Endpoints

1. **Define Route in Blueprint**:
```python
# app/api/routes.py
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

@api.route('/clients', methods=['POST'])
@jwt_required()
def create_client():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validation
    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    # Business logic
    client = Client(name=data['name'], email=data.get('email'))
    db.session.add(client)
    db.session.commit()
    
    return jsonify({
        'message': 'Client created successfully',
        'client': client.to_dict()
    }), 201
```

2. **Add Model Methods**:
```python
# app/models/client.py
def to_dict(self):
    return {
        'id': self.id,
        'name': self.name,
        'email': self.email,
        'industry': self.industry,
        'created_at': self.created_at.isoformat() if self.created_at else None
    }

@classmethod
def from_dict(cls, data):
    return cls(
        name=data.get('name'),
        email=data.get('email'),
        industry=data.get('industry')
    )
```

3. **Add Tests**:
```python
# tests/test_api.py
def test_create_client(client, auth_headers):
    data = {
        'name': 'Test Company',
        'email': 'test@company.com'
    }
    
    response = client.post('/api/v1/clients', 
                          json=data, 
                          headers=auth_headers)
    
    assert response.status_code == 201
    assert 'client' in response.json
```

## Frontend Development

### Creating New Components

1. **Component Structure**:
```typescript
// src/components/ClientCard.tsx
import React from 'react';
import { Client } from '../types';

interface ClientCardProps {
  client: Client;
  onClick?: (client: Client) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onClick }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900">
        {client.name}
      </h3>
      <p className="text-gray-600">{client.email}</p>
      {onClick && (
        <button
          onClick={() => onClick(client)}
          className="mt-4 btn btn-primary"
        >
          View Details
        </button>
      )}
    </div>
  );
};

export default ClientCard;
```

2. **API Service Integration**:
```typescript
// src/services/api.ts
export const clientsAPI = {
  async list(params?: ClientListParams): Promise<ClientListResponse> {
    const response = await apiClient.get('/clients', { params });
    return response.data;
  },

  async create(data: Partial<Client>): Promise<Client> {
    const response = await apiClient.post('/clients', data);
    return response.data.client;
  }
};
```

3. **Custom Hooks**:
```typescript
// src/hooks/useClients.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { clientsAPI } from '../services/api';

export const useClients = (params?: ClientListParams) => {
  return useQuery(
    ['clients', params],
    () => clientsAPI.list(params),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation(clientsAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('clients');
    },
  });
};
```

## Testing

### Backend Testing (pytest)

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_models.py

# Run tests with output
pytest -v -s
```

#### Test Structure
```python
# tests/conftest.py
import pytest
from app import create_app, db
from app.models import User

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    # Create test user and get JWT token
    user = User(email='test@example.com')
    user.set_password('password')
    db.session.add(user)
    db.session.commit()
    
    response = client.post('/api/v1/auth/login', json={
        'email': 'test@example.com',
        'password': 'password'
    })
    
    token = response.json['access_token']
    return {'Authorization': f'Bearer {token}'}
```

### Frontend Testing

```bash
# Run frontend tests (when implemented)
cd frontend
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Code Style and Standards

### Backend (Python)

- **Formatting**: Black
- **Import Sorting**: isort
- **Linting**: Flake8
- **Type Hints**: mypy (recommended)

```bash
# Format code
black .

# Sort imports
isort .

# Check linting
flake8

# Type checking
mypy app/
```

### Frontend (TypeScript)

- **Formatting**: Prettier
- **Linting**: ESLint
- **Type Checking**: TypeScript compiler

```bash
cd frontend

# Format code
npm run format

# Lint code
npm run lint

# Type checking
npm run type-check
```

## Database Migrations

### Creating Migrations

```bash
# Generate migration after model changes
flask db migrate -m "Add client risk_category field"

# Apply migrations
flask db upgrade

# Rollback migration
flask db downgrade
```

### Migration Best Practices

1. **Always review** generated migrations before applying
2. **Test migrations** on development database first
3. **Backup production** data before applying migrations
4. **Use descriptive messages** for migration names

## Performance Optimization

### Backend Optimization

1. **Database Query Optimization**:
```python
# Use eager loading to avoid N+1 queries
clients = Client.query.options(
    db.joinedload(Client.assessments)
).all()

# Use pagination for large datasets
clients = Client.query.paginate(
    page=1, per_page=20, error_out=False
)
```

2. **Caching**:
```python
from flask_caching import Cache

cache = Cache(app)

@cache.memoize(timeout=300)  # 5 minutes
def get_client_risk_summary(client_id):
    # Expensive calculation
    return summary
```

3. **Async Tasks** (with Celery):
```python
from celery import Celery

celery = Celery('toluai')

@celery.task
def run_risk_assessment(assessment_id):
    # Long-running AI analysis
    pass
```

### Frontend Optimization

1. **Code Splitting**:
```typescript
import { lazy, Suspense } from 'react';

const ClientsPage = lazy(() => import('../pages/ClientsPage'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientsPage />
    </Suspense>
  );
}
```

2. **Memoization**:
```typescript
import { memo, useMemo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => 
    expensiveProcessing(data), 
    [data]
  );
  
  return <div>{processedData}</div>;
});
```

## Security Considerations

### Authentication & Authorization

- JWT tokens with short expiration
- Refresh token rotation
- Role-based access control
- Input validation on all endpoints

### Data Protection

- SQL injection prevention with ORM
- XSS protection with Content Security Policy
- CSRF protection on forms
- Secure headers with Flask-Talisman

## Deployment

### Development
```bash
# Start development servers
flask run                 # Backend on :5000
cd frontend && npm run dev  # Frontend on :3000
```

### Production
```bash
# Build frontend
cd frontend && npm run build

# Run with Gunicorn
gunicorn -c gunicorn.conf.py wsgi:app

# Or use Docker
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing

### Pull Request Process

1. **Create feature branch** from main
2. **Make changes** with tests
3. **Run test suite** and ensure passing
4. **Update documentation** if needed
5. **Submit pull request** with description

### Commit Messages

Use conventional commit format:
```
feat: add client risk assessment endpoint
fix: resolve JWT token refresh issue
docs: update API documentation
test: add client model tests
```

## Troubleshooting

### Common Issues

1. **Database Connection**: Check DATABASE_URI
2. **JWT Errors**: Verify SECRET_KEY configuration
3. **CORS Issues**: Ensure proper frontend/backend URLs
4. **Build Errors**: Clear node_modules and reinstall

### Debug Mode

```python
# Enable Flask debug mode
export FLASK_ENV=development
export FLASK_DEBUG=1
flask run
```

### Logging

```python
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Use in code
logger.info(f"Processing assessment {assessment_id}")
logger.error(f"Failed to process: {error}")
```