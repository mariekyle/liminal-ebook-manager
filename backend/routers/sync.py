"""
Sync API Router

Handles scanning book folders and importing/updating library data.
This is where the magic happens - reading your book folders and extracting metadata.

Phase 5 update: Now creates titles + editions instead of flat books table.
"""

import os
import json
import re
import aiosqlite
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel

from database import get_db, get_db_path
from services.metadata import extract_metadata
from services.covers import generate_cover_colors

router = APIRouter(tags=["sync"])

# Get books path from environment
BOOKS_PATH = os.getenv("BOOKS_PATH", "/books")


class SyncResult(BaseModel):
    """Result of a sync operation."""
    status: str
    added: int = 0
    updated: int = 0
    skipped: int = 0
    errors: int = 0
    total: int = 0
    orphaned: int = 0      # Titles marked as orphaned (folder missing)
    recovered: int = 0     # Previously orphaned titles now found
    message: str = ""


class SyncStatus(BaseModel):
    """Current sync status (for progress tracking)."""
    in_progress: bool
    current_book: Optional[str] = None
    current_operation: Optional[str] = None  # "sync" or "rescan"
    processed: int = 0
    total: int = 0


# Simple in-memory sync status (could be Redis for multi-worker setups)
_sync_status = SyncStatus(in_progress=False)


# --------------------------------------------------------------------------
# Folder Name Parsing (ported from Obsidian plugin)
# --------------------------------------------------------------------------

def parse_folder_name(folder_name: str) -> dict:
    """
    Parse book information from folder name.
    
    Supports formats:
    - "Author - [Series ##] Title"
    - "Author - [Series ##]Title" (no space after bracket)
    - "Author1, Author2 - [Series ##] Title"
    - "Author - Title"
    - "Author1, Author2 - Title"
    
    Returns dict with: title, authors, series, series_number
    """
    result = {
        "title": folder_name,
        "authors": [],
        "series": None,
        "series_number": None
    }
    
    # Split on " - " to separate author from rest
    dash_index = folder_name.find(" - ")
    
    if dash_index > 0:
        authors_part = folder_name[:dash_index]
        rest_part = folder_name[dash_index + 3:]
        
        # Parse multiple authors (separated by &, "and", or comma)
        authors = re.split(r'[&,]|(?:\sand\s)', authors_part, flags=re.IGNORECASE)
        result["authors"] = [a.strip() for a in authors if a.strip()]
        
        # Check for series format: [Series name ##] or [Series name ##]Title
        series_match = re.match(r'^\[(.*?)\s+(\d+(?:\.\d+)?)\]\s*(.+)$', rest_part)
        
        if series_match:
            result["series"] = series_match.group(1).strip()
            result["series_number"] = series_match.group(2)
            result["title"] = series_match.group(3).strip()
        else:
            result["title"] = rest_part
    else:
        # No author in folder name
        result["authors"] = ["Unknown Author"]
    
    return result


def folder_contains_books(folder_path: Path) -> bool:
    """Check if a folder contains book files."""
    book_extensions = {'.epub', '.pdf', '.mobi', '.azw3'}
    
    try:
        for item in folder_path.iterdir():
            if item.is_file() and item.suffix.lower() in book_extensions:
                return True
    except PermissionError:
        pass
    
    return False


def find_book_file(folder_path: Path) -> Optional[Path]:
    """
    Find the best book file in a folder for metadata extraction.
    Prefers EPUB (best metadata), then PDF, then others.
    """
    epub_files = list(folder_path.glob("*.epub"))
    if epub_files:
        return epub_files[0]
    
    pdf_files = list(folder_path.glob("*.pdf"))
    if pdf_files:
        return pdf_files[0]
    
    for ext in ["*.mobi", "*.azw3"]:
        files = list(folder_path.glob(ext))
        if files:
            return files[0]
    
    return None


def get_book_folders(root_path: Path) -> list[Path]:
    """
    Recursively find all folders containing book files.
    
    This handles nested structures like:
    - Fiction/Author Name/Book Title/
    - Fiction/Author - [Series] Title/
    """
    book_folders = []
    
    try:
        for item in root_path.iterdir():
            # Skip hidden folders
            if item.name.startswith('.'):
                continue
            
            if item.is_dir():
                if folder_contains_books(item):
                    book_folders.append(item)
                else:
                    # Recurse into subdirectories
                    book_folders.extend(get_book_folders(item))
    except PermissionError:
        pass
    
    return book_folders


async def find_existing_title_by_content(db, title: str, authors: list[str]) -> Optional[dict]:
    """
    Find existing title by title and first author.
    Used to preserve category when folder paths change.
    """
    if not authors:
        return None
    
    first_author = authors[0]
    cursor = await db.execute(
        """SELECT t.id, t.category 
           FROM titles t
           WHERE t.title = ? AND t.authors LIKE ?""",
        [title, f'%"{first_author}"%']
    )
    return await cursor.fetchone()


async def find_existing_title_by_folder(db, folder_str: str) -> Optional[dict]:
    """
    Find existing title by folder path (via editions table).
    """
    cursor = await db.execute(
        """SELECT t.id, t.category 
           FROM titles t
           JOIN editions e ON e.title_id = t.id
           WHERE e.folder_path = ?""",
        [folder_str]
    )
    return await cursor.fetchone()


def detect_fanfiction(parsed: dict, authors: list[str]) -> tuple[bool, str]:
    """
    Detect if a book is likely FanFiction based on metadata patterns.
    
    Returns:
        tuple: (is_fanfiction: bool, reason: str)
    """
    reasons = []
    
    # --- Check tags ---
    tags = parsed.get("tags", [])
    if tags:
        tags_lower = [t.lower() if isinstance(t, str) else "" for t in tags]
        
        fanfic_tag_patterns = [
            "fanworks", "fanfiction", "fanfic", "ao3", "archive of our own",
            "fandom", "fan fiction", "transformative work"
        ]
        for pattern in fanfic_tag_patterns:
            if any(pattern in tag for tag in tags_lower):
                reasons.append(f"tag contains '{pattern}'")
                break
        
        # Ship patterns: "Character/Character" or "Character x Character"
        ship_patterns = [
            r'\w+\s*/\s*\w+',  # Name/Name
            r'\w+\s*x\s*\w+',  # Name x Name  
        ]
        for tag in tags_lower:
            for pattern in ship_patterns:
                if re.search(pattern, tag, re.IGNORECASE):
                    reasons.append("ship tag detected")
                    break
            if reasons:
                break
    
    # --- Check author patterns ---
    if authors:
        for author in authors:
            author_lower = author.lower()
            # Username patterns
            if re.search(r'^\w+_\w+$', author):  # underscore_style
                reasons.append(f"author '{author}' looks like username")
            elif re.search(r'^\w+\d{2,}$', author):  # name followed by numbers
                reasons.append(f"author '{author}' has number suffix")
    
    # --- Check summary ---
    summary = parsed.get("summary", "")
    if summary:
        summary_lower = summary.lower()
        fanfic_summary_patterns = [
            "ao3", "archive of our own", "fanfiction", "fanfic",
            "between chapters", "one-shot", "oneshot",
            "based on", "inspired by", "au where", "alternate universe",
            "kudos", "bookmarks"
        ]
        for pattern in fanfic_summary_patterns:
            if pattern in summary_lower:
                reasons.append(f"summary contains '{pattern}'")
                break
    
    # --- Check title patterns ---
    title = parsed.get("title", "")
    if title:
        title_lower = title.lower()
        # Common fanfic title patterns
        if re.search(r'\[.*?\]', title):  # Brackets in title
            if any(x in title_lower for x in ["wip", "complete", "abandoned", "hiatus"]):
                reasons.append("title has fanfic status markers")
    
    is_fanfic = len(reasons) > 0
    reason = "; ".join(reasons) if reasons else ""
    
    return is_fanfic, reason


def determine_category_from_path(folder_path: Path, root_path: Path) -> Optional[str]:
    """
    Determine book category from folder path structure.
    Checks if any part of the path contains Fiction, Non-Fiction, or FanFiction.
    """
    relative_path = folder_path.relative_to(root_path)
    path_parts = str(relative_path).lower().split(os.sep)
    
    # Check each part of the path for category indicators
    for part in path_parts:
        if 'fanfiction' in part or 'fan-fiction' in part or 'fan fiction' in part:
            return 'FanFiction'
        elif 'non-fiction' in part or 'nonfiction' in part or 'non fiction' in part:
            return 'Non-Fiction'
        elif 'fiction' in part:
            return 'Fiction'
    
    return None


# --------------------------------------------------------------------------
# Standalone Sync (for background tasks)
# --------------------------------------------------------------------------

async def run_sync_standalone(full: bool = False) -> SyncResult:
    """
    Run sync operation with its own database connection.
    Used by background tasks that can't use FastAPI's Depends.
    """
    db_path = get_db_path()
    if not db_path:
        return SyncResult(status="error", message="Database not initialized")
    
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA foreign_keys = ON")
        return await _do_sync(db, full)


async def _do_sync(db, full: bool = False) -> SyncResult:
    """Core sync logic, shared between endpoint and standalone."""
    global _sync_status
    
    books_root = Path(BOOKS_PATH)
    
    if not books_root.exists():
        return SyncResult(
            status="error",
            message=f"Books path does not exist: {BOOKS_PATH}"
        )
    
    # Find all book folders
    book_folders = get_book_folders(books_root)
    
    if not book_folders:
        return SyncResult(
            status="complete",
            message="No book folders found"
        )
    
    # Update sync status
    _sync_status = SyncStatus(
        in_progress=True,
        total=len(book_folders)
    )
    
    result = SyncResult(status="complete", total=len(book_folders))
    
    # Track all found folder paths for orphan detection
    found_folder_paths = set()
    
    try:
        for folder in book_folders:
            _sync_status.current_book = folder.name
            _sync_status.processed += 1
            
            folder_str = str(folder)
            found_folder_paths.add(folder_str)  # Track this folder
            
            # Check if title already exists by folder_path (via editions)
            existing = await find_existing_title_by_folder(db, folder_str)
            existing_category = None
            
            if not existing:
                # Folder path changed - try matching by title+author
                parsed_temp = parse_folder_name(folder.name)
                
                if parsed_temp["authors"] and parsed_temp["authors"] != ["Unknown Author"]:
                    existing = await find_existing_title_by_content(
                        db, 
                        parsed_temp["title"], 
                        parsed_temp["authors"]
                    )
                    if existing:
                        existing_category = existing["category"]
                        print(f"Matched existing title by content: {parsed_temp['title']}")
            elif existing:
                existing_category = existing["category"] if "category" in existing.keys() else None
            
            if existing and not full:
                # For non-full sync, check if edition with this folder already exists
                cursor = await db.execute(
                    "SELECT id FROM editions WHERE folder_path = ?",
                    [folder_str]
                )
                if await cursor.fetchone():
                    result.skipped += 1
                    continue
            
            try:
                # Parse folder name for basic info
                parsed = parse_folder_name(folder.name)
                
                # Find book file for metadata extraction
                book_file = find_book_file(folder)
                
                # Try to extract richer metadata from the file
                if book_file:
                    try:
                        file_metadata = await extract_metadata(book_file)
                        # Merge: prefer extracted over parsed
                        if file_metadata.get("publication_year"):
                            parsed["publication_year"] = file_metadata["publication_year"]
                        if file_metadata.get("summary"):
                            parsed["summary"] = file_metadata["summary"]
                        if file_metadata.get("tags"):
                            parsed["tags"] = file_metadata["tags"]
                        if file_metadata.get("word_count"):
                            parsed["word_count"] = file_metadata["word_count"]
                    except Exception as e:
                        print(f"Metadata extraction failed for {book_file}: {e}")
                
                # Generate cover colors
                author_for_color = parsed["authors"][0] if parsed["authors"] else "Unknown"
                color1, color2 = generate_cover_colors(parsed["title"], author_for_color)
                
                # Determine category
                if existing_category:
                    category = existing_category
                else:
                    category = determine_category_from_path(folder, books_root)
                    
                    if not category:
                        is_fanfic, detection_reason = detect_fanfiction(parsed, parsed.get("authors", []))
                        if is_fanfic:
                            category = "FanFiction"
                            print(f"Auto-detected FanFiction: {parsed.get('title', folder.name)} - Reason: {detection_reason}")
                        else:
                            category = "Uncategorized"
                
                if existing:
                    # Check if this was previously orphaned (for recovery tracking)
                    cursor = await db.execute(
                        "SELECT is_orphaned FROM titles WHERE id = ?",
                        [existing["id"]]
                    )
                    orphan_row = await cursor.fetchone()
                    was_orphaned = orphan_row and orphan_row["is_orphaned"] == 1
                    
                    # Update existing title (and recover if orphaned)
                    await db.execute(
                        """UPDATE titles SET
                            title = ?, authors = ?, series = ?, series_number = ?,
                            category = ?, publication_year = ?, word_count = ?,
                            summary = ?, tags = ?,
                            cover_color_1 = ?, cover_color_2 = ?,
                            is_orphaned = 0,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?""",
                        [
                            parsed["title"], json.dumps(parsed["authors"]),
                            parsed.get("series"), parsed.get("series_number"),
                            category, parsed.get("publication_year"),
                            parsed.get("word_count"), parsed.get("summary"),
                            json.dumps(parsed.get("tags", [])),
                            color1, color2,
                            existing["id"]
                        ]
                    )
                    
                    if was_orphaned:
                        result.recovered += 1
                        print(f"Recovered orphaned title: {parsed['title']}")
                    
                    # Update or create edition
                    cursor = await db.execute(
                        "SELECT id FROM editions WHERE title_id = ? AND format = 'ebook'",
                        [existing["id"]]
                    )
                    existing_edition = await cursor.fetchone()
                    
                    if existing_edition:
                        await db.execute(
                            """UPDATE editions SET
                                file_path = ?, folder_path = ?
                            WHERE id = ?""",
                            [str(book_file) if book_file else None, folder_str, existing_edition["id"]]
                        )
                    else:
                        await db.execute(
                            """INSERT INTO editions (title_id, format, file_path, folder_path, acquired_date)
                            VALUES (?, 'ebook', ?, ?, CURRENT_TIMESTAMP)""",
                            [existing["id"], str(book_file) if book_file else None, folder_str]
                        )
                    
                    result.updated += 1
                else:
                    # Insert new title
                    cursor = await db.execute(
                        """INSERT INTO titles 
                            (title, authors, series, series_number, category,
                             publication_year, word_count, summary, tags,
                             cover_color_1, cover_color_2)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        [
                            parsed["title"], json.dumps(parsed["authors"]),
                            parsed.get("series"), parsed.get("series_number"),
                            category, parsed.get("publication_year"),
                            parsed.get("word_count"), parsed.get("summary"),
                            json.dumps(parsed.get("tags", [])),
                            color1, color2
                        ]
                    )
                    title_id = cursor.lastrowid
                    
                    # Insert edition
                    await db.execute(
                        """INSERT INTO editions (title_id, format, file_path, folder_path, acquired_date)
                        VALUES (?, 'ebook', ?, ?, CURRENT_TIMESTAMP)""",
                        [title_id, str(book_file) if book_file else None, folder_str]
                    )
                    
                    result.added += 1
                
                await db.commit()
                
            except Exception as e:
                print(f"Error processing {folder}: {e}")
                result.errors += 1
        
        # =====================================================================
        # ORPHAN DETECTION: Find editions with missing folders
        # =====================================================================
        try:
            # Find all editions with folder_path that are NOT in our found_folder_paths
            # Only check ebook editions (they have folder_path), exclude TBR/manual entries
            cursor = await db.execute("""
                SELECT DISTINCT e.folder_path, t.id as title_id, t.title, t.is_orphaned
                FROM editions e
                JOIN titles t ON t.id = e.title_id
                WHERE e.folder_path IS NOT NULL
                  AND t.is_tbr = 0
            """)
            all_editions = await cursor.fetchall()
            
            orphaned_count = 0
            for edition in all_editions:
                folder_path = edition["folder_path"]
                title_id = edition["title_id"]
                title_name = edition["title"]
                already_orphaned = edition["is_orphaned"] == 1
                
                # Check if this folder exists in our found folders
                if folder_path not in found_folder_paths:
                    # Double-check the filesystem (in case of path format differences)
                    if not os.path.exists(folder_path):
                        if not already_orphaned:
                            # Mark as orphaned
                            await db.execute(
                                "UPDATE titles SET is_orphaned = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                                [title_id]
                            )
                            orphaned_count += 1
                            print(f"Marked as orphaned: {title_name} (folder: {folder_path})")
            
            if orphaned_count > 0:
                await db.commit()
                result.orphaned = orphaned_count
        
        except Exception as e:
            print(f"Error during orphan detection: {e}")
        
        # Build result message
        msg_parts = [f"Sync complete: {result.added} added, {result.updated} updated, {result.skipped} skipped"]
        if result.recovered > 0:
            msg_parts.append(f"{result.recovered} recovered")
        if result.orphaned > 0:
            msg_parts.append(f"{result.orphaned} orphaned")
        if result.errors > 0:
            msg_parts.append(f"{result.errors} errors")
        result.message = ", ".join(msg_parts)
        
    finally:
        _sync_status = SyncStatus(in_progress=False)
    
    return result


# --------------------------------------------------------------------------
# Sync Endpoints
# --------------------------------------------------------------------------

@router.get("/sync/status", response_model=SyncStatus)
async def get_sync_status():
    """Get current sync status."""
    return _sync_status


@router.post("/sync", response_model=SyncResult)
async def sync_library(
    background_tasks: BackgroundTasks,
    full: bool = False,
    db = Depends(get_db)
):
    """
    Scan book folders and sync to database.
    
    Args:
        full: If True, re-scan all books. If False, only scan new folders.
    """
    global _sync_status
    
    if _sync_status.in_progress:
        return SyncResult(
            status="already_running",
            message="A sync is already in progress"
        )
    
    return await _do_sync(db, full)


# --------------------------------------------------------------------------
# Rescan Metadata Endpoints (Phase 7.0)
# --------------------------------------------------------------------------

@router.post("/sync/rescan-metadata")
async def rescan_metadata(
    category: Optional[str] = None,
    db = Depends(get_db)
):
    """
    Re-extract enhanced metadata from all ebook files.
    
    This updates:
    - Fandom, relationships, characters (from AO3 tags)
    - Content rating, warnings, category (from AO3 tags)
    - Source URL (from FanFicFare/Wattpad)
    - ISBN, publisher (from published books)
    - Series info (from Calibre metadata)
    - Completion status (from tags/summary)
    - Chapter count (from manifest)
    
    Args:
        category: Optional filter - only rescan books in this category
    """
    global _sync_status
    
    # Prevent concurrent operations
    if _sync_status.in_progress:
        return {"error": "A sync operation is already in progress. Please wait."}
    
    _sync_status.in_progress = True
    _sync_status.current_operation = "rescan"
    
    try:
        results = {
            "total": 0,
            "updated": 0,
            "skipped_no_file": 0,
            "skipped_no_epub": 0,
            "errors": 0,
            "details": {
                "ao3_parsed": 0,
                "source_urls_found": 0,
                "series_extracted": 0,
                "isbn_found": 0,
                "completion_status_detected": 0,
            }
        }
        
        # Build query with optional category filter BEFORE GROUP BY
        where_clause = "(t.is_tbr = 0 OR t.is_tbr IS NULL)"
        params = []
        
        if category:
            where_clause += " AND t.category = ?"
            params.append(category)
        
        query = f"""
            SELECT t.id, t.title, e.file_path, e.folder_path, t.category,
                   t.series, t.fandom, t.source_url
            FROM titles t
            LEFT JOIN editions e ON t.id = e.title_id
            WHERE {where_clause}
            GROUP BY t.id
        """
        
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        
        results["total"] = len(rows)
        
        for row in rows:
            title_id = row[0]
            title_name = row[1]
            file_path = row[2]
            folder_path = row[3]
            current_category = row[4]
            current_series = row[5]
            current_fandom = row[6]
            current_source_url = row[7]
            
            # Find the ebook file
            epub_path = None
            
            if file_path and Path(file_path).exists():
                if file_path.lower().endswith('.epub'):
                    epub_path = file_path
            elif folder_path and Path(folder_path).exists():
                # Look for EPUB in folder
                folder = Path(folder_path)
                epubs = list(folder.glob('*.epub')) + list(folder.glob('*.EPUB'))
                if epubs:
                    epub_path = str(epubs[0])
            
            if not epub_path:
                results["skipped_no_epub"] += 1
                continue
            
            if not Path(epub_path).exists():
                results["skipped_no_file"] += 1
                continue
            
            try:
                # Extract metadata
                metadata = await extract_metadata(Path(epub_path))
                
                if not metadata:
                    results["errors"] += 1
                    continue
                
                # Build update query - only update fields that have new values
                updates = []
                values = []
                
                # Fandom (only if not already set)
                if metadata.get("fandom") and not current_fandom:
                    updates.append("fandom = ?")
                    values.append(metadata["fandom"])
                    results["details"]["ao3_parsed"] += 1
                
                # Relationships
                if metadata.get("relationships"):
                    updates.append("relationships = ?")
                    values.append(metadata["relationships"])
                
                # Characters
                if metadata.get("characters"):
                    updates.append("characters = ?")
                    values.append(metadata["characters"])
                
                # Content rating
                if metadata.get("content_rating"):
                    updates.append("content_rating = ?")
                    values.append(metadata["content_rating"])
                
                # AO3 warnings
                if metadata.get("ao3_warnings"):
                    updates.append("ao3_warnings = ?")
                    values.append(metadata["ao3_warnings"])
                
                # AO3 category
                if metadata.get("ao3_category"):
                    updates.append("ao3_category = ?")
                    values.append(metadata["ao3_category"])
                
                # Source URL (only if not already set)
                if metadata.get("source_url") and not current_source_url:
                    updates.append("source_url = ?")
                    values.append(metadata["source_url"])
                    results["details"]["source_urls_found"] += 1
                
                # ISBN
                if metadata.get("isbn"):
                    updates.append("isbn = ?")
                    values.append(metadata["isbn"])
                    results["details"]["isbn_found"] += 1
                
                # Publisher
                if metadata.get("publisher"):
                    updates.append("publisher = ?")
                    values.append(metadata["publisher"])
                
                # Series (only if not already set and found in Calibre metadata)
                if metadata.get("series") and not current_series:
                    updates.append("series = ?")
                    values.append(metadata["series"])
                    results["details"]["series_extracted"] += 1
                    
                    if metadata.get("series_number"):
                        updates.append("series_number = ?")
                        values.append(metadata["series_number"])
                
                # Chapter count
                if metadata.get("chapter_count"):
                    updates.append("chapter_count = ?")
                    values.append(metadata["chapter_count"])
                
                # Completion status
                if metadata.get("completion_status"):
                    updates.append("completion_status = ?")
                    values.append(metadata["completion_status"])
                    results["details"]["completion_status_detected"] += 1
                
                # Update tags (replace with freeform only)
                if metadata.get("tags"):
                    updates.append("tags = ?")
                    values.append(json.dumps(metadata["tags"]))
                
                # Apply updates
                if updates:
                    values.append(title_id)
                    update_query = f"""
                        UPDATE titles 
                        SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    """
                    await db.execute(update_query, values)
                    results["updated"] += 1
                
            except Exception as e:
                print(f"Error rescanning {title_name}: {e}")
                results["errors"] += 1
                continue
        
        await db.commit()
        
        return results
    
    finally:
        _sync_status.in_progress = False
        _sync_status.current_operation = None


@router.get("/sync/rescan-metadata/preview")
async def preview_rescan(db = Depends(get_db)):
    """
    Preview what a rescan would find - counts books by source type.
    """
    # Count total books (all owned, not TBR)
    cursor = await db.execute("""
        SELECT COUNT(*) FROM titles
        WHERE is_tbr = 0 OR is_tbr IS NULL
    """)
    total_books = (await cursor.fetchone())[0]
    
    # Count books with EPUB files AND their enhanced metadata status
    # This ensures estimates are accurate (only counting EPUB books)
    cursor2 = await db.execute("""
        SELECT 
            COUNT(DISTINCT t.id) as epub_count,
            SUM(CASE WHEN t.fandom IS NOT NULL THEN 1 ELSE 0 END) as has_fandom,
            SUM(CASE WHEN t.source_url IS NOT NULL THEN 1 ELSE 0 END) as has_source_url,
            SUM(CASE WHEN t.isbn IS NOT NULL THEN 1 ELSE 0 END) as has_isbn,
            SUM(CASE WHEN t.relationships IS NOT NULL THEN 1 ELSE 0 END) as has_relationships
        FROM titles t
        JOIN editions e ON t.id = e.title_id
        WHERE (e.file_path LIKE '%.epub' OR e.file_path LIKE '%.EPUB')
        AND (t.is_tbr = 0 OR t.is_tbr IS NULL)
        GROUP BY t.id
    """)
    rows = await cursor2.fetchall()
    
    # Aggregate the results (each row is one title due to GROUP BY)
    epub_count = len(rows)
    has_fandom = sum(1 for r in rows if r[1])
    has_source_url = sum(1 for r in rows if r[2])
    has_isbn = sum(1 for r in rows if r[3])
    has_relationships = sum(1 for r in rows if r[4])
    
    return {
        "total_books": total_books,
        "books_with_epub": epub_count,
        "already_has_fandom": has_fandom,
        "already_has_source_url": has_source_url,
        "already_has_isbn": has_isbn,
        "already_has_relationships": has_relationships,
        "estimated_to_update": max(0, epub_count - has_fandom)  # Books with EPUB but no fandom yet
    }
