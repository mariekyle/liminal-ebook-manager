# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- "No summary" notice on book detail page

---

## [0.15.0] - 2026-01-02

### Added

#### Phase 7.2b: Collections System
Complete collections feature for organizing books into curated lists.

#### Database: Collections Schema
- **collections table** — id, name, description, cover_type, custom_cover_path, timestamps
- **collection_books table** — Junction table with position for ordering
- **cover_type options** — 'gradient' (default) or 'custom'

#### Backend: Collections API
- **GET /api/collections** — List all collections with book counts
- **POST /api/collections** — Create new collection
- **GET /api/collections/{id}** — Get collection with all books
- **PATCH /api/collections/{id}** — Update collection details
- **DELETE /api/collections/{id}** — Delete collection
- **POST /api/collections/{id}/books** — Add books to collection
- **DELETE /api/collections/{id}/books/{title_id}** — Remove book from collection
- **GET /api/collections/for-book/{id}** — Get collections containing a book
- **GET /api/collections/all/simple** — Simple list for picker UI

#### Backend: Collection Covers
- **POST /api/collections/{id}/cover** — Upload custom cover image
- **PATCH /api/collections/{id}/cover-type** — Change cover type
- **DELETE /api/collections/{id}/cover** — Delete custom cover
- **/api/covers/** — Static file serving for uploaded covers

#### Backend: Smart Paste
- **POST /api/collections/smart-paste/preview** — Parse markdown, match [[Title]] links
- **POST /api/collections/{id}/smart-paste/apply** — Add matched books to collection
- **Fuzzy matching** — 85% similarity threshold for title matching
- **Confidence levels** — exact, fuzzy, none

#### Frontend: Collections Tab
- **CollectionsTab component** — Grid of collection cards
- **CollectionCard component** — Square cover with name and book count
- **CollectionModal component** — Create/edit collections with cover options
- **Mobile navigation** — Collections tab in bottom nav
- **Desktop navigation** — Collections in header nav

#### Frontend: Collection Detail Page
- **Banner cover** — Full-width cropped header (h-48 mobile, h-56 desktop)
- **Collection info** — Name, book count, description below banner
- **Books grid** — All books in collection with standard BookCard
- **Remove mode** — Tap books to remove from collection
- **Three-dot menu** — Edit, Smart Paste, Remove Books, Delete

#### Frontend: Book Assignment
- **CollectionPicker modal** — Add book to collections from BookDetail
- **Collection chips** — Show which collections a book belongs to
- **Quick add** — Toggle collections on/off with checkmarks

#### Frontend: Smart Paste UI
- **SmartPasteModal component** — Two-step paste and preview flow
- **Paste step** — Textarea for markdown with [[Title]] links
- **Preview step** — Shows matches with confidence indicators
- **Selectable results** — Toggle which matched books to add
- **Color-coded confidence** — Green (exact), yellow (fuzzy), red (not found)

#### Frontend: Cover Options
- **Gradient covers** — Purple-pink gradient with list icon (default)
- **Custom covers** — Upload JPEG/PNG/WebP/GIF (5MB max)
- **Banner variant** — Full-width cropped for detail page
- **Square variant** — 1:1 aspect for collection grid
- **Cover options in edit modal** — Choose gradient or upload custom

#### Calibre Web Shelf Migration
- **Migration script** — `migrate_calibre_shelves.py`
- **95.9% match rate** — 756 books matched across 15 collections
- **Fuzzy matching** — Handles minor title differences
- **Dry-run mode** — Preview before applying changes

### Changed

- **Docker compose** — Added COVERS_DIR environment variable for persistent covers
- **Book data processing** — Collections API returns processed cover gradients and parsed authors

### Fixed

- **Race condition** — BookDetail collections loading no longer fails on rapid navigation
- **Cover persistence** — Custom covers survive container rebuilds
- **Column name mismatch** — Fixed `cover_path` vs `custom_cover_path` inconsistency
- **Error alerts** — Cover management functions now show user feedback on failure

### Technical

#### Database Changes
- New table: `collections`
- New table: `collection_books`
- Auto-migration on startup

#### New Files
- `backend/routers/collections.py` — All collections endpoints
- `frontend/src/components/CollectionsTab.jsx` — Collections grid
- `frontend/src/components/CollectionCard.jsx` — Collection card component
- `frontend/src/components/CollectionDetail.jsx` — Collection detail page
- `frontend/src/components/CollectionModal.jsx` — Create/edit modal
- `frontend/src/components/CollectionPicker.jsx` — Book assignment modal
- `frontend/src/components/MosaicCover.jsx` — Collection cover component
- `frontend/src/components/SmartPasteModal.jsx` — Smart paste UI
- `migrate_calibre_shelves.py` — Calibre shelf migration script

#### Modified Files
- `backend/main.py` — Collections router, static file serving
- `backend/database.py` — Collections schema
- `frontend/src/api.js` — Collections API functions
- `frontend/src/components/BottomNav.jsx` — Collections tab
- `frontend/src/components/Header.jsx` — Collections in desktop nav
- `frontend/src/components/BookDetail.jsx` — Collection chips and picker
- `frontend/src/App.jsx` — Collections routes
- `docker-compose.yml` — COVERS_DIR environment variable

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

---

## Version History Summary

| Version | Date | Milestone |
|---------|------|-----------|
| 0.15.0 | 2026-01-02 | **Phase 7.2b** — Collections system, smart paste, Calibre migration ✨ |
| 0.14.0 | 2026-01-01 | **Phase 7.2a** — Enhanced filtering (fandom, rating, status, ships) |
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

### Upgrading to 0.15.0

**Database Changes:**
- New `collections` table (auto-created on startup)
- New `collection_books` table (auto-created on startup)

**Docker Compose Changes:**
Add `COVERS_DIR` environment variable for persistent custom covers:
```yaml
environment:
  - COVERS_DIR=/app/data/covers
```

**New Files to Upload:**
- `backend/routers/collections.py`
- `frontend/src/components/CollectionsTab.jsx`
- `frontend/src/components/CollectionCard.jsx`
- `frontend/src/components/CollectionDetail.jsx`
- `frontend/src/components/CollectionModal.jsx`
- `frontend/src/components/CollectionPicker.jsx`
- `frontend/src/components/MosaicCover.jsx`
- `frontend/src/components/SmartPasteModal.jsx`

**Post-upgrade:**
1. Update docker-compose.yml with COVERS_DIR
2. Upload all new files
3. Rebuild Docker container
4. Collections tab will appear in navigation
5. Optionally run `migrate_calibre_shelves.py` to import Calibre Web shelves

---

## Links

- [Roadmap](./20250102_ROADMAP.md)
- [Development Workflow](./20251219_DEVELOPMENT_WORKFLOW.md)
- [Architecture](./ARCHITECTURE.md)

---

*Last updated: January 2, 2026 (v0.15.0 — Phase 7.2b complete)*
