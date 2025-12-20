"""
Import Data API Router

Endpoints for importing reading metadata from Obsidian notes.
Handles: status, rating, date_started, date_finished

Notes import is deferred to Phase 2 when structured notes are implemented.

Updated: Added web UI support with parse/preview endpoints and improved parser.
"""

import json
import re
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from database import get_db


router = APIRouter(prefix="/api", tags=["import"])


# --------------------------------------------------------------------------
# Request/Response Models
# --------------------------------------------------------------------------

class ReadingMetadataImport(BaseModel):
    """Data for updating a book's reading metadata (no notes)."""
    status: Optional[str] = None  # Unread, In Progress, Finished, DNF
    rating: Optional[int] = None  # 1-5
    date_started: Optional[str] = None  # YYYY-MM-DD
    date_finished: Optional[str] = None  # YYYY-MM-DD


class BookMatch(BaseModel):
    """A potential book match."""
    id: int
    title: str
    authors: list[str]
    series: Optional[str]
    category: Optional[str]
    confidence: float  # 0.0 to 1.0


class MatchResult(BaseModel):
    """Result of book matching."""
    matches: list[BookMatch]
    best_match: Optional[BookMatch]
    search_title: Optional[str]
    search_author: Optional[str]


class ImportResult(BaseModel):
    """Result of an import operation."""
    success: bool
    book_id: Optional[int]
    book_title: Optional[str]
    message: str
    fields_updated: list[str]


class ImportStats(BaseModel):
    """Statistics about import progress."""
    total_books: int
    by_status: dict[str, int]
    with_ratings: int
    with_dates: int
    without_reading_data: int


class ParsedNoteData(BaseModel):
    """Parsed data from a single Obsidian note."""
    filename: str
    title: Optional[str]
    authors: list[str]
    status: Optional[str]
    rating: Optional[int]
    date_started: Optional[str]
    date_finished: Optional[str]
    parse_warnings: list[str]


class ParseRequest(BaseModel):
    """Request to parse markdown content."""
    filename: str
    content: str


class ParseResponse(BaseModel):
    """Response from parsing a note."""
    parsed: ParsedNoteData
    has_importable_data: bool


class PreviewItem(BaseModel):
    """Preview of a single import."""
    filename: str
    parsed: ParsedNoteData
    match: Optional[BookMatch]
    match_status: str  # "matched", "low_confidence", "no_match"
    will_import: dict  # Fields that will be imported


class PreviewRequest(BaseModel):
    """Request to preview imports for multiple notes."""
    notes: list[ParseRequest]


class PreviewResponse(BaseModel):
    """Response with preview of all imports."""
    items: list[PreviewItem]
    summary: dict


class BatchImportRequest(BaseModel):
    """Request to import multiple notes."""
    imports: list[dict]  # [{book_id, status, rating, date_started, date_finished}, ...]


class BatchImportResponse(BaseModel):
    """Response from batch import."""
    success_count: int
    error_count: int
    results: list[ImportResult]


# --------------------------------------------------------------------------
# Improved Parser Functions
# --------------------------------------------------------------------------

def parse_date(date_str: str, _recursed: bool = False) -> Optional[str]:
    """Parse various date formats to ISO format (YYYY-MM-DD)."""
    if not date_str:
        return None
    
    date_str = str(date_str).strip()
    
    # Handle ISO datetime with time (2025-10-07T23:36:00)
    if 'T' in date_str:
        date_str = date_str.split('T')[0]
    
    formats = [
        "%Y-%m-%d",      # ISO format first (most common in YAML)
        "%m/%d/%Y", "%m-%d-%Y",
        "%B %d, %Y", "%b %d, %Y", "%m/%d/%y", "%d/%m/%Y",
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    
    # Try to extract date pattern from string (only once, no recursion)
    if not _recursed:
        match = re.search(r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})', date_str)
        if match:
            return parse_date(match.group(1), _recursed=True)
    
    return None


def parse_rating(rating_input) -> Optional[int]:
    """Parse rating formats to 1-5 integer."""
    if not rating_input:
        return None
    
    # Handle list input (from YAML multi-line list)
    if isinstance(rating_input, list):
        if len(rating_input) == 0:
            return None
        rating_input = rating_input[0]  # Take first item
    
    rating_str = str(rating_input).strip().lower()
    
    # Look for number at start: "4 (Better than good)" or "4 - Better than good"
    match = re.match(r'^(\d)\s*[\(\-]', rating_str)
    if match:
        rating = int(match.group(1))
        if 1 <= rating <= 5:
            return rating
    
    # Look for X/5 pattern
    match = re.search(r'(\d)\s*/\s*5', rating_str)
    if match:
        rating = int(match.group(1))
        if 1 <= rating <= 5:
            return rating
    
    # Descriptive ratings
    rating_keywords = {
        5: ['all time fav', 'all-time fav', 'loved', 'amazing', 'perfect'],
        4: ['better than good', 'great', 'really good'],
        3: ['decent', 'fine', 'good', 'okay'],
        2: ['disappointing', 'meh', 'not great'],
        1: ['disliked', 'bad', 'terrible', 'hated']
    }
    
    for rating_val, keywords in rating_keywords.items():
        for keyword in keywords:
            if keyword in rating_str:
                return rating_val
    
    return None


def parse_status(content: str, date_finished: Optional[str] = None) -> str:
    """Determine reading status from content."""
    content_lower = content.lower()
    
    # Check for DNF
    if re.search(r'\bdnf\b|did not finish|stopped reading|stopped\s*/\s*dnf', content_lower):
        return 'DNF'
    
    # Explicit status in frontmatter
    status_match = re.search(r'status:\s*(\w+)', content_lower)
    if status_match:
        status = status_match.group(1)
        status_map = {
            'read': 'Finished', 'finished': 'Finished', 'complete': 'Finished',
            'reading': 'In Progress', 'in progress': 'In Progress',
            'unread': 'Unread', 'tbr': 'Unread', 'dnf': 'DNF',
        }
        return status_map.get(status, 'Unread')
    
    # If has finished date, mark as Finished
    if date_finished:
        return 'Finished'
    
    # Check for "Finished:" line
    if re.search(r'^finished:', content_lower, re.MULTILINE):
        return 'Finished'
    
    # Check for review language that implies finished
    review_phrases = [
        r'after reading',
        r'overall feeling after',
        r'this book was',
        r'i (really\s+)?(enjoyed|loved|liked|hated)',
        r'this was (a\s+)?(good|great|bad|okay)',
        r'one of my (favorite|least favorite)',
    ]
    for phrase in review_phrases:
        if re.search(phrase, content_lower):
            return 'Finished'
    
    return 'Unread'


def extract_yaml_frontmatter(content: str) -> dict:
    """Extract YAML frontmatter from markdown."""
    frontmatter = {}
    
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n?', content, re.DOTALL)
    if match:
        yaml_content = match.group(1)
        lines = yaml_content.split('\n')
        current_key = None
        current_list = None
        
        for line in lines:
            # Check if this is a list item (starts with "  - ")
            list_match = re.match(r'^\s+-\s+(.+)$', line)
            if list_match and current_key:
                if current_list is None:
                    current_list = []
                current_list.append(list_match.group(1).strip().strip('"\''))
                continue
            
            # Check if this is a key: value line
            if ':' in line and not line.startswith(' '):
                # Save previous list if exists
                if current_key and current_list is not None:
                    frontmatter[current_key] = current_list
                    current_list = None
                
                key, _, value = line.partition(':')
                key = key.strip()
                value = value.strip().strip('"\'')
                current_key = key
                
                # Handle inline arrays like author: [Name]
                if value.startswith('[') and value.endswith(']'):
                    value = [v.strip().strip('"\'') for v in value[1:-1].split(',')]
                    frontmatter[key] = value
                    current_key = None
                elif value:
                    # Simple key: value
                    frontmatter[key] = value
                    current_key = None  # Reset if there's a value (not a list)
                # If value is empty, might be followed by list items
        
        # Don't forget the last list
        if current_key and current_list is not None:
            frontmatter[current_key] = current_list
    
    return frontmatter


def extract_inline_metadata(content: str) -> dict:
    """Extract inline metadata patterns."""
    metadata = {}
    
    # Author - handle wikilinks and plain text with "Author:" label
    for pattern in [r'Author:\s*\[\[(.*?)\]\]', r'Author:\s*([^\n\[]+)']:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            metadata['author'] = match.group(1).strip()
            break
    
    # If no labeled author, check early lines for author name
    if 'author' not in metadata:
        lines = content.split('\n')
        for i, line in enumerate(lines[:5]):
            line = line.strip()
            if not line:
                continue
            if line.startswith('[[') or line.startswith('#'):
                continue
            if re.match(r'^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$', line):
                continue
            if any(kw in line.lower() for kw in ['series:', 'theme:', 'started:', 'finished:', 'tag:', 'status:']):
                continue
            # Check if it looks like an author name
            if len(line) < 50 and re.match(r'^[A-Z][a-zA-Z\s,\.]+$', line):
                if not re.search(r'\d+\s*(of|/)\s*\d+', line):
                    metadata['author'] = line
                    break
    
    # Dates with labels
    match = re.search(r'Started:\s*([^\n]+)', content, re.IGNORECASE)
    if match:
        metadata['date_started'] = match.group(1).strip()
    
    match = re.search(r'Finished:\s*([^\n,]+)', content, re.IGNORECASE)
    if match:
        metadata['date_finished'] = match.group(1).strip()
    
    # If no labeled dates, look for standalone date line
    if 'date_started' not in metadata and 'date_finished' not in metadata:
        date_line_match = re.search(r'^(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})$', content, re.MULTILINE)
        if date_line_match:
            metadata['date_finished'] = date_line_match.group(1)
    
    # Rating - multiple patterns
    for pattern in [r'Ranking[:\s]+([^\n(]+(?:\([^)]+\))?)', r'Rating[:\s]+([^\n]+)']:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            metadata['rating'] = match.group(1).strip()
            break
    
    return metadata


def extract_title(content: str, filename: Optional[str] = None) -> Optional[str]:
    """Extract book title from content or filename."""
    frontmatter = extract_yaml_frontmatter(content)
    if frontmatter.get('title'):
        return frontmatter['title']
    
    # H1 heading
    match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    if match:
        title = re.sub(r'\[\[([^\]|]+)(?:\|[^\]]+)?\]\]', r'\1', match.group(1).strip())
        return title
    
    # Filename
    if filename:
        return filename.replace('.md', '').replace('_', ' ')
    
    return None


def parse_book_note(content: str, filename: Optional[str] = None) -> ParsedNoteData:
    """Parse a book note and extract metadata."""
    warnings = []
    
    frontmatter = extract_yaml_frontmatter(content)
    inline_meta = extract_inline_metadata(content)
    
    # Title
    title = frontmatter.get('title') or extract_title(content, filename)
    if not title:
        warnings.append("Could not extract title")
    
    # Authors - check both 'author' and 'authors' keys
    authors = []
    if frontmatter.get('authors'):
        author_data = frontmatter['authors']
        authors = author_data if isinstance(author_data, list) else [author_data]
    elif frontmatter.get('author'):
        author_data = frontmatter['author']
        authors = author_data if isinstance(author_data, list) else [author_data]
    elif inline_meta.get('author'):
        authors = [inline_meta['author']]
    
    # Dates
    raw_started = frontmatter.get('date_started') or inline_meta.get('date_started')
    raw_finished = frontmatter.get('date_finished') or inline_meta.get('date_finished')
    date_started = parse_date(str(raw_started)) if raw_started else None
    date_finished = parse_date(str(raw_finished)) if raw_finished else None
    
    # Rating
    raw_rating = frontmatter.get('rating') or inline_meta.get('rating')
    rating = parse_rating(raw_rating) if raw_rating else None
    
    # Status
    status = parse_status(content, date_finished)
    
    return ParsedNoteData(
        filename=filename or "unknown.md",
        title=title,
        authors=authors,
        status=status,
        rating=rating,
        date_started=date_started,
        date_finished=date_finished,
        parse_warnings=warnings
    )


# --------------------------------------------------------------------------
# Helper Functions
# --------------------------------------------------------------------------

def normalize_string(s: str) -> str:
    """Normalize string for comparison."""
    if not s:
        return ""
    return re.sub(r'[^\w\s]', '', s.lower()).strip()


def calculate_match_confidence(
    db_title: str, 
    db_authors: list[str],
    search_title: str,
    search_author: Optional[str]
) -> float:
    """Calculate confidence score for book match."""
    confidence = 0.0
    
    norm_db_title = normalize_string(db_title)
    norm_search_title = normalize_string(search_title)
    
    # Title matching (up to 0.6)
    if norm_db_title == norm_search_title:
        confidence += 0.6
    elif norm_search_title in norm_db_title or norm_db_title in norm_search_title:
        confidence += 0.4
    else:
        db_words = set(norm_db_title.split())
        search_words = set(norm_search_title.split())
        if db_words and search_words:
            overlap = len(db_words & search_words) / max(len(db_words), len(search_words))
            confidence += overlap * 0.3
    
    # Author matching (up to 0.4)
    if search_author:
        norm_search_author = normalize_string(search_author)
        for db_author in db_authors:
            norm_db_author = normalize_string(db_author)
            if norm_db_author == norm_search_author:
                confidence += 0.4
                break
            elif norm_search_author in norm_db_author or norm_db_author in norm_search_author:
                confidence += 0.3
                break
    
    return min(confidence, 1.0)


async def find_matching_books(
    db,
    title: Optional[str],
    author: Optional[str],
    limit: int = 10
) -> list[BookMatch]:
    """Find books matching title and/or author."""
    if not title and not author:
        return []
    
    matches = []
    query_parts = []
    params = []
    
    if title:
        clean_title = re.sub(r'[^\w\s]', '', title)
        query_parts.append("(title LIKE ? OR title LIKE ?)")
        params.extend([f'%{title}%', f'%{clean_title}%'])
    
    if author:
        query_parts.append("authors LIKE ?")
        params.append(f'%{author}%')
    
    where_clause = " OR ".join(query_parts) if query_parts else "1=1"
    
    cursor = await db.execute(
        f"""SELECT id, title, authors, series, category 
            FROM books 
            WHERE {where_clause}
            LIMIT ?""",
        params + [limit * 2]
    )
    
    rows = await cursor.fetchall()
    
    for row in rows:
        try:
            authors_list = json.loads(row['authors']) if row['authors'] else []
        except json.JSONDecodeError:
            authors_list = [row['authors']] if row['authors'] else []
        
        confidence = calculate_match_confidence(
            row['title'],
            authors_list,
            title or "",
            author
        )
        
        if confidence > 0.1:
            matches.append(BookMatch(
                id=row['id'],
                title=row['title'],
                authors=authors_list,
                series=row['series'],
                category=row['category'],
                confidence=confidence
            ))
    
    matches.sort(key=lambda m: m.confidence, reverse=True)
    return matches[:limit]


# --------------------------------------------------------------------------
# API Endpoints
# --------------------------------------------------------------------------

@router.post("/import/parse", response_model=ParseResponse)
async def parse_note(request: ParseRequest):
    """
    Parse a single Obsidian markdown note and return extracted metadata.
    Does not require database access - pure parsing.
    """
    parsed = parse_book_note(request.content, request.filename)
    
    # Check if there's importable data
    has_data = (
        (parsed.status and parsed.status != 'Unread') or
        parsed.rating is not None or
        parsed.date_started is not None or
        parsed.date_finished is not None
    )
    
    return ParseResponse(parsed=parsed, has_importable_data=has_data)


@router.post("/import/preview", response_model=PreviewResponse)
async def preview_imports(request: PreviewRequest, db=Depends(get_db)):
    """
    Parse multiple notes and preview what would be imported.
    Returns parsed data, best match, and what fields would be updated.
    """
    items = []
    summary = {
        "total": len(request.notes),
        "matched": 0,
        "low_confidence": 0,
        "no_match": 0,
        "no_data": 0
    }
    
    for note in request.notes:
        parsed = parse_book_note(note.content, note.filename)
        
        # Find matching book
        author = parsed.authors[0] if parsed.authors else None
        matches = await find_matching_books(db, parsed.title, author, limit=5)
        
        best_match = None
        match_status = "no_match"
        
        if matches:
            best_match = matches[0]
            if best_match.confidence >= 0.6:
                match_status = "matched"
                summary["matched"] += 1
            else:
                match_status = "low_confidence"
                summary["low_confidence"] += 1
        else:
            summary["no_match"] += 1
        
        # Determine what would be imported
        will_import = {}
        if parsed.status and parsed.status != 'Unread':
            will_import['status'] = parsed.status
        if parsed.rating:
            will_import['rating'] = parsed.rating
        if parsed.date_started:
            will_import['date_started'] = parsed.date_started
        if parsed.date_finished:
            will_import['date_finished'] = parsed.date_finished
        
        if not will_import:
            summary["no_data"] += 1
        
        items.append(PreviewItem(
            filename=note.filename,
            parsed=parsed,
            match=best_match,
            match_status=match_status,
            will_import=will_import
        ))
    
    return PreviewResponse(items=items, summary=summary)


@router.post("/import/batch", response_model=BatchImportResponse)
async def batch_import(request: BatchImportRequest, db=Depends(get_db)):
    """
    Import metadata for multiple books at once.
    Each item should have book_id and the fields to update.
    """
    results = []
    success_count = 0
    error_count = 0
    
    for item in request.imports:
        book_id = item.get('book_id')
        if not book_id:
            results.append(ImportResult(
                success=False,
                book_id=None,
                book_title=None,
                message="Missing book_id",
                fields_updated=[]
            ))
            error_count += 1
            continue
        
        # Check book exists
        cursor = await db.execute("SELECT id, title FROM books WHERE id = ?", [book_id])
        book = await cursor.fetchone()
        
        if not book:
            results.append(ImportResult(
                success=False,
                book_id=book_id,
                book_title=None,
                message=f"Book not found",
                fields_updated=[]
            ))
            error_count += 1
            continue
        
        # Build update
        fields_updated = []
        update_parts = []
        update_params = []
        
        if item.get('status'):
            update_parts.append("status = ?")
            update_params.append(item['status'])
            fields_updated.append("status")
        
        if item.get('rating'):
            update_parts.append("rating = ?")
            update_params.append(item['rating'])
            fields_updated.append("rating")
        
        if item.get('date_started'):
            update_parts.append("date_started = ?")
            update_params.append(item['date_started'])
            fields_updated.append("date_started")
        
        if item.get('date_finished'):
            update_parts.append("date_finished = ?")
            update_params.append(item['date_finished'])
            fields_updated.append("date_finished")
        
        if update_parts:
            update_parts.append("updated_at = CURRENT_TIMESTAMP")
            query = f"UPDATE books SET {', '.join(update_parts)} WHERE id = ?"
            await db.execute(query, update_params + [book_id])
        
        results.append(ImportResult(
            success=True,
            book_id=book_id,
            book_title=book['title'],
            message=f"Updated {len(fields_updated)} fields",
            fields_updated=fields_updated
        ))
        success_count += 1
    
    await db.commit()
    
    return BatchImportResponse(
        success_count=success_count,
        error_count=error_count,
        results=results
    )


@router.get("/books/match", response_model=MatchResult)
async def match_book(
    title: Optional[str] = Query(None, description="Book title to search for"),
    author: Optional[str] = Query(None, description="Author name to search for"),
    db=Depends(get_db)
):
    """
    Find books matching the given title and/or author.
    Returns up to 10 matches sorted by confidence score.
    """
    if not title and not author:
        raise HTTPException(
            status_code=400, 
            detail="At least one of 'title' or 'author' must be provided"
        )
    
    matches = await find_matching_books(db, title, author)
    best_match = matches[0] if matches and matches[0].confidence >= 0.5 else None
    
    return MatchResult(
        matches=matches,
        best_match=best_match,
        search_title=title,
        search_author=author
    )


@router.post("/books/{book_id}/reading-metadata", response_model=ImportResult)
async def update_reading_metadata(
    book_id: int,
    data: ReadingMetadataImport,
    db=Depends(get_db)
):
    """
    Update a book's reading metadata (status, rating, dates).
    Only updates fields that are provided (non-null).
    """
    cursor = await db.execute("SELECT id, title FROM books WHERE id = ?", [book_id])
    book = await cursor.fetchone()
    
    if not book:
        raise HTTPException(status_code=404, detail=f"Book with id {book_id} not found")
    
    fields_updated = []
    update_parts = []
    update_params = []
    
    if data.status is not None:
        valid_statuses = ['Unread', 'In Progress', 'Finished', 'DNF']
        if data.status not in valid_statuses:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        update_parts.append("status = ?")
        update_params.append(data.status)
        fields_updated.append("status")
    
    if data.rating is not None:
        if not 1 <= data.rating <= 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        update_parts.append("rating = ?")
        update_params.append(data.rating)
        fields_updated.append("rating")
    
    if data.date_started is not None:
        update_parts.append("date_started = ?")
        update_params.append(data.date_started)
        fields_updated.append("date_started")
    
    if data.date_finished is not None:
        update_parts.append("date_finished = ?")
        update_params.append(data.date_finished)
        fields_updated.append("date_finished")
    
    if not update_parts:
        return ImportResult(
            success=True,
            book_id=book_id,
            book_title=book['title'],
            message="No fields to update",
            fields_updated=[]
        )
    
    update_parts.append("updated_at = CURRENT_TIMESTAMP")
    query = f"UPDATE books SET {', '.join(update_parts)} WHERE id = ?"
    await db.execute(query, update_params + [book_id])
    await db.commit()
    
    return ImportResult(
        success=True,
        book_id=book_id,
        book_title=book['title'],
        message=f"Updated {len(fields_updated)} fields",
        fields_updated=fields_updated
    )


@router.get("/import/stats", response_model=ImportStats)
async def get_import_stats(db=Depends(get_db)):
    """
    Get statistics about books with/without reading data.
    Useful for tracking migration progress.
    """
    cursor = await db.execute("""
        SELECT status, COUNT(*) as count
        FROM books
        GROUP BY status
    """)
    status_counts = {row['status'] or 'Unread': row['count'] for row in await cursor.fetchall()}
    
    cursor = await db.execute("SELECT COUNT(*) as count FROM books WHERE rating IS NOT NULL")
    rated_count = (await cursor.fetchone())['count']
    
    cursor = await db.execute("""
        SELECT COUNT(*) as count FROM books 
        WHERE date_started IS NOT NULL OR date_finished IS NOT NULL
    """)
    with_dates_count = (await cursor.fetchone())['count']
    
    cursor = await db.execute("SELECT COUNT(*) as count FROM books")
    total_count = (await cursor.fetchone())['count']
    
    return ImportStats(
        total_books=total_count,
        by_status=status_counts,
        with_ratings=rated_count,
        with_dates=with_dates_count,
        without_reading_data=status_counts.get('Unread', 0)
    )
