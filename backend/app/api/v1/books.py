from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import uuid
import aiofiles
from pathlib import Path

from ...config.database import get_db
from ...models.book import BookDB
from ...models.schemas import BookResponse, BookCreate
from ...services.epub_service import extract_epub_metadata, calculate_word_count, extract_and_save_cover, set_epub_cover
from ...utils.validators import validate_file_size, validate_epub_file, validate_image_file

router = APIRouter(prefix="/books", tags=["books"])

@router.get('/', response_model=List[BookResponse])
async def get_books(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all books with optional search and pagination"""
    query = db.query(BookDB)
    
    if search:
        search_term = f'%{search}%'
        query = query.filter(
            (BookDB.title.ilike(search_term)) | 
            (BookDB.author.ilike(search_term)) |
            (BookDB.description.ilike(search_term))
        )
    
    books = query.offset(skip).limit(limit).all()
    return books

@router.get('/{book_id}', response_model=BookResponse)
async def get_book(book_id: int, db: Session = Depends(get_db)):
    """Get a specific book by ID"""
    book = db.query(BookDB).filter(BookDB.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Book not found'
        )
    return book

@router.post('/upload', response_model=BookResponse)
async def upload_book(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a new EPUB book"""
    # Validate file type
    if not validate_epub_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Only EPUB files are supported'
        )
    
    # Validate file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if not validate_file_size(file_size):
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail='File too large'
        )
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    safe_filename = f'{file_id}.epub'
    file_path = f'uploads/books/{safe_filename}'
    
    try:
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Extract metadata and word count
        metadata = extract_epub_metadata(file_path)
        word_count = calculate_word_count(file_path)
        
        # Create book record
        book = BookDB(
            title=metadata['title'],
            author=metadata['author'],
            description=metadata['description'],
            file_path=file_path,
            file_size=file_size,
            isbn=metadata['isbn'],
            language=metadata['language'],
            publisher=metadata['publisher'],
            publication_date=metadata['publication_date'],
            tags=metadata['tags'],
            word_count=word_count
        )
        
        db.add(book)
        db.commit()
        db.refresh(book)

        # Now extract cover and update the book record
        cover_path = extract_and_save_cover(file_path, book.id)
        if cover_path:
            book.cover_path = cover_path
            db.commit()
            db.refresh(book)
        
        return book
        
    except Exception as e:
        # Clean up file if database operation fails
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to upload book'
        )

@router.put('/{book_id}', response_model=BookResponse)
async def update_book(
    book_id: int,
    db: Session = Depends(get_db),
    title: str = File(...),
    author: str = File(...),
    description: Optional[str] = File(None),
    cover_file: Optional[UploadFile] = File(None)
):
    """
    Update a book's details. Can optionally include a new cover image.
    """
    db_book = db.query(BookDB).filter(BookDB.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail='Book not found')

    # Update text fields
    db_book.title = title
    db_book.author = author
    db_book.description = description

    # Handle new cover image upload
    if cover_file:
        # Validate file type
        if not validate_image_file(cover_file.content_type):
            raise HTTPException(status_code=400, detail='Invalid file type. Please upload an image.')
            
        # Create a new path for the cover
        file_extension = Path(cover_file.filename).suffix or '.jpg'
        cover_filename = f"{book_id}{file_extension}"
        cover_path = f"uploads/covers/{cover_filename}"

        # Delete old cover if it exists to prevent orphaned files
        if db_book.cover_path and os.path.exists(db_book.cover_path):
            try:
                os.remove(db_book.cover_path)
            except OSError as e:
                pass

        # Save the new cover
        try:
            with open(cover_path, 'wb') as f:
                shutil.copyfileobj(cover_file.file, f)
            db_book.cover_path = cover_path

            # Also update the cover within the EPUB file itself
            try:
                with open(cover_path, 'rb') as f_cover:
                    cover_content = f_cover.read()
                set_epub_cover(db_book.file_path, cover_content, Path(cover_path).name)
            except Exception as e:
                pass

        except Exception as e:
            raise HTTPException(status_code=500, detail='Failed to save cover image')

    db.commit()
    db.refresh(db_book)
    return db_book

@router.delete('/{book_id}')
async def delete_book(book_id: int, db: Session = Depends(get_db)):
    """Delete a book and its associated files"""
    book = db.query(BookDB).filter(BookDB.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Book not found'
        )
    
    try:
        # Delete associated files
        if book.file_path and os.path.exists(book.file_path):
            os.remove(book.file_path)
        
        if book.cover_path and os.path.exists(book.cover_path):
            os.remove(book.cover_path)
        
        # Delete from database
        db.delete(book)
        db.commit()
        
        return {'message': 'Book deleted successfully'}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to delete book'
        )

@router.get('/{book_id}/download')
async def download_book(book_id: int, db: Session = Depends(get_db)):
    """Download a book file"""
    book = db.query(BookDB).filter(BookDB.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Book not found'
        )
    
    if not os.path.exists(book.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Book file not found'
        )
    
    return FileResponse(
        path=book.file_path,
        filename=f"{book.title}.epub",
        media_type='application/epub+zip'
    ) 