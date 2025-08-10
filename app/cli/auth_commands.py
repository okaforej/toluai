"""
Authentication and Authorization CLI Commands
Initialize roles, permissions, and demo users
"""

import click
from flask.cli import with_appcontext
from app import db
from app.models.auth import User, Role, Permission, SYSTEM_ROLES
from app.models.irpa import IRPACompany
from app.models.client import Client
from app.models.assessment import RiskAssessment, RiskFactor, Recommendation
import logging
from datetime import datetime, timedelta
import random

logger = logging.getLogger(__name__)

@click.command()
@with_appcontext
def init_auth_system():
    """Initialize roles, permissions, and system structure"""
    click.echo("Initializing authentication and authorization system...")
    
    try:
        # Create permissions
        resources = ['company', 'user', 'entity', 'assessment', 'rule', 'report', 'audit', 'compliance']
        actions = ['view', 'create', 'edit', 'delete', 'approve']
        scopes = ['own', 'company', 'all']
        
        permission_count = 0
        for resource in resources:
            for action in actions:
                for scope in scopes:
                    # Skip illogical combinations
                    if scope == 'own' and resource in ['company', 'audit', 'compliance']:
                        continue
                    if action == 'approve' and resource not in ['assessment', 'compliance']:
                        continue
                    
                    perm_name = f"{resource}.{action}.{scope}"
                    if not Permission.query.filter_by(name=perm_name).first():
                        perm = Permission(
                            name=perm_name,
                            resource=resource,
                            action=action,
                            scope=scope,
                            description=f"{action.capitalize()} {resource} ({scope})"
                        )
                        db.session.add(perm)
                        permission_count += 1
        
        click.echo(f"✓ Created {permission_count} permissions")
        
        # Create system roles
        role_count = 0
        for role_name, role_config in SYSTEM_ROLES.items():
            role = Role.query.filter_by(name=role_name).first()
            if not role:
                role = Role(
                    name=role_name,
                    display_name=role_config['display_name'],
                    description=role_config['description'],
                    is_system_role=True
                )
                db.session.add(role)
                db.session.flush()
                role_count += 1
            
            # Assign permissions
            if role_config['permissions'] == ['*']:
                # System admin gets all permissions
                role.permissions = Permission.query.all()
            else:
                # Assign specific permissions
                for perm_name in role_config['permissions']:
                    perm = Permission.query.filter_by(name=perm_name).first()
                    if perm and perm not in role.permissions:
                        role.permissions.append(perm)
        
        click.echo(f"✓ Created {role_count} system roles")
        
        db.session.commit()
        click.echo("✓ Authentication system initialized successfully!")
        
    except Exception as e:
        db.session.rollback()
        click.echo(f"✗ Error initializing auth system: {str(e)}", err=True)
        raise

@click.command()
@with_appcontext
def create_demo_users():
    """Create demo users for each role"""
    click.echo("Creating demo users for testing...")
    
    try:
        # Ensure we have companies first
        companies = IRPACompany.query.all()
        if not companies:
            # Create demo companies
            demo_companies = [
                {
                    'name': 'Acme Insurance Corp',
                    'industry': 'Insurance',
                    'location': 'New York, NY',
                    'size': 500,
                    'email': 'admin@acmeinsurance.com',
                    'phone': '212-555-0100'
                },
                {
                    'name': 'Global Risk Solutions',
                    'industry': 'Risk Management',
                    'location': 'Chicago, IL',
                    'size': 250,
                    'email': 'info@globalrisk.com',
                    'phone': '312-555-0200'
                }
            ]
            
            for company_data in demo_companies:
                company = IRPACompany(**company_data)
                db.session.add(company)
                companies.append(company)
            
            db.session.flush()
            click.echo(f"✓ Created {len(demo_companies)} demo companies")
        
        # Use first two companies for demo users
        company1 = companies[0] if companies else None
        company2 = companies[1] if len(companies) > 1 else company1
        
        # Demo user configurations
        demo_users = [
            {
                'email': 'admin@toluai.com',
                'password': 'Admin123!',
                'name': 'System Administrator',
                'role': 'system_admin',
                'company': None,  # System admin has no company restriction
                'job_title': 'System Administrator',
                'department': 'IT'
            },
            {
                'email': 'company.admin@acme.com',
                'password': 'CompanyAdmin123!',
                'name': 'John Smith',
                'role': 'company_admin',
                'company': company1,
                'job_title': 'Company Administrator',
                'department': 'Management'
            },
            {
                'email': 'risk.analyst@acme.com',
                'password': 'Analyst123!',
                'name': 'Sarah Johnson',
                'role': 'risk_analyst',
                'company': company1,
                'job_title': 'Senior Risk Analyst',
                'department': 'Risk Management'
            },
            {
                'email': 'underwriter@acme.com',
                'password': 'Underwriter123!',
                'name': 'Michael Chen',
                'role': 'underwriter',
                'company': company1,
                'job_title': 'Chief Underwriter',
                'department': 'Underwriting'
            },
            {
                'email': 'compliance@acme.com',
                'password': 'Compliance123!',
                'name': 'Emily Davis',
                'role': 'compliance_officer',
                'company': company1,
                'job_title': 'Compliance Officer',
                'department': 'Compliance'
            },
            {
                'email': 'viewer@acme.com',
                'password': 'Viewer123!',
                'name': 'Robert Wilson',
                'role': 'read_only',
                'company': company1,
                'job_title': 'Business Analyst',
                'department': 'Operations'
            },
            {
                'email': 'admin@globalrisk.com',
                'password': 'GlobalAdmin123!',
                'name': 'Lisa Anderson',
                'role': 'company_admin',
                'company': company2,
                'job_title': 'Company Administrator',
                'department': 'Management'
            }
        ]
        
        created_users = []
        for user_data in demo_users:
            # Check if user already exists
            existing_user = User.query.filter_by(email=user_data['email']).first()
            if existing_user:
                click.echo(f"  User {user_data['email']} already exists, skipping...")
                continue
            
            # Create user
            user = User(
                email=user_data['email'],
                name=user_data['name'],
                password=user_data['password'],  # Will be hashed in __init__
                company_id=user_data['company'].id if user_data['company'] else None,
                job_title=user_data['job_title'],
                department=user_data['department'],
                active=True,
                confirmed_at=datetime.utcnow()
            )
            
            # Assign role
            role = Role.query.filter_by(name=user_data['role']).first()
            if role:
                user.roles.append(role)
            
            db.session.add(user)
            created_users.append(user)
            
            click.echo(f"✓ Created {user_data['role']}: {user_data['email']} / {user_data['password']}")
        
        db.session.commit()
        click.echo(f"\n✓ Successfully created {len(created_users)} demo users!")
        
        # Print login credentials summary
        click.echo("\n" + "="*60)
        click.echo("DEMO USER CREDENTIALS")
        click.echo("="*60)
        for user_data in demo_users:
            click.echo(f"\n{user_data['role'].upper()}:")
            click.echo(f"  Email: {user_data['email']}")
            click.echo(f"  Password: {user_data['password']}")
            if user_data['company']:
                click.echo(f"  Company: {user_data['company'].name}")
        click.echo("="*60)
        
    except Exception as e:
        db.session.rollback()
        click.echo(f"✗ Error creating demo users: {str(e)}", err=True)
        raise

@click.command()
@with_appcontext
def create_test_data():
    """Create test data for demo"""
    click.echo("Creating test data...")
    
    try:
        # Get companies
        companies = IRPACompany.query.all()
        if not companies:
            click.echo("✗ No companies found. Run 'flask create-demo-users' first.", err=True)
            return
        
        # Create test clients for each company
        industries = ['Technology', 'Healthcare', 'Manufacturing', 'Retail', 'Finance']
        risk_levels = ['Low', 'Medium', 'High']
        
        created_clients = 0
        for company in companies[:2]:  # Use first two companies
            for i in range(5):
                client_name = f"{company.name} Client {i+1}"
                existing = Client.query.filter_by(name=client_name).first()
                if existing:
                    continue
                
                client = Client(
                    name=client_name,
                    email=f"client{i+1}@{company.name.lower().replace(' ', '')}.com",
                    phone=f"555-{random.randint(1000, 9999)}",
                    industry=random.choice(industries),
                    annual_revenue=random.randint(1000000, 100000000),
                    employee_count=random.randint(10, 5000),
                    years_in_business=random.randint(1, 50),
                    address=f"{random.randint(100, 999)} Business Ave",
                    city=random.choice(['New York', 'Chicago', 'Los Angeles', 'Houston']),
                    state=random.choice(['NY', 'IL', 'CA', 'TX']),
                    zip_code=f"{random.randint(10000, 99999)}",
                    status='active'
                )
                db.session.add(client)
                db.session.flush()
                
                # Create risk assessment for some clients
                if random.random() > 0.3:  # 70% chance
                    risk_score = random.randint(20, 95)
                    assessment = RiskAssessment(
                        client_id=client.id,
                        user_id=1,  # System admin
                        risk_score=risk_score,
                        risk_category='High' if risk_score > 70 else 'Medium' if risk_score > 40 else 'Low',
                        confidence_score=random.randint(70, 99),
                        assessment_date=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                        status='completed',
                        notes=f"Automated assessment for {client.name}"
                    )
                    db.session.add(assessment)
                    db.session.flush()
                    
                    # Add risk factors
                    factors = [
                        ('Financial Stability', random.randint(1, 10)),
                        ('Industry Risk', random.randint(1, 10)),
                        ('Operational Risk', random.randint(1, 10)),
                        ('Compliance Risk', random.randint(1, 10)),
                        ('Market Risk', random.randint(1, 10))
                    ]
                    
                    for factor_name, value in factors:
                        factor = RiskFactor(
                            assessment_id=assessment.id,
                            factor_name=factor_name,
                            value=value,
                            weight=random.uniform(0.1, 0.3),
                            contribution=value * random.uniform(0.1, 0.3)
                        )
                        db.session.add(factor)
                    
                    # Add recommendations
                    recommendations = [
                        ('Review Financial Controls', 'Implement stronger financial oversight', 'High'),
                        ('Update Compliance Procedures', 'Ensure regulatory compliance', 'Medium'),
                        ('Enhance Cybersecurity', 'Upgrade security infrastructure', 'High'),
                        ('Optimize Operations', 'Streamline business processes', 'Low')
                    ]
                    
                    for title, desc, priority in random.sample(recommendations, 2):
                        rec = Recommendation(
                            assessment_id=assessment.id,
                            title=title,
                            description=desc,
                            priority=priority,
                            category='Risk Mitigation'
                        )
                        db.session.add(rec)
                
                created_clients += 1
        
        db.session.commit()
        click.echo(f"✓ Created {created_clients} test clients with assessments")
        click.echo("✓ Test data creation completed!")
        
    except Exception as e:
        db.session.rollback()
        click.echo(f"✗ Error creating test data: {str(e)}", err=True)
        raise

@click.command()
@with_appcontext
def reset_auth_system():
    """Reset authentication system (WARNING: Deletes all users, roles, and permissions)"""
    if click.confirm('⚠️  This will delete ALL users, roles, and permissions. Continue?'):
        try:
            # Delete in correct order to avoid foreign key constraints
            User.query.delete()
            Role.query.delete()
            Permission.query.delete()
            db.session.commit()
            click.echo("✓ Authentication system reset successfully")
        except Exception as e:
            db.session.rollback()
            click.echo(f"✗ Error resetting auth system: {str(e)}", err=True)
            raise

def init_auth_cli(app):
    """Initialize authentication CLI commands"""
    app.cli.add_command(init_auth_system)
    app.cli.add_command(create_demo_users)
    app.cli.add_command(create_test_data)
    app.cli.add_command(reset_auth_system)