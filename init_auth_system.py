#!/usr/bin/env python3
"""
Initialize Authentication System and Create Demo Users
Run this script to set up the complete auth system with test data
"""

import os
import sys
from datetime import datetime, timedelta
import random
import logging

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

def init_database():
    """Initialize database tables"""
    from flask import Flask
    from flask_sqlalchemy import SQLAlchemy
    from flask_migrate import Migrate
    
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI', 'sqlite:///instance/toluai.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'dev-secret-key-change-in-production'
    
    db = SQLAlchemy(app)
    migrate = Migrate(app, db)
    
    # Import all models to ensure they're registered
    with app.app_context():
        # Import models
        from app.models.auth import User, Role, Permission
        from app.models.client import Client
        from app.models.assessment import RiskAssessment, RiskFactor, Recommendation
        
        # Try to import IRPA models if they exist
        try:
            from app.models.irpa import IRPACompany
        except ImportError:
            # Create a simple company model if IRPA doesn't exist
            class IRPACompany(db.Model):
                __tablename__ = 'irpa_companies'
                id = db.Column(db.Integer, primary_key=True)
                name = db.Column(db.String(200), nullable=False)
                industry = db.Column(db.String(100))
                location = db.Column(db.String(200))
                size = db.Column(db.Integer)
                email = db.Column(db.String(100))
                phone = db.Column(db.String(20))
                created_at = db.Column(db.DateTime, default=datetime.utcnow)
        
        # Create all tables
        db.create_all()
        logger.info("✓ Database tables created")
        
        return app, db

def init_permissions(db):
    """Create all permissions"""
    from app.models.auth import Permission
    
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
                existing = db.session.query(Permission).filter_by(name=perm_name).first()
                if not existing:
                    perm = Permission(
                        name=perm_name,
                        resource=resource,
                        action=action,
                        scope=scope,
                        description=f"{action.capitalize()} {resource} ({scope})"
                    )
                    db.session.add(perm)
                    permission_count += 1
    
    db.session.commit()
    logger.info(f"✓ Created {permission_count} permissions")
    return permission_count

def init_roles(db):
    """Create system roles with permissions"""
    from app.models.auth import Role, Permission, SYSTEM_ROLES
    
    role_count = 0
    for role_name, role_config in SYSTEM_ROLES.items():
        existing_role = db.session.query(Role).filter_by(name=role_name).first()
        if not existing_role:
            role = Role(
                name=role_name,
                display_name=role_config['display_name'],
                description=role_config['description'],
                is_system_role=True
            )
            db.session.add(role)
            db.session.flush()
            role_count += 1
        else:
            role = existing_role
        
        # Clear existing permissions
        role.permissions = []
        
        # Assign permissions
        if role_config['permissions'] == ['*']:
            # System admin gets all permissions
            all_perms = db.session.query(Permission).all()
            role.permissions.extend(all_perms)
        else:
            # Assign specific permissions
            for perm_name in role_config['permissions']:
                perm = db.session.query(Permission).filter_by(name=perm_name).first()
                if perm and perm not in role.permissions:
                    role.permissions.append(perm)
    
    db.session.commit()
    logger.info(f"✓ Created/Updated {role_count} system roles")
    return role_count

def create_companies(db):
    """Create demo companies"""
    try:
        from app.models.irpa import IRPACompany
    except ImportError:
        # Create simple company class inline
        from app.models.auth import db as auth_db
        
        class IRPACompany(auth_db.Model):
            __tablename__ = 'irpa_companies'
            id = auth_db.Column(auth_db.Integer, primary_key=True)
            name = auth_db.Column(auth_db.String(200), nullable=False)
            industry = auth_db.Column(auth_db.String(100))
            location = auth_db.Column(auth_db.String(200))
            size = auth_db.Column(auth_db.Integer)
            email = auth_db.Column(auth_db.String(100))
            phone = auth_db.Column(auth_db.String(20))
            created_at = auth_db.Column(auth_db.DateTime, default=datetime.utcnow)
    
    companies = []
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
        existing = db.session.query(IRPACompany).filter_by(name=company_data['name']).first()
        if not existing:
            company = IRPACompany(**company_data)
            db.session.add(company)
            companies.append(company)
        else:
            companies.append(existing)
    
    db.session.commit()
    logger.info(f"✓ Ensured {len(companies)} companies exist")
    return companies

def create_demo_users(db, companies):
    """Create demo users for each role"""
    from app.models.auth import User, Role
    
    # Demo user configurations
    demo_users = [
        {
            'email': 'admin@toluai.com',
            'password': 'Admin123!',
            'name': 'System Administrator',
            'role': 'system_admin',
            'company': None,
            'job_title': 'System Administrator',
            'department': 'IT'
        },
        {
            'email': 'company.admin@acme.com',
            'password': 'CompanyAdmin123!',
            'name': 'John Smith',
            'role': 'company_admin',
            'company': companies[0] if companies else None,
            'job_title': 'Company Administrator',
            'department': 'Management'
        },
        {
            'email': 'risk.analyst@acme.com',
            'password': 'Analyst123!',
            'name': 'Sarah Johnson',
            'role': 'risk_analyst',
            'company': companies[0] if companies else None,
            'job_title': 'Senior Risk Analyst',
            'department': 'Risk Management'
        },
        {
            'email': 'underwriter@acme.com',
            'password': 'Underwriter123!',
            'name': 'Michael Chen',
            'role': 'underwriter',
            'company': companies[0] if companies else None,
            'job_title': 'Chief Underwriter',
            'department': 'Underwriting'
        },
        {
            'email': 'compliance@acme.com',
            'password': 'Compliance123!',
            'name': 'Emily Davis',
            'role': 'compliance_officer',
            'company': companies[0] if companies else None,
            'job_title': 'Compliance Officer',
            'department': 'Compliance'
        },
        {
            'email': 'viewer@acme.com',
            'password': 'Viewer123!',
            'name': 'Robert Wilson',
            'role': 'read_only',
            'company': companies[0] if companies else None,
            'job_title': 'Business Analyst',
            'department': 'Operations'
        }
    ]
    
    if len(companies) > 1:
        demo_users.append({
            'email': 'admin@globalrisk.com',
            'password': 'GlobalAdmin123!',
            'name': 'Lisa Anderson',
            'role': 'company_admin',
            'company': companies[1],
            'job_title': 'Company Administrator',
            'department': 'Management'
        })
    
    created_users = []
    for user_data in demo_users:
        existing_user = db.session.query(User).filter_by(email=user_data['email']).first()
        if existing_user:
            logger.info(f"  User {user_data['email']} already exists")
            continue
        
        user = User(
            email=user_data['email'],
            name=user_data['name'],
            password=user_data['password'],
            company_id=user_data['company'].id if user_data['company'] else None,
            job_title=user_data['job_title'],
            department=user_data['department'],
            active=True,
            confirmed_at=datetime.utcnow()
        )
        
        # Assign role
        role = db.session.query(Role).filter_by(name=user_data['role']).first()
        if role:
            user.roles.append(role)
        
        db.session.add(user)
        created_users.append((user_data['email'], user_data['password'], user_data['role']))
    
    db.session.commit()
    logger.info(f"✓ Created {len(created_users)} demo users")
    
    return created_users

def create_test_data(db, companies):
    """Create test clients and assessments"""
    from app.models.client import Client
    from app.models.assessment import RiskAssessment, RiskFactor, Recommendation
    from app.models.auth import User
    
    industries = ['Technology', 'Healthcare', 'Manufacturing', 'Retail', 'Finance']
    
    created_count = 0
    for company in companies[:2]:
        for i in range(3):
            client_name = f"{company.name} Client {i+1}"
            existing = db.session.query(Client).filter_by(name=client_name).first()
            if existing:
                continue
            
            client = Client(
                name=client_name,
                email=f"client{i+1}@example.com",
                phone=f"555-{random.randint(1000, 9999)}",
                industry=random.choice(industries),
                annual_revenue=random.randint(1000000, 50000000),
                employee_count=random.randint(10, 1000),
                years_in_business=random.randint(1, 30),
                address=f"{random.randint(100, 999)} Main St",
                city=random.choice(['New York', 'Chicago', 'Los Angeles']),
                state=random.choice(['NY', 'IL', 'CA']),
                zip_code=f"{random.randint(10000, 99999)}",
                status='active'
            )
            db.session.add(client)
            db.session.flush()
            
            # Create assessment
            if random.random() > 0.3:
                # Get first user as assessor
                assessor = db.session.query(User).first()
                if assessor:
                    risk_score = random.randint(30, 90)
                    assessment = RiskAssessment(
                        client_id=client.id,
                        user_id=assessor.id,
                        risk_score=risk_score,
                        risk_category='High' if risk_score > 70 else 'Medium' if risk_score > 40 else 'Low',
                        confidence_score=random.randint(70, 95),
                        assessment_date=datetime.utcnow(),
                        status='completed'
                    )
                    db.session.add(assessment)
            
            created_count += 1
    
    db.session.commit()
    logger.info(f"✓ Created {created_count} test clients with assessments")

def main():
    """Main initialization function"""
    logger.info("="*60)
    logger.info("AUTHENTICATION SYSTEM INITIALIZATION")
    logger.info("="*60)
    
    try:
        # Initialize database
        app, db = init_database()
        
        with app.app_context():
            # Initialize permissions
            init_permissions(db)
            
            # Initialize roles
            init_roles(db)
            
            # Create companies
            companies = create_companies(db)
            
            # Create demo users
            users = create_demo_users(db, companies)
            
            # Create test data
            create_test_data(db, companies)
            
            # Print credentials
            logger.info("\n" + "="*60)
            logger.info("DEMO USER CREDENTIALS")
            logger.info("="*60)
            logger.info("\nYou can login with these credentials:\n")
            
            credentials = [
                ("SYSTEM ADMIN", "admin@toluai.com", "Admin123!"),
                ("COMPANY ADMIN", "company.admin@acme.com", "CompanyAdmin123!"),
                ("RISK ANALYST", "risk.analyst@acme.com", "Analyst123!"),
                ("UNDERWRITER", "underwriter@acme.com", "Underwriter123!"),
                ("COMPLIANCE", "compliance@acme.com", "Compliance123!"),
                ("READ ONLY", "viewer@acme.com", "Viewer123!"),
            ]
            
            for role, email, password in credentials:
                logger.info(f"{role:15} | Email: {email:30} | Password: {password}")
            
            logger.info("="*60)
            logger.info("\n✓ Authentication system initialized successfully!")
            logger.info("\nAPI Endpoints:")
            logger.info("  POST /api/v1/auth/login     - Login with email/password")
            logger.info("  GET  /api/v1/auth/me        - Get current user info")
            logger.info("  POST /api/v1/auth/refresh   - Refresh access token")
            logger.info("  POST /api/v1/auth/logout    - Logout")
            
    except Exception as e:
        logger.error(f"\n✗ Error during initialization: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()