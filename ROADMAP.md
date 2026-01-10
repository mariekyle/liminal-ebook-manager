# Liminal Product Roadmap

> **Last Updated:** January 10, 2026 (v0.19.0)  
> **Major Milestone:** Phase 9A Complete - Automated Backup System Deployed

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

## Current State (v0.19.0)

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
| **Automated backups** | ✅ **NEW — Grandfather-father-son rotation** |

**Recent milestones:**
- Phase 9A: Automated backup system — API + Settings UI (Jan 10, 2026) 🎉
- Phase 8.7a-d: Editions consolidation — session format, add edition, merge tool (Jan 4, 2026)
- Phase 8.3 + 8.4: Header redesign, cover toggles, format badges, rating labels (Jan 3, 2026)
- Phase 8.1 + 8.6: Add book flow redesign & manual entry improvements (Jan 2, 2026)

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
│           │  9B-9K: Remaining features (2-4 weeks)              │
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

**Status:** 10% complete (1 of 11 sub-phases done)

**Timeline:** 4-5 weeks remaining (started Jan 10, 2026)

---

### Phase 9A: Automated Backup System ✅ COMPLETE (Jan 10, 2026)

**Goal:** Protect user data with automated, configurable backups.

**Problem solved:** No backup solution existed. NAS failure would lose all reading history, notes, and settings.

**What was built:**

#### Backend (Days 1-2)
- **Database schema** — Settings columns + backup_history table
- **Backup service** (`backend/services/backup.py`)
  - Grandfather-father-son rotation (7 daily / 4 weekly / 6 monthly)
  - Automatic cleanup based on retention policy
  - APScheduler integration for daily backups
  - Pre-sync backup trigger
- **REST API** (`backend/routers/backups.py`)
  - GET `/api/backups/settings` — Config + stats
  - PATCH `/api/backups/settings` — Update config
  - POST `/api/backups/test-path` — Validate writability
  - POST `/api/backups/manual` — Trigger backup now
  - GET `/api/backups/history` — List backups
  - DELETE `/api/backups/history/{id}` — Delete backup
- **Integration** — Sync endpoint triggers pre-sync backups
- **Scheduler** — Starts on app startup, stops cleanly on shutdown

#### Frontend (Day 3)
- **Settings UI** — Complete backup configuration section
  - Enable/disable toggle
  - Path input with real-time validation
  - Schedule selector (before sync / daily / both)
  - Time picker (conditional on schedule)
  - Retention policy controls
  - Stats display (last backup, storage used, count breakdown)
  - Manual "Create Backup Now" button
  - Save settings with validation
- **API integration** — 6 new API functions in `api.js`

#### Key Features
- ✅ **Works out-of-box** — Defaults to `/app/data/backups` with sensible settings
- ✅ **Path flexibility** — Changeable anytime (same volume → USB → network)
- ✅ **Test button** — Validates paths before saving
- ✅ **No Docker knowledge required** — All configuration via Settings UI
- ✅ **Automatic rotation** — Monthly on 1st, weekly on Sundays, daily otherwise
- ✅ **Retention enforcement** — Old backups auto-deleted per policy

**Deployed:** January 10, 2026  
**Files changed:** 7 (3 backend, 2 frontend, 2 config)  
**Lines of code:** ~1,500  
**Data protected:** 1,796 books, 251 notes, all reading history 🛡️

---

### Phase 9B: Folder Structure Independence (Week 1-2)

**Goal:** Remove dependency on folder naming conventions inherited from Obsidian plugin.

**Status:** Not started

**Current problem:**
- Sync relies on parsing folder names: `Author - [Series ##] Title/`
- Breaks with unconventional folder structures
- Limits flexibility and accessibility for new users

**Planned solution:**
- Prioritize EPUB/PDF metadata extraction over folder parsing
- Use folder names only as last resort fallback
- Implement hierarchy: File metadata → Folder name → Filename → "Unknown"

**Timeline:** 3-4 days

---

### Phase 9C: Cover Improvements (Week 2)

**Goal:** Better visual experience for books without covers.

**Status:** Not started

**Planned features:**
- Embedded cover extraction from EPUBs
- Cover image upload
- Improved gradient cover generation
- Cover placeholder redesign

**Timeline:** 2-3 days

---

### Phase 9D: Bug Fixes & UI Polish (Week 2)

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

**Approach:**
1. Set up React Native Web infrastructure
2. Port design system components
3. Migrate pages one at a time
4. Test thoroughly on both web and Android
5. Deploy web version
6. Build and test Android APK
7. Distribute via personal deployment (not Play Store initially)

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

**Possible future:** Liminal Lite companion tool (separate project)

### Social Features
**Why not planned:** Liminal is a personal tool. Social features would fundamentally change the product.

### In-App Reader
**Why not now:** Moon+ Reader Pro works excellently. Native Android app might revisit this.

---

## Timeline Summary

| Phase | Duration | Start | Status |
|-------|----------|-------|--------|
| Phase 9A | 3 days | Jan 10 | ✅ Complete |
| Phase 9B-9K | 4 weeks | Jan 13 | Not started |
| Phase 10 | 1 week | Feb 10 | Not started |
| Phase 11 | 1 week | Feb 17 | Not started |
| Phase 12 | 4-6 weeks | Feb 24 | Not started |
| **Total to RN** | **~7 weeks** | | |

**Target:** React Native Web deployed by late March 2026  
**Target:** Android native build by April 2026

---

## Success Metrics

### Phase 9 Success
- ✅ All features work on mobile
- ✅ No data loss scenarios
- ✅ Complete folder structure flexibility
- ✅ Better visual experience
- ✅ Improved discovery and organization

### Migration Success (Phase 12)
- Zero feature regressions
- Better mobile performance
- Working Android native build
- Happy with new codebase
- Easy to maintain going forward

---

## Notes

- **Backup system deployed:** Data is now protected with automated backups 🎉
- **User is actively using Liminal:** Stability and reliability are paramount
- **Mobile-first is non-negotiable:** Every feature must work well on Android
- **Quality over speed:** Taking time to do it right
- **Learning as we go:** React Native will be learned properly, not rushed

---

*Roadmap reflects actual progress as of January 10, 2026. All dates are estimates and subject to change based on complexity and discovery.*
