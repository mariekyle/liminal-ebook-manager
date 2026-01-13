# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 9: Feature Completion (In Progress)
- Phase 9D: Bug fixes & UI polish
- Phase 9E: Smart Collections system
- Phase 9F: Book detail redesign
- Phase 9G: Library/Home improvements
- Phase 9H: Stats page
- Phase 9I: Collections polish
- Phase 9J: Deduplication tools
- Phase 9K: Unprocessed files detection

### Technical Debt
- **Browser cache issues with covers** — After editing many book covers, changes may not reflect immediately when navigating between pages. "Use gradient" button may stop responding. Workaround: Clear browser cache for the past hour and close/reopen tab. Root cause likely related to aggressive image caching or IntersectionObserver state management. To investigate in future.

---

## [0.22.0] - 2026-01-13

### Added

#### Phase 9C Complete: Automatic Cover Extraction 🎉
Full automatic cover extraction system with category-based filtering and bulk extraction tools.

**New Features:**
- **Auto-extraction during sync** — Covers extracted automatically when syncing Fiction/Non-Fiction books
- **Bulk extraction tool** — New section in Settings to extract covers from existing library
- **Category filtering** — FanFiction books skip extraction (gradient covers only, by design)
- **Smart status handling** — Stale cover status cleared when re-extraction finds no cover

---

### Backend Implementation

**Sync Integration (`backend/routers/sync.py`):**
- Added category check before cover extraction (2 locations: existing titles + new titles)
- FanFiction books now properly skip extraction
- Stale cover status cleared when re-extraction returns None
- Existing custom covers never overwritten

**Bulk Extraction Endpoint (`backend/routers/titles.py`):**
- **POST `/api/titles/covers/bulk-extract`** — Extract covers from multiple books
  - Accepts `categories` array (Fiction, Non-Fiction)
  - FanFiction filtered out even if requested
  - GROUP BY fix prevents duplicate counting with multiple editions
  - Non-EPUB files (PDF, MOBI) correctly skipped
  - Returns detailed stats: extracted, skipped (custom/no_epub/no_cover/fanfiction), failed

**Response format:**
```json
{
  "extracted": 45,
  "skipped_has_custom": 12,
  "skipped_no_epub": 8,
  "skipped_no_cover": 23,
  "skipped_fanfiction": 156,
  "failed": 2,
  "total_processed": 246
}
```

---

### Frontend Implementation

**Settings UI (`frontend/src/components/SettingsDrawer.jsx`):**
- New "Bulk Cover Extraction" section
- Category checkboxes (Fiction, Non-Fiction pre-selected)
- FanFiction option disabled with explanation
- Progress feedback during extraction
- Detailed results display with all counters
- Clear visual separation from other settings

**API Functions (`frontend/src/api.js`):**
- **`bulkExtractCovers(categories)`** — Trigger bulk extraction for selected categories

---

### Bug Fixes

**✅ Bug 6: FanFiction not filtered from bulk extract**
- **Problem:** API accepted FanFiction category despite documented exclusion
- **Fix:** Filter out 'FanFiction' from category list before processing

**✅ Bug 7: Misleading counter for "No Cover in EPUB"**
- **Problem:** EPUBs without embedded covers counted as `skipped_no_epub`
- **Fix:** Added `skipped_no_cover` counter for EPUBs that exist but have no cover

**✅ Bug 8: Duplicate editions counted multiple times**
- **Problem:** LEFT JOIN without GROUP BY caused duplicate rows for titles with multiple ebook editions
- **Fix:** Added `GROUP BY t.id` and `MIN(e.file_path)` to query

**✅ Bug 9: Non-EPUB files cause extraction failures**
- **Problem:** Bulk extract called `extract_epub_cover()` on PDF/MOBI files
- **Fix:** Added `.epub` extension check before extraction attempt

**✅ Bug 10: Stale cover status after re-extraction fails**
- **Problem:** If re-extraction found no cover, old `cover_source = 'extracted'` remained
- **Fix:** Clear cover status when extraction returns None for previously extracted covers

---

### Key Features (Phase 9C Complete)

- ✅ **Custom upload** — Upload any image as book cover
- ✅ **Auto-extraction on sync** — Fiction/Non-Fiction books get covers automatically
- ✅ **Bulk extraction tool** — Extract covers from existing library via Settings
- ✅ **Category filtering** — FanFiction uses gradient covers only
- ✅ **Priority system** — Custom > Extracted > Gradient
- ✅ **Lazy loading** — IntersectionObserver for performance
- ✅ **Graceful fallback** — Gradient covers when no image available
- ✅ **Smart re-sync** — Stale status cleared, custom covers preserved

---

### Technical

#### Files Modified
**Backend:**
- `backend/routers/sync.py` — Category filtering, stale status handling
- `backend/routers/titles.py` — Bulk extract endpoint with all fixes

**Frontend:**
- `frontend/src/api.js` — `bulkExtractCovers()` function
- `frontend/src/components/SettingsDrawer.jsx` — Bulk extraction UI

#### Behavior Summary
| Category | On Sync | Bulk Tool | Cover Type |
|----------|---------|-----------|------------|
| Fiction | ✅ Extract | ✅ Available | Real or Gradient |
| Non-Fiction | ✅ Extract | ✅ Available | Real or Gradient |
| FanFiction | ❌ Skip | ❌ Disabled | Gradient only |

### Development Stats

- **Implementation time:** Jan 13, 2026
- **Lines of code:** ~200 added
- **Bugs fixed:** 5 additional (10 total for Phase 9C)
- **Status:** ✅ Phase 9C Complete

---

## [0.21.0] - 2026-01-12

### Added

#### Phase 9C: Cover Extraction & Upload System 🎉
Complete cover management system with custom upload support, gradient fallback, and automatic extraction (pending).

**The Problem:**
- All books displayed gradient covers regardless of whether EPUB contained embedded cover
- No way to upload custom cover images for books without embedded covers
- Books with real covers (especially traditionally published) looked generic

**The Solution:**
- Custom cover upload via Edit Book modal
- Priority system: Custom > Extracted > Gradient fallback
- Lazy loading for performance with 1,700+ books
- Automatic extraction from EPUBs during sync (still in progress)

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
  - Cache-busting support via query parameter
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
Complete rewrite with backward-compatible prop interface:

- **Props interface (backward compatible):**
  - `book` (optional) — Full book object with cover fields
  - `title` (optional) — Book title for text overlay (legacy)
  - `author` (optional) — Author name for text overlay (legacy)
  - `coverGradient` (optional) — Gradient string (legacy)
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

- **Size presets with proper container fill:**
  | Size | Behavior | Use Case |
  |------|----------|----------|
  | xs | 48×72 fixed | Compact lists |
  | sm | 64×96 fixed | Grid thumbnails |
  | md | 96×144 fixed | Default cards |
  | lg | 128×192 fixed | Detail page |
  | xl | 160×240 fixed | Hero display |
  | (none) | w-full h-full | Container fill |

- **Text overlay restored:**
  - Title and author display on gradient covers
  - Proper truncation for long titles
  - Gradient overlay for readability

**Edit Book Modal (`frontend/src/components/EditBookModal.jsx`):**
New "Cover Image" section with:
- Current cover preview (thumbnail)
- Cover source indicator: "Custom cover uploaded" / "Cover from EPUB" / "Using gradient cover"
- File upload input (accepts image/*)
- "Remove custom cover" button (when custom cover exists)
- Visual feedback during upload/delete operations
- Proper modal background styling

**BookDetail Page (`frontend/src/components/BookDetail.jsx`):**
- Cover upload/delete handlers properly async
- Cover state refreshes after operations
- Cache-busting for immediate visual feedback

---

### Bug Fixes (Jan 11-12, 2026)

Over 4 debugging sessions, the following issues were resolved:

**✅ Bug 1: Gradient covers not filling containers**
- **Problem:** All gradient covers appeared cropped/small across every screen
- **Root cause:** New GradientCover used fixed sizes but callers expected `w-full h-full`
- **Fix:** When no size prop specified, component now fills parent container

**✅ Bug 2: Missing titles/authors on gradient covers**
- **Problem:** Text overlay completely missing from book covers
- **Root cause:** GradientCover rewrite removed text rendering logic
- **Fix:** Restored title/author overlay with proper styling and truncation

**✅ Bug 3: Edit Book Details modal has no background**
- **Problem:** Modal was transparent instead of showing `bg-library-dark`
- **Fix:** Restored proper modal background and overlay styling

**✅ Bug 4: Cover operation handlers await non-promise**
- **Problem:** Cover upload/delete handlers called `await onSave()` expecting promise
- **Root cause:** `handleMetadataSave` in BookDetail was not async
- **Fix:** Made save handlers properly async, return promises

**✅ Bug 5: GradientCover signature incompatibility**
- **Problem:** New component required `book` object prop
- **Root cause:** Existing callers passed old props: `title`, `author`, `coverGradient`
- **Fix:** Made component backward compatible, accepting both old and new prop styles

---

### Technical

#### Database Changes
- Migration: Added 3 columns to `titles` table
- Index: `CREATE INDEX idx_titles_has_cover ON titles(has_cover)`
- Explicit commit added after migration block

#### New Files
- `backend/routers/covers.py` — Cover serving endpoint
- `/app/data/covers/` directory structure

#### Modified Files
**Backend:**
- `backend/database.py` — Phase 9C migration
- `backend/services/covers.py` — Extraction logic
- `backend/routers/titles.py` — Upload/delete endpoints
- `backend/main.py` — Router registration

**Frontend:**
- `frontend/src/api.js` — 3 new API functions
- `frontend/src/components/GradientCover.jsx` — Complete rewrite (backward compatible)
- `frontend/src/components/EditBookModal.jsx` — Cover section + modal fixes
- `frontend/src/components/BookDetail.jsx` — Async handlers, cover refresh

#### Docker Volume
Add to `docker-compose.yml`:
```yaml
volumes:
  - ./data/covers:/app/data/covers
```

#### Dependencies
- No new Python dependencies (Pillow already installed)

### Development Stats

- **Implementation time:** Jan 11-12, 2026 (4 debugging sessions)
- **Lines of code:** ~800 lines added/modified
- **Files changed:** 10+ files (backend + frontend)
- **New endpoints:** 4 (GET cover, POST upload, DELETE cover, POST extract)
- **Bugs fixed:** 5 (all blocking issues resolved)

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
