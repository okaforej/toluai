import os
import pickle
import numpy as np
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_model():
    """Load the risk assessment model"""
    from flask import current_app
    model_path = current_app.config['DEFAULT_MODEL']
    
    try:
        if os.path.exists(model_path):
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
            return model
        else:
            logger.warning(f"Model file not found at {model_path}. Using fallback model.")
            return FallbackRiskModel()
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return FallbackRiskModel()

class FallbackRiskModel:
    """Simple fallback model for when the trained model is unavailable"""
    def predict(self, features):
        # Simple logic based on industry and revenue
        industry_risk = {
            'healthcare': 0.7,
            'finance': 0.8,
            'technology': 0.5,
            'manufacturing': 0.6,
            'retail': 0.4,
            'construction': 0.75,
            'transportation': 0.65
        }
        
        base_risk = industry_risk.get(features.get('industry', '').lower(), 0.5)
        
        # Adjust for company size
        revenue = features.get('annual_revenue', 0)
        if revenue > 10000000:  # Large company
            base_risk *= 0.9  # Lower risk for established companies
        elif revenue < 1000000:  # Small company
            base_risk *= 1.2  # Higher risk for small companies
            
        # Ensure risk is between 0 and 1
        return max(0, min(1, base_risk))

def assess_risk(client, additional_data=None):
    """Assess risk for a client using the AI model"""
    try:
        # Extract features from client data
        features = extract_features(client, additional_data)
        
        # Load the model
        model = load_model()
        
        # Make prediction
        risk_score = model.predict(features)
        
        # Convert to percentage
        risk_score_pct = float(risk_score * 100)
        
        # Determine risk category
        if risk_score_pct < 30:
            category = 'low'
        elif risk_score_pct < 60:
            category = 'medium'
        elif risk_score_pct < 80:
            category = 'high'
        else:
            category = 'critical'
            
        # Generate risk factors
        factors = generate_risk_factors(features, risk_score)
        
        # Generate recommendations
        recommendations = generate_recommendations(factors, category)
        
        return {
            'risk_score': risk_score_pct,
            'risk_category': category,
            'confidence': 0.85,  # Placeholder for model confidence
            'factors': factors,
            'recommendations': recommendations,
            'metadata': {
                'model_version': '1.0',
                'assessment_timestamp': datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Risk assessment error: {str(e)}")
        raise

def extract_features(client, additional_data=None):
    """Extract features from client data for risk assessment"""
    features = {
        'industry': client.industry,
        'annual_revenue': client.annual_revenue,
        'employee_count': client.employee_count,
        'years_in_business': 5,  # Placeholder, would come from client data
    }
    
    # Add additional data if provided
    if additional_data:
        features.update(additional_data)
        
    return features

def generate_risk_factors(features, risk_score):
    """Generate risk factors based on client features and model output"""
    factors = [
        {
            'name': 'Industry Risk',
            'value': 0.7,
            'weight': 0.3,
            'category': 'industry',
            'description': f"Risk associated with the {features.get('industry', 'unknown')} industry"
        },
        {
            'name': 'Financial Stability',
            'value': 0.5,
            'weight': 0.4,
            'category': 'financial',
            'description': "Based on annual revenue and financial indicators"
        },
        {
            'name': 'Operational Risk',
            'value': 0.6,
            'weight': 0.3,
            'category': 'operational',
            'description': "Risk associated with business operations and processes"
        }
    ]
    
    return factors

def generate_recommendations(factors, risk_category):
    """Generate recommendations based on risk factors and category"""
    recommendations = []
    
    # Add general recommendations based on risk category
    if risk_category in ['high', 'critical']:
        recommendations.append({
            'text': 'Implement comprehensive risk management program',
            'priority': 'high',
            'impact': 0.8,
            'cost': 'high'
        })
        recommendations.append({
            'text': 'Conduct quarterly risk assessments',
            'priority': 'medium',
            'impact': 0.6,
            'cost': 'medium'
        })
    
    if risk_category in ['medium', 'high', 'critical']:
        recommendations.append({
            'text': 'Review and update emergency response procedures',
            'priority': 'medium',
            'impact': 0.5,
            'cost': 'low'
        })
    
    # Add basic recommendation for all risk levels
    recommendations.append({
        'text': 'Maintain regular staff training on risk awareness',
        'priority': 'low',
        'impact': 0.4,
        'cost': 'low'
    })
    
    return recommendations