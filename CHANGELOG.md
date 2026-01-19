# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 9: Feature Completion (In Progress)
- Phase 9E Core: ✅ Complete (Jan 15-17)
- Phase 9E.5: ✅ Complete (Jan 18) - Collections landing page polish
- Phase 9F: ⬅️ Next - Book detail redesign
- Phase 9G: Library/Home improvements
- Phase 9H: Stats page
- Phase 9J: Deduplication tools
- Phase 9K: Unprocessed files detection

### Technical Debt
- **Browser cache issues with covers** — After editing many book covers, changes may not reflect immediately when navigating between pages. "Use gradient" button may stop responding. Workaround: Clear browser cache for the past hour and close/reopen tab. Root cause likely related to aggressive image caching or IntersectionObserver state management. To investigate in future.

---

## [0.26.0] - 2026-01-18

### Added

#### Phase 9E.5: Collections Landing Page Polish 🎨
Complete UX overhaul of collections landing page with professional interaction patterns and calm aesthetics.

**3-Dot Menu:**
- Menu button (⋮) in upper right with text-only options
- "Add Collection" - Opens create modal
- "Reorder Collections" - Enters reorder mode
- "View: Grid" or "View: List" - Toggles view mode
- Menu adapts during reorder mode (only shows "Add Collection")

**Grid/List View Toggle:**
- Grid view: 2 columns on mobile, 3-4 on desktop
- List view: Single column with mini thumbnails + description
- Collection name and book count below covers in grid view
- Description shown in gray-500, smaller text, truncated in list view
- View preference persists via localStorage

**Reorder Mode:**
- Visual banner with "Reorder Mode" text and "Done" button
- Automatically switches to list view when activated
- Two labeled sections: "DEFAULT COLLECTIONS" and "MY COLLECTIONS"
- Visual separator border between default and user collections
- Drag handles (≡) only visible on user collections
- Default collections (To Be Read, Reading History) pinned at top
- Smooth drag-and-drop using @dnd-kit
- Restores previous view mode on exit

**Collection Gradients:**
- 3 expressive gradient styles:
  - **Layered Mist:** Soft atmospheric layers with overlay blend
  - **Drift Bloom:** Organic radial overlaps creating blooming effect
  - **Veiled Depth:** Subtle depth with texture using blend modes
- 2-3 colors per gradient (reduced from original 4-6)
- Softer color blending with intermediate color-mix steps
- Deterministic generation based on collection name + ID hash
- Uses same 10-color palette as book gradients
- Total: 6 gradient combinations (3 styles × 2 color variations)

**Context Menu:**
- Right-click (desktop) or long-press 500ms (mobile) on collection cards
- Text-only menu options:
  - "Edit Collection" - Opens modal with existing data
  - "Delete Collection" - Shows confirmation (hidden for defaults)
- Confirmation dialog before deletion with cancel/confirm buttons
- Menu closes when clicking outside

---

### Changed

**Collections Landing Page Layout:**
- Removed old "New" button from header
- Collection info (name + count) moved below covers in grid view
- List view shows descriptions in smaller, muted text

---

### Fixed

**Reorder Mode UX:**
- Fixed drag-and-drop index calculation using arrayMove
- Prevented view toggle during reorder mode to avoid broken state
- Removed unused previousViewMode state (localStorage guard sufficient)
- Default collections no longer show drag handles (confusing affordance removed)

**Context Menu:**
- Long-press works reliably on mobile with 500ms threshold
- Menu properly closes when clicking outside backdrop
- Context menu doesn't interfere with normal card navigation
- Menu hidden during reorder mode

---

### Technical

#### Files Added
- `frontend/src/components/CollectionGradient.jsx` — Gradient generation component

#### Files Modified
- `frontend/src/components/CollectionCard.jsx` — Grid/list layouts, context menu, drag handles
- `frontend/src/components/CollectionsTab.jsx` — Menu, reorder mode, view toggle, handlers
- `frontend/src/api.js` — Added reorderCollections(), deleteCollection()
- `backend/routers/collections.py` — Added POST /collections/reorder endpoint

#### Dependencies Added
- `@dnd-kit/core@^6.3.1` — Core drag-and-drop functionality
- `@dnd-kit/sortable@^10.0.0` — Sortable list support
- `@dnd-kit/utilities@^3.2.2` — Transform utilities for smooth animations

#### Gradient Algorithm
```javascript
seed = hashString(`${collectionName}-${collectionId}`)
styleIndex = seed % 3  // 0-2 (3 styles)
numColors = 2 + (seed % 2)  // 2 or 3 colors
rotation = seed % 360  // Angle in degrees
```

Soft blending uses color-mix() for intermediate stops at 25%, 50%, 75%.

---

### Development Stats
- **Date:** January 18, 2026
- **Files changed:** 5
- **New components:** 1
- **Lines of code:** ~800 new/modified
- **Features:** 5 major (menu, toggle, reorder, gradients, context menu)
- **Bugs fixed:** 4

---

## [0.25.1] - 2026-01-17

### Changed

#### Phase 9E.5: TBR Collection Type Change 🎯
Converted default TBR from Checklist to Manual type based on user feedback that checklist behavior felt wrong for a reading list.

**Collection Changes:**
- TBR renamed to "To Be Read" with new description
- Type changed from Checklist to Manual (no completion tracking)
- Description updated to calm, curiosity-focused language
- Old "TBR" collections can now be manually deleted (is_default flag removed)

---

### Added

#### Pagination Loading Indicators
Visual feedback when scrolling to load more books in collections.

---

### Fixed

#### Empty Collection UX Improvements
Better handling of empty collections and menu options.

#### Collection Description Handling
Fixed multiple issues with collection description field.

---

## [0.25.0] - 2026-01-17

### Added

#### Phase 9E Day 3: Checklist Behavior 🎉
Complete checklist functionality with visual styling, context menus, and status-based completion tracking.

---

## [0.24.0] - 2026-01-16

### Added

#### Phase 9E Day 2: Smart Collections Frontend 🎨
Complete frontend implementation with type selector, criteria builder, and live preview.

---

## [0.23.0] - 2026-01-15

### Added

#### Phase 9E Day 1: Smart Collections Backend 🎉
Database schema and API endpoints for three collection types.

---

## Earlier Versions

See git history for Phase 9A-9D and earlier.

---

*Changelog current through v0.26.0 (January 18, 2026)*
