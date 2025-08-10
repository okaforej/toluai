"""Risk assessment routes"""

from flask import render_template, redirect, url_for, flash, request, jsonify, current_app
from flask_security import login_required, current_user
from backend.web.assessment import assessment_bp
from backend.web.assessment.forms import AssessmentForm, QuickAssessmentForm, AssessmentSearchForm, RecommendationForm
from backend.models import Client, RiskAssessment, RiskFactor, Recommendation, User
from backend.ai.risk_engine import assess_risk
from backend.app import db
from sqlalchemy import desc, or_
from datetime import datetime


@assessment_bp.route('/')
@assessment_bp.route('/list')
@login_required
def list():
    """Display paginated list of risk assessments"""
    page = request.args.get('page', 1, type=int)
    client_id = request.args.get('client', 0, type=int)
    risk_category = request.args.get('risk_category', '')
    assessment_type = request.args.get('assessment_type', '')
    status = request.args.get('status', '')
    
    form = AssessmentSearchForm(request.args)
    
    # Build query
    query = RiskAssessment.query.join(Client)
    
    if client_id and client_id > 0:
        query = query.filter(RiskAssessment.client_id == client_id)
    
    if risk_category:
        query = query.filter(RiskAssessment.risk_category == risk_category)
    
    if assessment_type:
        query = query.filter(RiskAssessment.assessment_type == assessment_type)
    
    if status:
        query = query.filter(RiskAssessment.status == status)
    
    # Pagination
    assessments = query.order_by(desc(RiskAssessment.assessment_date)).paginate(
        page=page,
        per_page=current_app.config['ITEMS_PER_PAGE'],
        error_out=False
    )
    
    return render_template('assessment/list.html', 
                         assessments=assessments,
                         form=form)


@assessment_bp.route('/<int:assessment_id>')
@login_required
def view(assessment_id):
    """View detailed assessment information"""
    assessment = RiskAssessment.query.get_or_404(assessment_id)
    
    # Get factors and recommendations
    factors = RiskFactor.query.filter_by(assessment_id=assessment_id).all()
    recommendations = Recommendation.query.filter_by(assessment_id=assessment_id).all()
    
    return render_template('assessment/view.html',
                         assessment=assessment,
                         factors=factors,
                         recommendations=recommendations)


@assessment_bp.route('/create', methods=['GET', 'POST'])
@login_required
def create():
    """Create a new risk assessment"""
    form = AssessmentForm()
    
    if form.validate_on_submit():
        try:
            client = Client.query.get_or_404(form.client_id.data)
            
            # Run AI risk assessment
            risk_result = assess_risk(client)
            
            # Create assessment record
            assessment = RiskAssessment(
                client_id=client.id,
                user_id=current_user.id,
                risk_score=risk_result['risk_score'],
                risk_category=risk_result['risk_category'],
                confidence=risk_result['confidence'],
                assessment_type=form.assessment_type.data,
                model_version=risk_result['metadata']['model_version'],
                notes=form.notes.data
            )
            
            db.session.add(assessment)
            db.session.flush()  # Get ID
            
            # Add risk factors
            for factor_data in risk_result['factors']:
                factor = RiskFactor(
                    assessment_id=assessment.id,
                    factor_name=factor_data['name'],
                    factor_value=factor_data['value'],
                    factor_weight=factor_data['weight'],
                    factor_category=factor_data['category'],
                    description=factor_data['description'],
                    source='model',
                    severity='medium'  # Default, could be calculated
                )
                db.session.add(factor)
            
            # Add recommendations
            for rec_data in risk_result['recommendations']:
                recommendation = Recommendation(
                    assessment_id=assessment.id,
                    title=f"Risk Mitigation: {rec_data['text'][:50]}...",
                    recommendation_text=rec_data['text'],
                    priority=rec_data['priority'],
                    estimated_impact=rec_data['impact'],
                    implementation_cost=rec_data['cost'],
                    category='operational',
                    status='pending'
                )
                db.session.add(recommendation)
            
            db.session.commit()
            
            flash(f'Risk assessment completed for {client.name}!', 'success')
            return redirect(url_for('assessment.view', assessment_id=assessment.id))
            
        except Exception as e:
            db.session.rollback()
            flash('Error creating assessment. Please try again.', 'error')
            current_app.logger.error(f'Error creating assessment: {str(e)}')
    
    return render_template('assessment/create.html', form=form)


@assessment_bp.route('/quick/<int:client_id>', methods=['GET', 'POST'])
@login_required
def quick_assess(client_id):
    """Quick assessment for a specific client"""
    client = Client.query.get_or_404(client_id)
    form = QuickAssessmentForm()
    form.client_id.data = client_id
    
    if form.validate_on_submit():
        try:
            # Run AI risk assessment
            risk_result = assess_risk(client)
            
            # Create assessment record
            assessment = RiskAssessment(
                client_id=client.id,
                user_id=current_user.id,
                risk_score=risk_result['risk_score'],
                risk_category=risk_result['risk_category'],
                confidence=risk_result['confidence'],
                assessment_type=form.assessment_type.data,
                model_version=risk_result['metadata']['model_version'],
                notes=form.notes.data
            )
            
            db.session.add(assessment)
            db.session.flush()
            
            # Add simplified factors and recommendations
            for factor_data in risk_result['factors'][:3]:  # Top 3 factors for quick assessment
                factor = RiskFactor(
                    assessment_id=assessment.id,
                    factor_name=factor_data['name'],
                    factor_value=factor_data['value'],
                    factor_weight=factor_data['weight'],
                    factor_category=factor_data['category'],
                    description=factor_data['description'],
                    source='model'
                )
                db.session.add(factor)
            
            # Add top recommendations
            for rec_data in risk_result['recommendations'][:2]:  # Top 2 recommendations
                recommendation = Recommendation(
                    assessment_id=assessment.id,
                    title=f"Priority: {rec_data['text'][:30]}...",
                    recommendation_text=rec_data['text'],
                    priority=rec_data['priority'],
                    estimated_impact=rec_data['impact'],
                    implementation_cost=rec_data['cost'],
                    category='operational'
                )
                db.session.add(recommendation)
            
            db.session.commit()
            
            flash(f'Quick assessment completed for {client.name}!', 'success')
            return redirect(url_for('assessment.view', assessment_id=assessment.id))
            
        except Exception as e:
            db.session.rollback()
            flash('Error running quick assessment. Please try again.', 'error')
            current_app.logger.error(f'Error in quick assessment: {str(e)}')
    
    return render_template('assessment/quick_assess.html', form=form, client=client)


@assessment_bp.route('/<int:assessment_id>/update-status', methods=['POST'])
@login_required
def update_status(assessment_id):
    """Update assessment status"""
    assessment = RiskAssessment.query.get_or_404(assessment_id)
    new_status = request.form.get('status')
    
    if new_status in ['draft', 'completed', 'reviewed', 'approved']:
        try:
            assessment.status = new_status
            
            if new_status == 'reviewed':
                assessment.reviewed_by = current_user.id
                assessment.reviewed_at = datetime.utcnow()
            
            db.session.commit()
            flash(f'Assessment status updated to {new_status}', 'success')
            
        except Exception as e:
            db.session.rollback()
            flash('Error updating status', 'error')
            current_app.logger.error(f'Error updating assessment status: {str(e)}')
    else:
        flash('Invalid status', 'error')
    
    return redirect(url_for('assessment.view', assessment_id=assessment_id))


@assessment_bp.route('/recommendations/<int:rec_id>/update', methods=['GET', 'POST'])
@login_required
def update_recommendation(rec_id):
    """Update recommendation status and assignment"""
    recommendation = Recommendation.query.get_or_404(rec_id)
    form = RecommendationForm()
    
    # Populate user choices for assignment
    form.assigned_to.choices = [(0, 'Unassigned')] + [
        (user.id, user.name) for user in User.query.filter_by(active=True).all()
    ]
    
    if form.validate_on_submit():
        try:
            recommendation.status = form.status.data
            recommendation.assigned_to = form.assigned_to.data if form.assigned_to.data > 0 else None
            
            if form.status.data == 'completed':
                recommendation.completed_date = datetime.now().date()
            
            db.session.commit()
            flash('Recommendation updated successfully!', 'success')
            return redirect(url_for('assessment.view', assessment_id=recommendation.assessment_id))
            
        except Exception as e:
            db.session.rollback()
            flash('Error updating recommendation', 'error')
            current_app.logger.error(f'Error updating recommendation: {str(e)}')
    
    # Pre-populate form
    form.status.data = recommendation.status
    form.assigned_to.data = recommendation.assigned_to or 0
    
    return render_template('assessment/update_recommendation.html',
                         form=form,
                         recommendation=recommendation)


@assessment_bp.route('/<int:assessment_id>/report')
@login_required
def report(assessment_id):
    """Generate assessment report"""
    assessment = RiskAssessment.query.get_or_404(assessment_id)
    factors = RiskFactor.query.filter_by(assessment_id=assessment_id).all()
    recommendations = Recommendation.query.filter_by(assessment_id=assessment_id).all()
    
    return render_template('assessment/report.html',
                         assessment=assessment,
                         factors=factors,
                         recommendations=recommendations)


@assessment_bp.route('/compare')
@login_required
def compare():
    """Compare multiple assessments"""
    assessment_ids = request.args.getlist('ids', type=int)
    
    if len(assessment_ids) < 2:
        flash('Select at least 2 assessments to compare', 'warning')
        return redirect(url_for('assessment.list'))
    
    assessments = RiskAssessment.query.filter(RiskAssessment.id.in_(assessment_ids)).all()
    
    return render_template('assessment/compare.html', assessments=assessments)


@assessment_bp.route('/analytics')
@login_required
def analytics():
    """Assessment analytics dashboard"""
    # Risk category distribution
    risk_distribution = db.session.query(
        RiskAssessment.risk_category,
        db.func.count(RiskAssessment.id)
    ).group_by(RiskAssessment.risk_category).all()
    
    # Assessment type distribution
    type_distribution = db.session.query(
        RiskAssessment.assessment_type,
        db.func.count(RiskAssessment.id)
    ).group_by(RiskAssessment.assessment_type).all()
    
    # Average risk scores by industry
    industry_risk = db.session.query(
        Client.industry,
        db.func.avg(RiskAssessment.risk_score)
    ).join(RiskAssessment).group_by(Client.industry).all()
    
    return render_template('assessment/analytics.html',
                         risk_distribution=risk_distribution,
                         type_distribution=type_distribution,
                         industry_risk=industry_risk)


@assessment_bp.route('/<int:assessment_id>/delete', methods=['POST'])
@login_required
def delete(assessment_id):
    """Delete an assessment"""
    assessment = RiskAssessment.query.get_or_404(assessment_id)
    
    # Check permissions (only allow assessment creator or admin)
    if assessment.user_id != current_user.id and not current_user.has_role('admin'):
        flash('You can only delete your own assessments', 'error')
        return redirect(url_for('assessment.view', assessment_id=assessment_id))
    
    try:
        client_name = assessment.client.name
        db.session.delete(assessment)
        db.session.commit()
        
        flash(f'Assessment for {client_name} deleted successfully', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash('Error deleting assessment', 'error')
        current_app.logger.error(f'Error deleting assessment: {str(e)}')
    
    return redirect(url_for('assessment.list'))
