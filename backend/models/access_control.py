"""
Access Control and Audit Models
Models for permissions, user activity logging, and data access tracking
"""

from datetime import datetime
import uuid
from backend.app import db
from sqlalchemy.dialects.postgresql import UUID, JSONB


class Permission(db.Model):
    __tablename__ = 'permissions'
    
    permission_id = db.Column(db.Integer, primary_key=True)
    permission_name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    role_permissions = db.relationship('RolePermission', backref='permission', lazy='dynamic')
    
    def to_dict(self):
        return {
            'permission_id': self.permission_id,
            'permission_name': self.permission_name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class RolePermission(db.Model):
    __tablename__ = 'role_permissions'
    
    role_id = db.Column(db.Integer, db.ForeignKey('irpa_roles.role_id'), nullable=False, primary_key=True)
    permission_id = db.Column(db.Integer, db.ForeignKey('permissions.permission_id'), nullable=False, primary_key=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'role_id': self.role_id,
            'permission_id': self.permission_id,
            'role': self.role.to_dict() if self.role else None,
            'permission': self.permission.to_dict() if self.permission else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class UserActivityLog(db.Model):
    __tablename__ = 'user_activity_log'
    
    log_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('irpa_users.user_id'), nullable=False)
    activity_type = db.Column(db.String(100), nullable=False)
    entity_type = db.Column(db.String(50))  # 'Company', 'InsuredEntity', etc.
    entity_id = db.Column(UUID(as_uuid=True))
    action_details = db.Column(JSONB)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Activity type constants
    ACTIVITY_LOGIN = 'LOGIN'
    ACTIVITY_LOGOUT = 'LOGOUT'
    ACTIVITY_CREATE = 'CREATE'
    ACTIVITY_READ = 'READ'
    ACTIVITY_UPDATE = 'UPDATE'
    ACTIVITY_DELETE = 'DELETE'
    ACTIVITY_EXPORT = 'EXPORT'
    ACTIVITY_ASSESSMENT_RUN = 'ASSESSMENT_RUN'
    ACTIVITY_ASSESSMENT_COMPLETE = 'ASSESSMENT_COMPLETE'
    ACTIVITY_PASSWORD_CHANGE = 'PASSWORD_CHANGE'
    ACTIVITY_SETTINGS_CHANGE = 'SETTINGS_CHANGE'
    
    def to_dict(self):
        return {
            'log_id': str(self.log_id),
            'user_id': str(self.user_id),
            'activity_type': self.activity_type,
            'entity_type': self.entity_type,
            'entity_id': str(self.entity_id) if self.entity_id else None,
            'action_details': self.action_details,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'user': self.user.to_dict() if self.user else None
        }
    
    @staticmethod
    def log_activity(user_id, activity_type, entity_type=None, entity_id=None, 
                    action_details=None, ip_address=None, user_agent=None):
        """Helper method to log user activities"""
        log_entry = UserActivityLog(
            user_id=user_id,
            activity_type=activity_type,
            entity_type=entity_type,
            entity_id=entity_id,
            action_details=action_details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.session.add(log_entry)
        return log_entry


class DataAccessLog(db.Model):
    __tablename__ = 'data_access_log'
    
    log_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('irpa_users.user_id'), nullable=False)
    data_type = db.Column(db.String(100), nullable=False)
    entity_id = db.Column(UUID(as_uuid=True), nullable=False)
    access_type = db.Column(db.String(50), nullable=False)  # 'Read', 'Write', 'Export'
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    request_details = db.Column(JSONB)
    ip_address = db.Column(db.String(45))
    
    # Access type constants
    ACCESS_READ = 'READ'
    ACCESS_WRITE = 'WRITE'
    ACCESS_EXPORT = 'EXPORT'
    ACCESS_DELETE = 'DELETE'
    
    # Data type constants
    DATA_COMPANY = 'COMPANY'
    DATA_INSURED_ENTITY = 'INSURED_ENTITY'
    DATA_RISK_ASSESSMENT = 'RISK_ASSESSMENT'
    DATA_CYBERSECURITY_INCIDENT = 'CYBERSECURITY_INCIDENT'
    DATA_REGULATORY_COMPLIANCE = 'REGULATORY_COMPLIANCE'
    DATA_MARKET_INDICATOR = 'MARKET_INDICATOR'
    DATA_USER = 'USER'
    
    def to_dict(self):
        return {
            'log_id': str(self.log_id),
            'user_id': str(self.user_id),
            'data_type': self.data_type,
            'entity_id': str(self.entity_id),
            'access_type': self.access_type,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'request_details': self.request_details,
            'ip_address': self.ip_address,
            'user': self.user.to_dict() if self.user else None
        }
    
    @staticmethod
    def log_data_access(user_id, data_type, entity_id, access_type, 
                       request_details=None, ip_address=None):
        """Helper method to log data access"""
        log_entry = DataAccessLog(
            user_id=user_id,
            data_type=data_type,
            entity_id=entity_id,
            access_type=access_type,
            request_details=request_details,
            ip_address=ip_address
        )
        db.session.add(log_entry)
        return log_entry


class AuditTrail(db.Model):
    __tablename__ = 'audit_trail'
    
    audit_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_name = db.Column(db.String(100), nullable=False)
    record_id = db.Column(UUID(as_uuid=True), nullable=False)
    operation = db.Column(db.String(10), nullable=False)  # INSERT, UPDATE, DELETE
    old_values = db.Column(JSONB)
    new_values = db.Column(JSONB)
    changed_by = db.Column(UUID(as_uuid=True), db.ForeignKey('irpa_users.user_id'))
    changed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    change_reason = db.Column(db.String(500))
    ip_address = db.Column(db.String(45))
    
    # Relationships
    changed_by_user = db.relationship('IRPAUser', foreign_keys=[changed_by], backref='audit_changes')
    
    # Operation constants
    OP_INSERT = 'INSERT'
    OP_UPDATE = 'UPDATE'
    OP_DELETE = 'DELETE'
    
    def to_dict(self):
        return {
            'audit_id': str(self.audit_id),
            'table_name': self.table_name,
            'record_id': str(self.record_id),
            'operation': self.operation,
            'old_values': self.old_values,
            'new_values': self.new_values,
            'changed_by': str(self.changed_by) if self.changed_by else None,
            'changed_by_user': self.changed_by_user.to_dict() if self.changed_by_user else None,
            'changed_at': self.changed_at.isoformat() if self.changed_at else None,
            'change_reason': self.change_reason,
            'ip_address': self.ip_address
        }
    
    @staticmethod
    def log_change(table_name, record_id, operation, old_values=None, new_values=None, 
                  changed_by=None, change_reason=None, ip_address=None):
        """Helper method to log database changes"""
        audit_entry = AuditTrail(
            table_name=table_name,
            record_id=record_id,
            operation=operation,
            old_values=old_values,
            new_values=new_values,
            changed_by=changed_by,
            change_reason=change_reason,
            ip_address=ip_address
        )
        db.session.add(audit_entry)
        return audit_entry


class SecurityEvent(db.Model):
    __tablename__ = 'security_events'
    
    event_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = db.Column(db.String(100), nullable=False)
    severity_level = db.Column(db.String(20), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    description = db.Column(db.Text, nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('irpa_users.user_id'))
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    event_details = db.Column(JSONB)
    resolved = db.Column(db.Boolean, default=False)
    resolved_by = db.Column(UUID(as_uuid=True), db.ForeignKey('irpa_users.user_id'))
    resolved_at = db.Column(db.DateTime)
    resolution_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('IRPAUser', foreign_keys=[user_id], backref='security_events')
    resolver = db.relationship('IRPAUser', foreign_keys=[resolved_by], backref='resolved_security_events')
    
    # Event type constants
    EVENT_FAILED_LOGIN = 'FAILED_LOGIN'
    EVENT_SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
    EVENT_UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS'
    EVENT_DATA_BREACH_ATTEMPT = 'DATA_BREACH_ATTEMPT'
    EVENT_MALWARE_DETECTED = 'MALWARE_DETECTED'
    EVENT_PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION'
    EVENT_ACCOUNT_LOCKED = 'ACCOUNT_LOCKED'
    EVENT_PASSWORD_POLICY_VIOLATION = 'PASSWORD_POLICY_VIOLATION'
    
    # Severity level constants
    SEVERITY_LOW = 'LOW'
    SEVERITY_MEDIUM = 'MEDIUM'
    SEVERITY_HIGH = 'HIGH'
    SEVERITY_CRITICAL = 'CRITICAL'
    
    def to_dict(self):
        return {
            'event_id': str(self.event_id),
            'event_type': self.event_type,
            'severity_level': self.severity_level,
            'description': self.description,
            'user_id': str(self.user_id) if self.user_id else None,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'event_details': self.event_details,
            'resolved': self.resolved,
            'resolved_by': str(self.resolved_by) if self.resolved_by else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'resolution_notes': self.resolution_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user': self.user.to_dict() if self.user else None,
            'resolver': self.resolver.to_dict() if self.resolver else None
        }
    
    @staticmethod
    def log_security_event(event_type, severity_level, description, user_id=None, 
                          ip_address=None, user_agent=None, event_details=None):
        """Helper method to log security events"""
        event = SecurityEvent(
            event_type=event_type,
            severity_level=severity_level,
            description=description,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            event_details=event_details
        )
        db.session.add(event)
        return event