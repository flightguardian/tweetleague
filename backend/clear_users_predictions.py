#!/usr/bin/env python3
"""
Clear all users and predictions from the database while keeping seasons and fixtures.
"""

from database.base import get_db
from models.models import User, Prediction, UserStats
from models.email_verification import EmailVerificationToken, PasswordResetToken
from sqlalchemy import text

def clear_users_and_predictions():
    """Clear all user-related data from the database"""
    db = next(get_db())
    
    try:
        # Get counts before deletion
        user_count = db.query(User).count()
        prediction_count = db.query(Prediction).count()
        stats_count = db.query(UserStats).count()
        
        print(f"Found {user_count} users, {prediction_count} predictions, {stats_count} user stats")
        
        # Delete in order to respect foreign key constraints
        # 1. Delete email verification tokens
        token_count = db.query(EmailVerificationToken).count()
        if token_count > 0:
            db.query(EmailVerificationToken).delete()
            print(f"Deleted {token_count} email verification tokens")
        
        # 2. Delete password reset tokens
        reset_count = db.query(PasswordResetToken).count()
        if reset_count > 0:
            db.query(PasswordResetToken).delete()
            print(f"Deleted {reset_count} password reset tokens")
        
        # 3. Delete predictions
        if prediction_count > 0:
            db.query(Prediction).delete()
            print(f"Deleted {prediction_count} predictions")
        
        # 4. Delete user stats
        if stats_count > 0:
            db.query(UserStats).delete()
            print(f"Deleted {stats_count} user stats")
        
        # 5. Delete users
        if user_count > 0:
            db.query(User).delete()
            print(f"Deleted {user_count} users")
        
        # Try to reset auto-increment counters (sqlite_sequence might not exist)
        try:
            db.execute(text("DELETE FROM sqlite_sequence WHERE name='users'"))
            db.execute(text("DELETE FROM sqlite_sequence WHERE name='predictions'"))
            db.execute(text("DELETE FROM sqlite_sequence WHERE name='user_stats'"))
            db.execute(text("DELETE FROM sqlite_sequence WHERE name='email_verification_tokens'"))
            db.execute(text("DELETE FROM sqlite_sequence WHERE name='password_reset_tokens'"))
            print("Auto-increment counters have been reset.")
        except:
            # sqlite_sequence table might not exist if AUTOINCREMENT wasn't used
            pass
        
        # Commit the changes
        db.commit()
        print("\n✅ Successfully cleared all users and predictions!")
        print("Auto-increment counters have been reset.")
        
        # Verify the data is gone
        remaining_users = db.query(User).count()
        remaining_predictions = db.query(Prediction).count()
        print(f"\nVerification: {remaining_users} users, {remaining_predictions} predictions remaining")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error clearing data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    response = input("⚠️  This will DELETE all users and predictions. Are you sure? (yes/no): ")
    if response.lower() == 'yes':
        clear_users_and_predictions()
    else:
        print("Operation cancelled.")