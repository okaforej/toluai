"""Test database models"""

import pytest
from datetime import datetime
from app.models import User, Role, Client, RiskAssessment, RiskFactor, Recommendation


class TestUser:
    """Test User model"""
    
    def test_user_creation(self, db_session):
        """Test user creation"""
        user = User(
            email='test@example.com',
            password='hashed_password',
            name='Test User',
            active=True
        )
        
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert user.email == 'test@example.com'
        assert user.name == 'Test User'
        assert user.active is True
        assert user.fs_uniquifier is not None
    
    def test_user_roles(self, db_session):
        """Test user role relationships"""
        # Create roles
        admin_role = Role(name='admin', description='Administrator')
        user_role = Role(name='user', description='Regular user')
        
        db_session.add(admin_role)
        db_session.add(user_role)
        db_session.flush()
        
        # Create user and assign roles
        user = User(
            email='admin@example.com',
            password='hashed_password',
            name='Admin User',
            active=True
        )
        user.roles.append(admin_role)
        user.roles.append(user_role)
        
        db_session.add(user)
        db_session.commit()
        
        assert len(user.roles) == 2
        assert user.has_role('admin')
        assert user.has_role('user')
        assert user.is_admin() is True
    
    def test_user_methods(self, regular_user):
        """Test user utility methods"""
        assert regular_user.get_full_name() == 'Regular User'
        assert regular_user.get_initials() == 'RU'
        
        user_dict = regular_user.to_dict()
        assert 'id' in user_dict
        assert 'email' in user_dict
        assert 'roles' in user_dict


class TestClient:
    """Test Client model"""
    
    def test_client_creation(self, db_session):
        """Test client creation"""
        client = Client(
            name='Test Company',
            email='test@company.com',
            industry='Technology',
            annual_revenue=500000.0,
            employee_count=25
        )
        
        db_session.add(client)
        db_session.commit()
        
        assert client.id is not None
        assert client.name == 'Test Company'
        assert client.email == 'test@company.com'
        assert client.industry == 'Technology'
    
    def test_client_categorization(self, test_client):
        """Test client categorization methods"""
        assert test_client.get_revenue_category() == 'small'  # $1M
        assert test_client.get_size_category() == 'small'  # 50 employees
    
    def test_client_address_string(self, test_client):
        """Test address string formatting"""
        address = test_client.get_address_string()
        expected = '123 Test St, Test City, TS, 12345'
        assert address == expected


class TestRiskAssessment:
    """Test RiskAssessment model"""
    
    def test_assessment_creation(self, db_session, regular_user, test_client):
        """Test risk assessment creation"""
        assessment = RiskAssessment(
            client_id=test_client.id,
            user_id=regular_user.id,
            risk_score=75.5,
            risk_category='high',
            confidence=0.9,
            model_version='1.0'
        )
        
        db_session.add(assessment)
        db_session.commit()
        
        assert assessment.id is not None
        assert assessment.risk_score == 75.5
        assert assessment.risk_category == 'high'
        assert assessment.confidence == 0.9
    
    def test_assessment_methods(self, test_assessment):
        """Test assessment utility methods"""
        assert test_assessment.get_risk_color() == 'warning'  # medium
        assert test_assessment.get_risk_percentage() == '65.0%'
        assert test_assessment.get_confidence_percentage() == '85.0%'
        
        assessment_dict = test_assessment.to_dict()
        assert 'risk_score' in assessment_dict
        assert 'risk_category' in assessment_dict


class TestRiskFactor:
    """Test RiskFactor model"""
    
    def test_factor_creation(self, db_session, test_assessment):
        """Test risk factor creation"""
        factor = RiskFactor(
            assessment_id=test_assessment.id,
            factor_name='Industry Risk',
            factor_value=0.7,
            factor_weight=0.3,
            factor_category='industry',
            severity='medium'
        )
        
        db_session.add(factor)
        db_session.commit()
        
        assert factor.id is not None
        assert factor.factor_name == 'Industry Risk'
        assert factor.get_impact_score() == 0.21  # 0.7 * 0.3
        assert factor.get_severity_color() == 'warning'


class TestRecommendation:
    """Test Recommendation model"""
    
    def test_recommendation_creation(self, db_session, test_assessment):
        """Test recommendation creation"""
        recommendation = Recommendation(
            assessment_id=test_assessment.id,
            title='Improve Safety Protocols',
            recommendation_text='Implement comprehensive safety training program',
            category='safety',
            priority='high',
            estimated_impact=0.8,
            implementation_cost='medium'
        )
        
        db_session.add(recommendation)
        db_session.commit()
        
        assert recommendation.id is not None
        assert recommendation.title == 'Improve Safety Protocols'
        assert recommendation.priority == 'high'
        assert recommendation.get_priority_color() == 'danger'
        assert recommendation.get_status_color() == 'secondary'  # pending
    
    def test_recommendation_overdue(self, db_session, test_assessment):
        """Test overdue recommendation detection"""
        from datetime import date, timedelta
        
        recommendation = Recommendation(
            assessment_id=test_assessment.id,
            recommendation_text='Test recommendation',
            priority='medium',
            due_date=date.today() - timedelta(days=1)  # Yesterday
        )
        
        db_session.add(recommendation)
        db_session.commit()
        
        assert recommendation.is_overdue() is True