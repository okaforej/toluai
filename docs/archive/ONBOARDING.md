# 🚀 ToluAI Developer Onboarding

Welcome to ToluAI! This guide will get you up and running in minutes.

## 📋 Prerequisites

Before you begin, ensure you have ONE of the following:

### Option A: Local Development (Recommended)
- Git
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (optional, can use Docker)
- Redis (optional, can use Docker)

### Option B: Docker Development
- Git
- Docker Desktop
- 8GB+ RAM available for Docker

### Option C: VS Code DevContainer
- Git
- VS Code with DevContainers extension
- Docker Desktop

## 🎯 One-Click Setup Options

### Method 1: Automatic Setup Script (Recommended) ⭐

```bash
# Clone the repository
git clone https://github.com/yourusername/toluai.git
cd toluai

# Run the one-click setup
chmod +x setup.sh
./setup.sh
```

The script will:
1. Detect your OS (macOS, Linux, Windows WSL)
2. Install all required dependencies
3. Set up Python virtual environment
4. Install Node.js packages
5. Configure PostgreSQL database
6. Run migrations and seed data
7. Start all services
8. Open your browser to the app

### Method 2: Make Commands 🛠️

```bash
# Clone the repository
git clone https://github.com/yourusername/toluai.git
cd toluai

# One command to rule them all
make quickstart
```

This will install everything and start the development servers.

### Method 3: Docker Compose 🐳

```bash
# Clone the repository
git clone https://github.com/yourusername/toluai.git
cd toluai

# Start everything with Docker
docker-compose -f docker-compose.dev.yml up
```

Open http://localhost:5173 and you're ready!

### Method 4: VS Code DevContainer 💻

1. Open VS Code
2. Install "Dev Containers" extension
3. Open the project folder
4. Click "Reopen in Container" when prompted
5. Everything is automatically set up!

## 📁 Project Structure

```
toluai/
├── backend/          # Flask backend API
├── frontend/         # React/TypeScript frontend
├── app/             # Core application logic
├── config/          # Configuration files
├── docker/          # Docker configurations
├── tests/           # Test suites
├── docs/            # Documentation
├── setup.sh         # One-click setup script
├── Makefile         # Common commands
└── docker-compose.dev.yml  # Development containers
```

## 🔧 Common Commands

### Using Make (Easiest)

```bash
make dev          # Start development servers
make test         # Run all tests
make migrate      # Run database migrations
make lint         # Check code quality
make format       # Auto-format code
make clean        # Clean temporary files
make docker-up    # Start Docker environment
make docker-down  # Stop Docker environment
```

### Manual Commands

```bash
# Backend
source venv/bin/activate
python run_dev.py

# Frontend
cd frontend
npm run dev

# Tests
cd frontend
npm test                    # Unit tests
npx playwright test         # E2E tests
npx playwright test --ui    # E2E tests with UI
```

## 🌐 Access Points

Once running, you can access:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **API Documentation**: http://localhost:5001/api/docs
- **Database**: localhost:5432
- **Redis**: localhost:6379

## 👤 Default Credentials

### Admin Account
- Email: `admin@toluai.com`
- Password: `Admin123!`

### Test Accounts
- Company Admin: `company.admin@acme.com` / `CompanyAdmin123!`
- Risk Analyst: `risk.analyst@acme.com` / `Analyst123!`
- Underwriter: `underwriter@acme.com` / `Underwriter123!`
- Viewer: `viewer@acme.com` / `Viewer123!`

## 🧪 Running Tests

### All Tests
```bash
make test
```

### Specific Test Suites
```bash
# Backend unit tests
make test-backend

# Frontend unit tests
make test-frontend

# E2E tests (headless)
make test-e2e

# E2E tests (with browser)
make test-e2e-ui
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill processes on specific ports
lsof -ti:5001 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:5432 | xargs kill -9  # PostgreSQL
```

### Database Connection Issues
```bash
# Reset database
make reset-db

# Or manually
flask db downgrade base
flask db upgrade
make seed
```

### Node Modules Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Docker Issues
```bash
# Clean rebuild
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up
```

## 🔄 Daily Workflow

1. **Start your day**
   ```bash
   git pull origin main
   make dev
   ```

2. **Create a feature branch**
   ```bash
   make feature name=my-new-feature
   ```

3. **Run tests before committing**
   ```bash
   make test
   make lint
   ```

4. **Format code**
   ```bash
   make format
   ```

5. **Check everything is working**
   ```bash
   make health
   ```

## 📚 Additional Resources

- [API Documentation](http://localhost:5001/api/docs)
- [E2E Testing Guide](./frontend/E2E_AUTOMATION_GUIDE.md)
- [Backend Architecture](./docs/backend-architecture.md)
- [Frontend Architecture](./docs/frontend-architecture.md)

## 💡 Tips for New Developers

1. **Use the Makefile**: Most common tasks have a make command
2. **Check logs**: Backend logs are in the terminal, frontend in browser console
3. **Hot reload**: Both frontend and backend auto-reload on code changes
4. **Database GUI**: Use TablePlus, pgAdmin, or DBeaver to view database
5. **API testing**: Use Postman or the built-in Swagger UI
6. **VS Code recommended**: Best integration with our development tools

## 🆘 Getting Help

- Check the [Troubleshooting](#-troubleshooting) section
- Look at existing tests for examples
- Review the API documentation
- Ask the team in Slack/Discord
- Create an issue on GitHub

## 🎉 Ready to Code!

You should now have a fully functional development environment. 

Try these commands to verify everything is working:

```bash
# Check system info
make info

# Run health checks
make health

# See all available commands
make help
```

Welcome to the team! 🚀