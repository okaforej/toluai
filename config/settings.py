"""
Centralized settings management with environment variable support
Secure configuration for production deployment
"""

import os
from typing import Optional, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    """Application settings with secure defaults"""
    
    # Environment
    ENV: str = os.getenv('FLASK_ENV', 'development')
    DEBUG: bool = ENV == 'development'
    TESTING: bool = ENV == 'testing'
    
    # Security
    SECRET_KEY: str = os.getenv('SECRET_KEY', None)
    SECURITY_PASSWORD_SALT: str = os.getenv('SECURITY_PASSWORD_SALT', None)
    JWT_SECRET_KEY: str = os.getenv('JWT_SECRET_KEY', None)
    
    # Database
    DATABASE_URI: str = os.getenv('DATABASE_URI', 'sqlite:///instance/toluai.db')
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    SQLALCHEMY_ECHO: bool = DEBUG
    
    # Redis
    REDIS_URL: str = os.getenv('REDIS_URL', 'redis://localhost:6379')
    
    # Email
    MAIL_SERVER: str = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT: int = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS: bool = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
    MAIL_USERNAME: str = os.getenv('MAIL_USERNAME', '')
    MAIL_PASSWORD: str = os.getenv('MAIL_PASSWORD', '')
    
    # Admin
    ADMIN_EMAIL: str = os.getenv('ADMIN_EMAIL', 'admin@toluai.com')
    ADMIN_PASSWORD: str = os.getenv('ADMIN_PASSWORD', None)
    
    # Rate Limiting
    RATELIMIT_STORAGE_URL: str = REDIS_URL
    RATELIMIT_DEFAULT: str = os.getenv('API_RATE_LIMIT', '100 per minute')
    
    # File Upload
    MAX_CONTENT_LENGTH: int = int(os.getenv('MAX_CONTENT_LENGTH', 16777216))  # 16MB
    UPLOAD_FOLDER: str = os.getenv('UPLOAD_FOLDER', 'uploads')
    ALLOWED_EXTENSIONS: set = {'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'}
    
    # Pagination
    ITEMS_PER_PAGE: int = int(os.getenv('ITEMS_PER_PAGE', 20))
    
    # External Services
    SENTRY_DSN: Optional[str] = os.getenv('SENTRY_DSN', None)
    MAPBOX_API_KEY: Optional[str] = os.getenv('MAPBOX_API_KEY', None)
    
    # CORS
    CORS_ORIGINS: list = os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
    
    # Session
    SESSION_TYPE: str = 'redis'
    SESSION_REDIS: Any = None  # Will be set in app initialization
    PERMANENT_SESSION_LIFETIME: int = 3600  # 1 hour
    
    # Security Headers
    TALISMAN_CONFIG: dict = {
        'force_https': ENV == 'production',
        'strict_transport_security': ENV == 'production',
        'content_security_policy': {
            'default-src': "'self'",
            'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
            'style-src': "'self' 'unsafe-inline'",
            'img-src': "'self' data: https:",
            'font-src': "'self' data:",
        }
    }
    
    @classmethod
    def validate(cls):
        """Validate required settings"""
        errors = []
        
        if cls.ENV == 'production':
            # Check required production settings
            if not cls.SECRET_KEY or cls.SECRET_KEY == 'your-super-secret-key-change-this-in-production':
                errors.append("SECRET_KEY must be set for production")
            
            if not cls.SECURITY_PASSWORD_SALT:
                errors.append("SECURITY_PASSWORD_SALT must be set for production")
            
            if not cls.JWT_SECRET_KEY:
                errors.append("JWT_SECRET_KEY must be set for production")
            
            if 'sqlite' in cls.DATABASE_URI.lower():
                errors.append("SQLite should not be used in production")
            
            if not cls.ADMIN_PASSWORD or cls.ADMIN_PASSWORD == 'admin123':
                errors.append("ADMIN_PASSWORD must be changed from default")
        
        if errors:
            raise ValueError(f"Configuration errors: {'; '.join(errors)}")
    
    @classmethod
    def get_safe_config(cls) -> dict:
        """Get configuration safe for client-side exposure"""
        return {
            'ENV': cls.ENV,
            'API_URL': '/api/v1',
            'MAX_FILE_SIZE': cls.MAX_CONTENT_LENGTH,
            'ALLOWED_FILE_TYPES': list(cls.ALLOWED_EXTENSIONS),
        }

# Validate settings on import
Settings.validate()