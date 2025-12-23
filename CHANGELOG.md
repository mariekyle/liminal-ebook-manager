# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Metadata extraction from uploaded EPUB/PDF files (author from file metadata)
- Move "Sync Library" button to Settings page
- Mobile file picker improvements for .mobi/.azw3 (MIME type issues on some devices)

---

## [0.5.2] - 2025-12-22

### Fixed

#### FanFiction Category Detection
- **AO3-style filename detection** — Now correctly detects files with underscores as word separators (e.g., `The_Hemorrhagic_Magicae.epub`) as FanFiction
- **Removed false positives** — No longer marks all underscore filenames as FanFiction with 90% confidence; detection now uses proper confidence scoring (~70% for underscore pattern)
- **Expanded trope detection** — Added more trope keywords: `slow_burn`, `fix_it`, `canon_divergence`, `enemies_to_lovers`, etc.

#### File Type Support
- **Added .azw support** — Amazon Kindle .azw files now accepted (frontend + backend + priority order)
- **Added MIME types to file picker** — Better compatibility with mobile browsers for ebook formats
- **Priority order consistency** — `.azw` added to metadata extraction priority

#### Filename Parsing
- **Improved author extraction** — Better handling of "Author - Title" format
- **Underscore variant support** — Handles `Author_Name_-_Title.epub` format
- **AO3 work ID parsing** — Correctly parses `12345678_Title.epub` patterns

### Changed

- `parse_filename()` no longer sets `is_fanfiction` flag — category detection delegated to dedicated function with proper confidence scoring
- Frontend file picker now uses combined extensions + MIME types for better mobile support

### Technical

#### Modified Files
- `backend/services/upload_service.py`:
  - Rewrote `detect_fanfiction_from_filename()` with underscore-based detection
  - Rewrote `parse_filename()` to handle more filename patterns
  - Added `.azw` to `ALLOWED_EXTENSIONS`
  - Added `.azw` to `priority_order` in `create_book_group()`
  
- `frontend/src/components/upload/UploadZone.jsx`:
  - Replaced `ALLOWED_EXTENSIONS` array with `ACCEPT_TYPES` string
  - Added MIME types for ebook formats
  - Added `.azw` extension support

### Known Limitations

- **Mobile file picker** — Some Android devices may still not show .mobi/.azw3 files due to MIME type handling; workaround is to use "All files" filter
- **Author detection** — Files without "Author - " in filename show "Unknown" author; EPUB metadata extraction planned for future release

---

## [0.5.1] - 2025-12-22

### Fixed

#### Background Sync After Upload
- **Auto-sync now works** — Uploaded books automatically appear in library
- **Standalone sync function** — Created `run_sync_standalone()` that creates its own database connection via aiosqlite
- **Background task wrapper** — `trigger_library_sync()` safely calls sync from background tasks

### Technical

#### Modified Files
- `backend/database.py`:
  - Added `get_db_path()` function to expose database path for standalone functions
  
- `backend/routers/sync.py`:
  - Added `run_sync_standalone()` async function
  - Added `aiosqlite` import for standalone database connections
  
- `backend/routers/upload.py`:
  - Added import for `run_sync_standalone`
  - Added `trigger_library_sync()` background task wrapper
  - Updated `finalize_batch_endpoint()` to trigger sync when books are uploaded

---

## [0.5.0] - 2025-12-22

### Added

#### Book Upload System (Phase 2)
- **Upload page** — New `/upload` route accessible from Library navigation
- **Drag-and-drop zone** — Drop files or click to select from device
- **Multi-file upload** — Upload multiple books in one session
- **Smart file grouping** — Auto-groups related files (e.g., EPUB + PDF + MOBI of same book)
- **Category auto-detection** — Detects FanFiction, Fiction, Non-Fiction with confidence scores
- **Duplicate detection** — Warns when uploading books that already exist
- **Inline metadata editing** — Edit title, author, series, category before finalizing
- **Per-book progress** — Visual progress indicator for each book during upload
- **Session management** — Upload sessions with 1-hour timeout, automatic cleanup

#### Navigation
- **Upload tab** — Added to Library navigation alongside Library and Series tabs

### Changed

- **Books volume now read-write** — Removed `:ro` flag to allow file uploads

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
- **Poetic category phrases** — Random phrases above book grid

#### Filter State Persistence
- **URL parameter sync** — Filters saved in URL
- **Browser back/forward support** — Navigation preserves filter state

#### Rich Gradient Cover System
- **10 gradient presets** — 6 calm + 4 accent
- **HSL color lanes** — 8 base hues for cohesive library appearance
- **Deterministic generation** — Same book always gets same gradient

---

## [0.3.0] - 2025-12-19

### Added
- Library UI redesign with unified filter bar
- Navigation tabs (Library, Series)
- Series system with detail pages
- Tag filtering with searchable modal

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
| 0.5.2 | 2025-12-22 | **Phase 2.1 complete** — Category detection, .azw support, filename parsing |
| 0.5.1 | 2025-12-22 | Background sync fix |
| 0.5.0 | 2025-12-22 | Phase 2 complete — Book upload system |
| 0.4.0 | 2025-12-20 | Phase 1.5 complete — Obsidian import, rich gradients |
| 0.3.0 | 2025-12-19 | Phase 1 complete — Series system, tag filtering |
| 0.2.0 | 2025-12-17 | Phase 1 core tracking — Status, ratings, dates |
| 0.1.2 | 2025-12-17 | Phase 0 complete — Editable categories |
| 0.1.1 | 2025-12-16 | Single folder migration |
| 0.1.0 | 2025-12-14 | Initial release |

---

## Upgrade Notes

### Upgrading to 0.5.2

**Backend:**
- Replace `backend/services/upload_service.py`

**Frontend:**
- Replace `frontend/src/components/upload/UploadZone.jsx`

**Rebuild Docker container after update.**

### Upgrading to 0.5.1

**Backend:**
- Replace `backend/database.py` (adds `get_db_path()`)
- Replace `backend/routers/sync.py` (adds `run_sync_standalone()`)
- Replace `backend/routers/upload.py` (triggers background sync)

**Rebuild Docker container after update.**

---

## Links

- [Roadmap](./ROADMAP.md)
- [Development Workflow](./20251219_DEVELOPMENT_WORKFLOW.md)
- [Architecture](./ARCHITECTURE.md)
