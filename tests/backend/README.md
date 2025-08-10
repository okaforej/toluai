# Backend Tests

This directory contains tests for the Flask backend application.

## Structure

- `test_api.py` - API endpoint tests
- `test_auth.py` - Authentication tests
- `test_models.py` - Database model tests
- `conftest.py` - Test fixtures and configuration

## Running Tests

```bash
# Run all backend tests
pytest tests/backend/

# Run with coverage
pytest tests/backend/ --cov=backend --cov-report=html

# Run specific test file
pytest tests/backend/test_api.py
```

## Test Database

Tests use a separate SQLite database configured in `conftest.py`.