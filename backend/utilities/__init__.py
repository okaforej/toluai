"""
Utilities Module - Consolidated helper functions and utilities
Combines functionality from core/ and utils/ modules
"""

# Import configuration utilities
from backend.utilities.config import (
    Config,
    DevelopmentConfig,
    ProductionConfig,
    TestingConfig,
    get_config
)

# Import exception classes
from backend.utilities.exceptions import (
    ToluAIException,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    ResourceNotFoundError,
    ConflictError,
    RateLimitError,
    BusinessLogicError,
    ExternalServiceError,
    AIModelError,
    HTTPException
)

# Import validators
from backend.utilities.validators import *

# Import decorators
from backend.utilities.decorators import (
    admin_required,
    company_admin_required,
    system_admin_required,
    risk_analyst_required,
    underwriter_required,
    compliance_required,
    authenticated_required,
    check_permission
)

__all__ = [
    # Config
    'Config',
    'DevelopmentConfig',
    'ProductionConfig',
    'TestingConfig',
    'get_config',
    
    # Exceptions
    'IRPAException',
    'ValidationException',
    'AuthenticationException',
    'AuthorizationException',
    'ResourceNotFoundException',
    'DuplicateResourceException',
    'RateLimitException',
    'ConfigurationException',
    'DatabaseException',
    'IntegrationException',
    'AIModelException',
    'DataProcessingException',
    'BusinessRuleException',
    'NotificationException',
    'FileProcessingException',
    'ReportGenerationException',
    'WorkflowException',
    'APIException',
    'SystemException',
    
    # Decorators
    'admin_required',
    'company_admin_required',
    'system_admin_required',
    'risk_analyst_required',
    'underwriter_required',
    'compliance_required',
    'authenticated_required',
    'check_permission'
]