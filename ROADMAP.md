# Liminal Product Roadmap

> **Last Updated:** January 25, 2026 (v0.27.0)  
> **Current Focus:** Phase 9.5 — Pre-Migration Completion  
> **Tracking Philosophy:** This roadmap is the single source of truth. No separate spec documents.

---

## Vision

Liminal is a personal reading companion that eliminates the friction of managing an ebook library across multiple systems. It provides a single, mobile-friendly home for browsing, tracking, discovering, and reflecting on books — both owned and wished for — so that the reader can spend less time managing and more time in the liminal space of reading.

---

## Current State (v0.27.0)

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
| Book detail page | ⚠️ Foundation complete, finishing touches needed |
| Editions system | ✅ Add formats, merge duplicates |
| Automated backups | ✅ Grandfather-father-son rotation |
| Folder structure independence | ✅ File metadata primary |
| Custom cover upload | ✅ Complete |
| Auto cover extraction | ✅ Complete |
| Gradient covers | ✅ Fixed |

---

## Roadmap Overview

```
┌───────────┬──────────────────────────────────────────────────────────┐
│  CURRENT  │  Phase 9.5: Pre-Migration Completion                     │
│           │  10 work groups, ~64 items (~3-4 weeks)                  │
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

**Status:** ⬜ Not Started  
**Files:** `BookDetail.jsx`, related modals, `CollectionPicker.jsx`

- [ ] 1.1 **Unified Edit Modal** — Combine Edit Book, Edit About, Edit Metadata into single tabbed modal
- [ ] 1.2 **Remove Scattered Edit Icons** — Remove individual ✎ icons; keep only Edit Notes and Edit Reading History
- [ ] 1.3 **Update 3-Dot Menu** — Add: Rescan Metadata, Add Format, Add Reading Session, Add to Collection
- [ ] 1.4 **Move Add Format to Menu** — Remove standalone button, add to 3-dot menu
- [ ] 1.5 **Enhanced Add to Collection Modal** — Add "Create new collection" option within picker
- [ ] 1.6 **Collection Picker Search** — Add search within "Add to Collection" modal
- [ ] 1.7 **Collection Picker Quick Create** — "Create new" option if search has no matches
- [ ] 1.8 **Collection Picker Recent** — Show recently-used collections at top
- [ ] 1.9 **EPUB Download Button** — Enable downloading book file from detail page
- [ ] 1.10 **Full-Screen Cover Viewer** — Tap cover → full-screen with swipe dismiss
- [ ] 1.11 **Move Location to Metadata** — Move location field from bottom of page into Metadata section
- [ ] **GROUP 1 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** All actions consolidated in 3-dot menu. Single unified edit modal. Collection picker has search, quick create, and recent collections. Location field in Metadata section.

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
- [ ] 5.2 **Ensure 3-Dot Menu Position** — Same line as title, consistent with other pages
- [ ] 5.3 **View Toggle Visibility** — Always visible above book list (not in menu)
- [ ] 5.4 **Add Manual Collection Chip** — Add type chip for Manual collections (matching Auto/Checklist)
- [ ] **GROUP 5 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** Collection Detail matches other detail pages in header structure and menu placement. All collection types show type chip.

---

### Work Group 6: Landing Pages & Navigation

**Status:** ⬜ Not Started  
**Files:** `Library.jsx`, `AuthorsTab.jsx`, `SeriesTab.jsx`, `CollectionsTab.jsx`

- [ ] 6.1 **Library Browse: Add View Toggle** — Grid/list toggle
- [ ] 6.2 **Library Browse: Right-Align Search** — Search/filter right-aligned on desktop
- [ ] 6.3 **Library Browse: Gradient Text Lines** — Increase from 3 to 6 lines
- [ ] 6.4 **Library Browse: Center Loading** — Center loading message
- [ ] 6.5 **Library Wishlist: Remove Dotted Outline** — Bookmark icon is sufficient
- [ ] 6.6 **Library Wishlist: Add View Toggle** — Grid/list toggle
- [ ] 6.7 **Library Home: Increase Section Items** — From 5-6 to 20 items
- [ ] 6.8 **Library Home: Add Search Icon** — Search icon right of tabs
- [ ] 6.9 **Authors Landing: A-Z Jump Nav** — Alphabetical navigation
- [ ] 6.10 **Series Landing: Fix Search** — Search series names, not book titles
- [ ] 6.11 **Series Landing: Add View Toggle** — Grid/list toggle
- [ ] 6.12 **Global: Fix Scroll Restoration** — Fix React Router scroll position bug
- [ ] **GROUP 6 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** All landing pages have consistent view toggles, search behavior is correct, A-Z nav on Authors, scroll restoration works.

---

### Work Group 7: Library Home Improvements

**Status:** ⬜ Not Started  
**Files:** `HomeTab.jsx`, `SettingsDrawer.jsx`

- [ ] 7.1 **Search Icon Shortcut** — Add search icon to upper left of Library page
- [ ] 7.2 **Time Filter Changes** — Update "Your Reading" dropdown: This month, Last month, Past 12 months
- [ ] 7.3 **Show/Hide Home Sections** — Settings toggles for: Currently Reading, Recently Added, Discover, Quick Reads
- [ ] **GROUP 7 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** Home tab has search shortcut, better time filters, and customizable sections.

---

### Work Group 8: Forms & Settings Polish

**Status:** ⬜ Not Started  
**Files:** Various form components, `SettingsDrawer.jsx`

- [ ] 8.1 **Series Field Searchable** — Add autocomplete to series field in add/edit forms
- [ ] 8.2 **Fix Library/Wishlist Search** — Address search functionality issues
- [ ] 8.3 **Settings Modal Redesign** — Update settings drawer UI
- [ ] 8.4 **Photo Scan to Wishlist** — Camera-based quick add (Large — consider deferring)
- [ ] **GROUP 8 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** Forms have better autocomplete, search works correctly, settings look polished.

---

### Work Group 9: Stats Page

**Status:** ⬜ Not Started  
**Files:** New `Stats.jsx` page

- [ ] 9.1 **Calendar View Component** — Moon+ Reader-inspired calendar grid
- [ ] 9.2 **Books on Dates** — Show book covers on completion dates
- [ ] 9.3 **Multiple Books Per Day** — Handle and display multiple completions
- [ ] 9.4 **Summary Stats** — Total books, total words for selected year
- [ ] 9.5 **Year Navigation** — Navigate between years
- [ ] 9.6 **Link from Home** — "View Stats" link on Library/Home
- [ ] **GROUP 9 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** Stats page with calendar view, year navigation, summary stats, accessible from Home.

---

### Work Group 10: Data Quality Tools

**Status:** ⬜ Not Started  
**Files:** New components, `SettingsDrawer.jsx`

- [ ] 10.1 **Duplicate Scanner Algorithm** — Find exact + fuzzy matches
- [ ] 10.2 **Duplicate Review Interface** — UI to review groups
- [ ] 10.3 **Merge from Scanner** — Merge duplicates from results
- [ ] 10.4 **Dismiss Groups** — Mark as "not duplicates"
- [ ] 10.5 **Fix Find Duplicates Page** — Address current page bugs
- [ ] 10.6 **Unprocessed Files Detection** — Find folders not in library
- [ ] 10.7 **Manual Add from Unprocessed** — Add discovered files
- [ ] 10.8 **Dismiss Unprocessed** — Mark as "ignore"
- [ ] **GROUP 10 COMPLETE** — Update CHANGELOG, commit

**Definition of Done:** Can scan for duplicates, review and merge them. Can find unprocessed files and handle them.

---

### Phase 9.5 Progress Summary

| Group | Name | Items | Status |
|-------|------|-------|--------|
| 1 | Book Detail Completion | 11 | ⬜ |
| 2 | Wishlist Detail Unification | 4 | ⬜ |
| 3 | Series Detail Overhaul | 6 | ⬜ |
| 4 | Author Detail Overhaul | 8 | ⬜ |
| 5 | Collection Detail Polish | 4 | ⬜ |
| 6 | Landing Pages & Navigation | 12 | ⬜ |
| 7 | Library Home Improvements | 3 | ⬜ |
| 8 | Forms & Settings Polish | 4 | ⬜ |
| 9 | Stats Page | 6 | ⬜ |
| 10 | Data Quality Tools | 8 | ⬜ |
| | **Total** | **66** | |

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
| `CODE_PATTERNS.md` | Battle-tested code solutions |

---

*Roadmap is the single source of truth. Update this document as work progresses.*

*Last updated: January 25, 2026*
