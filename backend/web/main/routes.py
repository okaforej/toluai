"""Main application routes"""

from flask import render_template, redirect, url_for, flash, current_app
from flask_security import login_required, current_user
from . import main_bp
from backend.app import db
from backend.models import User, Client, RiskAssessment
from sqlalchemy import func, text


@main_bp.route('/')
def index():
    """Landing page"""
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return render_template('main/index.html')


@main_bp.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard for authenticated users"""
    
    # Get dashboard statistics
    stats = {}
    
    # Total clients
    stats['total_clients'] = Client.query.count()
    
    # Recent assessments
    stats['recent_assessments'] = RiskAssessment.query.count()
    
    # High risk clients
    stats['high_risk_clients'] = Client.query.join(RiskAssessment).filter(
        RiskAssessment.risk_category.in_(['high', 'critical'])
    ).distinct().count()
    
    # User's assessments this month
    from datetime import datetime, timedelta
    this_month = datetime.now().replace(day=1)
    stats['monthly_assessments'] = RiskAssessment.query.filter(
        RiskAssessment.user_id == current_user.id,
        RiskAssessment.assessment_date >= this_month
    ).count()
    
    # Recent clients (last 10)
    recent_clients = Client.query.order_by(Client.created_at.desc()).limit(10).all()
    
    # Recent assessments (last 10)
    recent_assessments = RiskAssessment.query.join(Client).order_by(
        RiskAssessment.assessment_date.desc()
    ).limit(10).all()
    
    # Risk distribution chart data
    risk_distribution = db.session.query(
        RiskAssessment.risk_category,
        func.count(RiskAssessment.id).label('count')
    ).group_by(RiskAssessment.risk_category).all()
    
    return render_template(
        'main/dashboard.html',
        stats=stats,
        recent_clients=recent_clients,
        recent_assessments=recent_assessments,
        risk_distribution=risk_distribution
    )


@main_bp.route('/profile')
@login_required
def profile():
    """User profile page"""
    return render_template('main/profile.html')


@main_bp.route('/about')
def about():
    """About page"""
    return render_template('main/about.html')


@main_bp.route('/pricing')
def pricing():
    """Pricing page"""
    return render_template('main/pricing.html')


@main_bp.route('/contact')
def contact():
    """Contact page"""
    return render_template('main/contact.html')


@main_bp.route('/health')
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test database connection
        db.session.execute(text('SELECT 1'))
        return {'status': 'healthy', 'database': 'connected'}, 200
    except Exception as e:
        current_app.logger.error(f'Health check failed: {str(e)}')
        return {'status': 'unhealthy', 'error': str(e)}, 503