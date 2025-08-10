#!/usr/bin/env python3
"""
Import predictions from CSV for Hull City match (fixture_id=1)
Only imports for users who have signed up and provided matching Twitter handles
"""

import sys
import os
import csv
import io
from datetime import datetime, timezone

# Fix Unicode output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models.models import User, Prediction, Fixture, UserStats
from database.base import Base
import re

# Database connection - Using Render production database
DATABASE_URL = "postgresql://tweetleague_db_user:76LozrILJDapCyrJChETfltLIUhvF0KG@dpg-d2acp7p5pdvs73al0a90-a.frankfurt-postgres.render.com/tweetleague_db"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def parse_scoreline(scoreline):
    """Parse scoreline from format 'X - Y' to (home_score, away_score)"""
    # Remove extra spaces and split by hyphen
    scoreline = scoreline.strip()
    match = re.match(r'(\d+)\s*-\s*(\d+)', scoreline)
    if match:
        home_score = int(match.group(1))
        away_score = int(match.group(2))
        return home_score, away_score
    return None, None

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

def import_predictions():
    """Import predictions from CSV file"""
    session = SessionLocal()
    
    try:
        # First, verify fixture 1 exists and is Coventry vs Hull
        fixture = session.query(Fixture).filter_by(id=1).first()
        if not fixture:
            print("[ERROR] Fixture with ID 1 not found!")
            return
        
        print(f"[OK] Found fixture: {fixture.home_team} vs {fixture.away_team}")
        print(f"   Kickoff: {fixture.kickoff_time}")
        
        # Read CSV file
        csv_file = "Cov Tweet League Predictions (Responses)(Form responses 1).csv"
        csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', csv_file)
        
        if not os.path.exists(csv_path):
            print(f"[ERROR] CSV file not found at: {csv_path}")
            return
        
        # Track statistics
        total_rows = 0
        matched_users = 0
        predictions_created = 0
        predictions_updated = 0
        predictions_skipped = 0
        no_match_handles = []
        processed_users = set()  # Track users already processed to handle CSV duplicates
        
        with open(csv_path, 'r', encoding='utf-8') as file:
            reader = csv.reader(file)
            # Skip header
            next(reader)
            
            for row in reader:
                total_rows += 1
                
                # Extract data from CSV
                twitter_handle_csv = clean_twitter_handle(row[2])  # Twitter Handle column
                scoreline = row[4]  # Scoreline column
                
                if not twitter_handle_csv:
                    print(f"   Row {total_rows}: No Twitter handle, skipping")
                    continue
                
                # Parse scoreline
                home_pred, away_pred = parse_scoreline(scoreline)
                if home_pred is None or away_pred is None:
                    print(f"   Row {total_rows}: Invalid scoreline '{scoreline}' for @{twitter_handle_csv}")
                    continue
                
                # Find user with matching Twitter handle (case-insensitive)
                user = session.query(User).filter(
                    User.twitter_handle.ilike(twitter_handle_csv)
                ).first()
                
                if not user:
                    no_match_handles.append(twitter_handle_csv)
                    continue
                
                # Check for duplicate entries in CSV
                if user.id in processed_users:
                    print(f"   [DUPLICATE] @{twitter_handle_csv} -> User: {user.username} (ID: {user.id}) - Skipping duplicate CSV entry")
                    predictions_skipped += 1
                    continue
                
                processed_users.add(user.id)
                matched_users += 1
                print(f"   [MATCHED] @{twitter_handle_csv} -> User: {user.username} (ID: {user.id})")
                
                # Check if prediction already exists
                existing_prediction = session.query(Prediction).filter_by(
                    user_id=user.id,
                    fixture_id=1
                ).first()
                
                if existing_prediction:
                    # Update existing prediction
                    print(f"      Updating existing prediction: {existing_prediction.home_prediction}-{existing_prediction.away_prediction} → {home_pred}-{away_pred}")
                    existing_prediction.home_prediction = home_pred
                    existing_prediction.away_prediction = away_pred
                    existing_prediction.updated_at = datetime.now(timezone.utc)
                    predictions_updated += 1
                else:
                    # Create new prediction
                    new_prediction = Prediction(
                        user_id=user.id,
                        fixture_id=1,
                        home_prediction=home_pred,
                        away_prediction=away_pred,
                        points_earned=None  # Will be calculated when match finishes
                    )
                    session.add(new_prediction)
                    predictions_created += 1
                    print(f"      Created new prediction: {home_pred}-{away_pred}")
        
        # Commit all changes
        session.commit()
        
        # Print summary
        print("\n" + "="*50)
        print("IMPORT SUMMARY")
        print("="*50)
        print(f"Total CSV rows processed: {total_rows}")
        print(f"Users matched: {matched_users}")
        print(f"Predictions created: {predictions_created}")
        print(f"Predictions updated: {predictions_updated}")
        print(f"Duplicates skipped: {predictions_skipped}")
        print(f"Twitter handles not found: {len(no_match_handles)}")
        
        if no_match_handles:
            print("\nUnmatched Twitter handles (users not signed up yet):")
            for handle in no_match_handles[:10]:  # Show first 10
                print(f"  - @{handle}")
            if len(no_match_handles) > 10:
                print(f"  ... and {len(no_match_handles) - 10} more")
        
        print("\n[SUCCESS] Import completed successfully!")
        
    except Exception as e:
        session.rollback()
        print(f"[ERROR] Error during import: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    print("Starting Hull City match predictions import...")
    print("This will only import predictions for users who have signed up and provided their Twitter handle.")
    print()
    import_predictions()