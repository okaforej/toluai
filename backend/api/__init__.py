"""
API Module - Centralized API route registration
Consolidates all API endpoints with proper versioning and structure
"""

from flask import Blueprint, Flask
from flask_cors import CORS


# Create main API blueprint (for backwards compatibility)
api_bp = Blueprint('api', __name__, url_prefix='/api')


def register_api_routes(app: Flask):
    """
    Register all API routes with the Flask application
    
    Args:
        app: Flask application instance
    """
    
    # Create versioned API blueprints
    api_v1 = Blueprint('api_v1', __name__, url_prefix='/api/v1')
    api_v2 = Blueprint('api_v2', __name__, url_prefix='/api/v2')
    
    # Import and register route modules
    try:
        from backend.api.auth.auth_routes import register_auth_routes
        register_auth_routes(api_v1)
    except ImportError as e:
        print(f"Warning: Could not import auth routes: {e}")
    
    try:
        from backend.api.dashboard.main import register_dashboard_routes
        register_dashboard_routes(api_v1)
    except ImportError as e:
        print(f"Warning: Could not import dashboard routes: {e}")
    
    try:
        from backend.api.roles.role_routes import register_role_routes
        register_role_routes(api_v1)
    except ImportError as e:
        print(f"Warning: Could not import role routes: {e}")
    
    # Import existing route files that use blueprints directly
    # Skip duplicate v1 registration since we already have api_v1 blueprint
    
    # Import and register IRPA routes
    try:
        from backend.api.irpa_routes import irpa_bp
        app.register_blueprint(irpa_bp)
    except ImportError:
        pass
    
    # Configure CORS for API endpoints BEFORE registering blueprints
    cors_origins = app.config.get('CORS_ORIGINS', ['http://localhost:5173', 'http://localhost:5175'])
    CORS(api_v1, origins=cors_origins)
    CORS(api_v2, origins=cors_origins)
    CORS(api_bp, origins=cors_origins)
    
    # Register versioned blueprints with app
    app.register_blueprint(api_v1)
    app.register_blueprint(api_v2)
    
    # Register the main api_bp for backwards compatibility
    app.register_blueprint(api_bp)
    
    return app