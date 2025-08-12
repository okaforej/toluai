"""Database test helpers"""

import os
import tempfile
from contextlib import contextmanager
from backend.app import create_app, db
from backend.models import User, Role
from flask_security import hash_password


@contextmanager
def test_database():
    """Create a test database context"""
    # Create temporary database file
    db_fd, db_path = tempfile.mkstemp()
    
    # Create app with test config
    app = create_app('testing')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Create default roles
        admin_role = Role(name='admin', description='Administrator')
        user_role = Role(name='user', description='Regular User')
        db.session.add(admin_role)
        db.session.add(user_role)
        db.session.commit()
        
        yield app, db
        
        # Cleanup
        db.session.remove()
        db.drop_all()
    
    # Remove temporary file
    os.close(db_fd)
    os.unlink(db_path)


def create_test_user(email='test@example.com', password='password123', role='user'):
    """Create a test user"""
    user = User(
        email=email,
        password=hash_password(password),
        name='Test User',
        active=True
    )
    
    # Add role
    role_obj = Role.query.filter_by(name=role).first()
    if role_obj:
        user.roles.append(role_obj)
    
    db.session.add(user)
    db.session.commit()
    
    return user


def create_test_admin(email='admin@example.com', password='admin123'):
    """Create a test admin user"""
    return create_test_user(email, password, 'admin')


class DatabaseTestCase:
    """Base class for database tests"""
    
    @classmethod
    def setup_class(cls):
        """Set up test database"""
        cls.app = create_app('testing')
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
        db.create_all()
        cls.setup_roles()
    
    @classmethod
    def teardown_class(cls):
        """Tear down test database"""
        db.session.remove()
        db.drop_all()
        cls.app_context.pop()
    
    @classmethod
    def setup_roles(cls):
        """Create default roles"""
        admin_role = Role(name='admin', description='Administrator')
        user_role = Role(name='user', description='Regular User')
        db.session.add(admin_role)
        db.session.add(user_role)
        db.session.commit()
    
    def setup_method(self):
        """Set up for each test"""
        self.client = self.app.test_client()
    
    def teardown_method(self):
        """Clean up after each test"""
        # Clean all tables except roles
        for table in reversed(db.metadata.sorted_tables):
            if table.name != 'role':
                db.session.execute(table.delete())
        db.session.commit()