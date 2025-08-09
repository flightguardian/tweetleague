from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class MiniLeague(Base):
    __tablename__ = "mini_leagues"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    invite_code = Column(String(20), unique=True, nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    season_id = Column(Integer, ForeignKey("seasons.id"))
    max_members = Column(Integer, default=50)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    season = relationship("Season")
    members = relationship("MiniLeagueMember", back_populates="league", cascade="all, delete-orphan")

class MiniLeagueMember(Base):
    __tablename__ = "mini_league_members"
    __table_args__ = (UniqueConstraint('mini_league_id', 'user_id', name='_league_user_uc'),)
    
    id = Column(Integer, primary_key=True, index=True)
    mini_league_id = Column(Integer, ForeignKey("mini_leagues.id", ondelete="CASCADE"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    is_admin = Column(Boolean, default=False)
    
    # Relationships
    league = relationship("MiniLeague", back_populates="members")
    user = relationship("User")