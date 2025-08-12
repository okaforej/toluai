"""
IRPA (Insurance Risk Professional Assessment) Engine V2
Enhanced with multiplicative scoring and 7-tier risk categories
Matches IRPA CCI Excel model specifications
"""

import math
from datetime import datetime, date
from typing import Dict, Optional, Tuple
from decimal import Decimal

from backend.app import db
from backend.models.irpa import IRPARiskAssessment, InsuredEntity, IRPACompany
from backend.models.external_risk import CybersecurityIncident, RegulatoryCompliance, MarketIndicator
from backend.models.access_control import UserActivityLog, DataAccessLog
from backend.services.scoring_functions import IRPAScoringFunctions, calculate_irpa_cci_score


class IRPAAssessmentEngineV2:
    """
    Enhanced risk assessment engine using multiplicative scoring methodology
    Implements 7-tier risk categorization and Excel-based formulas
    """
    
    # Weight distribution (40/60 split as per Excel model)
    INDUSTRY_WEIGHT = 0.40  # 40%
    PROFESSIONAL_WEIGHT = 0.60  # 60%
    
    # 7-tier risk categories
    RISK_CATEGORIES = {
        (90, 100): {'name': 'critical_high', 'label': 'Critical High Risk', 'color': '#7c2d12'},
        (80, 89): {'name': 'extremely_high', 'label': 'Extremely High Risk', 'color': '#991b1b'},
        (70, 79): {'name': 'very_high', 'label': 'Very High Risk', 'color': '#dc2626'},
        (50, 69): {'name': 'high', 'label': 'High Risk', 'color': '#ef4444'},
        (30, 50): {'name': 'moderate', 'label': 'Moderate Risk', 'color': '#f59e0b'},
        (20, 30): {'name': 'low', 'label': 'Low Risk', 'color': '#10b981'},
        (1, 20): {'name': 'very_low', 'label': 'Very Low Risk', 'color': '#059669'}
    }
    
    def __init__(self):
        """Initialize the enhanced assessment engine"""
        self.scoring = IRPAScoringFunctions()
    
    def run_assessment(self, insured_id: str, user_id: str) -> IRPARiskAssessment:
        """
        Run a comprehensive risk assessment using multiplicative scoring
        
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
        
        # Get the company
        company = insured_entity.company if insured_entity.company_id else None
        
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
            
            # Prepare data for scoring
            assessment_data = self._prepare_assessment_data(insured_entity, company)
            
            # Calculate industry risk score (multiplicative)
            industry_score = self.scoring.calculate_industry_risk_score(
                industry_type=assessment_data.get('industry_type', 'Unknown'),
                operating_margin=assessment_data.get('operating_margin', 0),
                employee_count=assessment_data.get('employee_count', 0),
                company_age=assessment_data.get('company_age', 0),
                pe_ratio=assessment_data.get('pe_ratio', 0)
            )
            
            # Calculate professional risk score (multiplicative)
            professional_score = self.scoring.calculate_professional_risk_score(
                education_level=assessment_data.get('education_level', 'Unknown'),
                years_experience=assessment_data.get('years_experience', 0),
                job_title=assessment_data.get('job_title', 'Unknown'),
                job_tenure=assessment_data.get('job_tenure', 0),
                practice_field=assessment_data.get('practice_field', 'Unknown'),
                age=assessment_data.get('age', 0),
                state=assessment_data.get('state', 'Unknown'),
                fico=assessment_data.get('fico_score', 0),
                dti=assessment_data.get('dti_ratio', 0),
                payment_history=assessment_data.get('payment_history', 0)
            )
            
            # Calculate final IRPA CCI score
            final_scores = self.scoring.calculate_final_irpa_score(
                industry_score, 
                professional_score
            )
            
            # Store individual risk factors
            assessment.industry_type_risk = self.scoring.industry_type_risk_score(
                assessment_data.get('industry_type', 'Unknown')
            )
            assessment.operating_margin_risk = self.scoring.operating_margin_risk_score(
                assessment_data.get('operating_margin', 0)
            )
            assessment.company_size_risk = self.scoring.company_size_risk_score(
                assessment_data.get('employee_count', 0)
            )
            assessment.company_age_risk = self.scoring.company_age_risk_score(
                assessment_data.get('company_age', 0)
            )
            assessment.pe_ratio_risk = self.scoring.pe_ratio_risk_score(
                assessment_data.get('pe_ratio', 0)
            )
            
            assessment.education_level_risk = self.scoring.education_risk_score(
                assessment_data.get('education_level', 'Unknown')
            )
            assessment.experience_risk = self.scoring.years_experience_risk_score(
                assessment_data.get('years_experience', 0)
            )
            assessment.job_title_score = self.scoring.job_title_risk_score(
                assessment_data.get('job_title', 'Unknown')
            )
            assessment.job_tenure_score = self.scoring.job_tenure_risk_score(
                assessment_data.get('job_tenure', 0)
            )
            assessment.practice_field_score = self.scoring.practice_field_risk_score(
                assessment_data.get('practice_field', 'Unknown')
            )
            assessment.age_score = self.scoring.age_risk_score(
                assessment_data.get('age', 0)
            )
            assessment.state_risk_score = self.scoring.state_risk_score(
                assessment_data.get('state', 'Unknown')
            )
            
            fico_result = self.scoring.fico_risk_score(assessment_data.get('fico_score', 0))
            assessment.fico_risk_score = fico_result['score'] * 100
            
            dti_result = self.scoring.dti_risk_score(assessment_data.get('dti_ratio', 0))
            assessment.dti_risk_score = dti_result['score'] * 100
            
            payment_result = self.scoring.payment_history_risk_score(
                assessment_data.get('payment_history', 0)
            )
            assessment.payment_history_risk_score = payment_result['score'] * 100
            
            # Store aggregate scores
            assessment.industry_risk_score = final_scores['industry_component']
            assessment.professional_risk_score = final_scores['professional_component']
            assessment.financial_risk_score = (
                assessment.fico_risk_score * 0.5 +
                assessment.dti_risk_score * 0.3 +
                assessment.payment_history_risk_score * 0.2
            )
            
            # Apply external risk adjustments if needed
            adjusted_score = self._apply_external_risk_adjustments(
                final_scores['irpa_cci_score'], 
                company.company_id if company else None
            )
            
            assessment.irpa_cci_score = round(adjusted_score, 2)
            assessment.risk_category = self._get_risk_category(adjusted_score)
            assessment.status = 'completed'
            
            # Generate recommendations
            recommendations = self.scoring.generate_recommendations(
                assessment.risk_category,
                {'operating_margin': assessment_data.get('operating_margin', 0),
                 'company_age': assessment_data.get('company_age', 0)},
                {'fico_score': assessment_data.get('fico_score', 0),
                 'dti_ratio': assessment_data.get('dti_ratio', 0)}
            )
            assessment.recommendations = '\n'.join(recommendations)
            
            # Calculate confidence level based on data completeness
            assessment.confidence_level = self._calculate_confidence_level(assessment_data)
            
            # Log the assessment completion
            UserActivityLog.log_activity(
                user_id=user_id,
                activity_type=UserActivityLog.ACTIVITY_ASSESSMENT_COMPLETE,
                entity_type='RISK_ASSESSMENT',
                entity_id=assessment.assessment_id,
                action_details={
                    'insured_id': insured_id,
                    'irpa_cci_score': float(assessment.irpa_cci_score),
                    'risk_category': assessment.risk_category,
                    'methodology': 'multiplicative_v2'
                }
            )
            
            db.session.commit()
            return assessment
            
        except Exception as e:
            assessment.status = 'error'
            assessment.error_message = str(e)
            db.session.commit()
            raise
    
    def _prepare_assessment_data(self, insured_entity: InsuredEntity, company: Optional[IRPACompany]) -> Dict:
        """
        Prepare and validate assessment data
        Auto-calculate operating margin if needed
        """
        data = {}
        
        # Company data
        if company:
            data['industry_type'] = company.industry_type.industry_name if company.industry_type else 'Unknown'
            data['employee_count'] = company.employee_count or 0
            
            # Auto-calculate operating margin
            if company.revenue and company.operating_income:
                data['operating_margin'] = self.scoring.calculate_operating_margin(
                    company.revenue, 
                    company.operating_income
                )
            else:
                data['operating_margin'] = 0
            
            # Calculate company age
            if company.founded_year:
                data['company_age'] = datetime.now().year - company.founded_year
            else:
                data['company_age'] = 0
            
            data['pe_ratio'] = float(company.pe_ratio) if company.pe_ratio else 0
        
        # Professional data
        data['education_level'] = insured_entity.education_level.level_name if insured_entity.education_level else 'Unknown'
        data['years_experience'] = insured_entity.years_experience or 0
        data['job_title'] = insured_entity.job_title.title_name if insured_entity.job_title else 'Unknown'
        data['job_tenure'] = float(insured_entity.job_tenure) if insured_entity.job_tenure else 0
        data['practice_field'] = insured_entity.practice_field.field_name if hasattr(insured_entity, 'practice_field') and insured_entity.practice_field else 'Unknown'
        
        # Calculate age from date of birth
        if insured_entity.date_of_birth:
            today = date.today()
            age = today.year - insured_entity.date_of_birth.year
            if today.month < insured_entity.date_of_birth.month or \
               (today.month == insured_entity.date_of_birth.month and today.day < insured_entity.date_of_birth.day):
                age -= 1
            data['age'] = age
        else:
            data['age'] = 0
        
        data['state'] = insured_entity.state.state_name if insured_entity.state else 'Unknown'
        
        # Financial data
        data['fico_score'] = insured_entity.fico_score or 0
        data['dti_ratio'] = float(insured_entity.dti_ratio) if insured_entity.dti_ratio else 0
        data['payment_history'] = float(insured_entity.payment_history) if insured_entity.payment_history else 0
        
        return data
    
    def _get_risk_category(self, score: float) -> str:
        """Get risk category name based on score"""
        for (min_score, max_score), category_info in self.RISK_CATEGORIES.items():
            if min_score <= score <= max_score:
                return category_info['name']
        return 'unknown'
    
    def _get_risk_category_label(self, score: float) -> str:
        """Get risk category label based on score"""
        for (min_score, max_score), category_info in self.RISK_CATEGORIES.items():
            if min_score <= score <= max_score:
                return category_info['label']
        return 'Unknown Risk'
    
    def _apply_external_risk_adjustments(self, base_score: float, company_id: Optional[str]) -> float:
        """
        Apply external risk adjustments for cybersecurity, regulatory, and market factors
        """
        if not company_id:
            return base_score
        
        adjusted_score = base_score
        
        # Check for recent cybersecurity incidents
        recent_incidents = CybersecurityIncident.query.filter_by(
            company_id=company_id
        ).filter(
            CybersecurityIncident.incident_date >= datetime.now().replace(year=datetime.now().year - 1)
        ).count()
        
        if recent_incidents > 0:
            # Increase risk score for cybersecurity incidents
            adjusted_score *= (1 + 0.15 * min(recent_incidents, 3))
        
        # Check regulatory compliance
        compliance_issues = RegulatoryCompliance.query.filter_by(
            company_id=company_id,
            compliance_status='non_compliant'
        ).count()
        
        if compliance_issues > 0:
            # Increase risk score for compliance issues
            adjusted_score *= (1 + 0.10 * min(compliance_issues, 3))
        
        # Check market volatility
        market_indicators = MarketIndicator.query.filter_by(
            industry_type_id=company_id
        ).order_by(MarketIndicator.indicator_date.desc()).first()
        
        if market_indicators and market_indicators.volatility_index:
            if float(market_indicators.volatility_index) > 30:
                # High volatility adjustment
                adjusted_score *= 1.05
        
        # Cap the score at 100
        return min(adjusted_score, 100)
    
    def _calculate_confidence_level(self, data: Dict) -> float:
        """
        Calculate confidence level based on data completeness
        """
        total_fields = len(data)
        filled_fields = sum(1 for v in data.values() if v and v != 'Unknown' and v != 0)
        
        confidence = (filled_fields / total_fields) * 100 if total_fields > 0 else 0
        
        # Adjust confidence based on critical fields
        critical_fields = ['fico_score', 'dti_ratio', 'operating_margin', 'industry_type']
        critical_filled = sum(1 for field in critical_fields if data.get(field) and data.get(field) != 'Unknown' and data.get(field) != 0)
        
        if critical_filled < len(critical_fields):
            confidence *= (critical_filled / len(critical_fields))
        
        return round(confidence, 2)
    
    def get_risk_distribution(self) -> Dict:
        """
        Get distribution of assessments across risk categories
        """
        distribution = {}
        
        for (min_score, max_score), category_info in self.RISK_CATEGORIES.items():
            count = IRPARiskAssessment.query.filter(
                IRPARiskAssessment.irpa_cci_score >= min_score,
                IRPARiskAssessment.irpa_cci_score <= max_score,
                IRPARiskAssessment.status == 'completed'
            ).count()
            
            distribution[category_info['name']] = {
                'count': count,
                'label': category_info['label'],
                'color': category_info['color'],
                'range': f"{min_score}-{max_score}"
            }
        
        return distribution
    
    def recalculate_assessment(self, assessment_id: str) -> IRPARiskAssessment:
        """
        Recalculate an existing assessment with updated data
        """
        assessment = IRPARiskAssessment.query.get(assessment_id)
        if not assessment:
            raise ValueError(f"Assessment {assessment_id} not found")
        
        # Re-run the assessment
        return self.run_assessment(assessment.insured_id, assessment.user_id)