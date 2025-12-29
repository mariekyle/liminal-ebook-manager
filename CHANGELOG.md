# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- "No summary" notice on book detail page

---

## [0.9.2] - 2025-12-29

### Added

#### Orphan Detection System
- **Automatic orphan detection** — Sync now detects when book folders are missing from the filesystem
- **New `is_orphaned` column** — Titles table tracks orphan status separately from other fields
- **Auto-recovery** — If a previously orphaned book's folder reappears, it's automatically un-orphaned
- **Sync result tracking** — Sync reports now include `orphaned` and `recovered` counts
- **Preserves all data** — Orphaned books retain their notes, ratings, reading status, and metadata

### Technical

#### Database Changes
- Migration: Added `is_orphaned INTEGER DEFAULT 0` column to titles table

#### Modified Files
- `backend/database.py` — Added is_orphaned column to schema and migration
- `backend/routers/sync.py` — Added orphan detection and auto-recovery logic

#### How It Works
1. During sync, all found folder paths are tracked
2. After processing folders, editions with `folder_path` not found on disk are identified
3. Those titles are marked `is_orphaned = 1`
4. When a folder reappears (re-uploaded, restored), title is automatically recovered (`is_orphaned = 0`)
5. TBR items and manual entries (no folder_path) are excluded from orphan checks

---

## [0.9.1] - 2025-12-29

### Fixed

#### Upload Folder Structure Bug
- **Critical fix:** Uploaded books now correctly placed in flat `/books/Author - Title/` structure
- Previously, v0.9.0 TBR conversion code incorrectly created category subfolders (`/books/FanFiction/Author - Title/`)
- Fixed `link_files_to_title` endpoint to use flat folder structure
- Fixed `add_files_to_existing_title` function to use flat folder structure

#### File Size Display
- **Small files now display in KB** — Files under 1 MB show as "35.1 KB" instead of "0.0 MB"
- Files under 1 KB show in bytes (e.g., "512 B")
- Improves readability on upload review screen

### Technical

#### Modified Files
- `backend/routers/upload.py` — Removed category from folder path in two locations
- `frontend/src/components/upload/BookCard.jsx` — Updated `formatSize()` function

---

## [0.9.0] - 2025-12-28

### Added

#### TBR (To Be Read) System
- **TBR List View** — New TBR tab in bottom navigation showing books you want to read
- **TBR Priority** — Mark items as "High" or "Normal" priority with visual indicators
- **TBR Reason** — Add "Why I want to read this" notes to any TBR item
- **Priority Filter** — Filter TBR list by priority level
- **TBR Count Badge** — Shows number of TBR items in navigation

#### Manual Book Entry
- **Add to Library** — Add physical, audiobook, or web-based books without uploading files
- **Add to TBR** — Add future reads with title, author, series, and reason
- **Multiple Authors** — Add multiple authors with chip display and autocomplete
- **Author Autocomplete** — Suggests existing library authors while typing
- **Format Selection** — Choose Physical, Audiobook, or Web/URL format
- **Completion Status** — Track WIP/Abandoned status for fanfiction
- **Source URL** — Store AO3/FFN URLs for web-based works

#### TBR → Library Conversion
- **"I got this book!" Flow** — Convert TBR items to library with format selection
- **Ebook Upload Option** — Links to upload page to add files
- **Physical/Audiobook/Web Options** — Convert without uploading files
- **Metadata Preservation** — Source URL and completion status preserved on conversion

#### Familiar Title Detection
- **Smart Detection** — Upload warns when title matches existing library book
- **"A Familiar Title" Banner** — Shows on upload review when match found
- **Add to Existing** — Option to add files to existing title
- **Add as Separate** — Override to create new title entry
- **85% Similarity Matching** — Fuzzy matching catches near-duplicates

#### UI Improvements
- **Clean Add Page** — Header hidden on main choice screen (no empty bar)
- **Centered Form Headers** — ManualEntryForm header properly centered
- **Completion Status Display** — Shows on separate line above author
- **Web-based Acquire Option** — New option when converting TBR to library

### Changed

- **Bottom Navigation** — Now includes TBR tab (Library, Series, Authors, TBR, Add)
- **Add Flow Redesigned** — Two-path choice: "A book I have" vs "A future read"
- **Book Detail Layout** — Completion status moved to own line above author

### Fixed

- **TBR Conversion Preserves Data** — Source URL and completion status no longer lost
- **Database Migration** — Added missing `source_url` column migration
- **Author Autocomplete Dropdown** — Properly filters and displays suggestions

### Technical

#### Database Changes
- Migration: `source_url` column added to titles table if missing
- TBR fields: `is_tbr`, `tbr_priority`, `tbr_reason` fully utilized

#### New API Endpoints
- `GET /api/tbr` — List TBR items with optional priority filter
- `POST /api/tbr` — Create new TBR item
- `PATCH /api/tbr/{id}` — Update TBR priority/reason/source_url/completion_status
- `POST /api/tbr/{id}/acquire` — Convert TBR to library
- `DELETE /api/tbr/{id}` — Remove TBR item
- `POST /api/titles` — Create manual library entry

#### New Frontend Components
- `TBRList.jsx` — TBR list page with priority filtering
- `TBRForm.jsx` — Form for adding TBR items
- `ManualEntryForm.jsx` — Form for adding library items manually
- `AddPage.jsx` — Unified add flow with multiple paths
- `AddChoice.jsx` — Initial choice screen
- `LibraryChoice.jsx` — Library add method selection

#### Modified Files
- `BookDetail.jsx` — Acquire modal, completion status display
- `BookCard.jsx` — FamiliarTitleBanner component
- `ReviewBooks.jsx` — Familiar title counting
- `upload.py` — Familiar title detection, add_to_existing action
- `titles.py` — TBR endpoints, manual entry
- `database.py` — source_url migration

---

## [0.8.2] - 2025-12-27

### Added

#### Finished Checkmarks on Author Pages
- **Green checkmark badge** — Finished books now show checkmark overlay on AuthorDetail page
- Matches the checkmark style used in Library view

#### Custom Status Labels
- **Status Labels settings** — Customize display names for Unread, In Progress, Finished, DNF
- **useStatusLabels hook** — Centralized hook for fetching and applying custom labels app-wide
- **Labels in BookDetail** — Status chip and popup show custom labels
- **Labels in FilterDrawer** — Status filter buttons show custom labels
- **Persistence** — Labels save to database and load on app start

### Technical

#### New Files
- `frontend/src/hooks/useStatusLabels.js` — Hook for status label management

#### Modified Files
- `frontend/src/components/AuthorDetail.jsx` — Added checkmark overlay
- `frontend/src/components/SettingsDrawer.jsx` — Added Status Labels UI section
- `frontend/src/components/BookDetail.jsx` — Integrated useStatusLabels hook
- `frontend/src/components/FilterDrawer.jsx` — Integrated useStatusLabels hook
- `backend/database.py` — Added default status label settings in migrations

---

## [0.8.1] - 2025-12-26

### Added

#### Obsidian Notes Migration
- **Notes import endpoint** — `POST /books/{id}/notes/import` for bulk importing notes
- **Book matching endpoint** — `GET /books/match` for fuzzy title/author matching with confidence scores
- **Migration script** — `migrate_notes.py` for importing Obsidian book notes to Liminal
- **Append mode** — Imported notes append to existing notes with `---` separator
- **Source tracking** — Imported notes labeled with "*Imported from obsidian*"

#### Migration Features
- **Fuzzy matching** — Matches books by exact title, partial title, or reverse partial
- **Confidence scoring** — 95-100% for exact matches, 70-85% for partial matches
- **Author boost** — +10% confidence when author also matches
- **Dry run mode** — Preview imports before committing
- **Detailed reports** — Markdown report of matched/unmatched files
- **Empty section cleanup** — Removes unfilled template placeholders from notes

### Migration Results

| Metric | Count |
|--------|-------|
| Notes imported automatically | 236 |
| Notes imported manually | 15 |
| **Total notes migrated** | **251** |

---

## [0.8.0] - 2025-12-26

### Added

#### Full-Screen Notes Editor
- **Full-screen modal** — Replaces 80% slide-up panel for distraction-free writing
- **Header controls** — X (close) on left, Save on right — always accessible with mobile keyboard
- **Transparent textarea** — No border, seamless with modal background
- **Template dropdown** — Quick-apply templates from toolbar

#### Note Templates
- **Structured Review** — Characters, Atmosphere/World, Writing, Plot, Enjoyment, Steam, Believability sections
- **Reading Notes** — Thoughts While Reading, Reactions After Finishing sections
- **Append with separator** — Templates add to existing content with `---` divider

#### Book Linking System
- **`[[` trigger** — Type `[[` to open book search modal
- **Modal search overlay** — Full-screen search with backdrop
- **Rich search results** — Shows title, author, and category (20 results)
- **Keyboard navigation** — Arrow keys to navigate, Enter/Tab to select, Escape to close
- **Insert as plain text** — Option to insert search text even if no book matches

#### Rendered Notes (Read Mode)
- **Markdown rendering** — Notes display with headers, bold, italic, lists
- **Clickable book links** — `[[Book Title]]` renders as purple links to book detail
- **Unmatched links** — Books not in library show as gray text (no brackets)
- **Case-insensitive matching** — Links match regardless of title capitalization

#### Backlinks
- **Link storage** — `[[Book Title]]` patterns parsed and stored in `links` table
- **GET /books/{id}/backlinks** — API endpoint to find books referencing current book
- **"Referenced by" section** — Shows on book detail when other books link to it
- **Clickable backlinks** — Navigate directly to the referencing book

---

## [0.7.0] - 2025-12-25

### Added

#### Navigation Redesign
- **Mobile bottom navigation** — Fixed nav bar with Library, Series, Authors, Upload tabs
- **Desktop header navigation** — Centered nav tabs on single line with logo and settings
- **Filter drawer** — Slides up from bottom on mobile, slides in from right on desktop
- **Unified SearchBar** — Combined search input and filter icon in single component
- **Sort inline with phrase** — Sort dropdown moved next to book/series count, separate from filters

#### Settings Enhancements
- **Books per row setting** — Choose 2, 3, or 4 columns on mobile (desktop unchanged)
- **Real-time grid sync** — Grid columns update immediately when setting changes

#### Edit Book Modal
- **Series autocomplete** — Suggests existing series names when typing in series field

---

## [0.6.0] - 2025-12-24

### Added

#### Settings System
- **Settings drawer** — Slide-out panel from gear icon in header
- **WPM setting** — Configurable words-per-minute (50-2000) for read time calculations
- **Relocated Sync Library button** — Moved from header to settings drawer

#### Edit Book Metadata
- **Edit metadata modal** — Full book editing from BookDetail page
- **Draggable author chips** — Reorder authors with drag-and-drop
- **Author autocomplete** — Suggests existing library authors when typing
- **Editable fields** — Title, authors, series, series number, category, publication year

#### Estimated Read Time
- **Read time display** — Shows estimated duration on BookDetail page
- **Poetic microcopy** — Tier labels like "a quick visit", "a slow unfolding", "a true saga"
- **Read time filter** — 8 filter tiers in library from "Under 30 min" to "30+ hours"
- **WPM-aware calculations** — Respects user's reading speed setting

#### Author System
- **Author pages** — View author with notes and all their books
- **Author notes** — Free-form notes about any author
- **Author rename** — Update author name across all books
- **Authors list page** — Alphabetical list with search, accessible from main nav
- **Clickable author links** — Author names on BookDetail link to author pages

---

## Version History Summary

| Version | Date | Milestone |
|---------|------|-----------|
| 0.9.2 | 2025-12-29 | **Orphan detection** — Track missing book folders |
| 0.9.1 | 2025-12-29 | **Bug fix** — Upload folder structure, file size display |
| 0.9.0 | 2025-12-28 | **Phase 5 (partial)** — TBR system, manual entry, familiar title detection |
| 0.8.2 | 2025-12-27 | Custom status labels, finished checkmarks on author pages |
| 0.8.1 | 2025-12-26 | Phase 4.5 complete — Obsidian notes migration (251 notes) |
| 0.8.0 | 2025-12-26 | Phase 4 complete — Notes enhancement, templates, book linking, backlinks |
| 0.7.0 | 2025-12-25 | Phase 3.5 complete — Navigation redesign, filter drawer, grid settings |
| 0.6.0 | 2025-12-24 | Phase 3 complete — Settings, metadata editing, read time, author pages |
| 0.5.4 | 2025-12-23 | Mobile file picker fix for .mobi/.azw3 |
| 0.5.3 | 2025-12-23 | EPUB metadata extraction, "Upload as New" option |
| 0.5.2 | 2025-12-22 | Category detection, .azw support |
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

### Upgrading to 0.9.2

**Modified Files:**
- `backend/database.py` — Added is_orphaned column
- `backend/routers/sync.py` — Added orphan detection logic

**Database migration runs automatically** — The `is_orphaned` column will be added on first startup.

**Rebuild Docker container after update.**

### Upgrading to 0.9.1

**Modified Files:**
- `backend/routers/upload.py` — Fixed folder path creation
- `frontend/src/components/upload/BookCard.jsx` — Fixed file size display

**Manual cleanup required:**
- Move any books incorrectly placed in `/books/FanFiction/` back to `/books/`
- Delete empty category subfolders if created

**Rebuild Docker container after update.**

---

## Links

- [Roadmap](./20251229_ROADMAP.md)
- [Development Workflow](./20251219_DEVELOPMENT_WORKFLOW.md)
- [Architecture](./ARCHITECTURE.md)

---

*Last updated: December 29, 2025*
