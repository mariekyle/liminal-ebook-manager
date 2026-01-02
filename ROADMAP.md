# Liminal Product Roadmap

> **Last Updated:** January 2, 2026 (v0.15.0)

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
6. **Calm UX** — Interfaces should feel peaceful, not overwhelming *(Phase 10 focus)*

---

## Current State (v0.15.0)

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

**Recent milestones:**
- Phase 7.2b: Collections system with smart paste (Jan 2, 2026)
- Phase 7.2a: Enhanced filtering for fanfiction metadata (Jan 1, 2026)
- Phase 7.1: Per-book rescan and enhanced editing (Jan 1, 2026)
- Phase 7.0: AO3 metadata extraction (Dec 31, 2025)

---

## Roadmap Overview

```
┌─────────────────────────────────────────────────────────────┐
│  CURRENT  │  Phase 8: Quick Fixes & Polish                  │
│           │  Bug fixes, UX improvements, small features     │
├───────────┼─────────────────────────────────────────────────┤
│   NEXT    │  Phase 9: Feature Completion                    │
│           │  Unprocessed files, collections enhancements    │
├───────────┼─────────────────────────────────────────────────┤
│   MAJOR   │  Phase 10: Design System Refactor               │
│           │  Unified components, calm UX, consistency       │
├───────────┼─────────────────────────────────────────────────┤
│  FUTURE   │  Phase 11: AI Enhancements                      │
│           │  Recommendations, auto-summaries, tagging       │
└───────────┴─────────────────────────────────────────────────┘
```

---

## Phase 8: Quick Fixes & Polish ← CURRENT

**Goal:** Address accumulated bugs and UX friction before major refactors.

### 8.1 Bug Fixes (High Priority)

| Issue | Description |
|-------|-------------|
| PDF duplicates not detected | Upload screen doesn't detect existing PDFs |
| Obsidian backlinks broken | Notes imported with [[links]] aren't showing in "Referenced by" |
| Word count extraction fails | Some EPUBs show wrong word count (e.g., 116 instead of 200,000) |
| BISAC codes as genre | Some Calibre books show codes like "bus041000" |

### 8.2 Add Book Flow Improvements

- [ ] **Clarify owned book flow** — Current flow is disorienting; needs clearer guidance
- [ ] **"View in Library" destination** — Upload complete button should navigate to BookDetail, not Library grid
- [ ] **PDF duplicate detection** — Match existing PDFs like EPUBs

### 8.3 Book Detail Enhancements

- [ ] **Header metadata** — Move read-only status, rating, and category to header area
- [ ] **Edition formats display** — Show EPUB, PDF, Physical, Audiobook indicators
- [ ] **Collections section refresh** — Update look/feel/layout of collections display
- [ ] **"Referenced by" placement** — Move backlinks from Notes tab to Details tab (mobile)
- [ ] **Download link** — Make stored book location a clickable download link
- [ ] **"No summary" notice** — Show placeholder when book has no summary

### 8.4 Settings Improvements

- [ ] **Editable rating labels** — Customize star rating descriptions
- [ ] **Remove WPM helper text** — Delete "💡 Average adult: 200–300 WPM"
- [ ] **Fix default DNF label** — Change from "Def" to "Abandoned"
- [ ] **Cover display options:**
  - [ ] Show/hide title below cover
  - [ ] Show/hide author below cover
  - [ ] Show/hide title on cover

### 8.5 Minor UI Polish

- [ ] Loading states and skeleton screens
- [ ] Error handling improvements
- [ ] Mobile notes editor scrollbar fix (cosmetic)

---

## Phase 9: Feature Completion

**Goal:** Complete remaining planned features before design refactor.

### 9.1 Folder Structure Independence

**Problem:** The current sync logic extracts title, author, and series data from folder names (a pattern inherited from the Obsidian NAS importer). This creates a dependency that won't work for other users who organize their libraries differently.

**Goal:** Remove all reliance on folder naming conventions. Metadata should come entirely from:
1. EPUB/PDF file metadata
2. Manual user entry
3. Future: spreadsheet import

**Tasks:**
- [ ] Audit current folder-parsing logic in sync.py
- [ ] Document which fields currently depend on folder names
- [ ] Create fallback behavior when folder parsing yields nothing
- [ ] Update sync to prioritize file metadata over folder names
- [ ] Test with various folder structures (flat, nested, random names)
- [ ] Update documentation for new users

### 9.2 Unprocessed Files Detection

**Problem:** Some NAS folders contain only HTML files or have missing/corrupted ebook files. These books don't appear in Liminal library.

**Database:**
- [ ] `unprocessed_folders` table — folder_path, detected_files, status (new/dismissed/resolved)

**Backend:**
- [ ] Detect unsupported folders during sync (folders with files but no EPUB/PDF/MOBI/AZW)
- [ ] GET /api/unprocessed — List unprocessed folders
- [ ] POST /api/unprocessed/{id}/dismiss — Hide from list
- [ ] POST /api/unprocessed/{id}/create-title — Manually create title entry

**Frontend:**
- [ ] Settings section with "Unprocessed Files" count badge
- [ ] List view showing folder name, detected files, actions
- [ ] "Add Manually" button opens form to create title
- [ ] "Dismiss" button hides folder from list

### 9.3 Collections Enhancements

**List view option:**
- [ ] Toggle view mode — Grid vs list for collections
- [ ] List view with compact rows showing name, count, description preview

**Reordering:**
- [ ] Drag-drop collections in grid/list
- [ ] Drag-drop books within collection
- [ ] Position persistence to database

**Picker improvements:**
- [ ] Search input in CollectionPicker modal
- [ ] Recent collections shown at top

### 9.4 Cover Improvements

- [ ] Extract actual covers from EPUB files
- [ ] Upload custom covers for individual books
- [ ] Series info displayed on cover
- [ ] Theme-based cover generation (dark, light, colorful)

### 9.5 Data Import & Export

**Export:**
- [ ] Export library as spreadsheet (CSV/JSON)
- [ ] Full database backup/restore

**Import:**
- [ ] **Import from spreadsheet** — Populate library from CSV/Excel with title, author, series, category, status, rating
- [ ] Column mapping UI for flexible import
- [ ] Preview and validation before import
- [ ] Duplicate detection during import

---

## Phase 10: Design System Refactor 🎨

**Goal:** Establish a unified component library with calm UX principles, improving consistency, maintainability, and user experience across all 29+ screens.

> **Reference:** See `DESIGN_SYSTEM_REFACTOR.md` for audit findings, component specs, and implementation details.

### The Problem

Liminal grew organically from a simple scanner to a 29-screen application. UI components were built ad-hoc without a unified system, resulting in:

- **7+ modal patterns** with different close button positions and footer layouts
- **Inconsistent button colors** (green, blue, teal used interchangeably)
- **Form variations** (chip inputs sometimes above, sometimes below)
- **No reusable components** — similar patterns reimplemented differently

### The Vision

The design refactor isn't just about consistency — it's about creating a **calm, peaceful reading companion**. Every screen should feel like a quiet library, not a cluttered dashboard.

**Calm UX Principles to Embed:**
- Generous whitespace and breathing room
- Muted, harmonious color palette
- Subtle animations that don't demand attention
- Microcopy that feels warm, not robotic
- Progressive disclosure — show only what's needed
- Forgiveness in interactions — easy undo, clear escape routes

### 10A: Tokens & Primitives (2-3 days)

- [ ] Design token files (colors, spacing, typography, radius)
- [ ] `Button` component (primary, secondary, danger, ghost)
- [ ] `TextInput`, `TextArea`, `Select` components
- [ ] `Chip` component with semantic colors
- [ ] Component preview page for testing

### 10B: Modal System (2-3 days)

**Critical fixes:**
- × always on right side
- Primary buttons consistently blue
- Standard footer pattern: Cancel (text) + Action (button)

**Components:**
- [ ] Unified `Modal` with Header, Body, Footer
- [ ] `Drawer` component (right slide-out)
- [ ] Migrate all 7+ modal variants

### 10C: Layout Components (1-2 days)

- [ ] `SectionCard` — card with header and edit action
- [ ] `PageHeader` — title, subtitle, meta, action
- [ ] `SectionHeader` — all-caps label with optional action
- [ ] `MetadataRow` — label/value display
- [ ] Migrate all detail pages

### 10D: Interactive Components (2-3 days)

- [ ] `ToggleGroup` (Home/Browse/Wishlist tabs)
- [ ] `SegmentedControl` (Reading/Done/DNF)
- [ ] `ChipInput` (standardized: input above chips)
- [ ] `SearchInput` with clear button
- [ ] `StarRating` (display and interactive)

### 10E: Cards & Flows (2-3 days)

- [ ] Unified `CoverCard` with aspect variants
- [ ] `ChoiceCard` for selection flows
- [ ] `FileDropZone` for uploads
- [ ] `SuccessState` for confirmations
- [ ] `WarningBanner` for alerts

### 10F: Cleanup & Documentation (1-2 days)

- [ ] Remove all unused component files
- [ ] Performance audit
- [ ] Update ARCHITECTURE.md
- [ ] Component usage guide

### Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| Modal patterns | 7+ variants | 2 (standard + full-screen) |
| Button consistency | Mixed colors | Single primary color |
| Reusable components | ~10 | ~30 |
| User experience | Inconsistent | Calm, predictable |

---

## Phase 11: AI Enhancements (Future)

**Goal:** Let AI reduce manual work and enhance discovery.

- [ ] Auto-generate "Hot Take" summaries
- [ ] Auto-extract/suggest themes and tags
- [ ] Reading recommendations based on library and ratings
- [ ] Similar book suggestions ("If you liked X...")
- [ ] Smart collections with AI-suggested groupings

---

## Technical Debt

### Deferred (Low Priority)

| Issue | Notes |
|-------|-------|
| Merge characters into tags | Character data overlaps with tags |
| Independent wishlist filters | Separate filter state per tab |
| Folder name parsing | Too strict on dash separator |
| Status filter on Series page | Not yet implemented |
| Virtual scrolling | For very large libraries |

### Not Planned

- Calibre integration (beyond migration scripts)
- Social features / sharing
- In-app reading
- Audiobook playback
- Library lending tracking

---

## Version History

| Version | Date | Milestone |
|---------|------|-----------|
| v0.1.0 | Dec 14, 2025 | Initial release |
| v0.2.0 | Dec 17, 2025 | Core tracking |
| v0.3.0 | Dec 19, 2025 | Series system |
| v0.4.0 | Dec 20, 2025 | Obsidian import |
| v0.5.0 | Dec 22, 2025 | Book upload |
| v0.6.0 | Dec 24, 2025 | Settings, author pages |
| v0.7.0 | Dec 25, 2025 | Navigation redesign |
| v0.8.0 | Dec 26, 2025 | Notes & linking |
| v0.9.0 | Dec 28, 2025 | Wishlist system |
| v0.10.0 | Dec 30, 2025 | Reading sessions |
| v0.11.0 | Dec 30, 2025 | Home dashboard |
| v0.12.0 | Dec 31, 2025 | Enhanced metadata |
| v0.13.0 | Jan 1, 2026 | Metadata editing |
| v0.14.0 | Jan 1, 2026 | Enhanced filtering |
| v0.15.0 | Jan 2, 2026 | Collections ✨ |

### Upcoming

| Version | Phase | Focus |
|---------|-------|-------|
| v0.16.0 | 8 | Quick fixes & polish |
| v0.17.0 | 9 | Feature completion |
| v0.18.0 | 10 | Design system refactor |
| v1.0.0 | 11 | AI enhancements |

---

## Related Documentation

| Document | Description |
|----------|-------------|
| `ARCHITECTURE.md` | System design, data flow, file structure |
| `DEVELOPMENT_WORKFLOW.md` | Dev environment, deployment process |
| `CURSOR_PROMPT_GUIDE.md` | How to write effective Cursor prompts |
| `CHANGELOG.md` | Detailed version history |
| `DESIGN_SYSTEM_REFACTOR.md` | UI audit, component specs, migration plan |

---

*"A reader lives a thousand lives before he dies."*
