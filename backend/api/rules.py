from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.models.rule import RiskRule, RuleTemplate, RuleAuditLog
from backend.models.user import User
from backend.utilities.decorators import admin_required
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)
rules_bp = Blueprint('rules', __name__)

@rules_bp.route('/api/v1/rules', methods=['GET'])
@jwt_required()
def get_rules():
    """Get risk rules (filtered by user permissions)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Build query based on user role
        query = RiskRule.query
        
        if user.has_role('system_admin'):
            # System admin sees all rules
            pass
        elif user.has_role('company_admin'):
            # Company admin sees global rules and company-specific rules
            query = query.filter(
                db.or_(
                    RiskRule.rule_type == 'global',
                    RiskRule.company_id == user.company_id
                )
            )
        else:
            # Others only see active global rules and their company's rules
            query = query.filter(
                db.or_(
                    db.and_(RiskRule.rule_type == 'global', RiskRule.is_active == True),
                    db.and_(RiskRule.company_id == user.company_id, RiskRule.is_active == True)
                )
            )
        
        # Apply filters from query params
        rule_type = request.args.get('type')
        if rule_type:
            query = query.filter(RiskRule.rule_type == rule_type)
        
        is_active = request.args.get('active')
        if is_active is not None:
            query = query.filter(RiskRule.is_active == (is_active.lower() == 'true'))
        
        rules = query.order_by(RiskRule.priority.desc(), RiskRule.created_at.desc()).all()
        
        return jsonify({
            'rules': [rule.to_dict() for rule in rules]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching rules: {str(e)}")
        return jsonify({'error': 'Failed to fetch rules'}), 500

@rules_bp.route('/api/v1/rules/<int:rule_id>', methods=['GET'])
@jwt_required()
def get_rule(rule_id):
    """Get specific rule details"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        rule = RiskRule.query.get(rule_id)
        if not rule:
            return jsonify({'error': 'Rule not found'}), 404
        
        # Check access permissions
        if rule.rule_type == 'company' and rule.company_id != user.company_id:
            if not user.has_role('system_admin'):
                return jsonify({'error': 'Unauthorized'}), 403
        
        # Include audit history for admins
        result = rule.to_dict()
        if user.has_role('system_admin') or user.has_role('company_admin'):
            result['audit_logs'] = [
                {
                    'action': log.action,
                    'changes': log.changes,
                    'user_id': log.user_id,
                    'timestamp': log.timestamp.isoformat()
                }
                for log in rule.audit_logs[:10]  # Last 10 audit logs
            ]
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error fetching rule: {str(e)}")
        return jsonify({'error': 'Failed to fetch rule'}), 500

@rules_bp.route('/api/v1/rules', methods=['POST'])
@jwt_required()
def create_rule():
    """Create a new risk rule"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate permissions
        rule_type = data.get('rule_type', 'company')
        if rule_type == 'global' and not user.has_role('system_admin'):
            return jsonify({'error': 'Only system administrators can create global rules'}), 403
        
        if rule_type == 'company' and not (user.has_role('system_admin') or user.has_role('company_admin')):
            return jsonify({'error': 'Insufficient permissions to create company rules'}), 403
        
        # Create the rule
        rule = RiskRule(
            name=data.get('name'),
            description=data.get('description'),
            rule_type=rule_type,
            company_id=user.company_id if rule_type == 'company' else None,
            conditions=data.get('conditions', {}),
            actions=data.get('actions', {}),
            priority=data.get('priority', 0),
            is_active=data.get('is_active', False),  # Start inactive by default
            scheduled_activation=datetime.fromisoformat(data['scheduled_activation']) if data.get('scheduled_activation') else None,
            scheduled_deactivation=datetime.fromisoformat(data['scheduled_deactivation']) if data.get('scheduled_deactivation') else None,
            created_by=current_user_id
        )
        
        db.session.add(rule)
        db.session.flush()
        
        # Create audit log
        audit_log = RuleAuditLog(
            rule_id=rule.id,
            action='created',
            changes={'initial': rule.to_dict()},
            user_id=current_user_id
        )
        db.session.add(audit_log)
        db.session.commit()
        
        logger.info(f"Rule {rule.id} created by user {current_user_id}")
        
        return jsonify({
            'message': 'Rule created successfully',
            'rule': rule.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating rule: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create rule'}), 500

@rules_bp.route('/api/v1/rules/<int:rule_id>', methods=['PUT'])
@jwt_required()
def update_rule(rule_id):
    """Update a risk rule"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        rule = RiskRule.query.get(rule_id)
        if not rule:
            return jsonify({'error': 'Rule not found'}), 404
        
        # Check permissions
        if rule.rule_type == 'global' and not user.has_role('system_admin'):
            return jsonify({'error': 'Only system administrators can edit global rules'}), 403
        
        if rule.rule_type == 'company':
            if not (user.has_role('system_admin') or 
                    (user.has_role('company_admin') and user.company_id == rule.company_id)):
                return jsonify({'error': 'Insufficient permissions to edit this rule'}), 403
        
        data = request.get_json()
        
        # Store old values for audit
        old_values = rule.to_dict()
        
        # Update fields
        if 'name' in data:
            rule.name = data['name']
        if 'description' in data:
            rule.description = data['description']
        if 'conditions' in data:
            rule.conditions = data['conditions']
        if 'actions' in data:
            rule.actions = data['actions']
        if 'priority' in data:
            rule.priority = data['priority']
        if 'scheduled_activation' in data:
            rule.scheduled_activation = datetime.fromisoformat(data['scheduled_activation']) if data['scheduled_activation'] else None
        if 'scheduled_deactivation' in data:
            rule.scheduled_deactivation = datetime.fromisoformat(data['scheduled_deactivation']) if data['scheduled_deactivation'] else None
        
        rule.updated_by = current_user_id
        rule.updated_at = datetime.utcnow()
        rule.version += 1
        
        # Create audit log
        audit_log = RuleAuditLog(
            rule_id=rule.id,
            action='updated',
            changes={'old': old_values, 'new': rule.to_dict()},
            user_id=current_user_id
        )
        db.session.add(audit_log)
        db.session.commit()
        
        logger.info(f"Rule {rule_id} updated by user {current_user_id}")
        
        return jsonify({
            'message': 'Rule updated successfully',
            'rule': rule.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating rule: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update rule'}), 500

@rules_bp.route('/api/v1/rules/<int:rule_id>/toggle', methods=['POST'])
@jwt_required()
def toggle_rule(rule_id):
    """Activate or deactivate a rule"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        rule = RiskRule.query.get(rule_id)
        if not rule:
            return jsonify({'error': 'Rule not found'}), 404
        
        # Check permissions
        if rule.rule_type == 'global' and not user.has_role('system_admin'):
            return jsonify({'error': 'Only system administrators can toggle global rules'}), 403
        
        if rule.rule_type == 'company':
            if not (user.has_role('system_admin') or 
                    (user.has_role('company_admin') and user.company_id == rule.company_id)):
                return jsonify({'error': 'Insufficient permissions to toggle this rule'}), 403
        
        # Toggle status
        old_status = rule.is_active
        rule.is_active = not rule.is_active
        
        # Create audit log
        audit_log = RuleAuditLog(
            rule_id=rule.id,
            action='activated' if rule.is_active else 'deactivated',
            changes={'old_status': old_status, 'new_status': rule.is_active},
            user_id=current_user_id
        )
        db.session.add(audit_log)
        db.session.commit()
        
        logger.info(f"Rule {rule_id} {'activated' if rule.is_active else 'deactivated'} by user {current_user_id}")
        
        return jsonify({
            'message': f"Rule {'activated' if rule.is_active else 'deactivated'} successfully",
            'is_active': rule.is_active
        }), 200
        
    except Exception as e:
        logger.error(f"Error toggling rule: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to toggle rule'}), 500

@rules_bp.route('/api/v1/rules/templates', methods=['GET'])
@jwt_required()
def get_rule_templates():
    """Get available rule templates"""
    try:
        templates = RuleTemplate.query.filter_by(is_active=True).all()
        
        return jsonify({
            'templates': [template.to_dict() for template in templates]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching templates: {str(e)}")
        return jsonify({'error': 'Failed to fetch templates'}), 500

@rules_bp.route('/api/v1/rules/<int:rule_id>/versions', methods=['GET'])
@jwt_required()
def get_rule_versions(rule_id):
    """Get version history of a rule"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        rule = RiskRule.query.get(rule_id)
        if not rule:
            return jsonify({'error': 'Rule not found'}), 404
        
        # Check permissions
        if not (user.has_role('system_admin') or user.has_role('company_admin')):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Get all versions (parent and children)
        if rule.parent_rule_id:
            parent_id = rule.parent_rule_id
        else:
            parent_id = rule.id
        
        versions = RiskRule.query.filter(
            db.or_(
                RiskRule.id == parent_id,
                RiskRule.parent_rule_id == parent_id
            )
        ).order_by(RiskRule.version.desc()).all()
        
        return jsonify({
            'versions': [v.to_dict() for v in versions]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching rule versions: {str(e)}")
        return jsonify({'error': 'Failed to fetch versions'}), 500