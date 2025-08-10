"""
Role and permission management API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.models.user import Role, User
from backend.models.access_control import Permission
from backend.utilities.decorators import admin_required, company_admin_required
import logging

logger = logging.getLogger(__name__)

def register_role_routes(bp: Blueprint):
    """Register role-related routes with the given blueprint"""
    
    @bp.route('/roles', methods=['GET'])
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
                'roles': [{'id': r.id, 'name': r.name, 'description': r.description} for r in roles]
            }), 200
            
        except Exception as e:
            logger.error(f"Error fetching roles: {str(e)}")
            return jsonify({'error': 'Failed to fetch roles'}), 500
    
    @bp.route('/roles/<int:role_id>', methods=['GET'])
    @jwt_required()
    def get_role(role_id):
        """Get specific role details"""
        try:
            role = Role.query.get(role_id)
            if not role:
                return jsonify({'error': 'Role not found'}), 404
            
            return jsonify({
                'id': role.id,
                'name': role.name,
                'description': role.description
            }), 200
            
        except Exception as e:
            logger.error(f"Error fetching role: {str(e)}")
            return jsonify({'error': 'Failed to fetch role'}), 500
    
    @bp.route('/permissions', methods=['GET'])
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