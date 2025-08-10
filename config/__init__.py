import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class DefaultConfig:
    """Default configuration with common settings"""
    
    # Basic Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-please-change-in-production')
    WTF_CSRF_ENABLED = True
    
    # SQLAlchemy Configuration
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 120,
        'pool_pre_ping': True
    }
    
    # Flask-Security Configuration
    SECURITY_REGISTERABLE = True
    SECURITY_CONFIRMABLE = True
    SECURITY_RECOVERABLE = True
    SECURITY_CHANGEABLE = True
    SECURITY_PASSWORD_HASH = 'argon2'
    SECURITY_PASSWORD_SALT = os.environ.get('SECURITY_PASSWORD_SALT', 'super-secret-salt')
    SECURITY_EMAIL_SENDER = os.environ.get('MAIL_USERNAME', 'noreply@toluai.com')
    SECURITY_POST_LOGIN_REDIRECT_ENDPOINT = 'main.dashboard'
    SECURITY_POST_LOGOUT_REDIRECT_ENDPOINT = 'main.index'
    
    # Flask-Login Configuration
    REMEMBER_COOKIE_DURATION = timedelta(days=14)
    REMEMBER_COOKIE_SECURE = True
    REMEMBER_COOKIE_HTTPONLY = True
    
    # Mail Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'localhost')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ('true', '1', 'yes')
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    
    # Application Settings
    APP_NAME = "ToluAI Insurance Risk Assessment Platform"
    ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@toluai.com')
    
    # AI Model Settings
    MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml_models')
    DEFAULT_MODEL = os.path.join(MODEL_PATH, 'risk_model_v1.pkl')
    
    # API Settings
    API_RATE_LIMIT = os.environ.get('API_RATE_LIMIT', '100 per minute')
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # File Upload Settings
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    UPLOAD_FOLDER = 'uploads'
    
    # Pagination
    ITEMS_PER_PAGE = int(os.environ.get('ITEMS_PER_PAGE', 20))
    
    # Redis Configuration
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379')
    
    # Security Headers (Flask-Talisman)
    TALISMAN_CONFIG = {
        'force_https': False,  # Will be True in production
        'content_security_policy': {
            'default-src': "'self'",
            'script-src': "'self' 'unsafe-inline' cdn.jsdelivr.net",
            'style-src': "'self' 'unsafe-inline' cdn.jsdelivr.net",
            'img-src': "'self' data:",
            'font-src': "'self' cdn.jsdelivr.net",
        }
    }


class DevelopmentConfig(DefaultConfig):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URI', 
        'sqlite:///instance/toluai_dev.db'
    )
    
    # Disable HTTPS enforcement in development
    TALISMAN_CONFIG = {
        **DefaultConfig.TALISMAN_CONFIG,
        'force_https': False
    }
    
    # Less strict security for development
    SECURITY_EMAIL_VALIDATOR_ARGS = {'check_deliverability': False}
    WTF_CSRF_ENABLED = True  # Keep CSRF enabled even in dev


class TestingConfig(DefaultConfig):
    """Testing configuration"""
    TESTING = True
    DEBUG = False
    
    # In-memory database for testing
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    
    # Disable CSRF for easier testing
    WTF_CSRF_ENABLED = False
    
    # Speed up password hashing in tests
    SECURITY_PASSWORD_HASH = 'plaintext'
    
    # Disable email sending in tests
    MAIL_SUPPRESS_SEND = True


class ProductionConfig(DefaultConfig):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI')
    
    if not SQLALCHEMY_DATABASE_URI:
        raise ValueError("DATABASE_URI must be set in production")
    
    # Enhanced security for production
    TALISMAN_CONFIG = {
        **DefaultConfig.TALISMAN_CONFIG,
        'force_https': True,
        'strict_transport_security': True,
        'strict_transport_security_max_age': 31536000,
    }
    
    # Secure session cookies
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Sentry error tracking
    SENTRY_DSN = os.environ.get('SENTRY_DSN')


class StagingConfig(ProductionConfig):
    """Staging configuration (production-like but with debug info)"""
    DEBUG = True
    
    # Allow HTTP in staging for testing
    TALISMAN_CONFIG = {
        **ProductionConfig.TALISMAN_CONFIG,
        'force_https': False
    }


config_dict = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'staging': StagingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}