"""CLI module for ToluAI application"""

from .irpa_commands import register_irpa_commands

# Re-export for backward compatibility
def init_cli_commands(app):
    """Initialize CLI commands"""
    # Import and register original CLI commands
    import click
    from flask.cli import with_appcontext
    from backend.app import db, security
    from backend.models import User, Role, Client
    from datetime import datetime
    import os

    @click.command()
    @with_appcontext
    def create_admin():
        """Create admin user"""
        try:
            # Create all roles if they don't exist
            system_admin_role = security.datastore.find_or_create_role(
                name='system_admin', 
                description='System Administrator role'
            )
            admin_role = security.datastore.find_or_create_role(
                name='admin', 
                description='Administrator role'
            )
            company_admin_role = security.datastore.find_or_create_role(
                name='company_admin', 
                description='Company Administrator role'
            )
            risk_analyst_role = security.datastore.find_or_create_role(
                name='risk_analyst', 
                description='Risk Analyst role'
            )
            underwriter_role = security.datastore.find_or_create_role(
                name='underwriter', 
                description='Insurance underwriter role'
            )
            compliance_officer_role = security.datastore.find_or_create_role(
                name='compliance_officer', 
                description='Compliance Officer role'
            )
            read_only_role = security.datastore.find_or_create_role(
                name='read_only', 
                description='Read-only access role'
            )
            user_role = security.datastore.find_or_create_role(
                name='user', 
                description='Regular user role'
            )
            
            # Get admin email from config or environment
            admin_email = app.config.get('ADMIN_EMAIL', 'admin@toluai.com')
            admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
            
            # Create admin user if it doesn't exist
            if not security.datastore.find_user(email=admin_email):
                admin_user = security.datastore.create_user(
                    email=admin_email,
                    password=admin_password,
                    name='Administrator',
                    confirmed_at=datetime.utcnow(),
                    active=True
                )
                security.datastore.add_role_to_user(admin_user, system_admin_role)
                security.datastore.add_role_to_user(admin_user, admin_role)
                
                db.session.commit()
                click.echo(f'✅ Admin user created: {admin_email}')
            else:
                click.echo(f'ℹ️  Admin user already exists: {admin_email}')
                
        except Exception as e:
            click.echo(f'❌ Error creating admin user: {str(e)}')
            db.session.rollback()

    # Create test data command
    @click.command()
    @with_appcontext
    def create_test_data():
        """Create test data including users for all roles"""
        from backend.models.irpa import IRPACompany, InsuredEntity
        from werkzeug.security import generate_password_hash
        
        try:
            # Create test company
            test_company = IRPACompany.query.filter_by(company_name='Demo Insurance Corp').first()
            if not test_company:
                test_company = IRPACompany(
                    company_name='Demo Insurance Corp',
                    company_size=250,
                    company_age=10,
                    registration_date=datetime.utcnow().date()
                )
                db.session.add(test_company)
                db.session.commit()
                click.echo(f"✅ Created test company: {test_company.company_name}")

            # Test accounts
            test_accounts = [
                {'email': 'admin@toluai.com', 'password': 'admin123', 'name': 'System Administrator', 'roles': ['system_admin', 'admin']},
                {'email': 'company.admin@demo.com', 'password': 'demo123', 'name': 'Company Admin', 'roles': ['company_admin']},
                {'email': 'risk.analyst@demo.com', 'password': 'demo123', 'name': 'Risk Analyst', 'roles': ['risk_analyst']},
                {'email': 'underwriter@demo.com', 'password': 'demo123', 'name': 'Underwriter', 'roles': ['underwriter']},
                {'email': 'compliance@demo.com', 'password': 'demo123', 'name': 'Compliance Officer', 'roles': ['compliance_officer']},
                {'email': 'viewer@demo.com', 'password': 'demo123', 'name': 'Read Only User', 'roles': ['read_only']},
            ]

            for account in test_accounts:
                if not security.datastore.find_user(email=account['email']):
                    user = security.datastore.create_user(
                        email=account['email'],
                        password=account['password'],
                        name=account['name'],
                        company=test_company.company_name if account['email'] != 'admin@toluai.com' else None,
                        confirmed_at=datetime.utcnow(),
                        active=True
                    )
                    # Add all specified roles
                    for role_name in account['roles']:
                        role = security.datastore.find_role(role_name)
                        if role:
                            security.datastore.add_role_to_user(user, role)
                    click.echo(f"✅ Created user: {account['email']} with roles: {', '.join(account['roles'])}")

            db.session.commit()
            
            click.echo("\n📋 Test Accounts Created:")
            click.echo("=" * 50)
            for account in test_accounts:
                click.echo(f"Email: {account['email']}")
                click.echo(f"Password: {account['password']}")
                click.echo(f"Roles: {', '.join(account['roles'])}")
                click.echo("-" * 50)
                
        except Exception as e:
            click.echo(f'❌ Error creating test data: {str(e)}')
            db.session.rollback()

    # Register original CLI commands
    app.cli.add_command(create_admin)
    app.cli.add_command(create_test_data)
    
    # Register IRPA CLI commands
    register_irpa_commands(app)