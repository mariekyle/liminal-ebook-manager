# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Phase 1: Read status system
- Phase 1: Rating system
- Phase 1: Reading dates

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
| 0.1.2 | 2025-12-17 | Phase 0 complete — Editable categories, fanfic auto-detection |
| 0.1.1 | 2025-12-16 | Single folder migration, category preservation |
| 0.1.0 | 2025-12-14 | Initial release — Library browsing, search, detail pages |

---

## Upgrade Notes

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
