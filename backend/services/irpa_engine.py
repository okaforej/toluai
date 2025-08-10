"""
IRPA (Insurance Risk Professional Assessment) Engine
Business logic for calculating comprehensive risk scores
"""

import math
from datetime import datetime, date
from typing import Dict, Optional, Tuple
from decimal import Decimal

from backend.app import db
from backend.models.irpa import IRPARiskAssessment, InsuredEntity, IRPACompany
from backend.models.external_risk import CybersecurityIncident, RegulatoryCompliance, MarketIndicator
from backend.models.access_control import UserActivityLog, DataAccessLog


class IRPAAssessmentEngine:
    """
    Comprehensive risk assessment engine that calculates IRPA CCI scores
    based on industry, professional, and financial risk factors
    """
    
    # Risk factor weights for overall score calculation
    INDUSTRY_WEIGHT = 0.35
    PROFESSIONAL_WEIGHT = 0.40
    FINANCIAL_WEIGHT = 0.25
    
    # Industry component weights
    OPERATING_MARGIN_WEIGHT = 0.30
    COMPANY_SIZE_WEIGHT = 0.25
    COMPANY_AGE_WEIGHT = 0.20
    PE_RATIO_WEIGHT = 0.25
    
    # Professional component weights
    EDUCATION_WEIGHT = 0.20
    EXPERIENCE_WEIGHT = 0.25
    JOB_TITLE_WEIGHT = 0.20
    JOB_TENURE_WEIGHT = 0.15
    PRACTICE_FIELD_WEIGHT = 0.10
    AGE_WEIGHT = 0.05
    STATE_RISK_WEIGHT = 0.05
    
    # Financial component weights
    FICO_WEIGHT = 0.50
    DTI_WEIGHT = 0.30
    PAYMENT_HISTORY_WEIGHT = 0.20
    
    # Risk adjustment factors
    CYBERSECURITY_ADJUSTMENT = 0.15
    REGULATORY_ADJUSTMENT = 0.10
    MARKET_VOLATILITY_ADJUSTMENT = 0.05
    
    def __init__(self):
        """Initialize the assessment engine"""
        pass
    
    def run_assessment(self, insured_id: str, user_id: str) -> IRPARiskAssessment:
        """
        Run a comprehensive risk assessment for an insured entity
        
        Args:
            insured_id: UUID of the insured entity
            user_id: UUID of the user running the assessment
            
        Returns:
            IRPARiskAssessment: The completed assessment with scores
        """
        # Get the insured entity
        insured_entity = InsuredEntity.query.get(insured_id)
        if not insured_entity:
            raise ValueError(f"Insured entity {insured_id} not found")
        
        # Create new assessment record
        assessment = IRPARiskAssessment(
            insured_id=insured_id,
            user_id=user_id,
            status='in_progress'
        )
        db.session.add(assessment)
        db.session.flush()  # Get the assessment ID
        
        try:
            # Log the assessment start
            UserActivityLog.log_activity(
                user_id=user_id,
                activity_type=UserActivityLog.ACTIVITY_ASSESSMENT_RUN,
                entity_type='RISK_ASSESSMENT',
                entity_id=assessment.assessment_id,
                action_details={'insured_id': insured_id}
            )
            
            # Calculate industry risk scores
            industry_scores = self._calculate_industry_risk(insured_entity)
            assessment.operating_margin_risk = industry_scores['operating_margin']
            assessment.company_size_risk = industry_scores['company_size']
            assessment.company_age_risk = industry_scores['company_age']
            assessment.pe_ratio_risk = industry_scores['pe_ratio']
            assessment.industry_risk_score = industry_scores['overall']
            
            # Calculate professional risk scores
            professional_scores = self._calculate_professional_risk(insured_entity)
            assessment.education_level_risk = professional_scores['education']
            assessment.experience_risk = professional_scores['experience']
            assessment.job_title_score = professional_scores['job_title']
            assessment.job_tenure_score = professional_scores['job_tenure']
            assessment.practice_field_score = professional_scores['practice_field']
            assessment.age_score = professional_scores['age']
            assessment.state_risk_score = professional_scores['state']
            assessment.professional_risk_score = professional_scores['overall']
            
            # Calculate financial risk scores
            financial_scores = self._calculate_financial_risk(insured_entity)
            assessment.fico_risk_score = financial_scores['fico']
            assessment.dti_risk_score = financial_scores['dti']
            assessment.payment_history_risk_score = financial_scores['payment_history']
            assessment.financial_risk_score = financial_scores['overall']
            
            # Calculate overall IRPA CCI score
            base_score = (
                assessment.industry_risk_score * self.INDUSTRY_WEIGHT +
                assessment.professional_risk_score * self.PROFESSIONAL_WEIGHT +
                assessment.financial_risk_score * self.FINANCIAL_WEIGHT
            )
            
            # Apply external risk adjustments
            adjusted_score = self._apply_external_risk_adjustments(
                base_score, insured_entity.company_id
            )
            
            assessment.irpa_cci_score = round(adjusted_score, 2)
            assessment.status = 'completed'
            
            # Log the assessment completion
            UserActivityLog.log_activity(
                user_id=user_id,
                activity_type=UserActivityLog.ACTIVITY_ASSESSMENT_COMPLETE,
                entity_type='RISK_ASSESSMENT',
                entity_id=assessment.assessment_id,
                action_details={
                    'insured_id': insured_id,
                    'irpa_cci_score': float(assessment.irpa_cci_score),
                    'risk_category': assessment.risk_category
                }
            )
            
            db.session.commit()
            return assessment
            
        except Exception as e:
            assessment.status = 'error'
            assessment.notes = f"Assessment failed: {str(e)}"
            db.session.commit()
            raise e
    
    def _calculate_industry_risk(self, insured_entity: InsuredEntity) -> Dict[str, float]:
        """Calculate industry-based risk scores"""
        company = insured_entity.company
        if not company:
            return {
                'operating_margin': 50.0,
                'company_size': 50.0,
                'company_age': 50.0,
                'pe_ratio': 50.0,
                'overall': 50.0
            }
        
        scores = {}
        
        # Operating margin risk (higher margin = lower risk)
        if company.operating_margin is not None:
            margin = float(company.operating_margin)
            if margin >= 20:
                scores['operating_margin'] = 90.0
            elif margin >= 15:
                scores['operating_margin'] = 80.0
            elif margin >= 10:
                scores['operating_margin'] = 70.0
            elif margin >= 5:
                scores['operating_margin'] = 60.0
            elif margin >= 0:
                scores['operating_margin'] = 40.0
            else:
                scores['operating_margin'] = 20.0
        else:
            scores['operating_margin'] = 50.0
        
        # Company size risk (larger companies = lower risk)
        if company.company_size is not None:
            size = company.company_size
            if size >= 10000:
                scores['company_size'] = 90.0
            elif size >= 1000:
                scores['company_size'] = 80.0
            elif size >= 500:
                scores['company_size'] = 70.0
            elif size >= 100:
                scores['company_size'] = 60.0
            elif size >= 50:
                scores['company_size'] = 50.0
            else:
                scores['company_size'] = 40.0
        else:
            scores['company_size'] = 50.0
        
        # Company age risk (more established = lower risk)
        if company.company_age is not None:
            age = company.company_age
            if age >= 20:
                scores['company_age'] = 85.0
            elif age >= 10:
                scores['company_age'] = 75.0
            elif age >= 5:
                scores['company_age'] = 65.0
            elif age >= 2:
                scores['company_age'] = 55.0
            else:
                scores['company_age'] = 40.0
        else:
            scores['company_age'] = 50.0
        
        # P/E ratio risk (moderate P/E = lower risk)
        if company.pe_ratio is not None:
            pe = float(company.pe_ratio)
            if 10 <= pe <= 25:
                scores['pe_ratio'] = 80.0
            elif 5 <= pe <= 35:
                scores['pe_ratio'] = 70.0
            elif pe <= 50:
                scores['pe_ratio'] = 60.0
            else:
                scores['pe_ratio'] = 40.0
        else:
            scores['pe_ratio'] = 50.0
        
        # Calculate weighted industry score
        overall_score = (
            scores['operating_margin'] * self.OPERATING_MARGIN_WEIGHT +
            scores['company_size'] * self.COMPANY_SIZE_WEIGHT +
            scores['company_age'] * self.COMPANY_AGE_WEIGHT +
            scores['pe_ratio'] * self.PE_RATIO_WEIGHT
        )
        
        scores['overall'] = round(overall_score, 2)
        return scores
    
    def _calculate_professional_risk(self, insured_entity: InsuredEntity) -> Dict[str, float]:
        """Calculate professional-based risk scores"""
        scores = {}
        
        # Education level risk
        if insured_entity.education_level:
            education_risk = float(insured_entity.education_level.risk_factor)
            scores['education'] = max(0, 100 - education_risk * 20)
        else:
            scores['education'] = 50.0
        
        # Experience risk (more experience = lower risk)
        if insured_entity.years_experience is not None:
            exp = insured_entity.years_experience
            if exp >= 20:
                scores['experience'] = 90.0
            elif exp >= 15:
                scores['experience'] = 85.0
            elif exp >= 10:
                scores['experience'] = 80.0
            elif exp >= 5:
                scores['experience'] = 70.0
            elif exp >= 2:
                scores['experience'] = 60.0
            else:
                scores['experience'] = 40.0
        else:
            scores['experience'] = 50.0
        
        # Job title risk
        if insured_entity.job_title:
            job_risk = float(insured_entity.job_title.risk_factor)
            scores['job_title'] = max(0, 100 - job_risk * 20)
        else:
            scores['job_title'] = 50.0
        
        # Job tenure risk (longer tenure = lower risk)
        if insured_entity.job_tenure is not None:
            tenure = insured_entity.job_tenure
            if tenure >= 10:
                scores['job_tenure'] = 85.0
            elif tenure >= 5:
                scores['job_tenure'] = 75.0
            elif tenure >= 2:
                scores['job_tenure'] = 65.0
            elif tenure >= 1:
                scores['job_tenure'] = 55.0
            else:
                scores['job_tenure'] = 40.0
        else:
            scores['job_tenure'] = 50.0
        
        # Practice field risk
        if insured_entity.practice_field:
            field_risk = float(insured_entity.practice_field.risk_factor)
            scores['practice_field'] = max(0, 100 - field_risk * 20)
        else:
            scores['practice_field'] = 50.0
        
        # Age risk (experience vs. adaptability curve)
        if insured_entity.age:
            age = insured_entity.age
            if 30 <= age <= 50:
                scores['age'] = 80.0
            elif 25 <= age <= 60:
                scores['age'] = 75.0
            elif 22 <= age <= 65:
                scores['age'] = 70.0
            else:
                scores['age'] = 60.0
        else:
            scores['age'] = 70.0
        
        # State risk
        if insured_entity.state:
            state_risk = float(insured_entity.state.risk_factor)
            scores['state'] = max(0, 100 - state_risk * 20)
        else:
            scores['state'] = 50.0
        
        # Calculate weighted professional score
        overall_score = (
            scores['education'] * self.EDUCATION_WEIGHT +
            scores['experience'] * self.EXPERIENCE_WEIGHT +
            scores['job_title'] * self.JOB_TITLE_WEIGHT +
            scores['job_tenure'] * self.JOB_TENURE_WEIGHT +
            scores['practice_field'] * self.PRACTICE_FIELD_WEIGHT +
            scores['age'] * self.AGE_WEIGHT +
            scores['state'] * self.STATE_RISK_WEIGHT
        )
        
        scores['overall'] = round(overall_score, 2)
        return scores
    
    def _calculate_financial_risk(self, insured_entity: InsuredEntity) -> Dict[str, float]:
        """Calculate financial-based risk scores"""
        scores = {}
        
        # FICO score risk (higher FICO = lower risk)
        if insured_entity.fico_score is not None:
            fico = insured_entity.fico_score
            if fico >= 800:
                scores['fico'] = 95.0
            elif fico >= 740:
                scores['fico'] = 90.0
            elif fico >= 670:
                scores['fico'] = 80.0
            elif fico >= 580:
                scores['fico'] = 60.0
            elif fico >= 500:
                scores['fico'] = 40.0
            else:
                scores['fico'] = 20.0
        else:
            scores['fico'] = 50.0
        
        # DTI ratio risk (lower DTI = lower risk)
        if insured_entity.dti_ratio is not None:
            dti = float(insured_entity.dti_ratio)
            if dti <= 0.20:
                scores['dti'] = 90.0
            elif dti <= 0.30:
                scores['dti'] = 80.0
            elif dti <= 0.40:
                scores['dti'] = 70.0
            elif dti <= 0.50:
                scores['dti'] = 50.0
            else:
                scores['dti'] = 30.0
        else:
            scores['dti'] = 50.0
        
        # Payment history risk
        if insured_entity.payment_history:
            history = insured_entity.payment_history.lower()
            if history in ['excellent', 'very good']:
                scores['payment_history'] = 95.0
            elif history == 'good':
                scores['payment_history'] = 85.0
            elif history == 'fair':
                scores['payment_history'] = 65.0
            elif history == 'poor':
                scores['payment_history'] = 40.0
            else:
                scores['payment_history'] = 50.0
        else:
            scores['payment_history'] = 50.0
        
        # Calculate weighted financial score
        overall_score = (
            scores['fico'] * self.FICO_WEIGHT +
            scores['dti'] * self.DTI_WEIGHT +
            scores['payment_history'] * self.PAYMENT_HISTORY_WEIGHT
        )
        
        scores['overall'] = round(overall_score, 2)
        return scores
    
    def _apply_external_risk_adjustments(self, base_score: float, company_id: str) -> float:
        """Apply external risk factor adjustments to base score"""
        adjusted_score = base_score
        
        # Cybersecurity incident adjustment
        recent_incidents = CybersecurityIncident.query.filter(
            CybersecurityIncident.company_id == company_id,
            CybersecurityIncident.incident_date >= datetime.now().date().replace(year=datetime.now().year - 2)
        ).all()
        
        if recent_incidents:
            severity_penalty = sum(incident.severity_level for incident in recent_incidents) * 2
            adjusted_score -= min(severity_penalty, base_score * self.CYBERSECURITY_ADJUSTMENT)
        
        # Regulatory compliance adjustment
        non_compliant = RegulatoryCompliance.query.filter(
            RegulatoryCompliance.company_id == company_id,
            RegulatoryCompliance.compliance_status == 'Non-Compliant',
            RegulatoryCompliance.remediation_completed_date.is_(None)
        ).all()
        
        if non_compliant:
            compliance_penalty = len(non_compliant) * 5
            adjusted_score -= min(compliance_penalty, base_score * self.REGULATORY_ADJUSTMENT)
        
        # Market volatility adjustment (simplified)
        # In a real implementation, this would analyze market indicators for the industry
        market_adjustment = self._calculate_market_volatility_adjustment(company_id)
        adjusted_score += market_adjustment
        
        # Ensure score stays within bounds
        return max(0, min(100, adjusted_score))
    
    def _calculate_market_volatility_adjustment(self, company_id: str) -> float:
        """Calculate market volatility adjustment (simplified implementation)"""
        # This is a simplified implementation
        # In practice, you'd analyze specific market indicators for the company's industry
        return 0.0
    
    def get_risk_recommendations(self, assessment: IRPARiskAssessment) -> list:
        """Generate risk mitigation recommendations based on assessment results"""
        recommendations = []
        
        if assessment.irpa_cci_score is None:
            return recommendations
        
        score = float(assessment.irpa_cci_score)
        
        # Low overall score recommendations
        if score < 60:
            recommendations.append({
                'category': 'Overall Risk',
                'priority': 'High',
                'recommendation': 'Consider comprehensive risk mitigation strategy',
                'description': 'The overall risk profile indicates elevated exposure requiring immediate attention.'
            })
        
        # Industry-specific recommendations
        if assessment.industry_risk_score and float(assessment.industry_risk_score) < 60:
            recommendations.append({
                'category': 'Industry Risk',
                'priority': 'Medium',
                'recommendation': 'Improve company financial metrics',
                'description': 'Focus on operational efficiency, growth stability, and market positioning.'
            })
        
        # Professional risk recommendations
        if assessment.professional_risk_score and float(assessment.professional_risk_score) < 60:
            recommendations.append({
                'category': 'Professional Risk',
                'priority': 'Medium',
                'recommendation': 'Enhance professional credentials and experience',
                'description': 'Consider additional certifications, training, or professional development.'
            })
        
        # Financial risk recommendations
        if assessment.financial_risk_score and float(assessment.financial_risk_score) < 60:
            recommendations.append({
                'category': 'Financial Risk',
                'priority': 'High',
                'recommendation': 'Improve financial profile',
                'description': 'Focus on credit score improvement, debt reduction, and payment history.'
            })
        
        # Specific factor recommendations
        if assessment.fico_risk_score and float(assessment.fico_risk_score) < 70:
            recommendations.append({
                'category': 'Credit Score',
                'priority': 'High',
                'recommendation': 'Credit score improvement program',
                'description': 'Implement strategies to improve credit score through timely payments and debt management.'
            })
        
        if assessment.dti_risk_score and float(assessment.dti_risk_score) < 70:
            recommendations.append({
                'category': 'Debt Management',
                'priority': 'Medium',
                'recommendation': 'Reduce debt-to-income ratio',
                'description': 'Consider debt consolidation or income enhancement strategies.'
            })
        
        return recommendations


class IRPADataValidator:
    """Validates data quality and completeness for IRPA assessments"""
    
    @staticmethod
    def validate_insured_entity(insured_entity: InsuredEntity) -> Dict[str, list]:
        """Validate insured entity data completeness and quality"""
        warnings = []
        errors = []
        
        # Required fields
        if not insured_entity.name:
            errors.append("Insured entity name is required")
        
        if not insured_entity.entity_type:
            errors.append("Entity type is required")
        
        # Professional data validation
        if insured_entity.years_experience is not None and insured_entity.years_experience < 0:
            errors.append("Years of experience cannot be negative")
        
        if insured_entity.job_tenure is not None and insured_entity.job_tenure < 0:
            errors.append("Job tenure cannot be negative")
        
        if insured_entity.date_of_birth:
            age = (datetime.now().date() - insured_entity.date_of_birth).days // 365
            if age < 18:
                errors.append("Insured must be at least 18 years old")
            elif age > 100:
                warnings.append("Age over 100 may indicate data entry error")
        
        # Financial data validation
        if insured_entity.fico_score is not None:
            if insured_entity.fico_score < 300 or insured_entity.fico_score > 850:
                errors.append("FICO score must be between 300 and 850")
        
        if insured_entity.dti_ratio is not None:
            if insured_entity.dti_ratio < 0 or insured_entity.dti_ratio > 1:
                errors.append("DTI ratio must be between 0 and 1")
        
        # Data completeness warnings
        missing_fields = []
        if not insured_entity.education_level_id:
            missing_fields.append("Education level")
        if not insured_entity.years_experience:
            missing_fields.append("Years of experience")
        if not insured_entity.job_title_id:
            missing_fields.append("Job title")
        if not insured_entity.fico_score:
            missing_fields.append("FICO score")
        if not insured_entity.dti_ratio:
            missing_fields.append("DTI ratio")
        
        if missing_fields:
            warnings.append(f"Missing recommended fields: {', '.join(missing_fields)}")
        
        return {
            'errors': errors,
            'warnings': warnings
        }
    
    @staticmethod
    def calculate_data_completeness_score(insured_entity: InsuredEntity) -> float:
        """Calculate data completeness score as percentage"""
        total_fields = 15  # Total number of relevant fields
        completed_fields = 0
        
        # Basic fields
        if insured_entity.name:
            completed_fields += 1
        if insured_entity.entity_type:
            completed_fields += 1
        
        # Professional fields
        if insured_entity.education_level_id:
            completed_fields += 1
        if insured_entity.years_experience is not None:
            completed_fields += 1
        if insured_entity.job_title_id:
            completed_fields += 1
        if insured_entity.job_tenure is not None:
            completed_fields += 1
        if insured_entity.practice_field_id:
            completed_fields += 1
        if insured_entity.date_of_birth:
            completed_fields += 1
        if insured_entity.state_id:
            completed_fields += 1
        
        # Financial fields
        if insured_entity.fico_score is not None:
            completed_fields += 1
        if insured_entity.dti_ratio is not None:
            completed_fields += 1
        if insured_entity.payment_history:
            completed_fields += 1
        
        # Company fields (through relationship)
        if insured_entity.company:
            if insured_entity.company.operating_margin is not None:
                completed_fields += 1
            if insured_entity.company.company_size is not None:
                completed_fields += 1
            if insured_entity.company.pe_ratio is not None:
                completed_fields += 1
        
        return round((completed_fields / total_fields) * 100, 2)