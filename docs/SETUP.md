# 🚀 ToluAI Setup Guide

## Prerequisites

Choose your setup method based on your needs:

| Method | Requirements | Best For |
|--------|-------------|----------|
| **Local** | Python 3.11+, Node 18+, PostgreSQL 15 | Active development |
| **Docker** | Docker Desktop | Quick start, isolation |
| **Hybrid** | Docker + local tools | Best performance |

## ⚡ Quick Start (5 minutes)

### Option 1: Automatic Setup (Recommended)

```bash
# Clone repository
git clone https://github.com/yourusername/toluai.git
cd toluai

# Run setup script
chmod +x setup.sh
./setup.sh
```

Choose from menu:
1. **Local** - Everything runs locally
2. **Docker** - Everything in containers
3. **Hybrid** - Database in Docker, apps local

### Option 2: Using Make

```bash
# One command setup
make quickstart

# Or step by step
make install        # Install dependencies
make setup         # Configure environment
make dev           # Start servers
```

### Option 3: Docker Only

```bash
# Start everything
docker-compose -f docker-compose.dev.yml up

# Access at
# Frontend: http://localhost:5173
# Backend: http://localhost:5001
```

### Option 4: Manual Setup

#### 1. Backend Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
createdb toluai_dev
flask db upgrade
python init_reference_data.py
python init_auth_system.py

# Create .env file
cp .env.example .env
# Edit .env with your settings
```

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Create .env file
cp .env.example .env
```

#### 3. Start Services

```bash
# Terminal 1: Backend
source venv/bin/activate
python run_dev.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

## 🔧 Environment Configuration

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://toluai_dev:toluai_dev_pass123@localhost:5432/toluai_dev

# Redis
REDIS_URL=redis://localhost:6379

# Security (generate your own for production)
SECRET_KEY=dev-secret-key-change-in-production
SECURITY_PASSWORD_SALT=dev-salt-change-in-production

# Flask
FLASK_ENV=development
FLASK_DEBUG=1
```

### Frontend (frontend/.env)

```env
VITE_API_URL=http://localhost:5001
VITE_APP_NAME=ToluAI
```

## 💻 VS Code DevContainer

1. Install "Dev Containers" extension
2. Open project folder
3. Click "Reopen in Container"
4. Everything auto-configures!

## ✅ Verify Installation

```bash
# Run verification script
./verify-setup.sh

# Or manually check
make health
```

## 🔥 Hot Reload Setup

Both frontend and backend support hot reload:

- **Frontend**: Automatic with Vite
- **Backend**: Automatic with Flask debug mode

No server restarts needed for code changes!

## 🐛 Common Issues

### Port Already in Use

```bash
# Kill specific port
lsof -ti:5001 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

### Database Connection Failed

```bash
# Reset database
make reset-db

# Or check PostgreSQL service
brew services restart postgresql  # macOS
sudo systemctl restart postgresql # Linux
```

### Node Modules Issues

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Permission Denied

```bash
chmod +x setup.sh verify-setup.sh
```

## 📱 Mobile Development

```bash
# Expose frontend for mobile testing
cd frontend
npm run dev -- --host 0.0.0.0

# Access from mobile: http://[your-ip]:5173
```

## 🎯 Next Steps

1. ✅ Verify setup: `make health`
2. 📚 Read [Developer Guide](DEVELOPER_GUIDE.md)
3. 🧪 Run tests: `make test`
4. 🚀 Start coding!

## 💡 Tips

- Use `make help` to see all commands
- Keep `docker-compose.dev.yml` for database only (hybrid mode)
- Install recommended VS Code extensions
- Use `.env.example` as template

---

[← Back to README](../README.md) | [Developer Guide →](DEVELOPER_GUIDE.md)