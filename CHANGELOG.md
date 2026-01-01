# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- "No summary" notice on book detail page

---

## [0.14.0] - 2026-01-01

### Added

#### Phase 7.2a: Enhanced Filtering
Complete filtering system for enhanced metadata fields, enabling powerful fanfiction discovery.

#### Backend: New Filter Parameters
- **fandom** — Filter by fandom (exact match)
- **content_rating** — Filter by content rating (comma-separated multi-select)
- **completion_status** — Filter by completion status (comma-separated multi-select)
- **ship** — Filter by ship/relationship (searches within JSON array)
- **sort_dir** — Sort direction parameter (asc/desc, default desc)

#### Frontend: Filter State & URL Persistence
- All new filters sync to URL params for shareability and browser history
- Context-aware sort direction (Title/Author default asc, dates default desc)
- Filter badge count includes all active filters

#### FilterDrawer: Enhanced Filter Controls
- **Fandom button** — Opens searchable modal with all library fandoms
- **Ship button** — Opens searchable modal with all library ships
- **Content Rating checkboxes** — General, Teen, Mature, Explicit, Not Rated
- **Completion Status checkboxes** — Complete, WIP, Abandoned, Hiatus
- Filters only visible when FanFiction category is selected

#### New Components
- **FandomModal** — Searchable single-select fandom filter with radio buttons
- **ShipModal** — Searchable single-select ship filter with radio buttons

#### Active Filter Pills
- **Fandom pill** — Purple, shows selected fandom
- **Ship pill** — Pink, shows selected ship
- **Content Rating pills** — Red, one per selected rating
- **Completion Status pills** — Emerald, one per selected status
- All pills removable with × button

#### Sort Direction Toggle
- **Toggle button** — ↑/↓ next to sort dropdown
- Click to reverse current sort order
- Persists in URL as `sortDir` parameter

### Changed

- **Sort labels** — Simplified "Title A-Z" → "Title", "Author A-Z" → "Author"
- **Clear all behavior** — Now stays on current tab (Browse/Wishlist/Series)
- **Enhanced filters visibility** — Only show for FanFiction category (not "All")

### Fixed

- **Clear all on Series tab** — No longer switches to Library tab

### Technical

#### Modified Files
- `backend/routers/titles.py` — New filter params, sort_dir support
- `frontend/src/api.js` — listFandoms(), listShips(), updated listBooks params
- `frontend/src/components/Library.jsx` — Filter state, URL sync, modals, pills
- `frontend/src/components/FilterDrawer.jsx` — Enhanced filter sections
- `frontend/src/components/FandomModal.jsx` — NEW
- `frontend/src/components/ShipModal.jsx` — NEW

---

## [0.13.0] - 2026-01-01

### Added

#### Phase 7.1: Enhanced Metadata System Complete
Full integration of enhanced metadata across upload, rescan, and editing workflows.

#### Part A: Upload Flow Integration
- **Metadata extraction during upload** — New uploads get fandom, ships, characters, content_rating, ao3_warnings, ao3_category, source_url, isbn, publisher, chapter_count, completion_status automatically
- **Category preservation fix** — User's category selection now saves correctly (was being overwritten by sync)
- **Title creation during upload** — Metadata extracted immediately, no sync dependency
- **Empty author handling** — Fixed IndexError when author contains only whitespace
- **Bracket handling** — Series folder names like `[Series 01]` work correctly with glob.escape()

#### Part B: Per-Book Rescan
- **POST /api/books/{id}/rescan-metadata** — Re-extract metadata from individual book's EPUB/PDF
- **"Rescan Metadata" button** — Appears on BookDetail for books with files
- **Multi-format support** — Prefers EPUB, falls back to PDF
- **COALESCE preservation** — PDF rescan doesn't overwrite EPUB-extracted enhanced fields
- **Series protection** — Series only updated if extraction finds data
- **Loading state** — Visual feedback during rescan operation

#### Part C: Enhanced Metadata Editing Modal
- **"Edit About" modal** — Full editing interface for all enhanced metadata
- **Summary editing** — Textarea with proper null handling when cleared
- **Searchable fandom** — Autocomplete from existing library fandoms
- **Searchable ships** — Autocomplete with input above chips
- **Searchable characters** — Autocomplete with input above chips
- **Searchable tags** — Autocomplete with input above chips
- **Content rating dropdown** — General/Teen/Mature/Explicit/Not Rated
- **Pairing type multi-select** — F/F, F/M, Gen, M/M, Multi, Other toggles
- **Archive warnings multi-select** — All AO3 warning options
- **Completion status dropdown** — Complete/WIP/Abandoned/Hiatus
- **Source URL input** — Text field for original source link
- **Category-aware field visibility** — FanFiction-only fields hidden for Fiction/Non-Fiction

#### Backend: New Autocomplete Endpoints
- **GET /api/autocomplete/fandoms** — Search existing fandoms
- **GET /api/autocomplete/ships** — Search existing ships/relationships
- **GET /api/autocomplete/characters** — Search existing characters
- **GET /api/autocomplete/tags** — Search existing tags

#### Backend: Enhanced Metadata Update
- **PATCH /api/books/{id}/enhanced-metadata** — Update all enhanced fields
- **EnhancedMetadataUpdate model** — Pydantic model for validation
- **Dynamic query building** — Only updates provided fields
- **JSON serialization** — Proper handling of array fields

### Changed

#### BookDetail UI Improvements
- **Pairing Type on own row** — Moved from Rating row for better visibility
- **Rating display read-only** — Shows average from reading sessions (not editable)
- **Empty rating display** — Shows 5 grey stars when no sessions
- **Icon-only edit buttons** — Notes and About sections use pencil icon only
- **About section always visible** — Shows for all books, not just those with files
- **"Tags" label** — Renamed from "Tropes" for FanFiction books

#### Modal UI Cleanup
- **Removed footer divider bars** — EditBookModal, EnhancedMetadataModal, NotesEditor
- **Author input above chips** — Consistent pattern across chip editors
- **Consistent styling** — All modals use library-bg, library-card, library-accent classes

### Fixed

- **Category not saving on upload** — User's category selection now preserved
- **Summary not clearing** — Empty summary now saves as null correctly
- **Backdrop click behavior** — Edit About modal only closes on Escape, not backdrop click
- **Empty author crash** — Handles whitespace-only author strings
- **Glob pattern brackets** — Series folders with brackets no longer fail

### Technical

#### Database Changes
- No schema changes (uses Phase 7.0 columns)

#### New Files
- `frontend/src/components/EnhancedMetadataModal.jsx` — Full metadata editing modal

#### Modified Files
- `backend/routers/sync.py` — Enhanced field extraction and saving during sync
- `backend/routers/upload.py` — Title creation with metadata during upload
- `backend/routers/titles.py` — Rescan endpoint, enhanced metadata PATCH, autocomplete endpoints
- `frontend/src/api.js` — rescanBookMetadata(), updateEnhancedMetadata(), autocomplete functions
- `frontend/src/components/BookDetail.jsx` — Rescan button, Edit About button, rating display, UI cleanup
- `frontend/src/components/EditBookModal.jsx` — Removed footer border
- `frontend/src/components/NotesEditor.jsx` — Removed template row border

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

#### UI: Reading History Section
- **Session cards** — Display "Read #1", "Read #2", etc. with dates and ratings
- **"+ Add Session" button** — Start tracking a new read
- **Session editor modal** — Full edit interface for each session
- **Custom status labels** — Uses labels from Settings

#### Cumulative Stats
- **Times Read** — Count of all reading sessions
- **Average Rating** — Mean of all session ratings

### Changed

- **Book status** — Now derived from most recent session's status
- **Book rating** — Now calculated as average of all session ratings

### Fixed

- **State reset on navigation** — Sessions clear when switching between books
- **Rating preservation** — Existing rating preserved when switching to in_progress

### Technical

#### Database Changes
- New table: `reading_sessions` with foreign key to titles
- Migration: Creates sessions from existing title data

#### New Files
- `backend/routers/sessions.py` — CRUD endpoints for reading sessions

---

## [0.9.4] - 2025-12-30

### Added

#### Phase 5.2: Form Autocomplete
- **Title autocomplete** — Warns when title matches existing book
- **Author autocomplete** — Suggests existing authors
- **Series autocomplete** — Suggests existing series
- **Multi-author support** — Multiple authors with chip display

---

## [0.9.3] - 2025-12-29

### Added

#### Phase 5.1: Wishlist Unification
- **Acquisition status system** — 'owned' vs 'wishlist' status
- **Library toggle bar** — Home / Browse / Wishlist tabs
- **Wishlist styling** — Dotted border + bookmark icon
- **BookDetail redesign** — Horizontal desktop layout, mobile tabs

---

## [0.9.2] - 2025-12-29

### Added

- **Orphan detection** — Sync detects missing book folders
- **Auto-recovery** — Reappearing folders automatically un-orphaned

---

## [0.9.1] - 2025-12-29

### Fixed

- **Upload folder structure** — Books placed in flat structure correctly
- **File size display** — Small files show in KB

---

## [0.9.0] - 2025-12-28

### Added

#### Phase 5: TBR System
- **TBR List View** — Books you want to read
- **Manual Book Entry** — Physical, audiobook, web-based books
- **TBR → Library conversion** — "I got this book!" flow
- **Familiar Title Detection** — Upload warns of duplicates

---

## Version History Summary

| Version | Date | Milestone |
|---------|------|-----------|
| 0.14.0 | 2026-01-01 | **Phase 7.2a** — Enhanced filtering (fandom, rating, status, ships) ✨ |
| 0.13.0 | 2026-01-01 | **Phase 7.1** — Upload integration, per-book rescan, editing modal |
| 0.12.0 | 2025-12-31 | **Phase 7.0** — Enhanced metadata extraction, AO3 parsing, rescan feature |
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

### Upgrading to 0.13.0

**No schema changes** — Uses Phase 7.0 columns

**Modified Files:**
- `backend/routers/sync.py` — Enhanced field saving
- `backend/routers/upload.py` — Title creation during upload
- `backend/routers/titles.py` — Rescan endpoint, enhanced metadata PATCH, autocomplete
- `frontend/src/api.js` — New API functions
- `frontend/src/components/BookDetail.jsx` — UI updates
- `frontend/src/components/EnhancedMetadataModal.jsx` — NEW
- `frontend/src/components/EditBookModal.jsx` — UI cleanup
- `frontend/src/components/NotesEditor.jsx` — UI cleanup

**Post-upgrade:** 
1. Rebuild Docker container
2. New uploads will automatically extract enhanced metadata
3. Use "Edit About" button to manually edit metadata for any book

---

## Links

- [Roadmap](./20250101_ROADMAP.md)
- [Development Workflow](./20251219_DEVELOPMENT_WORKFLOW.md)
- [Architecture](./ARCHITECTURE.md)

---

*Last updated: January 1, 2026 (v0.14.0 — Phase 7.2a complete)*
