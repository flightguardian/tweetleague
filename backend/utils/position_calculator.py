"""
Utility functions for calculating and updating leaderboard positions
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from models.models import UserStats, Season, User
from models.mini_leagues import MiniLeague, MiniLeagueMember
import logging

logger = logging.getLogger(__name__)

def update_all_positions(db: Session, season_id: int = None):
    """
    Calculate and update positions for all users in a season.
    This should be called after any score updates.
    """
    # Get current season if not specified
    if not season_id:
        current_season = db.query(Season).filter(Season.is_current == True).first()
        if not current_season:
            logger.warning("No current season found")
            return
        season_id = current_season.id
    
    # Get all user stats for the season, ordered by ranking criteria
    all_stats = db.query(UserStats).filter(
        UserStats.season_id == season_id
    ).join(User).order_by(
        desc(UserStats.predictions_made > 0),  # Users with predictions first
        desc(UserStats.total_points),
        desc(UserStats.correct_scores),
        desc(UserStats.correct_results),
        User.username  # Alphabetical for stable ordering
    ).all()
    
    # Calculate positions with proper tie handling
    current_position = 1
    last_stats = None
    users_at_position = 0
    
    for i, stat in enumerate(all_stats):
        # Check if this user has the same stats as the previous user (tie)
        if last_stats and stat.predictions_made > 0 and last_stats.predictions_made > 0:
            if (stat.total_points == last_stats.total_points and
                stat.correct_scores == last_stats.correct_scores and
                stat.correct_results == last_stats.correct_results):
                # Same position as previous user (tie)
                stat.position = current_position
                users_at_position += 1
            else:
                # Different stats, update position
                current_position = current_position + users_at_position
                stat.position = current_position
                users_at_position = 1
        elif stat.predictions_made == 0:
            # Users with no predictions go to the bottom
            # Count all users with predictions > 0
            users_with_predictions = sum(1 for s in all_stats if s.predictions_made > 0)
            stat.position = users_with_predictions + 1
        else:
            # First user or first user with predictions
            stat.position = current_position
            users_at_position = 1
        
        last_stats = stat
    
    # Commit all position updates
    db.commit()
    
    logger.info(f"Updated positions for {len(all_stats)} users in season {season_id}")
    return len(all_stats)

def update_mini_league_positions(db: Session, mini_league_id: int):
    """
    Calculate positions for users within a specific mini league.
    Returns a dictionary of user_id -> position within that league.
    """
    # Get mini league
    mini_league = db.query(MiniLeague).filter(MiniLeague.id == mini_league_id).first()
    if not mini_league:
        logger.warning(f"Mini league {mini_league_id} not found")
        return {}
    
    # Get member IDs
    member_ids = db.query(MiniLeagueMember.user_id).filter(
        MiniLeagueMember.mini_league_id == mini_league_id
    ).all()
    member_ids = [m[0] for m in member_ids]
    
    if not member_ids:
        return {}
    
    # Get stats for league members only
    league_stats = db.query(UserStats).filter(
        UserStats.season_id == mini_league.season_id,
        UserStats.user_id.in_(member_ids)
    ).join(User).order_by(
        desc(UserStats.predictions_made > 0),
        desc(UserStats.total_points),
        desc(UserStats.correct_scores),
        desc(UserStats.correct_results),
        User.username
    ).all()
    
    # Calculate positions within the league
    positions = {}
    current_position = 1
    last_stats = None
    users_at_position = 0
    
    for stat in league_stats:
        if last_stats and stat.predictions_made > 0 and last_stats.predictions_made > 0:
            if (stat.total_points == last_stats.total_points and
                stat.correct_scores == last_stats.correct_scores and
                stat.correct_results == last_stats.correct_results):
                # Tie - same position
                positions[stat.user_id] = current_position
                users_at_position += 1
            else:
                # Different stats
                current_position = current_position + users_at_position
                positions[stat.user_id] = current_position
                users_at_position = 1
        elif stat.predictions_made == 0:
            # No predictions - last position
            users_with_predictions = sum(1 for s in league_stats if s.predictions_made > 0)
            positions[stat.user_id] = users_with_predictions + 1
        else:
            positions[stat.user_id] = current_position
            users_at_position = 1
        
        last_stats = stat
    
    return positions

def update_all_mini_league_positions(db: Session, season_id: int = None):
    """
    Update positions for all mini leagues in a season.
    This is more complex as we need to store positions per league.
    For now, this returns calculated positions that can be cached.
    """
    if not season_id:
        current_season = db.query(Season).filter(Season.is_current == True).first()
        if not current_season:
            return {}
        season_id = current_season.id
    
    # Get all mini leagues for the season
    mini_leagues = db.query(MiniLeague).filter(
        MiniLeague.season_id == season_id
    ).all()
    
    all_positions = {}
    for league in mini_leagues:
        positions = update_mini_league_positions(db, league.id)
        all_positions[league.id] = positions
        logger.info(f"Calculated positions for {len(positions)} users in mini league {league.name}")
    
    return all_positions