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
    title=settings.APP_TITLE,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url='/docs',
    redoc_url='/redoc'
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Mount static files
app.mount('/uploads', StaticFiles(directory='uploads'), name='uploads')

# Create upload directories
for directory in ['uploads/books', 'uploads/covers', 'uploads/temp']:
    Path(directory).mkdir(parents=True, exist_ok=True)

# Include routers
app.include_router(health.router)
app.include_router(books.router)
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