import os
from datetime import timedelta

class DefaultConfig:
    """Default configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-for-testing')
    
    # SQLAlchemy
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI', 'sqlite:///insurance_risk.db')
    
    # Flask-Login
    REMEMBER_COOKIE_DURATION = timedelta(days=14)
    
    # Application settings
    APP_NAME = "Insurance Risk AI Platform"
    ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@example.com')
    
    # AI model settings
    MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml_models')
    DEFAULT_MODEL = os.path.join(MODEL_PATH, 'risk_model_v1.pkl')
    
    # API settings
    API_RATE_LIMIT = '100 per minute'