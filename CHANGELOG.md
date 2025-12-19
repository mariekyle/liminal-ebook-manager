# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Phase 2 features (see ROADMAP.md)

---

## [0.3.0] - 2025-12-19

### Added

#### Library UI Redesign
- **Unified filter bar** — All filters on single row with consistent pill styling
- **Navigation tabs** — Library and Series tabs with underline indicator
- **Category pills** — Quick-select category filtering with active state
- **Visual separator** — Clean division between categories and advanced filters
- **Active filters row** — Shows all active filters with individual × remove buttons
- **Clear all button** — One-click reset of all filters

#### Series System
- **Series tab** — Dedicated view for browsing series
- **Series Library View** — Grid of square series covers with gradient from first book
- **Series cards** — Display series name, book count, author
- **Series Detail Page** — Full page showing series info and book list in order
- **Series section on Book Detail** — Shows other books in series with current highlighted
- **View Series link** — Navigate from book detail to full series page
- **GET /series endpoint** — List all series with metadata (name, author, book count, colors)
- **GET /series/{name} endpoint** — Get series details with ordered book list

#### Tag Filtering
- **Tags modal** — Searchable popup for selecting multiple tags
- **Tag checkboxes** — Multi-select with visual feedback
- **Tag counts** — Shows number of books per tag
- **Tag search** — Filter tags by name in modal
- **GET /tags endpoint** — List all tags with counts, filterable by category
- **Exact tag matching** — Fixed substring matching bug (e.g., "fan" no longer matches "fantasy")
- **Tags badge** — Shows count of selected tags on filter button

#### Backend Improvements
- **SeriesSummary model** — Series data for library view
- **SeriesDetail model** — Full series data with book list
- **SeriesBookItem model** — Book data within series context
- **TagSummary model** — Tag with count
- **SeriesListResponse model** — Proper response serialization

### Changed
- Filter bar consolidated from multiple rows to single unified row
- Category filter changed from dropdown to pill buttons
- Status filter styled as pill dropdown
- Sort filter styled as pill dropdown
- Book count moved to right side of filter bar
- Status/Tags/Sort hidden on Series view (not applicable)

### Fixed
- Race condition in series loading on Book Detail page (cleanup flag pattern)
- SQL column reference error in series endpoint (`s.name` → `s.series`)
- Tag substring matching returning incorrect results

---

## [0.2.0] - 2025-12-17

### Added

#### Read Status System
- **Status field** on books: Unread, In Progress, Finished, DNF
- **Status dropdown** on book detail page
- **Status filter** in library view
- **Finished checkmark indicator** on book covers in library grid
- Backend endpoint `PATCH /books/{book_id}/status`
- `updateBookStatus()` API function in frontend
- `GET /statuses` endpoint returning valid status options

#### Rating System
- **1-5 star rating** on book detail page
- **Custom rating labels**: Disliked, Disappointing, Decent/Fine, Better than Good, All-time Fav
- Rating dropdown with visual stars (★★★★★ to ★☆☆☆☆)
- Backend endpoint `PATCH /books/{book_id}/rating`
- `updateBookRating()` API function in frontend

#### Reading Dates
- **Date started** field on book detail page
- **Date finished** field on book detail page
- Native date picker inputs
- Backend endpoint `PATCH /books/{book_id}/dates`
- `updateBookDates()` API function in frontend

#### Database Migrations
- Added `run_migrations()` function for automatic schema updates
- Migration system handles adding new columns to existing databases
- Migrations are idempotent (safe to run multiple times)

### Changed
- Database schema now includes: status, rating, date_started, date_finished columns
- Book detail page layout updated with new tracking fields
- Empty state message in library now accounts for status filter

### Technical
- Added database migration pattern for future schema changes
- Migrations run automatically on app startup
- Schema and migrations kept in sync for new vs existing databases

### Removed
- Notes indicator (📝) removed from book covers in library view (cleaner UI)

---

## [0.1.2] - 2025-12-17

### Added
- **Category dropdown** on book detail page for manual category editing
- **FanFiction auto-detection** for new books based on:
  - Tags containing "fanworks", "ao3", "fandom", ship patterns (Name/Name)
  - Author names with underscores, digits, or username patterns
  - Summary containing fanfic-related terms ("this fic", "slow burn", "enemies to lovers", etc.)
- Backend endpoint `PATCH /books/{book_id}/category` for updating categories
- `updateBookCategory()` API function in frontend
- Categories loaded on book detail page for dropdown population

### Changed
- Category display changed from static pill to interactive dropdown
- Error handling improved: categories fetch failure no longer blocks book detail page

### Fixed
- Empty string vs NULL consistency for uncategorized books
- Duplicate "Uncategorized" options prevented in dropdown

---

## [0.1.1] - 2025-12-16

### Added
- **Single folder scanning** — books no longer require Fiction/Non-Fiction/FanFiction subfolders
- **Content matching** — existing books matched by title+author when folder paths change
- `find_existing_book_by_content()` function for migration support
- `detect_fanfiction()` function with heuristic detection
- Guard against "Unknown Author" in content matching to prevent false matches

### Changed
- `determine_category_from_path()` updated for flat folder structure
- Category priority: existing (preserved) → path-based → fanfic detection → "Uncategorized"
- Sync now updates `folder_path` for migrated books while preserving categories

### Fixed
- Books no longer duplicated when moved between folders
- Categories preserved during library reorganization

### Migration Notes
- All 1688 books successfully migrated from subfolder structure
- 0 duplicates created
- All existing categories preserved

---

## [0.1.0] - 2025-12-14

### Added
- **Library browsing** with gradient covers
- **Search** by title and author
- **Filter by category** (Fiction, Non-Fiction, FanFiction)
- **Sort by title**
- **Book detail page** with metadata display:
  - Title, authors, series, series number
  - Publication year, word count
  - Summary, tags
  - File location
- **Notes system** — add free-form notes to books
- **Gradient cover generation** based on title and author
- **Mobile-responsive design**
- **Text shadows** on covers for readability
- Docker deployment configuration
- SQLite database for library data
- Metadata extraction from EPUB files
- Sync endpoint for scanning NAS folders

### Technical
- FastAPI backend with async SQLite
- React frontend with Vite
- Tailwind CSS for styling
- Docker Compose for deployment on Synology NAS

---

## Version History Summary

| Version | Date | Milestone |
|---------|------|-----------|
| 0.3.0 | 2025-12-19 | **Phase 1 complete** — Series system, tag filtering, unified UI |
| 0.2.0 | 2025-12-17 | Phase 1 core tracking — Status, ratings, dates |
| 0.1.2 | 2025-12-17 | Phase 0 complete — Editable categories, fanfic auto-detection |
| 0.1.1 | 2025-12-16 | Single folder migration, category preservation |
| 0.1.0 | 2025-12-14 | Initial release — Library browsing, search, detail pages |

---

## Upgrade Notes

### Upgrading to 0.3.0
No database migrations required. Deploy updated backend and frontend.
- New endpoints: GET /series, GET /series/{name}, GET /tags
- Frontend components: SeriesCard, SeriesDetail, TagsModal
- Library.jsx significantly refactored (unified filter bar)

### Upgrading to 0.2.0
Database migrations run automatically on startup. No manual steps required.
- New columns (status, rating, date_started, date_finished) added automatically
- Existing books default to status "Unread" and no rating

### Upgrading to 0.1.2
No migration required. Deploy updated backend and frontend.

### Upgrading to 0.1.1 from 0.1.0
1. Backup database before migration
2. Move books to single folder structure (optional but recommended)
3. Run full sync: `curl -X POST "http://your-nas:3000/api/sync?full=true"`
4. Verify categories preserved

---

## Links

- [Roadmap](./ROADMAP.md)
- [Development Guidelines](./docs/DEVELOPMENT_GUIDELINES.md)
