from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, Field, validator
from database.base import get_db
from models.models import Prediction, Fixture, User, FixtureStatus, Season, UserStats
from utils.auth import get_current_user
import pytz

router = APIRouter()

class PredictionCreate(BaseModel):
    fixture_id: int
    home_prediction: int = Field(..., ge=0, le=20)
    away_prediction: int = Field(..., ge=0, le=20)
    
    @validator('home_prediction', 'away_prediction')
    def validate_score(cls, v):
        if not isinstance(v, int):
            raise ValueError('Score must be an integer')
        if v < 0 or v > 20:
            raise ValueError('Score must be between 0 and 20')
        return v

class PredictionResponse(BaseModel):
    id: int
    fixture_id: int
    home_prediction: int
    away_prediction: int
    points_earned: int
    created_at: datetime
    updated_at: Optional[datetime]
    fixture_home_team: str
    fixture_away_team: str
    fixture_kickoff: datetime
    fixture_home_score: Optional[int] = None
    fixture_away_score: Optional[int] = None

class PublicPrediction(BaseModel):
    username: str
    home_prediction: int
    away_prediction: int
    points_earned: int

@router.post("/", response_model=PredictionResponse)
def create_or_update_prediction(
    prediction_data: PredictionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if user's email is verified
    if not current_user.email_verified:
        raise HTTPException(
            status_code=403, 
            detail="Please verify your email address before making predictions. Check your email for the verification link."
        )
    
    fixture = db.query(Fixture).filter(Fixture.id == prediction_data.fixture_id).first()
    
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")
    
    now = datetime.now(pytz.UTC)
    kickoff = fixture.kickoff_time
    if kickoff.tzinfo is None:
        kickoff = pytz.UTC.localize(kickoff)
    deadline = kickoff - timedelta(minutes=5)
    
    if now >= deadline:
        raise HTTPException(status_code=400, detail="Prediction deadline has passed")
    
    if fixture.status != FixtureStatus.SCHEDULED:
        raise HTTPException(status_code=400, detail="Cannot predict on this fixture")
    
    next_fixture = db.query(Fixture).filter(
        and_(
            Fixture.status == FixtureStatus.SCHEDULED,
            Fixture.kickoff_time > now
        )
    ).order_by(Fixture.kickoff_time).first()
    
    if fixture != next_fixture:
        raise HTTPException(status_code=400, detail="Can only predict the next upcoming fixture")
    
    existing_prediction = db.query(Prediction).filter(
        and_(
            Prediction.user_id == current_user.id,
            Prediction.fixture_id == prediction_data.fixture_id
        )
    ).first()
    
    if existing_prediction:
        existing_prediction.home_prediction = prediction_data.home_prediction
        existing_prediction.away_prediction = prediction_data.away_prediction
        existing_prediction.updated_at = now
        db.commit()
        db.refresh(existing_prediction)
        prediction = existing_prediction
    else:
        prediction = Prediction(
            user_id=current_user.id,
            fixture_id=prediction_data.fixture_id,
            home_prediction=prediction_data.home_prediction,
            away_prediction=prediction_data.away_prediction
        )
        db.add(prediction)
        db.commit()
        db.refresh(prediction)
    
    return PredictionResponse(
        id=prediction.id,
        fixture_id=prediction.fixture_id,
        home_prediction=prediction.home_prediction,
        away_prediction=prediction.away_prediction,
        points_earned=prediction.points_earned,
        created_at=prediction.created_at,
        updated_at=prediction.updated_at,
        fixture_home_team=fixture.home_team,
        fixture_away_team=fixture.away_team,
        fixture_kickoff=fixture.kickoff_time,
        fixture_home_score=fixture.home_score,
        fixture_away_score=fixture.away_score
    )

@router.get("/my", response_model=List[PredictionResponse])
def get_my_predictions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get current season
    current_season = db.query(Season).filter(Season.is_current == True).first()
    if not current_season:
        return []
    
    # Only get predictions for the current season
    predictions = db.query(Prediction).filter(
        Prediction.user_id == current_user.id
    ).join(Fixture).filter(
        Fixture.season_id == current_season.id
    ).order_by(Fixture.kickoff_time.desc()).all()
    
    response = []
    for pred in predictions:
        response.append(PredictionResponse(
            id=pred.id,
            fixture_id=pred.fixture_id,
            home_prediction=pred.home_prediction,
            away_prediction=pred.away_prediction,
            points_earned=pred.points_earned,
            created_at=pred.created_at,
            updated_at=pred.updated_at,
            fixture_home_team=pred.fixture.home_team,
            fixture_away_team=pred.fixture.away_team,
            fixture_kickoff=pred.fixture.kickoff_time,
            fixture_home_score=pred.fixture.home_score,
            fixture_away_score=pred.fixture.away_score
        ))
    
    return response

@router.get("/fixture/{fixture_id}", response_model=List[PublicPrediction])
def get_fixture_predictions(
    fixture_id: int,
    db: Session = Depends(get_db)
):
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")
    
    # No deadline check - predictions are viewable once match appears in results
    predictions = db.query(Prediction).filter(
        Prediction.fixture_id == fixture_id
    ).join(User).all()
    
    response = []
    for pred in predictions:
        response.append(PublicPrediction(
            username=pred.user.username,
            home_prediction=pred.home_prediction,
            away_prediction=pred.away_prediction,
            points_earned=pred.points_earned
        ))
    
    return response

@router.get("/fixture/{fixture_id}/detailed")
def get_fixture_predictions_detailed(
    fixture_id: int,
    mini_league_id: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get predictions for a fixture with detailed user stats, optionally filtered by mini league, with pagination"""
    from sqlalchemy import func, and_, desc, or_
    from models.mini_leagues import MiniLeagueMember
    
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")
    
    # Get current season
    current_season = db.query(Season).filter(Season.is_current == True).first()
    if not current_season:
        raise HTTPException(status_code=404, detail="No current season")
    
    # Build query for predictions
    query = db.query(Prediction).filter(
        Prediction.fixture_id == fixture_id
    ).join(User)
    
    # Filter by mini league if specified
    if mini_league_id:
        # Get members of the mini league
        member_ids = db.query(MiniLeagueMember.user_id).filter(
            MiniLeagueMember.mini_league_id == mini_league_id
        ).subquery()
        
        query = query.filter(Prediction.user_id.in_(member_ids))
    
    # Get total count for pagination
    total_count = query.count()
    
    # Calculate overall statistics from ALL predictions (not just current page)
    from sqlalchemy import func
    overall_stats = db.query(
        func.avg(Prediction.home_prediction).label('avg_home'),
        func.avg(Prediction.away_prediction).label('avg_away'),
        func.count(Prediction.id).label('total_predictions')
    ).filter(Prediction.fixture_id == fixture_id)
    
    # Apply mini league filter to stats if needed
    if mini_league_id:
        member_ids = db.query(MiniLeagueMember.user_id).filter(
            MiniLeagueMember.mini_league_id == mini_league_id
        ).subquery()
        overall_stats = overall_stats.filter(Prediction.user_id.in_(member_ids))
    
    stats_result = overall_stats.first()
    avg_home_prediction = float(stats_result.avg_home) if stats_result.avg_home else 0.0
    avg_away_prediction = float(stats_result.avg_away) if stats_result.avg_away else 0.0
    
    # Apply ordering and pagination for the actual predictions list
    # Order by most recent activity first (updated_at if exists, otherwise created_at)
    from sqlalchemy import case, desc
    predictions = query.order_by(
        desc(case(
            (Prediction.updated_at.isnot(None), Prediction.updated_at),
            else_=Prediction.created_at
        ))
    ).limit(limit).offset(offset).all()
    
    response = []
    for pred in predictions:
        # Get user's current position in leaderboard
        user_stats = db.query(UserStats).filter(
            UserStats.user_id == pred.user_id,
            UserStats.season_id == current_season.id
        ).first()
        
        user_position = None
        user_total_points = 0
        user_avg_points = 0.0
        
        if user_stats and user_stats.predictions_made > 0:
            # Calculate position
            user_position = db.query(UserStats).filter(
                UserStats.season_id == current_season.id,
                UserStats.predictions_made > 0,
                or_(
                    UserStats.total_points > user_stats.total_points,
                    and_(
                        UserStats.total_points == user_stats.total_points,
                        UserStats.correct_scores > user_stats.correct_scores
                    )
                )
            ).count() + 1
            
            user_total_points = user_stats.total_points
            user_avg_points = user_stats.avg_points_per_game
        
        # Get user's last 5 predictions for form
        recent_preds = db.query(Prediction).join(Fixture).filter(
            Prediction.user_id == pred.user_id,
            Fixture.status == FixtureStatus.FINISHED,
            Fixture.season_id == current_season.id
        ).order_by(desc(Fixture.kickoff_time)).limit(5).all()
        
        user_form = ""
        for rp in reversed(recent_preds):
            if rp.points_earned == 3:
                user_form += "W"
            elif rp.points_earned == 1:
                user_form += "D"
            else:
                user_form += "L"
        
        response.append({
            "id": pred.id,
            "username": pred.user.username,
            "home_prediction": pred.home_prediction,
            "away_prediction": pred.away_prediction,
            "points_earned": pred.points_earned,
            "created_at": pred.created_at.isoformat(),
            "updated_at": pred.updated_at.isoformat() if pred.updated_at else None,
            "user_position": user_position,
            "user_total_points": user_total_points,
            "user_form": user_form,
            "user_avg_points": user_avg_points
        })
    
    return {
        "predictions": response,
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "overall_stats": {
            "avg_home_prediction": round(avg_home_prediction, 1),
            "avg_away_prediction": round(avg_away_prediction, 1),
            "total_predictions": total_count
        }
    }