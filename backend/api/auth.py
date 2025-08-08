from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import timedelta
from pydantic import BaseModel, EmailStr
from database.base import get_db, settings
from models.models import User, UserStats, Season
from utils.auth import verify_password, get_password_hash, create_access_token
import secrets

router = APIRouter()

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class SocialAuth(BaseModel):
    provider: str
    provider_id: str
    email: EmailStr
    name: str
    avatar_url: str | None = None
    twitter_handle: str | None = None

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_admin: bool
    avatar_url: str | None = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

@router.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if db_user:
        if db_user.email == user_data.email:
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    user_stats = UserStats(
        user_id=new_user.id,
        season="2025-2026"
    )
    db.add(user_stats)
    db.commit()
    
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=new_user.id,
            email=new_user.email,
            username=new_user.username,
            is_admin=new_user.is_admin,
            avatar_url=new_user.avatar_url
        )
    }

@router.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.email == form_data.username) | (User.username == form_data.username)
    ).first()
    
    if not user or not user.password_hash or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            is_admin=user.is_admin,
            avatar_url=user.avatar_url
        )
    }

@router.post("/social", response_model=Token)
def social_login(auth_data: SocialAuth, db: Session = Depends(get_db)):
    # Debug logging
    print(f"[SOCIAL AUTH] Received data: provider={auth_data.provider}, provider_id={auth_data.provider_id}, email={auth_data.email}, name={auth_data.name}, twitter_handle={auth_data.twitter_handle}")
    
    # Check if user exists with this provider ID
    if auth_data.provider == "google":
        user = db.query(User).filter(User.google_id == auth_data.provider_id).first()
    elif auth_data.provider == "twitter":
        user = db.query(User).filter(User.twitter_id == auth_data.provider_id).first()
        # Update Twitter handle for existing Twitter users
        if user and auth_data.twitter_handle:
            print(f"[SOCIAL AUTH] Updating Twitter handle for existing user {user.id}: {auth_data.twitter_handle}")
            user.twitter_handle = auth_data.twitter_handle.replace('@', '')
            db.commit()
    else:
        raise HTTPException(status_code=400, detail="Invalid provider")
    
    # If not found by provider ID, check by email
    if not user:
        user = db.query(User).filter(User.email == auth_data.email).first()
        
        if user:
            # Update existing user with provider ID
            if auth_data.provider == "google":
                user.google_id = auth_data.provider_id
            elif auth_data.provider == "twitter":
                user.twitter_id = auth_data.provider_id
                # Update Twitter handle if provided
                if auth_data.twitter_handle:
                    user.twitter_handle = auth_data.twitter_handle.replace('@', '')
            
            if auth_data.avatar_url and not user.avatar_url:
                user.avatar_url = auth_data.avatar_url
                
            db.commit()
        else:
            # Create new user
            username = auth_data.name.lower().replace(" ", "_")
            # Ensure unique username
            base_username = username
            counter = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{base_username}_{counter}"
                counter += 1
            
            # Prepare Twitter-specific fields
            twitter_fields = {}
            if auth_data.provider == "twitter":
                twitter_fields['twitter_id'] = auth_data.provider_id
                if auth_data.twitter_handle:
                    print(f"[SOCIAL AUTH] Setting Twitter handle for new user: {auth_data.twitter_handle}")
                    twitter_fields['twitter_handle'] = auth_data.twitter_handle.replace('@', '')
            elif auth_data.provider == "google":
                twitter_fields['google_id'] = auth_data.provider_id
            
            user = User(
                email=auth_data.email,
                username=username,
                avatar_url=auth_data.avatar_url,
                provider=auth_data.provider,
                email_verified=True,
                **twitter_fields
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Debug: Check if twitter_handle was saved
            print(f"[SOCIAL AUTH] Created user {user.id} with twitter_handle: {user.twitter_handle}")
            
            # Create user stats for current season
            current_season = db.query(Season).filter(Season.is_current == True).first()
            if current_season:
                user_stats = UserStats(
                    user_id=user.id,
                    season_id=current_season.id
                )
                db.add(user_stats)
            
            db.commit()
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            is_admin=user.is_admin,
            avatar_url=user.avatar_url
        )
    }