"""
Risk assessment API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.models.assessment import RiskAssessment
from backend.models.client import Client
from backend.models.user import User
from backend.ai.risk_engine import RiskEngine
import logging

logger = logging.getLogger(__name__)

def register_assessment_routes(bp: Blueprint):
    """Register assessment-related routes with the given blueprint"""
    
    @bp.route('/assessments', methods=['GET'])
    @jwt_required()
    def get_assessments():
        """Get all risk assessments"""
        try:
            # Add pagination
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 20, type=int)
            client_id = request.args.get('client_id', type=int)
            
            query = RiskAssessment.query
            if client_id:
                query = query.filter_by(client_id=client_id)
            
            assessments = query.paginate(
                page=page,
                per_page=per_page,
                error_out=False
            )
            
            return jsonify({
                'assessments': [assessment.to_dict() for assessment in assessments.items],
                'total': assessments.total,
                'page': page,
                'pages': assessments.pages
            }), 200
            
        except Exception as e:
            logger.error(f"Error fetching assessments: {str(e)}")
            return jsonify({'error': 'Failed to fetch assessments'}), 500
    
    @bp.route('/assessments/<int:assessment_id>', methods=['GET'])
    @jwt_required()
    def get_assessment(assessment_id):
        """Get specific assessment details"""
        try:
            assessment = RiskAssessment.query.get(assessment_id)
            if not assessment:
                return jsonify({'error': 'Assessment not found'}), 404
            
            return jsonify(assessment.to_dict()), 200
            
        except Exception as e:
            logger.error(f"Error fetching assessment: {str(e)}")
            return jsonify({'error': 'Failed to fetch assessment'}), 500
    
    @bp.route('/assessments', methods=['POST'])
    @jwt_required()
    def create_assessment():
        """Create a new risk assessment"""
        try:
            current_user_id = get_jwt_identity()
            data = request.get_json()
            
            # Validate required fields
            if not data.get('client_id'):
                return jsonify({'error': 'client_id is required'}), 400
            
            client = Client.query.get(data['client_id'])
            if not client:
                return jsonify({'error': 'Client not found'}), 404
            
            # Run AI risk assessment
            risk_engine = RiskEngine()
            risk_analysis = risk_engine.analyze_client(client)
            
            # Create assessment
            assessment = RiskAssessment(
                client_id=client.id,
                user_id=current_user_id,
                risk_score=risk_analysis['risk_score'],
                risk_category=risk_analysis['risk_category'],
                confidence_score=risk_analysis['confidence_score'],
                notes=data.get('notes', '')
            )
            
            db.session.add(assessment)
            
            # Add risk factors
            for factor_data in risk_analysis['risk_factors']:
                assessment.add_risk_factor(
                    factor_name=factor_data['name'],
                    value=factor_data['value'],
                    weight=factor_data['weight'],
                    contribution=factor_data['contribution']
                )
            
            # Add recommendations
            for rec_data in risk_analysis['recommendations']:
                assessment.add_recommendation(
                    title=rec_data['title'],
                    description=rec_data['description'],
                    priority=rec_data['priority'],
                    category=rec_data['category']
                )
            
            db.session.commit()
            
            return jsonify({
                'message': 'Assessment created successfully',
                'assessment': assessment.to_dict()
            }), 201
            
        except Exception as e:
            logger.error(f"Error creating assessment: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Failed to create assessment'}), 500
    
    @bp.route('/assessments/<int:assessment_id>/approve', methods=['POST'])
    @jwt_required()
    def approve_assessment(assessment_id):
        """Approve a risk assessment"""
        try:
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user.has_role('underwriter') and not user.has_role('admin'):
                return jsonify({'error': 'Unauthorized'}), 403
            
            assessment = RiskAssessment.query.get(assessment_id)
            if not assessment:
                return jsonify({'error': 'Assessment not found'}), 404
            
            assessment.status = 'approved'
            assessment.reviewed_by = current_user_id
            assessment.reviewed_at = db.func.current_timestamp()
            
            db.session.commit()
            
            return jsonify({
                'message': 'Assessment approved successfully',
                'assessment': assessment.to_dict()
            }), 200
            
        except Exception as e:
            logger.error(f"Error approving assessment: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Failed to approve assessment'}), 500