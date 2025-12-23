# Liminal Product Roadmap

## Vision Statement

Liminal is a personal reading companion that eliminates the friction of managing an ebook library across multiple systems. It provides a single, mobile-friendly home for browsing, tracking, discovering, and reflecting on books — both owned and wished for — so that the reader can spend less time managing and more time in the liminal space of reading.

---

## Current State (v0.5.4)

**What Liminal can do today:**
- Scan books from NAS storage (single folder structure)
- **Upload new books directly from mobile or desktop** ✨
- **Extract metadata from EPUB/PDF files** (author, title, summary, tags) ✨
- **All ebook formats work on mobile** (.epub, .pdf, .mobi, .azw3, .azw, .html) ✨
- **Smart FanFiction detection** from filename patterns (AO3, FFN, tropes)
- **Override false duplicate matches** with "Upload as New" option
- Display library with rich gradient covers (10 presets, HSL color lanes, vignettes)
- Collapsible filter header — Scroll down to hide, scroll up to reveal
- Poetic category phrases — "780 what-ifs. Explore freely."
- Filter state persistence — URL params preserve filters across navigation
- Unified filter bar — Categories, status, tags, sort on one row (centered)
- Series tab — Browse series with square gradient covers
- Series detail pages — View all books in a series
- Tag filtering — Multi-select tags with searchable modal
- Active filters row — Clear individual filters or all at once
- Search and filter by category, status, tags
- Sort by title, author, series, year, recently updated
- Scroll through full library (1700+ books)
- View book detail page with full metadata
- Track read status (Unread, In Progress, Finished, DNF)
- Rate books 1-5 stars with custom labels
- Track reading dates (started, finished)
- Finished checkmark on book covers
- Series section on book detail — Navigate between books in series
- Edit book category via dropdown
- Auto-detect FanFiction based on metadata patterns
- Add free-form notes to books
- Mobile-responsive design
- Import reading data from Obsidian (status, rating, dates)

---

## Phase 2: Book Uploader ✅ COMPLETE

**Completed: December 22-23, 2025**

All upload features working including mobile file picker for all formats.

---

## Phase 2.1: Upload Polish ✅ COMPLETE

**Completed: December 23, 2025**

- ✅ Background sync after upload
- ✅ EPUB/PDF metadata extraction
- ✅ Category detection improvements
- ✅ "Upload as New" for false duplicates
- ✅ Mobile file picker for .mobi/.azw3

---

## Phase 3: Rich Notes & Metadata ← NEXT

**Goal:** Book notes and reading data live in Liminal with the same richness as Obsidian.

### Structured Notes
- [ ] Replace single notes field with structured sections:
  - Hot Take (1-3 sentence summary)
  - Characters
  - Atmosphere/World
  - Writing
  - Plot
  - Steam
  - Believability
- [ ] Each section expandable/collapsible
- [ ] Markdown support in notes
- [ ] Optional 1-10 rating per section (mirrors Obsidian format)

### Phase 3.5: Notes Migration (after structured notes built)
- [ ] Update markdown parser to extract section content
- [ ] Map "Characters: 9" → structured characters_rating field
- [ ] Map reading notes text → appropriate sections
- [ ] Run notes migration script
- [ ] Verify notes imported correctly

### Editable Metadata
- [ ] **Edit title** — Fix incorrect titles
- [ ] **Edit author(s)** — Fix misspellings, add missing authors
- [ ] **Edit series** — Add, change, or remove series assignment
- [ ] **Edit series number** — Fix ordering
- [ ] Edit publication year
- [ ] HTML entity decoding in summaries (fix &amp; etc.)
- [ ] "Added to library" date (pulled from file system)
- [ ] Storage location display and validation

### Book Detail Page Redesign
- [ ] **Clean up visual layout** — Current page is chaotic
- [ ] Logical grouping of metadata
- [ ] Better use of space
- [ ] Mobile-optimized layout
- [ ] Consistent styling with library view

### Reading Stats & Estimated Time
- [ ] **Estimated read time** displayed on book detail page
- [ ] **Estimated read time filter** in library
- [ ] Actual WPM field (manual entry from Moon Reader)
- [ ] Actual read time field

### Settings Screen
- [ ] **Reading speed (WPM) setting** for estimated read time calculations
- [ ] **Customizable rating labels**
- [ ] **Light/dark mode toggle**
- [ ] Display preferences
- [ ] **Move "Sync Library" button here**

### Simple Author Page
- [ ] Basic author page (name + notes)
- [ ] **Author notes** — free-form notes about an author
- [ ] Link from book detail page
- [ ] List of books by this author

---

## Phase 4: TBR & Wishlist

**Goal:** Track books you want, not just books you have.

### Manual Book Entry
- [ ] **Add books without files** — Track physical books, audiobooks
- [ ] Manual entry form: title, author, series, category
- [ ] Mark as "No ebook" or "Physical only"
- [ ] Still track reading status, rating, dates, notes

### TBR List
- [ ] Separate TBR section/view
- [ ] Manual entry: title, author, source, notes
- [ ] "Why I want to read this" field
- [ ] Source URL field
- [ ] Priority/ranking within TBR

### Quick Capture
- [ ] Photo capture: snap a book cover
- [ ] Share-to-Liminal: share a link from browser/app to add to TBR

### TBR → Library Flow
- [ ] "I got this book" action to move from TBR to Library
- [ ] Link TBR entry to library entry when acquired
- [ ] Preserve notes/metadata during transition

---

## Phase 5: Discovery & Collections

**Goal:** Rediscover your library. Find your next read with joy.

### Multi-Series Support
- [ ] Books can belong to multiple series
- [ ] Database schema: `book_series` junction table
- [ ] UI for managing multiple series assignments
- [ ] Display all series on book detail page

### Smart Filtering
- [ ] Multi-filter: combine status + category + tags + rating + read time
- [ ] Complex queries: "Unread 5-star fiction under 3 hours"
- [ ] Sort direction toggle (asc/desc)
- [ ] Clear search button (X icon)

### Collections
- [ ] Manual collections (curated lists)
- [ ] Smart collections (auto-populate based on rules)
- [ ] Collection cover (mosaic or custom)
- [ ] Import Obsidian collection notes

### Series Pages (Enhanced)
- [ ] Series mosaic covers
- [ ] Progress bar on series cover
- [ ] Series completion tracking
- [ ] Navigate between books in series (prev/next)

### Author Pages (Enhanced)
- [ ] Full author detail page
- [ ] Author statistics
- [ ] Books by author grid view
- [ ] Author photo/avatar support

### Statistics Dashboard
- [ ] Books read per month/year
- [ ] Reading by category breakdown
- [ ] Average rating given
- [ ] Total books, total read, completion percentage
- [ ] Reading streak/pace
- [ ] Total reading time

---

## Phase 6: Integration & Polish

**Goal:** Streamline workflows. Reduce remaining friction points.

### Storage & Sync
- [ ] Settings: view/change storage location
- [ ] Sync progress indicator
- [ ] Incremental sync

### Export & Backup
- [ ] Export library as spreadsheet
- [ ] Full database backup/restore
- [ ] Import from spreadsheet

### Cover Improvements
- [x] ~~Match Obsidian plugin gradient style~~ ✅
- [ ] Extract actual covers from EPUB files
- [ ] Ability to upload custom covers
- [ ] Series info displayed on cover
- [ ] Theme-based cover generation

### UI Polish
- [ ] Clear search button (X icon)
- [ ] Rows per page setting
- [ ] Loading states and animations
- [ ] Error handling improvements

### Advanced Upload Features
- [x] ~~Fix mobile file picker for .mobi/.azw3~~ ✅
- [ ] Background uploads
- [ ] Upload queue management
- [ ] Resume interrupted uploads
- [ ] PWA notifications for upload completion

---

## Phase 7: AI Enhancements

**Goal:** Let AI reduce manual work and enhance discovery.

### AI Features
- [ ] Auto-generate "Hot Take" summaries
- [ ] Auto-extract/suggest themes and tags
- [ ] Reading recommendations based on library and ratings
- [ ] Similar book suggestions

---

## Technical Debt & Bugs

### Medium Priority
- [ ] Folder name parsing too strict on dash separator
- [ ] Sort direction unclear (no visual indicator)
- [ ] Status filter on Series page
- [ ] Redundant title below covers
- [ ] HTML entities not decoded in summaries

### Low Priority
- [ ] Some non-book files getting scanned

---

## What's NOT on the Roadmap

- Calibre integration
- Social features
- In-app reading
- Audiobook support
- Library lending tracking

---

## Development Principles

1. **Mobile-first** — Every feature should work great on Android
2. **Single source of truth** — Liminal is THE place for book data
3. **Reduce friction** — If it takes more than 2 taps, simplify it
4. **Data integrity** — Never lose user's notes or reading history
5. **Offline-capable** — Core features should work without internet (future PWA)

---

## Version History

| Version | Date | Milestone |
|---------|------|-----------|
| v0.1.0 | Dec 14, 2025 | Initial release |
| v0.1.1 | Dec 16, 2025 | Single folder migration |
| v0.1.2 | Dec 17, 2025 | Phase 0 complete |
| v0.2.0 | Dec 17, 2025 | Phase 1 core tracking |
| v0.3.0 | Dec 19, 2025 | Phase 1 complete |
| v0.4.0 | Dec 20, 2025 | Phase 1.5 complete |
| v0.5.0 | Dec 22, 2025 | Phase 2 complete — Book upload system |
| v0.5.1 | Dec 22, 2025 | Background sync fix |
| v0.5.2 | Dec 22, 2025 | Category detection, .azw support |
| v0.5.3 | Dec 23, 2025 | EPUB metadata, "Upload as New" |
| v0.5.4 | Dec 23, 2025 | **Phase 2.1 complete** — Mobile file picker fixed |
| v0.6.0 | TBD | Phase 3 — Rich notes & metadata |
| v0.7.0 | TBD | Phase 4 — TBR & Wishlist |
| v0.8.0 | TBD | Phase 5 — Discovery & Collections |
| v0.9.0 | TBD | Phase 6 — Integration & Polish |
| v1.0.0 | TBD | Phase 7 — Full Obsidian replacement complete |

---

*Last updated: December 23, 2025 (v0.5.4 — Phase 2.1 complete, upload system fully functional)*
