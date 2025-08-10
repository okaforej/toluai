"""
Authentication API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from backend.app import db
from backend.models.user import User
from werkzeug.security import check_password_hash
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)

def register_auth_routes(bp: Blueprint):
    """Register authentication-related routes with the given blueprint"""
    
    @bp.route('/login', methods=['POST'])
    def login():
        """User login endpoint"""
        try:
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
            
            if not email or not password:
                return jsonify({'error': 'Email and password are required'}), 400
            
            user = User.query.filter_by(email=email).first()
            
            if not user or not check_password_hash(user.password, password):
                return jsonify({'error': 'Invalid credentials'}), 401
            
            if not user.active:
                return jsonify({'error': 'Account is disabled'}), 403
            
            # Create tokens
            access_token = create_access_token(
                identity=user.id,
                expires_delta=timedelta(hours=1)
            )
            refresh_token = create_refresh_token(
                identity=user.id,
                expires_delta=timedelta(days=30)
            )
            
            # Update login info
            user.login_count = (user.login_count or 0) + 1
            user.last_login_at = user.current_login_at
            user.current_login_at = db.func.current_timestamp()
            db.session.commit()
            
            return jsonify({
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': user.to_dict()
            }), 200
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return jsonify({'error': 'Login failed'}), 500
    
    @bp.route('/refresh', methods=['POST'])
    @jwt_required(refresh=True)
    def refresh():
        """Refresh access token"""
        try:
            current_user_id = get_jwt_identity()
            access_token = create_access_token(
                identity=current_user_id,
                expires_delta=timedelta(hours=1)
            )
            
            return jsonify({'access_token': access_token}), 200
            
        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}")
            return jsonify({'error': 'Token refresh failed'}), 500
    
    @bp.route('/logout', methods=['POST'])
    @jwt_required()
    def logout():
        """User logout endpoint"""
        # In a production app, you might want to blacklist the token here
        return jsonify({'message': 'Logged out successfully'}), 200
    
    @bp.route('/me', methods=['GET'])
    @jwt_required()
    def get_current_user():
        """Get current user info"""
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            return jsonify(user.to_dict()), 200
            
        except Exception as e:
            logger.error(f"Error fetching current user: {str(e)}")
            return jsonify({'error': 'Failed to fetch user'}), 500