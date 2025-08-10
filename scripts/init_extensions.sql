-- PostgreSQL Extensions for ToluAI
-- This file initializes required PostgreSQL extensions

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full text search capabilities
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable case-insensitive text type
CREATE EXTENSION IF NOT EXISTS "citext";

-- Enable advanced indexing
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Create custom schemas
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Set default search path
ALTER DATABASE toluai_dev SET search_path TO public, audit, analytics;