# Liminal Product Roadmap

## Vision Statement

Liminal is a personal reading companion that eliminates the friction of managing an ebook library across multiple systems. It provides a single, mobile-friendly home for browsing, tracking, discovering, and reflecting on books — both owned and wished for — so that the reader can spend less time managing and more time in the liminal space of reading.

---

## Current State (v0.12.0)

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
- **Multiple reading sessions** — Track re-reads with separate dates/ratings
- **Reading History display** — "Read #1", "Read #2" with dates and ratings
- **Session editor modal** — Add/edit/delete reading sessions
- **Times Read & Average Rating** — Cumulative stats from all sessions
- **Custom status labels** — Apply throughout app including Reading History
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
- **Home Dashboard** — Currently Reading, Recently Added, Discover, Quick Reads, Stats
- **Search modal (mobile)** — Full-screen search with live results
- **Inline search (desktop)** — Search bar between toggle and filter
- **New sort options** — Recently Added (default), Title A-Z, Author A-Z, Recently Published
- **Numeric-first title sort** — "4-Hour Chef" before "10 Things"
- **Activity bars** — Visual indicator on in-progress book covers
- **Reading stats** — Words read, reading time, titles finished with category breakdown
- **Enhanced metadata extraction** — Fandom, ships, characters, ratings from AO3 EPUBs ✨
- **Rescan metadata** — Re-extract enhanced data from existing library ✨
- **Contextual tag display** — "Tropes" for FanFiction, "Genre" for published books ✨
- **Source URL display** — Clickable links to original Wattpad/AO3 sources ✨
- **Publisher/ISBN display** — For published books ✨
- **Completion status badges** — WIP/Complete/Abandoned indicators ✨

---

## Phase 7.0: Enhanced Metadata Extraction ✅ COMPLETE

**Completed: December 31, 2025**

### Database Schema ✅
- ✅ **fandom** — Extracted from AO3 dc:subject tags
- ✅ **relationships** — JSON array of ships
- ✅ **characters** — JSON array from relationship parsing
- ✅ **content_rating** — Explicit/Mature/Teen/General
- ✅ **ao3_warnings** — JSON array of archive warnings
- ✅ **ao3_category** — JSON array (F/M, M/M, F/F, etc.)
- ✅ **isbn** — From published book metadata
- ✅ **publisher** — From dc:publisher
- ✅ **chapter_count** — From EPUB manifest

### Backend: Extraction Logic ✅
- ✅ **AO3 tag parser** — Separates fandom/ships/characters/tropes
- ✅ **Source type detection** — ao3, fanficfare, fichub, calibre
- ✅ **Source URL extraction** — From FanFicFare downloads
- ✅ **Calibre series extraction** — From calibre:series meta tag
- ✅ **Completion status detection** — From tags/summary patterns
- ✅ **Chapter count** — From manifest analysis

### Rescan Feature ✅
- ✅ **POST /sync/rescan-metadata** — Bulk re-extraction endpoint
- ✅ **GET /sync/rescan-metadata/preview** — Pre-scan statistics
- ✅ **Settings UI** — "Enhanced Metadata" section with button
- ✅ **User edit protection** — Only fills NULL fields
- ✅ **Concurrency protection** — Prevents sync/rescan conflicts

### BookDetail Display ✅
- ✅ **MetadataRow component** — Responsive label/value layout
- ✅ **TagChip component** — Color variants for different data types
- ✅ **FanFiction display** — Fandom, Rating, Ships, Characters, Warnings, Tropes
- ✅ **Fiction/Non-Fiction display** — Publisher, ISBN, Genre
- ✅ **Source URL links** — Clickable, truncated display
- ✅ **Completion status badges** — Color-coded indicators

### Results
- ✅ **657 books** with fandom extracted
- ✅ **56 books** with source URLs
- ✅ Clean character extraction (no false positives)

---

## Phase 7.1: Enhanced Metadata Improvements ← NEXT

**Goal:** Complete the enhanced metadata system with editing and upload integration.

### Upload Flow Integration
- [ ] **Enhanced extraction on upload** — New uploads get fandom/ships/etc. automatically
- [ ] Update `upload_service.py` to use enhanced extraction
- [ ] Pass all new fields when creating title records

### Metadata Editing
- [ ] **Edit fandom** — Inline edit on BookDetail
- [ ] **Edit ships** — Add/remove relationship chips
- [ ] **Edit characters** — Add/remove character chips
- [ ] **Edit content rating** — Dropdown selector
- [ ] **Edit warnings** — Multi-select
- [ ] **Edit tags/tropes** — Add/remove tag chips
- [ ] **Edit source URL** — Text input
- [ ] **Edit completion status** — Dropdown (Complete/WIP/Abandoned/Hiatus)

### Per-Book Rescan
- [ ] **"Rescan this book" button** — Force re-extract from EPUB
- [ ] Overwrites existing data (unlike bulk rescan)
- [ ] Useful when EPUB is updated/fixed

### Filter by Enhanced Fields
- [ ] **Filter by fandom** — Dropdown or searchable
- [ ] **Filter by content rating** — Checkboxes
- [ ] **Filter by completion status** — Checkboxes
- [ ] **Filter by ships** — Searchable

---

## Phase 7.2: Discovery & Collections

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
- [x] ~~Clear search button (X icon)~~ ✅


---

## Phase 8: Integration & Polish

**Goal:** Streamline workflows. Reduce remaining friction points.

### Book Detail Enhancements
- [ ] **Download link** — Make stored book location a clickable download link (prefer EPUB, fallback to MOBI)
- [x] ~~**Edit/add tags**~~ ✅ (Covered in Phase 7.1)
- [ ] **"In Library" / "In Wishlist" banner** — Show status banner on book detail screen
- [ ] **Move "Referenced by" to Details tab (mobile)** — Backlinks currently on Notes tab, should be on Details

### Cover Improvements
- [x] ~~Match Obsidian plugin gradient style~~ ✅
- [ ] Extract actual covers from EPUB files
- [ ] Ability to upload custom covers
- [ ] Series info displayed on cover
- [ ] Theme-based cover generation

### Metadata Extraction (Enhanced)
- [x] ~~**Extract series from ebooks**~~ ✅ (Calibre series extraction)
- [x] ~~**Extract fanfiction URL from ebooks**~~ ✅ (Source URL extraction)
- [x] ~~**Extract publication year from EPUB**~~ ✅ (Already existed)
- [x] ~~**Extract tags from EPUB**~~ ✅ (Enhanced tag parsing)
- [x] ~~**Extract source URL from EPUB**~~ ✅ (Source URL extraction)

### UI Polish
- [x] ~~Clear search button (X icon)~~ ✅
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
- [ ] **Upload flow missing enhanced extraction** — New uploads don't get fandom/ships/etc. (workaround: run Rescan after upload)

### Medium Priority
- [ ] **Word count extraction fails for some EPUBs** — "MONEY Master the Game" by Tony Robbins shows 116 words instead of ~200,000+. The metadata extraction fix (Phase 6.3) resolved most books but not all. Needs investigation:
  - Check if EPUB structure uses non-standard paths (encrypted content, DRM artifacts, unusual nesting)
  - Check if content is in formats other than HTML/XHTML (e.g., pure XML, PDF-in-EPUB)
  - Test extraction locally with `python backend/services/metadata.py /path/to/book.epub`
  - Consider adding fallback: estimate from file size if word count extraction fails
  - Related: Some PDFs may have similar issues with text extraction
- [ ] Folder name parsing too strict on dash separator
- [x] ~~Sort direction unclear (no visual indicator)~~ ✅ (now shows ↑ arrow)
- [ ] Status filter on Series page
- [ ] Redundant title below covers
- [ ] Storage location display and validation
- [ ] Mobile notes editor scrollbar (cosmetic)
- [ ] **BISAC codes showing as genre** — Some Calibre books show codes like "bus041000" instead of readable genre names

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
| v0.10.0 | Dec 30, 2025 | **Phase 5.3** — Reading sessions, multiple re-reads |
| v0.11.0 | Dec 30, 2025 | **Phase 6** — Library Home Screen, search redesign, sort options |
| v0.12.0 | Dec 31, 2025 | **Phase 7.0** — Enhanced metadata extraction, AO3 parsing ✨ |
| v0.13.0 | TBD | Phase 7.1 — Metadata editing, upload integration |
| v0.14.0 | TBD | Phase 7.2 — Discovery & Collections |
| v0.15.0 | TBD | Phase 8 — Integration & Polish |
| v1.0.0 | TBD | Phase 9 — Full Obsidian replacement complete |

---

*Last updated: December 31, 2025 (v0.12.0 — Phase 7.0 complete)*
