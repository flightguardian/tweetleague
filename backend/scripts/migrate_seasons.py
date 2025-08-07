#!/usr/bin/env python3
"""
Migration script to add season management to the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database.base import settings
from models.models import Season, SeasonStatus
from datetime import datetime, timezone

def migrate_database():
    engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {})
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Create seasons table
        session.execute(text("""
            CREATE TABLE IF NOT EXISTS seasons (
                id INTEGER PRIMARY KEY,
                name VARCHAR UNIQUE NOT NULL,
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP NOT NULL,
                status VARCHAR DEFAULT 'draft',
                is_current BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP
            )
        """))
        
        # Check if we need to create a default season
        existing_season = session.execute(text("SELECT * FROM seasons WHERE name = '2025-2026'")).first()
        
        if not existing_season:
            # Create current season
            session.execute(text("""
                INSERT INTO seasons (name, start_date, end_date, status, is_current)
                VALUES ('2025-2026', '2025-08-01 00:00:00', '2026-05-31 23:59:59', 'active', 1)
            """))
            print("Created 2025-2026 season")
            
            # Get the season id
            season = session.execute(text("SELECT id FROM seasons WHERE name = '2025-2026'")).first()
            season_id = season[0]
            
            # Add season_id column to fixtures if it doesn't exist
            try:
                session.execute(text("ALTER TABLE fixtures ADD COLUMN season_id INTEGER"))
                print("Added season_id column to fixtures table")
            except:
                print("season_id column already exists in fixtures table")
            
            # Update existing fixtures with the current season
            session.execute(text(f"""
                UPDATE fixtures 
                SET season_id = {season_id}
                WHERE season_id IS NULL OR season = '2025-2026'
            """))
            print(f"Updated existing fixtures with season_id {season_id}")
            
            # Add season_id column to user_stats if it doesn't exist
            try:
                session.execute(text("ALTER TABLE user_stats ADD COLUMN season_id INTEGER"))
                print("Added season_id column to user_stats table")
            except:
                print("season_id column already exists in user_stats table")
            
            # Update existing user_stats with the current season
            session.execute(text(f"""
                UPDATE user_stats 
                SET season_id = {season_id}
                WHERE season_id IS NULL OR season = '2025-2026'
            """))
            print(f"Updated existing user_stats with season_id {season_id}")
            
            # Create unique constraint for user_stats
            try:
                session.execute(text("""
                    CREATE UNIQUE INDEX IF NOT EXISTS user_season_idx 
                    ON user_stats(user_id, season_id)
                """))
                print("Created unique constraint for user_stats")
            except:
                print("Unique constraint already exists")
        
        session.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        session.rollback()
        print(f"Error during migration: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    migrate_database()