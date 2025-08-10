#!/usr/bin/env python3
"""
Reset predictions_made count:
- Set to 1 for users who predicted on fixture_id 1 (the only scored fixture)
- Set to 0 for everyone else
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

def reset_predictions_made():
    """Reset predictions_made based on fixture 1 predictions"""
    session = SessionLocal()
    
    try:
        print("=" * 60)
        print("RESETTING PREDICTIONS_MADE COUNT")
        print("=" * 60)
        
        # Get fixture 1 to get season_id
        fixture_1 = session.query(Fixture).filter(Fixture.id == 1).first()
        if not fixture_1:
            print("[ERROR] Fixture 1 not found!")
            return
            
        print(f"\nFixture 1: {fixture_1.home_team} {fixture_1.home_score}-{fixture_1.away_score} {fixture_1.away_team}")
        print(f"Season ID: {fixture_1.season_id}")
        
        # First, set ALL user_stats predictions_made to 0
        print("\nStep 1: Setting all predictions_made to 0...")
        all_stats = session.query(UserStats).filter(
            UserStats.season_id == fixture_1.season_id
        ).all()
        
        for stat in all_stats:
            stat.predictions_made = 0
        
        print(f"  Reset {len(all_stats)} user stats to 0")
        
        # Now, find users who have predictions on fixture 1 and set them to 1
        print("\nStep 2: Setting predictions_made = 1 for fixture 1 predictors...")
        predictions_fixture1 = session.query(Prediction).filter(
            Prediction.fixture_id == 1
        ).all()
        
        users_updated = 0
        for prediction in predictions_fixture1:
            # Get or create user stats for this user and season
            user_stats = session.query(UserStats).filter(
                UserStats.user_id == prediction.user_id,
                UserStats.season_id == fixture_1.season_id
            ).first()
            
            if not user_stats:
                # Create user stats if doesn't exist
                user_stats = UserStats(
                    user_id=prediction.user_id,
                    season_id=fixture_1.season_id,
                    total_points=0,
                    correct_scores=0,
                    correct_results=0,
                    predictions_made=1,
                    current_streak=0,
                    best_streak=0,
                    avg_points_per_game=0
                )
                session.add(user_stats)
            else:
                user_stats.predictions_made = 1
            
            users_updated += 1
        
        print(f"  Set {users_updated} users to predictions_made = 1")
        
        # Commit changes
        session.commit()
        
        print("\n" + "=" * 60)
        print("VERIFICATION")
        print("=" * 60)
        
        # Count users with predictions_made = 0
        zero_count = session.query(UserStats).filter(
            UserStats.season_id == fixture_1.season_id,
            UserStats.predictions_made == 0
        ).count()
        
        # Count users with predictions_made = 1
        one_count = session.query(UserStats).filter(
            UserStats.season_id == fixture_1.season_id,
            UserStats.predictions_made == 1
        ).count()
        
        # Count users with predictions_made > 1
        over_count = session.query(UserStats).filter(
            UserStats.season_id == fixture_1.season_id,
            UserStats.predictions_made > 1
        ).count()
        
        print(f"\nUser stats summary:")
        print(f"  predictions_made = 0: {zero_count} users")
        print(f"  predictions_made = 1: {one_count} users (should match fixture 1 predictions)")
        print(f"  predictions_made > 1: {over_count} users (should be 0)")
        
        # Verify against actual fixture 1 predictions
        fixture1_count = session.query(Prediction).filter(
            Prediction.fixture_id == 1
        ).count()
        
        print(f"\nFixture 1 has {fixture1_count} predictions")
        print(f"Users with predictions_made = 1: {one_count}")
        
        if fixture1_count == one_count:
            print("\n✓ Counts match! All correct.")
        else:
            print(f"\n✗ Mismatch! Expected {fixture1_count} but got {one_count}")
        
        print("\n[SUCCESS] Predictions_made reset complete!")
        
    except Exception as e:
        session.rollback()
        print(f"[ERROR] Error during reset: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    print("This script will reset predictions_made count:")
    print("- Set to 1 for users who predicted on fixture 1")
    print("- Set to 0 for everyone else")
    print()
    
    reset_predictions_made()