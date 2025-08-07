#!/usr/bin/env python3
"""
Upload Coventry City fixtures to production PostgreSQL database on Render
"""

import os
from datetime import datetime
import pytz
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.models import Base, Season, Fixture, CompetitionType, FixtureStatus

# Using External Database URL from Render (for connection from outside Render network)
DATABASE_URL = "postgresql://tweetleague_db_user:76LozrILJDapCyrJChETfltLIUhvF0KG@dpg-d2acp7p5pdvs73al0a90-a.frankfurt-postgres.render.com/tweetleague_db"

# Create engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def upload_fixtures():
    db = SessionLocal()
    
    try:
        # Check if season exists
        season = db.query(Season).filter(Season.name == "2025-2026").first()
        
        if not season:
            # Create season
            season = Season(
                name="2025-2026",
                start_date=datetime(2025, 8, 1),
                end_date=datetime(2026, 5, 31),
                is_current=True
            )
            db.add(season)
            db.commit()
            print("✅ Created season 2025-2026")
        else:
            print(f"Season already exists: {season.name}")
        
        # Check if fixtures already exist
        existing_fixtures = db.query(Fixture).filter(Fixture.season_id == season.id).count()
        if existing_fixtures > 0:
            print(f"⚠️  Found {existing_fixtures} existing fixtures. Deleting...")
            db.query(Fixture).filter(Fixture.season_id == season.id).delete()
            db.commit()
            print(f"Deleted {existing_fixtures} fixtures")
        
        # Coventry City fixtures for 2025-2026 season
        fixtures_data = [
            # August 2025
            ("2025-08-09 12:30", "Coventry City", "Hull City", CompetitionType.CHAMPIONSHIP),
            ("2025-08-12 19:45", "Coventry City", "Luton Town", CompetitionType.LEAGUE_CUP),
            ("2025-08-16 12:30", "Derby County", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2025-08-23 15:00", "Coventry City", "Queens Park Rangers", CompetitionType.CHAMPIONSHIP),
            ("2025-08-30 15:00", "Oxford United", "Coventry City", CompetitionType.CHAMPIONSHIP),
            
            # September 2025
            ("2025-09-13 15:00", "Coventry City", "Norwich City", CompetitionType.CHAMPIONSHIP),
            ("2025-09-20 12:30", "Leicester City", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2025-09-27 12:30", "Coventry City", "Birmingham City", CompetitionType.CHAMPIONSHIP),
            
            # October 2025
            ("2025-10-01 19:45", "Millwall", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2025-10-04 15:00", "Sheffield Wednesday", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2025-10-18 15:00", "Coventry City", "Blackburn Rovers", CompetitionType.CHAMPIONSHIP),
            ("2025-10-21 19:45", "Portsmouth", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2025-10-25 15:00", "Coventry City", "Watford", CompetitionType.CHAMPIONSHIP),
            
            # November 2025
            ("2025-11-01 15:00", "Wrexham", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2025-11-04 19:45", "Coventry City", "Sheffield United", CompetitionType.CHAMPIONSHIP),
            ("2025-11-08 15:00", "Stoke City", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2025-11-22 15:00", "Coventry City", "West Bromwich Albion", CompetitionType.CHAMPIONSHIP),
            ("2025-11-25 19:45", "Middlesbrough", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2025-11-29 15:00", "Coventry City", "Charlton Athletic", CompetitionType.CHAMPIONSHIP),
            
            # December 2025
            ("2025-12-06 15:00", "Ipswich Town", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2025-12-09 19:45", "Preston North End", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2025-12-13 15:00", "Coventry City", "Bristol City", CompetitionType.CHAMPIONSHIP),
            ("2025-12-20 15:00", "Southampton", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2025-12-26 15:00", "Coventry City", "Swansea City", CompetitionType.CHAMPIONSHIP),
            ("2025-12-29 19:45", "Coventry City", "Ipswich Town", CompetitionType.CHAMPIONSHIP),
            
            # January 2026
            ("2026-01-01 15:00", "Charlton Athletic", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2026-01-04 15:00", "Birmingham City", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2026-01-17 15:00", "Coventry City", "Leicester City", CompetitionType.CHAMPIONSHIP),
            ("2026-01-20 19:45", "Coventry City", "Millwall", CompetitionType.CHAMPIONSHIP),
            ("2026-01-24 15:00", "Norwich City", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2026-01-31 15:00", "Queens Park Rangers", "Coventry City", CompetitionType.CHAMPIONSHIP),
            
            # February 2026
            ("2026-02-07 15:00", "Coventry City", "Oxford United", CompetitionType.CHAMPIONSHIP),
            ("2026-02-14 15:00", "Coventry City", "Middlesbrough", CompetitionType.CHAMPIONSHIP),
            ("2026-02-21 15:00", "West Bromwich Albion", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2026-02-25 19:45", "Sheffield United", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2026-02-28 15:00", "Coventry City", "Stoke City", CompetitionType.CHAMPIONSHIP),
            
            # March 2026
            ("2026-03-07 15:00", "Bristol City", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2026-03-11 19:45", "Coventry City", "Preston North End", CompetitionType.CHAMPIONSHIP),
            ("2026-03-14 15:00", "Coventry City", "Southampton", CompetitionType.CHAMPIONSHIP),
            ("2026-03-21 15:00", "Swansea City", "Coventry City", CompetitionType.CHAMPIONSHIP),
            
            # April 2026
            ("2026-04-03 15:00", "Coventry City", "Derby County", CompetitionType.CHAMPIONSHIP),
            ("2026-04-06 15:00", "Hull City", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2026-04-11 15:00", "Coventry City", "Sheffield Wednesday", CompetitionType.CHAMPIONSHIP),
            ("2026-04-18 15:00", "Blackburn Rovers", "Coventry City", CompetitionType.CHAMPIONSHIP),
            ("2026-04-21 19:45", "Coventry City", "Portsmouth", CompetitionType.CHAMPIONSHIP),
            ("2026-04-25 15:00", "Coventry City", "Wrexham", CompetitionType.CHAMPIONSHIP),
            
            # May 2026
            ("2026-05-02 12:30", "Watford", "Coventry City", CompetitionType.CHAMPIONSHIP),
        ]
        
        uk_tz = pytz.timezone('Europe/London')
        fixtures_created = 0
        
        for date_str, home_team, away_team, competition in fixtures_data:
            # Parse the date and make it timezone-aware
            kickoff = datetime.strptime(date_str, "%Y-%m-%d %H:%M")
            kickoff = uk_tz.localize(kickoff)
            
            # Determine if fixture is in the past
            status = FixtureStatus.FINISHED if kickoff < datetime.now(uk_tz) else FixtureStatus.SCHEDULED
            
            fixture = Fixture(
                season_id=season.id,
                home_team=home_team,
                away_team=away_team,
                competition=competition,
                kickoff_time=kickoff,
                original_kickoff_time=kickoff,
                status=status
            )
            
            db.add(fixture)
            fixtures_created += 1
            print(f"Added: {home_team} vs {away_team} - {date_str} ({competition.value})")
        
        db.commit()
        print(f"\n✅ Successfully uploaded {fixtures_created} fixtures to production database!")
        
        # Verify
        total_fixtures = db.query(Fixture).filter(Fixture.season_id == season.id).count()
        print(f"Total fixtures in database: {total_fixtures}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("COVENTRY CITY FIXTURES UPLOADER")
    print("=" * 60)
    print("\nThis will upload all CCFC fixtures for 2025-2026 season.")
    
    if DATABASE_URL == "YOUR_DATABASE_URL_HERE":
        print("\n❌ ERROR: You need to set your DATABASE_URL first!")
        print("Edit this file and replace YOUR_DATABASE_URL_HERE with your actual database URL from Render")
        exit(1)
    
    print(f"\nDatabase URL configured: {DATABASE_URL[:30]}...")
    print("\nReady to upload fixtures...")
    upload_fixtures()