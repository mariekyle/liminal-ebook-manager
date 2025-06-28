"""
Health check endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.config.database import get_db

router = APIRouter()

@router.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {"status": "healthy", "message": "Liminal Ebook Manager is running"}

@router.get("/health/db")
async def database_health_check(db: Session = Depends(get_db)):
    """Database health check endpoint."""
    try:
        # Simple query to test database connection
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)} 