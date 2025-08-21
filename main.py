#!/usr/bin/env python3
"""
Unified main entry point for ToluAI application
Works both locally and on Google App Engine
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token
from flask_restx import Api, Resource, fields, Namespace
import os
import sys
import datetime
from dotenv import load_dotenv

# Add backend to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Determine environment
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
IS_GAE = os.getenv('GAE_ENV', False)

# Create Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Database configuration - use Cloud SQL on GCP, SQLite locally
if IS_GAE or ENVIRONMENT == 'production':
    # Google App Engine Cloud SQL configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        'DATABASE_URL',
        'postgresql://toluai_user:ToluAI2024Prod!@/toluai_prod?host=/cloudsql/toluai-prod-1755383107:us-central1:toluai-db'
    )
else:
    # Local development database
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        'DATABASE_URL',
        'sqlite:///toluai.db'
    )

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Configure CORS - include production URL
cors_origins = [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'https://toluai-prod-1755383107.uc.r.appspot.com'
]
CORS(app, origins=cors_origins)

# Initialize Swagger/OpenAPI documentation
api = Api(
    app,
    version='2.0.0',
    title='ToluAI Risk Assessment API',
    description='Insurance Risk Professional Assessment (IRPA) System API Documentation',
    doc='/api/docs',
    authorizations={
        'Bearer': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': 'JWT Authorization header using the Bearer scheme. Example: "Bearer {token}"'
        }
    },
    security='Bearer'
)

# Create API namespaces
auth_ns = api.namespace('api/v1/auth', description='Authentication operations')
irpa_v1_ns = api.namespace('api/v1/irpa', description='IRPA operations v1')
irpa_v2_ns = api.namespace('api/v2/irpa', description='IRPA operations v2')

# Define Swagger models
login_model = api.model('Login', {
    'email': fields.String(required=True, description='User email address'),
    'password': fields.String(required=True, description='User password')
})

auth_response_model = api.model('AuthResponse', {
    'access_token': fields.String(description='JWT access token'),
    'user': fields.Raw(description='User information object')
})

# Mock users for demo (replace with database in production)
demo_users = {
    'admin@toluai.com': {
        'password': 'Admin123!',
        'id': 1,
        'name': 'System Administrator',
        'roles': ['system_admin'],
        'is_admin': True
    },
    'analyst@toluai.com': {
        'password': 'Analyst123!',
        'id': 2,
        'name': 'Risk Analyst',
        'roles': ['risk_analyst'],
        'is_admin': False
    },
    'viewer@toluai.com': {
        'password': 'Viewer123!',
        'id': 3,
        'name': 'Report Viewer',
        'roles': ['viewer'],
        'is_admin': False
    }
}

# Health check endpoints
@app.route('/health')
@app.route('/api/health')
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test database connection if in production
        if ENVIRONMENT == 'production':
            db.engine.execute('SELECT 1')
            db_status = 'connected'
        else:
            db_status = 'mock_mode'
    except Exception as e:
        db_status = f'error: {str(e)}'
    
    return jsonify({
        'status': 'healthy',
        'service': 'toluai-backend',
        'timestamp': datetime.datetime.utcnow().isoformat(),
        'environment': ENVIRONMENT,
        'database': db_status,
        'api_docs': '/api/docs'
    }), 200

# Root endpoint
@app.route('/')
def index():
    return jsonify({
        'message': 'ToluAI Backend API is running',
        'version': '2.0.0',
        'docs': '/api/docs',
        'health': '/health'
    }), 200

# Authentication endpoints
@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.expect(login_model)
    @auth_ns.marshal_with(auth_response_model)
    @auth_ns.doc('user_login',
                 responses={
                     200: 'Login successful',
                     400: 'Invalid credentials',
                     401: 'Authentication failed'
                 })
    def post(self):
        """Authenticate user and receive JWT token"""
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return {'error': 'Email and password required'}, 400
        
        # Check demo users (replace with database lookup in production)
        user_data = demo_users.get(email)
        
        if user_data and user_data['password'] == password:
            access_token = create_access_token(
                identity=email,
                additional_claims={
                    'user_id': user_data['id'],
                    'email': email,
                    'name': user_data['name'],
                    'roles': user_data['roles']
                }
            )
            
            return {
                'access_token': access_token,
                'user': {
                    'id': user_data['id'],
                    'email': email,
                    'name': user_data['name'],
                    'roles': user_data['roles'],
                    'is_admin': user_data.get('is_admin', False)
                }
            }, 200
        
        return {'error': 'Invalid credentials'}, 401

@auth_ns.route('/me')
class CurrentUser(Resource):
    @auth_ns.doc('get_current_user',
                 responses={
                     200: 'Success',
                     401: 'Unauthorized'
                 })
    def get(self):
        """Get current user information"""
        # For now, return a mock user
        return {
            'user': {
                'id': 1,
                'email': 'admin@toluai.com',
                'name': 'System Administrator',
                'roles': ['system_admin'],
                'is_admin': True
            }
        }, 200

@auth_ns.route('/logout')
class Logout(Resource):
    @auth_ns.doc('user_logout',
                 responses={
                     200: 'Logout successful'
                 })
    def post(self):
        """Logout current user"""
        return {'message': 'Logged out successfully'}, 200

# IRPA v1 endpoints
@irpa_v1_ns.route('/calculate-score')
class CalculateScoreV1(Resource):
    @irpa_v1_ns.doc('calculate_irpa_score_v1',
                    responses={
                        200: 'Score calculated successfully',
                        400: 'Invalid input data'
                    })
    def post(self):
        """Calculate IRPA CCI score using v1 algorithm"""
        data = request.get_json()
        
        # Simple mock calculation for v1
        base_score = 50
        if data.get('industry_type') == 'Technology':
            base_score += 10
        if data.get('operating_margin', 0) > 20:
            base_score -= 15
        
        risk_category = 'low' if base_score < 40 else 'medium' if base_score < 70 else 'high'
        
        return {
            'irpa_cci_score': base_score,
            'risk_category': risk_category,
            'version': 'v1',
            'timestamp': datetime.datetime.utcnow().isoformat()
        }, 200

@irpa_v1_ns.route('/assessments')
class AssessmentsV1(Resource):
    @irpa_v1_ns.doc('get_assessments_v1',
                    responses={
                        200: 'Assessments retrieved successfully'
                    })
    def get(self):
        """Get list of assessments"""
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        mock_assessments = [
            {
                'id': i,
                'entity_name': f'Company {i}',
                'risk_score': 45 + (i * 5),
                'risk_category': 'medium',
                'assessment_date': datetime.datetime.utcnow().isoformat(),
                'status': 'completed'
            }
            for i in range(1, 6)
        ]
        
        return {
            'assessments': mock_assessments,
            'total': len(mock_assessments),
            'page': page,
            'per_page': per_page
        }, 200

@irpa_v1_ns.route('/companies')
class CompaniesV1(Resource):
    @irpa_v1_ns.doc('get_companies_v1',
                    responses={
                        200: 'Companies retrieved successfully'
                    })
    def get(self):
        """Get list of companies"""
        return {
            'data': [
                {
                    'id': 1,
                    'name': 'Acme Insurance Corp',
                    'status': 'active',
                    'entities_count': 10
                },
                {
                    'id': 2,
                    'name': 'Global Tech Solutions',
                    'status': 'active',
                    'entities_count': 15
                }
            ],
            'total': 2
        }, 200

@irpa_v1_ns.route('/risk-distribution')
class RiskDistributionV1(Resource):
    @irpa_v1_ns.doc('get_risk_distribution_v1',
                    responses={
                        200: 'Risk distribution retrieved successfully'
                    })
    def get(self):
        """Get risk distribution statistics"""
        return {
            'distribution': {
                'low': 45,
                'medium': 35,
                'high': 15,
                'critical': 5
            },
            'total': 100,
            'timestamp': datetime.datetime.utcnow().isoformat()
        }, 200

# IRPA v2 endpoints (enhanced version)
@irpa_v2_ns.route('/calculate-score')
class CalculateScoreV2(Resource):
    @irpa_v2_ns.doc('calculate_irpa_score_v2',
                    responses={
                        200: 'Score calculated successfully',
                        400: 'Invalid input data'
                    })
    def post(self):
        """Calculate IRPA CCI score using v2 multiplicative engine"""
        try:
            from backend.services.scoring_functions import IRPAScoringFunctions
            
            data = request.get_json()
            scoring = IRPAScoringFunctions()
            
            # Calculate industry score
            industry_score = scoring.calculate_industry_risk_score(
                industry_type=data.get('industry_type', 'Technology'),
                operating_margin=data.get('operating_margin', 15),
                employee_count=data.get('employee_count', 5000),
                company_age=data.get('company_age', 10),
                pe_ratio=data.get('pe_ratio', 25)
            )
            
            # Calculate professional score
            professional_score = scoring.calculate_professional_risk_score(
                education_level=data.get('education_level', "Bachelor's Degree"),
                years_experience=data.get('years_experience', 8),
                job_title=data.get('job_title', 'Senior Analyst'),
                job_tenure=data.get('job_tenure', 3),
                practice_field=data.get('practice_field', 'Technology'),
                age=data.get('age', 35),
                state=data.get('state', 'California'),
                fico=data.get('fico_score', 720),
                dti=data.get('dti_ratio', 28),
                payment_history=data.get('payment_history', 95)
            )
            
            # Calculate final score
            final_scores = scoring.calculate_final_irpa_score(industry_score, professional_score)
            
            return {
                'irpa_cci_score': final_scores['irpa_cci_score'],
                'risk_category': final_scores['risk_category'],
                'industry_component': final_scores['industry_component'],
                'professional_component': final_scores['professional_component'],
                'methodology': 'multiplicative_v2',
                'timestamp': datetime.datetime.utcnow().isoformat()
            }, 200
            
        except ImportError:
            # Fallback if scoring module not available
            return {
                'irpa_cci_score': 65.5,
                'risk_category': 'medium',
                'methodology': 'mock_v2',
                'timestamp': datetime.datetime.utcnow().isoformat()
            }, 200

@irpa_v2_ns.route('/risk-distribution')
class RiskDistributionV2(Resource):
    @irpa_v2_ns.doc('get_risk_distribution_v2',
                    responses={
                        200: 'Risk distribution retrieved successfully'
                    })
    def get(self):
        """Get distribution across 7-tier risk categories"""
        return {
            'distribution': {
                'critical_high': {'count': 5, 'label': 'Critical High Risk', 'color': '#7c2d12'},
                'extremely_high': {'count': 12, 'label': 'Extremely High Risk', 'color': '#991b1b'},
                'very_high': {'count': 28, 'label': 'Very High Risk', 'color': '#dc2626'},
                'high': {'count': 45, 'label': 'High Risk', 'color': '#ef4444'},
                'moderate': {'count': 67, 'label': 'Moderate Risk', 'color': '#f59e0b'},
                'low': {'count': 89, 'label': 'Low Risk', 'color': '#10b981'},
                'very_low': {'count': 34, 'label': 'Very Low Risk', 'color': '#059669'}
            },
            'total': 280,
            'average_score': 42.5,
            'timestamp': datetime.datetime.utcnow().isoformat()
        }, 200

# Additional v2 endpoints can be added here...

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Main execution
if __name__ == '__main__':
    # Determine port and host based on environment
    if IS_GAE:
        # Google App Engine will set the port
        port = int(os.environ.get('PORT', 8080))
        host = '0.0.0.0'
        debug = False
    else:
        # Local development
        port = int(os.environ.get('PORT', 5001))
        host = '0.0.0.0'
        debug = ENVIRONMENT == 'development'
    
    print(f"🚀 Starting ToluAI server on http://{host}:{port}")
    print(f"📍 Environment: {ENVIRONMENT}")
    print(f"📚 API Documentation: http://localhost:{port}/api/docs")
    print(f"🔐 Demo credentials:")
    for email, user in demo_users.items():
        print(f"   {email} / {user['password']}")
    print("-" * 60)
    
    app.run(host=host, port=port, debug=debug)