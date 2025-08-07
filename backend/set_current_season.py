#!/usr/bin/env python3
"""
Set the current season
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.models import Season

# Using External Database URL from Render
DATABASE_URL = "postgresql://tweetleague_db_user:76LozrILJDapCyrJChETfltLIUhvF0KG@dpg-d2acp7p5pdvs73al0a90-a.frankfurt-postgres.render.com/tweetleague_db"

# Create engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def set_current_season(season_name):
    db = SessionLocal()
    
    try:
        # First, set all seasons to not current
        db.query(Season).update({"is_current": False})
        
        # Then set the specified season as current
        season = db.query(Season).filter(Season.name == season_name).first()
        
        if season:
            season.is_current = True
            db.commit()
            print(f"✅ Set {season_name} as the current season")
            
            # Show all seasons
            print("\n📅 All seasons:")
            all_seasons = db.query(Season).all()
            for s in all_seasons:
                status = "✓ CURRENT" if s.is_current else ""
                print(f"  - {s.name} {status}")
        else:
            print(f"❌ Season {season_name} not found")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Which season should be current?")
    print("1. 2024-2025 (with test data)")
    print("2. 2025-2026 (upcoming fixtures)")
    
    choice = input("Enter 1 or 2: ")
    
    if choice == "1":
        set_current_season("2024-2025")
    elif choice == "2":
        set_current_season("2025-2026")
    else:
        print("Invalid choice")