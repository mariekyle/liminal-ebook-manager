"""
Authentication API Endpoints
Handles user registration, login, logout, and authentication-related operations
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ...models.auth_schemas import (
    UserRegisterRequest, UserLoginRequest, UserLoginResponse, UserResponse,
    RefreshTokenRequest, TokenResponse, PasswordResetRequest, PasswordResetConfirmRequest,
    EmailVerificationRequest, UserUpdateRequest, PasswordChangeRequest,
    UserSessionResponse, UserListResponse, AuthResponse
)
from ...models.user import User, UserRole
from ...services.auth_service import auth_service
from ...config.database import get_db
from ...utils.dependencies import get_current_user, require_permission

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Security scheme
security = HTTPBearer()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserRegisterRequest,
    db: Session = Depends(get_db),
    request: Request = None
):
    """Register a new user"""
    try:
        user = auth_service.register_user(db, user_data)
        
        # TODO: Send email verification
        # For now, auto-verify the user
        user.is_verified = True
        user.status = UserStatus.ACTIVE
        db.commit()
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/login", response_model=UserLoginResponse)
async def login_user(
    login_data: UserLoginRequest,
    db: Session = Depends(get_db),
    request: Request = None,
    user_agent: Optional[str] = Header(None),
    x_forwarded_for: Optional[str] = Header(None)
):
    """Login a user"""
    try:
        # Get client IP
        ip_address = x_forwarded_for.split(",")[0].strip() if x_forwarded_for else request.client.host
        
        # Get device info
        device_info = user_agent[:255] if user_agent else None
        
        result = auth_service.login_user(
            db, login_data, user_agent, ip_address, device_info
        )
        
        return UserLoginResponse(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
            token_type=result["token_type"],
            expires_in=result["expires_in"],
            user=result["user"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token"""
    try:
        result = auth_service.refresh_access_token(db, refresh_data.refresh_token)
        
        return TokenResponse(
            access_token=result["access_token"],
            refresh_token=refresh_data.refresh_token,
            token_type=result["token_type"],
            expires_in=result["expires_in"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )

@router.post("/logout", response_model=AuthResponse)
async def logout_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Logout a user"""
    try:
        success = auth_service.logout_user(db, credentials.credentials)
        
        if success:
            return AuthResponse(
                message="Successfully logged out",
                success=True
            )
        else:
            return AuthResponse(
                message="Logout completed",
                success=True
            )
    except Exception as e:
        return AuthResponse(
            message="Logout completed",
            success=True
        )

@router.post("/verify-email", response_model=AuthResponse)
async def verify_email(
    verification_data: EmailVerificationRequest,
    db: Session = Depends(get_db)
):
    """Verify user email"""
    try:
        success = auth_service.verify_email(db, verification_data.token)
        
        if success:
            return AuthResponse(
                message="Email verified successfully",
                success=True
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed"
        )

@router.post("/password-reset", response_model=AuthResponse)
async def request_password_reset(
    reset_data: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Request password reset"""
    try:
        success = auth_service.request_password_reset(db, reset_data.email)
        
        return AuthResponse(
            message="Password reset email sent if account exists",
            success=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset request failed"
        )

@router.post("/password-reset/confirm", response_model=AuthResponse)
async def confirm_password_reset(
    reset_data: PasswordResetConfirmRequest,
    db: Session = Depends(get_db)
):
    """Confirm password reset"""
    try:
        success = auth_service.reset_password(db, reset_data.token, reset_data.new_password)
        
        if success:
            return AuthResponse(
                message="Password reset successfully",
                success=True
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    profile_data: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    try:
        # Convert Pydantic model to dict, excluding None values
        update_data = profile_data.dict(exclude_unset=True)
        
        updated_user = auth_service.update_user_profile(db, current_user, update_data)
        return updated_user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile update failed"
        )

@router.post("/me/change-password", response_model=AuthResponse)
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change current user password"""
    try:
        success = auth_service.change_password(
            db, current_user, password_data.current_password, password_data.new_password
        )
        
        if success:
            return AuthResponse(
                message="Password changed successfully",
                success=True
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed"
        )

@router.get("/me/sessions", response_model=List[UserSessionResponse])
async def get_user_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's active sessions"""
    try:
        sessions = auth_service.get_user_sessions(db, current_user)
        return sessions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve sessions"
        )

@router.delete("/me/sessions/{session_id}", response_model=AuthResponse)
async def revoke_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke a specific user session"""
    try:
        success = auth_service.revoke_session(db, current_user, session_id)
        
        if success:
            return AuthResponse(
                message="Session revoked successfully",
                success=True
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revoke session"
        )

@router.delete("/me/sessions", response_model=AuthResponse)
async def revoke_all_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke all user sessions"""
    try:
        success = auth_service.revoke_all_sessions(db, current_user)
        
        return AuthResponse(
            message="All sessions revoked successfully",
            success=True
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revoke sessions"
        )

# Admin endpoints
@router.get("/users", response_model=UserListResponse)
async def get_users(
    page: int = 1,
    per_page: int = 20,
    search: Optional[str] = None,
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    current_user: User = Depends(require_permission("users:read")),
    db: Session = Depends(get_db)
):
    """Get users (admin only)"""
    try:
        # Build query
        query = db.query(User)
        
        if search:
            query = query.filter(
                (User.email.contains(search)) |
                (User.username.contains(search)) |
                (User.first_name.contains(search)) |
                (User.last_name.contains(search))
            )
        
        if role:
            query = query.filter(User.role == role)
        
        if status:
            query = query.filter(User.status == status)
        
        # Pagination
        total = query.count()
        users = query.offset((page - 1) * per_page).limit(per_page).all()
        
        total_pages = (total + per_page - 1) // per_page
        
        return UserListResponse(
            users=users,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users"
        )

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(require_permission("users:read")),
    db: Session = Depends(get_db)
):
    """Get user by ID (admin only)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user"
        )

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdateRequest,
    current_user: User = Depends(require_permission("users:update")),
    db: Session = Depends(get_db)
):
    """Update user (admin only)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        update_data = user_data.dict(exclude_unset=True)
        updated_user = auth_service.update_user_profile(db, user, update_data)
        
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        ) 