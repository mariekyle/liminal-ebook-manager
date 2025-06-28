"""
EPUB processing service for metadata extraction.
"""

import os
import re
import logging
from typing import Optional, Dict, Any
from pathlib import Path
from ebooklib import epub, ITEM_DOCUMENT, ITEM_IMAGE, ITEM_COVER
from datetime import datetime

logger = logging.getLogger(__name__)

def calculate_word_count(epub_path: str) -> int:
    """Calculate word count from EPUB file content."""
    try:
        book = epub.read_epub(epub_path)
        word_count = 0
        
        for item in book.get_items():
            if item.get_type() == ITEM_DOCUMENT:
                # Extract text content and count words
                content = item.get_content().decode('utf-8')
                # Remove HTML tags and count words
                text_content = re.sub(r'<[^>]+>', '', content)
                words = re.findall(r'\b\w+\b', text_content)
                word_count += len(words)
        
        return word_count
    except Exception as e:
        logger.error(f"Error calculating word count for {epub_path}: {e}")
        return -1

def extract_and_save_cover(epub_path: str, book_id: int) -> Optional[str]:
    """Extract cover from EPUB and save it."""
    try:
        book = epub.read_epub(epub_path)
        
        # Try to find cover image
        cover_item = None
        for item in book.get_items():
            if item.get_type() == ITEM_COVER:
                cover_item = item
                break
        
        if not cover_item:
            # Try to find cover in manifest
            for item in book.get_items():
                if item.get_type() == ITEM_IMAGE and 'cover' in item.get_name().lower():
                    cover_item = item
                    break
        
        if cover_item:
            # Save cover image
            cover_filename = f"{book_id}_cover{Path(cover_item.get_name()).suffix}"
            cover_path = f"uploads/covers/{cover_filename}"
            
            with open(cover_path, 'wb') as f:
                f.write(cover_item.get_content())
            
            logger.info(f"Cover extracted and saved: {cover_path}")
            return cover_path
        
        return None
    except Exception as e:
        logger.error(f"Error extracting cover from {epub_path}: {e}")
        return None

def extract_epub_metadata(file_path: str) -> Dict[str, Any]:
    """Extract metadata from EPUB file."""
    try:
        book = epub.read_epub(file_path)
        
        # Extract basic metadata
        title = book.get_metadata('DC', 'title')
        author = book.get_metadata('DC', 'creator')
        description = book.get_metadata('DC', 'description')
        isbn = book.get_metadata('DC', 'identifier')
        language = book.get_metadata('DC', 'language')
        publisher = book.get_metadata('DC', 'publisher')
        date = book.get_metadata('DC', 'date')
        
        # Clean up metadata values
        def clean_metadata(value):
            if value and len(value) > 0:
                return value[0][0] if isinstance(value[0], tuple) else str(value[0])
            return None
        
        # Parse publication date
        publication_date = None
        if date:
            date_str = clean_metadata(date)
            if date_str:
                try:
                    # Try different date formats
                    for fmt in ['%Y-%m-%d', '%Y', '%Y-%m']:
                        try:
                            publication_date = datetime.strptime(date_str, fmt)
                            break
                        except ValueError:
                            continue
                except Exception:
                    pass
        
        # Extract tags from subjects
        tags = None
        subjects = book.get_metadata('DC', 'subject')
        if subjects:
            tag_list = []
            for subject in subjects:
                if isinstance(subject, tuple):
                    tag_list.append(subject[0])
                else:
                    tag_list.append(str(subject))
            tags = ', '.join(tag_list)
        
        return {
            'title': clean_metadata(title) or 'Unknown Title',
            'author': clean_metadata(author) or 'Unknown Author',
            'description': clean_metadata(description),
            'isbn': clean_metadata(isbn),
            'language': clean_metadata(language),
            'publisher': clean_metadata(publisher),
            'publication_date': publication_date,
            'tags': tags
        }
    except Exception as e:
        logger.error(f"Error extracting metadata from {file_path}: {e}")
        return {
            'title': 'Unknown Title',
            'author': 'Unknown Author',
            'description': None,
            'isbn': None,
            'language': None,
            'publisher': None,
            'publication_date': None,
            'tags': None
        }

def set_epub_cover(epub_path: str, cover_image_content: bytes, cover_filename: str):
    """Sets the cover for an EPUB file and saves it."""
    try:
        book = epub.read_epub(epub_path)
        book.set_cover(cover_filename, cover_image_content)
        # Enable raise_exceptions to see the actual error if writing fails
        epub.write_epub(epub_path, book, {"raise_exceptions": True})
        logger.info(f"Successfully set new cover for {epub_path}")
    except Exception as e:
        logger.error(f"Could not set new cover for {epub_path}: {e}")
        # We don't re-raise the exception, so the main operation can continue.
        # The cover path in the DB will be updated, but the EPUB will have the old cover. 

async def process_epub_file(file_path: str) -> Dict[str, Any]:
    """
    Process an EPUB file and extract metadata.
    
    This is a placeholder implementation. In the future, this will:
    - Extract title, author, description from EPUB metadata
    - Extract cover image
    - Calculate word count
    - Extract publication date, ISBN, etc.
    """
    # For now, just return basic info from filename
    filename = os.path.basename(file_path)
    title = os.path.splitext(filename)[0]
    
    return {
        "title": title,
        "author": "Unknown Author",
        "description": "",
        "word_count": 0
    } 