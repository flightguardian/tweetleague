#!/usr/bin/env python3
"""
Script to generate mock users and predictions for testing
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.base import SessionLocal
from models.models import User, Fixture, Prediction, UserStats, FixtureStatus
from utils.auth import get_password_hash
import random
from datetime import datetime, timedelta
import pytz

# Mock user data
MOCK_USERS = [
    {"username": "skyblue_legend", "email": "legend@test.com", "name": "John Legend"},
    {"username": "pusb_forever", "email": "pusb@test.com", "name": "Paul PUSB"},
    {"username": "cov_till_i_die", "email": "covfan@test.com", "name": "Sarah Sky"},
    {"username": "city_fanatic", "email": "fanatic@test.com", "name": "Mike City"},
    {"username": "the_predictor", "email": "predictor@test.com", "name": "Emma Prophet"},
    {"username": "lucky_seven", "email": "lucky@test.com", "name": "Lucky Luke"},
    {"username": "stats_guru", "email": "stats@test.com", "name": "David Data"},
    {"username": "match_master", "email": "master@test.com", "name": "Maria Match"},
    {"username": "goal_getter", "email": "goals@test.com", "name": "Gary Goals"},
    {"username": "sky_warrior", "email": "warrior@test.com", "name": "Wayne Warrior"},
    {"username": "blue_army", "email": "army@test.com", "name": "Amy Army"},
    {"username": "cov_kid", "email": "kid@test.com", "name": "Kevin Kid"},
    {"username": "ricoh_regular", "email": "ricoh@test.com", "name": "Rachel Ricoh"},
    {"username": "highfield_hero", "email": "hero@test.com", "name": "Harry Hero"},
    {"username": "singer_supreme", "email": "singer@test.com", "name": "Simon Singer"},
]

def create_mock_users(db):
    """Create mock users"""
    print("Creating mock users...")
    users = []
    
    for user_data in MOCK_USERS:
        # Check if user already exists
        existing = db.query(User).filter(
            (User.username == user_data["username"]) | 
            (User.email == user_data["email"])
        ).first()
        
        if existing:
            print(f"  User {user_data['username']} already exists, skipping...")
            users.append(existing)
            continue
        
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            password_hash=get_password_hash("password123"),  # Default password for all mock users
            email_notifications=random.choice([True, False]),
            created_at=datetime.now(pytz.UTC) - timedelta(days=random.randint(30, 365))
        )
        db.add(user)
        users.append(user)
        print(f"  Created user: {user.username}")
    
    db.commit()
    return users

def create_mock_predictions(db, users):
    """Create mock predictions for past fixtures"""
    print("\nCreating mock predictions...")
    
    # Get all fixtures
    fixtures = db.query(Fixture).order_by(Fixture.kickoff_time).all()
    
    # Separate past and future fixtures
    now = datetime.now(pytz.UTC)
    past_fixtures = []
    future_fixtures = []
    
    for fixture in fixtures:
        kickoff = fixture.kickoff_time
        if kickoff.tzinfo is None:
            kickoff = pytz.UTC.localize(kickoff)
        
        if kickoff < now:
            past_fixtures.append(fixture)
        else:
            future_fixtures.append(fixture)
    
    print(f"  Found {len(past_fixtures)} past fixtures to add results and predictions")
    print(f"  Found {len(future_fixtures)} future fixtures for predictions only")
    
    # Add mock results to past fixtures and create predictions
    for fixture in past_fixtures:
        # Generate random but realistic scores
        home_score = random.choices([0, 1, 2, 3, 4], weights=[20, 35, 30, 10, 5])[0]
        away_score = random.choices([0, 1, 2, 3, 4], weights=[20, 35, 30, 10, 5])[0]
        
        # Update fixture with result
        fixture.home_score = home_score
        fixture.away_score = away_score
        fixture.status = FixtureStatus.FINISHED
        
        print(f"  {fixture.home_team} {home_score} - {away_score} {fixture.away_team}")
        
        # Create predictions for 60-90% of users
        num_predictions = random.randint(len(users) * 60 // 100, len(users) * 90 // 100)
        predicting_users = random.sample(users, num_predictions)
        
        for user in predicting_users:
            # Check if prediction already exists
            existing_pred = db.query(Prediction).filter(
                Prediction.user_id == user.id,
                Prediction.fixture_id == fixture.id
            ).first()
            
            if existing_pred:
                continue
            
            # Generate prediction with some intelligence
            # 20% chance of exact score, 40% chance of correct result
            if random.random() < 0.20:  # Exact score
                pred_home = home_score
                pred_away = away_score
            elif random.random() < 0.60:  # Correct result
                if home_score > away_score:  # Home win
                    pred_home = random.randint(1, 3)
                    pred_away = random.randint(0, pred_home - 1)
                elif away_score > home_score:  # Away win
                    pred_away = random.randint(1, 3)
                    pred_home = random.randint(0, pred_away - 1)
                else:  # Draw
                    pred_home = pred_away = random.randint(0, 2)
            else:  # Random prediction
                pred_home = random.choices([0, 1, 2, 3], weights=[20, 40, 30, 10])[0]
                pred_away = random.choices([0, 1, 2, 3], weights=[20, 40, 30, 10])[0]
            
            # Calculate points
            points = 0
            if pred_home == home_score and pred_away == away_score:
                points = 3  # Exact score
            elif ((pred_home > pred_away and home_score > away_score) or
                  (pred_home < pred_away and home_score < away_score) or
                  (pred_home == pred_away and home_score == away_score)):
                points = 1  # Correct result
            
            prediction = Prediction(
                user_id=user.id,
                fixture_id=fixture.id,
                home_prediction=pred_home,
                away_prediction=pred_away,
                points_earned=points,
                created_at=fixture.kickoff_time - timedelta(hours=random.randint(1, 48))
            )
            db.add(prediction)
    
    # Add predictions for the next upcoming fixture
    if future_fixtures:
        next_fixture = future_fixtures[0]
        print(f"\n  Adding predictions for next fixture: {next_fixture.home_team} vs {next_fixture.away_team}")
        
        # 70-95% of users make predictions for next match
        num_predictions = random.randint(len(users) * 70 // 100, len(users) * 95 // 100)
        predicting_users = random.sample(users, num_predictions)
        
        for user in predicting_users:
            # Check if prediction already exists
            existing_pred = db.query(Prediction).filter(
                Prediction.user_id == user.id,
                Prediction.fixture_id == next_fixture.id
            ).first()
            
            if existing_pred:
                continue
            
            # Random predictions for future match
            pred_home = random.choices([0, 1, 2, 3], weights=[20, 40, 30, 10])[0]
            pred_away = random.choices([0, 1, 2, 3], weights=[20, 40, 30, 10])[0]
            
            prediction = Prediction(
                user_id=user.id,
                fixture_id=next_fixture.id,
                home_prediction=pred_home,
                away_prediction=pred_away,
                points_earned=None,  # No points yet (NULL until fixture is scored)
                created_at=datetime.now(pytz.UTC) - timedelta(hours=random.randint(1, 24))
            )
            db.add(prediction)
    
    db.commit()
    print("  Predictions created successfully!")

def update_user_stats(db, users):
    """Calculate and update user statistics"""
    print("\nUpdating user statistics...")
    
    for user in users:
        # Get all user's predictions on finished fixtures
        predictions = db.query(Prediction).join(Fixture).filter(
            Prediction.user_id == user.id,
            Fixture.status == FixtureStatus.FINISHED
        ).all()
        
        total_points = sum(p.points_earned for p in predictions)
        correct_scores = sum(1 for p in predictions if p.points_earned == 3)
        correct_results = sum(1 for p in predictions if p.points_earned == 1)
        predictions_made = len(predictions)
        
        # Check if user stats exist
        user_stats = db.query(UserStats).filter(UserStats.user_id == user.id).first()
        
        if not user_stats:
            user_stats = UserStats(
                user_id=user.id,
                season="2025-2026"
            )
            db.add(user_stats)
        
        user_stats.total_points = total_points
        user_stats.correct_scores = correct_scores
        user_stats.correct_results = correct_results
        user_stats.predictions_made = predictions_made
        
        # Calculate streaks (simplified)
        user_stats.current_streak = random.randint(0, 3) if predictions else 0
        user_stats.best_streak = random.randint(user_stats.current_streak, 5) if predictions else 0
        
        # Calculate average
        user_stats.avg_points_per_game = total_points / predictions_made if predictions_made > 0 else 0
        
        print(f"  {user.username}: {total_points} points, {correct_scores} perfect, {correct_results} correct")
    
    # Update positions
    all_stats = db.query(UserStats).order_by(UserStats.total_points.desc()).all()
    for position, stats in enumerate(all_stats, 1):
        stats.position = position
    
    db.commit()
    print("  Statistics updated successfully!")

def main():
    """Generate all mock data"""
    db = SessionLocal()
    
    try:
        print("🎮 Generating Mock Data for Tweet League")
        print("=" * 50)
        
        # Create mock users
        users = create_mock_users(db)
        
        # Create predictions
        create_mock_predictions(db, users)
        
        # Update statistics
        update_user_stats(db, users)
        
        print("\n✅ Mock data generation complete!")
        print(f"   Created/found {len(users)} users")
        
        # Show top 5 leaderboard
        print("\n📊 Top 5 Leaderboard:")
        top_users = db.query(UserStats).order_by(UserStats.total_points.desc()).limit(5).all()
        for stats in top_users:
            user = db.query(User).filter(User.id == stats.user_id).first()
            print(f"   #{stats.position} {user.username}: {stats.total_points} points")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()