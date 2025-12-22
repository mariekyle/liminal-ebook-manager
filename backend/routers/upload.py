"""
Upload Router for Liminal Book Uploader

API Endpoints:
- POST /api/upload/analyze-batch — Upload files, extract metadata, group into books
- POST /api/upload/finalize-batch — Confirm and move files to NAS
- POST /api/upload/cancel — Cancel session and clean up temp files
"""

import os
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel

from services.upload_service import (
    create_session,
    get_session,
    cleanup_session,
    cleanup_expired_sessions,
    save_uploaded_file,
    extract_file_metadata,
    group_files,
    apply_category_detection,
    check_duplicates,
    finalize_batch,
    validate_file,
    MAX_BATCH_SIZE,
    BookGroup,
)

router = APIRouter(prefix="/upload", tags=["upload"])

# Configure your NAS books directory
BOOKS_DIR = os.environ.get("BOOKS_DIR", "/books")


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class FileInfo(BaseModel):
    id: str
    name: str
    size: int
    extension: str


class DuplicateInfo(BaseModel):
    existing_folder: str
    existing_files: list[str]
    type: str  # 'exact_match' or 'different_format'
    new_files: Optional[list[str]] = None
    message: str


class BookInfo(BaseModel):
    id: str
    title: str
    author: str
    series: Optional[str] = None
    series_number: Optional[str] = None
    category: str
    category_confidence: float
    files: list[dict]
    duplicate: Optional[dict] = None


class AnalyzeResponse(BaseModel):
    session_id: str
    books: list[BookInfo]
    total_files: int
    total_size: int


class BookAction(BaseModel):
    id: str
    action: str  # 'new', 'add_format', 'replace', 'skip'
    title: Optional[str] = None
    author: Optional[str] = None
    series: Optional[str] = None
    series_number: Optional[str] = None
    category: Optional[str] = None
    existing_folder: Optional[str] = None


class FinalizeRequest(BaseModel):
    session_id: str
    books: list[BookAction]


class FinalizeResult(BaseModel):
    id: str
    status: str  # 'created', 'format_added', 'skipped', 'error'
    folder: Optional[str] = None
    files_added: Optional[int] = None
    message: Optional[str] = None


class FinalizeResponse(BaseModel):
    success: bool
    results: list[FinalizeResult]
    sync_triggered: bool


class CancelRequest(BaseModel):
    session_id: str


class CancelResponse(BaseModel):
    success: bool
    files_cleaned: int


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/analyze-batch", response_model=AnalyzeResponse)
async def analyze_batch(
    files: list[UploadFile] = File(...),
    background_tasks: BackgroundTasks = None
):
    """
    Upload files for analysis.
    
    - Saves files to temp directory
    - Extracts metadata from each file
    - Groups files into books by title/author similarity
    - Detects category (FanFiction, Fiction, Non-Fiction)
    - Checks for duplicates against existing library
    
    Returns session_id and list of detected books for review.
    """
    # Schedule cleanup of expired sessions
    if background_tasks:
        background_tasks.add_task(cleanup_expired_sessions)
    
    # Validate batch size
    total_size = sum(f.size for f in files if f.size)
    if total_size > MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Batch too large: {total_size / 1024 / 1024:.1f} MB (max 500 MB)"
        )
    
    # Create session
    session = create_session()
    
    try:
        # Save and validate each file
        uploaded_files = []
        for upload_file in files:
            # Validate
            is_valid, error = validate_file(upload_file.filename, upload_file.size or 0)
            if not is_valid:
                # Skip invalid files but continue with valid ones
                continue
            
            # Read content
            content = await upload_file.read()
            
            # Save to temp
            uploaded = await save_uploaded_file(session, upload_file.filename, content)
            uploaded_files.append(uploaded)
        
        if not uploaded_files:
            cleanup_session(session.id)
            raise HTTPException(
                status_code=400,
                detail="No valid files uploaded"
            )
        
        # Extract metadata from each file
        for uploaded_file in uploaded_files:
            extract_file_metadata(uploaded_file)
        
        # Group files into books
        books = group_files(uploaded_files)
        session.books = books
        
        # Apply category detection
        apply_category_detection(books, uploaded_files)
        
        # Check for duplicates
        await check_duplicates(books, BOOKS_DIR)
        
        # Build response
        book_infos = [
            BookInfo(
                id=book.id,
                title=book.title,
                author=book.author,
                series=book.series,
                series_number=book.series_number,
                category=book.category,
                category_confidence=book.category_confidence,
                files=book.files,
                duplicate=book.duplicate
            )
            for book in books
        ]
        
        return AnalyzeResponse(
            session_id=session.id,
            books=book_infos,
            total_files=len(uploaded_files),
            total_size=sum(f.size for f in uploaded_files)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        cleanup_session(session.id)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/finalize-batch", response_model=FinalizeResponse)
async def finalize_batch_endpoint(
    request: FinalizeRequest,
    background_tasks: BackgroundTasks = None
):
    """
    Finalize the upload - move files to NAS.
    
    Each book can have an action:
    - 'new': Create new book folder
    - 'add_format': Add files to existing book folder
    - 'replace': Delete existing and create new
    - 'skip': Don't upload this book
    
    After successful upload, triggers a library sync.
    """
    session = get_session(request.session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found or expired"
        )
    
    try:
        # Convert to dicts for the service
        books_data = [book.dict() for book in request.books]
        
        # Finalize each book
        results = await finalize_batch(session, books_data, BOOKS_DIR)
        
        # Clean up session
        cleanup_session(request.session_id)
        
        # Trigger library sync in background
        sync_triggered = False
        if background_tasks:
            # Note: Background tasks can't use FastAPI Depends
            # The sync will need to create its own db connection
            # For now, just set flag - user can manually sync if needed
            sync_triggered = False
        
        # Build response
        result_models = [
            FinalizeResult(
                id=r['id'],
                status=r['status'],
                folder=r.get('folder'),
                files_added=r.get('files_added'),
                message=r.get('message')
            )
            for r in results
        ]
        
        return FinalizeResponse(
            success=all(r['status'] != 'error' for r in results),
            results=result_models,
            sync_triggered=sync_triggered
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cancel", response_model=CancelResponse)
async def cancel_upload(request: CancelRequest):
    """
    Cancel an upload session and clean up temp files.
    """
    files_cleaned = cleanup_session(request.session_id)
    
    return CancelResponse(
        success=True,
        files_cleaned=files_cleaned
    )


@router.get("/health")
async def upload_health():
    """Health check for upload service"""
    return {
        "status": "ok",
        "books_dir": BOOKS_DIR,
        "books_dir_exists": os.path.exists(BOOKS_DIR)
    }
