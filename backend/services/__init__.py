"""
Backend services initialization
"""

from flask import Flask

def init_services(app: Flask):
    """
    Initialize backend services
    
    Args:
        app: Flask application instance
    """
    # Initialize risk assessment service
    from backend.services.risk_service import RiskAssessmentService
    app.risk_service = RiskAssessmentService()
    
    # Initialize notification service
    from backend.services.notification_service import NotificationService
    app.notification_service = NotificationService(app)
    
    # Initialize audit service
    from backend.services.audit_service import AuditService
    app.audit_service = AuditService()
    
    # Initialize cache service
    from backend.services.cache_service import CacheService
    app.cache_service = CacheService(app)