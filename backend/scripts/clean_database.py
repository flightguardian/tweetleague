#!/usr/bin/env python3
"""
Clean database and prepare for production
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from database.base import settings
from datetime import datetime, timezone

def clean_database():
    engine = create_engine(
        settings.DATABASE_URL, 
        connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
    )
    
    with engine.connect() as conn:
        # Get the user we want to keep
        keeper = conn.execute(text("""
            SELECT id, username, is_admin 
            FROM users 
            WHERE email = 'gavmcbride90@gmail.com'
        """)).first()
        
        if not keeper:
            print("Warning: gavmcbride90@gmail.com not found in database")
            return
        
        keeper_id, keeper_username, is_admin = keeper
        print(f"Keeping user: {keeper_username} (ID: {keeper_id}, Admin: {is_admin})")
        
        # Make this user an admin if not already
        if not is_admin:
            conn.execute(text(f"UPDATE users SET is_admin = 1 WHERE id = {keeper_id}"))
            print(f"  - Granted admin privileges to {keeper_username}")
        
        # Delete all predictions except keeper's
        conn.execute(text(f"DELETE FROM predictions WHERE user_id != {keeper_id}"))
        
        # Delete all user_stats except keeper's
        conn.execute(text(f"DELETE FROM user_stats WHERE user_id != {keeper_id}"))
        
        # Delete all notifications except keeper's
        conn.execute(text(f"DELETE FROM notifications WHERE user_id != {keeper_id}"))
        
        # Delete all email verification tokens except keeper's
        conn.execute(text(f"DELETE FROM email_verification_tokens WHERE user_id != {keeper_id}"))
        
        # Delete all password reset tokens except keeper's
        conn.execute(text(f"DELETE FROM password_reset_tokens WHERE user_id != {keeper_id}"))
        
        # Delete all users except keeper
        deleted = conn.execute(text(f"DELETE FROM users WHERE id != {keeper_id}"))
        print(f"  - Deleted {deleted.rowcount} other users")
        
        # Delete all fixtures
        conn.execute(text("DELETE FROM fixtures"))
        print("  - Deleted all fixtures")
        
        # Delete all seasons
        conn.execute(text("DELETE FROM seasons"))
        print("  - Deleted all seasons")
        
        # Create new 2024-2025 season
        conn.execute(text("""
            INSERT INTO seasons (name, start_date, end_date, status, is_current)
            VALUES ('2024-2025', '2024-08-01 00:00:00', '2025-05-31 23:59:59', 'ACTIVE', 1)
        """))
        print("  - Created 2024-2025 season")
        
        # Get the new season ID
        season = conn.execute(text("SELECT id FROM seasons WHERE name = '2024-2025'")).first()
        season_id = season[0]
        
        # Create/update user stats for keeper in new season
        existing_stats = conn.execute(text(f"""
            SELECT id FROM user_stats 
            WHERE user_id = {keeper_id} AND season_id = {season_id}
        """)).first()
        
        if not existing_stats:
            conn.execute(text(f"""
                INSERT INTO user_stats (user_id, season_id, total_points, correct_scores, 
                                       correct_results, predictions_made, current_streak, 
                                       best_streak, avg_points_per_game, position)
                VALUES ({keeper_id}, {season_id}, 0, 0, 0, 0, 0, 0, 0.0, NULL)
            """))
            print(f"  - Created user stats for {keeper_username} in new season")
        
        conn.commit()
        print("\nDatabase cleaned successfully!")
        print(f"Ready for new fixtures in season 2024-2025 (ID: {season_id})")
        return season_id

if __name__ == "__main__":
    season_id = clean_database()
    print(f"\nNext step: Add fixtures to season ID {season_id}")