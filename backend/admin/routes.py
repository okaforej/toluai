"""Admin routes for user and system management"""

from flask import render_template, redirect, url_for, flash, request, jsonify, current_app
from flask_security import login_required, roles_required, current_user
from . import admin_bp
from backend.app import db, security
from backend.models import User, Role, Client, RiskAssessment
from sqlalchemy import func, desc
from datetime import datetime, timedelta


@admin_bp.before_request
@login_required
@roles_required('admin')
def require_admin():
    """Ensure all admin routes require admin role"""
    pass


@admin_bp.route('/')
def index():
    """Admin dashboard"""
    
    # System statistics
    stats = {
        'total_users': User.query.count(),
        'total_clients': Client.query.count(),
        'total_assessments': RiskAssessment.query.count(),
        'active_users': User.query.filter_by(active=True).count()
    }
    
    # Recent activity
    recent_users = User.query.order_by(desc(User.created_at)).limit(5).all()
    recent_assessments = RiskAssessment.query.order_by(desc(RiskAssessment.assessment_date)).limit(5).all()
    
    # User registration trend (last 30 days)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    user_trend = db.session.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).filter(User.created_at >= thirty_days_ago).group_by(
        func.date(User.created_at)
    ).order_by(func.date(User.created_at)).all()
    
    # Risk assessment trend
    assessment_trend = db.session.query(
        func.date(RiskAssessment.assessment_date).label('date'),
        func.count(RiskAssessment.id).label('count')
    ).filter(RiskAssessment.assessment_date >= thirty_days_ago).group_by(
        func.date(RiskAssessment.assessment_date)
    ).order_by(func.date(RiskAssessment.assessment_date)).all()
    
    return render_template(
        'admin/dashboard.html',
        stats=stats,
        recent_users=recent_users,
        recent_assessments=recent_assessments,
        user_trend=user_trend,
        assessment_trend=assessment_trend
    )


@admin_bp.route('/users')
def users():
    """User management page"""
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '')
    role_filter = request.args.get('role', '')
    status_filter = request.args.get('status', '')
    
    query = User.query
    
    if search:
        query = query.filter(
            db.or_(
                User.name.contains(search),
                User.email.contains(search)
            )
        )
    
    if role_filter:
        query = query.join(User.roles).filter(Role.name == role_filter)
    
    if status_filter:
        if status_filter == 'active':
            query = query.filter_by(active=True)
        elif status_filter == 'inactive':
            query = query.filter_by(active=False)
    
    users = query.order_by(desc(User.created_at)).paginate(
        page=page,
        per_page=current_app.config['ITEMS_PER_PAGE'],
        error_out=False
    )
    
    roles = Role.query.all()
    
    return render_template(
        'admin/users.html',
        users=users,
        roles=roles,
        search=search,
        role_filter=role_filter,
        status_filter=status_filter
    )


@admin_bp.route('/users/<int:user_id>')
def user_detail(user_id):
    """User detail page"""
    user = User.query.get_or_404(user_id)
    
    # Get user's assessments
    assessments = RiskAssessment.query.filter_by(user_id=user_id).order_by(
        desc(RiskAssessment.assessment_date)
    ).limit(10).all()
    
    # User statistics
    user_stats = {
        'total_assessments': RiskAssessment.query.filter_by(user_id=user_id).count(),
        'last_login': user.current_login_at or user.last_login_at,
        'login_count': user.login_count
    }
    
    return render_template(
        'admin/user_detail.html',
        user=user,
        assessments=assessments,
        user_stats=user_stats
    )


@admin_bp.route('/users/<int:user_id>/toggle-status', methods=['POST'])
def toggle_user_status(user_id):
    """Toggle user active status"""
    user = User.query.get_or_404(user_id)
    
    if user.id == current_user.id:
        flash('You cannot deactivate your own account.', 'error')
        return redirect(url_for('admin.user_detail', user_id=user_id))
    
    user.active = not user.active
    db.session.commit()
    
    status = 'activated' if user.active else 'deactivated'
    flash(f'User {user.email} has been {status}.', 'success')
    
    return redirect(url_for('admin.user_detail', user_id=user_id))


@admin_bp.route('/users/<int:user_id>/add-role', methods=['POST'])
def add_user_role(user_id):
    """Add role to user"""
    user = User.query.get_or_404(user_id)
    role_name = request.form.get('role')
    
    if not role_name:
        flash('Please select a role.', 'error')
        return redirect(url_for('admin.user_detail', user_id=user_id))
    
    role = Role.query.filter_by(name=role_name).first()
    if not role:
        flash('Invalid role selected.', 'error')
        return redirect(url_for('admin.user_detail', user_id=user_id))
    
    if role not in user.roles:
        user.roles.append(role)
        db.session.commit()
        flash(f'Role "{role.name}" added to user.', 'success')
    else:
        flash(f'User already has the "{role.name}" role.', 'warning')
    
    return redirect(url_for('admin.user_detail', user_id=user_id))


@admin_bp.route('/users/<int:user_id>/remove-role/<int:role_id>', methods=['POST'])
def remove_user_role(user_id, role_id):
    """Remove role from user"""
    user = User.query.get_or_404(user_id)
    role = Role.query.get_or_404(role_id)
    
    if role.name == 'admin' and user.id == current_user.id:
        flash('You cannot remove the admin role from your own account.', 'error')
        return redirect(url_for('admin.user_detail', user_id=user_id))
    
    if role in user.roles:
        user.roles.remove(role)
        db.session.commit()
        flash(f'Role "{role.name}" removed from user.', 'success')
    else:
        flash(f'User does not have the "{role.name}" role.', 'warning')
    
    return redirect(url_for('admin.user_detail', user_id=user_id))


@admin_bp.route('/system-info')
def system_info():
    """System information page"""
    import sys
    import platform
    from flask import __version__ as flask_version
    from sqlalchemy import __version__ as sqlalchemy_version
    
    system_info = {
        'python_version': sys.version,
        'platform': platform.platform(),
        'flask_version': flask_version,
        'sqlalchemy_version': sqlalchemy_version,
        'application_name': current_app.config['APP_NAME']
    }
    
    # Database statistics
    db_stats = {
        'users': User.query.count(),
        'clients': Client.query.count(),
        'assessments': RiskAssessment.query.count()
    }
    
    return render_template(
        'admin/system_info.html',
        system_info=system_info,
        db_stats=db_stats
    )


@admin_bp.route('/api/stats')
def api_stats():
    """API endpoint for dashboard statistics"""
    stats = {
        'users': {
            'total': User.query.count(),
            'active': User.query.filter_by(active=True).count(),
            'new_this_month': User.query.filter(
                User.created_at >= datetime.now().replace(day=1)
            ).count()
        },
        'clients': {
            'total': Client.query.count(),
            'prospects': Client.query.filter_by(client_type='prospect').count(),
            'customers': Client.query.filter_by(client_type='customer').count()
        },
        'assessments': {
            'total': RiskAssessment.query.count(),
            'this_month': RiskAssessment.query.filter(
                RiskAssessment.assessment_date >= datetime.now().replace(day=1)
            ).count()
        }
    }
    
    return jsonify(stats)