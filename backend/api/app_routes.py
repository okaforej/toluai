from flask import jsonify, request, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from flask_security import verify_password
from backend.api import api_bp
from backend.models import User, Client, RiskAssessment, RiskFactor, Recommendation
from backend.ai.risk_engine import assess_risk
from backend.app import db, limiter
from datetime import datetime, timedelta
import json


# API Info endpoint
@api_bp.route('/')
def api_info():
    """API information and available endpoints"""
    return jsonify({
        'name': 'ToluAI Insurance Risk Assessment API',
        'version': '1.0',
        'endpoints': {
            'authentication': {
                'login': 'POST /auth/login',
                'refresh': 'POST /auth/refresh'
            },
            'clients': {
                'list': 'GET /clients',
                'create': 'POST /clients', 
                'get': 'GET /clients/<id>',
                'update': 'PUT /clients/<id>',
                'delete': 'DELETE /clients/<id>'
            },
            'assessments': {
                'list': 'GET /assessments',
                'create': 'POST /assessments',
                'get': 'GET /assessments/<id>',
                'run_quick': 'POST /assessments/quick/<client_id>'
            }
        },
        'docs': 'https://docs.toluai.com/api'
    })


# Authentication endpoints
@api_bp.route('/auth/login', methods=['POST'])
@limiter.limit("5 per minute")
def api_login():
    """API login with JWT tokens"""
    try:
        data = request.get_json(force=True)
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
    except Exception as e:
        return jsonify({'error': 'Invalid JSON payload'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if user and user.active and verify_password(data['password'], user.password):
        # Update login tracking
        user.login_count = (user.login_count or 0) + 1
        user.last_login_at = user.current_login_at
        user.current_login_at = datetime.utcnow()
        user.last_login_ip = user.current_login_ip
        user.current_login_ip = request.remote_addr
        db.session.commit()
        
        # Create tokens with user roles
        user_roles = [role.name for role in user.roles] if user.roles else []
        additional_claims = {
            'email': user.email,
            'name': user.name or user.email,
            'roles': user_roles
        }
        
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(
            identity=str(user.id),
            additional_claims=additional_claims
        )
        
        # Include roles in user dict
        user_dict = user.to_dict()
        user_dict['roles'] = user_roles
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user_dict
        }), 200
    
    return jsonify({'error': 'Invalid credentials'}), 401


@api_bp.route('/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def api_refresh():
    """Refresh JWT token"""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user or not user.active:
        return jsonify({'error': 'User not found or inactive'}), 401
    
    access_token = create_access_token(identity=current_user_id)
    return jsonify({'access_token': access_token}), 200


@api_bp.route('/auth/logout', methods=['POST'])
@jwt_required()
def api_logout():
    """Logout (client should discard tokens)"""
    return jsonify({'message': 'Successfully logged out'}), 200


# Health check
@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 503


# Client endpoints
@api_bp.route('/clients', methods=['GET'])
@jwt_required()
@limiter.limit("100 per minute")
def get_clients():
    """Get all clients"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    search = request.args.get('search', '')
    industry = request.args.get('industry', '')
    
    query = Client.query
    
    if search:
        query = query.filter(
            db.or_(
                Client.name.contains(search),
                Client.email.contains(search)
            )
        )
    
    if industry:
        query = query.filter(Client.industry == industry)
    
    clients = query.order_by(Client.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'clients': [client.to_dict() for client in clients.items],
        'pagination': {
            'page': page,
            'pages': clients.pages,
            'per_page': per_page,
            'total': clients.total,
            'has_next': clients.has_next,
            'has_prev': clients.has_prev
        }
    }), 200


@api_bp.route('/clients/<int:client_id>', methods=['GET'])
@jwt_required()
def get_client(client_id):
    """Get specific client"""
    client = Client.query.get_or_404(client_id)
    return jsonify(client.to_dict()), 200


@api_bp.route('/clients', methods=['POST'])
@jwt_required()
@limiter.limit("20 per minute")
def create_client():
    """Create new client"""
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
    except Exception as e:
        return jsonify({'error': 'Invalid JSON payload'}), 400
    
    # Validation
    required_fields = ['name', 'email']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Check if email already exists
    if Client.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    try:
        client = Client(
            name=data['name'],
            email=data['email'],
            phone=data.get('phone'),
            website=data.get('website'),
            address=data.get('address'),
            city=data.get('city'),
            state=data.get('state'),
            zip_code=data.get('zip_code'),
            country=data.get('country', 'United States'),
            industry=data.get('industry'),
            sub_industry=data.get('sub_industry'),
            annual_revenue=data.get('annual_revenue'),
            employee_count=data.get('employee_count'),
            years_in_business=data.get('years_in_business'),
            business_structure=data.get('business_structure'),
            source=data.get('source', 'api')
        )
        
        db.session.add(client)
        db.session.commit()
        
        return jsonify(client.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create client'}), 500


@api_bp.route('/clients/<int:client_id>', methods=['PUT'])
@jwt_required()
def update_client(client_id):
    """Update existing client"""
    client = Client.query.get_or_404(client_id)
    data = request.get_json()
    
    try:
        # Update fields if provided
        updateable_fields = [
            'name', 'email', 'phone', 'website', 'address', 'city', 'state',
            'zip_code', 'country', 'industry', 'sub_industry', 'annual_revenue',
            'employee_count', 'years_in_business', 'business_structure', 'notes'
        ]
        
        for field in updateable_fields:
            if field in data:
                setattr(client, field, data[field])
        
        client.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify(client.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update client'}), 500


@api_bp.route('/clients/<int:client_id>', methods=['DELETE'])
@jwt_required()
def delete_client(client_id):
    """Delete client"""
    client = Client.query.get_or_404(client_id)
    
    try:
        db.session.delete(client)
        db.session.commit()
        return '', 204
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete client'}), 500


# Risk Assessment endpoints
@api_bp.route('/assessments', methods=['GET'])
@jwt_required()
@limiter.limit("100 per minute")
def get_assessments():
    """Get all risk assessments"""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    client_id = request.args.get('client_id', type=int)
    risk_category = request.args.get('risk_category')
    
    query = RiskAssessment.query
    
    if client_id:
        query = query.filter_by(client_id=client_id)
    
    if risk_category:
        query = query.filter_by(risk_category=risk_category)
    
    assessments = query.order_by(RiskAssessment.assessment_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'assessments': [assessment.to_dict() for assessment in assessments.items],
        'pagination': {
            'page': page,
            'pages': assessments.pages,
            'per_page': per_page,
            'total': assessments.total,
            'has_next': assessments.has_next,
            'has_prev': assessments.has_prev
        }
    }), 200


@api_bp.route('/assessments/<int:assessment_id>', methods=['GET'])
@jwt_required()
def get_assessment(assessment_id):
    """Get specific assessment with factors and recommendations"""
    assessment = RiskAssessment.query.get_or_404(assessment_id)
    
    data = assessment.to_dict()
    data['factors'] = [factor.to_dict() for factor in assessment.factors]
    data['recommendations'] = [rec.to_dict() for rec in assessment.recommendations]
    
    return jsonify(data), 200


@api_bp.route('/assessments', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def create_assessment():
    """Create new risk assessment"""
    data = request.get_json()
    current_user_id = get_jwt_identity()
    
    # Validation
    if not data.get('client_id'):
        return jsonify({'error': 'client_id is required'}), 400
    
    client = Client.query.get(data['client_id'])
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    try:
        # Run AI risk assessment
        risk_result = assess_risk(client, data.get('additional_data'))
        
        # Create assessment record
        assessment = RiskAssessment(
            client_id=data['client_id'],
            user_id=current_user_id,
            risk_score=risk_result['risk_score'],
            risk_category=risk_result['risk_category'],
            confidence=risk_result['confidence'],
            assessment_type=data.get('assessment_type', 'standard'),
            model_version=risk_result['metadata']['model_version'],
            notes=data.get('notes')
        )
        
        db.session.add(assessment)
        db.session.flush()  # Get ID
        
        # Add risk factors
        for factor_data in risk_result['factors']:
            factor = RiskFactor(
                assessment_id=assessment.id,
                factor_name=factor_data['name'],
                factor_value=factor_data['value'],
                factor_weight=factor_data['weight'],
                factor_category=factor_data['category'],
                description=factor_data['description'],
                source='model'
            )
            db.session.add(factor)
        
        # Add recommendations
        for rec_data in risk_result['recommendations']:
            recommendation = Recommendation(
                assessment_id=assessment.id,
                title=f"Risk Mitigation: {rec_data['text'][:50]}...",
                recommendation_text=rec_data['text'],
                priority=rec_data['priority'],
                estimated_impact=rec_data['impact'],
                implementation_cost=rec_data['cost'],
                category='operational'
            )
            db.session.add(recommendation)
        
        db.session.commit()
        
        # Return complete assessment
        response_data = assessment.to_dict()
        response_data['factors'] = [factor.to_dict() for factor in assessment.factors]
        response_data['recommendations'] = [rec.to_dict() for rec in assessment.recommendations]
        
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Assessment creation failed: {str(e)}')
        return jsonify({'error': 'Failed to create assessment'}), 500


# Statistics and analytics endpoints
@api_bp.route('/analytics/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_analytics():
    """Get dashboard analytics data"""
    current_user_id = get_jwt_identity()
    
    # Basic stats
    total_clients = Client.query.count()
    total_assessments = RiskAssessment.query.count()
    user_assessments = RiskAssessment.query.filter_by(user_id=current_user_id).count()
    
    # Risk distribution
    risk_distribution = db.session.query(
        RiskAssessment.risk_category,
        db.func.count(RiskAssessment.id)
    ).group_by(RiskAssessment.risk_category).all()
    
    # Recent assessments
    recent_assessments = RiskAssessment.query.join(Client).order_by(
        RiskAssessment.assessment_date.desc()
    ).limit(10).all()
    
    return jsonify({
        'stats': {
            'total_clients': total_clients,
            'total_assessments': total_assessments,
            'user_assessments': user_assessments,
        },
        'risk_distribution': [
            {'category': category, 'count': count}
            for category, count in risk_distribution
        ],
        'recent_assessments': [
            {
                'id': assessment.id,
                'client_name': assessment.client.name,
                'risk_score': assessment.risk_score,
                'risk_category': assessment.risk_category,
                'assessment_date': assessment.assessment_date.isoformat()
            }
            for assessment in recent_assessments
        ]
    }), 200


# Error handlers for API
@api_bp.errorhandler(404)
def api_not_found(error):
    return jsonify({'error': 'Resource not found'}), 404


@api_bp.errorhandler(400)
def api_bad_request(error):
    return jsonify({'error': 'Bad request'}), 400


@api_bp.errorhandler(401)
def api_unauthorized(error):
    return jsonify({'error': 'Unauthorized'}), 401


# Users endpoints
@api_bp.route('/users', methods=['GET'])
@jwt_required()
@limiter.limit("100 per minute")
def get_users():
    """Get users (company-scoped for non-system-admin users)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check permissions
        user_roles = [role.name for role in user.roles]
        if not any(role in user_roles for role in ['system_admin', 'admin', 'company_admin']):
            return jsonify({'error': 'Unauthorized'}), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        query = User.query
        
        # System admins see all users, others see only their company users
        if not (user.has_role('system_admin') or user.has_role('admin')):
            # Filter by company for company admins and other roles
            if hasattr(user, 'company') and user.company:
                query = query.filter_by(company=user.company)
            else:
                # If user has no company, show only themselves
                query = query.filter_by(id=user.id)
        
        users = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'users': [u.to_dict() for u in users.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': users.total,
                'pages': users.pages,
                'has_prev': users.has_prev,
                'has_next': users.has_next
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch users'}), 500

@api_bp.route('/roles', methods=['GET'])
@jwt_required()
def get_roles():
    """Get all roles"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not (user.has_role('system_admin') or user.has_role('admin')):
            return jsonify({'error': 'Unauthorized'}), 403
        
        from backend.models import Role
        roles = Role.query.all()
        
        return jsonify({
            'roles': [{'id': role.id, 'name': role.name, 'description': role.description} for role in roles]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch roles'}), 500


@api_bp.route('/roles', methods=['POST'])
@jwt_required()
def create_role():
    """Create a new role"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not (user.has_role('system_admin') or user.has_role('admin')):
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        if not data or 'name' not in data:
            return jsonify({'error': 'Role name is required'}), 400
        
        from backend.models import Role
        
        # Check if role already exists
        existing_role = Role.query.filter_by(name=data['name']).first()
        if existing_role:
            return jsonify({'error': 'Role already exists'}), 400
        
        role = Role(
            name=data['name'],
            description=data.get('description', '')
        )
        
        db.session.add(role)
        db.session.commit()
        
        return jsonify({
            'message': 'Role created successfully',
            'role': {'id': role.id, 'name': role.name, 'description': role.description}
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create role: {str(e)}'}), 500


@api_bp.route('/roles/<int:role_id>', methods=['PUT'])
@jwt_required()
def update_role(role_id):
    """Update a role"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not (user.has_role('system_admin') or user.has_role('admin')):
            return jsonify({'error': 'Unauthorized'}), 403
        
        from backend.models import Role
        role = Role.query.get_or_404(role_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'name' in data:
            role.name = data['name']
        if 'description' in data:
            role.description = data['description']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Role updated successfully',
            'role': {'id': role.id, 'name': role.name, 'description': role.description}
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update role: {str(e)}'}), 500


@api_bp.route('/roles/<int:role_id>', methods=['DELETE'])
@jwt_required()
def delete_role(role_id):
    """Delete a role"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not (user.has_role('system_admin') or user.has_role('admin')):
            return jsonify({'error': 'Unauthorized'}), 403
        
        from backend.models import Role
        role = Role.query.get_or_404(role_id)
        
        # Don't allow deletion of system roles
        if role.name in ['admin', 'system_admin', 'user']:
            return jsonify({'error': 'Cannot delete system roles'}), 400
        
        db.session.delete(role)
        db.session.commit()
        
        return jsonify({'message': 'Role deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete role: {str(e)}'}), 500


@api_bp.route('/roles/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete_roles():
    """Bulk delete roles"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not (user.has_role('system_admin') or user.has_role('admin')):
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        if not data or 'ids' not in data:
            return jsonify({'error': 'Missing ids array'}), 400
        
        from backend.models import Role
        
        # Check for system roles
        roles_to_delete = Role.query.filter(Role.id.in_(data['ids'])).all()
        system_roles = ['admin', 'system_admin', 'user']
        
        for role in roles_to_delete:
            if role.name in system_roles:
                return jsonify({'error': f'Cannot delete system role: {role.name}'}), 400
        
        deleted_count = Role.query.filter(Role.id.in_(data['ids'])).delete(synchronize_session=False)
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully deleted {deleted_count} roles',
            'deleted_count': deleted_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete roles: {str(e)}'}), 500


@api_bp.route('/permissions', methods=['GET'])
@jwt_required()
def get_permissions():
    """Get all permissions"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not (user.has_role('system_admin') or user.has_role('admin')):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # For now, return a static list of permissions since the Permission model might not exist
        # This can be expanded when proper permissions are implemented
        permissions = [
            {'id': 1, 'name': 'user.create', 'description': 'Create users'},
            {'id': 2, 'name': 'user.read', 'description': 'Read users'},
            {'id': 3, 'name': 'user.update', 'description': 'Update users'},
            {'id': 4, 'name': 'user.delete', 'description': 'Delete users'},
            {'id': 5, 'name': 'company.create', 'description': 'Create companies'},
            {'id': 6, 'name': 'company.read', 'description': 'Read companies'},
            {'id': 7, 'name': 'company.update', 'description': 'Update companies'},
            {'id': 8, 'name': 'company.delete', 'description': 'Delete companies'},
            {'id': 9, 'name': 'reference.create', 'description': 'Create reference data'},
            {'id': 10, 'name': 'reference.read', 'description': 'Read reference data'},
            {'id': 11, 'name': 'reference.update', 'description': 'Update reference data'},
            {'id': 12, 'name': 'reference.delete', 'description': 'Delete reference data'},
            {'id': 13, 'name': 'assessment.create', 'description': 'Create assessments'},
            {'id': 14, 'name': 'assessment.read', 'description': 'Read assessments'},
            {'id': 15, 'name': 'assessment.update', 'description': 'Update assessments'},
            {'id': 16, 'name': 'assessment.delete', 'description': 'Delete assessments'},
        ]
        
        return jsonify({
            'permissions': permissions
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch permissions'}), 500

@api_bp.route('/rules', methods=['GET'])
@jwt_required()
def get_rules():
    """Get all rules"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not (user.has_role('system_admin') or user.has_role('admin')):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # For now, return empty list since rule tables don't exist yet
        # TODO: Implement rules table migration and logic
        rules = []
        
        return jsonify({
            'rules': rules,
            'pagination': {
                'page': 1,
                'per_page': len(rules),
                'total': len(rules),
                'pages': 1,
                'has_prev': False,
                'has_next': False
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch rules'}), 500

@api_bp.route('/rules/templates', methods=['GET'])
@jwt_required()
def get_rule_templates():
    """Get all rule templates"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not (user.has_role('system_admin') or user.has_role('admin')):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # For now, return empty list since rule tables don't exist yet
        # TODO: Implement rule templates table migration and logic
        templates = []
        
        return jsonify({
            'templates': templates
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch rule templates'}), 500

@api_bp.route('/assessments/quick/<int:client_id>', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def create_quick_assessment(client_id):
    """Run quick risk assessment for client"""
    try:
        data = request.get_json(force=True) or {}
    except:
        data = {}
    
    client = Client.query.get_or_404(client_id)
    current_user_id = int(get_jwt_identity())
    
    try:
        # Run AI risk assessment
        risk_result = assess_risk(client)
        
        # Create assessment record
        assessment = RiskAssessment(
            client_id=client.id,
            user_id=current_user_id,
            risk_score=risk_result['risk_score'],
            risk_category=risk_result['risk_category'],
            confidence=risk_result['confidence'],
            assessment_type='quick',
            model_version=risk_result['metadata']['model_version'],
            notes=data.get('notes', '')
        )
        
        db.session.add(assessment)
        db.session.flush()
        
        # Add top factors
        for factor_data in risk_result['factors'][:3]:
            factor = RiskFactor(
                assessment_id=assessment.id,
                factor_name=factor_data['name'],
                factor_value=factor_data['value'],
                factor_weight=factor_data['weight'],
                factor_category=factor_data['category'],
                description=factor_data['description'],
                source='model'
            )
            db.session.add(factor)
        
        # Add top recommendations
        for rec_data in risk_result['recommendations'][:2]:
            recommendation = Recommendation(
                assessment_id=assessment.id,
                title=f"Priority: {rec_data['text'][:30]}...",
                recommendation_text=rec_data['text'],
                priority=rec_data['priority'],
                estimated_impact=rec_data['impact'],
                implementation_cost=rec_data['cost'],
                category='operational'
            )
            db.session.add(recommendation)
        
        db.session.commit()
        
        return jsonify(assessment.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Assessment failed', 'details': str(e)}), 500


@api_bp.errorhandler(403)
def api_forbidden(error):
    return jsonify({'error': 'Forbidden'}), 403


@api_bp.errorhandler(500)
def api_internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500
