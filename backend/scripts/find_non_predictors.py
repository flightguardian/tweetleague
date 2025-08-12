#!/usr/bin/env python3
"""
Find users who have not made predictions for a specific fixture
Shows their email or Twitter handle for contacting them
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Get database URL from environment variable
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    # Try to load from .env file if it exists
    env_file = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                if line.startswith('DATABASE_URL='):
                    DATABASE_URL = line.split('=', 1)[1].strip()
                    break
    
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not found")
        print("Please set DATABASE_URL environment variable or create scripts/.env file")
        sys.exit(1)

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models.models import User, Prediction, Fixture
from datetime import datetime
from utils.email import email_service

# Always send reminders to these emails (admin/test accounts)
ALWAYS_NOTIFY_EMAILS = [
    'gavmcbride@hotmail.co.uk',
    'martin.w9@icloud.com', 
    'mattywrightwright@hotmail.com'
]

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_fixture_details(db, fixture_id):
    """Get details about a fixture"""
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if not fixture:
        return None
    return fixture

def find_non_predictors(fixture_id, send_reminders=False):
    """Find all users who haven't predicted for this fixture"""
    db = SessionLocal()
    
    try:
        # First check if fixture exists
        fixture = get_fixture_details(db, fixture_id)
        if not fixture:
            print(f"\n❌ Fixture ID {fixture_id} not found!")
            return
        
        # Display fixture details
        print(f"\n📅 Fixture Details:")
        print(f"   {fixture.home_team} vs {fixture.away_team}")
        print(f"   Competition: {fixture.competition}")
        print(f"   Kickoff: {fixture.kickoff_time.strftime('%B %d, %Y at %H:%M')}")
        print(f"   Status: {fixture.status}")
        
        # Get all users
        all_users = db.query(User).all()
        
        # Get users who HAVE made predictions for this fixture
        users_with_predictions = db.query(Prediction.user_id).filter(
            Prediction.fixture_id == fixture_id
        ).distinct().all()
        users_with_predictions_ids = [u[0] for u in users_with_predictions]
        
        # Find users who haven't predicted
        non_predictors = []
        for user in all_users:
            if user.id not in users_with_predictions_ids:
                non_predictors.append(user)
        
        # Display results
        print(f"\n📊 Statistics:")
        print(f"   Total users: {len(all_users)}")
        print(f"   Users who predicted: {len(users_with_predictions_ids)}")
        print(f"   Users who haven't predicted: {len(non_predictors)}")
        
        if non_predictors:
            print(f"\n👥 Users who haven't predicted for this fixture:\n")
            print("-" * 80)
            
            # Separate by contact method
            email_users = []
            twitter_only_users = []  # Users who can ONLY be contacted via Twitter
            
            for user in non_predictors:
                # Check if user has a valid email
                has_valid_email = user.email and not user.email.endswith('@twitter.local')
                
                if has_valid_email:
                    # User has email - add to email list regardless of Twitter status
                    email_users.append(user)
                elif user.provider == 'twitter' or user.twitter_handle:
                    # User has no valid email but has Twitter - add to Twitter-only list
                    twitter_only_users.append(user)
            
            # Display Twitter-only users (no email available)
            if twitter_only_users:
                print("\n🐦 TWITTER-ONLY USERS (no email available):")
                print("-" * 40)
                for user in twitter_only_users:
                    handle = user.twitter_handle or user.username
                    print(f"   @{handle} - {user.username}")
            
            # Display email users
            if email_users:
                print("\n📧 EMAIL USERS (contact via email):")
                print("-" * 40)
                for user in email_users:
                    print(f"   {user.email} - {user.username}")
                    if user.twitter_handle:
                        print(f"      (also on Twitter: @{user.twitter_handle})")
            
            # Generate contact lists
            print("\n📋 QUICK COPY LISTS:")
            print("-" * 40)
            
            # Twitter handles list (only for users without email)
            if twitter_only_users:
                print("\nTwitter-only handles (for mass mention):")
                handles = []
                for user in twitter_only_users:
                    handle = user.twitter_handle or user.username
                    handles.append(f"@{handle}")
                # Print in batches of 10 for Twitter mention limits
                for i in range(0, len(handles), 10):
                    batch = handles[i:i+10]
                    print(" ".join(batch))
            
            # Email list
            if email_users:
                print("\nEmail addresses (CSV format):")
                emails = []
                for user in email_users:
                    if user.email and not user.email.endswith('@twitter.local'):
                        emails.append(user.email)
                # Remove duplicates while preserving order
                emails = list(dict.fromkeys(emails))
                print(", ".join(emails))
            
            # Ask if user wants to send reminder emails
            if send_reminders:
                if email_users or ALWAYS_NOTIFY_EMAILS:
                    send_choice = input("\n📧 Send reminder emails to non-predictors? (y/n): ").strip().lower()
                    if send_choice == 'y':
                        send_email_reminders(email_users, fixture, db)
        else:
            print("\n✅ Great! All users have made predictions for this fixture!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        db.close()

def send_email_reminders(email_users, fixture, db):
    """Send reminder emails to users who haven't predicted"""
    print("\n📤 Sending reminder emails...")
    print("-" * 40)
    
    fixture_details = {
        'home_team': fixture.home_team,
        'away_team': fixture.away_team,
        'competition': fixture.competition,
        'kickoff_time': fixture.kickoff_time.strftime('%B %d, %Y at %H:%M')
    }
    
    sent_count = 0
    failed_count = 0
    
    # First, add the hardcoded admin emails
    all_email_users = list(email_users)
    existing_emails = [u.email.lower() for u in email_users if u.email]
    
    for admin_email in ALWAYS_NOTIFY_EMAILS:
        if admin_email.lower() not in existing_emails:
            # Find user with this email to get their username
            admin_user = db.query(User).filter(
                User.email.ilike(admin_email)
            ).first()
            if admin_user:
                all_email_users.append(admin_user)
                print(f"   📌 Adding admin account: {admin_user.username} ({admin_email})")
            else:
                # Create a temporary user object for sending email
                class TempUser:
                    def __init__(self, email):
                        self.email = email
                        self.username = email.split('@')[0]
                temp_user = TempUser(admin_email)
                all_email_users.append(temp_user)
                print(f"   📌 Adding admin email: {admin_email}")
    
    for user in all_email_users:
        # Skip Twitter-only users
        if user.email.endswith('@twitter.local'):
            continue
        
        try:
            success = email_service.send_fixture_reminder_email(
                to_email=user.email,
                username=user.username,
                fixture_details=fixture_details
            )
            
            if success:
                print(f"   ✅ Sent to {user.email} ({user.username})")
                sent_count += 1
            else:
                print(f"   ❌ Failed to send to {user.email} ({user.username})")
                failed_count += 1
                
        except Exception as e:
            print(f"   ❌ Error sending to {user.email}: {str(e)}")
            failed_count += 1
    
    print("\n📊 Email Summary:")
    print(f"   Sent successfully: {sent_count}")
    print(f"   Failed: {failed_count}")
    print(f"   Total: {sent_count + failed_count}")

def list_fixtures():
    """List all available fixtures"""
    db = SessionLocal()
    
    try:
        fixtures = db.query(Fixture).order_by(Fixture.kickoff_time.desc()).all()
        
        print("\n📅 Available Fixtures:")
        print("-" * 80)
        print(f"{'ID':<5} {'Home Team':<20} {'Away Team':<20} {'Date':<20} {'Status':<15}")
        print("-" * 80)
        
        for fixture in fixtures:
            date_str = fixture.kickoff_time.strftime('%b %d, %Y %H:%M')
            status = fixture.status.value if hasattr(fixture.status, 'value') else str(fixture.status)
            print(f"{fixture.id:<5} {fixture.home_team:<20} {fixture.away_team:<20} {date_str:<20} {status:<15}")
        
        print("-" * 80)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        db.close()

def main():
    print("\n🏆 PREDICTION LEAGUE - Find Non-Predictors")
    print("=" * 50)
    
    while True:
        print("\nOptions:")
        print("1. List all fixtures")
        print("2. Check specific fixture")
        print("3. Exit")
        
        choice = input("\nEnter your choice (1-3): ").strip()
        
        if choice == '1':
            list_fixtures()
        elif choice == '2':
            fixture_id = input("\nEnter fixture ID to check: ").strip()
            try:
                fixture_id = int(fixture_id)
                # Ask if they want to send reminders
                send_reminder_choice = input("Enable email reminder sending? (y/n): ").strip().lower()
                send_reminders = (send_reminder_choice == 'y')
                find_non_predictors(fixture_id, send_reminders)
            except ValueError:
                print("❌ Invalid fixture ID! Please enter a number.")
        elif choice == '3':
            print("\n👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice! Please enter 1, 2, or 3.")

if __name__ == "__main__":
    main()