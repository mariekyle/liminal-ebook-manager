"""
Ebook Library App - Main Entry Point

This is the FastAPI application that serves both the API and the React frontend.
"""

import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

import aiosqlite

from database import init_db, get_db, get_db_path
from routers import titles, sync
from services.backup import get_backup_settings, schedule_backup_jobs, start_scheduler
from routers.import_metadata import router as import_router
from routers.upload import router as upload_router
from routers.settings import router as settings_router
from routers.authors import router as authors_router
from routers.sessions import router as sessions_router
from routers.home import router as home_router
from routers.collections import router as collections_router
from routers.backups import router as backups_router

# Configuration from environment
BOOKS_PATH = os.getenv("BOOKS_PATH", "/books")
DATABASE_PATH = os.getenv("DATABASE_PATH", "/app/data/library.db")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup, start backup scheduler."""
    await init_db(DATABASE_PATH)
    
    # Phase 9A: Start backup scheduler if enabled
    scheduler_started = False
    try:
        db_path = get_db_path()
        if db_path:
            async with aiosqlite.connect(db_path) as db:
                db.row_factory = aiosqlite.Row
                settings = await get_backup_settings(db)
                
                if settings.get('backup_enabled') and settings.get('backup_schedule') in ('daily', 'both'):
                    backup_time = settings.get('backup_time', '03:00')
                    schedule_backup_jobs(db_path, backup_time)
                    start_scheduler()
                    scheduler_started = True
                    print(f"Backup scheduler started (daily at {backup_time})")
                else:
                    print("Backup scheduler not started (disabled or before_sync only)")
    except Exception as e:
        print(f"Warning: Failed to start backup scheduler: {e}")
    
    yield
    
    # Shutdown: Stop backup scheduler
    if scheduler_started:
        try:
            from services.backup import stop_scheduler
            stop_scheduler()
            print("Backup scheduler stopped")
        except Exception as e:
            print(f"Warning: Failed to stop backup scheduler: {e}")


app = FastAPI(
    title="Liminal",
    description="Personal ebook library manager with notes",
    version="0.10.0",
    lifespan=lifespan
)

# CORS for development (when running frontend separately)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(titles.router, prefix="/api")
app.include_router(sync.router, prefix="/api")
app.include_router(import_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(authors_router, prefix="/api")
app.include_router(sessions_router)
app.include_router(home_router)
app.include_router(collections_router, prefix="/api")
app.include_router(backups_router, prefix="/api")

# Serve cover images - create directory if needed
COVERS_DIR = os.environ.get("COVERS_DIR", "/data/covers")
os.makedirs(COVERS_DIR, exist_ok=True)
app.mount("/api/covers", StaticFiles(directory=COVERS_DIR), name="covers")


# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Simple health check to verify the API is running."""
    return {
        "status": "healthy",
        "books_path": BOOKS_PATH,
        "books_path_exists": Path(BOOKS_PATH).exists()
    }


# Serve static frontend files
static_path = Path(__file__).parent / "static"
if static_path.exists():
    app.mount("/assets", StaticFiles(directory=static_path / "assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve the React frontend for all non-API routes."""
        # For SPA routing, always serve index.html
        return FileResponse(static_path / "index.html")
else:
    # Development mode - no static files built yet
    @app.get("/")
    async def dev_root():
        return {
            "message": "Backend is running! Frontend not built yet.",
            "hint": "Run 'npm run build' in the frontend directory, or run frontend dev server on port 5173"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
