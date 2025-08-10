from backend.app import db
from flask_security import UserMixin, RoleMixin
from datetime import datetime

# Define models for Flask-Security
roles_users = db.Table('roles_users',
    db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
    db.Column('role_id', db.Integer(), db.ForeignKey('role.id'))
)


class Role(db.Model, RoleMixin):
    """Role model for Flask-Security"""
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))
    
    def __repr__(self):
        return f'<Role {self.name}>'


class User(db.Model, UserMixin):
    """Enhanced User model for Flask-Security with additional fields"""
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    
    # Flask-Security required fields
    active = db.Column(db.Boolean(), default=True)
    fs_uniquifier = db.Column(db.String(64), unique=True, nullable=False)
    confirmed_at = db.Column(db.DateTime())
    
    # Additional profile fields
    phone = db.Column(db.String(20))
    company = db.Column(db.String(100))
    job_title = db.Column(db.String(100))
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = db.Column(db.DateTime())
    current_login_at = db.Column(db.DateTime())
    last_login_ip = db.Column(db.String(100))
    current_login_ip = db.Column(db.String(100))
    login_count = db.Column(db.Integer(), default=0)
    
    # Relationships
    roles = db.relationship('Role', secondary=roles_users, backref=db.backref('users', lazy='dynamic'))
    assessments = db.relationship('RiskAssessment', foreign_keys='RiskAssessment.user_id', backref='assessor', lazy='dynamic')
    reviewed_assessments = db.relationship('RiskAssessment', foreign_keys='RiskAssessment.reviewed_by', backref='reviewer', lazy='dynamic')
    
    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        # Generate fs_uniquifier if not provided
        if not self.fs_uniquifier:
            import uuid
            self.fs_uniquifier = str(uuid.uuid4())
    
    def has_role(self, role_name):
        """Check if user has a specific role"""
        return role_name in [role.name for role in self.roles]
    
    def is_admin(self):
        """Check if user is an administrator"""
        return self.has_role('admin')
    
    def is_underwriter(self):
        """Check if user is an underwriter"""
        return self.has_role('underwriter')
    
    def get_full_name(self):
        """Get user's full name"""
        return self.name
    
    def get_initials(self):
        """Get user's initials"""
        return ''.join([word[0].upper() for word in self.name.split() if word])
    
    def to_dict(self):
        """Convert user to dictionary representation"""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'phone': self.phone,
            'company': self.company,
            'job_title': self.job_title,
            'active': self.active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'roles': [role.name for role in self.roles],
            'login_count': self.login_count,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None
        }
    
    def __repr__(self):
        return f'<User {self.email}>'