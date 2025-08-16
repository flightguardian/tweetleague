from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from database.base import get_db
from models.models import User, UserStats
from utils.auth import get_current_user, verify_password, get_password_hash

router = APIRouter()

class UserProfile(BaseModel):
    id: int
    username: str
    email: str
    email_verified: bool = False
    avatar_url: str | None
    twitter_handle: str | None
    created_at: str
    total_points: int
    correct_scores: int
    correct_results: int
    predictions_made: int
    position: int | None
    current_streak: int
    best_streak: int
    email_notifications: bool = True
    is_admin: bool = False

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=30)
    email: Optional[EmailStr] = None
    email_notifications: Optional[bool] = None
    twitter_handle: Optional[str] = Field(None, max_length=15)
    
    @validator('username')
    def validate_username(cls, v):
        if v:
            # Allow alphanumeric, underscore, and hyphen
            import re
            if not re.match(r'^[a-zA-Z0-9_-]+$', v):
                raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
            if v.startswith('_') or v.startswith('-'):
                raise ValueError('Username cannot start with underscore or hyphen')
        return v
    
    @validator('twitter_handle')
    def validate_twitter_handle(cls, v):
        if v:
            # Remove @ if provided
            v = v.lstrip('@')
            # Twitter handles: 1-15 chars, alphanumeric and underscore only
            if not v.replace('_', '').isalnum():
                raise ValueError('Twitter handle can only contain letters, numbers, and underscores')
            if len(v) > 15:
                raise ValueError('Twitter handle must be 15 characters or less')
        return v

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    
class ProfileUpdateResponse(BaseModel):
    message: str
    user: UserProfile

@router.get("/me", response_model=UserProfile)
def get_current_user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stats = db.query(UserStats).filter(
        UserStats.user_id == current_user.id
    ).first()
    
    if not stats:
        stats = UserStats(
            user_id=current_user.id,
            season="2025-2026"
        )
        db.add(stats)
        db.commit()
        db.refresh(stats)
    
    return UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        email_verified=current_user.email_verified,
        avatar_url=current_user.avatar_url,
        twitter_handle=current_user.twitter_handle,
        created_at=current_user.created_at.isoformat(),
        total_points=stats.total_points,
        correct_scores=stats.correct_scores,
        correct_results=stats.correct_results,
        predictions_made=stats.predictions_made,
        position=stats.position,
        current_streak=stats.current_streak,
        best_streak=stats.best_streak,
        email_notifications=current_user.email_notifications,
        is_admin=current_user.is_admin
    )

@router.get("/{username}", response_model=UserProfile)
def get_user_profile(
    username: str,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    stats = db.query(UserStats).filter(
        UserStats.user_id == user.id
    ).first()
    
    if not stats:
        stats = UserStats(
            user_id=user.id,
            season="2025-2026",
            total_points=0,
            correct_scores=0,
            correct_results=0,
            predictions_made=0
        )
    
    return UserProfile(
        id=user.id,
        username=user.username,
        email=user.email,
        email_verified=user.email_verified,
        avatar_url=user.avatar_url,
        twitter_handle=user.twitter_handle,
        created_at=user.created_at.isoformat(),
        total_points=stats.total_points,
        correct_scores=stats.correct_scores,
        correct_results=stats.correct_results,
        predictions_made=stats.predictions_made,
        position=stats.position,
        current_streak=stats.current_streak,
        best_streak=stats.best_streak,
        email_notifications=user.email_notifications,
        is_admin=user.is_admin
    )

@router.put("/me", response_model=ProfileUpdateResponse)
def update_profile(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile"""
    
    # Check if username is taken (case-insensitive)
    if update_data.username and update_data.username.lower() != current_user.username.lower():
        from sqlalchemy import func
        existing_user = db.query(User).filter(
            func.lower(User.username) == update_data.username.lower()
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = update_data.username
    
    # Check if email is taken (only allow email change for non-social logins)
    if update_data.email and update_data.email != current_user.email:
        # Prevent email change for social login users
        if current_user.provider and current_user.provider != 'local':
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot change email for {current_user.provider} login accounts"
            )
        
        existing_user = db.query(User).filter(
            User.email == update_data.email
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = update_data.email
    
    # Update email notifications preference
    if update_data.email_notifications is not None:
        current_user.email_notifications = update_data.email_notifications
    
    # Update Twitter handle (only for non-Twitter login users)
    if update_data.twitter_handle is not None:
        # Prevent Twitter users from changing their handle
        if current_user.provider == 'twitter':
            raise HTTPException(
                status_code=400, 
                detail="Cannot change Twitter handle for Twitter login accounts"
            )
        
        # Check if handle is taken by another user
        if update_data.twitter_handle:
            existing_user = db.query(User).filter(
                User.twitter_handle == update_data.twitter_handle,
                User.id != current_user.id
            ).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="Twitter handle already linked to another account")
        current_user.twitter_handle = update_data.twitter_handle if update_data.twitter_handle else None
    
    db.commit()
    db.refresh(current_user)
    
    # Get updated profile
    stats = db.query(UserStats).filter(
        UserStats.user_id == current_user.id
    ).first()
    
    if not stats:
        stats = UserStats(
            user_id=current_user.id,
            season="2025-2026"
        )
        db.add(stats)
        db.commit()
        db.refresh(stats)
    
    updated_profile = UserProfile(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        avatar_url=current_user.avatar_url,
        twitter_handle=current_user.twitter_handle,
        created_at=current_user.created_at.isoformat(),
        total_points=stats.total_points,
        correct_scores=stats.correct_scores,
        correct_results=stats.correct_results,
        predictions_made=stats.predictions_made,
        position=stats.position,
        current_streak=stats.current_streak,
        best_streak=stats.best_streak,
        email_notifications=current_user.email_notifications,
        is_admin=current_user.is_admin
    )
    
    return ProfileUpdateResponse(
        message="Profile updated successfully",
        user=updated_profile
    )

@router.post("/me/change-password")
def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Change current user's password"""
    
    # Users who signed up with social auth don't have passwords
    if not current_user.password_hash:
        raise HTTPException(
            status_code=400, 
            detail="Cannot change password for social login accounts"
        )
    
    # Verify current password
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}

@router.get("/{username}/predictions")
def get_user_predictions(
    username: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get recent predictions for a specific user (current season only)"""
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get current season
    from models.models import Prediction, Fixture, Season
    current_season = db.query(Season).filter(Season.is_current == True).first()
    
    # Get recent predictions with fixture details (current season only)
    query = db.query(Prediction).join(Fixture).filter(
        Prediction.user_id == user.id
    )
    
    if current_season:
        query = query.filter(Fixture.season_id == current_season.id)
    
    predictions = query.order_by(Fixture.kickoff_time.desc()).limit(limit).all()
    
    result = []
    for pred in predictions:
        result.append({
            "fixture_id": pred.fixture_id,
            "home_team": pred.fixture.home_team,
            "away_team": pred.fixture.away_team,
            "home_prediction": pred.home_prediction,
            "away_prediction": pred.away_prediction,
            "home_score": pred.fixture.home_score,
            "away_score": pred.fixture.away_score,
            "points_earned": pred.points_earned,
            "kickoff_time": pred.fixture.kickoff_time.isoformat()
        })
    
    return result