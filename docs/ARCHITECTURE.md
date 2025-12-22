# Liminal Ebook Manager - Architecture Guide

## Overview

Liminal is a self-hosted web application for managing your ebook library. It runs on your Synology NAS (or any Docker-capable machine), scans your book folders, extracts metadata, and provides a mobile-friendly interface for browsing and taking notes.

**Key principle:** The app only modifies your book files when you upload new books. Existing books are never modified—only read for metadata extraction. All app data (library index, notes, settings) lives in a separate SQLite database.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Your Device                           │
│                    (Phone, Tablet, PC)                       
│                                                              │
│    Browser → http://your-nas:3000 (via Tailscale)           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     Docker Container                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 React Frontend (:3000)                  │ │
│  │                                                         │ │
│  │  • Library grid/list view                              │ │
│  │  • Book detail pages                                   │ │
│  │  • Note editor with [[linking]]                        │ │
│  │  • Search, filter, sort                                │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │ /api/*                          │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                FastAPI Backend (:8000)                  │ │
│  │                                                         │ │
│  │  Routes:                                                │ │
│  │  • GET  /api/books        - list/search/filter books   │ │
│  │  • GET  /api/books/{id}   - single book + notes        │ │
│  │  • POST /api/books/{id}/notes - create/update note     │ │
│  │  • POST /api/sync         - scan folders for changes   │ │
│  │  • GET  /api/export       - dump notes to markdown     │ │
│  │  • GET  /api/covers/{id}  - serve generated covers     │ │
│  │                                                         │ │
│  │  Services:                                              │ │
│  │  • MetadataExtractor - reads EPUB/PDF metadata         │ │
│  │  • CoverGenerator - creates gradient covers            │ │
│  │  • LinkParser - extracts [[links]] from notes          │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  SQLite Database                        │ │
│  │                  /data/library.db                       │ │
│  │                                                         │ │
│  │  Tables:                                                │ │
│  │  • books - metadata, folder paths, cover colors        │ │
│  │  • notes - markdown content, timestamps                │ │
│  │  • links - from_note_id, to_book_id (for backlinks)   │ │
│  │  • tags  - book categorization                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ Volume mount (read-write for uploads)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Your Book Storage                         │
│              /volume1/Media/Reading/Books/                   │
│                                                              │
│  Fiction/                                                    │
│    └── Author - [Series ##] Title/                          │
│          ├── book.epub                                       │
│          └── book.pdf                                        │
│  Non-Fiction/                                                │
│  FanFiction/                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Library Sync (scanning for books)

```
User clicks "Sync" → POST /api/sync
                           │
                           ▼
              Walk directory tree looking for
              folders containing .epub/.pdf/.mobi
                           │
                           ▼
              For each book folder:
              ├── Check if already in database (by path)
              │   ├── Yes → Skip or update if modified
              │   └── No  → Extract metadata
              │             ├── Parse folder name (author, series, title)
              │             ├── Read EPUB/PDF for richer metadata
              │             ├── Generate gradient cover colors
              │             └── Insert into database
                           │
                           ▼
              Return summary: {added: 12, updated: 3, total: 1560}
```

### 2. Browsing the Library

```
User opens app → GET /api/books?category=Fiction&sort=title
                           │
                           ▼
              Query SQLite with filters/sorting
                           │
                           ▼
              Return JSON array of books with:
              • id, title, authors, series, seriesNumber
              • category, wordCount, publicationYear
              • coverColors (for gradient generation)
              • hasNotes (boolean for UI indicator)
```

### 3. Viewing/Editing Notes

```
User opens book → GET /api/books/{id}
                           │
                           ▼
              Return book metadata + all notes for this book
              Notes include raw markdown with [[links]]
                           │
                           ▼
              Frontend renders markdown, makes links clickable
              User edits note → POST /api/books/{id}/notes
                           │
                           ▼
              Backend parses [[links]] from content
              Updates notes table + links table (for backlinks)
```

---

## Database Schema

```sql
-- Core book data (extracted from files + folders)
CREATE TABLE books (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    authors TEXT NOT NULL,        -- JSON array: ["Author 1", "Author 2"]
    series TEXT,
    series_number TEXT,
    category TEXT,                -- Fiction, Non-Fiction, FanFiction
    publication_year INTEGER,
    word_count INTEGER,
    summary TEXT,
    tags TEXT,                    -- JSON array: ["fantasy", "romance"]
    
    folder_path TEXT UNIQUE,      -- /volume1/.../Author - Title/
    file_path TEXT,               -- Path to primary ebook file
    
    cover_color_1 TEXT,           -- Hex color for gradient
    cover_color_2 TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User's notes about books (the important stuff!)
CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    book_id INTEGER NOT NULL,
    content TEXT,                 -- Markdown with [[links]]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id)
);

-- Tracks [[links]] between notes for backlink queries
CREATE TABLE links (
    id INTEGER PRIMARY KEY,
    from_note_id INTEGER NOT NULL,
    to_book_id INTEGER NOT NULL,
    FOREIGN KEY (from_note_id) REFERENCES notes(id),
    FOREIGN KEY (to_book_id) REFERENCES books(id)
);

-- For quick filtering
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_books_series ON books(series);
CREATE INDEX idx_links_to_book ON links(to_book_id);
```

---

## Key Design Decisions

### Why SQLite?

- Single file, easy to backup (just copy `library.db`)
- No separate database server to manage
- Fast enough for tens of thousands of books
- Full-text search built in (for searching notes later)
- You can open it directly with any SQLite browser if needed

### Why store markdown in the database instead of files?

- Instant search across all notes
- Link tracking (the `links` table) enables backlinks
- Atomic updates (no partial writes if something fails)
- Still your data—export to `.md` files anytime

### Why generate covers instead of extracting them?

- Many ebooks (especially fanfiction) have no covers
- Consistent aesthetic across your library
- Faster sync (no image processing during scan)
- Covers extracted from books can be added as a future enhancement

### Why a monolithic container instead of separate frontend/backend?

- Simpler deployment (one thing to run)
- No CORS configuration needed
- Easier for others to self-host if you share this
- Can split later if needed

---

## File Structure

```
ebook-library-app/
│
├── docker-compose.yml        # Run everything with one command
├── Dockerfile                # Builds the combined container
│
├── backend/                  # Python/FastAPI
│   ├── requirements.txt
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # SQLite connection + schema
│   ├── models.py            # Pydantic models for API
│   │
│   ├── routers/
│   │   ├── books.py         # /api/books endpoints
│   │   ├── notes.py         # /api/books/{id}/notes endpoints  
│   │   └── sync.py          # /api/sync endpoint
│   │
│   └── services/
│       ├── metadata.py      # EPUB/PDF extraction (ported from Obsidian plugin)
│       ├── covers.py        # Gradient generation (ported from Obsidian plugin)
│       └── links.py         # [[link]] parsing
│
├── frontend/                 # React
│   ├── package.json
│   ├── index.html
│   ├── src/
│   │   ├── App.jsx          # Main app + routing
│   │   ├── api.js           # Fetch wrapper for backend
│   │   │
│   │   ├── components/
│   │   │   ├── Library.jsx      # Grid/list of books
│   │   │   ├── BookCard.jsx     # Single book in grid
│   │   │   ├── BookDetail.jsx   # Full book view + notes
│   │   │   ├── NoteEditor.jsx   # Markdown editor
│   │   │   └── GradientCover.jsx # Renders the gradient covers
│   │   │
│   │   └── styles/
│   │       └── main.css
│   │
│   └── vite.config.js       # Build config
│
├── data/                    # Mounted volume for persistence
│   └── library.db           # SQLite database (created on first run)
│
└── docs/
    └── ARCHITECTURE.md      # This file
```

---

## Implementation Order

This is the suggested order for building out the app:

### Phase 1: Foundation (Get Something Running)
1. Docker setup + basic FastAPI "hello world"
2. SQLite database initialization
3. React frontend that calls the API
4. **Milestone:** See "Hello from the backend!" in your browser

### Phase 2: Library View (Read-Only)
1. Folder scanning logic (walks your book directories)
2. Basic metadata extraction (folder name parsing first)
3. Books API endpoint (list, filter, sort)
4. Library grid component
5. **Milestone:** See your books displayed in a grid

### Phase 3: Rich Metadata
1. Port EPUB metadata extraction from Obsidian plugin
2. Port gradient cover generation
3. Cover display in library
4. **Milestone:** Books show covers and have accurate metadata

### Phase 4: Notes
1. Notes database table + API endpoints
2. Note editor component (basic textarea first)
3. Markdown rendering
4. **Milestone:** Can write and save notes for a book

### Phase 5: Linking
1. [[Link]] parsing when saving notes
2. Links table population
3. Backlinks query and display
4. Clickable links in note viewer
5. **Milestone:** Notes link to each other like Obsidian

### Phase 6: Polish
1. Search (full-text across notes)
2. Mobile optimization
3. Export to markdown files
4. Reading status tracking
5. **Milestone:** Actually pleasant to use on your phone

---

## Questions You'll Face (and Suggested Answers)

**Q: How do I handle books that fail metadata extraction?**
A: Fall back to folder name parsing (like the Obsidian plugin does). Log the failure but don't skip the book.

**Q: What if I reorganize my book folders?**
A: The sync process should detect moved books (same title/author, different path) and update rather than duplicate. This is a Phase 6 enhancement.

**Q: How do backlinks work with the linking system?**
A: When you save a note, the backend scans for `[[Book Title]]` patterns. For each match, it looks up the book by title and creates a row in the `links` table. To show backlinks on a book's page, query: `SELECT * FROM links WHERE to_book_id = ?`

**Q: Can I have multiple notes per book?**
A: The schema supports it. Whether the UI shows one big note or multiple is up to you. Start with one note per book (simpler), expand later if you want.

---

## Next Steps

The companion files in this skeleton give you:
- A working Docker setup
- FastAPI backend that connects to SQLite
- React frontend that fetches from the API
- One working endpoint to prove it all connects

From there, you can use Cursor to build out each phase, using this document as your reference for how pieces should fit together.
