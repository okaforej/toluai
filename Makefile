# ToluAI Development Makefile
# One-command development tasks

.PHONY: help install setup dev test clean docker-up docker-down migrate lint format

# Default target
help:
	@echo "ToluAI Development Commands:"
	@echo ""
	@echo "  make install    - One-click install all dependencies"
	@echo "  make setup      - Complete project setup (first time)"
	@echo "  make dev        - Start development servers"
	@echo "  make test       - Run all tests"
	@echo "  make docker-up  - Start Docker environment"
	@echo "  make docker-down- Stop Docker environment"
	@echo "  make migrate    - Run database migrations"
	@echo "  make lint       - Run linters"
	@echo "  make format     - Format code"
	@echo "  make clean      - Clean temporary files"
	@echo ""

# One-click install
install:
	@echo "🚀 Installing ToluAI dependencies..."
	@chmod +x setup.sh
	@./setup.sh

# Complete setup
setup: install migrate seed
	@echo "✅ Setup complete!"

# Install backend dependencies
install-backend:
	@echo "📦 Installing Python dependencies..."
	@python3 -m venv venv
	@. venv/bin/activate && pip install --upgrade pip
	@. venv/bin/activate && pip install -r requirements.txt

# Install frontend dependencies  
install-frontend:
	@echo "📦 Installing Node dependencies..."
	@cd frontend && npm install
	@cd frontend && npx playwright install

# Start development servers
dev:
	@echo "🚀 Starting development servers..."
	@make -j 2 dev-backend dev-frontend

dev-backend:
	@echo "🔧 Starting backend..."
	@. venv/bin/activate && python run_dev.py

dev-frontend:
	@echo "🌐 Starting frontend..."
	@cd frontend && npm run dev

# Docker commands
docker-up:
	@echo "🐳 Starting Docker environment..."
	@docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ Docker environment ready!"
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:5001"

docker-down:
	@echo "🛑 Stopping Docker environment..."
	@docker-compose -f docker-compose.dev.yml down

docker-logs:
	@docker-compose -f docker-compose.dev.yml logs -f

docker-rebuild:
	@echo "🔨 Rebuilding Docker containers..."
	@docker-compose -f docker-compose.dev.yml down
	@docker-compose -f docker-compose.dev.yml build --no-cache
	@docker-compose -f docker-compose.dev.yml up -d

# Database commands
migrate:
	@echo "🗄️ Running database migrations..."
	@. venv/bin/activate && flask db upgrade

migrate-create:
	@echo "📝 Creating new migration..."
	@. venv/bin/activate && flask db migrate -m "$(msg)"

migrate-rollback:
	@echo "⏪ Rolling back migration..."
	@. venv/bin/activate && flask db downgrade

seed:
	@echo "🌱 Seeding database..."
	@. venv/bin/activate && python init_reference_data.py
	@. venv/bin/activate && python init_auth_system.py

# Testing
test:
	@echo "🧪 Running all tests..."
	@make test-backend
	@make test-frontend
	@make test-e2e

test-backend:
	@echo "🧪 Running backend tests..."
	@. venv/bin/activate && pytest backend/tests

test-frontend:
	@echo "🧪 Running frontend tests..."
	@cd frontend && npm test

test-e2e:
	@echo "🧪 Running E2E tests..."
	@cd frontend && npx playwright test

test-e2e-ui:
	@echo "🧪 Running E2E tests with UI..."
	@cd frontend && npx playwright test --headed

# Code quality
lint:
	@echo "🔍 Running linters..."
	@make lint-backend
	@make lint-frontend

lint-backend:
	@echo "🔍 Linting Python code..."
	@. venv/bin/activate && flake8 backend app config
	@. venv/bin/activate && black --check backend app config

lint-frontend:
	@echo "🔍 Linting TypeScript code..."
	@cd frontend && npm run lint

format:
	@echo "✨ Formatting code..."
	@make format-backend
	@make format-frontend

format-backend:
	@echo "✨ Formatting Python code..."
	@. venv/bin/activate && black backend app config
	@. venv/bin/activate && isort backend app config

format-frontend:
	@echo "✨ Formatting TypeScript code..."
	@cd frontend && npm run format

# Utility commands
clean:
	@echo "🧹 Cleaning temporary files..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete
	@find . -type f -name ".DS_Store" -delete
	@rm -rf .pytest_cache
	@rm -rf frontend/node_modules/.cache
	@rm -rf frontend/dist
	@echo "✅ Cleaned!"

reset-db:
	@echo "⚠️  Resetting database..."
	@. venv/bin/activate && flask db downgrade base
	@. venv/bin/activate && flask db upgrade
	@make seed

# Health checks
health:
	@echo "🏥 Running health checks..."
	@curl -s http://localhost:5001/health | python3 -m json.tool || echo "❌ Backend not responding"
	@curl -s http://localhost:5173 > /dev/null && echo "✅ Frontend is running" || echo "❌ Frontend not responding"

# Quick start for new developers
quickstart:
	@echo "🚀 Quick Start for ToluAI Development"
	@echo "======================================"
	@make install
	@make setup
	@make dev

# Create a new feature branch
feature:
	@if [ -z "$(name)" ]; then \
		echo "Usage: make feature name=feature-name"; \
		exit 1; \
	fi
	@git checkout -b feature/$(name)
	@echo "✅ Created feature branch: feature/$(name)"

# Show current environment info
info:
	@echo "ToluAI Environment Information"
	@echo "=============================="
	@echo "Python: $$(python3 --version)"
	@echo "Node: $$(node --version)"
	@echo "NPM: $$(npm --version)"
	@echo "Docker: $$(docker --version)"
	@echo "Git Branch: $$(git branch --show-current)"
	@echo ""
	@echo "Services Status:"
	@make health