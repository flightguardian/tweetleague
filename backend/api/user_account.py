from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from models.models import User, Prediction, UserStats, Notification
from models.mini_leagues import MiniLeague, MiniLeagueMember
from api.auth import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/account", tags=["account"])

class DeleteAccountRequest(BaseModel):
    confirmation: str  # User must type "DELETE" to confirm
    password: Optional[str] = None  # Required for email/password users

class DeleteAccountResponse(BaseModel):
    message: str
    deleted_items: dict

@router.delete("/delete", response_model=DeleteAccountResponse)
async def delete_user_account(
    request: DeleteAccountRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete user account and all associated data (GDPR compliant).
    This will permanently delete:
    - User account
    - All predictions
    - All user stats
    - All notifications
    - Mini league memberships
    - Mini leagues created by the user (transfers ownership or deletes if no other members)
    """
    
    # Verify confirmation text
    if request.confirmation != "DELETE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please type 'DELETE' to confirm account deletion"
        )
    
    # For email/password users, verify password
    if current_user.provider == "email" and current_user.password_hash:
        if not request.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password required for account deletion"
            )
        
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        if not pwd_context.verify(request.password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password"
            )
    
    # Track what we're deleting for the response
    deleted_counts = {
        "predictions": 0,
        "user_stats": 0,
        "notifications": 0,
        "mini_league_memberships": 0,
        "mini_leagues_transferred": 0,
        "mini_leagues_deleted": 0
    }
    
    try:
        # 1. Delete all predictions
        predictions = db.query(Prediction).filter(Prediction.user_id == current_user.id).all()
        deleted_counts["predictions"] = len(predictions)
        for pred in predictions:
            db.delete(pred)
        
        # 2. Delete all user stats
        user_stats = db.query(UserStats).filter(UserStats.user_id == current_user.id).all()
        deleted_counts["user_stats"] = len(user_stats)
        for stat in user_stats:
            db.delete(stat)
        
        # 3. Delete all notifications
        notifications = db.query(Notification).filter(Notification.user_id == current_user.id).all()
        deleted_counts["notifications"] = len(notifications)
        for notif in notifications:
            db.delete(notif)
        
        # 4. Handle mini league memberships
        memberships = db.query(MiniLeagueMember).filter(
            MiniLeagueMember.user_id == current_user.id
        ).all()
        deleted_counts["mini_league_memberships"] = len(memberships)
        for membership in memberships:
            db.delete(membership)
        
        # 5. Handle mini leagues created by the user
        created_leagues = db.query(MiniLeague).filter(
            MiniLeague.created_by == current_user.id
        ).all()
        
        for league in created_leagues:
            # Get other members who could take ownership
            other_members = db.query(MiniLeagueMember).filter(
                MiniLeagueMember.mini_league_id == league.id,
                MiniLeagueMember.user_id != current_user.id
            ).order_by(MiniLeagueMember.joined_at).all()
            
            if other_members:
                # Transfer ownership to the earliest member who joined
                new_owner = other_members[0]
                league.created_by = new_owner.user_id
                new_owner.is_admin = True
                deleted_counts["mini_leagues_transferred"] += 1
                db.add(league)
                db.add(new_owner)
            else:
                # No other members, delete the league
                db.delete(league)
                deleted_counts["mini_leagues_deleted"] += 1
        
        # 6. Finally, delete the user account
        db.delete(current_user)
        
        # Commit all changes
        db.commit()
        
        return DeleteAccountResponse(
            message="Your account and all associated data has been permanently deleted",
            deleted_items=deleted_counts
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )

@router.get("/deletion-preview")
async def preview_account_deletion(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Preview what will be deleted if the user deletes their account.
    This helps users understand the impact before confirming deletion.
    """
    
    # Count all related data
    predictions_count = db.query(Prediction).filter(
        Prediction.user_id == current_user.id
    ).count()
    
    user_stats_count = db.query(UserStats).filter(
        UserStats.user_id == current_user.id
    ).count()
    
    notifications_count = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).count()
    
    memberships = db.query(MiniLeagueMember).join(MiniLeague).filter(
        MiniLeagueMember.user_id == current_user.id
    ).all()
    
    mini_leagues_member = [
        {
            "name": membership.league.name,
            "is_admin": membership.is_admin
        }
        for membership in memberships
    ]
    
    created_leagues = db.query(MiniLeague).filter(
        MiniLeague.created_by == current_user.id
    ).all()
    
    mini_leagues_created = []
    for league in created_leagues:
        member_count = db.query(MiniLeagueMember).filter(
            MiniLeagueMember.mini_league_id == league.id
        ).count()
        
        mini_leagues_created.append({
            "name": league.name,
            "member_count": member_count,
            "will_be_deleted": member_count <= 1  # Will be deleted if user is only member
        })
    
    return {
        "account_info": {
            "username": current_user.username,
            "email": current_user.email,
            "created_at": current_user.created_at,
            "provider": current_user.provider
        },
        "data_to_be_deleted": {
            "predictions": predictions_count,
            "user_stats": user_stats_count,
            "notifications": notifications_count,
            "mini_league_memberships": len(mini_leagues_member),
            "mini_leagues_you_admin": mini_leagues_created
        },
        "warning": "This action is permanent and cannot be undone. All your data will be permanently deleted."
    }