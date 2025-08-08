from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from pydantic import BaseModel
from database.base import get_db
from models.models import UserStats, User, FixtureStatus, Season

router = APIRouter()

class LeaderboardEntry(BaseModel):
    position: int
    username: str
    avatar_url: str | None
    total_points: int
    correct_scores: int
    correct_results: int
    predictions_made: int
    avg_points_per_game: float
    current_streak: int

@router.get("/", response_model=List[LeaderboardEntry])
def get_leaderboard(
    season_id: int = Query(default=None),
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db)
):
    # If no season specified, use current season
    if not season_id:
        current_season = db.query(Season).filter(Season.is_current == True).first()
        if not current_season:
            return []
        season_id = current_season.id
    
    stats = db.query(UserStats).filter(
        UserStats.season_id == season_id
    ).order_by(
        desc(UserStats.total_points),
        desc(UserStats.correct_scores),
        desc(UserStats.correct_results)
    ).limit(limit).all()
    
    leaderboard = []
    for position, stat in enumerate(stats, 1):
        user = stat.user
        leaderboard.append(LeaderboardEntry(
            position=position,
            username=user.username,
            avatar_url=user.avatar_url,
            total_points=stat.total_points,
            correct_scores=stat.correct_scores,
            correct_results=stat.correct_results,
            predictions_made=stat.predictions_made,
            avg_points_per_game=stat.avg_points_per_game,
            current_streak=stat.current_streak
        ))
    
    return leaderboard

@router.get("/top", response_model=List[LeaderboardEntry])
def get_top_players(
    limit: int = Query(default=10, le=20),
    db: Session = Depends(get_db)
):
    """Get top players based on form (last 5 games)"""
    from models.models import Prediction, Fixture, User
    from sqlalchemy import func
    
    # Get current season
    current_season = db.query(Season).filter(Season.is_current == True).first()
    if not current_season:
        return []
    
    # Get the last 5 finished fixtures from current season
    recent_fixtures = db.query(Fixture).filter(
        Fixture.season_id == current_season.id,
        Fixture.status == FixtureStatus.FINISHED
    ).order_by(Fixture.kickoff_time.desc()).limit(5).all()
    
    if not recent_fixtures:
        return []
    
    fixture_ids = [f.id for f in recent_fixtures]
    
    # Get sum of points for each user in these fixtures
    form_stats = db.query(
        Prediction.user_id,
        func.sum(Prediction.points_earned).label('form_points'),
        func.count(Prediction.id).label('games_played')
    ).filter(
        Prediction.fixture_id.in_(fixture_ids)
    ).group_by(Prediction.user_id).order_by(
        func.sum(Prediction.points_earned).desc()
    ).limit(limit).all()
    
    leaderboard = []
    for position, stat in enumerate(form_stats, 1):
        user = db.query(User).filter(User.id == stat.user_id).first()
        user_stats = db.query(UserStats).filter(UserStats.user_id == stat.user_id).first()
        
        # Calculate correct scores and results for these 5 games
        recent_preds = db.query(Prediction).filter(
            Prediction.user_id == stat.user_id,
            Prediction.fixture_id.in_(fixture_ids)
        ).all()
        
        correct_scores = sum(1 for p in recent_preds if p.points_earned == 3)
        correct_results = sum(1 for p in recent_preds if p.points_earned == 1)
        
        leaderboard.append(LeaderboardEntry(
            position=position,
            username=user.username,
            avatar_url=user.avatar_url,
            total_points=stat.form_points,  # Points from last 5 games
            correct_scores=correct_scores,
            correct_results=correct_results,
            predictions_made=stat.games_played,
            avg_points_per_game=stat.form_points / stat.games_played if stat.games_played > 0 else 0,
            current_streak=user_stats.current_streak if user_stats else 0
        ))
    
    return leaderboard

@router.get("/month", response_model=List[LeaderboardEntry])
def get_month_leaders(
    limit: int = Query(default=10, le=20),
    db: Session = Depends(get_db)
):
    """Get top players for the current month"""
    from models.models import Prediction, Fixture, User
    from sqlalchemy import func, extract
    from datetime import datetime
    
    # Get current season
    current_season = db.query(Season).filter(Season.is_current == True).first()
    if not current_season:
        return []
    
    # Get current month and year
    now = datetime.now()
    current_month = now.month
    current_year = now.year
    
    # Get fixtures from current month that are finished
    month_fixtures = db.query(Fixture).filter(
        Fixture.season_id == current_season.id,
        Fixture.status == FixtureStatus.FINISHED,
        extract('month', Fixture.kickoff_time) == current_month,
        extract('year', Fixture.kickoff_time) == current_year
    ).all()
    
    if not month_fixtures:
        return []
    
    fixture_ids = [f.id for f in month_fixtures]
    
    # Get sum of points for each user in these fixtures
    month_stats = db.query(
        Prediction.user_id,
        func.sum(Prediction.points_earned).label('month_points'),
        func.count(Prediction.id).label('games_played')
    ).filter(
        Prediction.fixture_id.in_(fixture_ids)
    ).group_by(Prediction.user_id).order_by(
        func.sum(Prediction.points_earned).desc()
    ).limit(limit).all()
    
    leaderboard = []
    for position, stat in enumerate(month_stats, 1):
        user = db.query(User).filter(User.id == stat.user_id).first()
        user_stats = db.query(UserStats).filter(
            UserStats.user_id == stat.user_id,
            UserStats.season_id == current_season.id
        ).first()
        
        # Calculate correct scores and results for this month
        month_preds = db.query(Prediction).filter(
            Prediction.user_id == stat.user_id,
            Prediction.fixture_id.in_(fixture_ids)
        ).all()
        
        correct_scores = sum(1 for p in month_preds if p.points_earned == 3)
        correct_results = sum(1 for p in month_preds if p.points_earned == 1)
        
        leaderboard.append(LeaderboardEntry(
            position=position,
            username=user.username,
            avatar_url=user.avatar_url,
            total_points=stat.month_points,  # Points from current month
            correct_scores=correct_scores,
            correct_results=correct_results,
            predictions_made=stat.games_played,
            avg_points_per_game=stat.month_points / stat.games_played if stat.games_played > 0 else 0,
            current_streak=user_stats.current_streak if user_stats else 0
        ))
    
    return leaderboard