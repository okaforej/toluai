#!/usr/bin/env python3
"""Script to run the IRPA migration with SQLite UUID compatibility"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from sqlalchemy import text

def apply_irpa_migration():
    """Apply IRPA migration manually for SQLite"""
    app = create_app()
    with app.app_context():
        print("Applying IRPA migration for SQLite...")
        
        # Create IRPA tables with proper UUID handling for SQLite
        queries = [
            # Reference Tables
            """
            CREATE TABLE IF NOT EXISTS industry_types (
                industry_type_id INTEGER PRIMARY KEY,
                industry_name VARCHAR(100) NOT NULL UNIQUE,
                risk_category VARCHAR(50) NOT NULL,
                base_risk_factor DECIMAL(5,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS states (
                state_id INTEGER PRIMARY KEY,
                state_code VARCHAR(2) NOT NULL UNIQUE,
                state_name VARCHAR(100) NOT NULL UNIQUE,
                risk_factor DECIMAL(5,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS education_levels (
                education_level_id INTEGER PRIMARY KEY,
                level_name VARCHAR(100) NOT NULL UNIQUE,
                risk_factor DECIMAL(5,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS job_titles (
                job_title_id INTEGER PRIMARY KEY,
                title_name VARCHAR(255) NOT NULL,
                risk_category VARCHAR(50) NOT NULL,
                risk_factor DECIMAL(5,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS practice_fields (
                practice_field_id INTEGER PRIMARY KEY,
                field_name VARCHAR(255) NOT NULL UNIQUE,
                risk_factor DECIMAL(5,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS irpa_roles (
                role_id INTEGER PRIMARY KEY,
                role_name VARCHAR(50) NOT NULL UNIQUE,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS permissions (
                permission_id INTEGER PRIMARY KEY,
                permission_name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS data_sources (
                data_source_id INTEGER PRIMARY KEY,
                source_name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                reliability_score DECIMAL(3,2),
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS incident_types (
                incident_type_id INTEGER PRIMARY KEY,
                type_name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                base_risk_factor DECIMAL(5,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS indicator_types (
                indicator_type_id INTEGER PRIMARY KEY,
                indicator_name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                unit VARCHAR(50),
                risk_correlation VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            # Main Entity Tables (using VARCHAR for UUIDs in SQLite)
            """
            CREATE TABLE IF NOT EXISTS irpa_companies (
                company_id VARCHAR(36) PRIMARY KEY,
                company_name VARCHAR(255) NOT NULL UNIQUE,
                industry_type_id INTEGER,
                operating_margin DECIMAL(5,2),
                company_size INTEGER,
                company_age INTEGER,
                pe_ratio DECIMAL(8,4),
                state_id INTEGER,
                registration_date DATE NOT NULL,
                legal_structure VARCHAR(50),
                address_line1 VARCHAR(150),
                address_line2 VARCHAR(150),
                city VARCHAR(100),
                zip_code VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (industry_type_id) REFERENCES industry_types(industry_type_id),
                FOREIGN KEY (state_id) REFERENCES states(state_id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS irpa_users (
                user_id VARCHAR(36) PRIMARY KEY,
                company_id VARCHAR(36) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(512) NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                role_id INTEGER NOT NULL,
                agree_terms BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                created_by VARCHAR(36),
                status BOOLEAN DEFAULT 1,
                mfa_enabled BOOLEAN DEFAULT 0,
                failed_login_attempts INTEGER DEFAULT 0,
                notification_settings TEXT,
                FOREIGN KEY (company_id) REFERENCES irpa_companies(company_id),
                FOREIGN KEY (role_id) REFERENCES irpa_roles(role_id),
                FOREIGN KEY (created_by) REFERENCES irpa_users(user_id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS insured_entities (
                insured_id VARCHAR(36) PRIMARY KEY,
                company_id VARCHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                education_level_id INTEGER,
                years_experience INTEGER,
                job_title_id INTEGER,
                job_tenure INTEGER,
                practice_field_id INTEGER,
                date_of_birth DATE,
                state_id INTEGER,
                fico_score INTEGER,
                dti_ratio DECIMAL(5,2),
                payment_history VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES irpa_companies(company_id),
                FOREIGN KEY (education_level_id) REFERENCES education_levels(education_level_id),
                FOREIGN KEY (job_title_id) REFERENCES job_titles(job_title_id),
                FOREIGN KEY (practice_field_id) REFERENCES practice_fields(practice_field_id),
                FOREIGN KEY (state_id) REFERENCES states(state_id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS irpa_risk_assessments (
                assessment_id VARCHAR(36) PRIMARY KEY,
                insured_id VARCHAR(36) NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                status VARCHAR(50) NOT NULL,
                irpa_cci_score DECIMAL(5,2),
                industry_risk_score DECIMAL(5,2),
                professional_risk_score DECIMAL(5,2),
                financial_risk_score DECIMAL(5,2),
                operating_margin_risk DECIMAL(5,2),
                company_size_risk DECIMAL(5,2),
                company_age_risk DECIMAL(5,2),
                pe_ratio_risk DECIMAL(5,2),
                education_level_risk DECIMAL(5,2),
                experience_risk DECIMAL(5,2),
                job_title_score DECIMAL(5,2),
                job_tenure_score DECIMAL(5,2),
                practice_field_score DECIMAL(5,2),
                age_score DECIMAL(5,2),
                state_risk_score DECIMAL(5,2),
                fico_risk_score DECIMAL(5,2),
                dti_risk_score DECIMAL(5,2),
                payment_history_risk_score DECIMAL(5,2),
                assessment_date TIMESTAMP NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (insured_id) REFERENCES insured_entities(insured_id),
                FOREIGN KEY (user_id) REFERENCES irpa_users(user_id)
            )
            """,
            # Access Control Tables
            """
            CREATE TABLE IF NOT EXISTS role_permissions (
                role_id INTEGER NOT NULL,
                permission_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (role_id, permission_id),
                FOREIGN KEY (role_id) REFERENCES irpa_roles(role_id),
                FOREIGN KEY (permission_id) REFERENCES permissions(permission_id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS user_activity_log (
                log_id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                activity_type VARCHAR(100) NOT NULL,
                entity_type VARCHAR(50),
                entity_id VARCHAR(36),
                action_details TEXT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES irpa_users(user_id)
            )
            """
        ]
        
        try:
            for query in queries:
                db.session.execute(text(query))
            
            db.session.commit()
            print("✅ IRPA tables created successfully for SQLite!")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating IRPA tables: {str(e)}")
            raise

if __name__ == '__main__':
    apply_irpa_migration()