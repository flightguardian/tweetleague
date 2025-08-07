from fastapi import HTTPException, Request, status
from datetime import datetime, timedelta
from typing import Dict, Tuple
import time

class RateLimiter:
    def __init__(self):
        self.attempts: Dict[str, list] = {}
        
    def _clean_old_attempts(self, key: str, window_seconds: int):
        """Remove attempts older than the time window"""
        if key not in self.attempts:
            return
        
        cutoff_time = time.time() - window_seconds
        self.attempts[key] = [t for t in self.attempts[key] if t > cutoff_time]
        
        if not self.attempts[key]:
            del self.attempts[key]
    
    def check_rate_limit(
        self,
        key: str,
        max_attempts: int,
        window_seconds: int
    ) -> Tuple[bool, int]:
        """
        Check if rate limit is exceeded
        Returns (is_allowed, remaining_attempts)
        """
        self._clean_old_attempts(key, window_seconds)
        
        if key not in self.attempts:
            self.attempts[key] = []
        
        current_attempts = len(self.attempts[key])
        
        if current_attempts >= max_attempts:
            return False, 0
        
        return True, max_attempts - current_attempts
    
    def record_attempt(self, key: str):
        """Record a new attempt"""
        if key not in self.attempts:
            self.attempts[key] = []
        self.attempts[key].append(time.time())
    
    def get_reset_time(self, key: str, window_seconds: int) -> int:
        """Get seconds until rate limit resets"""
        if key not in self.attempts or not self.attempts[key]:
            return 0
        
        oldest_attempt = min(self.attempts[key])
        reset_time = oldest_attempt + window_seconds - time.time()
        
        return max(0, int(reset_time))

# Global rate limiter instance
rate_limiter = RateLimiter()

def rate_limit_middleware(
    request: Request,
    endpoint: str,
    max_attempts: int = 5,
    window_seconds: int = 60
):
    """
    Rate limiting middleware for endpoints
    Default: 5 attempts per minute
    """
    # Get client IP
    client_ip = request.client.host
    if "x-forwarded-for" in request.headers:
        client_ip = request.headers["x-forwarded-for"].split(",")[0].strip()
    
    # Create rate limit key
    rate_limit_key = f"{endpoint}:{client_ip}"
    
    # Check rate limit
    is_allowed, remaining = rate_limiter.check_rate_limit(
        rate_limit_key,
        max_attempts,
        window_seconds
    )
    
    if not is_allowed:
        reset_time = rate_limiter.get_reset_time(rate_limit_key, window_seconds)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many attempts. Please try again in {reset_time} seconds.",
            headers={
                "X-RateLimit-Limit": str(max_attempts),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(reset_time)
            }
        )
    
    # Record attempt
    rate_limiter.record_attempt(rate_limit_key)
    
    return {
        "X-RateLimit-Limit": str(max_attempts),
        "X-RateLimit-Remaining": str(remaining - 1),
        "X-RateLimit-Reset": str(window_seconds)
    }