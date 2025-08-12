#!/usr/bin/env python3
"""Simple Flask server for testing"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token
from flask_restx import Api, Resource, fields
import os
import sys
import datetime
from dotenv import load_dotenv

# Add backend to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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
CORS(app, origins=['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'])

# Initialize Swagger/OpenAPI documentation
api = Api(
    app,
    version='1.0.0',
    title='ToluAI Risk Assessment API',
    description='Insurance Risk Professional Assessment (IRPA) System API Documentation',
    doc='/api/docs',
    prefix='/api/v1',
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

# Define Swagger models
login_model = api.model('Login', {
    'email': fields.String(required=True, description='User email address'),
    'password': fields.String(required=True, description='User password')
})

auth_response_model = api.model('AuthResponse', {
    'access_token': fields.String(description='JWT access token'),
    'user': fields.Raw(description='User information object')
})

assessment_model = api.model('Assessment', {
    'id': fields.Integer(description='Assessment ID'),
    'company_name': fields.String(description='Company name'),
    'entity_name': fields.String(description='Entity name'),
    'risk_score': fields.Float(description='Risk score (0-100)'),
    'risk_category': fields.String(description='Risk category: low, medium, high, critical'),
    'assessment_date': fields.String(description='Assessment date'),
    'status': fields.String(description='Assessment status')
})

company_model = api.model('Company', {
    'id': fields.Integer(description='Company ID'),
    'name': fields.String(description='Company name'),
    'industry': fields.String(description='Industry type'),
    'revenue': fields.Float(description='Annual revenue'),
    'employees': fields.Integer(description='Number of employees'),
    'risk_profile': fields.String(description='Risk profile'),
    'active_assessments': fields.Integer(description='Number of active assessments')
})

entity_model = api.model('Entity', {
    'id': fields.Integer(description='Entity ID'),
    'name': fields.String(description='Entity name'),
    'company': fields.String(description='Company name'),
    'type': fields.String(description='Entity type'),
    'risk_score': fields.Float(description='Risk score'),
    'status': fields.String(description='Entity status'),
    'last_assessed': fields.String(description='Last assessment date')
})

# Mock authentication - no database needed for testing
demo_users = {
    'admin@toluai.com': {
        'password': 'Admin123!',
        'id': 1,
        'name': 'System Administrator',
        'roles': ['system_admin']
    },
    'company.admin@acme.com': {
        'password': 'CompanyAdmin123!',
        'id': 2,
        'name': 'John Smith',
        'roles': ['company_admin']
    },
    'risk.analyst@acme.com': {
        'password': 'Analyst123!',
        'id': 3,
        'name': 'Sarah Johnson',
        'roles': ['risk_analyst']
    }
}

# Authentication namespace
auth_ns = api.namespace('auth', description='Authentication operations')

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
        
        # Mock authentication using demo users
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
            }, 200
        
        return {'error': 'Invalid credentials'}, 401

@app.route('/api/v1/auth/me', methods=['GET'])
def get_current_user():
    # For now, return a mock user
    return jsonify({
        'user': {
            'id': 1,
            'email': 'admin@toluai.com',
            'name': 'System Administrator',
            'roles': ['system_admin']
        }
    }), 200

@app.route('/api/v1/auth/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/')
def index():
    return jsonify({'message': 'ToluAI Backend API is running'}), 200

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'service': 'ToluAI Backend'}), 200

# New IRPA CCI Scoring endpoint
@app.route('/api/v2/irpa/calculate-score', methods=['POST'])
def calculate_irpa_score():
    """Calculate IRPA CCI score using the new multiplicative engine"""
    from backend.services.scoring_functions import IRPAScoringFunctions, calculate_irpa_cci_score
    
    data = request.get_json()
    
    # Calculate scores using the new engine
    scoring = IRPAScoringFunctions()
    
    # Get individual risk scores
    industry_score = scoring.calculate_industry_risk_score(
        industry_type=data.get('industry_type', 'Technology'),
        operating_margin=data.get('operating_margin', 15),
        employee_count=data.get('employee_count', 5000),
        company_age=data.get('company_age', 10),
        pe_ratio=data.get('pe_ratio', 25)
    )
    
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
    
    # Calculate final IRPA score
    final_scores = scoring.calculate_final_irpa_score(industry_score, professional_score)
    
    # Get risk category details
    risk_categories = {
        'critical_high': {'label': 'Critical High Risk', 'color': '#7c2d12', 'range': '90-100'},
        'extremely_high': {'label': 'Extremely High Risk', 'color': '#991b1b', 'range': '80-89'},
        'very_high': {'label': 'Very High Risk', 'color': '#dc2626', 'range': '70-79'},
        'high': {'label': 'High Risk', 'color': '#ef4444', 'range': '50-69'},
        'moderate': {'label': 'Moderate Risk', 'color': '#f59e0b', 'range': '30-50'},
        'low': {'label': 'Low Risk', 'color': '#10b981', 'range': '20-30'},
        'very_low': {'label': 'Very Low Risk', 'color': '#059669', 'range': '1-20'}
    }
    
    category_info = risk_categories.get(final_scores['risk_category'], {})
    
    return jsonify({
        'irpa_cci_score': final_scores['irpa_cci_score'],
        'risk_category': final_scores['risk_category'],
        'risk_category_label': category_info.get('label', 'Unknown'),
        'risk_category_color': category_info.get('color', '#6b7280'),
        'risk_category_range': category_info.get('range', 'N/A'),
        'industry_component': final_scores['industry_component'],
        'professional_component': final_scores['professional_component'],
        'industry_weight': final_scores['industry_weight'],
        'professional_weight': final_scores['professional_weight'],
        'breakdown': {
            'industry': {
                'score': round(industry_score * 100, 2),
                'factors': {
                    'industry_type': scoring.industry_type_risk_score(data.get('industry_type', 'Technology')),
                    'operating_margin': scoring.operating_margin_risk_score(data.get('operating_margin', 15)),
                    'company_size': scoring.company_size_risk_score(data.get('employee_count', 5000)),
                    'company_age': scoring.company_age_risk_score(data.get('company_age', 10)),
                    'pe_ratio': scoring.pe_ratio_risk_score(data.get('pe_ratio', 25))
                }
            },
            'professional': {
                'score': round(professional_score * 100, 2),
                'factors': {
                    'education': scoring.education_risk_score(data.get('education_level', "Bachelor's Degree")),
                    'experience': scoring.years_experience_risk_score(data.get('years_experience', 8)),
                    'job_title': scoring.job_title_risk_score(data.get('job_title', 'Senior Analyst')),
                    'job_tenure': scoring.job_tenure_risk_score(data.get('job_tenure', 3)),
                    'practice_field': scoring.practice_field_risk_score(data.get('practice_field', 'Technology')),
                    'age': scoring.age_risk_score(data.get('age', 35)),
                    'state': scoring.state_risk_score(data.get('state', 'California')),
                    'fico': scoring.fico_risk_score(data.get('fico_score', 720))['score'],
                    'dti': scoring.dti_risk_score(data.get('dti_ratio', 28))['score'],
                    'payment_history': scoring.payment_history_risk_score(data.get('payment_history', 95))['score']
                }
            }
        },
        'methodology': 'multiplicative_v2',
        'timestamp': datetime.datetime.now().isoformat()
    }), 200

# Get risk category distribution
@app.route('/api/v2/irpa/risk-distribution', methods=['GET'])
def get_risk_distribution():
    """Get distribution of assessments across 7-tier risk categories"""
    return jsonify({
        'distribution': {
            'critical_high': {'count': 5, 'label': 'Critical High Risk', 'color': '#7c2d12', 'range': '90-100'},
            'extremely_high': {'count': 12, 'label': 'Extremely High Risk', 'color': '#991b1b', 'range': '80-89'},
            'very_high': {'count': 28, 'label': 'Very High Risk', 'color': '#dc2626', 'range': '70-79'},
            'high': {'count': 45, 'label': 'High Risk', 'color': '#ef4444', 'range': '50-69'},
            'moderate': {'count': 67, 'label': 'Moderate Risk', 'color': '#f59e0b', 'range': '30-50'},
            'low': {'count': 89, 'label': 'Low Risk', 'color': '#10b981', 'range': '20-30'},
            'very_low': {'count': 34, 'label': 'Very Low Risk', 'color': '#059669', 'range': '1-20'}
        },
        'total': 280,
        'average_score': 42.5,
        'timestamp': datetime.datetime.now().isoformat()
    }), 200

# Mock API endpoints for dashboard
@app.route('/api/v2/irpa/insured-entities', methods=['GET'])
def get_insured_entities():
    # Mock data for different types of entities
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    mock_entities = [
        {'id': 1, 'name': 'Acme Insurance Ltd', 'type': 'company', 'risk_score': 45, 'status': 'active'},
        {'id': 2, 'name': 'Global Tech Solutions', 'type': 'company', 'risk_score': 72, 'status': 'active'},
        {'id': 3, 'name': 'Healthcare Partners Inc', 'type': 'company', 'risk_score': 38, 'status': 'active'},
        {'id': 4, 'name': 'Retail Chain Corp', 'type': 'company', 'risk_score': 65, 'status': 'active'},
        {'id': 5, 'name': 'Financial Services Group', 'type': 'company', 'risk_score': 85, 'status': 'active'},
    ]
    
    return jsonify({
        'insured_entities': mock_entities[:per_page],
        'pagination': {
            'total': 150,
            'page': page,
            'per_page': per_page,
            'total_pages': 15
        }
    }), 200

@app.route('/api/v2/irpa/assessments', methods=['GET'])
def get_assessments():
    from backend.services.scoring_functions import IRPAScoringFunctions
    import datetime
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status', None)
    
    # Use the new scoring engine for mock data
    scoring = IRPAScoringFunctions()
    
    mock_assessments = [
        {
            'id': 1,
            'entity_id': 1,
            'entity_name': 'Acme Insurance Ltd',
            'risk_score': 45.5,
            'risk_category': 'moderate',  # Using new 7-tier category
            'assessment_date': (datetime.datetime.now() - datetime.timedelta(days=1)).isoformat(),
            'status': 'completed',
            'assessor_name': 'John Smith',
            'created_at': datetime.datetime.now().isoformat(),
            'updated_at': datetime.datetime.now().isoformat()
        },
        {
            'id': 2,
            'entity_id': 2,
            'entity_name': 'Global Tech Solutions',
            'risk_score': 72.3,
            'risk_category': 'high',
            'assessment_date': (datetime.datetime.now() - datetime.timedelta(days=2)).isoformat(),
            'status': 'completed',
            'assessor_name': 'Sarah Johnson',
            'created_at': datetime.datetime.now().isoformat(),
            'updated_at': datetime.datetime.now().isoformat()
        },
        {
            'id': 3,
            'entity_id': 3,
            'entity_name': 'Healthcare Partners Inc',
            'risk_score': 38.7,
            'risk_category': 'medium',
            'assessment_date': (datetime.datetime.now() - datetime.timedelta(days=3)).isoformat(),
            'status': 'completed',
            'assessor_name': 'Mike Wilson',
            'created_at': datetime.datetime.now().isoformat(),
            'updated_at': datetime.datetime.now().isoformat()
        },
        {
            'id': 4,
            'entity_id': 4,
            'entity_name': 'Retail Chain Corp',
            'risk_score': 65.2,
            'risk_category': 'high',
            'assessment_date': (datetime.datetime.now() - datetime.timedelta(days=4)).isoformat(),
            'status': 'completed',
            'assessor_name': 'Emily Davis',
            'created_at': datetime.datetime.now().isoformat(),
            'updated_at': datetime.datetime.now().isoformat()
        },
        {
            'id': 5,
            'entity_id': 5,
            'entity_name': 'Financial Services Group',
            'risk_score': 85.9,
            'risk_category': 'critical',
            'assessment_date': (datetime.datetime.now() - datetime.timedelta(days=5)).isoformat(),
            'status': 'completed',
            'assessor_name': 'Robert Chen',
            'created_at': datetime.datetime.now().isoformat(),
            'updated_at': datetime.datetime.now().isoformat()
        }
    ]
    
    if status == 'completed':
        filtered_assessments = [a for a in mock_assessments if a['status'] == 'completed']
    else:
        filtered_assessments = mock_assessments
    
    return jsonify({
        'assessments': filtered_assessments[:per_page],
        'pagination': {
            'total': 75,
            'page': page,
            'per_page': per_page,
            'total_pages': 8
        }
    }), 200

@app.route('/api/v2/irpa/companies', methods=['GET'])
def get_companies():
    return jsonify({
        'data': [
            {
                'id': 1,
                'name': 'Acme Insurance Corp',
                'status': 'active',
                'entities_count': 10
            }
        ],
        'total': 1,
        'page': 1,
        'per_page': 10
    }), 200

@app.route('/api/v2/irpa/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    return jsonify({
        'total_entities': 150,
        'active_assessments': 25,
        'high_risk_count': 12,
        'compliance_rate': 92.5
    }), 200

@app.route('/api/v2/irpa/analytics/risk-distribution', methods=['GET'])
def get_analytics_risk_distribution():
    return jsonify({
        'risk_distribution': {
            'low': 45,
            'medium': 35,
            'high': 15,
            'critical': 5,
            'total_assessments': 100
        }
    }), 200

@app.route('/api/v2/irpa/analytics/assessment-trends', methods=['GET'])
def get_assessment_trends():
    import datetime
    trends = []
    today = datetime.date.today()
    
    for i in range(30):
        date = today - datetime.timedelta(days=i)
        trends.append({
            'date': date.isoformat(),
            'count': 5 + (i % 3),
            'avg_score': 65 + (i % 20)
        })
    
    return jsonify({
        'trends': list(reversed(trends))
    }), 200

@app.route('/api/v2/irpa/analytics/zip-code-risk', methods=['GET'])
def get_zip_code_risk():
    # Mock zip code risk data for various US locations
    zip_code_data = [
        # New York Area
        {'zipCode': '10001', 'lat': 40.7505, 'lng': -73.9934, 'riskLevel': 'high', 'entityCount': 145, 'avgRiskScore': 72, 'state': 'NY', 'city': 'New York'},
        {'zipCode': '10016', 'lat': 40.7461, 'lng': -73.9776, 'riskLevel': 'medium', 'entityCount': 98, 'avgRiskScore': 58, 'state': 'NY', 'city': 'New York'},
        {'zipCode': '10019', 'lat': 40.7651, 'lng': -73.9851, 'riskLevel': 'critical', 'entityCount': 67, 'avgRiskScore': 89, 'state': 'NY', 'city': 'New York'},
        
        # Los Angeles Area
        {'zipCode': '90210', 'lat': 34.0901, 'lng': -118.4065, 'riskLevel': 'low', 'entityCount': 234, 'avgRiskScore': 34, 'state': 'CA', 'city': 'Beverly Hills'},
        {'zipCode': '90036', 'lat': 34.0739, 'lng': -118.3410, 'riskLevel': 'medium', 'entityCount': 156, 'avgRiskScore': 61, 'state': 'CA', 'city': 'Los Angeles'},
        {'zipCode': '90028', 'lat': 34.1016, 'lng': -118.3267, 'riskLevel': 'high', 'entityCount': 89, 'avgRiskScore': 78, 'state': 'CA', 'city': 'Hollywood'},
        
        # Chicago Area
        {'zipCode': '60601', 'lat': 41.8827, 'lng': -87.6233, 'riskLevel': 'medium', 'entityCount': 167, 'avgRiskScore': 55, 'state': 'IL', 'city': 'Chicago'},
        {'zipCode': '60614', 'lat': 41.9290, 'lng': -87.6439, 'riskLevel': 'low', 'entityCount': 203, 'avgRiskScore': 42, 'state': 'IL', 'city': 'Chicago'},
        {'zipCode': '60629', 'lat': 41.7764, 'lng': -87.7031, 'riskLevel': 'high', 'entityCount': 87, 'avgRiskScore': 76, 'state': 'IL', 'city': 'Chicago'},
        
        # Houston Area
        {'zipCode': '77002', 'lat': 29.7589, 'lng': -95.3677, 'riskLevel': 'medium', 'entityCount': 134, 'avgRiskScore': 59, 'state': 'TX', 'city': 'Houston'},
        {'zipCode': '77056', 'lat': 29.7596, 'lng': -95.4616, 'riskLevel': 'low', 'entityCount': 189, 'avgRiskScore': 38, 'state': 'TX', 'city': 'Houston'},
        {'zipCode': '77026', 'lat': 29.8044, 'lng': -95.3478, 'riskLevel': 'critical', 'entityCount': 45, 'avgRiskScore': 91, 'state': 'TX', 'city': 'Houston'},
        
        # Phoenix Area
        {'zipCode': '85001', 'lat': 33.4484, 'lng': -112.0740, 'riskLevel': 'high', 'entityCount': 112, 'avgRiskScore': 74, 'state': 'AZ', 'city': 'Phoenix'},
        {'zipCode': '85016', 'lat': 33.5079, 'lng': -112.0362, 'riskLevel': 'medium', 'entityCount': 178, 'avgRiskScore': 52, 'state': 'AZ', 'city': 'Phoenix'},
        
        # Philadelphia Area
        {'zipCode': '19102', 'lat': 39.9534, 'lng': -75.1639, 'riskLevel': 'medium', 'entityCount': 143, 'avgRiskScore': 56, 'state': 'PA', 'city': 'Philadelphia'},
        {'zipCode': '19147', 'lat': 39.9295, 'lng': -75.1580, 'riskLevel': 'high', 'entityCount': 93, 'avgRiskScore': 77, 'state': 'PA', 'city': 'Philadelphia'},
        
        # Additional major cities
        {'zipCode': '78205', 'lat': 29.4241, 'lng': -98.4936, 'riskLevel': 'low', 'entityCount': 201, 'avgRiskScore': 41, 'state': 'TX', 'city': 'San Antonio'},
        {'zipCode': '92101', 'lat': 32.7157, 'lng': -117.1611, 'riskLevel': 'low', 'entityCount': 167, 'avgRiskScore': 39, 'state': 'CA', 'city': 'San Diego'},
        {'zipCode': '75201', 'lat': 32.7767, 'lng': -96.7970, 'riskLevel': 'medium', 'entityCount': 145, 'avgRiskScore': 54, 'state': 'TX', 'city': 'Dallas'},
        {'zipCode': '95110', 'lat': 37.3382, 'lng': -121.8863, 'riskLevel': 'low', 'entityCount': 234, 'avgRiskScore': 36, 'state': 'CA', 'city': 'San Jose'},
        {'zipCode': '78701', 'lat': 30.2672, 'lng': -97.7431, 'riskLevel': 'low', 'entityCount': 189, 'avgRiskScore': 43, 'state': 'TX', 'city': 'Austin'},
        {'zipCode': '32202', 'lat': 30.3322, 'lng': -81.6557, 'riskLevel': 'medium', 'entityCount': 123, 'avgRiskScore': 61, 'state': 'FL', 'city': 'Jacksonville'},
        {'zipCode': '43215', 'lat': 39.9612, 'lng': -82.9988, 'riskLevel': 'low', 'entityCount': 178, 'avgRiskScore': 45, 'state': 'OH', 'city': 'Columbus'},
    ]
    
    return jsonify({
        'zip_code_data': zip_code_data,
        'total_count': len(zip_code_data)
    }), 200

if __name__ == '__main__':
    port = 5001
    print(f"Starting simple Flask server on http://localhost:{port}")
    print("\nDemo credentials:")
    for email, user in demo_users.items():
        print(f"  {email} / {user['password']}")
    print("\n")
    app.run(debug=True, port=port, host='0.0.0.0')