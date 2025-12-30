from fastapi import APIRouter, Depends, Query
from datetime import datetime, date
from typing import Literal
import random

from database import get_db

router = APIRouter(prefix="/api/home", tags=["home"])


@router.get("/in-progress")
async def get_in_progress(db=Depends(get_db)):
    """Get up to 5 in-progress owned books."""
    cursor = await db.execute("""
        SELECT 
            t.id, t.title, t.authors, t.series, t.series_number,
            t.category, t.word_count, t.status, t.rating,
            t.cover_color_1, t.cover_color_2, t.acquisition_status
        FROM titles t
        WHERE t.status = 'In Progress' 
          AND t.acquisition_status = 'owned'
          AND (t.is_orphaned IS NULL OR t.is_orphaned = 0)
        ORDER BY t.updated_at DESC
        LIMIT 5
    """)
    rows = await cursor.fetchall()
    
    books = []
    for row in rows:
        books.append({
            "id": row[0],
            "title": row[1],
            "authors": row[2],
            "series": row[3],
            "series_number": row[4],
            "category": row[5],
            "word_count": row[6],
            "status": row[7],
            "rating": row[8],
            "cover_color_1": row[9],
            "cover_color_2": row[10],
            "acquisition_status": row[11]
        })
    
    return {"books": books, "count": len(books)}


@router.get("/recently-added")
async def get_recently_added(db=Depends(get_db)):
    """Get the 20 most recently added owned books."""
    cursor = await db.execute("""
        SELECT 
            t.id, t.title, t.authors, t.series, t.series_number,
            t.category, t.word_count, t.status, t.rating,
            t.cover_color_1, t.cover_color_2, t.acquisition_status,
            t.created_at
        FROM titles t
        WHERE t.acquisition_status = 'owned'
          AND (t.is_orphaned IS NULL OR t.is_orphaned = 0)
        ORDER BY t.created_at DESC
        LIMIT 20
    """)
    rows = await cursor.fetchall()
    
    books = []
    for row in rows:
        books.append({
            "id": row[0],
            "title": row[1],
            "authors": row[2],
            "series": row[3],
            "series_number": row[4],
            "category": row[5],
            "word_count": row[6],
            "status": row[7],
            "rating": row[8],
            "cover_color_1": row[9],
            "cover_color_2": row[10],
            "acquisition_status": row[11],
            "created_at": row[12]
        })
    
    return {"books": books, "count": len(books)}


@router.get("/discover")
async def get_discover(db=Depends(get_db)):
    """Get 6 random unread owned books for discovery."""
    # First, get all unread owned book IDs
    cursor = await db.execute("""
        SELECT id FROM titles
        WHERE status = 'Unread' 
          AND acquisition_status = 'owned'
          AND (is_orphaned IS NULL OR is_orphaned = 0)
    """)
    all_ids = [row[0] for row in await cursor.fetchall()]
    
    if not all_ids:
        return {"books": [], "count": 0}
    
    # Randomly select up to 6
    selected_ids = random.sample(all_ids, min(6, len(all_ids)))
    
    # Fetch full details for selected books
    placeholders = ",".join("?" * len(selected_ids))
    cursor = await db.execute(f"""
        SELECT 
            t.id, t.title, t.authors, t.series, t.series_number,
            t.category, t.word_count, t.status, t.rating,
            t.cover_color_1, t.cover_color_2, t.acquisition_status
        FROM titles t
        WHERE t.id IN ({placeholders})
    """, selected_ids)
    rows = await cursor.fetchall()
    
    books = []
    for row in rows:
        books.append({
            "id": row[0],
            "title": row[1],
            "authors": row[2],
            "series": row[3],
            "series_number": row[4],
            "category": row[5],
            "word_count": row[6],
            "status": row[7],
            "rating": row[8],
            "cover_color_1": row[9],
            "cover_color_2": row[10],
            "acquisition_status": row[11]
        })
    
    # Shuffle to randomize display order
    random.shuffle(books)
    
    return {"books": books, "count": len(books)}


@router.get("/stats")
async def get_stats(
    period: Literal["month", "year"] = Query(default="month"),
    db=Depends(get_db)
):
    """Get reading stats for the current month or year."""
    today = date.today()
    
    if period == "month":
        # First day of current month
        period_start = date(today.year, today.month, 1)
        period_label = today.strftime("%B %Y")  # e.g., "December 2025"
    else:
        # First day of current year
        period_start = date(today.year, 1, 1)
        period_label = str(today.year)  # e.g., "2025"
    
    period_start_str = period_start.isoformat()
    
    # Get words read and titles finished from sessions completed in period
    cursor = await db.execute("""
        SELECT 
            COALESCE(SUM(t.word_count), 0) as words_read,
            COUNT(rs.id) as titles_finished
        FROM reading_sessions rs
        JOIN titles t ON rs.title_id = t.id
        WHERE rs.date_finished >= ?
          AND rs.session_status = 'finished'
          AND t.acquisition_status = 'owned'
    """, (period_start_str,))
    row = await cursor.fetchone()
    words_read = row[0] or 0
    titles_finished = row[1] or 0
    
    # Get category breakdown for finished books in period
    cursor = await db.execute("""
        SELECT 
            t.category,
            COUNT(rs.id) as count
        FROM reading_sessions rs
        JOIN titles t ON rs.title_id = t.id
        WHERE rs.date_finished >= ?
          AND rs.session_status = 'finished'
          AND t.acquisition_status = 'owned'
        GROUP BY t.category
        ORDER BY count DESC
    """, (period_start_str,))
    category_rows = await cursor.fetchall()
    
    categories = []
    total_category_count = sum(row[1] for row in category_rows)
    for row in category_rows:
        cat_name = row[0] or "Uncategorized"
        cat_count = row[1]
        percentage = round((cat_count / total_category_count * 100) if total_category_count > 0 else 0)
        categories.append({
            "name": cat_name,
            "count": cat_count,
            "percentage": percentage
        })
    
    return {
        "period": period,
        "period_label": period_label,
        "words_read": words_read,
        "titles_finished": titles_finished,
        "categories": categories
    }
