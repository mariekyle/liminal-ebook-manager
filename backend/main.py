from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Index, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from pydantic import BaseModel, validator
from datetime import datetime
import os
import shutil
import uuid
import re
import logging
from typing import List, Optional
from pathlib import Path
import aiofiles
from dotenv import load_dotenv
from ebooklib import epub

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO').upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# Create database engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

# Manually alter table columns to ensure they are the correct size.
# This is a simple migration solution for this project.
try:
    with engine.connect() as connection:
        transaction = connection.begin()
        logger.info("Applying manual schema migrations for column sizes...")
        connection.execute(text('ALTER TABLE books ALTER COLUMN isbn TYPE VARCHAR(500)'))
        connection.execute(text('ALTER TABLE books ALTER COLUMN publisher TYPE VARCHAR(500)'))
        transaction.commit()
        logger.info("Schema migrations applied successfully.")
except Exception as e:
    # Log the error but don't crash the app, it might be a permissions issue
    # or the columns are already correct. The app will fail on upload if the
    # columns are still incorrect.
    logger.error(f"Could not apply manual schema migrations: {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class BookDB(Base):
    __tablename__ = 'books'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    author = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    added_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    cover_path = Column(String(500))
    isbn = Column(String(500), index=True)
    language = Column(String(10))
    publisher = Column(String(500))
    publication_date = Column(DateTime)
    
    # Create indexes for better performance
    __table_args__ = (
        Index('idx_title_author', 'title', 'author'),
        Index('idx_added_date', 'added_date'),
    )

# Pydantic Models
class BookCreate(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    isbn: Optional[str] = None
    language: Optional[str] = None
    publisher: Optional[str] = None
    
    @validator('title', 'author')
    def validate_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Field cannot be empty')
        return v.strip()

class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    description: Optional[str]
    file_path: Optional[str]
    file_size: Optional[int]
    added_date: datetime
    cover_path: Optional[str]
    isbn: Optional[str]
    language: Optional[str]
    publisher: Optional[str]
    
    class Config:
        from_attributes = True

# Create database tables
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI(
    title='Liminal Ebook Manager',
    description='A modern ebook management system',
    version='1.0.0',
    docs_url='/docs',
    redoc_url='/redoc'
)

# CORS middleware
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Mount static files
app.mount('/uploads', StaticFiles(directory='uploads'), name='uploads')

# Create upload directories
for directory in ['uploads/books', 'uploads/covers', 'uploads/temp']:
    Path(directory).mkdir(parents=True, exist_ok=True)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Utility functions
def extract_and_save_cover(epub_path: str, book_id: int) -> Optional[str]:
    """Extracts the cover from an EPUB, saves it, and returns the path."""
    try:
        book = epub.read_epub(epub_path)
        cover_image = None
        
        # First, try to find the cover meta tag
        meta_cover = book.get_metadata('OPF', 'cover')
        if meta_cover:
            cover_id = meta_cover[0][1].get('content')
            cover_item = book.get_item_with_id(cover_id)
            if cover_item:
                cover_image = cover_item

        # If not found, look for items with a cover property
        if not cover_image:
            for item in book.get_items_of_type(ebooklib.ITEM_IMAGE):
                if 'cover' in (item.get_name() or '').lower():
                    cover_image = item
                    break
        
        if not cover_image:
            for item in book.get_items():
                if item.get_type() == ebooklib.ITEM_COVER:
                    cover_image = item
                    break

        if cover_image:
            image_bytes = cover_image.get_content()
            file_extension = Path(cover_image.get_name() or 'cover.jpg').suffix
            if not file_extension:
                file_extension = '.jpg' # default
            
            cover_filename = f"{book_id}{file_extension}"
            cover_path = f"uploads/covers/{cover_filename}"

            with open(cover_path, 'wb') as f:
                f.write(image_bytes)
            
            logger.info(f"Extracted cover for book {book_id} to {cover_path}")
            return cover_path
        else:
            logger.warning(f"No cover image found for book at {epub_path}")
            return None
    except Exception as e:
        logger.error(f"Error extracting cover from {epub_path}: {e}")
        return None

def extract_epub_metadata(file_path: str) -> dict:
    """Extract metadata from EPUB file"""
    try:
        book = epub.read_epub(file_path)
        
        # Extract basic metadata
        title = book.get_metadata('DC', 'title')
        author = book.get_metadata('DC', 'creator')
        description = book.get_metadata('DC', 'description')
        isbn = book.get_metadata('DC', 'identifier')
        language = book.get_metadata('DC', 'language')
        publisher = book.get_metadata('DC', 'publisher')
        
        # Clean description
        clean_description = None
        if description:
            desc_text = description[0][0]
            clean_description = re.sub(r'<[^>]+>', '', desc_text).strip()
        
        return {
            'title': title[0][0] if title else 'Unknown Title',
            'author': author[0][0] if author else 'Unknown Author',
            'description': clean_description,
            'isbn': isbn[0][0] if isbn else None,
            'language': language[0][0] if language else None,
            'publisher': publisher[0][0] if publisher else None,
        }
    except Exception as e:
        logger.error(f"Error extracting EPUB metadata: {e}")
        return {
            'title': 'Unknown Title',
            'author': 'Unknown Author',
            'description': None,
            'isbn': None,
            'language': None,
            'publisher': None,
        }

def validate_file_size(file_size: int) -> bool:
    """Validate file size against maximum allowed size"""
    max_size = os.getenv('UPLOAD_MAX_SIZE', '100MB')
    if max_size.endswith('MB'):
        max_bytes = int(max_size[:-2]) * 1024 * 1024
    elif max_size.endswith('GB'):
        max_bytes = int(max_size[:-2]) * 1024 * 1024 * 1024
    else:
        max_bytes = int(max_size)
    
    return file_size <= max_bytes

def set_epub_cover(epub_path: str, cover_image_content: bytes, cover_filename: str):
    """Sets the cover for an EPUB file and saves it."""
    try:
        book = epub.read_epub(epub_path)
        book.set_cover(cover_filename, cover_image_content)
        epub.write_epub(epub_path, book, {})
        logger.info(f"Successfully set new cover for {epub_path}")
    except Exception as e:
        logger.error(f"Could not set new cover for {epub_path}: {e}")
        # We don't re-raise the exception, so the main operation can continue.
        # The cover path in the DB will be updated, but the EPUB will have the old cover.

# API Endpoints
@app.get('/')
async def root():
    """Root endpoint"""
    return {
        'message': 'Liminal Ebook Manager API',
        'version': '1.0.0',
        'docs': '/docs'
    }

@app.get('/health')
async def health_check():
    """Health check endpoint"""
    return {'status': 'healthy', 'timestamp': datetime.utcnow()}

@app.get('/books', response_model=List[BookResponse])
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

@app.get('/books/{book_id}', response_model=BookResponse)
async def get_book(book_id: int, db: Session = Depends(get_db)):
    """Get a specific book by ID"""
    book = db.query(BookDB).filter(BookDB.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Book not found'
        )
    return book

@app.post('/books/upload', response_model=BookResponse)
async def upload_book(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a new EPUB book"""
    # Validate file type
    if not file.filename.lower().endswith('.epub'):
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
        
        # Extract metadata
        metadata = extract_epub_metadata(file_path)
        
        # Create book record
        book = BookDB(
            title=metadata['title'],
            author=metadata['author'],
            description=metadata['description'],
            file_path=file_path,
            file_size=file_size,
            isbn=metadata['isbn'],
            language=metadata['language'],
            publisher=metadata['publisher']
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
        
        logger.info(f"Book uploaded successfully: {book.title}")
        return book
        
    except Exception as e:
        # Clean up file if database operation fails
        if os.path.exists(file_path):
            os.remove(file_path)
        logger.error(f"Error uploading book: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to upload book'
        )

@app.put('/books/{book_id}', response_model=BookResponse)
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
        if not cover_file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail='Invalid file type. Please upload an image.')
            
        # Create a new path for the cover
        file_extension = Path(cover_file.filename).suffix or '.jpg'
        cover_filename = f"{book_id}{file_extension}"
        cover_path = f"uploads/covers/{cover_filename}"

        # Delete old cover if it exists to prevent orphaned files
        if db_book.cover_path and os.path.exists(db_book.cover_path):
            try:
                os.remove(db_book.cover_path)
                logger.info(f"Removed old cover: {db_book.cover_path}")
            except OSError as e:
                logger.error(f"Error removing old cover {db_book.cover_path}: {e}")

        # Save the new cover
        try:
            with open(cover_path, 'wb') as f:
                shutil.copyfileobj(cover_file.file, f)
            db_book.cover_path = cover_path
            logger.info(f"Updated cover for book {book_id} to {cover_path}")

            # Also update the cover within the EPUB file itself
            try:
                with open(cover_path, 'rb') as f_cover:
                    cover_content = f_cover.read()
                set_epub_cover(db_book.file_path, cover_content, Path(cover_path).name)
            except Exception as e:
                logger.error(f"Failed to update cover in EPUB file for book {book_id}: {e}")

        except Exception as e:
            logger.error(f"Could not save new cover for book {book_id}: {e}")
            raise HTTPException(status_code=500, detail="Could not save new cover image.")

    try:
        db.commit()
        db.refresh(db_book)
        logger.info(f"Successfully updated book ID: {book_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Database error updating book {book_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not update book in database.")
        
    return db_book

@app.delete('/books/{book_id}')
async def delete_book(book_id: int, db: Session = Depends(get_db)):
    """Delete a book and its associated files"""
    book = db.query(BookDB).filter(BookDB.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Book not found'
        )
    
    try:
        # Delete file
        if book.file_path and os.path.exists(book.file_path):
            os.remove(book.file_path)
        
        # Delete cover if exists
        if book.cover_path and os.path.exists(book.cover_path):
            os.remove(book.cover_path)
        
        # Delete from database
        db.delete(book)
        db.commit()
        
        logger.info(f"Book deleted: {book.title}")
        return {'message': 'Book deleted successfully'}
        
    except Exception as e:
        logger.error(f"Error deleting book: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to delete book'
        )

@app.get('/books/{book_id}/download')
async def download_book(book_id: int, db: Session = Depends(get_db)):
    """Download a book file"""
    book = db.query(BookDB).filter(BookDB.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Book not found'
        )
    
    if not book.file_path or not os.path.exists(book.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Book file not found'
        )
    
    return FileResponse(
        book.file_path,
        filename=f"{book.title}.epub",
        media_type='application/epub+zip'
    )

@app.get('/stats')
async def get_stats(db: Session = Depends(get_db)):
    """Get library statistics"""
    total_books = db.query(BookDB).count()
    total_size = db.query(BookDB.file_size).all()
    total_size_bytes = sum(size[0] for size in total_size if size[0])
    
    return {
        'total_books': total_books,
        'total_size_mb': round(total_size_bytes / (1024 * 1024), 2),
        'average_size_mb': round(total_size_bytes / (1024 * 1024) / total_books, 2) if total_books > 0 else 0
    }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000) 