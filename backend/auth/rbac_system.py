"""
Enhanced RBAC System for Flask Backend
Uses Flask-Principal for permission-based access control
"""

from flask import current_app, request, jsonify
from flask_principal import Principal, Permission, RoleNeed, identity_loaded, ActionNeed, ItemNeed
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from functools import wraps
from enum import Enum
from typing import List, Dict, Any, Optional, Union
import logging

# Initialize Flask-Principal
principal = Principal()

# Define system permissions as constants
class SystemPermissions:
    # User Management
    USERS_READ = 'users:read'
    USERS_CREATE = 'users:create'
    USERS_UPDATE = 'users:update'
    USERS_DELETE = 'users:delete'
    USERS_MANAGE_ROLES = 'users:manage_roles'
    USERS_VIEW_ALL_COMPANIES = 'users:view_all_companies'
    
    # Company Management
    COMPANIES_READ = 'companies:read'
    COMPANIES_CREATE = 'companies:create'
    COMPANIES_UPDATE = 'companies:update'
    COMPANIES_DELETE = 'companies:delete'
    COMPANIES_MANAGE_USERS = 'companies:manage_users'
    
    # Risk Assessments
    ASSESSMENTS_READ = 'assessments:read'
    ASSESSMENTS_CREATE = 'assessments:create'
    ASSESSMENTS_UPDATE = 'assessments:update'
    ASSESSMENTS_DELETE = 'assessments:delete'
    ASSESSMENTS_APPROVE = 'assessments:approve'
    ASSESSMENTS_VIEW_ALL = 'assessments:view_all'
    
    # Insured Entities
    ENTITIES_READ = 'entities:read'
    ENTITIES_CREATE = 'entities:create'
    ENTITIES_UPDATE = 'entities:update'
    ENTITIES_DELETE = 'entities:delete'
    ENTITIES_VIEW_ALL = 'entities:view_all'
    
    # System Administration
    SYSTEM_ADMIN = 'system:admin'
    SYSTEM_SETTINGS = 'system:settings'
    SYSTEM_AUDIT = 'system:audit'
    SYSTEM_REFERENCE_DATA = 'system:reference_data'
    
    # Reports and Analytics
    REPORTS_VIEW = 'reports:view'
    REPORTS_CREATE = 'reports:create'
    REPORTS_EXPORT = 'reports:export'
    
    # External Risk Signals
    EXTERNAL_RISK_VIEW = 'external_risk:view'
    EXTERNAL_RISK_MANAGE = 'external_risk:manage'

# Create permission objects
class PermissionRegistry:
    """Registry for all system permissions"""
    
    def __init__(self):
        self._permissions = {}
        self._register_default_permissions()
    
    def _register_default_permissions(self):
        """Register all default system permissions"""
        for attr_name in dir(SystemPermissions):
            if not attr_name.startswith('_'):
                permission_id = getattr(SystemPermissions, attr_name)
                self._permissions[permission_id] = Permission(ActionNeed(permission_id))
    
    def get_permission(self, permission_id: str) -> Permission:
        """Get a permission object by ID"""
        if permission_id not in self._permissions:
            # Create dynamic permission
            self._permissions[permission_id] = Permission(ActionNeed(permission_id))
        return self._permissions[permission_id]
    
    def get_all_permissions(self) -> Dict[str, Permission]:
        """Get all registered permissions"""
        return self._permissions.copy()

# Global permission registry
permission_registry = PermissionRegistry()

# System roles with their default permissions
SYSTEM_ROLES = {
    'system_admin': {
        'display_name': 'System Administrator',
        'description': 'Full system access across all companies and features',
        'permissions': [
            # All permissions for system admin
            perm for perm in dir(SystemPermissions) 
            if not perm.startswith('_')
        ],
    },
    'company_admin': {
        'display_name': 'Company Administrator',
        'description': 'Full access within company scope',
        'permissions': [
            SystemPermissions.USERS_READ,
            SystemPermissions.USERS_CREATE,
            SystemPermissions.USERS_UPDATE,
            SystemPermissions.USERS_MANAGE_ROLES,
            SystemPermissions.COMPANIES_READ,
            SystemPermissions.COMPANIES_UPDATE,
            SystemPermissions.ASSESSMENTS_READ,
            SystemPermissions.ASSESSMENTS_CREATE,
            SystemPermissions.ASSESSMENTS_UPDATE,
            SystemPermissions.ASSESSMENTS_DELETE,
            SystemPermissions.ENTITIES_READ,
            SystemPermissions.ENTITIES_CREATE,
            SystemPermissions.ENTITIES_UPDATE,
            SystemPermissions.ENTITIES_DELETE,
            SystemPermissions.REPORTS_VIEW,
            SystemPermissions.REPORTS_CREATE,
            SystemPermissions.REPORTS_EXPORT,
        ],
    },
    'risk_analyst': {
        'display_name': 'Risk Analyst',
        'description': 'Risk assessment and analysis capabilities',
        'permissions': [
            SystemPermissions.ASSESSMENTS_READ,
            SystemPermissions.ASSESSMENTS_CREATE,
            SystemPermissions.ASSESSMENTS_UPDATE,
            SystemPermissions.ENTITIES_READ,
            SystemPermissions.ENTITIES_CREATE,
            SystemPermissions.ENTITIES_UPDATE,
            SystemPermissions.REPORTS_VIEW,
            SystemPermissions.EXTERNAL_RISK_VIEW,
        ],
    },
    'underwriter': {
        'display_name': 'Underwriter',
        'description': 'Underwriting and approval capabilities',
        'permissions': [
            SystemPermissions.ASSESSMENTS_READ,
            SystemPermissions.ASSESSMENTS_APPROVE,
            SystemPermissions.ENTITIES_READ,
            SystemPermissions.REPORTS_VIEW,
        ],
    },
    'compliance_officer': {
        'display_name': 'Compliance Officer',
        'description': 'Compliance monitoring and audit access',
        'permissions': [
            SystemPermissions.SYSTEM_AUDIT,
            SystemPermissions.REPORTS_VIEW,
            SystemPermissions.REPORTS_EXPORT,
            SystemPermissions.EXTERNAL_RISK_VIEW,
            SystemPermissions.ASSESSMENTS_READ,
            SystemPermissions.ENTITIES_READ,
        ],
    },
    'viewer': {
        'display_name': 'Viewer',
        'description': 'Read-only access to relevant data',
        'permissions': [
            SystemPermissions.ASSESSMENTS_READ,
            SystemPermissions.ENTITIES_READ,
            SystemPermissions.REPORTS_VIEW,
        ],
    },
}

class RBACManager:
    """Main RBAC management class"""
    
    def __init__(self, app=None, user_loader=None):
        self.app = app
        self.user_loader = user_loader
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize the RBAC system with Flask app"""
        self.app = app
        
        # Initialize Flask-Principal
        principal.init_app(app)
        
        # Set up identity loader
        @identity_loaded.connect_via(app)
        def on_identity_loaded(sender, identity):
            self.load_user_identity(identity)
    
    def set_user_loader(self, user_loader):
        """Set the user loader function"""
        self.user_loader = user_loader
    
    def load_user_identity(self, identity):
        """Load user permissions into the identity"""
        if not self.user_loader:
            return
        
        try:
            # Get user from JWT token
            user_id = get_jwt_identity()
            if not user_id:
                return
            
            # Load user with roles and permissions
            user = self.user_loader(user_id)
            if not user:
                return
            
            # Add user identity
            identity.user = user
            
            # Add role needs
            for role in user.get('roles', []):
                identity.provides.add(RoleNeed(role['name']))
            
            # Add permission needs
            permissions = self.get_user_permissions(user)
            for permission in permissions:
                identity.provides.add(ActionNeed(permission['id']))
            
            # Add company-scoped permissions if applicable
            company_id = user.get('company_id')
            if company_id:
                identity.provides.add(ItemNeed('company', company_id, 'member'))
        
        except Exception as e:
            current_app.logger.error(f"Error loading user identity: {e}")
    
    def get_user_permissions(self, user: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get all effective permissions for a user"""
        permissions = []
        permission_ids = set()
        
        # Get permissions from roles
        for role in user.get('roles', []):
            role_name = role.get('name', '')
            if role_name in SYSTEM_ROLES:
                role_permissions = SYSTEM_ROLES[role_name]['permissions']
                for perm_attr in role_permissions:
                    perm_id = getattr(SystemPermissions, perm_attr, None)
                    if perm_id and perm_id not in permission_ids:
                        permission_ids.add(perm_id)
                        resource, action = perm_id.split(':', 1) if ':' in perm_id else (perm_id, 'access')
                        permissions.append({
                            'id': perm_id,
                            'name': perm_attr.lower().replace('_', ' '),
                            'description': f'{action} {resource}'.replace('_', ' ').title(),
                            'resource': resource,
                            'action': action,
                            'scope': 'global' if resource == 'system' else 'company',
                        })
        
        # Add direct permissions if any
        for perm in user.get('direct_permissions', []):
            if perm['id'] not in permission_ids:
                permissions.append(perm)
        
        return permissions

# Global RBAC manager instance
rbac_manager = RBACManager()

def require_permission(permission_id: str, company_scoped: bool = False):
    """Decorator to require specific permission"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            permission = permission_registry.get_permission(permission_id)
            
            if not permission.can():
                return jsonify({
                    'error': f'Permission denied. Required permission: {permission_id}',
                    'code': 'INSUFFICIENT_PERMISSIONS'
                }), 403
            
            # Additional company scope check if needed
            if company_scoped:
                user_id = get_jwt_identity()
                if not user_id:
                    return jsonify({'error': 'Invalid token'}), 401
                
                # Load user to check company
                user = rbac_manager.user_loader(user_id) if rbac_manager.user_loader else None
                if not user:
                    return jsonify({'error': 'User not found'}), 401
                
                # Check if user belongs to the company being accessed
                requested_company_id = request.json.get('company_id') if request.json else None
                if requested_company_id and user.get('company_id') != requested_company_id:
                    # Allow system admins to access any company
                    if not any(role['name'] == 'system_admin' for role in user.get('roles', [])):
                        return jsonify({
                            'error': 'Access denied to this company',
                            'code': 'COMPANY_ACCESS_DENIED'
                        }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_role(role_name: str):
    """Decorator to require specific role"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            role_permission = Permission(RoleNeed(role_name))
            
            if not role_permission.can():
                return jsonify({
                    'error': f'Access denied. Required role: {role_name}',
                    'code': 'INSUFFICIENT_ROLE'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_any_permission(*permission_ids: str):
    """Decorator to require any of the specified permissions"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            for permission_id in permission_ids:
                permission = permission_registry.get_permission(permission_id)
                if permission.can():
                    return f(*args, **kwargs)
            
            return jsonify({
                'error': f'Permission denied. Required one of: {", ".join(permission_ids)}',
                'code': 'INSUFFICIENT_PERMISSIONS'
            }), 403
        return decorated_function
    return decorator

def require_all_permissions(*permission_ids: str):
    """Decorator to require all of the specified permissions"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            for permission_id in permission_ids:
                permission = permission_registry.get_permission(permission_id)
                if not permission.can():
                    return jsonify({
                        'error': f'Permission denied. Missing permission: {permission_id}',
                        'code': 'INSUFFICIENT_PERMISSIONS'
                    }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def check_permission(permission_id: str) -> bool:
    """Check if current user has a specific permission"""
    try:
        permission = permission_registry.get_permission(permission_id)
        return permission.can()
    except:
        return False

def get_user_from_token() -> Optional[Dict[str, Any]]:
    """Get current user from JWT token"""
    try:
        user_id = get_jwt_identity()
        if not user_id or not rbac_manager.user_loader:
            return None
        return rbac_manager.user_loader(user_id)
    except:
        return None

# Example API endpoints for RBAC management
def create_rbac_routes(app):
    """Create RBAC management API routes"""
    
    @app.route('/api/v1/permissions', methods=['GET'])
    @require_permission(SystemPermissions.SYSTEM_ADMIN)
    def list_permissions():
        """List all system permissions"""
        permissions = []
        for attr_name in dir(SystemPermissions):
            if not attr_name.startswith('_'):
                perm_id = getattr(SystemPermissions, attr_name)
                resource, action = perm_id.split(':', 1) if ':' in perm_id else (perm_id, 'access')
                permissions.append({
                    'id': perm_id,
                    'name': attr_name.lower().replace('_', ' '),
                    'description': f'{action} {resource}'.replace('_', ' ').title(),
                    'resource': resource,
                    'action': action,
                    'scope': 'global' if resource == 'system' else 'company',
                })
        
        return jsonify({'permissions': permissions})
    
    @app.route('/api/v1/roles', methods=['GET'])
    @require_permission(SystemPermissions.USERS_MANAGE_ROLES)
    def list_roles():
        """List all system roles"""
        roles = []
        for role_id, role_data in SYSTEM_ROLES.items():
            permissions = []
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
            
            roles.append({
                'id': role_id,
                'name': role_id,
                'display_name': role_data['display_name'],
                'description': role_data['description'],
                'permissions': permissions,
                'is_system_role': True,
                'is_active': True,
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z',
            })
        
        return jsonify({'roles': roles})
    
    @app.route('/api/v1/users/<user_id>/permissions', methods=['GET'])
    @require_permission(SystemPermissions.USERS_READ)
    def get_user_permissions(user_id):
        """Get detailed permissions for a user"""
        if not rbac_manager.user_loader:
            return jsonify({'error': 'User loader not configured'}), 500
        
        user = rbac_manager.user_loader(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        permissions = rbac_manager.get_user_permissions(user)
        
        return jsonify({
            'user': user,
            'permissions': permissions,
            'effective_permissions': permissions,
        })
    
    @app.route('/api/v1/users/<user_id>/roles', methods=['POST'])
    @require_permission(SystemPermissions.USERS_MANAGE_ROLES)
    def assign_user_role(user_id):
        """Assign a role to a user"""
        # Implementation would depend on your User model
        # This is a placeholder showing the structure
        data = request.get_json()
        role_id = data.get('role_id')
        
        if not role_id:
            return jsonify({'error': 'role_id is required'}), 400
        
        # Add role assignment logic here
        # user.roles.append(role)
        # db.session.commit()
        
        return jsonify({'message': 'Role assigned successfully'})
    
    @app.route('/api/v1/users/<user_id>/roles/<role_id>', methods=['DELETE'])
    @require_permission(SystemPermissions.USERS_MANAGE_ROLES)
    def remove_user_role(user_id, role_id):
        """Remove a role from a user"""
        # Implementation would depend on your User model
        # This is a placeholder showing the structure
        
        # Add role removal logic here
        # user.roles = [r for r in user.roles if r.id != role_id]
        # db.session.commit()
        
        return jsonify({'message': 'Role removed successfully'})