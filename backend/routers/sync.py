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


def determine_category(folder_path: Path, books_root: Path) -> Optional[str]:
    """
    Determine book category from folder structure.
    
    Assumes structure like:
    /books/Fiction/...
    /books/Non-Fiction/...
    /books/FanFiction/...
    """
    try:
        relative = folder_path.relative_to(books_root)
        parts = relative.parts
        
        if parts:
            # First directory level is typically the category
            category = parts[0]
            # Normalize common variations
            category_map = {
                "fiction": "Fiction",
                "non-fiction": "Non-Fiction", 
                "nonfiction": "Non-Fiction",
                "fanfiction": "FanFiction",
                "fanfic": "FanFiction"
            }
            return category_map.get(category.lower(), category)
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
            
            # Check if book already exists
            cursor = await db.execute(
                "SELECT id FROM books WHERE folder_path = ?",
                [folder_str]
            )
            existing = await cursor.fetchone()
            
            if existing and not full:
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
                        if file_metadata.get("title"):
                            parsed["title"] = file_metadata["title"]
                        if file_metadata.get("authors"):
                            parsed["authors"] = file_metadata["authors"]
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
                category = determine_category(folder, books_root)
                
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
                    # Update existing book
                    await db.execute(
                        """UPDATE books SET
                            title = ?, authors = ?, series = ?, series_number = ?,
                            category = ?, publication_year = ?, word_count = ?,
                            summary = ?, tags = ?, file_path = ?,
                            cover_color_1 = ?, cover_color_2 = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?""",
                        [
                            book_data["title"], book_data["authors"],
                            book_data["series"], book_data["series_number"],
                            book_data["category"], book_data["publication_year"],
                            book_data["word_count"], book_data["summary"],
                            book_data["tags"], book_data["file_path"],
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
