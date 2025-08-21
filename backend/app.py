"""
Main Flask Application
Consolidated from app folder into backend
"""

from flask import Flask, render_template, request, current_app
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect
from flask_security import Security, SQLAlchemyUserDatastore
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import structlog
import logging
import os
from datetime import datetime
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
csrf = CSRFProtect()
mail = Mail()
security = Security()
jwt = JWTManager()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)
talisman = Talisman()
cors = CORS()

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

def create_app(config_name='development'):
    """Create and configure the Flask application"""
    app = Flask(__name__, 
                template_folder='templates',
                static_folder='static')
    
    # Load configuration
    from backend.utilities.config import DevelopmentConfig, ProductionConfig, TestingConfig
    
    if config_name == 'production':
        config = ProductionConfig()
    elif config_name == 'testing':
        config = TestingConfig()
    else:
        config = DevelopmentConfig()
    
    # Apply SQLAlchemy configuration
    app.config.update(config.get_sqlalchemy_config())
    
    # Apply JWT configuration  
    app.config.update(config.get_jwt_config())
    
    # Apply other configurations
    app.config['SECRET_KEY'] = config.security.secret_key
    app.config['DEBUG'] = config.DEBUG
    app.config['TESTING'] = config.TESTING
    
    # Override with environment variables
    app.config.from_prefixed_env()
    
    # Initialize Sentry if DSN is configured
    if app.config.get('SENTRY_DSN'):
        sentry_sdk.init(
            dsn=app.config['SENTRY_DSN'],
            integrations=[
                FlaskIntegration(transaction_style='endpoint'),
                SqlalchemyIntegration(),
            ],
            traces_sample_rate=app.config.get('SENTRY_TRACES_SAMPLE_RATE', 0.1),
            environment=config_name
        )
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    jwt.init_app(app)
    
    # Configure CORS
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": app.config.get('CORS_ORIGINS', ['http://localhost:5173', 'http://localhost:5175']),
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    # Configure CSRF protection (disable for API routes)
    csrf.init_app(app)
    csrf.exempt('backend.api')
    csrf.exempt('backend.api.v1')
    csrf.exempt('backend.api.v2')
    
    # Configure rate limiting
    limiter.init_app(app)
    
    # Configure Talisman (security headers) - disable in development
    if config_name == 'production':
        talisman.init_app(app, 
                         force_https=True,
                         strict_transport_security=True,
                         content_security_policy={
                             'default-src': "'self'",
                             'script-src': "'self' 'unsafe-inline' https://cdn.jsdelivr.net",
                             'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
                             'font-src': "'self' https://fonts.gstatic.com",
                             'img-src': "'self' data: https:",
                         })
    
    # Import models to ensure they're registered with SQLAlchemy
    from backend import models
    
    # Configure Flask-Security
    from backend.models.user import User, Role
    user_datastore = SQLAlchemyUserDatastore(db, User, Role)
    security.init_app(app, user_datastore)
    
    # Register blueprints
    register_blueprints(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register CLI commands
    register_cli_commands(app)
    
    # Add health check endpoints
    @app.route('/health')
    @app.route('/api/health')
    @app.route('/api/v1/health')
    def health_check():
        """Health check endpoint for monitoring"""
        return {
            'status': 'healthy',
            'service': 'toluai-backend',
            'timestamp': datetime.utcnow().isoformat(),
            'environment': config_name,
            'database': 'connected' if db.engine else 'disconnected'
        }, 200
    
    # Initialize RBAC system if enabled
    if app.config.get('USE_ENHANCED_RBAC', False):
        from backend.rbac_system import rbac_manager, create_rbac_routes
        rbac_manager.init_app(app)
        rbac_manager.set_user_loader(load_user_for_rbac)
        create_rbac_routes(app)
    
    # Add shell context processor
    @app.shell_context_processor
    def make_shell_context():
        return {
            'db': db,
            'User': User,
            'Role': Role,
        }
    
    @app.before_request
    def log_request():
        """Log incoming requests"""
        logger.info('request_started',
                   method=request.method,
                   path=request.path,
                   remote_addr=request.remote_addr)
    
    @app.after_request
    def log_response(response):
        """Log outgoing responses"""
        logger.info('request_completed',
                   method=request.method,
                   path=request.path,
                   status_code=response.status_code)
        return response
    
    return app

def register_blueprints(app):
    """Register all application blueprints"""
    
    # Register API routes
    from backend.api import register_api_routes
    register_api_routes(app)
    
    # Register web UI routes
    from backend.web import register_web_routes
    register_web_routes(app)
    
    # Admin blueprint (keep separate as it has special requirements)
    from backend.admin.routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/admin')
    
    logger.info('blueprints_registered', count=6)

def register_error_handlers(app):
    """Register error handlers"""
    
    @app.errorhandler(400)
    def bad_request(error):
        logger.warning('bad_request', error=str(error))
        return {'error': 'Bad request', 'message': str(error)}, 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        logger.warning('unauthorized', error=str(error))
        return {'error': 'Unauthorized', 'message': 'Authentication required'}, 401
    
    @app.errorhandler(403)
    def forbidden(error):
        logger.warning('forbidden', error=str(error))
        return {'error': 'Forbidden', 'message': 'Access denied'}, 403
    
    @app.errorhandler(404)
    def not_found(error):
        logger.warning('not_found', error=str(error))
        return {'error': 'Not found', 'message': 'Resource not found'}, 404
    
    @app.errorhandler(429)
    def rate_limit_exceeded(error):
        logger.warning('rate_limit_exceeded', error=str(error))
        return {'error': 'Too many requests', 'message': 'Rate limit exceeded'}, 429
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error('internal_error', error=str(error))
        db.session.rollback()
        return {'error': 'Internal server error', 'message': 'An unexpected error occurred'}, 500

def register_cli_commands(app):
    """Register CLI commands"""
    
    @app.cli.command()
    def init_db():
        """Initialize the database"""
        db.create_all()
        print("Database initialized!")
    
    @app.cli.command()
    def seed_db():
        """Seed the database with initial data"""
        from backend.utilities.seed_data import seed_database
        seed_database()
        print("Database seeded!")
    
    @app.cli.command()
    def create_admin():
        """Create an admin user"""
        from backend.models.user import User, Role
        from werkzeug.security import generate_password_hash
        
        email = input("Enter admin email: ")
        password = input("Enter admin password: ")
        name = input("Enter admin name: ")
        
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        if user:
            print(f"User {email} already exists!")
            return
        
        # Create admin role if it doesn't exist
        admin_role = Role.query.filter_by(name='admin').first()
        if not admin_role:
            admin_role = Role(name='admin', description='Administrator')
            db.session.add(admin_role)
        
        # Create user
        user = User(
            email=email,
            name=name,
            password_hash=generate_password_hash(password),
            active=True
        )
        user.roles.append(admin_role)
        
        db.session.add(user)
        db.session.commit()
        
        print(f"Admin user {email} created successfully!")
    
    @app.cli.command()
    def create_rbac_roles():
        """Create default RBAC roles and permissions"""
        from backend.rbac_system import SYSTEM_ROLES, SystemPermissions
        from backend.models.user import Role
        
        for role_name, role_data in SYSTEM_ROLES.items():
            existing_role = Role.query.filter_by(name=role_name).first()
            if not existing_role:
                role = Role(
                    name=role_name,
                    description=role_data['description']
                )
                db.session.add(role)
                print(f"Created role: {role_name}")
        
        db.session.commit()
        print("RBAC roles created successfully!")

def load_user_for_rbac(user_id):
    """Load user for RBAC system"""
    from backend.models.user import User
    user = User.query.get(int(user_id))
    if user:
        return {
            'id': str(user.id),
            'email': user.email,
            'name': user.name,
            'company_id': str(user.company_id) if user.company_id else None,
            'roles': [
                {
                    'id': str(role.id),
                    'name': role.name,
                    'description': role.description
                }
                for role in user.roles
            ],
            'is_active': user.active
        }
    return None

if __name__ == '__main__':
    app = create_app('development')
    app.run(debug=True, host='0.0.0.0', port=5175)