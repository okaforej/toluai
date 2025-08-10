# ToluAI Insurance Risk Assessment Platform

![ToluAI Logo](https://via.placeholder.com/200x80/3b82f6/ffffff?text=ToluAI)

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-18.2+-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A comprehensive, production-ready insurance risk assessment platform that leverages AI to analyze client risk profiles and generate actionable recommendations. Built with modern React frontend and Flask backend.

## 🚀 Features

### 🎨 Modern React Frontend
- **Google/Facebook-Style UI**: Clean, modern interface with professional design
- **TypeScript & React 18**: Type-safe, performant frontend architecture
- **Responsive Design**: Mobile-first design that scales perfectly
- **Interactive Dashboards**: Real-time analytics with charts and visualizations
- **Seamless User Experience**: Intuitive navigation and micro-interactions

### 🤖 AI-Powered Backend
- **Advanced Risk Assessment**: Multi-factor AI algorithms for accurate scoring
- **Real-time Analysis**: Instant risk evaluation with confidence metrics
- **Actionable Recommendations**: Priority-based mitigation strategies
- **Comprehensive Reporting**: Detailed factor analysis and insights

### 🔐 Enterprise Security
- **JWT Authentication**: Secure token-based authentication with refresh
- **Role-based Access**: Admin, Underwriter, and User permission levels
- **API Rate Limiting**: Protection against abuse and DoS attacks
- **CSRF Protection**: Secure form submissions and data handling
- **Production Hardened**: Security headers, input validation, audit logging

### 🚀 Production Features
- **Full-Stack Architecture**: React frontend + Flask backend + Database
- **REST API**: Complete CRUD operations with comprehensive endpoints
- **Database Migrations**: Alembic-managed schema evolution
- **Docker Ready**: Containerized deployment with Docker Compose
- **Comprehensive Testing**: End-to-end verification and test coverage

## 🏗️ Architecture

```
├── app/                         # Flask Backend
│   ├── __init__.py              # Flask app factory
│   ├── models/                  # Database models
│   │   ├── user.py             # User and Role models
│   │   ├── client.py           # Client model
│   │   └── assessment.py       # Risk assessment models
│   ├── main/                    # Main blueprint
│   ├── auth/                    # Authentication (custom routes)
│   ├── client/                  # Client management
│   ├── assessment/              # Risk assessment
│   ├── admin/                   # Admin panel
│   ├── api/                     # REST API
│   ├── ai/                      # AI risk engine
│   ├── templates/               # Jinja2 templates
│   └── static/                  # CSS, JS, images
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API client
│   │   ├── hooks/              # Custom hooks
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Utility functions
│   ├── package.json            # Frontend dependencies
│   └── vite.config.ts          # Vite configuration
├── config/                      # Configuration classes
├── tests/                       # Test suite
├── migrations/                  # Database migrations
├── docker-compose.yml           # Local development
├── Dockerfile                   # Production container
├── nginx.conf                   # Nginx configuration
└── gunicorn.conf.py            # Gunicorn configuration
```

## 🛠️ Tech Stack

### Backend
- **Framework**: Flask 2.3+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: Flask-Security-Too
- **API**: Flask-RESTful with JWT
- **Caching**: Redis
- **Queue**: Celery (ready for async tasks)

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Tailwind CSS with Headless UI
- **State Management**: React Context + React Query
- **Charts**: Recharts
- **Icons**: Heroicons
- **Build Tool**: Vite

### Security
- **HTTPS**: Enforced with Flask-Talisman
- **Rate Limiting**: Flask-Limiter
- **Password Hashing**: Argon2
- **CSRF Protection**: Flask-WTF
- **Input Validation**: WTForms

### DevOps
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx
- **WSGI Server**: Gunicorn
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry integration ready
- **Testing**: pytest with fixtures

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Docker & Docker Compose (recommended) or PostgreSQL 15+
- Node.js 16+ and npm
- Git
- Redis (for caching and background tasks)

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-org/toluai.git
cd toluai
```

2. **Setup PostgreSQL Database (Automatic)**
```bash
# Using Docker (recommended)
./scripts/setup_postgres.sh docker

# Or use Python auto-setup
python scripts/check_postgres.py

# For detailed setup options, see POSTGRES_SETUP.md
```

3. **Copy environment file**
```bash
cp .env.postgres .env
# Edit .env with your configuration if needed
```

4. **Using Docker Compose (Full Stack)**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

5. **Manual Backend Setup**
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# The application will auto-detect and setup PostgreSQL on first run
# Or manually initialize database
flask db upgrade

# Create admin user
flask create-admin

# Run development server
python run_simple.py  # or flask run
```

5. **Manual Frontend Setup**
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

6. **Access the application**
- React Frontend: http://localhost:5173 (Modern UI)
- Flask Backend: http://localhost:5001 (API server)
- API Documentation: http://localhost:5001/api/v1/docs
- Admin Panel: http://localhost:5001/admin (admin@toluai.com / Admin123!)
- pgAdmin (if using Docker): http://localhost:5050 (admin@toluai.local / admin123)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FLASK_ENV` | Environment (development/production) | development |
| `SECRET_KEY` | Flask secret key | Random |
| `DATABASE_URI` | PostgreSQL connection string | postgresql://toluai_dev:pass@localhost:5432/toluai_dev |
| `POSTGRES_HOST` | PostgreSQL host | localhost |
| `POSTGRES_PORT` | PostgreSQL port | 5432 |
| `POSTGRES_DB` | PostgreSQL database name | toluai_dev |
| `POSTGRES_USER` | PostgreSQL user | toluai_dev |
| `POSTGRES_PASSWORD` | PostgreSQL password | toluai_dev_pass123 |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `MAIL_SERVER` | SMTP server | localhost |
| `SENTRY_DSN` | Sentry error tracking | None |

### Configuration Classes
- `DevelopmentConfig`: Local development
- `TestingConfig`: Unit testing
- `StagingConfig`: Staging environment  
- `ProductionConfig`: Production deployment

## 📊 Database Schema

### Core Models
- **User**: Authentication and user management
- **Role**: Role-based permissions
- **Client**: Insurance client information
- **RiskAssessment**: AI risk analysis results
- **RiskFactor**: Individual risk components
- **Recommendation**: Actionable risk mitigation advice

### Key Relationships
```sql
User 1:N RiskAssessment
Client 1:N RiskAssessment
RiskAssessment 1:N RiskFactor
RiskAssessment 1:N Recommendation
User N:M Role (roles_users table)
```

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full system access
- **Underwriter**: Risk assessment and client management
- **User**: Basic access to assigned clients

### API Authentication
- **Web Interface**: Session-based with Flask-Security
- **API Endpoints**: JWT tokens with refresh capability
- **Rate Limiting**: Configurable per endpoint

### Security Features
- Password hashing with Argon2
- CSRF protection on all forms
- HTTPS enforcement in production
- Secure session cookies
- Input validation and sanitization

## 🧪 Testing

### Running Tests
```bash
# All tests
pytest

# With coverage
pytest --cov=app

# Specific test file
pytest tests/test_models.py

# With output
pytest -v -s
```

### Test Categories
- **Unit Tests**: Model and utility testing
- **Integration Tests**: API endpoint testing
- **Authentication Tests**: Login/logout/permissions
- **Security Tests**: CSRF, rate limiting, validation

## 🚀 Deployment

### Production Deployment with Docker

1. **Set production environment**
```bash
export FLASK_ENV=production
export DATABASE_URI=postgresql://user:pass@prod-db/toluai
export SECRET_KEY=your-super-secret-production-key
```

2. **Deploy with Docker Compose**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Initialize production database**
```bash
docker-compose exec web flask db upgrade
docker-compose exec web flask create-admin
```

### Manual Deployment

1. **Install dependencies**
```bash
pip install -r requirements.txt
```

2. **Configure Nginx** (see nginx.conf)

3. **Run with Gunicorn**
```bash
gunicorn -c gunicorn.conf.py wsgi:app
```

### Cloud Deployment Options
- **AWS**: ECS, RDS, ElastiCache
- **GCP**: Cloud Run, Cloud SQL, Memorystore
- **Azure**: Container Instances, PostgreSQL, Redis Cache
- **Heroku**: Ready for Heroku deployment

## 📈 Monitoring & Logging

### Logging
- Structured logging with structlog
- JSON format for production
- Separate log levels per environment

### Error Tracking
- Sentry integration ready
- Automatic error reporting
- Performance monitoring

### Health Checks
- `/health` endpoint for monitoring
- Database connectivity check
- Redis connectivity check

## 🔌 API Documentation

### Available Endpoints

#### Authentication
- `POST /api/v1/auth/login` - JWT login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

#### Clients
- `GET /api/v1/clients` - List clients
- `POST /api/v1/clients` - Create client
- `GET /api/v1/clients/<id>` - Get client
- `PUT /api/v1/clients/<id>` - Update client
- `DELETE /api/v1/clients/<id>` - Delete client

#### Risk Assessments
- `GET /api/v1/assessments` - List assessments
- `POST /api/v1/assessments` - Create assessment
- `GET /api/v1/assessments/<id>` - Get assessment
- `PUT /api/v1/assessments/<id>` - Update assessment

### Rate Limits
- General API: 100 requests/minute
- Authentication: 5 requests/minute
- Burst allowance: 50 requests

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes and add tests
4. Run test suite (`pytest`)
5. Check code quality (`black . && isort . && flake8`)
6. Commit changes (`git commit -m 'Add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open Pull Request

### Code Standards
- **Formatting**: Black
- **Import Sorting**: isort
- **Linting**: Flake8
- **Type Hints**: mypy
- **Testing**: pytest with >90% coverage

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [PostgreSQL Setup Guide](POSTGRES_SETUP.md)
- [Development Setup](DEV_SETUP.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Development Guide](docs/development.md)

### Getting Help
- 📧 Email: support@toluai.com
- 💬 Slack: #toluai-support
- 🐛 Issues: GitHub Issues
- 📖 Wiki: GitHub Wiki

## 🎯 Roadmap

### v1.1 (Next Release)
- [ ] Advanced ML model training interface
- [ ] Batch risk assessment processing
- [ ] Enhanced reporting and analytics
- [ ] Multi-tenant support

### v1.2 (Future)
- [ ] Real-time risk monitoring
- [ ] Integration with external data sources
- [ ] Mobile application
- [ ] Advanced workflow automation

---

**Built with ❤️ by the ToluAI Team**