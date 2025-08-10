"""
IRPA-specific API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.models.irpa import (
    IRPACompany, IRPAUser, InsuredEntity, 
    IRPARiskAssessment, IndustryType, State
)
from backend.models.user import User
import logging

logger = logging.getLogger(__name__)

def register_irpa_routes(bp: Blueprint):
    """Register IRPA-related routes with the given blueprint"""
    
    @bp.route('/irpa/dashboard', methods=['GET'])
    @jwt_required()
    def get_irpa_dashboard():
        """Get IRPA dashboard data"""
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            # Get statistics
            total_companies = IRPACompany.query.count()
            total_entities = InsuredEntity.query.count()
            total_assessments = IRPARiskAssessment.query.count()
            
            # Get recent assessments
            recent_assessments = IRPARiskAssessment.query.order_by(
                IRPARiskAssessment.created_at.desc()
            ).limit(5).all()
            
            # Get risk distribution
            risk_distribution = db.session.query(
                IRPARiskAssessment.risk_level,
                db.func.count(IRPARiskAssessment.id)
            ).group_by(IRPARiskAssessment.risk_level).all()
            
            return jsonify({
                'statistics': {
                    'total_companies': total_companies,
                    'total_entities': total_entities,
                    'total_assessments': total_assessments
                },
                'recent_assessments': [a.to_dict() for a in recent_assessments],
                'risk_distribution': dict(risk_distribution)
            }), 200
            
        except Exception as e:
            logger.error(f"Error fetching IRPA dashboard: {str(e)}")
            return jsonify({'error': 'Failed to fetch dashboard data'}), 500
    
    @bp.route('/irpa/entities', methods=['GET'])
    @jwt_required()
    def get_insured_entities():
        """Get all insured entities"""
        try:
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 20, type=int)
            company_id = request.args.get('company_id', type=int)
            
            query = InsuredEntity.query
            if company_id:
                query = query.filter_by(company_id=company_id)
            
            entities = query.paginate(
                page=page,
                per_page=per_page,
                error_out=False
            )
            
            return jsonify({
                'entities': [entity.to_dict() for entity in entities.items],
                'total': entities.total,
                'page': page,
                'pages': entities.pages
            }), 200
            
        except Exception as e:
            logger.error(f"Error fetching entities: {str(e)}")
            return jsonify({'error': 'Failed to fetch entities'}), 500
    
    @bp.route('/irpa/entities', methods=['POST'])
    @jwt_required()
    def create_insured_entity():
        """Create a new insured entity"""
        try:
            current_user_id = get_jwt_identity()
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['company_id', 'name', 'entity_type']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'error': f'{field} is required'}), 400
            
            entity = InsuredEntity(
                company_id=data['company_id'],
                name=data['name'],
                entity_type=data['entity_type'],
                policy_number=data.get('policy_number'),
                coverage_amount=data.get('coverage_amount'),
                premium=data.get('premium'),
                effective_date=data.get('effective_date'),
                expiration_date=data.get('expiration_date'),
                created_by=current_user_id
            )
            
            db.session.add(entity)
            db.session.commit()
            
            return jsonify({
                'message': 'Entity created successfully',
                'entity': entity.to_dict()
            }), 201
            
        except Exception as e:
            logger.error(f"Error creating entity: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Failed to create entity'}), 500
    
    @bp.route('/irpa/reference/industry-types', methods=['GET'])
    @jwt_required()
    def get_industry_types():
        """Get all industry types"""
        try:
            industries = IndustryType.query.all()
            return jsonify({
                'industry_types': [i.to_dict() for i in industries]
            }), 200
            
        except Exception as e:
            logger.error(f"Error fetching industry types: {str(e)}")
            return jsonify({'error': 'Failed to fetch industry types'}), 500
    
    @bp.route('/irpa/reference/states', methods=['GET'])
    @jwt_required()
    def get_states():
        """Get all states"""
        try:
            states = State.query.all()
            return jsonify({
                'states': [s.to_dict() for s in states]
            }), 200
            
        except Exception as e:
            logger.error(f"Error fetching states: {str(e)}")
            return jsonify({'error': 'Failed to fetch states'}), 500