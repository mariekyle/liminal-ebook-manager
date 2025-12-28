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

import json
import re
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from database import get_db
from services.covers import get_cover_style, Theme

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
    has_notes: bool = False
    created_at: Optional[str] = None


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
    created_at: Optional[str] = None
    is_tbr: bool = False
    tbr_priority: Optional[str] = None
    tbr_reason: Optional[str] = None
    editions: List[EditionSummary] = []


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
        has_notes=row["note_count"] > 0 if "note_count" in row.keys() else False,
        created_at=row["created_at"] if "created_at" in row.keys() else None
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
        created_at=row["created_at"] if "created_at" in row.keys() else None,
        is_tbr=bool(row["is_tbr"]) if "is_tbr" in row.keys() else False,
        tbr_priority=row["tbr_priority"] if "tbr_priority" in row.keys() else None,
        tbr_reason=row["tbr_reason"] if "tbr_reason" in row.keys() else None,
        editions=editions
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
    sort: str = Query("title", description="Sort field: title, author, series, updated"),
    order: str = Query("asc", description="Sort order: asc or desc"),
    limit: int = Query(50, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    db = Depends(get_db)
):
    """
    List all titles with optional filtering and sorting.
    
    This is the main endpoint for the library grid view.
    """
    # Build query dynamically based on filters
    where_clauses = ["is_tbr = 0"]  # Exclude TBR items from main library
    params = []
    
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
    
    where_sql = " AND ".join(where_clauses)
    
    # Build ORDER BY clause with case-insensitive sorting for text columns
    sort_order = "DESC" if order.lower() == "desc" else "ASC"
    
    if sort == 'title':
        order_clause = f"title COLLATE NOCASE {sort_order}"
    elif sort == 'author':
        order_clause = f"authors COLLATE NOCASE {sort_order}"
    elif sort == 'series':
        order_clause = f"series COLLATE NOCASE {sort_order}, series_number {sort_order}"
    elif sort == 'year':
        order_clause = f"publication_year {sort_order}"
    elif sort == 'updated':
        order_clause = f"updated_at {sort_order}"
    else:
        order_clause = f"title COLLATE NOCASE {sort_order}"
    
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
    sort: str = Query("title"),
    order: str = Query("asc"),
    limit: int = Query(50, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    db = Depends(get_db)
):
    """Backward compatible endpoint - calls list_titles."""
    return await list_titles(category, status, series, tags, search, sort, order, limit, offset, db)


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
    Valid statuses: Unread, In Progress, Finished, DNF
    """
    # Verify title exists
    cursor = await db.execute("SELECT id FROM titles WHERE id = ?", [book_id])
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Validate status value
    valid_statuses = ['Unread', 'In Progress', 'Finished', 'DNF']
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
    return ["Unread", "In Progress", "Finished", "DNF"]


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
            WHERE t.series IS NOT NULL AND t.series != '' AND t.is_tbr = 0
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
        WHERE series = ? AND is_tbr = 0
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
            "SELECT tags FROM titles WHERE category = ? AND tags IS NOT NULL AND tags != '[]' AND is_tbr = 0",
            [category]
        )
    else:
        cursor = await db.execute(
            "SELECT tags FROM titles WHERE tags IS NOT NULL AND tags != '[]' AND is_tbr = 0"
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
             cover_color_1, cover_color_2, status)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, 'Unread')""",
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
             source_url, is_tbr, cover_color_1, cover_color_2, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unread')""",
        [
            data.title, 
            json.dumps(data.authors),
            data.series, 
            data.series_number, 
            data.category or 'Fiction',
            data.source_url,
            1 if data.is_tbr else 0,
            color1, 
            color2
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
