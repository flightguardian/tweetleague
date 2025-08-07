#!/usr/bin/env python3
"""
Script to simulate past matches and generate results
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.base import SessionLocal
from models.models import Fixture, Prediction, UserStats, FixtureStatus, User
from datetime import datetime, timedelta
import random
import pytz

def simulate_past_matches(db):
    """Move some fixtures to the past and simulate results"""
    
    # Get first 10 fixtures
    fixtures = db.query(Fixture).order_by(Fixture.kickoff_time).limit(10).all()
    
    now = datetime.now(pytz.UTC)
    
    print("Simulating past matches...")
    for i, fixture in enumerate(fixtures):
        # Move fixture to past (1-10 days ago)
        days_ago = 10 - i
        fixture.kickoff_time = now - timedelta(days=days_ago)
        fixture.original_kickoff_time = fixture.kickoff_time
        
        # Generate realistic scores
        home_score = random.choices([0, 1, 2, 3, 4], weights=[15, 35, 30, 15, 5])[0]
        away_score = random.choices([0, 1, 2, 3, 4], weights=[15, 35, 30, 15, 5])[0]
        
        fixture.home_score = home_score
        fixture.away_score = away_score
        fixture.status = FixtureStatus.FINISHED
        
        print(f"  {fixture.home_team} {home_score} - {away_score} {fixture.away_team} ({days_ago} days ago)")
        
        # Update predictions with points
        predictions = db.query(Prediction).filter(Prediction.fixture_id == fixture.id).all()
        
        for pred in predictions:
            # Calculate points
            if pred.home_prediction == home_score and pred.away_prediction == away_score:
                pred.points_earned = 3  # Exact score
            elif ((pred.home_prediction > pred.away_prediction and home_score > away_score) or
                  (pred.home_prediction < pred.away_prediction and home_score < away_score) or
                  (pred.home_prediction == pred.away_prediction and home_score == away_score)):
                pred.points_earned = 1  # Correct result
            else:
                pred.points_earned = 0  # Wrong
    
    db.commit()
    
    # Recalculate all user stats
    print("\nRecalculating user statistics...")
    users = db.query(User).all()
    
    for user in users:
        # Get all finished predictions
        predictions = db.query(Prediction).join(Fixture).filter(
            Prediction.user_id == user.id,
            Fixture.status == FixtureStatus.FINISHED
        ).all()
        
        if not predictions:
            continue
        
        total_points = sum(p.points_earned for p in predictions)
        correct_scores = sum(1 for p in predictions if p.points_earned == 3)
        correct_results = sum(1 for p in predictions if p.points_earned == 1)
        
        # Get or create user stats
        stats = db.query(UserStats).filter(UserStats.user_id == user.id).first()
        if not stats:
            stats = UserStats(user_id=user.id, season="2025-2026")
            db.add(stats)
        
        stats.total_points = total_points
        stats.correct_scores = correct_scores
        stats.correct_results = correct_results
        stats.predictions_made = len(predictions)
        stats.avg_points_per_game = total_points / len(predictions) if predictions else 0
        
        # Simple streak calculation
        last_3 = predictions[-3:] if len(predictions) >= 3 else predictions
        stats.current_streak = sum(1 for p in last_3 if p.points_earned > 0)
        stats.best_streak = max(stats.current_streak, random.randint(0, 5))
        
        print(f"  {user.username}: {total_points} pts ({correct_scores} perfect, {correct_results} correct)")
    
    # Update positions
    all_stats = db.query(UserStats).order_by(UserStats.total_points.desc()).all()
    for position, stat in enumerate(all_stats, 1):
        stat.position = position
    
    db.commit()
    print("\n✅ Simulation complete!")

def show_leaderboard(db):
    """Show current leaderboard"""
    print("\n🏆 Current Leaderboard:")
    print("-" * 50)
    
    top_10 = db.query(UserStats).order_by(UserStats.total_points.desc()).limit(10).all()
    
    for stats in top_10:
        user = db.query(User).filter(User.id == stats.user_id).first()
        print(f"  #{stats.position:2d} {user.username:20s} {stats.total_points:3d} pts  "
              f"({stats.correct_scores} perfect, {stats.correct_results} correct)")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        simulate_past_matches(db)
        show_leaderboard(db)
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()