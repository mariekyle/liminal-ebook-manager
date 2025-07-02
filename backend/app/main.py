from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import uuid

from .core.config import settings
from .core.logging import logger, log_request, log_error
from .db.base import engine
from .db.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Liminal Ebook Manager")
    
    # Create database tables
    from .db.base import Base
    Base.metadata.create_all(bind=engine)
    
    # Initialize database with admin user
    from .db.base import SessionLocal
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Liminal Ebook Manager")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="A modern, self-hosted ebook management system",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests"""
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    # Add request ID to request state
    request.state.request_id = request_id
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Log request
    log_request(
        request_id=request_id,
        method=request.method,
        path=str(request.url.path),
        status_code=response.status_code,
        duration=duration
    )
    
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    log_error(exc, {
        "request_id": request_id,
        "path": str(request.url.path),
        "method": request.method
    })
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "request_id": request_id
        }
    )


# Include API router
from .api.v1.api import api_router
app.include_router(api_router, prefix=settings.api_v1_str)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Liminal Ebook Manager",
        "version": "1.0.0",
        "docs": "/docs"
    } 