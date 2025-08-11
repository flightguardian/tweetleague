# Prediction League Project

## Overview
This is a football prediction league application with a FastAPI backend and Next.js frontend.

## Database
- Production: PostgreSQL on Render
- Connection: `postgresql://tweetleague_db_user:76LozrILJDapCyrJChETfltLIUhvF0KG@dpg-d2acp7p5pdvs73al0a90-a.frankfurt-postgres.render.com/tweetleague_db`

## Key Commands
- Backend virtual environment: `cd backend && ./venv/Scripts/activate` (Windows)
- Run backend: `cd backend && ./venv/Scripts/python.exe main.py`
- Run frontend: `cd frontend && npm run dev`

## Important Notes
- Only fixture_id 1 (Coventry vs Hull) has been scored so far
- `points_earned` should be NULL for unscored fixtures, not 0
- `predictions_made` only counts fixtures that have been scored
- When recalculating, `predictions_made` is properly counted from scored predictions only
- Leaderboard has stable pagination (ordered by points, then username)
- Predictions page shows newest activity first (like a stream)

## Deployment
- Backend auto-deploys to Render on push to main
- Frontend needs manual deployment

## Testing Scripts
All scripts are in `backend/scripts/`:
- `import_hull_predictions.py` - Import predictions from CSV for fixture 1 only
- `reset_predictions_made.py` - Reset predictions_made count correctly
- `fix_predictions_and_stats.py` - Fix points_earned NULL issues