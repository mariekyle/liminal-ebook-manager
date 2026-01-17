"""
Collections Router - CRUD operations for user-defined book collections

Phase 9E Update: Smart Collections
- Three collection types: manual, checklist, automatic
- Default collections: TBR (checklist), Reading History (automatic)
- Checklist completion tracking
- Automatic collection criteria queries

Endpoints:
- Collection CRUD (list, create, get, update, delete)
- Book management (add, remove, reorder)
- Smart paste (parse markdown [[links]], match to library)
- Checklist (mark book completed/uncompleted)
- Automatic collections (preview criteria, get books)
- Utility (get collections for a book, simple list for picker)
"""

import json
import os
import re
import shutil
import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from difflib import SequenceMatcher
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from pydantic import BaseModel

from database import get_db
from services.covers import get_cover_style, Theme

router = APIRouter(tags=["collections"])


def process_book_for_response(book_row) -> dict:
    """Process a book database row into API response format with cover styles."""
    book = dict(book_row)
    
    # Parse authors from JSON string to list
    authors_raw = book.get("authors", "[]")
    try:
        authors = json.loads(authors_raw) if authors_raw else []
    except (json.JSONDecodeError, TypeError):
        authors = []
    
    primary_author = authors[0] if authors else "Unknown Author"
    book["authors"] = authors
    
    # Generate cover style
    cover_style = get_cover_style(book.get("title") or "Untitled", primary_author, Theme.DARK)
    book["cover_gradient"] = cover_style.css_gradient
    book["cover_bg_color"] = cover_style.background_color
    book["cover_text_color"] = cover_style.text_color
    
    return book


# --------------------------------------------------------------------------
# Pydantic Models
# --------------------------------------------------------------------------

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    cover_type: str = 'gradient'  # 'gradient' or 'custom'
    cover_color_1: Optional[str] = None
    cover_color_2: Optional[str] = None
    # Phase 9E: Collection type
    collection_type: str = 'manual'  # 'manual' | 'checklist' | 'automatic'
    auto_criteria: Optional[dict] = None  # For automatic collections


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cover_type: Optional[str] = None
    cover_color_1: Optional[str] = None
    cover_color_2: Optional[str] = None
    # Phase 9E: Can update criteria for automatic collections
    auto_criteria: Optional[dict] = None


class CollectionReorder(BaseModel):
    collection_ids: List[int]


class CollectionBooksAdd(BaseModel):
    title_ids: List[int]


class CollectionBooksReorder(BaseModel):
    title_ids: List[int]


class SmartPasteRequest(BaseModel):
    markdown: str


class ChecklistCompleteRequest(BaseModel):
    completed: bool = True


class AutoCriteriaPreview(BaseModel):
    """Criteria for automatic collections"""
    status: Optional[str] = None  # 'Unread', 'In Progress', 'Finished', 'Abandoned'
    category: Optional[str] = None  # 'Fiction', 'Non-Fiction', 'FanFiction'
    rating_min: Optional[int] = None  # 1-5
    finished: Optional[str] = None  # 'this_month', 'last_30_days', 'this_year', 'last_year'
    word_count_min: Optional[int] = None
    word_count_max: Optional[int] = None
    tags: Optional[List[str]] = None  # Tags to match (AND'd)


# --------------------------------------------------------------------------
# Collection CRUD
# --------------------------------------------------------------------------

@router.get("/collections")
async def list_collections(db=Depends(get_db)):
    """List all collections with book counts and preview books for mosaic covers."""
    
    cursor = await db.execute('''
        SELECT c.*, COUNT(cb.id) as book_count
        FROM collections c
        LEFT JOIN collection_books cb ON c.id = cb.collection_id
        GROUP BY c.id
        ORDER BY c.sort_order ASC, c.created_at DESC
    ''')
    collections = await cursor.fetchall()
    
    result = []
    for c in collections:
        coll = dict(c)
        # Parse auto_criteria JSON if present
        if coll.get('auto_criteria'):
            try:
                coll['auto_criteria'] = json.loads(coll['auto_criteria'])
            except:
                pass
        
        # For automatic collections, get dynamic book count
        if coll.get('collection_type') == 'automatic' and coll.get('auto_criteria'):
            count = await get_automatic_collection_count(coll['auto_criteria'], db)
            coll['book_count'] = count
        
        result.append(coll)
    
    return result


@router.post("/collections")
async def create_collection(data: CollectionCreate, db=Depends(get_db)):
    """Create a new collection."""
    
    # Validate collection type
    if data.collection_type not in ('manual', 'checklist', 'automatic'):
        raise HTTPException(status_code=400, detail="Invalid collection type")
    
    # Automatic collections require criteria
    if data.collection_type == 'automatic' and not data.auto_criteria:
        raise HTTPException(status_code=400, detail="Automatic collections require criteria")
    
    # Get next sort_order
    cursor = await db.execute('SELECT MAX(sort_order) FROM collections')
    row = await cursor.fetchone()
    next_order = (row[0] or 0) + 1
    
    # Serialize auto_criteria to JSON
    auto_criteria_json = json.dumps(data.auto_criteria) if data.auto_criteria else None
    
    cursor = await db.execute('''
        INSERT INTO collections (name, description, cover_type, cover_color_1, cover_color_2, 
                                 collection_type, auto_criteria, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (data.name, data.description, data.cover_type, data.cover_color_1, data.cover_color_2,
          data.collection_type, auto_criteria_json, next_order))
    
    await db.commit()
    
    return {"id": cursor.lastrowid, "message": "Collection created"}


@router.get("/collections/{collection_id}")
async def get_collection(
    collection_id: int, 
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db=Depends(get_db)
):
    """Get collection details with all books."""
    
    cursor = await db.execute('SELECT * FROM collections WHERE id = ?', (collection_id,))
    collection = await cursor.fetchone()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    coll = dict(collection)
    
    # Parse auto_criteria
    if coll.get('auto_criteria'):
        try:
            coll['auto_criteria'] = json.loads(coll['auto_criteria'])
        except:
            pass
    
    # Handle different collection types
    if coll.get('collection_type') == 'automatic':
        # Get books dynamically based on criteria
        books, total = await get_automatic_collection_books(
            coll.get('auto_criteria', {}), 
            limit, 
            offset, 
            db
        )
        return {
            **coll,
            'book_count': total,
            'books': [process_book_for_response(b) for b in books],
            'has_more': offset + len(books) < total
        }
    else:
        # Manual or Checklist: get from collection_books junction table
        books_cursor = await db.execute('''
            SELECT t.*, cb.position, cb.added_at as collection_added_at, cb.completed_at
            FROM collection_books cb
            JOIN titles t ON cb.title_id = t.id
            WHERE cb.collection_id = ?
            ORDER BY cb.position ASC
        ''', (collection_id,))
        books = await books_cursor.fetchall()
        
        processed_books = []
        for b in books:
            book = process_book_for_response(b)
            book['completed_at'] = b['completed_at']
            processed_books.append(book)
        
        # Count completed for checklist
        completed_count = sum(1 for b in processed_books if b.get('completed_at'))
        
        return {
            **coll,
            'book_count': len(books),
            'completed_count': completed_count,
            'books': processed_books
        }


@router.patch("/collections/{collection_id}")
async def update_collection(collection_id: int, data: CollectionUpdate, db=Depends(get_db)):
    """Update collection name, description, or cover settings."""
    
    # Verify collection exists
    cursor = await db.execute('SELECT id, is_default, collection_type FROM collections WHERE id = ?', (collection_id,))
    collection = await cursor.fetchone()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    updates = []
    params = []
    
    if data.name is not None:
        updates.append("name = ?")
        params.append(data.name)
    if data.description is not None:
        updates.append("description = ?")
        params.append(data.description if data.description else None)
    if data.cover_type is not None:
        updates.append("cover_type = ?")
        params.append(data.cover_type)
    if data.cover_color_1 is not None:
        updates.append("cover_color_1 = ?")
        params.append(data.cover_color_1)
    if data.cover_color_2 is not None:
        updates.append("cover_color_2 = ?")
        params.append(data.cover_color_2)
    
    # Allow updating auto_criteria for automatic collections (but not default ones)
    if data.auto_criteria is not None:
        if collection['collection_type'] == 'automatic' and not collection['is_default']:
            updates.append("auto_criteria = ?")
            params.append(json.dumps(data.auto_criteria))
    
    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(collection_id)
        
        await db.execute(
            f"UPDATE collections SET {', '.join(updates)} WHERE id = ?",
            params
        )
        await db.commit()
    
    return {"message": "Collection updated"}


@router.delete("/collections/{collection_id}")
async def delete_collection(collection_id: int, db=Depends(get_db)):
    """Delete a collection (books are NOT deleted, just unlinked)."""
    
    # Verify collection exists and check if it's a default collection
    cursor = await db.execute('SELECT id, is_default, name FROM collections WHERE id = ?', (collection_id,))
    collection = await cursor.fetchone()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Prevent deletion of default collections
    if collection['is_default']:
        raise HTTPException(
            status_code=403, 
            detail=f"'{collection['name']}' is a default collection and cannot be deleted"
        )
    
    # Delete collection (CASCADE will remove collection_books entries)
    await db.execute('DELETE FROM collections WHERE id = ?', (collection_id,))
    await db.commit()
    
    return {"message": "Collection deleted"}


@router.post("/collections/reorder")
async def reorder_collections(data: CollectionReorder, db=Depends(get_db)):
    """Reorder collections list."""
    
    for index, collection_id in enumerate(data.collection_ids):
        await db.execute(
            'UPDATE collections SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            (index, collection_id)
        )
    
    await db.commit()
    return {"message": "Collections reordered"}


# --------------------------------------------------------------------------
# Book Management
# --------------------------------------------------------------------------

@router.post("/collections/{collection_id}/books")
async def add_books_to_collection(collection_id: int, data: CollectionBooksAdd, db=Depends(get_db)):
    """Add books to a collection (manual or checklist only)."""
    
    # Verify collection exists and is not automatic
    cursor = await db.execute(
        'SELECT id, collection_type FROM collections WHERE id = ?', 
        (collection_id,)
    )
    collection = await cursor.fetchone()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    if collection['collection_type'] == 'automatic':
        raise HTTPException(
            status_code=400, 
            detail="Cannot manually add books to automatic collections"
        )
    
    # Get current max position
    cursor = await db.execute(
        'SELECT MAX(position) FROM collection_books WHERE collection_id = ?',
        (collection_id,)
    )
    row = await cursor.fetchone()
    next_position = (row[0] + 1) if row[0] is not None else 0
    
    added = 0
    for title_id in data.title_ids:
        try:
            await db.execute('''
                INSERT INTO collection_books (collection_id, title_id, position)
                VALUES (?, ?, ?)
            ''', (collection_id, title_id, next_position))
            next_position += 1
            added += 1
        except Exception as e:
            # Skip duplicates (UNIQUE constraint)
            if "UNIQUE constraint" not in str(e):
                raise
    
    await db.commit()
    
    return {"message": f"Added {added} books to collection"}


@router.delete("/collections/{collection_id}/books/{title_id}")
async def remove_book_from_collection(collection_id: int, title_id: int, db=Depends(get_db)):
    """Remove a book from a collection (manual or checklist only)."""
    
    # Verify collection exists and check type
    cursor = await db.execute(
        'SELECT id, collection_type FROM collections WHERE id = ?', 
        (collection_id,)
    )
    collection = await cursor.fetchone()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    if collection['collection_type'] == 'automatic':
        raise HTTPException(
            status_code=400, 
            detail="Cannot manually remove books from automatic collections"
        )
    
    # Verify book is in collection
    cursor = await db.execute(
        'SELECT id FROM collection_books WHERE collection_id = ? AND title_id = ?',
        (collection_id, title_id)
    )
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not in collection")
    
    await db.execute('''
        DELETE FROM collection_books 
        WHERE collection_id = ? AND title_id = ?
    ''', (collection_id, title_id))
    
    await db.commit()
    
    return {"message": "Book removed from collection"}


@router.post("/collections/{collection_id}/books/reorder")
async def reorder_books_in_collection(collection_id: int, data: CollectionBooksReorder, db=Depends(get_db)):
    """Reorder books within a collection (manual or checklist only)."""
    
    # Verify collection exists and check type
    cursor = await db.execute(
        'SELECT id, collection_type FROM collections WHERE id = ?', 
        (collection_id,)
    )
    collection = await cursor.fetchone()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    if collection['collection_type'] == 'automatic':
        raise HTTPException(
            status_code=400, 
            detail="Cannot reorder books in automatic collections"
        )
    
    for index, title_id in enumerate(data.title_ids):
        await db.execute('''
            UPDATE collection_books 
            SET position = ?
            WHERE collection_id = ? AND title_id = ?
        ''', (index, collection_id, title_id))
    
    await db.commit()
    
    return {"message": "Books reordered"}


# --------------------------------------------------------------------------
# Phase 9E: Checklist Operations
# --------------------------------------------------------------------------

@router.post("/collections/{collection_id}/books/{title_id}/complete")
async def mark_book_completed(
    collection_id: int, 
    title_id: int, 
    data: ChecklistCompleteRequest,
    db=Depends(get_db)
):
    """Mark a book as completed in a checklist collection."""
    
    # Verify collection exists and is checklist type
    cursor = await db.execute(
        'SELECT id, collection_type FROM collections WHERE id = ?', 
        (collection_id,)
    )
    collection = await cursor.fetchone()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    if collection['collection_type'] != 'checklist':
        raise HTTPException(
            status_code=400, 
            detail="Can only mark books complete in checklist collections"
        )
    
    # Verify book is in collection
    cursor = await db.execute(
        'SELECT id FROM collection_books WHERE collection_id = ? AND title_id = ?',
        (collection_id, title_id)
    )
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not in collection")
    
    # Update completed_at
    if data.completed:
        await db.execute('''
            UPDATE collection_books 
            SET completed_at = CURRENT_TIMESTAMP
            WHERE collection_id = ? AND title_id = ?
        ''', (collection_id, title_id))
    else:
        await db.execute('''
            UPDATE collection_books 
            SET completed_at = NULL
            WHERE collection_id = ? AND title_id = ?
        ''', (collection_id, title_id))
    
    await db.commit()
    
    return {"message": "Book completion status updated", "completed": data.completed}


# --------------------------------------------------------------------------
# Phase 9E: Automatic Collection Helpers
# --------------------------------------------------------------------------

async def build_auto_criteria_query(criteria: dict) -> tuple:
    """Build SQL WHERE clause and params from auto criteria."""
    conditions = []
    params = []
    
    if criteria.get('status'):
        if criteria['status'] == 'Abandoned':
            # Match both new 'Abandoned' and legacy 'DNF' values
            conditions.append("(t.status = ? OR t.status = ?)")
            params.extend(['Abandoned', 'DNF'])
        else:
            conditions.append("t.status = ?")
            params.append(criteria['status'])
    
    if criteria.get('category'):
        conditions.append("t.category = ?")
        params.append(criteria['category'])
    
    if criteria.get('rating_min'):
        conditions.append("t.rating >= ?")
        params.append(criteria['rating_min'])
    
    if criteria.get('finished'):
        now = datetime.now()
        if criteria['finished'] == 'this_month':
            start = now.replace(day=1).strftime('%Y-%m-%d')
            conditions.append("t.date_finished >= ?")
            params.append(start)
        elif criteria['finished'] == 'last_30_days':
            start = (now - timedelta(days=30)).strftime('%Y-%m-%d')
            conditions.append("t.date_finished >= ?")
            params.append(start)
        elif criteria['finished'] == 'this_year':
            start = now.replace(month=1, day=1).strftime('%Y-%m-%d')
            conditions.append("t.date_finished >= ?")
            params.append(start)
        elif criteria['finished'] == 'last_year':
            last_year = now.year - 1
            conditions.append("t.date_finished >= ? AND t.date_finished < ?")
            params.extend([f'{last_year}-01-01', f'{now.year}-01-01'])
    
    if criteria.get('word_count_min'):
        conditions.append("t.word_count >= ?")
        params.append(criteria['word_count_min'])
    
    if criteria.get('word_count_max'):
        conditions.append("t.word_count <= ?")
        params.append(criteria['word_count_max'])
    
    if criteria.get('tags'):
        # Tags are AND'd - book must have ALL selected tags
        for tag in criteria['tags']:
            # Tags stored as JSON array, use LIKE for simple matching
            conditions.append("t.tags LIKE ?")
            params.append(f'%"{tag}"%')
    
    return conditions, params


async def get_automatic_collection_count(criteria: dict, db) -> int:
    """Get count of books matching automatic collection criteria."""
    conditions, params = await build_auto_criteria_query(criteria)
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    cursor = await db.execute(f'''
        SELECT COUNT(*) FROM titles t
        WHERE {where_clause}
    ''', params)
    
    row = await cursor.fetchone()
    return row[0] if row else 0


async def get_automatic_collection_books(criteria: dict, limit: int, offset: int, db) -> tuple:
    """Get books matching automatic collection criteria with pagination."""
    conditions, params = await build_auto_criteria_query(criteria)
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    # Determine sort order
    sort = criteria.get('sort', 'title_asc')
    order_clause = {
        'title_asc': 'ORDER BY t.title ASC',
        'title_desc': 'ORDER BY t.title DESC',
        'finished_date_desc': 'ORDER BY t.date_finished DESC, t.title ASC',
        'finished_date_asc': 'ORDER BY t.date_finished ASC, t.title ASC',
        'rating_desc': 'ORDER BY t.rating DESC, t.title ASC',
        'added_desc': 'ORDER BY t.created_at DESC',
    }.get(sort, 'ORDER BY t.title ASC')
    
    # Get total count
    count_cursor = await db.execute(f'''
        SELECT COUNT(*) FROM titles t WHERE {where_clause}
    ''', params)
    total = (await count_cursor.fetchone())[0]
    
    # Get paginated books
    cursor = await db.execute(f'''
        SELECT t.* FROM titles t
        WHERE {where_clause}
        {order_clause}
        LIMIT ? OFFSET ?
    ''', params + [limit, offset])
    
    books = await cursor.fetchall()
    
    return books, total


@router.post("/collections/preview-criteria")
async def preview_automatic_criteria(data: AutoCriteriaPreview, db=Depends(get_db)):
    """Preview how many books match automatic collection criteria."""
    
    criteria = data.dict(exclude_none=True)
    count = await get_automatic_collection_count(criteria, db)
    
    return {
        "count": count,
        "criteria": criteria
    }


# --------------------------------------------------------------------------
# Smart Paste
# --------------------------------------------------------------------------

@router.post("/collections/smart-paste/preview")
async def smart_paste_preview(data: SmartPasteRequest, db=Depends(get_db)):
    """Parse markdown with [[links]] and match to library books (collection-agnostic preview)."""
    
    # Extract [[links]] from markdown
    pattern = r'\[\[([^\]]+)\]\]'
    found_links = re.findall(pattern, data.markdown)
    
    if not found_links:
        return {
            'matches': [],
            'total_found': 0,
            'total_matched': 0,
            'total_unmatched': 0
        }
    
    # Get all titles for matching
    cursor = await db.execute('SELECT id, title FROM titles')
    all_titles = await cursor.fetchall()
    
    # Create lookup map
    title_map = {t['title'].lower(): (t['id'], t['title']) for t in all_titles}
    
    # Deduplicate while preserving order
    seen = set()
    unique_titles = []
    for t in found_links:
        t_lower = t.lower().strip()
        if t_lower not in seen:
            seen.add(t_lower)
            unique_titles.append(t.strip())
    
    matches = []
    for input_title in unique_titles:
        input_lower = input_title.lower()
        
        # Try exact match first
        if input_lower in title_map:
            book_id, book_title = title_map[input_lower]
            matches.append({
                'input_title': input_title,
                'matched_title_id': book_id,
                'matched_title': book_title,
                'confidence': 'exact'
            })
        else:
            # Try fuzzy match
            best_match = None
            best_ratio = 0
            
            for book_title_lower, (book_id, book_title) in title_map.items():
                ratio = SequenceMatcher(None, input_lower, book_title_lower).ratio()
                if ratio > best_ratio and ratio >= 0.8:  # 80% similarity threshold
                    best_ratio = ratio
                    best_match = (book_id, book_title, ratio)
            
            if best_match:
                matches.append({
                    'input_title': input_title,
                    'matched_title_id': best_match[0],
                    'matched_title': best_match[1],
                    'confidence': 'fuzzy',
                    'similarity': round(best_match[2] * 100)
                })
            else:
                matches.append({
                    'input_title': input_title,
                    'matched_title_id': None,
                    'matched_title': None,
                    'confidence': 'none'
                })
    
    matched_count = sum(1 for m in matches if m['matched_title_id'] is not None)
    
    return {
        'matches': matches,
        'total_found': len(matches),
        'total_matched': matched_count,
        'total_unmatched': len(matches) - matched_count
    }


@router.post("/collections/{collection_id}/smart-paste")
async def smart_paste_parse(collection_id: int, data: SmartPasteRequest, db=Depends(get_db)):
    """Parse markdown with [[links]] and match to library books."""
    
    # Verify collection exists and is not automatic
    cursor = await db.execute(
        'SELECT id, collection_type FROM collections WHERE id = ?', 
        (collection_id,)
    )
    collection = await cursor.fetchone()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    if collection['collection_type'] == 'automatic':
        raise HTTPException(
            status_code=400, 
            detail="Cannot use smart paste with automatic collections"
        )
    
    # Extract [[links]] from markdown
    pattern = r'\[\[([^\]]+)\]\]'
    matches = re.findall(pattern, data.markdown)
    
    if not matches:
        return {
            'matches': [],
            'total_found': 0,
            'total_matched': 0,
            'total_unmatched': 0
        }
    
    # Get all titles for matching
    cursor = await db.execute('SELECT id, title FROM titles')
    all_titles = await cursor.fetchall()
    
    # Create lookup map
    title_map = {t['title'].lower(): (t['id'], t['title']) for t in all_titles}
    
    # Deduplicate while preserving order
    seen = set()
    unique_titles = []
    for t in matches:
        t_lower = t.lower().strip()
        if t_lower not in seen:
            seen.add(t_lower)
            unique_titles.append(t.strip())
    
    matches = []
    for input_title in unique_titles:
        input_lower = input_title.lower()
        
        # Try exact match first
        if input_lower in title_map:
            book_id, book_title = title_map[input_lower]
            matches.append({
                'input_title': input_title,
                'matched_title_id': book_id,
                'matched_title': book_title,
                'confidence': 'exact'
            })
        else:
            # Try fuzzy match
            best_match = None
            best_ratio = 0
            
            for book_title_lower, (book_id, book_title) in title_map.items():
                ratio = SequenceMatcher(None, input_lower, book_title_lower).ratio()
                if ratio > best_ratio and ratio >= 0.8:  # 80% similarity threshold
                    best_ratio = ratio
                    best_match = (book_id, book_title, ratio)
            
            if best_match:
                matches.append({
                    'input_title': input_title,
                    'matched_title_id': best_match[0],
                    'matched_title': best_match[1],
                    'confidence': 'fuzzy',
                    'similarity': round(best_match[2] * 100)
                })
            else:
                matches.append({
                    'input_title': input_title,
                    'matched_title_id': None,
                    'matched_title': None,
                    'confidence': 'none'
                })
    
    matched_count = sum(1 for m in matches if m['matched_title_id'] is not None)
    
    return {
        'matches': matches,
        'total_found': len(matches),
        'total_matched': matched_count,
        'total_unmatched': len(matches) - matched_count
    }


@router.post("/collections/{collection_id}/smart-paste/apply")
async def smart_paste_apply(collection_id: int, data: CollectionBooksAdd, db=Depends(get_db)):
    """Apply smart paste matches - add selected books to collection."""
    return await add_books_to_collection(collection_id, data, db)


# --------------------------------------------------------------------------
# Utility Endpoints
# --------------------------------------------------------------------------

@router.get("/collections/for-book/{title_id}")
async def get_collections_for_book(title_id: int, db=Depends(get_db)):
    """Get all collections a book belongs to (manual and checklist only)."""
    
    cursor = await db.execute('''
        SELECT c.id, c.name, c.cover_type, c.cover_color_1, c.cover_color_2, 
               c.collection_type, cb.completed_at
        FROM collections c
        JOIN collection_books cb ON c.id = cb.collection_id
        WHERE cb.title_id = ?
        ORDER BY c.name
    ''', (title_id,))
    
    collections = await cursor.fetchall()
    return [dict(c) for c in collections]


@router.get("/collections/all/simple")
async def list_all_collections_simple(
    exclude_automatic: bool = Query(False),
    db=Depends(get_db)
):
    """List all collections (id, name, type) for collection picker UI."""
    
    query = '''
        SELECT id, name, collection_type, is_default
        FROM collections
    '''
    
    if exclude_automatic:
        query += " WHERE collection_type != 'automatic'"
    
    query += " ORDER BY sort_order ASC, name ASC"
    
    cursor = await db.execute(query)
    collections = await cursor.fetchall()
    
    return [dict(c) for c in collections]


# --------------------------------------------------------------------------
# Duplicate Collection
# --------------------------------------------------------------------------

class DuplicateCollectionRequest(BaseModel):
    name: str
    collection_type: str = 'manual'  # Target type for the duplicate
    auto_criteria: Optional[dict] = None  # If duplicating to automatic


@router.post("/collections/{collection_id}/duplicate")
async def duplicate_collection(
    collection_id: int, 
    data: DuplicateCollectionRequest, 
    db=Depends(get_db)
):
    """Duplicate a collection, optionally with a different type."""
    
    # Get source collection
    cursor = await db.execute('SELECT * FROM collections WHERE id = ?', (collection_id,))
    source = await cursor.fetchone()
    
    if not source:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    source = dict(source)
    
    # Validate target type
    if data.collection_type not in ('manual', 'checklist', 'automatic'):
        raise HTTPException(status_code=400, detail="Invalid collection type")
    
    if data.collection_type == 'automatic' and not data.auto_criteria:
        # Copy source criteria if available, otherwise error
        if source.get('auto_criteria'):
            data.auto_criteria = json.loads(source['auto_criteria'])
        else:
            raise HTTPException(
                status_code=400, 
                detail="Automatic collections require criteria"
            )
    
    # Get next sort_order
    cursor = await db.execute('SELECT MAX(sort_order) FROM collections')
    row = await cursor.fetchone()
    next_order = (row[0] or 0) + 1
    
    # Create duplicate
    auto_criteria_json = json.dumps(data.auto_criteria) if data.auto_criteria else None
    
    cursor = await db.execute('''
        INSERT INTO collections (name, description, cover_type, cover_color_1, cover_color_2,
                                 collection_type, auto_criteria, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.name,
        source.get('description'),
        source.get('cover_type', 'gradient'),
        source.get('cover_color_1'),
        source.get('cover_color_2'),
        data.collection_type,
        auto_criteria_json,
        next_order
    ))
    
    new_id = cursor.lastrowid
    
    # If target is manual or checklist, copy books from source
    if data.collection_type in ('manual', 'checklist') and source['collection_type'] != 'automatic':
        await db.execute('''
            INSERT INTO collection_books (collection_id, title_id, position)
            SELECT ?, title_id, position
            FROM collection_books
            WHERE collection_id = ?
        ''', (new_id, collection_id))
    
    await db.commit()
    
    return {"id": new_id, "message": "Collection duplicated"}


# =============================================================================
# COVER UPLOAD
# =============================================================================

COVERS_DIR = os.environ.get("COVERS_DIR", "/data/covers")


@router.get("/collections/{id}/cover")
async def get_collection_cover(id: int, db=Depends(get_db)):
    """Serve collection cover image."""
    from fastapi.responses import FileResponse
    
    cursor = await db.execute(
        "SELECT custom_cover_path FROM collections WHERE id = ?", 
        [id]
    )
    collection = await cursor.fetchone()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    cover_path = collection["custom_cover_path"]
    if not cover_path or not os.path.exists(cover_path):
        raise HTTPException(status_code=404, detail="Cover not found")
    
    # Determine media type from extension
    ext = os.path.splitext(cover_path)[1].lower()
    media_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg", 
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif"
    }
    media_type = media_types.get(ext, "image/jpeg")
    
    return FileResponse(cover_path, media_type=media_type)


@router.post("/collections/{id}/cover")
async def upload_collection_cover(
    id: int,
    file: UploadFile = File(...),
    db=Depends(get_db)
):
    """Upload a custom cover image for a collection."""
    
    # Verify collection exists
    cursor = await db.execute("SELECT id, custom_cover_path FROM collections WHERE id = ?", [id])
    collection = await cursor.fetchone()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Use JPEG, PNG, WebP, or GIF.")
    
    # Create covers directory if needed
    os.makedirs(COVERS_DIR, exist_ok=True)
    
    # Delete old cover if exists
    old_path = collection["custom_cover_path"]
    if old_path and os.path.exists(old_path):
        try:
            os.remove(old_path)
        except:
            pass
    
    # Generate unique filename
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"collection_{id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(COVERS_DIR, filename)
    
    # Save file
    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Update collection
    await db.execute("""
        UPDATE collections 
        SET cover_type = 'custom', custom_cover_path = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, [filepath, id])
    await db.commit()
    
    return {"success": True, "custom_cover_path": filepath}


@router.patch("/collections/{id}/cover-type")
async def update_collection_cover_type(
    id: int,
    data: dict,
    db=Depends(get_db)
):
    """Update collection cover type (mosaic, gradient, or custom)."""
    
    cover_type = data.get("cover_type")
    if cover_type not in ["mosaic", "gradient", "custom"]:
        raise HTTPException(status_code=400, detail="Invalid cover type")
    
    # Verify collection exists
    cursor = await db.execute("SELECT id FROM collections WHERE id = ?", [id])
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Collection not found")
    
    await db.execute("""
        UPDATE collections 
        SET cover_type = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, [cover_type, id])
    await db.commit()
    
    return {"success": True, "cover_type": cover_type}


@router.delete("/collections/{id}/cover")
async def delete_collection_cover(
    id: int,
    db=Depends(get_db)
):
    """Delete custom cover and revert to mosaic."""
    
    cursor = await db.execute("SELECT custom_cover_path FROM collections WHERE id = ?", [id])
    collection = await cursor.fetchone()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Delete file if exists
    if collection["custom_cover_path"] and os.path.exists(collection["custom_cover_path"]):
        try:
            os.remove(collection["custom_cover_path"])
        except:
            pass
    
    # Reset to mosaic
    await db.execute("""
        UPDATE collections 
        SET cover_type = 'mosaic', custom_cover_path = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, [id])
    await db.commit()
    
    return {"success": True}
