"""
Unified Authentication and Authorization Models
Single source of truth for users, roles, and permissions
"""

from app import db
from flask_security import UserMixin, RoleMixin
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

# Association tables
roles_users = db.Table('roles_users',
    db.Column('user_id', db.Integer(), db.ForeignKey('user.id'), primary_key=True),
    db.Column('role_id', db.Integer(), db.ForeignKey('role.id'), primary_key=True),
    db.Column('assigned_at', db.DateTime, default=datetime.utcnow),
    db.Column('assigned_by', db.Integer, db.ForeignKey('user.id'))
)

role_permissions = db.Table('role_permissions',
    db.Column('role_id', db.Integer, db.ForeignKey('role.id'), primary_key=True),
    db.Column('permission_id', db.Integer, db.ForeignKey('permission.id'), primary_key=True)
)


class Permission(db.Model):
    """Permission model for fine-grained access control"""
    __tablename__ = 'permission'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    resource = db.Column(db.String(50), nullable=False)  # e.g., 'company', 'user', 'assessment'
    action = db.Column(db.String(50), nullable=False)  # e.g., 'view', 'create', 'edit', 'delete'
    scope = db.Column(db.String(20), nullable=False)  # 'own', 'company', 'all'
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'resource': self.resource,
            'action': self.action,
            'scope': self.scope,
            'description': self.description
        }


class Role(db.Model, RoleMixin):
    """Role model for Flask-Security with permissions"""
    __tablename__ = 'role'
    
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    display_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    is_system_role = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    permissions = db.relationship('Permission', secondary=role_permissions, 
                                 backref=db.backref('roles', lazy='dynamic'))
    
    def has_permission(self, permission_name):
        """Check if role has a specific permission"""
        return any(p.name == permission_name for p in self.permissions)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'description': self.description,
            'is_system_role': self.is_system_role,
            'permissions': [p.to_dict() for p in self.permissions]
        }
    
    def __repr__(self):
        return f'<Role {self.name}>'


class User(db.Model, UserMixin):
    """Unified User model with company association"""
    __tablename__ = 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    
    # Flask-Security required fields
    active = db.Column(db.Boolean(), default=True)
    fs_uniquifier = db.Column(db.String(64), unique=True, nullable=False)
    confirmed_at = db.Column(db.DateTime())
    
    # Company association (critical for company-level isolation)
    company_id = db.Column(db.Integer, db.ForeignKey('irpa_companies.id'))
    company = db.relationship('IRPACompany', backref='company_users')
    
    # Additional profile fields
    phone = db.Column(db.String(20))
    job_title = db.Column(db.String(100))
    department = db.Column(db.String(100))
    
    # Timestamps and tracking
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = db.Column(db.DateTime())
    current_login_at = db.Column(db.DateTime())
    last_login_ip = db.Column(db.String(100))
    current_login_ip = db.Column(db.String(100))
    login_count = db.Column(db.Integer(), default=0)
    
    # Relationships
    roles = db.relationship('Role', secondary=roles_users, 
                          backref=db.backref('users', lazy='dynamic'))
    
    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)
        # Generate fs_uniquifier if not provided
        if not self.fs_uniquifier:
            self.fs_uniquifier = str(uuid.uuid4())
        # Hash password if provided as plain text
        if 'password' in kwargs and not kwargs['password'].startswith('pbkdf2:') and not kwargs['password'].startswith('$'):
            self.password = generate_password_hash(kwargs['password'])
    
    def set_password(self, password):
        """Set user password (hashed)"""
        self.password = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches"""
        return check_password_hash(self.password, password)
    
    def has_role(self, role_name):
        """Check if user has a specific role"""
        return any(role.name == role_name for role in self.roles)
    
    def has_any_role(self, role_names):
        """Check if user has any of the specified roles"""
        return any(self.has_role(role_name) for role_name in role_names)
    
    def has_permission(self, permission_name):
        """Check if user has a specific permission (through roles)"""
        for role in self.roles:
            if role.has_permission(permission_name):
                return True
        return False
    
    def get_all_permissions(self):
        """Get all permissions user has through their roles"""
        permissions = set()
        for role in self.roles:
            for permission in role.permissions:
                permissions.add(permission)
        return list(permissions)
    
    def can_access_company(self, company_id):
        """Check if user can access data from a specific company"""
        # System admins can access all companies
        if self.has_role('system_admin'):
            return True
        # Company admins and other roles can only access their own company
        return self.company_id == company_id
    
    def can_modify_user(self, target_user):
        """Check if this user can modify another user"""
        # System admins can modify anyone
        if self.has_role('system_admin'):
            return True
        # Company admins can modify users in their company
        if self.has_role('company_admin'):
            return self.company_id == target_user.company_id
        # Users can only modify themselves
        return self.id == target_user.id
    
    def to_dict(self, include_permissions=False):
        """Convert user to dictionary representation"""
        data = {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'phone': self.phone,
            'company_id': self.company_id,
            'company': self.company.name if self.company else None,
            'job_title': self.job_title,
            'department': self.department,
            'active': self.active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'roles': [role.name for role in self.roles],
            'login_count': self.login_count,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None
        }
        
        if include_permissions:
            data['permissions'] = [p.name for p in self.get_all_permissions()]
        
        return data
    
    def get_jwt_claims(self):
        """Get claims to include in JWT token"""
        return {
            'user_id': self.id,
            'email': self.email,
            'name': self.name,
            'company_id': self.company_id,
            'roles': [role.name for role in self.roles],
            'permissions': [p.name for p in self.get_all_permissions()]
        }
    
    def __repr__(self):
        return f'<User {self.email}>'


# System role definitions
SYSTEM_ROLES = {
    'system_admin': {
        'display_name': 'System Administrator',
        'description': 'Full system access and configuration',
        'permissions': ['*']  # Will be handled specially
    },
    'company_admin': {
        'display_name': 'Company Administrator',
        'description': 'Manages company users and settings',
        'permissions': [
            'company.view.company', 'company.edit.company',
            'user.view.company', 'user.create.company', 'user.edit.company', 'user.delete.company',
            'entity.view.company', 'entity.create.company', 'entity.edit.company',
            'assessment.view.company', 'assessment.create.company',
            'rule.view.company', 'rule.create.company', 'rule.edit.company',
            'report.view.company', 'report.create.company'
        ]
    },
    'risk_analyst': {
        'display_name': 'Risk Analyst',
        'description': 'Conducts risk assessments and analysis',
        'permissions': [
            'entity.view.company', 'entity.create.company', 'entity.edit.company',
            'assessment.view.company', 'assessment.create.company', 'assessment.edit.company',
            'report.view.company', 'report.create.company'
        ]
    },
    'underwriter': {
        'display_name': 'Underwriter',
        'description': 'Reviews and approves risk assessments',
        'permissions': [
            'entity.view.company',
            'assessment.view.company', 'assessment.approve.company',
            'report.view.company'
        ]
    },
    'compliance_officer': {
        'display_name': 'Compliance Officer',
        'description': 'Monitors compliance and audit trails',
        'permissions': [
            'entity.view.company',
            'assessment.view.company',
            'audit.view.company',
            'compliance.view.company', 'compliance.edit.company',
            'report.view.company', 'report.create.company'
        ]
    },
    'read_only': {
        'display_name': 'Read-Only User',
        'description': 'View-only access to company data',
        'permissions': [
            'entity.view.company',
            'assessment.view.company',
            'report.view.company'
        ]
    }
}