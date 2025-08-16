#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, and_
from sqlalchemy.orm import sessionmaker
from models.models import User, UserStats, Prediction, Fixture, FixtureStatus, Season
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment variables")
    sys.exit(1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def fix_user_streaks():
    db = SessionLocal()
    
    try:
        # Get current season
        current_season = db.query(Season).filter(Season.is_current == True).first()
        if not current_season:
            print("ERROR: No current season found")
            return
        
        print(f"Fixing streaks for season: {current_season.name}")
        
        # Get all users with stats in current season
        user_stats_list = db.query(UserStats).filter(
            UserStats.season_id == current_season.id
        ).all()
        
        print(f"Found {len(user_stats_list)} users to process")
        
        for user_stats in user_stats_list:
            # Get all scored predictions for this user in chronological order
            scored_predictions = db.query(Prediction).join(Fixture).filter(
                Prediction.user_id == user_stats.user_id,
                Fixture.season_id == current_season.id,
                Fixture.status == FixtureStatus.FINISHED,
                Prediction.points_earned.isnot(None)
            ).order_by(Fixture.kickoff_time).all()
            
            if not scored_predictions:
                # No predictions to process
                user_stats.current_streak = 0
                user_stats.best_streak = 0
                continue
            
            # Calculate streaks
            current_streak = 0
            best_streak = 0
            
            for pred in scored_predictions:
                if pred.points_earned > 0:
                    current_streak += 1
                    if current_streak > best_streak:
                        best_streak = current_streak
                else:
                    current_streak = 0
            
            # Update the user stats
            user_stats.current_streak = current_streak
            user_stats.best_streak = best_streak
            
            user = db.query(User).filter(User.id == user_stats.user_id).first()
            print(f"User {user.username}: current_streak={current_streak}, best_streak={best_streak}")
        
        # Commit all changes
        db.commit()
        print("\nStreaks fixed successfully!")
        
    except Exception as e:
        print(f"ERROR: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("This script will recalculate all user streaks based on their prediction history.")
    print("It processes predictions in chronological order to rebuild accurate streak values.")
    
    confirm = input("\nDo you want to continue? (yes/no): ")
    if confirm.lower() == 'yes':
        fix_user_streaks()
    else:
        print("Cancelled.")