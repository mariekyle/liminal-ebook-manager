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

from database import init_db, get_db
from routers import books, sync
from routers.import_metadata import router as import_router
from routers.upload import router as upload_router
from routers.settings import router as settings_router

# Configuration from environment
BOOKS_PATH = os.getenv("BOOKS_PATH", "/books")
DATABASE_PATH = os.getenv("DATABASE_PATH", "/app/data/library.db")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db(DATABASE_PATH)
    yield


app = FastAPI(
    title="Liminal",
    description="Personal ebook library manager with notes",
    version="0.1.0",
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
app.include_router(books.router, prefix="/api")
app.include_router(sync.router, prefix="/api")
app.include_router(import_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(settings_router, prefix="/api")


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
