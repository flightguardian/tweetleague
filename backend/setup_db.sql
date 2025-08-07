-- Run this as postgres user: sudo -u postgres psql < setup_db.sql

-- Create database
CREATE DATABASE predictionleague;

-- Create user
CREATE USER predictionuser WITH PASSWORD 'predictionpass123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE predictionleague TO predictionuser;

-- Connect to the database
\c predictionleague

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO predictionuser;