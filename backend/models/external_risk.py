"""
External Risk Signal Models
Models for cybersecurity incidents, regulatory compliance, and market indicators
"""

from datetime import datetime
import uuid
from backend.app import db
from sqlalchemy.dialects.postgresql import UUID, JSONB


class IncidentType(db.Model):
    __tablename__ = 'incident_types'
    
    incident_type_id = db.Column(db.Integer, primary_key=True)
    type_name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    base_risk_factor = db.Column(db.Numeric(5, 2), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    cybersecurity_incidents = db.relationship('CybersecurityIncident', backref='incident_type', lazy='dynamic')
    
    def to_dict(self):
        return {
            'incident_type_id': self.incident_type_id,
            'type_name': self.type_name,
            'description': self.description,
            'base_risk_factor': float(self.base_risk_factor) if self.base_risk_factor else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class DataSource(db.Model):
    __tablename__ = 'data_sources'
    
    data_source_id = db.Column(db.Integer, primary_key=True)
    source_name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    reliability_score = db.Column(db.Numeric(3, 2))  # 0.00 to 1.00
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    cybersecurity_incidents = db.relationship('CybersecurityIncident', backref='data_source', lazy='dynamic')
    regulatory_compliance = db.relationship('RegulatoryCompliance', backref='data_source', lazy='dynamic')
    market_indicators = db.relationship('MarketIndicator', backref='data_source', lazy='dynamic')
    
    def to_dict(self):
        return {
            'data_source_id': self.data_source_id,
            'source_name': self.source_name,
            'description': self.description,
            'reliability_score': float(self.reliability_score) if self.reliability_score else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class CybersecurityIncident(db.Model):
    __tablename__ = 'cybersecurity_incidents'
    
    incident_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('irpa_companies.company_id'), nullable=False)
    incident_type_id = db.Column(db.Integer, db.ForeignKey('incident_types.incident_type_id'), nullable=False)
    severity_level = db.Column(db.Integer, nullable=False)  # 1-5 scale
    incident_date = db.Column(db.Date, nullable=False)
    resolution_date = db.Column(db.Date)
    description = db.Column(db.Text)
    affected_systems = db.Column(db.Text)
    financial_impact = db.Column(db.Numeric(12, 2))
    reported_publicly = db.Column(db.Boolean, default=False)
    data_breach = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    data_source_id = db.Column(db.Integer, db.ForeignKey('data_sources.data_source_id'))
    
    @property
    def is_resolved(self):
        return self.resolution_date is not None
    
    @property
    def days_to_resolution(self):
        if self.resolution_date and self.incident_date:
            return (self.resolution_date - self.incident_date).days
        return None
    
    def to_dict(self):
        return {
            'incident_id': str(self.incident_id),
            'company_id': str(self.company_id),
            'incident_type_id': self.incident_type_id,
            'incident_type': self.incident_type.to_dict() if self.incident_type else None,
            'severity_level': self.severity_level,
            'incident_date': self.incident_date.isoformat() if self.incident_date else None,
            'resolution_date': self.resolution_date.isoformat() if self.resolution_date else None,
            'is_resolved': self.is_resolved,
            'days_to_resolution': self.days_to_resolution,
            'description': self.description,
            'affected_systems': self.affected_systems,
            'financial_impact': float(self.financial_impact) if self.financial_impact else None,
            'reported_publicly': self.reported_publicly,
            'data_breach': self.data_breach,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'data_source_id': self.data_source_id,
            'data_source': self.data_source.to_dict() if self.data_source else None
        }


class RegulationType(db.Model):
    __tablename__ = 'regulation_types'
    
    regulation_type_id = db.Column(db.Integer, primary_key=True)
    regulation_name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    industry_specific = db.Column(db.Boolean, default=False)
    industry_type_id = db.Column(db.Integer, db.ForeignKey('industry_types.industry_type_id'))
    region_specific = db.Column(db.Boolean, default=False)
    region_id = db.Column(db.Integer, db.ForeignKey('regions.region_id'))
    risk_factor = db.Column(db.Numeric(5, 2), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    regulatory_compliance = db.relationship('RegulatoryCompliance', backref='regulation_type', lazy='dynamic')
    
    def to_dict(self):
        return {
            'regulation_type_id': self.regulation_type_id,
            'regulation_name': self.regulation_name,
            'description': self.description,
            'industry_specific': self.industry_specific,
            'industry_type_id': self.industry_type_id,
            'region_specific': self.region_specific,
            'region_id': self.region_id,
            'risk_factor': float(self.risk_factor) if self.risk_factor else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Region(db.Model):
    __tablename__ = 'regions'
    
    region_id = db.Column(db.Integer, primary_key=True)
    region_name = db.Column(db.String(100), nullable=False, unique=True)
    region_type = db.Column(db.String(50), nullable=False)  # 'Country', 'State', 'Metropolitan Area'
    parent_region_id = db.Column(db.Integer, db.ForeignKey('regions.region_id'))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    parent_region = db.relationship('Region', remote_side=[region_id], backref='sub_regions')
    regulation_types = db.relationship('RegulationType', backref='region', lazy='dynamic')
    market_indicators = db.relationship('MarketIndicator', backref='region', lazy='dynamic')
    
    def to_dict(self):
        return {
            'region_id': self.region_id,
            'region_name': self.region_name,
            'region_type': self.region_type,
            'parent_region_id': self.parent_region_id,
            'parent_region': self.parent_region.to_dict() if self.parent_region else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class RegulatoryCompliance(db.Model):
    __tablename__ = 'regulatory_compliance'
    
    compliance_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('irpa_companies.company_id'), nullable=False)
    regulation_type_id = db.Column(db.Integer, db.ForeignKey('regulation_types.regulation_type_id'), nullable=False)
    audit_date = db.Column(db.Date, nullable=False)
    compliance_status = db.Column(db.String(50), nullable=False)  # 'Compliant', 'Non-Compliant', 'Pending'
    severity_level = db.Column(db.Integer)  # NULL if compliant, 1-5 if non-compliant
    findings = db.Column(db.Text)
    remediation_plan = db.Column(db.Text)
    remediation_deadline = db.Column(db.Date)
    remediation_completed_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    data_source_id = db.Column(db.Integer, db.ForeignKey('data_sources.data_source_id'))
    
    @property
    def is_compliant(self):
        return self.compliance_status == 'Compliant'
    
    @property
    def is_remediated(self):
        return self.remediation_completed_date is not None
    
    @property
    def days_overdue(self):
        if self.remediation_deadline and not self.is_remediated:
            today = datetime.now().date()
            if today > self.remediation_deadline:
                return (today - self.remediation_deadline).days
        return 0
    
    def to_dict(self):
        return {
            'compliance_id': str(self.compliance_id),
            'company_id': str(self.company_id),
            'regulation_type_id': self.regulation_type_id,
            'regulation_type': self.regulation_type.to_dict() if self.regulation_type else None,
            'audit_date': self.audit_date.isoformat() if self.audit_date else None,
            'compliance_status': self.compliance_status,
            'is_compliant': self.is_compliant,
            'severity_level': self.severity_level,
            'findings': self.findings,
            'remediation_plan': self.remediation_plan,
            'remediation_deadline': self.remediation_deadline.isoformat() if self.remediation_deadline else None,
            'remediation_completed_date': self.remediation_completed_date.isoformat() if self.remediation_completed_date else None,
            'is_remediated': self.is_remediated,
            'days_overdue': self.days_overdue,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'data_source_id': self.data_source_id,
            'data_source': self.data_source.to_dict() if self.data_source else None
        }


class IndicatorType(db.Model):
    __tablename__ = 'indicator_types'
    
    indicator_type_id = db.Column(db.Integer, primary_key=True)
    indicator_name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    unit = db.Column(db.String(50))
    risk_correlation = db.Column(db.String(20), nullable=False)  # 'Positive', 'Negative', 'Variable'
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    market_indicators = db.relationship('MarketIndicator', backref='indicator_type', lazy='dynamic')
    
    def to_dict(self):
        return {
            'indicator_type_id': self.indicator_type_id,
            'indicator_name': self.indicator_name,
            'description': self.description,
            'unit': self.unit,
            'risk_correlation': self.risk_correlation,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class MarketIndicator(db.Model):
    __tablename__ = 'market_indicators'
    
    indicator_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    indicator_type_id = db.Column(db.Integer, db.ForeignKey('indicator_types.indicator_type_id'), nullable=False)
    industry_type_id = db.Column(db.Integer, db.ForeignKey('industry_types.industry_type_id'))
    region_id = db.Column(db.Integer, db.ForeignKey('regions.region_id'))
    date = db.Column(db.Date, nullable=False)
    value = db.Column(db.Numeric(12, 6), nullable=False)
    trend_direction = db.Column(db.String(10))  # 'Up', 'Down', 'Stable'
    year_over_year_change = db.Column(db.Numeric(6, 2))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    data_source_id = db.Column(db.Integer, db.ForeignKey('data_sources.data_source_id'))
    
    def to_dict(self):
        return {
            'indicator_id': str(self.indicator_id),
            'indicator_type_id': self.indicator_type_id,
            'indicator_type': self.indicator_type.to_dict() if self.indicator_type else None,
            'industry_type_id': self.industry_type_id,
            'industry_type': self.industry_type.to_dict() if self.industry_type else None,
            'region_id': self.region_id,
            'region': self.region.to_dict() if self.region else None,
            'date': self.date.isoformat() if self.date else None,
            'value': float(self.value) if self.value else None,
            'trend_direction': self.trend_direction,
            'year_over_year_change': float(self.year_over_year_change) if self.year_over_year_change else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'data_source_id': self.data_source_id,
            'data_source': self.data_source.to_dict() if self.data_source else None
        }