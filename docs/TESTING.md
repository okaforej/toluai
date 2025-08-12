# 🧪 ToluAI Testing Guide

## Overview

| Test Type | Technology | Location | Command |
|-----------|------------|----------|---------|
| **Backend Unit** | Pytest | `backend/tests/` | `make test-backend` |
| **Frontend Unit** | Jest/Vitest | `frontend/src/__tests__/` | `make test-frontend` |
| **E2E Tests** | Playwright | `frontend/e2e/` | `make test-e2e` |
| **Integration** | Pytest | `tests/` | `pytest tests/` |

## Quick Commands

```bash
# Run all tests
make test

# Run with coverage
make test-coverage

# Run specific suite
make test-backend
make test-frontend
make test-e2e

# E2E with visible browser
make test-e2e-ui
```

## 🎭 E2E Testing with Playwright

### Setup

```bash
cd frontend
npx playwright install  # Install browsers
```

### Running E2E Tests

```bash
# Headless (CI mode)
npx playwright test

# With browser visible
npx playwright test --headed

# Specific test file
npx playwright test e2e/rbac-access-control

# Debug mode
npx playwright test --debug
```

### Available E2E Test Suites

| Test Suite | Description | File |
|------------|-------------|------|
| **CRUD Operations** | Entity management | `insured-entities-crud.spec.ts` |
| **RBAC** | Role-based access | `rbac-access-control.spec.ts` |
| **Dashboard** | Components & charts | `simple-dashboard-test.spec.ts` |
| **User Journey** | Complete workflows | `full-user-journey.spec.ts` |

### Writing E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('should create new entity', async ({ page }) => {
  // Login
  await page.goto('http://localhost:5173');
  await page.fill('input[type="email"]', 'admin@toluai.com');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.click('button[type="submit"]');
  
  // Navigate and test
  await page.click('text="Insured"');
  await page.click('button:has-text("Add Entity")');
  
  // Assertions
  await expect(page.locator('.modal')).toBeVisible();
});
```

## 🐍 Backend Testing

### Running Backend Tests

```bash
# All backend tests
pytest backend/tests

# With coverage
pytest backend/tests --cov=backend --cov-report=html

# Specific test
pytest backend/tests/test_auth.py::test_login

# Verbose output
pytest -v backend/tests
```

### Test Structure

```python
# backend/tests/test_irpa.py
def test_create_entity(client, auth_headers):
    """Test entity creation"""
    response = client.post(
        '/api/v2/irpa/insured-entities',
        json={'name': 'Test Entity', 'fico_score': 750},
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json['entity']['name'] == 'Test Entity'
```

## ⚛️ Frontend Testing

### Running Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Component Testing

```typescript
// frontend/src/__tests__/InsuredEntities.test.tsx
import { render, screen } from '@testing-library/react';
import InsuredEntities from '../components/InsuredEntities';

test('renders entity list', () => {
  render(<InsuredEntities />);
  const heading = screen.getByText(/Insured Entities/i);
  expect(heading).toBeInTheDocument();
});
```

## 🔒 RBAC Testing

Test all user roles:

```bash
# Run RBAC test suite
npx playwright test rbac-simple-test --headed
```

### Test Users

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@toluai.com | Admin123! | Full |
| Company Admin | company.admin@acme.com | CompanyAdmin123! | Limited |
| Risk Analyst | risk.analyst@acme.com | Analyst123! | Assessment |
| Viewer | viewer@acme.com | Viewer123! | Read-only |

## 📊 Test Coverage

### Generate Coverage Reports

```bash
# Backend coverage
pytest backend/tests --cov=backend --cov-report=html
open htmlcov/index.html

# Frontend coverage
cd frontend
npm test -- --coverage
```

### Coverage Goals

- Backend: > 80%
- Frontend: > 70%
- E2E: Critical paths 100%

## 🚦 CI/CD Testing

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          make test
```

## 🐛 Debugging Tests

### Playwright Debugging

```bash
# Debug mode
npx playwright test --debug

# Trace viewer
npx playwright test --trace on
npx playwright show-trace

# Screenshots on failure
npx playwright test --screenshot only-on-failure
```

### Python Debugging

```python
# Add breakpoint
import pdb; pdb.set_trace()

# Or use pytest debugging
pytest --pdb backend/tests
```

## 📈 Performance Testing

```bash
# Load testing with locust
locust -f tests/load_test.py --host=http://localhost:5001

# API performance
ab -n 1000 -c 10 http://localhost:5001/api/v2/health
```

## ✅ Testing Checklist

Before committing:

- [ ] Unit tests pass: `make test-backend && make test-frontend`
- [ ] E2E tests pass: `make test-e2e`
- [ ] Linting passes: `make lint`
- [ ] Coverage maintained: `make test-coverage`
- [ ] No console errors in browser
- [ ] API endpoints return correct status codes
- [ ] RBAC permissions verified

## 🔧 Test Utilities

### Reset Test Database

```bash
# Reset to clean state
make reset-test-db

# Or manually
flask db downgrade base
flask db upgrade
python init_test_data.py
```

### Mock Data

```python
# Use fixtures for consistent test data
@pytest.fixture
def sample_entity():
    return {
        'name': 'Test Entity',
        'fico_score': 750,
        'dti_ratio': 0.3
    }
```

---

[← Back to README](../README.md) | [Developer Guide →](DEVELOPER_GUIDE.md)