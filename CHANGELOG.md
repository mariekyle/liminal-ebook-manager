# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- "No summary" notice on book detail page

---

## [0.12.0] - 2025-12-31

### Added

#### Phase 7.0: Enhanced Metadata Extraction
Complete system for extracting and displaying structured metadata from EPUB files, with special handling for AO3 fanfiction.

#### Database: New Metadata Fields
- **fandom** — Extracted from AO3 dc:subject tags (e.g., "Harry Potter")
- **relationships** — JSON array of ships (e.g., ["Hermione Granger/Draco Malfoy"])
- **characters** — JSON array extracted from relationship tags
- **content_rating** — AO3 rating (Explicit, Mature, Teen, General)
- **ao3_warnings** — JSON array (e.g., ["Graphic Depictions Of Violence"])
- **ao3_category** — JSON array (e.g., ["F/M", "M/M"])
- **isbn** — Extracted from published book metadata
- **publisher** — Extracted from dc:publisher
- **chapter_count** — Counted from EPUB manifest

#### Backend: AO3 Tag Parser
- **parse_ao3_subjects()** — Parses dc:subject tags into structured fields
- **detect_source_type()** — Identifies EPUB source (ao3, fanficfare, fichub, calibre)
- **extract_source_url()** — Gets original URL from FanFicFare downloads
- **extract_calibre_series()** — Extracts series from Calibre metadata
- **detect_completion_status()** — Detects WIP/Complete from tags/summary
- **count_chapters_from_manifest()** — Counts chapter files in EPUB

#### Backend: Rescan Feature
- **POST /api/sync/rescan-metadata** — Re-extract metadata from all EPUB files
- **GET /api/sync/rescan-metadata/preview** — Preview stats before rescan
- **Concurrency protection** — Prevents sync/rescan from running simultaneously
- **User edit protection** — Rescan only fills NULL fields, preserves user edits

#### Frontend: Settings Enhancement
- **"Enhanced Metadata" section** — New section in Settings drawer
- **Preview statistics** — Shows books with/without enhanced metadata
- **"Rescan All Metadata" button** — Triggers full library rescan
- **Results display** — Shows what was extracted after rescan

#### Frontend: BookDetail Metadata Display
- **MetadataRow component** — Responsive label/value display
- **TagChip component** — Styled chips with color variants
- **FanFiction display:**
  - Fandom (purple chip)
  - Rating (red chip) with AO3 category
  - Ships (pink chips, max 5 shown with "+X more")
  - Characters (comma list, max 8 shown)
  - Warnings (amber chips)
  - Source URL (clickable link)
  - Completion status (color-coded badge)
  - Tropes (freeform tags, labeled separately)
- **Fiction/Non-Fiction display:**
  - Publisher
  - ISBN (monospace font)
  - Genre (tags labeled as "Genre" not "Tags")
  - Chapter count

#### Results
- **657 books** with fandom extracted from AO3 metadata
- **56 books** with source URLs from FanFicFare/Wattpad
- Clean character extraction from relationship tags only

### Changed

- **Tags display** — Now contextual: "Tropes" for FanFiction, "Genre" for published books
- **About This Book card** — Visibility includes all enhanced metadata fields

### Fixed

- **Optional chaining** — Prevents crashes when relationships/characters/source_url are null
- **Chapter count display** — Shows 0 chapters correctly (was hidden)
- **AO3 category visibility** — Shows even when content_rating is missing
- **Character parsing** — No longer catches freeform tags as characters
- **SQL query duplicates** — GROUP BY prevents multiple rows per title
- **SQL syntax error** — WHERE clause built before GROUP BY

### Technical

#### Database Changes
- New columns in titles table: fandom, relationships, characters, content_rating, ao3_warnings, ao3_category, isbn, publisher, chapter_count
- Migration: Auto-adds columns on startup

#### New/Modified Files
- `backend/database.py` — Schema updates, migration
- `backend/services/metadata.py` — AO3 parser, source detection, all extractors
- `backend/routers/sync.py` — Rescan endpoints, concurrency protection
- `backend/routers/titles.py` — TitleDetail model, JSON field parsing
- `frontend/src/api.js` — previewRescan(), rescanMetadata()
- `frontend/src/components/SettingsDrawer.jsx` — Enhanced Metadata section
- `frontend/src/components/BookDetail.jsx` — MetadataRow, TagChip, contextual display

---

## [0.11.0] - 2025-12-30

### Added

#### Phase 6: Library Home Screen
Complete dashboard experience replacing the simple library grid on the Home tab.

#### Home Dashboard Sections
- **Currently Reading** — Up to 5 in-progress books with activity bars on covers
- **Recently Added** — 20 most recently uploaded books in horizontal scroll
- **Discover Something New** — 6 random unread books with refresh button
- **Quick Reads** — Unread books under 3 hours based on user's WPM setting
- **Your Reading Stats** — Words read, reading time, titles finished with category breakdown

#### Backend: Home API Endpoints
- **GET /api/home/in-progress** — Returns up to 5 in-progress owned books
- **GET /api/home/recently-added** — Returns 20 most recently added books
- **GET /api/home/discover** — Returns 6 random unread books (refreshable)
- **GET /api/home/quick-reads** — Returns unread books under 3 hours
- **GET /api/home/stats?period=month|year** — Reading statistics with category breakdown

#### Search Redesign
- **SearchModal component** — Full-screen search modal for mobile
- **Live search results** — Debounced search with keyboard navigation
- **Dual action** — Click book to navigate, or "Filter library by X" to apply as filter
- **Responsive layout** — Mobile uses modal, desktop keeps inline search bar
- **Icon buttons** — Search and filter icons on mobile Browse/Wishlist tabs

#### Sort Options Redesign
- **Recently Added** — Sort by `created_at` DESC (new default)
- **Title A-Z** — Numeric-first sorting ("4-Hour" before "10 Things")
- **Author A-Z** — Alphabetical, case-insensitive
- **Recently Published** — Year DESC with NULLs sorted to bottom
- **Removed** — Series, Year, Updated sort options

#### BookCard Enhancement
- **Activity bar** — 50% width teal bar on in-progress book covers (Home tab only)
- **showActivityBar prop** — Optional prop to enable activity indicator

#### EPUB Word Count Fix
- **Improved path resolution** — Multiple strategies for finding content files
- **URL decoding** — Handles encoded paths in EPUB manifests
- **Debug logging** — Warns when word count is suspiciously low
- **Minimum threshold** — Quick Reads requires 1000+ words (filters broken data)

### Changed

- **Home tab** — Now shows dashboard instead of book grid
- **Browse/Wishlist tabs** — Show book grid with search/filter
- **Search bar hidden on Home** — Clean dashboard experience
- **Default sort** — Changed from "Title" to "Recently Added"
- **Toggle bar repositioned** — Integrated with search/filter row

### Fixed

- **EPUB word count extraction** — Most books now extract correctly (was returning near-zero for some EPUBs)
- **Desktop search layout** — Inline search between toggle bar and filter icon

### Technical

#### New Files
- `backend/routers/home.py` — Dashboard API endpoints
- `frontend/src/components/HomeTab.jsx` — Dashboard component
- `frontend/src/components/SearchModal.jsx` — Mobile search modal

#### Modified Files
- `backend/routers/titles.py` — New sort options, updated defaults
- `backend/services/metadata.py` — EPUB word count extraction fix
- `frontend/src/api.js` — Home API functions
- `frontend/src/components/BookCard.jsx` — Activity bar support
- `frontend/src/components/SearchBar.jsx` — Icons-only mode for mobile
- `frontend/src/components/Library.jsx` — HomeTab integration, search redesign

---

## [0.10.0] - 2025-12-30

### Added

#### Phase 5.3: Reading Sessions
Complete system for tracking multiple reading sessions (re-reads) per book.

#### Database: reading_sessions Table
- **New table** — Stores multiple reading sessions per book
- **session_number** — Tracks which read (1st, 2nd, 3rd, etc.)
- **Per-session dates** — date_started and date_finished (both optional)
- **Per-session rating** — 1-5 stars per reading session
- **Per-session status** — in_progress, finished, dnf
- **Smart migration** — Existing reading data migrated to first session
- **Data integrity fix** — 9 books incorrectly marked "Unread" with dates/ratings now corrected

#### API: Session Endpoints
- **GET /api/titles/{id}/sessions** — List all sessions with cumulative stats
- **POST /api/titles/{id}/sessions** — Create new reading session
- **PATCH /api/sessions/{id}** — Update session (dates, status, rating)
- **DELETE /api/sessions/{id}** — Delete session with automatic renumbering
- **Automatic sync** — Title's cached status/rating updates after every mutation

#### UI: Reading History Section
- **Session cards** — Display "Read #1", "Read #2", etc. with dates and ratings
- **"+ Add Session" button** — Start tracking a new read
- **Session editor modal** — Full edit interface for each session
- **Status buttons** — Color-coded: Green (Finished), Pink (DNF), Gray (In Progress)
- **Rating stars** — Disabled and greyed out for in_progress sessions
- **Delete with confirmation** — Remove sessions safely
- **Custom status labels** — Uses labels from Settings (e.g., "Read" instead of "Finished")

#### Cumulative Stats
- **Times Read** — Count of all reading sessions
- **Average Rating** — Mean of all session ratings
- **Stats row** — Displays below sessions list

### Changed

- **Book status** — Now derived from most recent session's status
- **Book rating** — Now calculated as average of all session ratings
- **Reading History tab** — Complete redesign with sessions-based display

### Fixed

- **State reset on navigation** — Sessions clear when switching between books (no stale data flash)
- **Rating preservation** — Existing rating preserved (greyed out) when switching to in_progress
- **Date clearing** — Can now remove dates from sessions by clearing the field
- **Rating validation** — Rating not sent to backend when status is in_progress

### Technical

#### Database Changes
- New table: `reading_sessions` with foreign key to titles
- Index: `idx_reading_sessions_title_id`
- Migration: Creates sessions from existing title data
- Migration: Fixes status for books incorrectly marked Unread

#### New Files
- `backend/routers/sessions.py` — CRUD endpoints for reading sessions

#### Modified Files
- `backend/database.py` — Schema, migration, sync_title_from_sessions helper
- `backend/main.py` — Register sessions router
- `frontend/src/api.js` — Session API functions
- `frontend/src/components/BookDetail.jsx` — Sessions display and editor modal

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
| 0.12.0 | 2025-12-31 | **Phase 7.0** — Enhanced metadata extraction, AO3 parsing, rescan feature ✨ |
| 0.11.0 | 2025-12-30 | **Phase 6** — Library Home Screen, search redesign, sort options |
| 0.10.0 | 2025-12-30 | **Phase 5.3** — Reading sessions, multiple re-reads |
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

### Upgrading to 0.12.0

**New Columns (auto-migrated):**
- fandom, relationships, characters, content_rating, ao3_warnings, ao3_category, isbn, publisher, chapter_count

**Modified Files:**
- `backend/database.py` — Schema, migration
- `backend/services/metadata.py` — AO3 parser, extractors
- `backend/routers/sync.py` — Rescan endpoints
- `backend/routers/titles.py` — TitleDetail model updates
- `frontend/src/api.js` — Rescan API functions
- `frontend/src/components/SettingsDrawer.jsx` — Enhanced Metadata section
- `frontend/src/components/BookDetail.jsx` — Metadata display

**Post-upgrade:** 
1. Rebuild Docker container
2. Open Settings → Click "Rescan All Metadata" to populate enhanced fields for existing books

---

## Links

- [Roadmap](./20251231_ROADMAP.md)
- [Development Workflow](./20251219_DEVELOPMENT_WORKFLOW.md)
- [Architecture](./ARCHITECTURE.md)

---

*Last updated: December 31, 2025*
