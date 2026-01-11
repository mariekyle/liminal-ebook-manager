"""
Titles API Router

Handles all title-related endpoints:
- List titles with filtering/sorting
- Get single title details
- Title notes CRUD
- Series and tags queries

Note: This was renamed from books.py in Phase 5.
The API endpoints still use /books for backward compatibility with frontend,
but internally query the 'titles' table.
"""

import os
import json
import re
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Body, UploadFile, File
from pydantic import BaseModel
import aiosqlite

from database import get_db
from services.covers import get_cover_style, Theme
from services.covers import (
    extract_epub_cover, 
    get_cover_path, 
    delete_cover_file,
    ensure_cover_directories,
    CUSTOM_COVERS_PATH,
    EXTRACTED_COVERS_PATH
)
from services.metadata import extract_metadata
from pathlib import Path

router = APIRouter(tags=["titles"])


# --------------------------------------------------------------------------
# Pydantic Models (API request/response schemas)
# --------------------------------------------------------------------------

class EditionSummary(BaseModel):
    """Edition data for API responses."""
    id: int
    format: str
    file_path: Optional[str] = None
    folder_path: Optional[str] = None
    narrators: Optional[List[str]] = None
    acquired_date: Optional[str] = None


class EditionCreate(BaseModel):
    """Request model for creating a new edition."""
    format: str  # ebook, physical, audiobook, web
    acquired_date: Optional[str] = None  # ISO date: YYYY-MM-DD


class TitleSummary(BaseModel):
    """Title data for list view (lighter weight)."""
    id: int
    title: str
    authors: List[str]
    series: Optional[str] = None
    series_number: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    rating: Optional[int] = None
    word_count: Optional[int] = None
    cover_gradient: Optional[str] = None
    cover_bg_color: Optional[str] = None
    cover_text_color: Optional[str] = None
    # Cover image fields (Phase 9C)
    has_cover: bool = False
    cover_path: Optional[str] = None
    cover_source: Optional[str] = None  # 'extracted', 'custom', or None
    has_notes: bool = False
    created_at: Optional[str] = None
    acquisition_status: str = 'owned'  # 'owned' or 'wishlist'


class TitleDetail(BaseModel):
    """Full title data for detail view."""
    id: int
    title: str
    authors: List[str]
    series: Optional[str] = None
    series_number: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    rating: Optional[int] = None
    date_started: Optional[str] = None
    date_finished: Optional[str] = None
    publication_year: Optional[int] = None
    word_count: Optional[int] = None
    summary: Optional[str] = None
    tags: List[str] = []
    source_url: Optional[str] = None
    completion_status: Optional[str] = None
    folder_path: Optional[str] = None  # From primary edition
    cover_gradient: Optional[str] = None
    cover_bg_color: Optional[str] = None
    cover_text_color: Optional[str] = None
    # Cover image fields (Phase 9C)
    has_cover: bool = False
    cover_path: Optional[str] = None
    cover_source: Optional[str] = None  # 'extracted', 'custom', or None
    created_at: Optional[str] = None
    is_tbr: bool = False  # KEEP for backward compatibility
    tbr_priority: Optional[str] = None
    tbr_reason: Optional[str] = None
    acquisition_status: str = 'owned'  # 'owned' or 'wishlist'
    editions: List[EditionSummary] = []
    # Enhanced metadata (Phase 7.0)
    fandom: Optional[str] = None
    relationships: Optional[List[str]] = None
    characters: Optional[List[str]] = None
    content_rating: Optional[str] = None
    ao3_warnings: Optional[List[str]] = None
    ao3_category: Optional[List[str]] = None
    isbn: Optional[str] = None
    publisher: Optional[str] = None
    chapter_count: Optional[int] = None


class EnhancedMetadataUpdate(BaseModel):
    """Request model for updating enhanced metadata fields."""
    summary: Optional[str] = None
    fandom: Optional[str] = None
    relationships: Optional[List[str]] = None  # List of ship strings
    characters: Optional[List[str]] = None
    content_rating: Optional[str] = None
    ao3_warnings: Optional[List[str]] = None
    ao3_category: Optional[List[str]] = None  # Pairing types
    tags: Optional[List[str]] = None
    source_url: Optional[str] = None
    completion_status: Optional[str] = None


class SeriesSummary(BaseModel):
    """Summary of a series for the series library view."""
    name: str
    author: str  # Primary author (from first book)
    book_count: int
    books_read: int  # Count of books with status 'Finished'
    cover_gradient: Optional[str] = None
    cover_bg_color: Optional[str] = None
    cover_text_color: Optional[str] = None


class SeriesListResponse(BaseModel):
    """Response for series list endpoint."""
    series: List[SeriesSummary]
    total: int


class SeriesBookItem(BaseModel):
    """A book within a series."""
    id: int
    title: str
    series_number: Optional[str] = None
    status: Optional[str] = None
    rating: Optional[int] = None


class SeriesDetail(BaseModel):
    """Full details of a series."""
    name: str
    author: str
    book_count: int
    books_read: int
    books: List[SeriesBookItem]


class TagSummary(BaseModel):
    """A tag with its usage count."""
    name: str
    count: int


class Note(BaseModel):
    """A note attached to a title."""
    id: int
    title_id: int
    content: str
    created_at: str
    updated_at: str


class BacklinkItem(BaseModel):
    """A title that links to another title."""
    id: int
    title: str
    authors: List[str]


class NoteCreate(BaseModel):
    """Request body for creating/updating a note."""
    content: str


class NoteImportRequest(BaseModel):
    """Request body for importing notes from external sources (e.g., Obsidian)."""
    content: str
    append: bool = True  # If True, append to existing; if False, replace
    source: Optional[str] = None  # e.g., "obsidian"


class BookCategoryUpdate(BaseModel):
    """Request body for updating a title's category."""
    category: str


class BookStatusUpdate(BaseModel):
    """Request body for updating a title's read status."""
    status: str


class BookRatingUpdate(BaseModel):
    """Request body for updating a title's rating."""
    rating: Optional[int] = None  # None to clear rating, 1-5 to set


class BookDatesUpdate(BaseModel):
    """Request body for updating a title's reading dates."""
    date_started: Optional[str] = None   # ISO format: YYYY-MM-DD or null
    date_finished: Optional[str] = None  # ISO format: YYYY-MM-DD or null


class BookMetadataUpdate(BaseModel):
    """Request body for updating title metadata fields."""
    title: Optional[str] = None
    authors: Optional[List[str]] = None
    series: Optional[str] = None
    series_number: Optional[str] = None
    category: Optional[str] = None
    publication_year: Optional[int] = None
    source_url: Optional[str] = None
    completion_status: Optional[str] = None


class TitlesListResponse(BaseModel):
    """Response for title list endpoint."""
    books: List[TitleSummary]  # Keep as 'books' for frontend compatibility
    total: int


# --------------------------------------------------------------------------
# Helper Functions
# --------------------------------------------------------------------------

def parse_json_field(value: str, default: list = None) -> list:
    """Safely parse a JSON string field into a list."""
    if not value:
        return default or []
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return default or []


def row_to_title_summary(row) -> TitleSummary:
    """Convert a database row to TitleSummary."""
    authors = parse_json_field(row["authors"])
    primary_author = authors[0] if authors else "Unknown Author"
    
    # Generate cover style from title/author
    cover_style = get_cover_style(row["title"] or "Untitled", primary_author, Theme.DARK)
    
    # Determine acquisition status (fallback to is_tbr for backward compatibility)
    if "acquisition_status" in row.keys() and row["acquisition_status"]:
        acquisition_status = row["acquisition_status"]
    elif "is_tbr" in row.keys():
        acquisition_status = 'wishlist' if row["is_tbr"] else 'owned'
    else:
        acquisition_status = 'owned'
    
    return TitleSummary(
        id=row["id"],
        title=row["title"],
        authors=authors,
        series=row["series"],
        series_number=row["series_number"],
        category=row["category"],
        status=row["status"],
        rating=row["rating"],
        word_count=row["word_count"] if "word_count" in row.keys() else None,
        cover_gradient=cover_style.css_gradient,
        cover_bg_color=cover_style.background_color,
        cover_text_color=cover_style.text_color,
        # Cover image fields (Phase 9C)
        has_cover=bool(row["has_cover"]) if "has_cover" in row.keys() else False,
        cover_path=row["cover_path"] if "cover_path" in row.keys() else None,
        cover_source=row["cover_source"] if "cover_source" in row.keys() else None,
        has_notes=row["note_count"] > 0 if "note_count" in row.keys() else False,
        created_at=row["created_at"] if "created_at" in row.keys() else None,
        acquisition_status=acquisition_status
    )


async def row_to_title_detail(row, db) -> TitleDetail:
    """Convert a database row to TitleDetail, including editions."""
    authors = parse_json_field(row["authors"])
    primary_author = authors[0] if authors else "Unknown Author"
    
    # Generate cover style from title/author
    cover_style = get_cover_style(row["title"] or "Untitled", primary_author, Theme.DARK)
    
    # Get editions for this title
    cursor = await db.execute(
        "SELECT * FROM editions WHERE title_id = ? ORDER BY format",
        [row["id"]]
    )
    edition_rows = await cursor.fetchall()
    
    editions = []
    folder_path = None
    for ed in edition_rows:
        narrators = parse_json_field(ed["narrators"]) if ed["narrators"] else None
        editions.append(EditionSummary(
            id=ed["id"],
            format=ed["format"],
            file_path=ed["file_path"],
            folder_path=ed["folder_path"],
            narrators=narrators,
            acquired_date=ed["acquired_date"]
        ))
        # Use first ebook edition's folder_path for backward compatibility
        if ed["format"] == "ebook" and ed["folder_path"] and not folder_path:
            folder_path = ed["folder_path"]
    
    # Determine acquisition status (fallback to is_tbr for backward compatibility)
    if "acquisition_status" in row.keys() and row["acquisition_status"]:
        acquisition_status = row["acquisition_status"]
    elif "is_tbr" in row.keys():
        acquisition_status = 'wishlist' if row["is_tbr"] else 'owned'
    else:
        acquisition_status = 'owned'
    
    return TitleDetail(
        id=row["id"],
        title=row["title"],
        authors=authors,
        series=row["series"],
        series_number=row["series_number"],
        category=row["category"],
        status=row["status"],
        rating=row["rating"],
        date_started=row["date_started"],
        date_finished=row["date_finished"],
        publication_year=row["publication_year"],
        word_count=row["word_count"] if "word_count" in row.keys() else None,
        summary=row["summary"],
        tags=parse_json_field(row["tags"]),
        source_url=row["source_url"] if "source_url" in row.keys() else None,
        completion_status=row["completion_status"] if "completion_status" in row.keys() else None,
        folder_path=folder_path,
        cover_gradient=cover_style.css_gradient,
        cover_bg_color=cover_style.background_color,
        cover_text_color=cover_style.text_color,
        # Cover image fields (Phase 9C)
        has_cover=bool(row["has_cover"]) if "has_cover" in row.keys() else False,
        cover_path=row["cover_path"] if "cover_path" in row.keys() else None,
        cover_source=row["cover_source"] if "cover_source" in row.keys() else None,
        created_at=row["created_at"] if "created_at" in row.keys() else None,
        is_tbr=bool(row["is_tbr"]) if "is_tbr" in row.keys() else False,
        tbr_priority=row["tbr_priority"] if "tbr_priority" in row.keys() else None,
        tbr_reason=row["tbr_reason"] if "tbr_reason" in row.keys() else None,
        acquisition_status=acquisition_status,
        editions=editions,
        # Enhanced metadata (Phase 7.0)
        fandom=row["fandom"] if "fandom" in row.keys() else None,
        relationships=parse_json_field(row["relationships"]) if "relationships" in row.keys() else None,
        characters=parse_json_field(row["characters"]) if "characters" in row.keys() else None,
        content_rating=row["content_rating"] if "content_rating" in row.keys() else None,
        ao3_warnings=parse_json_field(row["ao3_warnings"]) if "ao3_warnings" in row.keys() else None,
        ao3_category=parse_json_field(row["ao3_category"]) if "ao3_category" in row.keys() else None,
        isbn=row["isbn"] if "isbn" in row.keys() else None,
        publisher=row["publisher"] if "publisher" in row.keys() else None,
        chapter_count=row["chapter_count"] if "chapter_count" in row.keys() else None,
    )


async def parse_and_store_links(db, note_id: int, content: str) -> None:
    """
    Parse [[Title]] patterns from note content and store links.
    
    - Extracts all [[...]] patterns
    - Looks up titles by exact title match (case-insensitive)
    - Clears existing links for this note
    - Inserts new links
    """
    # Extract all [[...]] patterns (non-greedy to handle brackets in titles)
    link_pattern = r'\[\[(.+?)\]\]'
    matches = re.findall(link_pattern, content or '')
    
    # Remove duplicates while preserving order
    unique_titles = list(dict.fromkeys(matches))
    
    # Clear existing links for this note
    await db.execute("DELETE FROM links WHERE from_note_id = ?", [note_id])
    
    if not unique_titles:
        return
    
    # Look up titles by title (case-insensitive)
    for link_text in unique_titles:
        cursor = await db.execute(
            "SELECT id FROM titles WHERE LOWER(title) = LOWER(?)",
            [link_text.strip()]
        )
        title_row = await cursor.fetchone()
        
        if title_row:
            # Insert link
            await db.execute(
                "INSERT INTO links (from_note_id, to_title_id, link_text) VALUES (?, ?, ?)",
                [note_id, title_row["id"], link_text]
            )


# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------

@router.get("/titles", response_model=TitlesListResponse)
async def list_titles(
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by read status"),
    series: Optional[str] = Query(None, description="Filter by series"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    search: Optional[str] = Query(None, description="Search in title/author"),
    sort: str = Query("added", description="Sort field: added, title, author, published"),
    sort_dir: str = Query("desc", description="Sort direction: asc or desc"),
    limit: int = Query(50, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    acquisition: Optional[str] = Query(None, description="Filter by acquisition status: owned, wishlist, or omit for all"),
    # Enhanced metadata filters (Phase 7.2)
    fandom: Optional[str] = Query(None, description="Filter by fandom (exact match)"),
    content_rating: Optional[str] = Query(None, description="Filter by content rating (comma-separated for multiple)"),
    completion_status: Optional[str] = Query(None, description="Filter by completion status (comma-separated for multiple)"),
    ship: Optional[str] = Query(None, description="Filter by ship/relationship (searches within JSON array)"),
    format: Optional[str] = Query(None, description="Filter by format (comma-separated: ebook,physical,audiobook,web)"),
    db = Depends(get_db)
):
    """
    List all titles with optional filtering and sorting.
    
    This is the main endpoint for the library grid view.
    
    The `acquisition` parameter filters by acquisition status:
    - 'owned': Only books you have (default library view)
    - 'wishlist': Only wishlist items (was TBR)
    - omit: Show both owned and wishlist items
    """
    # Build query dynamically based on filters
    where_clauses = []
    params = []
    
    # Acquisition status filter (default to 'owned' for backward compatibility)
    if acquisition == 'wishlist':
        where_clauses.append("acquisition_status = 'wishlist'")
    elif acquisition == 'all':
        pass  # No filter - show both owned and wishlist
    else:
        # Default to 'owned' (includes explicit 'owned' or None/omitted)
        where_clauses.append("acquisition_status = 'owned'")
    
    if category:
        where_clauses.append("category = ?")
        params.append(category)
    
    if status:
        where_clauses.append("status = ?")
        params.append(status)
    
    if series:
        where_clauses.append("series = ?")
        params.append(series)
    
    if search:
        where_clauses.append("(title LIKE ? OR authors LIKE ?)")
        search_term = f"%{search}%"
        params.extend([search_term, search_term])
    
    # Filter by tags (comma-separated, must have ALL specified tags)
    if tags:
        tag_list = [t.strip().lower() for t in tags.split(',') if t.strip()]
        for tag in tag_list:
            where_clauses.append(
                '(LOWER(tags) LIKE ? OR LOWER(tags) LIKE ?)'
            )
            params.extend([
                f'%"{tag}",%',     # Tag followed by comma (not last item)
                f'%"{tag}"]%',     # Tag followed by ] (last item)
            ])
    
    # Enhanced metadata filters (Phase 7.2)
    if fandom:
        where_clauses.append("fandom = ?")
        params.append(fandom)
    
    if content_rating:
        # Support comma-separated values for multi-select
        ratings = [r.strip() for r in content_rating.split(',') if r.strip()]
        if ratings:
            placeholders = ",".join("?" * len(ratings))
            where_clauses.append(f"content_rating IN ({placeholders})")
            params.extend(ratings)
    
    if completion_status:
        # Support comma-separated values for multi-select
        statuses = [s.strip() for s in completion_status.split(',') if s.strip()]
        if statuses:
            placeholders = ",".join("?" * len(statuses))
            where_clauses.append(f"completion_status IN ({placeholders})")
            params.extend(statuses)
    
    if ship:
        # Search within JSON array - ship name is in relationships field
        where_clauses.append("relationships LIKE ?")
        params.append(f'%"{ship}"%')
    
    # Format filter (requires join with editions)
    if format:
        format_list = [f.strip() for f in format.split(',') if f.strip()]
        if format_list:
            format_placeholders = ','.join(['?' for _ in format_list])
            where_clauses.append(f"""
                id IN (
                    SELECT DISTINCT e.title_id 
                    FROM editions e 
                    WHERE e.format IN ({format_placeholders})
                )
            """)
            params.extend(format_list)
    
    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    # Build ORDER BY clause with sort direction
    direction = "ASC" if sort_dir == "asc" else "DESC"
    reverse_direction = "DESC" if sort_dir == "asc" else "ASC"
    
    if sort == "added":
        order_clause = f"created_at {direction}"
    elif sort == "title":
        # Title A-Z: numeric-first sorting
        if sort_dir == "asc":
            order_clause = """
                CASE 
                    WHEN title GLOB '[0-9]*' THEN 0 
                    ELSE 1 
                END,
                CASE 
                    WHEN title GLOB '[0-9]*' THEN CAST(title AS INTEGER)
                    ELSE 0
                END,
                title COLLATE NOCASE ASC"""
        else:
            order_clause = """
                CASE 
                    WHEN title GLOB '[0-9]*' THEN 1 
                    ELSE 0 
                END,
                title COLLATE NOCASE DESC,
                CASE 
                    WHEN title GLOB '[0-9]*' THEN CAST(title AS INTEGER)
                    ELSE 0
                END DESC"""
    elif sort == "author":
        order_clause = f"authors COLLATE NOCASE {direction}"
    elif sort == "published":
        if sort_dir == "asc":
            # Oldest first, NULLs at bottom
            order_clause = """
                CASE WHEN publication_year IS NULL THEN 1 ELSE 0 END,
                publication_year ASC"""
        else:
            # Newest first, NULLs at bottom
            order_clause = """
                CASE WHEN publication_year IS NULL THEN 1 ELSE 0 END,
                publication_year DESC"""
    else:
        order_clause = f"created_at {direction}"
    
    # Get total count
    count_sql = f"SELECT COUNT(*) as total FROM titles WHERE {where_sql}"
    cursor = await db.execute(count_sql, params)
    total_row = await cursor.fetchone()
    total = total_row["total"] if total_row else 0
    
    # Get titles with note count
    query = f"""
        SELECT t.*, 
               (SELECT COUNT(*) FROM notes WHERE title_id = t.id) as note_count
        FROM titles t
        WHERE {where_sql}
        ORDER BY {order_clause}
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    
    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()
    
    titles = [row_to_title_summary(row) for row in rows]
    
    return TitlesListResponse(books=titles, total=total)


# Backward compatibility: /books redirects to /titles
@router.get("/books", response_model=TitlesListResponse)
async def list_books(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    series: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query("added"),
    sort_dir: str = Query("desc"),
    limit: int = Query(50, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    acquisition: Optional[str] = Query(None),
    # Enhanced metadata filters (Phase 7.2)
    fandom: Optional[str] = Query(None),
    content_rating: Optional[str] = Query(None),
    completion_status: Optional[str] = Query(None),
    ship: Optional[str] = Query(None),
    format: Optional[str] = Query(None),
    db = Depends(get_db)
):
    """Backward compatible endpoint - calls list_titles."""
    return await list_titles(
        category, status, series, tags, search, sort, sort_dir, 
        limit, offset, acquisition, fandom, content_rating, 
        completion_status, ship, format, db
    )


@router.get("/books/match")
async def match_book(
    title: str = Query(..., description="Book title to match"),
    author: Optional[str] = Query(None, description="Author name (optional, improves matching)"),
    db = Depends(get_db)
):
    """
    Find titles matching a title/author query with confidence scoring.
    
    Used by the migration script to match Obsidian notes to library titles.
    Returns up to 5 best matches with confidence scores.
    """
    matches = []
    
    # Normalize search terms
    title_lower = title.lower().strip()
    author_lower = author.lower().strip() if author else None
    
    # Strategy 1: Exact title match (case-insensitive)
    cursor = await db.execute(
        "SELECT id, title, authors FROM titles WHERE LOWER(title) = ?",
        [title_lower]
    )
    exact_matches = await cursor.fetchall()
    
    for row in exact_matches:
        authors = parse_json_field(row["authors"])
        confidence = 0.95  # High confidence for exact title match
        
        # Boost if author also matches
        if author_lower and authors:
            if any(author_lower in a.lower() for a in authors):
                confidence = 1.0
        
        matches.append({
            "id": row["id"],
            "title": row["title"],
            "authors": authors,
            "confidence": confidence
        })
    
    # Strategy 2: Title contains search (for partial matches)
    if not matches:
        cursor = await db.execute(
            "SELECT id, title, authors FROM titles WHERE LOWER(title) LIKE ?",
            [f"%{title_lower}%"]
        )
        partial_matches = await cursor.fetchall()
        
        for row in partial_matches:
            authors = parse_json_field(row["authors"])
            
            # Calculate confidence based on how much of the title matched
            book_title_lower = row["title"].lower()
            if title_lower == book_title_lower:
                confidence = 0.95
            elif book_title_lower.startswith(title_lower) or book_title_lower.endswith(title_lower):
                confidence = 0.85
            else:
                confidence = 0.7
            
            # Boost if author matches
            if author_lower and authors:
                if any(author_lower in a.lower() for a in authors):
                    confidence = min(confidence + 0.1, 1.0)
            
            matches.append({
                "id": row["id"],
                "title": row["title"],
                "authors": authors,
                "confidence": confidence
            })
    
    # Strategy 3: Search in title contains the title's title (reverse partial)
    if not matches:
        cursor = await db.execute("SELECT id, title, authors FROM titles")
        all_titles = await cursor.fetchall()
        
        for row in all_titles:
            book_title_lower = row["title"].lower()
            if book_title_lower in title_lower:
                authors = parse_json_field(row["authors"])
                confidence = 0.6  # Lower confidence for reverse partial
                
                if author_lower and authors:
                    if any(author_lower in a.lower() for a in authors):
                        confidence = 0.75
                
                matches.append({
                    "id": row["id"],
                    "title": row["title"],
                    "authors": authors,
                    "confidence": confidence
                })
    
    # Sort by confidence and return top 5
    matches.sort(key=lambda x: x["confidence"], reverse=True)
    
    return {
        "matches": matches[:5],
        "query": {"title": title, "author": author}
    }


@router.get("/books/{book_id}")
async def get_book(book_id: int, db = Depends(get_db)):
    """
    Get full details for a single title.
    """
    cursor = await db.execute(
        "SELECT * FROM titles WHERE id = ?",
        [book_id]
    )
    row = await cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return await row_to_title_detail(row, db)


@router.patch("/books/{book_id}/category")
async def update_book_category(
    book_id: int,
    update: BookCategoryUpdate,
    db = Depends(get_db)
):
    """
    Update a title's category.
    """
    # Verify title exists
    cursor = await db.execute("SELECT id FROM titles WHERE id = ?", [book_id])
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Convert empty string to NULL for consistency
    category_value = update.category if update.category else None
    
    # Update category
    await db.execute(
        "UPDATE titles SET category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [category_value, book_id]
    )
    await db.commit()
    
    return {"status": "ok", "category": category_value}


@router.patch("/books/{book_id}/status")
async def update_book_status(
    book_id: int,
    update: BookStatusUpdate,
    db = Depends(get_db)
):
    """
    Update a title's read status.
    Valid statuses: Unread, In Progress, Finished, Abandoned (legacy: DNF)
    """
    # Verify title exists
    cursor = await db.execute("SELECT id FROM titles WHERE id = ?", [book_id])
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Validate status value (accept both Abandoned and legacy DNF)
    valid_statuses = ['Unread', 'In Progress', 'Finished', 'Abandoned', 'DNF']
    if update.status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    # Update status
    await db.execute(
        "UPDATE titles SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [update.status, book_id]
    )
    await db.commit()
    
    return {"status": "ok", "read_status": update.status}


@router.patch("/books/{book_id}/rating")
async def update_book_rating(
    book_id: int,
    update: BookRatingUpdate,
    db = Depends(get_db)
):
    """
    Update a title's rating.
    Valid ratings: 1-5, or null to clear.
    """
    # Verify title exists
    cursor = await db.execute("SELECT id FROM titles WHERE id = ?", [book_id])
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Validate rating value
    if update.rating is not None and (update.rating < 1 or update.rating > 5):
        raise HTTPException(
            status_code=400, 
            detail="Invalid rating. Must be 1-5 or null to clear."
        )
    
    # Update rating
    await db.execute(
        "UPDATE titles SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [update.rating, book_id]
    )
    await db.commit()
    
    return {"status": "ok", "rating": update.rating}


@router.patch("/books/{book_id}/dates")
async def update_book_dates(
    book_id: int,
    update: BookDatesUpdate,
    db = Depends(get_db)
):
    """
    Update a title's reading dates.
    Dates should be in ISO format (YYYY-MM-DD) or null to clear.
    """
    # Verify title exists
    cursor = await db.execute("SELECT id FROM titles WHERE id = ?", [book_id])
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Update dates
    await db.execute(
        """UPDATE titles 
           SET date_started = ?, date_finished = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?""",
        [update.date_started, update.date_finished, book_id]
    )
    await db.commit()
    
    return {
        "status": "ok", 
        "date_started": update.date_started,
        "date_finished": update.date_finished
    }


@router.put("/books/{book_id}/metadata")
async def update_book_metadata(
    book_id: int,
    update: BookMetadataUpdate,
    db = Depends(get_db)
):
    """
    Update title metadata fields.
    Only provided fields are updated; others remain unchanged.
    """
    # Build dynamic update query based on provided fields
    updates = []
    params = []
    
    if update.title is not None:
        updates.append("title = ?")
        params.append(update.title)
    
    if update.authors is not None:
        # Store as JSON array
        updates.append("authors = ?")
        params.append(json.dumps(update.authors))
    
    if update.series is not None:
        # Empty string means remove series
        updates.append("series = ?")
        params.append(update.series if update.series else None)
    
    if update.series_number is not None:
        updates.append("series_number = ?")
        params.append(update.series_number if update.series_number else None)
    
    if update.category is not None:
        updates.append("category = ?")
        params.append(update.category if update.category else None)
    
    if update.publication_year is not None:
        # 0 or negative means remove year
        updates.append("publication_year = ?")
        params.append(update.publication_year if update.publication_year > 0 else None)
    
    if update.source_url is not None:
        updates.append("source_url = ?")
        params.append(update.source_url if update.source_url else None)
    
    if update.completion_status is not None:
        updates.append("completion_status = ?")
        params.append(update.completion_status if update.completion_status else None)
    
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Add updated_at timestamp
    updates.append("updated_at = CURRENT_TIMESTAMP")
    
    # Add book_id to params
    params.append(book_id)
    
    query = f"UPDATE titles SET {', '.join(updates)} WHERE id = ?"
    
    await db.execute(query, params)
    await db.commit()
    
    # Return updated title using existing helper
    cursor = await db.execute("SELECT * FROM titles WHERE id = ?", (book_id,))
    row = await cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return await row_to_title_detail(row, db)


@router.get("/books/{book_id}/notes", response_model=List[Note])
async def get_book_notes(book_id: int, db = Depends(get_db)):
    """
    Get all notes for a specific title.
    """
    # Verify title exists
    cursor = await db.execute("SELECT id FROM titles WHERE id = ?", [book_id])
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not found")
    
    cursor = await db.execute(
        "SELECT * FROM notes WHERE title_id = ? ORDER BY updated_at DESC",
        [book_id]
    )
    rows = await cursor.fetchall()
    
    return [
        Note(
            id=row["id"],
            title_id=row["title_id"],
            content=row["content"] or "",
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )
        for row in rows
    ]


@router.post("/books/{book_id}/notes", response_model=Note)
async def create_or_update_note(
    book_id: int,
    note_data: NoteCreate,
    db = Depends(get_db)
):
    """
    Create or update a note for a title.
    
    For simplicity, each title has one note. If a note exists, it's updated.
    If not, a new one is created.
    """
    # Verify title exists
    cursor = await db.execute("SELECT id FROM titles WHERE id = ?", [book_id])
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Check if note already exists
    cursor = await db.execute(
        "SELECT id FROM notes WHERE title_id = ?",
        [book_id]
    )
    existing = await cursor.fetchone()
    
    if existing:
        # Update existing note
        await db.execute(
            """UPDATE notes 
               SET content = ?, updated_at = CURRENT_TIMESTAMP 
               WHERE title_id = ?""",
            [note_data.content, book_id]
        )
        note_id = existing["id"]
    else:
        # Create new note
        cursor = await db.execute(
            "INSERT INTO notes (title_id, content) VALUES (?, ?)",
            [book_id, note_data.content]
        )
        note_id = cursor.lastrowid
    
    # Parse and store links from the note content
    await parse_and_store_links(db, note_id, note_data.content)
    
    await db.commit()
    
    # Return the note
    cursor = await db.execute("SELECT * FROM notes WHERE id = ?", [note_id])
    row = await cursor.fetchone()
    
    return Note(
        id=row["id"],
        title_id=row["title_id"],
        content=row["content"] or "",
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )


@router.post("/books/{book_id}/notes/import")
async def import_book_note(
    book_id: int,
    request: NoteImportRequest,
    db = Depends(get_db)
):
    """
    Import a note from an external source (e.g., Obsidian).
    
    If append=True and a note exists, the new content is appended with a separator.
    If append=False, the existing note is replaced.
    """
    # Verify title exists
    cursor = await db.execute("SELECT id, title FROM titles WHERE id = ?", [book_id])
    title_row = await cursor.fetchone()
    if not title_row:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Check for existing note
    cursor = await db.execute("SELECT id, content FROM notes WHERE title_id = ?", [book_id])
    existing_note = await cursor.fetchone()
    
    # Prepare content with source attribution
    source_label = f"*Imported from {request.source}*" if request.source else "*Imported*"
    new_content = f"{source_label}\n\n{request.content}"
    
    if existing_note and request.append:
        # Append to existing note
        combined = f"{existing_note['content']}\n\n---\n\n{new_content}"
        await db.execute(
            "UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [combined, existing_note["id"]]
        )
        note_id = existing_note["id"]
    elif existing_note:
        # Replace existing note
        await db.execute(
            "UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [new_content, existing_note["id"]]
        )
        note_id = existing_note["id"]
    else:
        # Create new note
        cursor = await db.execute(
            "INSERT INTO notes (title_id, content) VALUES (?, ?)",
            [book_id, new_content]
        )
        note_id = cursor.lastrowid
    
    # Parse and store links
    cursor = await db.execute("SELECT content FROM notes WHERE id = ?", [note_id])
    note_row = await cursor.fetchone()
    await parse_and_store_links(db, note_id, note_row["content"])
    
    await db.commit()
    
    return {
        "success": True,
        "note_id": note_id,
        "book_id": book_id,
        "appended": bool(existing_note and request.append)
    }


@router.get("/books/{book_id}/backlinks")
async def get_book_backlinks(
    book_id: int,
    db = Depends(get_db)
):
    """
    Get all titles that link to this title via [[Title]] in their notes.
    Returns titles whose notes contain a link to the specified title.
    """
    # Verify title exists
    cursor = await db.execute("SELECT id FROM titles WHERE id = ?", [book_id])
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Find all titles that have notes linking to this title
    cursor = await db.execute(
        """
        SELECT DISTINCT t.id, t.title, t.authors
        FROM links l
        JOIN notes n ON l.from_note_id = n.id
        JOIN titles t ON n.title_id = t.id
        WHERE l.to_title_id = ?
        ORDER BY t.title COLLATE NOCASE
        """,
        [book_id]
    )
    rows = await cursor.fetchall()
    
    backlinks = []
    for row in rows:
        authors = parse_json_field(row["authors"])
        backlinks.append({
            "id": row["id"],
            "title": row["title"],
            "authors": authors
        })
    
    return {"backlinks": backlinks, "total": len(backlinks)}


@router.get("/categories")
async def list_categories(db = Depends(get_db)):
    """
    Get all unique categories in the library.
    Useful for building filter dropdowns.
    """
    cursor = await db.execute(
        "SELECT DISTINCT category FROM titles WHERE category IS NOT NULL ORDER BY category"
    )
    rows = await cursor.fetchall()
    return [row["category"] for row in rows]


@router.get("/statuses")
async def list_statuses():
    """
    Get all valid read statuses.
    Returns static list since statuses are predefined.
    """
    return ["Unread", "In Progress", "Finished", "Abandoned"]


@router.get("/series", response_model=SeriesListResponse)
async def list_series(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search series name, author, or book titles"),
    db = Depends(get_db)
):
    """
    List all series with metadata.
    Returns series sorted alphabetically by name.
    """
    params = []
    
    # Build category filter clause for correlated subqueries
    category_filter = ""
    if category:
        category_filter = " AND t2.category = ?"
    
    query = f"""
        SELECT 
            s.name,
            s.author,
            s.book_count,
            s.books_read
        FROM (
            SELECT 
                t.series as name,
                (SELECT authors FROM titles t2 
                 WHERE t2.series = t.series{category_filter}
                 ORDER BY CAST(t2.series_number AS FLOAT) ASC, t2.id ASC 
                 LIMIT 1) as author,
                COUNT(*) as book_count,
                SUM(CASE WHEN t.status = 'Finished' THEN 1 ELSE 0 END) as books_read
            FROM titles t
            WHERE t.series IS NOT NULL AND t.series != '' AND t.acquisition_status = 'owned'
    """
    
    if category:
        params.append(category)
        query += " AND t.category = ?"
        params.append(category)
    
    query += " GROUP BY t.series) s"
    
    # Add search filter
    if search:
        join_condition = "t.series = s.name"
        if category:
            join_condition += " AND t.category = ?"
            params.append(category)
        
        query = f"""
            SELECT DISTINCT s.* FROM ({query}) s
            LEFT JOIN titles t ON {join_condition}
            WHERE s.name LIKE ? 
               OR s.author LIKE ? 
               OR t.title LIKE ?
        """
        search_term = f"%{search}%"
        params.extend([search_term, search_term, search_term])
    
    query += " ORDER BY s.name ASC"
    
    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()
    
    series_list = []
    for row in rows:
        authors = parse_json_field(row["author"])
        primary_author = authors[0] if authors else "Unknown Author"
        
        cover_style = get_cover_style(row["name"], primary_author, Theme.DARK)
        
        series_list.append(SeriesSummary(
            name=row["name"],
            author=primary_author,
            book_count=row["book_count"],
            books_read=row["books_read"] or 0,
            cover_gradient=cover_style.css_gradient,
            cover_bg_color=cover_style.background_color,
            cover_text_color=cover_style.text_color
        ))
    
    return {
        "series": series_list,
        "total": len(series_list)
    }


@router.get("/series/{series_name}", response_model=SeriesDetail)
async def get_series_detail(
    series_name: str,
    db = Depends(get_db)
):
    """
    Get details for a specific series including all books.
    """
    from urllib.parse import unquote
    series_name = unquote(series_name)
    
    # Get all titles in this series, ordered by series number
    cursor = await db.execute(
        """
        SELECT id, title, series_number, status, rating, authors
        FROM titles 
        WHERE series = ? AND acquisition_status = 'owned'
        ORDER BY CAST(series_number AS FLOAT) ASC, id ASC
        """,
        [series_name]
    )
    rows = await cursor.fetchall()
    
    if not rows:
        raise HTTPException(status_code=404, detail="Series not found")
    
    # Get author from first book
    first_row = rows[0]
    authors = parse_json_field(first_row["authors"])
    primary_author = authors[0] if authors else "Unknown Author"
    
    # Build book list and count finished
    books = []
    books_read = 0
    for row in rows:
        books.append(SeriesBookItem(
            id=row["id"],
            title=row["title"],
            series_number=row["series_number"],
            status=row["status"],
            rating=row["rating"]
        ))
        if row["status"] == "Finished":
            books_read += 1
    
    return SeriesDetail(
        name=series_name,
        author=primary_author,
        book_count=len(books),
        books_read=books_read,
        books=books
    )


@router.get("/tags")
async def list_tags(
    category: Optional[str] = Query(None, description="Filter by category"),
    db = Depends(get_db)
):
    """
    List all tags with their book counts.
    Optionally filter by category.
    """
    if category:
        cursor = await db.execute(
            "SELECT tags FROM titles WHERE category = ? AND tags IS NOT NULL AND tags != '[]' AND acquisition_status = 'owned'",
            [category]
        )
    else:
        cursor = await db.execute(
            "SELECT tags FROM titles WHERE tags IS NOT NULL AND tags != '[]' AND acquisition_status = 'owned'"
        )
    
    rows = await cursor.fetchall()
    
    # Count tag occurrences
    tag_counts = {}
    for row in rows:
        tags = parse_json_field(row["tags"])
        for tag in tags:
            tag = tag.strip().lower()
            if tag:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    # Sort by count (descending), then name (ascending)
    sorted_tags = sorted(tag_counts.items(), key=lambda x: (-x[1], x[0]))
    
    return {
        "tags": [TagSummary(name=name, count=count) for name, count in sorted_tags],
        "total": len(sorted_tags)
    }


@router.get("/books/lookup")
async def lookup_books_by_titles(
    titles_param: str = Query(..., alias="titles", description="Comma-separated list of book titles to lookup"),
    db = Depends(get_db)
):
    """
    Look up multiple titles by exact title match (case-insensitive).
    Used by the frontend to resolve [[book links]] to IDs.
    """
    title_list = [t.strip() for t in titles_param.split(",") if t.strip()]
    
    if not title_list:
        return {"books": {}}
    
    results = {}
    for title_text in title_list:
        cursor = await db.execute(
            "SELECT id, title FROM titles WHERE LOWER(title) = LOWER(?)",
            [title_text]
        )
        row = await cursor.fetchone()
        if row:
            results[title_text] = {"id": row["id"], "title": row["title"]}
    
    return {"books": results}


# --------------------------------------------------------------------------
# TBR (To Be Read) Endpoints
# --------------------------------------------------------------------------

class TBRCreate(BaseModel):
    """Request body for creating a TBR item."""
    title: str
    authors: List[str]
    series: Optional[str] = None
    series_number: Optional[str] = None
    category: Optional[str] = None
    tbr_priority: str = "normal"  # "normal" or "high"
    tbr_reason: Optional[str] = None
    source_url: Optional[str] = None
    completion_status: Optional[str] = None


class TBRUpdate(BaseModel):
    """Request body for updating TBR-specific fields."""
    tbr_priority: Optional[str] = None
    tbr_reason: Optional[str] = None
    source_url: Optional[str] = None
    completion_status: Optional[str] = None


class TBRAcquire(BaseModel):
    """Request body for converting TBR to library."""
    format: Optional[str] = None  # "ebook", "physical", "audiobook", "web"


class TBRSummary(BaseModel):
    """TBR item for list view."""
    id: int
    title: str
    authors: List[str]
    series: Optional[str] = None
    series_number: Optional[str] = None
    category: Optional[str] = None
    tbr_priority: Optional[str] = None
    tbr_reason: Optional[str] = None
    cover_gradient: Optional[str] = None
    cover_bg_color: Optional[str] = None
    cover_text_color: Optional[str] = None
    created_at: Optional[str] = None


class TBRListResponse(BaseModel):
    """Response for TBR list endpoint."""
    books: List[TBRSummary]
    total: int


@router.get("/tbr", response_model=TBRListResponse)
async def list_tbr(
    priority: Optional[str] = Query(None, description="Filter by priority (high, normal)"),
    sort: str = Query("added", description="Sort field: added, title, author"),
    db = Depends(get_db)
):
    """
    List all TBR (To Be Read) items.
    """
    where_clauses = ["is_tbr = 1"]
    params = []
    
    if priority:
        if priority == "high":
            where_clauses.append("tbr_priority = 'high'")
        elif priority == "normal":
            where_clauses.append("(tbr_priority IS NULL OR tbr_priority = 'normal')")
    
    where_sql = " AND ".join(where_clauses)
    
    # Build ORDER BY clause
    if sort == "title":
        order_clause = "title COLLATE NOCASE ASC"
    elif sort == "author":
        order_clause = "authors COLLATE NOCASE ASC"
    else:  # "added" - most recent first
        order_clause = "created_at DESC"
    
    query = f"""
        SELECT id, title, authors, series, series_number, category,
               tbr_priority, tbr_reason, created_at
        FROM titles
        WHERE {where_sql}
        ORDER BY {order_clause}
    """
    
    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()
    
    books = []
    for row in rows:
        authors = parse_json_field(row["authors"])
        primary_author = authors[0] if authors else "Unknown Author"
        cover_style = get_cover_style(row["title"] or "Untitled", primary_author, Theme.DARK)
        
        books.append(TBRSummary(
            id=row["id"],
            title=row["title"],
            authors=authors,
            series=row["series"],
            series_number=row["series_number"],
            category=row["category"],
            tbr_priority=row["tbr_priority"],
            tbr_reason=row["tbr_reason"],
            cover_gradient=cover_style.css_gradient,
            cover_bg_color=cover_style.background_color,
            cover_text_color=cover_style.text_color,
            created_at=row["created_at"]
        ))
    
    return TBRListResponse(books=books, total=len(books))


@router.post("/tbr")
async def create_tbr(
    data: TBRCreate,
    db = Depends(get_db)
):
    """
    Add a new book to the TBR list.
    Creates a title with is_tbr=1 and no editions.
    """
    # Generate cover colors
    author_for_color = data.authors[0] if data.authors else "Unknown"
    from services.covers import generate_cover_colors
    color1, color2 = generate_cover_colors(data.title, author_for_color)
    
    # Validate priority
    priority = data.tbr_priority if data.tbr_priority in ("high", "normal") else "normal"
    
    cursor = await db.execute(
        """INSERT INTO titles 
            (title, authors, series, series_number, category,
             is_tbr, tbr_priority, tbr_reason,
             source_url, completion_status,
             cover_color_1, cover_color_2, status, acquisition_status)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, 'Unread', 'wishlist')""",
        [
            data.title, json.dumps(data.authors),
            data.series, data.series_number, data.category,
            priority, data.tbr_reason,
            data.source_url, data.completion_status,
            color1, color2
        ]
    )
    title_id = cursor.lastrowid
    await db.commit()
    
    return {"id": title_id, "status": "created"}


@router.patch("/tbr/{book_id}")
async def update_tbr(
    book_id: int,
    data: TBRUpdate,
    db = Depends(get_db)
):
    """
    Update TBR-specific fields (priority, reason).
    """
    # Verify it's a TBR item
    cursor = await db.execute(
        "SELECT id FROM titles WHERE id = ? AND is_tbr = 1",
        [book_id]
    )
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="TBR item not found")
    
    updates = []
    params = []
    
    if data.tbr_priority is not None:
        priority = data.tbr_priority if data.tbr_priority in ("high", "normal") else "normal"
        updates.append("tbr_priority = ?")
        params.append(priority)
    
    if data.tbr_reason is not None:
        updates.append("tbr_reason = ?")
        params.append(data.tbr_reason or None)
    
    if data.source_url is not None:
        updates.append("source_url = ?")
        params.append(data.source_url or None)
    
    if data.completion_status is not None:
        updates.append("completion_status = ?")
        params.append(data.completion_status or None)
    
    if not updates:
        return {"status": "no_changes"}
    
    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.append(book_id)
    
    query = f"UPDATE titles SET {', '.join(updates)} WHERE id = ?"
    await db.execute(query, params)
    await db.commit()
    
    return {"status": "updated"}


@router.post("/tbr/{book_id}/acquire")
async def acquire_tbr(
    book_id: int,
    data: TBRAcquire,
    db = Depends(get_db)
):
    """
    Convert a TBR item to a library book ("I got this book!").
    Sets is_tbr=0 and optionally creates an edition.
    """
    # Verify it's a TBR item
    cursor = await db.execute(
        "SELECT id, title FROM titles WHERE id = ? AND is_tbr = 1",
        [book_id]
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="TBR item not found")
    
    # Convert to library item
    await db.execute(
        """UPDATE titles 
           SET is_tbr = 0, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?""",
        [book_id]
    )
    
    # Optionally create an edition
    edition_id = None
    if data.format:
        cursor = await db.execute(
            """INSERT INTO editions (title_id, format, acquired_date)
               VALUES (?, ?, CURRENT_TIMESTAMP)""",
            [book_id, data.format]
        )
        edition_id = cursor.lastrowid
    
    await db.commit()
    
    return {
        "status": "acquired",
        "book_id": book_id,
        "edition_id": edition_id
    }


@router.delete("/tbr/{book_id}")
async def delete_tbr(
    book_id: int,
    db = Depends(get_db)
):
    """
    Delete a TBR item entirely.
    Only works for TBR items (is_tbr=1).
    """
    # Verify it's a TBR item
    cursor = await db.execute(
        "SELECT id FROM titles WHERE id = ? AND is_tbr = 1",
        [book_id]
    )
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="TBR item not found")
    
    await db.execute("DELETE FROM titles WHERE id = ?", [book_id])
    await db.commit()
    
    return {"status": "deleted"}


# --------------------------------------------------------------------------
# Manual Title Creation Endpoint
# --------------------------------------------------------------------------

class TitleCreate(BaseModel):
    """Request body for creating a title manually."""
    title: str
    authors: List[str]
    series: Optional[str] = None
    series_number: Optional[str] = None
    category: Optional[str] = None
    format: Optional[str] = None  # 'physical', 'audiobook', 'web'
    source_url: Optional[str] = None
    completion_status: Optional[str] = None
    is_tbr: bool = False


@router.post("/titles")
async def create_title_manual(
    data: TitleCreate,
    db = Depends(get_db)
):
    """
    Create a new title manually (for physical, audiobook, web-based books).
    Creates a title record and optionally an edition.
    """
    # Generate cover colors
    author_for_color = data.authors[0] if data.authors else "Unknown"
    from services.covers import generate_cover_colors
    color1, color2 = generate_cover_colors(data.title, author_for_color)
    
    # Insert title
    cursor = await db.execute(
        """INSERT INTO titles 
            (title, authors, series, series_number, category,
             source_url, is_tbr, cover_color_1, cover_color_2, status, acquisition_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unread', ?)""",
        [
            data.title, 
            json.dumps(data.authors),
            data.series, 
            data.series_number, 
            data.category or 'Fiction',
            data.source_url,
            1 if data.is_tbr else 0,
            color1, 
            color2,
            'wishlist' if data.is_tbr else 'owned'
        ]
    )
    title_id = cursor.lastrowid
    
    # Create edition if format specified and not TBR
    edition_id = None
    if data.format and not data.is_tbr:
        cursor = await db.execute(
            """INSERT INTO editions (title_id, format, acquired_date)
               VALUES (?, ?, CURRENT_TIMESTAMP)""",
            [title_id, data.format]
        )
        edition_id = cursor.lastrowid
    
    await db.commit()
    
    return {
        "id": title_id,
        "edition_id": edition_id,
        "status": "created"
    }


@router.post("/books/{book_id}/rescan-metadata")
async def rescan_book_metadata(book_id: int, db = Depends(get_db)):
    """
    Re-extract metadata from the book's ebook file.
    Updates fields with newly extracted values; preserves existing data for fields
    that extraction doesn't populate (e.g., PDF won't overwrite EPUB-extracted fandom).
    Series only updated if ebook contains series data.
    Supports EPUB and PDF formats (EPUB provides richest metadata for fanfiction).
    """
    # First check if the book exists
    cursor = await db.execute("SELECT id, title FROM titles WHERE id = ?", [book_id])
    title_row = await cursor.fetchone()
    
    if not title_row:
        raise HTTPException(status_code=404, detail="Book not found")
    
    title_id = title_row[0]
    title_name = title_row[1]
    
    # Get ebook edition with file_path or folder_path
    cursor = await db.execute(
        """SELECT e.file_path, e.folder_path
           FROM editions e
           WHERE e.title_id = ? AND (e.folder_path IS NOT NULL OR e.file_path IS NOT NULL)
           LIMIT 1""",
        [book_id]
    )
    edition_row = await cursor.fetchone()
    
    if not edition_row:
        raise HTTPException(
            status_code=400, 
            detail="No ebook edition found for this book. Rescan requires an ebook file."
        )
    
    file_path = edition_row[0]
    folder_path = edition_row[1]
    
    # Find ebook file (prefer EPUB, fall back to other formats)
    ebook_path = None
    SUPPORTED_FORMATS = ['.epub', '.pdf']  # Only formats extract_metadata() actually handles
    
    # First check if file_path points to a supported format
    if file_path and Path(file_path).exists():
        if any(file_path.lower().endswith(ext) for ext in SUPPORTED_FORMATS):
            ebook_path = file_path
    
    # If not, search folder for ebook files (prefer EPUB)
    if not ebook_path and folder_path and Path(folder_path).exists():
        folder = Path(folder_path)
        
        # Try formats in order of preference
        for ext in SUPPORTED_FORMATS:
            matches = list(folder.glob(f'*{ext}')) + list(folder.glob(f'*{ext.upper()}'))
            if matches:
                ebook_path = str(matches[0])
                break
    
    if not ebook_path or not Path(ebook_path).exists():
        raise HTTPException(
            status_code=400, 
            detail="No ebook file found for this book. Rescan requires an EPUB or PDF file."
        )
    
    try:
        # Extract metadata
        metadata = await extract_metadata(Path(ebook_path))
        
        if not metadata:
            raise HTTPException(status_code=500, detail="Metadata extraction returned empty")
        
        # Build update - use COALESCE to preserve existing data when extraction returns NULL
        await db.execute(
            """UPDATE titles SET
                summary = COALESCE(?, summary),
                tags = COALESCE(?, tags),
                word_count = COALESCE(?, word_count),
                publication_year = COALESCE(?, publication_year),
                fandom = COALESCE(?, fandom),
                relationships = COALESCE(?, relationships),
                characters = COALESCE(?, characters),
                content_rating = COALESCE(?, content_rating),
                ao3_warnings = COALESCE(?, ao3_warnings),
                ao3_category = COALESCE(?, ao3_category),
                source_url = COALESCE(?, source_url),
                isbn = COALESCE(?, isbn),
                publisher = COALESCE(?, publisher),
                chapter_count = COALESCE(?, chapter_count),
                completion_status = COALESCE(?, completion_status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?""",
            [
                metadata.get('summary'),
                json.dumps(metadata.get('tags', [])),
                metadata.get('word_count'),
                metadata.get('publication_year'),
                metadata.get('fandom'),
                metadata.get('relationships'),
                metadata.get('characters'),
                metadata.get('content_rating'),
                metadata.get('ao3_warnings'),
                metadata.get('ao3_category'),
                metadata.get('source_url'),
                metadata.get('isbn'),
                metadata.get('publisher'),
                metadata.get('chapter_count'),
                metadata.get('completion_status'),
                title_id
            ]
        )
        
        # Also update series if extracted
        if metadata.get('series'):
            await db.execute(
                """UPDATE titles SET 
                    series = ?,
                    series_number = COALESCE(?, series_number)
                WHERE id = ?""",
                [metadata.get('series'), metadata.get('series_number'), title_id]
            )
        
        await db.commit()
        
        return {
            "success": True,
            "message": f"Metadata rescanned for '{title_name}'",
            "extracted": {
                "fandom": metadata.get('fandom'),
                "relationships": bool(metadata.get('relationships')),
                "characters": bool(metadata.get('characters')),
                "content_rating": metadata.get('content_rating'),
                "word_count": metadata.get('word_count'),
                "source_url": bool(metadata.get('source_url')),
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rescan failed: {str(e)}")


# --------------------------------------------------------------------------
# Cover Upload/Delete Endpoints (Phase 9C)
# --------------------------------------------------------------------------

@router.post("/books/{title_id}/cover")
async def upload_custom_cover(
    title_id: int,
    file: UploadFile = File(...),
    db = Depends(get_db)
):
    """
    Upload a custom cover image for a book.
    
    Accepts JPEG, PNG, WebP, GIF formats. Max 10MB.
    Custom covers take priority over extracted covers.
    """
    # Verify title exists
    cursor = await db.execute(
        "SELECT id FROM titles WHERE id = ?",
        (title_id,)
    )
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Title not found")
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: JPEG, PNG, WebP, GIF"
        )
    
    # Read file content
    content = await file.read()
    
    # Check file size (10MB max)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB")
    
    # Determine extension from content type
    ext_map = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif'
    }
    extension = ext_map.get(file.content_type, 'jpg')
    
    # Ensure directories exist
    ensure_cover_directories()
    
    # Determine new file path
    save_path = f"{CUSTOM_COVERS_PATH}/{title_id}.{extension}"
    
    # Collect old cover files to delete AFTER successful write
    old_covers_to_delete = []
    for ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
        old_path = f"{CUSTOM_COVERS_PATH}/{title_id}.{ext}"
        # Don't mark the new path for deletion (same extension case)
        if os.path.exists(old_path) and old_path != save_path:
            old_covers_to_delete.append(old_path)
    
    # Write new cover file FIRST (if this fails, old covers preserved)
    with open(save_path, 'wb') as f:
        f.write(content)
    
    # Only delete old covers AFTER successful write
    for old_path in old_covers_to_delete:
        try:
            os.remove(old_path)
        except OSError:
            pass  # Non-critical: old file cleanup failed
    
    # Update database
    await db.execute("""
        UPDATE titles 
        SET cover_path = ?, has_cover = 1, cover_source = 'custom'
        WHERE id = ?
    """, (save_path, title_id))
    await db.commit()
    
    return {
        "success": True, 
        "cover_path": save_path,
        "has_cover": True,
        "cover_source": "custom"
    }


@router.delete("/books/{title_id}/cover")
async def delete_custom_cover(title_id: int, db = Depends(get_db)):
    """
    Delete custom cover, reverting to extracted cover or gradient.
    
    If an extracted cover exists, reverts to that.
    Otherwise, reverts to gradient (has_cover = false).
    
    Returns full cover state so frontend can update UI correctly.
    """
    # Get current cover info
    cursor = await db.execute(
        "SELECT cover_path, cover_source FROM titles WHERE id = ?",
        (title_id,)
    )
    row = await cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Title not found")
    
    cover_path, cover_source = row
    
    # Only delete if it's a custom cover
    if cover_source == 'custom' and cover_path:
        delete_cover_file(cover_path)
        
        # Check if extracted cover exists
        extracted_cover = None
        for ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
            extracted_path = f"{EXTRACTED_COVERS_PATH}/{title_id}.{ext}"
            if os.path.exists(extracted_path):
                extracted_cover = extracted_path
                break
        
        if extracted_cover:
            # Revert to extracted cover
            await db.execute("""
                UPDATE titles 
                SET cover_path = ?, cover_source = 'extracted'
                WHERE id = ?
            """, (extracted_cover, title_id))
            await db.commit()
            return {
                "success": True, 
                "reverted_to": "extracted",
                "has_cover": True,
                "cover_path": extracted_cover,
                "cover_source": "extracted"
            }
        else:
            # Revert to gradient (no cover)
            await db.execute("""
                UPDATE titles 
                SET cover_path = NULL, has_cover = 0, cover_source = NULL
                WHERE id = ?
            """, (title_id,))
            await db.commit()
            return {
                "success": True, 
                "reverted_to": "gradient",
                "has_cover": False,
                "cover_path": None,
                "cover_source": None
            }
    
    # No custom cover to delete - return current state
    cursor = await db.execute(
        "SELECT has_cover, cover_path, cover_source FROM titles WHERE id = ?",
        (title_id,)
    )
    current = await cursor.fetchone()
    return {
        "success": True, 
        "message": "No custom cover to delete",
        "has_cover": bool(current["has_cover"]) if current else False,
        "cover_path": current["cover_path"] if current else None,
        "cover_source": current["cover_source"] if current else None
    }


@router.post("/books/{title_id}/extract-cover")
async def extract_cover_on_demand(title_id: int, db = Depends(get_db)):
    """
    Extract cover from EPUB on demand (used by "Rescan Metadata").
    
    Only extracts if no custom cover exists (won't overwrite custom).
    """
    # Get title info including file path
    cursor = await db.execute("""
        SELECT t.id, t.cover_source, e.file_path 
        FROM titles t
        LEFT JOIN editions e ON e.title_id = t.id
        WHERE t.id = ?
        ORDER BY e.id ASC
        LIMIT 1
    """, (title_id,))
    row = await cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Title not found")
    
    title_id, cover_source, file_path = row
    
    # Don't overwrite custom covers
    if cover_source == 'custom':
        return {"success": True, "message": "Custom cover exists, skipping extraction"}
    
    # Try to extract from EPUB
    if file_path and file_path.lower().endswith('.epub'):
        cover_path = extract_epub_cover(file_path, title_id)
        
        if cover_path:
            await db.execute("""
                UPDATE titles 
                SET cover_path = ?, has_cover = 1, cover_source = 'extracted'
                WHERE id = ?
            """, (cover_path, title_id))
            await db.commit()
            return {"success": True, "extracted": True, "cover_path": cover_path}
    
    return {"success": True, "extracted": False, "message": "No cover found in EPUB"}


@router.patch("/books/{book_id}/enhanced-metadata")
async def update_enhanced_metadata(
    book_id: int, 
    updates: EnhancedMetadataUpdate,
    db = Depends(get_db)
):
    """
    Update enhanced metadata fields for a book.
    Only updates fields that are explicitly provided (not None).
    """
    # Verify book exists
    cursor = await db.execute("SELECT id FROM titles WHERE id = ?", [book_id])
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Build dynamic update query for provided fields only
    update_fields = []
    values = []
    
    if updates.summary is not None:
        update_fields.append("summary = ?")
        values.append(updates.summary if updates.summary else None)
    
    if updates.fandom is not None:
        update_fields.append("fandom = ?")
        values.append(updates.fandom if updates.fandom else None)
    
    if updates.relationships is not None:
        update_fields.append("relationships = ?")
        values.append(json.dumps(updates.relationships) if updates.relationships else None)
    
    if updates.characters is not None:
        update_fields.append("characters = ?")
        values.append(json.dumps(updates.characters) if updates.characters else None)
    
    if updates.content_rating is not None:
        update_fields.append("content_rating = ?")
        values.append(updates.content_rating if updates.content_rating else None)
    
    if updates.ao3_warnings is not None:
        update_fields.append("ao3_warnings = ?")
        values.append(json.dumps(updates.ao3_warnings) if updates.ao3_warnings else None)
    
    if updates.ao3_category is not None:
        update_fields.append("ao3_category = ?")
        values.append(json.dumps(updates.ao3_category) if updates.ao3_category else None)
    
    if updates.tags is not None:
        update_fields.append("tags = ?")
        values.append(json.dumps(updates.tags) if updates.tags else None)
    
    if updates.source_url is not None:
        update_fields.append("source_url = ?")
        values.append(updates.source_url if updates.source_url else None)
    
    if updates.completion_status is not None:
        update_fields.append("completion_status = ?")
        values.append(updates.completion_status if updates.completion_status else None)
    
    if not update_fields:
        return {"success": True, "message": "No fields to update"}
    
    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    values.append(book_id)
    
    query = f"UPDATE titles SET {', '.join(update_fields)} WHERE id = ?"
    await db.execute(query, values)
    await db.commit()
    
    return {"success": True, "message": "Enhanced metadata updated"}


@router.get("/autocomplete/fandoms")
async def autocomplete_fandoms(q: str = "", limit: int = 10, db = Depends(get_db)):
    """Get unique fandoms for autocomplete."""
    cursor = await db.execute(
        """SELECT DISTINCT fandom FROM titles 
           WHERE fandom IS NOT NULL AND fandom != '' 
           AND fandom LIKE ?
           ORDER BY fandom
           LIMIT ?""",
        [f"%{q}%", limit]
    )
    rows = await cursor.fetchall()
    return {"items": [row[0] for row in rows]}


@router.get("/autocomplete/characters")
async def autocomplete_characters(q: str = "", limit: int = 15, db = Depends(get_db)):
    """Get unique characters for autocomplete."""
    # Characters are stored as JSON arrays, need to extract unique values
    cursor = await db.execute(
        """SELECT DISTINCT characters FROM titles 
           WHERE characters IS NOT NULL AND characters != '[]'"""
    )
    rows = await cursor.fetchall()
    
    # Extract and deduplicate characters
    all_chars = set()
    for row in rows:
        try:
            chars = json.loads(row[0])
            all_chars.update(chars)
        except:
            pass
    
    # Filter by query
    q_lower = q.lower()
    filtered = [c for c in sorted(all_chars) if q_lower in c.lower()]
    return {"items": filtered[:limit]}


@router.get("/autocomplete/ships")
async def autocomplete_ships(q: str = "", limit: int = 15, db = Depends(get_db)):
    """Get unique ships/relationships for autocomplete."""
    cursor = await db.execute(
        """SELECT DISTINCT relationships FROM titles 
           WHERE relationships IS NOT NULL AND relationships != '[]'"""
    )
    rows = await cursor.fetchall()
    
    all_ships = set()
    for row in rows:
        try:
            ships = json.loads(row[0])
            all_ships.update(ships)
        except:
            pass
    
    q_lower = q.lower()
    filtered = [s for s in sorted(all_ships) if q_lower in s.lower()]
    return {"items": filtered[:limit]}


@router.get("/autocomplete/tags")
async def autocomplete_tags(q: str = "", limit: int = 20, db = Depends(get_db)):
    """Get unique tags for autocomplete."""
    cursor = await db.execute(
        """SELECT DISTINCT tags FROM titles 
           WHERE tags IS NOT NULL AND tags != '[]'"""
    )
    rows = await cursor.fetchall()
    
    all_tags = set()
    for row in rows:
        try:
            tags = json.loads(row[0])
            all_tags.update(tags)
        except:
            pass
    
    q_lower = q.lower()
    filtered = [t for t in sorted(all_tags) if q_lower in t.lower()]
    return {"items": filtered[:limit]}


# =============================================================================
# EDITION ENDPOINTS (Phase 8.7b)
# =============================================================================

@router.post("/books/{book_id}/editions", response_model=EditionSummary)
async def create_edition(
    book_id: int,
    edition: EditionCreate,
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Add a new edition (format) to an existing title.
    Used when user owns multiple formats of the same book.
    """
    # Verify title exists
    cursor = await db.execute("SELECT id, is_tbr FROM titles WHERE id = ?", (book_id,))
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Title not found")
    
    # If title is wishlist, convert to owned
    if row[1] == 1:  # is_tbr = 1 means wishlist
        await db.execute(
            "UPDATE titles SET is_tbr = 0, acquisition_status = 'owned' WHERE id = ?",
            (book_id,)
        )
    
    # Validate format
    valid_formats = ['ebook', 'physical', 'audiobook', 'web']
    if edition.format not in valid_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format. Must be one of: {valid_formats}"
        )
    
    # Check if this format already exists for this title
    cursor = await db.execute(
        "SELECT id FROM editions WHERE title_id = ? AND format = ?",
        (book_id, edition.format)
    )
    existing = await cursor.fetchone()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"This title already has a {edition.format} edition"
        )
    
    # Create the edition
    now = datetime.utcnow().isoformat()
    try:
        cursor = await db.execute("""
            INSERT INTO editions (title_id, format, acquired_date, created_at)
            VALUES (?, ?, ?, ?)
        """, (book_id, edition.format, edition.acquired_date, now))
        edition_id = cursor.lastrowid
        await db.commit()
    except Exception as e:
        # Handle unique constraint violation (race condition)
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=400,
                detail=f"This title already has a {edition.format} edition"
            )
        raise
    
    # Return the created edition
    return EditionSummary(
        id=edition_id,
        format=edition.format,
        file_path=None,
        folder_path=None,
        narrators=None,
        acquired_date=edition.acquired_date
    )


@router.delete("/editions/{edition_id}")
async def delete_edition(
    edition_id: int,
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Delete an edition from a title.
    
    Prevents deleting the last edition - a title must have at least one edition.
    Uses atomic conditional delete to prevent race conditions.
    """
    # Get the edition info and count in one query
    cursor = await db.execute("""
        SELECT 
            e.id, 
            e.title_id, 
            e.format, 
            t.title,
            (SELECT COUNT(*) FROM editions WHERE title_id = e.title_id) as edition_count
        FROM editions e
        JOIN titles t ON e.title_id = t.id
        WHERE e.id = ?
    """, (edition_id,))
    edition = await cursor.fetchone()
    
    if not edition:
        raise HTTPException(status_code=404, detail="Edition not found")
    
    title_id = edition[1]
    edition_format = edition[2]
    title_name = edition[3]
    edition_count = edition[4]
    
    # Pre-check for better error message (non-atomic, just for UX)
    if edition_count <= 1:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete the last edition. A title must have at least one edition."
        )
    
    # Atomic conditional delete - only succeeds if there are 2+ editions
    # This prevents race conditions where two concurrent deletes could leave 0 editions
    cursor = await db.execute("""
        DELETE FROM editions 
        WHERE id = ? 
        AND (SELECT COUNT(*) FROM editions WHERE title_id = ?) > 1
    """, (edition_id, title_id))
    await db.commit()
    
    # Check if deletion actually happened
    if cursor.rowcount == 0:
        # Either edition was already deleted, or it became the last one due to race
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete the last edition. A title must have at least one edition."
        )
    
    return {
        "success": True,
        "deleted_edition_id": edition_id,
        "format": edition_format,
        "title_id": title_id,
        "title": title_name,
        "remaining_editions": edition_count - 1
    }


@router.post("/titles/{target_id}/merge")
async def merge_titles(
    target_id: int,
    source_id: int = Body(..., embed=True),
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Merge source title into target title.
    
    Operations:
    1. Move all editions from source → target
    2. Move all reading_sessions from source → target
    3. Move all notes from source → target
    4. Move all collection_books entries from source → target
    5. Move all links (backlinks) from source → target
    6. Delete source title
    
    The target title keeps its metadata. Source title is deleted.
    """
    # Validate target exists
    cursor = await db.execute("SELECT id, title FROM titles WHERE id = ?", (target_id,))
    target = await cursor.fetchone()
    if not target:
        raise HTTPException(status_code=404, detail="Target title not found")
    
    # Validate source exists
    cursor = await db.execute("SELECT id, title FROM titles WHERE id = ?", (source_id,))
    source = await cursor.fetchone()
    if not source:
        raise HTTPException(status_code=404, detail="Source title not found")
    
    # Can't merge a title with itself
    if target_id == source_id:
        raise HTTPException(status_code=400, detail="Cannot merge a title with itself")
    
    # Count what we're moving (for response)
    cursor = await db.execute("SELECT COUNT(*) FROM editions WHERE title_id = ?", (source_id,))
    editions_count = (await cursor.fetchone())[0]
    
    cursor = await db.execute("SELECT COUNT(*) FROM reading_sessions WHERE title_id = ?", (source_id,))
    sessions_count = (await cursor.fetchone())[0]
    
    cursor = await db.execute("SELECT COUNT(*) FROM notes WHERE title_id = ?", (source_id,))
    notes_count = (await cursor.fetchone())[0]
    
    cursor = await db.execute("SELECT COUNT(*) FROM collection_books WHERE title_id = ?", (source_id,))
    collections_count = (await cursor.fetchone())[0]
    
    cursor = await db.execute("SELECT COUNT(*) FROM links WHERE to_title_id = ?", (source_id,))
    links_count = (await cursor.fetchone())[0]
    
    # 1. Move editions (update title_id, handle potential format conflicts)
    # First, get existing formats on target to avoid duplicates
    cursor = await db.execute("SELECT format FROM editions WHERE title_id = ?", (target_id,))
    target_formats = {row[0] for row in await cursor.fetchall()}
    
    # Move editions that don't conflict, delete ones that do
    cursor = await db.execute("SELECT id, format FROM editions WHERE title_id = ?", (source_id,))
    source_editions = await cursor.fetchall()
    editions_moved = 0
    for edition_id, edition_format in source_editions:
        if edition_format not in target_formats:
            await db.execute(
                "UPDATE editions SET title_id = ? WHERE id = ?",
                (target_id, edition_id)
            )
            target_formats.add(edition_format)
            editions_moved += 1
        else:
            # Duplicate format - delete it (target already has this format)
            await db.execute("DELETE FROM editions WHERE id = ?", (edition_id,))
    
    # 2. Move reading sessions (renumber to continue sequence)
    cursor = await db.execute(
        "SELECT COALESCE(MAX(session_number), 0) FROM reading_sessions WHERE title_id = ?",
        (target_id,)
    )
    max_session = (await cursor.fetchone())[0]
    
    cursor = await db.execute(
        "SELECT id FROM reading_sessions WHERE title_id = ? ORDER BY session_number",
        (source_id,)
    )
    source_sessions = await cursor.fetchall()
    for i, (session_id,) in enumerate(source_sessions, start=1):
        await db.execute(
            "UPDATE reading_sessions SET title_id = ?, session_number = ? WHERE id = ?",
            (target_id, max_session + i, session_id)
        )
    
    # 3. Move notes
    await db.execute(
        "UPDATE notes SET title_id = ? WHERE title_id = ?",
        (target_id, source_id)
    )
    
    # 4. Move collection memberships (avoid duplicates)
    cursor = await db.execute(
        "SELECT collection_id FROM collection_books WHERE title_id = ?",
        (target_id,)
    )
    target_collections = {row[0] for row in await cursor.fetchall()}
    
    cursor = await db.execute(
        "SELECT id, collection_id FROM collection_books WHERE title_id = ?",
        (source_id,)
    )
    source_memberships = await cursor.fetchall()
    for membership_id, collection_id in source_memberships:
        if collection_id not in target_collections:
            await db.execute(
                "UPDATE collection_books SET title_id = ? WHERE id = ?",
                (target_id, membership_id)
            )
            target_collections.add(collection_id)
        else:
            # Already in this collection - delete duplicate membership
            await db.execute("DELETE FROM collection_books WHERE id = ?", (membership_id,))
    
    # 5. Move backlinks (links pointing TO the source should point to target)
    await db.execute(
        "UPDATE links SET to_title_id = ? WHERE to_title_id = ?",
        (target_id, source_id)
    )
    
    # 6. Delete source title (cascades to any remaining FK references)
    await db.execute("DELETE FROM titles WHERE id = ?", (source_id,))
    
    await db.commit()
    
    return {
        "success": True,
        "target_id": target_id,
        "target_title": target[1],
        "source_id": source_id,
        "source_title": source[1],
        "merged": {
            "editions": editions_moved,
            "sessions": sessions_count,
            "notes": notes_count,
            "collections": collections_count,
            "links": links_count
        }
    }


# =============================================================================
# DUPLICATE FINDER
# =============================================================================

def normalize_title(title: str) -> str:
    """Normalize title for comparison: lowercase, remove articles, punctuation."""
    if not title:
        return ""
    # Lowercase
    normalized = title.lower().strip()
    # Remove leading articles
    for article in ["the ", "a ", "an "]:
        if normalized.startswith(article):
            normalized = normalized[len(article):]
            break
    # Remove punctuation and extra spaces
    import re
    normalized = re.sub(r'[^\w\s]', '', normalized)
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    return normalized


def levenshtein_distance(s1: str, s2: str) -> int:
    """Calculate the Levenshtein (edit) distance between two strings."""
    if len(s1) < len(s2):
        s1, s2 = s2, s1
    
    if len(s2) == 0:
        return len(s1)
    
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            # Cost is 0 if characters match, 1 otherwise
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    
    return previous_row[-1]


def titles_are_similar(title1: str, title2: str, threshold: float = 0.75) -> bool:
    """Check if two titles are similar using Levenshtein distance and substring matching."""
    if not title1 or not title2:
        return False
    
    norm1 = normalize_title(title1)
    norm2 = normalize_title(title2)
    
    # Exact match after normalization
    if norm1 == norm2:
        return True
    
    if len(norm1) == 0 or len(norm2) == 0:
        return False
    
    # Substring matching: if one title contains the other, likely a duplicate
    # e.g., "Dune" vs "Dune: The Novel"
    shorter = norm1 if len(norm1) <= len(norm2) else norm2
    longer = norm2 if len(norm1) <= len(norm2) else norm1
    
    # If the shorter title is contained in the longer one, is at least 4 chars,
    # and covers at least 40% of the longer title, consider them similar
    if len(shorter) >= 4 and shorter in longer and len(shorter) >= len(longer) * 0.4:
        return True
    
    # Check if shorter is a prefix of longer (common for subtitles)
    # e.g., "Kingdom of Fear" vs "Kingdom of Fear: A Story"
    if len(shorter) >= 4 and longer.startswith(shorter) and len(shorter) >= len(longer) * 0.4:
        return True
    
    # Levenshtein similarity ratio
    distance = levenshtein_distance(norm1, norm2)
    max_len = max(len(norm1), len(norm2))
    similarity = 1 - (distance / max_len)
    
    return similarity >= threshold


@router.get("/titles/duplicates")
async def find_duplicates(db = Depends(get_db)):
    """Find potential duplicate titles in the library."""
    
    # Get all titles with basic info
    cursor = await db.execute("""
        SELECT 
            t.id, 
            t.title, 
            t.authors,
            t.category,
            t.series,
            t.series_number,
            (SELECT COUNT(*) FROM editions WHERE title_id = t.id) as edition_count
        FROM titles t
        WHERE t.acquisition_status = 'owned'
        ORDER BY t.title COLLATE NOCASE
    """)
    rows = await cursor.fetchall()
    
    titles_list = []
    for row in rows:
        # Parse authors JSON and format as string
        authors_list = parse_json_field(row["authors"])
        authors_display = ", ".join(authors_list) if authors_list else "Unknown Author"
        # For normalization, use the first author (primary author)
        primary_author = authors_list[0] if authors_list else ""
        
        titles_list.append({
            "id": row["id"],
            "title": row["title"],
            "authors": authors_display,
            "category": row["category"],
            "series": row["series"],
            "series_number": row["series_number"],
            "edition_count": row["edition_count"],
            "normalized": normalize_title(row["title"]),
            "author_normalized": normalize_title(primary_author)
        })
    
    # Group by normalized title for exact matches
    exact_groups = {}
    for book in titles_list:
        key = book["normalized"]
        if key not in exact_groups:
            exact_groups[key] = []
        exact_groups[key].append(book)
    
    # Find duplicate groups
    duplicate_groups = []
    processed_ids = set()
    
    # First pass: exact matches (after normalization)
    for key, books in exact_groups.items():
        if len(books) > 1:
            # Check if same author too
            author_set = set(b["author_normalized"] for b in books)
            same_author = len(author_set) == 1 and "" not in author_set
            
            duplicate_groups.append({
                "match_type": "exact",
                "same_author": same_author,
                "books": [{
                    "id": b["id"],
                    "title": b["title"],
                    "authors": b["authors"],
                    "category": b["category"],
                    "series": b["series"],
                    "series_number": b["series_number"],
                    "edition_count": b["edition_count"]
                } for b in books]
            })
            for b in books:
                processed_ids.add(b["id"])
    
    # Second pass: fuzzy matches (same author, similar title)
    # Only check books not already in exact match groups
    remaining_books = [b for b in titles_list if b["id"] not in processed_ids]
    
    # Group by author first for efficiency
    # Use special key for books without authors so they can still be checked
    by_author = {}
    NO_AUTHOR_KEY = "__no_author__"
    for book in remaining_books:
        key = book["author_normalized"] if book["author_normalized"] else NO_AUTHOR_KEY
        if key not in by_author:
            by_author[key] = []
        by_author[key].append(book)
    
    # Check for similar titles within same author (or same lack of author)
    for author, author_books in by_author.items():
        if len(author_books) < 2:
            continue
        
        # Compare each pair
        checked = set()
        for i, book1 in enumerate(author_books):
            if book1["id"] in checked:
                continue
            
            similar_group = [book1]
            for j, book2 in enumerate(author_books[i+1:], i+1):
                if book2["id"] in checked:
                    continue
                
                if titles_are_similar(book1["title"], book2["title"]):
                    similar_group.append(book2)
                    checked.add(book2["id"])
            
            if len(similar_group) > 1:
                checked.add(book1["id"])
                duplicate_groups.append({
                    "match_type": "fuzzy",
                    "same_author": author != NO_AUTHOR_KEY,  # False if no author
                    "books": [{
                        "id": b["id"],
                        "title": b["title"],
                        "authors": b["authors"],
                        "category": b["category"],
                        "series": b["series"],
                        "series_number": b["series_number"],
                        "edition_count": b["edition_count"]
                    } for b in similar_group]
                })
    
    # Sort groups: exact matches first, then by number of books
    duplicate_groups.sort(key=lambda g: (0 if g["match_type"] == "exact" else 1, -len(g["books"])))
    
    # Count total duplicates
    total_duplicates = sum(len(g["books"]) for g in duplicate_groups)
    
    return {
        "groups": duplicate_groups,
        "total_duplicates": total_duplicates
    }
