"""
Risk Rule Models
"""
from datetime import datetime
from backend.app import db
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid


class RiskRule(db.Model):
    """Risk assessment rules"""
    __tablename__ = 'risk_rules'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    rule_type = db.Column(db.String(50), nullable=False)  # 'global' or 'company'
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('irpa_companies.company_id'))
    category = db.Column(db.String(100))
    condition = db.Column(JSONB, nullable=False)
    action = db.Column(JSONB, nullable=False)
    priority = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    version = db.Column(db.Integer, default=1)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    activated_at = db.Column(db.DateTime)
    deactivated_at = db.Column(db.DateTime)
    scheduled_activation = db.Column(db.DateTime)
    
    # Relationships
    creator = db.relationship('User', backref='created_rules')
    audit_logs = db.relationship('RuleAuditLog', backref='rule', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'rule_type': self.rule_type,
            'company_id': str(self.company_id) if self.company_id else None,
            'category': self.category,
            'condition': self.condition,
            'action': self.action,
            'priority': self.priority,
            'is_active': self.is_active,
            'version': self.version,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'activated_at': self.activated_at.isoformat() if self.activated_at else None,
            'deactivated_at': self.deactivated_at.isoformat() if self.deactivated_at else None,
            'scheduled_activation': self.scheduled_activation.isoformat() if self.scheduled_activation else None
        }


class RuleTemplate(db.Model):
    """Templates for creating new rules"""
    __tablename__ = 'rule_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    description = db.Column(db.Text)
    category = db.Column(db.String(100))
    template_data = db.Column(JSONB, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'template_data': self.template_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class RuleAuditLog(db.Model):
    """Audit log for rule changes"""
    __tablename__ = 'rule_audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    rule_id = db.Column(db.Integer, db.ForeignKey('risk_rules.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)  # 'created', 'updated', 'activated', 'deactivated'
    changes = db.Column(JSONB)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='rule_audit_logs')
    
    def to_dict(self):
        return {
            'id': self.id,
            'rule_id': self.rule_id,
            'user_id': self.user_id,
            'action': self.action,
            'changes': self.changes,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'user': self.user.to_dict() if self.user else None
        }