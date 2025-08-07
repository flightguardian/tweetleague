#!/usr/bin/env python3
"""
Add predictions for all users on past fixtures
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.base import SessionLocal
from models.models import User, Fixture, Prediction, UserStats, FixtureStatus
import random
from datetime import timedelta

def add_predictions_for_all_users(db):
    """Ensure all users have predictions for finished fixtures"""
    
    users = db.query(User).all()
    finished_fixtures = db.query(Fixture).filter(
        Fixture.status == FixtureStatus.FINISHED
    ).all()
    
    print(f"Adding predictions for {len(users)} users on {len(finished_fixtures)} finished fixtures...")
    
    for fixture in finished_fixtures:
        # Get actual result
        home_score = fixture.home_score
        away_score = fixture.away_score
        
        for user in users:
            # Skip if prediction exists
            existing = db.query(Prediction).filter(
                Prediction.user_id == user.id,
                Prediction.fixture_id == fixture.id
            ).first()
            
            if existing:
                continue
            
            # Generate prediction with varying accuracy per user
            # Some users are better predictors than others
            user_skill = hash(user.username) % 100  # Consistent skill level per user
            
            if user_skill < 20:  # Top 20% - good predictors
                if random.random() < 0.3:  # 30% exact score
                    pred_home = home_score
                    pred_away = away_score
                elif random.random() < 0.7:  # 70% correct result
                    if home_score > away_score:
                        pred_home = random.randint(max(1, home_score-1), home_score+1)
                        pred_away = random.randint(0, min(away_score+1, pred_home-1))
                    elif away_score > home_score:
                        pred_away = random.randint(max(1, away_score-1), away_score+1)
                        pred_home = random.randint(0, min(home_score+1, pred_away-1))
                    else:
                        pred_home = pred_away = random.choice([0, 1, 1, 2, 2])
                else:
                    pred_home = random.choices([0, 1, 2, 3], weights=[20, 40, 30, 10])[0]
                    pred_away = random.choices([0, 1, 2, 3], weights=[20, 40, 30, 10])[0]
                    
            elif user_skill < 50:  # Middle tier
                if random.random() < 0.15:  # 15% exact score
                    pred_home = home_score
                    pred_away = away_score
                elif random.random() < 0.5:  # 50% correct result  
                    if home_score > away_score:
                        pred_home = random.randint(1, 3)
                        pred_away = random.randint(0, pred_home-1)
                    elif away_score > home_score:
                        pred_away = random.randint(1, 3)
                        pred_home = random.randint(0, pred_away-1)
                    else:
                        pred_home = pred_away = random.choice([0, 1, 1, 2])
                else:
                    pred_home = random.choices([0, 1, 2, 3], weights=[20, 40, 30, 10])[0]
                    pred_away = random.choices([0, 1, 2, 3], weights=[20, 40, 30, 10])[0]
                    
            else:  # Lower tier - mostly random
                if random.random() < 0.08:  # 8% exact score (lucky)
                    pred_home = home_score
                    pred_away = away_score
                elif random.random() < 0.35:  # 35% correct result
                    if home_score > away_score:
                        pred_home = random.randint(1, 3)
                        pred_away = random.randint(0, 1)
                    elif away_score > home_score:
                        pred_away = random.randint(1, 3)
                        pred_home = random.randint(0, 1)
                    else:
                        pred_home = pred_away = random.choice([0, 1, 2])
                else:
                    pred_home = random.choices([0, 1, 2, 3, 4], weights=[15, 35, 30, 15, 5])[0]
                    pred_away = random.choices([0, 1, 2, 3, 4], weights=[15, 35, 30, 15, 5])[0]
            
            # Calculate points
            points = 0
            if pred_home == home_score and pred_away == away_score:
                points = 3
            elif ((pred_home > pred_away and home_score > away_score) or
                  (pred_home < pred_away and home_score < away_score) or
                  (pred_home == pred_away and home_score == away_score)):
                points = 1
            
            prediction = Prediction(
                user_id=user.id,
                fixture_id=fixture.id,
                home_prediction=pred_home,
                away_prediction=pred_away,
                points_earned=points,
                created_at=fixture.kickoff_time - timedelta(hours=random.randint(2, 48))
            )
            db.add(prediction)
    
    db.commit()
    
    # Recalculate stats
    print("\nRecalculating user statistics...")
    for user in users:
        predictions = db.query(Prediction).join(Fixture).filter(
            Prediction.user_id == user.id,
            Fixture.status == FixtureStatus.FINISHED
        ).all()
        
        stats = db.query(UserStats).filter(UserStats.user_id == user.id).first()
        if not stats:
            stats = UserStats(user_id=user.id, season="2025-2026")
            db.add(stats)
        
        stats.total_points = sum(p.points_earned for p in predictions)
        stats.correct_scores = sum(1 for p in predictions if p.points_earned == 3)
        stats.correct_results = sum(1 for p in predictions if p.points_earned == 1)
        stats.predictions_made = len(predictions)
        stats.avg_points_per_game = stats.total_points / len(predictions) if predictions else 0
        
        # Calculate streaks
        sorted_preds = sorted(predictions, key=lambda p: p.fixture.kickoff_time, reverse=True)
        current_streak = 0
        for pred in sorted_preds:
            if pred.points_earned > 0:
                current_streak += 1
            else:
                break
        stats.current_streak = current_streak
        
        # Best streak (simplified)
        best = current_streak
        temp_streak = 0
        for pred in sorted_preds:
            if pred.points_earned > 0:
                temp_streak += 1
                best = max(best, temp_streak)
            else:
                temp_streak = 0
        stats.best_streak = best
    
    # Update positions
    all_stats = db.query(UserStats).order_by(UserStats.total_points.desc()).all()
    for position, stat in enumerate(all_stats, 1):
        stat.position = position
    
    db.commit()
    print("✅ Predictions added successfully!")

def show_final_leaderboard(db):
    """Show the final leaderboard"""
    print("\n🏆 FINAL LEADERBOARD:")
    print("=" * 70)
    print(f"{'Pos':>4} {'Player':<20} {'Pts':>5} {'Perfect':>8} {'Correct':>8} {'Played':>7} {'Streak':>7}")
    print("-" * 70)
    
    top_users = db.query(UserStats).order_by(UserStats.total_points.desc()).limit(20).all()
    
    for stats in top_users:
        user = db.query(User).filter(User.id == stats.user_id).first()
        print(f"#{stats.position:3d} {user.username:<20} {stats.total_points:4d}  "
              f"{stats.correct_scores:7d}  {stats.correct_results:7d}  "
              f"{stats.predictions_made:6d}  {stats.current_streak:6d}")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        add_predictions_for_all_users(db)
        show_final_leaderboard(db)
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()