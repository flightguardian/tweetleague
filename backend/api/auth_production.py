from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr, Field, validator
from database.base import get_db, settings
from models.models import User, UserStats, Season
from models.email_verification import EmailVerificationToken, PasswordResetToken
from utils.auth import verify_password, get_password_hash, create_access_token, get_current_user
from utils.validators import validate_email, validate_password, validate_username
from utils.email import email_service
from utils.rate_limiter import rate_limit_middleware
import secrets
import string
import logging
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()

class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=8)
    
    @validator('email')
    def validate_email_field(cls, v):
        is_valid, error = validate_email(v)
        if not is_valid:
            raise ValueError(error)
        return v.lower()
    
    @validator('username')
    def validate_username_field(cls, v):
        is_valid, error = validate_username(v)
        if not is_valid:
            raise ValueError(error)
        return v
    
    @validator('password')
    def validate_password_field(cls, v):
        is_valid, error = validate_password(v)
        if not is_valid:
            raise ValueError(error)
        return v

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_admin: bool
    email_verified: bool
    avatar_url: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
    requires_verification: bool = False

def generate_verification_token() -> str:
    """Generate a secure random token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(32))

def create_verification_token(db: Session, user_id: int) -> str:
    """Create and store email verification token"""
    token = generate_verification_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    
    verification = EmailVerificationToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    db.add(verification)
    db.commit()
    
    return token

@router.post("/register", response_model=TokenResponse)
async def register(
    user_data: UserRegister,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new user with email verification"""
    
    # Rate limiting
    rate_limit_middleware(request, "register", max_attempts=5, window_seconds=300)
    
    # Check for existing user
    existing_user = db.query(User).filter(
        or_(
            User.email == user_data.email.lower(),
            User.username == user_data.username
        )
    ).first()
    
    if existing_user:
        if existing_user.email == user_data.email.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email.lower(),
        username=user_data.username,
        password_hash=hashed_password,
        email_verified=False,
        provider='email'
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create user stats for current season
    current_season = db.query(Season).filter(Season.is_current == True).first()
    if current_season:
        user_stats = UserStats(
            user_id=new_user.id,
            season_id=current_season.id
        )
        db.add(user_stats)
        db.commit()
    
    # Create verification token
    verification_token = create_verification_token(db, new_user.id)
    
    # Send verification email in background
    if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
        background_tasks.add_task(
            email_service.send_verification_email,
            new_user.email,
            new_user.username,
            verification_token
        )
    else:
        # Development mode - log the verification URL
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
        logger.info(f"Verification URL for {new_user.email}: {verification_url}")
    
    # Create limited access token (can't make predictions until verified)
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=new_user.id,
            email=new_user.email,
            username=new_user.username,
            is_admin=new_user.is_admin,
            email_verified=new_user.email_verified,
            avatar_url=new_user.avatar_url
        ),
        requires_verification=True
    )

@router.post("/verify-email")
async def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    """Verify email address with token"""
    
    # Find the token
    token_record = db.query(EmailVerificationToken).filter(
        and_(
            EmailVerificationToken.token == token,
            EmailVerificationToken.used == False
        )
    ).first()
    
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # Check if token is expired
    if token_record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired"
        )
    
    # Mark user as verified
    user = token_record.user
    user.email_verified = True
    token_record.used = True
    
    db.commit()
    
    return {"message": "Email verified successfully", "verified": True}

@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login with email/username and password"""
    
    # Rate limiting
    rate_limit_middleware(request, "login", max_attempts=10, window_seconds=300)
    
    # Try to find user by email or username
    user = db.query(User).filter(
        or_(
            User.email == form_data.username.lower(),
            User.username == form_data.username
        )
    ).first()
    
    if not user:
        # Sleep briefly to prevent timing attacks
        import time
        time.sleep(0.5)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Check if user has password (not social login)
    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please login with your social account"
        )
    
    # Verify password
    if not verify_password(form_data.password, user.password_hash):
        # Sleep briefly to prevent timing attacks
        import time
        time.sleep(0.5)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            is_admin=user.is_admin,
            email_verified=user.email_verified,
            avatar_url=user.avatar_url
        ),
        requires_verification=not user.email_verified
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        is_admin=current_user.is_admin,
        email_verified=current_user.email_verified,
        avatar_url=current_user.avatar_url
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Refresh access token"""
    
    # Create new access token
    access_token = create_access_token(data={"sub": str(current_user.id)})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=current_user.id,
            email=current_user.email,
            username=current_user.username,
            is_admin=current_user.is_admin,
            email_verified=current_user.email_verified,
            avatar_url=current_user.avatar_url
        ),
        requires_verification=not current_user.email_verified
    )