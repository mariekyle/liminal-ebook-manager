# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 9: Feature Completion (In Progress)
- Phase 9C: Cover improvements — ⚠️ IMPLEMENTED, BUGS PENDING
- Phase 9D: Bug fixes & UI polish
- Phase 9E: Smart Collections system
- Phase 9F: Book detail redesign
- Phase 9G: Library/Home improvements
- Phase 9H: Stats page
- Phase 9I: Collections polish
- Phase 9J: Deduplication tools
- Phase 9K: Unprocessed files detection

---

## [0.21.0] - 2026-01-11 (PENDING BUG FIXES)

### Added

#### Phase 9C: Cover Extraction & Upload System 🎉
Complete cover management system with automatic extraction from EPUBs, custom upload support, and gradient fallback.

**The Problem:**
- All books displayed gradient covers regardless of whether EPUB contained embedded cover
- No way to upload custom cover images for books without embedded covers
- Books with real covers (especially traditionally published) looked generic

**The Solution:**
- Automatic cover extraction from EPUB files during sync
- Custom cover upload via Edit Book modal
- Priority system: Custom > Extracted > Gradient fallback
- Lazy loading for performance with 1,700+ books

---

### Backend Implementation

**Database Schema Changes (`backend/database.py`):**
- **New columns** on `titles` table:
  - `cover_path` (TEXT) — Full path to cover image file
  - `has_cover` (BOOLEAN, default FALSE) — Quick filter for books with covers
  - `cover_source` (TEXT) — Values: 'extracted' | 'custom' | NULL
- **Index:** `CREATE INDEX idx_titles_has_cover ON titles(has_cover)`
- Migration runs automatically on startup

**Cover Extraction Service (`backend/services/covers.py`):**
- **`extract_epub_cover(epub_path, title_id)`** — Extract cover from EPUB
  - Tries OPF metadata `<meta name="cover">` reference first
  - Falls back to first image in manifest containing "cover" in filename
  - Saves as JPEG to `/app/data/covers/extracted/{title_id}.jpg`
  - Uses Pillow for image processing and format conversion
  - Returns saved path or None if no cover found
- **`delete_cover_file(cover_path)`** — Safe file deletion helper

**Cover Storage (`/app/data/covers/`):**
```
covers/
├── extracted/        # Covers from EPUBs (auto-generated)
│   ├── 1.jpg
│   ├── 2.jpg
│   └── ...
├── custom/           # User-uploaded covers
│   ├── 5.jpg
│   └── ...
└── .gitkeep
```

**REST API - Covers Router (`backend/routers/covers.py`):**
- **GET `/api/covers/{title_id}`** — Serve cover image
  - Returns actual image file (not JSON)
  - Falls back to 404 if no cover exists
  - Sets appropriate Content-Type header

**REST API - Titles Router (`backend/routers/titles.py`):**
- **POST `/api/titles/{title_id}/cover`** — Upload custom cover
  - Accepts multipart form data with image file
  - Validates file type (JPEG, PNG, WebP, GIF)
  - Max file size: 10MB
  - Saves to `/app/data/covers/custom/{title_id}.jpg`
  - Updates database: `cover_path`, `has_cover=1`, `cover_source='custom'`
  - Deletes previous cover file if exists
- **DELETE `/api/titles/{title_id}/cover`** — Remove custom cover
  - Deletes cover file from disk
  - If extracted cover exists, reverts to it
  - Otherwise reverts to gradient (clears cover fields)
- **POST `/api/titles/{title_id}/extract-cover`** — Force re-extraction
  - Extracts cover from EPUB regardless of current state
  - Useful for "Rescan Metadata" functionality

**Sync Integration (`backend/routers/sync.py`):**
- Cover extraction now runs automatically during sync
- After creating/updating title record, attempts cover extraction
- Non-blocking: sync continues even if extraction fails
- Logs extraction success/failure to console

**Router Registration (`backend/main.py`):**
- Added `covers` router at `/api` prefix

---

### Frontend Implementation

**API Functions (`frontend/src/api.js`):**
- **`uploadCover(titleId, file)`** — Upload custom cover image
  - Uses FormData for multipart upload
  - Returns updated book data
- **`deleteCover(titleId)`** — Remove custom cover
  - Returns updated book data with reverted cover state
- **`extractCover(titleId)`** — Trigger cover extraction
  - Called by "Rescan Metadata" feature
  - Returns updated book data

**GradientCover Component (`frontend/src/components/GradientCover.jsx`):**
Complete rewrite with new architecture:

- **Props interface:**
  - `book` (required) — Full book object with cover fields
  - `size` (optional) — 'xs' | 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
  - `showText` (optional) — Show title/author overlay (default: true)
  - `className` (optional) — Additional CSS classes

- **Lazy loading:**
  - Uses IntersectionObserver API
  - 100px rootMargin for pre-loading
  - Shows gradient placeholder until image loads
  - Graceful fallback on image load error

- **Cover priority:**
  1. Real cover image (`book.has_cover && book.cover_path`)
  2. Gradient fallback (using existing color system)

- **Size presets:**
  | Size | Dimensions | Use Case |
  |------|------------|----------|
  | xs | 48×72 | Compact lists |
  | sm | 64×96 | Grid thumbnails |
  | md | 96×144 | Default cards |
  | lg | 128×192 | Detail page |
  | xl | 160×240 | Hero display |

**Edit Book Modal (`frontend/src/components/EditBookModal.jsx`):**
New "Cover Image" section with:
- Current cover preview (thumbnail)
- Cover source indicator: "Custom cover uploaded" / "Cover from EPUB" / "Using gradient cover"
- File upload input (accepts image/*)
- "Remove custom cover" button (when custom cover exists)
- Visual feedback during upload/delete operations

---

### Key Features

- ✅ **Automatic extraction** — Covers extracted from EPUBs during sync
- ✅ **Custom upload** — Upload any image as book cover
- ✅ **Priority system** — Custom > Extracted > Gradient
- ✅ **Lazy loading** — IntersectionObserver for performance
- ✅ **Graceful fallback** — Gradient covers when no image available
- ✅ **Rescan support** — Re-extract covers via "Rescan Metadata"
- ✅ **File management** — Old covers deleted when replaced

---

### Known Issues (Blocking Deployment)

**Bug 1: Gradient covers not filling containers**
- All gradient covers appear cropped/small across every screen
- Root cause: New GradientCover uses fixed sizes but callers expect `w-full h-full`
- Affects: Library grid, BookDetail, all screens displaying gradient covers

**Bug 2: Missing titles/authors on gradient covers**
- Text overlay completely missing from book covers
- Related to GradientCover rewrite removing text rendering

**Bug 3: Edit Book Details modal has no background**
- Modal is transparent instead of showing `bg-library-dark`
- Unrelated to cover changes but discovered during testing

**Bug 4: Cover operation handlers await non-promise**
- Cover upload/delete handlers call `await onSave()` expecting promise
- `handleMetadataSave` in BookDetail is not async, returns undefined
- Breaks cover refresh after operations

**Bug 5: GradientCover signature incompatibility**
- New component requires `book` object prop
- Existing callers still pass old props: `title`, `author`, `coverGradient`, etc.
- Breaks cover rendering across app

**Status:** Implementation complete, bugs must be fixed before deployment

---

### Technical

#### Database Changes
- Migration: Added 3 columns to `titles` table
- Index: `CREATE INDEX idx_titles_has_cover ON titles(has_cover)`
- Explicit commit added after migration block

#### New Files
- `backend/routers/covers.py` — Cover serving endpoint
- `/app/data/covers/` directory structure

#### Modified Files (9 total)
**Backend:**
- `backend/database.py` — Phase 9C migration
- `backend/services/covers.py` — Extraction logic
- `backend/routers/titles.py` — Upload/delete endpoints
- `backend/routers/sync.py` — Auto-extraction integration
- `backend/main.py` — Router registration

**Frontend:**
- `frontend/src/api.js` — 3 new API functions
- `frontend/src/components/GradientCover.jsx` — Complete rewrite
- `frontend/src/components/EditBookModal.jsx` — Cover section

#### Docker Volume
Add to `docker-compose.yml`:
```yaml
volumes:
  - ./data/covers:/app/data/covers
```

#### Dependencies
- No new Python dependencies (Pillow already installed)

### Development Stats

- **Implementation time:** Jan 11, 2026 (3 Cursor prompts)
- **Lines of code:** ~600 lines added/modified
- **Files changed:** 9 files (6 backend, 3 frontend)
- **New endpoints:** 4 (GET cover, POST upload, DELETE cover, POST extract)
- **Status:** ⚠️ Implemented but blocked by 5 bugs

---

## [0.20.0] - 2026-01-10

### Added

#### Phase 9B: Folder Structure Independence 🎉
File metadata now takes priority over folder names for title and author extraction, making folder naming conventions optional.

**The Problem:**
- Folder naming errors like "tryslora- Fire Burning" (missing space after author) caused wrong metadata
- EPUB had correct data (title: "Fire Burning", author: "tryslora") but was ignored
- Users had to follow strict `Author - [Series ##] Title` naming conventions for proper metadata
- Sync relied on parsing folder names first, only using file metadata for supplementary fields

**The Solution:**
- EPUB/PDF metadata is now PRIMARY source for title and authors
- Folder name parsing is FALLBACK when file metadata is missing or invalid
- Validation filters out placeholder values before accepting metadata

**Backend Changes (`backend/routers/sync.py`):**
- **Metadata priority reversed** — File metadata now extracted and checked first
- **Title validation** — Filters placeholder titles before accepting:
  - "unknown", "untitled", empty strings
  - Titles that are just the filename
- **Author validation** — Filters placeholder authors before accepting:
  - "Unknown Author", "Anonymous", "Various Authors"
  - Empty strings and whitespace-only values
- **Fallback chain implemented:**
  1. EPUB/PDF file metadata (highest priority)
  2. Folder name parsing (fallback)
  3. "Unknown" defaults (last resort)

**Architecture Updates:**
- **`.cursorrules` updated** — Documents new metadata priority system
- **Data flow diagram** — Reflects file-first extraction approach
- **Protected systems updated** — Folder name parsing no longer "sacred" (now just a fallback)

**Key Test Case: "Fire Burning"**
| Field | Before (v0.19.0) | After (v0.20.0) |
|-------|------------------|-----------------|
| Title | "tryslora- Fire Burning" | "Fire Burning" ✅ |
| Author | "Unknown Author" | "tryslora" ✅ |

**User Impact:**
- ✅ **Flexible folder naming** — Name folders however you want
- ✅ **Better metadata** — EPUB data takes priority over folder parsing errors
- ✅ **Backward compatible** — Existing properly-named folders still work
- ✅ **Fix existing books** — Use "Rescan Metadata" to update incorrectly parsed books
- ✅ **No database changes** — No migrations needed

### Changed

- **Sync metadata extraction** — File metadata now primary, folder name is fallback
- **Title/author assignment** — Validation filters placeholder values before accepting

### Technical

#### Files Modified
- `backend/routers/sync.py` — Metadata merge logic (~25 lines added)
- `.cursorrules` — Architecture documentation updated

#### No Database Changes
- No migrations needed
- No schema changes
- Existing data unaffected

### Development Stats

- **Implementation time:** Same day as Phase 9A (Jan 10, 2026)
- **Lines of code:** ~25 lines added to sync.py
- **Files changed:** 2 (`sync.py`, `.cursorrules`)
- **Backward compatible:** Yes — existing folders work, rescan to update
- **Risk level:** Low — additive change, no data modifications

---

## [0.19.0] - 2026-01-10

### Added

#### Phase 9A: Automated Backup System 🎉
Complete automated database backup system with grandfather-father-son rotation, fully configurable via Settings UI with no Docker knowledge required.

**Backend - Database Schema:**
- **Backup settings columns** — Added to `settings` table:
  - `backup_enabled` (BOOLEAN, default TRUE)
  - `backup_path` (TEXT, default '/app/data/backups')
  - `backup_schedule` (TEXT, default 'both') — Options: 'before_sync' | 'daily' | 'both'
  - `backup_time` (TEXT, default '03:00')
  - `backup_daily_retention_days` (INTEGER, default 7)
  - `backup_weekly_retention_weeks` (INTEGER, default 4)
  - `backup_monthly_retention_months` (INTEGER, default 6)
  - `last_backup_time` (TIMESTAMP)
- **Backup history table** — New `backup_history` table tracks all backups:
  - `id` (PRIMARY KEY)
  - `backup_type` (TEXT) — Values: 'daily' | 'weekly' | 'monthly' | 'manual' | 'pre_sync'
  - `file_path` (TEXT) — Full path to backup file
  - `file_size` (INTEGER) — Size in bytes
  - `created_at` (TIMESTAMP)
  - `status` (TEXT) — 'success' | 'failed'
  - Index on `created_at` for performance

**Backend - Backup Service (`backend/services/backup.py`):**
- **Grandfather-father-son rotation** — Automatic categorization:
  - Monthly backups on 1st of month
  - Weekly backups on Sundays
  - Daily backups on all other days
- **Core functions:**
  - `get_backup_settings()` — Load configuration from database
  - `save_backup_settings()` — Persist configuration changes
  - `create_backup()` — Create database backup with type detection
  - `cleanup_old_backups()` — Enforce retention policy, delete old backups
  - `get_backup_stats()` — Calculate total size, count, breakdown by type
  - `get_backup_history()` — Query recent backups
  - `validate_backup_path()` — Test if path is writable
  - `delete_backup()` — Remove specific backup file and record
  - `schedule_backup_jobs()` — Set up APScheduler with cron triggers
  - `start_scheduler()` / `stop_scheduler()` — Control scheduler lifecycle
  - `update_scheduler_time()` — Modify schedule without restart
- **Automatic cleanup** — Old backups deleted based on retention policy
- **Error handling** — Failed backups logged to history table with error message

**Backend - REST API (`backend/routers/backups.py`):**
- **GET `/api/backups/settings`** — Returns current configuration + stats
- **PATCH `/api/backups/settings`** — Update backup configuration
- **POST `/api/backups/test-path`** — Test if path is writable
- **POST `/api/backups/manual`** — Trigger immediate backup
- **GET `/api/backups/history`** — List recent backups (limit 50)
- **DELETE `/api/backups/history/{id}`** — Delete specific backup

**Frontend - Settings UI (`frontend/src/components/SettingsDrawer.jsx`):**
- **"Automated Backups" section** — Complete configuration UI
- Enable/disable toggle, path input with validation
- Schedule selector, time picker, retention controls
- Stats display, manual backup button

**Key Features:**
- ✅ **Works out-of-box** — Sensible defaults, no configuration required
- ✅ **Path flexibility** — Changeable anytime via Settings UI
- ✅ **No Docker knowledge required** — All configuration via web UI
- ✅ **Automatic rotation** — Monthly on 1st, weekly on Sundays, daily otherwise
- ✅ **Retention enforcement** — Old backups auto-deleted per policy

### Development Stats

- **Implementation time:** 3 days (Jan 10, 2026)
- **Lines of code:** ~1,500 lines
- **Files changed:** 7 files (3 backend, 2 frontend, 2 config)
- **Data protected:** 1,796 books, 251 notes, complete reading history 🛡️

---

## [0.18.0] - 2026-01-04

### Added

#### Phase 8.7a: Session Format Tracking
Track which format (ebook, physical, audiobook, web) was used for each reading session.

- **Format column** — New `format` TEXT column in `reading_sessions` table
- **Format dropdown** — Session modal includes format picker
- **Format badges on sessions** — Color-coded format indicators

#### Phase 8.7b: Add Edition to Existing Title
Add new formats to existing books without creating duplicate title records.

- **"+ Add Format" button** — Appears on BookDetail page
- **AddEditionModal** — Modal with format picker
- **POST /api/books/{id}/editions** — New endpoint

#### Phase 8.7d: Merge Duplicate Titles Tool
Combine duplicate title records into a single consolidated entry.

- **"Merge Into..." menu option** — Available in BookDetail three-dot menu
- **MergeTitleModal** — Search for target title with merge preview
- **POST /api/titles/{id}/merge** — Merge endpoint

---

## [0.17.0] - 2026-01-03

### Added

#### Phase 8.3: Book Detail Header Redesign
Complete redesign with metadata pill boxes.

#### Phase 8.4: Rating Label System
Customizable labels for each star rating.

---

*For earlier versions, see previous CHANGELOG entries.*
