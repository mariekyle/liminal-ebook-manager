# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- "No summary" notice on book detail page

---

## [0.9.4] - 2025-12-30

### Added

#### Phase 5.2: Form Autocomplete
Complete upgrade to TBRForm (wishlist entry form) with autocomplete features.

#### Multi-Author Support
- **Author chips** — Multiple authors displayed as removable chips
- **Enter to add** — Press Enter to add typed author
- **Remove button** — Click × to remove any author
- **Validation** — At least one author required

#### Title Autocomplete
- **Search suggestions** — Shows matching books after 2+ characters
- **Familiar title warning** — Warns when title matches existing book
- **85% similarity matching** — Levenshtein distance for fuzzy matching
- **Status indication** — Warning shows "on wishlist" vs "in library"

#### Author Autocomplete
- **Suggestions from library** — Shows authors from existing books
- **Starts-with priority** — Better matches sorted first
- **Smart replacement** — Selecting autocomplete replaces case variations
- **Debounced search** — 200ms delay prevents excessive API calls

#### Series Autocomplete
- **Suggestions from library** — Shows existing series names
- **Click to fill** — Select suggestion to populate field
- **Debounced search** — 300ms delay prevents excessive API calls

### Fixed

- **API response handling** — Extract author names from `{authors: [{name}]}` structure
- **Levenshtein matrix** — Proper 2D array initialization prevents NaN errors
- **Case-insensitive replacement** — "john smith" replaced by "John Smith" from autocomplete

### Technical

#### Modified Files
- `frontend/src/components/add/TBRForm.jsx` — Complete refactor with autocomplete

#### Implementation Details
- Levenshtein distance algorithm for title similarity
- Debounced API calls (200ms authors, 300ms title/series)
- Dropdown management with focus/blur handlers
- Form validation preserved (title + author required)

---

## [0.9.3] - 2025-12-29

### Added

#### Phase 5.1: Wishlist Unification
Complete redesign of how wishlist items integrate with the library.

#### Backend: Acquisition Status System
- **New `acquisition_status` column** — Tracks 'owned' vs 'wishlist' status
- **`?acquisition=` filter** — API parameter to filter books by ownership status
- **Automatic migration** — Existing `is_tbr` data migrated to new column
- **Backward compatible** — TBR endpoints still functional

#### Library: Toggle Bar Navigation
- **Home / Browse / Wishlist tabs** — Filter library by ownership status
- **Home tab** — Shows owned books with "Your library awaits" message
- **Browse tab** — Shows owned books with rotating poetic phrases
- **Wishlist tab** — Shows wishlist items only
- **URL persistence** — Toggle state preserved in URL params

#### BookCard: Wishlist Styling
- **Dotted border** — Wishlist items have dashed border on covers
- **Bookmark icon** — Badge indicator for wishlist items
- **Full brightness** — No opacity reduction (cleaner look)

#### BookDetail: Complete UI Redesign
- **WISHLIST banner** — Clear indicator with "You don't own this yet" message
- **Horizontal desktop layout** — Cover on left, content on right
- **Larger cover on desktop** — Increased from w-40 to w-48
- **Mobile tab navigation** — Details | Notes | History tabs
- **Edit icon repositioned** — Moved to upper right corner (icon only)

#### Reading History Section
- **New formatted display** — "Read #1: Jul 14, 2025 — Jul 14, 2025"
- **Collapsible date editors** — Edit button toggles date input fields
- **"+ Add dates" button** — Appears when no reading dates recorded
- **React state management** — Date editors persist through re-renders

#### Navigation Cleanup
- **TBR tab removed** — From both mobile and desktop navigation
- **`/tbr` redirect** — Automatically redirects to `/?acquisition=wishlist`
- **4-tab navigation** — Library, Series, Authors, Add

### Changed

- **Toggle order** — Changed from Home/Wishlist/All to Home/Browse/Wishlist
- **Browse behavior** — Shows only owned books (same filter as Home, different phrase)

### Fixed

- **Reading History tab visibility** — Only shows in History tab on mobile (not Details)
- **Date editors state** — No longer closes when changing dates
- **Tab state reset** — Resets to Details tab when navigating between books
- **Status/rating visibility** — Hidden on mobile History tab (only shows reading dates)

### Technical

#### Database Changes
- Migration: Added `acquisition_status TEXT DEFAULT 'owned'` column to titles table
- Migration: Populated from existing `is_tbr` values
- Index: Added `idx_titles_acquisition_status`

#### New API Behavior
- `GET /api/books` — New `?acquisition=` parameter (owned, wishlist, all)
- Default: Returns 'owned' books when parameter omitted

#### Modified Files
- `backend/database.py` — Added acquisition_status column and migration
- `backend/routers/titles.py` — Added acquisition filter, updated queries
- `frontend/src/components/Library.jsx` — Toggle bar, phrase logic
- `frontend/src/components/BookCard.jsx` — Wishlist styling
- `frontend/src/components/BookDetail.jsx` — Complete UI redesign
- `frontend/src/components/Header.jsx` — Removed TBR tab
- `frontend/src/components/BottomNav.jsx` — Removed TBR tab
- `frontend/src/App.jsx` — TBR redirect

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

## Version History Summary

| Version | Date | Milestone |
|---------|------|-----------|
| 0.9.4 | 2025-12-30 | **Phase 5.2** — Form autocomplete (title, author, series) |
| 0.9.3 | 2025-12-29 | **Phase 5.1** — Wishlist unification, BookDetail redesign |
| 0.9.2 | 2025-12-29 | Orphan detection system |
| 0.9.1 | 2025-12-29 | Bug fix — Upload folder structure, file size display |
| 0.9.0 | 2025-12-28 | **Phase 5** — TBR system, manual entry, familiar title detection |
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

### Upgrading to 0.9.4

**Modified Files:**
- `frontend/src/components/add/TBRForm.jsx` — Complete refactor

**No database changes.** Frontend-only update.

**Rebuild Docker container after update.**

---

## Links

- [Roadmap](./20251230_ROADMAP.md)
- [Development Workflow](./20251219_DEVELOPMENT_WORKFLOW.md)
- [Architecture](./ARCHITECTURE.md)

---

*Last updated: December 30, 2025*
