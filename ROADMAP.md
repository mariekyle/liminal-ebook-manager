# Liminal Product Roadmap

> **Last Updated:** January 13, 2026 (v0.22.0)  
> **Major Milestone:** Phase 9C Complete — Full cover extraction system working 🎉

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

## Current State (v0.22.0)

The app is fully functional for daily use with 1,700+ books. Core systems are stable:

| System | Status |
|--------|--------|
| Library browsing & search | ✅ Stable |
| Book upload & metadata extraction | ✅ Stable |
| Reading status & session tracking | ✅ Stable |
| Notes with wiki-style linking | ✅ Stable |
| Wishlist management | ✅ Stable |
| Collections system | ✅ Stable |
| Enhanced fanfiction metadata | ✅ Stable |
| Add book flow | ✅ Redesigned |
| Book detail header | ✅ Redesigned |
| Editions system | ✅ Add formats, merge duplicates |
| Automated backups | ✅ Grandfather-father-son rotation |
| Folder structure independence | ✅ File metadata primary |
| **Custom cover upload** | ✅ **Complete** |
| **Auto cover extraction** | ✅ **Complete** |
| **Bulk cover extraction** | ✅ **Complete** |
| **Gradient covers** | ✅ **Fixed (fill containers, text overlay)** |

**Recent milestones:**
- Phase 9C: Auto-extraction & bulk tool complete (Jan 13, 2026) 🎉
- Phase 9C: Cover bug fixes — 10 bugs resolved (Jan 11-13, 2026)
- Phase 9C: Cover extraction & upload — implemented (Jan 11, 2026)
- Phase 9B: Folder structure independence — file metadata now primary (Jan 10, 2026) 🎉
- Phase 9A: Automated backup system — API + Settings UI (Jan 10, 2026) 🎉
- Phase 8.7a-d: Editions consolidation — session format, add edition, merge tool (Jan 4, 2026)

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
│           │  9C: ✅ Cover System (Jan 11-13) — COMPLETE          │
│           │  9D-9K: Remaining features (3 weeks)                 │
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

**Status:** ~40% complete (9A ✅, 9B ✅, 9C ✅)

**Timeline:** 3 weeks remaining (started Jan 10, 2026)

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
- **REST API:**
  - GET `/api/covers/{title_id}` — Serve cover image (with cache-busting)
  - POST `/api/titles/{title_id}/cover` — Upload custom cover
  - DELETE `/api/titles/{title_id}/cover` — Remove custom cover
  - POST `/api/titles/{title_id}/extract-cover` — Force re-extraction
  - POST `/api/titles/covers/bulk-extract` — Bulk extraction by category

#### Frontend ✅
- **GradientCover rewrite** — Complete component redesign with backward compatibility
- **EditBookModal** — New cover section with upload/delete
- **BookDetail** — Async handlers, cover refresh with cache-busting
- **SettingsDrawer** — Bulk extraction tool with category selection
- **API functions** — `uploadCover()`, `deleteCover()`, `extractCover()`, `bulkExtractCovers()`

#### Category Behavior ✅
| Category | On Sync | Bulk Tool | Cover Type |
|----------|---------|-----------|------------|
| Fiction | ✅ Extract | ✅ Available | Real or Gradient |
| Non-Fiction | ✅ Extract | ✅ Available | Real or Gradient |
| FanFiction | ❌ Skip | ❌ Disabled | Gradient only |

#### Bug Fixes (Jan 11-13, 2026) ✅
All 10 bugs resolved over multiple debugging sessions:

| Bug | Problem | Fix |
|-----|---------|-----|
| 1 | Gradient covers not filling containers | When no size prop, fill parent |
| 2 | Missing titles/authors on covers | Restored text overlay rendering |
| 3 | Edit modal no background | Restored modal styling |
| 4 | Async handler issues | Made save handlers return promises |
| 5 | Prop incompatibility | Made GradientCover backward compatible |
| 6 | FanFiction not filtered | Filter out from bulk extract |
| 7 | Misleading counter | Added skipped_no_cover counter |
| 8 | Duplicate edition counting | Added GROUP BY t.id |
| 9 | Non-EPUB extraction failures | Added .epub extension check |
| 10 | Stale cover status | Clear when re-extraction fails |

#### Key Features Complete ✅
- ✅ **Custom upload** — Upload any image as book cover
- ✅ **Auto-extraction on sync** — Fiction/Non-Fiction books get covers automatically
- ✅ **Bulk extraction tool** — Extract covers from existing library via Settings
- ✅ **Category filtering** — FanFiction uses gradient covers only
- ✅ **Priority system** — Custom > Extracted > Gradient
- ✅ **Lazy loading** — IntersectionObserver for performance
- ✅ **Graceful fallback** — Gradient covers when no image available
- ✅ **Smart re-sync** — Stale status cleared, custom covers preserved

**Status:** ✅ Phase 9C COMPLETE  
**Files changed:** 15+ (backend + frontend)  
**Lines of code:** ~1,000 added/modified  
**Bugs fixed:** 10/10  

---

### Phase 9D: Bug Fixes & UI Polish ← NEXT

**Goal:** Address accumulated minor issues and UX papercuts.

**Status:** Not started

**Known issues to fix:**
- Missing "No summary" notice on book detail page
- Series page search behavior
- Filter state edge cases
- Mobile keyboard overlays

**Timeline:** 2-3 days

---

### Phase 9E: Smart Collections System (Week 3)

**Goal:** Rule-based dynamic collections that auto-update.

**Status:** Not started

**Planned features:**
- Rule builder UI (status, category, tags, date ranges, etc.)
- AND/OR logic support
- Auto-updating membership
- Template collections (e.g., "Read This Year", "Unread Fiction")

**Timeline:** 5-6 days

---

### Phase 9F: Book Detail Redesign (Week 4)

**Goal:** Simplified, focused book detail page.

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

**Status:** Not started

**Planned improvements:**
- Bulk operations
- Better reordering
- Collection templates
- Export/import

**Timeline:** 1-2 days

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
| Phase 9A | 3 days | Jan 10 | ✅ Complete |
| Phase 9B | Same day | Jan 10 | ✅ Complete |
| Phase 9C | 3 days | Jan 11-13 | ✅ Complete |
| Phase 9D-9K | 3 weeks | Jan 14+ | Not started |
| Phase 10 | 1 week | ~Feb 1 | Not started |
| Phase 11 | 1 week | ~Feb 8 | Not started |
| Phase 12 | 4-6 weeks | ~Feb 15 | Not started |
| **Total to RN** | **~7 weeks** | | |

**Target:** React Native Web deployed by late March 2026  
**Target:** Android native build by April 2026

---

## Immediate Next Steps

1. ~~**Complete Phase 9C** — Automatic cover extraction during sync~~ ✅
2. ~~**Deploy v0.22.0** — With auto-extraction working~~ ✅
3. **Run full sync** — Extract covers from all EPUBs
4. **Continue to Phase 9D** — Bug fixes & polish

---

## Success Metrics

### Phase 9 Success
- ✅ All features work on mobile
- ✅ No data loss scenarios
- ✅ Complete folder structure flexibility
- ✅ Better visual experience (real covers!)
- ⬜ Improved discovery and organization (9D-9K)

### Migration Success (Phase 12)
- Zero feature regressions
- Better mobile performance
- Working Android native build
- Happy with new codebase
- Easy to maintain going forward

---

## Notes

- **Phase 9C complete:** All 10 bugs fixed, auto-extraction working, bulk tool available
- **GradientCover backward compatible:** Supports both old and new prop interfaces
- **Custom cover upload working:** Upload, delete, cache-busting all functional
- **Category filtering by design:** FanFiction uses gradients only (no embedded covers typically)
- **Technical debt noted:** Browser cache issues with covers (workaround: clear cache)
- **User is actively using Liminal:** Stability and reliability are paramount
- **Mobile-first is non-negotiable:** Every feature must work well on Android
- **Quality over speed:** Taking time to do it right

---

*Roadmap reflects actual progress as of January 13, 2026. All dates are estimates and subject to change based on complexity and discovery.*
