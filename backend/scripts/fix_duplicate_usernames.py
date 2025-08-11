#!/usr/bin/env python
"""
Fix duplicate usernames that differ only by case
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.base import SessionLocal
from models.models import User
from sqlalchemy import func
from collections import defaultdict

def fix_duplicate_usernames():
    """Find and fix duplicate usernames (case-insensitive)"""
    db = SessionLocal()
    
    try:
        # Find all users
        all_users = db.query(User).all()
        
        # Group by lowercase username
        username_groups = defaultdict(list)
        for user in all_users:
            username_groups[user.username.lower()].append(user)
        
        # Find duplicates
        duplicates_found = False
        for lowercase_username, users in username_groups.items():
            if len(users) > 1:
                duplicates_found = True
                print(f"\nFound duplicate usernames for '{lowercase_username}':")
                for user in users:
                    print(f"  - User ID {user.id}: '{user.username}' (email: {user.email}, provider: {user.provider})")
                
                # Keep the first one (oldest), rename others
                users.sort(key=lambda u: u.id)  # Sort by ID (oldest first)
                original = users[0]
                print(f"  Keeping: '{original.username}' (ID: {original.id})")
                
                for i, user in enumerate(users[1:], 1):
                    new_username = f"{user.username}_{user.id}"
                    print(f"  Renaming User ID {user.id}: '{user.username}' -> '{new_username}'")
                    user.username = new_username
        
        if duplicates_found:
            # Commit changes
            db.commit()
            print("\n✅ Duplicate usernames have been fixed!")
        else:
            print("\n✅ No duplicate usernames found!")
            
        # Verify no more duplicates
        print("\nVerifying...")
        result = db.query(
            func.lower(User.username).label('username_lower'),
            func.count(User.id).label('count')
        ).group_by(
            func.lower(User.username)
        ).having(
            func.count(User.id) > 1
        ).all()
        
        if result:
            print("⚠️ Warning: Still found duplicates after fix:")
            for row in result:
                print(f"  - '{row.username_lower}': {row.count} users")
        else:
            print("✅ No duplicate usernames remain!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_duplicate_usernames()