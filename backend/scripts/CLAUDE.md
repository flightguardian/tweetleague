# Backend Scripts

## Purpose
Utility scripts for data management, imports, fixes, and notifications.

## Environment Setup
All scripts require DATABASE_URL environment variable or .env file in scripts directory.

## Key Scripts

### `import_hull_predictions.py`
- Imports predictions from CSV for Hull City match (fixture_id=1 ONLY)
- Matches users by Twitter handle
- Creates predictions with points_earned=NULL (not 0!)
- Skips identical predictions to avoid unnecessary updates
- Does NOT update predictions if they already match CSV values
- Safe to run multiple times

### `reset_predictions_made.py`
- Sets predictions_made=1 for users who predicted fixture 1
- Sets predictions_made=0 for everyone else
- Run this after imports or if counts get messed up

### `fix_predictions_and_stats.py`
- Fixes predictions with incorrect points_earned values
- Currently configured to fix fixture_id=2 only
- Sets points_earned to NULL for unscored fixtures

### `fix_fixture1_predictions_made.py`
- Specifically fixes predictions_made for fixture 1 users
- Sets to 1 for all users who predicted on fixture 1

### `find_non_predictors.py` (NEW)
- Interactive script to find users who haven't predicted for a fixture
- Features:
  - Lists all available fixtures
  - Separates users by contact method (Twitter vs Email)
  - Provides quick-copy lists for mass contacting
  - Optional email reminder sending
  - Always notifies admin emails:
    - gavmcbride@hotmail.co.uk
    - martin.w9@icloud.com
    - mattywrightwright@hotmail.com
  - Twitter users with emails are included in email list
  - Formats competition types properly (e.g., LEAGUE_CUP → League Cup)

## Common Workflows

### After importing new predictions:
```bash
# 1. Import predictions from CSV
./venv/Scripts/python.exe scripts/import_hull_predictions.py

# 2. Reset predictions_made counts (IMPORTANT: Do this after import!)
./venv/Scripts/python.exe scripts/reset_predictions_made.py

# 3. Run recalculate from admin panel to calculate points (safe - won't mess up predictions_made)
```

### Find non-predictors and send reminders:
```bash
# Run interactive script
./venv/Scripts/python.exe scripts/find_non_predictors.py

# On Render:
cd scripts
python find_non_predictors.py
```

### If predictions_made counts are wrong:
```bash
./venv/Scripts/python.exe scripts/reset_predictions_made.py
```

### If seeing points_earned=0 on unscored fixtures:
```bash
./venv/Scripts/python.exe scripts/fix_predictions_and_stats.py
```

## Important Notes
- ALL scripts connect to production database - be careful!
- Always check fixture IDs before running
- Scripts are idempotent (safe to run multiple times)
- Check output carefully for any errors
- Email service requires SMTP credentials in environment variables