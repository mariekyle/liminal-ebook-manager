"""
Books API endpoints for managing ebook library.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import uuid

from app.config.database import get_db
from app.models.book import Book
from app.models.schemas import BookResponse, BookUpdate, BookUploadResponse

router = APIRouter()

@router.get("/books", response_model=List[BookResponse])
async def get_books(db: Session = Depends(get_db)):
    """Get all books in the library."""
    books = db.query(Book).order_by(Book.added_date.desc()).all()
    return books

@router.get("/books/{book_id}", response_model=BookResponse)
async def get_book(book_id: int, db: Session = Depends(get_db)):
    """Get a specific book by ID."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@router.post("/books/upload", response_model=BookUploadResponse)
async def upload_book(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a new EPUB file and extract metadata."""
    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.epub'):
        raise HTTPException(status_code=400, detail="Only EPUB files are supported")
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join("uploads", unique_filename)
    
    try:
        # Save file
        os.makedirs("uploads", exist_ok=True)
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Extract basic metadata from filename for now
        # TODO: Implement proper EPUB metadata extraction
        metadata = {
            "title": os.path.splitext(file.filename)[0],
            "author": "Unknown Author",
            "description": ""
        }
        
        # Create book record
        book = Book(
            title=metadata.get("title", "Unknown Title"),
            author=metadata.get("author", "Unknown Author"),
            description=metadata.get("description", ""),
            file_path=file_path,
            file_size=len(content)
        )
        
        db.add(book)
        db.commit()
        db.refresh(book)
        
        return BookUploadResponse(
            message="Book uploaded successfully",
            book=book
        )
        
    except Exception as e:
        # Clean up file if database operation fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.put("/books/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: int,
    book_update: BookUpdate,
    db: Session = Depends(get_db)
):
    """Update book metadata."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Update only provided fields
    update_data = book_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(book, field, value)
    
    db.commit()
    db.refresh(book)
    return book

@router.delete("/books/{book_id}")
async def delete_book(book_id: int, db: Session = Depends(get_db)):
    """Delete a book and its file."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    try:
        # Delete file
        file_path_str = str(book.file_path)
        if os.path.exists(file_path_str):
            os.remove(file_path_str)
        
        # Delete database record
        db.delete(book)
        db.commit()
        
        return {"message": "Book deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

@router.get("/books/search/{query}")
async def search_books(query: str, db: Session = Depends(get_db)):
    """Search books by title or author."""
    books = db.query(Book).filter(
        (Book.title.ilike(f"%{query}%")) | (Book.author.ilike(f"%{query}%"))
    ).all()
    return books 