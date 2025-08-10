#!/usr/bin/env python3
"""
Check which Twitter users need their usernames updated
Shows what changes would be made without actually updating
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

def check_twitter_usernames():
    """Check which Twitter users need username updates"""
    session = SessionLocal()
    
    try:
        # Find all users with @twitter.local email addresses
        twitter_users = session.query(User).filter(
            User.email.like('%@twitter.local')
        ).order_by(User.id).all()
        
        print(f"[INFO] Found {len(twitter_users)} Twitter users")
        print("="*70)
        
        needs_update = []
        already_correct = []
        no_handle = []
        conflicts = []
        
        for user in twitter_users:
            # Skip if no Twitter handle
            if not user.twitter_handle:
                no_handle.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                })
                continue
            
            # Clean the Twitter handle (lowercase, no @)
            new_username = user.twitter_handle.replace('@', '').lower()
            
            # Check if username meets validation requirements
            import re
            if len(new_username) < 3 or len(new_username) > 20:
                no_handle.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'issue': f'Twitter handle length invalid: {new_username} ({len(new_username)} chars)'
                })
                continue
            
            if not re.match(r'^[a-zA-Z0-9_]+$', new_username):
                no_handle.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'issue': f'Twitter handle has invalid chars: {new_username}'
                })
                continue
            
            # Check if username already matches
            if user.username == new_username:
                already_correct.append({
                    'id': user.id,
                    'username': user.username,
                    'twitter_handle': user.twitter_handle
                })
                continue
            
            # Check if new username would conflict
            existing_user = session.query(User).filter(
                User.username == new_username,
                User.id != user.id
            ).first()
            
            if existing_user:
                conflicts.append({
                    'id': user.id,
                    'current_username': user.username,
                    'twitter_handle': user.twitter_handle,
                    'desired_username': new_username,
                    'conflict_with': existing_user.id,
                    'conflict_email': existing_user.email
                })
            else:
                needs_update.append({
                    'id': user.id,
                    'current_username': user.username,
                    'new_username': new_username,
                    'twitter_handle': user.twitter_handle,
                    'email': user.email
                })
        
        # Display results
        if needs_update:
            print(f"\n[NEEDS UPDATE] {len(needs_update)} users will be updated:")
            print("-"*70)
            for user in needs_update:
                print(f"  ID {user['id']}: {user['current_username']} -> {user['new_username']}")
                print(f"       Email: {user['email']}")
                print(f"       Twitter: @{user['twitter_handle']}")
        
        if already_correct:
            print(f"\n[ALREADY CORRECT] {len(already_correct)} users already have matching usernames:")
            print("-"*70)
            for user in already_correct[:5]:  # Show first 5
                print(f"  ID {user['id']}: {user['username']} (matches @{user['twitter_handle']})")
            if len(already_correct) > 5:
                print(f"  ... and {len(already_correct) - 5} more")
        
        if no_handle:
            print(f"\n[NO HANDLE] {len(no_handle)} users have no Twitter handle saved:")
            print("-"*70)
            for user in no_handle:
                print(f"  ID {user['id']}: {user['username']}")
                print(f"       Email: {user['email']}")
        
        if conflicts:
            print(f"\n[CONFLICTS] {len(conflicts)} users cannot be updated due to username conflicts:")
            print("-"*70)
            for user in conflicts:
                print(f"  ID {user['id']}: {user['current_username']} -> {user['desired_username']} (CONFLICT)")
                print(f"       Twitter: @{user['twitter_handle']}")
                print(f"       Conflicts with user ID {user['conflict_with']} ({user['conflict_email']})")
        
        # Summary
        print("\n" + "="*70)
        print("SUMMARY")
        print("="*70)
        print(f"Total Twitter users: {len(twitter_users)}")
        print(f"  - Will be updated: {len(needs_update)}")
        print(f"  - Already correct: {len(already_correct)}")
        print(f"  - No Twitter handle: {len(no_handle)}")
        print(f"  - Username conflicts: {len(conflicts)}")
        
        if needs_update:
            print(f"\n[ACTION NEEDED] Run 'python fix_twitter_usernames.py' to update {len(needs_update)} usernames")
        else:
            print("\n[OK] No updates needed!")
        
    except Exception as e:
        print(f"[ERROR] Failed to check usernames: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    print("Twitter Username Check Script")
    print("="*70)
    print("This script checks which Twitter users need their username updated")
    print("No changes will be made - this is a dry run")
    print()
    check_twitter_usernames()