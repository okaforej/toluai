"""
IRPA CLI Commands
Commands for setting up and managing the IRPA system
"""

import click
from flask.cli import with_appcontext
from backend.app import db
from backend.models.irpa import (
    IndustryType, State, EducationLevel, JobTitle, PracticeField, IRPARole
)
from backend.models.external_risk import (
    IncidentType, RegulationType, IndicatorType, DataSource
)
from backend.models.access_control import Permission
from datetime import datetime


@click.command()
@with_appcontext
def init_irpa_reference_data():
    """Initialize IRPA reference data tables"""
    
    click.echo('Initializing IRPA reference data...')
    
    # Industry Types
    industry_types = [
        ('Technology', 'High Growth', 3.2),
        ('Finance', 'Regulated', 4.1),
        ('Healthcare', 'Regulated', 3.8),
        ('Manufacturing', 'Traditional', 2.9),
        ('Retail', 'Consumer', 3.5),
        ('Construction', 'Cyclical', 4.2),
        ('Transportation', 'Infrastructure', 3.7),
        ('Education', 'Service', 2.1),
        ('Real Estate', 'Cyclical', 4.0),
        ('Energy', 'Commodity', 4.5),
        ('Agriculture', 'Commodity', 3.3),
        ('Hospitality', 'Consumer', 4.8),
    ]
    
    for name, category, risk_factor in industry_types:
        if not IndustryType.query.filter_by(industry_name=name).first():
            industry = IndustryType(
                industry_name=name,
                risk_category=category,
                base_risk_factor=risk_factor
            )
            db.session.add(industry)
    
    # States
    states_data = [
        ('AL', 'Alabama', 3.2), ('AK', 'Alaska', 2.8), ('AZ', 'Arizona', 3.1),
        ('AR', 'Arkansas', 3.4), ('CA', 'California', 2.9), ('CO', 'Colorado', 2.7),
        ('CT', 'Connecticut', 2.5), ('DE', 'Delaware', 2.6), ('FL', 'Florida', 3.3),
        ('GA', 'Georgia', 3.0), ('HI', 'Hawaii', 2.4), ('ID', 'Idaho', 2.9),
        ('IL', 'Illinois', 3.2), ('IN', 'Indiana', 2.8), ('IA', 'Iowa', 2.5),
        ('KS', 'Kansas', 2.7), ('KY', 'Kentucky', 3.1), ('LA', 'Louisiana', 3.8),
        ('ME', 'Maine', 2.6), ('MD', 'Maryland', 2.4), ('MA', 'Massachusetts', 2.3),
        ('MI', 'Michigan', 3.0), ('MN', 'Minnesota', 2.5), ('MS', 'Mississippi', 3.6),
        ('MO', 'Missouri', 2.9), ('MT', 'Montana', 2.8), ('NE', 'Nebraska', 2.4),
        ('NV', 'Nevada', 3.4), ('NH', 'New Hampshire', 2.3), ('NJ', 'New Jersey', 2.6),
        ('NM', 'New Mexico', 3.2), ('NY', 'New York', 2.7), ('NC', 'North Carolina', 2.8),
        ('ND', 'North Dakota', 2.5), ('OH', 'Ohio', 2.9), ('OK', 'Oklahoma', 3.3),
        ('OR', 'Oregon', 2.6), ('PA', 'Pennsylvania', 2.8), ('RI', 'Rhode Island', 2.7),
        ('SC', 'South Carolina', 3.0), ('SD', 'South Dakota', 2.4), ('TN', 'Tennessee', 2.9),
        ('TX', 'Texas', 3.1), ('UT', 'Utah', 2.5), ('VT', 'Vermont', 2.2),
        ('VA', 'Virginia', 2.4), ('WA', 'Washington', 2.6), ('WV', 'West Virginia', 3.5),
        ('WI', 'Wisconsin', 2.6), ('WY', 'Wyoming', 2.9)
    ]
    
    for code, name, risk_factor in states_data:
        if not State.query.filter_by(state_code=code).first():
            state = State(
                state_code=code,
                state_name=name,
                risk_factor=risk_factor
            )
            db.session.add(state)
    
    # Education Levels
    education_levels = [
        ('High School Diploma', 4.2),
        ('Some College', 3.8),
        ('Associate Degree', 3.5),
        ('Bachelor\'s Degree', 2.9),
        ('Master\'s Degree', 2.3),
        ('Doctoral Degree', 1.8),
        ('Professional Degree (JD, MD)', 1.5),
        ('Trade/Vocational Certificate', 3.6),
    ]
    
    for level, risk_factor in education_levels:
        if not EducationLevel.query.filter_by(level_name=level).first():
            education = EducationLevel(
                level_name=level,
                risk_factor=risk_factor
            )
            db.session.add(education)
    
    # Job Titles
    job_titles = [
        ('CEO/President', 'Executive', 2.1),
        ('CFO', 'Executive', 2.3),
        ('CTO/CIO', 'Executive', 2.5),
        ('VP/Director', 'Management', 2.7),
        ('Senior Manager', 'Management', 2.9),
        ('Manager', 'Management', 3.1),
        ('Senior Analyst', 'Professional', 2.8),
        ('Analyst', 'Professional', 3.2),
        ('Senior Engineer', 'Technical', 2.6),
        ('Engineer', 'Technical', 3.0),
        ('Consultant', 'Professional', 3.3),
        ('Specialist', 'Professional', 3.4),
        ('Coordinator', 'Administrative', 3.6),
        ('Assistant', 'Administrative', 3.8),
        ('Other', 'General', 3.5),
    ]
    
    for title, category, risk_factor in job_titles:
        if not JobTitle.query.filter_by(title_name=title).first():
            job_title = JobTitle(
                title_name=title,
                risk_category=category,
                risk_factor=risk_factor
            )
            db.session.add(job_title)
    
    # Practice Fields
    practice_fields = [
        ('Accounting', 2.8),
        ('Finance', 3.1),
        ('Law', 2.4),
        ('Medicine', 2.6),
        ('Engineering', 2.7),
        ('Information Technology', 3.2),
        ('Marketing', 3.4),
        ('Sales', 3.6),
        ('Operations', 3.0),
        ('Human Resources', 3.3),
        ('Consulting', 3.1),
        ('Research & Development', 2.9),
        ('Quality Assurance', 2.8),
        ('Project Management', 3.0),
        ('Other', 3.5),
    ]
    
    for field, risk_factor in practice_fields:
        if not PracticeField.query.filter_by(field_name=field).first():
            practice_field = PracticeField(
                field_name=field,
                risk_factor=risk_factor
            )
            db.session.add(practice_field)
    
    # IRPA Roles
    roles = [
        ('admin', 'System Administrator with full access'),
        ('risk_manager', 'Risk Manager with assessment and reporting access'),
        ('underwriter', 'Underwriter with client and assessment management'),
        ('analyst', 'Risk Analyst with read and assessment access'),
        ('viewer', 'Read-only access to reports and dashboards'),
    ]
    
    for role_name, description in roles:
        if not IRPARole.query.filter_by(role_name=role_name).first():
            role = IRPARole(
                role_name=role_name,
                description=description
            )
            db.session.add(role)
    
    # Incident Types
    incident_types = [
        ('Data Breach', 'Unauthorized access to sensitive data', 4.5),
        ('Malware Attack', 'Malicious software infection', 3.8),
        ('Phishing Attack', 'Social engineering attack via email', 3.2),
        ('DDoS Attack', 'Distributed Denial of Service attack', 2.9),
        ('Insider Threat', 'Security threat from internal personnel', 4.2),
        ('System Outage', 'Unplanned system downtime', 2.6),
        ('Data Loss', 'Accidental or intentional data deletion', 3.5),
        ('Ransomware', 'Malicious encryption of data for ransom', 4.8),
        ('Physical Security Breach', 'Unauthorized physical access', 3.1),
        ('Network Intrusion', 'Unauthorized network access', 4.0),
    ]
    
    for type_name, description, risk_factor in incident_types:
        if not IncidentType.query.filter_by(type_name=type_name).first():
            incident_type = IncidentType(
                type_name=type_name,
                description=description,
                base_risk_factor=risk_factor
            )
            db.session.add(incident_type)
    
    # Indicator Types
    indicator_types = [
        ('GDP Growth Rate', 'Gross Domestic Product growth rate', '%', 'Negative'),
        ('Unemployment Rate', 'National unemployment rate', '%', 'Positive'),
        ('Interest Rate', 'Federal funds rate', '%', 'Variable'),
        ('Inflation Rate', 'Consumer Price Index inflation', '%', 'Positive'),
        ('Stock Market Index', 'Major stock market performance', 'Points', 'Negative'),
        ('Industry Revenue', 'Sector-specific revenue trends', '$', 'Negative'),
        ('Cyber Threat Level', 'Cybersecurity threat assessment', 'Level', 'Positive'),
        ('Regulatory Changes', 'New regulation implementation rate', 'Count', 'Positive'),
    ]
    
    for name, description, unit, correlation in indicator_types:
        if not IndicatorType.query.filter_by(indicator_name=name).first():
            indicator_type = IndicatorType(
                indicator_name=name,
                description=description,
                unit=unit,
                risk_correlation=correlation
            )
            db.session.add(indicator_type)
    
    # Data Sources
    data_sources = [
        ('Internal Assessment', 'Manual risk assessment by underwriters', 0.95),
        ('Credit Bureau', 'Credit reporting agencies', 0.92),
        ('Government Database', 'Federal and state government records', 0.88),
        ('Industry Reports', 'Third-party industry analysis', 0.85),
        ('Public Records', 'Publicly available business records', 0.80),
        ('News Sources', 'Financial and business news outlets', 0.75),
        ('Social Media', 'Social media monitoring services', 0.65),
        ('Survey Data', 'Customer and industry surveys', 0.78),
    ]
    
    for name, description, reliability in data_sources:
        if not DataSource.query.filter_by(source_name=name).first():
            data_source = DataSource(
                source_name=name,
                description=description,
                reliability_score=reliability,
                is_active=True
            )
            db.session.add(data_source)
    
    # Permissions
    permissions = [
        ('company.create', 'Create new companies'),
        ('company.read', 'View company information'),
        ('company.update', 'Update company information'),
        ('company.delete', 'Delete companies'),
        ('insured_entity.create', 'Create new insured entities'),
        ('insured_entity.read', 'View insured entity information'),
        ('insured_entity.update', 'Update insured entity information'),
        ('insured_entity.delete', 'Delete insured entities'),
        ('assessment.create', 'Run risk assessments'),
        ('assessment.read', 'View assessment results'),
        ('assessment.update', 'Update assessments'),
        ('assessment.delete', 'Delete assessments'),
        ('analytics.read', 'View analytics and reports'),
        ('audit.read', 'View audit logs'),
        ('admin.users', 'Manage user accounts'),
        ('admin.roles', 'Manage roles and permissions'),
        ('admin.system', 'System administration'),
    ]
    
    for permission_name, description in permissions:
        if not Permission.query.filter_by(permission_name=permission_name).first():
            permission = Permission(
                permission_name=permission_name,
                description=description
            )
            db.session.add(permission)
    
    # Commit all changes
    try:
        db.session.commit()
        click.echo('✅ IRPA reference data initialized successfully!')
    except Exception as e:
        db.session.rollback()
        click.echo(f'❌ Error initializing reference data: {str(e)}')


@click.command()
@with_appcontext
def setup_irpa_permissions():
    """Set up role-based permissions for IRPA system"""
    
    from backend.models.access_control import RolePermission
    
    click.echo('Setting up IRPA role permissions...')
    
    # Admin permissions - all permissions
    admin_role = IRPARole.query.filter_by(role_name='admin').first()
    if admin_role:
        all_permissions = Permission.query.all()
        for permission in all_permissions:
            if not RolePermission.query.filter_by(
                role_id=admin_role.role_id,
                permission_id=permission.permission_id
            ).first():
                role_permission = RolePermission(
                    role_id=admin_role.role_id,
                    permission_id=permission.permission_id
                )
                db.session.add(role_permission)
    
    # Risk Manager permissions
    risk_manager_role = IRPARole.query.filter_by(role_name='risk_manager').first()
    if risk_manager_role:
        manager_permissions = [
            'company.read', 'company.update',
            'insured_entity.create', 'insured_entity.read', 'insured_entity.update',
            'assessment.create', 'assessment.read', 'assessment.update',
            'analytics.read', 'audit.read'
        ]
        for perm_name in manager_permissions:
            permission = Permission.query.filter_by(permission_name=perm_name).first()
            if permission and not RolePermission.query.filter_by(
                role_id=risk_manager_role.role_id,
                permission_id=permission.permission_id
            ).first():
                role_permission = RolePermission(
                    role_id=risk_manager_role.role_id,
                    permission_id=permission.permission_id
                )
                db.session.add(role_permission)
    
    # Underwriter permissions
    underwriter_role = IRPARole.query.filter_by(role_name='underwriter').first()
    if underwriter_role:
        underwriter_permissions = [
            'company.read',
            'insured_entity.create', 'insured_entity.read', 'insured_entity.update',
            'assessment.create', 'assessment.read', 'assessment.update',
            'analytics.read'
        ]
        for perm_name in underwriter_permissions:
            permission = Permission.query.filter_by(permission_name=perm_name).first()
            if permission and not RolePermission.query.filter_by(
                role_id=underwriter_role.role_id,
                permission_id=permission.permission_id
            ).first():
                role_permission = RolePermission(
                    role_id=underwriter_role.role_id,
                    permission_id=permission.permission_id
                )
                db.session.add(role_permission)
    
    # Analyst permissions
    analyst_role = IRPARole.query.filter_by(role_name='analyst').first()
    if analyst_role:
        analyst_permissions = [
            'company.read',
            'insured_entity.read',
            'assessment.create', 'assessment.read',
            'analytics.read'
        ]
        for perm_name in analyst_permissions:
            permission = Permission.query.filter_by(permission_name=perm_name).first()
            if permission and not RolePermission.query.filter_by(
                role_id=analyst_role.role_id,
                permission_id=permission.permission_id
            ).first():
                role_permission = RolePermission(
                    role_id=analyst_role.role_id,
                    permission_id=permission.permission_id
                )
                db.session.add(role_permission)
    
    # Viewer permissions
    viewer_role = IRPARole.query.filter_by(role_name='viewer').first()
    if viewer_role:
        viewer_permissions = [
            'company.read',
            'insured_entity.read',
            'assessment.read',
            'analytics.read'
        ]
        for perm_name in viewer_permissions:
            permission = Permission.query.filter_by(permission_name=perm_name).first()
            if permission and not RolePermission.query.filter_by(
                role_id=viewer_role.role_id,
                permission_id=permission.permission_id
            ).first():
                role_permission = RolePermission(
                    role_id=viewer_role.role_id,
                    permission_id=permission.permission_id
                )
                db.session.add(role_permission)
    
    try:
        db.session.commit()
        click.echo('✅ IRPA role permissions set up successfully!')
    except Exception as e:
        db.session.rollback()
        click.echo(f'❌ Error setting up permissions: {str(e)}')


@click.command()
@click.argument('email')
@click.argument('password')
@click.argument('company_name')
@click.option('--role', default='admin', help='User role (default: admin)')
@with_appcontext
def create_irpa_admin(email, password, company_name, role):
    """Create an IRPA admin user and company"""
    
    from werkzeug.security import generate_password_hash
    from backend.models.irpa import IRPACompany, IRPAUser
    import uuid
    from datetime import date
    
    click.echo(f'Creating IRPA admin user: {email}')
    
    # Check if user already exists
    existing_user = IRPAUser.query.filter_by(email=email).first()
    if existing_user:
        click.echo(f'❌ User {email} already exists!')
        return
    
    # Create company first
    company = IRPACompany.query.filter_by(company_name=company_name).first()
    if not company:
        company = IRPACompany(
            company_name=company_name,
            registration_date=date.today()
        )
        db.session.add(company)
        db.session.flush()  # Get company ID
        click.echo(f'✅ Created company: {company_name}')
    else:
        click.echo(f'📋 Using existing company: {company_name}')
    
    # Get role
    irpa_role = IRPARole.query.filter_by(role_name=role).first()
    if not irpa_role:
        click.echo(f'❌ Role {role} not found! Please run init-irpa-reference-data first.')
        return
    
    # Create user
    user = IRPAUser(
        email=email,
        password_hash=generate_password_hash(password),
        company_id=company.company_id,
        role_id=irpa_role.role_id,
        first_name='Admin',
        last_name='User',
        status=True,
        agree_terms=True
    )
    db.session.add(user)
    
    try:
        db.session.commit()
        click.echo(f'✅ Created IRPA admin user: {email}')
        click.echo(f'   Company: {company_name}')
        click.echo(f'   Role: {role}')
        click.echo(f'   User ID: {user.user_id}')
    except Exception as e:
        db.session.rollback()
        click.echo(f'❌ Error creating admin user: {str(e)}')


@click.command()
@with_appcontext
def init_irpa_system():
    """Initialize the complete IRPA system (reference data + permissions)"""
    
    click.echo('🚀 Initializing IRPA system...')
    
    # Run reference data initialization
    init_irpa_reference_data.callback()
    
    # Set up permissions
    setup_irpa_permissions.callback()
    
    click.echo('🎉 IRPA system initialization complete!')
    click.echo('')
    click.echo('Next steps:')
    click.echo('1. Create an admin user: flask create-irpa-admin admin@company.com password123 "Company Name"')
    click.echo('2. Run database migrations: flask db upgrade')
    click.echo('3. Start the application: flask run')


def register_irpa_commands(app):
    """Register IRPA CLI commands with Flask app"""
    app.cli.add_command(init_irpa_reference_data, name='init-irpa-reference-data')
    app.cli.add_command(setup_irpa_permissions, name='setup-irpa-permissions')
    app.cli.add_command(create_irpa_admin, name='create-irpa-admin')
    app.cli.add_command(init_irpa_system, name='init-irpa-system')