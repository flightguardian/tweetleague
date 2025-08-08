from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from database.base import get_db
from models.models import Season, SeasonStatus, Fixture, UserStats, Prediction, User
from utils.auth import get_current_user
from utils.admin_auth import get_admin_user

router = APIRouter()

class SeasonCreate(BaseModel):
    name: str = Field(..., pattern="^\\d{4}-\\d{4}$")  # e.g., "2025-2026"
    start_date: datetime
    end_date: datetime
    
class SeasonUpdate(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[SeasonStatus] = None

class SeasonResponse(BaseModel):
    id: int
    name: str
    start_date: datetime
    end_date: datetime
    status: SeasonStatus
    is_current: bool
    fixture_count: int = 0
    user_count: int = 0
    prediction_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime]

@router.get("/", response_model=List[SeasonResponse])
async def get_all_seasons(db: Session = Depends(get_db)):
    """Get all seasons with basic statistics"""
    seasons = db.query(Season).order_by(Season.start_date.desc()).all()
    
    response = []
    for season in seasons:
        fixture_count = db.query(Fixture).filter(Fixture.season_id == season.id).count()
        user_count = db.query(UserStats).filter(UserStats.season_id == season.id).count()
        prediction_count = db.query(Prediction).join(Fixture).filter(
            Fixture.season_id == season.id
        ).count()
        
        response.append(SeasonResponse(
            id=season.id,
            name=season.name,
            start_date=season.start_date,
            end_date=season.end_date,
            status=season.status,
            is_current=season.is_current,
            fixture_count=fixture_count,
            user_count=user_count,
            prediction_count=prediction_count,
            created_at=season.created_at,
            updated_at=season.updated_at
        ))
    
    return response

@router.get("/current", response_model=SeasonResponse)
async def get_current_season(db: Session = Depends(get_db)):
    """Get the current active season"""
    season = db.query(Season).filter(Season.is_current == True).first()
    
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No current season found"
        )
    
    fixture_count = db.query(Fixture).filter(Fixture.season_id == season.id).count()
    user_count = db.query(UserStats).filter(UserStats.season_id == season.id).count()
    prediction_count = db.query(Prediction).join(Fixture).filter(
        Fixture.season_id == season.id
    ).count()
    
    return SeasonResponse(
        id=season.id,
        name=season.name,
        start_date=season.start_date,
        end_date=season.end_date,
        status=season.status,
        is_current=season.is_current,
        fixture_count=fixture_count,
        user_count=user_count,
        prediction_count=prediction_count,
        created_at=season.created_at,
        updated_at=season.updated_at
    )

@router.post("/", response_model=SeasonResponse)
async def create_season(
    season_data: SeasonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Create a new season (admin only)"""
    # Check if season name already exists
    existing = db.query(Season).filter(Season.name == season_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Season {season_data.name} already exists"
        )
    
    # Create new season in draft status
    new_season = Season(
        name=season_data.name,
        start_date=season_data.start_date,
        end_date=season_data.end_date,
        status=SeasonStatus.DRAFT,
        is_current=False
    )
    
    db.add(new_season)
    db.commit()
    db.refresh(new_season)
    
    return SeasonResponse(
        id=new_season.id,
        name=new_season.name,
        start_date=new_season.start_date,
        end_date=new_season.end_date,
        status=new_season.status,
        is_current=new_season.is_current,
        fixture_count=0,
        user_count=0,
        prediction_count=0,
        created_at=new_season.created_at,
        updated_at=new_season.updated_at
    )

@router.put("/{season_id}/activate", response_model=SeasonResponse)
async def activate_season(
    season_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Activate a season and make it current (admin only)"""
    season = db.query(Season).filter(Season.id == season_id).first()
    
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Season not found"
        )
    
    # Allow reactivating archived seasons for testing
    # In production, you might want to keep this restriction
    # if season.status == SeasonStatus.ARCHIVED:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Cannot activate an archived season"
    #     )
    
    # Deactivate current season
    current = db.query(Season).filter(Season.is_current == True).first()
    if current and current.id != season_id:
        current.is_current = False
        current.status = SeasonStatus.ARCHIVED
    
    # Activate new season
    season.is_current = True
    season.status = SeasonStatus.ACTIVE
    season.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(season)
    
    fixture_count = db.query(Fixture).filter(Fixture.season_id == season.id).count()
    user_count = db.query(UserStats).filter(UserStats.season_id == season.id).count()
    prediction_count = db.query(Prediction).join(Fixture).filter(
        Fixture.season_id == season.id
    ).count()
    
    return SeasonResponse(
        id=season.id,
        name=season.name,
        start_date=season.start_date,
        end_date=season.end_date,
        status=season.status,
        is_current=season.is_current,
        fixture_count=fixture_count,
        user_count=user_count,
        prediction_count=prediction_count,
        created_at=season.created_at,
        updated_at=season.updated_at
    )

@router.put("/{season_id}/archive", response_model=SeasonResponse)
async def archive_season(
    season_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Archive a season (admin only)"""
    season = db.query(Season).filter(Season.id == season_id).first()
    
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Season not found"
        )
    
    if season.is_current:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot archive the current season. Activate another season first."
        )
    
    season.status = SeasonStatus.ARCHIVED
    season.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(season)
    
    fixture_count = db.query(Fixture).filter(Fixture.season_id == season.id).count()
    user_count = db.query(UserStats).filter(UserStats.season_id == season.id).count()
    prediction_count = db.query(Prediction).join(Fixture).filter(
        Fixture.season_id == season.id
    ).count()
    
    return SeasonResponse(
        id=season.id,
        name=season.name,
        start_date=season.start_date,
        end_date=season.end_date,
        status=season.status,
        is_current=season.is_current,
        fixture_count=fixture_count,
        user_count=user_count,
        prediction_count=prediction_count,
        created_at=season.created_at,
        updated_at=season.updated_at
    )

@router.delete("/{season_id}")
async def delete_season(
    season_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Delete a season (admin only) - only works for draft seasons with no data"""
    season = db.query(Season).filter(Season.id == season_id).first()
    
    if not season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Season not found"
        )
    
    if season.status != SeasonStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only delete draft seasons"
        )
    
    # Check if there's any data
    fixture_count = db.query(Fixture).filter(Fixture.season_id == season.id).count()
    if fixture_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete season with {fixture_count} fixtures"
        )
    
    db.delete(season)
    db.commit()
    
    return {"message": f"Season {season.name} deleted successfully"}

@router.post("/{season_id}/clone-fixtures")
async def clone_fixtures_from_season(
    season_id: int,
    source_season_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Clone fixtures from another season (admin only)"""
    target_season = db.query(Season).filter(Season.id == season_id).first()
    source_season = db.query(Season).filter(Season.id == source_season_id).first()
    
    if not target_season or not source_season:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Season not found"
        )
    
    if target_season.status != SeasonStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only clone fixtures to draft seasons"
        )
    
    # Get fixtures from source season
    source_fixtures = db.query(Fixture).filter(Fixture.season_id == source_season_id).all()
    
    if not source_fixtures:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fixtures found in source season"
        )
    
    # Clone fixtures with updated dates
    cloned_count = 0
    for fixture in source_fixtures:
        new_fixture = Fixture(
            season_id=season_id,
            home_team=fixture.home_team,
            away_team=fixture.away_team,
            competition=fixture.competition,
            kickoff_time=fixture.kickoff_time.replace(year=int(target_season.name[:4])),
            original_kickoff_time=fixture.original_kickoff_time.replace(year=int(target_season.name[:4])),
            status=fixture.status,
            round=fixture.round
        )
        db.add(new_fixture)
        cloned_count += 1
    
    db.commit()
    
    return {
        "message": f"Successfully cloned {cloned_count} fixtures from {source_season.name} to {target_season.name}"
    }