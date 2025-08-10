"""
User management API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.models.user import User, Role
from backend.utilities.decorators import admin_required
import logging

logger = logging.getLogger(__name__)

def register_user_routes(bp: Blueprint):
    """Register user-related routes with the given blueprint"""
    
    @bp.route('/users', methods=['GET'])
    @jwt_required()
    def get_users():
        """Get all users"""
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user:
                return jsonify({'error': 'User not found'}), 404
            
            # Filter users based on permissions
            if current_user.has_role('system_admin'):
                users = User.query.all()
            else:
                # Show only users from the same company
                users = User.query.filter_by(company=current_user.company).all()
            
            return jsonify({
                'users': [user.to_dict() for user in users]
            }), 200
            
        except Exception as e:
            logger.error(f"Error fetching users: {str(e)}")
            return jsonify({'error': 'Failed to fetch users'}), 500
    
    @bp.route('/users/<int:user_id>', methods=['GET'])
    @jwt_required()
    def get_user(user_id):
        """Get specific user details"""
        try:
            user = User.query.get(user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            return jsonify(user.to_dict()), 200
            
        except Exception as e:
            logger.error(f"Error fetching user: {str(e)}")
            return jsonify({'error': 'Failed to fetch user'}), 500
    
    @bp.route('/users/<int:user_id>/roles', methods=['GET'])
    @jwt_required()
    def get_user_roles(user_id):
        """Get roles assigned to a user"""
        try:
            user = User.query.get(user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            return jsonify({
                'user_id': user_id,
                'roles': [{'id': r.id, 'name': r.name} for r in user.roles]
            }), 200
            
        except Exception as e:
            logger.error(f"Error fetching user roles: {str(e)}")
            return jsonify({'error': 'Failed to fetch user roles'}), 500
    
    @bp.route('/users/<int:user_id>/roles', methods=['POST'])
    @jwt_required()
    @admin_required
    def assign_role(user_id):
        """Assign a role to a user"""
        try:
            data = request.get_json()
            role_id = data.get('role_id')
            
            user = User.query.get(user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            role = Role.query.get(role_id)
            if not role:
                return jsonify({'error': 'Role not found'}), 404
            
            if role not in user.roles:
                user.roles.append(role)
                db.session.commit()
            
            return jsonify({
                'message': 'Role assigned successfully',
                'user_id': user_id,
                'role': {'id': role.id, 'name': role.name}
            }), 200
            
        except Exception as e:
            logger.error(f"Error assigning role: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Failed to assign role'}), 500