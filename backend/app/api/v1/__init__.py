"""
API v1 Package
Contains all API version 1 endpoints
"""

from fastapi import APIRouter

from .health import router as health_router
from .books import router as books_router
from .stats import router as stats_router
from .auth import router as auth_router

# Create main API router
api_router = APIRouter()

# Include all routers
api_router.include_router(health_router, prefix="/health", tags=["Health"])
api_router.include_router(books_router, prefix="/books", tags=["Books"])
api_router.include_router(stats_router, prefix="/stats", tags=["Statistics"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])

__all__ = [
    'api_router',
    'health_router',
    'books_router', 
    'stats_router',
    'auth_router'
] 