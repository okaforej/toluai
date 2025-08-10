"""
Auth Module - Authentication, authorization, and RBAC components
"""

from flask import Blueprint

# Create auth blueprint for web routes
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

# Import RBAC components
from backend.auth.rbac_system import (
    SystemPermissions,
    RBACSystem,
    require_permission,
    require_role,
    require_any_permission,
    require_all_permissions,
    check_resource_permission
)

__all__ = [
    'auth_bp',
    'SystemPermissions',
    'RBACSystem',
    'require_permission',
    'require_role',
    'require_any_permission',
    'require_all_permissions',
    'check_resource_permission'
]