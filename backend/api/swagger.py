"""
Swagger/OpenAPI Documentation for ToluAI API
"""

from flask import Blueprint
from flask_restx import Api, Resource, fields, Namespace
from backend.models.irpa import IRPACompany, InsuredEntity, IRPARiskAssessment
from backend.services.irpa_engine import IRPAAssessmentEngine
from backend.app import db
import datetime

# Create blueprint for Swagger
swagger_bp = Blueprint('swagger', __name__, url_prefix='/api/v1')

# Initialize API with Swagger documentation
api = Api(
    swagger_bp,
    version='1.0.0',
    title='ToluAI Risk Assessment API',
    description='Insurance Risk Professional Assessment (IRPA) System API Documentation',
    doc='/docs',
    ordered=True,
    contact_email='admin@toluai.com',
    contact='ToluAI Support',
    license='Proprietary',
    license_url='https://toluai.com/license'
)

# Define namespaces for different API sections
companies_ns = Namespace('companies', description='Company operations')
entities_ns = Namespace('entities', description='Insured entity operations')
assessments_ns = Namespace('assessments', description='Risk assessment operations')
reference_ns = Namespace('reference', description='Reference data operations')
auth_ns = Namespace('auth', description='Authentication operations')

# Add namespaces to API
api.add_namespace(companies_ns, path='/companies')
api.add_namespace(entities_ns, path='/entities')
api.add_namespace(assessments_ns, path='/assessments')
api.add_namespace(reference_ns, path='/reference')
api.add_namespace(auth_ns, path='/auth')

# Define models for request/response documentation
company_model = api.model('Company', {
    'company_id': fields.String(description='Unique company identifier'),
    'company_name': fields.String(required=True, description='Company name'),
    'industry_type_id': fields.Integer(description='Industry type reference'),
    'state_id': fields.Integer(description='State reference'),
    'revenue': fields.Float(description='Annual revenue'),
    'operating_income': fields.Float(description='Operating income'),
    'employee_count': fields.Integer(description='Number of employees'),
    'founded_year': fields.Integer(description='Year company was founded'),
    'website': fields.String(description='Company website URL'),
    'created_at': fields.DateTime(description='Creation timestamp')
})

entity_model = api.model('InsuredEntity', {
    'insured_id': fields.String(description='Unique entity identifier'),
    'company_id': fields.String(required=True, description='Associated company ID'),
    'first_name': fields.String(required=True, description='First name'),
    'last_name': fields.String(required=True, description='Last name'),
    'email': fields.String(description='Email address'),
    'phone': fields.String(description='Phone number'),
    'date_of_birth': fields.Date(description='Date of birth'),
    'state_id': fields.Integer(description='State reference'),
    'education_level_id': fields.Integer(description='Education level reference'),
    'job_title_id': fields.Integer(description='Job title reference'),
    'years_experience': fields.Integer(description='Years of experience'),
    'job_tenure': fields.Float(description='Years in current position'),
    'fico_score': fields.Integer(description='FICO credit score'),
    'dti_ratio': fields.Float(description='Debt-to-income ratio'),
    'payment_history': fields.String(description='Payment history indicator')
})

assessment_model = api.model('RiskAssessment', {
    'assessment_id': fields.String(description='Unique assessment identifier'),
    'insured_id': fields.String(required=True, description='Insured entity ID'),
    'assessment_date': fields.DateTime(description='Assessment date'),
    'industry_risk_score': fields.Float(description='Industry risk component (0-100)'),
    'professional_risk_score': fields.Float(description='Professional risk component (0-100)'),
    'financial_risk_score': fields.Float(description='Financial risk component (0-100)'),
    'irpa_cci_score': fields.Float(description='Overall IRPA CCI score (0-100)'),
    'risk_category': fields.String(description='Risk category: low, medium, high, critical'),
    'status': fields.String(description='Assessment status'),
    'recommendations': fields.String(description='Risk mitigation recommendations')
})

login_model = api.model('Login', {
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password')
})

token_response = api.model('TokenResponse', {
    'access_token': fields.String(description='JWT access token'),
    'token_type': fields.String(description='Token type (Bearer)'),
    'expires_in': fields.Integer(description='Token expiry time in seconds'),
    'user': fields.Raw(description='User information')
})

# Company endpoints
@companies_ns.route('/')
class CompanyList(Resource):
    @companies_ns.doc('list_companies')
    @companies_ns.marshal_list_with(company_model)
    def get(self):
        """List all companies"""
        companies = IRPACompany.query.all()
        return [c.to_dict() for c in companies]
    
    @companies_ns.doc('create_company')
    @companies_ns.expect(company_model)
    @companies_ns.marshal_with(company_model, code=201)
    def post(self):
        """Create a new company"""
        data = api.payload
        company = IRPACompany(
            company_name=data['company_name'],
            industry_type_id=data.get('industry_type_id'),
            state_id=data.get('state_id'),
            revenue=data.get('revenue'),
            operating_income=data.get('operating_income'),
            employee_count=data.get('employee_count'),
            founded_year=data.get('founded_year'),
            website=data.get('website')
        )
        db.session.add(company)
        db.session.commit()
        return company.to_dict(), 201

@companies_ns.route('/<string:company_id>')
@companies_ns.param('company_id', 'The company identifier')
class Company(Resource):
    @companies_ns.doc('get_company')
    @companies_ns.marshal_with(company_model)
    def get(self, company_id):
        """Fetch a company by ID"""
        company = IRPACompany.query.get_or_404(company_id)
        return company.to_dict()
    
    @companies_ns.doc('update_company')
    @companies_ns.expect(company_model)
    @companies_ns.marshal_with(company_model)
    def put(self, company_id):
        """Update a company"""
        company = IRPACompany.query.get_or_404(company_id)
        data = api.payload
        for key, value in data.items():
            if hasattr(company, key):
                setattr(company, key, value)
        db.session.commit()
        return company.to_dict()

# Entity endpoints
@entities_ns.route('/')
class EntityList(Resource):
    @entities_ns.doc('list_entities')
    @entities_ns.marshal_list_with(entity_model)
    def get(self):
        """List all insured entities"""
        entities = InsuredEntity.query.all()
        return [e.to_dict() for e in entities]
    
    @entities_ns.doc('create_entity')
    @entities_ns.expect(entity_model)
    @entities_ns.marshal_with(entity_model, code=201)
    def post(self):
        """Create a new insured entity"""
        data = api.payload
        entity = InsuredEntity(**data)
        db.session.add(entity)
        db.session.commit()
        return entity.to_dict(), 201

# Assessment endpoints
@assessments_ns.route('/')
class AssessmentList(Resource):
    @assessments_ns.doc('list_assessments')
    @assessments_ns.marshal_list_with(assessment_model)
    def get(self):
        """List all risk assessments"""
        assessments = IRPARiskAssessment.query.all()
        return [a.to_dict() for a in assessments]

@assessments_ns.route('/run')
class RunAssessment(Resource):
    @assessments_ns.doc('run_assessment')
    @assessments_ns.expect(api.model('RunAssessment', {
        'insured_id': fields.String(required=True, description='ID of insured entity to assess'),
        'user_id': fields.String(required=True, description='ID of user running assessment')
    }))
    @assessments_ns.marshal_with(assessment_model, code=201)
    def post(self):
        """Run a new risk assessment"""
        data = api.payload
        engine = IRPAAssessmentEngine()
        assessment = engine.run_assessment(
            insured_id=data['insured_id'],
            user_id=data['user_id']
        )
        return assessment.to_dict(), 201

# Authentication endpoints
@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.doc('user_login')
    @auth_ns.expect(login_model)
    @auth_ns.marshal_with(token_response)
    def post(self):
        """Authenticate user and receive JWT token"""
        data = api.payload
        # This is a mock response for documentation
        return {
            'access_token': 'eyJ0eXAiOiJKV1QiLCJhbGc...',
            'token_type': 'Bearer',
            'expires_in': 3600,
            'user': {
                'id': 'user_123',
                'email': data['email'],
                'role': 'admin'
            }
        }

# Reference data endpoints
@reference_ns.route('/industries')
class IndustryList(Resource):
    @reference_ns.doc('list_industries')
    def get(self):
        """List all industry types"""
        from backend.models.irpa import IndustryType
        industries = IndustryType.query.all()
        return [i.to_dict() for i in industries]

@reference_ns.route('/states')
class StateList(Resource):
    @reference_ns.doc('list_states')
    def get(self):
        """List all states"""
        from backend.models.irpa import State
        states = State.query.all()
        return [s.to_dict() for s in states]

@reference_ns.route('/education-levels')
class EducationLevelList(Resource):
    @reference_ns.doc('list_education_levels')
    def get(self):
        """List all education levels"""
        from backend.models.irpa import EducationLevel
        levels = EducationLevel.query.all()
        return [l.to_dict() for l in levels]

@reference_ns.route('/job-titles')
class JobTitleList(Resource):
    @reference_ns.doc('list_job_titles')
    def get(self):
        """List all job titles"""
        from backend.models.irpa import JobTitle
        titles = JobTitle.query.all()
        return [t.to_dict() for t in titles]

# Risk scoring information endpoint
@assessments_ns.route('/scoring-info')
class ScoringInfo(Resource):
    @assessments_ns.doc('get_scoring_info')
    def get(self):
        """Get risk scoring methodology information"""
        return {
            'scoring_methodology': {
                'components': {
                    'industry': {
                        'weight': 0.35,
                        'factors': [
                            'operating_margin', 'company_size', 
                            'company_age', 'pe_ratio'
                        ]
                    },
                    'professional': {
                        'weight': 0.40,
                        'factors': [
                            'education', 'experience', 'job_title',
                            'job_tenure', 'practice_field', 'age', 'state'
                        ]
                    },
                    'financial': {
                        'weight': 0.25,
                        'factors': ['fico_score', 'dti_ratio', 'payment_history']
                    }
                },
                'risk_categories': {
                    'critical': '90-100',
                    'high': '70-89',
                    'medium': '40-69',
                    'low': '0-39'
                },
                'external_adjustments': {
                    'cybersecurity': 0.15,
                    'regulatory': 0.10,
                    'market_volatility': 0.05
                }
            }
        }