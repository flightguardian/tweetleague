#!/usr/bin/env python3
"""
Add twitter_handle column to users table if it doesn't exist
"""

import sqlite3
from database.base import settings

def add_twitter_handle_column():
    # Connect to the database
    if settings.DATABASE_URL.startswith("sqlite"):
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'twitter_handle' not in columns:
            print("Adding twitter_handle column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN twitter_handle VARCHAR")
            conn.commit()
            print("✅ twitter_handle column added successfully")
        else:
            print("✅ twitter_handle column already exists")
        
        conn.close()
    else:
        print("This script is for SQLite databases only")
        
if __name__ == "__main__":
    add_twitter_handle_column()