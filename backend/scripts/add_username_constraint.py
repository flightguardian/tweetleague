#!/usr/bin/env python
"""
Add a unique constraint on lowercase usernames to prevent case-insensitive duplicates
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.base import engine
from sqlalchemy import text

def add_username_constraint():
    """Add unique index on lowercase username"""
    
    with engine.connect() as conn:
        try:
            # First check if the index already exists
            result = conn.execute(text("""
                SELECT 1 FROM pg_indexes 
                WHERE indexname = 'ix_users_username_lower'
            """))
            
            if result.fetchone():
                print("✅ Index 'ix_users_username_lower' already exists")
                return
            
            # Create unique index on lowercase username
            print("Creating unique index on lowercase username...")
            conn.execute(text("""
                CREATE UNIQUE INDEX ix_users_username_lower 
                ON users (LOWER(username))
            """))
            conn.commit()
            
            print("✅ Successfully created unique index on lowercase username!")
            print("   This will prevent usernames that differ only by case")
            
        except Exception as e:
            print(f"❌ Error creating index: {e}")
            print("\nNote: You may need to fix duplicate usernames first using:")
            print("  python scripts/fix_duplicate_usernames.py")

if __name__ == "__main__":
    add_username_constraint()