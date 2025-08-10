from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.models.user import Role
from backend.models.access_control import Permission
from backend.models.user import User
from backend.utilities.decorators import admin_required, company_admin_required
import logging

logger = logging.getLogger(__name__)
roles_bp = Blueprint('roles', __name__)

# Define system roles
SYSTEM_ROLES = {
    'system_admin': {
        'display_name': 'System Administrator',
        'description': 'Full system access and configuration',
        'permissions': ['*']  # All permissions
    },
    'company_admin': {
        'display_name': 'Company Administrator',
        'description': 'Manages company users and settings',
        'permissions': [
            'company.view.own', 'company.edit.own',
            'user.view.company', 'user.create.company', 'user.edit.company', 'user.delete.company',
            'entity.view.company', 'entity.create.company', 'entity.edit.company',
            'assessment.view.company', 'assessment.create.company',
            'rule.view.company', 'rule.create.company', 'rule.edit.company'
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

@roles_bp.route('/api/v1/roles', methods=['GET'])
@jwt_required()
def get_roles():
    """Get all available roles"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # System admin sees all roles, others see company-specific roles
        if user.has_role('system_admin'):
            roles = Role.query.all()
        else:
            # Exclude system_admin role for non-system admins
            roles = Role.query.filter(Role.name != 'system_admin').all()
        
        return jsonify({
            'roles': [role.to_dict() for role in roles]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching roles: {str(e)}")
        return jsonify({'error': 'Failed to fetch roles'}), 500

@roles_bp.route('/api/v1/roles/<int:role_id>', methods=['GET'])
@jwt_required()
def get_role(role_id):
    """Get specific role details"""
    try:
        role = Role.query.get(role_id)
        if not role:
            return jsonify({'error': 'Role not found'}), 404
        
        return jsonify(role.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Error fetching role: {str(e)}")
        return jsonify({'error': 'Failed to fetch role'}), 500

@roles_bp.route('/api/v1/users/<int:user_id>/roles', methods=['GET'])
@jwt_required()
def get_user_roles(user_id):
    """Get roles assigned to a user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        target_user = User.query.get(user_id)
        
        if not target_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check permissions
        if not (current_user.has_role('system_admin') or 
                (current_user.has_role('company_admin') and 
                 current_user.company_id == target_user.company_id) or
                current_user.id == user_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({
            'user_id': user_id,
            'roles': [role.to_dict() for role in target_user.roles]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching user roles: {str(e)}")
        return jsonify({'error': 'Failed to fetch user roles'}), 500

@roles_bp.route('/api/v1/users/<int:user_id>/roles', methods=['POST'])
@jwt_required()
def assign_role(user_id):
    """Assign a role to a user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        target_user = User.query.get(user_id)
        
        if not target_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check permissions
        if not (current_user.has_role('system_admin') or 
                (current_user.has_role('company_admin') and 
                 current_user.company_id == target_user.company_id)):
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        role_id = data.get('role_id')
        
        role = Role.query.get(role_id)
        if not role:
            return jsonify({'error': 'Role not found'}), 404
        
        # Prevent assigning system_admin role unless current user is system_admin
        if role.name == 'system_admin' and not current_user.has_role('system_admin'):
            return jsonify({'error': 'Only system administrators can assign system_admin role'}), 403
        
        if role not in target_user.roles:
            target_user.roles.append(role)
            db.session.commit()
            
            logger.info(f"Role {role.name} assigned to user {user_id} by user {current_user_id}")
        
        return jsonify({
            'message': 'Role assigned successfully',
            'user_id': user_id,
            'role': role.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error assigning role: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to assign role'}), 500

@roles_bp.route('/api/v1/users/<int:user_id>/roles/<int:role_id>', methods=['DELETE'])
@jwt_required()
def remove_role(user_id, role_id):
    """Remove a role from a user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        target_user = User.query.get(user_id)
        
        if not target_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check permissions
        if not (current_user.has_role('system_admin') or 
                (current_user.has_role('company_admin') and 
                 current_user.company_id == target_user.company_id)):
            return jsonify({'error': 'Unauthorized'}), 403
        
        role = Role.query.get(role_id)
        if not role:
            return jsonify({'error': 'Role not found'}), 404
        
        if role in target_user.roles:
            target_user.roles.remove(role)
            db.session.commit()
            
            logger.info(f"Role {role.name} removed from user {user_id} by user {current_user_id}")
        
        return jsonify({'message': 'Role removed successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error removing role: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to remove role'}), 500

@roles_bp.route('/api/v1/permissions', methods=['GET'])
@jwt_required()
@admin_required
def get_permissions():
    """Get all available permissions (admin only)"""
    try:
        permissions = Permission.query.all()
        return jsonify({
            'permissions': [perm.to_dict() for perm in permissions]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching permissions: {str(e)}")
        return jsonify({'error': 'Failed to fetch permissions'}), 500

def init_roles():
    """Initialize system roles and permissions"""
    try:
        # Create permissions
        resources = ['company', 'user', 'entity', 'assessment', 'rule', 'report', 'audit', 'compliance']
        actions = ['view', 'create', 'edit', 'delete', 'approve']
        scopes = ['own', 'company', 'all']
        
        for resource in resources:
            for action in actions:
                for scope in scopes:
                    perm_name = f"{resource}.{action}.{scope}"
                    if not Permission.query.filter_by(name=perm_name).first():
                        perm = Permission(
                            name=perm_name,
                            resource=resource,
                            action=action,
                            description=f"{action.capitalize()} {resource} ({scope})"
                        )
                        db.session.add(perm)
        
        # Create system roles
        for role_name, role_config in SYSTEM_ROLES.items():
            if not Role.query.filter_by(name=role_name).first():
                role = Role(
                    name=role_name,
                    display_name=role_config['display_name'],
                    description=role_config['description'],
                    is_system_role=True
                )
                db.session.add(role)
                db.session.flush()
                
                # Assign permissions
                if role_config['permissions'] == ['*']:
                    # System admin gets all permissions
                    role.permissions = Permission.query.all()
                else:
                    for perm_name in role_config['permissions']:
                        perm = Permission.query.filter_by(name=perm_name).first()
                        if perm:
                            role.permissions.append(perm)
        
        db.session.commit()
        logger.info("System roles and permissions initialized")
        
    except Exception as e:
        logger.error(f"Error initializing roles: {str(e)}")
        db.session.rollback()