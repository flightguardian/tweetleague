#!/usr/bin/env python3
"""
Script to grant admin privileges to a user
Usage: python make_admin.py <username_or_email>
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.base import SessionLocal
from models.models import User
from sqlalchemy import or_

def make_user_admin(identifier: str):
    """Grant admin privileges to a user by username or email"""
    db = SessionLocal()
    
    try:
        # Find user by username or email
        user = db.query(User).filter(
            or_(User.username == identifier, User.email == identifier)
        ).first()
        
        if not user:
            print(f"❌ User not found: {identifier}")
            return False
        
        if user.is_admin:
            print(f"ℹ️  User {user.username} ({user.email}) is already an admin")
            return True
        
        # Grant admin privileges
        user.is_admin = True
        db.commit()
        
        print(f"✅ Successfully granted admin privileges to {user.username} ({user.email})")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def list_users():
    """List all users and their admin status"""
    db = SessionLocal()
    
    try:
        users = db.query(User).all()
        
        print("\n📋 All Users:")
        print("-" * 60)
        for user in users:
            admin_badge = "👑" if user.is_admin else "  "
            print(f"{admin_badge} {user.id:3d} | {user.username:20s} | {user.email}")
        print("-" * 60)
        print(f"Total users: {len(users)}")
        print(f"Admin users: {sum(1 for u in users if u.is_admin)}")
        print()
        
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <username_or_email>")
        print("   or: python make_admin.py --list")
        sys.exit(1)
    
    if sys.argv[1] == "--list":
        list_users()
    else:
        identifier = sys.argv[1]
        success = make_user_admin(identifier)
        sys.exit(0 if success else 1)