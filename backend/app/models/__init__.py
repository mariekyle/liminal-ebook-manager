"""
Models Package
Contains all database models for the application
"""

from .book import Book, Base as BookBase
from .user import User, UserRole, UserStatus, Base as UserBase
from .session import UserSession, Base as SessionBase
from .auth_schemas import (
    UserRegisterRequest, UserLoginRequest, UserLoginResponse, UserResponse,
    RefreshTokenRequest, TokenResponse, PasswordResetRequest, PasswordResetConfirmRequest,
    EmailVerificationRequest, UserUpdateRequest, PasswordChangeRequest,
    UserSessionResponse, UserListResponse, AuthResponse
)

# Export all models
__all__ = [
    # Database models
    'Book', 'User', 'UserSession',
    'UserRole', 'UserStatus',
    
    # Base classes
    'BookBase', 'UserBase', 'SessionBase',
    
    # Pydantic schemas
    'UserRegisterRequest', 'UserLoginRequest', 'UserLoginResponse', 'UserResponse',
    'RefreshTokenRequest', 'TokenResponse', 'PasswordResetRequest', 'PasswordResetConfirmRequest',
    'EmailVerificationRequest', 'UserUpdateRequest', 'PasswordChangeRequest',
    'UserSessionResponse', 'UserListResponse', 'AuthResponse'
] 