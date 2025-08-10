"""Dashboard and main application API routes"""

from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import User, Client, RiskAssessment, IRPACompany, InsuredEntity
from backend.app import db
from sqlalchemy import func, text, desc
from datetime import datetime, timedelta


def register_dashboard_routes(bp):
    """Register dashboard routes with a blueprint"""
    
    @bp.route('/dashboard/stats', methods=['GET'])
    @jwt_required()
    def get_dashboard_stats():
        """Get dashboard statistics"""
        current_user_id = get_jwt_identity()
        
        # Basic statistics
        stats = {
            'total_clients': Client.query.count(),
            'total_assessments': RiskAssessment.query.count(),
            'total_companies': IRPACompany.query.count(),
            'total_insured': InsuredEntity.query.count(),
            'high_risk_clients': Client.query.join(RiskAssessment).filter(
                RiskAssessment.risk_category.in_(['high', 'critical'])
            ).distinct().count()
        }
        
        # User's assessments this month
        this_month = datetime.now().replace(day=1)
        stats['monthly_assessments'] = RiskAssessment.query.filter(
            RiskAssessment.user_id == current_user_id,
            RiskAssessment.assessment_date >= this_month
        ).count()
        
        return jsonify(stats), 200
    
    
    @bp.route('/dashboard/recent', methods=['GET'])
    @jwt_required()
    def get_recent_activity():
        """Get recent activity for dashboard"""
        
        # Recent clients (last 10)
        recent_clients = Client.query.order_by(
            Client.created_at.desc()
        ).limit(10).all()
        
        # Recent assessments (last 10)
        recent_assessments = RiskAssessment.query.join(Client).order_by(
            RiskAssessment.assessment_date.desc()
        ).limit(10).all()
        
        # Recent insured entities
        recent_insured = InsuredEntity.query.order_by(
            InsuredEntity.created_at.desc()
        ).limit(10).all()
        
        return jsonify({
            'recent_clients': [c.to_dict() for c in recent_clients],
            'recent_assessments': [{
                'id': a.id,
                'client_name': a.client.name,
                'risk_score': a.risk_score,
                'risk_category': a.risk_category,
                'assessment_date': a.assessment_date.isoformat()
            } for a in recent_assessments],
            'recent_insured': [i.to_dict() for i in recent_insured]
        }), 200
    
    
    @bp.route('/dashboard/charts', methods=['GET'])
    @jwt_required()
    def get_dashboard_charts():
        """Get chart data for dashboard"""
        
        # Risk distribution
        risk_distribution = db.session.query(
            RiskAssessment.risk_category,
            func.count(RiskAssessment.id).label('count')
        ).group_by(RiskAssessment.risk_category).all()
        
        # Assessment trend (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        assessment_trend = db.session.query(
            func.date(RiskAssessment.assessment_date).label('date'),
            func.count(RiskAssessment.id).label('count')
        ).filter(
            RiskAssessment.assessment_date >= thirty_days_ago
        ).group_by(
            func.date(RiskAssessment.assessment_date)
        ).order_by(func.date(RiskAssessment.assessment_date)).all()
        
        # Industry distribution
        industry_distribution = db.session.query(
            IRPACompany.industry_type,
            func.count(IRPACompany.id).label('count')
        ).group_by(IRPACompany.industry_type).all()
        
        return jsonify({
            'risk_distribution': [
                {'category': cat, 'count': count} 
                for cat, count in risk_distribution
            ],
            'assessment_trend': [
                {'date': date.isoformat(), 'count': count}
                for date, count in assessment_trend
            ],
            'industry_distribution': [
                {'industry': ind or 'Unknown', 'count': count}
                for ind, count in industry_distribution
            ]
        }), 200
    
    
    @bp.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        try:
            # Test database connection
            db.session.execute(text('SELECT 1'))
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'database': 'connected'
            }), 200
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }), 503