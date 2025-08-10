#!/usr/bin/env python3
"""
Initialize reference data tables with default values
This ensures that the application has necessary reference data to function properly
"""

from backend.app import create_app, db
from backend.models.irpa import IndustryType, State, EducationLevel, JobTitle, PracticeField

def init_reference_data():
    """Initialize reference data tables with default values"""
    
    # Initialize Industry Types
    industry_types = [
        {'industry_name': 'Technology', 'risk_category': 'Low', 'base_risk_factor': 1.0},
        {'industry_name': 'Healthcare', 'risk_category': 'Medium', 'base_risk_factor': 1.5},
        {'industry_name': 'Finance', 'risk_category': 'Medium', 'base_risk_factor': 1.4},
        {'industry_name': 'Manufacturing', 'risk_category': 'High', 'base_risk_factor': 2.0},
        {'industry_name': 'Retail', 'risk_category': 'Low', 'base_risk_factor': 1.2},
        {'industry_name': 'Construction', 'risk_category': 'High', 'base_risk_factor': 2.2},
        {'industry_name': 'Transportation', 'risk_category': 'High', 'base_risk_factor': 1.8},
        {'industry_name': 'Education', 'risk_category': 'Low', 'base_risk_factor': 0.8},
        {'industry_name': 'Real Estate', 'risk_category': 'Medium', 'base_risk_factor': 1.3},
        {'industry_name': 'Hospitality', 'risk_category': 'Medium', 'base_risk_factor': 1.4},
        {'industry_name': 'Agriculture', 'risk_category': 'Medium', 'base_risk_factor': 1.6},
        {'industry_name': 'Energy', 'risk_category': 'High', 'base_risk_factor': 2.1},
        {'industry_name': 'Telecommunications', 'risk_category': 'Low', 'base_risk_factor': 1.1},
        {'industry_name': 'Media & Entertainment', 'risk_category': 'Low', 'base_risk_factor': 1.0},
        {'industry_name': 'Pharmaceuticals', 'risk_category': 'High', 'base_risk_factor': 2.3},
        {'industry_name': 'Insurance', 'risk_category': 'Medium', 'base_risk_factor': 1.3},
        {'industry_name': 'Legal Services', 'risk_category': 'High', 'base_risk_factor': 2.0},
        {'industry_name': 'Consulting', 'risk_category': 'Low', 'base_risk_factor': 1.1},
        {'industry_name': 'Other', 'risk_category': 'Medium', 'base_risk_factor': 1.5},
    ]
    
    for industry_data in industry_types:
        existing = IndustryType.query.filter_by(industry_name=industry_data['industry_name']).first()
        if not existing:
            industry = IndustryType(**industry_data)
            db.session.add(industry)
            print(f"Added industry type: {industry_data['industry_name']}")
    
    # Initialize States
    states = [
        {'state_code': 'AL', 'state_name': 'Alabama', 'risk_factor': 1.2},
        {'state_code': 'AK', 'state_name': 'Alaska', 'risk_factor': 1.4},
        {'state_code': 'AZ', 'state_name': 'Arizona', 'risk_factor': 1.1},
        {'state_code': 'AR', 'state_name': 'Arkansas', 'risk_factor': 1.3},
        {'state_code': 'CA', 'state_name': 'California', 'risk_factor': 1.8},
        {'state_code': 'CO', 'state_name': 'Colorado', 'risk_factor': 1.0},
        {'state_code': 'CT', 'state_name': 'Connecticut', 'risk_factor': 1.1},
        {'state_code': 'DE', 'state_name': 'Delaware', 'risk_factor': 1.0},
        {'state_code': 'FL', 'state_name': 'Florida', 'risk_factor': 1.6},
        {'state_code': 'GA', 'state_name': 'Georgia', 'risk_factor': 1.2},
        {'state_code': 'HI', 'state_name': 'Hawaii', 'risk_factor': 1.3},
        {'state_code': 'ID', 'state_name': 'Idaho', 'risk_factor': 0.9},
        {'state_code': 'IL', 'state_name': 'Illinois', 'risk_factor': 1.5},
        {'state_code': 'IN', 'state_name': 'Indiana', 'risk_factor': 1.1},
        {'state_code': 'IA', 'state_name': 'Iowa', 'risk_factor': 0.9},
        {'state_code': 'KS', 'state_name': 'Kansas', 'risk_factor': 1.0},
        {'state_code': 'KY', 'state_name': 'Kentucky', 'risk_factor': 1.2},
        {'state_code': 'LA', 'state_name': 'Louisiana', 'risk_factor': 1.7},
        {'state_code': 'ME', 'state_name': 'Maine', 'risk_factor': 0.9},
        {'state_code': 'MD', 'state_name': 'Maryland', 'risk_factor': 1.2},
        {'state_code': 'MA', 'state_name': 'Massachusetts', 'risk_factor': 1.1},
        {'state_code': 'MI', 'state_name': 'Michigan', 'risk_factor': 1.3},
        {'state_code': 'MN', 'state_name': 'Minnesota', 'risk_factor': 0.9},
        {'state_code': 'MS', 'state_name': 'Mississippi', 'risk_factor': 1.5},
        {'state_code': 'MO', 'state_name': 'Missouri', 'risk_factor': 1.1},
        {'state_code': 'MT', 'state_name': 'Montana', 'risk_factor': 0.9},
        {'state_code': 'NE', 'state_name': 'Nebraska', 'risk_factor': 0.9},
        {'state_code': 'NV', 'state_name': 'Nevada', 'risk_factor': 1.4},
        {'state_code': 'NH', 'state_name': 'New Hampshire', 'risk_factor': 0.9},
        {'state_code': 'NJ', 'state_name': 'New Jersey', 'risk_factor': 1.4},
        {'state_code': 'NM', 'state_name': 'New Mexico', 'risk_factor': 1.3},
        {'state_code': 'NY', 'state_name': 'New York', 'risk_factor': 1.7},
        {'state_code': 'NC', 'state_name': 'North Carolina', 'risk_factor': 1.1},
        {'state_code': 'ND', 'state_name': 'North Dakota', 'risk_factor': 0.8},
        {'state_code': 'OH', 'state_name': 'Ohio', 'risk_factor': 1.2},
        {'state_code': 'OK', 'state_name': 'Oklahoma', 'risk_factor': 1.2},
        {'state_code': 'OR', 'state_name': 'Oregon', 'risk_factor': 1.0},
        {'state_code': 'PA', 'state_name': 'Pennsylvania', 'risk_factor': 1.2},
        {'state_code': 'RI', 'state_name': 'Rhode Island', 'risk_factor': 1.1},
        {'state_code': 'SC', 'state_name': 'South Carolina', 'risk_factor': 1.2},
        {'state_code': 'SD', 'state_name': 'South Dakota', 'risk_factor': 0.8},
        {'state_code': 'TN', 'state_name': 'Tennessee', 'risk_factor': 1.1},
        {'state_code': 'TX', 'state_name': 'Texas', 'risk_factor': 1.5},
        {'state_code': 'UT', 'state_name': 'Utah', 'risk_factor': 0.9},
        {'state_code': 'VT', 'state_name': 'Vermont', 'risk_factor': 0.8},
        {'state_code': 'VA', 'state_name': 'Virginia', 'risk_factor': 1.1},
        {'state_code': 'WA', 'state_name': 'Washington', 'risk_factor': 1.0},
        {'state_code': 'WV', 'state_name': 'West Virginia', 'risk_factor': 1.4},
        {'state_code': 'WI', 'state_name': 'Wisconsin', 'risk_factor': 0.9},
        {'state_code': 'WY', 'state_name': 'Wyoming', 'risk_factor': 0.9},
    ]
    
    for state_data in states:
        existing = State.query.filter_by(state_code=state_data['state_code']).first()
        if not existing:
            state = State(**state_data)
            db.session.add(state)
            print(f"Added state: {state_data['state_name']}")
    
    # Initialize Education Levels
    education_levels = [
        {'level_name': 'High School', 'risk_factor': 2.0},
        {'level_name': 'Some College', 'risk_factor': 1.7},
        {'level_name': 'Associate Degree', 'risk_factor': 1.5},
        {'level_name': 'Bachelor\'s Degree', 'risk_factor': 1.0},
        {'level_name': 'Master\'s Degree', 'risk_factor': 0.8},
        {'level_name': 'Doctoral Degree', 'risk_factor': 0.7},
        {'level_name': 'Professional Degree', 'risk_factor': 0.9},
        {'level_name': 'Trade/Vocational', 'risk_factor': 1.4},
        {'level_name': 'Certificate Program', 'risk_factor': 1.3},
    ]
    
    for edu_data in education_levels:
        existing = EducationLevel.query.filter_by(level_name=edu_data['level_name']).first()
        if not existing:
            edu_level = EducationLevel(**edu_data)
            db.session.add(edu_level)
            print(f"Added education level: {edu_data['level_name']}")
    
    # Initialize Job Titles
    job_titles = [
        {'title_name': 'CEO', 'risk_category': 'Executive', 'risk_factor': 2.5},
        {'title_name': 'CFO', 'risk_category': 'Executive', 'risk_factor': 2.3},
        {'title_name': 'CTO', 'risk_category': 'Executive', 'risk_factor': 2.0},
        {'title_name': 'COO', 'risk_category': 'Executive', 'risk_factor': 2.2},
        {'title_name': 'President', 'risk_category': 'Executive', 'risk_factor': 2.4},
        {'title_name': 'Vice President', 'risk_category': 'Executive', 'risk_factor': 2.0},
        {'title_name': 'Director', 'risk_category': 'Management', 'risk_factor': 1.8},
        {'title_name': 'Manager', 'risk_category': 'Management', 'risk_factor': 1.5},
        {'title_name': 'Supervisor', 'risk_category': 'Management', 'risk_factor': 1.3},
        {'title_name': 'Team Lead', 'risk_category': 'Management', 'risk_factor': 1.2},
        {'title_name': 'Senior Engineer', 'risk_category': 'Professional', 'risk_factor': 1.0},
        {'title_name': 'Engineer', 'risk_category': 'Professional', 'risk_factor': 0.9},
        {'title_name': 'Analyst', 'risk_category': 'Professional', 'risk_factor': 0.8},
        {'title_name': 'Consultant', 'risk_category': 'Professional', 'risk_factor': 1.1},
        {'title_name': 'Specialist', 'risk_category': 'Professional', 'risk_factor': 1.0},
        {'title_name': 'Coordinator', 'risk_category': 'Administrative', 'risk_factor': 0.7},
        {'title_name': 'Administrator', 'risk_category': 'Administrative', 'risk_factor': 0.8},
        {'title_name': 'Assistant', 'risk_category': 'Administrative', 'risk_factor': 0.6},
        {'title_name': 'Attorney', 'risk_category': 'Professional', 'risk_factor': 2.5},
        {'title_name': 'Physician', 'risk_category': 'Professional', 'risk_factor': 2.8},
        {'title_name': 'Surgeon', 'risk_category': 'Professional', 'risk_factor': 3.0},
        {'title_name': 'Nurse', 'risk_category': 'Professional', 'risk_factor': 1.2},
        {'title_name': 'Architect', 'risk_category': 'Professional', 'risk_factor': 1.8},
        {'title_name': 'Accountant', 'risk_category': 'Professional', 'risk_factor': 1.4},
        {'title_name': 'Other', 'risk_category': 'Other', 'risk_factor': 1.0},
    ]
    
    for job_data in job_titles:
        existing = JobTitle.query.filter_by(title_name=job_data['title_name']).first()
        if not existing:
            job_title = JobTitle(**job_data)
            db.session.add(job_title)
            print(f"Added job title: {job_data['title_name']}")
    
    # Initialize Practice Fields
    practice_fields = [
        {'field_name': 'Medicine', 'risk_factor': 2.5},
        {'field_name': 'Law', 'risk_factor': 2.3},
        {'field_name': 'Engineering', 'risk_factor': 1.5},
        {'field_name': 'Accounting', 'risk_factor': 1.4},
        {'field_name': 'Architecture', 'risk_factor': 1.8},
        {'field_name': 'Information Technology', 'risk_factor': 1.0},
        {'field_name': 'Finance', 'risk_factor': 1.6},
        {'field_name': 'Real Estate', 'risk_factor': 1.7},
        {'field_name': 'Consulting', 'risk_factor': 1.2},
        {'field_name': 'Healthcare Administration', 'risk_factor': 1.9},
        {'field_name': 'Education', 'risk_factor': 0.8},
        {'field_name': 'Marketing', 'risk_factor': 0.9},
        {'field_name': 'Human Resources', 'risk_factor': 0.7},
        {'field_name': 'Operations', 'risk_factor': 1.3},
        {'field_name': 'Research & Development', 'risk_factor': 1.1},
        {'field_name': 'Sales', 'risk_factor': 1.0},
        {'field_name': 'Customer Service', 'risk_factor': 0.6},
        {'field_name': 'Manufacturing', 'risk_factor': 1.8},
        {'field_name': 'Supply Chain', 'risk_factor': 1.4},
        {'field_name': 'Other', 'risk_factor': 1.0},
    ]
    
    for field_data in practice_fields:
        existing = PracticeField.query.filter_by(field_name=field_data['field_name']).first()
        if not existing:
            practice_field = PracticeField(**field_data)
            db.session.add(practice_field)
            print(f"Added practice field: {field_data['field_name']}")
    
    # Commit all changes
    db.session.commit()
    print("\nReference data initialization complete!")

if __name__ == '__main__':
    app = create_app('development')
    with app.app_context():
        init_reference_data()