#!/usr/bin/env python3
"""
Fix predictions_made count for users who predicted on fixture_id 1.
Sets their predictions_made to 1 since only fixture 1 has been scored.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.models import User, Prediction, Fixture, UserStats

# Database connection
DATABASE_URL = "postgresql://tweetleague_db_user:76LozrILJDapCyrJChETfltLIUhvF0KG@dpg-d2acp7p5pdvs73al0a90-a.frankfurt-postgres.render.com/tweetleague_db"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def fix_fixture1_predictions_made():
    """Fix predictions_made for users who predicted on fixture 1"""
    session = SessionLocal()
    
    try:
        print("=" * 60)
        print("FIXING PREDICTIONS_MADE FOR FIXTURE 1 USERS")
        print("=" * 60)
        
        # Get fixture 1 details
        fixture_1 = session.query(Fixture).filter(Fixture.id == 1).first()
        if not fixture_1:
            print("[ERROR] Fixture 1 not found!")
            return
            
        print(f"\nFixture 1: {fixture_1.home_team} {fixture_1.home_score}-{fixture_1.away_score} {fixture_1.away_team}")
        print(f"Season ID: {fixture_1.season_id}")
        
        # Get all users who have a prediction on fixture 1
        predictions_fixture1 = session.query(Prediction).filter(
            Prediction.fixture_id == 1
        ).all()
        
        print(f"\nFound {len(predictions_fixture1)} predictions for fixture 1")
        
        users_updated = 0
        users_list = []
        
        for prediction in predictions_fixture1:
            # Get user stats for this user and season
            user_stats = session.query(UserStats).filter(
                UserStats.user_id == prediction.user_id,
                UserStats.season_id == fixture_1.season_id
            ).first()
            
            if user_stats:
                # Get user details for logging
                user = session.query(User).filter(User.id == prediction.user_id).first()
                
                if user_stats.predictions_made != 1:
                    old_count = user_stats.predictions_made
                    user_stats.predictions_made = 1
                    users_updated += 1
                    users_list.append(f"  {user.username}: {old_count} -> 1 (Points: {user_stats.total_points})")
                else:
                    users_list.append(f"  {user.username}: already correct at 1 (Points: {user_stats.total_points})")
        
        # Commit changes
        session.commit()
        
        print(f"\nUpdated {users_updated} users to predictions_made = 1")
        
        if users_list:
            print("\nUser updates:")
            for user_info in sorted(users_list):
                print(user_info)
        
        print("\n" + "=" * 60)
        print("VERIFICATION")
        print("=" * 60)
        
        # Verify by checking some stats
        print("\nChecking users with fixture 1 predictions:")
        
        # Count users with predictions_made = 1
        correct_count = session.query(UserStats).filter(
            UserStats.season_id == fixture_1.season_id,
            UserStats.predictions_made == 1
        ).count()
        
        # Count users with predictions_made > 1  
        over_count = session.query(UserStats).filter(
            UserStats.season_id == fixture_1.season_id,
            UserStats.predictions_made > 1
        ).count()
        
        print(f"  Users with predictions_made = 1: {correct_count}")
        print(f"  Users with predictions_made > 1: {over_count}")
        
        # Show any users still with predictions_made > 1
        if over_count > 0:
            print("\nUsers with predictions_made > 1 (may have test data):")
            over_users = session.query(UserStats, User).join(User).filter(
                UserStats.season_id == fixture_1.season_id,
                UserStats.predictions_made > 1
            ).order_by(UserStats.predictions_made.desc()).limit(10).all()
            
            for stat, user in over_users:
                print(f"  {user.username}: {stat.predictions_made} predictions")
        
        print("\n[SUCCESS] Fixed predictions_made for fixture 1 users!")
        
    except Exception as e:
        session.rollback()
        print(f"[ERROR] Error during fix: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    print("This script will set predictions_made = 1 for all users")
    print("who have predictions on fixture_id 1 (the only scored fixture)")
    print()
    
    fix_fixture1_predictions_made()