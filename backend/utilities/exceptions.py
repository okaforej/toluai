"""
Custom exception classes for ToluAI backend.

Provides structured error handling with proper HTTP status codes
and detailed error information for debugging and user feedback.
"""

from typing import Optional, Dict, Any
from flask import jsonify
from werkzeug.exceptions import HTTPException


class ToluAIException(Exception):
    """Base exception class for ToluAI application."""
    
    def __init__(
        self, 
        message: str, 
        status_code: int = 500,
        error_code: str = None,
        details: Dict[str, Any] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__.upper()
        self.details = details or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for JSON response."""
        return {
            'success': False,
            'error': {
                'code': self.error_code,
                'message': self.message,
                'details': self.details
            }
        }
    
    def to_response(self):
        """Convert exception to Flask JSON response."""
        return jsonify(self.to_dict()), self.status_code


class ValidationError(ToluAIException):
    """Raised when input validation fails."""
    
    def __init__(
        self, 
        message: str = "Validation failed", 
        field_errors: Dict[str, list] = None
    ):
        details = {'field_errors': field_errors} if field_errors else {}
        super().__init__(
            message=message,
            status_code=400,
            error_code='VALIDATION_ERROR',
            details=details
        )


class AuthenticationError(ToluAIException):
    """Raised when authentication fails."""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            status_code=401,
            error_code='AUTHENTICATION_ERROR'
        )


class AuthorizationError(ToluAIException):
    """Raised when authorization fails."""
    
    def __init__(self, message: str = "Access denied"):
        super().__init__(
            message=message,
            status_code=403,
            error_code='AUTHORIZATION_ERROR'
        )


class ResourceNotFoundError(ToluAIException):
    """Raised when a requested resource is not found."""
    
    def __init__(self, resource_type: str = "Resource", resource_id: Any = None):
        message = f"{resource_type} not found"
        if resource_id:
            message += f" (ID: {resource_id})"
        
        super().__init__(
            message=message,
            status_code=404,
            error_code='RESOURCE_NOT_FOUND',
            details={'resource_type': resource_type, 'resource_id': resource_id}
        )


class ConflictError(ToluAIException):
    """Raised when a resource conflict occurs."""
    
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(
            message=message,
            status_code=409,
            error_code='CONFLICT_ERROR'
        )


class RateLimitError(ToluAIException):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(
            message=message,
            status_code=429,
            error_code='RATE_LIMIT_ERROR'
        )


class BusinessLogicError(ToluAIException):
    """Raised when business logic validation fails."""
    
    def __init__(self, message: str, error_code: str = None):
        super().__init__(
            message=message,
            status_code=422,
            error_code=error_code or 'BUSINESS_LOGIC_ERROR'
        )


class ExternalServiceError(ToluAIException):
    """Raised when external service integration fails."""
    
    def __init__(self, service_name: str, message: str = None):
        message = message or f"External service '{service_name}' is unavailable"
        super().__init__(
            message=message,
            status_code=503,
            error_code='EXTERNAL_SERVICE_ERROR',
            details={'service_name': service_name}
        )


class AIModelError(ToluAIException):
    """Raised when AI model operations fail."""
    
    def __init__(self, message: str = "AI model error", model_name: str = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code='AI_MODEL_ERROR',
            details={'model_name': model_name}
        )


class DatabaseError(ToluAIException):
    """Raised when database operations fail."""
    
    def __init__(self, message: str = "Database operation failed", operation: str = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code='DATABASE_ERROR',
            details={'operation': operation}
        )


class ConfigurationError(ToluAIException):
    """Raised when configuration is invalid or missing."""
    
    def __init__(self, message: str = "Configuration error", setting: str = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code='CONFIGURATION_ERROR',
            details={'setting': setting}
        )


def register_error_handlers(app):
    """Register error handlers with Flask application."""
    
    @app.errorhandler(ToluAIException)
    def handle_toluai_exception(error):
        """Handle custom ToluAI exceptions."""
        return error.to_response()
    
    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        """Handle standard HTTP exceptions."""
        return jsonify({
            'success': False,
            'error': {
                'code': error.name.upper().replace(' ', '_'),
                'message': error.description,
                'details': {}
            }
        }), error.code
    
    @app.errorhandler(Exception)
    def handle_generic_exception(error):
        """Handle unexpected exceptions."""
        app.logger.exception("Unhandled exception occurred")
        
        # Don't expose internal error details in production
        if app.config.get('DEBUG'):
            message = str(error)
        else:
            message = "An internal error occurred"
        
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': message,
                'details': {}
            }
        }), 500
    
    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle 404 errors."""
        return jsonify({
            'success': False,
            'error': {
                'code': 'NOT_FOUND',
                'message': 'The requested resource was not found',
                'details': {}
            }
        }), 404
    
    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        """Handle 405 errors."""
        return jsonify({
            'success': False,
            'error': {
                'code': 'METHOD_NOT_ALLOWED',
                'message': 'The requested method is not allowed for this resource',
                'details': {}
            }
        }), 405
