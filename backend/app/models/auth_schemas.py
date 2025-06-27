"""
Authentication Schemas for Request/Response Models
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator
from enum import Enum

class UserRole(str, Enum):
    """User roles for role-based access control"""
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"
    GUEST = "guest"

class UserStatus(str, Enum):
    """User account status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"

# Request Schemas
class UserRegisterRequest(BaseModel):
    """User registration request"""
    email: EmailStr = Field(..., description="User email address")
    username: str = Field(..., min_length=3, max_length=50, description="Username")
    password: str = Field(..., min_length=8, description="Password")
    first_name: Optional[str] = Field(None, max_length=100, description="First name")
    last_name: Optional[str] = Field(None, max_length=100, description="Last name")
    display_name: Optional[str] = Field(None, max_length=100, description="Display name")
    
    @validator('username')
    def validate_username(cls, v):
        if not v.isalnum():
            raise ValueError('Username must contain only alphanumeric characters')
        return v.lower()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserLoginRequest(BaseModel):
    """User login request"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="Password")
    remember_me: bool = Field(False, description="Remember me option")

class UserLoginResponse(BaseModel):
    """User login response"""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="Refresh token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    user: "UserResponse" = Field(..., description="User information")

class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str = Field(..., description="Refresh token")

class PasswordResetRequest(BaseModel):
    """Password reset request"""
    email: EmailStr = Field(..., description="User email address")

class PasswordResetConfirmRequest(BaseModel):
    """Password reset confirmation request"""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password")
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class EmailVerificationRequest(BaseModel):
    """Email verification request"""
    token: str = Field(..., description="Email verification token")

class UserUpdateRequest(BaseModel):
    """User profile update request"""
    first_name: Optional[str] = Field(None, max_length=100, description="First name")
    last_name: Optional[str] = Field(None, max_length=100, description="Last name")
    display_name: Optional[str] = Field(None, max_length=100, description="Display name")
    bio: Optional[str] = Field(None, max_length=1000, description="User bio")
    avatar_url: Optional[str] = Field(None, max_length=500, description="Avatar URL")

class PasswordChangeRequest(BaseModel):
    """Password change request"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

# Response Schemas
class UserResponse(BaseModel):
    """User response model"""
    id: int = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    username: str = Field(..., description="Username")
    first_name: Optional[str] = Field(None, description="First name")
    last_name: Optional[str] = Field(None, description="Last name")
    display_name: Optional[str] = Field(None, description="Display name")
    bio: Optional[str] = Field(None, description="User bio")
    avatar_url: Optional[str] = Field(None, description="Avatar URL")
    role: UserRole = Field(..., description="User role")
    status: UserStatus = Field(..., description="User status")
    is_verified: bool = Field(..., description="Email verification status")
    is_active: bool = Field(..., description="Account active status")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    class Config:
        from_attributes = True

class UserSessionResponse(BaseModel):
    """User session response model"""
    id: int = Field(..., description="Session ID")
    user_agent: Optional[str] = Field(None, description="User agent")
    ip_address: Optional[str] = Field(None, description="IP address")
    device_info: Optional[str] = Field(None, description="Device information")
    is_active: bool = Field(..., description="Session active status")
    created_at: datetime = Field(..., description="Session creation timestamp")
    last_used_at: datetime = Field(..., description="Last used timestamp")
    expires_at: datetime = Field(..., description="Expiration timestamp")
    
    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    """User list response model"""
    users: List[UserResponse] = Field(..., description="List of users")
    total: int = Field(..., description="Total number of users")
    page: int = Field(..., description="Current page")
    per_page: int = Field(..., description="Users per page")
    total_pages: int = Field(..., description="Total number of pages")

class AuthResponse(BaseModel):
    """Generic authentication response"""
    message: str = Field(..., description="Response message")
    success: bool = Field(..., description="Success status")

class TokenResponse(BaseModel):
    """Token response model"""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="Refresh token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")

# Update forward references
UserLoginResponse.update_forward_refs() 