"""
Authentication Dependencies
Provides dependency functions for route protection and permission checking
"""

from typing import Optional, Callable
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from functools import wraps

from ..models.user import User, UserRole
from ..services.auth_service import auth_service
from ..config.database import get_db

# Security scheme
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    try:
        user = auth_service.get_current_user(db, credentials.credentials)
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

def get_optional_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.split(" ")[1]
        user = auth_service.get_current_user(db, token)
        return user
    except:
        return None

def require_permission(permission: str):
    """Decorator to require specific permission"""
    def permission_dependency(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission}' required"
            )
        return current_user
    return permission_dependency

def require_role(role: UserRole):
    """Decorator to require specific role"""
    def role_dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != role and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role.value}' required"
            )
        return current_user
    return role_dependency

def require_admin():
    """Decorator to require admin role"""
    return require_role(UserRole.ADMIN)

def require_moderator():
    """Decorator to require moderator or admin role"""
    def moderator_dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in [UserRole.ADMIN, UserRole.MODERATOR]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Moderator or admin role required"
            )
        return current_user
    return moderator_dependency

def require_verified_user():
    """Decorator to require verified user"""
    def verified_dependency(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email verification required"
            )
        return current_user
    return verified_dependency

def require_active_user():
    """Decorator to require active user"""
    def active_dependency(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )
        return current_user
    return active_dependency

def require_book_owner():
    """Decorator to require user to be book owner or admin/moderator"""
    def book_owner_dependency(
        book_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        from ..models.book import Book
        
        book = db.query(Book).filter(Book.id == book_id).first()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Book not found"
            )
        
        if not current_user.can_access_book(book.owner_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this book"
            )
        
        return current_user
    return book_owner_dependency

def rate_limit(max_requests: int = 100, window_seconds: int = 60):
    """Rate limiting decorator"""
    def rate_limit_dependency(request: Request):
        # TODO: Implement rate limiting with Redis
        # For now, just pass through
        return True
    return rate_limit_dependency

def log_request():
    """Log request details"""
    def log_dependency(request: Request):
        # TODO: Implement request logging
        # For now, just pass through
        return True
    return log_dependency

# Utility functions for manual permission checking
def check_permission(user: User, permission: str) -> bool:
    """Check if user has specific permission"""
    return user.has_permission(permission)

def check_role(user: User, role: UserRole) -> bool:
    """Check if user has specific role"""
    return user.role == role or user.role == UserRole.ADMIN

def check_book_access(user: User, book_owner_id: int) -> bool:
    """Check if user can access a specific book"""
    return user.can_access_book(book_owner_id)

# Context managers for temporary permission elevation
class PermissionContext:
    """Context manager for temporary permission elevation"""
    
    def __init__(self, user: User, required_permission: str):
        self.user = user
        self.required_permission = required_permission
        self.original_role = user.role
    
    def __enter__(self):
        if not self.user.has_permission(self.required_permission):
            # Temporarily elevate to admin for this operation
            self.user.role = UserRole.ADMIN
        return self.user
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        # Restore original role
        self.user.role = self.original_role

def with_permission(user: User, permission: str):
    """Context manager for temporary permission elevation"""
    return PermissionContext(user, permission) 