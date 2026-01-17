# Liminal Product Roadmap

> **Last Updated:** January 17, 2026 (v0.25.0)  
> **Major Milestone:** Phase 9E Core Complete — Smart Collections fully functional! 🎉

---

## Vision

Liminal is a personal reading companion that eliminates the friction of managing an ebook library across multiple systems. It provides a single, mobile-friendly home for browsing, tracking, discovering, and reflecting on books — both owned and wished for — so that the reader can spend less time managing and more time in the liminal space of reading.

---

## Development Philosophy

1. **Mobile-first** — Every feature should work great on Android
2. **Single source of truth** — Liminal is THE place for book data
3. **Reduce friction** — If it takes more than 2 taps, simplify it
4. **Data integrity** — Never lose user's notes or reading history
5. **Complete visibility** — Every book in storage should be visible in the app
6. **Calm UX** — Interfaces should feel peaceful, not overwhelming
7. **Build complete, then migrate** — Finish features before framework changes

---

## Current State (v0.25.0)

The app is fully functional for daily use with 1,700+ books. Core systems are stable:

| System | Status |
|--------|--------|
| Library browsing & search | ✅ Stable |
| Book upload & metadata extraction | ✅ Stable |
| Reading status & session tracking | ✅ Stable |
| Notes with wiki-style linking | ✅ Stable |
| Wishlist management | ✅ Stable |
| Collections system | ✅ **Smart Collections complete!** |
| Enhanced fanfiction metadata | ✅ Stable |
| Add book flow | ✅ Redesigned |
| Book detail header | ✅ Redesigned |
| Editions system | ✅ Add formats, merge duplicates |
| Automated backups | ✅ Grandfather-father-son rotation |
| Folder structure independence | ✅ File metadata primary |
| Custom cover upload | ✅ Complete |
| Auto cover extraction | ✅ Complete |
| Bulk cover extraction | ✅ Complete |
| Gradient covers | ✅ Fixed (fill containers, text overlay) |
| Add page UX | ✅ Simplified (Jan 15) |
| Mobile author input | ✅ Fixed Enter key handling (Jan 15) |
| **Smart Collections backend** | ✅ **Complete (Jan 15)** |
| **Smart Collections frontend** | ✅ **Complete (Jan 16)** |
| **Checklist behavior** | ✅ **Complete (Jan 17)** |
| **Default TBR + Reading History** | ✅ **Auto-created (Jan 15)** |

**Recent milestones:**
- Phase 9E Day 3: Checklist behavior complete (Jan 17, 2026) ✅
- Phase 9E Day 2: Frontend type selector & criteria builder (Jan 16, 2026) ✅
- Phase 9E Day 1: Smart Collections backend deployed (Jan 15, 2026) ✅
- Phase 9D: Add page simplification + mobile fixes (Jan 15, 2026) ✅
- Phase 9C: Auto-extraction & bulk tool complete (Jan 13, 2026)
- Phase 9C: Cover bug fixes — 10 bugs resolved (Jan 11-13, 2026)
- Phase 9B: Folder structure independence (Jan 10, 2026)
- Phase 9A: Automated backup system (Jan 10, 2026)

---

## Strategic Pivot: Why Features Before React Native

**Original plan:** Migrate to React Native Web immediately after Phase 8

**New plan:** Complete all non-AI features first, THEN migrate to React Native Web

**Reasoning:**
1. **Clear migration scope** — Know exactly what needs to be ported
2. **Proven patterns** — Discover UX patterns and edge cases before porting
3. **Lower risk** — Migration won't be disrupted by new feature additions
4. **Better learning** — Learn React Native properly without pressure of incomplete features
5. **Only +1 week** — Total timeline barely changes, but outcomes much better
6. **Daily use protection** — User actively uses Liminal; stability matters

---

## Roadmap Overview

```
┌───────────┬──────────────────────────────────────────────────────┐
│  CURRENT  │  Phase 9: Feature Completion                         │
│           │  9A: ✅ Automated Backups (Jan 10)                   │
│           │  9B: ✅ Folder Independence (Jan 10)                 │
│           │  9C: ✅ Cover System (Jan 11-13)                     │
│           │  9D: ✅ Bug Fixes & Polish (Jan 15)                  │
│           │  9E: ✅ Smart Collections Core (Jan 15-17)           │
│           │  9E.5: ⬅️ Smart Collections Polish (next)            │
│           │  9F-9K: Remaining features (~2 weeks)                │
├───────────┼──────────────────────────────────────────────────────┤
│   PREP    │  Phase 10: Design System Refactor                   │
│           │  Calm UX design system (1 week)                      │
├───────────┼──────────────────────────────────────────────────────┤
│   PREP    │  Phase 11: React Native Learning                    │
│           │  1 week focused learning before migration            │
├───────────┼──────────────────────────────────────────────────────┤
│   MAJOR   │  Phase 12: React Native Web Migration               │
│           │  Port complete app to RN, enable Android native      │
├───────────┼──────────────────────────────────────────────────────┤
│  FUTURE   │  Phase 13: AI Enhancements                          │
│           │  Recommendations, auto-summaries, tagging            │
└───────────┴──────────────────────────────────────────────────────┘
```

---

## Phase 9: Feature Completion ← IN PROGRESS

**Goal:** Complete all non-AI features in current React/Tailwind stack before React Native migration.

**Status:** ~65% complete (9A ✅, 9B ✅, 9C ✅, 9D ✅, 9E Core ✅)

**Timeline:** ~2 weeks remaining

---

### Phase 9A: Automated Backup System ✅ COMPLETE (Jan 10, 2026)

**Goal:** Protect user data with automated, configurable backups.

**Problem solved:** No backup solution existed. NAS failure would lose all reading history, notes, and settings.

**What was built:**
- Grandfather-father-son rotation (7 daily / 4 weekly / 6 monthly)
- Settings UI for full configuration
- Pre-sync backup trigger
- Manual backup button
- Path validation and flexibility

**Deployed:** January 10, 2026  
**Files changed:** 7 (3 backend, 2 frontend, 2 config)  
**Lines of code:** ~1,500  
**Data protected:** 1,796 books, 251 notes, all reading history 🛡️

---

### Phase 9B: Folder Structure Independence ✅ COMPLETE (Jan 10, 2026)

**Goal:** Remove dependency on folder naming conventions inherited from Obsidian plugin.

**Problem solved:** Folder naming errors like "tryslora- Fire Burning" (missing space) caused incorrect metadata despite EPUB containing correct data.

**What was built:**
- File metadata now PRIMARY source for title and authors
- Folder name parsing is FALLBACK only
- Validation filters placeholder values

**Deployed:** January 10, 2026  
**Files changed:** 2 (`sync.py`, `.cursorrules`)  
**Lines of code:** ~25 lines added  
**Risk level:** Low — additive change, no data modifications

---

### Phase 9C: Cover Extraction & Upload ✅ COMPLETE (Jan 11-13, 2026)

**Goal:** Display real cover images from EPUBs, allow custom cover uploads.

**Problem solved:** All books displayed gradient covers regardless of whether EPUB contained embedded cover images.

**What was built:**

#### Backend ✅
- **Database schema** — 3 new columns on `titles` table: `cover_path`, `has_cover`, `cover_source`
- **Cover extraction service** — Extract covers from EPUB files using OPF metadata
- **Cover storage** — `/app/data/covers/` with `extracted/` and `custom/` subfolders
- **REST API:** GET, POST, DELETE cover endpoints + bulk extraction

#### Frontend ✅
- **GradientCover rewrite** — Complete component redesign with backward compatibility
- **EditBookModal** — New cover section with upload/delete
- **BookDetail** — Async handlers, cover refresh with cache-busting
- **SettingsDrawer** — Bulk extraction tool with category selection

#### Bug Fixes ✅
All 10 bugs resolved over multiple debugging sessions.

**Status:** ✅ Phase 9C COMPLETE  
**Files changed:** 15+ (backend + frontend)  
**Lines of code:** ~1,000 added/modified  
**Bugs fixed:** 10/10  

---

### Phase 9D: Bug Fixes & UI Polish ✅ COMPLETE (Jan 15, 2026)

**Goal:** Address accumulated minor issues and UX papercuts.

**What was fixed:**

| Issue | Fix |
|-------|-----|
| Add page too complex | Simplified to two clear buttons: "Add to Library" / "Add to Wishlist" |
| Mobile author input broken | Enter key now properly creates chips instead of navigating to next field |
| Buttons not centered | Add page buttons now vertically centered |

**Deployed:** January 15, 2026  
**Files changed:** 3 (`AddChoice.jsx`, `WishlistForm.jsx`, `ManualEntryForm.jsx`)

---

### Phase 9E: Smart Collections System ✅ CORE COMPLETE (Jan 15-17, 2026)

**Goal:** Transform collections from simple manual lists to powerful organizational tools.

**Status:** Core Complete ✅ — Polish (9E.5) Next

**Timeline:** 3 days for core, polish pending

#### Day 1 Complete ✅ (Jan 15, 2026)

**Database Schema:**
- `collection_type` column — 'manual' | 'checklist' | 'automatic'
- `auto_criteria` column — JSON for automatic collection rules
- `is_default` column — Protects TBR and Reading History
- `completed_at` column — Tracks checklist completion

**Default Collections Created:**
- **TBR** (Checklist) — Appears first, books get checked off when finished
- **Reading History** (Automatic) — Auto-populates with 345 finished books

**New API Endpoints:**
- Mark book complete in checklist
- Preview criteria match count
- Duplicate collection with type change

**Bugs Fixed:** 4

#### Day 2 Complete ✅ (Jan 16, 2026)

**Frontend Components:**
- **CollectionModal.jsx** — Type selector (Manual/Checklist/Automatic) with info tooltip
- **CriteriaBuilder.jsx** — Dropdown-based criteria selection with custom status labels
- **TagsMultiSelect.jsx** — Searchable tag dropdown with keyboard navigation
- **Live preview count** — Shows matching books with 500ms debounce

**Bugs Fixed:** 5 (status labels, DNF matching, tag search, smart paste, edit rules)

#### Day 3 Complete ✅ (Jan 17, 2026)

**Checklist Behavior:**
- Completion based on book's actual reading status (Finished = complete)
- Completed books shown in separate "Completed" section at bottom
- Visual styling: green checkmark, 60% opacity, completion count
- Context menus via long-press for status changes

**New Modal Components:**
- **MarkFinishedModal** — Set finish date and optional rating
- **UpdateStatusModal** — Change status with warnings about clearing dates

**Bugs Fixed:** 4 (completion count, long-press timing, event bubbling, custom labels)

#### Three Collection Types

| Type | How Books Added | When Books Leave |
|------|-----------------|------------------|
| **Manual** | User adds manually | User removes |
| **Checklist** | User adds manually | Auto-checked when Finished (grayed, moved to bottom) |
| **Automatic** | Criteria-based rules | When no longer matches criteria |

#### Key Design Decision

Checklist completion uses the book's actual reading status as the source of truth:
```javascript
const isComplete = book.status === 'Finished';
```

This means marking a book "Finished" anywhere in the app automatically completes it in all checklists — no separate tracking needed.

---

### Phase 9E.5: Smart Collections Polish ⬅️ NEXT

**Goal:** Refine collections UX and add remaining features.

**Status:** Not started

**Planned features:**
- Scroll-to-load pagination for Reading History (currently shows 100 of 345)
- Change default TBR from Checklist to Manual type (checklist behavior not ideal for TBR use case)
- Collection reordering (drag to change sidebar order)
- View toggles (grid/list within collections)
- Cover display fixes in collection views
- Empty state messaging improvements
- Change default TBR from Checklist to Manual type (checklist behavior feels wrong for TBR)

**Timeline:** 2-3 days

---

### Phase 9F: Book Detail Redesign (Week 4)

**Goal:** Modern, comprehensive book information display.

**Status:** Not started

**Planned changes:**
- Cleaner layout with better information hierarchy
- Improved mobile experience
- Better reading history visualization
- Enhanced format management UI

**Timeline:** 3-4 days

---

### Phase 9G: Library/Home Improvements (Week 4)

**Goal:** Better discovery and navigation on main screens.

**Status:** Not started

**Planned features:**
- Improved filtering UX
- Better sorting options
- Enhanced search
- Home page widgets

**Timeline:** 2-3 days

---

### Phase 9H: Stats Page (Week 5)

**Goal:** Reading analytics and insights.

**Status:** Not started

**Planned features:**
- Calendar view of reading activity
- Reading pace tracking
- Category/format breakdowns
- Yearly goals tracking

**Timeline:** 3-4 days

---

### Phase 9I: Collections Polish (Week 5)

**Goal:** Refinements to collections system.

**Status:** Merged into 9E.5

**Note:** Originally separate, now included in Phase 9E.5 scope.

---

### Phase 9J: Deduplication Tools (Week 5)

**Goal:** Better tools for managing duplicate books.

**Status:** Not started

**Planned features:**
- Duplicate detection algorithms
- Merge suggestions
- Batch operations
- Preview before merge

**Timeline:** 2-3 days

---

### Phase 9K: Unprocessed Files Detection (Week 5)

**Goal:** Surface books in storage that aren't in Liminal database.

**Status:** Not started

**Planned features:**
- Scan for untracked files
- Show list of missing books
- Quick import from list
- Sync validation

**Timeline:** 2-3 days

---

## Technical Debt

### Known Issues for Future Resolution

**Browser Cache Issues with Covers**
- **Symptom:** After editing many book covers, changes may not reflect immediately when navigating between pages. "Use gradient" button may stop responding after many edits.
- **Workaround:** Clear browser cache for the past hour and close/reopen browser tab
- **Root cause:** Likely aggressive image caching or IntersectionObserver state management
- **Priority:** Low (workaround exists, rare occurrence)
- **To investigate:** Phase 10 or post-RN migration

---

## Phase 10: Design System Refactor (1 week)

**Goal:** Create reusable component library with calm UX principles.

**Status:** Not started

**Why:** 29 screens with ~50 distinct UI patterns need consolidation into ~30 reusable components.

**Key deliverables:**
- Component library documentation
- Design tokens (colors, spacing, typography)
- Consistent interaction patterns
- Accessibility guidelines
- Mobile-first patterns

**Timeline:** 1 week (after Phase 9)

---

## Phase 11: React Native Learning (1 week)

**Goal:** Learn React Native thoroughly before migration.

**Status:** Not started

**What to learn:**
- React Native Web fundamentals
- Platform-specific patterns (web vs. Android native)
- Navigation systems
- Gesture handling
- Build & deployment

**Timeline:** 1 week (after Phase 10)

---

## Phase 12: React Native Web Migration (4-6 weeks)

**Goal:** Port complete app to React Native Web, enable Android native builds.

**Status:** Not started

**Why migrate:**
- True Android native app (not just PWA)
- Better mobile performance
- Access to native APIs (file system, notifications, etc.)
- Single codebase for web + Android

**Timeline:** 4-6 weeks (after Phase 11)

---

## Phase 13: AI Enhancements (Future)

**Goal:** Add AI-powered features for recommendations and content generation.

**Status:** Not started

**Potential features:**
- Reading recommendations based on taste
- Auto-generated summaries
- Smart tagging
- Series recommendations
- Similar books discovery

**Timeline:** TBD (after Android native is stable)

---

## What's NOT Planned

### Spreadsheet Import
**Why deferred:** Complex feature with edge cases. Manual entry and Smart Paste handle most needs.

### Social Features
**Why not planned:** Liminal is a personal tool. Social features would fundamentally change the product.

### In-App Reader
**Why not now:** Moon+ Reader Pro works excellently. Native Android app might revisit this.

---

## Timeline Summary

| Phase | Duration | Start | Status |
|-------|----------|-------|--------|
| Phase 9A | 1 day | Jan 10 | ✅ Complete |
| Phase 9B | Same day | Jan 10 | ✅ Complete |
| Phase 9C | 3 days | Jan 11-13 | ✅ Complete |
| Phase 9D | 1 day | Jan 15 | ✅ Complete |
| Phase 9E Core | 3 days | Jan 15-17 | ✅ Complete |
| Phase 9E.5 | 2-3 days | Jan 18+ | ⬅️ Next |
| Phase 9F-9K | ~2 weeks | Late Jan | Not started |
| Phase 10 | 1 week | ~Feb 1 | Not started |
| Phase 11 | 1 week | ~Feb 8 | Not started |
| Phase 12 | 4-6 weeks | ~Feb 15 | Not started |
| **Total to RN** | **~7 weeks** | | |

**Target:** React Native Web deployed by late March 2026  
**Target:** Android native build by April 2026

---

## Immediate Next Steps

1. ~~**Complete Phase 9D** — Bug fixes & polish~~ ✅
2. ~~**Phase 9E Planning** — Smart Collections spec~~ ✅
3. ~~**Phase 9E Day 1** — Database schema + backend~~ ✅
4. ~~**Phase 9E Day 2** — Frontend: type selector, criteria builder~~ ✅
5. ~~**Phase 9E Day 3** — Checklist behavior + completion UI~~ ✅
6. **Phase 9E.5** — Polish (scroll-to-load, reorder, view toggles)
7. **Phase 9F** — Book detail redesign

---

## Success Metrics

### Phase 9 Success
- ✅ All features work on mobile
- ✅ No data loss scenarios
- ✅ Complete folder structure flexibility
- ✅ Better visual experience (real covers!)
- ✅ Simplified Add page UX
- ✅ **Powerful collections system (9E Core complete!)**
- ⬜ Collections polish (9E.5 pending)
- ⬜ Improved discovery and organization (9F-9K)

### Migration Success (Phase 12)
- Zero feature regressions
- Better mobile performance
- Working Android native build
- Happy with new codebase
- Easy to maintain going forward

---

## Notes

- **Phase 9E has detailed spec:** See `PHASE_9E_SMART_COLLECTIONS_SPEC.md`
- **Collection types:** Manual, Checklist, Automatic
- **Checklist completion:** Uses actual reading status (Finished = complete)
- **No type conversion:** Use Duplicate Collection feature instead
- **Default collections permanent:** TBR + Reading History cannot be deleted
- **Reading History pagination:** Currently shows first 100 books; scroll-to-load coming in 9E.5
- **User is actively using Liminal:** Stability and reliability are paramount
- **Mobile-first is non-negotiable:** Every feature must work well on Android
- **Quality over speed:** Taking time to do it right

---

*Roadmap reflects actual progress as of January 17, 2026. All dates are estimates and subject to change based on complexity and discovery.*
