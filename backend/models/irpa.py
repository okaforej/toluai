"""
IRPA (Insurance Risk Professional Assessment) Models
Comprehensive risk assessment system models
"""

from datetime import datetime
import uuid
from backend.app import db
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import text


# Reference Tables
class IndustryType(db.Model):
    __tablename__ = 'industry_types'
    
    industry_type_id = db.Column(db.Integer, primary_key=True)
    industry_name = db.Column(db.String(100), nullable=False, unique=True)
    risk_category = db.Column(db.String(50), nullable=False)
    base_risk_factor = db.Column(db.Numeric(5, 2), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    companies = db.relationship('IRPACompany', backref='industry_type', lazy='dynamic')
    market_indicators = db.relationship('MarketIndicator', backref='industry_type', lazy='dynamic')
    
    def to_dict(self):
        return {
            'industry_type_id': self.industry_type_id,
            'industry_name': self.industry_name,
            'risk_category': self.risk_category,
            'base_risk_factor': float(self.base_risk_factor) if self.base_risk_factor else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class State(db.Model):
    __tablename__ = 'states'
    
    state_id = db.Column(db.Integer, primary_key=True)
    state_code = db.Column(db.String(2), nullable=False, unique=True)
    state_name = db.Column(db.String(100), nullable=False, unique=True)
    risk_factor = db.Column(db.Numeric(5, 2), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    companies = db.relationship('IRPACompany', backref='state', lazy='dynamic')
    insured_entities = db.relationship('InsuredEntity', backref='state', lazy='dynamic')
    
    def to_dict(self):
        return {
            'state_id': self.state_id,
            'state_code': self.state_code,
            'state_name': self.state_name,
            'risk_factor': float(self.risk_factor) if self.risk_factor else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class EducationLevel(db.Model):
    __tablename__ = 'education_levels'
    
    education_level_id = db.Column(db.Integer, primary_key=True)
    level_name = db.Column(db.String(100), nullable=False, unique=True)
    risk_factor = db.Column(db.Numeric(5, 2), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    insured_entities = db.relationship('InsuredEntity', backref='education_level', lazy='dynamic')
    
    def to_dict(self):
        return {
            'education_level_id': self.education_level_id,
            'level_name': self.level_name,
            'risk_factor': float(self.risk_factor) if self.risk_factor else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class JobTitle(db.Model):
    __tablename__ = 'job_titles'
    
    job_title_id = db.Column(db.Integer, primary_key=True)
    title_name = db.Column(db.String(255), nullable=False)
    risk_category = db.Column(db.String(50), nullable=False)
    risk_factor = db.Column(db.Numeric(5, 2), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    insured_entities = db.relationship('InsuredEntity', backref='job_title', lazy='dynamic')
    
    def to_dict(self):
        return {
            'job_title_id': self.job_title_id,
            'title_name': self.title_name,
            'risk_category': self.risk_category,
            'risk_factor': float(self.risk_factor) if self.risk_factor else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class PracticeField(db.Model):
    __tablename__ = 'practice_fields'
    
    practice_field_id = db.Column(db.Integer, primary_key=True)
    field_name = db.Column(db.String(255), nullable=False, unique=True)
    risk_factor = db.Column(db.Numeric(5, 2), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    insured_entities = db.relationship('InsuredEntity', backref='practice_field', lazy='dynamic')
    
    def to_dict(self):
        return {
            'practice_field_id': self.practice_field_id,
            'field_name': self.field_name,
            'risk_factor': float(self.risk_factor) if self.risk_factor else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class IRPARole(db.Model):
    __tablename__ = 'irpa_roles'
    
    role_id = db.Column(db.Integer, primary_key=True)
    role_name = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    users = db.relationship('IRPAUser', backref='role', lazy='dynamic')
    role_permissions = db.relationship('RolePermission', backref='role', lazy='dynamic')
    
    def to_dict(self):
        return {
            'role_id': self.role_id,
            'role_name': self.role_name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# Core Entity Tables
class IRPACompany(db.Model):
    __tablename__ = 'irpa_companies'
    
    company_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = db.Column(db.String(255), nullable=False, unique=True)
    industry_type_id = db.Column(db.Integer, db.ForeignKey('industry_types.industry_type_id'))
    operating_margin = db.Column(db.Numeric(5, 2))
    company_size = db.Column(db.Integer)
    company_age = db.Column(db.Integer)
    pe_ratio = db.Column(db.Numeric(8, 4))
    state_id = db.Column(db.Integer, db.ForeignKey('states.state_id'))
    registration_date = db.Column(db.Date, nullable=False)
    legal_structure = db.Column(db.String(50))
    address_line1 = db.Column(db.String(150))
    address_line2 = db.Column(db.String(150))
    city = db.Column(db.String(100))
    zip_code = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = db.relationship('IRPAUser', backref='company', lazy='dynamic')
    insured_entities = db.relationship('InsuredEntity', backref='company', lazy='dynamic')
    cybersecurity_incidents = db.relationship('CybersecurityIncident', backref='company', lazy='dynamic')
    regulatory_compliance = db.relationship('RegulatoryCompliance', backref='company', lazy='dynamic')
    
    def to_dict(self):
        return {
            'company_id': str(self.company_id),
            'company_name': self.company_name,
            'industry_type_id': self.industry_type_id,
            'industry_type': self.industry_type.to_dict() if self.industry_type else None,
            'operating_margin': float(self.operating_margin) if self.operating_margin else None,
            'company_size': self.company_size,
            'company_age': self.company_age,
            'pe_ratio': float(self.pe_ratio) if self.pe_ratio else None,
            'state_id': self.state_id,
            'state': self.state.to_dict() if self.state else None,
            'registration_date': self.registration_date.isoformat() if self.registration_date else None,
            'legal_structure': self.legal_structure,
            'address_line1': self.address_line1,
            'address_line2': self.address_line2,
            'city': self.city,
            'zip_code': self.zip_code,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class IRPAUser(db.Model):
    __tablename__ = 'irpa_users'
    
    user_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('irpa_companies.company_id'), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    password_hash = db.Column(db.String(512), nullable=False)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    role_id = db.Column(db.Integer, db.ForeignKey('irpa_roles.role_id'), nullable=False)
    agree_terms = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('irpa_users.user_id'))
    status = db.Column(db.Boolean, default=True)
    mfa_enabled = db.Column(db.Boolean, default=False)
    failed_login_attempts = db.Column(db.Integer, default=0)
    notification_settings = db.Column(JSONB)
    
    # Relationships
    risk_assessments = db.relationship('IRPARiskAssessment', backref='user', lazy='dynamic')
    user_sessions = db.relationship('UserSession', backref='user', lazy='dynamic')
    activity_logs = db.relationship('UserActivityLog', backref='user', lazy='dynamic')
    data_access_logs = db.relationship('DataAccessLog', backref='user', lazy='dynamic')
    creator = db.relationship('IRPAUser', remote_side=[user_id], backref='created_users')
    
    @property
    def full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email
    
    def to_dict(self):
        return {
            'user_id': str(self.user_id),
            'company_id': str(self.company_id),
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'role_id': self.role_id,
            'role': self.role.to_dict() if self.role else None,
            'agree_terms': self.agree_terms,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'status': self.status,
            'mfa_enabled': self.mfa_enabled,
            'notification_settings': self.notification_settings
        }


class InsuredEntity(db.Model):
    __tablename__ = 'insured_entities'
    
    insured_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('irpa_companies.company_id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)  # Individual, Corporation, etc.
    
    # Professional data
    education_level_id = db.Column(db.Integer, db.ForeignKey('education_levels.education_level_id'))
    years_experience = db.Column(db.Integer)
    job_title_id = db.Column(db.Integer, db.ForeignKey('job_titles.job_title_id'))
    job_tenure = db.Column(db.Integer)
    practice_field_id = db.Column(db.Integer, db.ForeignKey('practice_fields.practice_field_id'))
    date_of_birth = db.Column(db.Date)
    
    # Financial data
    state_id = db.Column(db.Integer, db.ForeignKey('states.state_id'))
    fico_score = db.Column(db.Integer)
    dti_ratio = db.Column(db.Numeric(5, 2))
    payment_history = db.Column(db.String(100))
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    risk_assessments = db.relationship('IRPARiskAssessment', backref='insured_entity', lazy='dynamic')
    
    @property
    def age(self):
        if self.date_of_birth:
            today = datetime.now().date()
            return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None
    
    def to_dict(self):
        # Get latest risk assessment
        latest_assessment = self.risk_assessments.order_by(IRPARiskAssessment.assessment_date.desc()).first()
        
        # Calculate data completeness score
        completeness_score = self.calculate_data_completeness_score()
        
        return {
            'insured_id': str(self.insured_id),
            'company_id': str(self.company_id),
            'name': self.name,
            'entity_type': self.entity_type,
            'education_level_id': self.education_level_id,
            'education_level': self.education_level.to_dict() if self.education_level else None,
            'years_experience': self.years_experience,
            'job_title_id': self.job_title_id,
            'job_title': self.job_title.to_dict() if self.job_title else None,
            'job_tenure': self.job_tenure,
            'practice_field_id': self.practice_field_id,
            'practice_field': self.practice_field.to_dict() if self.practice_field else None,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'age': self.age,
            'state_id': self.state_id,
            'state': self.state.to_dict() if self.state else None,
            'fico_score': self.fico_score,
            'dti_ratio': float(self.dti_ratio) if self.dti_ratio else None,
            'payment_history': self.payment_history,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Add fields expected by frontend
            'company': self.company.to_dict() if self.company else None,
            'latest_risk_score': float(latest_assessment.irpa_cci_score) if latest_assessment and latest_assessment.irpa_cci_score else None,
            'data_completeness_score': completeness_score
        }
    
    def calculate_data_completeness_score(self):
        """Calculate data completeness score as percentage"""
        fields = [
            self.name,
            self.entity_type,
            self.education_level_id,
            self.years_experience,
            self.job_title_id,
            self.practice_field_id,
            self.date_of_birth,
            self.state_id,
            self.fico_score,
            self.dti_ratio,
            self.payment_history
        ]
        
        filled_fields = sum(1 for field in fields if field is not None and field != '')
        total_fields = len(fields)
        
        return (filled_fields / total_fields) * 100


class IRPARiskAssessment(db.Model):
    __tablename__ = 'irpa_risk_assessments'
    
    assessment_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    insured_id = db.Column(UUID(as_uuid=True), db.ForeignKey('insured_entities.insured_id'), nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('irpa_users.user_id'), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='new')  # 'new', 'in_progress', 'completed', 'error'
    
    # Overall scores
    irpa_cci_score = db.Column(db.Numeric(5, 2))
    industry_risk_score = db.Column(db.Numeric(5, 2))
    professional_risk_score = db.Column(db.Numeric(5, 2))
    financial_risk_score = db.Column(db.Numeric(5, 2))
    
    # Industry component scores
    operating_margin_risk = db.Column(db.Numeric(5, 2))
    company_size_risk = db.Column(db.Numeric(5, 2))
    company_age_risk = db.Column(db.Numeric(5, 2))
    pe_ratio_risk = db.Column(db.Numeric(5, 2))
    
    # Professional component scores
    education_level_risk = db.Column(db.Numeric(5, 2))
    experience_risk = db.Column(db.Numeric(5, 2))
    job_title_score = db.Column(db.Numeric(5, 2))
    job_tenure_score = db.Column(db.Numeric(5, 2))
    practice_field_score = db.Column(db.Numeric(5, 2))
    age_score = db.Column(db.Numeric(5, 2))
    state_risk_score = db.Column(db.Numeric(5, 2))
    
    # Financial component scores
    fico_risk_score = db.Column(db.Numeric(5, 2))
    dti_risk_score = db.Column(db.Numeric(5, 2))
    payment_history_risk_score = db.Column(db.Numeric(5, 2))
    
    assessment_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def risk_category(self):
        """Determine risk category based on IRPA CCI score"""
        if not self.irpa_cci_score:
            return 'pending'
        
        score = float(self.irpa_cci_score)
        if score >= 80:
            return 'low'
        elif score >= 60:
            return 'medium'
        elif score >= 40:
            return 'high'
        else:
            return 'critical'
    
    def to_dict(self):
        return {
            'assessment_id': str(self.assessment_id),
            'insured_id': str(self.insured_id),
            'user_id': str(self.user_id),
            'status': self.status,
            'irpa_cci_score': float(self.irpa_cci_score) if self.irpa_cci_score else None,
            'industry_risk_score': float(self.industry_risk_score) if self.industry_risk_score else None,
            'professional_risk_score': float(self.professional_risk_score) if self.professional_risk_score else None,
            'financial_risk_score': float(self.financial_risk_score) if self.financial_risk_score else None,
            'risk_category': self.risk_category,
            'operating_margin_risk': float(self.operating_margin_risk) if self.operating_margin_risk else None,
            'company_size_risk': float(self.company_size_risk) if self.company_size_risk else None,
            'company_age_risk': float(self.company_age_risk) if self.company_age_risk else None,
            'pe_ratio_risk': float(self.pe_ratio_risk) if self.pe_ratio_risk else None,
            'education_level_risk': float(self.education_level_risk) if self.education_level_risk else None,
            'experience_risk': float(self.experience_risk) if self.experience_risk else None,
            'job_title_score': float(self.job_title_score) if self.job_title_score else None,
            'job_tenure_score': float(self.job_tenure_score) if self.job_tenure_score else None,
            'practice_field_score': float(self.practice_field_score) if self.practice_field_score else None,
            'age_score': float(self.age_score) if self.age_score else None,
            'state_risk_score': float(self.state_risk_score) if self.state_risk_score else None,
            'fico_risk_score': float(self.fico_risk_score) if self.fico_risk_score else None,
            'dti_risk_score': float(self.dti_risk_score) if self.dti_risk_score else None,
            'payment_history_risk_score': float(self.payment_history_risk_score) if self.payment_history_risk_score else None,
            'assessment_date': self.assessment_date.isoformat() if self.assessment_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'insured_entity': self.insured_entity.to_dict() if self.insured_entity else None,
            'user': self.user.to_dict() if self.user else None
        }


class UserSession(db.Model):
    __tablename__ = 'user_sessions'
    
    session_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('irpa_users.user_id'), nullable=False)
    device_fingerprint = db.Column(db.String(255))
    login_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    logout_time = db.Column(db.DateTime)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'session_id': str(self.session_id),
            'user_id': str(self.user_id),
            'device_fingerprint': self.device_fingerprint,
            'login_time': self.login_time.isoformat() if self.login_time else None,
            'logout_time': self.logout_time.isoformat() if self.logout_time else None,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }