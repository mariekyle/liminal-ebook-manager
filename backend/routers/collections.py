"""
Collections Router - CRUD operations for user-defined book collections

Endpoints:
- Collection CRUD (list, create, get, update, delete)
- Book management (add, remove, reorder)
- Smart paste (parse markdown [[links]], match to library)
- Utility (get collections for a book, simple list for picker)
"""

import json
import os
import re
import shutil
import uuid
from typing import Optional, List
from difflib import SequenceMatcher
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel

from database import get_db

router = APIRouter(tags=["collections"])


# --------------------------------------------------------------------------
# Pydantic Models
# --------------------------------------------------------------------------

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    cover_type: str = 'mosaic'  # 'mosaic', 'gradient', 'custom'
    cover_color_1: Optional[str] = None
    cover_color_2: Optional[str] = None


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cover_type: Optional[str] = None
    cover_color_1: Optional[str] = None
    cover_color_2: Optional[str] = None


class CollectionReorder(BaseModel):
    collection_ids: List[int]


class CollectionBooksAdd(BaseModel):
    title_ids: List[int]


class CollectionBooksReorder(BaseModel):
    title_ids: List[int]


class SmartPasteRequest(BaseModel):
    markdown: str


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
        # Get first 4 books for mosaic preview
        preview_cursor = await db.execute('''
            SELECT t.id, t.title, t.authors, t.cover_color_1, t.cover_color_2
            FROM collection_books cb
            JOIN titles t ON cb.title_id = t.id
            WHERE cb.collection_id = ?
            ORDER BY cb.position ASC
            LIMIT 4
        ''', (c['id'],))
        preview_books = await preview_cursor.fetchall()
        
        result.append({
            **dict(c),
            'preview_books': [dict(b) for b in preview_books]
        })
    
    return result


@router.post("/collections")
async def create_collection(data: CollectionCreate, db=Depends(get_db)):
    """Create a new collection."""
    
    # Get next sort_order
    cursor = await db.execute('SELECT MAX(sort_order) FROM collections')
    row = await cursor.fetchone()
    next_order = (row[0] or 0) + 1
    
    cursor = await db.execute('''
        INSERT INTO collections (name, description, cover_type, cover_color_1, cover_color_2, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (data.name, data.description, data.cover_type, data.cover_color_1, data.cover_color_2, next_order))
    
    await db.commit()
    
    return {"id": cursor.lastrowid, "message": "Collection created"}


@router.get("/collections/{collection_id}")
async def get_collection(collection_id: int, db=Depends(get_db)):
    """Get collection details with all books."""
    
    cursor = await db.execute('SELECT * FROM collections WHERE id = ?', (collection_id,))
    collection = await cursor.fetchone()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Get all books in collection with full details
    books_cursor = await db.execute('''
        SELECT t.*, cb.position, cb.added_at as collection_added_at
        FROM collection_books cb
        JOIN titles t ON cb.title_id = t.id
        WHERE cb.collection_id = ?
        ORDER BY cb.position ASC
    ''', (collection_id,))
    books = await books_cursor.fetchall()
    
    return {
        **dict(collection),
        'book_count': len(books),
        'books': [dict(b) for b in books]
    }


@router.patch("/collections/{collection_id}")
async def update_collection(collection_id: int, data: CollectionUpdate, db=Depends(get_db)):
    """Update collection name, description, or cover settings."""
    
    # Verify collection exists
    cursor = await db.execute('SELECT id FROM collections WHERE id = ?', (collection_id,))
    if not await cursor.fetchone():
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
    
    # Verify collection exists
    cursor = await db.execute('SELECT id FROM collections WHERE id = ?', (collection_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Collection not found")
    
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
    """Add books to a collection."""
    
    # Verify collection exists
    cursor = await db.execute('SELECT id FROM collections WHERE id = ?', (collection_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Get current max position
    cursor = await db.execute(
        'SELECT MAX(position) FROM collection_books WHERE collection_id = ?',
        (collection_id,)
    )
    row = await cursor.fetchone()
    next_position = (row[0] or -1) + 1
    
    added = 0
    for title_id in data.title_ids:
        # Check if already in collection
        cursor = await db.execute(
            'SELECT id FROM collection_books WHERE collection_id = ? AND title_id = ?',
            (collection_id, title_id)
        )
        if await cursor.fetchone():
            continue  # Skip duplicates
        
        await db.execute('''
            INSERT INTO collection_books (collection_id, title_id, position)
            VALUES (?, ?, ?)
        ''', (collection_id, title_id, next_position))
        next_position += 1
        added += 1
    
    # Update collection timestamp
    await db.execute(
        'UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        (collection_id,)
    )
    
    await db.commit()
    
    return {"message": f"Added {added} book(s) to collection", "added": added}


@router.delete("/collections/{collection_id}/books/{title_id}")
async def remove_book_from_collection(collection_id: int, title_id: int, db=Depends(get_db)):
    """Remove a book from a collection."""
    
    cursor = await db.execute(
        'SELECT id FROM collection_books WHERE collection_id = ? AND title_id = ?',
        (collection_id, title_id)
    )
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not found in collection")
    
    await db.execute('''
        DELETE FROM collection_books 
        WHERE collection_id = ? AND title_id = ?
    ''', (collection_id, title_id))
    
    # Update collection timestamp
    await db.execute(
        'UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        (collection_id,)
    )
    
    await db.commit()
    
    return {"message": "Book removed from collection"}


@router.post("/collections/{collection_id}/books/reorder")
async def reorder_collection_books(collection_id: int, data: CollectionBooksReorder, db=Depends(get_db)):
    """Reorder books within a collection."""
    
    for index, title_id in enumerate(data.title_ids):
        await db.execute('''
            UPDATE collection_books 
            SET position = ?
            WHERE collection_id = ? AND title_id = ?
        ''', (index, collection_id, title_id))
    
    # Update collection timestamp
    await db.execute(
        'UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        (collection_id,)
    )
    
    await db.commit()
    
    return {"message": "Books reordered"}


# --------------------------------------------------------------------------
# Smart Paste
# --------------------------------------------------------------------------

@router.post("/collections/smart-paste/preview")
async def smart_paste_preview(data: SmartPasteRequest, db=Depends(get_db)):
    """Preview matches from pasted markdown with [[Title]] links."""
    
    # Extract [[Title]] patterns from markdown
    pattern = r'\[\[([^\]]+)\]\]'
    found_titles = re.findall(pattern, data.markdown)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_titles = []
    for t in found_titles:
        t_lower = t.lower().strip()
        if t_lower not in seen:
            seen.add(t_lower)
            unique_titles.append(t.strip())
    
    if not unique_titles:
        return {
            'matches': [],
            'total_found': 0,
            'total_matched': 0,
            'total_unmatched': 0
        }
    
    # Get all book titles for matching
    cursor = await db.execute('SELECT id, title FROM titles')
    all_books = await cursor.fetchall()
    
    # Build title lookup (lowercase -> (id, original_title))
    title_map = {}
    for book in all_books:
        title_map[book['title'].lower().strip()] = (book['id'], book['title'])
    
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
    """Get all collections a book belongs to."""
    
    cursor = await db.execute('''
        SELECT c.id, c.name, c.cover_type, c.cover_color_1, c.cover_color_2
        FROM collections c
        JOIN collection_books cb ON c.id = cb.collection_id
        WHERE cb.title_id = ?
        ORDER BY c.name
    ''', (title_id,))
    
    collections = await cursor.fetchall()
    return [dict(c) for c in collections]


@router.get("/collections/all/simple")
async def list_all_collections_simple(db=Depends(get_db)):
    """List all collections (id, name only) for collection picker UI."""
    
    cursor = await db.execute('''
        SELECT id, name
        FROM collections
        ORDER BY sort_order ASC, name ASC
    ''')
    collections = await cursor.fetchall()
    
    return [dict(c) for c in collections]


# =============================================================================
# COVER UPLOAD
# =============================================================================

COVERS_DIR = os.environ.get("COVERS_DIR", "/data/covers")

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

