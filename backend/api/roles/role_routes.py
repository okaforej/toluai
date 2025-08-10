"""Role and Permission Management API routes - consolidated"""

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import User, Role, Permission
from backend.app import db
from backend.rbac_system import SystemPermissions


def register_role_routes(bp):
    """Register role and permission routes with a blueprint"""
    
    @bp.route('/roles', methods=['GET'])
    @jwt_required()
    def get_roles():
        """Get all roles with their permissions"""
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            # Check if user has permission to view roles
            if not user or not (user.has_role('system_admin') or user.has_role('admin')):
                return jsonify({'error': 'Unauthorized'}), 403
            
            roles = Role.query.all()
            
            role_list = []
            for role in roles:
                role_dict = {
                    'id': role.id,
                    'name': role.name,
                    'description': role.description,
                    'permissions': []
                }
                
                # Add permissions if they exist
                if hasattr(role, 'permissions'):
                    role_dict['permissions'] = [
                        {'id': p.id, 'name': p.name, 'description': getattr(p, 'description', '')}
                        for p in role.permissions
                    ]
                
                role_list.append(role_dict)
            
            return jsonify({'roles': role_list}), 200
            
        except Exception as e:
            return jsonify({'error': f'Failed to fetch roles: {str(e)}'}), 500
    
    
    @bp.route('/roles', methods=['POST'])
    @jwt_required()
    def create_role():
        """Create a new role with permissions"""
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user or not (user.has_role('system_admin') or user.has_role('admin')):
                return jsonify({'error': 'Unauthorized'}), 403
            
            data = request.get_json()
            
            if not data or 'name' not in data:
                return jsonify({'error': 'Role name is required'}), 400
            
            # Check if role already exists
            existing_role = Role.query.filter_by(name=data['name']).first()
            if existing_role:
                return jsonify({'error': 'Role already exists'}), 400
            
            # Create new role
            role = Role(
                name=data['name'],
                description=data.get('description', '')
            )
            
            # Add permissions if provided
            if 'permission_ids' in data:
                permissions = Permission.query.filter(
                    Permission.id.in_(data['permission_ids'])
                ).all()
                role.permissions.extend(permissions)
            
            db.session.add(role)
            db.session.commit()
            
            return jsonify({
                'message': 'Role created successfully',
                'role': {
                    'id': role.id,
                    'name': role.name,
                    'description': role.description,
                    'permissions': [
                        {'id': p.id, 'name': p.name}
                        for p in role.permissions
                    ] if hasattr(role, 'permissions') else []
                }
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to create role: {str(e)}'}), 500
    
    
    @bp.route('/roles/<int:role_id>', methods=['PUT'])
    @jwt_required()
    def update_role(role_id):
        """Update a role and its permissions"""
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user or not (user.has_role('system_admin') or user.has_role('admin')):
                return jsonify({'error': 'Unauthorized'}), 403
            
            role = Role.query.get_or_404(role_id)
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            # Don't allow renaming system roles
            system_roles = ['system_admin', 'admin', 'user']
            if role.name in system_roles and 'name' in data and data['name'] != role.name:
                return jsonify({'error': 'Cannot rename system roles'}), 400
            
            # Update role fields
            if 'name' in data:
                role.name = data['name']
            if 'description' in data:
                role.description = data['description']
            
            # Update permissions if provided
            if 'permission_ids' in data:
                # Clear existing permissions
                if hasattr(role, 'permissions'):
                    role.permissions.clear()
                    
                    # Add new permissions
                    permissions = Permission.query.filter(
                        Permission.id.in_(data['permission_ids'])
                    ).all()
                    role.permissions.extend(permissions)
            
            db.session.commit()
            
            return jsonify({
                'message': 'Role updated successfully',
                'role': {
                    'id': role.id,
                    'name': role.name,
                    'description': role.description,
                    'permissions': [
                        {'id': p.id, 'name': p.name}
                        for p in role.permissions
                    ] if hasattr(role, 'permissions') else []
                }
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to update role: {str(e)}'}), 500
    
    
    @bp.route('/roles/<int:role_id>', methods=['DELETE'])
    @jwt_required()
    def delete_role(role_id):
        """Delete a role"""
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user or not user.has_role('system_admin'):
                return jsonify({'error': 'Unauthorized'}), 403
            
            role = Role.query.get_or_404(role_id)
            
            # Don't allow deletion of system roles
            if role.name in ['admin', 'system_admin', 'user']:
                return jsonify({'error': 'Cannot delete system roles'}), 400
            
            # Check if role is assigned to any users
            if role.users:
                return jsonify({
                    'error': f'Cannot delete role. {len(role.users)} users have this role assigned'
                }), 400
            
            db.session.delete(role)
            db.session.commit()
            
            return jsonify({'message': 'Role deleted successfully'}), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to delete role: {str(e)}'}), 500
    
    
    @bp.route('/roles/bulk-delete', methods=['POST'])
    @jwt_required()
    def bulk_delete_roles():
        """Bulk delete roles"""
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user or not user.has_role('system_admin'):
                return jsonify({'error': 'Unauthorized'}), 403
            
            data = request.get_json()
            
            if not data or 'ids' not in data:
                return jsonify({'error': 'Missing ids array'}), 400
            
            # Check for system roles
            roles_to_delete = Role.query.filter(Role.id.in_(data['ids'])).all()
            system_roles = ['admin', 'system_admin', 'user']
            
            for role in roles_to_delete:
                if role.name in system_roles:
                    return jsonify({'error': f'Cannot delete system role: {role.name}'}), 400
                if role.users:
                    return jsonify({
                        'error': f'Cannot delete role "{role.name}". Users have this role assigned'
                    }), 400
            
            deleted_count = Role.query.filter(Role.id.in_(data['ids'])).delete(synchronize_session=False)
            db.session.commit()
            
            return jsonify({
                'message': f'Successfully deleted {deleted_count} roles',
                'deleted_count': deleted_count
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to delete roles: {str(e)}'}), 500
    
    
    @bp.route('/permissions', methods=['GET'])
    @jwt_required()
    def get_permissions():
        """Get all available permissions"""
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user or not (user.has_role('system_admin') or user.has_role('admin')):
                return jsonify({'error': 'Unauthorized'}), 403
            
            # Try to get permissions from database
            permissions = Permission.query.all()
            
            if permissions:
                permission_list = [
                    {
                        'id': p.id,
                        'name': p.name,
                        'description': getattr(p, 'description', ''),
                        'category': getattr(p, 'category', 'general')
                    }
                    for p in permissions
                ]
            else:
                # Return system-defined permissions if database is empty
                permission_list = []
                for category, perms in SystemPermissions.get_all_permissions().items():
                    for perm in perms:
                        permission_list.append({
                            'id': len(permission_list) + 1,
                            'name': perm,
                            'description': perm.replace('.', ' ').title(),
                            'category': category
                        })
            
            return jsonify({'permissions': permission_list}), 200
            
        except Exception as e:
            return jsonify({'error': f'Failed to fetch permissions: {str(e)}'}), 500
    
    
    @bp.route('/users/<int:user_id>/roles', methods=['POST'])
    @jwt_required()
    def assign_user_roles():
        """Assign roles to a user"""
        try:
            current_user_id = get_jwt_identity()
            admin_user = User.query.get(current_user_id)
            
            if not admin_user or not (admin_user.has_role('system_admin') or admin_user.has_role('admin')):
                return jsonify({'error': 'Unauthorized'}), 403
            
            user = User.query.get_or_404(user_id)
            data = request.get_json()
            
            if not data or 'role_ids' not in data:
                return jsonify({'error': 'role_ids array is required'}), 400
            
            # Clear existing roles
            user.roles.clear()
            
            # Assign new roles
            roles = Role.query.filter(Role.id.in_(data['role_ids'])).all()
            user.roles.extend(roles)
            
            db.session.commit()
            
            return jsonify({
                'message': 'Roles assigned successfully',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'roles': [{'id': r.id, 'name': r.name} for r in user.roles]
                }
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to assign roles: {str(e)}'}), 500