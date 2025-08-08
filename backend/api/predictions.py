from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, Field, validator
from database.base import get_db
from models.models import Prediction, Fixture, User, FixtureStatus
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
    predictions = db.query(Prediction).filter(
        Prediction.user_id == current_user.id
    ).join(Fixture).order_by(Fixture.kickoff_time.desc()).all()
    
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
    
    now = datetime.now(pytz.UTC)
    kickoff = fixture.kickoff_time
    if kickoff.tzinfo is None:
        kickoff = pytz.UTC.localize(kickoff)
    deadline = kickoff - timedelta(minutes=5)
    
    if now < deadline:
        raise HTTPException(status_code=400, detail="Predictions are not visible until after the deadline")
    
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