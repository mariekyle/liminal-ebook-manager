# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 9.5: Pre-Migration Completion (In Progress)
- Work Group 1: 🔄 In Progress (Sessions A, B, B+, C1-C3 complete — C4 next)
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

## [0.31.0] - 2026-02-02

### Added

#### Phase 9.5 Work Group 1 Session C: Navigation & Layout Overhaul 🧭
Major navigation redesign affecting bottom nav, Library header, and all detail pages.

**C1: Bottom Nav Redesign**
- Replaced Library book icon with italic script "L" (Libre Baskerville font)
- Replaced Add button with Settings (gear icon, navigates to /settings)
- Created new Settings page with UnifiedNavBar title-only variant
- Added Google Fonts link for Libre Baskerville

**Bottom Nav Order (New):**
| Position | Item | Icon |
|----------|------|------|
| 1 | Library | Script "L" |
| 2 | Series | Stacked boxes |
| 3 | Collections | List |
| 4 | Authors | Person |
| 5 | Settings | Gear |

**C2: Remove Brand Header**
- Removed "Liminal" brand header from Library page entirely
- Library tabs (Home/Browse/Wishlist) now topmost element with sticky positioning
- Added action icons to tab bar right side:
  - Home tab: [+] [🔍]
  - Browse tab: [+] [🔍] [🔽]
  - Wishlist tab: [+] [🔍] [🔽]
- Wired up actions: + → /add, 🔍 → search modal, 🔽 → filter drawer
- Removed legacy Header component from App.jsx

**C3: Detail Page Contextual Nav**
- Created `UnifiedNavBar` component with two variants:
  - Back link variant: `backTo` (Link-based) or `onBack` (callback-based)
  - Title-only variant: for Settings page
- Applied to all detail pages with contextual back navigation:

| Page | Back Label | Destination |
|------|------------|-------------|
| Book Detail | Dynamic | returnUrl from state (Collections/Series/Authors/Library) |
| Series Detail | Series | Browser history (navigate -1) |
| Author Detail | Authors | Browser history (navigate -1) |
| Collection Detail | Collections | /collections |
| Settings | (title only) | N/A |
| Add Page | Back | Multi-step form logic (handleBack) |

**returnUrl Pattern:**
- BookDetail reads `returnUrl` from location state
- SeriesDetail passes `returnUrl` when linking to books
- Back label dynamically shows origin ("← Collections", "← Series", etc.)

---

### Removed

**Legacy Components:**
- Removed Header component render from App.jsx (brand bar no longer used)
- Removed Add button from bottom nav (replaced with Settings)
- Removed book icon from Library nav item (replaced with script "L")

**From Library.jsx:**
- Removed brand header section ("Liminal" + gear icon)
- Removed `isLibraryPage` conditional logic from App.jsx

---

### Changed

**Library Page:**
- Tab bar now sticky at `top-0` (was `top-[57px]`)
- Tabs use underline style instead of pill buttons
- Actions integrated into tab bar header

**Detail Pages:**
- All detail pages now use UnifiedNavBar for consistent navigation
- Responsive padding: `px-4 md:px-8` on all nav bars

**Navigation Behavior:**
- SeriesDetail/AuthorDetail use history-based back (`navigate(-1)`)
- BookDetail uses explicit returnUrl for predictable navigation
- AddPage preserves multi-step form back navigation

---

### Technical

#### Files Created
- `frontend/src/components/UnifiedNavBar.jsx` — Reusable contextual nav bar
- `frontend/src/pages/Settings.jsx` — New settings page (placeholder)

#### Files Modified
- `frontend/src/components/BottomNav.jsx` — Script L, Settings replaces Add
- `frontend/src/pages/Library.jsx` — Remove brand header, restructure tab bar
- `frontend/src/App.jsx` — Remove Header, add /settings route
- `frontend/src/pages/BookDetail.jsx` — Use UnifiedNavBar with returnUrl
- `frontend/src/pages/SeriesDetail.jsx` — Use UnifiedNavBar, pass returnUrl to books
- `frontend/src/pages/AuthorDetail.jsx` — Use UnifiedNavBar with history back
- `frontend/src/pages/CollectionDetail.jsx` — Use UnifiedNavBar
- `frontend/src/pages/AddPage.jsx` — Use UnifiedNavBar with handleBack
- `frontend/index.html` — Add Libre Baskerville Google Font

#### Component API
```jsx
// Back link variant (Link-based)
<UnifiedNavBar backLabel="Library" backTo="/" />

// Back link variant (callback-based)
<UnifiedNavBar backLabel="Back" onBack={handleBack} />

// Title-only variant
<UnifiedNavBar title="Settings" />

// With right-side content
<UnifiedNavBar backLabel="Library" backTo="/">
  <button>•••</button>
</UnifiedNavBar>
```

#### Navigation Specs
```
Script "L": font-family: 'Libre Baskerville'; font-style: italic; font-size: 1.5rem
Nav icon size: 24px (w-6 h-6)
Colors: #6b6b6b (inactive) / #14b8a6 (active)
```

---

### Known Issues (To Fix)

- **Author Detail → Book returnUrl** — Not passing returnUrl; back shows "Library" instead of "Authors"
- **Search filter redirect** — Filter link in search modal redirects to Home instead of filtered Browse

---

### Development Stats
- **Date:** February 2, 2026
- **Session:** Phase 9.5 Work Group 1, Session C (C1-C3)
- **Files created:** 2 (UnifiedNavBar.jsx, Settings.jsx)
- **Files modified:** 9
- **Components added:** 1 (UnifiedNavBar)
- **Items completed:** 11 (C1: 3, C2: 4, C3: 4)

---

## [0.30.0] - 2026-02-01

### Added

#### Phase 9.5 Work Group 1 Session B+: Change Cover Modal 🖼️
Dedicated modal for cover management, restoring functionality removed in Session B.

**ChangeCoverModal Component:**
- New `ChangeCoverModal.jsx` component
- Cover preview at 200×300px with rounded corners and shadow
- Cover source badge: "Custom Cover", "Extracted from EPUB", or "Generated Gradient"
- Three action buttons with loading states and inline error display

**Cover Actions:**

| Action | Behavior | Visibility |
|--------|----------|------------|
| Upload Image | Opens file picker, uploads selected image | Always |
| Extract from EPUB | Extracts embedded cover from EPUB file | Library books with EPUB files; disabled if already extracted |
| Use Gradient Instead | Removes custom/extracted cover, reverts to gradient | Only when book has custom or extracted cover |

**Menu Integration:**
- Added "Change Cover" menu item after "Edit"
- Removed ellipsis from menu labels ("Edit..." → "Edit", no "..." on Change Cover)

**Updated Menu Structure:**
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

### Fixed

**EPUB Detection:**
- Fixed "Extract from EPUB" button not appearing
- Changed detection from `book.formats` to `book.editions` (correct field name)

**Pairing Type Field:**
- Fixed pairing type changes not saving
- Field now correctly reads/writes to `ao3_category` database column
- Removed orphan `pairing_type` from save payload

---

### Technical

#### Files Created
- `frontend/src/components/ChangeCoverModal.jsx` — Cover management modal

#### Files Modified
- `frontend/src/pages/BookDetail.jsx` — Add modal state, menu item, import
- `frontend/src/components/UnifiedEditModal.jsx` — Fix ao3_category field mapping

#### Component Props
```jsx
<ChangeCoverModal
  book={object}
  isOpen={boolean}
  onClose={() => void}
  onSuccess={(message) => void}
/>
```

#### EPUB Detection Logic
```javascript
// Correct - uses editions array
const hasEpubFiles = book.editions?.some(e => 
  e.file_path?.toLowerCase().endsWith('.epub')
);
```

#### API Functions Used (existing)
- `uploadCover(titleId, file)` — Upload custom cover
- `extractCover(titleId)` — Extract from EPUB
- `revertToGradient(titleId)` — Remove custom cover

---

### Development Stats
- **Date:** February 1, 2026
- **Session:** Phase 9.5 Work Group 1, Session B+
- **Files created:** 1 (ChangeCoverModal.jsx)
- **Files modified:** 2 (BookDetail.jsx, UnifiedEditModal.jsx)
- **Bugs fixed:** 2 (EPUB detection, pairing type save)
- **Features restored:** 3 (upload, extract, gradient revert)

---

## [0.29.0] - 2026-02-01

### Added

#### Phase 9.5 Work Group 1 Session B: Unified Edit Modal 📝
Single tabbed modal replaces two separate edit modals with dynamic content based on book category.

**UnifiedEditModal Component:**
- New `UnifiedEditModal.jsx` component with segmented control tabs (iOS-style)
- Dynamic tab count: 2 tabs for most books, 3 tabs for FanFiction library books
- Single "Save" button submits all fields across tabs
- Bottom sheet modal style (85% height, rounded top corners)

**Tab Structure:**

| Tab | Fields | Visibility |
|-----|--------|------------|
| Details | Title, Authors, Series/#, Category, Year, Source URL | All books |
| About | Summary*, Tags, Pairing Type** | All books |
| Metadata | Completion Status, Fandom, Ships, Content Rating, Warnings | FanFiction library only |

*Summary label shows "Why this one?" for wishlist items  
**Pairing Type only visible for Fiction and FanFiction categories

**Menu Consolidation:**
- Previous: 3 separate items ("Edit Details...", "Edit About & Tags...", "Change Cover...")
- Now: Single "Edit..." menu item opens unified modal
- "Change Cover..." temporarily removed (restored in Session B+)

**Updated Menu Structure:**
```
Edit...                   → UnifiedEditModal (tabbed)
─────────────────────────
Add Reading Session       → Session modal
Add to Collection         → Collection picker
Add Format                → Edition modal
─────────────────────────
Merge                     → Merge modal
Rescan Metadata           → Toast feedback (library books with folder only)
```

---

### Removed

**Deleted Components:**
- `EditBookModal.jsx` — Replaced by UnifiedEditModal
- `EnhancedMetadataModal.jsx` — Replaced by UnifiedEditModal

**Removed from BookDetail.jsx:**
- `import EditBookModal` and `import EnhancedMetadataModal`
- `showEnhancedModal` and `editModalOpen` state variables
- `handleMetadataSave` and `handleSaveEnhancedMetadata` handler functions
- `<EditBookModal />` and `<EnhancedMetadataModal />` JSX

**Field Removed from Edit UI:**
- Characters field — Merged into Tags (data preserved in database, still displays on detail page)

**Menu Items Consolidated:**
- "Edit Details..." → merged into "Edit..."
- "Edit About & Tags..." → merged into "Edit..."
- "Change Cover..." → temporarily removed (Session B+ will restore)

---

### Changed

**Field Visibility Logic:**
- Pairing Type: Now only shows for Fiction and FanFiction categories (previously always visible)
- Metadata tab: Only appears for FanFiction library books (not wishlist, not other categories)
- Summary label: Dynamic based on acquisition status ("Summary" vs "Why this one?")

**Save Handler:**
- `completion_status` now conditionally included only when defined (FanFiction books only)
- Prevents sending undefined metadata fields to backend for non-FanFiction books

---

### Technical

#### Files Created
- `frontend/src/components/UnifiedEditModal.jsx` — New unified edit modal

#### Files Modified
- `frontend/src/pages/BookDetail.jsx` — Import new modal, remove old modals, update menu items

#### Files Deleted
- `frontend/src/components/EditBookModal.jsx`
- `frontend/src/components/EnhancedMetadataModal.jsx`

#### Component Props
```jsx
<UnifiedEditModal
  isOpen={boolean}
  onClose={() => void}
  book={object}
  isWishlist={boolean}
  onSave={(updates) => void}
/>
```

#### Tab Visibility Logic
```javascript
const isFanFiction = book?.category === 'FanFiction';
const showMetadataTab = isFanFiction && !isWishlist;
const tabs = showMetadataTab 
  ? ['Details', 'About', 'Metadata'] 
  : ['Details', 'About'];
```

---

### Development Stats
- **Date:** February 1, 2026
- **Session:** Phase 9.5 Work Group 1, Session B
- **Files created:** 1 (UnifiedEditModal.jsx)
- **Files modified:** 1 (BookDetail.jsx)
- **Files deleted:** 2 (EditBookModal.jsx, EnhancedMetadataModal.jsx)
- **Modals consolidated:** 2 → 1
- **Menu items consolidated:** 3 → 1

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

## [0.27.0] - 2026-01-19

### Added
- Collection landing page with grid view
- Collection detail page with book list
- Manual collection reordering via drag-and-drop
- Collection gradient covers
- Smart Paste for bulk adding books to collections

### Changed
- Collections now support three types: Manual, Checklist, Automatic
- Automatic collections use criteria builder for dynamic filtering

---

## [0.26.0] - 2026-01-17

### Added
- Smart Collections system (Manual, Checklist, Automatic types)
- Criteria builder for automatic collections
- Collection type badges and icons

---

## [0.25.0] - 2026-01-15

### Added
- Add book flow redesigned with category selection
- Mobile-optimized add book form
- Simplified metadata entry

### Fixed
- Various mobile layout issues
- Form validation improvements

---

## [0.24.0] - 2026-01-13

### Added
- Auto cover extraction from EPUB files
- Custom cover upload functionality
- Bulk cover extraction tool
- Cover management in edit modal

---

## [0.23.0] - 2026-01-11

### Added
- Cover extraction service
- EPUB cover detection algorithm
- Fallback to gradient covers when no embedded cover

---

## [0.22.0] - 2026-01-10

### Added
- Folder structure independence (file metadata primary)
- Smart folder name parsing as fallback
- Automated backup system with grandfather-father-son rotation
- Backup settings in drawer

---

## [0.21.0] - 2026-01-08

### Added
- Enhanced fanfiction metadata extraction
- AO3 tag parsing
- Fandom, ships, characters fields
- Content rating and warnings

---

## [0.20.0] - 2026-01-05

### Added
- Reading session tracking
- Multiple reads per book support
- Session edit modal
- Reading history display

---

*For older versions, see git history.*
