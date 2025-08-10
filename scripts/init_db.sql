-- Database initialization for ToluAI Insurance Risk Platform
-- This script creates the initial database schema

-- Enable required extensions (if not already done)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'underwriter', 'agent', 'manager', 'viewer');
CREATE TYPE risk_status AS ENUM ('pending', 'approved', 'rejected', 'review', 'expired');
CREATE TYPE application_status AS ENUM ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'cancelled');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(100) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email CITEXT NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    ssn_encrypted VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for clients
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_external_id ON clients(external_id);
CREATE INDEX idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX idx_clients_name ON clients(last_name, first_name);

-- Insurance applications table
CREATE TABLE IF NOT EXISTS insurance_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    product_type VARCHAR(100) NOT NULL,
    coverage_amount DECIMAL(15, 2),
    premium_amount DECIMAL(15, 2),
    status application_status DEFAULT 'draft',
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    underwriter_id UUID REFERENCES users(id),
    agent_id UUID REFERENCES users(id),
    risk_score DECIMAL(5, 2),
    risk_factors JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for applications
CREATE INDEX idx_applications_number ON insurance_applications(application_number);
CREATE INDEX idx_applications_client ON insurance_applications(client_id);
CREATE INDEX idx_applications_status ON insurance_applications(status);
CREATE INDEX idx_applications_created_at ON insurance_applications(created_at DESC);
CREATE INDEX idx_applications_risk_score ON insurance_applications(risk_score);

-- Risk assessments table
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES insurance_applications(id) ON DELETE CASCADE,
    assessment_type VARCHAR(100) NOT NULL,
    risk_score DECIMAL(5, 2) NOT NULL,
    confidence_level DECIMAL(5, 2),
    factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    model_version VARCHAR(50),
    assessed_by UUID REFERENCES users(id),
    status risk_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for risk assessments
CREATE INDEX idx_risk_assessments_application ON risk_assessments(application_id);
CREATE INDEX idx_risk_assessments_status ON risk_assessments(status);
CREATE INDEX idx_risk_assessments_created_at ON risk_assessments(created_at DESC);
CREATE INDEX idx_risk_assessments_score ON risk_assessments(risk_score);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for audit log
CREATE INDEX idx_audit_log_user ON audit.audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON audit.audit_log(action);

-- Sessions table for user sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for sessions
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100),
    action VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Role permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    role user_role NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role, permission_id)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON insurance_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_assessments_updated_at BEFORE UPDATE ON risk_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action) VALUES
    ('users.create', 'Create new users', 'users', 'create'),
    ('users.read', 'View user information', 'users', 'read'),
    ('users.update', 'Update user information', 'users', 'update'),
    ('users.delete', 'Delete users', 'users', 'delete'),
    ('applications.create', 'Create insurance applications', 'applications', 'create'),
    ('applications.read', 'View insurance applications', 'applications', 'read'),
    ('applications.update', 'Update insurance applications', 'applications', 'update'),
    ('applications.approve', 'Approve insurance applications', 'applications', 'approve'),
    ('applications.reject', 'Reject insurance applications', 'applications', 'reject'),
    ('risk.assess', 'Perform risk assessments', 'risk', 'assess'),
    ('risk.override', 'Override risk assessments', 'risk', 'override'),
    ('reports.view', 'View reports', 'reports', 'view'),
    ('reports.generate', 'Generate reports', 'reports', 'generate'),
    ('admin.access', 'Access admin panel', 'admin', 'access')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'underwriter', id FROM permissions 
WHERE name IN ('applications.read', 'applications.update', 'applications.approve', 
               'applications.reject', 'risk.assess', 'risk.override', 'reports.view')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'agent', id FROM permissions 
WHERE name IN ('applications.create', 'applications.read', 'applications.update', 
               'clients.create', 'clients.read', 'clients.update')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'manager', id FROM permissions 
WHERE name IN ('applications.read', 'risk.assess', 'reports.view', 'reports.generate')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'viewer', id FROM permissions 
WHERE name IN ('applications.read', 'reports.view')
ON CONFLICT DO NOTHING;

-- Create a default admin user (password: Admin123!)
-- Note: Change this password immediately in production!
INSERT INTO users (email, username, password_hash, first_name, last_name, role, is_active, is_verified)
VALUES (
    'admin@toluai.com',
    'admin',
    '$2b$12$LQy9hnA6tqNWpKJy5BPkX.UFxgHwJNRjY8GHVvqEVXvLjC5AqzRZK', -- bcrypt hash of 'Admin123!'
    'System',
    'Administrator',
    'admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_gin_applications_metadata ON insurance_applications USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_gin_risk_factors ON insurance_applications USING gin(risk_factors);
CREATE INDEX IF NOT EXISTS idx_gin_risk_assessment_factors ON risk_assessments USING gin(factors);

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO toluai_dev;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO toluai_dev;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO toluai_dev;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO toluai_dev;