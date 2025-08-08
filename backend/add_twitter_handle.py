#!/usr/bin/env python3
"""
Add twitter_handle column to users table
"""

from sqlalchemy import create_engine, text

# Using External Database URL from Render
DATABASE_URL = "postgresql://tweetleague_db_user:76LozrILJDapCyrJChETfltLIUhvF0KG@dpg-d2acp7p5pdvs73al0a90-a.frankfurt-postgres.render.com/tweetleague_db"

# Create engine
engine = create_engine(DATABASE_URL)

def add_twitter_handle_column():
    try:
        with engine.connect() as conn:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='twitter_handle'
            """))
            
            if result.fetchone():
                print("✅ twitter_handle column already exists")
            else:
                # Add the column
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN twitter_handle VARCHAR UNIQUE
                """))
                conn.commit()
                print("✅ Added twitter_handle column to users table")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    add_twitter_handle_column()