# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Phase 1: Series improvements (filter, sorting)
- Phase 1: Tag filtering

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
| 0.2.0 | 2025-12-17 | Phase 1 core tracking — Status, ratings, dates |
| 0.1.2 | 2025-12-17 | Phase 0 complete — Editable categories, fanfic auto-detection |
| 0.1.1 | 2025-12-16 | Single folder migration, category preservation |
| 0.1.0 | 2025-12-14 | Initial release — Library browsing, search, detail pages |

---

## Upgrade Notes

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
