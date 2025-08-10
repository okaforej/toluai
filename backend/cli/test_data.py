import click
from flask.cli import with_appcontext
from werkzeug.security import generate_password_hash
from backend import db
from backend.models.user import User
from backend.models.role import Role
from backend.models.company import IRPACompany
from backend.models.entity import InsuredEntity
import logging

logger = logging.getLogger(__name__)

@click.command()
@with_appcontext
def create_test_data():
    """Create test data including users for all roles"""
    try:
        # Create test company first
        test_company = IRPACompany.query.filter_by(name='Demo Insurance Corp').first()
        if not test_company:
            test_company = IRPACompany(
                name='Demo Insurance Corp',
                industry='Financial Services',
                location='123 Main St, New York, NY 10001',
                size=250,
                email='contact@demoinsurance.com',
                phone='+1 (555) 123-4567',
                status='active',
                risk_level='Low Risk'
            )
            db.session.add(test_company)
            db.session.commit()
            logger.info(f"Created test company: {test_company.name}")

        # Test accounts configuration
        test_accounts = [
            {
                'email': 'admin@toluai.com',
                'password': 'admin123',
                'name': 'System Administrator',
                'role': 'system_admin',
                'company_id': None,  # System admin doesn't belong to a specific company
                'description': 'Full system access'
            },
            {
                'email': 'company.admin@demo.com',
                'password': 'demo123',
                'name': 'Company Admin',
                'role': 'company_admin',
                'company_id': test_company.id,
                'description': 'Company administrator'
            },
            {
                'email': 'risk.analyst@demo.com',
                'password': 'demo123',
                'name': 'Risk Analyst',
                'role': 'risk_analyst',
                'company_id': test_company.id,
                'description': 'Risk assessment specialist'
            },
            {
                'email': 'underwriter@demo.com',
                'password': 'demo123',
                'name': 'Underwriter',
                'role': 'underwriter',
                'company_id': test_company.id,
                'description': 'Insurance underwriter'
            },
            {
                'email': 'compliance@demo.com',
                'password': 'demo123',
                'name': 'Compliance Officer',
                'role': 'compliance_officer',
                'company_id': test_company.id,
                'description': 'Compliance and audit'
            },
            {
                'email': 'viewer@demo.com',
                'password': 'demo123',
                'name': 'Read Only User',
                'role': 'read_only',
                'company_id': test_company.id,
                'description': 'View-only access'
            }
        ]

        # Create users
        for account_data in test_accounts:
            user = User.query.filter_by(email=account_data['email']).first()
            if not user:
                user = User(
                    email=account_data['email'],
                    password=generate_password_hash(account_data['password']),
                    name=account_data['name'],
                    company_id=account_data['company_id'],
                    active=True
                )
                db.session.add(user)
                db.session.flush()
                
                # Assign role
                role = Role.query.filter_by(name=account_data['role']).first()
                if role:
                    user.roles.append(role)
                    logger.info(f"Created user: {account_data['email']} with role: {account_data['role']}")
                else:
                    logger.warning(f"Role {account_data['role']} not found")

        # Create some test insured entities for the company
        test_entities = [
            {
                'name': 'John Smith',
                'job_title': 'Senior Manager',
                'practice_field': 'Risk Management',
                'education_level': 'MBA',
                'years_experience': 15,
                'coverage_amount': 2000000,
                'risk_score': 35
            },
            {
                'name': 'Sarah Johnson',
                'job_title': 'Director of Operations',
                'practice_field': 'Operations',
                'education_level': 'Master',
                'years_experience': 12,
                'coverage_amount': 3000000,
                'risk_score': 28
            },
            {
                'name': 'Michael Chen',
                'job_title': 'Chief Financial Officer',
                'practice_field': 'Finance',
                'education_level': 'CPA',
                'years_experience': 20,
                'coverage_amount': 5000000,
                'risk_score': 42
            }
        ]

        for entity_data in test_entities:
            entity = InsuredEntity.query.filter_by(
                name=entity_data['name'],
                company_id=test_company.id
            ).first()
            
            if not entity:
                entity = InsuredEntity(
                    company_id=test_company.id,
                    **entity_data
                )
                db.session.add(entity)
                logger.info(f"Created insured entity: {entity_data['name']}")

        db.session.commit()
        
        click.echo("Test data created successfully!")
        click.echo("\nTest Accounts:")
        click.echo("=" * 50)
        for account in test_accounts:
            click.echo(f"Email: {account['email']}")
            click.echo(f"Password: {account['password']}")
            click.echo(f"Role: {account['role']}")
            click.echo(f"Description: {account['description']}")
            click.echo("-" * 50)
        
    except Exception as e:
        logger.error(f"Error creating test data: {str(e)}")
        db.session.rollback()
        click.echo(f"Error: {str(e)}", err=True)

def init_app(app):
    """Register CLI commands with the app"""
    app.cli.add_command(create_test_data)