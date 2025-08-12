# Getting Started

## Setup (Pick One)

### Option A: Automatic (Recommended)
```bash
./setup.sh        # Interactive setup
# OR
make quickstart   # Fully automated
```

### Option B: Docker
```bash
docker-compose -f docker-compose.dev.yml up
```

### Option C: Manual
```bash
# Backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
flask db upgrade && python init_reference_data.py

# Frontend  
cd frontend && npm install && npm run dev
```

## Environment Variables

Create `.env`:
```env
DATABASE_URL=postgresql://toluai_dev:toluai_dev_pass123@localhost:5432/toluai_dev
SECRET_KEY=dev-secret-key
FLASK_ENV=development
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5001
```

## Test Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@toluai.com | Admin123! |
| Company Admin | company.admin@acme.com | CompanyAdmin123! |
| Analyst | risk.analyst@acme.com | Analyst123! |
| Viewer | viewer@acme.com | Viewer123! |

## Development Workflow

```bash
make dev          # Start servers
make test         # Run tests  
make lint         # Check code
make format       # Format code
```

## Testing

```bash
# All tests
make test

# Specific
make test-backend   # Python
make test-frontend  # React  
make test-e2e      # Playwright
```

### E2E Test Suites
- `rbac-access-control.spec.ts` - Role permissions
- `insured-entities-crud.spec.ts` - CRUD operations
- `simple-dashboard-test.spec.ts` - Dashboard components

## Project Structure

```
toluai/
├── frontend/       # React app
├── backend/        # Flask API
├── docs/          # Documentation
└── tests/         # Test suites
```

## Common Issues

**Port in use:**
```bash
lsof -ti:5001 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

**Reset database:**
```bash
make reset-db
```

**Clean install:**
```bash
make clean && make quickstart
```

## VS Code Setup

1. Install DevContainers extension
2. Open project → "Reopen in Container"
3. Everything auto-configures!

## Next Steps

- Read [Technical Docs](TECHNICAL.md) for API & architecture
- Check [Operations](OPERATIONS.md) for deployment
- Run `make help` for all commands