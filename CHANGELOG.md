# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Move "Sync Library" button to Settings page

---

## [0.5.4] - 2025-12-23

### Fixed

#### Mobile File Picker for .mobi/.azw3
- **Android document picker now works** — Uses broad MIME types (`application/*,text/*`) to trigger document browser instead of photo picker
- **All ebook formats selectable on mobile** — .mobi, .azw3, .azw, .epub, .pdf, .html now all work on Android

### Technical

#### Modified Files
- `frontend/src/components/upload/UploadZone.jsx`:
  - Updated `accept` attribute to use `application/*,text/*` plus explicit extensions
  - Forces Android to open document picker (Material Files) instead of photo picker

---

## [0.5.3] - 2025-12-23

### Added

#### EPUB/PDF Metadata Extraction During Upload
- **Author auto-population** — Authors now extracted from EPUB/PDF metadata instead of showing "Unknown"
- **Title from metadata** — Prefers embedded title over filename parsing
- **Rich metadata** — Extracts publication year, summary, tags, and word count from files
- **Graceful fallback** — Falls back to filename parsing if metadata extraction fails
- **Debug logging** — Logs extracted metadata for troubleshooting

#### "Upload as New Book" for False Duplicate Matches
- **Override incorrect matches** — "Not a match? Upload as separate book" link below duplicate actions
- **Confirmation UI** — Green "Uploading as New Book" banner when selected
- **Backend support** — Uses existing `action: 'new'` to create separate book folder

### Changed

- `extract_file_metadata()` is now async to support EPUB/PDF parsing
- Upload analysis calls metadata extractor for `.epub` and `.pdf` files

---

## [0.5.2] - 2025-12-22

### Fixed

#### FanFiction Category Detection
- **AO3-style filename detection** — Now correctly detects files with underscores as word separators
- **Removed false positives** — Proper confidence scoring (~70% for underscore pattern)
- **Expanded trope detection** — Added more trope keywords

#### File Type Support
- **Added .azw support** — Amazon Kindle .azw files now accepted
- **Added MIME types to file picker** — Better compatibility with browsers
- **Priority order consistency** — `.azw` added to metadata extraction priority

#### Filename Parsing
- **Improved author extraction** — Better "Author - Title" handling
- **Underscore variant support** — Handles `Author_Name_-_Title.epub` format
- **AO3 work ID parsing** — Correctly parses `12345678_Title.epub` patterns

---

## [0.5.1] - 2025-12-22

### Fixed

#### Background Sync After Upload
- **Auto-sync now works** — Uploaded books automatically appear in library
- **Standalone sync function** — `run_sync_standalone()` with own DB connection
- **Background task wrapper** — `trigger_library_sync()` for post-upload sync

---

## [0.5.0] - 2025-12-22

### Added

#### Book Upload System (Phase 2)
- **Upload page** — New `/upload` route accessible from Library navigation
- **Drag-and-drop zone** — Drop files or click to select from device
- **Multi-file upload** — Upload multiple books in one session
- **Smart file grouping** — Auto-groups related files (e.g., EPUB + PDF + MOBI)
- **Category auto-detection** — FanFiction, Fiction, Non-Fiction with confidence scores
- **Duplicate detection** — Warns when uploading books that already exist
- **Inline metadata editing** — Edit title, author, series, category before finalizing
- **Per-book progress** — Visual progress indicator during upload
- **Session management** — 1-hour timeout, automatic cleanup

---

## [0.4.0] - 2025-12-20

### Added

#### Obsidian Import System
- Import UI page with drag-and-drop
- Markdown parser for YAML frontmatter
- Book matching by title/author
- Batch import support

#### Collapsible Filter Header
- Scroll-to-hide header
- Poetic category phrases

#### Filter State Persistence
- URL parameter sync
- Browser back/forward support

#### Rich Gradient Cover System
- 10 gradient presets
- HSL color lanes
- Deterministic generation

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
| 0.5.4 | 2025-12-23 | Mobile file picker fix for .mobi/.azw3 |
| 0.5.3 | 2025-12-23 | EPUB metadata extraction, "Upload as New" option |
| 0.5.2 | 2025-12-22 | Category detection, .azw support, filename parsing |
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

### Upgrading to 0.5.4

**Frontend:**
- Replace `frontend/src/components/upload/UploadZone.jsx`

**Rebuild Docker container after update.**

---

## Links

- [Roadmap](./ROADMAP.md)
- [Development Workflow](./20251219_DEVELOPMENT_WORKFLOW.md)
- [Architecture](./ARCHITECTURE.md)
