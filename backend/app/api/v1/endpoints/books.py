from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ....db.base import get_db
from ....models.book import Book
from ....schemas.book import Book as BookSchema, BookList
from ....api.deps import get_current_user
from ....core.logging import logger

router = APIRouter()


@router.get("/", response_model=List[BookList])
async def get_books(
    skip: int = 0,
    limit: int = 50,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all books"""
    books = db.query(Book).offset(skip).limit(limit).all()
    return books


@router.get("/{book_id}", response_model=BookSchema)
async def get_book(
    book_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get book by ID"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    return book


@router.get("/search/{query}", response_model=List[BookList])
async def search_books(
    query: str,
    skip: int = 0,
    limit: int = 50,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search books by title"""
    books = db.query(Book).filter(
        Book.title.ilike(f"%{query}%")
    ).offset(skip).limit(limit).all()
    return books 