#!/usr/bin/env bash
# Build script for Render deployment

set -e

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL not set, using SQLite for initial build"
    export DATABASE_URL="sqlite:///./predictions.db"
fi

echo "Running database migrations..."
python -c "
import os
# Set default database URL if not provided
if not os.getenv('DATABASE_URL'):
    os.environ['DATABASE_URL'] = 'sqlite:///./predictions.db'
    
from database.base import engine
from models import models, email_verification
models.Base.metadata.create_all(bind=engine)
email_verification.Base.metadata.create_all(bind=engine)
print('Database tables created successfully!')
"

echo "Build completed successfully!"