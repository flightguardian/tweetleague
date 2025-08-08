from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from database.base import get_db, settings
from models.models import User, UserStats, Season
from utils.auth import create_access_token
import requests
import hmac
import hashlib
import base64
import time
import urllib.parse
import secrets
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter()

# Twitter OAuth 1.0a configuration
TWITTER_API_KEY = os.getenv("TWITTER_API_KEY", "")
TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET", "")
TWITTER_CALLBACK_URL = os.getenv("TWITTER_CALLBACK_URL", "http://localhost:3000/api/auth/callback/twitter")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Twitter OAuth endpoints
TWITTER_REQUEST_TOKEN_URL = "https://api.twitter.com/oauth/request_token"
TWITTER_AUTHORIZE_URL = "https://api.twitter.com/oauth/authorize"
TWITTER_ACCESS_TOKEN_URL = "https://api.twitter.com/oauth/access_token"
TWITTER_VERIFY_CREDENTIALS_URL = "https://api.twitter.com/1.1/account/verify_credentials.json"

# Store request tokens temporarily (in production, use Redis or database)
request_tokens = {}

def generate_oauth_signature(
    method: str,
    url: str,
    params: dict,
    consumer_secret: str,
    token_secret: str = ""
) -> str:
    """Generate OAuth 1.0a signature"""
    # Sort parameters and encode them
    sorted_params = sorted(params.items())
    param_string = "&".join([f"{k}={v}" for k, v in sorted_params])
    
    # Create signature base string
    signature_base = f"{method}&{urllib.parse.quote(url, safe='')}&{urllib.parse.quote(param_string, safe='')}"
    
    # Create signing key
    signing_key = f"{urllib.parse.quote(consumer_secret, safe='')}&{urllib.parse.quote(token_secret, safe='')}"
    
    # Generate signature
    signature = hmac.new(
        signing_key.encode('utf-8'),
        signature_base.encode('utf-8'),
        hashlib.sha1
    ).digest()
    
    return base64.b64encode(signature).decode('utf-8')

def generate_oauth_header(params: dict) -> str:
    """Generate OAuth Authorization header"""
    oauth_params = []
    for key, value in sorted(params.items()):
        if key.startswith('oauth_'):
            oauth_params.append(f'{key}="{value}"')
    
    return f"OAuth {', '.join(oauth_params)}"

@router.get("/login")
async def twitter_login():
    """Initiate Twitter OAuth flow"""
    
    if not TWITTER_API_KEY or not TWITTER_API_SECRET:
        raise HTTPException(status_code=500, detail="Twitter OAuth not configured")
    
    # Step 1: Get request token
    timestamp = str(int(time.time()))
    nonce = secrets.token_hex(16)
    
    oauth_params = {
        "oauth_callback": urllib.parse.quote(TWITTER_CALLBACK_URL, safe=''),
        "oauth_consumer_key": TWITTER_API_KEY,
        "oauth_nonce": nonce,
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": timestamp,
        "oauth_version": "1.0"
    }
    
    # Generate signature
    signature = generate_oauth_signature(
        "POST",
        TWITTER_REQUEST_TOKEN_URL,
        oauth_params,
        TWITTER_API_SECRET
    )
    
    oauth_params["oauth_signature"] = urllib.parse.quote(signature, safe='')
    
    # Make request
    headers = {
        "Authorization": generate_oauth_header(oauth_params)
    }
    
    response = requests.post(TWITTER_REQUEST_TOKEN_URL, headers=headers)
    
    if response.status_code != 200:
        logger.error(f"Twitter request token failed: {response.text}")
        raise HTTPException(status_code=400, detail="Failed to get request token")
    
    # Parse response
    response_data = dict(urllib.parse.parse_qsl(response.text))
    oauth_token = response_data.get("oauth_token")
    oauth_token_secret = response_data.get("oauth_token_secret")
    oauth_callback_confirmed = response_data.get("oauth_callback_confirmed")
    
    if not oauth_token or oauth_callback_confirmed != "true":
        raise HTTPException(status_code=400, detail="Invalid request token response")
    
    # Store token secret for later
    request_tokens[oauth_token] = oauth_token_secret
    
    # Step 2: Redirect user to Twitter
    authorize_url = f"{TWITTER_AUTHORIZE_URL}?oauth_token={oauth_token}"
    return RedirectResponse(url=authorize_url)

@router.get("/callback")
async def twitter_callback(
    oauth_token: str = Query(...),
    oauth_verifier: str = Query(...),
    db: Session = Depends(get_db)
):
    """Handle Twitter OAuth callback"""
    
    # Get stored token secret
    oauth_token_secret = request_tokens.get(oauth_token)
    if not oauth_token_secret:
        raise HTTPException(status_code=400, detail="Invalid oauth token")
    
    # Step 3: Exchange for access token
    timestamp = str(int(time.time()))
    nonce = secrets.token_hex(16)
    
    oauth_params = {
        "oauth_consumer_key": TWITTER_API_KEY,
        "oauth_nonce": nonce,
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": timestamp,
        "oauth_token": oauth_token,
        "oauth_verifier": oauth_verifier,
        "oauth_version": "1.0"
    }
    
    # Generate signature
    signature = generate_oauth_signature(
        "POST",
        TWITTER_ACCESS_TOKEN_URL,
        oauth_params,
        TWITTER_API_SECRET,
        oauth_token_secret
    )
    
    oauth_params["oauth_signature"] = urllib.parse.quote(signature, safe='')
    
    # Make request
    headers = {
        "Authorization": generate_oauth_header(oauth_params)
    }
    
    response = requests.post(TWITTER_ACCESS_TOKEN_URL, headers=headers)
    
    if response.status_code != 200:
        logger.error(f"Twitter access token failed: {response.text}")
        raise HTTPException(status_code=400, detail="Failed to get access token")
    
    # Parse response
    response_data = dict(urllib.parse.parse_qsl(response.text))
    access_token = response_data.get("oauth_token")
    access_token_secret = response_data.get("oauth_token_secret")
    user_id = response_data.get("user_id")
    screen_name = response_data.get("screen_name")
    
    # Get user details
    timestamp = str(int(time.time()))
    nonce = secrets.token_hex(16)
    
    oauth_params = {
        "oauth_consumer_key": TWITTER_API_KEY,
        "oauth_nonce": nonce,
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": timestamp,
        "oauth_token": access_token,
        "oauth_version": "1.0"
    }
    
    signature = generate_oauth_signature(
        "GET",
        TWITTER_VERIFY_CREDENTIALS_URL,
        oauth_params,
        TWITTER_API_SECRET,
        access_token_secret
    )
    
    oauth_params["oauth_signature"] = urllib.parse.quote(signature, safe='')
    
    headers = {
        "Authorization": generate_oauth_header(oauth_params)
    }
    
    response = requests.get(
        TWITTER_VERIFY_CREDENTIALS_URL,
        headers=headers,
        params={"include_email": "true"}
    )
    
    if response.status_code != 200:
        logger.error(f"Twitter verify credentials failed: {response.text}")
        raise HTTPException(status_code=400, detail="Failed to get user details")
    
    twitter_user = response.json()
    
    # Log the Twitter user data for debugging
    logger.info(f"Twitter user data: name={twitter_user.get('name')}, screen_name={twitter_user.get('screen_name')}, id={user_id}")
    
    # Extract the actual Twitter handle (screen_name from API response)
    twitter_handle = twitter_user.get("screen_name", screen_name)  # This is the @username
    display_name = twitter_user.get("name", screen_name)  # This is the display name
    
    # Check if user exists
    user = db.query(User).filter(User.twitter_id == user_id).first()
    
    if user:
        # Update Twitter handle and avatar in case they changed
        user.twitter_handle = twitter_handle  # Use actual Twitter handle
        user.avatar_url = twitter_user.get("profile_image_url_https")
        db.commit()
    else:
        # Check if email exists (if provided)
        email = twitter_user.get("email", f"{screen_name}@twitter.local")
        existing_user = db.query(User).filter(User.email == email).first()
        
        if existing_user:
            # Link Twitter account to existing user
            existing_user.twitter_id = user_id
            existing_user.twitter_handle = twitter_handle  # Use actual Twitter handle
            if not existing_user.avatar_url:  # Only update avatar if not already set
                existing_user.avatar_url = twitter_user.get("profile_image_url_https")
            user = existing_user
        else:
            # Create new user
            # Use display name for username if available, otherwise use Twitter handle
            username = display_name[:20] if display_name else twitter_handle
            user = User(
                email=email,
                username=username,  # Use display name for username
                twitter_id=user_id,
                twitter_handle=twitter_handle,  # Save actual Twitter handle
                provider="twitter",
                email_verified=True,  # Twitter accounts are pre-verified
                avatar_url=twitter_user.get("profile_image_url_https")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Create user stats for current season
            current_season = db.query(Season).filter(Season.is_current == True).first()
            if current_season:
                user_stats = UserStats(
                    user_id=user.id,
                    season_id=current_season.id
                )
                db.add(user_stats)
                db.commit()
    
    # Clean up request token
    del request_tokens[oauth_token]
    
    # Create JWT token
    jwt_token = create_access_token(data={"sub": str(user.id)})
    
    # Redirect to frontend with token
    redirect_url = f"{FRONTEND_URL}/auth/twitter/success?token={jwt_token}"
    return RedirectResponse(url=redirect_url)

@router.post("/link")
async def link_twitter_account(
    request: Request,
    db: Session = Depends(get_db)
):
    """Link Twitter account to existing user"""
    # This endpoint would be used to link a Twitter account
    # to an existing email-based account
    pass