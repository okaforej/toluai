"""Client management routes"""

from flask import render_template, redirect, url_for, flash, request, jsonify, current_app
from flask_security import login_required, current_user
from backend.web.client import client_bp
from backend.web.client.forms import ClientForm, ClientSearchForm, QuickClientForm
from backend.models import Client, RiskAssessment
from backend.app import db
from sqlalchemy import or_, desc


@client_bp.route('/')
@client_bp.route('/list')
@login_required
def list():
    """Display paginated list of clients with search and filtering"""
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '')
    industry = request.args.get('industry', '')
    status = request.args.get('status', '')
    client_type = request.args.get('client_type', '')
    
    form = ClientSearchForm(request.args)
    
    # Build query
    query = Client.query
    
    if search:
        search_filter = or_(
            Client.name.contains(search),
            Client.email.contains(search),
            Client.industry.contains(search)
        )
        query = query.filter(search_filter)
    
    if industry:
        query = query.filter(Client.industry == industry)
    
    if status:
        query = query.filter(Client.status == status)
    
    if client_type:
        query = query.filter(Client.client_type == client_type)
    
    # Pagination
    clients = query.order_by(desc(Client.created_at)).paginate(
        page=page,
        per_page=current_app.config['ITEMS_PER_PAGE'],
        error_out=False
    )
    
    return render_template('client/list.html', 
                         clients=clients, 
                         form=form,
                         search=search,
                         industry=industry,
                         status=status,
                         client_type=client_type)


@client_bp.route('/<int:client_id>')
@login_required
def view(client_id):
    """View detailed client information"""
    client = Client.query.get_or_404(client_id)
    
    # Get recent assessments
    recent_assessments = RiskAssessment.query.filter_by(
        client_id=client_id
    ).order_by(desc(RiskAssessment.assessment_date)).limit(5).all()
    
    return render_template('client/view.html', 
                         client=client,
                         recent_assessments=recent_assessments)


@client_bp.route('/create', methods=['GET', 'POST'])
@login_required
def create():
    """Create a new client"""
    form = ClientForm()
    
    if form.validate_on_submit():
        try:
            client = Client(
                name=form.name.data,
                email=form.email.data,
                phone=form.phone.data,
                website=form.website.data,
                address=form.address.data,
                city=form.city.data,
                state=form.state.data,
                zip_code=form.zip_code.data,
                country=form.country.data or 'United States',
                industry=form.industry.data,
                sub_industry=form.sub_industry.data,
                annual_revenue=form.annual_revenue.data,
                employee_count=form.employee_count.data,
                years_in_business=form.years_in_business.data,
                business_structure=form.business_structure.data,
                current_insurance_provider=form.current_insurance_provider.data,
                current_premium=form.current_premium.data,
                coverage_amount=form.coverage_amount.data,
                previous_claims=form.previous_claims.data == 'true' if form.previous_claims.data else None,
                claims_count_5years=form.claims_count_5years.data or 0,
                safety_programs=form.safety_programs.data == 'true' if form.safety_programs.data else None,
                notes=form.notes.data,
                source='manual'
            )
            
            db.session.add(client)
            db.session.commit()
            
            flash(f'Client "{client.name}" created successfully!', 'success')
            return redirect(url_for('client.view', client_id=client.id))
            
        except Exception as e:
            db.session.rollback()
            flash('Error creating client. Please try again.', 'error')
            current_app.logger.error(f'Error creating client: {str(e)}')
    
    return render_template('client/create.html', form=form)


@client_bp.route('/<int:client_id>/edit', methods=['GET', 'POST'])
@login_required
def edit(client_id):
    """Edit an existing client"""
    client = Client.query.get_or_404(client_id)
    form = ClientForm(original_email=client.email, obj=client)
    
    # Convert boolean fields for form display
    if client.previous_claims is not None:
        form.previous_claims.data = 'true' if client.previous_claims else 'false'
    if client.safety_programs is not None:
        form.safety_programs.data = 'true' if client.safety_programs else 'false'
    
    if form.validate_on_submit():
        try:
            # Update client fields
            form.populate_obj(client)
            
            # Handle boolean fields
            client.previous_claims = form.previous_claims.data == 'true' if form.previous_claims.data else None
            client.safety_programs = form.safety_programs.data == 'true' if form.safety_programs.data else None
            
            db.session.commit()
            
            flash(f'Client "{client.name}" updated successfully!', 'success')
            return redirect(url_for('client.view', client_id=client.id))
            
        except Exception as e:
            db.session.rollback()
            flash('Error updating client. Please try again.', 'error')
            current_app.logger.error(f'Error updating client: {str(e)}')
    
    return render_template('client/edit.html', form=form, client=client)


@client_bp.route('/<int:client_id>/delete', methods=['POST'])
@login_required
def delete(client_id):
    """Delete a client"""
    client = Client.query.get_or_404(client_id)
    
    try:
        client_name = client.name
        db.session.delete(client)
        db.session.commit()
        
        flash(f'Client "{client_name}" deleted successfully!', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash('Error deleting client. Please try again.', 'error')
        current_app.logger.error(f'Error deleting client: {str(e)}')
    
    return redirect(url_for('client.list'))


@client_bp.route('/quick-add', methods=['POST'])
@login_required
def quick_add():
    """Quick add client via AJAX"""
    form = QuickClientForm()
    
    if form.validate_on_submit():
        try:
            # Check if email already exists
            if Client.query.filter_by(email=form.email.data).first():
                return jsonify({
                    'success': False,
                    'error': 'Email already exists'
                }), 400
            
            client = Client(
                name=form.name.data,
                email=form.email.data,
                industry=form.industry.data,
                source='quick_add'
            )
            
            db.session.add(client)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'client': {
                    'id': client.id,
                    'name': client.name,
                    'email': client.email
                }
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'success': False,
                'error': 'Failed to create client'
            }), 500
    
    return jsonify({
        'success': False,
        'errors': form.errors
    }), 400


@client_bp.route('/search')
@login_required
def search():
    """AJAX search for clients"""
    query = request.args.get('q', '').strip()
    
    if len(query) < 2:
        return jsonify([])
    
    clients = Client.query.filter(
        or_(
            Client.name.contains(query),
            Client.email.contains(query)
        )
    ).limit(10).all()
    
    results = [{
        'id': client.id,
        'name': client.name,
        'email': client.email,
        'industry': client.industry
    } for client in clients]
    
    return jsonify(results)


@client_bp.route('/<int:client_id>/assessments')
@login_required
def assessments(client_id):
    """View client's risk assessments"""
    client = Client.query.get_or_404(client_id)
    
    page = request.args.get('page', 1, type=int)
    assessments = RiskAssessment.query.filter_by(
        client_id=client_id
    ).order_by(desc(RiskAssessment.assessment_date)).paginate(
        page=page,
        per_page=current_app.config['ITEMS_PER_PAGE'],
        error_out=False
    )
    
    return render_template('client/assessments.html',
                         client=client,
                         assessments=assessments)


@client_bp.route('/<int:client_id>/toggle-status', methods=['POST'])
@login_required
def toggle_status(client_id):
    """Toggle client active/inactive status"""
    client = Client.query.get_or_404(client_id)
    
    try:
        client.status = 'inactive' if client.status == 'active' else 'active'
        db.session.commit()
        
        flash(f'Client status changed to {client.status}', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash('Error updating client status', 'error')
        current_app.logger.error(f'Error toggling client status: {str(e)}')
    
    return redirect(url_for('client.view', client_id=client_id))


@client_bp.route('/export')
@login_required
def export():
    """Export clients to CSV"""
    # This would implement CSV export functionality
    flash('Export functionality coming soon!', 'info')
    return redirect(url_for('client.list'))