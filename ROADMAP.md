# Liminal Product Roadmap

## Vision Statement

Liminal is a personal reading companion that eliminates the friction of managing an ebook library across multiple systems. It provides a single, mobile-friendly home for browsing, tracking, discovering, and reflecting on books — both owned and wished for — so that the reader can spend less time managing and more time in the liminal space of reading.

---

## Current State (v0.7.0)

**What Liminal can do today:**
- Scan books from NAS storage (single folder structure)
- Upload new books directly from mobile or desktop
- Extract metadata from EPUB/PDF files (author, title, summary, tags)
- All ebook formats work on mobile (.epub, .pdf, .mobi, .azw3, .azw, .html)
- Smart FanFiction detection from filename patterns (AO3, FFN, tropes)
- Override false duplicate matches with "Upload as New" option
- Display library with rich gradient covers (10 presets, HSL color lanes, vignettes)
- **Mobile bottom navigation** — Fixed nav bar with Library, Series, Authors, Upload ✨
- **Desktop header navigation** — Centered nav tabs on single line ✨
- **Filter drawer** — Slides up on mobile, slides from right on desktop ✨
- **Unified search bar** — Combined search input and filter icon ✨
- Poetic category phrases — "780 what-ifs. Explore freely."
- Filter state persistence — URL params preserve filters across navigation
- Read time filter — 8 tiers from "Under 30 min" to "30+ hours"
- Series tab — Browse series with square gradient covers
- Authors tab — Browse all authors alphabetically with search
- Series detail pages — View all books in a series
- Author detail pages — View author with notes and all their books
- Tag filtering — Multi-select tags with searchable modal
- Active filters row — Clear individual filters or all at once
- Search and filter by category, status, tags, read time
- **Sort inline with count** — Sort dropdown next to book/series count ✨
- Sort by title, author, series, year, recently updated (case-insensitive)
- **Books per row setting** — Choose 2, 3, or 4 columns on mobile ✨
- Scroll through full library (1700+ books)
- View book detail page with full metadata
- Edit book metadata — Title, authors, series, category, year
- Draggable author chips — Reorder authors, first appears on cover
- Author autocomplete — Suggests existing authors when editing
- **Series autocomplete** — Suggests existing series when editing ✨
- Track read status (Unread, In Progress, Finished, DNF)
- Rate books 1-5 stars with custom labels
- Track reading dates (started, finished)
- Estimated read time — Based on word count and WPM setting
- Finished checkmark on book covers
- Series section on book detail — Navigate between books in series
- Auto-detect FanFiction based on metadata patterns
- Add free-form notes to books
- Author notes — Free-form notes about any author
- Author rename — Update author name across all books
- Settings drawer — WPM, grid columns, sync controls
- "Added to library" date — Shows when book was added
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

## Phase 3: Rich Notes & Metadata ✅ COMPLETE

**Completed: December 24, 2025**

### Editable Metadata ✅
- ✅ **Edit title** — Fix incorrect titles
- ✅ **Edit author(s)** — Fix misspellings, add missing authors
- ✅ **Edit series** — Add, change, or remove series assignment
- ✅ **Edit series number** — Fix ordering
- ✅ Edit publication year
- ✅ HTML entity decoding in summaries (fix &amp; etc.)
- ✅ "Added to library" date (pulled from created_at)

### Book Detail Page Redesign ✅
- ✅ **Clean up visual layout** — Reorganized with logical grouping
- ✅ Logical grouping of metadata
- ✅ Better use of space
- ✅ Mobile-optimized layout
- ✅ Consistent styling with library view
- ✅ Chip+popup controls for status/rating

### Reading Stats & Estimated Time ✅
- ✅ **Estimated read time** displayed on book detail page
- ✅ **Estimated read time filter** in library (8 tiers)
- ✅ Poetic microcopy tiers ("a quick visit" to "a true saga")

### Settings Screen ✅
- ✅ **Reading speed (WPM) setting** for estimated read time calculations
- ✅ **Move "Sync Library" button here**

### Simple Author Page ✅
- ✅ Basic author page (name + notes)
- ✅ GET /api/authors endpoint (unique authors list)
- ✅ Author autocomplete when editing book authors
- ✅ **Author notes** — free-form notes about an author
- ✅ Link from book detail page
- ✅ List of books by this author
- ✅ Authors list page with search and alphabetical grouping
- ✅ Author rename functionality

### Deferred to Later Phases
- [ ] Structured notes sections (Hot Take, Characters, Writing, etc.)
- [ ] Notes migration from Obsidian format
- [ ] Customizable rating labels
- [ ] Light/dark mode toggle
- [ ] Actual WPM field (manual entry from Moon Reader)

---

## Phase 3.5: Navigation Redesign ✅ COMPLETE

**Completed: December 25, 2025**

### Mobile Navigation ✅
- ✅ **Bottom navigation bar** — Fixed position with Library, Series, Authors, Upload
- ✅ **Filter drawer** — Slides up from bottom, rounded top corners
- ✅ **Unified search bar** — Search icon + input + filter icon in single component

### Desktop Navigation ✅
- ✅ **Header navigation** — Logo + centered nav tabs + settings on single line
- ✅ **Filter drawer** — Slides in from right, 320px width
- ✅ **Full-width search bar** — Spans page width

### Filter System Improvements ✅
- ✅ **Sort separated from filters** — Sort dropdown inline with book/series count
- ✅ **View-aware filter count** — Badge only counts relevant filters per view
- ✅ **Clear filters preserves sort** — Sorting is independent of filtering

### Display Settings ✅
- ✅ **Books per row** — User can choose 2, 3, or 4 columns on mobile
- ✅ **Real-time sync** — Grid updates immediately when setting changes
- ✅ **Series autocomplete** — Edit modal suggests existing series names

---

## Phase 4: TBR & Wishlist ← NEXT

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
- [ ] Author statistics (books read, average rating)
- [ ] Author photo/avatar support
- [ ] Finished checkmark on author page book grid

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
- [x] ~~Books per row setting~~ ✅
- [ ] Loading states and animations
- [ ] Error handling improvements
- [ ] "No summary available" notice on book detail page
- [ ] Virtual scrolling for library grid (performance)

### Settings Enhancements
- [ ] Customizable rating labels
- [ ] Custom status labels
- [ ] Light/dark mode toggle
- [ ] Display preferences

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
- [x] ~~Sort direction unclear (no visual indicator)~~ ✅ (now shows ↑ arrow)
- [ ] Status filter on Series page
- [ ] Redundant title below covers
- [ ] Storage location display and validation

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
| v0.5.4 | Dec 23, 2025 | Phase 2.1 complete — Mobile file picker fixed |
| v0.6.0 | Dec 24, 2025 | Phase 3 complete — Settings, metadata editing, read time, author pages |
| v0.7.0 | Dec 25, 2025 | **Phase 3.5 complete** — Navigation redesign, filter drawer, grid settings |
| v0.8.0 | TBD | Phase 4 — TBR & Wishlist |
| v0.9.0 | TBD | Phase 5 — Discovery & Collections |
| v0.10.0 | TBD | Phase 6 — Integration & Polish |
| v1.0.0 | TBD | Phase 7 — Full Obsidian replacement complete |

---

*Last updated: December 25, 2025 (v0.7.0 — Phase 3.5 complete)*
