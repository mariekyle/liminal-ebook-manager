"""
Upload Router for Liminal Book Uploader

API Endpoints:
- POST /api/upload/analyze-batch — Upload files, extract metadata, group into books
- POST /api/upload/finalize-batch — Confirm and move files to NAS
- POST /api/upload/link-to-title — Link uploaded files to existing title (TBR → Library)
- POST /api/upload/cancel — Cancel session and clean up temp files
"""

import os
import json
import shutil
import re
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel

from database import get_db
from services.covers import generate_cover_colors
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

# Import the standalone sync function
from routers.sync import run_sync_standalone

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


class FamiliarTitle(BaseModel):
    """Info about a matching title already in the library database."""
    title_id: int
    title: str
    authors: list[str]
    category: Optional[str] = None


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
    familiar_title: Optional[FamiliarTitle] = None  # Matching title from database


class AnalyzeResponse(BaseModel):
    session_id: str
    books: list[BookInfo]
    total_files: int
    total_size: int


class BookAction(BaseModel):
    id: str
    action: str  # 'new', 'add_format', 'add_to_existing', 'replace', 'skip'
    title: Optional[str] = None
    author: Optional[str] = None
    series: Optional[str] = None
    series_number: Optional[str] = None
    category: Optional[str] = None
    existing_folder: Optional[str] = None
    title_id: Optional[int] = None  # For add_to_existing action


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


class LinkToTitleRequest(BaseModel):
    """Request body for linking uploaded files to existing title."""
    session_id: str
    title_id: int


class LinkToTitleResponse(BaseModel):
    """Response for link-to-title endpoint."""
    success: bool
    title_id: int
    files_moved: int
    folder_path: str


# =============================================================================
# BACKGROUND TASK WRAPPER
# =============================================================================

async def trigger_library_sync():
    """
    Background task to sync library after upload.
    Uses the standalone sync function that creates its own DB connection.
    """
    try:
        print("Starting background library sync after upload...")
        result = await run_sync_standalone(full=False)
        print(f"Background sync complete: {result.message}")
    except Exception as e:
        print(f"Background sync failed: {e}")


# =============================================================================
# FAMILIAR TITLE CHECK
# =============================================================================

async def check_familiar_titles(db, books: list) -> dict:
    """
    Check if any books being uploaded have matching titles in the database.
    Returns a dict mapping book.id -> FamiliarTitle info.
    
    This catches cases where a book exists in the library database but the
    folder-based duplicate check didn't find it (e.g., renamed folders).
    """
    from difflib import SequenceMatcher
    
    results = {}
    
    # Get all existing titles from database
    cursor = await db.execute("""
        SELECT id, title, authors, category 
        FROM titles 
        WHERE is_tbr = 0
    """)
    existing_titles = await cursor.fetchall()
    
    for book in books:
        # Skip if already marked as duplicate by folder check
        if book.duplicate:
            continue
        
        # Normalize the uploading book's title for comparison
        book_title_lower = book.title.lower().strip()
        
        best_match = None
        best_score = 0
        
        for existing in existing_titles:
            existing_title = existing["title"]
            existing_title_lower = existing_title.lower().strip()
            
            # Check for exact match (case-insensitive)
            if book_title_lower == existing_title_lower:
                # Parse authors from JSON
                try:
                    authors = json.loads(existing["authors"]) if existing["authors"] else []
                except:
                    authors = []
                
                best_match = FamiliarTitle(
                    title_id=existing["id"],
                    title=existing_title,
                    authors=authors,
                    category=existing["category"]
                )
                break
            
            # Check for high similarity match
            similarity = SequenceMatcher(None, book_title_lower, existing_title_lower).ratio()
            if similarity > 0.85 and similarity > best_score:
                try:
                    authors = json.loads(existing["authors"]) if existing["authors"] else []
                except:
                    authors = []
                
                best_match = FamiliarTitle(
                    title_id=existing["id"],
                    title=existing_title,
                    authors=authors,
                    category=existing["category"]
                )
                best_score = similarity
        
        if best_match:
            results[book.id] = best_match
    
    return results


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/analyze-batch", response_model=AnalyzeResponse)
async def analyze_batch(
    files: list[UploadFile] = File(...),
    background_tasks: BackgroundTasks = None,
    db = Depends(get_db)
):
    """
    Upload files for analysis.
    
    - Saves files to temp directory
    - Extracts metadata from each file
    - Groups files into books by title/author similarity
    - Detects category (FanFiction, Fiction, Non-Fiction)
    - Checks for duplicates against existing library
    - Checks for familiar titles in database
    
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
        
        # Extract metadata from each file (async for EPUB/PDF extraction)
        for uploaded_file in uploaded_files:
            await extract_file_metadata(uploaded_file)
        
        # Group files into books
        books = group_files(uploaded_files)
        session.books = books
        
        # Apply category detection
        apply_category_detection(books, uploaded_files)
        
        # Check for duplicates (folder-based)
        await check_duplicates(books, BOOKS_DIR)
        
        # Check for familiar titles (database-based)
        familiar_titles = await check_familiar_titles(db, books)
        
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
                duplicate=book.duplicate,
                familiar_title=familiar_titles.get(book.id)
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


async def add_files_to_existing_title(session, book_id: str, title_id: int, db, books_dir: str) -> dict:
    """
    Add uploaded files to an existing title in the database.
    Creates folder if needed, moves files, creates edition record.
    """
    # Find the book in session
    book = None
    for b in session.books:
        if b.id == book_id:
            book = b
            break
    
    if not book:
        return {
            'id': book_id,
            'status': 'error',
            'message': 'Book not found in session'
        }
    
    # Get title info from database
    cursor = await db.execute(
        "SELECT id, title, authors, category FROM titles WHERE id = ?",
        (title_id,)
    )
    title_row = await cursor.fetchone()
    
    if not title_row:
        return {
            'id': book_id,
            'status': 'error',
            'message': f'Title {title_id} not found in database'
        }
    
    # Parse authors
    try:
        authors = json.loads(title_row["authors"]) if title_row["authors"] else []
    except:
        authors = []
    
    primary_author = authors[0] if authors else "Unknown"
    title = title_row["title"]
    category = title_row["category"] or "Uncategorized"
    
    # Build folder path: /books/Author - Title/ (flat, no category subfolder)
    safe_author = sanitize_filename(primary_author)
    safe_title = sanitize_filename(title)
    folder_name = f"{safe_author} - {safe_title}"
    folder_path = os.path.join(books_dir, folder_name)
    
    # Create folder if it doesn't exist
    os.makedirs(folder_path, exist_ok=True)
    
    # Collect file IDs from this book group
    file_ids = [f['id'] for f in book.files]
    
    # Find matching UploadedFile objects
    files_to_move = [f for f in session.files if f.id in file_ids]
    
    files_moved = 0
    for uploaded_file in files_to_move:
        dest_path = os.path.join(folder_path, uploaded_file.original_name)
        
        # Handle duplicate filenames
        base, ext = os.path.splitext(dest_path)
        counter = 1
        while os.path.exists(dest_path):
            dest_path = f"{base}_{counter}{ext}"
            counter += 1
        
        # Move file
        shutil.move(uploaded_file.temp_path, dest_path)
        files_moved += 1
    
    # Create edition record pointing to this folder
    # Get the primary file for the edition
    primary_file = files_to_move[0].original_name if files_to_move else None
    
    await db.execute("""
        INSERT INTO editions (title_id, format, folder_path, file_path, created_at)
        VALUES (?, 'ebook', ?, ?, datetime('now'))
    """, (title_id, folder_path, os.path.join(folder_path, primary_file) if primary_file else None))
    
    await db.commit()
    
    return {
        'id': book_id,
        'status': 'format_added',
        'folder': folder_path,
        'files_added': files_moved,
        'message': f'Added {files_moved} file(s) to existing title'
    }


def sanitize_filename(name: str) -> str:
    """Remove or replace characters that are invalid in filenames."""
    # Remove/replace problematic characters
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        name = name.replace(char, '')
    # Replace multiple spaces with single space
    name = ' '.join(name.split())
    # Limit length
    return name[:100].strip()


async def create_title_from_upload(
    db,
    title: str,
    author: str,
    series: str,
    series_number: str,
    category: str,
    folder_path: str,
    file_path: str = None
) -> int:
    """
    Create a title record from upload data.
    This ensures user's category selection is saved before sync runs.
    Returns the title_id.
    """
    # Parse author into list
    authors = [a.strip() for a in (author or '').split(',') if a.strip()] or ['Unknown Author']
    
    # Generate cover colors
    color1, color2 = generate_cover_colors(title, authors[0])
    
    # Check if title already exists for this folder (avoid duplicates)
    cursor = await db.execute(
        """SELECT t.id FROM titles t
           JOIN editions e ON e.title_id = t.id
           WHERE e.folder_path = ?""",
        [folder_path]
    )
    existing = await cursor.fetchone()
    
    if existing:
        # Title exists, just update category if different
        await db.execute(
            "UPDATE titles SET category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [category or 'Uncategorized', existing[0]]
        )
        await db.commit()
        return existing[0]
    
    # Insert new title with user's category
    cursor = await db.execute(
        """INSERT OR IGNORE INTO titles 
            (title, authors, series, series_number, category,
             cover_color_1, cover_color_2)
        VALUES (?, ?, ?, ?, ?, ?, ?)""",
        [
            title,
            json.dumps(authors),
            series or None,
            series_number or None,
            category or 'Uncategorized',
            color1,
            color2
        ]
    )
    title_id = cursor.lastrowid
    
    # Handle race condition: if INSERT was ignored, lastrowid may be 0 or stale
    # Re-check for existing title by folder_path (another process may have created it)
    if not title_id or title_id == 0:
        cursor = await db.execute(
            """SELECT t.id FROM titles t
               JOIN editions e ON e.title_id = t.id
               WHERE e.folder_path = ?""",
            [folder_path]
        )
        existing = await cursor.fetchone()
        if existing:
            title_id = existing[0]
        else:
            # No existing title found - this shouldn't happen, but handle gracefully
            # Try a regular insert (will fail with proper error if there's an issue)
            cursor = await db.execute(
                """INSERT INTO titles 
                    (title, authors, series, series_number, category,
                     cover_color_1, cover_color_2)
                VALUES (?, ?, ?, ?, ?, ?, ?)""",
                [
                    title,
                    json.dumps(authors),
                    series or None,
                    series_number or None,
                    category or 'Uncategorized',
                    color1,
                    color2
                ]
            )
            title_id = cursor.lastrowid
    
    # Insert edition (use OR IGNORE in case of race condition on edition too)
    await db.execute(
        """INSERT OR IGNORE INTO editions (title_id, format, file_path, folder_path, acquired_date)
        VALUES (?, 'ebook', ?, ?, CURRENT_TIMESTAMP)""",
        [title_id, file_path, folder_path]
    )
    
    await db.commit()
    return title_id


@router.post("/finalize-batch", response_model=FinalizeResponse)
async def finalize_batch_endpoint(
    request: FinalizeRequest,
    background_tasks: BackgroundTasks = None,
    db = Depends(get_db)
):
    """
    Finalize the upload - move files to NAS.
    
    Each book can have an action:
    - 'new': Create new book folder
    - 'add_format': Add files to existing book folder (folder-based duplicate)
    - 'add_to_existing': Add files to existing title in database
    - 'replace': Delete existing and create new
    - 'skip': Don't upload this book
    
    After successful upload, triggers a library sync in the background.
    """
    session = get_session(request.session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found or expired"
        )
    
    try:
        results = []
        
        # Handle add_to_existing separately (needs database access)
        add_to_existing_books = [b for b in request.books if b.action == 'add_to_existing']
        other_books = [b for b in request.books if b.action != 'add_to_existing']
        
        # Process add_to_existing books
        for book_action in add_to_existing_books:
            if not book_action.title_id:
                results.append({
                    'id': book_action.id,
                    'status': 'error',
                    'message': 'Missing title_id for add_to_existing action'
                })
                continue
            
            try:
                result = await add_files_to_existing_title(
                    session, book_action.id, book_action.title_id, db, BOOKS_DIR
                )
                results.append(result)
            except Exception as e:
                results.append({
                    'id': book_action.id,
                    'status': 'error',
                    'message': str(e)
                })
        
        # Process other books through normal finalize_batch
        if other_books:
            books_data = [book.dict() for book in other_books]
            other_results = await finalize_batch(session, books_data, BOOKS_DIR)
            
            # Create title records for successfully uploaded books
            # This ensures user's category selection is saved before sync runs
            for i, result in enumerate(other_results):
                if result['status'] == 'created' and result.get('folder'):
                    book_data = books_data[i]
                    try:
                        # Find the primary ebook file in the folder
                        folder_path = result['folder']
                        file_path = None
                        for ext in ['.epub', '.pdf', '.mobi', '.azw3']:
                            import glob
                            # Escape folder_path to handle brackets in series names like [Series 1]
                            matches = glob.glob(f"{glob.escape(folder_path)}/*{ext}")
                            if matches:
                                file_path = matches[0]
                                break
                        
                        await create_title_from_upload(
                            db=db,
                            title=book_data.get('title', 'Unknown Title'),
                            author=book_data.get('author', 'Unknown Author'),
                            series=book_data.get('series'),
                            series_number=book_data.get('series_number'),
                            category=book_data.get('category', 'Uncategorized'),
                            folder_path=folder_path,
                            file_path=file_path
                        )
                    except Exception as e:
                        print(f"Warning: Failed to create title record during upload: {e}")
                        # Don't fail the upload - sync will create it later
            
            results.extend(other_results)
        
        # Clean up session
        cleanup_session(request.session_id)
        
        # Check if any books were actually uploaded (not all skipped/errored)
        books_uploaded = any(r['status'] in ('created', 'format_added') for r in results)
        
        # Trigger library sync in background if we uploaded anything
        sync_triggered = False
        if background_tasks and books_uploaded:
            background_tasks.add_task(trigger_library_sync)
            sync_triggered = True
        
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


def sanitize_filename(name: str) -> str:
    """Remove or replace characters that aren't safe for filenames."""
    # Replace common problematic characters
    replacements = {
        '/': '-',
        '\\': '-',
        ':': '-',
        '*': '',
        '?': '',
        '"': "'",
        '<': '',
        '>': '',
        '|': '-',
    }
    result = name
    for old, new in replacements.items():
        result = result.replace(old, new)
    
    # Remove leading/trailing whitespace and dots
    result = result.strip().strip('.')
    
    # Collapse multiple spaces/dashes
    result = re.sub(r'[\s]+', ' ', result)
    result = re.sub(r'-+', '-', result)
    
    return result[:200]  # Limit length


@router.post("/link-to-title", response_model=LinkToTitleResponse)
async def link_files_to_title(
    request: LinkToTitleRequest,
    background_tasks: BackgroundTasks = None,
    db = Depends(get_db)
):
    """
    Link uploaded files to an existing title (TBR → Library conversion).
    
    This endpoint:
    1. Gets the uploaded files from the session
    2. Moves them to the appropriate NAS folder
    3. Creates an ebook edition for the existing title
    4. Converts the title from TBR to library (is_tbr = 0)
    """
    session = get_session(request.session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Upload session not found or expired"
        )
    
    # Get the title from database
    cursor = await db.execute("SELECT * FROM titles WHERE id = ?", [request.title_id])
    title_row = await cursor.fetchone()
    
    if not title_row:
        raise HTTPException(status_code=404, detail="Title not found")
    
    try:
        # Parse existing data
        title = title_row["title"]
        authors_json = title_row["authors"]
        authors = json.loads(authors_json) if authors_json else ["Unknown Author"]
        primary_author = authors[0] if authors else "Unknown Author"
        category = title_row["category"] or "Fiction"
        
        # Create folder name: "Author - Title"
        safe_author = sanitize_filename(primary_author)
        safe_title = sanitize_filename(title)
        folder_name = f"{safe_author} - {safe_title}"
        
        # Destination is flat: /books/Author - Title/ (no category subfolder)
        dest_folder = Path(BOOKS_DIR) / folder_name
        
        # Create destination folder
        dest_folder.mkdir(parents=True, exist_ok=True)
        
        # Get all file IDs from all book groups in session
        all_file_ids = set()
        for book in session.books:
            for f in book.files:
                all_file_ids.add(f['id'])
        
        # Find actual UploadedFile objects from session.files
        files_to_move = [f for f in session.files if f.id in all_file_ids]
        
        # Move all files from session to destination
        moved_files = []
        for uploaded_file in files_to_move:
            if os.path.exists(uploaded_file.temp_path):
                dest_path = dest_folder / uploaded_file.original_name
                shutil.move(uploaded_file.temp_path, str(dest_path))
                moved_files.append(str(dest_path))
        
        # Create edition record
        file_path = moved_files[0] if moved_files else None
        await db.execute("""
            INSERT INTO editions (title_id, format, file_path, folder_path, acquired_date)
            VALUES (?, 'ebook', ?, ?, DATE('now'))
        """, [request.title_id, file_path, str(dest_folder)])
        
        # Convert from TBR to library
        await db.execute("""
            UPDATE titles 
            SET is_tbr = 0, 
                status = 'Unread',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, [request.title_id])
        
        await db.commit()
        
        # Clean up session
        cleanup_session(request.session_id)
        
        # Trigger library sync in background
        if background_tasks:
            background_tasks.add_task(trigger_library_sync)
        
        return LinkToTitleResponse(
            success=True,
            title_id=request.title_id,
            files_moved=len(moved_files),
            folder_path=str(dest_folder)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def upload_health():
    """Health check for upload service"""
    return {
        "status": "ok",
        "books_dir": BOOKS_DIR,
        "books_dir_exists": os.path.exists(BOOKS_DIR)
    }
