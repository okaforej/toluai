"""
Rule management API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.models.rule import Rule
from backend.models.user import User
from backend.utilities.decorators import admin_required
import logging

logger = logging.getLogger(__name__)

def register_rule_routes(bp: Blueprint):
    """Register rule-related routes with the given blueprint"""
    
    @bp.route('/rules', methods=['GET'])
    @jwt_required()
    def get_rules():
        """Get all rules"""
        try:
            rules = Rule.query.all()
            return jsonify({
                'rules': [rule.to_dict() for rule in rules]
            }), 200
            
        except Exception as e:
            logger.error(f"Error fetching rules: {str(e)}")
            return jsonify({'error': 'Failed to fetch rules'}), 500
    
    @bp.route('/rules/<int:rule_id>', methods=['GET'])
    @jwt_required()
    def get_rule(rule_id):
        """Get specific rule details"""
        try:
            rule = Rule.query.get(rule_id)
            if not rule:
                return jsonify({'error': 'Rule not found'}), 404
            
            return jsonify(rule.to_dict()), 200
            
        except Exception as e:
            logger.error(f"Error fetching rule: {str(e)}")
            return jsonify({'error': 'Failed to fetch rule'}), 500
    
    @bp.route('/rules', methods=['POST'])
    @jwt_required()
    @admin_required
    def create_rule():
        """Create a new rule"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['name', 'description', 'rule_type']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'error': f'{field} is required'}), 400
            
            rule = Rule(
                name=data['name'],
                description=data['description'],
                rule_type=data['rule_type'],
                conditions=data.get('conditions', {}),
                actions=data.get('actions', {}),
                is_active=data.get('is_active', True)
            )
            
            db.session.add(rule)
            db.session.commit()
            
            return jsonify({
                'message': 'Rule created successfully',
                'rule': rule.to_dict()
            }), 201
            
        except Exception as e:
            logger.error(f"Error creating rule: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Failed to create rule'}), 500