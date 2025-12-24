"""
Database module - SQLite connection and schema management.

Uses aiosqlite for async database access with FastAPI.
"""

import aiosqlite
from pathlib import Path
from typing import AsyncGenerator

# Global database path (set during init)
_db_path: str = None


def get_db_path() -> str:
    """
    Get the current database path.
    Used by standalone functions that need to create their own connections
    (e.g., background tasks that can't use FastAPI's Depends).
    """
    return _db_path


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
        
        # Run migrations for existing databases
        await run_migrations(db)
        
        print(f"Database initialized at {db_path}")


async def run_migrations(db: aiosqlite.Connection) -> None:
    """
    Run database migrations to add new columns to existing tables.
    SQLite's CREATE TABLE IF NOT EXISTS doesn't add new columns,
    so we need to handle this separately.
    
    Each migration checks if the column exists before adding it,
    making migrations idempotent (safe to run multiple times).
    """
    # Get existing columns in books table
    cursor = await db.execute("PRAGMA table_info(books)")
    columns = await cursor.fetchall()
    existing_columns = {col[1] for col in columns}  # col[1] is the column name
    
    # Migration 1: Add status column (Phase 1 - Read Status)
    if 'status' not in existing_columns:
        print("Migration: Adding 'status' column to books table...")
        await db.execute("ALTER TABLE books ADD COLUMN status TEXT DEFAULT 'Unread'")
        print("Migration: 'status' column added successfully")
    
    # Migration 2: Add rating column (Phase 1 - Rating System)
    if 'rating' not in existing_columns:
        print("Migration: Adding 'rating' column to books table...")
        await db.execute("ALTER TABLE books ADD COLUMN rating INTEGER")
        print("Migration: 'rating' column added successfully")
    
    # Migration 3: Add date_started column (Phase 1 - Reading Dates)
    if 'date_started' not in existing_columns:
        print("Migration: Adding 'date_started' column to books table...")
        await db.execute("ALTER TABLE books ADD COLUMN date_started TEXT")
        print("Migration: 'date_started' column added successfully")
    
    # Migration 4: Add date_finished column (Phase 1 - Reading Dates)
    if 'date_finished' not in existing_columns:
        print("Migration: Adding 'date_finished' column to books table...")
        await db.execute("ALTER TABLE books ADD COLUMN date_finished TEXT")
        print("Migration: 'date_finished' column added successfully")
    
    # Ensure indexes exist (these are idempotent)
    await db.execute("CREATE INDEX IF NOT EXISTS idx_books_status ON books(status)")
    
    # Migration: Add settings table (for existing databases)
    try:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Insert default WPM if not exists
        await db.execute("""
            INSERT OR IGNORE INTO settings (key, value) VALUES ('reading_wpm', '250')
        """)
    except Exception as e:
        print(f"Settings migration note: {e}")
    
    # Migration: Add author_notes table
    try:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS author_notes (
                author_name TEXT PRIMARY KEY,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
    except Exception as e:
        print(f"Author notes migration note: {e}")
    
    await db.commit()


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
    rating INTEGER,               -- 1-5 star rating
    date_started TEXT,            -- ISO date: YYYY-MM-DD
    date_finished TEXT,           -- ISO date: YYYY-MM-DD
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
CREATE INDEX IF NOT EXISTS idx_books_series ON books(series);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes(book_id);
CREATE INDEX IF NOT EXISTS idx_links_to_book ON links(to_book_id);
CREATE INDEX IF NOT EXISTS idx_links_from_note ON links(from_note_id);

-- Settings table for user preferences
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""
