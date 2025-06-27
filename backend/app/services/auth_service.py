"""
Authentication Service
Handles user authentication, JWT tokens, password hashing, and session management
"""

import jwt
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext
from fastapi import HTTPException, status

from ..models.user import User, UserRole, UserStatus
from ..models.session import UserSession
from ..models.auth_schemas import UserRegisterRequest, UserLoginRequest
from ..config.settings import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    """Authentication service for user management and JWT handling"""
    
    def __init__(self):
        self.secret_key = settings.secret_key
        self.algorithm = settings.jwt_algorithm
        self.access_token_expire_minutes = settings.access_token_expire_minutes
        self.refresh_token_expire_days = settings.refresh_token_expire_days
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def create_refresh_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT refresh token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str, token_type: str = "access") -> Dict[str, Any]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            if payload.get("type") != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    
    def generate_session_token(self) -> str:
        """Generate a secure session token"""
        return secrets.token_urlsafe(32)
    
    def generate_email_verification_token(self) -> str:
        """Generate an email verification token"""
        return secrets.token_urlsafe(32)
    
    def generate_password_reset_token(self) -> str:
        """Generate a password reset token"""
        return secrets.token_urlsafe(32)
    
    def register_user(self, db: Session, user_data: UserRegisterRequest) -> User:
        """Register a new user"""
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.email == user_data.email) | (User.username == user_data.username)
        ).first()
        
        if existing_user:
            if existing_user.email == user_data.email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
        
        # Create new user
        hashed_password = self.get_password_hash(user_data.password)
        email_verification_token = self.generate_email_verification_token()
        
        user = User(
            email=user_data.email.lower(),
            username=user_data.username.lower(),
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            display_name=user_data.display_name,
            email_verification_token=email_verification_token,
            status=UserStatus.PENDING_VERIFICATION,
            is_verified=False
        )
        
        try:
            db.add(user)
            db.commit()
            db.refresh(user)
            return user
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User registration failed"
            )
    
    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate a user with email and password"""
        user = db.query(User).filter(User.email == email.lower()).first()
        
        if not user:
            return None
        
        if not self.verify_password(password, user.hashed_password):
            user.increment_failed_login()
            db.commit()
            return None
        
        if not user.can_login():
            return None
        
        user.update_last_login()
        db.commit()
        return user
    
    def create_user_session(self, db: Session, user: User, user_agent: str = None, 
                           ip_address: str = None, device_info: str = None) -> Tuple[str, str, UserSession]:
        """Create a new user session"""
        session_token = self.generate_session_token()
        refresh_token = self.generate_session_token()
        
        session = UserSession.create_session(
            user_id=user.id,
            session_token=session_token,
            refresh_token=refresh_token,
            expires_in_days=self.refresh_token_expire_days,
            user_agent=user_agent,
            ip_address=ip_address,
            device_info=device_info
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return session_token, refresh_token, session
    
    def login_user(self, db: Session, login_data: UserLoginRequest, 
                   user_agent: str = None, ip_address: str = None, 
                   device_info: str = None) -> Dict[str, Any]:
        """Login a user and return tokens"""
        user = self.authenticate_user(db, login_data.email, login_data.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Create session
        session_token, refresh_token, session = self.create_user_session(
            db, user, user_agent, ip_address, device_info
        )
        
        # Create access token
        access_token_data = {
            "sub": str(user.id),
            "email": user.email,
            "username": user.username,
            "role": user.role.value,
            "session_id": str(session.id)
        }
        
        access_token = self.create_access_token(access_token_data)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": self.access_token_expire_minutes * 60,
            "user": user
        }
    
    def refresh_access_token(self, db: Session, refresh_token: str) -> Dict[str, Any]:
        """Refresh an access token using a refresh token"""
        # Verify refresh token
        payload = self.verify_token(refresh_token, "refresh")
        user_id = int(payload.get("sub"))
        
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.can_login():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Create new access token
        access_token_data = {
            "sub": str(user.id),
            "email": user.email,
            "username": user.username,
            "role": user.role.value,
            "session_id": payload.get("session_id")
        }
        
        access_token = self.create_access_token(access_token_data)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": self.access_token_expire_minutes * 60
        }
    
    def get_current_user(self, db: Session, token: str) -> User:
        """Get current user from JWT token"""
        payload = self.verify_token(token, "access")
        user_id = int(payload.get("sub"))
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.can_login():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        return user
    
    def logout_user(self, db: Session, token: str) -> bool:
        """Logout a user by revoking their session"""
        try:
            payload = self.verify_token(token, "access")
            session_id = payload.get("session_id")
            
            if session_id:
                session = db.query(UserSession).filter(UserSession.id == int(session_id)).first()
                if session:
                    session.revoke()
                    db.commit()
                    return True
        except:
            pass
        
        return False
    
    def verify_email(self, db: Session, token: str) -> bool:
        """Verify user email with verification token"""
        user = db.query(User).filter(User.email_verification_token == token).first()
        
        if not user:
            return False
        
        user.is_verified = True
        user.status = UserStatus.ACTIVE
        user.email_verification_token = None
        user.email_verified_at = datetime.utcnow()
        
        db.commit()
        return True
    
    def request_password_reset(self, db: Session, email: str) -> bool:
        """Request password reset for a user"""
        user = db.query(User).filter(User.email == email.lower()).first()
        
        if not user:
            return False
        
        # Generate reset token
        reset_token = self.generate_password_reset_token()
        user.password_reset_token = reset_token
        user.password_reset_expires = datetime.utcnow() + timedelta(hours=24)
        
        db.commit()
        
        # TODO: Send email with reset token
        # For now, just return success
        return True
    
    def reset_password(self, db: Session, token: str, new_password: str) -> bool:
        """Reset user password with reset token"""
        user = db.query(User).filter(
            User.password_reset_token == token,
            User.password_reset_expires > datetime.utcnow()
        ).first()
        
        if not user:
            return False
        
        # Update password
        user.hashed_password = self.get_password_hash(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        
        db.commit()
        return True
    
    def change_password(self, db: Session, user: User, current_password: str, new_password: str) -> bool:
        """Change user password"""
        if not self.verify_password(current_password, user.hashed_password):
            return False
        
        user.hashed_password = self.get_password_hash(new_password)
        db.commit()
        return True
    
    def update_user_profile(self, db: Session, user: User, profile_data: Dict[str, Any]) -> User:
        """Update user profile"""
        for field, value in profile_data.items():
            if hasattr(user, field) and value is not None:
                setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        return user
    
    def get_user_sessions(self, db: Session, user: User) -> list:
        """Get all active sessions for a user"""
        return db.query(UserSession).filter(
            UserSession.user_id == user.id,
            UserSession.is_active == True
        ).all()
    
    def revoke_session(self, db: Session, user: User, session_id: int) -> bool:
        """Revoke a specific user session"""
        session = db.query(UserSession).filter(
            UserSession.id == session_id,
            UserSession.user_id == user.id
        ).first()
        
        if not session:
            return False
        
        session.revoke()
        db.commit()
        return True
    
    def revoke_all_sessions(self, db: Session, user: User) -> bool:
        """Revoke all sessions for a user"""
        sessions = db.query(UserSession).filter(
            UserSession.user_id == user.id,
            UserSession.is_active == True
        ).all()
        
        for session in sessions:
            session.revoke()
        
        db.commit()
        return True

# Global auth service instance
auth_service = AuthService() 