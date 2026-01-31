# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 9.5: Pre-Migration Completion (In Progress)
- Work Group 1: 🔄 In Progress (Session A complete)
- Work Group 2-10: ⬜ Not Started

### Technical Debt
- **Browser cache issues with covers** — After editing many book covers, changes may not reflect immediately when navigating between pages. "Use gradient" button may stop responding. Workaround: Clear browser cache for the past hour and close/reopen tab. Root cause likely related to aggressive image caching or IntersectionObserver state management. To investigate in future.

- **Checklist collection pagination infinite loop** — When viewing a checklist collection with many books (50+), scrolling to the bottom of the incomplete section causes the "Loading more books..." spinner to flicker infinitely. The IntersectionObserver keeps firing repeatedly. Attempted fixes: conditional loader rendering, removing loadingSection from effect dependencies, using refs to stabilize callback identity. Root cause is complex interaction between IntersectionObserver recreation, React useCallback identity changes, and async state updates. May need debouncing, scroll position detection instead of IntersectionObserver, or backend investigation (is `incomplete_has_more` incorrectly true?). **Workaround:** Issue only affects checklist collections; users can still use the collection with visual noise. **Priority:** Medium (cosmetic/UX).

- **TBRList → Wishlist Rename** — Storage key fixed to `liminal_sort_wishlist`, but component/file still named TBRList. Full rename deferred to React Native migration.

### Changed

#### Notes Templates
- Renamed "Reading Notes" template to "Notes While Reading" with simplified content (single `## Notes While Reading` header)
- Added new "Thoughts After Reading" template with `## Thoughts After Reading` header
- Template dropdown now shows 3 options: Structured Review, Notes While Reading, Thoughts After Reading

---

## [0.28.0] - 2026-01-25

### Added

#### Phase 9.5 Work Group 1 Session A: 3-Dot Menu Consolidation 📱
Complete action consolidation into a single 3-dot menu with responsive design and toast notifications.

**3-Dot Menu System:**
- New 3-dot menu (⋮) at top-right of book detail content area
- Desktop: Dropdown menu aligned to right edge
- Mobile: Bottom sheet with drag handle and Cancel button
- Keyboard support: Escape key closes menu
- Click-outside dismissal on desktop
- Backdrop tap dismissal on mobile

**Menu Structure:**
```
Edit Details...           → Opens EditBookModal
Edit About & Tags...      → Opens EnhancedMetadataModal  
Change Cover...           → Opens EditBookModal (temporary)
─────────────────────────
Add Reading Session       → Opens session modal
Add to Collection         → Opens collection picker
Add Format                → Opens edition modal
─────────────────────────
Merge                     → Opens merge modal
Rescan Metadata           → Triggers rescan with toast feedback
```

**Wishlist Filtering:**
- Library books: All 9 menu items visible
- Wishlist books: Only Edit Details, Edit About & Tags, Change Cover, and Merge visible
- Items appropriately hidden: Add Reading Session, Add to Collection, Add Format, Rescan Metadata

**Toast Notification System:**
- New toast component for feedback messages
- Three states: loading (spinner), success (checkmark), error (X icon)
- Positioned at bottom center of screen
- Auto-dismiss after 3 seconds (except loading state)
- Used for Rescan Metadata feedback (replaces inline messages)

**Component Architecture Improvements:**
- Extracted `Toast` component outside BookDetail (prevents remount on parent re-render)
- Extracted `ThreeDotMenu` component outside BookDetail (stable event listeners)
- Props-based design for both components
- `toastTimeoutRef` for proper cleanup on unmount (prevents memory leaks)

---

### Removed

**Consolidated Into Menu:**
- Tag icon button (opened EnhancedMetadataModal) — now "Edit About & Tags..."
- Merge icon button — now "Merge" menu item
- Pencil icon button (opened EditBookModal) — now "Edit Details..."
- "+ Add Format" standalone button after edition badges — now "Add Format" menu item
- "+ Add Session" link in Reading History (mobile) — now "Add Reading Session" menu item
- "+ Add Session" link in Reading History (desktop) — now "Add Reading Session" menu item
- "+ Add" link in Collections section — now "Add to Collection" menu item
- "Rescan Metadata" standalone section/button — now menu item with toast feedback

**Removed State:**
- `rescanResult` state variable (replaced by toast system)

---

### Fixed

**Component Stability:**
- Fixed nested component definition causing menu to unmount on parent re-render
- Event listeners now stable across parent state changes
- Menu no longer closes unexpectedly during loading states

**Memory Leak Prevention:**
- Toast timeout now tracked via `useRef`
- Timeout properly cleared on component unmount
- No "state update on unmounted component" warnings

**Null Safety:**
- Added `!book?.id` guard to `handleRescanMetadata` function
- Prevents API calls with invalid book ID during loading/race conditions

**Dead Code Removal:**
- Removed unreachable `if (result.book)` branch in handleRescanMetadata
- Now properly fetches updated book via `getBook()` after rescan

---

### Technical

#### Files Modified
- `frontend/src/pages/BookDetail.jsx` — Major refactor (menu, toast, component extraction)

#### New Components (Extracted)
- `Toast` — Notification component with loading/success/error states
- `ThreeDotMenu` — Responsive menu with dropdown (desktop) and bottom sheet (mobile)

#### Component Props
```jsx
// Toast
<Toast toast={toast} />
// toast: { message: string, type: 'success' | 'error' | 'loading' } | null

// ThreeDotMenu  
<ThreeDotMenu 
  menuOpen={menuOpen}
  setMenuOpen={setMenuOpen}
  menuItems={menuItems}
/>
// menuItems: Array<{ label, onClick, show?, type? }>
```

#### Menu Item Schema
```javascript
const menuItems = [
  { label: 'Edit Details...', onClick: () => { ... } },
  { type: 'divider' },
  { label: 'Rescan Metadata', onClick: () => { ... }, show: !isWishlist && !!book?.folder_path },
]
```

---

### Development Stats
- **Date:** January 25, 2026
- **Session:** Phase 9.5 Work Group 1, Session A
- **Files changed:** 1 (BookDetail.jsx)
- **New components:** 2 (Toast, ThreeDotMenu)
- **Items removed:** 8 (scattered icons and buttons)
- **Items consolidated:** 9 menu items
- **Bugs fixed:** 4 (stability, memory leak, null safety, dead code)

---

## [0.27.0] - 2026-01-25

### Added

#### Phase 9F: Book Detail Page Overhaul 📖
Complete redesign of book detail page with flattened structure, new components, and consistent styling.

**New Components:**

**SortDropdown:**
- Reusable sort component with localStorage persistence
- Desktop: Inline dropdown with current selection displayed
- Mobile: Bottom sheet modal for touch-friendly selection
- Per-entity storage keys (library, wishlist, collections)
- Integrated into Library.jsx and TBRList.jsx

**CollapsibleSection:**
- Reusable component for expandable content areas
- Gradient fade effect on collapsed content
- Three variants: text (line clamp), tags (height clamp), grid (height clamp)
- "View more" / "View less" toggle
- Smooth expand/collapse transitions

**ReadingStatusCard:**
- Status-aware display card with icon and subtitle
- Blue theme (indigo) for Not Started / Currently Reading
- Green theme for Finished / Abandoned
- Edit icon for finished books to access session modal
- Shows date range subtitle for completed reads

**CompactSessionRow:**
- Condensed reading session display (single row per session)
- Date line as primary element with smart formatting
- Status badge with icon (checkmark/book) and color coding
- Inline star ratings (filled stars only)
- Edit button on right side

**Reading History Compact Format:**
- Replaced verbose multi-line session cards
- New date format: "Read [start] – [end]" for completed reads
- "Started [date]" for in-progress reads
- "Finished [date]" for end-date only
- Removed "Read #N" session numbering from display
- Removed format badges from compact view

**Series Section Polish:**
- Series line above title now clickable (links to series page)
- Hover state with teal color transition
- Series list numbers with leading zeros (01, 02, 03)
- Finished books show green checkmark SVG icon
- "You are here" indicator for current book

**Page Structure Overhaul:**
- Removed "Book Details" card wrapper and header
- Flattened About/Tags/Metadata sections with border-t separators
- Flattened Reading History (mobile + desktop)
- Flattened Collections section
- Flattened Notes section
- Flattened Backlinks/Referenced by section
- Series section retains card background (related content treatment)
- Wishlist TBR card retains background (distinct UI element)
- Unified background color for gradient blending
- Updated gray-* colors to zinc-* for consistency

**Enhanced Metadata Access:**
- Tag icon button near title for ALL book categories
- Previously only available for FanFiction books
- Opens EnhancedMetadataModal for editing summary, tags, etc.

---

### Fixed

**Bug Fixes:**
- Storage key: `liminal_sort_tbr` → `liminal_sort_wishlist`
- Status normalization: spaces → underscores (`"In Progress"` → `"in_progress"`)
- Timezone fix: Manual date parsing to avoid off-by-one errors
- Dropdown alignment: `left-0` → `right-0` for proper positioning
- HTML nesting: `<span>` → `<div>` for metadata values
- Empty state logic: Check all content sources before showing "No details"
- Duplicate borders: Added `border-t-0` to CollapsibleSections

---

### Technical

#### Files Modified
- `frontend/src/pages/BookDetail.jsx` — Major refactor (page structure, components, styling)
- `frontend/src/pages/Library.jsx` — SortDropdown integration
- `frontend/src/pages/TBRList.jsx` — SortDropdown integration

#### Files Added
- `frontend/src/components/SortDropdown.jsx` — Sort UI component
- `frontend/src/components/CollapsibleSection.jsx` — Expandable sections
- `frontend/src/components/ReadingStatusCard.jsx` — Status display card
- `frontend/src/hooks/useSort.js` — Sort state management hook

#### New Components
- `SortDropdown` — Desktop dropdown + mobile bottom sheet
- `CollapsibleSection` — Gradient fade expandable sections
- `ReadingStatusCard` — Status-aware card with themes
- `CompactSessionRow` — Inline session display

---

### Development Stats
- **Date:** January 25, 2026
- **Files changed:** 6
- **New components:** 4 (SortDropdown, CollapsibleSection, ReadingStatusCard, CompactSessionRow)
- **New hooks:** 1 (useSort)
- **Features:** 6 major (sort, collapsible, status card, compact history, series polish, page overhaul)
- **Bugs fixed:** 7

---

## [0.26.2] - 2026-01-19

### Added

#### Phase 9E.5c: Collections Final Polish 🎨
Additional features and fixes to complete the collections system.

**Duplicate Collection Feature:**
- "Duplicate" option in 3-dot menu on collection detail page
- Opens modal with pre-filled name ("[Original Name] Copy")
- Can change collection type during duplication
- Manual → Manual/Checklist (preserves book list)
- Checklist → Manual/Checklist (preserves book list)
- Automatic → Automatic only (preserves criteria)
- Creates new collection with copied books/criteria

**Automatic Collection Sorting:**
- Sort dropdown for automatic collections (non-default only)
- Options: Recently Added, Title, Author, Recently Finished
- Separate sort direction toggle (↑/↓) matching Library UI
- Respects collection's default sort from criteria on initial load
- Case-insensitive sorting with COLLATE NOCASE in SQLite
- Author sorting uses json_extract() for JSON array field

**Cover Preview Improvements:**
- Thumbnail preview in cover type selector when editing collections
- Shows existing custom cover instead of camera icon
- Preview updates immediately after upload
- Proper state management when switching between Gradient/Custom

---

### Fixed

**Memory Leak Fixes:**
- Blob URLs from cover uploads now properly revoked
- useRef tracks previous URLs for correct cleanup timing
- Cleanup runs on unmount and when URLs change

**Race Condition Fixes:**
- sortVersionRef prevents stale pagination responses from corrupting state
- Guards on fetchCollection and loadMoreBooks for out-of-order responses
- Version incremented on collection change (not reset to 0)
- loadingMore flag always cleared to prevent pagination blocking

**Cover Preview State:**
- Fixed stale preview when switching cover types in modal
- Added uploadedThisSession flag to track local upload status
- Preview correctly shows after upload → switch to gradient → switch back

---

### Technical

#### Files Modified
- `frontend/src/pages/CollectionDetail.jsx` — Duplicate option, sort dropdown, race condition fixes
- `frontend/src/components/CollectionModal.jsx` — Cover preview thumbnails, memory leak fixes
- `frontend/src/components/DuplicateCollectionModal.jsx` — New component
- `frontend/src/api.js` — Added duplicateCollection()
- `backend/routers/collections.py` — Sort options, COLLATE NOCASE, duplicate endpoint

#### New Components/Functions
- `DuplicateCollectionModal` — Modal for duplicating collections with type selection
- `duplicateCollection(id, name, type)` — API function for collection duplication

#### Documentation Added
- `CODE_PATTERNS.md` — Battle-tested solutions for common problems:
  - Case-insensitive sorting (COLLATE NOCASE)
  - Loading states and race condition guards
  - API error handling patterns
  - localStorage with fallback
  - Debounced search
  - Version refs for stale response protection

---

### Development Stats
- **Date:** January 19, 2026
- **Files changed:** 5
- **New components:** 1 (DuplicateCollectionModal)
- **Lines of code:** ~200 new/modified
- **Features:** 3 major (duplicate, sort, preview)
- **Bugs fixed:** 5

---

## [0.26.1] - 2026-01-19

### Added

#### Phase 9E.5b: Collection Detail Polish 🎨
Drag-to-reorder and visual improvements for collection detail pages.

**Drag-to-Reorder Books:**
- Reorder mode toggle in 3-dot menu for Manual/Checklist collections
- Drag handles appear only in reorder mode
- @dnd-kit integration for smooth drag-and-drop
- Race condition guards prevent concurrent save operations
- Only available when all books loaded (no pagination active)

**Taller Banner Variant:**
- MosaicCover supports `banner` size (320px height)
- Used on collection detail pages for hero effect
- Proper gradient overlay maintained

---

### Fixed

**Pagination Issues:**
- Fixed checklist collection showing wrong books after reorder
- loadingMore properly cleared on all code paths

**View Mode:**
- View toggle properly hidden for default collections

---

### Technical

#### Files Modified
- `frontend/src/pages/CollectionDetail.jsx` — Drag-to-reorder, taller banner, view mode fixes
- `frontend/src/components/MosaicCover.jsx` — Taller banner variant
- `frontend/src/api.js` — Added reorderBooksInCollection()

#### New Components/Functions
- `SortableBookItem` — Wrapper component for drag-and-drop book items
- `reorderBooksInCollection(collectionId, titleIds)` — API function for book reorder

---

### Development Stats
- **Date:** January 19, 2026
- **Files changed:** 3
- **New functions:** 2 (SortableBookItem, reorderBooksInCollection)
- **Lines of code:** ~150 new/modified
- **Features:** 2 major (drag-to-reorder, taller banner)
- **Bugs fixed:** 4 (pagination, checklist, view mode, race condition)

---

## [0.26.0] - 2026-01-18

### Added

#### Phase 9E.5a: Collections Landing Page Polish 🎨
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

*Changelog current through v0.28.0 (January 25, 2026)*
