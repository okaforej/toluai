from backend.app import db
from datetime import datetime
from sqlalchemy.ext.hybrid import hybrid_property

class Client(db.Model):
    """Enhanced client model for insurance customers"""
    __tablename__ = 'clients'
    
    # Primary fields
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    
    # Contact information
    phone = db.Column(db.String(20))
    website = db.Column(db.String(200))
    
    # Address information
    address = db.Column(db.String(200))
    city = db.Column(db.String(50))
    state = db.Column(db.String(50))
    zip_code = db.Column(db.String(20))
    country = db.Column(db.String(50), default='United States')
    
    # Business information
    industry = db.Column(db.String(100), index=True)
    sub_industry = db.Column(db.String(100))
    annual_revenue = db.Column(db.Float, nullable=True, index=True)
    employee_count = db.Column(db.Integer, nullable=True, index=True)
    years_in_business = db.Column(db.Integer)
    business_structure = db.Column(db.String(50))  # LLC, Corporation, Partnership, etc.
    
    # Insurance information
    current_insurance_provider = db.Column(db.String(100))
    current_premium = db.Column(db.Float)
    coverage_amount = db.Column(db.Float)
    deductible = db.Column(db.Float)
    
    # Risk factors
    previous_claims = db.Column(db.Boolean, default=False)
    claims_count_5years = db.Column(db.Integer, default=0)
    safety_programs = db.Column(db.Boolean, default=False)
    certifications = db.Column(db.Text)  # JSON string of certifications
    
    # Status and metadata
    status = db.Column(db.String(20), default='active', index=True)  # active, inactive, prospective
    client_type = db.Column(db.String(20), default='prospect', index=True)  # prospect, customer, former
    source = db.Column(db.String(50))  # referral, website, cold_call, etc.
    notes = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_contacted = db.Column(db.DateTime)
    
    # Relationships
    assessments = db.relationship('RiskAssessment', backref='client', lazy='dynamic', cascade='all, delete-orphan')
    
    @hybrid_property
    def latest_assessment(self):
        """Get the most recent risk assessment"""
        return self.assessments.order_by(db.desc(RiskAssessment.assessment_date)).first()
    
    @hybrid_property
    def risk_score(self):
        """Get the latest risk score"""
        latest = self.latest_assessment
        return latest.risk_score if latest else None
    
    @hybrid_property
    def risk_category(self):
        """Get the latest risk category"""
        latest = self.latest_assessment
        return latest.risk_category if latest else None
    
    def get_address_string(self):
        """Get formatted address string"""
        parts = []
        if self.address:
            parts.append(self.address)
        if self.city:
            parts.append(self.city)
        if self.state:
            parts.append(self.state)
        if self.zip_code:
            parts.append(self.zip_code)
        if self.country and self.country != 'United States':
            parts.append(self.country)
        return ', '.join(parts)
    
    def get_revenue_category(self):
        """Categorize annual revenue"""
        if not self.annual_revenue:
            return 'unknown'
        elif self.annual_revenue < 1_000_000:
            return 'small'  # < $1M
        elif self.annual_revenue < 10_000_000:
            return 'medium'  # $1M - $10M
        elif self.annual_revenue < 100_000_000:
            return 'large'  # $10M - $100M
        else:
            return 'enterprise'  # > $100M
    
    def get_size_category(self):
        """Categorize company size by employee count"""
        if not self.employee_count:
            return 'unknown'
        elif self.employee_count < 10:
            return 'micro'  # < 10 employees
        elif self.employee_count < 50:
            return 'small'  # 10-49 employees
        elif self.employee_count < 250:
            return 'medium'  # 50-249 employees
        else:
            return 'large'  # 250+ employees
    
    def to_dict(self):
        """Convert client to dictionary representation"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'website': self.website,
            'address': self.get_address_string(),
            'industry': self.industry,
            'sub_industry': self.sub_industry,
            'annual_revenue': self.annual_revenue,
            'employee_count': self.employee_count,
            'years_in_business': self.years_in_business,
            'business_structure': self.business_structure,
            'status': self.status,
            'client_type': self.client_type,
            'source': self.source,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'risk_score': self.risk_score,
            'risk_category': self.risk_category,
            'revenue_category': self.get_revenue_category(),
            'size_category': self.get_size_category()
        }
    
    def __repr__(self):
        return f'<Client {self.name}>'


# Import here to avoid circular imports
from backend.models.assessment import RiskAssessment