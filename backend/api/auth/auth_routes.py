"""Authentication API routes - consolidated from multiple sources"""

from flask import jsonify, request, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity, get_jwt
)
from flask_security import verify_password
from backend.models import User, Role
from backend.app import db, limiter
from datetime import datetime, timedelta
import json


def register_auth_routes(bp):
    """Register authentication routes with a blueprint"""
    
    @bp.route('/auth/login', methods=['POST'])
    @limiter.limit("5 per minute")
    def api_login():
        """API login with JWT tokens"""
        try:
            data = request.get_json(force=True)
            
            if not data or not data.get('email') or not data.get('password'):
                return jsonify({'error': 'Email and password required'}), 400
        except Exception as e:
            return jsonify({'error': 'Invalid JSON payload'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.active and verify_password(data['password'], user.password):
            # Update login tracking
            user.login_count = (user.login_count or 0) + 1
            user.last_login_at = user.current_login_at
            user.current_login_at = datetime.utcnow()
            user.last_login_ip = user.current_login_ip
            user.current_login_ip = request.remote_addr
            db.session.commit()
            
            # Create tokens with user roles and permissions
            user_roles = [role.name for role in user.roles] if user.roles else []
            user_permissions = []
            
            # Collect all permissions from user's roles
            for role in user.roles:
                if hasattr(role, 'permissions'):
                    for perm in role.permissions:
                        if hasattr(perm, 'name') and perm.name not in user_permissions:
                            user_permissions.append(perm.name)
            
            additional_claims = {
                'email': user.email,
                'name': user.name or user.email,
                'roles': user_roles,
                'permissions': user_permissions
            }
            
            access_token = create_access_token(
                identity=str(user.id),
                additional_claims=additional_claims
            )
            refresh_token = create_refresh_token(
                identity=str(user.id),
                additional_claims=additional_claims
            )
            
            # Include roles and permissions in user dict
            user_dict = user.to_dict()
            user_dict['roles'] = user_roles
            user_dict['permissions'] = user_permissions
            
            return jsonify({
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': user_dict
            }), 200
        
        return jsonify({'error': 'Invalid credentials'}), 401
    
    
    @bp.route('/auth/register', methods=['POST'])
    @limiter.limit("3 per minute")
    def api_register():
        """API user registration"""
        try:
            data = request.get_json(force=True)
            
            # Validate required fields
            required_fields = ['email', 'password']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'error': f'{field} is required'}), 400
            
            # Check if email already exists
            if User.query.filter_by(email=data['email']).first():
                return jsonify({'error': 'Email already registered'}), 400
            
            # Create new user
            user = User(
                email=data['email'],
                name=data.get('name', data['email'].split('@')[0]),
                active=True
            )
            
            # Set password (assuming User model has set_password method)
            if hasattr(user, 'set_password'):
                user.set_password(data['password'])
            else:
                user.password = data['password']  # Will be hashed by model
            
            # Assign default role
            default_role = Role.query.filter_by(name='user').first()
            if not default_role:
                # Create default role if it doesn't exist
                default_role = Role(name='user', description='Default user role')
                db.session.add(default_role)
            
            user.roles.append(default_role)
            
            db.session.add(user)
            db.session.commit()
            
            # Auto-login by creating tokens
            user_roles = [role.name for role in user.roles]
            additional_claims = {
                'email': user.email,
                'name': user.name,
                'roles': user_roles,
                'permissions': []
            }
            
            access_token = create_access_token(
                identity=str(user.id),
                additional_claims=additional_claims
            )
            refresh_token = create_refresh_token(
                identity=str(user.id),
                additional_claims=additional_claims
            )
            
            return jsonify({
                'message': 'User registered successfully',
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': user.to_dict()
            }), 201
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f'Registration failed: {str(e)}')
            return jsonify({'error': 'Registration failed'}), 500
    
    
    @bp.route('/auth/refresh', methods=['POST'])
    @jwt_required(refresh=True)
    def api_refresh():
        """Refresh JWT token"""
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user or not user.active:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        # Recreate claims
        user_roles = [role.name for role in user.roles] if user.roles else []
        user_permissions = []
        
        for role in user.roles:
            if hasattr(role, 'permissions'):
                for perm in role.permissions:
                    if hasattr(perm, 'name') and perm.name not in user_permissions:
                        user_permissions.append(perm.name)
        
        additional_claims = {
            'email': user.email,
            'name': user.name or user.email,
            'roles': user_roles,
            'permissions': user_permissions
        }
        
        access_token = create_access_token(
            identity=current_user_id,
            additional_claims=additional_claims
        )
        
        return jsonify({'access_token': access_token}), 200
    
    
    @bp.route('/auth/logout', methods=['POST'])
    @jwt_required()
    def api_logout():
        """Logout (client should discard tokens)"""
        # In a production environment, you might want to blacklist the token
        return jsonify({'message': 'Successfully logged out'}), 200
    
    
    @bp.route('/auth/me', methods=['GET'])
    @jwt_required()
    def get_current_user():
        """Get current user information"""
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user_dict = user.to_dict()
        user_dict['roles'] = [role.name for role in user.roles]
        
        # Add permissions
        user_permissions = []
        for role in user.roles:
            if hasattr(role, 'permissions'):
                for perm in role.permissions:
                    if hasattr(perm, 'name') and perm.name not in user_permissions:
                        user_permissions.append(perm.name)
        
        user_dict['permissions'] = user_permissions
        
        return jsonify(user_dict), 200
    
    
    @bp.route('/auth/change-password', methods=['POST'])
    @jwt_required()
    def change_password():
        """Change user password"""
        current_user_id = get_jwt_identity()
        user = User.query.get(int(current_user_id))
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Current and new passwords required'}), 400
        
        # Verify current password
        if not verify_password(data['current_password'], user.password):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Set new password
        if hasattr(user, 'set_password'):
            user.set_password(data['new_password'])
        else:
            user.password = data['new_password']
        
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
    
    
    @bp.route('/auth/verify-token', methods=['GET'])
    @jwt_required()
    def verify_token():
        """Verify JWT token is valid"""
        claims = get_jwt()
        return jsonify({
            'valid': True,
            'user_id': get_jwt_identity(),
            'email': claims.get('email'),
            'roles': claims.get('roles', []),
            'permissions': claims.get('permissions', [])
        }), 200