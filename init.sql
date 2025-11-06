-- Initialize SERENO database
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE sereno_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sereno_db')\gexec

-- Connect to the database
\c sereno_db;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create initial admin user (will be handled by Prisma migrations)
-- This is just a placeholder for any additional setup needed