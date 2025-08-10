"""
API Version 1 module
Consolidates all v1 API endpoints
"""

from flask import Blueprint

def create_api_v1_blueprint():
    """
    Create and configure API v1 blueprint with all endpoints
    
    Returns:
        Blueprint: Configured API v1 blueprint
    """
    # Create main v1 blueprint
    api_v1 = Blueprint('api_v1', __name__)
    
    # Import and register route modules
    from backend.api.v1.companies import register_company_routes
    from backend.api.v1.roles import register_role_routes
    from backend.api.v1.rules import register_rule_routes
    from backend.api.v1.users import register_user_routes
    from backend.api.v1.auth import register_auth_routes
    from backend.api.v1.clients import register_client_routes
    from backend.api.v1.assessments import register_assessment_routes
    from backend.api.v1.irpa import register_irpa_routes
    
    # Register all routes with the blueprint
    register_company_routes(api_v1)
    register_role_routes(api_v1)
    register_rule_routes(api_v1)
    register_user_routes(api_v1)
    register_auth_routes(api_v1)
    register_client_routes(api_v1)
    register_assessment_routes(api_v1)
    register_irpa_routes(api_v1)
    
    return api_v1