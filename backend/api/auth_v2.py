from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr, Field, validator
from database.base import get_db, settings
from models.models import User, UserStats, Season
from models.email_verification import EmailVerificationToken, PasswordResetToken
from utils.auth import verify_password, get_password_hash, create_access_token
from utils.validators import validate_email, validate_password, validate_username
from utils.email import email_service
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

class EmailVerification(BaseModel):
    token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
    
    @validator('new_password')
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

def create_reset_token(db: Session, user_id: int) -> str:
    """Create and store password reset token"""
    token = generate_verification_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    reset = PasswordResetToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    db.add(reset)
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
                detail="Email already registered. Please login or reset your password."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken. Please choose another."
            )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email.lower(),
        username=user_data.username,
        password_hash=hashed_password,
        email_verified=False,  # Start as unverified
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
    background_tasks.add_task(
        email_service.send_verification_email,
        new_user.email,
        new_user.username,
        verification_token
    )
    
    # Create access token
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
        )
    )

@router.post("/verify-email")
async def verify_email(
    verification: EmailVerification,
    db: Session = Depends(get_db)
):
    """Verify email address with token"""
    
    # Find the token
    token_record = db.query(EmailVerificationToken).filter(
        and_(
            EmailVerificationToken.token == verification.token,
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
            detail="Verification token has expired. Please request a new one."
        )
    
    # Mark user as verified
    user = token_record.user
    user.email_verified = True
    token_record.used = True
    
    db.commit()
    
    return {"message": "Email verified successfully"}

@router.post("/resend-verification")
async def resend_verification(
    email: EmailStr,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Resend verification email"""
    
    user = db.query(User).filter(User.email == email.lower()).first()
    
    if not user:
        # Don't reveal if email exists
        return {"message": "If an account exists with this email, a verification email has been sent"}
    
    if user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # Invalidate old tokens
    db.query(EmailVerificationToken).filter(
        and_(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.used == False
        )
    ).update({"used": True})
    db.commit()
    
    # Create new token
    verification_token = create_verification_token(db, user.id)
    
    # Send email
    background_tasks.add_task(
        email_service.send_verification_email,
        user.email,
        user.username,
        verification_token
    )
    
    return {"message": "Verification email sent"}

@router.post("/forgot-password")
async def forgot_password(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Request password reset email"""
    
    user = db.query(User).filter(User.email == request.email.lower()).first()
    
    if user:
        # Only send reset for email-based accounts
        if user.provider == 'email':
            # Invalidate old tokens
            db.query(PasswordResetToken).filter(
                and_(
                    PasswordResetToken.user_id == user.id,
                    PasswordResetToken.used == False
                )
            ).update({"used": True})
            db.commit()
            
            # Create new token
            reset_token = create_reset_token(db, user.id)
            
            # Send email
            background_tasks.add_task(
                email_service.send_password_reset_email,
                user.email,
                user.username,
                reset_token
            )
    
    # Always return success to prevent email enumeration
    return {"message": "If an account exists with this email, a password reset link has been sent"}

@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordReset,
    db: Session = Depends(get_db)
):
    """Reset password with token"""
    
    # Find the token
    token_record = db.query(PasswordResetToken).filter(
        and_(
            PasswordResetToken.token == reset_data.token,
            PasswordResetToken.used == False
        )
    ).first()
    
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if token is expired
    if token_record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired. Please request a new one."
        )
    
    # Update password
    user = token_record.user
    user.password_hash = get_password_hash(reset_data.new_password)
    token_record.used = True
    
    db.commit()
    
    return {"message": "Password reset successfully"}

@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login with email/username and password"""
    
    # Try to find user by email or username
    user = db.query(User).filter(
        or_(
            User.email == form_data.username.lower(),
            User.username == form_data.username
        )
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Check if user has password (not social login)
    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account uses social login. Please login with Google or X."
        )
    
    # Verify password
    if not verify_password(form_data.password, user.password_hash):
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
        )
    )

class SocialAuthRequest(BaseModel):
    provider: str
    provider_id: str
    email: str  # Changed from EmailStr to str to allow Twitter placeholder emails
    name: str
    avatar_url: Optional[str] = None

@router.post("/social", response_model=TokenResponse)
def social_login(auth_data: SocialAuthRequest, db: Session = Depends(get_db)):
    """Handle social authentication from NextAuth"""
    # Check if user exists with this provider ID
    if auth_data.provider == "google":
        user = db.query(User).filter(User.google_id == auth_data.provider_id).first()
    elif auth_data.provider == "twitter":
        user = db.query(User).filter(User.twitter_id == auth_data.provider_id).first()
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
            
            user = User(
                email=auth_data.email,
                username=username,
                avatar_url=auth_data.avatar_url,
                provider=auth_data.provider,
                email_verified=True
            )
            
            if auth_data.provider == "google":
                user.google_id = auth_data.provider_id
            elif auth_data.provider == "twitter":
                user.twitter_id = auth_data.provider_id
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Get current season
            current_season = db.query(Season).filter(Season.is_current == True).first()
            if current_season:
                # Create user stats for current season
                user_stats = UserStats(
                    user_id=user.id,
                    season_id=current_season.id
                )
                db.add(user_stats)
                db.commit()
    
    print(f"Social login - User found/created: ID={user.id}, Email={user.email}, Admin={user.is_admin}")
    access_token = create_access_token(data={"sub": str(user.id)})
    print(f"Created token for user ID: {user.id}")
    
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
        )
    )