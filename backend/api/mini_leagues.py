from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from pydantic import BaseModel, Field
from database.base import get_db
from models.models import User, Season, UserStats
from models.mini_leagues import MiniLeague, MiniLeagueMember
from utils.auth import get_current_user
import random
import string

router = APIRouter()

class MiniLeagueCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    max_members: int = Field(default=50, ge=2, le=100)

class MiniLeagueResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    invite_code: str
    created_by: int
    creator_username: str
    season_id: int
    member_count: int
    max_members: int
    is_active: bool
    is_member: bool
    is_admin: bool

class MiniLeagueMemberResponse(BaseModel):
    user_id: int
    username: str
    avatar_url: Optional[str]
    is_admin: bool
    joined_at: str
    total_points: int
    predictions_made: int
    position: int

def generate_invite_code():
    """Generate a unique 8-character invite code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

@router.post("/create", response_model=MiniLeagueResponse)
async def create_mini_league(
    league_data: MiniLeagueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new mini league"""
    # Get current season
    current_season = db.query(Season).filter(Season.is_current == True).first()
    if not current_season:
        raise HTTPException(status_code=400, detail="No active season")
    
    # Check if user has reached league limit (5 leagues)
    user_league_count = db.query(MiniLeagueMember).filter(
        MiniLeagueMember.user_id == current_user.id
    ).count()
    
    if user_league_count >= 5:
        raise HTTPException(status_code=400, detail="Maximum of 5 leagues per user")
    
    # Generate unique invite code
    invite_code = generate_invite_code()
    while db.query(MiniLeague).filter(MiniLeague.invite_code == invite_code).first():
        invite_code = generate_invite_code()
    
    # Create the league
    mini_league = MiniLeague(
        name=league_data.name,
        description=league_data.description,
        invite_code=invite_code,
        created_by=current_user.id,
        season_id=current_season.id,
        max_members=league_data.max_members,
        is_active=True
    )
    db.add(mini_league)
    db.flush()
    
    # Add creator as admin member
    member = MiniLeagueMember(
        mini_league_id=mini_league.id,
        user_id=current_user.id,
        is_admin=True
    )
    db.add(member)
    db.commit()
    
    return MiniLeagueResponse(
        id=mini_league.id,
        name=mini_league.name,
        description=mini_league.description,
        invite_code=mini_league.invite_code,
        created_by=mini_league.created_by,
        creator_username=current_user.username,
        season_id=mini_league.season_id,
        member_count=1,
        max_members=mini_league.max_members,
        is_active=mini_league.is_active,
        is_member=True,
        is_admin=True
    )

@router.post("/join/{invite_code}", response_model=MiniLeagueResponse)
async def join_mini_league(
    invite_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Join a mini league using invite code"""
    # Find league by invite code
    mini_league = db.query(MiniLeague).filter(
        MiniLeague.invite_code == invite_code.upper()
    ).first()
    
    if not mini_league:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    
    if not mini_league.is_active:
        raise HTTPException(status_code=400, detail="This league is no longer active")
    
    # Check if already a member
    existing_member = db.query(MiniLeagueMember).filter(
        and_(
            MiniLeagueMember.mini_league_id == mini_league.id,
            MiniLeagueMember.user_id == current_user.id
        )
    ).first()
    
    if existing_member:
        raise HTTPException(status_code=400, detail="Already a member of this league")
    
    # Check if league is full
    member_count = db.query(MiniLeagueMember).filter(
        MiniLeagueMember.mini_league_id == mini_league.id
    ).count()
    
    if member_count >= mini_league.max_members:
        raise HTTPException(status_code=400, detail="League is full")
    
    # Check user's league limit
    user_league_count = db.query(MiniLeagueMember).filter(
        MiniLeagueMember.user_id == current_user.id
    ).count()
    
    if user_league_count >= 5:
        raise HTTPException(status_code=400, detail="Maximum of 5 leagues per user")
    
    # Add user to league
    member = MiniLeagueMember(
        mini_league_id=mini_league.id,
        user_id=current_user.id,
        is_admin=False
    )
    db.add(member)
    db.commit()
    
    # Get creator username
    creator = db.query(User).filter(User.id == mini_league.created_by).first()
    
    return MiniLeagueResponse(
        id=mini_league.id,
        name=mini_league.name,
        description=mini_league.description,
        invite_code=mini_league.invite_code,
        created_by=mini_league.created_by,
        creator_username=creator.username if creator else "Unknown",
        season_id=mini_league.season_id,
        member_count=member_count + 1,
        max_members=mini_league.max_members,
        is_active=mini_league.is_active,
        is_member=True,
        is_admin=False
    )

@router.get("/my-leagues", response_model=List[MiniLeagueResponse])
async def get_my_leagues(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all leagues the current user is a member of"""
    # Get current season
    current_season = db.query(Season).filter(Season.is_current == True).first()
    if not current_season:
        return []
    
    # Get user's leagues
    memberships = db.query(MiniLeagueMember).filter(
        MiniLeagueMember.user_id == current_user.id
    ).all()
    
    leagues = []
    for membership in memberships:
        league = membership.league
        
        # Skip if not current season
        if league.season_id != current_season.id:
            continue
        
        # Get member count
        member_count = db.query(MiniLeagueMember).filter(
            MiniLeagueMember.mini_league_id == league.id
        ).count()
        
        # Get creator username
        creator = db.query(User).filter(User.id == league.created_by).first()
        
        leagues.append(MiniLeagueResponse(
            id=league.id,
            name=league.name,
            description=league.description,
            invite_code=league.invite_code,
            created_by=league.created_by,
            creator_username=creator.username if creator else "Unknown",
            season_id=league.season_id,
            member_count=member_count,
            max_members=league.max_members,
            is_active=league.is_active,
            is_member=True,
            is_admin=membership.is_admin
        ))
    
    return leagues

@router.get("/{league_id}/members", response_model=List[MiniLeagueMemberResponse])
async def get_league_members(
    league_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get members of a mini league with their stats"""
    # Check if league exists
    league = db.query(MiniLeague).filter(MiniLeague.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    # Check if user is a member
    is_member = db.query(MiniLeagueMember).filter(
        and_(
            MiniLeagueMember.mini_league_id == league_id,
            MiniLeagueMember.user_id == current_user.id
        )
    ).first()
    
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member of this league")
    
    # Get all members with stats
    members = db.query(MiniLeagueMember).filter(
        MiniLeagueMember.mini_league_id == league_id
    ).all()
    
    member_stats = []
    for member in members:
        user = member.user
        
        # Get user stats for current season
        user_stats = db.query(UserStats).filter(
            and_(
                UserStats.user_id == user.id,
                UserStats.season_id == league.season_id
            )
        ).first()
        
        points = user_stats.total_points if user_stats else 0
        predictions = user_stats.predictions_made if user_stats else 0
        
        member_stats.append({
            'member': member,
            'user': user,
            'points': points,
            'predictions': predictions
        })
    
    # Sort by points (descending)
    member_stats.sort(key=lambda x: x['points'], reverse=True)
    
    # Build response with positions
    response = []
    for position, stat in enumerate(member_stats, 1):
        response.append(MiniLeagueMemberResponse(
            user_id=stat['user'].id,
            username=stat['user'].username,
            avatar_url=stat['user'].avatar_url,
            is_admin=stat['member'].is_admin,
            joined_at=stat['member'].joined_at.isoformat(),
            total_points=stat['points'],
            predictions_made=stat['predictions'],
            position=position
        ))
    
    return response

@router.delete("/{league_id}/leave")
async def leave_league(
    league_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Leave a mini league"""
    # Check membership
    membership = db.query(MiniLeagueMember).filter(
        and_(
            MiniLeagueMember.mini_league_id == league_id,
            MiniLeagueMember.user_id == current_user.id
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Not a member of this league")
    
    # Check if user is the creator
    league = db.query(MiniLeague).filter(MiniLeague.id == league_id).first()
    if league.created_by == current_user.id:
        # Check if there are other members
        member_count = db.query(MiniLeagueMember).filter(
            MiniLeagueMember.mini_league_id == league_id
        ).count()
        
        if member_count > 1:
            raise HTTPException(
                status_code=400, 
                detail="Creator cannot leave while other members exist. Transfer ownership or delete the league."
            )
        else:
            # Delete the league if creator is the only member
            db.delete(league)
    else:
        # Just remove the membership
        db.delete(membership)
    
    db.commit()
    return {"message": "Successfully left the league"}

@router.delete("/{league_id}")
async def delete_league(
    league_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a mini league (creator only)"""
    league = db.query(MiniLeague).filter(MiniLeague.id == league_id).first()
    
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    if league.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can delete the league")
    
    db.delete(league)
    db.commit()
    
    return {"message": "League deleted successfully"}