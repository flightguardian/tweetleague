from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_, Integer, func
from typing import List
from pydantic import BaseModel
from database.base import get_db
from models.models import UserStats, User, FixtureStatus, Season
from utils.auth import get_current_user

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
    mini_league_id: int = Query(default=None),
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    # If no season specified, use current season
    if not season_id:
        current_season = db.query(Season).filter(Season.is_current == True).first()
        if not current_season:
            return []
        season_id = current_season.id
    
    # Base query for user stats
    query = db.query(UserStats).filter(UserStats.season_id == season_id)
    
    # If mini_league_id is provided, filter by league members
    if mini_league_id:
        from models.mini_leagues import MiniLeagueMember
        
        # Get member user IDs for this league
        member_ids = db.query(MiniLeagueMember.user_id).filter(
            MiniLeagueMember.mini_league_id == mini_league_id
        ).subquery()
        
        # Filter stats to only league members
        query = query.filter(UserStats.user_id.in_(member_ids))
    
    # Order and paginate
    # First sort by whether they've played any games, then by points
    # Add username as final tiebreaker for stable ordering
    stats = query.join(User).order_by(
        desc(UserStats.predictions_made > 0),  # Users with predictions first
        desc(UserStats.total_points),
        desc(UserStats.correct_scores),
        desc(UserStats.correct_results),
        User.username  # Alphabetical by username for stable ordering
    ).offset(offset).limit(limit).all()
    
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

@router.get("/count")
def get_leaderboard_count(
    season_id: int = Query(default=None),
    mini_league_id: int = Query(default=None),
    db: Session = Depends(get_db)
):
    """Get total count of users in leaderboard"""
    # If no season specified, use current season
    if not season_id:
        current_season = db.query(Season).filter(Season.is_current == True).first()
        if not current_season:
            return {"count": 0}
        season_id = current_season.id
    
    # Base query for user stats
    query = db.query(UserStats).filter(UserStats.season_id == season_id)
    
    # If mini_league_id is provided, filter by league members
    if mini_league_id:
        from models.mini_leagues import MiniLeagueMember
        
        # Get member user IDs for this league
        member_ids = db.query(MiniLeagueMember.user_id).filter(
            MiniLeagueMember.mini_league_id == mini_league_id
        ).subquery()
        
        # Filter stats to only league members
        query = query.filter(UserStats.user_id.in_(member_ids))
    
    count = query.count()
    
    return {"count": count}

@router.get("/user-position", response_model=LeaderboardEntry)
def get_user_position(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's position in the leaderboard"""
    
    # Get current season
    current_season = db.query(Season).filter(Season.is_current == True).first()
    if not current_season:
        raise HTTPException(status_code=404, detail="No current season")
    
    # Get user's stats
    user_stats = db.query(UserStats).filter(
        UserStats.user_id == current_user.id,
        UserStats.season_id == current_season.id
    ).first()
    
    if not user_stats:
        raise HTTPException(status_code=404, detail="No stats found for user in current season")
    
    # Calculate position
    # Count users who rank higher (have played and have more points, or haven't played vs not played)
    position = db.query(UserStats).filter(
        UserStats.season_id == current_season.id,
        or_(
            # Users with predictions rank higher than users without
            and_(
                UserStats.predictions_made > 0,
                user_stats.predictions_made == 0
            ),
            # Among users who have played, use points/scores/results
            and_(
                UserStats.predictions_made > 0,
                user_stats.predictions_made > 0,
                or_(
                    UserStats.total_points > user_stats.total_points,
                    and_(
                        UserStats.total_points == user_stats.total_points,
                        UserStats.correct_scores > user_stats.correct_scores
                    ),
                    and_(
                        UserStats.total_points == user_stats.total_points,
                        UserStats.correct_scores == user_stats.correct_scores,
                        UserStats.correct_results > user_stats.correct_results
                    )
                )
            )
        )
    ).count() + 1
    
    return LeaderboardEntry(
        position=position,
        username=current_user.username,
        avatar_url=current_user.avatar_url,
        total_points=user_stats.total_points,
        correct_scores=user_stats.correct_scores,
        correct_results=user_stats.correct_results,
        predictions_made=user_stats.predictions_made,
        avg_points_per_game=user_stats.avg_points_per_game,
        current_streak=user_stats.current_streak
    )

@router.get("/top", response_model=List[LeaderboardEntry])
def get_top_players(
    limit: int = Query(default=10, le=20),
    db: Session = Depends(get_db)
):
    """Get top players based on form (last 5 games)"""
    from models.models import Prediction, Fixture, User
    
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
    # Also get correct scores and results for tie-breaking
    form_stats = db.query(
        Prediction.user_id,
        func.sum(Prediction.points_earned).label('form_points'),
        func.count(Prediction.id).label('games_played'),
        func.sum(func.cast(Prediction.points_earned == 3, Integer)).label('correct_scores'),
        func.sum(func.cast(Prediction.points_earned == 1, Integer)).label('correct_results')
    ).filter(
        Prediction.fixture_id.in_(fixture_ids)
    ).group_by(Prediction.user_id).order_by(
        func.sum(Prediction.points_earned).desc(),
        func.sum(func.cast(Prediction.points_earned == 3, Integer)).desc(),
        func.sum(func.cast(Prediction.points_earned == 1, Integer)).desc()
    ).limit(limit).all()
    
    leaderboard = []
    for position, stat in enumerate(form_stats, 1):
        user = db.query(User).filter(User.id == stat.user_id).first()
        user_stats = db.query(UserStats).filter(UserStats.user_id == stat.user_id).first()
        
        # Use the calculated correct scores and results from the query
        correct_scores = stat.correct_scores or 0
        correct_results = stat.correct_results or 0
        
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
    from sqlalchemy import extract
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
    # Also get correct scores and results for tie-breaking
    month_stats = db.query(
        Prediction.user_id,
        func.sum(Prediction.points_earned).label('month_points'),
        func.count(Prediction.id).label('games_played'),
        func.sum(func.cast(Prediction.points_earned == 3, Integer)).label('correct_scores'),
        func.sum(func.cast(Prediction.points_earned == 1, Integer)).label('correct_results')
    ).filter(
        Prediction.fixture_id.in_(fixture_ids)
    ).group_by(Prediction.user_id).order_by(
        func.sum(Prediction.points_earned).desc(),
        func.sum(func.cast(Prediction.points_earned == 3, Integer)).desc(),
        func.sum(func.cast(Prediction.points_earned == 1, Integer)).desc()
    ).limit(limit).all()
    
    leaderboard = []
    for position, stat in enumerate(month_stats, 1):
        user = db.query(User).filter(User.id == stat.user_id).first()
        user_stats = db.query(UserStats).filter(
            UserStats.user_id == stat.user_id,
            UserStats.season_id == current_season.id
        ).first()
        
        # Use the calculated correct scores and results from the query
        correct_scores = stat.correct_scores or 0
        correct_results = stat.correct_results or 0
        
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