#!/usr/bin/env python3
"""
Check database structure and current data
"""

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from models.models import Base, User, Season, Fixture, Prediction, UserStats

# Using External Database URL from Render
DATABASE_URL = "postgresql://tweetleague_db_user:76LozrILJDapCyrJChETfltLIUhvF0KG@dpg-d2acp7p5pdvs73al0a90-a.frankfurt-postgres.render.com/tweetleague_db"

# Create engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
inspector = inspect(engine)

def check_structure():
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("DATABASE STRUCTURE CHECK")
        print("=" * 60)
        
        # List all tables
        print("\n📊 TABLES IN DATABASE:")
        tables = inspector.get_table_names()
        for table in tables:
            print(f"  - {table}")
        
        # Check Users table
        print("\n👤 USERS TABLE:")
        users = db.query(User).all()
        print(f"  Total users: {len(users)}")
        for user in users[:5]:  # Show first 5
            print(f"    - {user.username} ({user.email}) - Admin: {user.is_admin}")
        
        # Check Seasons
        print("\n📅 SEASONS:")
        seasons = db.query(Season).all()
        for season in seasons:
            fixture_count = db.query(Fixture).filter(Fixture.season_id == season.id).count()
            print(f"  - {season.name}: {fixture_count} fixtures (Current: {season.is_current})")
        
        # Check Fixtures
        print("\n⚽ FIXTURES SUMMARY:")
        total_fixtures = db.query(Fixture).count()
        scheduled = db.query(Fixture).filter(Fixture.status == 'scheduled').count()
        finished = db.query(Fixture).filter(Fixture.status == 'finished').count()
        print(f"  Total: {total_fixtures}")
        print(f"  Scheduled: {scheduled}")
        print(f"  Finished: {finished}")
        
        # Check Predictions
        print("\n🎯 PREDICTIONS:")
        total_predictions = db.query(Prediction).count()
        print(f"  Total predictions: {total_predictions}")
        
        # Check UserStats
        print("\n📊 USER STATS:")
        stats = db.query(UserStats).all()
        print(f"  Total user stat records: {len(stats)}")
        
        # Show table columns for key tables
        print("\n🔧 TABLE STRUCTURES:")
        
        print("\n  Fixtures table columns:")
        columns = inspector.get_columns('fixtures')
        for col in columns:
            print(f"    - {col['name']}: {col['type']}")
        
        print("\n  Predictions table columns:")
        columns = inspector.get_columns('predictions')
        for col in columns:
            print(f"    - {col['name']}: {col['type']}")
            
        print("\n  User_stats table columns:")
        columns = inspector.get_columns('user_stats')
        for col in columns:
            print(f"    - {col['name']}: {col['type']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_structure()