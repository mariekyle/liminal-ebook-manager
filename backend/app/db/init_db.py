from sqlalchemy.orm import Session
from ..core.security import get_password_hash
from ..models import User
from ..core.logging import logger


def init_db(db: Session) -> None:
    """Initialize the database with initial data"""
    
    # Check if admin user already exists
    admin_user = db.query(User).filter(User.email == "admin@liminal.local").first()
    if admin_user:
        logger.info("Admin user already exists, skipping initialization")
        return
    
    # Create admin user
    admin_user = User(
        email="admin@liminal.local",
        username="admin",
        password_hash=get_password_hash("admin123"),  # Change this in production!
        role="admin",
        is_active=True
    )
    
    db.add(admin_user)
    db.commit()
    
    logger.info("Database initialized with admin user")
    logger.info("Admin credentials: admin@liminal.local / admin123")
    logger.warning("Please change admin password in production!") 