#!/usr/bin/env bash
# Build script for Render deployment

set -e

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Running database migrations..."
python -c "
from database.base import engine
from models import models, email_verification
models.Base.metadata.create_all(bind=engine)
email_verification.Base.metadata.create_all(bind=engine)
print('Database tables created successfully!')
"

echo "Build completed successfully!"