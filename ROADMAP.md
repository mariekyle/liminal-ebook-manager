# Liminal Product Roadmap

## Vision Statement

Liminal is a personal reading companion that eliminates the friction of managing an ebook library across multiple systems. It provides a single, mobile-friendly home for browsing, tracking, discovering, and reflecting on books - both owned and wished for - so that the reader can spend less time managing and more time in the liminal space of reading.

---

## Current State (v0.1)

**What Liminal can do today:**
- Scan books from NAS storage (single folder structure)
- Display library with gradient covers
- Search and filter by category
- Sort by title
- Scroll through full library (1688+ books)
- View book detail page with metadata (title, author, series, year, word count, summary, tags)
- Add free-form notes to books
- Mobile-responsive design
- Text shadows on covers for readability
- Match existing books by title+author when folder paths change (preserves categories during migrations)

---

## Phase 0: Foundation (Storage Migration)

**Goal:** Simplify storage structure and make categorization a metadata field instead of folder-based.

### Why This Matters
The current architecture requires books to be organized in Fiction/Non-Fiction/FanFiction subfolders, with category inferred from folder location. This is:
- Fragile (misplaced books get wrong category)
- Inflexible (arbitrary constraint for future users)
- Legacy (designed around Obsidian limitations)

Moving to a single folder with category as editable metadata is a cleaner foundation before building Phase 1+ features.

### Migration Steps

**Step 1: Preserve Existing Categories**
- [x] Run full sync to ensure all books and current categories are in database
- [x] Verify book count matches expectations (1688 books)
- [x] Back up database file before proceeding

**Step 2: Update Backend for Single Folder**
- [x] Modify docker-compose.yml to mount single /books path (was already configured correctly)
- [x] Update sync.py to scan one folder instead of three
- [x] For existing books (matched by title+author), preserve current category
- [x] For new books, default to "Uncategorized"

**Step 3: Add FanFiction Auto-Detection**
- [ ] Detect AO3 patterns in EPUB metadata (fandom tags, ship tags, "fanworks")
- [ ] Auto-assign "FanFiction" category when patterns detected
- [ ] Log detection reasoning for debugging

**Step 4: Make Category Editable**
- [ ] Add category dropdown to book detail page
- [ ] Options: Fiction, Non-Fiction, FanFiction, Uncategorized
- [ ] Allow custom categories in future (Phase 4)

**Step 5: Migrate Files** *(Completed before Step 2)*
- [x] Move all books from subfolders into single /Books folder
- [x] Run sync to update file paths in database
- [x] Verify all books still accessible and categories preserved
- [x] Remove empty Fiction/Non-Fiction/FanFiction folders

### Technical Notes

**FanFiction Detection Heuristics:**
- Tags containing: "fanworks", "ao3", fandom names, character ship patterns (name/name or name-name)
- Author names matching username patterns (underscores, numbers, no spaces)
- Summary containing "fic", "fandom", "canon"

**Database Impact:**
- No schema changes needed
- Category field already exists as text
- File paths will update but book IDs remain stable

**Rollback Plan:**
- Keep database backup from Step 1
- If migration fails, restore backup and revert code changes
- Files can be moved back to subfolders if needed

### Milestone
When Phase 0 is complete, all books live in a single folder, categories are stored as metadata, and the foundation is set for all future features. New users can point Liminal at any folder of books without needing a specific structure.

---

## Phase 1: Replace Obsidian (Core Tracking)

**Goal:** Stop using Obsidian for day-to-day library management.

### Read Status System
- [ ] Add status field to database: Unread, In Progress, Finished, DNF
- [ ] Status selector dropdown on detail page
- [ ] Status indicator badge on book covers in library view
- [ ] Filter library by status

### Rating System
- [ ] 1-5 rating field on detail page
- [ ] Custom labels: 1=Disliked, 2=Disappointing, 3=Decent/Fine, 4=Better than Good, 5=All-time Fav
- [ ] Display rating on detail page and optionally on cover

### Reading Dates
- [ ] Date started field (manual entry)
- [ ] Date finished field (manual entry)
- [ ] Display on detail page

### Series Improvements
- [ ] Series detail page (view all books in a series, in order)
- [ ] Browse/filter by series in library
- [ ] Show series name + number on gradient covers (replace title)
- [ ] Series number sorting

### Tags That Work
- [ ] Filter library by tags
- [ ] Multi-tag selection
- [ ] Basic tag management (view all tags, see count per tag)

### Milestone
When Phase 1 is complete, you can open Liminal on your phone, browse your library, mark books as read/DNF/in-progress, rate them, and track when you read them - without touching Obsidian.

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

### Reading Stats
- [ ] Actual WPM field (manual entry from Mood Reader)
- [ ] Actual read time field
- [ ] Estimated read time (calculated from word count + average WPM setting)

### Settings Screen
- [ ] Average WPM setting (for read time estimates)
- [ ] Display preferences (show/hide on covers: author, title, series)
- [ ] Rows displayed in library grid

### Metadata Improvements
- [ ] Editable metadata (title, author, series, year, etc.)
- [ ] HTML entity decoding in summaries (fix &amp; etc.)
- [ ] "Added to library" date (pulled from file system)
- [ ] Storage location display and validation

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
- [ ] Multi-filter: combine status + category + tags + rating
- [ ] Complex queries: "Unread 5-star fiction", "DNF fanfiction"
- [ ] Sort by: date added, date read, rating, title, author, series
- [ ] Sort direction toggle (asc/desc)
- [ ] Clear search button (X icon)

### Collections
- [ ] Manual collections (curated lists: "Beach Reads", "Comfort Rereads")
- [ ] Smart collections (auto-populate based on rules)
- [ ] Collection cover (mosaic of book covers or custom)

### Author Pages
- [ ] Author detail page
- [ ] View all books by author
- [ ] Author statistics (books owned, books read, average rating)

### Statistics Dashboard
- [ ] Books read per month/year (charts)
- [ ] Reading by category/genre breakdown
- [ ] Average rating given
- [ ] Total books, total read, completion percentage
- [ ] Reading streak/pace

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
- [ ] Fix re-scan (currently broken beyond initial scan)
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

*Screenshots saved:* December 14, 2025 - Obsidian plugin covers showing desired style

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

- **Calibre integration** - You have a good folder structure already
- **Social features** - Sharing, friend recommendations, book clubs
- **In-app reading** - Mood Reader handles this well
- **Audiobook support** - Different workflow, different app
- **Library lending/borrowing tracking** - Edge case

These can be revisited once the core experience is solid.

---

## Development Principles

1. **Mobile-first** - Every feature should work great on Android
2. **Single source of truth** - Liminal is THE place for book data
3. **Reduce friction** - If it takes more than 2 taps, simplify it
4. **Data integrity** - Never lose user's notes or reading history
5. **Offline-capable** - Core features should work without internet (future PWA)

---

## Technical Debt & Bugs

Track known issues that need fixing:

### Parsing Issues
- [ ] **Folder name parsing too strict on dash separator** - Parser requires ` - ` (space-dash-space) but some folders use `- ` (dash-space without leading space). Example: `River Ramsey, Harper Lennox- [Fameverse 01] Claimed by the Band` gets parsed as title with "Unknown Author" instead of recognizing the authors.
  - *Fix:* Update `parse_folder_name()` regex to accept optional space before dash
  - *Affected:* sync.py lines 40-70
  - *Priority:* Medium (3 books currently affected)

### Display Issues
- [ ] HTML entities not decoded in summaries (&amp; showing)
- [ ] Sort options don't clearly indicate direction
- [ ] Book "added date" doesn't reflect actual file date

### Sync Issues
- [ ] Sync only works on initial scan (re-scan broken) - *Note: May be fixed with Phase 0 changes, needs verification*
- [ ] Some non-book files (.indd) getting scanned

---

## Suggested Implementation Order

**Start with Phase 0 (Foundation), then Phase 1:**

### Phase 0 - Do First
1. ~~**Backup & sync**~~ ✅ Complete (Dec 16, 2025)
2. ~~**Single folder support**~~ ✅ Complete (Dec 16, 2025)
3. **FanFiction auto-detect** - Smart categorization for new books ← *Next*
4. **Category editable** - Allow manual corrections
5. ~~**Migrate files**~~ ✅ Complete (Dec 16, 2025)

### Phase 1 - Core Tracking
1. **Read status** - Biggest daily impact
2. **Status filter** - Make status useful immediately
3. **Rating system** - Quick to add, high value
4. **Reading dates** - Complete the tracking trifecta
5. **Series improvements** - Important for your reading flow

**Why this order?** Phase 0 creates a clean foundation that doesn't depend on folder structure. Then Phase 1 tackles daily friction - the moment you can track read status, ratings, and dates on mobile, you've solved 80% of your pain points.

---

## Version History

| Version | Date | Milestone |
|---------|------|-----------|
| v0.1.0 | Dec 2025 | Initial release - Library browsing, search, detail pages |
| v0.1.1 | Dec 16, 2025 | Phase 0 partial - Single folder support, category preservation during path migration |
| v0.2.0 | TBD | Phase 0 complete + Phase 1 - Core tracking (status, ratings, dates) |
| v0.3.0 | TBD | Phase 2 - Rich notes & metadata |
| v0.4.0 | TBD | Phase 3 - TBR & Wishlist |
| v0.5.0 | TBD | Phase 4 - Discovery & Collections |
| v1.0.0 | TBD | Phase 5 - Full Obsidian replacement complete |

---

## Completed Work Log

### December 16, 2025 - Phase 0 Migration
**Changes made:**
- Updated `sync.py` to support single folder scanning
- Added `find_existing_book_by_content()` function to match books by title+author when paths change
- Modified category logic: preserve existing categories, default new books to "Uncategorized"
- Added guard against "Unknown Author" content matching to prevent false matches

**Results:**
- 1688 books successfully migrated
- 0 duplicates created
- All existing categories preserved
- 3 books in "Uncategorized" (new or parsing issues)

---

*Last updated: December 16, 2025*
