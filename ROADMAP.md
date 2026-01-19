# Liminal Product Roadmap

> **Last Updated:** January 19, 2026 (v0.26.1)  
> **Major Milestone:** Phase 9E.5 Complete — Collections Polish (Landing + Detail)! 🎨

---

## Vision

Liminal is a personal reading companion that eliminates the friction of managing an ebook library across multiple systems. It provides a single, mobile-friendly home for browsing, tracking, discovering, and reflecting on books — both owned and wished for — so that the reader can spend less time managing and more time in the liminal space of reading.

---

## Current State (v0.26.1)

The app is fully functional for daily use with 1,700+ books. Core systems are stable:

| System | Status |
|--------|--------|
| Library browsing & search | ✅ Stable |
| Book upload & metadata extraction | ✅ Stable |
| Reading status & session tracking | ✅ Stable |
| Notes with wiki-style linking | ✅ Stable |
| Wishlist management | ✅ Stable |
| **Collections system** | ✅ **Smart Collections + Full Polish Complete!** |
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

**Recent milestones:**
- Phase 9E.5b: Collection detail polish complete (Jan 19, 2026) ✅
- Phase 9E.5a: Collections landing page polish complete (Jan 18, 2026) ✅
- Phase 9E Core: Smart Collections complete (Jan 15-17, 2026) ✅
- Phase 9D: Add page simplification + mobile fixes (Jan 15, 2026) ✅
- Phase 9C: Auto-extraction & bulk tool complete (Jan 13, 2026)
- Phase 9B: Folder structure independence (Jan 10, 2026)
- Phase 9A: Automated backup system (Jan 10, 2026)

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
│           │  9E.5: ✅ Collections Polish (Jan 18-19)             │
│           │  9F-9K: ⬅️ Remaining features (~2 weeks)             │
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

**Status:** ~75% complete (9A-9E.5 ✅)

**Timeline:** ~1.5 weeks remaining

---

### Phase 9E.5: Collections Polish ✅ COMPLETE (Jan 18-19, 2026)

**Goal:** Professional UX for collections throughout the app with calm aesthetics.

**Problem solved:** Collections landing and detail pages were basic and lacked organization features. No way to reorder collections or books, switch views, or quickly edit/delete.

---

#### Phase 9E.5a: Collections Landing Page (Jan 18)

**3-Dot Menu:**
- Text-only options menu (⋮) in upper right
- "Add Collection" — Opens create modal
- "Reorder Collections" — Enters reorder mode
- "View: Grid/List" — Toggles view mode
- Adapts during reorder mode (only shows "Add Collection")

**Grid/List View Toggle:**
- Grid view: 2 columns mobile, 3-4 desktop
- List view: Single column with mini thumbnails + descriptions
- Collection info below covers in grid view
- View preference persists via localStorage
- Smooth transitions between views

**Reorder Collections:**
- Visual banner with "Reorder Mode" + "Done" button
- Auto-switches to list view when activated
- Two labeled sections: "DEFAULT COLLECTIONS" and "MY COLLECTIONS"
- Visual separator border between sections
- Drag handles (≡) only on user collections
- Default collections (To Be Read, Reading History) pinned at top
- Uses @dnd-kit for smooth drag-and-drop
- Restores previous view mode on exit

**Collection Gradients:**
- 3 expressive gradient styles (Layered Mist, Drift Bloom, Veiled Depth)
- 2-3 colors per gradient (reduced from 4-6)
- Softer color blending with color-mix() intermediate steps
- Deterministic based on collection name + ID hash
- Uses same 10-color palette as book gradients
- 6 total combinations (3 styles × 2 variations)

**Context Menu:**
- Right-click (desktop) or long-press 500ms (mobile)
- Text-only menu: "Edit Collection" and "Delete Collection"
- Delete hidden for default collections
- Confirmation dialog before deletion
- Edit opens modal with existing data pre-filled

---

#### Phase 9E.5b: Collection Detail Page (Jan 19)

**Drag-to-Reorder Books:**
- "Reorder Books" option in 3-dot menu for manual/checklist collections
- Only available when all books loaded (pagination safety)
- Reorder mode forces list view, restores user preference on exit
- Drag handles (⋮⋮) on right side of each book row
- Visual "Saving..." feedback during API call
- Race condition protection prevents concurrent drags
- For checklists: only incomplete section is reorderable
- Completed books remain sorted by completion date

**Taller Collection Banner:**
- Banner height doubled: h-96 (384px) / md:h-[28rem] (448px)
- More visual impact and breathing room
- Works with both gradient and custom cover images

**Technical Safeguards:**
- Reorder button hidden until all books loaded
- Reorder button hidden for checklists with only completed books
- View mode preference preserved after exiting reorder
- Memoized drag sensor options for performance

---

**Deployed:** January 18-19, 2026  
**Files changed:** 8 total  
**New components:** 2 (CollectionGradient, SortableBookItem)  
**Dependencies:** @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities  
**Lines of code:** ~950  
**Features:** 7 major  
**Bugs fixed:** 8

---

### Phase 9F: Book Detail Redesign ⬅️ NEXT

**Goal:** Modern, comprehensive book information display.

**Status:** Not started

**Planned features:**
- Redesigned header with better hierarchy
- Edition switcher (if multiple formats exist)
- Metadata display improvements
- Reading session history
- Related books section
- Better mobile layout

**Timeline:** 2-3 days

---

### Phase 9G: Library/Home Improvements

**Goal:** Enhance main library browsing experience.

**Status:** Not started

**Planned features:**
- Advanced filtering UI
- Sort options improvements
- Recently added section
- Continue reading section
- Search improvements
- Performance optimizations

**Timeline:** 2-3 days

---

### Phase 9H: Stats Page

**Goal:** Reading analytics and visualizations.

**Status:** Not started

**Planned features:**
- Books read this year/month
- Reading streaks
- Genre breakdown
- Authors most read
- Average rating
- Word count totals
- Charts and visualizations

**Timeline:** 2-3 days

---

### Phase 9J: Deduplication Tools

**Goal:** Help identify and merge duplicate books.

**Status:** Not started

**Planned features:**
- Duplicate detection algorithm
- Side-by-side comparison UI
- Merge workflow
- Smart conflict resolution
- Bulk duplicate management

**Timeline:** 2-3 days

---

### Phase 9K: Unprocessed Files Detection

**Goal:** Surface books that exist in storage but aren't in database.

**Status:** Not started

**Planned features:**
- Scan storage folders for all files
- Compare with database entries
- List unprocessed files
- Quick add workflow
- Bulk import option

**Timeline:** 1-2 days

---

## Completed Phases

### Phase 9E: Smart Collections System ✅ COMPLETE (Jan 15-17, 2026)

**Goal:** Transform collections from simple manual lists to powerful organizational tools.

**What was built:**

**Three Collection Types:**
- **Manual:** User adds/removes books (e.g., "Favorites", "Re-reads")
- **Checklist:** User adds books, auto-checks off when finished (e.g., "2026 Reading Challenge")
- **Automatic:** Auto-populates based on criteria (e.g., "All 5★ books", "Read this year")

**Default Collections:**
- "To Be Read" (Manual type) — Cabinet of curiosities metaphor
- "Reading History" (Automatic type) — Auto-populates with all finished books

**Checklist Behavior:**
- Completion based on actual book status (Finished = complete)
- Completed books in separate section with checkmark + grayed appearance
- Long-press context menu for quick status changes
- Two modals: Mark Finished (date + rating) or Update Status

**Automatic Collections:**
- Criteria builder with Tags, Status, Category, Rating, Date ranges, Word count
- Live preview count (debounced)
- Smart paste support for criteria rules
- Dynamic population (no manual book management)

**Database Changes:**
- `collection_type`, `auto_criteria`, `is_default` columns
- `completed_at` timestamp for checklists
- Migration for existing collections

**Timeline:** 3 days (Jan 15-17)  
**Files changed:** 8  
**New components:** 3  
**API endpoints:** 4 new, 3 enhanced  
**Bugs fixed:** 13

---

### Phase 9D: Bug Fixes & Polish ✅ COMPLETE (Jan 15, 2026)

**Goal:** Simplify Add page and fix mobile author input.

**What was built:**
- Two-button choice page (Add to Library / Add to Wishlist)
- Fixed Enter key behavior for author chips on mobile
- Vertically centered layout

**Bugs fixed:** 3

---

### Phase 9C: Cover System Improvements ✅ COMPLETE (Jan 11-13, 2026)

**Goal:** Extract covers from EPUBs and allow custom uploads.

**What was built:**
- Auto-extraction from EPUBs during sync
- Custom cover upload with preview
- Bulk extraction tool for existing books
- Cover priority: custom > extracted > gradient
- Delete/revert cover functionality

**Bugs fixed:** 10

---

### Phase 9B: Folder Structure Independence ✅ COMPLETE (Jan 10, 2026)

**Goal:** Remove dependency on folder naming conventions.

**What was built:**
- File metadata now primary source
- Folder name parsing as fallback only
- Smart parsing for both formats

**Issues resolved:** Incorrect metadata from poorly-named folders

---

### Phase 9A: Automated Backup System ✅ COMPLETE (Jan 10, 2026)

**Goal:** Protect user data with automated backups.

**What was built:**
- Grandfather-father-son rotation (7 daily / 4 weekly / 6 monthly)
- Settings UI for configuration
- Pre-sync backup trigger
- Manual backup button

**Data protected:** 1,796 books, 251 notes, all reading history

---

## Phase 10: Design System Refactor

**Goal:** Establish unified design system before React Native migration.

**Status:** Planned

**Why:** Current UI has inconsistencies across 29 screens. Refactor ensures clean patterns to port.

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

**Why:** Learn React Native properly without pressure of incomplete features.

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

**Why:** Better mobile experience, offline support, native features.

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

---

*Roadmap current through Phase 9E.5 (January 19, 2026)*
