#!/bin/bash

echo "Setting up PostgreSQL database for Prediction League..."
echo "You may be prompted for your sudo password."

# Create database and user
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE predictionleague;

-- Create user
CREATE USER predictionuser WITH PASSWORD 'predictionpass123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE predictionleague TO predictionuser;

-- Connect to the database and grant schema permissions
\c predictionleague
GRANT ALL ON SCHEMA public TO predictionuser;

-- Show created databases and users
\l
\du
EOF

echo ""
echo "Database setup complete!"
echo "Database: predictionleague"
echo "User: predictionuser"
echo "Password: predictionpass123"
echo ""
echo "Please update your .env file with:"
echo "DATABASE_URL=postgresql://predictionuser:predictionpass123@localhost/predictionleague"