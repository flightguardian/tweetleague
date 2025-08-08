#!/usr/bin/env python3
"""
Script to reset user data and predictions for the 2025-2026 season.
This will:
- Delete all predictions for 2025-2026 season
- Delete all user stats for 2025-2026 season
- Delete all users (except admin if specified)
- Keep fixtures and season data intact
"""

import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from database.base import settings
from models.models import User, Prediction, UserStats, Fixture, Season

def reset_season_data(keep_admin=True):
    """Reset all user data and predictions for 2025-2026 season"""
    
    engine = create_engine(settings.DATABASE_URL)
    
    with Session(engine) as db:
        try:
            # Get the 2025-2026 season
            season_2025 = db.query(Season).filter(Season.name == "2025-2026").first()
            
            if not season_2025:
                print("❌ 2025-2026 season not found!")
                return False
            
            print(f"Found 2025-2026 season with ID: {season_2025.id}")
            
            # Get fixtures for this season
            fixtures_2025 = db.query(Fixture).filter(Fixture.season_id == season_2025.id).all()
            fixture_ids = [f.id for f in fixtures_2025]
            
            print(f"Found {len(fixtures_2025)} fixtures for 2025-2026 season")
            
            # Delete all predictions for 2025-2026 season fixtures
            if fixture_ids:
                predictions_deleted = db.query(Prediction).filter(
                    Prediction.fixture_id.in_(fixture_ids)
                ).delete(synchronize_session=False)
                print(f"✅ Deleted {predictions_deleted} predictions for 2025-2026 season")
            else:
                print("⚠️  No fixtures found for 2025-2026 season")
            
            # Delete all user stats for 2025-2026 season
            stats_deleted = db.query(UserStats).filter(
                UserStats.season_id == season_2025.id
            ).delete(synchronize_session=False)
            print(f"✅ Deleted {stats_deleted} user stats entries for 2025-2026 season")
            
            # Handle users
            if keep_admin:
                # Find admin users to keep
                admin_users = db.query(User).filter(User.is_admin == True).all()
                admin_ids = [u.id for u in admin_users]
                admin_emails = [u.email for u in admin_users]
                
                if admin_ids:
                    print(f"Keeping {len(admin_ids)} admin user(s): {', '.join(admin_emails)}")
                    
                    # Delete non-admin users
                    users_deleted = db.query(User).filter(
                        User.id.notin_(admin_ids)
                    ).delete(synchronize_session=False)
                    print(f"✅ Deleted {users_deleted} non-admin users")
                    
                    # Delete any remaining predictions from admin users for this season
                    if admin_ids and fixture_ids:
                        admin_predictions_deleted = db.query(Prediction).filter(
                            Prediction.user_id.in_(admin_ids),
                            Prediction.fixture_id.in_(fixture_ids)
                        ).delete(synchronize_session=False)
                        print(f"✅ Deleted {admin_predictions_deleted} admin predictions for 2025-2026 season")
                else:
                    print("⚠️  No admin users found, deleting all users")
                    users_deleted = db.query(User).delete(synchronize_session=False)
                    print(f"✅ Deleted {users_deleted} users")
            else:
                # Delete all users
                users_deleted = db.query(User).delete(synchronize_session=False)
                print(f"✅ Deleted ALL {users_deleted} users")
            
            # Commit the changes
            db.commit()
            
            print("\n✅ Successfully reset 2025-2026 season data!")
            print("📝 Summary:")
            print(f"  - Season: {season_2025.name} (ID: {season_2025.id})")
            print(f"  - Fixtures preserved: {len(fixtures_2025)}")
            print(f"  - Predictions deleted: {predictions_deleted if fixture_ids else 0}")
            print(f"  - User stats deleted: {stats_deleted}")
            if keep_admin:
                print(f"  - Admin users kept: {len(admin_ids) if admin_ids else 0}")
                print(f"  - Non-admin users deleted: {users_deleted}")
            else:
                print(f"  - All users deleted: {users_deleted}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error resetting season data: {e}")
            db.rollback()
            return False

def main():
    print("=" * 60)
    print("RESET 2025-2026 SEASON DATA")
    print("=" * 60)
    print("\nThis will delete:")
    print("  - All predictions for 2025-2026 season")
    print("  - All user stats for 2025-2026 season")
    print("  - All non-admin users (or all users if specified)")
    print("\nThis will keep:")
    print("  - All fixtures for 2025-2026 season")
    print("  - The season itself")
    print("  - Admin users (unless specified otherwise)")
    print("=" * 60)
    
    # Ask for confirmation
    confirm = input("\n⚠️  Are you sure you want to proceed? Type 'YES' to confirm: ")
    
    if confirm != "YES":
        print("❌ Operation cancelled")
        return
    
    # Ask about keeping admin users
    keep_admin = input("\nKeep admin users? (y/n): ").lower() == 'y'
    
    # Run the reset
    success = reset_season_data(keep_admin=keep_admin)
    
    if success:
        print("\n✅ Operation completed successfully!")
    else:
        print("\n❌ Operation failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()