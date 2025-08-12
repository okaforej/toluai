"""
IRPA CCI Scoring Functions
Implementation of all risk scoring algorithms from the IRPA CCI model
Matches Excel specifications exactly for consistency
"""

from typing import Dict, Optional, Tuple
from decimal import Decimal
import math


class IRPAScoringFunctions:
    """
    Complete implementation of IRPA CCI scoring methodology
    Uses multiplicative scoring (product) instead of weighted average
    """
    
    # Risk category thresholds
    RISK_CATEGORIES = {
        (90, 100): 'critical_high',
        (80, 89): 'extremely_high',
        (70, 79): 'very_high',
        (50, 69): 'high',
        (30, 50): 'moderate',
        (20, 30): 'low',
        (1, 20): 'very_low'
    }
    
    # Weight distribution
    INDUSTRY_WEIGHT = 0.40  # 40%
    PROFESSIONAL_WEIGHT = 0.60  # 60%
    
    @staticmethod
    def get_risk_category(score: float) -> str:
        """Determine risk category based on score"""
        for (min_score, max_score), category in IRPAScoringFunctions.RISK_CATEGORIES.items():
            if min_score <= score <= max_score:
                return category
        return 'unknown'
    
    @staticmethod
    def calculate_final_irpa_score(industry_score: float, professional_score: float) -> Dict:
        """
        Calculate final IRPA CCI score using multiplicative methodology
        Formula: (Professional × 0.6) + (Industry × 0.4)
        """
        final_score = (professional_score * IRPAScoringFunctions.PROFESSIONAL_WEIGHT + 
                      industry_score * IRPAScoringFunctions.INDUSTRY_WEIGHT)
        
        return {
            'irpa_cci_score': round(final_score * 100, 2),  # Convert to percentage
            'industry_component': round(industry_score * 100, 2),
            'professional_component': round(professional_score * 100, 2),
            'risk_category': IRPAScoringFunctions.get_risk_category(final_score * 100),
            'industry_weight': IRPAScoringFunctions.INDUSTRY_WEIGHT,
            'professional_weight': IRPAScoringFunctions.PROFESSIONAL_WEIGHT
        }
    
    # ==================== FINANCIAL RISK FACTORS ====================
    
    @staticmethod
    def fico_risk_score(fico: int) -> Dict:
        """
        FICO Score Risk Assessment
        Ranges from Excel: 800+ (0.40) to <580 (0.95)
        """
        if fico >= 800:
            return {"category": "Very Low Risk", "score": 0.40, "description": "Prime credit, excellent standing"}
        elif fico >= 740:
            return {"category": "Low Risk", "score": 0.60, "description": "Solid borrower"}
        elif fico >= 670:
            return {"category": "Medium Risk", "score": 0.80, "description": "Average credit"}
        elif fico >= 580:
            return {"category": "High Risk", "score": 0.90, "description": "Subprime, red flags"}
        else:
            return {"category": "Very High Risk", "score": 0.95, "description": "Significant credit issues"}
    
    @staticmethod
    def dti_risk_score(dti: float) -> Dict:
        """
        Debt-to-Income Ratio Risk Assessment
        Lower DTI = Lower Risk
        """
        if dti < 20:
            return {"category": "Very Low Risk", "score": 0.40}
        elif dti < 35:
            return {"category": "Low Risk", "score": 0.60}
        elif dti < 45:
            return {"category": "Medium Risk", "score": 0.80}
        elif dti < 60:
            return {"category": "High Risk", "score": 0.90}
        else:
            return {"category": "Very High Risk", "score": 0.95}
    
    @staticmethod
    def payment_history_risk_score(payment_history: float) -> Dict:
        """
        Payment History Risk Assessment
        Percentage of on-time payments
        """
        if payment_history >= 99:
            return {"category": "Very Low Risk", "score": 0.40}
        elif payment_history >= 95:
            return {"category": "Low Risk", "score": 0.60}
        elif payment_history >= 90:
            return {"category": "Medium Risk", "score": 0.80}
        elif payment_history >= 80:
            return {"category": "High Risk", "score": 0.90}
        else:
            return {"category": "Very High Risk", "score": 0.95}
    
    # ==================== COMPANY RISK FACTORS ====================
    
    @staticmethod
    def operating_margin_risk_score(margin: float) -> float:
        """
        Operating Margin Risk Assessment
        Higher margins = Lower risk
        """
        if margin >= 30:
            return 0.55
        elif margin >= 20:
            return 0.65
        elif margin >= 10:
            return 0.75
        elif margin >= 5:
            return 0.85
        elif margin >= 0:
            return 0.90
        else:  # Negative margin
            return 0.97
    
    @staticmethod
    def company_size_risk_score(employee_count: int) -> float:
        """
        Company Size Risk Assessment
        Larger companies = Lower risk
        """
        if employee_count >= 100000:
            return 0.40
        elif employee_count >= 50001:
            return 0.60
        elif employee_count >= 10001:
            return 0.80
        elif employee_count >= 1001:
            return 0.90
        else:  # <= 1000 employees
            return 0.95
    
    @staticmethod
    def company_age_risk_score(years: int) -> float:
        """
        Company Age Risk Assessment
        Older companies = Lower risk
        """
        if years >= 30:
            return 0.40
        elif years >= 20:
            return 0.60
        elif years >= 10:
            return 0.80
        elif years >= 5:
            return 0.90
        else:  # < 5 years
            return 0.95
    
    @staticmethod
    def pe_ratio_risk_score(pe_ratio: float) -> float:
        """
        P/E Ratio Risk Assessment
        Very high or negative P/E = Higher risk
        """
        if pe_ratio < 0:  # Negative earnings
            return 0.95
        elif pe_ratio < 10:
            return 0.40
        elif pe_ratio < 20:
            return 0.60
        elif pe_ratio < 35:
            return 0.80
        elif pe_ratio < 50:
            return 0.90
        else:  # >= 50
            return 0.95
    
    # ==================== PROFESSIONAL RISK FACTORS ====================
    
    @staticmethod
    def education_risk_score(education_level: str) -> float:
        """
        Education Level Risk Assessment
        Higher education = Lower risk
        """
        education_scores = {
            "No High School Diploma": 0.95,
            "High School Diploma or GED": 0.90,
            "Some College (no degree)": 0.85,
            "Associate Degree": 0.80,
            "Bachelor's Degree": 0.70,
            "Master's Degree": 0.60,
            "Professional Degree (JD, MD, etc.)": 0.50,
            "Doctorate (PhD, EdD)": 0.40
        }
        return education_scores.get(education_level, 0.85)  # Default to medium-high risk
    
    @staticmethod
    def years_experience_risk_score(years: int) -> float:
        """
        Years of Experience Risk Assessment
        More experience = Lower risk
        """
        if years >= 20:
            return 0.40
        elif years >= 15:
            return 0.50
        elif years >= 10:
            return 0.60
        elif years >= 7:
            return 0.70
        elif years >= 5:
            return 0.80
        elif years >= 3:
            return 0.90
        else:  # < 3 years
            return 0.95
    
    @staticmethod
    def job_title_risk_score(job_title: str) -> float:
        """
        Job Title Risk Assessment
        Executive/Senior positions = Lower risk
        """
        job_title_lower = job_title.lower()
        
        # Executive level
        if any(term in job_title_lower for term in ['ceo', 'cfo', 'cto', 'president', 'chief']):
            return 0.40
        # Senior management
        elif any(term in job_title_lower for term in ['director', 'vp', 'vice president', 'head of']):
            return 0.50
        # Management
        elif any(term in job_title_lower for term in ['manager', 'supervisor', 'lead']):
            return 0.60
        # Senior professional
        elif any(term in job_title_lower for term in ['senior', 'principal', 'staff']):
            return 0.70
        # Professional
        elif any(term in job_title_lower for term in ['analyst', 'engineer', 'developer', 'specialist']):
            return 0.80
        # Junior professional
        elif any(term in job_title_lower for term in ['junior', 'associate', 'assistant']):
            return 0.90
        # Entry level/Other
        else:
            return 0.95
    
    @staticmethod
    def job_tenure_risk_score(years: float) -> float:
        """
        Job Tenure Risk Assessment
        Longer tenure = Lower risk (stability)
        """
        if years >= 10:
            return 0.40
        elif years >= 7:
            return 0.50
        elif years >= 5:
            return 0.60
        elif years >= 3:
            return 0.70
        elif years >= 2:
            return 0.80
        elif years >= 1:
            return 0.90
        else:  # < 1 year
            return 0.95
    
    @staticmethod
    def practice_field_risk_score(field: str) -> float:
        """
        Practice Field/Industry Risk Assessment
        Based on industry volatility and stability
        """
        field_scores = {
            # Low risk fields
            "Healthcare": 0.40,
            "Education": 0.40,
            "Government": 0.45,
            "Utilities": 0.50,
            
            # Medium-low risk
            "Finance": 0.60,
            "Insurance": 0.60,
            "Legal": 0.60,
            "Accounting": 0.65,
            
            # Medium risk
            "Manufacturing": 0.70,
            "Retail": 0.75,
            "Transportation": 0.75,
            
            # Medium-high risk
            "Technology": 0.80,
            "Consulting": 0.80,
            "Real Estate": 0.85,
            
            # High risk
            "Hospitality": 0.90,
            "Entertainment": 0.90,
            "Startup": 0.95,
            "Freelance": 0.95
        }
        
        # Try to match field
        for key, score in field_scores.items():
            if key.lower() in field.lower():
                return score
        
        return 0.75  # Default to medium risk
    
    @staticmethod
    def age_risk_score(age: int) -> float:
        """
        Age Risk Assessment
        Peak earning years (35-55) = Lower risk
        """
        if 35 <= age <= 55:
            return 0.40  # Peak earning/stability years
        elif 30 <= age < 35 or 55 < age <= 60:
            return 0.50
        elif 25 <= age < 30 or 60 < age <= 65:
            return 0.60
        elif 22 <= age < 25 or 65 < age <= 70:
            return 0.70
        elif age > 70:
            return 0.85  # Retirement age risks
        else:  # < 22
            return 0.90  # Very young, limited credit history
    
    @staticmethod
    def state_risk_score(state: str) -> float:
        """
        State Risk Assessment
        Based on economic stability, unemployment rates, cost of living
        """
        state_scores = {
            # Low risk states (strong economies)
            "Massachusetts": 0.40,
            "New Hampshire": 0.40,
            "Virginia": 0.45,
            "Maryland": 0.45,
            "Connecticut": 0.50,
            
            # Medium-low risk
            "New York": 0.60,
            "California": 0.60,
            "Washington": 0.60,
            "Colorado": 0.65,
            "Texas": 0.65,
            
            # Medium risk
            "Illinois": 0.70,
            "Pennsylvania": 0.70,
            "Florida": 0.75,
            "Georgia": 0.75,
            "North Carolina": 0.75,
            
            # Medium-high risk
            "Ohio": 0.80,
            "Michigan": 0.80,
            "Arizona": 0.80,
            "Nevada": 0.85,
            
            # High risk
            "Louisiana": 0.90,
            "Mississippi": 0.90,
            "West Virginia": 0.95,
            "Arkansas": 0.95
        }
        
        return state_scores.get(state, 0.75)  # Default to medium risk
    
    @staticmethod
    def industry_type_risk_score(industry: str) -> float:
        """
        Industry Type Risk Assessment
        Based on industry volatility and economic sensitivity
        """
        industry_scores = {
            # Lowest risk
            "Military": 0.40,
            "Education": 0.40,
            "Healthcare": 0.60,
            "Pharma/Biotech": 0.60,
            
            # Medium risk
            "Energy/Oil & Gas": 0.80,
            "Retail": 0.80,
            "Regulated Utility": 0.80,
            "Financial & Banking": 0.80,
            
            # Higher risk
            "Non Regulated Utility": 0.90,
            "Clean Tech": 0.90,
            "Media and Journalism": 0.90,
            
            # Highest risk
            "Technology": 0.95,
            "Consulting": 0.95,
            "Manufacturing": 0.95,
            "Retail/Consumables": 0.95,
            "Hospitality and Travel": 0.95,
            "Transportation": 0.95,
            "Government": 0.95  # Note: Government is marked as 0.95 in the Excel
        }
        
        # Try to match industry
        industry_lower = industry.lower()
        for key, score in industry_scores.items():
            if key.lower() in industry_lower or industry_lower in key.lower():
                return score
        
        return 0.80  # Default to medium-high risk
    
    # ==================== AGGREGATE CALCULATIONS ====================
    
    @staticmethod
    def calculate_industry_risk_score(
        industry_type: str,
        operating_margin: float,
        employee_count: int,
        company_age: int,
        pe_ratio: float
    ) -> float:
        """
        Calculate aggregate industry risk score
        Uses MULTIPLICATIVE approach (product of all factors)
        """
        scores = [
            IRPAScoringFunctions.industry_type_risk_score(industry_type),
            IRPAScoringFunctions.operating_margin_risk_score(operating_margin),
            IRPAScoringFunctions.company_size_risk_score(employee_count),
            IRPAScoringFunctions.company_age_risk_score(company_age),
            IRPAScoringFunctions.pe_ratio_risk_score(pe_ratio)
        ]
        
        # Multiplicative scoring - product of all factors
        industry_score = 1.0
        for score in scores:
            industry_score *= score
        
        return industry_score
    
    @staticmethod
    def calculate_professional_risk_score(
        education_level: str,
        years_experience: int,
        job_title: str,
        job_tenure: float,
        practice_field: str,
        age: int,
        state: str,
        fico: int,
        dti: float,
        payment_history: float
    ) -> float:
        """
        Calculate aggregate professional risk score
        Uses MULTIPLICATIVE approach (product of all factors)
        """
        scores = [
            IRPAScoringFunctions.education_risk_score(education_level),
            IRPAScoringFunctions.years_experience_risk_score(years_experience),
            IRPAScoringFunctions.job_title_risk_score(job_title),
            IRPAScoringFunctions.job_tenure_risk_score(job_tenure),
            IRPAScoringFunctions.practice_field_risk_score(practice_field),
            IRPAScoringFunctions.age_risk_score(age),
            IRPAScoringFunctions.state_risk_score(state),
            IRPAScoringFunctions.fico_risk_score(fico)['score'],
            IRPAScoringFunctions.dti_risk_score(dti)['score'],
            IRPAScoringFunctions.payment_history_risk_score(payment_history)['score']
        ]
        
        # Multiplicative scoring - product of all factors
        professional_score = 1.0
        for score in scores:
            professional_score *= score
        
        return professional_score
    
    @staticmethod
    def calculate_operating_margin(revenue: float, operating_income: float) -> float:
        """
        Auto-calculate operating margin from revenue and operating income
        Formula: Operating Margin = (Operating Income / Revenue) * 100
        """
        if revenue == 0:
            return 0.0
        return (operating_income / revenue) * 100
    
    @staticmethod
    def format_risk_report(
        irpa_score: Dict,
        industry_factors: Dict,
        professional_factors: Dict
    ) -> Dict:
        """
        Format comprehensive risk assessment report
        """
        return {
            'summary': {
                'irpa_cci_score': irpa_score['irpa_cci_score'],
                'risk_category': irpa_score['risk_category'],
                'industry_component': irpa_score['industry_component'],
                'professional_component': irpa_score['professional_component']
            },
            'industry_breakdown': industry_factors,
            'professional_breakdown': professional_factors,
            'recommendations': IRPAScoringFunctions.generate_recommendations(
                irpa_score['risk_category'],
                industry_factors,
                professional_factors
            )
        }
    
    @staticmethod
    def generate_recommendations(
        risk_category: str,
        industry_factors: Dict,
        professional_factors: Dict
    ) -> list:
        """
        Generate risk mitigation recommendations based on assessment
        """
        recommendations = []
        
        # High-level recommendations based on category
        if risk_category in ['critical_high', 'extremely_high', 'very_high']:
            recommendations.append("Immediate risk mitigation required")
            recommendations.append("Consider additional collateral or guarantees")
            recommendations.append("Implement enhanced monitoring protocols")
        elif risk_category == 'high':
            recommendations.append("Close monitoring recommended")
            recommendations.append("Consider risk-adjusted pricing")
        elif risk_category == 'moderate':
            recommendations.append("Standard monitoring procedures")
            recommendations.append("Regular quarterly reviews")
        else:
            recommendations.append("Low risk profile - standard terms applicable")
            recommendations.append("Annual review cycle sufficient")
        
        # Specific recommendations based on weak factors
        if professional_factors.get('fico_score', 0) < 670:
            recommendations.append("Credit improvement plan recommended")
        
        if professional_factors.get('dti_ratio', 0) > 45:
            recommendations.append("Debt reduction strategy advised")
        
        if industry_factors.get('operating_margin', 0) < 10:
            recommendations.append("Profitability improvement measures needed")
        
        if industry_factors.get('company_age', 100) < 5:
            recommendations.append("Young company - enhanced due diligence required")
        
        return recommendations


# Utility functions for easy access
def calculate_irpa_cci_score(data: Dict) -> Dict:
    """
    Main entry point for IRPA CCI score calculation
    Expects a dictionary with all required fields
    """
    scoring = IRPAScoringFunctions()
    
    # Calculate industry score
    industry_score = scoring.calculate_industry_risk_score(
        industry_type=data.get('industry_type', 'Unknown'),
        operating_margin=data.get('operating_margin', 0),
        employee_count=data.get('employee_count', 0),
        company_age=data.get('company_age', 0),
        pe_ratio=data.get('pe_ratio', 0)
    )
    
    # Calculate professional score
    professional_score = scoring.calculate_professional_risk_score(
        education_level=data.get('education_level', 'Unknown'),
        years_experience=data.get('years_experience', 0),
        job_title=data.get('job_title', 'Unknown'),
        job_tenure=data.get('job_tenure', 0),
        practice_field=data.get('practice_field', 'Unknown'),
        age=data.get('age', 0),
        state=data.get('state', 'Unknown'),
        fico=data.get('fico_score', 0),
        dti=data.get('dti_ratio', 0),
        payment_history=data.get('payment_history', 0)
    )
    
    # Calculate final score
    final_score = scoring.calculate_final_irpa_score(industry_score, professional_score)
    
    # Format report
    return scoring.format_risk_report(
        final_score,
        {'industry_score': industry_score},
        {'professional_score': professional_score}
    )