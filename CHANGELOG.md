# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Metadata extraction from uploaded EPUB/PDF files (using existing extractor)
- Move "Sync Library" button to Settings page

---

## [0.5.1] - 2025-12-22

### Fixed

#### Background Sync After Upload
- **Auto-sync now works** — Uploaded books automatically appear in library
- **Standalone sync function** — Created `run_sync_standalone()` that creates its own database connection via aiosqlite, bypassing FastAPI's Depends limitation
- **Background task wrapper** — `trigger_library_sync()` safely calls sync from background tasks

#### Category Auto-Detection (Greatly Improved)
- **Filename-based FanFiction detection** — Now detects:
  - AO3 numeric IDs at start of filename (e.g., `12345678_story_title.epub`)
  - AO3/Archive of Our Own mentions in filename
  - FanFiction.net (FFN) indicators
  - Wattpad indicators
  - `work_id` patterns
  - Ship patterns like "Character x Character"
  - Common trope words (oneshot, drabble, fluff, angst, AU, etc.)
- **Author username pattern detection** — Identifies fanfic-style usernames:
  - Contains underscores (e.g., `some_author_name`)
  - Alphanumeric with numbers (e.g., `writer123`)
  - All lowercase with no spaces (e.g., `coolwriter`)
  - Hyphen with numbers (e.g., `rock-the-casbah18`)
- **Non-Fiction title detection** — Recognizes patterns like:
  - "How to...", "Guide to...", "Introduction to..."
  - "The Art of...", "The Science of...", "The History of..."
  - Keywords: memoir, biography, autobiography, self-help, textbook, handbook
- **Confidence scoring** — Each detection method contributes to a confidence score; category assigned when threshold reached

#### Author Auto-fill in Upload UI
- **Fixed filename parsing** — Now correctly extracts author from "Author - Title" format
- **Removed bad heuristic** — No longer requires author to be shorter than title
- **AO3 filename support** — Handles `12345678_title.epub` and `12345678 - Author - Title.epub` patterns
- **Series extraction** — Correctly parses `[Series ##] Title` format from filenames

### Changed

- **Sync module** — Added `aiosqlite` import and `DATABASE_PATH` import from database module
- **Upload router** — Now imports and calls `run_sync_standalone` for background sync

### Technical

#### Modified Files
- `backend/database.py`:
  - Added `get_db_path()` function to expose database path for standalone functions
  
- `backend/services/upload_service.py`:
  - Rewrote `parse_filename()` with better pattern matching
  - Added `detect_fanfiction_from_filename()` function
  - Added `detect_nonfiction_from_filename()` function
  - Rewrote `detect_category()` to use filename-based detection
  - Updated `apply_category_detection()` to pass filename to detector
  
- `backend/routers/sync.py`:
  - Added `run_sync_standalone()` async function
  - Added `aiosqlite` import for standalone database connections
  - Added `DATABASE_PATH` import from database module
  
- `backend/routers/upload.py`:
  - Added import for `run_sync_standalone`
  - Added `trigger_library_sync()` background task wrapper
  - Updated `finalize_batch_endpoint()` to trigger sync when books are uploaded

### Database Changes
- None required

### Dependencies
- Requires `DATABASE_PATH` export from `database.py` (see upgrade notes)

---

## [0.5.0] - 2025-12-22

### Added

#### Book Upload System (Phase 2)
- **Upload page** — New `/upload` route accessible from Library navigation
- **Drag-and-drop zone** — Drop files or click to select from device
- **Multi-file upload** — Upload multiple books in one session
- **Smart file grouping** — Auto-groups related files (e.g., EPUB + PDF + MOBI of same book) using fuzzy title/author matching (0.80 similarity threshold)
- **Category auto-detection** — Detects FanFiction, Fiction, Non-Fiction with confidence scores based on:
  - Filename patterns (AO3 indicators, author formatting)
  - File metadata when available
  - Falls back to "Uncategorized" when uncertain
- **Duplicate detection** — Warns when uploading books that already exist in library with three options:
  - Add Format — Add new file format to existing book
  - Replace — Replace existing book with new upload
  - Skip — Don't upload this book
- **Inline metadata editing** — Edit title, author, series, category before finalizing upload
- **Per-book progress** — Visual progress indicator for each book during upload
- **Session management** — Upload sessions with 1-hour timeout, automatic temp file cleanup
- **Upload constraints** — 100MB per file, 500MB per batch, supported formats: EPUB, PDF, MOBI, AZW3, HTML

#### Navigation
- **Upload tab** — Added to Library navigation alongside Library and Series tabs
- Navigates to dedicated upload page (not a tab switch)

### Changed

#### Docker Configuration
- **Books volume now read-write** — Removed `:ro` flag to allow file uploads
- Updated ARCHITECTURE.md to reflect new write permissions for uploads

#### Documentation
- Updated ARCHITECTURE.md key principle to mention upload capability
- Updated volume mount diagram to show read-write access

### Technical

#### New Backend Files
- `backend/routers/upload.py` — Upload API endpoints
- `backend/services/upload_service.py` — Upload business logic

#### New Frontend Files
- `frontend/src/pages/UploadPage.jsx` — Main upload page with 6-screen workflow
- `frontend/src/components/upload/` — 8 component files for upload UI

---

## [0.4.0] - 2025-12-20

### Added

#### Obsidian Import System
- **Import UI page** — Drag-and-drop file upload for Obsidian markdown notes
- **Markdown parser** — Extracts status, rating, dates from YAML frontmatter
- **Book matching** — Confidence-based matching by title/author
- **Batch import** — Apply metadata to multiple books at once

#### Collapsible Filter Header
- **Scroll-to-hide header** — Filter bar hides when scrolling down, reveals on scroll up
- **Collapsed state** — Shows search term and filter count in minimal bar
- **Tap to expand** — Click collapsed bar to show full filters
- **Poetic category phrases** — Random phrases above book grid

#### Filter State Persistence
- **URL parameter sync** — Filters saved in URL
- **Browser back/forward support** — Navigation preserves filter state
- **Shareable filtered views** — Copy URL to share specific filters

#### Rich Gradient Cover System
- **10 gradient presets** — 6 calm + 4 accent
- **HSL color lanes** — 8 base hues for cohesive library appearance
- **Same author = similar colors** — Books grouped visually by author
- **Vignette overlay** — Subtle edge darkening for text readability
- **Deterministic generation** — Same book always gets same gradient

---

## [0.3.0] - 2025-12-19

### Added
- Library UI redesign with unified filter bar
- Navigation tabs (Library, Series)
- Series system with detail pages
- Tag filtering with searchable modal
- Series section on Book Detail page

---

## [0.2.0] - 2025-12-17

### Added
- Read status system (Unread, In Progress, Finished, DNF)
- 1-5 star rating system
- Reading dates (started, finished)
- Database migrations

---

## [0.1.2] - 2025-12-17

### Added
- Category dropdown on book detail page
- FanFiction auto-detection

---

## [0.1.1] - 2025-12-16

### Added
- Single folder scanning
- Content matching for moved books

---

## [0.1.0] - 2025-12-14

### Added
- Initial release
- Library browsing with gradient covers
- Search, filter, sort
- Book detail page
- Notes system
- Docker deployment

---

## Version History Summary

| Version | Date | Milestone |
|---------|------|-----------|
| 0.5.1 | 2025-12-22 | **Phase 2.1 complete** — Upload polish, auto-sync, better detection |
| 0.5.0 | 2025-12-22 | Phase 2 complete — Book upload system |
| 0.4.0 | 2025-12-20 | Phase 1.5 complete — Obsidian import, rich gradients |
| 0.3.0 | 2025-12-19 | Phase 1 complete — Series system, tag filtering |
| 0.2.0 | 2025-12-17 | Phase 1 core tracking — Status, ratings, dates |
| 0.1.2 | 2025-12-17 | Phase 0 complete — Editable categories |
| 0.1.1 | 2025-12-16 | Single folder migration |
| 0.1.0 | 2025-12-14 | Initial release |

---

## Upgrade Notes

### Upgrading to 0.5.1

**Backend Changes Required:**

1. **Replace these files:**
   - `backend/database.py` — New version with `get_db_path()` function
   - `backend/services/upload_service.py` — New version with improved detection
   - `backend/routers/sync.py` — New version with standalone sync function
   - `backend/routers/upload.py` — New version that triggers background sync

2. **Rebuild Docker container** after uploading files

**No database migrations required.**

### Upgrading to 0.5.0

**Docker:**
- Update `docker-compose.yml` — Remove `:ro` from books volume mount
- Rebuild container after update

**Backend:**
- Add new files: `backend/routers/upload.py`, `backend/services/upload_service.py`
- Register upload router in `main.py`

**Frontend:**
- Add new files: `frontend/src/pages/UploadPage.jsx`, `frontend/src/components/upload/` (8 files)
- Update `api.js` with upload functions
- Update `App.jsx` with /upload route
- Update `Library.jsx` with Upload tab

**Database:**
- No migrations required

---

## Links

- [Roadmap](./ROADMAP.md)
- [Development Workflow](./20251219_DEVELOPMENT_WORKFLOW.md)
- [Architecture](./ARCHITECTURE.md)
