from backend.app import db
from datetime import datetime
import json
from sqlalchemy.ext.hybrid import hybrid_property

class RiskAssessment(db.Model):
    """Enhanced risk assessment model for insurance clients"""
    __tablename__ = 'risk_assessments'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign keys
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    
    # Assessment results
    risk_score = db.Column(db.Float, nullable=False, index=True)  # 0-100
    risk_category = db.Column(db.String(20), nullable=False, index=True)  # low, medium, high, critical
    confidence = db.Column(db.Float, default=0.0)  # 0-1
    
    # Assessment metadata
    assessment_type = db.Column(db.String(50), default='standard')  # standard, detailed, renewal
    model_version = db.Column(db.String(20))
    assessment_duration = db.Column(db.Integer)  # seconds
    
    # Timestamps
    assessment_date = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Status and workflow
    status = db.Column(db.String(20), default='completed', index=True)  # draft, completed, reviewed, approved
    reviewed_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    reviewed_at = db.Column(db.DateTime)
    
    # Notes and additional data
    notes = db.Column(db.Text)
    meta_data = db.Column(db.Text)  # JSON string for flexible metadata
    
    # Relationships
    factors = db.relationship('RiskFactor', backref='assessment', lazy='dynamic', cascade='all, delete-orphan')
    recommendations = db.relationship('Recommendation', backref='assessment', lazy='dynamic', cascade='all, delete-orphan')
    
    @property
    def metadata_dict(self):
        """Get metadata as dictionary"""
        if self.meta_data:
            try:
                return json.loads(self.meta_data)
            except json.JSONDecodeError:
                return {}
        return {}
        
    @metadata_dict.setter
    def metadata_dict(self, value):
        """Set metadata from dictionary"""
        self.meta_data = json.dumps(value) if value else None
    
    @hybrid_property
    def total_factors(self):
        """Get total number of risk factors"""
        return self.factors.count()
    
    @hybrid_property
    def high_priority_recommendations(self):
        """Get count of high priority recommendations"""
        return self.recommendations.filter(Recommendation.priority == 'high').count()
    
    def get_risk_color(self):
        """Get color code for risk category"""
        colors = {
            'low': 'success',
            'medium': 'warning', 
            'high': 'danger',
            'critical': 'dark'
        }
        return colors.get(self.risk_category, 'secondary')
    
    def get_risk_percentage(self):
        """Get risk score as percentage"""
        return f"{self.risk_score:.1f}%"
    
    def get_confidence_percentage(self):
        """Get confidence as percentage"""
        return f"{self.confidence * 100:.1f}%"
    
    def to_dict(self):
        """Convert assessment to dictionary representation"""
        return {
            'id': self.id,
            'client_id': self.client_id,
            'user_id': self.user_id,
            'risk_score': self.risk_score,
            'risk_category': self.risk_category,
            'confidence': self.confidence,
            'assessment_type': self.assessment_type,
            'model_version': self.model_version,
            'assessment_date': self.assessment_date.isoformat() if self.assessment_date else None,
            'status': self.status,
            'reviewed_by': self.reviewed_by,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'notes': self.notes,
            'metadata': self.metadata_dict,
            'total_factors': self.total_factors,
            'high_priority_recommendations': self.high_priority_recommendations
        }
    
    def __repr__(self):
        return f'<RiskAssessment {self.id} for Client {self.client_id}>'


class RiskFactor(db.Model):
    """Enhanced risk factors identified in an assessment"""
    __tablename__ = 'risk_factors'
    
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('risk_assessments.id'), nullable=False, index=True)
    
    # Factor details
    factor_name = db.Column(db.String(100), nullable=False, index=True)
    factor_value = db.Column(db.Float, nullable=False)  # 0-1
    factor_weight = db.Column(db.Float, nullable=False)  # 0-1
    factor_category = db.Column(db.String(50), nullable=False, index=True)
    
    # Additional information
    description = db.Column(db.Text)
    source = db.Column(db.String(100))  # model, manual, external
    severity = db.Column(db.String(20), index=True)  # low, medium, high
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_impact_score(self):
        """Calculate impact score (value * weight)"""
        return self.factor_value * self.factor_weight
    
    def get_severity_color(self):
        """Get color code for severity"""
        colors = {
            'low': 'success',
            'medium': 'warning',
            'high': 'danger'
        }
        return colors.get(self.severity, 'secondary')
    
    def to_dict(self):
        """Convert factor to dictionary representation"""
        return {
            'id': self.id,
            'assessment_id': self.assessment_id,
            'factor_name': self.factor_name,
            'factor_value': self.factor_value,
            'factor_weight': self.factor_weight,
            'factor_category': self.factor_category,
            'description': self.description,
            'source': self.source,
            'severity': self.severity,
            'impact_score': self.get_impact_score(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<RiskFactor {self.factor_name}>'


class Recommendation(db.Model):
    """Enhanced recommendations generated from risk assessment"""
    __tablename__ = 'recommendations'
    
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('risk_assessments.id'), nullable=False, index=True)
    
    # Recommendation details
    recommendation_text = db.Column(db.Text, nullable=False)
    title = db.Column(db.String(200))
    category = db.Column(db.String(50), index=True)  # safety, financial, operational, compliance
    
    # Priority and impact
    priority = db.Column(db.String(20), nullable=False, index=True)  # low, medium, high, critical
    estimated_impact = db.Column(db.Float)  # 0-1
    implementation_cost = db.Column(db.String(20))  # low, medium, high
    effort_level = db.Column(db.String(20))  # low, medium, high
    
    # Timeline
    timeframe = db.Column(db.String(50))  # immediate, short_term, medium_term, long_term
    estimated_days = db.Column(db.Integer)
    
    # Status tracking
    status = db.Column(db.String(20), default='pending', index=True)  # pending, in_progress, completed, dismissed
    assigned_to = db.Column(db.Integer, db.ForeignKey('user.id'))
    due_date = db.Column(db.Date)
    completed_date = db.Column(db.Date)
    
    # Additional information
    resources_needed = db.Column(db.Text)
    success_metrics = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assigned_user = db.relationship('User', foreign_keys=[assigned_to])
    
    def get_priority_color(self):
        """Get color code for priority"""
        colors = {
            'low': 'info',
            'medium': 'warning',
            'high': 'danger',
            'critical': 'dark'
        }
        return colors.get(self.priority, 'secondary')
    
    def get_status_color(self):
        """Get color code for status"""
        colors = {
            'pending': 'secondary',
            'in_progress': 'primary',
            'completed': 'success',
            'dismissed': 'muted'
        }
        return colors.get(self.status, 'secondary')
    
    def is_overdue(self):
        """Check if recommendation is overdue"""
        if not self.due_date or self.status == 'completed':
            return False
        return datetime.now().date() > self.due_date
    
    def to_dict(self):
        """Convert recommendation to dictionary representation"""
        return {
            'id': self.id,
            'assessment_id': self.assessment_id,
            'title': self.title,
            'recommendation_text': self.recommendation_text,
            'category': self.category,
            'priority': self.priority,
            'estimated_impact': self.estimated_impact,
            'implementation_cost': self.implementation_cost,
            'effort_level': self.effort_level,
            'timeframe': self.timeframe,
            'estimated_days': self.estimated_days,
            'status': self.status,
            'assigned_to': self.assigned_to,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'completed_date': self.completed_date.isoformat() if self.completed_date else None,
            'resources_needed': self.resources_needed,
            'success_metrics': self.success_metrics,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_overdue': self.is_overdue()
        }
    
    def __repr__(self):
        return f'<Recommendation {self.id} for Assessment {self.assessment_id}>'