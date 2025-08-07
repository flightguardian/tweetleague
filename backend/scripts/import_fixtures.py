import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
import pytz
from database.base import SessionLocal, engine, Base
from models.models import Fixture, FixtureStatus, CompetitionType

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Fixture data - Coventry City 2025-26 Season
FIXTURES = [
    # August 2025
    {"home_team": "Coventry City", "away_team": "Hull City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 8, 9, 11, 30, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "1"},
    
    {"home_team": "Coventry City", "away_team": "Luton Town", "competition": CompetitionType.LEAGUE_CUP, 
     "kickoff_time": datetime(2025, 8, 12, 18, 45, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "1"},
    
    {"home_team": "Derby County", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 8, 16, 11, 30, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "2"},
    
    {"home_team": "Coventry City", "away_team": "Queens Park Rangers", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 8, 23, 14, 0, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "3"},
    
    {"home_team": "Oxford United", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 8, 30, 14, 0, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "4"},
    
    # September 2025
    {"home_team": "Coventry City", "away_team": "Norwich City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 9, 13, 14, 0, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "5"},
    
    {"home_team": "Leicester City", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 9, 20, 11, 30, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "6"},
    
    {"home_team": "Coventry City", "away_team": "Birmingham City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 9, 27, 11, 30, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "7"},
    
    # October 2025
    {"home_team": "Millwall FC", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 10, 1, 18, 45, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "8"},
    
    {"home_team": "Sheffield Wednesday", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 10, 4, 14, 0, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "9"},
    
    {"home_team": "Coventry City", "away_team": "Blackburn Rovers", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 10, 18, 14, 0, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "10"},
    
    {"home_team": "Portsmouth FC", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 10, 21, 18, 45, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "11"},
    
    {"home_team": "Coventry City", "away_team": "Watford FC", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 10, 25, 14, 0, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "12"},
    
    # November 2025 (GMT)
    {"home_team": "Wrexham AFC", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 11, 1, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "13"},
    
    {"home_team": "Coventry City", "away_team": "Sheffield United", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 11, 4, 19, 45, tzinfo=pytz.UTC), "season": "2025-2026", "round": "14"},
    
    {"home_team": "Stoke City", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 11, 8, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "15"},
    
    {"home_team": "Coventry City", "away_team": "West Bromwich Albion", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 11, 22, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "16"},
    
    {"home_team": "Middlesbrough", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 11, 25, 19, 45, tzinfo=pytz.UTC), "season": "2025-2026", "round": "17"},
    
    {"home_team": "Coventry City", "away_team": "Charlton Athletic", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 11, 29, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "18"},
    
    # December 2025
    {"home_team": "Ipswich Town", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 12, 6, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "19"},
    
    {"home_team": "Preston North End FC", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 12, 9, 19, 45, tzinfo=pytz.UTC), "season": "2025-2026", "round": "20"},
    
    {"home_team": "Coventry City", "away_team": "Bristol City FC", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 12, 13, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "21"},
    
    {"home_team": "Southampton", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 12, 20, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "22"},
    
    {"home_team": "Coventry City", "away_team": "Swansea City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 12, 26, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "23"},
    
    {"home_team": "Coventry City", "away_team": "Ipswich Town", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2025, 12, 29, 19, 45, tzinfo=pytz.UTC), "season": "2025-2026", "round": "24"},
    
    # January 2026
    {"home_team": "Charlton Athletic", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 1, 1, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "25"},
    
    {"home_team": "Birmingham City", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 1, 4, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "26"},
    
    {"home_team": "Coventry City", "away_team": "Leicester City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 1, 17, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "27"},
    
    {"home_team": "Coventry City", "away_team": "Millwall FC", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 1, 20, 19, 45, tzinfo=pytz.UTC), "season": "2025-2026", "round": "28"},
    
    {"home_team": "Norwich City", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 1, 24, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "29"},
    
    {"home_team": "Queens Park Rangers", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 1, 31, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "30"},
    
    # February 2026
    {"home_team": "Coventry City", "away_team": "Oxford United", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 2, 7, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "31"},
    
    {"home_team": "Coventry City", "away_team": "Middlesbrough", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 2, 14, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "32"},
    
    {"home_team": "West Bromwich Albion", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 2, 21, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "33"},
    
    {"home_team": "Sheffield United", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 2, 25, 19, 45, tzinfo=pytz.UTC), "season": "2025-2026", "round": "34"},
    
    {"home_team": "Coventry City", "away_team": "Stoke City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 2, 28, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "35"},
    
    # March 2026
    {"home_team": "Bristol City FC", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 3, 7, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "36"},
    
    {"home_team": "Coventry City", "away_team": "Preston North End FC", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 3, 11, 19, 45, tzinfo=pytz.UTC), "season": "2025-2026", "round": "37"},
    
    {"home_team": "Coventry City", "away_team": "Southampton", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 3, 14, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "38"},
    
    {"home_team": "Swansea City", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 3, 21, 15, 0, tzinfo=pytz.UTC), "season": "2025-2026", "round": "39"},
    
    # April 2026 (BST)
    {"home_team": "Coventry City", "away_team": "Derby County", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 4, 3, 14, 0, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "40"},
    
    {"home_team": "Hull City", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 4, 6, 14, 0, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "41"},
    
    {"home_team": "Coventry City", "away_team": "Sheffield Wednesday", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 4, 11, 14, 0, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "42"},
    
    {"home_team": "Blackburn Rovers", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 4, 18, 14, 0, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "43"},
    
    {"home_team": "Coventry City", "away_team": "Portsmouth FC", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 4, 21, 18, 45, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "44"},
    
    {"home_team": "Coventry City", "away_team": "Wrexham AFC", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 4, 25, 14, 0, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "45"},
    
    # May 2026
    {"home_team": "Watford FC", "away_team": "Coventry City", "competition": CompetitionType.CHAMPIONSHIP, 
     "kickoff_time": datetime(2026, 5, 2, 11, 30, tzinfo=pytz.timezone('Europe/London')), "season": "2025-2026", "round": "46"},
]

def import_fixtures():
    db = SessionLocal()
    
    try:
        for fixture_data in FIXTURES:
            # Check if fixture already exists
            existing = db.query(Fixture).filter(
                Fixture.home_team == fixture_data["home_team"],
                Fixture.away_team == fixture_data["away_team"],
                Fixture.kickoff_time == fixture_data["kickoff_time"]
            ).first()
            
            if existing:
                print(f"Fixture already exists: {fixture_data['home_team']} vs {fixture_data['away_team']}")
                continue
            
            fixture = Fixture(
                home_team=fixture_data["home_team"],
                away_team=fixture_data["away_team"],
                competition=fixture_data["competition"],
                kickoff_time=fixture_data["kickoff_time"],
                original_kickoff_time=fixture_data["kickoff_time"],
                status=FixtureStatus.SCHEDULED,
                season=fixture_data["season"],
                round=fixture_data.get("round")
            )
            
            db.add(fixture)
            print(f"Added fixture: {fixture_data['home_team']} vs {fixture_data['away_team']} on {fixture_data['kickoff_time']}")
        
        db.commit()
        print(f"\nSuccessfully imported {len(FIXTURES)} fixtures!")
        
    except Exception as e:
        print(f"Error importing fixtures: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_fixtures()