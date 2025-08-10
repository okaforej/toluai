"""
Enhanced configuration management for ToluAI backend.

Provides secure, environment-specific configuration with validation
and proper secret management.
"""

import os
import secrets
from datetime import timedelta
from typing import Optional, Dict, Any
from dataclasses import dataclass
from pathlib import Path


@dataclass
class DatabaseConfig:
    """Database configuration settings."""
    uri: str
    pool_size: int = 20
    pool_pre_ping: bool = True
    pool_recycle: int = 3600
    max_overflow: int = 30
    echo: bool = False


@dataclass
class SecurityConfig:
    """Security configuration settings."""
    secret_key: str
    jwt_secret_key: str
    jwt_access_token_expires: timedelta
    jwt_refresh_token_expires: timedelta
    password_hash_rounds: int = 12
    session_cookie_secure: bool = True
    session_cookie_httponly: bool = True
    session_cookie_samesite: str = 'Lax'


@dataclass
class RedisConfig:
    """Redis configuration settings."""
    url: str
    decode_responses: bool = True
    socket_connect_timeout: int = 5
    socket_timeout: int = 5
    retry_on_timeout: bool = True


@dataclass
class AIConfig:
    """AI/ML configuration settings."""
    model_path: str
    default_model: str
    confidence_threshold: float = 0.7
    max_assessment_time: int = 300  # seconds
    feature_store_path: str = ""


class Config:
    """Base configuration class with common settings."""
    
    def __init__(self, environment: str = None):
        self.environment = environment or os.getenv('FLASK_ENV', 'development')
        self._load_config()
        self._validate_config()
    
    def _load_config(self):
        """Load configuration from environment variables."""
        # Application settings
        self.APP_NAME = os.getenv('APP_NAME', 'ToluAI Insurance Risk Platform')
        self.VERSION = os.getenv('APP_VERSION', '1.0.0')
        self.DEBUG = self.environment == 'development'
        self.TESTING = self.environment == 'testing'
        
        # Security configuration
        self.security = SecurityConfig(
            secret_key=self._get_secret_key(),
            jwt_secret_key=self._get_jwt_secret_key(),
            jwt_access_token_expires=timedelta(
                hours=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_HOURS', '1'))
            ),
            jwt_refresh_token_expires=timedelta(
                days=int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES_DAYS', '30'))
            ),
            password_hash_rounds=int(os.getenv('PASSWORD_HASH_ROUNDS', '12')),
            session_cookie_secure=not self.DEBUG,
            session_cookie_httponly=True,
            session_cookie_samesite='Lax'
        )
        
        # Database configuration
        self.database = DatabaseConfig(
            uri=self._get_database_uri(),
            pool_size=int(os.getenv('DB_POOL_SIZE', '20')),
            pool_pre_ping=True,
            pool_recycle=int(os.getenv('DB_POOL_RECYCLE', '3600')),
            max_overflow=int(os.getenv('DB_MAX_OVERFLOW', '30')),
            echo=self.DEBUG and os.getenv('DB_ECHO', 'false').lower() == 'true'
        )
        
        # Redis configuration
        self.redis = RedisConfig(
            url=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
            decode_responses=True,
            socket_connect_timeout=int(os.getenv('REDIS_CONNECT_TIMEOUT', '5')),
            socket_timeout=int(os.getenv('REDIS_TIMEOUT', '5')),
            retry_on_timeout=True
        )
        
        # AI/ML configuration
        project_root = Path(__file__).parent.parent.parent
        model_path = project_root / 'ml_models'
        
        self.ai = AIConfig(
            model_path=str(model_path),
            default_model=str(model_path / 'risk_model_v1.pkl'),
            confidence_threshold=float(os.getenv('AI_CONFIDENCE_THRESHOLD', '0.7')),
            max_assessment_time=int(os.getenv('AI_MAX_ASSESSMENT_TIME', '300')),
            feature_store_path=str(model_path / 'features')
        )
        
        # Rate limiting
        self.RATELIMIT_STORAGE_URL = self.redis.url
        self.RATELIMIT_DEFAULT = os.getenv('RATELIMIT_DEFAULT', '100 per minute')
        
        # Email configuration
        self.MAIL_SERVER = os.getenv('MAIL_SERVER', 'localhost')
        self.MAIL_PORT = int(os.getenv('MAIL_PORT', '587'))
        self.MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
        self.MAIL_USERNAME = os.getenv('MAIL_USERNAME')
        self.MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
        self.MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@toluai.com')
        
        # Monitoring and logging
        self.SENTRY_DSN = os.getenv('SENTRY_DSN')
        self.LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
        self.LOG_FORMAT = os.getenv('LOG_FORMAT', 'json')
        
        # File upload settings
        self.MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', '16777216'))  # 16MB
        self.UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
        
        # Celery configuration (for background tasks)
        self.CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', self.redis.url)
        self.CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', self.redis.url)
    
    def _get_secret_key(self) -> str:
        """Get or generate a secure secret key."""
        secret_key = os.getenv('SECRET_KEY')
        
        if not secret_key:
            if self.environment == 'production':
                raise ValueError("SECRET_KEY must be set in production environment")
            # Generate a secure key for development
            secret_key = secrets.token_urlsafe(32)
        
        if len(secret_key) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        
        return secret_key
    
    def _get_jwt_secret_key(self) -> str:
        """Get or generate a secure JWT secret key."""
        jwt_secret = os.getenv('JWT_SECRET_KEY')
        
        if not jwt_secret:
            if self.environment == 'production':
                raise ValueError("JWT_SECRET_KEY must be set in production environment")
            # Use a different key from the main secret key
            jwt_secret = secrets.token_urlsafe(32)
        
        return jwt_secret
    
    def _get_database_uri(self) -> str:
        """Get database URI with environment-specific defaults."""
        database_uri = os.getenv('DATABASE_URI')
        
        if not database_uri:
            if self.environment == 'production':
                raise ValueError("DATABASE_URI must be set in production environment")
            elif self.environment == 'testing':
                database_uri = 'sqlite:///:memory:'
            else:
                # Development default
                project_root = Path(__file__).parent.parent.parent
                db_path = project_root / 'instance' / 'toluai.db'
                database_uri = f'sqlite:///{db_path}'
        
        return database_uri
    
    def _validate_config(self):
        """Validate configuration settings."""
        # Validate required settings for production
        if self.environment == 'production':
            required_settings = [
                'SECRET_KEY',
                'JWT_SECRET_KEY', 
                'DATABASE_URI'
            ]
            
            missing_settings = []
            for setting in required_settings:
                if not os.getenv(setting):
                    missing_settings.append(setting)
            
            if missing_settings:
                raise ValueError(
                    f"Missing required production settings: {', '.join(missing_settings)}"
                )
        
        # Validate database URI format
        if not self.database.uri.startswith(('postgresql://', 'sqlite:///', 'mysql://')):
            raise ValueError("Invalid database URI format")
        
        # Validate Redis URL format
        if not self.redis.url.startswith('redis://'):
            raise ValueError("Invalid Redis URL format")
    
    def get_sqlalchemy_config(self) -> Dict[str, Any]:
        """Get SQLAlchemy configuration dictionary."""
        return {
            'SQLALCHEMY_DATABASE_URI': self.database.uri,
            'SQLALCHEMY_TRACK_MODIFICATIONS': False,
            'SQLALCHEMY_ENGINE_OPTIONS': {
                'pool_size': self.database.pool_size,
                'pool_pre_ping': self.database.pool_pre_ping,
                'pool_recycle': self.database.pool_recycle,
                'max_overflow': self.database.max_overflow,
                'echo': self.database.echo
            }
        }
    
    def get_jwt_config(self) -> Dict[str, Any]:
        """Get JWT configuration dictionary."""
        return {
            'JWT_SECRET_KEY': self.security.jwt_secret_key,
            'JWT_ACCESS_TOKEN_EXPIRES': self.security.jwt_access_token_expires,
            'JWT_REFRESH_TOKEN_EXPIRES': self.security.jwt_refresh_token_expires,
            'JWT_ALGORITHM': 'HS256',
            'JWT_BLACKLIST_ENABLED': True,
            'JWT_BLACKLIST_TOKEN_CHECKS': ['access', 'refresh']
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary (excluding sensitive data)."""
        return {
            'app_name': self.APP_NAME,
            'version': self.VERSION,
            'environment': self.environment,
            'debug': self.DEBUG,
            'testing': self.TESTING,
            'database_type': self.database.uri.split('://')[0],
            'redis_configured': bool(self.redis.url),
            'mail_configured': bool(self.MAIL_SERVER),
            'sentry_configured': bool(self.SENTRY_DSN),
            'ai_model_path': self.ai.model_path
        }


class DevelopmentConfig(Config):
    """Development environment configuration."""
    
    def __init__(self):
        super().__init__('development')


class TestingConfig(Config):
    """Testing environment configuration."""
    
    def __init__(self):
        super().__init__('testing')
        # Override settings for testing
        self.database.uri = 'sqlite:///:memory:'
        self.security.jwt_access_token_expires = timedelta(minutes=15)
        self.WTF_CSRF_ENABLED = False


class ProductionConfig(Config):
    """Production environment configuration."""
    
    def __init__(self):
        super().__init__('production')


# Configuration factory
_config_map = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig
}


def get_config(environment: Optional[str] = None) -> Config:
    """
    Get configuration instance for the specified environment.
    
    Args:
        environment: Environment name (development, testing, production)
        
    Returns:
        Configuration instance
        
    Raises:
        ValueError: If environment is not supported
    """
    if environment is None:
        environment = os.getenv('FLASK_ENV', 'development')
    
    config_class = _config_map.get(environment)
    if not config_class:
        raise ValueError(f"Unsupported environment: {environment}")
    
    return config_class()
