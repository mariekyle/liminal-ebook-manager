"""
Sync API Router

Handles scanning book folders and importing/updating library data.
This is where the magic happens - reading your book folders and extracting metadata.
"""

import os
import json
import re
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel

from database import get_db
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
    message: str = ""


class SyncStatus(BaseModel):
    """Current sync status (for progress tracking)."""
    in_progress: bool
    current_book: Optional[str] = None
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


async def find_existing_book_by_content(db, title: str, authors: list[str]) -> Optional[dict]:
    """
    Find existing book by title and first author.
    Used to preserve category when folder paths change.
    """
    if not authors:
        return None
    
    first_author = authors[0]
    cursor = await db.execute(
        """SELECT id, category, folder_path FROM books 
           WHERE title = ? AND authors LIKE ?""",
        [title, f'%"{first_author}"%']
    )
    return await cursor.fetchone()


def detect_fanfiction(parsed: dict, authors: list[str]) -> tuple[bool, str]:
    """
    Detect if a book is likely FanFiction based on metadata patterns.
    
    Returns:
        tuple: (is_fanfiction: bool, reason: str)
    
    Detection heuristics:
    - Tags containing AO3/fanfic indicators
    - Author names matching username patterns
    - Summary containing fanfic-related terms
    """
    reasons = []
    
    # --- Check tags ---
    tags = parsed.get("tags", [])
    if tags:
        tags_lower = [t.lower() if isinstance(t, str) else "" for t in tags]
        
        # Direct fanfic indicators
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
                    reasons.append(f"ship tag detected: '{tag}'")
                    break
    
    # --- Check author name patterns ---
    if authors and authors != ["Unknown Author"]:
        for author in authors:
            # Username patterns: contains underscore, or is mostly lowercase with numbers
            if '_' in author:
                reasons.append(f"author name has underscore: '{author}'")
            elif re.match(r'^[a-z0-9_]+$', author) and len(author) > 3:
                reasons.append(f"author name looks like username: '{author}'")
    
    # --- Check summary ---
    summary = parsed.get("summary", "")
    if summary:
        summary_lower = summary.lower()
        fanfic_summary_terms = [
            "ao3", "archive of our own", "fanfiction", "fanfic",
            "this fic", "this story is", "canon divergent", "canon-divergent",
            "post-canon", "pre-canon", "alternate universe", "au where",
            "what if", "slow burn", "enemies to lovers", "friends to lovers",
            "fix-it", "fixit", "one-shot", "oneshot", "multi-chapter"
        ]
        for term in fanfic_summary_terms:
            if term in summary_lower:
                reasons.append(f"summary contains '{term}'")
                break
    
    is_fanfiction = len(reasons) > 0
    reason_str = "; ".join(reasons) if reasons else ""
    
    return is_fanfiction, reason_str


def determine_category_from_path(folder_path: Path, books_root: Path) -> Optional[str]:
    """
    Determine book category from folder structure.
    Only works if books are in category subfolders (legacy structure).
    Returns None for flat structure.
    """
    try:
        relative = folder_path.relative_to(books_root)
        parts = relative.parts
        
        # Need at least 2 levels: category/book_folder
        if len(parts) >= 2:
            category = parts[0]
            category_map = {
                "fiction": "Fiction",
                "non-fiction": "Non-Fiction", 
                "nonfiction": "Non-Fiction",
                "fanfiction": "FanFiction",
                "fanfic": "FanFiction"
            }
            normalized = category_map.get(category.lower())
            # Only return if it's a known category, not a book folder name
            if normalized:
                return normalized
    except ValueError:
        pass
    
    return None


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
    
    try:
        for folder in book_folders:
            _sync_status.current_book = folder.name
            _sync_status.processed += 1
            
            folder_str = str(folder)
            
            # Check if book already exists by folder_path
            cursor = await db.execute(
                "SELECT id, category FROM books WHERE folder_path = ?",
                [folder_str]
            )
            existing = await cursor.fetchone()
            existing_category = None
            
            if not existing:
                # Folder path changed - try matching by title+author
                parsed_temp = parse_folder_name(folder.name)
                
                # Only attempt content matching if we have a real author
                # (avoid false matches or failed lookups with "Unknown Author")
                if parsed_temp["authors"] and parsed_temp["authors"] != ["Unknown Author"]:
                    existing = await find_existing_book_by_content(
                        db, 
                        parsed_temp["title"], 
                        parsed_temp["authors"]
                    )
                    if existing:
                        existing_category = existing["category"]
                        print(f"Matched existing book by content: {parsed_temp['title']}")
                else:
                    print(f"Skipping content match for '{folder.name}' - no author in folder name")
            elif existing:
                existing_category = existing["category"] if "category" in existing.keys() else None
            
            if existing and not full:
                # For non-full sync, only skip if folder_path already matches
                cursor_check = await db.execute(
                    "SELECT id FROM books WHERE folder_path = ?",
                    [folder_str]
                )
                if await cursor_check.fetchone():
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
                        # Metadata extraction failed, continue with parsed data
                        print(f"Metadata extraction failed for {book_file}: {e}")
                
                # Generate cover colors
                author_for_color = parsed["authors"][0] if parsed["authors"] else "Unknown"
                color1, color2 = generate_cover_colors(parsed["title"], author_for_color)
                
                # Determine category
                # Priority: 1) existing category (preserved), 2) path-based, 3) fanfic detection, 4) Uncategorized
                if existing_category:
                    category = existing_category
                else:
                    # Try path-based detection first (for legacy folder structures)
                    category = determine_category_from_path(folder, books_root)
                    
                    # If no category from path, try fanfiction auto-detection
                    if not category:
                        is_fanfic, detection_reason = detect_fanfiction(parsed, parsed.get("authors", []))
                        if is_fanfic:
                            category = "FanFiction"
                            print(f"Auto-detected FanFiction: {parsed.get('title', folder.name)} - Reason: {detection_reason}")
                        else:
                            category = "Uncategorized"
                
                # Prepare data for insert/update
                book_data = {
                    "title": parsed["title"],
                    "authors": json.dumps(parsed["authors"]),
                    "series": parsed.get("series"),
                    "series_number": parsed.get("series_number"),
                    "category": category,
                    "publication_year": parsed.get("publication_year"),
                    "word_count": parsed.get("word_count"),
                    "summary": parsed.get("summary"),
                    "tags": json.dumps(parsed.get("tags", [])),
                    "folder_path": folder_str,
                    "file_path": str(book_file) if book_file else None,
                    "cover_color_1": color1,
                    "cover_color_2": color2,
                }
                
                if existing:
                    # Update existing book (including folder_path for migrated books)
                    await db.execute(
                        """UPDATE books SET
                            title = ?, authors = ?, series = ?, series_number = ?,
                            category = ?, publication_year = ?, word_count = ?,
                            summary = ?, tags = ?, folder_path = ?, file_path = ?,
                            cover_color_1 = ?, cover_color_2 = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?""",
                        [
                            book_data["title"], book_data["authors"],
                            book_data["series"], book_data["series_number"],
                            book_data["category"], book_data["publication_year"],
                            book_data["word_count"], book_data["summary"],
                            book_data["tags"], book_data["folder_path"], book_data["file_path"],
                            book_data["cover_color_1"], book_data["cover_color_2"],
                            existing["id"]
                        ]
                    )
                    result.updated += 1
                else:
                    # Insert new book
                    await db.execute(
                        """INSERT INTO books 
                            (title, authors, series, series_number, category,
                             publication_year, word_count, summary, tags,
                             folder_path, file_path, cover_color_1, cover_color_2)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        [
                            book_data["title"], book_data["authors"],
                            book_data["series"], book_data["series_number"],
                            book_data["category"], book_data["publication_year"],
                            book_data["word_count"], book_data["summary"],
                            book_data["tags"], book_data["folder_path"],
                            book_data["file_path"], book_data["cover_color_1"],
                            book_data["cover_color_2"]
                        ]
                    )
                    result.added += 1
                
                await db.commit()
                
            except Exception as e:
                print(f"Error processing {folder}: {e}")
                result.errors += 1
        
        result.message = f"Sync complete: {result.added} added, {result.updated} updated, {result.skipped} skipped, {result.errors} errors"
        
    finally:
        _sync_status = SyncStatus(in_progress=False)
    
    return result
