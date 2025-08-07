#!/usr/bin/env python3
"""
Migration script to add email verification tables
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from database.base import settings

def migrate_database():
    engine = create_engine(
        settings.DATABASE_URL, 
        connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
    )
    
    with engine.connect() as conn:
        # Create email verification tokens table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS email_verification_tokens (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                token VARCHAR UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """))
        
        # Create password reset tokens table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                token VARCHAR UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """))
        
        # Create indexes
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_email_verification_token 
            ON email_verification_tokens(token)
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_password_reset_token 
            ON password_reset_tokens(token)
        """))
        
        # Mark all existing users as verified (they're already using the system)
        conn.execute(text("""
            UPDATE users 
            SET email_verified = 1 
            WHERE email_verified IS NULL OR email_verified = 0
        """))
        
        conn.commit()
        print("Email verification tables created successfully!")

if __name__ == "__main__":
    migrate_database()