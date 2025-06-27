from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ...config.database import get_db
from ...models.book import BookDB

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get('/')
async def get_stats(db: Session = Depends(get_db)):
    """Get application statistics"""
    total_books = db.query(func.count(BookDB.id)).scalar()
    total_size = db.query(func.sum(BookDB.file_size)).scalar() or 0
    total_words = db.query(func.sum(BookDB.word_count)).scalar() or 0
    
    return {
        'total_books': total_books,
        'total_size_bytes': total_size,
        'total_size_mb': round(total_size / (1024 * 1024), 2),
        'total_words': total_words,
        'average_words_per_book': round(total_words / total_books, 2) if total_books > 0 else 0
    } 