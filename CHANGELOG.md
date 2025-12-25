# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Custom status labels in settings
- "No summary" notice on book detail page
- Checkmark on finished books on author page

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

### Changed

- **Filter drawer replaces inline filters** — All filters now accessed via drawer instead of filter bar
- **Sort separated from filters** — Sort is now independent; "Clear all" no longer resets sort
- **Poetic phrase styling** — Unified size/color with sort dropdown, removed italics
- **Sort dropdown simplified** — Shows just "Title" instead of "Sort: Title", uses ↑ arrow icon

### Fixed

#### Navigation & Layout
- **Sub-page padding** — BookDetail, SeriesDetail, AuthorDetail now have proper horizontal padding
- **Sticky header positioning** — Alphabetical section headers in AuthorsList position correctly below search bar
- **Filter drawer visibility** — Drawer fully hides when closed (no peeking through bottom)

#### Filter System
- **View-aware filter count** — Badge only counts filters relevant to current view (library vs series)
- **Search included in series filter count** — Filter badge now includes search on series view
- **Clear filters preserves sort** — "Clear all" no longer resets sort order

### Technical

#### New Files
- `frontend/src/components/BottomNav.jsx` — Mobile bottom navigation component
- `frontend/src/components/FilterDrawer.jsx` — Responsive filter drawer component
- `frontend/src/components/SearchBar.jsx` — Unified search bar component

#### Modified Files
- `frontend/src/App.jsx` — Added BottomNav, responsive layout padding
- `frontend/src/components/Header.jsx` — Desktop navigation, responsive design
- `frontend/src/components/Library.jsx` — Filter drawer integration, inline sort, grid columns setting
- `frontend/src/components/SettingsDrawer.jsx` — Grid columns setting with event dispatch
- `frontend/src/components/EditBookModal.jsx` — Series autocomplete
- `frontend/src/pages/AuthorsList.jsx` — Shared SearchBar, fixed sticky positioning
- `frontend/src/pages/UploadPage.jsx` — Shared navigation integration
- `backend/database.py` — Default grid_columns setting

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

#### BookDetail Redesign
- **Reorganized layout** — Series above title, year below author
- **Chip+popup controls** — Status and rating use chip display with popup selectors
- **Estimated read time card** — Prominent display with microcopy
- **"About This Book" card** — Summary, tags, word count, and "added to library" date

#### Other Improvements
- **HTML entity decoding** — Summaries display &amp; correctly as &
- **Case-insensitive sorting** — Lowercase titles now sort alphabetically with others
- **"Added to library" date** — Shows when book was added in BookDetail footer

### Fixed

#### Performance
- **Infinite re-render loop** — Fixed URL sync causing 50+ API calls on page load
- **Flickering book count** — Stable phrase display, no more count jumping

#### Author System
- **JSON quote escaping** — Author names with double quotes can be found and renamed
- **Empty notes handling** — Returns null instead of empty string for consistency
- **Accurate books_updated count** — Reports actual updates, not LIKE query matches

#### Other Fixes
- **Case-insensitive duplicate check** — Can't add "John Smith" and "john smith" as separate authors
- **React key collision** — Fixed potential key duplicates in author rendering
- **word_count in API** — Books list now includes word_count for read time filtering
- **Defensive column access** — Handles databases without word_count column gracefully

### Technical

#### New Files
- `backend/routers/settings.py` — Settings API endpoints
- `backend/routers/authors.py` — Authors API endpoints
- `frontend/src/components/SettingsDrawer.jsx` — Settings drawer component
- `frontend/src/components/EditBookModal.jsx` — Book metadata editor
- `frontend/src/components/AuthorChips.jsx` — Draggable author management
- `frontend/src/components/EditAuthorModal.jsx` — Author name/notes editor
- `frontend/src/pages/AuthorDetail.jsx` — Individual author page
- `frontend/src/pages/AuthorsList.jsx` — Authors directory page
- `frontend/src/utils/readTime.js` — Read time calculations and microcopy

#### Database
- Added `settings` table for key-value configuration storage
- Added `author_notes` table for author notes storage
- Added `created_at` to API responses

#### Modified Files
- `backend/database.py` — Settings and author_notes tables, migrations
- `backend/routers/books.py` — Metadata update endpoint, word_count in responses, COLLATE NOCASE sorting
- `backend/main.py` — Register settings and authors routers
- `frontend/src/api/index.js` — Settings, authors, and metadata API functions
- `frontend/src/pages/BookDetail.jsx` — Complete redesign with new layout
- `frontend/src/pages/Library.jsx` — Read time filter, Authors tab, URL sync fix
- `frontend/src/App.jsx` — Settings drawer, author routes

---

## [0.5.4] - 2025-12-23

### Fixed

#### Mobile File Picker for .mobi/.azw3
- **Android document picker now works** — Uses broad MIME types to trigger document browser
- **All ebook formats selectable on mobile** — .mobi, .azw3, .azw, .epub, .pdf, .html

---

## [0.5.3] - 2025-12-23

### Added

#### EPUB/PDF Metadata Extraction During Upload
- **Author auto-population** — Authors extracted from EPUB/PDF metadata
- **Title from metadata** — Prefers embedded title over filename parsing
- **Rich metadata** — Extracts publication year, summary, tags, and word count

#### "Upload as New Book" for False Duplicate Matches
- **Override incorrect matches** — "Not a match? Upload as separate book" link
- **Confirmation UI** — Green banner when uploading as new

---

## [0.5.2] - 2025-12-22

### Fixed

#### FanFiction Category Detection
- **AO3-style filename detection** — Correctly detects files with underscores
- **Expanded trope detection** — Added more trope keywords

#### File Type Support
- **Added .azw support** — Amazon Kindle .azw files now accepted

---

## [0.5.1] - 2025-12-22

### Fixed

#### Background Sync After Upload
- **Auto-sync now works** — Uploaded books automatically appear in library

---

## [0.5.0] - 2025-12-22

### Added

#### Book Upload System (Phase 2)
- **Upload page** — New `/upload` route accessible from Library navigation
- **Drag-and-drop zone** — Drop files or click to select from device
- **Multi-file upload** — Upload multiple books in one session
- **Smart file grouping** — Auto-groups related files
- **Category auto-detection** — FanFiction, Fiction, Non-Fiction with confidence scores
- **Duplicate detection** — Warns when uploading books that already exist
- **Inline metadata editing** — Edit before finalizing

---

## [0.4.0] - 2025-12-20

### Added
- Obsidian import system
- Collapsible filter header
- Filter state persistence
- Rich gradient cover system (10 presets, HSL color lanes)

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
| 0.7.0 | 2025-12-25 | **Phase 3.5 complete** — Navigation redesign, filter drawer, grid settings |
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

### Upgrading to 0.7.0

**Backend:**
- Modified: `database.py` (grid_columns default setting)

**Frontend:**
- New files: `BottomNav.jsx`, `FilterDrawer.jsx`, `SearchBar.jsx`
- Modified: `App.jsx`, `Header.jsx`, `Library.jsx`, `SettingsDrawer.jsx`, `EditBookModal.jsx`, `AuthorsList.jsx`, `UploadPage.jsx`

**Database migrations run automatically on startup.**

**Rebuild Docker container after update.**

### Upgrading to 0.6.0

**Backend:**
- New files: `routers/settings.py`, `routers/authors.py`
- Modified: `database.py`, `routers/books.py`, `main.py`

**Frontend:**
- New files in `components/`: SettingsDrawer, EditBookModal, AuthorChips, EditAuthorModal
- New files in `pages/`: AuthorDetail, AuthorsList
- New file: `utils/readTime.js`
- Modified: BookDetail.jsx (major redesign), Library.jsx, App.jsx, api/index.js

**Database migrations run automatically on startup.**

**Rebuild Docker container after update.**

---

## Links

- [Roadmap](./20251225_ROADMAP.md)
- [Development Workflow](./20251219_DEVELOPMENT_WORKFLOW.md)
- [Architecture](./ARCHITECTURE.md)
