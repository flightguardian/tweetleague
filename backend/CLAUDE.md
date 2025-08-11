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
DATABASE_URL = "postgresql://tweetleague_db_user:76LozrILJDapCyrJChETfltLIUhvF0KG@dpg-d2acp7p5pdvs73al0a90-a.frankfurt-postgres.render.com/tweetleague_db"
```

## Key Models
- `User` - Users with twitter_handle for matching imports
- `Prediction` - User predictions with points_earned (NULL until scored)
- `Fixture` - Matches with home_score/away_score (NULL until finished)
- `UserStats` - Statistics including predictions_made (only counts scored fixtures)

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

### Critical Data Rules
- `points_earned` must be NULL for unscored fixtures (not 0)
- `predictions_made` only counts fixtures that have been scored
- When recalculating, `predictions_made` should NOT be incremented
- Only `update_fixture_score` should increment `predictions_made`

## Admin Functions (`api/admin.py`)
- `update_fixture_score` - Submit match score and calculate points (increments predictions_made)
- `recalculate_all_points` - Recalculate all points (does NOT increment predictions_made - fixed!)
- `simulate_fixture_score` - Test scoring with undo capability

## API Ordering for Stable Pagination
### Leaderboard (`api/leaderboard.py`)
1. Users with predictions_made > 0 always rank above those with 0
2. Then by total_points (descending)
3. Then by correct_scores (descending)  
4. Then by correct_results (descending)
5. Finally by username (alphabetical) for stable pagination

### Predictions (`api/predictions.py`)
- `/predictions/fixture/{id}/detailed` - Orders by most recent activity (updated_at or created_at)
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

### Import Hull Predictions
```bash
./venv/Scripts/python.exe scripts/import_hull_predictions.py
# Only affects fixture_id=1, won't touch other fixtures
```

## Testing with psql
```bash
psql postgresql://tweetleague_db_user:76LozrILJDapCyrJChETfltLIUhvF0KG@dpg-d2acp7p5pdvs73al0a90-a.frankfurt-postgres.render.com/tweetleague_db
```