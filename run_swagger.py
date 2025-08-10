#!/usr/bin/env python3
"""Flask server with Swagger documentation"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token
from flask_restx import Api, Resource, fields, Namespace
import os
import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///toluai.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app, origins=['http://localhost:5173', 'http://localhost:5174'])

# Initialize Swagger/OpenAPI documentation
api = Api(
    app,
    version='1.0.0',
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

# Define namespaces
auth_ns = api.namespace('api/v1/auth', description='Authentication operations')
companies_ns = api.namespace('api/v2/irpa/companies', description='Company operations')
entities_ns = api.namespace('api/v2/irpa/insured-entities', description='Insured entity operations')
assessments_ns = api.namespace('api/v2/irpa/assessments', description='Risk assessment operations')
reference_ns = api.namespace('api/v2/irpa/reference', description='Reference data operations')

# Define Swagger models
login_model = api.model('Login', {
    'email': fields.String(required=True, description='User email address', example='admin@toluai.com'),
    'password': fields.String(required=True, description='User password', example='Admin123!')
})

auth_response_model = api.model('AuthResponse', {
    'access_token': fields.String(description='JWT access token'),
    'user': fields.Raw(description='User information object')
})

company_model = api.model('Company', {
    'id': fields.Integer(description='Company ID'),
    'name': fields.String(description='Company name'),
    'industry': fields.String(description='Industry type'),
    'revenue': fields.Float(description='Annual revenue'),
    'operating_income': fields.Float(description='Operating income'),
    'operating_margin': fields.Float(description='Operating margin percentage'),
    'employees': fields.Integer(description='Number of employees'),
    'founded_year': fields.Integer(description='Year founded'),
    'risk_profile': fields.String(description='Risk profile category'),
    'active_assessments': fields.Integer(description='Number of active assessments')
})

entity_model = api.model('InsuredEntity', {
    'id': fields.Integer(description='Entity ID'),
    'name': fields.String(description='Entity full name'),
    'company': fields.String(description='Associated company name'),
    'email': fields.String(description='Email address'),
    'phone': fields.String(description='Phone number'),
    'date_of_birth': fields.String(description='Date of birth'),
    'education_level': fields.String(description='Education level'),
    'job_title': fields.String(description='Current job title'),
    'years_experience': fields.Integer(description='Years of professional experience'),
    'job_tenure': fields.Float(description='Years in current position'),
    'fico_score': fields.Integer(description='FICO credit score (300-850)'),
    'dti_ratio': fields.Float(description='Debt-to-income ratio'),
    'payment_history': fields.String(description='Payment history status'),
    'risk_score': fields.Float(description='Current risk score'),
    'status': fields.String(description='Entity status'),
    'last_assessed': fields.String(description='Last assessment date')
})

assessment_model = api.model('Assessment', {
    'id': fields.Integer(description='Assessment ID'),
    'company_name': fields.String(description='Company name'),
    'entity_name': fields.String(description='Entity name'),
    'assessment_date': fields.String(description='Assessment date'),
    'industry_risk_score': fields.Float(description='Industry risk component (0-100)'),
    'professional_risk_score': fields.Float(description='Professional risk component (0-100)'),
    'financial_risk_score': fields.Float(description='Financial risk component (0-100)'),
    'irpa_cci_score': fields.Float(description='Overall IRPA CCI score (0-100)'),
    'risk_category': fields.String(description='Risk category: low, medium, high, critical'),
    'confidence_level': fields.Float(description='Confidence level of assessment (0-100)'),
    'status': fields.String(description='Assessment status'),
    'recommendations': fields.List(fields.String, description='Risk mitigation recommendations')
})

risk_methodology_model = api.model('RiskMethodology', {
    'components': fields.Raw(description='Risk component weights and factors'),
    'risk_categories': fields.Raw(description='Risk category thresholds'),
    'external_adjustments': fields.Raw(description='External risk adjustment factors')
})

# Mock authentication data
demo_users = {
    'admin@toluai.com': {
        'password': 'Admin123!',
        'id': 1,
        'name': 'System Administrator',
        'roles': ['system_admin']
    },
    'analyst@toluai.com': {
        'password': 'Analyst123!',
        'id': 2,
        'name': 'Risk Analyst',
        'roles': ['risk_analyst']
    }
}

# Authentication endpoints
@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.expect(login_model)
    @auth_ns.marshal_with(auth_response_model)
    @auth_ns.doc('user_login', 
                 responses={
                     200: 'Login successful',
                     400: 'Invalid request',
                     401: 'Authentication failed'
                 })
    def post(self):
        """Authenticate user and receive JWT token"""
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            api.abort(400, 'Email and password required')
        
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
                    'roles': user_data['roles']
                }
            }
        
        api.abort(401, 'Invalid credentials')

# Company endpoints
@companies_ns.route('/')
class CompanyList(Resource):
    @companies_ns.doc('list_companies')
    @companies_ns.marshal_list_with(company_model)
    def get(self):
        """List all companies"""
        mock_companies = [
            {
                'id': 1,
                'name': 'Acme Insurance Ltd',
                'industry': 'Insurance',
                'revenue': 5000000,
                'operating_income': 1000000,
                'operating_margin': 20.0,
                'employees': 500,
                'founded_year': 1995,
                'risk_profile': 'medium',
                'active_assessments': 15
            },
            {
                'id': 2,
                'name': 'Global Tech Solutions',
                'industry': 'Technology',
                'revenue': 10000000,
                'operating_income': 2500000,
                'operating_margin': 25.0,
                'employees': 1000,
                'founded_year': 2010,
                'risk_profile': 'high',
                'active_assessments': 23
            }
        ]
        return mock_companies

    @companies_ns.expect(company_model)
    @companies_ns.marshal_with(company_model, code=201)
    @companies_ns.doc('create_company')
    def post(self):
        """Create a new company"""
        data = request.get_json()
        # Mock creation
        return {**data, 'id': 3}, 201

# Entity endpoints
@entities_ns.route('/')
class EntityList(Resource):
    @entities_ns.doc('list_entities')
    @entities_ns.marshal_list_with(entity_model)
    def get(self):
        """List all insured entities"""
        mock_entities = [
            {
                'id': 1,
                'name': 'John Smith',
                'company': 'Acme Insurance Ltd',
                'email': 'john.smith@acme.com',
                'phone': '+1-555-0100',
                'date_of_birth': '1980-05-15',
                'education_level': 'Bachelor\'s Degree',
                'job_title': 'Risk Manager',
                'years_experience': 15,
                'job_tenure': 5.5,
                'fico_score': 750,
                'dti_ratio': 28.5,
                'payment_history': 'Excellent',
                'risk_score': 45.2,
                'status': 'active',
                'last_assessed': '2024-01-15'
            }
        ]
        return mock_entities

# Assessment endpoints
@assessments_ns.route('/')
class AssessmentList(Resource):
    @assessments_ns.doc('list_assessments')
    @assessments_ns.marshal_list_with(assessment_model)
    def get(self):
        """List all risk assessments"""
        mock_assessments = [
            {
                'id': 1,
                'company_name': 'Acme Insurance Ltd',
                'entity_name': 'John Smith',
                'assessment_date': datetime.datetime.now().isoformat(),
                'industry_risk_score': 65.5,
                'professional_risk_score': 72.3,
                'financial_risk_score': 58.9,
                'irpa_cci_score': 65.2,
                'risk_category': 'medium',
                'confidence_level': 85.0,
                'status': 'completed',
                'recommendations': [
                    'Monitor debt-to-income ratio',
                    'Review insurance coverage limits',
                    'Implement cybersecurity training'
                ]
            }
        ]
        return mock_assessments

@assessments_ns.route('/run')
class RunAssessment(Resource):
    @assessments_ns.doc('run_assessment')
    @assessments_ns.expect(api.model('RunAssessment', {
        'entity_id': fields.Integer(required=True, description='ID of entity to assess'),
        'assessment_type': fields.String(description='Type of assessment to run')
    }))
    @assessments_ns.marshal_with(assessment_model, code=201)
    def post(self):
        """Run a new risk assessment"""
        data = request.get_json()
        # Mock assessment run
        return {
            'id': 2,
            'entity_name': 'Test Entity',
            'company_name': 'Test Company',
            'assessment_date': datetime.datetime.now().isoformat(),
            'industry_risk_score': 70.0,
            'professional_risk_score': 65.0,
            'financial_risk_score': 60.0,
            'irpa_cci_score': 65.0,
            'risk_category': 'medium',
            'confidence_level': 90.0,
            'status': 'completed',
            'recommendations': ['Review risk factors']
        }, 201

# Risk methodology endpoint
@assessments_ns.route('/methodology')
class RiskMethodology(Resource):
    @assessments_ns.doc('get_methodology')
    @assessments_ns.marshal_with(risk_methodology_model)
    def get(self):
        """Get risk scoring methodology information"""
        return {
            'components': {
                'industry': {
                    'weight': 0.35,
                    'factors': {
                        'operating_margin': 0.30,
                        'company_size': 0.25,
                        'company_age': 0.20,
                        'pe_ratio': 0.25
                    }
                },
                'professional': {
                    'weight': 0.40,
                    'factors': {
                        'education': 0.20,
                        'experience': 0.25,
                        'job_title': 0.20,
                        'job_tenure': 0.15,
                        'practice_field': 0.10,
                        'age': 0.05,
                        'state': 0.05
                    }
                },
                'financial': {
                    'weight': 0.25,
                    'factors': {
                        'fico_score': 0.50,
                        'dti_ratio': 0.30,
                        'payment_history': 0.20
                    }
                }
            },
            'risk_categories': {
                'critical': {'min': 90, 'max': 100, 'label': 'Critical high risk'},
                'extremely_high': {'min': 80, 'max': 89, 'label': 'Extremely high risk'},
                'very_high': {'min': 70, 'max': 79, 'label': 'Very high risk'},
                'high': {'min': 50, 'max': 69, 'label': 'High risk'},
                'moderate': {'min': 30, 'max': 50, 'label': 'Moderate risk'},
                'low': {'min': 20, 'max': 30, 'label': 'Low risk'},
                'very_low': {'min': 1, 'max': 20, 'label': 'Very low risk'}
            },
            'external_adjustments': {
                'cybersecurity_incidents': 0.15,
                'regulatory_compliance': 0.10,
                'market_volatility': 0.05
            }
        }

# Reference data endpoints
@reference_ns.route('/industries')
class IndustryList(Resource):
    @reference_ns.doc('list_industries')
    def get(self):
        """List all industry types"""
        return [
            {'id': 1, 'name': 'Healthcare', 'risk_factor': 3.5},
            {'id': 2, 'name': 'Technology', 'risk_factor': 4.2},
            {'id': 3, 'name': 'Finance', 'risk_factor': 4.8},
            {'id': 4, 'name': 'Retail', 'risk_factor': 3.0},
            {'id': 5, 'name': 'Manufacturing', 'risk_factor': 3.8}
        ]

@reference_ns.route('/states')
class StateList(Resource):
    @reference_ns.doc('list_states')
    def get(self):
        """List all US states with risk factors"""
        return [
            {'id': 1, 'code': 'CA', 'name': 'California', 'risk_factor': 4.5},
            {'id': 2, 'code': 'TX', 'name': 'Texas', 'risk_factor': 3.8},
            {'id': 3, 'code': 'NY', 'name': 'New York', 'risk_factor': 4.2},
            {'id': 4, 'code': 'FL', 'name': 'Florida', 'risk_factor': 4.0},
            {'id': 5, 'code': 'OH', 'name': 'Ohio', 'risk_factor': 3.2}
        ]

# Health check endpoint
@api.route('/health')
class HealthCheck(Resource):
    def get(self):
        """Health check endpoint"""
        return {'status': 'healthy', 'service': 'ToluAI API with Swagger'}

if __name__ == '__main__':
    port = 5002
    print(f"Starting Flask server with Swagger documentation")
    print(f"API Documentation available at: http://localhost:{port}/api/docs")
    print("\nDemo credentials:")
    print("  admin@toluai.com / Admin123!")
    print("  analyst@toluai.com / Analyst123!")
    print("\n")
    app.run(debug=True, port=port, host='0.0.0.0')