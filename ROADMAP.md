# Liminal Product Roadmap

## Vision Statement

Liminal is a personal reading companion that eliminates the friction of managing an ebook library across multiple systems. It provides a single, mobile-friendly home for browsing, tracking, discovering, and reflecting on books — both owned and wished for — so that the reader can spend less time managing and more time in the liminal space of reading.

---

## Current State (v0.2.0)

**What Liminal can do today:**
- Scan books from NAS storage (single folder structure)
- Display library with gradient covers
- Search and filter by category and status
- Sort by title, author, series, year, recently updated
- Scroll through full library (1689+ books)
- View book detail page with full metadata
- **Track read status** (Unread, In Progress, Finished, DNF)
- **Rate books 1-5 stars** with custom labels
- **Track reading dates** (started, finished)
- **Finished checkmark** on book covers
- Edit book category via dropdown
- Auto-detect FanFiction based on metadata patterns
- Add free-form notes to books
- Mobile-responsive design

---

## Phase 0: Foundation ✅ COMPLETE

**Goal:** Simplify storage structure and make categorization a metadata field instead of folder-based.

**Completed: December 17, 2025**

- [x] Step 1: Backup & preserve existing categories
- [x] Step 2: Update backend for single folder scanning
- [x] Step 3: Add FanFiction auto-detection
- [x] Step 4: Make category editable in UI
- [x] Step 5: Migrate files to single folder structure

**Key Outcomes:**
- Books live in single `/Books` folder (no subfolders required)
- Categories are editable metadata
- New fanfics auto-detected by tags, author patterns, summary keywords
- 1688 books migrated with categories preserved

---

## Phase 1: Replace Obsidian (Core Tracking) ← IN PROGRESS

**Goal:** Stop using Obsidian for day-to-day library management.

### Read Status System ✅ COMPLETE
- [x] Add status field to database: Unread, In Progress, Finished, DNF
- [x] Status selector dropdown on detail page
- [x] Status indicator badge on book covers (checkmark for Finished)
- [x] Filter library by status

### Rating System ✅ COMPLETE
- [x] 1-5 rating field on detail page
- [x] Custom labels: 1=Disliked, 2=Disappointing, 3=Decent/Fine, 4=Better than Good, 5=All-time Fav
- [x] Display rating on detail page with stars

### Reading Dates ✅ COMPLETE
- [x] Date started field (manual entry)
- [x] Date finished field (manual entry)
- [x] Display on detail page with native date pickers

### Series Improvements
- [ ] **Library UI redesign** — Full-width search, nav tabs, category pills, cleaner filter row
- [ ] **Series tab in navigation** — Separate view for browsing series
- [ ] **Series Library View** — Grid of series with square covers (gradient from book #1)
- [ ] **Series Detail Page** — Series info, book list in order with links
- [ ] **Series section on Book Detail** — List other books in series, highlight current, link to each

### Tags That Work
- [ ] Filter library by tags
- [ ] Multi-tag selection
- [ ] Basic tag management (view all tags, see count per tag)

### Milestone
When Phase 1 is complete, you can open Liminal on your phone, browse your library, mark books as read/DNF/in-progress, rate them, and track when you read them — without touching Obsidian.

---

## Phase 2: Rich Notes & Metadata

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

### Reading Stats & Estimated Time
- [ ] **Estimated read time** displayed on book detail page (calculated from word count ÷ WPM)
- [ ] **Estimated read time filter** in library (e.g., "Under 2 hours", "2-5 hours", "5+ hours")
- [ ] Actual WPM field (manual entry from Moon Reader)
- [ ] Actual read time field

### Settings Screen
- [ ] **Reading speed (WPM) setting** for estimated read time calculations
- [ ] **Customizable rating labels** (rename "Disliked" to your own terms)
- [ ] **Light/dark mode toggle**
- [ ] Display preferences (show/hide on covers: author, title, series)
- [ ] Rows displayed in library grid

### Metadata Improvements
- [ ] Editable metadata (title, author, series, year, etc.)
- [ ] HTML entity decoding in summaries (fix &amp; etc.)
- [ ] "Added to library" date (pulled from file system)
- [ ] Storage location display and validation

### Simple Author Page
- [ ] Basic author page (name + notes)
- [ ] **Author notes** — free-form notes about an author
- [ ] Link from book detail page (click author name → author page)
- [ ] List of books by this author (simple list, not full grid)

### Milestone
When Phase 2 is complete, Liminal holds all the rich reading data you currently keep in Obsidian. You can migrate existing notes and retire Obsidian for books entirely.

---

## Phase 3: TBR & Wishlist

**Goal:** Track books you want, not just books you have.

### TBR List
- [ ] Separate TBR section/view
- [ ] Manual entry: title, author, source, notes
- [ ] "Why I want to read this" field
- [ ] Source URL field (for fanfiction links, store links, etc.)
- [ ] Priority/ranking within TBR

### Quick Capture
- [ ] Photo capture: snap a book cover, manually enter or OCR extract title/author
- [ ] Share-to-Liminal: share a link from browser/app to add to TBR (Android intent)

### TBR → Library Flow
- [ ] "I got this book" action to move from TBR to Library
- [ ] Link TBR entry to library entry when acquired
- [ ] Preserve notes/metadata during transition

### Milestone
When Phase 3 is complete, you have one place to track both "books I have" and "books I want." No more scattered lists across phone, laptop, and random apps.

---

## Phase 4: Discovery & Collections

**Goal:** Rediscover your library. Find your next read with joy.

### Smart Filtering
- [ ] Multi-filter: combine status + category + tags + rating + read time
- [ ] Complex queries: "Unread 5-star fiction under 3 hours"
- [ ] Sort by: date added, date read, rating, title, author, series, estimated time
- [ ] Sort direction toggle (asc/desc)
- [ ] Clear search button (X icon)

### Collections
- [ ] Manual collections (curated lists: "Beach Reads", "Comfort Rereads")
- [ ] Smart collections (auto-populate based on rules)
- [ ] Collection cover (mosaic of book covers or custom)

### Series Pages (Enhanced)
- [ ] **Series mosaic covers** — 4-book grid image instead of gradient
- [ ] **Progress bar on series cover** — Visual completion indicator
- [ ] Series completion tracking (3 of 7 read)
- [ ] Navigate between books in series (prev/next from book detail)

### Author Pages (Enhanced)
- [ ] Full author detail page with rich UI
- [ ] Author statistics (books owned, books read, average rating)
- [ ] Books by author grid view (full library-style display)
- [ ] Author photo/avatar support

### Statistics Dashboard
- [ ] Books read per month/year (charts)
- [ ] Reading by category/genre breakdown
- [ ] Average rating given
- [ ] Total books, total read, completion percentage
- [ ] Reading streak/pace
- [ ] Total reading time

### Milestone
When Phase 4 is complete, Liminal helps you *discover* your next read, not just *find* it. The library becomes a source of joy, not just storage.

---

## Phase 5: Integration & Polish

**Goal:** Streamline workflows. Reduce remaining friction points.

### Book Uploader Integration
- [ ] Merge book-uploader functionality into Liminal
- [ ] Add new books directly through Liminal UI
- [ ] Auto-scan on upload
- [ ] Drag-and-drop upload
- [ ] Mobile-friendly upload (share file to Liminal)

### Storage & Sync
- [ ] Fix Sync Library button in UI (currently not loading new books)
- [ ] Settings: view/change storage location
- [ ] Sync progress indicator (show what's happening during scan)
- [ ] Incremental sync (only scan new/changed files)

### Export & Backup
- [ ] Export library as spreadsheet (CSV/Excel)
- [ ] Full database backup/restore
- [ ] Import from spreadsheet
- [ ] (Future consideration: Goodreads import/export)

### Cover Improvements
- [ ] Extract actual covers from EPUB files
- [ ] Ability to upload custom covers
- [ ] **Match Obsidian plugin gradient style** (see reference notes below)
- [ ] Theme-based cover generation (genre-appropriate colors)

**Obsidian Gradient Reference Notes:**

The Obsidian plugin produces superior gradients that should be replicated. Key differences observed:

*Color Quality:*
- Deeper, more saturated colors (rich teals, warm terracottas, deep purples)
- More solid/subtle gradients (almost monochromatic with gentle variation)
- Current Liminal gradients are too pastel and have too obvious two-tone effect

*Typography:*
- Stronger text presence with bolder feel
- Series info displayed on cover: "(ROYAL ELITE 4)", "(ALL MY SINS 1)"
- Font appears to be serif (possibly Prata or similar)

*Source Code to Reference:*
- `gradient_covers.ts` - Color palettes and generation algorithm
- `CoverRenderer.ts` - Cover composition logic
- `NoteCoverProcessor.ts` - Color selection logic (hash-based? author-based?)
- Location: `.obsidian/plugins/nas-book-importer/` or development source folder

### UI Polish
- [ ] Clear search button (X icon)
- [ ] Sort direction indicators (↑↓)
- [ ] Rows per page setting
- [ ] Loading states and animations
- [ ] Error handling improvements

### Milestone
When Phase 5 is complete, Liminal is a polished, self-contained system. All book-related workflows happen in one place.

---

## Phase 6: AI Enhancements (Future)

**Goal:** Let AI reduce manual work and enhance discovery.

### AI Features
- [ ] Auto-generate "Hot Take" summaries for books
- [ ] Auto-extract/suggest themes and tags
- [ ] Reading recommendations based on your library and ratings
- [ ] Similar book suggestions ("If you liked X...")

### Implementation Notes
- Consider local vs. API-based AI
- Privacy implications of sending book data to external services
- Cost considerations for API usage

---

## What's NOT on the Roadmap

These are interesting but not essential to the core vision:

- **Calibre integration** — You have a good folder structure already
- **Social features** — Sharing, friend recommendations, book clubs
- **In-app reading** — Moon Reader handles this well
- **Audiobook support** — Different workflow, different app
- **Library lending/borrowing tracking** — Edge case

These can be revisited once the core experience is solid.

---

## Development Principles

1. **Mobile-first** — Every feature should work great on Android
2. **Single source of truth** — Liminal is THE place for book data
3. **Reduce friction** — If it takes more than 2 taps, simplify it
4. **Data integrity** — Never lose user's notes or reading history
5. **Offline-capable** — Core features should work without internet (future PWA)

---

## Technical Debt & Bugs

Track known issues that need fixing:

### Parsing Issues
- [ ] **Folder name parsing too strict on dash separator** — Parser requires ` - ` (space-dash-space) but some folders use `- ` (dash-space without leading space). Example: `River Ramsey, Harper Lennox- [Fameverse 01] Claimed by the Band` parses incorrectly.
  - *Fix:* Update `parse_folder_name()` regex to accept optional space before dash
  - *Affected:* sync.py
  - *Priority:* Low (3 books affected, can fix via folder rename)

### Display Issues
- [ ] HTML entities not decoded in summaries (&amp; showing)
- [ ] Sort options don't clearly indicate direction

### Sync Issues
- [ ] Sync Library button in UI not working for new books
- [ ] Some non-book files (.indd) getting scanned

---

## Version History

| Version | Date | Milestone |
|---------|------|-----------|
| v0.1.0 | Dec 14, 2025 | Initial release — Library browsing, search, detail pages |
| v0.1.1 | Dec 16, 2025 | Single folder migration, category preservation |
| v0.1.2 | Dec 17, 2025 | Phase 0 complete — Editable categories, fanfic auto-detection |
| v0.2.0 | Dec 17, 2025 | **Phase 1 core tracking** — Status, ratings, dates |
| v0.3.0 | TBD | Phase 1 complete — Series, tags |
| v0.4.0 | TBD | Phase 2 — Rich notes & metadata |
| v0.5.0 | TBD | Phase 3 — TBR & Wishlist |
| v0.6.0 | TBD | Phase 4 — Discovery & Collections |
| v1.0.0 | TBD | Phase 5 — Full Obsidian replacement complete |

---

*Last updated: December 17, 2025*
