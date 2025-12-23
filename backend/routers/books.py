"""
Books API Router

Handles all book-related endpoints:
- List books with filtering/sorting
- Get single book details
- Book notes CRUD
"""

import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from database import get_db
from services.covers import get_cover_style, Theme

router = APIRouter(tags=["books"])


# --------------------------------------------------------------------------
# Pydantic Models (API request/response schemas)
# --------------------------------------------------------------------------

class BookSummary(BaseModel):
    """Book data for list view (lighter weight)."""
    id: int
    title: str
    authors: List[str]
    series: Optional[str] = None
    series_number: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    rating: Optional[int] = None
    cover_gradient: Optional[str] = None
    cover_bg_color: Optional[str] = None
    cover_text_color: Optional[str] = None
    has_notes: bool = False


class BookDetail(BaseModel):
    """Full book data for detail view."""
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
    folder_path: Optional[str] = None
    cover_gradient: Optional[str] = None
    cover_bg_color: Optional[str] = None
    cover_text_color: Optional[str] = None


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
    """A note attached to a book."""
    id: int
    book_id: int
    content: str
    created_at: str
    updated_at: str


class NoteCreate(BaseModel):
    """Request body for creating/updating a note."""
    content: str


class BookCategoryUpdate(BaseModel):
    """Request body for updating a book's category."""
    category: str


class BookStatusUpdate(BaseModel):
    """Request body for updating a book's read status."""
    status: str


class BookRatingUpdate(BaseModel):
    """Request body for updating a book's rating."""
    rating: Optional[int] = None  # None to clear rating, 1-5 to set


class BookDatesUpdate(BaseModel):
    """Request body for updating a book's reading dates."""
    date_started: Optional[str] = None   # ISO format: YYYY-MM-DD or null
    date_finished: Optional[str] = None  # ISO format: YYYY-MM-DD or null


class BookMetadataUpdate(BaseModel):
    """Request body for updating book metadata fields."""
    title: Optional[str] = None
    authors: Optional[List[str]] = None
    series: Optional[str] = None
    series_number: Optional[str] = None
    category: Optional[str] = None
    publication_year: Optional[int] = None


class BooksListResponse(BaseModel):
    """Response for book list endpoint."""
    books: List[BookSummary]
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


def row_to_book_summary(row) -> BookSummary:
    """Convert a database row to BookSummary."""
    authors = parse_json_field(row["authors"])
    primary_author = authors[0] if authors else "Unknown Author"
    
    # Generate cover style from title/author
    cover_style = get_cover_style(row["title"] or "Untitled", primary_author, Theme.DARK)
    
    return BookSummary(
        id=row["id"],
        title=row["title"],
        authors=authors,
        series=row["series"],
        series_number=row["series_number"],
        category=row["category"],
        status=row["status"],
        rating=row["rating"],
        cover_gradient=cover_style.css_gradient,
        cover_bg_color=cover_style.background_color,
        cover_text_color=cover_style.text_color,
        has_notes=row["note_count"] > 0 if "note_count" in row.keys() else False
    )


def row_to_book_detail(row) -> BookDetail:
    """Convert a database row to BookDetail."""
    authors = parse_json_field(row["authors"])
    primary_author = authors[0] if authors else "Unknown Author"
    
    # Generate cover style from title/author
    cover_style = get_cover_style(row["title"] or "Untitled", primary_author, Theme.DARK)
    
    return BookDetail(
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
        word_count=row["word_count"],
        summary=row["summary"],
        tags=parse_json_field(row["tags"]),
        folder_path=row["folder_path"],
        cover_gradient=cover_style.css_gradient,
        cover_bg_color=cover_style.background_color,
        cover_text_color=cover_style.text_color,
    )


# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------

@router.get("/books", response_model=BooksListResponse)
async def list_books(
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
    List all books with optional filtering and sorting.
    
    This is the main endpoint for the library grid view.
    """
    # Build query dynamically based on filters
    where_clauses = []
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
            # Exact match in JSON array - tag must be followed by comma or closing bracket
            where_clauses.append(
                '(LOWER(tags) LIKE ? OR LOWER(tags) LIKE ?)'
            )
            params.extend([
                f'%"{tag}",%',     # Tag followed by comma (not last item)
                f'%"{tag}"]%',     # Tag followed by ] (last item)
            ])
    
    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    # Validate sort field to prevent SQL injection
    valid_sorts = {
        "title": "title",
        "author": "authors",
        "series": "series",
        "updated": "updated_at",
        "year": "publication_year"
    }
    sort_field = valid_sorts.get(sort, "title")
    sort_order = "DESC" if order.lower() == "desc" else "ASC"
    
    # Get total count
    count_sql = f"SELECT COUNT(*) as total FROM books WHERE {where_sql}"
    cursor = await db.execute(count_sql, params)
    total_row = await cursor.fetchone()
    total = total_row["total"] if total_row else 0
    
    # Get books with note count
    query = f"""
        SELECT b.*, 
               (SELECT COUNT(*) FROM notes WHERE book_id = b.id) as note_count
        FROM books b
        WHERE {where_sql}
        ORDER BY {sort_field} {sort_order}
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    
    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()
    
    books = [row_to_book_summary(row) for row in rows]
    
    return BooksListResponse(books=books, total=total)


@router.get("/books/{book_id}", response_model=BookDetail)
async def get_book(book_id: int, db = Depends(get_db)):
    """
    Get full details for a single book.
    """
    cursor = await db.execute(
        "SELECT * FROM books WHERE id = ?",
        [book_id]
    )
    row = await cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return row_to_book_detail(row)


@router.patch("/books/{book_id}/category")
async def update_book_category(
    book_id: int,
    update: BookCategoryUpdate,
    db = Depends(get_db)
):
    """
    Update a book's category.
    """
    # Verify book exists
    cursor = await db.execute("SELECT id FROM books WHERE id = ?", [book_id])
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Convert empty string to NULL for consistency with getCategories filter
    category_value = update.category if update.category else None
    
    # Update category
    await db.execute(
        "UPDATE books SET category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
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
    Update a book's read status.
    Valid statuses: Unread, In Progress, Finished, DNF
    """
    # Verify book exists
    cursor = await db.execute("SELECT id FROM books WHERE id = ?", [book_id])
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
        "UPDATE books SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
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
    Update a book's rating.
    Valid ratings: 1-5, or null to clear.
    """
    # Verify book exists
    cursor = await db.execute("SELECT id FROM books WHERE id = ?", [book_id])
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
        "UPDATE books SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
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
    Update a book's reading dates.
    Dates should be in ISO format (YYYY-MM-DD) or null to clear.
    """
    # Verify book exists
    cursor = await db.execute("SELECT id FROM books WHERE id = ?", [book_id])
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Update dates
    await db.execute(
        """UPDATE books 
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
    Update book metadata fields.
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
    
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Add updated_at timestamp
    updates.append("updated_at = CURRENT_TIMESTAMP")
    
    # Add book_id to params
    params.append(book_id)
    
    query = f"UPDATE books SET {', '.join(updates)} WHERE id = ?"
    
    await db.execute(query, params)
    await db.commit()
    
    # Return updated book using existing helper
    cursor = await db.execute(
        "SELECT * FROM books WHERE id = ?", (book_id,)
    )
    row = await cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return row_to_book_detail(row)


@router.get("/books/{book_id}/notes", response_model=List[Note])
async def get_book_notes(book_id: int, db = Depends(get_db)):
    """
    Get all notes for a specific book.
    """
    # Verify book exists
    cursor = await db.execute("SELECT id FROM books WHERE id = ?", [book_id])
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not found")
    
    cursor = await db.execute(
        "SELECT * FROM notes WHERE book_id = ? ORDER BY updated_at DESC",
        [book_id]
    )
    rows = await cursor.fetchall()
    
    return [
        Note(
            id=row["id"],
            book_id=row["book_id"],
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
    Create or update a note for a book.
    
    For simplicity, each book has one note. If a note exists, it's updated.
    If not, a new one is created.
    """
    # Verify book exists
    cursor = await db.execute("SELECT id FROM books WHERE id = ?", [book_id])
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Check if note already exists
    cursor = await db.execute(
        "SELECT id FROM notes WHERE book_id = ?",
        [book_id]
    )
    existing = await cursor.fetchone()
    
    if existing:
        # Update existing note
        await db.execute(
            """UPDATE notes 
               SET content = ?, updated_at = CURRENT_TIMESTAMP 
               WHERE id = ?""",
            [note_data.content, existing["id"]]
        )
        note_id = existing["id"]
    else:
        # Create new note
        cursor = await db.execute(
            "INSERT INTO notes (book_id, content) VALUES (?, ?)",
            [book_id, note_data.content]
        )
        note_id = cursor.lastrowid
    
    await db.commit()
    
    # TODO: Parse [[links]] from content and update links table
    # This will be implemented in Phase 5
    
    # Return the updated note
    cursor = await db.execute("SELECT * FROM notes WHERE id = ?", [note_id])
    row = await cursor.fetchone()
    
    return Note(
        id=row["id"],
        book_id=row["book_id"],
        content=row["content"] or "",
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )


@router.get("/categories")
async def list_categories(db = Depends(get_db)):
    """
    Get all unique categories in the library.
    Useful for building filter dropdowns.
    """
    cursor = await db.execute(
        "SELECT DISTINCT category FROM books WHERE category IS NOT NULL ORDER BY category"
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
        category_filter = " AND b2.category = ?"
    
    # Query to get series with aggregated data
    # Gets first book's author, counts total and read books
    # Cover is generated from series name + author, not stored in DB
    query = f"""
        SELECT 
            s.name,
            s.author,
            s.book_count,
            s.books_read
        FROM (
            SELECT 
                b.series as name,
                (SELECT authors FROM books b2 
                 WHERE b2.series = b.series{category_filter}
                 ORDER BY CAST(b2.series_number AS FLOAT) ASC, b2.id ASC 
                 LIMIT 1) as author,
                COUNT(*) as book_count,
                SUM(CASE WHEN b.status = 'Finished' THEN 1 ELSE 0 END) as books_read
            FROM books b
            WHERE b.series IS NOT NULL AND b.series != ''
    """
    
    # Add category filter to main query and track params for subqueries
    if category:
        # 1 subquery needs category param, plus main WHERE clause
        params.append(category)
        query += " AND b.category = ?"
        params.append(category)
    
    query += " GROUP BY b.series) s"
    
    # Add search filter (searches series name, author, or book titles in series)
    if search:
        # Join must also respect category filter to avoid false matches
        join_condition = "b.series = s.name"
        if category:
            join_condition += " AND b.category = ?"
            params.append(category)
        
        query = f"""
            SELECT DISTINCT s.* FROM ({query}) s
            LEFT JOIN books b ON {join_condition}
            WHERE s.name LIKE ? 
               OR s.author LIKE ? 
               OR b.title LIKE ?
        """
        search_term = f"%{search}%"
        params.extend([search_term, search_term, search_term])
    
    # Sort alphabetically
    query += " ORDER BY s.name ASC"
    
    cursor = await db.execute(query, params)
    rows = await cursor.fetchall()
    
    series_list = []
    for row in rows:
        # Parse author using the same utility as other book queries
        authors = parse_json_field(row["author"])
        primary_author = authors[0] if authors else "Unknown Author"
        
        # Generate cover style from series name and author
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
    
    # Get all books in this series, ordered by series number
    cursor = await db.execute(
        """
        SELECT id, title, series_number, status, rating, authors
        FROM books 
        WHERE series = ?
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
    # Tags are stored as JSON array in the tags column
    # We need to extract and count them
    
    if category:
        cursor = await db.execute(
            "SELECT tags FROM books WHERE category = ? AND tags IS NOT NULL AND tags != '[]'",
            [category]
        )
    else:
        cursor = await db.execute(
            "SELECT tags FROM books WHERE tags IS NOT NULL AND tags != '[]'"
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