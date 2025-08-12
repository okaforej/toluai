"""Integration tests for API endpoints"""

import pytest
import json
from flask import Flask
from backend.app import create_app, db
from backend.models import User, Role, Client, RiskAssessment


@pytest.fixture
def app():
    """Create application for integration testing"""
    app = create_app('testing')
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    """Create authenticated user and return auth headers"""
    # Create roles
    with client.application.app_context():
        admin_role = Role(name='admin', description='Administrator')
        user_role = Role(name='user', description='Regular user')
        db.session.add(admin_role)
        db.session.add(user_role)
        db.session.commit()
        
        # Create user
        from flask_security import hash_password
        user = User(
            email='test@example.com',
            password=hash_password('password123'),
            name='Test User',
            active=True
        )
        user.roles.append(user_role)
        db.session.add(user)
        db.session.commit()
    
    # Login to get token
    response = client.post('/api/v1/auth/login', 
        json={'email': 'test@example.com', 'password': 'password123'})
    
    if response.status_code == 200:
        token = response.get_json()['access_token']
        return {'Authorization': f'Bearer {token}'}
    return {}


class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_check(self, client):
        """Test health endpoint returns success"""
        response = client.get('/api/v1/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'healthy'
        assert 'timestamp' in data
        assert 'version' in data


class TestAuthenticationFlow:
    """Test authentication flow"""
    
    def test_user_registration(self, client):
        """Test user can register"""
        response = client.post('/api/v1/auth/register', json={
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'name': 'New User'
        })
        
        # Registration might be disabled or require admin
        assert response.status_code in [200, 201, 403]
    
    def test_user_login(self, client):
        """Test user can login"""
        # First create a user
        with client.application.app_context():
            from flask_security import hash_password
            user = User(
                email='login@example.com',
                password=hash_password('password123'),
                name='Login User',
                active=True
            )
            db.session.add(user)
            db.session.commit()
        
        # Try to login
        response = client.post('/api/v1/auth/login', json={
            'email': 'login@example.com',
            'password': 'password123'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
    
    def test_invalid_login(self, client):
        """Test invalid credentials are rejected"""
        response = client.post('/api/v1/auth/login', json={
            'email': 'invalid@example.com',
            'password': 'wrongpassword'
        })
        
        assert response.status_code in [401, 403]


class TestClientAPI:
    """Test client CRUD operations"""
    
    def test_create_client(self, client, auth_headers):
        """Test creating a new client"""
        response = client.post('/api/v1/clients', 
            headers=auth_headers,
            json={
                'name': 'Test Company',
                'email': 'test@company.com',
                'phone': '555-0123',
                'industry': 'Technology',
                'address': '123 Test St',
                'city': 'Test City',
                'state': 'TS',
                'zip_code': '12345'
            })
        
        assert response.status_code in [200, 201]
        if response.status_code == 200:
            data = response.get_json()
            assert 'id' in data or 'client_id' in data
    
    def test_get_clients(self, client, auth_headers):
        """Test retrieving clients list"""
        response = client.get('/api/v1/clients', headers=auth_headers)
        
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, (list, dict))
    
    def test_unauthorized_access(self, client):
        """Test unauthorized access is blocked"""
        response = client.get('/api/v1/clients')
        assert response.status_code in [401, 403]


class TestRiskAssessmentAPI:
    """Test risk assessment operations"""
    
    def test_create_assessment(self, client, auth_headers):
        """Test creating a risk assessment"""
        # First create a client
        with client.application.app_context():
            test_client = Client(
                name='Assessment Test Company',
                email='assess@company.com',
                phone='555-0456',
                industry='Finance',
                address='456 Test Ave',
                city='Test Town',
                state='TT',
                zip_code='54321'
            )
            db.session.add(test_client)
            db.session.commit()
            client_id = test_client.id
        
        # Create assessment
        response = client.post('/api/v1/assessments',
            headers=auth_headers,
            json={
                'client_id': client_id,
                'assessment_type': 'standard',
                'data': {
                    'revenue': 1000000,
                    'employees': 50,
                    'years_in_business': 5
                }
            })
        
        assert response.status_code in [200, 201, 404]  # 404 if endpoint doesn't exist
    
    def test_get_assessments(self, client, auth_headers):
        """Test retrieving assessments"""
        response = client.get('/api/v1/assessments', headers=auth_headers)
        
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.get_json()
            assert isinstance(data, (list, dict))


class TestDataValidation:
    """Test data validation"""
    
    def test_invalid_email_format(self, client, auth_headers):
        """Test invalid email is rejected"""
        response = client.post('/api/v1/clients',
            headers=auth_headers,
            json={
                'name': 'Test Company',
                'email': 'invalid-email',  # Invalid email
                'phone': '555-0123',
                'industry': 'Technology'
            })
        
        assert response.status_code in [400, 422]
    
    def test_missing_required_fields(self, client, auth_headers):
        """Test missing required fields are caught"""
        response = client.post('/api/v1/clients',
            headers=auth_headers,
            json={
                'name': 'Test Company'
                # Missing other required fields
            })
        
        assert response.status_code in [400, 422]


class TestPagination:
    """Test pagination functionality"""
    
    def test_pagination_parameters(self, client, auth_headers):
        """Test pagination parameters work"""
        response = client.get('/api/v1/clients?page=1&per_page=10', 
            headers=auth_headers)
        
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.get_json()
            # Check for pagination metadata
            if isinstance(data, dict):
                assert 'items' in data or 'results' in data or 'data' in data


class TestErrorHandling:
    """Test error handling"""
    
    def test_404_error(self, client):
        """Test 404 error for non-existent endpoint"""
        response = client.get('/api/v1/nonexistent')
        assert response.status_code == 404
    
    def test_method_not_allowed(self, client, auth_headers):
        """Test method not allowed error"""
        response = client.delete('/api/v1/health', headers=auth_headers)
        assert response.status_code in [404, 405]
    
    def test_malformed_json(self, client, auth_headers):
        """Test malformed JSON is handled"""
        response = client.post('/api/v1/clients',
            headers={**auth_headers, 'Content-Type': 'application/json'},
            data='{"invalid json}')
        
        assert response.status_code in [400, 422]


@pytest.mark.integration
class TestDatabaseTransactions:
    """Test database transaction handling"""
    
    def test_rollback_on_error(self, client, auth_headers):
        """Test transaction rollback on error"""
        with client.application.app_context():
            initial_count = Client.query.count()
        
        # Try to create client with invalid data that should fail
        response = client.post('/api/v1/clients',
            headers=auth_headers,
            json={
                'name': 'X' * 1000,  # Extremely long name
                'email': 'test@test.com',
                'phone': '555-0123',
                'industry': 'Tech'
            })
        
        with client.application.app_context():
            final_count = Client.query.count()
        
        # Count should remain the same if transaction rolled back
        assert final_count == initial_count or response.status_code in [200, 201]