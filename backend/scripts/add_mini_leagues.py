"""
Script to add mini leagues tables to the database
Run with: python backend/scripts/add_mini_leagues.py
"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found in environment variables")
    exit(1)

engine = create_engine(DATABASE_URL)

# SQL to create mini leagues tables
create_tables_sql = """
-- Create mini_leagues table
CREATE TABLE IF NOT EXISTS mini_leagues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    created_by INTEGER REFERENCES users(id),
    season_id INTEGER REFERENCES seasons(id),
    max_members INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mini_league_members table
CREATE TABLE IF NOT EXISTS mini_league_members (
    id SERIAL PRIMARY KEY,
    mini_league_id INTEGER REFERENCES mini_leagues(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT false,
    UNIQUE(mini_league_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mini_league_members_league ON mini_league_members(mini_league_id);
CREATE INDEX IF NOT EXISTS idx_mini_league_members_user ON mini_league_members(user_id);
CREATE INDEX IF NOT EXISTS idx_mini_leagues_invite_code ON mini_leagues(invite_code);
CREATE INDEX IF NOT EXISTS idx_mini_leagues_season ON mini_leagues(season_id);
CREATE INDEX IF NOT EXISTS idx_mini_leagues_created_by ON mini_leagues(created_by);

-- Grant permissions
GRANT ALL ON mini_leagues TO tweetleague_db_user;
GRANT ALL ON mini_league_members TO tweetleague_db_user;
GRANT ALL ON mini_leagues_id_seq TO tweetleague_db_user;
GRANT ALL ON mini_league_members_id_seq TO tweetleague_db_user;
"""

def main():
    try:
        with engine.connect() as conn:
            # Execute the SQL
            conn.execute(text(create_tables_sql))
            conn.commit()
            
            # Verify tables were created
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('mini_leagues', 'mini_league_members')
                ORDER BY table_name;
            """))
            
            tables = result.fetchall()
            
            print("✅ Mini leagues tables created successfully!")
            print("\nCreated tables:")
            for table in tables:
                print(f"  - {table[0]}")
            
            # Check if tables have any data
            ml_count = conn.execute(text("SELECT COUNT(*) FROM mini_leagues")).scalar()
            mlm_count = conn.execute(text("SELECT COUNT(*) FROM mini_league_members")).scalar()
            
            print(f"\nCurrent data:")
            print(f"  - Mini leagues: {ml_count}")
            print(f"  - Mini league members: {mlm_count}")
            
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise

if __name__ == "__main__":
    main()