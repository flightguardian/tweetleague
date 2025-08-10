#!/usr/bin/env python3
"""
Fix usernames for Twitter users to use their Twitter handle
Updates all users with @twitter.local email to have username = twitter_handle
"""

import sys
import os
import io

# Fix Unicode output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.models import User
from database.base import Base

# Database connection - Using Render production database
DATABASE_URL = "postgresql://tweetleague_db_user:76LozrILJDapCyrJChETfltLIUhvF0KG@dpg-d2acp7p5pdvs73al0a90-a.frankfurt-postgres.render.com/tweetleague_db"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def fix_twitter_usernames():
    """Update usernames for Twitter users to match their Twitter handles"""
    session = SessionLocal()
    
    try:
        # Find all users with @twitter.local email addresses
        twitter_users = session.query(User).filter(
            User.email.like('%@twitter.local')
        ).all()
        
        print(f"[INFO] Found {len(twitter_users)} Twitter users")
        print("="*70)
        
        updated_count = 0
        skipped_count = 0
        error_count = 0
        
        for user in twitter_users:
            print(f"\nProcessing user ID {user.id}:")
            print(f"  Current username: {user.username}")
            print(f"  Email: {user.email}")
            print(f"  Twitter handle: {user.twitter_handle}")
            
            # Skip if no Twitter handle
            if not user.twitter_handle:
                print(f"  [SKIP] No Twitter handle found")
                skipped_count += 1
                continue
            
            # Clean the Twitter handle (lowercase, no @)
            # Twitter handles can only contain letters, numbers, and underscores anyway
            # which matches our username validation rules
            new_username = user.twitter_handle.replace('@', '').lower()
            
            # Validate the username format
            if len(new_username) < 3:
                print(f"  [ERROR] Twitter handle too short: {new_username}")
                error_count += 1
                continue
            
            if len(new_username) > 20:
                print(f"  [ERROR] Twitter handle too long: {new_username}")
                error_count += 1
                continue
            
            # Twitter handles only contain letters, numbers, and underscores
            # which is compatible with our username rules
            import re
            if not re.match(r'^[a-zA-Z0-9_]+$', new_username):
                print(f"  [ERROR] Invalid characters in handle: {new_username}")
                error_count += 1
                continue
            
            # Check if username already matches
            if user.username == new_username:
                print(f"  [OK] Username already matches Twitter handle")
                skipped_count += 1
                continue
            
            # Check if new username would conflict with another user
            existing_user = session.query(User).filter(
                User.username == new_username,
                User.id != user.id
            ).first()
            
            if existing_user:
                print(f"  [ERROR] Username '{new_username}' already taken by user ID {existing_user.id}")
                error_count += 1
                continue
            
            # Update the username
            old_username = user.username
            user.username = new_username
            updated_count += 1
            print(f"  [UPDATED] {old_username} -> {new_username}")
        
        # Commit all changes
        if updated_count > 0:
            print(f"\n[INFO] Committing {updated_count} username updates...")
            session.commit()
            print("[SUCCESS] Changes committed successfully!")
        
        # Print summary
        print("\n" + "="*70)
        print("SUMMARY")
        print("="*70)
        print(f"Total Twitter users found: {len(twitter_users)}")
        print(f"Usernames updated: {updated_count}")
        print(f"Skipped (already correct or no handle): {skipped_count}")
        print(f"Errors (username conflicts): {error_count}")
        
        # List any users that couldn't be updated due to conflicts
        if error_count > 0:
            print("\n[WARNING] Some users could not be updated due to username conflicts.")
            print("These users will need manual intervention or their Twitter handles")
            print("might need to be verified.")
        
    except Exception as e:
        session.rollback()
        print(f"[ERROR] Failed to update usernames: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    print("Twitter Username Fix Script")
    print("="*70)
    print("This script will update all Twitter users to use their Twitter handle as username")
    print("Affects: Users with @twitter.local email addresses")
    print()
    
    # Show what will happen
    print("Changes that will be made:")
    print("- Username will be set to Twitter handle (lowercase, no @)")
    print("- Only updates users where username doesn't already match")
    print("- Skips if username would conflict with another user")
    print()
    
    response = input("Do you want to continue? (yes/no): ")
    if response.lower() in ['yes', 'y']:
        fix_twitter_usernames()
    else:
        print("Operation cancelled.")