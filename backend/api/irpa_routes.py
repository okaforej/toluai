"""
IRPA (Insurance Risk Professional Assessment) API Routes
Comprehensive API endpoints for the IRPA system
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import desc, and_, or_, func
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
import uuid

from backend.app import db
from backend.models.irpa import (
    IRPACompany, IRPAUser, InsuredEntity, IRPARiskAssessment, 
    IndustryType, State, EducationLevel, JobTitle, PracticeField, IRPARole
)
from backend.models.external_risk import (
    CybersecurityIncident, RegulatoryCompliance, MarketIndicator,
    IncidentType, RegulationType, IndicatorType
)
from backend.models.access_control import (
    Permission, RolePermission, UserActivityLog, DataAccessLog, SecurityEvent
)
from backend.services.irpa_engine import IRPAAssessmentEngine, IRPADataValidator

# Create IRPA blueprint
irpa_bp = Blueprint('irpa', __name__, url_prefix='/api/v2/irpa')


# Helper functions
def get_current_user():
    """Get current authenticated user from JWT"""
    from backend.models.user import User
    
    user_id = get_jwt_identity()
    if user_id:
        # Convert string ID to integer for User model lookup
        try:
            user_id_int = int(user_id)
        except (ValueError, TypeError):
            return None
        
        # Get the auth user (we'll use this for permissions for now)
        auth_user = User.query.get(user_id_int)
        return auth_user
    
    return None


def log_data_access(data_type, entity_id, access_type):
    """Log data access for audit purposes"""
    user = get_current_user()
    if user:
        DataAccessLog.log_data_access(
            user_id=user.user_id,
            data_type=data_type,
            entity_id=entity_id,
            access_type=access_type,
            ip_address=request.remote_addr
        )


def require_permission(permission_name):
    """Decorator to require specific permission"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Get user roles
            user_roles = [role.name for role in user.roles] if hasattr(user, 'roles') and user.roles else []
            
            # Allow admin and system_admin roles full access
            if 'admin' in user_roles or 'system_admin' in user_roles:
                return f(*args, **kwargs)
            
            # Company admins and other roles have limited access
            if 'company_admin' in user_roles:
                # Company admins can read and create for their company
                if permission_name.endswith('.read') or permission_name.endswith('.create'):
                    return f(*args, **kwargs)
            
            # For other roles, allow basic read permissions
            if permission_name.endswith('.read'):
                return f(*args, **kwargs)
            
            return jsonify({'error': 'Insufficient permissions'}), 403
            
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

def get_user_company_filter(user):
    """Get company filter for the current user"""
    if not user:
        return None
    
    user_roles = [role.name for role in user.roles] if hasattr(user, 'roles') and user.roles else []
    
    # System admins see all data
    if 'admin' in user_roles or 'system_admin' in user_roles:
        return None
    
    # Other users see only their company's data
    if hasattr(user, 'company') and user.company:
        return user.company
    
    return None


# Company Management Routes
@irpa_bp.route('/companies', methods=['GET'])
@jwt_required()
@require_permission('company.read')
def list_companies():
    """List companies with filtering and pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    
    # Filters
    industry_id = request.args.get('industry_type_id', type=int)
    state_id = request.args.get('state_id', type=int)
    search = request.args.get('search', '').strip()
    
    # Build query
    query = IRPACompany.query
    
    if industry_id:
        query = query.filter(IRPACompany.industry_type_id == industry_id)
    
    if state_id:
        query = query.filter(IRPACompany.state_id == state_id)
    
    if search:
        query = query.filter(
            or_(
                IRPACompany.company_name.ilike(f'%{search}%'),
                IRPACompany.city.ilike(f'%{search}%')
            )
        )
    
    # Execute query with pagination
    pagination = query.order_by(IRPACompany.company_name).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    companies = [company.to_dict() for company in pagination.items]
    
    return jsonify({
        'companies': companies,
        'pagination': {
            'page': page,
            'pages': pagination.pages,
            'per_page': per_page,
            'total': pagination.total,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })


@irpa_bp.route('/companies', methods=['POST'])
@jwt_required()
@require_permission('company.create')
def create_company():
    """Create a new company"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Validate required fields
    required_fields = ['company_name', 'registration_date']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        # Create company
        company = IRPACompany(
            company_name=data['company_name'],
            industry_type_id=data.get('industry_type_id'),
            operating_margin=data.get('operating_margin'),
            company_size=data.get('company_size'),
            company_age=data.get('company_age'),
            pe_ratio=data.get('pe_ratio'),
            state_id=data.get('state_id'),
            registration_date=datetime.strptime(data['registration_date'], '%Y-%m-%d').date(),
            legal_structure=data.get('legal_structure'),
            address_line1=data.get('address_line1'),
            address_line2=data.get('address_line2'),
            city=data.get('city'),
            zip_code=data.get('zip_code')
        )
        
        db.session.add(company)
        db.session.commit()
        
        # Log activity
        user = get_current_user()
        if user:
            UserActivityLog.log_activity(
                user_id=user.user_id,
                activity_type=UserActivityLog.ACTIVITY_CREATE,
                entity_type='COMPANY',
                entity_id=company.company_id,
                action_details={'company_name': company.company_name}
            )
        
        return jsonify({
            'message': 'Company created successfully',
            'company': company.to_dict()
        }), 201
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Company name already exists'}), 409
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@irpa_bp.route('/companies/<uuid:company_id>', methods=['GET'])
@jwt_required()
@require_permission('company.read')
def get_company(company_id):
    """Get company details"""
    company = IRPACompany.query.get_or_404(company_id)
    
    log_data_access(
        data_type=DataAccessLog.DATA_COMPANY,
        entity_id=company_id,
        access_type=DataAccessLog.ACCESS_READ
    )
    
    return jsonify(company.to_dict())


@irpa_bp.route('/companies/<uuid:company_id>', methods=['PUT'])
@jwt_required()
@require_permission('company.update')
def update_company(company_id):
    """Update company details"""
    company = IRPACompany.query.get_or_404(company_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        # Update fields
        updatable_fields = [
            'company_name', 'industry_type_id', 'operating_margin', 'company_size',
            'company_age', 'pe_ratio', 'state_id', 'legal_structure', 'address_line1',
            'address_line2', 'city', 'zip_code'
        ]
        
        for field in updatable_fields:
            if field in data:
                setattr(company, field, data[field])
        
        if 'registration_date' in data:
            company.registration_date = datetime.strptime(data['registration_date'], '%Y-%m-%d').date()
        
        company.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log activity
        user = get_current_user()
        if user:
            UserActivityLog.log_activity(
                user_id=user.user_id,
                activity_type=UserActivityLog.ACTIVITY_UPDATE,
                entity_type='COMPANY',
                entity_id=company_id,
                action_details=data
            )
        
        return jsonify({
            'message': 'Company updated successfully',
            'company': company.to_dict()
        })
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Company name already exists'}), 409
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


# Insured Entity Management Routes
@irpa_bp.route('/insured-entities', methods=['GET'])
@jwt_required()
@require_permission('insured_entity.read')
def list_insured_entities():
    """List insured entities with filtering and pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    
    # Get current user for company filtering
    user = get_current_user()
    company_filter = get_user_company_filter(user)
    
    # Filters
    company_id = request.args.get('company_id')
    entity_type = request.args.get('entity_type')
    search = request.args.get('search', '').strip()
    
    # Build query
    query = InsuredEntity.query
    
    # Apply company filtering for non-admin users
    if company_filter:
        # For company-scoped users, find companies matching their company name
        from backend.models.irpa import IRPACompany
        user_companies = IRPACompany.query.filter_by(company_name=company_filter).all()
        if user_companies:
            company_ids = [c.company_id for c in user_companies]
            query = query.filter(InsuredEntity.company_id.in_(company_ids))
        else:
            # No matching company found, return empty result
            query = query.filter(False)
    
    if company_id:
        query = query.filter(InsuredEntity.company_id == company_id)
    
    if entity_type:
        query = query.filter(InsuredEntity.entity_type == entity_type)
    
    if search:
        query = query.filter(InsuredEntity.name.ilike(f'%{search}%'))
    
    # Execute query with pagination
    pagination = query.order_by(InsuredEntity.name).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    entities = [entity.to_dict() for entity in pagination.items]
    
    return jsonify({
        'insured_entities': entities,
        'pagination': {
            'page': page,
            'pages': pagination.pages,
            'per_page': per_page,
            'total': pagination.total,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })


@irpa_bp.route('/insured-entities', methods=['POST'])
@jwt_required()
@require_permission('insured_entity.create')
def create_insured_entity():
    """Create a new insured entity"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Validate required fields
    required_fields = ['company_id', 'name', 'entity_type']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        # Create insured entity
        entity = InsuredEntity(
            company_id=data['company_id'],
            name=data['name'],
            entity_type=data['entity_type'],
            education_level_id=data.get('education_level_id'),
            years_experience=data.get('years_experience'),
            job_title_id=data.get('job_title_id'),
            job_tenure=data.get('job_tenure'),
            practice_field_id=data.get('practice_field_id'),
            date_of_birth=datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date() if data.get('date_of_birth') else None,
            state_id=data.get('state_id'),
            fico_score=data.get('fico_score'),
            dti_ratio=data.get('dti_ratio'),
            payment_history=data.get('payment_history')
        )
        
        db.session.add(entity)
        db.session.commit()
        
        # Log activity
        user = get_current_user()
        if user:
            UserActivityLog.log_activity(
                user_id=user.user_id,
                activity_type=UserActivityLog.ACTIVITY_CREATE,
                entity_type='INSURED_ENTITY',
                entity_id=entity.insured_id,
                action_details={'name': entity.name, 'entity_type': entity.entity_type}
            )
        
        return jsonify({
            'message': 'Insured entity created successfully',
            'insured_entity': entity.to_dict()
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@irpa_bp.route('/insured-entities/<uuid:insured_id>', methods=['GET'])
@jwt_required()
@require_permission('insured_entity.read')
def get_insured_entity(insured_id):
    """Get insured entity details"""
    entity = InsuredEntity.query.get_or_404(insured_id)
    
    log_data_access(
        data_type=DataAccessLog.DATA_INSURED_ENTITY,
        entity_id=insured_id,
        access_type=DataAccessLog.ACCESS_READ
    )
    
    # Include data completeness score
    entity_dict = entity.to_dict()
    entity_dict['data_completeness_score'] = IRPADataValidator.calculate_data_completeness_score(entity)
    
    # Include validation results
    validation_results = IRPADataValidator.validate_insured_entity(entity)
    entity_dict['validation'] = validation_results
    
    return jsonify(entity_dict)


# Risk Assessment Routes
@irpa_bp.route('/assessments', methods=['GET'])
@jwt_required()
@require_permission('assessment.read')
def list_assessments():
    """List risk assessments with filtering and pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    
    # Filters
    insured_id = request.args.get('insured_id')
    status = request.args.get('status')
    risk_category = request.args.get('risk_category')
    
    # Build query
    query = IRPARiskAssessment.query
    
    if insured_id:
        query = query.filter(IRPARiskAssessment.insured_id == insured_id)
    
    if status:
        query = query.filter(IRPARiskAssessment.status == status)
    
    # Execute query with pagination
    pagination = query.order_by(desc(IRPARiskAssessment.assessment_date)).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    assessments = []
    for assessment in pagination.items:
        assessment_dict = assessment.to_dict()
        # Filter by risk category if specified
        if not risk_category or assessment.risk_category == risk_category:
            assessments.append(assessment_dict)
    
    return jsonify({
        'assessments': assessments,
        'pagination': {
            'page': page,
            'pages': pagination.pages,
            'per_page': per_page,
            'total': pagination.total,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })


@irpa_bp.route('/assessments', methods=['POST'])
@jwt_required()
@require_permission('assessment.create')
def run_assessment():
    """Run a new risk assessment"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    if 'insured_id' not in data:
        return jsonify({'error': 'Missing required field: insured_id'}), 400
    
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        # Initialize assessment engine
        engine = IRPAAssessmentEngine()
        
        # Run the assessment
        assessment = engine.run_assessment(
            insured_id=data['insured_id'],
            user_id=str(user.user_id)
        )
        
        # Get recommendations
        recommendations = engine.get_risk_recommendations(assessment)
        
        response_data = assessment.to_dict()
        response_data['recommendations'] = recommendations
        
        return jsonify({
            'message': 'Assessment completed successfully',
            'assessment': response_data
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f'Assessment failed: {str(e)}')
        return jsonify({'error': 'Assessment failed due to internal error'}), 500


@irpa_bp.route('/assessments/<uuid:assessment_id>', methods=['GET'])
@jwt_required()
@require_permission('assessment.read')
def get_assessment(assessment_id):
    """Get assessment details with recommendations"""
    assessment = IRPARiskAssessment.query.get_or_404(assessment_id)
    
    log_data_access(
        data_type=DataAccessLog.DATA_RISK_ASSESSMENT,
        entity_id=assessment_id,
        access_type=DataAccessLog.ACCESS_READ
    )
    
    # Get recommendations
    engine = IRPAAssessmentEngine()
    recommendations = engine.get_risk_recommendations(assessment)
    
    response_data = assessment.to_dict()
    response_data['recommendations'] = recommendations
    
    return jsonify(response_data)


# Reference Data Routes - Industry Types
@irpa_bp.route('/reference/industry-types', methods=['GET'])
@jwt_required()
def list_industry_types():
    """List all industry types"""
    industry_types = IndustryType.query.order_by(IndustryType.industry_name).all()
    return jsonify({
        'industry_types': [industry.to_dict() for industry in industry_types]
    })


@irpa_bp.route('/reference/industry-types', methods=['POST'])
@jwt_required()
def create_industry_type():
    """Create a new industry type"""
    data = request.get_json()
    
    current_app.logger.info(f'Industry type create request data: {data}')
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['industry_name', 'risk_category', 'base_risk_factor']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        industry_type = IndustryType(
            industry_name=data['industry_name'],
            risk_category=data['risk_category'],
            base_risk_factor=data['base_risk_factor']
        )
        
        db.session.add(industry_type)
        db.session.commit()
        
        return jsonify({
            'message': 'Industry type created successfully',
            'industry_type': industry_type.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@irpa_bp.route('/reference/industry-types/<int:industry_type_id>', methods=['PUT'])
@jwt_required()
def update_industry_type(industry_type_id):
    """Update industry type"""
    industry_type = IndustryType.query.get_or_404(industry_type_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        if 'industry_name' in data:
            industry_type.industry_name = data['industry_name']
        if 'risk_category' in data:
            industry_type.risk_category = data['risk_category']
        if 'base_risk_factor' in data:
            industry_type.base_risk_factor = data['base_risk_factor']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Industry type updated successfully',
            'industry_type': industry_type.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@irpa_bp.route('/reference/industry-types/<int:industry_type_id>', methods=['DELETE'])
@jwt_required()
def delete_industry_type(industry_type_id):
    """Delete industry type"""
    industry_type = IndustryType.query.get_or_404(industry_type_id)
    
    try:
        db.session.delete(industry_type)
        db.session.commit()
        
        return jsonify({'message': 'Industry type deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@irpa_bp.route('/reference/industry-types/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete_industry_types():
    """Bulk delete industry types"""
    data = request.get_json()
    
    if not data or 'ids' not in data:
        return jsonify({'error': 'Missing ids array'}), 400
    
    try:
        deleted_count = IndustryType.query.filter(IndustryType.industry_type_id.in_(data['ids'])).delete(synchronize_session=False)
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully deleted {deleted_count} industry types',
            'deleted_count': deleted_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Reference Data Routes - States
@irpa_bp.route('/reference/states', methods=['GET'])
@jwt_required()
def list_states():
    """List all states"""
    states = State.query.order_by(State.state_name).all()
    return jsonify({
        'states': [state.to_dict() for state in states]
    })


@irpa_bp.route('/reference/states', methods=['POST'])
@jwt_required()
def create_state():
    """Create a new state"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['state_code', 'state_name', 'risk_factor']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        state = State(
            state_code=data['state_code'],
            state_name=data['state_name'],
            risk_factor=data['risk_factor']
        )
        
        db.session.add(state)
        db.session.commit()
        
        return jsonify({
            'message': 'State created successfully',
            'state': state.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@irpa_bp.route('/reference/states/<int:state_id>', methods=['PUT'])
@jwt_required()
def update_state(state_id):
    """Update state"""
    state = State.query.get_or_404(state_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        if 'state_code' in data:
            state.state_code = data['state_code']
        if 'state_name' in data:
            state.state_name = data['state_name']
        if 'risk_factor' in data:
            state.risk_factor = data['risk_factor']
        
        db.session.commit()
        
        return jsonify({
            'message': 'State updated successfully',
            'state': state.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@irpa_bp.route('/reference/states/<int:state_id>', methods=['DELETE'])
@jwt_required()
def delete_state(state_id):
    """Delete state"""
    state = State.query.get_or_404(state_id)
    
    try:
        db.session.delete(state)
        db.session.commit()
        
        return jsonify({'message': 'State deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@irpa_bp.route('/reference/states/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete_states():
    """Bulk delete states"""
    data = request.get_json()
    
    if not data or 'ids' not in data:
        return jsonify({'error': 'Missing ids array'}), 400
    
    try:
        deleted_count = State.query.filter(State.state_id.in_(data['ids'])).delete(synchronize_session=False)
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully deleted {deleted_count} states',
            'deleted_count': deleted_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Reference Data Routes - Education Levels
@irpa_bp.route('/reference/education-levels', methods=['GET'])
@jwt_required()
def list_education_levels():
    """List all education levels"""
    education_levels = EducationLevel.query.order_by(EducationLevel.level_name).all()
    return jsonify({
        'education_levels': [level.to_dict() for level in education_levels]
    })


@irpa_bp.route('/reference/education-levels', methods=['POST'])
@jwt_required()
def create_education_level():
    """Create a new education level"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['level_name', 'risk_factor']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        education_level = EducationLevel(
            level_name=data['level_name'],
            risk_factor=data['risk_factor']
        )
        
        db.session.add(education_level)
        db.session.commit()
        
        return jsonify({
            'message': 'Education level created successfully',
            'education_level': education_level.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@irpa_bp.route('/reference/education-levels/<int:education_level_id>', methods=['PUT'])
@jwt_required()
def update_education_level(education_level_id):
    """Update education level"""
    education_level = EducationLevel.query.get_or_404(education_level_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        if 'level_name' in data:
            education_level.level_name = data['level_name']
        if 'risk_factor' in data:
            education_level.risk_factor = data['risk_factor']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Education level updated successfully',
            'education_level': education_level.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@irpa_bp.route('/reference/education-levels/<int:education_level_id>', methods=['DELETE'])
@jwt_required()
def delete_education_level(education_level_id):
    """Delete education level"""
    education_level = EducationLevel.query.get_or_404(education_level_id)
    
    try:
        db.session.delete(education_level)
        db.session.commit()
        
        return jsonify({'message': 'Education level deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@irpa_bp.route('/reference/education-levels/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete_education_levels():
    """Bulk delete education levels"""
    data = request.get_json()
    
    if not data or 'ids' not in data:
        return jsonify({'error': 'Missing ids array'}), 400
    
    try:
        deleted_count = EducationLevel.query.filter(EducationLevel.education_level_id.in_(data['ids'])).delete(synchronize_session=False)
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully deleted {deleted_count} education levels',
            'deleted_count': deleted_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Reference Data Routes - Job Titles
@irpa_bp.route('/reference/job-titles', methods=['GET'])
@jwt_required()
def list_job_titles():
    """List all job titles"""
    job_titles = JobTitle.query.order_by(JobTitle.title_name).all()
    return jsonify({
        'job_titles': [title.to_dict() for title in job_titles]
    })


@irpa_bp.route('/reference/job-titles', methods=['POST'])
@jwt_required()
def create_job_title():
    """Create a new job title"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['title_name', 'risk_category', 'risk_factor']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        job_title = JobTitle(
            title_name=data['title_name'],
            risk_category=data['risk_category'],
            risk_factor=data['risk_factor']
        )
        
        db.session.add(job_title)
        db.session.commit()
        
        return jsonify({
            'message': 'Job title created successfully',
            'job_title': job_title.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@irpa_bp.route('/reference/job-titles/<int:job_title_id>', methods=['PUT'])
@jwt_required()
def update_job_title(job_title_id):
    """Update job title"""
    job_title = JobTitle.query.get_or_404(job_title_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        if 'title_name' in data:
            job_title.title_name = data['title_name']
        if 'risk_category' in data:
            job_title.risk_category = data['risk_category']
        if 'risk_factor' in data:
            job_title.risk_factor = data['risk_factor']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Job title updated successfully',
            'job_title': job_title.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@irpa_bp.route('/reference/job-titles/<int:job_title_id>', methods=['DELETE'])
@jwt_required()
def delete_job_title(job_title_id):
    """Delete job title"""
    job_title = JobTitle.query.get_or_404(job_title_id)
    
    try:
        db.session.delete(job_title)
        db.session.commit()
        
        return jsonify({'message': 'Job title deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@irpa_bp.route('/reference/job-titles/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete_job_titles():
    """Bulk delete job titles"""
    data = request.get_json()
    
    if not data or 'ids' not in data:
        return jsonify({'error': 'Missing ids array'}), 400
    
    try:
        deleted_count = JobTitle.query.filter(JobTitle.job_title_id.in_(data['ids'])).delete(synchronize_session=False)
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully deleted {deleted_count} job titles',
            'deleted_count': deleted_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Reference Data Routes - Practice Fields
@irpa_bp.route('/reference/practice-fields', methods=['GET'])
@jwt_required()
def list_practice_fields():
    """List all practice fields"""
    practice_fields = PracticeField.query.order_by(PracticeField.field_name).all()
    return jsonify({
        'practice_fields': [field.to_dict() for field in practice_fields]
    })


@irpa_bp.route('/reference/practice-fields', methods=['POST'])
@jwt_required()
def create_practice_field():
    """Create a new practice field"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    required_fields = ['field_name', 'risk_factor']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        practice_field = PracticeField(
            field_name=data['field_name'],
            risk_factor=data['risk_factor']
        )
        
        db.session.add(practice_field)
        db.session.commit()
        
        return jsonify({
            'message': 'Practice field created successfully',
            'practice_field': practice_field.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@irpa_bp.route('/reference/practice-fields/<int:practice_field_id>', methods=['PUT'])
@jwt_required()
def update_practice_field(practice_field_id):
    """Update practice field"""
    practice_field = PracticeField.query.get_or_404(practice_field_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    try:
        if 'field_name' in data:
            practice_field.field_name = data['field_name']
        if 'risk_factor' in data:
            practice_field.risk_factor = data['risk_factor']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Practice field updated successfully',
            'practice_field': practice_field.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@irpa_bp.route('/reference/practice-fields/<int:practice_field_id>', methods=['DELETE'])
@jwt_required()
def delete_practice_field(practice_field_id):
    """Delete practice field"""
    practice_field = PracticeField.query.get_or_404(practice_field_id)
    
    try:
        db.session.delete(practice_field)
        db.session.commit()
        
        return jsonify({'message': 'Practice field deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@irpa_bp.route('/reference/practice-fields/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete_practice_fields():
    """Bulk delete practice fields"""
    data = request.get_json()
    
    if not data or 'ids' not in data:
        return jsonify({'error': 'Missing ids array'}), 400
    
    try:
        deleted_count = PracticeField.query.filter(PracticeField.practice_field_id.in_(data['ids'])).delete(synchronize_session=False)
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully deleted {deleted_count} practice fields',
            'deleted_count': deleted_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Analytics and Reporting Routes
@irpa_bp.route('/analytics/risk-distribution', methods=['GET'])
@jwt_required()
@require_permission('analytics.read')
def get_risk_distribution():
    """Get risk distribution analytics"""
    company_id = request.args.get('company_id')
    
    query = db.session.query(
        IRPARiskAssessment.irpa_cci_score,
        IRPARiskAssessment.status
    ).filter(IRPARiskAssessment.status == 'completed')
    
    if company_id:
        query = query.join(InsuredEntity).filter(
            InsuredEntity.company_id == company_id
        )
    
    assessments = query.all()
    
    # Calculate risk categories
    risk_distribution = {'low': 0, 'medium': 0, 'high': 0, 'critical': 0}
    
    for score, status in assessments:
        if score is not None:
            score_val = float(score)
            if score_val >= 80:
                risk_distribution['low'] += 1
            elif score_val >= 60:
                risk_distribution['medium'] += 1
            elif score_val >= 40:
                risk_distribution['high'] += 1
            else:
                risk_distribution['critical'] += 1
    
    return jsonify({
        'risk_distribution': risk_distribution,
        'total_assessments': len(assessments)
    })


@irpa_bp.route('/analytics/assessment-trends', methods=['GET'])
@jwt_required()
@require_permission('analytics.read')
def get_assessment_trends():
    """Get assessment trends over time"""
    days = request.args.get('days', 30, type=int)
    company_id = request.args.get('company_id')
    
    start_date = datetime.now() - timedelta(days=days)
    
    query = db.session.query(
        func.date(IRPARiskAssessment.assessment_date).label('date'),
        func.count(IRPARiskAssessment.assessment_id).label('count'),
        func.avg(IRPARiskAssessment.irpa_cci_score).label('avg_score')
    ).filter(
        IRPARiskAssessment.assessment_date >= start_date,
        IRPARiskAssessment.status == 'completed'
    )
    
    if company_id:
        query = query.join(InsuredEntity).filter(
            InsuredEntity.company_id == company_id
        )
    
    trends = query.group_by(func.date(IRPARiskAssessment.assessment_date)).all()
    
    return jsonify({
        'trends': [
            {
                'date': trend.date.isoformat(),
                'count': trend.count,
                'avg_score': float(trend.avg_score) if trend.avg_score else None
            }
            for trend in trends
        ]
    })


# Audit and Logging Routes
@irpa_bp.route('/audit/activity', methods=['GET'])
@jwt_required()
@require_permission('audit.read')
def get_activity_log():
    """Get user activity logs"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    user_id = request.args.get('user_id')
    activity_type = request.args.get('activity_type')
    
    query = UserActivityLog.query
    
    if user_id:
        query = query.filter(UserActivityLog.user_id == user_id)
    
    if activity_type:
        query = query.filter(UserActivityLog.activity_type == activity_type)
    
    pagination = query.order_by(desc(UserActivityLog.timestamp)).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    logs = [log.to_dict() for log in pagination.items]
    
    return jsonify({
        'activity_logs': logs,
        'pagination': {
            'page': page,
            'pages': pagination.pages,
            'per_page': per_page,
            'total': pagination.total,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })


@irpa_bp.route('/audit/data-access', methods=['GET'])
@jwt_required()
@require_permission('audit.read')
def get_data_access_log():
    """Get data access logs"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    
    user_id = request.args.get('user_id')
    data_type = request.args.get('data_type')
    access_type = request.args.get('access_type')
    
    query = DataAccessLog.query
    
    if user_id:
        query = query.filter(DataAccessLog.user_id == user_id)
    
    if data_type:
        query = query.filter(DataAccessLog.data_type == data_type)
    
    if access_type:
        query = query.filter(DataAccessLog.access_type == access_type)
    
    pagination = query.order_by(desc(DataAccessLog.timestamp)).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    logs = [log.to_dict() for log in pagination.items]
    
    return jsonify({
        'data_access_logs': logs,
        'pagination': {
            'page': page,
            'pages': pagination.pages,
            'per_page': per_page,
            'total': pagination.total,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })


# Error handlers
@irpa_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404


@irpa_bp.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400


@irpa_bp.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500