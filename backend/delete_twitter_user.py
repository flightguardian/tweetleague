#!/usr/bin/env python3

from database.base import get_db
from models.models import User, UserStats, Prediction
from sqlalchemy import or_

def delete_twitter_users():
    db = next(get_db())
    
    # Find and delete user by Twitter ID or email
    users = db.query(User).filter(
        or_(
            User.twitter_id == '1409093804536311816',
            User.email.like('%@twitter.local'),
            User.email.like('%twitter%')
        )
    ).all()
    
    if users:
        for user in users:
            print(f'Found user: {user.username} (ID: {user.id}, Email: {user.email})')
            
            # Delete related data
            db.query(UserStats).filter(UserStats.user_id == user.id).delete()
            db.query(Prediction).filter(Prediction.user_id == user.id).delete()
            
            # Delete user
            db.delete(user)
        
        db.commit()
        print(f'{len(users)} user(s) deleted successfully')
    else:
        print('No Twitter user found to delete')
    
    # Also check for any user with 'gav' username that's not the main account
    gav_users = db.query(User).filter(
        User.username.like('gav%'),
        User.email != 'gavmcbride90@gmail.com'
    ).all()
    
    if gav_users:
        for user in gav_users:
            print(f'Found additional user: {user.username} (Email: {user.email})')
            db.query(UserStats).filter(UserStats.user_id == user.id).delete()
            db.query(Prediction).filter(Prediction.user_id == user.id).delete()
            db.delete(user)
        db.commit()
        print(f'{len(gav_users)} additional user(s) deleted')
    
    db.close()

if __name__ == "__main__":
    delete_twitter_users()