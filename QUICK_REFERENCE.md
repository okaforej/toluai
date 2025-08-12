# ⚡ ToluAI Quick Reference

## 🚀 Start Development
```bash
make dev          # Start all services
make quickstart   # Full setup + start
./setup.sh        # Interactive setup
```

## 🌐 Access Points
| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | admin@toluai.com / Admin123! |
| **Backend** | http://localhost:5001 | - |
| **API Docs** | http://localhost:5001/api/docs | - |
| **Database** | localhost:5432 | toluai_dev / toluai_dev_pass123 |

## 🛠️ Common Commands

### Development
```bash
make dev          # Start servers
make dev-backend  # Backend only
make dev-frontend # Frontend only
make migrate      # Run migrations
make seed         # Load sample data
make clean        # Clean temp files
```

### Testing
```bash
make test         # All tests
make test-backend # Python tests
make test-frontend # React tests
make test-e2e     # E2E tests
make test-e2e-ui  # E2E with browser
```

### Docker
```bash
make docker-up    # Start containers
make docker-down  # Stop containers
make docker-logs  # View logs
docker-compose -f docker-compose.dev.yml up
```

### Database
```bash
make migrate      # Run migrations
make migrate-create msg="description"  # New migration
make reset-db     # Reset database
flask db upgrade  # Manual migration
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `.env` | Backend environment variables |
| `frontend/.env` | Frontend environment variables |
| `docker-compose.dev.yml` | Development containers |
| `Makefile` | Common commands |
| `setup.sh` | One-click setup |

## 🧪 Test Users

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@toluai.com | Admin123! |
| **Company Admin** | company.admin@acme.com | CompanyAdmin123! |
| **Risk Analyst** | risk.analyst@acme.com | Analyst123! |
| **Underwriter** | underwriter@acme.com | Underwriter123! |
| **Viewer** | viewer@acme.com | Viewer123! |

## 📡 API Endpoints

### Authentication
```bash
POST /api/v2/auth/login
POST /api/v2/auth/logout
POST /api/v2/auth/refresh
```

### IRPA Operations
```bash
GET  /api/v2/irpa/insured-entities
POST /api/v2/irpa/insured-entities
GET  /api/v2/irpa/assessments
POST /api/v2/irpa/assessments
```

### Analytics
```bash
GET /api/v2/irpa/analytics/risk-distribution
GET /api/v2/irpa/analytics/assessment-trends
GET /api/v2/irpa/analytics/zip-code-risk
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
lsof -ti:5001 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:5432 | xargs kill -9  # PostgreSQL
```

### Reset Everything
```bash
make clean
make reset-db
rm -rf frontend/node_modules
npm install
make dev
```

### Check Health
```bash
make health       # Check all services
curl http://localhost:5001/health
curl http://localhost:5173
```

## 🔧 Environment Variables

### Required Backend (.env)
```env
DATABASE_URL=postgresql://toluai_dev:toluai_dev_pass123@localhost:5432/toluai_dev
SECRET_KEY=your-secret-key
FLASK_ENV=development
```

### Required Frontend (frontend/.env)
```env
VITE_API_URL=http://localhost:5001
```

## 📊 Database

### Connect to Database
```bash
psql -U toluai_dev -d toluai_dev -h localhost
```

### Common Queries
```sql
-- Count entities
SELECT COUNT(*) FROM insured_entities;

-- Recent assessments
SELECT * FROM risk_assessments 
ORDER BY created_at DESC LIMIT 10;

-- User roles
SELECT u.email, r.name as role 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id;
```

## 🎯 Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/my-feature
```

## 📱 VS Code Extensions

Essential extensions:
- Python (ms-python.python)
- Pylance (ms-python.vscode-pylance)
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- Tailwind CSS (bradlc.vscode-tailwindcss)
- Thunder Client (rangav.vscode-thunder-client)

## 🔍 Logs

| Service | Location | View Command |
|---------|----------|--------------|
| Backend | Terminal output | `make dev-backend` |
| Frontend | Browser console | F12 → Console |
| Database | PostgreSQL logs | `docker logs toluai-postgres-dev` |
| Tests | `test-results/` | `npx playwright show-report` |

## 💡 Tips

1. **Hot Reload**: Both frontend and backend auto-reload on save
2. **API Testing**: Use Swagger UI at `/api/docs`
3. **Database GUI**: Use TablePlus or pgAdmin
4. **Mock Data**: Available for offline development
5. **Playwright UI**: Run `npx playwright test --ui`

---

Need help? Check [Full Documentation](docs/) or run `make help`