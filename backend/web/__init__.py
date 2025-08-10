"""
Web Module - Template-based web UI routes
Handles Flask-rendered pages for admin panels and forms
"""

from flask import Flask

def register_web_routes(app: Flask):
    """Register all web UI routes with the Flask application"""
    
    # Import and register main web routes
    from backend.web.main import main_bp
    app.register_blueprint(main_bp)
    
    # Import and register client web routes
    from backend.web.client import client_bp
    app.register_blueprint(client_bp, url_prefix='/clients')
    
    # Import and register assessment web routes
    from backend.web.assessment import assessment_bp
    app.register_blueprint(assessment_bp, url_prefix='/assessments')
    
    # Import and register auth web routes
    try:
        from backend.auth import auth_bp
        app.register_blueprint(auth_bp)
    except ImportError:
        pass  # Auth routes might not be available
    
    return app