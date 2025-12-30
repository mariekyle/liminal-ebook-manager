# Liminal Product Roadmap

## Vision Statement

Liminal is a personal reading companion that eliminates the friction of managing an ebook library across multiple systems. It provides a single, mobile-friendly home for browsing, tracking, discovering, and reflecting on books — both owned and wished for — so that the reader can spend less time managing and more time in the liminal space of reading.

---

## Current State (v0.10.0)

**What Liminal can do today:**
- Scan books from NAS storage (single folder structure)
- Upload new books directly from mobile or desktop
- Extract metadata from EPUB/PDF files (author, title, summary, tags)
- All ebook formats work on mobile (.epub, .pdf, .mobi, .azw3, .azw, .html)
- Smart FanFiction detection from filename patterns (AO3, FFN, tropes)
- Override false duplicate matches with "Upload as New" option
- Display library with rich gradient covers (10 presets, HSL color lanes, vignettes)
- **Mobile bottom navigation** — Fixed nav bar with Library, Series, Authors, Add
- **Desktop header navigation** — Centered nav tabs on single line
- **Filter drawer** — Slides up on mobile, slides from right on desktop
- **Unified search bar** — Combined search input and filter icon
- **Library toggle bar** — Home / Browse / Wishlist tabs
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
- **Sort inline with count** — Sort dropdown next to book/series count
- Sort by title, author, series, year, recently updated (case-insensitive)
- **Books per row setting** — Choose 2, 3, or 4 columns on mobile
- Scroll through full library (1700+ books)
- View book detail page with full metadata
- **Horizontal desktop layout** — Cover left, content right
- **Mobile tab navigation** — Details / Notes / History tabs
- Edit book metadata — Title, authors, series, category, year
- Draggable author chips — Reorder authors, first appears on cover
- Author autocomplete — Suggests existing authors when editing
- **Series autocomplete** — Suggests existing series when editing
- Track read status (Unread, In Progress, Finished, DNF)
- Rate books 1-5 stars with custom labels
- **Multiple reading sessions** — Track re-reads with separate dates/ratings ✨
- **Reading History display** — "Read #1", "Read #2" with dates and ratings ✨
- **Session editor modal** — Add/edit/delete reading sessions ✨
- **Times Read & Average Rating** — Cumulative stats from all sessions ✨
- **Custom status labels** — Apply throughout app including Reading History ✨
- Estimated read time — Based on word count and WPM setting
- Finished checkmark on book covers
- **Finished checkmarks on author pages**
- Series section on book detail — Navigate between books in series
- Auto-detect FanFiction based on metadata patterns
- **Full-screen notes editor** — Distraction-free writing
- **Note templates** — Structured Review, Reading Notes
- **Book linking** — Type `[[` to search and link books
- **Rendered markdown** — Notes display with formatting in read mode
- **Backlinks** — "Referenced by" shows which books link to current book
- **251 book notes imported from Obsidian**
- Author notes — Free-form notes about any author
- Author rename — Update author name across all books
- Settings drawer — WPM, grid columns, status labels, sync controls
- "Added to library" date — Shows when book was added
- Mobile-responsive design
- Import reading data from Obsidian (status, rating, dates, notes)
- **Wishlist system** — Track books you want to read
- **Wishlist priority** — Mark items as High or Normal priority
- **WISHLIST banner** — Clear indicator on book detail page
- **Wishlist styling** — Dotted border + bookmark icon in library
- **Manual Book Entry** — Add physical, audiobook, or web-based books
- **Multiple Authors** — Add multiple authors with autocomplete
- **Familiar Title Detection** — Upload warns when title matches existing book
- **"I got this book!" flow** — Convert wishlist to owned with format selection
- **Title autocomplete** — Wishlist form warns of duplicate titles
- **Author autocomplete** — Wishlist form suggests existing authors
- **Series autocomplete** — Wishlist form suggests existing series
- **Smart author replacement** — Autocomplete fixes capitalization

---

## Phase 5: TBR & Manual Entry ✅ COMPLETE

**Completed: December 27-28, 2025**

### Manual Book Entry ✅
- ✅ **Add books without files** — Track physical books, audiobooks, web-based
- ✅ **Manual entry form** — Title, author(s), series, category
- ✅ **Format selection** — Physical, Audiobook, Web/URL
- ✅ **Multiple authors** — Add multiple authors with chip display
- ✅ **Author autocomplete** — Suggests existing library authors
- ✅ **Completion status** — Track WIP/Abandoned for fanfiction
- ✅ **Source URL** — Store AO3/FFN URLs

### TBR List ✅
- ✅ **Separate TBR tab** — New tab in bottom navigation
- ✅ **TBR entry form** — Title, author, series, category
- ✅ **"Why I want to read this" field** — Free-form reason
- ✅ **Source URL field** — Store where you found it
- ✅ **Priority** — High or Normal priority

### TBR → Library Flow ✅
- ✅ **"I got this book!" action** — Convert TBR to library
- ✅ **Format selection modal** — Ebook, Physical, Audiobook, Web-based
- ✅ **Preserve notes/metadata** — Source URL and completion status kept

### Upload Enhancements ✅
- ✅ **Familiar title detection** — Warns when uploading title that exists
- ✅ **"Add to Existing" option** — Add files to existing title
- ✅ **"Add as Separate" option** — Override to create new entry

---

## Phase 5.1: Wishlist Unification ✅ COMPLETE

**Completed: December 29, 2025**

### Backend Changes ✅
- ✅ **acquisition_status column** — Tracks 'owned' vs 'wishlist' status
- ✅ **?acquisition= filter** — API parameter for filtering by ownership
- ✅ **Automatic migration** — Existing is_tbr data migrated

### Library Toggle Bar ✅
- ✅ **Home / Browse / Wishlist tabs** — Filter by ownership status
- ✅ **URL persistence** — Toggle state in URL params
- ✅ **Poetic phrases** — Browse tab shows rotating phrases

### BookCard Styling ✅
- ✅ **Dotted border** — Visual distinction for wishlist items
- ✅ **Bookmark icon** — Badge indicator
- ✅ **Full brightness** — No opacity reduction

### BookDetail Redesign ✅
- ✅ **WISHLIST banner** — Clear indicator at top
- ✅ **Horizontal desktop layout** — Cover left, content right
- ✅ **Mobile tab navigation** — Details / Notes / History
- ✅ **Edit icon repositioned** — Upper right corner
- ✅ **Reading History format** — "Read #1: [date] — [date]"
- ✅ **"+ Add dates" button** — When no dates exist

### Navigation Cleanup ✅
- ✅ **TBR tab removed** — From mobile and desktop
- ✅ **/tbr redirect** — Goes to /?acquisition=wishlist

---

## Phase 5.2: Form Autocomplete ✅ COMPLETE

**Completed: December 30, 2025**

### TBRForm Upgrades ✅
- ✅ **Multi-author support** — Chips with remove buttons
- ✅ **Title autocomplete** — Warns of duplicate titles
- ✅ **Author autocomplete** — Suggests existing authors
- ✅ **Series autocomplete** — Suggests existing series
- ✅ **Familiar title warning** — 85% similarity matching
- ✅ **Smart author replacement** — Fixes capitalization from autocomplete

---

## Phase 5.3: Reading Sessions ✅ COMPLETE

**Completed: December 30, 2025**

### Database Changes ✅
- ✅ **reading_sessions table** — Store multiple reads per book
- ✅ **session_number** — Track which read (1st, 2nd, etc.)
- ✅ **per-session dates** — date_started, date_finished (both optional)
- ✅ **per-session rating** — Optional rating for each read
- ✅ **Migrate existing data** — Move current dates/ratings to first session
- ✅ **Smart migration** — Fix 9 books incorrectly marked Unread with data

### Reading History UI ✅
- ✅ **Multiple sessions display** — Show "Read #1", "Read #2", etc.
- ✅ **"+ Add Session" button** — Create new reading session
- ✅ **Edit session** — Modify dates, status, and rating
- ✅ **Delete session** — Remove with confirmation
- ✅ **Session editor modal** — Full-featured edit interface
- ✅ **Status colors** — Green (Finished), Pink (DNF), Gray (In Progress)
- ✅ **Rating stars** — Disabled for in_progress, active for finished/dnf
- ✅ **Custom status labels** — Use labels from Settings throughout

### Cumulative Stats ✅
- ✅ **Times Read** — Count of reading sessions
- ✅ **Average Rating** — Mean of per-session ratings
- ✅ **Display on History tab** — Stats row below sessions

### Edge Cases Handled ✅
- ✅ **Preserve ratings** — Keep existing rating when switching to in_progress
- ✅ **Clear dates** — Allow removing dates from sessions
- ✅ **State reset** — Clear sessions when navigating between books

---

## Phase 6: Library Home Screen ← NEXT

**Goal:** Transform library from a browse-only view to an engaging home experience.

### Library Tabs
- [ ] **Home Tab** — Dashboard view with curated sections
- [ ] **Browse Tab** — Current library grid with filters

### Home Tab Sections
- [ ] **In Progress** — Books currently being read
- [ ] **Recently Added** — Newest titles at the top
- [ ] **Discover** — Random unread books for serendipity
- [ ] **Stats** — Quick reading statistics

### Sort Enhancement
- [ ] **"Updated" sort → "Recently Added"** — Sort by `created_at` descending, newest first

---

## Phase 7: Discovery & Collections

**Goal:** Rediscover your library. Find your next read with joy.

### Collections
- [ ] Manual collections (curated lists)
- [ ] Smart collections (auto-populate based on rules)
- [ ] Collection cover (mosaic or custom)
- [ ] Import Obsidian collection notes

### Statistics Dashboard
- [ ] Books read per month/year
- [ ] Reading by category breakdown
- [ ] Average rating given
- [ ] Total books, total read, completion percentage
- [ ] Reading streak/pace
- [ ] Total reading time

### Author Pages (Enhanced)
- [ ] Author statistics (books read, average rating)
- [ ] Author photo/avatar support
- [x] ~~Finished checkmark on author page book grid~~ ✅
- [ ] **Improved series display** — Series books cluttering author page need better organization
- [ ] **Series grouping option** — Show series cover instead of individual books, or use tabs (Standalone / Series)
- [ ] **Sort by publication date** — Default to newest first
- [ ] **Visual hierarchy** — Cleaner separation between standalone titles and series

### Multi-Series Support
- [ ] Books can belong to multiple series
- [ ] Database schema: `book_series` junction table
- [ ] UI for managing multiple series assignments
- [ ] Display all series on book detail page

### Series Pages (Enhanced)
- [ ] Series mosaic covers
- [ ] Progress bar on series cover
- [ ] Series completion tracking
- [ ] Navigate between books in series (prev/next)

### Smart Filtering
- [ ] Multi-filter: combine status + category + tags + rating + read time
- [ ] Complex queries: "Unread 5-star fiction under 3 hours"
- [ ] Sort direction toggle (asc/desc)
- [ ] Clear search button (X icon)


---

## Phase 8: Integration & Polish

**Goal:** Streamline workflows. Reduce remaining friction points.

### Book Detail Enhancements
- [ ] **Download link** — Make stored book location a clickable download link (prefer EPUB, fallback to MOBI)
- [ ] **Edit/add tags** — Add, remove, or edit tags directly from book detail page
- [ ] **"In Library" / "In Wishlist" banner** — Show status banner on book detail screen

### Cover Improvements
- [x] ~~Match Obsidian plugin gradient style~~ ✅
- [ ] Extract actual covers from EPUB files
- [ ] Ability to upload custom covers
- [ ] Series info displayed on cover
- [ ] Theme-based cover generation

### Metadata Extraction (Enhanced)
- [ ] **Extract series from ebooks** — Parse series info from EPUB/MOBI metadata
- [ ] **Extract fanfiction URL from ebooks** — Parse source URL from AO3/FFN downloads
- [ ] **Extract publication year from EPUB** — For new uploads and existing library
- [ ] **Extract tags from EPUB** — For new uploads and existing library
- [ ] **Extract source URL from EPUB** — For new uploads and existing library

### UI Polish
- [ ] Clear search button (X icon)
- [x] ~~Books per row setting~~ ✅
- [ ] **Sort direction toggle** — Asc/desc option for all sort fields in library view
- [ ] Loading states and animations
- [ ] Error handling improvements
- [ ] "No summary available" notice on book detail page
- [ ] Virtual scrolling for library grid (performance)


### Settings Enhancements
- [ ] Customizable rating labels
- [x] ~~Custom status labels~~ ✅
- [ ] Light/dark mode toggle
- [ ] Display preferences
- [ ] **Cover display settings:**
  - [ ] Show/hide title below cover
  - [ ] Show/hide series below cover
  - [ ] Show/hide author below cover
  - [ ] Show/hide title on cover
  - [ ] Show/hide author on cover
  - [ ] Show/hide series on cover

### Storage & Sync
- [ ] Settings: view/change storage location
- [ ] Sync progress indicator
- [ ] Incremental sync

### Export & Backup
- [ ] Export library as spreadsheet
- [ ] Full database backup/restore
- [ ] Import from spreadsheet


### Advanced Upload Features
- [x] ~~Fix mobile file picker for .mobi/.azw3~~ ✅
- [ ] Background uploads
- [ ] Upload queue management
- [ ] Resume interrupted uploads
- [ ] PWA notifications for upload completion

### Data Import (Low Priority)
- [ ] **In-app notes import UI** — Drag & drop .md files, preview matches, import with confirmation (replaces command-line migration script)

---

## Phase 9: AI Enhancements

**Goal:** Let AI reduce manual work and enhance discovery.

### AI Features
- [ ] Auto-generate "Hot Take" summaries
- [ ] Auto-extract/suggest themes and tags
- [ ] Reading recommendations based on library and ratings
- [ ] Similar book suggestions

---

## Technical Debt & Bugs

### High Priority
- [ ] **PDF duplicates not detected** — Upload screen doesn't detect existing PDFs

### Medium Priority
- [ ] Folder name parsing too strict on dash separator
- [x] ~~Sort direction unclear (no visual indicator)~~ ✅ (now shows → arrow)
- [ ] Status filter on Series page
- [ ] Redundant title below covers
- [ ] Storage location display and validation
- [ ] Mobile notes editor scrollbar (cosmetic)

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
| v0.7.0 | Dec 25, 2025 | Phase 3.5 complete — Navigation redesign, filter drawer, grid settings |
| v0.8.0 | Dec 26, 2025 | Phase 4 complete — Notes enhancement, templates, book linking, backlinks |
| v0.8.1 | Dec 26, 2025 | Phase 4.5 complete — Obsidian notes migration (251 notes) |
| v0.8.2 | Dec 27, 2025 | Custom status labels, finished checkmarks on author pages |
| v0.9.0 | Dec 28, 2025 | **Phase 5** — TBR system, manual entry, familiar title detection |
| v0.9.1 | Dec 29, 2025 | Bug fix — Upload folder structure |
| v0.9.2 | Dec 29, 2025 | Orphan detection system |
| v0.9.3 | Dec 29, 2025 | **Phase 5.1** — Wishlist unification, BookDetail redesign |
| v0.9.4 | Dec 30, 2025 | **Phase 5.2** — Form autocomplete |
| v0.10.0 | Dec 30, 2025 | **Phase 5.3** — Reading sessions, multiple re-reads ✨ |
| v0.11.0 | TBD | Phase 6 — Library Home Screen |
| v0.12.0 | TBD | Phase 7 — Discovery & Collections |
| v0.13.0 | TBD | Phase 8 — Integration & Polish |
| v1.0.0 | TBD | Phase 9 — Full Obsidian replacement complete |

---

*Last updated: December 30, 2025 (v0.10.0 — Reading Sessions complete)*
