#!/usr/bin/env python3
"""
Recreate the database with the current schema
"""

from database.base import Base, engine
from models.models import User, Season, Fixture, Prediction, UserStats, Notification

def recreate_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables with current schema...")
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database recreated successfully with current schema!")
    print("Note: All data has been deleted. You'll need to:")
    print("  1. Run populate_2024_season.py to add fixtures")
    print("  2. Register a new admin account")
    print("  3. Use make_admin.py to grant admin privileges")

if __name__ == "__main__":
    response = input("⚠️  This will DELETE ALL DATA and recreate the database. Type 'YES' to confirm: ")
    if response == "YES":
        recreate_database()
    else:
        print("Operation cancelled")