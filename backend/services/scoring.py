from sqlalchemy.orm import Session
from models.models import UserStats

def calculate_points(home_pred: int, away_pred: int, home_actual: int, away_actual: int) -> int:
    if home_pred == home_actual and away_pred == away_actual:
        return 3
    
    pred_result = get_result(home_pred, away_pred)
    actual_result = get_result(home_actual, away_actual)
    
    if pred_result == actual_result:
        return 1
    
    return 0

def get_result(home: int, away: int) -> str:
    if home > away:
        return "home"
    elif away > home:
        return "away"
    else:
        return "draw"

def update_user_stats(db: Session, user_id: int, points: int, is_correct_score: bool, is_correct_result: bool):
    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    
    if not stats:
        stats = UserStats(
            user_id=user_id,
            season="2024-2025"
        )
        db.add(stats)
    
    stats.total_points += points
    stats.predictions_made += 1
    
    if is_correct_score:
        stats.correct_scores += 1
    if is_correct_result:
        stats.correct_results += 1
    
    if points > 0:
        stats.current_streak += 1
        if stats.current_streak > stats.best_streak:
            stats.best_streak = stats.current_streak
    else:
        stats.current_streak = 0
    
    if stats.predictions_made > 0:
        stats.avg_points_per_game = stats.total_points / stats.predictions_made
    
    db.commit()