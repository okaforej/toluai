from config.default import DefaultConfig

class ProductionConfig(DefaultConfig):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    
    # Use a more secure session type in production
    SESSION_TYPE = 'redis'
    
    # Set secure cookies
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True