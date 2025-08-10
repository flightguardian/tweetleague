#!/usr/bin/env python3
"""
Fix predictions and user stats after incorrect points_earned default value issue.

This script:
1. Sets points_earned to NULL for all predictions on unscored fixtures
2. Recalculates predictions_made count based on actual scored fixtures
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models.models import User, Prediction, Fixture, UserStats, FixtureStatus
from database.base import Base

# Database connection
DATABASE_URL = "postgresql://tweetleague_db_user:76LozrILJDapCyrJChETfltLIUhvF0KG@dpg-d2acp7p5pdvs73al0a90-a.frankfurt-postgres.render.com/tweetleague_db"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def fix_predictions_and_stats():
    """Fix predictions and user stats"""
    session = SessionLocal()
    
    try:
        print("=" * 60)
        print("FIXING PREDICTIONS AND USER STATS")
        print("=" * 60)
        
        # Step 1: Fix fixture_id 2 specifically
        fixture_2 = session.query(Fixture).filter(Fixture.id == 2).first()
        
        if fixture_2:
            print(f"\nFixing Fixture 2: {fixture_2.home_team} vs {fixture_2.away_team}")
            print(f"  Status: {fixture_2.status}")
            print(f"  Score: {fixture_2.home_score}-{fixture_2.away_score} (should be None-None)")
        
        # Step 2: Set points_earned to NULL for predictions on fixture 2
        predictions_fixed = 0
        predictions = session.query(Prediction).filter(
            Prediction.fixture_id == 2,
            Prediction.points_earned.isnot(None)  # Only fix those that have a value
        ).all()
        
        for pred in predictions:
            old_points = pred.points_earned
            pred.points_earned = None
            predictions_fixed += 1
            
        if predictions:
            print(f"  Fixed {len(predictions)} predictions on fixture 2")
        
        print(f"\nTotal predictions fixed: {predictions_fixed}")
        
        # Step 3: Get all scored fixtures
        scored_fixtures = session.query(Fixture).filter(
            Fixture.home_score.isnot(None),
            Fixture.away_score.isnot(None),
            Fixture.status == FixtureStatus.FINISHED
        ).all()
        
        print(f"\nFound {len(scored_fixtures)} scored fixtures")
        for fixture in scored_fixtures:
            print(f"  Fixture {fixture.id}: {fixture.home_team} {fixture.home_score}-{fixture.away_score} {fixture.away_team}")
        
        # Step 4: Recalculate predictions_made for all users based on scored fixtures only
        print("\nRecalculating predictions_made count for all users...")
        
        # Get all users with stats
        all_user_stats = session.query(UserStats).all()
        
        for user_stat in all_user_stats:
            # Count predictions that have been scored (points_earned is not NULL)
            # This ensures we only count predictions for fixtures that have been completed
            actual_predictions_made = session.query(Prediction).filter(
                Prediction.user_id == user_stat.user_id,
                Prediction.points_earned.isnot(None)
            ).join(Fixture).filter(
                Fixture.season_id == user_stat.season_id
            ).count()
            
            if user_stat.predictions_made != actual_predictions_made:
                user = session.query(User).filter(User.id == user_stat.user_id).first()
                print(f"  {user.username}: {user_stat.predictions_made} -> {actual_predictions_made}")
                user_stat.predictions_made = actual_predictions_made
        
        # Commit all changes
        session.commit()
        
        print("\n" + "=" * 60)
        print("VERIFICATION")
        print("=" * 60)
        
        # Verify the fix
        print("\nChecking fixture 2 predictions:")
        fixture_2_predictions = session.query(Prediction).filter(
            Prediction.fixture_id == 2
        ).all()
        
        null_count = sum(1 for p in fixture_2_predictions if p.points_earned is None)
        zero_count = sum(1 for p in fixture_2_predictions if p.points_earned == 0)
        other_count = sum(1 for p in fixture_2_predictions if p.points_earned not in [None, 0])
        
        print(f"  Total predictions: {len(fixture_2_predictions)}")
        print(f"  With NULL points: {null_count} (should be all)")
        print(f"  With 0 points: {zero_count} (should be 0)")
        print(f"  With other points: {other_count} (should be 0)")
        
        print("\nTop 10 users by predictions_made:")
        top_users = session.query(UserStats, User).join(User).filter(
            UserStats.predictions_made > 0
        ).order_by(UserStats.predictions_made.desc()).limit(10).all()
        
        for stat, user in top_users:
            print(f"  {user.username}: {stat.predictions_made} predictions, {stat.total_points} points")
        
        print("\n[SUCCESS] Database fixed successfully!")
        
    except Exception as e:
        session.rollback()
        print(f"[ERROR] Error during fix: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    print("This script will fix predictions and user stats")
    print("It will:")
    print("1. Set points_earned to NULL for fixture 2")
    print("2. Fix predictions_made count to only count scored predictions")
    print()
    
    fix_predictions_and_stats()