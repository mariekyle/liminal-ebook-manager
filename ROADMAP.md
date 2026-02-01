# Liminal Product Roadmap

> **Last Updated:** February 1, 2026 (v0.30.0)  
> **Current Focus:** Phase 9.5 — Pre-Migration Completion  
> **Tracking Philosophy:** This roadmap is the single source of truth. No separate spec documents.

---

## Vision

Liminal is a personal reading companion that eliminates the friction of managing an ebook library across multiple systems. It provides a single, mobile-friendly home for browsing, tracking, discovering, and reflecting on books — both owned and wished for — so that the reader can spend less time managing and more time in the liminal space of reading.

---

## Current State (v0.30.0)

The app is fully functional for daily use with 1,700+ books. Core systems are stable:

| System | Status |
|--------|--------|
| Library browsing & search | ✅ Stable |
| Book upload & metadata extraction | ✅ Stable |
| Reading status & session tracking | ✅ Stable |
| Notes with wiki-style linking | ✅ Stable |
| Wishlist management | ✅ Stable |
| Collections system | ✅ Smart Collections complete |
| Enhanced fanfiction metadata | ✅ Stable |
| Add book flow | ✅ Redesigned |
| Book detail page | 🔄 Sessions A, B, B+ complete — Session C next |
| Editions system | ✅ Add formats, merge duplicates |
| Automated backups | ✅ Grandfather-father-son rotation |
| Folder structure independence | ✅ File metadata primary |
| Custom cover upload | ✅ Restored (Session B+) |
| Auto cover extraction | ✅ Restored (Session B+) |
| Gradient covers | ✅ Fixed |

---

## Roadmap Overview

```
┌───────────┬──────────────────────────────────────────────────────────┐
│  CURRENT  │  Phase 9.5: Pre-Migration Completion                     │
│           │  10 work groups, ~72 items (~3-4 weeks)                  │
│           │  Complete each area fully before moving on               │
├───────────┼──────────────────────────────────────────────────────────┤
│   PREP    │  Phase 10: Design System Refactor (1 week)               │
├───────────┼──────────────────────────────────────────────────────────┤
│   PREP    │  Phase 11: React Native Learning (1 week)                │
├───────────┼──────────────────────────────────────────────────────────┤
│   MAJOR   │  Phase 12: React Native Web Migration (3-4 weeks)        │
├───────────┼──────────────────────────────────────────────────────────┤
│  FUTURE   │  Phase 13: AI Enhancements                               │
└───────────┴──────────────────────────────────────────────────────────┘
```

---

## Phase 9.5: Pre-Migration Completion ← CURRENT

**Goal:** Complete all remaining Phase 9 features before React Native migration.

**Philosophy:** Complete each work group fully before moving to the next. No scattered, half-done work.

**Estimated Timeline:** 19-28 working sessions (~3-4 weeks)

---

### Work Group 1: Book Detail Page Completion

**Status:** 🔄 In Progress (Sessions A, B, B+ complete)  
**Files:** `BookDetail.jsx`, `UnifiedEditModal.jsx`, `ChangeCoverModal.jsx`, `CollectionPicker.jsx`

**Session A — Menu & Icon Consolidation: ✅ Complete**
- [x] 1.2 **Remove Scattered Edit Icons** — Removed tag/merge/pencil icons from header area
- [x] 1.3 **Add 3-Dot Menu** — Desktop dropdown + mobile bottom sheet with all actions
- [x] 1.4 **Move Add Format to Menu** — Removed standalone button
- [x] 1.A1 **Move Rescan Metadata to Menu** — Removed standalone section
- [x] 1.A2 **Move Add Reading Session to Menu** — Removed inline "+ Add Session" links
- [x] 1.A3 **Move Add to Collection to Menu** — Removed inline "+ Add" link
- [x] 1.A4 **Toast Notification System** — Added for rescan feedback (loading/success/error)
- [x] 1.A5 **Wishlist Menu Filtering** — Menu items filtered appropriately (library vs wishlist)
- [x] 1.A6 **Component Stability** — Extracted Toast/ThreeDotMenu outside BookDetail to prevent remounts
- [x] 1.A7 **Memory Leak Prevention** — Toast timeout cleanup on unmount via useRef

**Session B — Unified Edit Modal: ✅ Complete**
- [x] 1.1 **Unified Edit Modal** — Combined EditBookModal + EnhancedMetadataModal into single tabbed modal
  - Segmented control tab navigation (iOS-style)
  - Dynamic tabs: 2 tabs (Details, About) or 3 tabs (+Metadata for FanFiction)
  - Details tab: Title, Authors, Series/Number, Category, Year, Source URL
  - About tab: Summary (or "Why this one?" for wishlist), Tags, Pairing Type (Fiction/FanFic only)
  - Metadata tab: Completion Status, Fandom, Ships, Content Rating, Warnings (FanFic library only)
  - Characters field removed from UI (merged into Tags)
  - Single "Save" button for all tabs
- [x] 1.B2 **Delete Legacy Modals** — Removed EditBookModal.jsx and EnhancedMetadataModal.jsx
- [x] 1.B3 **Menu Consolidation** — "Edit Details...", "Edit About & Tags...", "Change Cover..." → single "Edit..."

**Session B+ — Change Cover Modal: ✅ Complete**
- [x] 1.B1 **Change Cover Modal** — Dedicated modal for cover management
  - Cover preview (200×300px) with source badge
  - Upload Image / Extract from EPUB / Use Gradient Instead
  - Added "Change Cover" to 3-dot menu (after Edit, before divider)
  - Fixed EPUB detection (editions not formats)
  - Fixed pairing_type → ao3_category field mapping

**Session C — Collection Picker Enhancements: ⬅️ Next**
- [ ] 1.5 **Quick Create** — "Create new collection" option within picker
- [ ] 1.6 **Search** — Filter collections as you type
- [ ] 1.7 **Contextual Quick Create** — "Create [search term]" when no matches
- [ ] 1.8 **Recent Collections** — Show top 5 most recently used (API-based: `last_book_added_at`)

**Session D — Download & Cover Viewer:**
- [ ] 1.9 **EPUB Download Button** — Wire up download icon on ReadingStatusCard
- [ ] 1.10 **Full-Screen Cover Viewer** — Tap cover → fullscreen, dismiss via backdrop OR X button

**Session E — Cleanup:**
- [ ] 1.11 **Move Location to Metadata** — Move location field into Metadata section

- [ ] **GROUP 1 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** All actions consolidated in 3-dot menu. Single unified edit modal with dynamic tabs. Dedicated cover modal. Collection picker has search, quick create, and recent collections. Location field in Metadata section.

**Current Menu Structure:**
```
Edit                      → UnifiedEditModal (tabbed)
Change Cover              → ChangeCoverModal
─────────────────────────
Add Reading Session       → Session modal
Add to Collection         → Collection picker
Add Format                → Edition modal
─────────────────────────
Merge                     → Merge modal
Rescan Metadata           → Toast feedback (library books with folder only)
```

---

### Work Group 2: Wishlist Detail Unification

**Status:** ⬜ Not Started  
**Files:** `WishlistDetail.jsx` (or merge into `BookDetail.jsx`)

- [ ] 2.1 **Refactor as Book Detail State** — Wishlist items render through BookDetail with `acquisition_status` check
- [ ] 2.2 **Fix Notes Duplication** — "Why this one?" and "Notes" should be single field
- [ ] 2.3 **Apply 3-Dot Menu Pattern** — Same menu pattern as Book Detail (Edit, Merge, Remove)
- [ ] 2.4 **Match Layout Structure** — Same section order, same component usage
- [ ] **GROUP 2 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** No separate WishlistDetail component. BookDetail handles both owned and wishlist items.

---

### Work Group 3: Series Detail Overhaul

**Status:** ⬜ Not Started  
**Files:** `SeriesDetail.jsx`

- [ ] 3.1 **Stacked Cover Mosaic Hero** — 3-cover fanned display at top (Hardcover reference)
- [ ] 3.2 **Enrich Book List Rows** — Add: cover thumbnail, author, year, est. time
- [ ] 3.3 **Add 3-Dot Menu** — Menu with "Edit Series" option
- [ ] 3.4 **Add Grid/List View Toggle** — Match Collection Detail pattern
- [ ] 3.5 **"You own X of Y" Display** — Show ownership stats prominently
- [ ] 3.6 **Build Edit Series Modal** — Modal for editing series metadata
- [ ] **GROUP 3 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** Series Detail has mosaic hero, enriched book rows, view toggle, 3-dot menu with edit capability.

---

### Work Group 4: Author Detail Overhaul

**Status:** ⬜ Not Started  
**Files:** `AuthorDetail.jsx`

- [ ] 4.1 **Update Checkmark Style** — Match library grid style (dark badge + white check)
- [ ] 4.2 **Add 3-Dot Menu** — Menu with "Edit Author" option
- [ ] 4.3 **Add Grid/List View Toggle** — Match other detail pages
- [ ] 4.4 **Standalone/Series Sections** — Separate standalone books from series groupings
- [ ] 4.5 **Series Mosaic Cards** — Show series as grouped mosaic cards (not individual books)
- [ ] 4.6 **Remove "Books by" Heading** — Redundant with author name at top
- [ ] 4.7 **Add Author Notes Display** — Show notes below book count if present
- [ ] 4.8 **Gradient Hero (Optional)** — Add gradient banner like Collections
- [ ] **GROUP 4 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** Author Detail has consistent header, view toggle, 3-dot menu, and properly separated standalone vs. series sections.

---

### Work Group 5: Collection Detail Polish

**Status:** ⬜ Not Started  
**Files:** `CollectionDetail.jsx`

- [ ] 5.1 **Move Instruction Banner** — Show only on type chip tap, not always visible
- [ ] 5.2 **Checklist Pagination Fix** — Resolve infinite loop issue (see Technical Debt)
- [ ] 5.3 **Empty State Improvements** — Better messaging when collection is empty
- [ ] 5.4 **Drag Handle Visibility** — Only show reorder handles in edit mode
- [ ] **GROUP 5 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** Collection Detail has cleaner UI with hidden instruction banner and fixed pagination.

---

### Work Group 6: Landing Pages & Navigation

**Status:** ⬜ Not Started  
**Files:** Various landing pages

- [ ] 6.1 **Authors Landing Page** — Grid of author cards with book counts
- [ ] 6.2 **Series Landing Page** — Grid of series cards with mosaic covers
- [ ] 6.3 **Tags Landing Page** — Tag cloud or grid with usage counts
- [ ] 6.4 **Fandoms Landing Page** — Grid for FanFiction fandoms
- [ ] 6.5 **Ships Landing Page** — Grid for FanFiction ships
- [ ] 6.6 **Navigation Menu Update** — Add links to new landing pages
- [ ] 6.7 **Breadcrumb Navigation** — Consistent back navigation across pages
- [ ] 6.8 **Recently Added Section** — Show newest books on home
- [ ] 6.9 **Continue Reading Section** — Show in-progress books on home
- [ ] 6.10 **Random Pick Feature** — "What should I read?" button
- [ ] 6.11 **Search Improvements** — Search across all entity types
- [ ] 6.12 **Filter Persistence** — Remember filter state across navigation
- [ ] **GROUP 6 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** All entity types have landing pages. Navigation is consistent and discoverable.

---

### Work Group 7: Library Home Improvements

**Status:** ⬜ Not Started  
**Files:** `Library.jsx`

- [ ] 7.1 **Category Tabs** — Quick filter tabs for Fiction/Non-Fiction/FanFiction
- [ ] 7.2 **Sort Persistence** — Remember sort preference per category
- [ ] 7.3 **View Mode Toggle** — Grid/List view toggle
- [ ] **GROUP 7 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** Library home has category tabs, persistent sort, and view toggle.

---

### Work Group 8: Forms & Settings Polish

**Status:** ⬜ Not Started  
**Files:** Various form components, `SettingsDrawer.jsx`

- [ ] 8.1 **Form Validation** — Consistent validation patterns across all forms
- [ ] 8.2 **Error Handling** — User-friendly error messages
- [ ] 8.3 **Settings Organization** — Group related settings logically
- [ ] 8.4 **Backup/Restore UI** — Clearer backup management interface
- [ ] **GROUP 8 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** Forms have consistent validation and error handling. Settings are well-organized.

---

### Work Group 9: Stats Page

**Status:** ⬜ Not Started  
**Files:** New `Stats.jsx` page

- [ ] 9.1 **Reading Calendar** — GitHub-style contribution graph for reading activity
- [ ] 9.2 **Monthly/Yearly Views** — Toggle between time periods
- [ ] 9.3 **Multiple Books Per Day** — Handle and display multiple completions
- [ ] 9.4 **Summary Stats** — Total books, total words for selected year
- [ ] 9.5 **Year Navigation** — Navigate between years
- [ ] 9.6 **Link from Home** — "View Stats" link on Library/Home
- [ ] **GROUP 9 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** Stats page with calendar view, year navigation, summary stats, accessible from Home.

---

### Work Group 10: Data Quality Tools

**Status:** ⬜ Not Started  
**Files:** New components, `SettingsDrawer.jsx`, backend routers

- [ ] 10.1 **Duplicate Scanner Algorithm** — Find exact + fuzzy matches
- [ ] 10.2 **Duplicate Review Interface** — UI to review groups
- [ ] 10.3 **Merge from Scanner** — Merge duplicates from results
- [ ] 10.4 **Dismiss Groups** — Mark as "not duplicates"
- [ ] 10.5 **Fix Find Duplicates Page** — Address current page bugs
- [ ] 10.6 **Unprocessed Files Detection** — Find folders not in library
- [ ] 10.7 **Manual Add from Unprocessed** — Add discovered files
- [ ] 10.8 **Dismiss Unprocessed** — Mark as "ignore"
- [ ] 10.9 **Delete Book Backend** — `DELETE /api/books/{id}` removes record AND deletes folder/files from NAS
- [ ] 10.10 **Delete Confirmation Modal** — Type-to-confirm field ("DELETE"), warning checkbox, shows folder path and file count
- [ ] 10.11 **Delete Philosophy Documentation** — Update ARCHITECTURE.md to document destructive operations policy
- [ ] **GROUP 10 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** Can scan for duplicates, review and merge them. Can find unprocessed files and handle them. Can permanently delete books with robust confirmation safeguards.

---

### Phase 9.5 Progress Summary

| Group | Name | Items | Status |
|-------|------|-------|--------|
| 1 | Book Detail Completion | 17 | 🔄 (12/17) |
| 2 | Wishlist Detail Unification | 4 | ⬜ |
| 3 | Series Detail Overhaul | 6 | ⬜ |
| 4 | Author Detail Overhaul | 8 | ⬜ |
| 5 | Collection Detail Polish | 4 | ⬜ |
| 6 | Landing Pages & Navigation | 12 | ⬜ |
| 7 | Library Home Improvements | 3 | ⬜ |
| 8 | Forms & Settings Polish | 4 | ⬜ |
| 9 | Stats Page | 6 | ⬜ |
| 10 | Data Quality Tools | 11 | ⬜ |
| | **Total** | **75** | |

---

## Technical Debt

Items to address when time permits (not blocking migration):

### Checklist Collection Pagination Infinite Loop ⚠️
**Location:** `CollectionDetail.jsx`  
**Symptom:** Scrolling to bottom of large checklist collections causes infinite spinner flicker.  
**Workaround:** Visual noise only, collection still usable.  
**Priority:** Medium

### Browser Cache Issues with Covers
**Symptom:** Cover changes may not reflect immediately after editing many covers.  
**Workaround:** Clear browser cache for past hour.  
**Priority:** Low

### TBRList → Wishlist Rename
**Location:** `TBRList.jsx`  
**Issue:** File still named TBRList. Storage key already fixed.  
**Status:** Deferred to React Native migration.  
**Priority:** Low

---

## Completed Phases (Reference)

### Phase 9A-9F Summary

| Phase | Name | Completed | Key Deliverables |
|-------|------|-----------|------------------|
| 9A | Automated Backups | Jan 10 | Grandfather-father-son rotation, settings UI |
| 9B | Folder Independence | Jan 10 | File metadata primary, smart parsing |
| 9C | Cover System | Jan 11-13 | Auto-extraction, custom upload, bulk tool |
| 9D | Bug Fixes | Jan 15 | Add page simplification, mobile fixes |
| 9E | Smart Collections | Jan 15-17 | Manual/Checklist/Auto types, criteria builder |
| 9E.5 | Collections Polish | Jan 18-19 | Landing page, detail page, reorder, gradients |
| 9F | Book Detail Foundation | Jan 25 | CollapsibleSection, ReadingStatusCard, page structure |

---

## Phase 10: Design System Refactor

**Goal:** Establish unified design system before React Native migration.

**Status:** Planned (after Phase 9.5)

**Scope:**
- Design tokens (colors, spacing, typography, radius)
- Component library (buttons, inputs, cards, modals)
- Layout primitives (containers, grids, stacks)
- Animation standards
- Mobile-first responsive patterns

**Timeline:** 1 week

---

## Phase 11: React Native Learning

**Goal:** Dedicated learning phase before migration.

**Status:** Planned

**Scope:**
- React Native fundamentals
- React Native Web setup
- Navigation patterns
- Performance optimization
- Android build process

**Timeline:** 1 week

---

## Phase 12: React Native Web Migration

**Goal:** Port complete app to React Native, enable Android native.

**Status:** Future

**Approach:**
- Start with shared components
- Migrate screen by screen
- Test on both web and Android
- Deploy when feature-complete

**Timeline:** 3-4 weeks

---

## Phase 13: AI Enhancements

**Goal:** Add intelligent features using LLMs.

**Status:** Future

**Planned features:**
- Smart recommendations
- Automatic summaries
- Auto-tagging
- Similar book discovery
- Reading insights

**Timeline:** TBD (after RN migration)

---

## Development Philosophy

1. **Mobile-first** — Every feature works great on Android
2. **Single source of truth** — Liminal is THE place for book data
3. **Reduce friction** — If it takes more than 2 taps, simplify it
4. **Data integrity** — Never lose user's notes or reading history
5. **Complete visibility** — Every book in storage visible in the app
6. **Calm UX** — Interfaces feel peaceful, not overwhelming
7. **Build complete, then migrate** — Finish features before framework changes
8. **Complete each area fully** — No scattered, half-done work

---

## Reference Documents

These documents contain historical context and design decisions. The roadmap checklist above is the source of truth for what remains to be done.

| Document | Purpose |
|----------|---------|
| `PHASE_9F_DETAIL_PAGES_SPEC.md` | Original detail pages audit (design reference) |
| `PHASE_9F_DESIGN_SUMMARY.md` | Design decisions from mockup phase |
| `book-detail-mockup-v2.html` | Visual reference for Book Detail |
| `phase9f-mockups-v3.html` | Visual reference for all detail pages |
| `unified-edit-modal-mockup-v2.html` | Visual reference for Session B modal |
| `change-cover-modal-mockup.html` | Visual reference for Session B+ modal |
| `CODE_PATTERNS.md` | Battle-tested code solutions |

---

*Roadmap is the single source of truth. Update this document as work progresses.*

*Last updated: February 1, 2026*
