#!/usr/bin/env python3
"""
Make a user admin by their email or username
"""

import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.models import User

# Using External Database URL from Render
DATABASE_URL = "postgresql://tweetleague_db_user:76LozrILJDapCyrJChETfltLIUhvF0KG@dpg-d2acp7p5pdvs73al0a90-a.frankfurt-postgres.render.com/tweetleague_db"

# Create engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def make_admin(identifier):
    db = SessionLocal()
    
    try:
        # Try to find user by email or username
        user = db.query(User).filter(
            (User.email == identifier) | (User.username == identifier)
        ).first()
        
        if not user:
            print(f"❌ User not found: {identifier}")
            print("\nExisting users:")
            users = db.query(User).all()
            for u in users:
                print(f"  - {u.username} ({u.email}) - Admin: {u.is_admin}")
            return
        
        if user.is_admin:
            print(f"✅ User {user.username} ({user.email}) is already an admin")
        else:
            user.is_admin = True
            db.commit()
            print(f"✅ Successfully made {user.username} ({user.email}) an admin!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <email_or_username>")
        print("\nListing all users...")
        db = SessionLocal()
        users = db.query(User).all()
        print("\nCurrent users in database:")
        for u in users:
            print(f"  - {u.username} ({u.email}) - Admin: {u.is_admin}")
        db.close()
    else:
        make_admin(sys.argv[1])