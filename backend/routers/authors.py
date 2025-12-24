"""
Authors API Router

Handles author-related endpoints:
- List all unique authors
- Get author details with books
- Author notes CRUD
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
import json

router = APIRouter(prefix="/authors", tags=["authors"])


class AuthorNotesUpdate(BaseModel):
    notes: str


class AuthorBookItem(BaseModel):
    id: int
    title: str
    authors: List[str]
    series: Optional[str] = None
    series_number: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    rating: Optional[int] = None
    publication_year: Optional[int] = None
    cover_gradient: Optional[str] = None
    cover_bg_color: Optional[str] = None
    cover_text_color: Optional[str] = None


class AuthorSummary(BaseModel):
    name: str
    book_count: int


class AuthorDetail(BaseModel):
    name: str
    notes: Optional[str] = None
    book_count: int
    books: List[AuthorBookItem]


def parse_json_field(value: str, default: list = None) -> list:
    """Safely parse a JSON string field into a list."""
    if not value:
        return default or []
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return default or []


@router.get("")
async def list_authors(db=Depends(get_db)):
    """Get all unique authors with book counts"""
    cursor = await db.execute("SELECT authors FROM books WHERE authors IS NOT NULL")
    rows = await cursor.fetchall()
    
    # Parse all author arrays and count occurrences
    author_counts = {}
    for row in rows:
        try:
            authors = json.loads(row[0]) if row[0] else []
            for author in authors:
                if author:
                    author_counts[author] = author_counts.get(author, 0) + 1
        except (json.JSONDecodeError, TypeError):
            # Handle non-JSON author strings
            if row[0]:
                author_counts[row[0]] = author_counts.get(row[0], 0) + 1
    
    # Sort by name (case-insensitive)
    sorted_authors = sorted(author_counts.items(), key=lambda x: x[0].lower())
    
    return {
        "authors": [
            {"name": name, "book_count": count}
            for name, count in sorted_authors
        ],
        "total": len(sorted_authors)
    }


@router.get("/{author_name}")
async def get_author(author_name: str, db=Depends(get_db)):
    """Get author details with their books and notes"""
    from urllib.parse import unquote
    author_name = unquote(author_name)
    
    # Get author notes if they exist
    cursor = await db.execute(
        "SELECT notes FROM author_notes WHERE author_name = ?",
        (author_name,)
    )
    notes_row = await cursor.fetchone()
    notes = notes_row[0] if notes_row else None
    
    # Get all books by this author
    # We need to search within JSON arrays
    cursor = await db.execute("""
        SELECT id, title, authors, series, series_number, category, status, rating,
               publication_year
        FROM books 
        WHERE authors LIKE ?
        ORDER BY series, CAST(series_number AS FLOAT), title
    """, (f'%"{author_name}"%',))
    
    rows = await cursor.fetchall()
    columns = [desc[0] for desc in cursor.description]
    
    # Import cover generation
    from services.covers import get_cover_style, Theme
    
    books = []
    for row in rows:
        book = dict(zip(columns, row))
        # Parse authors JSON
        book['authors'] = parse_json_field(book['authors'])
        
        # Only include if author actually matches (not just substring)
        if author_name in book['authors']:
            # Generate cover style
            primary_author = book['authors'][0] if book['authors'] else "Unknown Author"
            cover_style = get_cover_style(book['title'] or "Untitled", primary_author, Theme.DARK)
            
            books.append(AuthorBookItem(
                id=book['id'],
                title=book['title'],
                authors=book['authors'],
                series=book['series'],
                series_number=book['series_number'],
                category=book['category'],
                status=book['status'],
                rating=book['rating'],
                publication_year=book['publication_year'],
                cover_gradient=cover_style.css_gradient,
                cover_bg_color=cover_style.background_color,
                cover_text_color=cover_style.text_color
            ))
    
    if not books and not notes:
        raise HTTPException(status_code=404, detail=f"Author '{author_name}' not found")
    
    return AuthorDetail(
        name=author_name,
        notes=notes,
        book_count=len(books),
        books=books
    )


@router.put("/{author_name}/notes")
async def update_author_notes(author_name: str, update: AuthorNotesUpdate, db=Depends(get_db)):
    """Update or create notes for an author"""
    from urllib.parse import unquote
    author_name = unquote(author_name)
    
    await db.execute("""
        INSERT INTO author_notes (author_name, notes, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(author_name) DO UPDATE SET
            notes = excluded.notes,
            updated_at = CURRENT_TIMESTAMP
    """, (author_name, update.notes))
    await db.commit()
    
    return {"author_name": author_name, "notes": update.notes}

