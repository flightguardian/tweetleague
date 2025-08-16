# Backend - Prediction League API

## Environment Setup
```bash
# Activate virtual environment (Windows)
./venv/Scripts/activate

# Install dependencies
./venv/Scripts/pip.exe install -r requirements.txt

# Run development server
./venv/Scripts/python.exe main.py
```

## Database Connection
```python
# Set in environment variable
DATABASE_URL = os.getenv("DATABASE_URL")
```

## Key Models
- `User` - Users with twitter_handle for matching imports, email verification status
- `Prediction` - User predictions with points_earned (NULL until scored)
- `Fixture` - Matches with home_score/away_score (NULL until finished)
- `UserStats` - Statistics including predictions_made (only counts scored fixtures) and position
- `MiniLeague` - User-created mini leagues with invite codes
- `Season` - Season management with is_current flag

## Important Business Logic

### Points System
- Exact score: 3 points
- Correct result: 1 point
- Wrong result: 0 points

### Prediction Rules
- Can only predict next upcoming fixture
- Deadline: 5 minutes before kickoff
- `points_earned` is NULL until fixture is scored (not 0!)
- `predictions_made` only increments when fixture is scored
- Email verification required to submit predictions

### Position Calculation
- Positions are pre-calculated and stored in UserStats.position
- Ties are handled (same position for same points)
- Ordering: predictions_made > 0, total_points DESC, correct_scores DESC, correct_results DESC, username ASC
- Mini league positions calculated separately on demand

### Critical Data Rules
- `points_earned` must be NULL for unscored fixtures (not 0)
- `predictions_made` only counts fixtures that have been scored
- When recalculating, `predictions_made` should NOT be incremented
- Only `update_fixture_score` should increment `predictions_made`

## Admin Functions (`api/admin.py`)
- `update_fixture_score` - Submit match score and calculate points (increments predictions_made, updates positions)
- `recalculate_all_points` - Recalculate all points (does NOT increment predictions_made)
- `simulate_fixture_score` - Test scoring with undo capability

## Position Calculator (`utils/position_calculator.py`)
- `update_all_positions()` - Recalculates and stores all user positions
- `update_mini_league_positions()` - Calculates positions for a specific mini league
- Called automatically after scoring fixtures

## Email Service (`utils/email.py`)
- `send_verification_email()` - Send email verification link
- `send_password_reset_email()` - Send password reset link
- `send_fixture_reminder_email()` - Send reminder about upcoming fixture
- Supports both Brevo and generic SMTP

## API Endpoints

### Leaderboard (`api/leaderboard.py`)
- `GET /leaderboard` - Main leaderboard with stored positions
- `GET /leaderboard/count` - Total user count
- `GET /leaderboard/user-position` - Current user's position
- `GET /leaderboard/top` - Top 5 players (uses position <= 5)
- Supports mini_league_id parameter for filtered views

### Predictions (`api/predictions.py`)
- `/predictions/fixture/{id}/detailed` - Orders by most recent activity
- Creates a "stream" effect with newest predictions first

## Common Issues & Fixes

### Problem: predictions_made incorrect
```bash
./venv/Scripts/python.exe scripts/reset_predictions_made.py
```

### Problem: points_earned is 0 instead of NULL
```bash
./venv/Scripts/python.exe scripts/fix_predictions_and_stats.py
```

### Find non-predictors and send reminders
```bash
./venv/Scripts/python.exe scripts/find_non_predictors.py
# Interactive script with email integration
```

## Testing with psql
```bash
psql $DATABASE_URL
```