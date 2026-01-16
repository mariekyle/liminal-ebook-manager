"""
Database module - SQLite connection and schema management.

Uses aiosqlite for async database access with FastAPI.

Schema: titles + editions (Phase 5 refactor)
- titles: Book metadata, reading status, TBR tracking
- editions: Individual formats (ebook, audiobook, physical)
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
    Run database migrations to add new columns/tables to existing databases.
    Each migration checks if already applied, making them idempotent.
    """
    tables = await get_table_names(db)
    
    # Check if this is a post-Phase5 database (has titles table)
    if "titles" in tables:
        # New schema - run new-style migrations
        await run_titles_migrations(db)
    elif "books" in tables:
        # Old schema - this shouldn't happen after migration script runs
        # but keep for safety
        await run_legacy_migrations(db)
    
    await db.commit()


async def get_table_names(db: aiosqlite.Connection) -> set:
    """Get all table names in the database."""
    cursor = await db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
    rows = await cursor.fetchall()
    return {row[0] for row in rows}


async def run_smart_collections_migration(db: aiosqlite.Connection) -> None:
    """
    Phase 9E: Smart Collections migration
    - Add collection_type, auto_criteria, is_default to collections
    - Add completed_at to collection_books
    - Create default TBR and Reading History collections
    """
    
    # Check collections table columns
    cursor = await db.execute("PRAGMA table_info(collections)")
    columns = await cursor.fetchall()
    existing_columns = {col[1] for col in columns}
    
    # Add collection_type column
    if 'collection_type' not in existing_columns:
        print("Migration: Adding 'collection_type' column to collections...")
        await db.execute("ALTER TABLE collections ADD COLUMN collection_type TEXT DEFAULT 'manual'")
    
    # Add auto_criteria column
    if 'auto_criteria' not in existing_columns:
        print("Migration: Adding 'auto_criteria' column to collections...")
        await db.execute("ALTER TABLE collections ADD COLUMN auto_criteria TEXT")
    
    # Add is_default column
    if 'is_default' not in existing_columns:
        print("Migration: Adding 'is_default' column to collections...")
        await db.execute("ALTER TABLE collections ADD COLUMN is_default INTEGER DEFAULT 0")
    
    # Check collection_books table columns
    cursor = await db.execute("PRAGMA table_info(collection_books)")
    cb_columns = await cursor.fetchall()
    cb_existing = {col[1] for col in cb_columns}
    
    # Add completed_at column
    if 'completed_at' not in cb_existing:
        print("Migration: Adding 'completed_at' column to collection_books...")
        await db.execute("ALTER TABLE collection_books ADD COLUMN completed_at TIMESTAMP")
    
    # Create default collections if they don't exist
    await create_default_collections(db)
    
    await db.commit()


async def create_default_collections(db: aiosqlite.Connection) -> None:
    """Create TBR and Reading History default collections if they don't exist."""
    
    # Calculate base sort_order ONCE at the start (before any inserts)
    cursor = await db.execute("SELECT MIN(sort_order) FROM collections")
    row = await cursor.fetchone()
    base_order = (row[0] or 0)
    
    # TBR gets lowest number (appears first)
    tbr_sort_order = base_order - 2
    # Reading History gets second lowest (appears second)  
    history_sort_order = base_order - 1
    
    # Check if TBR exists
    cursor = await db.execute(
        "SELECT id FROM collections WHERE is_default = 1 AND collection_type = 'checklist'"
    )
    tbr_exists = await cursor.fetchone()
    
    if not tbr_exists:
        print("Migration: Creating default TBR collection...")
        
        tbr_description = """This is your growing, teetering stack of books you fully intend to read — eventually. Someday. After this one. And plot twist - a good TBR is never finished. Like laundry. Or emails. It's the beautiful circle of literary life, and the slow, crumbling collapse of your self-control. So live a little, add a few more books 😜."""
        
        await db.execute("""
            INSERT INTO collections (name, description, collection_type, is_default, sort_order)
            VALUES (?, ?, 'checklist', 1, ?)
        """, ('TBR', tbr_description, tbr_sort_order))
    
    # Check if Reading History exists
    cursor = await db.execute(
        "SELECT id FROM collections WHERE is_default = 1 AND collection_type = 'automatic'"
    )
    history_exists = await cursor.fetchone()
    
    if not history_exists:
        print("Migration: Creating default Reading History collection...")
        
        history_description = """This is a list of every book you've ever read (cue "it feels good" by Tony! Toni! Toné! 🎉)."""
        
        auto_criteria = '{"status": "Finished", "sort": "finished_date_desc"}'
        
        await db.execute("""
            INSERT INTO collections (name, description, collection_type, auto_criteria, is_default, sort_order)
            VALUES (?, ?, 'automatic', ?, 1, ?)
        """, ('Reading History', history_description, auto_criteria, history_sort_order))


async def run_titles_migrations(db: aiosqlite.Connection) -> None:
    """Migrations for the new titles/editions schema."""
    
    # Check for titles table columns
    cursor = await db.execute("PRAGMA table_info(titles)")
    columns = await cursor.fetchall()
    existing_columns = {col[1] for col in columns}
    
    # ==========================================================================
    # Migration: Backup system (Phase 9A)
    # ==========================================================================
    
    # Create backup_history table
    await db.execute("""
        CREATE TABLE IF NOT EXISTS backup_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            backup_type TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'success'
        )
    """)
    
    # Create index for backup_history
    await db.execute("""
        CREATE INDEX IF NOT EXISTS idx_backup_history_created 
        ON backup_history(created_at)
    """)
    
    # Insert default backup settings if not exists
    default_backup_settings = [
        ('backup_enabled', 'true'),
        ('backup_path', '/app/data/backups'),
        ('backup_schedule', 'both'),
        ('backup_time', '03:00'),
        ('backup_daily_retention_days', '7'),
        ('backup_weekly_retention_weeks', '4'),
        ('backup_monthly_retention_months', '6'),
    ]
    for key, value in default_backup_settings:
        await db.execute(
            "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
            (key, value)
        )
    
    # ==========================================================================
    # End Backup system migration
    # ==========================================================================
    
    # Migration: Add completion_status column
    if 'completion_status' not in existing_columns:
        print("Migration: Adding 'completion_status' column to titles table...")
        await db.execute("ALTER TABLE titles ADD COLUMN completion_status TEXT")
    
    # Migration: Add source_url column
    if 'source_url' not in existing_columns:
        print("Migration: Adding 'source_url' column to titles table...")
        await db.execute("ALTER TABLE titles ADD COLUMN source_url TEXT")
    
    # Migration: Add is_orphaned column
    if 'is_orphaned' not in existing_columns:
        print("Migration: Adding 'is_orphaned' column to titles table...")
        await db.execute("ALTER TABLE titles ADD COLUMN is_orphaned INTEGER DEFAULT 0")
    
    # Migration: Add acquisition_status column (Phase 5.1)
    if 'acquisition_status' not in existing_columns:
        print("Migration: Adding 'acquisition_status' column to titles table...")
        await db.execute("ALTER TABLE titles ADD COLUMN acquisition_status TEXT DEFAULT 'owned'")
        
        # Migrate existing data: is_tbr = 1 → 'wishlist', is_tbr = 0 → 'owned'
        print("Migration: Populating acquisition_status from is_tbr values...")
        await db.execute("UPDATE titles SET acquisition_status = 'wishlist' WHERE is_tbr = 1")
        await db.execute("UPDATE titles SET acquisition_status = 'owned' WHERE is_tbr = 0 OR is_tbr IS NULL")
        
        # Create index for faster queries
        await db.execute("CREATE INDEX IF NOT EXISTS idx_titles_acquisition_status ON titles(acquisition_status)")
    
    # Ensure settings table exists
    await db.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Insert default settings if not exists
    default_settings = [
        ('reading_wpm', '250'),
        ('grid_columns', '2'),
        ('status_label_unread', 'Unread'),
        ('status_label_in_progress', 'In Progress'),
        ('status_label_finished', 'Finished'),
        ('status_label_dnf', 'Abandoned'),
    ]
    for key, value in default_settings:
        await db.execute(
            "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
            (key, value)
        )
    
   # Migration: Add format column to reading_sessions (Phase 8.7a)
    cursor = await db.execute("PRAGMA table_info(reading_sessions)")
    session_columns = await cursor.fetchall()
    session_column_names = {col[1] for col in session_columns}
    
    if 'format' not in session_column_names:
        print("Migration: Adding 'format' column to reading_sessions table...")
        await db.execute("ALTER TABLE reading_sessions ADD COLUMN format TEXT")
        await db.commit()
        print("Migration: 'format' column added successfully")
    
    # Migration: Add unique constraint on editions(title_id, format) (Phase 8.7b)
    # Prevents duplicate formats per title at database level
    await db.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_editions_title_format 
        ON editions(title_id, format)
    """)
    
    # Ensure author_notes table exists
    await db.execute("""
        CREATE TABLE IF NOT EXISTS author_notes (
            author_name TEXT PRIMARY KEY,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Migration: Populate reading_sessions from existing titles data
    cursor = await db.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='reading_sessions'
    """)
    sessions_table_exists = await cursor.fetchone()
    
    if sessions_table_exists:
        # Check if migration already ran (any sessions exist)
        cursor = await db.execute("SELECT COUNT(*) FROM reading_sessions")
        count = (await cursor.fetchone())[0]
        
        if count == 0:
            # Migrate existing reading data to sessions
            # Logic:
            # 1. Trust explicit status for non-unread books
            # 2. For 'Unread' books with reading data, infer status:
            #    - has date_finished → finished
            #    - has date_started only → in_progress  
            #    - has rating only → finished (you don't rate unread books)
            # 3. Skip truly unread books (no dates, no rating, status='Unread')
            
            await db.execute("""
                INSERT INTO reading_sessions (
                    title_id, 
                    session_number, 
                    date_started, 
                    date_finished, 
                    session_status, 
                    rating,
                    created_at,
                    updated_at
                )
                SELECT 
                    id,
                    1,
                    date_started,
                    date_finished,
                    CASE 
                        -- Explicit non-unread status: trust it
                        WHEN status = 'In Progress' THEN 'in_progress'
                        WHEN status = 'Finished' THEN 'finished'
                        WHEN status = 'DNF' THEN 'dnf'
                        WHEN status = 'Abandoned' THEN 'dnf'
                        -- Unread but has date_finished: was actually finished
                        WHEN status = 'Unread' AND date_finished IS NOT NULL THEN 'finished'
                        -- Unread but has date_started only: was actually in progress
                        WHEN status = 'Unread' AND date_started IS NOT NULL THEN 'in_progress'
                        -- Unread but has rating: was actually finished (you don't rate unread books)
                        WHEN status = 'Unread' AND rating IS NOT NULL THEN 'finished'
                        -- Fallback (shouldn't hit this given WHERE clause)
                        ELSE 'in_progress'
                    END,
                    rating,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                FROM titles
                WHERE 
                    -- Include all non-unread books (both Abandoned and legacy DNF)
                    status IN ('In Progress', 'Finished', 'DNF', 'Abandoned')
                    -- OR include 'Unread' books that have reading evidence
                    OR (status = 'Unread' AND (
                        date_started IS NOT NULL 
                        OR date_finished IS NOT NULL 
                        OR rating IS NOT NULL
                    ))
            """)
            
            # Also fix the status on titles that were incorrectly marked Unread
            # This ensures the cached status matches the new session
            await db.execute("""
                UPDATE titles
                SET status = 'Finished',
                    updated_at = CURRENT_TIMESTAMP
                WHERE status = 'Unread' 
                  AND (date_finished IS NOT NULL OR rating IS NOT NULL)
            """)
            
            await db.execute("""
                UPDATE titles
                SET status = 'In Progress',
                    updated_at = CURRENT_TIMESTAMP
                WHERE status = 'Unread' 
                  AND date_started IS NOT NULL 
                  AND date_finished IS NULL 
                  AND rating IS NULL
            """)
            
            await db.commit()
            print("Migration: Created reading_sessions from existing title data")
            print("Migration: Fixed status for books incorrectly marked as Unread")

    # ==========================================================================
    # Phase 9C: Cover system columns
    # ==========================================================================
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        await db.execute("ALTER TABLE titles ADD COLUMN cover_path TEXT")
        logger.info("Added cover_path column")
    except Exception:
        pass  # Column already exists
    
    try:
        await db.execute("ALTER TABLE titles ADD COLUMN has_cover BOOLEAN DEFAULT 0")
        logger.info("Added has_cover column")
    except Exception:
        pass  # Column already exists
    
    try:
        await db.execute("ALTER TABLE titles ADD COLUMN cover_source TEXT")
        logger.info("Added cover_source column")
    except Exception:
        pass  # Column already exists
    
    # Index for cover queries
    try:
        await db.execute("CREATE INDEX IF NOT EXISTS idx_titles_has_cover ON titles(has_cover)")
        logger.info("Created has_cover index")
    except Exception:
        pass

    # ==========================================================================
    # End Phase 9C cover system migration
    # ==========================================================================
    
    # ==========================================================================
    # Cover gradient color columns (ensure they exist for older databases)
    # ==========================================================================
    try:
        await db.execute("ALTER TABLE titles ADD COLUMN cover_color_1 TEXT")
        logger.info("Added cover_color_1 column")
    except Exception:
        pass  # Column already exists
    
    try:
        await db.execute("ALTER TABLE titles ADD COLUMN cover_color_2 TEXT")
        logger.info("Added cover_color_2 column")
    except Exception:
        pass  # Column already exists

    await db.commit()  # Commit Phase 9C changes

    # Migration: Add enhanced metadata fields (Phase 7.0)
    enhanced_metadata_columns = [
        ("fandom", "TEXT"),
        ("relationships", "TEXT"),
        ("characters", "TEXT"),
        ("content_rating", "TEXT"),
        ("ao3_warnings", "TEXT"),
        ("ao3_category", "TEXT"),
        ("isbn", "TEXT"),
        ("publisher", "TEXT"),
        ("chapter_count", "INTEGER"),
    ]
    
    for col_name, col_type in enhanced_metadata_columns:
        if col_name not in existing_columns:
            try:
                await db.execute(f"ALTER TABLE titles ADD COLUMN {col_name} {col_type}")
                print(f"  Added {col_name} column")
            except Exception as e:
                if "duplicate column name" not in str(e).lower():
                    print(f"  Note: {col_name} column: {e}")

    # Migration: Reparse all notes to populate links table (backlinks fix)
    cursor = await db.execute(
        "SELECT value FROM settings WHERE key = 'links_reparsed'"
    )
    links_reparsed = await cursor.fetchone()
    
    if not links_reparsed:
        import re
        print("Migration: Reparsing all notes to populate links table...")
        
        # Get all notes with [[...]] patterns
        cursor = await db.execute(
            "SELECT id, content FROM notes WHERE content LIKE '%[[%]]%'"
        )
        notes_with_links = await cursor.fetchall()
        
        links_created = 0
        for note in notes_with_links:
            note_id = note[0]  # id
            content = note[1] or ""  # content
            
            # Extract [[...]] patterns
            link_pattern = r'\[\[(.+?)\]\]'
            matches = re.findall(link_pattern, content)
            unique_titles = list(dict.fromkeys(matches))
            
            # Clear existing links for this note (in case of partial previous run)
            await db.execute("DELETE FROM links WHERE from_note_id = ?", [note_id])
            
            # Look up and insert links
            for link_text in unique_titles:
                cursor = await db.execute(
                    "SELECT id FROM titles WHERE LOWER(title) = LOWER(?)",
                    [link_text.strip()]
                )
                title_row = await cursor.fetchone()
                
                if title_row:
                    await db.execute(
                        "INSERT INTO links (from_note_id, to_title_id, link_text) VALUES (?, ?, ?)",
                        [note_id, title_row[0], link_text]  # title_row[0] is id
                    )
                    links_created += 1
        
        # Mark migration as complete
        await db.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            ("links_reparsed", "true")
        )
        await db.commit()
        print(f"Migration: Created {links_created} links from {len(notes_with_links)} notes")

    # Phase 9E: Smart Collections migration
    await run_smart_collections_migration(db)


async def run_legacy_migrations(db: aiosqlite.Connection) -> None:
    """Migrations for old 'books' schema (pre-Phase 5)."""
    # Get existing columns in books table
    cursor = await db.execute("PRAGMA table_info(books)")
    columns = await cursor.fetchall()
    existing_columns = {col[1] for col in columns}
    
    # Migration 1: Add status column
    if 'status' not in existing_columns:
        print("Migration: Adding 'status' column to books table...")
        await db.execute("ALTER TABLE books ADD COLUMN status TEXT DEFAULT 'Unread'")
    
    # Migration 2: Add rating column
    if 'rating' not in existing_columns:
        print("Migration: Adding 'rating' column to books table...")
        await db.execute("ALTER TABLE books ADD COLUMN rating INTEGER")
    
    # Migration 3: Add date_started column
    if 'date_started' not in existing_columns:
        print("Migration: Adding 'date_started' column to books table...")
        await db.execute("ALTER TABLE books ADD COLUMN date_started TEXT")
    
    # Migration 4: Add date_finished column
    if 'date_finished' not in existing_columns:
        print("Migration: Adding 'date_finished' column to books table...")
        await db.execute("ALTER TABLE books ADD COLUMN date_finished TEXT")
    
    # Ensure indexes exist
    await db.execute("CREATE INDEX IF NOT EXISTS idx_books_status ON books(status)")
    
    # Settings table
    try:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('reading_wpm', '250')")
        await db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES ('grid_columns', '2')")
    except Exception as e:
        print(f"Settings migration note: {e}")
    
    # Author notes table
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


async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    """
    Dependency that provides a database connection.
    Usage in FastAPI routes:
    
        @router.get("/titles")
        async def list_titles(db = Depends(get_db)):
            ...
    """
    async with aiosqlite.connect(_db_path) as db:
        db.row_factory = aiosqlite.Row  # Return dict-like rows
        await db.execute("PRAGMA foreign_keys = ON")
        yield db


async def sync_title_from_sessions(db, title_id: int):
    """
    Recalculate and update a title's cached status, rating, and dates
    based on its reading sessions. Call this after any session change.
    """
    # Get all sessions for this title, ordered by session_number descending
    cursor = await db.execute("""
        SELECT session_status, date_started, date_finished, rating
        FROM reading_sessions
        WHERE title_id = ?
        ORDER BY session_number DESC
    """, (title_id,))
    sessions = await cursor.fetchall()
    
    if not sessions:
        # No sessions = unread
        await db.execute("""
            UPDATE titles 
            SET status = 'Unread', 
                date_started = NULL, 
                date_finished = NULL,
                rating = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (title_id,))
    else:
        # Most recent session determines status
        most_recent = sessions[0]
        new_status = most_recent[0]  # session_status
        
        # Map session_status to title status
        status_map = {
            'in_progress': 'In Progress',
            'finished': 'Finished',
            'dnf': 'Abandoned'
        }
        title_status = status_map.get(new_status, 'In Progress')
        
        new_date_started = most_recent[1]
        new_date_finished = most_recent[2]
        
        # Calculate average rating from all sessions that have ratings
        ratings = [s[3] for s in sessions if s[3] is not None]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else None
        # Store as integer if whole number, otherwise keep decimal
        if avg_rating is not None and avg_rating == int(avg_rating):
            avg_rating = int(avg_rating)
        
        await db.execute("""
            UPDATE titles 
            SET status = ?,
                date_started = ?,
                date_finished = ?,
                rating = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (title_status, new_date_started, new_date_finished, avg_rating, title_id))
    
    await db.commit()


# =============================================================================
# Database Schema (Phase 5: titles + editions)
# =============================================================================

SCHEMA = """
-- Core title data (the concept of a book, independent of format)
CREATE TABLE IF NOT EXISTS titles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    authors TEXT NOT NULL,        -- JSON array: ["Author 1", "Author 2"]
    series TEXT,
    series_number TEXT,
    category TEXT,                -- Fiction, Non-Fiction, FanFiction
    publication_year INTEGER,
    word_count INTEGER,
    summary TEXT,
    tags TEXT,                    -- JSON array: ["fantasy", "romance"]
    source_url TEXT,              -- For FanFiction: AO3/FFN URL
    completion_status TEXT,       -- For FanFiction: Complete, WIP, Abandoned
    
    -- Enhanced metadata fields (Phase 7.0)
    fandom TEXT,
    relationships TEXT,           -- JSON array of relationship tags
    characters TEXT,              -- JSON array of character names
    content_rating TEXT,          -- AO3 rating: Explicit, Mature, Teen, General
    ao3_warnings TEXT,            -- JSON array of archive warnings
    ao3_category TEXT,            -- JSON array: F/F, F/M, M/M, Gen, etc.
    isbn TEXT,
    publisher TEXT,
    chapter_count INTEGER,
    
    cover_color_1 TEXT,           -- Hex color for gradient
    cover_color_2 TEXT,
    
    -- Reading tracking
    status TEXT DEFAULT 'Unread', -- Unread, In Progress, Finished, Abandoned (legacy: DNF)
    rating INTEGER,               -- 1-5 star rating
    date_started TEXT,            -- ISO date: YYYY-MM-DD
    date_finished TEXT,           -- ISO date: YYYY-MM-DD
    
    -- TBR/Wishlist
    is_tbr INTEGER DEFAULT 0,     -- Boolean: 1 = on TBR list
    tbr_priority TEXT DEFAULT 'normal',  -- "normal" or "high"
    tbr_reason TEXT,              -- Why you want to read this
    
    -- Orphan tracking (folder missing from filesystem)
    is_orphaned INTEGER DEFAULT 0, -- Boolean: 1 = folder not found during sync
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reading sessions: tracks multiple reads per book
CREATE TABLE IF NOT EXISTS reading_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_id INTEGER NOT NULL,
    session_number INTEGER NOT NULL,
    date_started TEXT,
    date_finished TEXT,
    session_status TEXT DEFAULT 'in_progress',
    rating INTEGER,
    format TEXT,                  -- ebook, physical, audiobook, web (nullable)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE
);

-- Editions: individual formats/copies of a title
CREATE TABLE IF NOT EXISTS editions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_id INTEGER NOT NULL,
    format TEXT NOT NULL,         -- "ebook", "physical", "audiobook"
    file_path TEXT,               -- For ebooks: path to file
    folder_path TEXT,             -- For ebooks: path to folder
    narrators TEXT,               -- JSON array for audiobooks
    acquired_date TEXT,           -- When you got this edition
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE
);

-- User's notes about titles
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_id INTEGER NOT NULL,
    content TEXT,                 -- Markdown with [[links]]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE
);

-- Tracks [[links]] between notes for backlink queries
CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_note_id INTEGER NOT NULL,
    to_title_id INTEGER NOT NULL,
    link_text TEXT,               -- The actual text inside [[...]]
    FOREIGN KEY (from_note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (to_title_id) REFERENCES titles(id) ON DELETE CASCADE
);

-- Settings table for user preferences
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Author notes (separate from title notes)
CREATE TABLE IF NOT EXISTS author_notes (
    author_name TEXT PRIMARY KEY,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collections: user-defined book lists (Phase 7.2b, updated Phase 9E)
CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    cover_type TEXT DEFAULT 'mosaic',
    cover_color_1 TEXT,
    cover_color_2 TEXT,
    custom_cover_path TEXT,
    sort_order INTEGER DEFAULT 0,
    -- Phase 9E: Smart Collections
    collection_type TEXT DEFAULT 'manual',  -- 'manual' | 'checklist' | 'automatic'
    auto_criteria TEXT,                      -- JSON string for automatic collections
    is_default INTEGER DEFAULT 0,            -- 1 = cannot be deleted (TBR, Reading History)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for collection membership
CREATE TABLE IF NOT EXISTS collection_books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL,
    title_id INTEGER NOT NULL,
    position INTEGER DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Phase 9E: Checklist collections
    completed_at TIMESTAMP,                  -- When book was marked done (checklist type)
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (title_id) REFERENCES titles(id) ON DELETE CASCADE,
    UNIQUE(collection_id, title_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_titles_category ON titles(category);
CREATE INDEX IF NOT EXISTS idx_titles_series ON titles(series);
CREATE INDEX IF NOT EXISTS idx_titles_title ON titles(title);
CREATE INDEX IF NOT EXISTS idx_titles_status ON titles(status);
CREATE INDEX IF NOT EXISTS idx_titles_is_tbr ON titles(is_tbr);
CREATE INDEX IF NOT EXISTS idx_editions_title_id ON editions(title_id);
CREATE INDEX IF NOT EXISTS idx_editions_format ON editions(format);
CREATE INDEX IF NOT EXISTS idx_notes_title_id ON notes(title_id);
CREATE INDEX IF NOT EXISTS idx_links_to_title ON links(to_title_id);
CREATE INDEX IF NOT EXISTS idx_links_from_note ON links(from_note_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_title_id ON reading_sessions(title_id);
CREATE INDEX IF NOT EXISTS idx_collection_books_collection ON collection_books(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_books_title ON collection_books(title_id);
CREATE INDEX IF NOT EXISTS idx_collections_sort ON collections(sort_order);
"""
