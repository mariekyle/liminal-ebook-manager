"""
User Session Model for Session Management
"""

from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class UserSession(Base):
    """User session model for managing active sessions"""
    
    __tablename__ = "user_sessions"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key to user
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Session data
    session_token = Column(String(255), unique=True, index=True, nullable=False)
    refresh_token = Column(String(255), unique=True, index=True, nullable=False)
    access_token = Column(Text, nullable=True)  # JWT access token
    
    # Session metadata
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    device_info = Column(String(255), nullable=True)
    
    # Session status
    is_active = Column(Boolean, default=True, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    last_used_at = Column(DateTime, default=func.now(), nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    
    def __repr__(self):
        return f"<UserSession(id={self.id}, user_id={self.user_id}, is_active={self.is_active})>"
    
    def is_expired(self) -> bool:
        """Check if session is expired"""
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self) -> bool:
        """Check if session is valid (active, not revoked, not expired)"""
        return (
            self.is_active and 
            not self.is_revoked and 
            not self.is_expired()
        )
    
    def update_last_used(self):
        """Update last used timestamp"""
        self.last_used_at = datetime.utcnow()
    
    def revoke(self):
        """Revoke the session"""
        self.is_active = False
        self.is_revoked = True
        self.revoked_at = datetime.utcnow()
    
    @classmethod
    def create_session(cls, user_id: int, session_token: str, refresh_token: str, 
                      expires_in_days: int = 7, user_agent: str = None, 
                      ip_address: str = None, device_info: str = None) -> "UserSession":
        """Create a new user session"""
        return cls(
            user_id=user_id,
            session_token=session_token,
            refresh_token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=expires_in_days),
            user_agent=user_agent,
            ip_address=ip_address,
            device_info=device_info
        ) 