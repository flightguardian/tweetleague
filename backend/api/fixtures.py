from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
from database.base import get_db
from models.models import Fixture, FixtureStatus, CompetitionType, User, Season
from utils.auth import get_current_user
import pytz

router = APIRouter()

class FixtureResponse(BaseModel):
    id: int
    home_team: str
    away_team: str
    competition: CompetitionType
    kickoff_time: datetime
    status: FixtureStatus
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    season: str
    round: Optional[str] = None
    can_predict: bool = False
    predictions_count: int = 0

@router.get("/", response_model=List[FixtureResponse])
def get_all_fixtures(
    season_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all fixtures sorted by kickoff time"""
    now = datetime.now(pytz.UTC)
    
    # If no season specified, use current season
    if not season_id:
        current_season = db.query(Season).filter(Season.is_current == True).first()
        if current_season:
            season_id = current_season.id
    
    query = db.query(Fixture)
    if season_id:
        query = query.filter(Fixture.season_id == season_id)
    
    fixtures = query.order_by(Fixture.kickoff_time.asc()).all()
    
    response = []
    for fixture in fixtures:
        kickoff = fixture.kickoff_time
        if kickoff.tzinfo is None:
            kickoff = pytz.UTC.localize(kickoff)
        deadline = kickoff - timedelta(minutes=5)
        can_predict = now < deadline and fixture.status == FixtureStatus.SCHEDULED
        
        response.append(FixtureResponse(
            id=fixture.id,
            home_team=fixture.home_team,
            away_team=fixture.away_team,
            competition=fixture.competition,
            kickoff_time=fixture.kickoff_time,
            status=fixture.status,
            home_score=fixture.home_score,
            away_score=fixture.away_score,
            season=fixture.season.name if fixture.season else "Unknown",
            round=fixture.round,
            can_predict=can_predict,
            predictions_count=len(fixture.predictions)
        ))
    
    return response

@router.get("/next", response_model=FixtureResponse)
def get_next_fixture(
    db: Session = Depends(get_db)
):
    now = datetime.now(pytz.UTC)
    
    # Get current season
    current_season = db.query(Season).filter(Season.is_current == True).first()
    if not current_season:
        raise HTTPException(status_code=404, detail="No current season found")
    
    next_fixture = db.query(Fixture).filter(
        and_(
            Fixture.season_id == current_season.id,
            Fixture.status == FixtureStatus.SCHEDULED,
            Fixture.kickoff_time > now
        )
    ).order_by(Fixture.kickoff_time).first()
    
    if not next_fixture:
        raise HTTPException(status_code=404, detail="No upcoming fixtures found")
    
    # Ensure kickoff_time is timezone-aware
    kickoff = next_fixture.kickoff_time
    if kickoff.tzinfo is None:
        kickoff = pytz.UTC.localize(kickoff)
    
    deadline = kickoff - timedelta(minutes=5)
    can_predict = now < deadline
    
    predictions_count = len(next_fixture.predictions)
    
    return FixtureResponse(
        id=next_fixture.id,
        home_team=next_fixture.home_team,
        away_team=next_fixture.away_team,
        competition=next_fixture.competition,
        kickoff_time=next_fixture.kickoff_time,
        status=next_fixture.status,
        home_score=next_fixture.home_score,
        away_score=next_fixture.away_score,
        season=next_fixture.season.name if next_fixture.season else "Unknown",
        round=next_fixture.round,
        can_predict=can_predict,
        predictions_count=predictions_count
    )

@router.get("/upcoming", response_model=List[FixtureResponse])
def get_upcoming_fixtures(
    limit: int = Query(default=5, le=20),
    db: Session = Depends(get_db)
):
    now = datetime.now(pytz.UTC)
    
    fixtures = db.query(Fixture).filter(
        and_(
            Fixture.status == FixtureStatus.SCHEDULED,
            Fixture.kickoff_time > now
        )
    ).order_by(Fixture.kickoff_time).limit(limit).all()
    
    response = []
    for fixture in fixtures:
        kickoff = fixture.kickoff_time
        if kickoff.tzinfo is None:
            kickoff = pytz.UTC.localize(kickoff)
        deadline = kickoff - timedelta(minutes=5)
        can_predict = now < deadline and fixture == fixtures[0]
        
        response.append(FixtureResponse(
            id=fixture.id,
            home_team=fixture.home_team,
            away_team=fixture.away_team,
            competition=fixture.competition,
            kickoff_time=fixture.kickoff_time,
            status=fixture.status,
            home_score=fixture.home_score,
            away_score=fixture.away_score,
            season=fixture.season.name if fixture.season else "Unknown",
            round=fixture.round,
            can_predict=can_predict,
            predictions_count=len(fixture.predictions)
        ))
    
    return response

@router.get("/recent", response_model=List[FixtureResponse])
def get_recent_fixtures(
    limit: int = Query(default=5, le=20),
    db: Session = Depends(get_db)
):
    # Get current season
    current_season = db.query(Season).filter(Season.is_current == True).first()
    if not current_season:
        return []
    
    fixtures = db.query(Fixture).filter(
        and_(
            Fixture.season_id == current_season.id,
            Fixture.status == FixtureStatus.FINISHED
        )
    ).order_by(Fixture.kickoff_time.desc()).limit(limit).all()
    
    response = []
    for fixture in fixtures:
        response.append(FixtureResponse(
            id=fixture.id,
            home_team=fixture.home_team,
            away_team=fixture.away_team,
            competition=fixture.competition,
            kickoff_time=fixture.kickoff_time,
            status=fixture.status,
            home_score=fixture.home_score,
            away_score=fixture.away_score,
            season=fixture.season.name if fixture.season else "Unknown",
            round=fixture.round,
            can_predict=False,
            predictions_count=len(fixture.predictions)
        ))
    
    return response

@router.get("/{fixture_id}", response_model=FixtureResponse)
def get_fixture(
    fixture_id: int,
    db: Session = Depends(get_db)
):
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")
    
    now = datetime.now(pytz.UTC)
    kickoff = fixture.kickoff_time
    if kickoff.tzinfo is None:
        kickoff = pytz.UTC.localize(kickoff)
    deadline = kickoff - timedelta(minutes=5)
    
    next_fixture = db.query(Fixture).filter(
        and_(
            Fixture.status == FixtureStatus.SCHEDULED,
            Fixture.kickoff_time > now
        )
    ).order_by(Fixture.kickoff_time).first()
    
    can_predict = (
        fixture.status == FixtureStatus.SCHEDULED and 
        now < deadline and 
        fixture == next_fixture
    )
    
    return FixtureResponse(
        id=fixture.id,
        home_team=fixture.home_team,
        away_team=fixture.away_team,
        competition=fixture.competition,
        kickoff_time=fixture.kickoff_time,
        status=fixture.status,
        home_score=fixture.home_score,
        away_score=fixture.away_score,
        season=fixture.season.name if fixture.season else "Unknown",
        round=fixture.round,
        can_predict=can_predict,
        predictions_count=len(fixture.predictions)
    )