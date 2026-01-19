# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 9: Feature Completion (In Progress)
- Phase 9E Core: ✅ Complete (Jan 15-17)
- Phase 9E.5: 🔄 In Progress - Landing page polish, detail page polish, duplicate feature remaining
- Phase 9F: Book detail redesign
- Phase 9G: Library/Home improvements
- Phase 9H: Stats page
- Phase 9I: Collections polish (merged into 9E.5)
- Phase 9J: Deduplication tools
- Phase 9K: Unprocessed files detection

### Technical Debt
- **Browser cache issues with covers** — After editing many book covers, changes may not reflect immediately when navigating between pages. "Use gradient" button may stop responding. Workaround: Clear browser cache for the past hour and close/reopen tab. Root cause likely related to aggressive image caching or IntersectionObserver state management. To investigate in future.

---

## [0.25.1] - 2026-01-17

### Changed

#### Phase 9E.5: TBR Collection Type Change 🎯
Converted default TBR from Checklist to Manual type based on user feedback that checklist behavior felt wrong for a reading list.

**Collection Changes:**
- TBR renamed to "To Be Read" with new description
- Type changed from Checklist to Manual (no completion tracking)
- Description updated to calm, curiosity-focused language: "A list that keeps growing — that's part of the beauty. This isn't a task list, it's a cabinet of curiosities. Keep collecting what calls to you. Your next read will find you when it's time"
- Old "TBR" collections can now be manually deleted (is_default flag removed)

**Migration Behavior:**
- Automatically removes `is_default` flag from old "TBR" collections
- Creates new "To Be Read" manual collection if it doesn't exist
- One-time description update from old to new text
- Safe to run multiple times (preserves user customizations after first update)

---

### Added

#### Pagination Loading Indicators
Visual feedback when scrolling to load more books in collections.

**Features:**
- Animated spinner with "Loading more books..." text
- Appears at bottom of book grid when fetching next page
- Works across all collection types (Manual, Checklist, Automatic)
- Separate indicators for incomplete/completed sections in Checklists
- Prevents confusion about whether more books exist

**User Impact:**
- Clear feedback that content is loading
- No more uncertainty when reaching end of visible books
- Consistent UX across all collection types

---

### Fixed

#### Empty Collection UX Improvements
Better handling of empty collections and menu options.

**"Remove Books" Menu:**
- Now hidden when collection has 0 books
- Only appears when collection contains books to remove
- Applies to Manual and Checklist collections
- Automatic collections never show this option (unchanged)

**Empty State Message:**
- Changed from "This collection is empty Add books from the book detail page"
- To: "An empty collection, ready for whatever arrives"
- More poetic and calm, matching design philosophy

---

#### Collection Description Handling
Fixed multiple issues with collection description field.

**Frontend Fix:**
- CollectionModal now sends empty string instead of null
- Allows clearing description to completely blank
- No more reverting to previous text when trying to clear

**Backend Fix:**
- Both create and update endpoints now consistently convert empty descriptions to NULL
- Previously, create stored empty string while update stored NULL
- Database now has consistent NULL values for empty descriptions
- Prevents data inconsistency between new and edited collections

---

### Technical

#### Files Modified
**Backend:**
- `backend/database.py` — TBR migration, description update logic
- `backend/routers/collections.py` — Empty description handling in create endpoint

**Frontend:**
- `frontend/src/pages/CollectionDetail.jsx` — Loading indicators, "Remove Books" conditional display
- `frontend/src/components/CollectionModal.jsx` — Description field empty string handling

#### Migration Details
```python
# Old TBR cleanup (handles any type)
- Removes is_default from ANY collection named "TBR"
- Allows manual deletion by user

# New "To Be Read" creation
- Only updates description if still matches old text
- Preserves user customizations on subsequent restarts

# Description consistency
- Empty descriptions → NULL in database (both create/update)
```

### Development Stats

- **Implementation time:** January 17, 2026
- **Files changed:** 4
- **Lines modified:** ~100
- **Bugs fixed:** 3 (empty menu option, description clearing, backend consistency)
- **Status:** Phase 9E.5 Partial Complete — Landing/detail page polish remaining

---

## [0.25.0] - 2026-01-17

### Added

#### Phase 9E Day 3: Checklist Behavior 🎉
Complete checklist functionality with visual styling, context menus, and status-based completion tracking.

**The Design Decision:**
Instead of maintaining separate "completed_at" tracking, checklist completion is determined by the book's actual reading status. A book is "complete" in a checklist when its status is Finished. This creates a single source of truth — marking a book finished anywhere in the app automatically completes it in all checklists.

**Visual Styling:**
- Completed books displayed in separate "Completed" section at bottom
- Green checkmark icon on completed book cards
- Reduced opacity (60%) for completed items
- Completion count shown in section header (e.g., "Completed · 3")

**Context Menus (Long-Press):**
- **For incomplete books:** "Mark Finished" opens completion modal
- **For completed books:** "Update Status" opens status change modal

**Completion Modal (MarkFinishedModal):**
- Date picker for finish date (defaults to today)
- Optional rating selector (1-5 scale)
- Clean header: "Mark as Finished"
- Saves finish date and rating to book record

**Status Change Modal (UpdateStatusModal):**
- Shows custom status labels from settings
- Gentle warning when selecting non-Finished status: "This will clear the finish date"
- Title simplified to "Update Status"
- Updates book status across entire library

---

### Bug Fixes

**✅ Completion count showing incorrect number**
- **Problem:** Count included all finished books, not just those in the collection
- **Fix:** Filter to only books that exist in the current collection

**✅ Long-press not triggering context menu**
- **Problem:** Click events firing before long-press timer completed
- **Fix:** Added proper timer cleanup and `e.preventDefault()` on touchend

**✅ Event bubbling causing navigation**
- **Problem:** Clicking context menu items also triggered book navigation
- **Fix:** Added `e.stopPropagation()` to all interactive elements

**✅ Custom status labels not showing**
- **Problem:** Hardcoded status names instead of user's custom labels
- **Fix:** Fetch settings and use `status_label_*` values

---

### Technical

#### Files Added
- `frontend/src/components/MarkFinishedModal.jsx` — Modal for marking books finished with date/rating
- `frontend/src/components/UpdateStatusModal.jsx` — Modal for changing reading status

#### Files Modified
- `frontend/src/pages/CollectionDetail.jsx` — Checklist sections, completion logic, context menus
- `frontend/src/components/BookCard.jsx` — Green checkmark overlay for completed items
- `frontend/src/api.js` — `updateBookStatus()` function

#### Completion Logic
```javascript
// A book is "complete" when its reading status is Finished
const isComplete = book.status === 'Finished';

// Completed books go to bottom section
const incomplete = books.filter(b => b.status !== 'Finished');
const completed = books.filter(b => b.status === 'Finished');
```

### Development Stats

- **Implementation time:** January 17, 2026
- **New components:** 2
- **Files changed:** 5
- **Bugs fixed:** 4
- **Status:** Phase 9E Core Complete ✅

---

## [0.24.0] - 2026-01-16

### Added

#### Phase 9E Day 2: Smart Collections Frontend 🎉
Complete frontend implementation for creating and editing Smart Collections.

**New Components:**

**CollectionModal.jsx (Enhanced)**
- Type selector with three options: Manual 📚, Checklist ✓, Automatic ⚡
- Info tooltip explaining each collection type
- Criteria builder integration for Automatic collections
- Live preview count ("~47 books match") with 500ms debounce
- Support for editing rules on existing automatic collections
- Fixed form submission with proper form id linking

**CriteriaBuilder.jsx (New)**
- Dropdown-based criteria selection (all AND'd together)
- Fetches custom status labels from settings (Unread, Reading, Done, DNF)
- Uses internal database values for queries while showing custom labels
- Tags field positioned first (most commonly used)
- Reading Status, Category, Minimum Rating, Finished date filters
- Word count min/max inputs
- Active rules counter with "Clear all" button

**TagsMultiSelect.jsx (New)**
- Searchable tag dropdown fetching from `/api/tags`
- Selected tags displayed as removable chips
- Keyboard navigation (Enter to add, Backspace to remove, Escape to close)
- Shows first 30 filtered results with "keep typing" hint

---

### Bug Fixes

**✅ Status labels mismatch**
- **Problem:** Criteria builder showed hardcoded labels instead of user's custom labels
- **Fix:** Fetch settings and use `status_label_dnf` (not `status_label_abandoned`)

**✅ Books not matching DNF/Abandoned status**
- **Problem:** Legacy books stored as 'DNF', new books as 'Abandoned' — queries only matched one
- **Fix:** Automatic collection queries now match both `status = 'Abandoned' OR status = 'DNF'`

**✅ Tags search not working**
- **Problem:** TagsMultiSelect used raw fetch instead of `listTags()` from api.js
- **Fix:** Proper API integration with correct response parsing

**✅ Smart paste 404 errors**
- **Problem:** Frontend called `/collections/smart-paste/preview` but endpoint required collection_id
- **Fix:** Added collection-agnostic `/collections/smart-paste/preview` endpoint

**✅ Cannot edit automatic collection rules**
- **Problem:** Criteria builder only shown when creating, not editing
- **Fix:** CollectionModal now shows criteria builder when editing non-default automatic collections

---

### Technical

#### Files Added
- `frontend/src/components/CriteriaBuilder.jsx` — Criteria builder component
- `frontend/src/components/TagsMultiSelect.jsx` — Tag multi-select component

#### Files Modified
- `frontend/src/components/CollectionModal.jsx` — Type selector + criteria integration
- `backend/routers/collections.py` — DNF matching fix + smart-paste preview endpoint

#### Status Value Mapping
| Settings Key | Display Label | Database Value |
|--------------|---------------|----------------|
| `status_label_unread` | Unread | `'Unread'` |
| `status_label_in_progress` | Reading | `'In Progress'` |
| `status_label_finished` | Done | `'Finished'` |
| `status_label_dnf` | DNF | `'Abandoned'` or `'DNF'` |

### Development Stats

- **Implementation time:** January 16, 2026
- **New components:** 2
- **Files changed:** 4
- **Bugs fixed:** 5
- **Status:** Day 2 Complete — Checklist behavior pending (Day 3)

---

## [0.23.0] - 2026-01-15

### Added

#### Phase 9E Day 1: Smart Collections Backend 🎉
Database schema and API endpoints for the new Smart Collections system with three collection types.

**The Problem:**
- Collections were simple manual lists only
- No automatic organization based on reading status or criteria
- No built-in TBR or Reading History collections
- No checklist functionality for tracking progress through a collection

**The Solution:**
- Three collection types: Manual, Checklist, Automatic
- Default TBR and Reading History collections auto-created
- Checklist completion tracking with `completed_at` timestamp
- Automatic collections populate dynamically based on criteria
- Protection against deleting default collections

---

### Database Schema Changes

**Collections table — 3 new columns:**
- `collection_type` (TEXT, default 'manual') — 'manual' | 'checklist' | 'automatic'
- `auto_criteria` (TEXT) — JSON string for automatic collection filters
- `is_default` (INTEGER, default 0) — 1 = cannot be deleted (TBR, Reading History)

**Collection_books table — 1 new column:**
- `completed_at` (TIMESTAMP) — When book was marked done in checklist collections

---

### Default Collections (Auto-Created)

**TBR (Checklist type)**
> "This is your growing, teetering stack of books you fully intend to read — eventually. Someday. After this one. And plot twist - a good TBR is never finished. Like laundry. Or emails. It's the beautiful circle of literary life, and the slow, crumbling collapse of your self-control. So live a little, add a few more books 😜."

**Reading History (Automatic type)**
> "This is a list of every book you've ever read (cue "it feels good" by Tony! Toni! Toné! 🎉)."

- Criteria: `{"status": "Finished", "sort": "finished_date_desc"}`
- Auto-populates with all finished books (345 books in current library)
- Paginated: shows first 100, scroll-to-load coming in Day 2

---

### New API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/collections/{id}/books/{title_id}/complete` | POST | Mark book completed in checklist |
| `/collections/preview-criteria` | POST | Preview automatic collection match count |
| `/collections/{id}/duplicate` | POST | Duplicate collection with optional type change |

---

### Modified API Behaviors

- **POST `/collections`** — Now accepts `collection_type` and `auto_criteria`
- **GET `/collections`** — Returns dynamic book counts for automatic collections
- **GET `/collections/{id}`** — Returns paginated books for automatic collections
- **DELETE `/collections/{id}`** — Returns 403 for default collections (TBR, Reading History)
- **Add/remove/reorder books** — Blocked for automatic collections (returns 400)

---

### Bug Fixes During Implementation

- **Sort order fix** — TBR now correctly appears before Reading History
- **Position indexing** — Empty collections start at position 0 (was incorrectly 1)
- **Remove book validation** — Returns 404 if book not in collection (was silent success)
- **Reorder validation** — Returns 404 if collection doesn't exist (was silent success)

---

### Technical

#### Files Modified
**Backend:**
- `backend/database.py` — Schema changes + migration functions
- `backend/routers/collections.py` — Complete rewrite with Smart Collections support

#### Migration
- Runs automatically on container restart
- Creates new columns via ALTER TABLE
- Auto-creates TBR and Reading History collections
- Existing collections unchanged (default to 'manual' type)

### Development Stats

- **Implementation time:** January 15, 2026
- **Lines of code:** ~400 added/modified
- **Files changed:** 2 (database.py, collections.py)
- **New endpoints:** 3
- **Bugs fixed:** 4 (during implementation)
- **Status:** Day 1 Complete — Frontend pending (Day 2)

---

## [0.22.1] - 2026-01-15

### Added

#### Phase 9D: Add Page Simplification & Mobile Fixes 🎉
Simplified the Add Book flow and fixed mobile input handling.

**Changes:**
- Add page now shows just two clear options: "Add to Library" / "Add to Wishlist"
- Mobile author input fixed: Enter key now properly creates chips
- Buttons vertically centered on Add page

**Files changed:** 3 (`AddChoice.jsx`, `WishlistForm.jsx`, `ManualEntryForm.jsx`)

---

## [0.22.0] - 2026-01-13

### Added

#### Phase 9C Complete: Automatic Cover Extraction 🎉
Full automatic cover extraction system with category-based filtering and bulk extraction tools.

**New Features:**
- **Auto-extraction during sync** — Covers extracted automatically when syncing Fiction/Non-Fiction books
- **Bulk extraction tool** — New section in Settings to extract covers from existing library
- **Category filtering** — FanFiction books skip extraction (gradient covers only, by design)
- **Smart status handling** — Stale cover status cleared when re-extraction finds no cover

---

### Backend Implementation

**Sync Integration (`backend/routers/sync.py`):**
- Added category check before cover extraction (2 locations: existing titles + new titles)
- FanFiction books now properly skip extraction
- Stale cover status cleared when re-extraction returns None
- Existing custom covers never overwritten

**Bulk Extraction Endpoint (`backend/routers/titles.py`):**
- **POST `/api/titles/covers/bulk-extract`** — Extract covers from multiple books
  - Accepts `categories` array (Fiction, Non-Fiction)
  - FanFiction filtered out even if requested
  - GROUP BY fix prevents duplicate counting with multiple editions
  - Non-EPUB files (PDF, MOBI) correctly skipped
  - Returns detailed stats: extracted, skipped (custom/no_epub/no_cover/fanfiction), failed

**Response format:**
```json
{
  "extracted": 45,
  "skipped_has_custom": 12,
  "skipped_no_epub": 8,
  "skipped_no_cover": 23,
  "skipped_fanfiction": 156,
  "failed": 2,
  "total_processed": 246
}
```

---

### Frontend Implementation

**Settings UI (`frontend/src/components/SettingsDrawer.jsx`):**
- New "Bulk Cover Extraction" section
- Category checkboxes (Fiction, Non-Fiction pre-selected)
- FanFiction option disabled with explanation
- Progress feedback during extraction
- Detailed results display with all counters
- Clear visual separation from other settings

**API Functions (`frontend/src/api.js`):**
- **`bulkExtractCovers(categories)`** — Trigger bulk extraction for selected categories

---

### Bug Fixes

**✅ Bug 6: FanFiction not filtered from bulk extract**
- **Problem:** API accepted FanFiction category despite documented exclusion
- **Fix:** Filter out 'FanFiction' from category list before processing

**✅ Bug 7: Misleading counter for "No Cover in EPUB"**
- **Problem:** EPUBs without embedded covers counted as `skipped_no_epub`
- **Fix:** Added `skipped_no_cover` counter for EPUBs that exist but have no cover

**✅ Bug 8: Duplicate editions counted multiple times**
- **Problem:** LEFT JOIN without GROUP BY caused duplicate rows for titles with multiple ebook editions
- **Fix:** Added `GROUP BY t.id` and `MIN(e.file_path)` to query

**✅ Bug 9: Non-EPUB files cause extraction failures**
- **Problem:** Bulk extract called `extract_epub_cover()` on PDF/MOBI files
- **Fix:** Added `.epub` extension check before extraction attempt

**✅ Bug 10: Stale cover status after re-extraction fails**
- **Problem:** If re-extraction found no cover, old `cover_source = 'extracted'` remained
- **Fix:** Clear cover status when extraction returns None for previously extracted covers

---

### Key Features (Phase 9C Complete)

- ✅ **Custom upload** — Upload any image as book cover
- ✅ **Auto-extraction on sync** — Fiction/Non-Fiction books get covers automatically
- ✅ **Bulk extraction tool** — Extract covers from existing library via Settings
- ✅ **Category filtering** — FanFiction uses gradient covers only
- ✅ **Priority system** — Custom > Extracted > Gradient
- ✅ **Lazy loading** — IntersectionObserver for performance
- ✅ **Graceful fallback** — Gradient covers when no image available
- ✅ **Smart re-sync** — Stale status cleared, custom covers preserved

---

### Technical

#### Files Modified
**Backend:**
- `backend/routers/sync.py` — Category filtering, stale status handling
- `backend/routers/titles.py` — Bulk extract endpoint with all fixes

**Frontend:**
- `frontend/src/api.js` — `bulkExtractCovers()` function
- `frontend/src/components/SettingsDrawer.jsx` — Bulk extraction UI

#### Behavior Summary
| Category | On Sync | Bulk Tool | Cover Type |
|----------|---------|-----------|------------|
| Fiction | ✅ Extract | ✅ Available | Real or Gradient |
| Non-Fiction | ✅ Extract | ✅ Available | Real or Gradient |
| FanFiction | ❌ Skip | ❌ Disabled | Gradient only |

### Development Stats

- **Implementation time:** Jan 13, 2026
- **Lines of code:** ~200 added
- **Bugs fixed:** 5 additional (10 total for Phase 9C)
- **Status:** ✅ Phase 9C Complete

---

## [0.21.0] - 2026-01-12

### Added

#### Phase 9C: Cover Extraction & Upload System 🎉
Complete cover management system with custom upload support, gradient fallback, and automatic extraction (pending).

**The Problem:**
- All books displayed gradient covers regardless of whether EPUB contained embedded cover
- No way to upload custom cover images for books without embedded covers
- Books with real covers (especially traditionally published) looked generic

**The Solution:**
- Custom cover upload via Edit Book modal
- Priority system: Custom > Extracted > Gradient fallback
- Lazy loading for performance with 1,700+ books
- Automatic extraction from EPUBs during sync (still in progress)

---

*For earlier versions, see git history or previous CHANGELOG entries.*
