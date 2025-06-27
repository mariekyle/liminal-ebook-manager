"""
User Model for Authentication and Authorization
"""

from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    """User roles for role-based access control"""
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"
    GUEST = "guest"

class UserStatus(str, enum.Enum):
    """User account status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"

class User(Base):
    """User model for authentication and authorization"""
    
    __tablename__ = "users"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Authentication fields
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile fields
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    display_name = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    # Account status and roles
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.PENDING_VERIFICATION, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Security fields
    email_verification_token = Column(String(255), nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    last_login = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    email_verified_at = Column(DateTime, nullable=True)
    
    # Relationships
    books = relationship("Book", back_populates="owner")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', username='{self.username}')>"
    
    def get_full_name(self) -> str:
        """Get user's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.display_name:
            return self.display_name
        else:
            return self.username
    
    def is_locked(self) -> bool:
        """Check if user account is locked"""
        if self.locked_until and self.locked_until > datetime.utcnow():
            return True
        return False
    
    def can_login(self) -> bool:
        """Check if user can log in"""
        return (
            self.is_active and 
            not self.is_locked() and 
            self.status == UserStatus.ACTIVE
        )
    
    def increment_failed_login(self):
        """Increment failed login attempts"""
        self.failed_login_attempts += 1
        
        # Lock account after 5 failed attempts for 15 minutes
        if self.failed_login_attempts >= 5:
            self.locked_until = datetime.utcnow() + timedelta(minutes=15)
    
    def reset_failed_login(self):
        """Reset failed login attempts"""
        self.failed_login_attempts = 0
        self.locked_until = None
    
    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = datetime.utcnow()
        self.reset_failed_login()
    
    def has_permission(self, permission: str) -> bool:
        """Check if user has specific permission"""
        # Admin has all permissions
        if self.role == UserRole.ADMIN:
            return True
        
        # Define role-based permissions
        role_permissions = {
            UserRole.MODERATOR: [
                "books:read", "books:create", "books:update", "books:delete",
                "users:read", "users:update", "stats:read"
            ],
            UserRole.USER: [
                "books:read", "books:create", "books:update", "books:delete_own",
                "profile:read", "profile:update"
            ],
            UserRole.GUEST: [
                "books:read"
            ]
        }
        
        return permission in role_permissions.get(self.role, [])
    
    def can_access_book(self, book_owner_id: int) -> bool:
        """Check if user can access a specific book"""
        # Admin and moderators can access all books
        if self.role in [UserRole.ADMIN, UserRole.MODERATOR]:
            return True
        
        # Users can access their own books
        if self.id == book_owner_id:
            return True
        
        return False 