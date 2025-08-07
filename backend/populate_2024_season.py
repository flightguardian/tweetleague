#!/usr/bin/env python3
"""
Populate 2024-2025 season with test data including fixtures, results, users, and predictions
"""

import random
from datetime import datetime, timedelta
import pytz
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.models import Base, Season, Fixture, User, Prediction, UserStats, CompetitionType, FixtureStatus
from utils.auth import get_password_hash

# Using External Database URL from Render
DATABASE_URL = "postgresql://tweetleague_db_user:76LozrILJDapCyrJChETfltLIUhvF0KG@dpg-d2acp7p5pdvs73al0a90-a.frankfurt-postgres.render.com/tweetleague_db"

# Create engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

# Test user names (Coventry City themed)
TEST_USERS = [
    ("SkyBlueArmy", "skyblue@test.com", "John Smith"),
    ("Pusb123", "pusb123@test.com", "Mike Johnson"),
    ("CovKid87", "covkid87@test.com", "Sarah Wilson"),
    ("RicohRanger", "ricoh@test.com", "Tom Brown"),
    ("HighfieldRoad", "highfield@test.com", "Emma Jones"),
    ("SingersSkyBlue", "singers@test.com", "Chris Taylor"),
    ("ElephantBlue", "elephant@test.com", "Lisa Anderson"),
    ("CityTillIDie", "citytilldie@test.com", "Dave Thomas"),
    ("CBS_Arena_Fan", "cbsarena@test.com", "Amy Jackson"),
    ("PeakingDuck", "peaking@test.com", "James White"),
    ("CoventryLad", "covlad@test.com", "Paul Harris"),
    ("LadyGodiva", "godiva@test.com", "Rachel Martin"),
    ("TwoToneArmy", "twotone@test.com", "Steve Clark"),
    ("SkyBluesSam", "samskyblue@test.com", "Sam Lewis"),
    ("BiamouFan", "biamou@test.com", "Gary Walker"),
]

# Past Coventry fixtures from 2024-2025 season (realistic results)
PAST_FIXTURES_2024 = [
    # August 2024
    ("2024-08-10", "Coventry City", "Stoke City", 1, 0, CompetitionType.CHAMPIONSHIP),
    ("2024-08-17", "Bristol City", "Coventry City", 1, 1, CompetitionType.CHAMPIONSHIP),
    ("2024-08-24", "Coventry City", "Norwich City", 0, 1, CompetitionType.CHAMPIONSHIP),
    ("2024-08-31", "Sunderland", "Coventry City", 2, 1, CompetitionType.CHAMPIONSHIP),
    
    # September 2024
    ("2024-09-14", "Coventry City", "Watford", 1, 0, CompetitionType.CHAMPIONSHIP),
    ("2024-09-21", "Leeds United", "Coventry City", 3, 0, CompetitionType.CHAMPIONSHIP),
    ("2024-09-28", "Coventry City", "Sheffield Wednesday", 2, 1, CompetitionType.CHAMPIONSHIP),
    
    # October 2024
    ("2024-10-01", "Coventry City", "Birmingham City", 2, 0, CompetitionType.CHAMPIONSHIP),
    ("2024-10-05", "Preston North End", "Coventry City", 1, 1, CompetitionType.CHAMPIONSHIP),
    ("2024-10-19", "Coventry City", "Queens Park Rangers", 3, 1, CompetitionType.CHAMPIONSHIP),
    ("2024-10-22", "West Bromwich Albion", "Coventry City", 2, 0, CompetitionType.CHAMPIONSHIP),
    ("2024-10-26", "Coventry City", "Luton Town", 1, 1, CompetitionType.CHAMPIONSHIP),
    
    # November 2024
    ("2024-11-02", "Middlesbrough", "Coventry City", 0, 1, CompetitionType.CHAMPIONSHIP),
    ("2024-11-05", "Coventry City", "Derby County", 2, 1, CompetitionType.CHAMPIONSHIP),
    ("2024-11-09", "Hull City", "Coventry City", 1, 2, CompetitionType.CHAMPIONSHIP),
    ("2024-11-23", "Coventry City", "Millwall", 1, 0, CompetitionType.CHAMPIONSHIP),
    ("2024-11-26", "Cardiff City", "Coventry City", 2, 2, CompetitionType.CHAMPIONSHIP),
    ("2024-11-30", "Coventry City", "Plymouth Argyle", 3, 0, CompetitionType.CHAMPIONSHIP),
    
    # December 2024
    ("2024-12-07", "Blackburn Rovers", "Coventry City", 1, 0, CompetitionType.CHAMPIONSHIP),
    ("2024-12-10", "Coventry City", "Rotherham United", 2, 0, CompetitionType.CHAMPIONSHIP),
    ("2024-12-14", "Ipswich Town", "Coventry City", 2, 1, CompetitionType.CHAMPIONSHIP),
    ("2024-12-21", "Coventry City", "Southampton", 1, 1, CompetitionType.CHAMPIONSHIP),
    ("2024-12-26", "Coventry City", "Leicester City", 2, 3, CompetitionType.CHAMPIONSHIP),
    ("2024-12-29", "Swansea City", "Coventry City", 0, 1, CompetitionType.CHAMPIONSHIP),
    
    # January 2025
    ("2025-01-01", "Coventry City", "Hull City", 2, 2, CompetitionType.CHAMPIONSHIP),
    ("2025-01-04", "Norwich City", "Coventry City", 1, 0, CompetitionType.CHAMPIONSHIP),
    ("2025-01-11", "Tottenham Hotspur", "Coventry City", 3, 1, CompetitionType.FA_CUP),
    ("2025-01-18", "Coventry City", "Bristol City", 2, 0, CompetitionType.CHAMPIONSHIP),
    ("2025-01-25", "Stoke City", "Coventry City", 0, 0, CompetitionType.CHAMPIONSHIP),
    
    # February 2025
    ("2025-02-01", "Coventry City", "Sunderland", 1, 1, CompetitionType.CHAMPIONSHIP),
    ("2025-02-08", "Watford", "Coventry City", 2, 1, CompetitionType.CHAMPIONSHIP),
    ("2025-02-11", "Coventry City", "Leeds United", 0, 2, CompetitionType.CHAMPIONSHIP),
    ("2025-02-15", "Sheffield Wednesday", "Coventry City", 1, 3, CompetitionType.CHAMPIONSHIP),
    ("2025-02-22", "Birmingham City", "Coventry City", 0, 2, CompetitionType.CHAMPIONSHIP),
    
    # March 2025
    ("2025-03-01", "Coventry City", "Preston North End", 1, 0, CompetitionType.CHAMPIONSHIP),
    ("2025-03-08", "Queens Park Rangers", "Coventry City", 1, 1, CompetitionType.CHAMPIONSHIP),
    ("2025-03-12", "Coventry City", "West Bromwich Albion", 0, 1, CompetitionType.CHAMPIONSHIP),
    ("2025-03-15", "Luton Town", "Coventry City", 2, 2, CompetitionType.CHAMPIONSHIP),
    ("2025-03-22", "Coventry City", "Middlesbrough", 3, 1, CompetitionType.CHAMPIONSHIP),
    ("2025-03-29", "Derby County", "Coventry City", 1, 2, CompetitionType.CHAMPIONSHIP),
]

def create_2024_season():
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("CREATING 2024-2025 SEASON WITH TEST DATA")
        print("=" * 60)
        
        # Step 1: Create 2024-2025 season
        print("\n📅 Creating 2024-2025 season...")
        season_2024 = db.query(Season).filter(Season.name == "2024-2025").first()
        
        if not season_2024:
            season_2024 = Season(
                name="2024-2025",
                start_date=datetime(2024, 8, 1),
                end_date=datetime(2025, 5, 31),
                is_current=False  # Not current, 2025-2026 is current
            )
            db.add(season_2024)
            db.commit()
            print("✅ Created season 2024-2025")
        else:
            print("Season 2024-2025 already exists")
            # Clear existing fixtures for this season
            db.query(Fixture).filter(Fixture.season_id == season_2024.id).delete()
            db.commit()
            print("Cleared existing fixtures")
        
        # Step 2: Create test users
        print("\n👥 Creating test users...")
        created_users = []
        
        for username, email, display_name in TEST_USERS:
            existing_user = db.query(User).filter(
                (User.email == email) | (User.username == username)
            ).first()
            
            if not existing_user:
                user = User(
                    email=email,
                    username=username,
                    password_hash=get_password_hash("password123"),  # All test users have same password
                    email_verified=True,
                    is_admin=False,
                    created_at=datetime.now(pytz.UTC) - timedelta(days=random.randint(100, 365))
                )
                db.add(user)
                created_users.append(user)
                print(f"  Created user: {username}")
            else:
                created_users.append(existing_user)
                print(f"  User exists: {username}")
        
        db.commit()
        
        # Step 3: Create fixtures with results
        print("\n⚽ Creating fixtures with results...")
        uk_tz = pytz.timezone('Europe/London')
        fixtures_created = []
        
        for date_str, home_team, away_team, home_score, away_score, competition in PAST_FIXTURES_2024:
            kickoff = datetime.strptime(date_str + " 15:00", "%Y-%m-%d %H:%M")
            kickoff = uk_tz.localize(kickoff)
            
            fixture = Fixture(
                season_id=season_2024.id,
                home_team=home_team,
                away_team=away_team,
                competition=competition,
                kickoff_time=kickoff,
                original_kickoff_time=kickoff,
                status=FixtureStatus.FINISHED,
                home_score=home_score,
                away_score=away_score
            )
            db.add(fixture)
            fixtures_created.append(fixture)
            print(f"  Added: {home_team} {home_score}-{away_score} {away_team}")
        
        db.commit()
        print(f"✅ Created {len(fixtures_created)} fixtures")
        
        # Step 4: Create predictions for each fixture
        print("\n🎯 Creating predictions...")
        predictions_created = 0
        
        for fixture in fixtures_created:
            # Random number of users predict each match (60-90% of users)
            num_predictors = random.randint(int(len(created_users) * 0.6), int(len(created_users) * 0.9))
            predictors = random.sample(created_users, num_predictors)
            
            for user in predictors:
                # Generate realistic predictions
                # Some users predict correctly, some close, some wrong
                prediction_type = random.random()
                
                if prediction_type < 0.15:  # 15% predict exact score
                    home_pred = fixture.home_score
                    away_pred = fixture.away_score
                    points = 3  # Perfect prediction
                elif prediction_type < 0.45:  # 30% predict correct result
                    if fixture.home_score > fixture.away_score:  # Home win
                        home_pred = random.randint(1, 3)
                        away_pred = random.randint(0, home_pred - 1)
                    elif fixture.away_score > fixture.home_score:  # Away win
                        away_pred = random.randint(1, 3)
                        home_pred = random.randint(0, away_pred - 1)
                    else:  # Draw
                        score = random.randint(0, 2)
                        home_pred = score
                        away_pred = score
                    
                    # Calculate points
                    if home_pred == fixture.home_score and away_pred == fixture.away_score:
                        points = 3
                    else:
                        points = 1  # Correct result
                else:  # 55% predict wrong
                    home_pred = random.randint(0, 3)
                    away_pred = random.randint(0, 3)
                    
                    # Calculate points
                    if home_pred == fixture.home_score and away_pred == fixture.away_score:
                        points = 3
                    elif ((home_pred > away_pred and fixture.home_score > fixture.away_score) or
                          (away_pred > home_pred and fixture.away_score > fixture.home_score) or
                          (home_pred == away_pred and fixture.home_score == fixture.away_score)):
                        points = 1
                    else:
                        points = 0
                
                prediction = Prediction(
                    user_id=user.id,
                    fixture_id=fixture.id,
                    home_prediction=home_pred,
                    away_prediction=away_pred,
                    points_earned=points,
                    created_at=fixture.kickoff_time - timedelta(hours=random.randint(1, 48))
                )
                db.add(prediction)
                predictions_created += 1
        
        db.commit()
        print(f"✅ Created {predictions_created} predictions")
        
        # Step 5: Calculate and update user stats for 2024-2025 season
        print("\n📊 Calculating user stats...")
        
        for user in created_users:
            # Get all predictions for this user in this season
            user_predictions = db.query(Prediction).join(Fixture).filter(
                Prediction.user_id == user.id,
                Fixture.season_id == season_2024.id
            ).all()
            
            total_points = sum(p.points_earned for p in user_predictions)
            correct_scores = sum(1 for p in user_predictions if p.points_earned == 3)
            correct_results = sum(1 for p in user_predictions if p.points_earned == 1)
            predictions_made = len(user_predictions)
            avg_points = total_points / predictions_made if predictions_made > 0 else 0
            
            # Check if user stats exist for this season
            user_stats = db.query(UserStats).filter(
                UserStats.user_id == user.id,
                UserStats.season_id == season_2024.id
            ).first()
            
            if not user_stats:
                user_stats = UserStats(
                    user_id=user.id,
                    season_id=season_2024.id,
                    total_points=total_points,
                    correct_scores=correct_scores,
                    correct_results=correct_results,
                    predictions_made=predictions_made,
                    avg_points_per_game=avg_points,
                    current_streak=0,
                    best_streak=random.randint(0, 5)
                )
                db.add(user_stats)
            else:
                user_stats.total_points = total_points
                user_stats.correct_scores = correct_scores
                user_stats.correct_results = correct_results
                user_stats.predictions_made = predictions_made
                user_stats.avg_points_per_game = avg_points
            
            print(f"  {user.username}: {total_points} pts ({predictions_made} predictions)")
        
        db.commit()
        
        # Step 6: Calculate positions
        print("\n🏆 Calculating leaderboard positions...")
        all_stats = db.query(UserStats).filter(
            UserStats.season_id == season_2024.id
        ).order_by(UserStats.total_points.desc()).all()
        
        for position, stats in enumerate(all_stats, 1):
            stats.position = position
        
        db.commit()
        
        print("\n✅ SEASON 2024-2025 POPULATED SUCCESSFULLY!")
        print(f"  - {len(fixtures_created)} fixtures with results")
        print(f"  - {len(created_users)} users")
        print(f"  - {predictions_created} predictions")
        print(f"  - User stats calculated")
        
        # Show top 5 in leaderboard
        print("\n🏆 TOP 5 LEADERBOARD:")
        top_5 = db.query(UserStats).join(User).filter(
            UserStats.season_id == season_2024.id
        ).order_by(UserStats.total_points.desc()).limit(5).all()
        
        for stats in top_5:
            print(f"  {stats.position}. {stats.user.username}: {stats.total_points} pts")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("This will create a 2024-2025 season with test data.")
    print("Continue? (y/n)")
    
    if input().lower() == 'y':
        create_2024_season()
    else:
        print("Cancelled")