"""
Unified Authentication API endpoints
Handles login, logout, token refresh with proper JWT claims
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity, get_jwt
)
from app import db
from app.models.auth import User
from app.models.access_control import UserActivityLog
import logging
from datetime import timedelta, datetime

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint with comprehensive JWT claims"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user by email
        user = User.query.filter_by(email=email).first()
        
        if not user:
            logger.warning(f"Login attempt for non-existent user: {email}")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check password
        if not user.check_password(password):
            logger.warning(f"Failed login attempt for user: {email}")
            # Log security event
            if hasattr(UserActivityLog, 'log_activity'):
                UserActivityLog.log_activity(
                    user_id=user.id,
                    activity_type='FAILED_LOGIN',
                    ip_address=request.remote_addr,
                    user_agent=request.user_agent.string
                )
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check if account is active
        if not user.active:
            logger.warning(f"Login attempt for inactive user: {email}")
            return jsonify({'error': 'Account is disabled'}), 403
        
        # Create tokens with comprehensive claims
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(hours=1),
            additional_claims=user.get_jwt_claims()
        )
        
        refresh_token = create_refresh_token(
            identity=user.id,
            expires_delta=timedelta(days=30)
        )
        
        # Update login tracking
        user.login_count = (user.login_count or 0) + 1
        user.last_login_at = user.current_login_at
        user.current_login_at = datetime.utcnow()
        user.last_login_ip = user.current_login_ip
        user.current_login_ip = request.remote_addr
        db.session.commit()
        
        # Log successful login
        if hasattr(UserActivityLog, 'log_activity'):
            UserActivityLog.log_activity(
                user_id=user.id,
                activity_type='LOGIN',
                ip_address=request.remote_addr,
                user_agent=request.user_agent.string
            )
        
        logger.info(f"Successful login for user: {email}")
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict(include_permissions=True)
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.active:
            return jsonify({'error': 'Account is disabled'}), 403
        
        # Create new access token with updated claims
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(hours=1),
            additional_claims=user.get_jwt_claims()
        )
        
        return jsonify({'access_token': access_token}), 200
        
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return jsonify({'error': 'Token refresh failed'}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """User logout endpoint"""
    try:
        current_user_id = get_jwt_identity()
        
        # Log logout activity
        if hasattr(UserActivityLog, 'log_activity'):
            UserActivityLog.log_activity(
                user_id=current_user_id,
                activity_type='LOGOUT',
                ip_address=request.remote_addr,
                user_agent=request.user_agent.string
            )
        
        # In production, you might want to blacklist the token here
        # For now, client should discard the token
        
        return jsonify({'message': 'Logged out successfully'}), 200
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({'error': 'Logout failed'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info with roles and permissions"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user.to_dict(include_permissions=True)), 200
        
    except Exception as e:
        logger.error(f"Error fetching current user: {str(e)}")
        return jsonify({'error': 'Failed to fetch user'}), 500

@auth_bp.route('/permissions', methods=['GET'])
@jwt_required()
def get_my_permissions():
    """Get current user's permissions"""
    try:
        claims = get_jwt()
        return jsonify({
            'roles': claims.get('roles', []),
            'permissions': claims.get('permissions', []),
            'company_id': claims.get('company_id')
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching permissions: {str(e)}")
        return jsonify({'error': 'Failed to fetch permissions'}), 500