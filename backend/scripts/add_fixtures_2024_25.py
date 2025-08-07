#!/usr/bin/env python3
"""
Add 2024-25 season fixtures
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from database.base import settings
from datetime import datetime
import pytz

def add_fixtures():
    engine = create_engine(
        settings.DATABASE_URL, 
        connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
    )
    
    fixtures = [
        # August 2025
        ("2025-08-09 12:30", "Coventry City", "Hull City", "championship"),
        ("2025-08-12 19:45", "Coventry City", "Luton Town", "league_cup"),  # League Cup
        ("2025-08-16 12:30", "Derby County", "Coventry City", "championship"),
        ("2025-08-23 15:00", "Coventry City", "Queens Park Rangers", "championship"),
        ("2025-08-30 15:00", "Oxford United", "Coventry City", "championship"),
        
        # September 2025
        ("2025-09-13 15:00", "Coventry City", "Norwich City", "championship"),
        ("2025-09-20 12:30", "Leicester City", "Coventry City", "championship"),
        ("2025-09-27 12:30", "Coventry City", "Birmingham City", "championship"),
        
        # October 2025
        ("2025-10-01 19:45", "Millwall FC", "Coventry City", "championship"),
        ("2025-10-04 15:00", "Sheffield Wednesday", "Coventry City", "championship"),
        ("2025-10-18 15:00", "Coventry City", "Blackburn Rovers", "championship"),
        ("2025-10-21 19:45", "Portsmouth FC", "Coventry City", "championship"),
        ("2025-10-25 15:00", "Coventry City", "Watford FC", "championship"),
        
        # November 2025
        ("2025-11-01 15:00", "Wrexham AFC", "Coventry City", "championship"),
        ("2025-11-04 19:45", "Coventry City", "Sheffield United", "championship"),
        ("2025-11-08 15:00", "Stoke City", "Coventry City", "championship"),
        ("2025-11-22 15:00", "Coventry City", "West Bromwich Albion", "championship"),
        ("2025-11-25 19:45", "Middlesbrough", "Coventry City", "championship"),
        ("2025-11-29 15:00", "Coventry City", "Charlton Athletic", "championship"),
        
        # December 2025
        ("2025-12-06 15:00", "Ipswich Town", "Coventry City", "championship"),
        ("2025-12-09 19:45", "Preston North End FC", "Coventry City", "championship"),
        ("2025-12-13 15:00", "Coventry City", "Bristol City FC", "championship"),
        ("2025-12-20 15:00", "Southampton", "Coventry City", "championship"),
        ("2025-12-26 15:00", "Coventry City", "Swansea City", "championship"),
        ("2025-12-29 19:45", "Coventry City", "Ipswich Town", "championship"),
        
        # January 2026
        ("2026-01-01 15:00", "Charlton Athletic", "Coventry City", "championship"),
        ("2026-01-04 15:00", "Birmingham City", "Coventry City", "championship"),
        ("2026-01-17 15:00", "Coventry City", "Leicester City", "championship"),
        ("2026-01-20 19:45", "Coventry City", "Millwall FC", "championship"),
        ("2026-01-24 15:00", "Norwich City", "Coventry City", "championship"),
        ("2026-01-31 15:00", "Queens Park Rangers", "Coventry City", "championship"),
        
        # February 2026
        ("2026-02-07 15:00", "Coventry City", "Oxford United", "championship"),
        ("2026-02-14 15:00", "Coventry City", "Middlesbrough", "championship"),
        ("2026-02-21 15:00", "West Bromwich Albion", "Coventry City", "championship"),
        ("2026-02-25 19:45", "Sheffield United", "Coventry City", "championship"),
        ("2026-02-28 15:00", "Coventry City", "Stoke City", "championship"),
        
        # March 2026
        ("2026-03-07 15:00", "Bristol City FC", "Coventry City", "championship"),
        ("2026-03-11 19:45", "Coventry City", "Preston North End FC", "championship"),
        ("2026-03-14 15:00", "Coventry City", "Southampton", "championship"),
        ("2026-03-21 15:00", "Swansea City", "Coventry City", "championship"),
        
        # April 2026
        ("2026-04-03 15:00", "Coventry City", "Derby County", "championship"),
        ("2026-04-06 15:00", "Hull City", "Coventry City", "championship"),
        ("2026-04-11 15:00", "Coventry City", "Sheffield Wednesday", "championship"),
        ("2026-04-18 15:00", "Blackburn Rovers", "Coventry City", "championship"),
        ("2026-04-21 19:45", "Coventry City", "Portsmouth FC", "championship"),
        ("2026-04-25 15:00", "Coventry City", "Wrexham AFC", "championship"),
        
        # May 2026
        ("2026-05-02 12:30", "Watford FC", "Coventry City", "championship"),
    ]
    
    with engine.connect() as conn:
        # Get current season
        season = conn.execute(text("SELECT id FROM seasons WHERE is_current = 1")).first()
        if not season:
            print("Error: No current season found")
            return
        
        season_id = season[0]
        
        # Define timezone mappings for different months
        uk_tz = pytz.timezone('Europe/London')
        
        imported = 0
        for date_str, home_team, away_team, competition in fixtures:
            try:
                # Parse the date and handle timezone
                dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M")
                
                # The fixtures show +01:00 for Aug-Oct and +00:00 for Nov-May
                # This matches UK BST (British Summer Time) and GMT
                dt_local = uk_tz.localize(dt)
                dt_utc = dt_local.astimezone(pytz.UTC)
                
                # Insert fixture
                conn.execute(text("""
                    INSERT INTO fixtures (
                        season_id, home_team, away_team, competition,
                        kickoff_time, original_kickoff_time, status
                    ) VALUES (
                        :season_id, :home_team, :away_team, :competition,
                        :kickoff_time, :kickoff_time, 'SCHEDULED'
                    )
                """), {
                    'season_id': season_id,
                    'home_team': home_team,
                    'away_team': away_team,
                    'competition': competition,
                    'kickoff_time': dt_utc
                })
                
                imported += 1
                comp = "Cup" if competition == "league_cup" else "Championship"
                print(f"✓ {date_str} - {home_team} vs {away_team} ({comp})")
                
            except Exception as e:
                print(f"✗ Error: {e}")
                print(f"  Fixture: {date_str} - {home_team} vs {away_team}")
        
        conn.commit()
        print(f"\n✅ Successfully imported {imported} fixtures for 2024-25 season")

if __name__ == "__main__":
    add_fixtures()