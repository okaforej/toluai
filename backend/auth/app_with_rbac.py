"""
Example Flask Application with Enhanced RBAC Integration
Shows how to integrate the RBAC system into your existing Flask app
"""

from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import timedelta
from typing import Dict, Any, Optional, List

# Import our RBAC system
from rbac_system import (
    rbac_manager, 
    require_permission, 
    require_role,
    create_rbac_routes,
    SystemPermissions,
    SYSTEM_ROLES
)

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///irpa.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'jwt-secret-key'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=8)

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

# Database Models (simplified example)
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    # Relationships
    company = db.relationship('Company', backref='users')
    user_roles = db.relationship('UserRole', backref='user', cascade='all, delete-orphan')
    
    @property
    def roles(self):
        """Get user roles as list of dictionaries"""
        return [
            {
                'id': ur.role.id,
                'name': ur.role.name,
                'display_name': ur.role.display_name,
                'description': ur.role.description,
                'is_system_role': ur.role.is_system_role,
                'permissions': ur.role.permissions_list
            }
            for ur in self.user_roles if ur.role.is_active
        ]
    
    def to_dict(self):
        """Convert user to dictionary for API responses"""
        return {
            'id': str(self.id),
            'email': self.email,
            'name': self.name,
            'company_id': str(self.company_id) if self.company_id else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'roles': self.roles,
        }

class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    display_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_system_role = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    # Relationships
    company = db.relationship('Company', backref='roles')
    role_permissions = db.relationship('RolePermission', backref='role', cascade='all, delete-orphan')
    
    @property
    def permissions_list(self):
        """Get role permissions as list"""
        permissions = []
        
        # For system roles, get permissions from SYSTEM_ROLES constant
        if self.is_system_role and self.name in SYSTEM_ROLES:
            role_data = SYSTEM_ROLES[self.name]
            for perm_attr in role_data['permissions']:
                perm_id = getattr(SystemPermissions, perm_attr, None)
                if perm_id:
                    resource, action = perm_id.split(':', 1) if ':' in perm_id else (perm_id, 'access')
                    permissions.append({
                        'id': perm_id,
                        'name': perm_attr.lower().replace('_', ' '),
                        'resource': resource,
                        'action': action,
                    })
        else:
            # For custom roles, get permissions from database
            permissions = [
                {
                    'id': rp.permission.name,
                    'name': rp.permission.display_name,
                    'resource': rp.permission.resource,
                    'action': rp.permission.action,
                }
                for rp in self.role_permissions if rp.permission.is_active
            ]
        
        return permissions

class Permission(db.Model):
    __tablename__ = 'permissions'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)  # e.g., 'users:read'
    display_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    resource = db.Column(db.String(50), nullable=False)  # e.g., 'users'
    action = db.Column(db.String(50), nullable=False)    # e.g., 'read'
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class UserRole(db.Model):
    __tablename__ = 'user_roles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    assigned_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    # Relationships
    role = db.relationship('Role')
    assigned_by_user = db.relationship('User', foreign_keys=[assigned_by])
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'role_id', name='_user_role_uc'),
    )

class RolePermission(db.Model):
    __tablename__ = 'role_permissions'
    
    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    permission_id = db.Column(db.Integer, db.ForeignKey('permissions.id'), nullable=False)
    
    # Relationships
    permission = db.relationship('Permission')
    
    __table_args__ = (
        db.UniqueConstraint('role_id', 'permission_id', name='_role_permission_uc'),
    )

# User loader for RBAC system
def load_user(user_id: str) -> Optional[Dict[str, Any]]:
    """Load user for RBAC system"""
    try:
        user = User.query.get(int(user_id))
        return user.to_dict() if user else None
    except (ValueError, TypeError):
        return None

# Initialize RBAC system
rbac_manager.init_app(app)
rbac_manager.set_user_loader(load_user)

# Authentication endpoints
@app.route('/api/v1/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    
    # Authenticate user (implement your authentication logic)
    user = User.query.filter_by(email=email, is_active=True).first()
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Create JWT token
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={'company_id': str(user.company_id) if user.company_id else None}
    )
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': access_token,  # Simplified - use separate refresh token in production
        'user': user.to_dict()
    })

# Example RBAC-protected endpoints
@app.route('/api/v1/users', methods=['GET'])
@require_permission(SystemPermissions.USERS_READ)
def list_users():
    """List users with permission checking"""
    users = User.query.filter_by(is_active=True).all()
    return jsonify({
        'users': [user.to_dict() for user in users],
        'pagination': {
            'total': len(users),
            'page': 1,
            'pages': 1,
            'per_page': len(users)
        }
    })

@app.route('/api/v1/users', methods=['POST'])
@require_permission(SystemPermissions.USERS_CREATE, company_scoped=True)
def create_user():
    """Create user with permission checking"""
    data = request.get_json()
    
    # Validate data
    if not data.get('email') or not data.get('name'):
        return jsonify({'error': 'Email and name are required'}), 400
    
    # Check if email already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'error': 'Email already exists'}), 409
    
    # Create user
    user = User(
        email=data['email'],
        name=data['name'],
        company_id=data.get('company_id')
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'User created successfully',
        'user': user.to_dict()
    }), 201

@app.route('/api/v1/users/<int:user_id>', methods=['PUT'])
@require_permission(SystemPermissions.USERS_UPDATE)
def update_user(user_id):
    """Update user with permission checking"""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    # Update fields
    if 'name' in data:
        user.name = data['name']
    if 'email' in data:
        # Check if email already exists for another user
        existing = User.query.filter(
            User.email == data['email'],
            User.id != user_id
        ).first()
        if existing:
            return jsonify({'error': 'Email already exists'}), 409
        user.email = data['email']
    
    db.session.commit()
    
    return jsonify({
        'message': 'User updated successfully',
        'user': user.to_dict()
    })

@app.route('/api/v1/users/<int:user_id>/roles', methods=['POST'])
@require_permission(SystemPermissions.USERS_MANAGE_ROLES)
def assign_user_role(user_id):
    """Assign role to user"""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    role_id = data.get('role_id')
    
    if not role_id:
        return jsonify({'error': 'role_id is required'}), 400
    
    role = Role.query.get(role_id)
    if not role:
        return jsonify({'error': 'Role not found'}), 404
    
    # Check if user already has this role
    existing = UserRole.query.filter_by(user_id=user_id, role_id=role_id).first()
    if existing:
        return jsonify({'error': 'User already has this role'}), 409
    
    # Assign role
    current_user_id = get_jwt_identity()
    user_role = UserRole(
        user_id=user_id,
        role_id=role_id,
        assigned_by=int(current_user_id) if current_user_id else None
    )
    
    db.session.add(user_role)
    db.session.commit()
    
    return jsonify({'message': 'Role assigned successfully'})

@app.route('/api/v1/users/<int:user_id>/roles/<int:role_id>', methods=['DELETE'])
@require_permission(SystemPermissions.USERS_MANAGE_ROLES)
def remove_user_role(user_id, role_id):
    """Remove role from user"""
    user_role = UserRole.query.filter_by(user_id=user_id, role_id=role_id).first()
    if not user_role:
        return jsonify({'error': 'User does not have this role'}), 404
    
    db.session.delete(user_role)
    db.session.commit()
    
    return jsonify({'message': 'Role removed successfully'})

@app.route('/api/v1/companies', methods=['GET'])
@require_permission(SystemPermissions.COMPANIES_READ)
def list_companies():
    """List companies - system admins see all, others see only their company"""
    current_user = load_user(get_jwt_identity())
    
    if any(role['name'] == 'system_admin' for role in current_user.get('roles', [])):
        # System admin can see all companies
        companies = Company.query.all()
    else:
        # Others can only see their own company
        company_id = current_user.get('company_id')
        if company_id:
            companies = Company.query.filter_by(id=company_id).all()
        else:
            companies = []
    
    return jsonify({
        'companies': [
            {
                'id': str(company.id),
                'name': company.name,
                'created_at': company.created_at.isoformat() if company.created_at else None
            }
            for company in companies
        ]
    })

# Error handlers
@app.errorhandler(403)
def forbidden(error):
    """Handle permission denied errors"""
    return jsonify({
        'error': 'Access denied',
        'code': 'FORBIDDEN',
        'message': 'You do not have permission to access this resource'
    }), 403

@app.errorhandler(404)
def not_found(error):
    """Handle not found errors"""
    return jsonify({
        'error': 'Resource not found',
        'code': 'NOT_FOUND'
    }), 404

def create_default_roles():
    """Create default system roles"""
    with app.app_context():
        for role_name, role_data in SYSTEM_ROLES.items():
            existing_role = Role.query.filter_by(name=role_name).first()
            if not existing_role:
                role = Role(
                    name=role_name,
                    display_name=role_data['display_name'],
                    description=role_data['description'],
                    is_system_role=True
                )
                db.session.add(role)
        
        db.session.commit()
        print("Default roles created successfully")

def create_default_permissions():
    """Create default system permissions"""
    with app.app_context():
        for attr_name in dir(SystemPermissions):
            if not attr_name.startswith('_'):
                perm_id = getattr(SystemPermissions, attr_name)
                resource, action = perm_id.split(':', 1) if ':' in perm_id else (perm_id, 'access')
                
                existing_perm = Permission.query.filter_by(name=perm_id).first()
                if not existing_perm:
                    permission = Permission(
                        name=perm_id,
                        display_name=attr_name.lower().replace('_', ' ').title(),
                        description=f'{action.title()} {resource.replace("_", " ").title()}',
                        resource=resource,
                        action=action
                    )
                    db.session.add(permission)
        
        db.session.commit()
        print("Default permissions created successfully")

# Create RBAC management routes
create_rbac_routes(app)

if __name__ == '__main__':
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Create default roles and permissions
        create_default_roles()
        create_default_permissions()
    
    app.run(debug=True, port=5175)