"""
Enhanced Risk Assessment Model using Machine Learning
This module demonstrates advanced AI capabilities for insurance risk assessment
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
import joblib
import logging

# ML Libraries
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import roc_auc_score, mean_squared_error, classification_report
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)


@dataclass
class RiskPrediction:
    """Container for risk prediction results"""
    risk_score: float
    risk_category: str
    claim_probability: float
    expected_loss: float
    confidence: float
    key_factors: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]
    explanation: str


class EnhancedRiskAssessmentModel:
    """
    Advanced ML-based risk assessment model that combines multiple algorithms
    for comprehensive risk evaluation
    """
    
    def __init__(self, model_version: str = "2.0"):
        self.model_version = model_version
        self.claim_predictor = None
        self.loss_estimator = None
        self.scaler = StandardScaler()
        self.feature_encoders = {}
        self.feature_importance = {}
        self.is_trained = False
        
    def prepare_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Feature engineering for risk assessment
        
        Args:
            data: Raw client data
            
        Returns:
            Engineered features DataFrame
        """
        features = pd.DataFrame()
        
        # Industry risk features
        features['industry_risk_score'] = self._encode_industry_risk(data['industry'])
        features['company_age_years'] = (datetime.now().year - pd.to_datetime(data['established_date']).dt.year)
        features['log_revenue'] = np.log1p(data['annual_revenue'])
        features['employee_per_million_revenue'] = data['employee_count'] / (data['annual_revenue'] / 1e6)
        
        # Professional risk features
        features['education_score'] = self._encode_education(data['education_level'])
        features['experience_years'] = data['years_experience']
        features['job_stability'] = data['years_current_position'] / data['years_experience'].clip(lower=1)
        features['professional_certification'] = data['has_certification'].astype(int)
        
        # Financial risk features
        features['fico_normalized'] = data['fico_score'] / 850
        features['dti_ratio'] = data['debt_to_income']
        features['payment_reliability'] = data['on_time_payments'] / data['total_payments'].clip(lower=1)
        features['bankruptcy_flag'] = data['has_bankruptcy'].astype(int)
        
        # External risk features
        features['cyber_incidents_last_year'] = data['cyber_incidents_count']
        features['regulatory_violations'] = data['regulatory_violations_count']
        features['market_volatility'] = self._calculate_market_volatility(data['industry'])
        features['geographic_risk'] = self._encode_geographic_risk(data['state'])
        
        # Interaction features
        features['size_age_interaction'] = features['log_revenue'] * features['company_age_years']
        features['education_experience_interaction'] = features['education_score'] * features['experience_years']
        features['financial_stability'] = features['fico_normalized'] * (1 - features['dti_ratio'].clip(upper=1))
        
        # Temporal features
        features['days_since_last_claim'] = (datetime.now() - pd.to_datetime(data['last_claim_date'])).dt.days.fillna(9999)
        features['claim_frequency'] = data['total_claims'] / features['company_age_years'].clip(lower=1)
        features['seasonal_risk'] = self._calculate_seasonal_risk(datetime.now().month)
        
        return features
    
    def train(self, training_data: pd.DataFrame, labels: pd.Series) -> Dict[str, float]:
        """
        Train the enhanced risk assessment model
        
        Args:
            training_data: Historical client data
            labels: Target variables (claims, losses)
            
        Returns:
            Training metrics
        """
        logger.info(f"Training enhanced risk model v{self.model_version}")
        
        # Prepare features
        X = self.prepare_features(training_data)
        y_claim = labels['has_claim']
        y_loss = labels['loss_amount']
        
        # Split data
        X_train, X_test, y_claim_train, y_claim_test, y_loss_train, y_loss_test = train_test_split(
            X, y_claim, y_loss, test_size=0.2, random_state=42, stratify=y_claim
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train claim prediction model (Random Forest)
        self.claim_predictor = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=20,
            random_state=42,
            n_jobs=-1
        )
        self.claim_predictor.fit(X_train_scaled, y_claim_train)
        
        # Train loss estimation model (Gradient Boosting)
        self.loss_estimator = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        self.loss_estimator.fit(X_train_scaled[y_claim_train == 1], y_loss_train[y_claim_train == 1])
        
        # Calculate feature importance
        self.feature_importance = dict(zip(
            X.columns,
            self.claim_predictor.feature_importances_
        ))
        
        # Evaluate models
        claim_pred_proba = self.claim_predictor.predict_proba(X_test_scaled)[:, 1]
        claim_auc = roc_auc_score(y_claim_test, claim_pred_proba)
        
        loss_mask = y_claim_test == 1
        if loss_mask.sum() > 0:
            loss_pred = self.loss_estimator.predict(X_test_scaled[loss_mask])
            loss_rmse = np.sqrt(mean_squared_error(y_loss_test[loss_mask], loss_pred))
        else:
            loss_rmse = 0
        
        self.is_trained = True
        
        metrics = {
            'claim_auc': claim_auc,
            'loss_rmse': loss_rmse,
            'feature_count': len(X.columns),
            'training_samples': len(X_train)
        }
        
        logger.info(f"Model training completed. Claim AUC: {claim_auc:.3f}, Loss RMSE: ${loss_rmse:,.2f}")
        
        return metrics
    
    def predict(self, client_data: Dict[str, Any]) -> RiskPrediction:
        """
        Generate comprehensive risk prediction for a client
        
        Args:
            client_data: Client information dictionary
            
        Returns:
            RiskPrediction object with scores and recommendations
        """
        if not self.is_trained:
            # Use fallback heuristic model if ML model not trained
            return self._fallback_prediction(client_data)
        
        # Convert to DataFrame for processing
        df = pd.DataFrame([client_data])
        features = self.prepare_features(df)
        features_scaled = self.scaler.transform(features)
        
        # Get predictions
        claim_probability = self.claim_predictor.predict_proba(features_scaled)[0, 1]
        expected_loss = self.loss_estimator.predict(features_scaled)[0] if claim_probability > 0.3 else 0
        
        # Calculate composite risk score (0-100)
        risk_score = self._calculate_risk_score(claim_probability, expected_loss, client_data)
        
        # Determine risk category
        risk_category = self._categorize_risk(risk_score)
        
        # Calculate confidence based on data completeness and model certainty
        confidence = self._calculate_confidence(client_data, claim_probability)
        
        # Identify key risk factors
        key_factors = self._identify_key_factors(features, features_scaled[0])
        
        # Generate recommendations
        recommendations = self._generate_recommendations(risk_category, key_factors, client_data)
        
        # Create explanation
        explanation = self._generate_explanation(risk_score, claim_probability, key_factors)
        
        return RiskPrediction(
            risk_score=risk_score,
            risk_category=risk_category,
            claim_probability=claim_probability,
            expected_loss=expected_loss,
            confidence=confidence,
            key_factors=key_factors,
            recommendations=recommendations,
            explanation=explanation
        )
    
    def _calculate_risk_score(self, claim_prob: float, expected_loss: float, client_data: Dict) -> float:
        """Calculate composite risk score from multiple factors"""
        # Base score from claim probability (0-50 points)
        base_score = claim_prob * 50
        
        # Loss severity adjustment (0-30 points)
        loss_severity = min(expected_loss / 100000, 1) * 30  # Normalize to $100k max
        
        # External factors (0-20 points)
        external_score = 0
        if client_data.get('cyber_incidents_count', 0) > 0:
            external_score += 7
        if client_data.get('regulatory_violations_count', 0) > 0:
            external_score += 7
        if client_data.get('has_bankruptcy', False):
            external_score += 6
        
        total_score = base_score + loss_severity + external_score
        
        return min(max(total_score, 0), 100)  # Clamp to 0-100
    
    def _categorize_risk(self, risk_score: float) -> str:
        """Categorize risk based on score"""
        if risk_score < 25:
            return 'low'
        elif risk_score < 50:
            return 'medium'
        elif risk_score < 75:
            return 'high'
        else:
            return 'critical'
    
    def _calculate_confidence(self, client_data: Dict, claim_prob: float) -> float:
        """Calculate prediction confidence"""
        # Data completeness (50% weight)
        required_fields = ['annual_revenue', 'employee_count', 'fico_score', 'industry']
        data_completeness = sum(1 for f in required_fields if client_data.get(f)) / len(required_fields)
        
        # Model certainty (50% weight) - distance from 0.5 probability
        model_certainty = abs(claim_prob - 0.5) * 2
        
        confidence = (data_completeness * 0.5 + model_certainty * 0.5)
        
        return min(max(confidence, 0.1), 0.95)  # Never claim 100% confidence
    
    def _identify_key_factors(self, features: pd.DataFrame, feature_values: np.ndarray) -> List[Dict]:
        """Identify the most important risk factors for this prediction"""
        if not self.feature_importance:
            return []
        
        # Sort features by importance
        sorted_features = sorted(self.feature_importance.items(), key=lambda x: x[1], reverse=True)
        
        key_factors = []
        for feature_name, importance in sorted_features[:5]:  # Top 5 factors
            if feature_name in features.columns:
                idx = features.columns.get_loc(feature_name)
                value = feature_values[idx]
                
                # Determine if this factor increases or decreases risk
                impact = 'increases' if value > features[feature_name].median() else 'decreases'
                
                key_factors.append({
                    'name': self._humanize_feature_name(feature_name),
                    'value': float(value),
                    'importance': float(importance),
                    'impact': impact,
                    'description': self._describe_factor(feature_name, value)
                })
        
        return key_factors
    
    def _generate_recommendations(self, risk_category: str, key_factors: List[Dict], client_data: Dict) -> List[Dict]:
        """Generate actionable recommendations based on risk assessment"""
        recommendations = []
        
        # High-level recommendations based on risk category
        if risk_category in ['high', 'critical']:
            recommendations.append({
                'priority': 'high',
                'action': 'Implement comprehensive risk management program',
                'impact': 'Could reduce risk score by 15-20 points',
                'cost': 'medium',
                'timeframe': '3-6 months'
            })
        
        # Factor-specific recommendations
        for factor in key_factors[:3]:  # Top 3 factors
            if 'cyber' in factor['name'].lower():
                recommendations.append({
                    'priority': 'high',
                    'action': 'Enhance cybersecurity measures and incident response plan',
                    'impact': 'Reduce cyber incident risk by 40%',
                    'cost': 'medium',
                    'timeframe': '2-3 months'
                })
            elif 'financial' in factor['name'].lower():
                recommendations.append({
                    'priority': 'medium',
                    'action': 'Improve financial stability through debt reduction',
                    'impact': 'Improve financial risk score by 10 points',
                    'cost': 'low',
                    'timeframe': '6-12 months'
                })
            elif 'experience' in factor['name'].lower():
                recommendations.append({
                    'priority': 'medium',
                    'action': 'Invest in professional development and training',
                    'impact': 'Enhance professional risk profile',
                    'cost': 'low',
                    'timeframe': '3-6 months'
                })
        
        # Always include monitoring recommendation
        recommendations.append({
            'priority': 'low',
            'action': 'Set up continuous risk monitoring and quarterly assessments',
            'impact': 'Early detection of risk changes',
            'cost': 'low',
            'timeframe': '1 month'
        })
        
        return recommendations
    
    def _generate_explanation(self, risk_score: float, claim_prob: float, key_factors: List[Dict]) -> str:
        """Generate human-readable explanation of the risk assessment"""
        explanation = f"Based on our AI analysis, this client has a risk score of {risk_score:.1f}/100, "
        explanation += f"with a {claim_prob*100:.1f}% probability of filing a claim in the next 12 months. "
        
        if key_factors:
            top_factor = key_factors[0]
            explanation += f"The primary risk driver is {top_factor['name'].lower()}, "
            explanation += f"which {top_factor['impact']} the overall risk. "
        
        if risk_score > 50:
            explanation += "We recommend immediate risk mitigation measures to reduce exposure."
        else:
            explanation += "The risk level is manageable with standard monitoring procedures."
        
        return explanation
    
    def _fallback_prediction(self, client_data: Dict) -> RiskPrediction:
        """Fallback heuristic prediction when ML model is not available"""
        # Simple rule-based scoring
        risk_score = 50.0  # Base score
        
        # Adjust based on available data
        if client_data.get('annual_revenue', 0) < 1000000:
            risk_score += 10
        if client_data.get('fico_score', 700) < 650:
            risk_score += 15
        if client_data.get('cyber_incidents_count', 0) > 0:
            risk_score += 20
        
        risk_category = self._categorize_risk(risk_score)
        
        return RiskPrediction(
            risk_score=risk_score,
            risk_category=risk_category,
            claim_probability=risk_score / 100,
            expected_loss=risk_score * 1000,
            confidence=0.5,
            key_factors=[],
            recommendations=[{
                'priority': 'medium',
                'action': 'Complete full risk assessment with all required data',
                'impact': 'Enable accurate AI-based risk scoring',
                'cost': 'low',
                'timeframe': 'immediate'
            }],
            explanation="Using simplified risk assessment. Complete data required for full AI analysis."
        )
    
    # Helper methods for feature encoding
    def _encode_industry_risk(self, industry: pd.Series) -> pd.Series:
        """Encode industry into risk score"""
        industry_risk_map = {
            'healthcare': 0.7,
            'finance': 0.8,
            'technology': 0.5,
            'manufacturing': 0.6,
            'retail': 0.4,
            'construction': 0.75,
            'transportation': 0.65,
            'education': 0.3,
            'government': 0.2
        }
        return industry.map(industry_risk_map).fillna(0.5)
    
    def _encode_education(self, education: pd.Series) -> pd.Series:
        """Encode education level into numerical score"""
        education_map = {
            'high_school': 1,
            'associate': 2,
            'bachelor': 3,
            'master': 4,
            'doctorate': 5,
            'professional': 4
        }
        return education.map(education_map).fillna(2)
    
    def _encode_geographic_risk(self, state: pd.Series) -> pd.Series:
        """Encode state into geographic risk score"""
        # Simplified - in production, use actual state risk data
        high_risk_states = ['CA', 'FL', 'TX', 'NY']
        return state.apply(lambda x: 0.8 if x in high_risk_states else 0.5)
    
    def _calculate_market_volatility(self, industry: pd.Series) -> pd.Series:
        """Calculate market volatility for industry"""
        # Simplified - in production, integrate with market data APIs
        volatile_industries = ['technology', 'finance', 'energy']
        return industry.apply(lambda x: 0.7 if x in volatile_industries else 0.4)
    
    def _calculate_seasonal_risk(self, month: int) -> float:
        """Calculate seasonal risk adjustment"""
        # Higher risk in Q4 (October-December)
        if month in [10, 11, 12]:
            return 0.6
        # Lower risk in Q2 (April-June)
        elif month in [4, 5, 6]:
            return 0.3
        else:
            return 0.45
    
    def _humanize_feature_name(self, feature_name: str) -> str:
        """Convert feature name to human-readable format"""
        replacements = {
            'log_revenue': 'Company Revenue',
            'fico_normalized': 'Credit Score',
            'dti_ratio': 'Debt-to-Income Ratio',
            'education_score': 'Education Level',
            'cyber_incidents_last_year': 'Recent Cyber Incidents',
            'financial_stability': 'Financial Stability',
            'claim_frequency': 'Historical Claim Frequency'
        }
        return replacements.get(feature_name, feature_name.replace('_', ' ').title())
    
    def _describe_factor(self, feature_name: str, value: float) -> str:
        """Generate description for a risk factor"""
        descriptions = {
            'log_revenue': f"Company revenue indicator: {np.exp(value):,.0f}",
            'fico_normalized': f"Credit score percentile: {value*100:.1f}%",
            'cyber_incidents_last_year': f"{int(value)} cyber incidents in past year",
            'claim_frequency': f"Claims occur every {1/max(value, 0.01):.1f} years on average"
        }
        return descriptions.get(feature_name, f"Risk factor value: {value:.2f}")
    
    def save_model(self, filepath: str):
        """Save trained model to disk"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        model_data = {
            'version': self.model_version,
            'claim_predictor': self.claim_predictor,
            'loss_estimator': self.loss_estimator,
            'scaler': self.scaler,
            'feature_importance': self.feature_importance,
            'timestamp': datetime.now().isoformat()
        }
        
        joblib.dump(model_data, filepath)
        logger.info(f"Model saved to {filepath}")
    
    def load_model(self, filepath: str):
        """Load trained model from disk"""
        model_data = joblib.load(filepath)
        
        self.model_version = model_data['version']
        self.claim_predictor = model_data['claim_predictor']
        self.loss_estimator = model_data['loss_estimator']
        self.scaler = model_data['scaler']
        self.feature_importance = model_data['feature_importance']
        self.is_trained = True
        
        logger.info(f"Model v{self.model_version} loaded from {filepath}")


# Example usage and integration
if __name__ == "__main__":
    # Initialize model
    model = EnhancedRiskAssessmentModel()
    
    # Example client data
    client_example = {
        'industry': 'technology',
        'established_date': '2015-01-01',
        'annual_revenue': 5000000,
        'employee_count': 50,
        'education_level': 'master',
        'years_experience': 10,
        'years_current_position': 3,
        'has_certification': True,
        'fico_score': 720,
        'debt_to_income': 0.3,
        'on_time_payments': 95,
        'total_payments': 100,
        'has_bankruptcy': False,
        'cyber_incidents_count': 1,
        'regulatory_violations_count': 0,
        'state': 'CA',
        'last_claim_date': '2020-01-01',
        'total_claims': 2
    }
    
    # Get prediction (will use fallback since model not trained)
    prediction = model.predict(client_example)
    
    print(f"Risk Score: {prediction.risk_score:.1f}/100")
    print(f"Risk Category: {prediction.risk_category}")
    print(f"Claim Probability: {prediction.claim_probability*100:.1f}%")
    print(f"Expected Loss: ${prediction.expected_loss:,.2f}")
    print(f"Confidence: {prediction.confidence*100:.1f}%")
    print(f"\nExplanation: {prediction.explanation}")
    print(f"\nTop Recommendations:")
    for rec in prediction.recommendations[:3]:
        print(f"  - {rec['action']} (Priority: {rec['priority']})")