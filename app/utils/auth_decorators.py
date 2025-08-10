"""
Unified Authentication and Authorization Decorators
Single source of truth for API endpoint protection
"""

from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity
from app.models.auth import User

def get_current_user():
    """Get the current authenticated user"""
    user_id = get_jwt_identity()
    if user_id:
        return User.query.get(user_id)
    return None

def require_auth(f):
    """Require authentication (any valid user)"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        return f(*args, **kwargs)
    return decorated_function

def require_role(*allowed_roles):
    """Require user to have at least one of the specified roles"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_roles = claims.get('roles', [])
            
            # Check if user has at least one of the required roles
            if not any(role in user_roles for role in allowed_roles):
                return jsonify({
                    'error': 'Insufficient privileges',
                    'required_roles': list(allowed_roles),
                    'user_roles': user_roles
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_permission(permission_name):
    """Require user to have a specific permission"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_permissions = claims.get('permissions', [])
            
            # Check for exact permission or wildcard
            has_permission = (
                permission_name in user_permissions or
                '*' in user_permissions or  # System admin wildcard
                any(p.endswith('*') and permission_name.startswith(p[:-1]) 
                    for p in user_permissions)
            )
            
            if not has_permission:
                return jsonify({
                    'error': 'Permission denied',
                    'required_permission': permission_name
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_company_access():
    """Require user to have access to the company specified in the request"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            user = get_current_user()
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Get company_id from various sources
            company_id = (
                kwargs.get('company_id') or
                request.json.get('company_id') if request.json else None or
                request.args.get('company_id')
            )
            
            if company_id:
                company_id = int(company_id) if isinstance(company_id, str) else company_id
                if not user.can_access_company(company_id):
                    return jsonify({
                        'error': 'Access denied to this company',
                        'company_id': company_id
                    }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Convenience decorators for common role requirements
def system_admin_required(f):
    """Require system_admin role"""
    return require_role('system_admin')(f)

def company_admin_required(f):
    """Require company_admin or system_admin role"""
    return require_role('company_admin', 'system_admin')(f)

def admin_required(f):
    """Require any admin role (company_admin or system_admin)"""
    return require_role('company_admin', 'system_admin')(f)

def risk_analyst_required(f):
    """Require risk_analyst role or higher"""
    return require_role('risk_analyst', 'underwriter', 'company_admin', 'system_admin')(f)

def underwriter_required(f):
    """Require underwriter role or higher"""
    return require_role('underwriter', 'company_admin', 'system_admin')(f)

def compliance_required(f):
    """Require compliance_officer role or higher"""
    return require_role('compliance_officer', 'company_admin', 'system_admin')(f)