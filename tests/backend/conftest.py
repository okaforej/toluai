"""Test configuration and fixtures"""

import pytest
import tempfile
import os
from backend.app import create_app, db
from backend.models import User, Role, Client, RiskAssessment
from flask_security import hash_password
from datetime import datetime


@pytest.fixture(scope='session')
def app():
    """Create application for testing"""
    db_fd, db_path = tempfile.mkstemp()
    
    app = create_app('testing')
    app.config['DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['WTF_CSRF_ENABLED'] = False
    app.config['TESTING'] = True
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()
    
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture(scope='function')
def client(app):
    """Create test client"""
    return app.test_client()


@pytest.fixture(scope='function')
def runner(app):
    """Create test runner"""
    return app.test_cli_runner()


@pytest.fixture(scope='function')
def db_session(app):
    """Create database session for testing"""
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()
        
        # Configure session to use the connection
        db.session.configure(bind=connection)
        
        yield db.session
        
        # Rollback transaction and close connection
        transaction.rollback()
        connection.close()
        db.session.configure(bind=None)


@pytest.fixture
def admin_user(db_session):
    """Create admin user for testing"""
    admin_role = Role(name='admin', description='Administrator')
    user_role = Role(name='user', description='Regular user')
    
    db_session.add(admin_role)
    db_session.add(user_role)
    db_session.flush()
    
    admin_user = User(
        email='admin@test.com',
        password=hash_password('password123'),
        name='Admin User',
        active=True,
        confirmed_at=datetime.utcnow()
    )
    admin_user.roles.append(admin_role)
    
    db_session.add(admin_user)
    db_session.commit()
    
    return admin_user


@pytest.fixture
def regular_user(db_session):
    """Create regular user for testing"""
    user_role = Role.query.filter_by(name='user').first()
    if not user_role:
        user_role = Role(name='user', description='Regular user')
        db_session.add(user_role)
        db_session.flush()
    
    user = User(
        email='user@test.com',
        password=hash_password('password123'),
        name='Regular User',
        active=True,
        confirmed_at=datetime.utcnow()
    )
    user.roles.append(user_role)
    
    db_session.add(user)
    db_session.commit()
    
    return user


@pytest.fixture
def test_client(db_session):
    """Create test client for testing"""
    client = Client(
        name='Test Company',
        email='test@company.com',
        phone='555-0123',
        address='123 Test St',
        city='Test City',
        state='TS',
        zip_code='12345',
        industry='Technology',
        annual_revenue=1000000.0,
        employee_count=50
    )
    
    db_session.add(client)
    db_session.commit()
    
    return client


@pytest.fixture
def test_assessment(db_session, regular_user, test_client):
    """Create test assessment"""
    assessment = RiskAssessment(
        client_id=test_client.id,
        user_id=regular_user.id,
        risk_score=65.0,
        risk_category='medium',
        confidence=0.85,
        model_version='1.0'
    )
    
    db_session.add(assessment)
    db_session.commit()
    
    return assessment


@pytest.fixture
def auth_headers(client, regular_user):
    """Get authentication headers for API testing"""
    # Login and get JWT token
    response = client.post('/api/v1/auth/login', json={
        'email': regular_user.email,
        'password': 'password123'
    })
    
    if response.status_code == 200:
        token = response.get_json()['access_token']
        return {'Authorization': f'Bearer {token}'}
    
    return {}


@pytest.fixture
def admin_auth_headers(client, admin_user):
    """Get admin authentication headers for API testing"""
    # Login and get JWT token
    response = client.post('/api/v1/auth/login', json={
        'email': admin_user.email,
        'password': 'password123'
    })
    
    if response.status_code == 200:
        token = response.get_json()['access_token']
        return {'Authorization': f'Bearer {token}'}
    
    return {}