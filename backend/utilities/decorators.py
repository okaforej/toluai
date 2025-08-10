"""
Permission decorators for API routes
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def check_permission(required_roles):
    """Check if user has required role(s)"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_roles = claims.get('roles', [])
            
            # Check if user has at least one of the required roles
            if not any(role in user_roles for role in required_roles):
                return jsonify({'error': 'Insufficient permissions'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def admin_required(f):
    """Require admin or system_admin role"""
    return check_permission(['admin', 'system_admin'])(f)

def company_admin_required(f):
    """Require company_admin role or higher"""
    return check_permission(['company_admin', 'admin', 'system_admin'])(f)

def system_admin_required(f):
    """Require system_admin role"""
    return check_permission(['system_admin', 'admin'])(f)

def risk_analyst_required(f):
    """Require risk_analyst role or higher"""
    return check_permission(['risk_analyst', 'underwriter', 'company_admin', 'admin', 'system_admin'])(f)

def underwriter_required(f):
    """Require underwriter role or higher"""
    return check_permission(['underwriter', 'company_admin', 'admin', 'system_admin'])(f)

def compliance_required(f):
    """Require compliance_officer role or higher"""
    return check_permission(['compliance_officer', 'company_admin', 'admin', 'system_admin'])(f)

def authenticated_required(f):
    """Require any authenticated user"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        return f(*args, **kwargs)
    return decorated_function