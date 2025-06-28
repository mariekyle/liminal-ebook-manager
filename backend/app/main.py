"""
Main FastAPI application for Liminal Ebook Manager.

This is the entry point for the backend API.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import os
from pathlib import Path

from .config.settings import settings
from .config.database import run_migrations, engine
from .models.book import Base
from .api.v1 import books, health, stats

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Liminal Ebook Manager",
    description="A simple, elegant personal ebook library manager",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploaded books
uploads_dir = os.path.join(os.getcwd(), "uploads")
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Create upload directories
for directory in ['uploads/books', 'uploads/covers', 'uploads/temp']:
    Path(directory).mkdir(parents=True, exist_ok=True)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(books.router, prefix="/api/v1", tags=["books"])
app.include_router(stats.router)

# Create database tables
Base.metadata.create_all(bind=engine)

@app.on_event("startup")
async def startup_tasks():
    """Run startup tasks"""
    # Run database migrations
    run_migrations()
    
    # Import and run backfill functions
    from .services.book_service import backfill_word_counts, backfill_missing_metadata
    await backfill_word_counts()
    await backfill_missing_metadata()

@app.get("/")
async def root():
    """Root endpoint with basic app info."""
    return {
        "message": "Welcome to Liminal Ebook Manager",
        "version": "1.0.0",
        "docs": "/docs"
    } 