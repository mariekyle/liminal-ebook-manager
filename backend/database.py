"""
Database module - SQLite connection and schema management.

Uses aiosqlite for async database access with FastAPI.
"""

import aiosqlite
from pathlib import Path
from typing import AsyncGenerator

# Global database path (set during init)
_db_path: str = None


async def init_db(db_path: str) -> None:
    """
    Initialize the database with schema.
    Called once on application startup.
    """
    global _db_path
    _db_path = db_path
    
    # Ensure directory exists
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    
    async with aiosqlite.connect(db_path) as db:
        # Enable foreign keys
        await db.execute("PRAGMA foreign_keys = ON")
        
        # Create tables
        await db.executescript(SCHEMA)
        await db.commit()
        
        print(f"Database initialized at {db_path}")


async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    """
    Dependency that provides a database connection.
    Usage in FastAPI routes:
    
        @router.get("/books")
        async def list_books(db = Depends(get_db)):
            ...
    """
    async with aiosqlite.connect(_db_path) as db:
        db.row_factory = aiosqlite.Row  # Return dict-like rows
        await db.execute("PRAGMA foreign_keys = ON")
        yield db


# Database schema
SCHEMA = """
-- Core book data (extracted from files + folders)
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    authors TEXT NOT NULL,        -- JSON array: ["Author 1", "Author 2"]
    series TEXT,
    series_number TEXT,
    category TEXT,                -- Fiction, Non-Fiction, FanFiction
    status TEXT DEFAULT 'Unread', -- Unread, In Progress, Finished, DNF
    publication_year INTEGER,
    word_count INTEGER,
    summary TEXT,
    tags TEXT,                    -- JSON array: ["fantasy", "romance"]
    
    folder_path TEXT UNIQUE,      -- /books/Fiction/Author - Title/
    file_path TEXT,               -- Path to primary ebook file
    
    cover_color_1 TEXT,           -- Hex color for gradient
    cover_color_2 TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User's notes about books
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    content TEXT,                 -- Markdown with [[links]]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Tracks [[links]] between notes for backlink queries
CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_note_id INTEGER NOT NULL,
    to_book_id INTEGER NOT NULL,
    link_text TEXT,               -- The actual text inside [[...]]
    FOREIGN KEY (from_note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (to_book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_series ON books(series);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes(book_id);
CREATE INDEX IF NOT EXISTS idx_links_to_book ON links(to_book_id);
CREATE INDEX IF NOT EXISTS idx_links_from_note ON links(from_note_id);
"""
