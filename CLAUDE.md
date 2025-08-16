# Prediction League Project

## Overview
This is a football prediction league application with a FastAPI backend and Next.js frontend for Coventry City fans.

## Database
- Production: PostgreSQL on Render
- Connection: Set via DATABASE_URL environment variable

## Key Commands
- Backend virtual environment: `cd backend && ./venv/Scripts/activate` (Windows)
- Run backend: `cd backend && ./venv/Scripts/python.exe main.py`
- Run frontend: `cd frontend && npm run dev`
- Lint & typecheck: `npm run lint`, `npm run typecheck` (frontend)

## Recent Updates
- **Leaderboard Performance**: Positions are now pre-calculated and stored in the database
- **Mini Leagues**: Full support for creating and joining mini leagues with invite codes
- **Email Reminders**: Script to find non-predictors and send reminder emails
- **Security**: Database credentials moved to environment variables
- **UI Improvements**: Mini league modal now available on homepage

## Important Business Rules
- `points_earned` should be NULL for unscored fixtures, not 0
- `predictions_made` only counts fixtures that have been scored
- Leaderboard positions are calculated with tie handling (same position for same points)
- Users with predictions_made > 0 always rank above those with 0
- Deadline for predictions: 5 minutes before kickoff
- Points: 3 for perfect score, 1 for correct result, 0 for wrong result

## Deployment
- Backend auto-deploys to Render on push to main
- Frontend needs manual deployment
- Run scripts on Render: `cd scripts && python script_name.py`

## Admin Scripts
All scripts are in `backend/scripts/`:
- `import_hull_predictions.py` - Import predictions from CSV
- `reset_predictions_made.py` - Reset predictions_made count correctly
- `fix_predictions_and_stats.py` - Fix points_earned NULL issues
- `find_non_predictors.py` - Interactive script to find users who haven't predicted and send email reminders
  - Always notifies admin emails: gavmcbride@hotmail.co.uk, martin.w9@icloud.com, mattywrightwright@hotmail.com
  - Separates users by contact method (Twitter vs Email)
  - Provides quick-copy lists for mass contacting