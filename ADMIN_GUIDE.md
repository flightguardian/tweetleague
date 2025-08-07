# Tweet League Admin Panel Guide

## Granting Admin Access

To make a user an admin, run the following command from the backend directory:

```bash
cd backend
python scripts/make_admin.py <username_or_email>
```

To list all users and see who has admin privileges:
```bash
python scripts/make_admin.py --list
```

## Admin Features

Once you have admin access, you'll see an "Admin" link in the navigation bar. The admin panel includes:

### 1. Dashboard Statistics
- Total users
- Total fixtures  
- Total predictions
- Upcoming fixtures
- Completed fixtures
- Active users in the last week

### 2. Fixture Management
- **Add new fixtures**: Create matches with team names, competition type, and kickoff time
- **Edit fixtures**: Modify fixture details (only if no predictions have been made)
- **Delete fixtures**: Remove fixtures (only if no predictions have been made)
- **Postpone fixtures**: Mark fixtures as postponed

### 3. Score Updates
- **Update match scores**: Enter final scores for completed matches
- **Automatic point calculation**: Points are automatically calculated and assigned when scores are updated
  - 3 points for exact score prediction
  - 1 point for correct result (win/draw/loss)
- **View predictions**: See all user predictions for a specific fixture
- **Recalculate all points**: Recalculate all points across all fixtures (use with caution)

## Admin API Endpoints

All admin endpoints require authentication with an admin account:

- `GET /api/admin/stats` - Get system statistics
- `POST /api/admin/fixtures` - Create new fixture
- `PUT /api/admin/fixtures/{id}` - Update fixture details
- `DELETE /api/admin/fixtures/{id}` - Delete fixture
- `PUT /api/admin/fixtures/{id}/score` - Update match score and calculate points
- `GET /api/admin/fixtures/{id}/predictions` - View all predictions for a fixture
- `POST /api/admin/recalculate-all-points` - Recalculate all user points
- `POST /api/admin/make-admin/{user_id}` - Grant admin privileges to a user
- `POST /api/admin/remove-admin/{user_id}` - Remove admin privileges from a user

## Best Practices

1. **Regular Score Updates**: Update match scores promptly after matches end to keep the leaderboard current
2. **Fixture Management**: Add fixtures well in advance to give users time to make predictions
3. **Validation**: The system validates scores (0-20 range) to prevent unrealistic entries
4. **Backup**: Consider backing up the database before using the "Recalculate All Points" feature

## Security

- Admin endpoints are protected by authentication middleware
- Only users with `is_admin=true` in the database can access admin features
- Admin status is checked on every admin API request
- You cannot remove your own admin privileges through the UI