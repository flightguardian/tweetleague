from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from database.base import get_db
from models.models import User, Fixture, Prediction, UserStats, FixtureStatus, CompetitionType, Season
from utils.admin_auth import get_admin_user
import pytz

router = APIRouter()

class FixtureCreate(BaseModel):
    home_team: str
    away_team: str
    competition: CompetitionType
    kickoff_time: datetime
    season_id: Optional[int] = None
    round: Optional[str] = None

class FixtureUpdate(BaseModel):
    home_team: Optional[str] = None
    away_team: Optional[str] = None
    competition: Optional[CompetitionType] = None
    kickoff_time: Optional[datetime] = None
    status: Optional[FixtureStatus] = None
    round: Optional[str] = None

class ScoreUpdate(BaseModel):
    home_score: int = Field(..., ge=0, le=20)
    away_score: int = Field(..., ge=0, le=20)

class AdminStats(BaseModel):
    total_users: int
    total_fixtures: int
    total_predictions: int
    upcoming_fixtures: int
    completed_fixtures: int
    active_users_last_week: int

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get overall system statistics"""
    from datetime import timedelta
    
    now = datetime.now(pytz.UTC)
    week_ago = now - timedelta(days=7)
    
    total_users = db.query(User).count()
    total_fixtures = db.query(Fixture).count()
    total_predictions = db.query(Prediction).count()
    upcoming_fixtures = db.query(Fixture).filter(
        Fixture.status == FixtureStatus.SCHEDULED
    ).count()
    completed_fixtures = db.query(Fixture).filter(
        Fixture.status == FixtureStatus.FINISHED
    ).count()
    
    # Count users who made predictions in the last week
    active_users = db.query(Prediction.user_id).filter(
        Prediction.created_at >= week_ago
    ).distinct().count()
    
    return AdminStats(
        total_users=total_users,
        total_fixtures=total_fixtures,
        total_predictions=total_predictions,
        upcoming_fixtures=upcoming_fixtures,
        completed_fixtures=completed_fixtures,
        active_users_last_week=active_users
    )

@router.post("/fixtures", response_model=dict)
async def create_fixture(
    fixture_data: FixtureCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Create a new fixture"""
    # If no season specified, use current season
    season_id = fixture_data.season_id
    if not season_id:
        current_season = db.query(Season).filter(Season.is_current == True).first()
        if not current_season:
            raise HTTPException(status_code=400, detail="No current season found")
        season_id = current_season.id
    
    fixture = Fixture(
        season_id=season_id,
        home_team=fixture_data.home_team,
        away_team=fixture_data.away_team,
        competition=fixture_data.competition,
        kickoff_time=fixture_data.kickoff_time,
        original_kickoff_time=fixture_data.kickoff_time,
        round=fixture_data.round,
        status=FixtureStatus.SCHEDULED
    )
    
    db.add(fixture)
    db.commit()
    db.refresh(fixture)
    
    return {"message": "Fixture created successfully", "id": fixture.id}

@router.put("/fixtures/{fixture_id}", response_model=dict)
async def update_fixture(
    fixture_id: int,
    fixture_data: FixtureUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Update a fixture's details"""
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")
    
    # Only allow editing if fixture hasn't started
    if fixture.status != FixtureStatus.SCHEDULED:
        if fixture_data.status is None or fixture_data.status == fixture.status:
            # Only allow status updates for non-scheduled fixtures
            if any([fixture_data.home_team, fixture_data.away_team, 
                   fixture_data.competition, fixture_data.kickoff_time]):
                raise HTTPException(
                    status_code=400, 
                    detail="Can only update status for fixtures that have started"
                )
    
    # Update fields if provided
    if fixture_data.home_team is not None:
        fixture.home_team = fixture_data.home_team
    if fixture_data.away_team is not None:
        fixture.away_team = fixture_data.away_team
    if fixture_data.competition is not None:
        fixture.competition = fixture_data.competition
    if fixture_data.kickoff_time is not None:
        fixture.kickoff_time = fixture_data.kickoff_time
    if fixture_data.status is not None:
        fixture.status = fixture_data.status
    if fixture_data.round is not None:
        fixture.round = fixture_data.round
    
    db.commit()
    db.refresh(fixture)
    
    return {"message": "Fixture updated successfully"}

@router.delete("/fixtures/{fixture_id}", response_model=dict)
async def delete_fixture(
    fixture_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Delete a fixture"""
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")
    
    # Check if there are predictions for this fixture
    predictions_count = db.query(Prediction).filter(
        Prediction.fixture_id == fixture_id
    ).count()
    
    if predictions_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete fixture with {predictions_count} predictions. Update status to POSTPONED instead."
        )
    
    db.delete(fixture)
    db.commit()
    
    return {"message": "Fixture deleted successfully"}

@router.put("/fixtures/{fixture_id}/score", response_model=dict)
async def update_fixture_score(
    fixture_id: int,
    score_data: ScoreUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Update fixture score and calculate points"""
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")
    
    # Update the fixture scores
    fixture.home_score = score_data.home_score
    fixture.away_score = score_data.away_score
    fixture.status = FixtureStatus.FINISHED
    
    # Calculate points for all predictions on this fixture
    predictions = db.query(Prediction).filter(
        Prediction.fixture_id == fixture_id
    ).all()
    
    points_updates = []
    for prediction in predictions:
        points = 0
        
        # Exact score = 3 points
        if (prediction.home_prediction == score_data.home_score and 
            prediction.away_prediction == score_data.away_score):
            points = 3
        # Correct result = 1 point
        elif ((prediction.home_prediction > prediction.away_prediction and 
               score_data.home_score > score_data.away_score) or
              (prediction.home_prediction < prediction.away_prediction and 
               score_data.home_score < score_data.away_score) or
              (prediction.home_prediction == prediction.away_prediction and 
               score_data.home_score == score_data.away_score)):
            points = 1
        
        prediction.points_earned = points
        points_updates.append({
            "user_id": prediction.user_id,
            "points": points,
            "exact": points == 3
        })
    
    # Update user statistics
    for update in points_updates:
        user_stats = db.query(UserStats).filter(
            UserStats.user_id == update["user_id"]
        ).first()
        
        if not user_stats:
            user_stats = UserStats(
                user_id=update["user_id"],
                season="2025-2026"
            )
            db.add(user_stats)
        
        user_stats.total_points += update["points"]
        if update["exact"]:
            user_stats.correct_scores += 1
        elif update["points"] == 1:
            user_stats.correct_results += 1
        
        # Update streak
        if update["points"] > 0:
            user_stats.current_streak += 1
            if user_stats.current_streak > user_stats.best_streak:
                user_stats.best_streak = user_stats.current_streak
        else:
            user_stats.current_streak = 0
        
        # Update average
        if user_stats.predictions_made > 0:
            user_stats.avg_points_per_game = user_stats.total_points / user_stats.predictions_made
    
    db.commit()
    
    return {
        "message": "Score updated and points calculated",
        "predictions_processed": len(predictions),
        "total_exact_scores": sum(1 for u in points_updates if u["exact"]),
        "total_correct_results": sum(1 for u in points_updates if u["points"] == 1)
    }

@router.get("/fixtures/{fixture_id}/predictions")
async def get_fixture_predictions(
    fixture_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get all predictions for a specific fixture"""
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")
    
    predictions = db.query(Prediction).filter(
        Prediction.fixture_id == fixture_id
    ).join(User).all()
    
    return {
        "fixture": {
            "id": fixture.id,
            "home_team": fixture.home_team,
            "away_team": fixture.away_team,
            "kickoff_time": fixture.kickoff_time,
            "status": fixture.status,
            "home_score": fixture.home_score,
            "away_score": fixture.away_score
        },
        "predictions": [
            {
                "user": pred.user.username,
                "home_prediction": pred.home_prediction,
                "away_prediction": pred.away_prediction,
                "points_earned": pred.points_earned,
                "submitted_at": pred.created_at
            }
            for pred in predictions
        ]
    }

@router.post("/recalculate-all-points", response_model=dict)
async def recalculate_all_points(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Recalculate all points for all users (use with caution)"""
    # Reset all user stats
    db.query(UserStats).update({
        "total_points": 0,
        "correct_scores": 0,
        "correct_results": 0,
        "current_streak": 0,
        "best_streak": 0,
        "avg_points_per_game": 0.0
    })
    
    # Get all finished fixtures
    finished_fixtures = db.query(Fixture).filter(
        Fixture.status == FixtureStatus.FINISHED,
        Fixture.home_score.isnot(None),
        Fixture.away_score.isnot(None)
    ).all()
    
    total_recalculated = 0
    
    for fixture in finished_fixtures:
        predictions = db.query(Prediction).filter(
            Prediction.fixture_id == fixture.id
        ).all()
        
        for prediction in predictions:
            points = 0
            
            # Calculate points
            if (prediction.home_prediction == fixture.home_score and 
                prediction.away_prediction == fixture.away_score):
                points = 3
            elif ((prediction.home_prediction > prediction.away_prediction and 
                   fixture.home_score > fixture.away_score) or
                  (prediction.home_prediction < prediction.away_prediction and 
                   fixture.home_score < fixture.away_score) or
                  (prediction.home_prediction == prediction.away_prediction and 
                   fixture.home_score == fixture.away_score)):
                points = 1
            
            prediction.points_earned = points
            
            # Update user stats
            user_stats = db.query(UserStats).filter(
                UserStats.user_id == prediction.user_id
            ).first()
            
            if not user_stats:
                user_stats = UserStats(
                    user_id=prediction.user_id,
                    season="2025-2026"
                )
                db.add(user_stats)
            
            user_stats.total_points += points
            user_stats.predictions_made += 1
            
            if points == 3:
                user_stats.correct_scores += 1
            elif points == 1:
                user_stats.correct_results += 1
            
            total_recalculated += 1
    
    # Update averages
    all_stats = db.query(UserStats).all()
    for stat in all_stats:
        if stat.predictions_made > 0:
            stat.avg_points_per_game = stat.total_points / stat.predictions_made
    
    db.commit()
    
    return {
        "message": "All points recalculated successfully",
        "fixtures_processed": len(finished_fixtures),
        "predictions_recalculated": total_recalculated
    }

@router.post("/make-admin/{user_id}", response_model=dict)
async def make_user_admin(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Grant admin privileges to a user"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_admin = True
    db.commit()
    
    return {"message": f"User {user.username} is now an admin"}

@router.post("/remove-admin/{user_id}", response_model=dict)
async def remove_user_admin(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Remove admin privileges from a user"""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot remove your own admin privileges")
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_admin = False
    db.commit()
    
    return {"message": f"Admin privileges removed from {user.username}"}