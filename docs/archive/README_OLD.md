# 🏢 ToluAI - Insurance Risk Platform Assessment

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

> AI-powered insurance risk assessment platform with predictive analytics and automated underwriting

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/yourusername/toluai.git
cd toluai

# Option 1: One-click setup (Recommended)
./setup.sh

# Option 2: Docker
docker-compose -f docker-compose.dev.yml up

# Option 3: Make command
make quickstart
```

**Ready in 5 minutes!** Access at http://localhost:5173

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[Setup Guide](docs/SETUP.md)** | Complete development environment setup |
| **[User Guide](docs/USER_GUIDE.md)** | End-user documentation |
| **[API Reference](docs/API.md)** | REST API documentation |
| **[Architecture](docs/ARCHITECTURE.md)** | System design and components |
| **[Developer Guide](docs/DEVELOPER_GUIDE.md)** | Development best practices |
| **[Testing Guide](docs/TESTING.md)** | Testing strategies and E2E tests |
| **[Deployment](docs/DEPLOYMENT.md)** | Production deployment guide |
| **[Security](docs/SECURITY.md)** | Authentication and RBAC |

## ✨ Key Features

### Risk Assessment
- **Predictive Risk Algorithm (PRA)** - ML-powered risk scoring
- **Real-time assessment** - Instant risk calculations
- **Multi-factor analysis** - 15+ risk indicators

### Company Management  
- **Automated enrichment** - Industry and location data
- **Risk profiling** - Company-level risk aggregation
- **Audit trails** - Complete activity history

### Reporting & Analytics
- **Interactive dashboards** - Real-time KPIs
- **Risk heat maps** - Geographic risk visualization
- **Trend analysis** - Historical risk patterns
- **Custom reports** - Export to PDF/Excel

### Security & Compliance
- **Role-based access** - 5 user roles
- **JWT authentication** - Secure token-based auth
- **Audit logging** - Comprehensive activity tracking
- **Data encryption** - At rest and in transit

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **Backend** | Python 3.11, Flask 3.0, SQLAlchemy |
| **Database** | PostgreSQL 15, Redis |
| **Testing** | Playwright, Jest, Pytest |
| **DevOps** | Docker, GitHub Actions, Nginx |

## 📦 Project Structure

```
toluai/
├── frontend/          # React TypeScript application
├── backend/           # Flask API services
├── docs/             # Documentation
├── tests/            # Test suites
├── docker/           # Container configurations
└── scripts/          # Automation scripts
```

## 🧪 Testing

```bash
# Run all tests
make test

# Specific test suites
make test-backend     # Python tests
make test-frontend    # React tests
make test-e2e        # Playwright E2E tests
```

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@toluai.com | Admin123! |
| Company Admin | company.admin@acme.com | CompanyAdmin123! |
| Risk Analyst | risk.analyst@acme.com | Analyst123! |

## 📊 API Endpoints

Base URL: `http://localhost:5001/api/v2`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User authentication |
| `/irpa/insured-entities` | GET/POST | Manage entities |
| `/irpa/assessments` | GET/POST | Risk assessments |
| `/irpa/analytics/risk-distribution` | GET | Risk analytics |

[Full API Documentation →](docs/API.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

See [Developer Guide](docs/DEVELOPER_GUIDE.md) for coding standards.

## 📈 Performance

- **Response time**: < 200ms average
- **Concurrent users**: 1000+
- **Database queries**: Optimized with indexing
- **Caching**: Redis for session and API responses

## 🛡️ Security

- JWT token authentication
- Role-based access control (RBAC)
- SQL injection prevention
- XSS protection
- Rate limiting
- Input validation

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🆘 Support

- 📧 Email: support@toluai.com
- 📚 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/yourusername/toluai/issues)
- 💬 [Discussions](https://github.com/yourusername/toluai/discussions)

---

Built with ❤️ by the ToluAI Team