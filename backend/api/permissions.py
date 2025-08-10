"""
Enhanced Permission Management Routes
API endpoints for managing roles, permissions, and access control
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import desc, and_, or_, func
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import uuid

from backend.app import db
from backend.models.irpa import IRPAUser, IRPARole
from backend.models.access_control import (
    Permission, RolePermission, UserActivityLog, SecurityEvent
)

# Create permissions blueprint
permissions_bp = Blueprint('permissions', __name__, url_prefix='/api/v2/permissions')


def get_current_user():
    """Get current IRPA user from JWT"""
    user_id = get_jwt_identity()
    if user_id:
        return IRPAUser.query.get(user_id)
    return None


def require_admin():
    """Decorator to require admin role"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user or not user.role or user.role.role_name != 'admin':
                SecurityEvent.log_security_event(
                    event_type=SecurityEvent.EVENT_UNAUTHORIZED_ACCESS,
                    severity_level=SecurityEvent.SEVERITY_MEDIUM,
                    description=f"Non-admin user {user.email if user else 'unknown'} attempted admin operation",
                    user_id=user.user_id if user else None,
                    ip_address=request.remote_addr
                )
                return jsonify({'error': 'Admin access required'}), 403
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator


def check_permission(permission_name):
    """Check if current user has specific permission"""
    user = get_current_user()
    if not user or not user.role:
        return False
    
    # Check if user has required permission
    has_permission = db.session.query(
        RolePermission.query.join(Permission).filter(
            RolePermission.role_id == user.role_id,
            Permission.permission_name == permission_name
        ).exists()
    ).scalar()
    
    return has_permission


# Permission Management Routes
@permissions_bp.route('/permissions', methods=['GET'])
@jwt_required()
@require_admin()
def list_permissions():
    """List all permissions"""
    try:
        permissions = Permission.query.order_by(Permission.permission_name).all()
        return jsonify({
            'permissions': [perm.to_dict() for perm in permissions]
        })
    except Exception as e:
        current_app.logger.error(f'Failed to list permissions: {str(e)}')
        return jsonify({'error': 'Failed to list permissions'}), 500


@permissions_bp.route('/permissions', methods=['POST'])
@jwt_required()
@require_admin()
def create_permission():
    """Create a new permission"""
    data = request.get_json()
    
    if not data or not data.get('permission_name'):
        return jsonify({'error': 'Permission name is required'}), 400
    
    try:
        user = get_current_user()
        
        permission = Permission(
            permission_name=data['permission_name'],
            description=data.get('description', '')
        )
        
        db.session.add(permission)
        db.session.commit()
        
        # Log activity
        UserActivityLog.log_activity(
            user_id=user.user_id,
            activity_type=UserActivityLog.ACTIVITY_CREATE,
            entity_type='PERMISSION',
            entity_id=permission.permission_id,
            action_details={'permission_name': permission.permission_name}
        )
        
        return jsonify({
            'message': 'Permission created successfully',
            'permission': permission.to_dict()
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Permission already exists'}), 409
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Failed to create permission: {str(e)}')
        return jsonify({'error': 'Failed to create permission'}), 500


@permissions_bp.route('/permissions/<int:permission_id>', methods=['PUT'])
@jwt_required()
@require_admin()
def update_permission(permission_id):
    """Update an existing permission"""
    permission = Permission.query.get_or_404(permission_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        user = get_current_user()
        old_values = permission.to_dict()
        
        if 'permission_name' in data:
            permission.permission_name = data['permission_name']
        if 'description' in data:
            permission.description = data['description']
        
        db.session.commit()
        
        # Log activity
        UserActivityLog.log_activity(
            user_id=user.user_id,
            activity_type=UserActivityLog.ACTIVITY_UPDATE,
            entity_type='PERMISSION',
            entity_id=permission.permission_id,
            action_details={'old': old_values, 'new': permission.to_dict()}
        )
        
        return jsonify({
            'message': 'Permission updated successfully',
            'permission': permission.to_dict()
        })
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Permission name already exists'}), 409
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Failed to update permission: {str(e)}')
        return jsonify({'error': 'Failed to update permission'}), 500


@permissions_bp.route('/permissions/<int:permission_id>', methods=['DELETE'])
@jwt_required()
@require_admin()
def delete_permission(permission_id):
    """Delete a permission"""
    permission = Permission.query.get_or_404(permission_id)
    
    try:
        user = get_current_user()
        
        # Check if permission is being used
        role_count = RolePermission.query.filter_by(permission_id=permission_id).count()
        if role_count > 0:
            return jsonify({
                'error': f'Permission is assigned to {role_count} role(s). Remove assignments first.'
            }), 400
        
        # Log activity
        UserActivityLog.log_activity(
            user_id=user.user_id,
            activity_type=UserActivityLog.ACTIVITY_DELETE,
            entity_type='PERMISSION',
            entity_id=permission.permission_id,
            action_details=permission.to_dict()
        )
        
        db.session.delete(permission)
        db.session.commit()
        
        return jsonify({'message': 'Permission deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Failed to delete permission: {str(e)}')
        return jsonify({'error': 'Failed to delete permission'}), 500


# Role Management Routes
@permissions_bp.route('/roles', methods=['GET'])
@jwt_required()
@require_admin()
def list_roles():
    """List all roles with their permissions"""
    try:
        roles = IRPARole.query.order_by(IRPARole.role_name).all()
        roles_data = []
        
        for role in roles:
            role_dict = role.to_dict()
            # Get role permissions
            role_permissions = db.session.query(Permission).join(RolePermission).filter(
                RolePermission.role_id == role.role_id
            ).all()
            role_dict['permissions'] = [perm.to_dict() for perm in role_permissions]
            roles_data.append(role_dict)
        
        return jsonify({'roles': roles_data})
        
    except Exception as e:
        current_app.logger.error(f'Failed to list roles: {str(e)}')
        return jsonify({'error': 'Failed to list roles'}), 500


@permissions_bp.route('/roles', methods=['POST'])
@jwt_required()
@require_admin()
def create_role():
    """Create a new role"""
    data = request.get_json()
    
    if not data or not data.get('role_name'):
        return jsonify({'error': 'Role name is required'}), 400
    
    try:
        user = get_current_user()
        
        role = IRPARole(
            role_name=data['role_name'],
            description=data.get('description', ''),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(role)
        db.session.flush()  # Get the role ID
        
        # Add permissions if provided
        if 'permission_ids' in data and data['permission_ids']:
            for permission_id in data['permission_ids']:
                role_permission = RolePermission(
                    role_id=role.role_id,
                    permission_id=permission_id
                )
                db.session.add(role_permission)
        
        db.session.commit()
        
        # Log activity
        UserActivityLog.log_activity(
            user_id=user.user_id,
            activity_type=UserActivityLog.ACTIVITY_CREATE,
            entity_type='ROLE',
            entity_id=role.role_id,
            action_details={'role_name': role.role_name}
        )
        
        return jsonify({
            'message': 'Role created successfully',
            'role': role.to_dict()
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Role already exists'}), 409
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Failed to create role: {str(e)}')
        return jsonify({'error': 'Failed to create role'}), 500


@permissions_bp.route('/roles/<int:role_id>/permissions', methods=['PUT'])
@jwt_required()
@require_admin()
def update_role_permissions(role_id):
    """Update role permissions"""
    role = IRPARole.query.get_or_404(role_id)
    data = request.get_json()
    
    if not data or 'permission_ids' not in data:
        return jsonify({'error': 'Permission IDs are required'}), 400
    
    try:
        user = get_current_user()
        
        # Remove existing permissions
        RolePermission.query.filter_by(role_id=role_id).delete()
        
        # Add new permissions
        for permission_id in data['permission_ids']:
            if Permission.query.get(permission_id):  # Validate permission exists
                role_permission = RolePermission(
                    role_id=role_id,
                    permission_id=permission_id
                )
                db.session.add(role_permission)
        
        db.session.commit()
        
        # Log activity
        UserActivityLog.log_activity(
            user_id=user.user_id,
            activity_type=UserActivityLog.ACTIVITY_UPDATE,
            entity_type='ROLE_PERMISSIONS',
            entity_id=role_id,
            action_details={'permission_ids': data['permission_ids']}
        )
        
        return jsonify({'message': 'Role permissions updated successfully'})
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Failed to update role permissions: {str(e)}')
        return jsonify({'error': 'Failed to update role permissions'}), 500


# User Permission Routes
@permissions_bp.route('/users/<uuid:user_id>/permissions', methods=['GET'])
@jwt_required()
@require_admin()
def get_user_permissions(user_id):
    """Get user's effective permissions"""
    try:
        user = IRPAUser.query.get_or_404(user_id)
        
        if user.role:
            # Get permissions through role
            permissions = db.session.query(Permission).join(RolePermission).filter(
                RolePermission.role_id == user.role_id
            ).all()
            
            return jsonify({
                'user': user.to_dict(),
                'role': user.role.to_dict() if user.role else None,
                'permissions': [perm.to_dict() for perm in permissions]
            })
        else:
            return jsonify({
                'user': user.to_dict(),
                'role': None,
                'permissions': []
            })
    
    except Exception as e:
        current_app.logger.error(f'Failed to get user permissions: {str(e)}')
        return jsonify({'error': 'Failed to get user permissions'}), 500


@permissions_bp.route('/check', methods=['POST'])
@jwt_required()
def check_user_permission():
    """Check if current user has specific permission"""
    data = request.get_json()
    
    if not data or not data.get('permission'):
        return jsonify({'error': 'Permission name is required'}), 400
    
    try:
        has_permission = check_permission(data['permission'])
        
        return jsonify({
            'has_permission': has_permission,
            'permission': data['permission']
        })
        
    except Exception as e:
        current_app.logger.error(f'Failed to check permission: {str(e)}')
        return jsonify({'error': 'Failed to check permission'}), 500


# Security Events Routes
@permissions_bp.route('/security-events', methods=['GET'])
@jwt_required()
@require_admin()
def list_security_events():
    """List security events"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        severity = request.args.get('severity')
        resolved = request.args.get('resolved', type=bool)
        
        query = SecurityEvent.query
        
        if severity:
            query = query.filter(SecurityEvent.severity_level == severity.upper())
        
        if resolved is not None:
            query = query.filter(SecurityEvent.resolved == resolved)
        
        pagination = query.order_by(desc(SecurityEvent.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'security_events': [event.to_dict() for event in pagination.items],
            'pagination': {
                'page': page,
                'pages': pagination.pages,
                'per_page': per_page,
                'total': pagination.total,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Failed to list security events: {str(e)}')
        return jsonify({'error': 'Failed to list security events'}), 500


@permissions_bp.route('/security-events/<uuid:event_id>/resolve', methods=['PUT'])
@jwt_required()
@require_admin()
def resolve_security_event(event_id):
    """Resolve a security event"""
    event = SecurityEvent.query.get_or_404(event_id)
    data = request.get_json()
    
    try:
        user = get_current_user()
        
        event.resolved = True
        event.resolved_by = user.user_id
        event.resolved_at = datetime.utcnow()
        event.resolution_notes = data.get('resolution_notes', '')
        
        db.session.commit()
        
        # Log activity
        UserActivityLog.log_activity(
            user_id=user.user_id,
            activity_type=UserActivityLog.ACTIVITY_UPDATE,
            entity_type='SECURITY_EVENT',
            entity_id=event_id,
            action_details={'action': 'resolved'}
        )
        
        return jsonify({
            'message': 'Security event resolved successfully',
            'event': event.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Failed to resolve security event: {str(e)}')
        return jsonify({'error': 'Failed to resolve security event'}), 500


# Initialize default permissions
@permissions_bp.route('/initialize', methods=['POST'])
@jwt_required()
@require_admin()
def initialize_permissions():
    """Initialize default permissions and roles"""
    try:
        user = get_current_user()
        
        # Default permissions
        default_permissions = [
            # Company permissions
            ('company.read', 'View company information'),
            ('company.create', 'Create new companies'),
            ('company.update', 'Update company information'),
            ('company.delete', 'Delete companies'),
            
            # Insured entity permissions
            ('insured_entity.read', 'View insured entities'),
            ('insured_entity.create', 'Create insured entities'),
            ('insured_entity.update', 'Update insured entities'),
            ('insured_entity.delete', 'Delete insured entities'),
            
            # Assessment permissions
            ('assessment.read', 'View risk assessments'),
            ('assessment.create', 'Run risk assessments'),
            ('assessment.update', 'Update assessments'),
            ('assessment.delete', 'Delete assessments'),
            
            # Analytics permissions
            ('analytics.read', 'View analytics and reports'),
            ('analytics.export', 'Export analytics data'),
            
            # Audit permissions
            ('audit.read', 'View audit logs'),
            
            # Admin permissions
            ('admin.users', 'Manage users'),
            ('admin.roles', 'Manage roles and permissions'),
            ('admin.system', 'System administration'),
        ]
        
        # Create permissions if they don't exist
        created_permissions = []
        for perm_name, description in default_permissions:
            existing = Permission.query.filter_by(permission_name=perm_name).first()
            if not existing:
                permission = Permission(
                    permission_name=perm_name,
                    description=description
                )
                db.session.add(permission)
                created_permissions.append(perm_name)
        
        db.session.commit()
        
        # Log activity
        if created_permissions:
            UserActivityLog.log_activity(
                user_id=user.user_id,
                activity_type=UserActivityLog.ACTIVITY_CREATE,
                entity_type='PERMISSIONS_INIT',
                action_details={'created_permissions': created_permissions}
            )
        
        return jsonify({
            'message': 'Permissions initialized successfully',
            'created_permissions': created_permissions,
            'total_permissions': Permission.query.count()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Failed to initialize permissions: {str(e)}')
        return jsonify({'error': 'Failed to initialize permissions'}), 500


# Error handlers
@permissions_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404


@permissions_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400


@permissions_bp.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500