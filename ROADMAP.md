# Liminal Product Roadmap

## Vision Statement

Liminal is a personal reading companion that eliminates the friction of managing an ebook library across multiple systems. It provides a single, mobile-friendly home for browsing, tracking, discovering, and reflecting on books – both owned and wished for – so that the reader can spend less time managing and more time in the liminal space of reading.

---

## Current State (v0.4.0)

**What Liminal can do today:**
- Scan books from NAS storage (single folder structure)
- Display library with **rich gradient covers** (10 presets, HSL color lanes, vignettes)
- **Collapsible filter header** – Scroll down to hide, scroll up to reveal
- **Poetic category phrases** – "780 what-ifs. Explore freely."
- **Filter state persistence** – URL params preserve filters across navigation
- **Unified filter bar** – Categories, status, tags, sort on one row (centered)
- **Series tab** – Browse series with square gradient covers
- **Series detail pages** – View all books in a series
- **Tag filtering** – Multi-select tags with searchable modal
- **Active filters row** – Clear individual filters or all at once
- Search and filter by category, status, tags
- Sort by title, author, series, year, recently updated
- Scroll through full library (1689+ books)
- View book detail page with full metadata
- **Track read status** (Unread, In Progress, Finished, DNF)
- **Rate books 1-5 stars** with custom labels
- **Track reading dates** (started, finished)
- **Finished checkmark** on book covers
- **Series section on book detail** – Navigate between books in series
- Edit book category via dropdown
- Auto-detect FanFiction based on metadata patterns
- Add free-form notes to books
- Mobile-responsive design
- **Import reading data from Obsidian** (status, rating, dates)

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

## Phase 1: Replace Obsidian (Core Tracking) ✅ COMPLETE

**Goal:** Stop using Obsidian for day-to-day library management.

**Completed: December 19, 2025**

### Read Status System ✅
- [x] Add status field to database: Unread, In Progress, Finished, DNF
- [x] Status selector dropdown on detail page
- [x] Status indicator badge on book covers (checkmark for Finished)
- [x] Filter library by status

### Rating System ✅
- [x] 1-5 rating field on detail page
- [x] Custom labels: Disliked, Disappointing, Decent/Fine, Better than Good, All-time Fav
- [x] Display rating on detail page with stars

### Reading Dates ✅
- [x] Date started field (manual entry)
- [x] Date finished field (manual entry)
- [x] Display on detail page with native date pickers

### Series Improvements ✅
- [x] Library UI redesign – Full-width search, nav tabs, category pills, unified filter bar
- [x] Series tab in navigation – Separate view for browsing series
- [x] Series Library View – Grid of series with square covers (gradient from book #1)
- [x] Series Detail Page – Series info, book list in order with links
- [x] Series section on Book Detail – List other books in series, highlight current, link to each

### Tags That Work ✅
- [x] Filter library by tags via modal
- [x] Multi-tag selection with checkboxes
- [x] Searchable tag list with counts
- [x] Active filters row with individual clear and clear all

### Milestone ✅
You can now open Liminal on your phone, browse your library, mark books as read/DNF/in-progress, rate them, track when you read them, browse by series, and filter by tags – all without touching Obsidian.

---

## Phase 1.5: Obsidian Data Migration ✅ COMPLETE

**Goal:** Import existing reading data from Obsidian book notes into Liminal.

**Completed: December 20, 2025**

### Import System ✅
- [x] Add `/api/import/preview` endpoint – Parse Obsidian markdown files
- [x] Add `/api/books/match` endpoint – Find books by title/author with confidence scoring
- [x] Add `/api/import/apply` endpoint – Batch update matched books
- [x] Drag-and-drop file upload UI
- [x] Confidence-based matching with visual indicators
- [x] Batch import with progress feedback

### Parser Features ✅
- [x] YAML frontmatter extraction (including multi-line lists)
- [x] Status detection (read, DNF, finished indicators)
- [x] Rating extraction (multiple formats: "5/5", "4 (Better than good)", etc.)
- [x] Date parsing (multiple formats: "7/19/2025", "2025-07-19", ISO datetime)
- [x] Author extraction from both `author` and `authors` keys

### Migration Results
- **317 books matched** and imported successfully
- **35 books unmatched** – physical/audiobook only (no ebook file)
- **6 partial matches** – manually corrected spelling/naming issues
- **4 collection notes** – set aside for Phase 5 Collections feature

### Milestone ✅
Reading history from Obsidian is now in Liminal. Status, ratings, and dates are populated for 317 books.

---

## Phase 2: Book Uploader ← NEXT (MOVED UP FROM PHASE 5)

**Goal:** Add books to library directly through Liminal, eliminating the need for external upload tools.

**Priority:** HIGH (Moved up due to broken standalone uploader after NAS folder restructure)

**Timeline:** 2-3 days

### Smart Upload System
- [ ] **Multi-file upload** – Select multiple files at once from phone Downloads
- [ ] **Drag-and-drop** (desktop) – Drop files into upload zone
- [ ] **Mobile file picker** – Native Android file picker with all file types
- [ ] **Smart file grouping** – Auto-group fanfic formats (EPUB+PDF+MOBI+AZW3+HTML) into single book
- [ ] **Batch upload** – Upload 10 files → Auto-groups into 4 books → Review → Done
- [ ] **Mixed uploads** – Fanfic (multi-file) + regular books (single file) in same session

### Metadata & Category Detection
- [ ] **Category auto-detection** – FanFiction/Fiction/Non-Fiction with confidence scoring
- [ ] **Manual override** – Category dropdown per book (edit before upload)
- [ ] **Metadata extraction** – Reuse existing EPUB/PDF/MOBI parsers
- [ ] **Smart defaults** – Auto-fill author/title/series from metadata
- [ ] **Inline editing** – Edit metadata before finalizing upload

### Duplicate Handling
- [ ] **Enhanced duplicate detection** – Distinguish "new format" from "exact duplicate"
- [ ] **Smart actions** – Skip duplicates, add new formats, or replace existing
- [ ] **Visual warnings** – Show which files exist, which are new
- [ ] **User choice** – Control duplicate behavior per file

### Progress & Feedback
- [ ] **Upload progress** – Per-book and overall progress bars
- [ ] **Success summary** – List all uploaded books with links
- [ ] **Error recovery** – Retry failed uploads, skip problematic files
- [ ] **Navigation** – "View Library" or "Upload More" after completion

### Workflow Improvements
- [ ] **One session** – Upload entire Downloads folder (10+ files) at once
- [ ] **2-minute workflow** – vs 15 minutes with old uploader
- [ ] **Mobile-optimized** – 95% of uploads happen on phone
- [ ] **All formats supported** – EPUB, PDF, MOBI, AZW3, HTML

### Technical
- [ ] Server-side file validation
- [ ] Session-based temp storage (1-hour timeout)
- [ ] Auto-trigger Liminal sync after upload
- [ ] 100MB per file, 500MB per batch limits

### Milestone
When Phase 2 is complete, you can upload books directly from your phone's Downloads folder in one quick session. No more external uploader, no more multiple sessions, no more friction.

---

## Phase 3: Rich Notes & Metadata (MOVED FROM PHASE 2)

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
- [ ] **Edit title** – Fix incorrect titles
- [ ] **Edit author(s)** – Fix misspellings, add missing authors
- [ ] **Edit series** – Add, change, or remove series assignment
- [ ] **Edit series number** – Fix ordering
- [ ] Edit publication year
- [ ] HTML entity decoding in summaries (fix &amp; etc.)
- [ ] "Added to library" date (pulled from file system)
- [ ] Storage location display and validation

### Book Detail Page Redesign
- [ ] **Clean up visual layout** – Current page is chaotic
- [ ] Logical grouping of metadata
- [ ] Better use of space
- [ ] Mobile-optimized layout
- [ ] Consistent styling with library view

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

### Simple Author Page
- [ ] Basic author page (name + notes)
- [ ] **Author notes** – free-form notes about an author
- [ ] Link from book detail page (click author name → author page)
- [ ] List of books by this author (simple list, not full grid)

### Milestone
When Phase 3 is complete, Liminal holds all the rich reading data you currently keep in Obsidian – including structured notes with section ratings. You can fully retire Obsidian for books.

---

## Phase 4: TBR & Wishlist

**Goal:** Track books you want, not just books you have.

### Manual Book Entry
- [ ] **Add books without files** – Track physical books, audiobooks, books you no longer have
- [ ] Manual entry form: title, author, series, category
- [ ] Mark as "No ebook" or "Physical only"
- [ ] Still track reading status, rating, dates, notes

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
When Phase 4 is complete, you have one place to track both "books I have" and "books I want." No more scattered lists across phone, laptop, and random apps.

---

## Phase 5: Discovery & Collections (MOVED FROM PHASE 4)

**Goal:** Rediscover your library. Find your next read with joy.

### Multi-Series Support
- [ ] **Books can belong to multiple series** – e.g., "Six of Crows" is both "Six of Crows #1" AND "Grishaverse #4"
- [ ] Database schema: `book_series` junction table (many-to-many)
- [ ] UI for managing multiple series assignments
- [ ] Display all series on book detail page
- [ ] Filter by any series the book belongs to

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
- [ ] **Import Obsidian collection notes** (4 notes set aside from Phase 1.5)

### Series Pages (Enhanced)
- [ ] **Series mosaic covers** – 4-book grid image instead of gradient
- [ ] **Progress bar on series cover** – Visual completion indicator
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
When Phase 5 is complete, Liminal helps you *discover* your next read, not just *find* it. The library becomes a source of joy, not just storage.

---

## Phase 6: Integration & Polish (MOVED FROM PHASE 5, MINUS UPLOADER)

**Goal:** Streamline workflows. Reduce remaining friction points.

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
- [x] ~~Match Obsidian plugin gradient style~~ ✅ Completed December 20, 2025
- [ ] Extract actual covers from EPUB files
- [ ] Ability to upload custom covers
- [ ] Series info displayed on cover: "(ROYAL ELITE 4)"
- [ ] Theme-based cover generation (genre-appropriate colors)

### UI Polish
- [ ] Clear search button (X icon)
- [ ] Rows per page setting
- [ ] Loading states and animations
- [ ] Error handling improvements

### Advanced Upload Features (Phase 2 enhancements)
- [ ] Background uploads (continue upload if user leaves page)
- [ ] Upload queue management
- [ ] Resume interrupted uploads
- [ ] PWA notifications for upload completion

### Milestone
When Phase 6 is complete, Liminal is a polished, self-contained system. All book-related workflows happen in one place.

---

## Phase 7: AI Enhancements (MOVED FROM PHASE 6)

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

- **Calibre integration** – You have a good folder structure already
- **Social features** – Sharing, friend recommendations, book clubs
- **In-app reading** – Moon Reader handles this well
- **Audiobook support** – Different workflow, different app
- **Library lending/borrowing tracking** – Edge case

These can be revisited once the core experience is solid.

---

## Development Principles

1. **Mobile-first** – Every feature should work great on Android
2. **Single source of truth** – Liminal is THE place for book data
3. **Reduce friction** – If it takes more than 2 taps, simplify it
4. **Data integrity** – Never lose user's notes or reading history
5. **Offline-capable** – Core features should work without internet (future PWA)

---

## Technical Debt & Bugs

Track known issues that need fixing:

### Parsing Issues
- [ ] **Folder name parsing too strict on dash separator** – Parser requires ` - ` (space-dash-space) but some folders use `- ` (dash-space without leading space). Example: `River Ramsey, Harper Lennox- [Fameverse 01] Claimed by the Band` parses incorrectly.
  - *Fix:* Update `parse_folder_name()` regex to accept optional space before dash
  - *Affected:* sync.py
  - *Priority:* Low (3 books affected, can fix via folder rename)

### UX Issues
- [x] ~~Filter/sort state doesn't persist~~ ✅ Fixed December 20, 2025 (URL params)
- [ ] **Sort direction unclear** – No visual indicator if sorting asc or desc (add ↑↓ arrows)
- [ ] **Status filter on Series page** – Filter series by reading status (e.g., "In Progress" series, "Completed" series)
- [ ] **Redundant title below covers** – Title shown on cover AND below card; remove text below for cleaner look

### Display Issues
- [ ] HTML entities not decoded in summaries (&amp; showing)

### Sync Issues
- [ ] Sync Library button in UI not working for new books
- [ ] Some non-book files (.indd) getting scanned

---

## Version History

| Version | Date | Milestone |
|---------|------|-----------|
| v0.1.0 | Dec 14, 2025 | Initial release – Library browsing, search, detail pages |
| v0.1.1 | Dec 16, 2025 | Single folder migration, category preservation |
| v0.1.2 | Dec 17, 2025 | Phase 0 complete – Editable categories, fanfic auto-detection |
| v0.2.0 | Dec 17, 2025 | Phase 1 core tracking – Status, ratings, dates |
| v0.3.0 | Dec 19, 2025 | Phase 1 complete – Series system, tag filtering, unified UI |
| v0.4.0 | Dec 20, 2025 | **Phase 1.5 complete** – Obsidian import, rich gradients, collapsible header |
| v0.5.0 | TBD | **Phase 2** – Book uploader (MOVED UP) |
| v0.6.0 | TBD | Phase 3 – Rich notes & metadata |
| v0.7.0 | TBD | Phase 4 – TBR & Wishlist |
| v0.8.0 | TBD | Phase 5 – Discovery & Collections |
| v0.9.0 | TBD | Phase 6 – Integration & Polish |
| v1.0.0 | TBD | Phase 7 – Full Obsidian replacement complete |

---

## Roadmap Changes (December 20, 2025)

**Phase reshuffle rationale:**
- Standalone book uploader broke after NAS folder restructure (no category subfolders)
- Quick fix deployed to unblock immediate uploads
- Full solution moved up from Phase 5 → Phase 2 due to critical workflow blocker
- Book uploading is essential for library management (can't add books = can't use Liminal)
- Original Phase 2 content (Rich Notes) moved to Phase 3 – no dependencies affected

**What this means:**
- v0.5.0 will be the book uploader, not rich notes
- Timeline unchanged (same 2-3 day estimate)
- All other phases shifted down by one number
- v1.0.0 milestone extended to include Phase 7

---

*Last updated: December 20, 2025 (Roadmap reshuffled: Phase 2 uploader moved up)*
