"""
User Bridge Model
Connects Flask-Security User model with IRPA User model
"""

from backend.app import db
from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import UUID


class UserBridge(db.Model):
    """
    Bridge table connecting Flask-Security User with IRPAUser
    This allows maintaining existing authentication while linking to IRPA system
    """
    __tablename__ = 'user_bridges'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    irpa_user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('irpa_users.user_id'), nullable=True, unique=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='irpa_bridge', uselist=False)
    irpa_user = db.relationship('IRPAUser', backref='auth_bridge', uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'irpa_user_id': str(self.irpa_user_id) if self.irpa_user_id else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user': self.user.to_dict() if self.user else None,
            'irpa_user': self.irpa_user.to_dict() if self.irpa_user else None
        }
    
    @staticmethod
    def create_irpa_user_for_auth_user(auth_user, company_id, role_id):
        """
        Create an IRPAUser for an existing auth user
        """
        from backend.models.irpa import IRPAUser
        
        # Check if bridge already exists
        bridge = UserBridge.query.filter_by(user_id=auth_user.id).first()
        if bridge and bridge.irpa_user:
            return bridge.irpa_user
        
        # Create new IRPA user
        irpa_user = IRPAUser(
            company_id=company_id,
            email=auth_user.email,
            password_hash='',  # Will use auth_user password
            first_name=auth_user.name.split()[0] if auth_user.name and ' ' in auth_user.name else auth_user.name,
            last_name=auth_user.name.split()[-1] if auth_user.name and ' ' in auth_user.name else '',
            role_id=role_id,
            agree_terms=True,
            status=auth_user.active
        )
        
        db.session.add(irpa_user)
        db.session.flush()  # Get the ID
        
        # Create or update bridge
        if not bridge:
            bridge = UserBridge(
                user_id=auth_user.id,
                irpa_user_id=irpa_user.user_id
            )
            db.session.add(bridge)
        else:
            bridge.irpa_user_id = irpa_user.user_id
            bridge.updated_at = datetime.utcnow()
        
        return irpa_user
    
    @staticmethod
    def get_irpa_user_for_auth_user(auth_user):
        """
        Get IRPAUser for a given auth user
        """
        bridge = UserBridge.query.filter_by(user_id=auth_user.id).first()
        return bridge.irpa_user if bridge else None
    
    @staticmethod
    def get_auth_user_for_irpa_user(irpa_user_id):
        """
        Get auth user for a given IRPA user
        """
        bridge = UserBridge.query.filter_by(irpa_user_id=irpa_user_id).first()
        return bridge.user if bridge else None