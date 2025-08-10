"""Test authentication and authorization"""

import pytest
from flask import url_for
from app.models import User, Role
from flask_security import hash_password


class TestAuthentication:
    """Test user authentication"""
    
    def test_user_registration(self, client):
        """Test user registration"""
        response = client.post('/register', data={
            'email': 'newuser@test.com',
            'password': 'password123',
            'password_confirm': 'password123',
            'name': 'New User'
        }, follow_redirects=True)
        
        assert response.status_code == 200
        
        # Check user was created
        user = User.query.filter_by(email='newuser@test.com').first()
        assert user is not None
        assert user.name == 'New User'
    
    def test_user_login(self, client, regular_user):
        """Test user login"""
        response = client.post('/login', data={
            'email': regular_user.email,
            'password': 'password123'
        }, follow_redirects=True)
        
        assert response.status_code == 200
        # Should redirect to dashboard after successful login
    
    def test_invalid_login(self, client):
        """Test login with invalid credentials"""
        response = client.post('/login', data={
            'email': 'invalid@test.com',
            'password': 'wrongpassword'
        }, follow_redirects=True)
        
        assert response.status_code == 200
        assert b'Invalid' in response.data or b'error' in response.data.lower()
    
    def test_logout(self, client, regular_user):
        """Test user logout"""
        # Login first
        client.post('/login', data={
            'email': regular_user.email,
            'password': 'password123'
        })
        
        # Then logout
        response = client.get('/logout', follow_redirects=True)
        assert response.status_code == 200
    
    def test_password_reset_request(self, client, regular_user):
        """Test password reset request"""
        response = client.post('/reset-password', data={
            'email': regular_user.email
        }, follow_redirects=True)
        
        assert response.status_code == 200


class TestAuthorization:
    """Test role-based authorization"""
    
    def test_admin_access(self, client, admin_user):
        """Test admin can access admin pages"""
        # Login as admin
        client.post('/login', data={
            'email': admin_user.email,
            'password': 'password123'
        })
        
        # Try to access admin page
        response = client.get('/admin/')
        assert response.status_code == 200
    
    def test_user_cannot_access_admin(self, client, regular_user):
        """Test regular user cannot access admin pages"""
        # Login as regular user
        client.post('/login', data={
            'email': regular_user.email,
            'password': 'password123'
        })
        
        # Try to access admin page
        response = client.get('/admin/')
        assert response.status_code == 403
    
    def test_unauthenticated_redirect(self, client):
        """Test unauthenticated users are redirected to login"""
        response = client.get('/dashboard')
        assert response.status_code == 302
        assert '/login' in response.location
    
    def test_role_assignment(self, db_session):
        """Test role assignment to users"""
        # Create roles
        admin_role = Role(name='admin', description='Administrator')
        underwriter_role = Role(name='underwriter', description='Underwriter')
        
        db_session.add(admin_role)
        db_session.add(underwriter_role)
        db_session.flush()
        
        # Create user
        user = User(
            email='underwriter@test.com',
            password=hash_password('password123'),
            name='Underwriter User',
            active=True
        )
        
        # Assign underwriter role
        user.roles.append(underwriter_role)
        
        db_session.add(user)
        db_session.commit()
        
        assert user.has_role('underwriter') is True
        assert user.is_underwriter() is True
        assert user.is_admin() is False


class TestAPIAuthentication:
    """Test API authentication with JWT"""
    
    def test_api_login(self, client, regular_user):
        """Test API login returns JWT token"""
        response = client.post('/api/v1/auth/login', json={
            'email': regular_user.email,
            'password': 'password123'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
        assert 'refresh_token' in data
    
    def test_api_protected_endpoint(self, client, auth_headers):
        """Test accessing protected API endpoint with JWT"""
        if not auth_headers:
            pytest.skip("No auth headers available")
        
        response = client.get('/api/v1/clients', headers=auth_headers)
        assert response.status_code == 200
    
    def test_api_unauthorized_access(self, client):
        """Test accessing protected API endpoint without token"""
        response = client.get('/api/v1/clients')
        assert response.status_code == 401
    
    def test_api_invalid_token(self, client):
        """Test accessing API with invalid token"""
        headers = {'Authorization': 'Bearer invalid-token'}
        response = client.get('/api/v1/clients', headers=headers)
        assert response.status_code == 401


class TestPasswordSecurity:
    """Test password security measures"""
    
    def test_password_hashing(self, db_session):
        """Test passwords are properly hashed"""
        user = User(
            email='test@security.com',
            password=hash_password('plaintext123'),
            name='Security Test',
            active=True
        )
        
        db_session.add(user)
        db_session.commit()
        
        # Password should be hashed, not plaintext
        assert user.password != 'plaintext123'
        assert len(user.password) > 50  # Hashed passwords are long
    
    def test_weak_password_rejection(self, client):
        """Test weak passwords are rejected"""
        response = client.post('/register', data={
            'email': 'weak@test.com',
            'password': '123',  # Too short
            'password_confirm': '123',
            'name': 'Weak Password User'
        })
        
        # Should not successfully register
        assert response.status_code != 302  # Not redirected (success)
        
        user = User.query.filter_by(email='weak@test.com').first()
        assert user is None  # User should not be created