"""
Backend module initialization
Provides centralized API and business logic layer
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Import extensions from app for compatibility
from backend.app import db, migrate

def init_backend(app: Flask):
    """
    Initialize backend module with Flask app
    
    Args:
        app: Flask application instance
    """
    # Register API blueprints
    from backend.api import register_api_routes
    register_api_routes(app)
    
    # Initialize backend services
    from backend.services import init_services
    init_services(app)
    
    # Initialize backend CLI commands
    from backend.cli import init_backend_cli
    init_backend_cli(app)
    
    return app