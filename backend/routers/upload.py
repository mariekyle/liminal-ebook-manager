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
import logging
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel

from database import get_db
import aiosqlite
from services.covers import generate_cover_colors
from services.metadata import extract_metadata
from pathlib import Path
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
    MAX_FILE_SIZE,
    ALLOWED_EXTENSIONS,
    BookGroup,
)

from constants import EXTENSION_TO_FORMAT, STORAGE_FORMATS

# Standalone sync function + shared per-format file discovery (S15)
from routers.sync import run_sync_standalone, discover_book_files

router = APIRouter(prefix="/upload", tags=["upload"])

# Configure your NAS books directory
BOOKS_DIR = os.environ.get("BOOKS_DIR", "/books")

logger = logging.getLogger(__name__)


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


class RejectedFile(BaseModel):
    filename: str
    reason: str


class AnalyzeResponse(BaseModel):
    # None when all files were rejected during validation; otherwise the
    # temp-session ID used by /finalize-batch.
    session_id: Optional[str] = None
    books: list[BookInfo]
    total_files: int
    total_size: int
    rejected_files: list[RejectedFile] = []


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
    title_id: Optional[int] = None  # Database title ID for navigation


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
    # S15.2b: same-format duplicate files kept on disk but not recorded as
    # editions (alphabetical pick, as in sync). Additive — older clients
    # ignore it.
    skipped_duplicates: list[str] = []


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
        # _do_sync absorbs its own crashes into a status='error' result, so
        # the except below no longer sees them — check the status instead
        if result.status == "error":
            print(f"Background sync failed: {result.message}")
        else:
            print(f"Background sync complete: {result.message}")
    except Exception as e:
        print(f"Background sync failed: {e}")


# =============================================================================
# FORMAT-AWARE EDITION RECORDING (S15.2b)
# =============================================================================

def group_moved_files_by_format(moved_paths: list[str]) -> tuple[dict, list[str]]:
    """
    One moved file per storage format, mirroring sync's discover_book_files:
    the alphabetically first file wins within a format and the rest are
    skipped — deterministic pick, locked decision (Decisions 2026-07-10).
    '.htm' normalizes to 'html' via EXTENSION_TO_FORMAT.

    Returns ({storage_format: path}, [skipped paths]).
    """
    files_by_format = {}
    skipped = []
    for path in sorted(moved_paths, key=os.path.basename):
        name = os.path.basename(path)
        # Hidden files excluded, as in sync's discover_book_files — an
        # AppleDouble-style "._x.epub" name must not win the pick
        if name.startswith('.'):
            continue
        storage_format = EXTENSION_TO_FORMAT.get(os.path.splitext(name)[1].lower())
        if storage_format is None:
            # Unreachable behind validate_file's extension gate — skip, don't crash
            continue
        if storage_format in files_by_format:
            skipped.append(path)
        else:
            files_by_format[storage_format] = path
    return files_by_format, skipped


async def insert_editions_per_format(
    db, title_id: int, files_by_format: dict, folder_path: str
) -> tuple[list, list, bool]:
    """
    One edition per storage format (sync's model), guarded two ways:

    - Aborted-relabel defer, same rule as sync's: a file-backed legacy
      'ebook' edition on the title means the S15 relabel migration hasn't
      succeeded here. Writing storage-format rows now would duplicate those
      files AND permanently block the relabel (unique-index collision at
      every startup) — nothing is inserted and deferred=True so callers
      can surface it.
    - IntegrityError backstop per insert: a collision on the
      UNIQUE(title_id, format) index means the format is already recorded
      — the existing edition wins, mirroring sync.

    Does not commit — callers own the transaction.
    Returns (created_formats, collided_formats, deferred).
    """
    cursor = await db.execute(
        "SELECT id FROM editions WHERE title_id = ? AND format = 'ebook' AND file_path IS NOT NULL",
        [title_id]
    )
    if await cursor.fetchone():
        print(
            f"Upload: title {title_id} still has a file-backed 'ebook' edition "
            f"(relabel migration pending) — edition recording deferred"
        )
        return [], [], True

    created = []
    collided = []
    for storage_format, format_file_path in files_by_format.items():
        try:
            await db.execute(
                """INSERT INTO editions (title_id, format, file_path, folder_path, acquired_date)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)""",
                [title_id, storage_format, format_file_path, folder_path]
            )
            created.append(storage_format)
        except aiosqlite.IntegrityError:
            collided.append(storage_format)
            print(
                f"Upload: edition already recorded for title {title_id} "
                f"({storage_format}) — kept the existing one"
            )
    return created, collided, False


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
    
    # Create session
    session = create_session()
    
    try:
        # Save and validate each file; collect rejections instead of silently skipping
        uploaded_files = []
        rejected_files: list[RejectedFile] = []
        for upload_file in files:
            is_valid, error = validate_file(upload_file.filename, upload_file.size or 0)
            if not is_valid:
                rejected_files.append(RejectedFile(
                    filename=upload_file.filename or "",
                    reason=error
                ))
                continue
            
            content = await upload_file.read()
            uploaded = await save_uploaded_file(session, upload_file.filename, content)
            uploaded_files.append(uploaded)
        
        # If everything was rejected, return 200 with empty books + rejection details
        # so the frontend can show per-file errors instead of a generic banner
        if not uploaded_files:
            cleanup_session(session.id)
            return AnalyzeResponse(
                session_id=None,
                books=[],
                total_files=0,
                total_size=0,
                rejected_files=rejected_files,
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
            total_size=sum(f.size for f in uploaded_files),
            rejected_files=rejected_files,
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
    moved_paths = []
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
        moved_paths.append(dest_path)
        files_moved += 1

    # One edition per storage format of the moved files (S15.2b — sync's
    # model, replacing the single first-file 'ebook' record). Paths are the
    # actual destinations, so collision-renamed files ("_1" suffix) record
    # correctly.
    files_by_format, skipped_paths = group_moved_files_by_format(moved_paths)
    message_parts = [f'Added {files_moved} file(s) to existing title']
    if files_by_format:
        created, collided, deferred = await insert_editions_per_format(
            db, title_id, files_by_format, folder_path
        )
        if deferred:
            message_parts.append(
                'edition records deferred — run a full sync after the format migration succeeds'
            )
        elif collided:
            message_parts.append(
                'already recorded, kept the existing edition: ' + ', '.join(collided)
            )
    if skipped_paths:
        message_parts.append(
            'same-format duplicates kept but not recorded: '
            + ', '.join(os.path.basename(p) for p in skipped_paths)
        )

    await db.commit()

    return {
        'id': book_id,
        'status': 'format_added',
        'folder': folder_path,
        'files_added': files_moved,
        'message': '; '.join(message_parts),
        'title_id': title_id
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
    file_path: str = None,
    files_by_format: dict = None
) -> int:
    """
    Create a title record from upload data with full metadata extraction.
    This ensures user's category selection is saved and metadata is extracted
    immediately, without depending on background sync.

    files_by_format ({storage_format: path}) drives edition creation — one
    edition per storage format (S15.2b); file_path stays the metadata source.
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
        # Record any formats this upload landed that aren't editions yet —
        # incremental sync skips folders that already have editions, so a
        # missed format would stay invisible until a full sync (S15.2b).
        # Collisions and the relabel-defer case are expected here and
        # handled (and logged) inside the helper.
        if files_by_format:
            await insert_editions_per_format(
                db, existing[0], files_by_format, folder_path
            )
        await db.commit()
        return existing[0]
    
    # Extract metadata from the ebook file
    metadata = {}
    if file_path and Path(file_path).exists():
        try:
            metadata = await extract_metadata(Path(file_path))
            print(f"Extracted metadata for {title}: fandom={metadata.get('fandom')}, has_ships={bool(metadata.get('relationships'))}")
        except Exception as e:
            print(f"Metadata extraction failed for {title}: {e}")
            metadata = {}
    
    # Use extracted metadata, falling back to upload form values
    final_title = metadata.get('title') or title
    final_series = series or metadata.get('series')
    final_series_number = series_number or metadata.get('series_number')
    final_summary = metadata.get('summary')
    final_tags = json.dumps(metadata.get('tags', []))
    final_word_count = metadata.get('word_count')
    final_publication_year = metadata.get('publication_year')
    
    # Enhanced metadata fields
    fandom = metadata.get('fandom')
    relationships = metadata.get('relationships')
    characters = metadata.get('characters')
    content_rating = metadata.get('content_rating')
    ao3_warnings = metadata.get('ao3_warnings')
    ao3_category = metadata.get('ao3_category')
    source_url = metadata.get('source_url')
    isbn = metadata.get('isbn')
    publisher = metadata.get('publisher')
    chapter_count = metadata.get('chapter_count')
    completion_status = metadata.get('completion_status')
    
    # Insert new title with all metadata
    cursor = await db.execute(
        """INSERT OR IGNORE INTO titles 
            (title, authors, series, series_number, category,
             publication_year, word_count, summary, tags,
             cover_color_1, cover_color_2,
             fandom, relationships, characters, content_rating,
             ao3_warnings, ao3_category, source_url, isbn, publisher,
             chapter_count, completion_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        [
            final_title,
            json.dumps(authors),
            final_series,
            final_series_number,
            category or 'Uncategorized',
            final_publication_year,
            final_word_count,
            final_summary,
            final_tags,
            color1,
            color2,
            fandom,
            relationships,
            characters,
            content_rating,
            ao3_warnings,
            ao3_category,
            source_url,
            isbn,
            publisher,
            chapter_count,
            completion_status
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
                     publication_year, word_count, summary, tags,
                     cover_color_1, cover_color_2,
                     fandom, relationships, characters, content_rating,
                     ao3_warnings, ao3_category, source_url, isbn, publisher,
                     chapter_count, completion_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                [
                    final_title,
                    json.dumps(authors),
                    final_series,
                    final_series_number,
                    category or 'Uncategorized',
                    final_publication_year,
                    final_word_count,
                    final_summary,
                    final_tags,
                    color1,
                    color2,
                    fandom,
                    relationships,
                    characters,
                    content_rating,
                    ao3_warnings,
                    ao3_category,
                    source_url,
                    isbn,
                    publisher,
                    chapter_count,
                    completion_status
                ]
            )
            title_id = cursor.lastrowid
    
    # One edition per discovered storage format (S15.2b — sync's model,
    # replacing the single OR-IGNORE 'ebook' insert whose dedupe stopped
    # working once uploads write storage formats). The helper's guards
    # cover the race where title_id resolved to an existing title. Falls
    # back to a single file-less 'ebook' edition when no recognized file
    # was found, preserving the pre-S15 shape (title still reads as an
    # owned ebook).
    if files_by_format:
        await insert_editions_per_format(db, title_id, files_by_format, folder_path)
    else:
        try:
            await db.execute(
                """INSERT INTO editions (title_id, format, file_path, folder_path, acquired_date)
                VALUES (?, 'ebook', ?, ?, CURRENT_TIMESTAMP)""",
                [title_id, file_path, folder_path]
            )
        except aiosqlite.IntegrityError:
            print(
                f"Upload: edition already recorded for title {title_id} (ebook) "
                f"— kept the existing one"
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
            
            # Process results: create titles for new books, look up title_id for format_added
            for i, result in enumerate(other_results):
                folder_path = result.get('folder')
                
                if result['status'] == 'created' and folder_path:
                    # Create title record for new books
                    book_data = books_data[i]
                    try:
                        # Every recognized file in the new folder, one per
                        # storage format — shared discovery with sync
                        # (S15.2b; replaces a glob loop that missed
                        # .azw/.html/.htm and left file_path=None)
                        discovered, duplicate_files = discover_book_files(Path(folder_path))
                        files_by_format = {
                            storage_format: str(path)
                            for storage_format, path in discovered.items()
                        }
                        # Best file for metadata extraction (epub-preferred
                        # order, as in sync)
                        file_path = next(
                            (files_by_format[f] for f in STORAGE_FORMATS if f in files_by_format),
                            None
                        )

                        title_id = await create_title_from_upload(
                            db=db,
                            title=book_data.get('title', 'Unknown Title'),
                            author=book_data.get('author', 'Unknown Author'),
                            series=book_data.get('series'),
                            series_number=book_data.get('series_number'),
                            category=book_data.get('category', 'Uncategorized'),
                            folder_path=folder_path,
                            file_path=file_path,
                            files_by_format=files_by_format
                        )
                        # Add title_id to result for frontend navigation
                        result['title_id'] = title_id
                        if duplicate_files:
                            result['message'] = (
                                'same-format duplicates kept but not recorded: '
                                + ', '.join(p.name for p in duplicate_files)
                            )
                    except Exception as e:
                        print(f"Warning: Failed to create title record during upload: {e}")
                        # Don't fail the upload - sync will create it later
                
                elif result['status'] == 'format_added' and folder_path:
                    # Look up existing title_id by folder_path for format_added
                    try:
                        cursor = await db.execute(
                            """SELECT t.id FROM titles t
                               JOIN editions e ON e.title_id = t.id
                               WHERE e.folder_path = ?""",
                            [folder_path]
                        )
                        row = await cursor.fetchone()
                        if row:
                            result['title_id'] = row[0]
                            # Record the landed files' formats as editions
                            # (S15.2b) — this path previously recorded
                            # nothing, and incremental sync skips folders
                            # that already have editions, so new formats
                            # stayed invisible until a full sync
                            files_by_format, skipped_paths = group_moved_files_by_format(
                                result.get('moved_files') or []
                            )
                            message_parts = []
                            if files_by_format:
                                created, collided, deferred = await insert_editions_per_format(
                                    db, row[0], files_by_format, folder_path
                                )
                                await db.commit()
                                if deferred:
                                    message_parts.append(
                                        'edition records deferred — run a full sync '
                                        'after the format migration succeeds'
                                    )
                                elif collided:
                                    message_parts.append(
                                        'already recorded, kept the existing edition: '
                                        + ', '.join(collided)
                                    )
                            if skipped_paths:
                                message_parts.append(
                                    'same-format duplicates kept but not recorded: '
                                    + ', '.join(os.path.basename(p) for p in skipped_paths)
                                )
                            if message_parts:
                                result['message'] = '; '.join(message_parts)
                    except Exception as e:
                        print(f"Warning: Failed to look up title_id for format_added: {e}")
            
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
                message=r.get('message'),
                title_id=r.get('title_id')
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

        # One edition per storage format of the moved files (S15.2b — sync's
        # model, replacing the single first-file 'ebook' record)
        files_by_format, skipped_paths = group_moved_files_by_format(moved_files)
        for skipped in skipped_paths:
            logger.info(
                f"Link-to-title: same-format duplicate kept but not recorded: {skipped}"
            )

        # Atomically (a) create editions if needed, (b) convert wishlist -> owned if needed.
        await db.execute("BEGIN")
        try:
            if files_by_format:
                # Defer and collision cases are handled (and logged) inside
                # the helper; the background sync's results view surfaces
                # deferred titles after this endpoint returns
                await insert_editions_per_format(
                    db, request.title_id, files_by_format, str(dest_folder)
                )
            else:
                # No recognized files moved — keep the pre-S15 file-less
                # 'ebook' marker so the converted title still reads as an
                # owned ebook
                try:
                    await db.execute(
                        """
                        INSERT INTO editions (title_id, format, file_path, folder_path, acquired_date)
                        VALUES (?, 'ebook', NULL, ?, DATE('now'))
                        """,
                        [request.title_id, str(dest_folder)],
                    )
                except aiosqlite.IntegrityError:
                    logger.info(
                        f"Edition already exists for title {request.title_id} format ebook, skipping insert"
                    )

            cursor = await db.execute(
                "SELECT is_tbr, acquisition_status, status FROM titles WHERE id = ?",
                [request.title_id],
            )
            state = await cursor.fetchone()
            if state:
                is_tbr = bool(state["is_tbr"]) if "is_tbr" in state.keys() else bool(state[0])
                acquisition_status = (
                    state["acquisition_status"]
                    if "acquisition_status" in state.keys()
                    else state[1]
                )
                should_convert = is_tbr or acquisition_status == "wishlist"
                if should_convert:
                    await db.execute(
                        """
                        UPDATE titles
                        SET is_tbr = 0,
                            acquisition_status = 'owned',
                            status = COALESCE(NULLIF(status, ''), 'Unread'),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                        """,
                        [request.title_id],
                    )
                    logger.info(
                        f"Auto-converted TBR title {request.title_id} to library during file link"
                    )

            await db.commit()
        except Exception:
            await db.rollback()
            raise
        
        # Clean up session
        cleanup_session(request.session_id)
        
        # Trigger library sync in background
        if background_tasks:
            background_tasks.add_task(trigger_library_sync)
        
        return LinkToTitleResponse(
            success=True,
            title_id=request.title_id,
            files_moved=len(moved_files),
            folder_path=str(dest_folder),
            skipped_duplicates=[os.path.basename(p) for p in skipped_paths]
        )
        
    except Exception as e:
        logger.error(f"Link-to-title failed for title {request.title_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Something went wrong linking these files. Please try again.",
        )


@router.get("/limits")
async def upload_limits():
    """Return upload constraints so frontend can pre-validate before sending bytes."""
    return {
        "max_file_size": MAX_FILE_SIZE,
        "max_file_size_mb": MAX_FILE_SIZE // (1024 * 1024),
        "allowed_extensions": sorted(ALLOWED_EXTENSIONS),
    }


@router.get("/health")
async def upload_health():
    """Health check for upload service"""
    return {
        "status": "ok",
        "books_dir": BOOKS_DIR,
        "books_dir_exists": os.path.exists(BOOKS_DIR)
    }
