"""Database models for ToluAI Insurance Risk Assessment Platform"""

from .user import User, Role
from .client import Client
from .assessment import RiskAssessment, RiskFactor, Recommendation
from .irpa import (
    IRPACompany, IndustryType, State, EducationLevel, 
    JobTitle, PracticeField, InsuredEntity
)

__all__ = [
    'User', 'Role', 'Client', 'RiskAssessment', 'RiskFactor', 'Recommendation',
    'IRPACompany', 'IndustryType', 'State', 'EducationLevel', 
    'JobTitle', 'PracticeField', 'InsuredEntity'
]