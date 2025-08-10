from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Float, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base
import enum

class FixtureStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    LIVE = "live"
    FINISHED = "finished"
    POSTPONED = "postponed"

class CompetitionType(str, enum.Enum):
    CHAMPIONSHIP = "CHAMPIONSHIP"
    FA_CUP = "FA_CUP"
    LEAGUE_CUP = "LEAGUE_CUP"
    PLAYOFF = "PLAYOFF"

class SeasonStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    twitter_handle = Column(String, unique=True, nullable=True)  # Twitter username without @
    twitter_id = Column(String, unique=True, nullable=True)
    google_id = Column(String, unique=True, nullable=True)
    provider = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    email_notifications = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    predictions = relationship("Prediction", back_populates="user")
    stats = relationship("UserStats", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")

class Season(Base):
    __tablename__ = "seasons"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # e.g., "2025-2026"
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(SQLEnum(SeasonStatus), default=SeasonStatus.DRAFT)
    is_current = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    fixtures = relationship("Fixture", back_populates="season")
    user_stats = relationship("UserStats", back_populates="season")

class Fixture(Base):
    __tablename__ = "fixtures"
    
    id = Column(Integer, primary_key=True, index=True)
    season_id = Column(Integer, ForeignKey("seasons.id"), nullable=False)
    home_team = Column(String, nullable=False)
    away_team = Column(String, nullable=False)
    competition = Column(SQLEnum(CompetitionType), nullable=False)
    kickoff_time = Column(DateTime(timezone=True), nullable=False)
    original_kickoff_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(SQLEnum(FixtureStatus), default=FixtureStatus.SCHEDULED)
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)
    round = Column(String, nullable=True)
    api_fixture_id = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    season = relationship("Season", back_populates="fixtures")
    predictions = relationship("Prediction", back_populates="fixture")

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    fixture_id = Column(Integer, ForeignKey("fixtures.id"), nullable=False)
    home_prediction = Column(Integer, nullable=False)
    away_prediction = Column(Integer, nullable=False)
    points_earned = Column(Integer, default=None)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="predictions")
    fixture = relationship("Fixture", back_populates="predictions")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'fixture_id', name='unique_user_fixture_prediction'),
    )

class UserStats(Base):
    __tablename__ = "user_stats"
    __table_args__ = (UniqueConstraint('user_id', 'season_id', name='_user_season_uc'),)
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    season_id = Column(Integer, ForeignKey("seasons.id"), nullable=False)
    total_points = Column(Integer, default=0)
    correct_scores = Column(Integer, default=0)
    correct_results = Column(Integer, default=0)
    predictions_made = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    best_streak = Column(Integer, default=0)
    avg_points_per_game = Column(Float, default=0.0)
    position = Column(Integer, nullable=True)
    
    user = relationship("User", back_populates="stats")
    season = relationship("Season", back_populates="user_stats")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    fixture_id = Column(Integer, ForeignKey("fixtures.id"), nullable=True)
    type = Column(String, nullable=False)
    message = Column(String, nullable=False)
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="notifications")
    fixture = relationship("Fixture")