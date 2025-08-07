import re
from typing import Tuple

def validate_email(email: str) -> Tuple[bool, str]:
    """Validate email format"""
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not email:
        return False, "Email is required"
    
    if not re.match(email_pattern, email):
        return False, "Invalid email format"
    
    # Check for common typos
    if email.endswith('@gmial.com') or email.endswith('@gmai.com'):
        return False, "Did you mean @gmail.com?"
    
    return True, ""

def validate_password(password: str) -> Tuple[bool, str]:
    """
    Validate password strength
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    """
    if not password:
        return False, "Password is required"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if len(password) > 128:
        return False, "Password must be less than 128 characters"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]', password):
        return False, "Password must contain at least one special character"
    
    # Check for common weak passwords
    common_passwords = [
        'password123', 'Password123!', 'Qwerty123!', 'Admin123!',
        'Welcome123!', 'Password1!', 'Coventry123!'
    ]
    
    if password in common_passwords:
        return False, "This password is too common. Please choose a stronger password"
    
    return True, ""

def validate_username(username: str) -> Tuple[bool, str]:
    """Validate username format"""
    if not username:
        return False, "Username is required"
    
    if len(username) < 3:
        return False, "Username must be at least 3 characters long"
    
    if len(username) > 20:
        return False, "Username must be less than 20 characters"
    
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return False, "Username can only contain letters, numbers, underscores, and hyphens"
    
    if username.startswith('_') or username.startswith('-'):
        return False, "Username cannot start with underscore or hyphen"
    
    # Reserved usernames
    reserved = ['admin', 'root', 'system', 'moderator', 'ccfc', 'coventry']
    if username.lower() in reserved:
        return False, "This username is reserved"
    
    return True, ""

def calculate_password_strength(password: str) -> int:
    """
    Calculate password strength score (0-100)
    """
    score = 0
    
    # Length score (max 30 points)
    if len(password) >= 8:
        score += 10
    if len(password) >= 12:
        score += 10
    if len(password) >= 16:
        score += 10
    
    # Character variety (max 40 points)
    if re.search(r'[a-z]', password):
        score += 10
    if re.search(r'[A-Z]', password):
        score += 10
    if re.search(r'\d', password):
        score += 10
    if re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]', password):
        score += 10
    
    # Pattern complexity (max 30 points)
    if not re.search(r'(.)\1{2,}', password):  # No repeated characters
        score += 10
    if not re.search(r'(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)', password.lower()):  # No sequential
        score += 10
    if len(set(password)) / len(password) > 0.6:  # Character diversity
        score += 10
    
    return min(score, 100)