1. Core User & Role System

CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    role_scope VARCHAR(50) NOT NULL, -- e.g., 'system', 'company', 'irpa'
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    permission_id SERIAL PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id INT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE companies (
    company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL UNIQUE,
    industry_type_id INT REFERENCES industry_types(industry_type_id),
    region_id INT REFERENCES regions(region_id),
    operating_margin DECIMAL(5,2),
    company_size INT,
    company_age INT,
    pe_ratio DECIMAL(8,4),
    registration_date DATE NOT NULL,
    legal_structure VARCHAR(50),
    address_line1 VARCHAR(150),
    address_line2 VARCHAR(150),
    city VARCHAR(100),
    zip_code VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(512) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_id INT NOT NULL REFERENCES roles(role_id),
    agree_terms BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    status BOOLEAN DEFAULT TRUE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    failed_login_attempts INT DEFAULT 0,
    notification_settings JSONB
);



2. Reference Tables

CREATE TABLE industry_types (
    industry_type_id SERIAL PRIMARY KEY,
    industry_name VARCHAR(100) NOT NULL UNIQUE,
    risk_category VARCHAR(50) NOT NULL,
    base_risk_factor DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE regions (
    region_id SERIAL PRIMARY KEY,
    region_name VARCHAR(100) NOT NULL UNIQUE,
    region_type VARCHAR(50) NOT NULL, -- 'Country', 'State', 'Metro Area'
    parent_region_id INT REFERENCES regions(region_id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE entity_types (
    entity_type_id SERIAL PRIMARY KEY,
    entity_type_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE education_levels (
    education_level_id SERIAL PRIMARY KEY,
    level_name VARCHAR(100) NOT NULL UNIQUE,
    risk_factor DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_titles (
    job_title_id SERIAL PRIMARY KEY,
    title_name VARCHAR(255) NOT NULL,
    risk_category VARCHAR(50) NOT NULL,
    risk_factor DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE practice_fields (
    practice_field_id SERIAL PRIMARY KEY,
    field_name VARCHAR(255) NOT NULL UNIQUE,
    risk_factor DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);



3. Insured Entities

CREATE TABLE insured_entities (
    insured_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    entity_type_id INT REFERENCES entity_types(entity_type_id),
    education_level_id INT REFERENCES education_levels(education_level_id),
    years_experience INT,
    job_title_id INT REFERENCES job_titles(job_title_id),
    job_tenure INT,
    practice_field_id INT REFERENCES practice_fields(practice_field_id),
    date_of_birth DATE,
    region_id INT REFERENCES regions(region_id),
    fico_score INT,
    dti_ratio DECIMAL(5,2),
    payment_history VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);



4. Risk Assessments

CREATE TABLE risk_assessments (
    assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insured_id UUID NOT NULL REFERENCES insured_entities(insured_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id),
    status VARCHAR(50) NOT NULL, -- 'new', 'in_progress', 'completed', 'error'
    assessment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE risk_assessment_factors (
    factor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES risk_assessments(assessment_id) ON DELETE CASCADE,
    factor_type VARCHAR(100) NOT NULL, -- Or FK to factor_types
    factor_score DECIMAL(5,2) NOT NULL
);



5. External Risk Events

CREATE TABLE data_sources (
    data_source_id SERIAL PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE event_types (
    event_type_id SERIAL PRIMARY KEY,
    event_type_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL -- 'Cybersecurity', 'Compliance', 'Market'
);

CREATE TABLE external_risk_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    event_type_id INT NOT NULL REFERENCES event_types(event_type_id),
    severity_level INT,
    event_date DATE NOT NULL,
    resolution_date DATE,
    description TEXT,
    financial_impact DECIMAL(12,2),
    data_source_id INT REFERENCES data_sources(data_source_id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);



6. Audit Logging

CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    log_type VARCHAR(50) NOT NULL, -- 'activity', 'access'
    details JSONB NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE risk_factor_types (
    factor_type_id SERIAL PRIMARY KEY,
    factor_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- 'Industry', 'Professional', 'Financial', 'External'
    description TEXT,
    weight DECIMAL(5,2), -- default weight for scoring
    risk_direction VARCHAR(20), -- 'positive', 'negative', 'variable'
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE risk_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL, -- 'Low', 'Medium', 'High'
    min_score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL
);

CREATE TABLE risk_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES insured_entities(insured_id),
    model_id INT REFERENCES risk_models(model_id),
    overall_score DECIMAL(5,2) NOT NULL,
    category_id INT REFERENCES risk_categories(category_id),
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE external_data_feeds (
    feed_id SERIAL PRIMARY KEY,
    provider_name VARCHAR(100) NOT NULL,
    api_endpoint TEXT,
    data_format VARCHAR(50), -- JSON, XML, CSV
    last_fetched TIMESTAMP
);

CREATE TABLE external_data_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_id INT NOT NULL REFERENCES external_data_feeds(feed_id),
    entity_id UUID,
    raw_data JSONB,
    fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES risk_assessments(assessment_id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES users(user_id), -- null if auto-generated
    source VARCHAR(20) NOT NULL, -- 'automated', 'manual'
    recommendation_text TEXT NOT NULL,
    priority_level INT CHECK (priority_level BETWEEN 1 AND 5), -- 1 = highest urgency
    category VARCHAR(50), -- e.g., 'Cybersecurity', 'Financial', 'Operational'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'implemented', 'dismissed'
    due_date DATE, -- for time-sensitive actions
    justification TEXT, -- reason for recommendation
    evidence JSONB, -- attach structured data or links
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recommendation_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES recommendations(recommendation_id) ON DELETE CASCADE,
    changed_by_user_id UUID REFERENCES users(user_id),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    change_reason TEXT,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recommendation_factors (
    recommendation_id UUID NOT NULL REFERENCES recommendations(recommendation_id) ON DELETE CASCADE,
    factor_id UUID NOT NULL REFERENCES risk_assessment_factors(factor_id) ON DELETE CASCADE,
    PRIMARY KEY (recommendation_id, factor_id)
);
