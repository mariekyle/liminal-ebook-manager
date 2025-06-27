import logging
from sqlalchemy.orm import Session
from ..config.database import SessionLocal
from ..models.book import BookDB
from .epub_service import calculate_word_count, extract_epub_metadata

logger = logging.getLogger(__name__)

async def backfill_word_counts():
    """
    On startup, check for any books without a word count and calculate it.
    This is a one-time backfill for existing books.
    """
    logger.info("Checking for books missing word counts...")
    db = SessionLocal()
    try:
        # First, reset any previously failed calculations to try again.
        db.query(BookDB).filter(BookDB.word_count == -1).update({"word_count": 0})
        db.commit()
        logger.info("Reset previously failed word count calculations.")

        # Find books where word_count is 0 or NULL (not yet processed).
        books_to_update = db.query(BookDB).filter((BookDB.word_count == 0) | (BookDB.word_count.is_(None))).all()
        
        if not books_to_update:
            logger.info("No books need word count backfill. All up to date.")
            return

        logger.info(f"Found {len(books_to_update)} books needing word count calculation.")
        
        for book in books_to_update:
            try:
                word_count = calculate_word_count(book.file_path)
                if word_count >= 0:
                    book.word_count = word_count
                    logger.info(f"Updated word count for '{book.title}': {word_count}")
                else:
                    book.word_count = -1  # Mark as failed
                    logger.warning(f"Failed to calculate word count for '{book.title}'")
            except Exception as e:
                book.word_count = -1  # Mark as failed
                logger.error(f"Error calculating word count for '{book.title}': {e}")
        
        db.commit()
        logger.info("Word count backfill completed.")
        
    except Exception as e:
        logger.error(f"Error during word count backfill: {e}")
        db.rollback()
    finally:
        db.close()

async def backfill_missing_metadata():
    """
    On startup, check for any books with missing metadata and try to extract it.
    This is a one-time backfill for existing books.
    """
    logger.info("Checking for books with missing metadata...")
    db = SessionLocal()
    try:
        # Find books with missing title or author
        books_to_update = db.query(BookDB).filter(
            (BookDB.title == 'Unknown Title') | 
            (BookDB.author == 'Unknown Author') |
            (BookDB.title.is_(None)) | 
            (BookDB.author.is_(None))
        ).all()
        
        if not books_to_update:
            logger.info("No books need metadata backfill. All up to date.")
            return

        logger.info(f"Found {len(books_to_update)} books needing metadata extraction.")
        
        for book in books_to_update:
            try:
                metadata = extract_epub_metadata(book.file_path)
                
                # Update only if we got better metadata
                if metadata['title'] != 'Unknown Title':
                    book.title = metadata['title']
                if metadata['author'] != 'Unknown Author':
                    book.author = metadata['author']
                if metadata['description'] and not book.description:
                    book.description = metadata['description']
                if metadata['isbn'] and not book.isbn:
                    book.isbn = metadata['isbn']
                if metadata['language'] and not book.language:
                    book.language = metadata['language']
                if metadata['publisher'] and not book.publisher:
                    book.publisher = metadata['publisher']
                if metadata['publication_date'] and not book.publication_date:
                    book.publication_date = metadata['publication_date']
                if metadata['tags'] and not book.tags:
                    book.tags = metadata['tags']
                
                logger.info(f"Updated metadata for '{book.title}'")
                
            except Exception as e:
                logger.error(f"Error extracting metadata for book ID {book.id}: {e}")
        
        db.commit()
        logger.info("Metadata backfill completed.")
        
    except Exception as e:
        logger.error(f"Error during metadata backfill: {e}")
        db.rollback()
    finally:
        db.close() 