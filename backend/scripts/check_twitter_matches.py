#!/usr/bin/env python3
"""
Check how many Twitter handles from the CSV match users in the database
"""

import sys
import os
import csv
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

def clean_twitter_handle(handle):
    """Clean Twitter handle - remove @ and extra spaces"""
    if not handle:
        return None
    handle = handle.strip()
    # Remove @ if present
    if handle.startswith('@'):
        handle = handle[1:]
    # Remove any trailing spaces
    handle = handle.strip()
    return handle.lower() if handle else None

def check_matches():
    """Check Twitter handle matches"""
    session = SessionLocal()
    
    try:
        # Get all users with Twitter handles from database
        db_users = session.query(User).filter(User.twitter_handle.isnot(None)).all()
        db_handles = {user.twitter_handle.lower(): user for user in db_users if user.twitter_handle}
        
        print(f"[OK] Found {len(db_handles)} users with Twitter handles in database")
        print("\nUsers with Twitter handles:")
        for handle, user in db_handles.items():
            print(f"  - @{handle} → {user.username} (email: {user.email})")
        
        # Read CSV file
        csv_file = "Cov Tweet League Predictions (Responses)(Form responses 1).csv"
        csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', csv_file)
        
        if not os.path.exists(csv_path):
            print(f"[ERROR] CSV file not found at: {csv_path}")
            return
        
        csv_handles = {}
        matched_handles = []
        unmatched_handles = []
        
        with open(csv_path, 'r', encoding='utf-8') as file:
            reader = csv.reader(file)
            # Skip header
            next(reader)
            
            for row in reader:
                twitter_handle = clean_twitter_handle(row[2])
                if twitter_handle:
                    scoreline = row[4]
                    csv_handles[twitter_handle] = scoreline
                    
                    # Check if this handle exists in database
                    if twitter_handle in db_handles:
                        matched_handles.append((twitter_handle, db_handles[twitter_handle].username, scoreline))
                    else:
                        unmatched_handles.append((twitter_handle, scoreline))
        
        print(f"\n[ANALYSIS] CSV DATA")
        print(f"Total predictions in CSV: {len(csv_handles)}")
        print(f"Matches found: {len(matched_handles)}")
        print(f"No match: {len(unmatched_handles)}")
        
        if matched_handles:
            print(f"\n[MATCHED] HANDLES ({len(matched_handles)}):")
            for handle, username, scoreline in matched_handles:
                print(f"  @{handle} → {username}: {scoreline}")
        
        if unmatched_handles:
            print(f"\n[NOT FOUND] HANDLES ({len(unmatched_handles)}):")
            print("These Twitter users haven't signed up yet:")
            for handle, scoreline in unmatched_handles[:20]:  # Show first 20
                print(f"  @{handle}: {scoreline}")
            if len(unmatched_handles) > 20:
                print(f"  ... and {len(unmatched_handles) - 20} more")
        
        # Show match rate
        if csv_handles:
            match_rate = (len(matched_handles) / len(csv_handles)) * 100
            print(f"\n[STATS] Match Rate: {match_rate:.1f}%")
        
    except Exception as e:
        print(f"[ERROR]: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    print("Checking Twitter handle matches between CSV and database...")
    print("="*50)
    check_matches()