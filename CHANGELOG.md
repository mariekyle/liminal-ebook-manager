# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.34.0] - 2026-03-24

### Changed

#### Warm Gradient Palette (10.0.15)
- Replaced 8 vivid hue lanes with 10 warm desaturated lanes (Clay, Sage Teal, Slate Blue, Amber, Lichen, Ochre, Dusty Plum, Storm, Sandstone, Muted Rose)
- Lowered saturation range from 22-34% to 18-30% for cohesion with warm charcoal backgrounds
- Adjusted dark theme lightness from 46-62% to 42-58% for better contrast
- Increased vignette opacity from 0.10 to 0.12 for text contrast
- Ran migration script on all ~1,700 titles to regenerate cover_gradient values
- GradientCover.jsx unchanged (FROZEN) — backend-only change in `backend/services/covers.py`

#### BookCard v4 (10.0.10)
- Rewrote BookCard with `variant` prop: "standard", "compact", "list"
- Grid badges: opaque dark bg (rgba(26,25,24,0.88)) + white icons for Finished/DNF/Wishlist/Checklist
- In Progress: 4px teal progress bar at cover bottom (no badge)
- List view: cover overlays for Finished/DNF, teal dot + progress bar for In Progress
- Estimated read time display (clock icon + ~Xh)
- Backward compatible with legacy boolean props (showTitleBelow, etc.)
- Killed: dashed wishlist border, activity bar (replaced by progress bar), backdrop-blur badges, text DNF badge, left-edge color stripe

#### ThreeDotMenu Extraction (10.0.14)
- Extracted ThreeDotMenu from BookDetail.jsx to `components/ui/ThreeDotMenu.jsx`
- Zero behavior changes — desktop dropdown + mobile bottom sheet identical
- Now importable by Series, Author, Collection detail pages (used in 10.0C)

### Fixed

#### Rating Type Bug
- Changed `rating` field from `Optional[int]` to `Optional[float]` in four Pydantic models: `TitleSummary`, `TitleDetail`, `FanficTitleDetail`, `BookRatingUpdate`
- Was causing 500 errors on Browse screen when any book had a half-star rating (e.g., 4.5)
- Bug had been active since ~March 20 in `backend/routers/titles.py`

### Removed
- Wishlist dashed card border (bookmark badge is sufficient)
- showActivityBar prop from BookCard (replaced by ProgressBar)

---

## [0.33.0] - 2026-03-20

### Added

#### Phase 10.0.10: BookCard Redesign (mockup v4 approved)
Design-only — implementation pending.

**Grid view badges:**
- Opaque dark bg (`rgba(26,25,24,0.88)`) + white icons for all badge types — ~7:1 contrast on any gradient
- Finished: checkmark icon. DNF: pause icon (⏸). Wishlist: bookmark icon. Unread: no badge.
- In Progress: 4px progress bar with opaque dark track (50% default until real percentage data exists)
- Checklist completed: green bg badge + card dimmed to 45%

**List view:**
- Finished: checkmark overlay on cover thumbnail (50% scrim), no text status
- DNF: pause overlay on cover thumbnail (50% scrim), no text status
- In Progress: teal dot + label + progress bar (only status with text indicator)
- Unread: clean row with no status indicator
- Est. read time shown for all items

**Killed from earlier mockup iterations:**
- Left-edge color stripe (couldn't be intuited, added visual noise)
- Wishlist dashed/subtle border (bookmark badge is sufficient)
- Backdrop-blur on badges (inconsistent across gradients, poor performance)
- Text "DNF" badge (breaks when user renames status in settings)
- Status dot/label for finished and DNF in list view (cover overlays are clearer)

**Component API simplified:**
- Three boolean props (`showTitleBelow`, `showAuthorBelow`, `showSeriesBelow`) → single `variant` prop
- Variants: standard (3-col grid), compact (4-col grid), list (horizontal row)

#### Phase 10.0C: Full Component Conversion (planned)
8-session systematic conversion of all 62 JSX files to shared design system components.

**Scope determined by Claude Code frontend audit (`FRONTEND_AUDIT_2026.md`):**
- 26 bespoke modals → shared `<Modal>`
- ~262 raw `<button>` instances → `<Button>` component
- 81 raw form elements → `<FormField>` component
- ~1,445 hardcoded color instances → warm token variables
- 5 pages missing `<UnifiedNavBar>` → add nav
- 4 modals missing Escape handler → fixed by Modal adoption
- ChipInput, StarRating, FileDropZone → extract to components/ui/

**Timeline:** C1-C3 before 10.1 (BookDetail + Library + HomeTab), C4-C8 interleaved with features.

#### Gradient Palette Warm Shift (approved)
10 gradient lane seed colors updated from vivid Tailwind-stock to warm desaturated palette matching Warm A tokens. Implementation pending — backend-only change + database migration. GradientCover.jsx stays frozen.

### Changed
- Roadmap updated with 10.0C conversion plan, BookCard v4 spec, gradient palette task
- Estimated Phase 10 total: 17-23 → 25-31 sessions (10.0C adds 8 sessions)
- ChipInput, StarRating, FileDropZone moved from "Out of Scope" back into 10.0C

### Documentation
- `FRONTEND_AUDIT_2026.md` — Complete frontend audit via Claude Code (62 files, all modals/buttons/forms/colors inventoried)
- `bookcard-v4-final.html` — Approved BookCard mockup with all NNG recommendations
- `gradient-cover-exploration.html` — Vivid vs warm gradient lane comparison

---

## [0.32.0] - 2026-03-19

### Added

#### Phase 10.0A: Design Tokens (Warm A Palette)
Shift from blue-navy corporate dark mode to warm charcoal aesthetic inspired by Territory Studio's Swan Song UI.

**Token system established in `tailwind.config.js`:**
- Semantic color tokens: `bg.*`, `text.*`, `border.*`, `action.*`, `chip.*`, `status.*`
- Legacy `library.*` aliases preserved (auto-mapped to warm values)
- Backgrounds: warm charcoal family (#1a1918, #242220, #2e2b28)
- Text: warm off-white (#e8e4df) instead of stark #ffffff
- Primary action: muted teal (#5e8a8a) — calm, not corporate
- Chips: desaturated dusty colors (ambient metadata, not loud buttons)
- Status DNF: neutral warm gray (not red — setting aside ≠ failure)
- Calm transition timing: 0.2s ease-out

**Typography utilities in `src/styles/tokens.css`:**
- text-h1, text-h2, text-h3, text-h4 (warm off-white headings)
- text-body, text-body-sm, text-caption, text-label (warm grays)

**Optional utilities:**
- `.glass-panel` — glassmorphism effect for modals
- `.grain-overlay` — subtle noise texture for warmth

#### Phase 10.0B: Core UI Components
New reusable primitives in `components/ui/`, all using Warm A tokens.

**Components created:**
- `Button.jsx` — Variants: primary (teal), secondary, ghost, danger. Sizes: sm/md/lg. States: loading, disabled. 44px touch targets.
- `IconButton.jsx` — 44px default, 36px small. Variants: default, accent. Hover tooltip.
- `Badge.jsx` — Status badges with dot indicator (Unread, In Progress, Finished, DNF). Category badges (Fiction, FanFiction, Non-Fiction). Metadata chips (fandom, ship, character, tag).
- `SearchInput.jsx` — Search icon, clear button, loading spinner. Controlled input with placeholder.
- `Modal.jsx` — Standard (✕ right, footer with Cancel + action) and fullscreen (✕ left, action in header) variants. Sizes: sm/md/lg/fullscreen. Compound components: Modal.Header, Modal.Body, Modal.Footer. Escape key and backdrop click to close. Optional glassmorphism via `.glass-panel`.
- `FormField.jsx` — Label + input/textarea with error state. Controlled with value fallback. forwardRef for programmatic focus.

**Components extracted to `components/ui/`:**
- `UnifiedNavBar.jsx` — moved from components root
- `CollapsibleSection.jsx` — moved from components root
- `Toast.jsx` — extracted from inline definition in BookDetail.jsx

All import paths updated across: BookDetail, SeriesDetail, AuthorDetail, CollectionDetail, AddPage, Settings.

### Changed
- Phase 9.5 officially abandoned — critical bugs moved to parallel track, remaining polish items killed
- Roadmap restructured around Phase 10: Liminal Connects

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

### Removed
- Header component render from App.jsx (brand bar no longer used)
- Add button from bottom nav (replaced with Settings)
- Book icon from Library nav item (replaced with script "L")
- Brand header section from Library.jsx ("Liminal" + gear icon)
- `isLibraryPage` conditional logic from App.jsx

### Changed
- Library tab bar now sticky at `top-0` (was `top-[57px]`)
- Tabs use underline style instead of pill buttons
- Actions integrated into tab bar header
- All detail pages now use UnifiedNavBar for consistent navigation
- SeriesDetail/AuthorDetail use history-based back (`navigate(-1)`)
- BookDetail uses explicit returnUrl for predictable navigation

#### Notes Templates
- Renamed "Reading Notes" template to "Notes While Reading" with simplified content
- Added new "Thoughts After Reading" template
- Template dropdown now shows 3 options: Structured Review, Notes While Reading, Thoughts After Reading

### Known Issues
- **Author Detail → Book returnUrl** — Not passing returnUrl; back shows "Library" instead of "Authors"
- **Search filter redirect** — Filter link in search modal redirects to Home instead of filtered Browse

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
- Removed ellipsis from menu labels ("Edit..." → "Edit")

### Fixed
- **EPUB Detection** — Fixed "Extract from EPUB" button not appearing. Changed detection from `book.formats` to `book.editions` (correct field name)
- **Pairing Type Field** — Fixed pairing type changes not saving. Field now correctly reads/writes to `ao3_category` database column

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

### Removed
- `EditBookModal.jsx` — Replaced by UnifiedEditModal
- `EnhancedMetadataModal.jsx` — Replaced by UnifiedEditModal
- Characters field from edit UI — Merged into Tags (data preserved in database)

### Changed
- Previous: 3 separate menu items ("Edit Details...", "Edit About & Tags...", "Change Cover...")
- Now: Single "Edit" menu item opens unified modal
- "Change Cover" temporarily removed (restored in Session B+)

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
- Click-outside dismissal on desktop, backdrop tap on mobile

**Toast Notification System:**
- New toast component for feedback messages
- Three states: loading (spinner), success (checkmark), error (X icon)
- Auto-dismiss after 3 seconds (except loading state)

**Component Architecture:**
- Extracted `Toast` component outside BookDetail (prevents remount on parent re-render)
- Extracted `ThreeDotMenu` component outside BookDetail (stable event listeners)

### Removed
- 8 scattered icon buttons consolidated into menu (tag, merge, pencil, add format, add session ×2, add collection, rescan)
- `rescanResult` state variable (replaced by toast system)

### Fixed
- Nested component definition causing menu to unmount on parent re-render
- Toast timeout memory leak (now tracked via `useRef`)
- Null safety guard on `handleRescanMetadata`
- Dead code removal in rescan handler

---

## [0.27.0] - 2026-01-25

### Added

#### Phase 9F: Book Detail Page Overhaul 📖
Complete redesign of book detail page with flattened structure and new components.

**New Components:**
- `SortDropdown` — Reusable sort with localStorage persistence, desktop dropdown + mobile bottom sheet
- `CollapsibleSection` — Expandable sections with gradient fade, three variants (text/tags/grid)
- `ReadingStatusCard` — Status-aware display with blue (reading) and green (finished) themes
- `CompactSessionRow` — Single-row session display with smart date formatting

**Page Structure Overhaul:**
- Removed "Book Details" card wrapper
- Flattened About/Tags/Metadata/History/Collections/Notes/Backlinks sections with border-t separators
- Series section retains card background (related content treatment)
- Wishlist TBR card retains background

**Series Section Polish:**
- Clickable series line above title
- Leading zeros on series numbers (01, 02, 03)
- Green checkmark for finished books, "You are here" indicator

### Fixed
- Storage key: `liminal_sort_tbr` → `liminal_sort_wishlist`
- Status normalization: spaces → underscores
- Timezone fix for manual date parsing
- Dropdown alignment, HTML nesting, empty state logic, duplicate borders

---

## [0.26.2] - 2026-01-19

### Added

#### Phase 9E.5c: Collections Final Polish 🎨

**Duplicate Collection Feature:**
- "Duplicate" option in 3-dot menu on collection detail page
- Opens modal with pre-filled name, can change type during duplication

**Automatic Collection Sorting:**
- Sort dropdown for automatic collections with direction toggle
- Case-insensitive sorting with COLLATE NOCASE in SQLite

**Cover Preview Improvements:**
- Thumbnail preview in cover type selector when editing collections

### Fixed
- Blob URL memory leaks from cover uploads
- Race conditions in sort+pagination (sortVersionRef pattern)
- Stale cover preview when switching cover types in modal

### Documentation
- `CODE_PATTERNS.md` — Battle-tested solutions for common problems

---

## [0.26.1] - 2026-01-19

### Added

#### Phase 9E.5b: Collection Detail Polish 🎨

**Drag-to-Reorder Books:**
- Reorder mode toggle in 3-dot menu for Manual/Checklist collections
- @dnd-kit integration for smooth drag-and-drop
- Race condition guards prevent concurrent save operations

**Taller Banner Variant:**
- MosaicCover supports `banner` size (320px height) for collection detail pages

### Fixed
- Checklist collection showing wrong books after reorder
- loadingMore properly cleared on all code paths
- View toggle properly hidden for default collections

---

## [0.26.0] - 2026-01-18

### Added

#### Phase 9E.5a: Collections Landing Page Polish 🎨
Complete UX overhaul of collections landing page.

**3-Dot Menu** with Add Collection, Reorder, View Toggle options.
**Grid/List View Toggle** with localStorage persistence.
**Reorder Mode** with drag-and-drop, default collections pinned.
**Collection Gradients** — 3 styles (Layered Mist, Drift Bloom, Veiled Depth) × 2 color variations.
**Context Menu** — Right-click (desktop) or long-press (mobile) for Edit/Delete.

#### Dependencies Added
- `@dnd-kit/core@^6.3.1`, `@dnd-kit/sortable@^10.0.0`, `@dnd-kit/utilities@^3.2.2`

---

## [0.25.1] - 2026-01-17

### Changed
- TBR collection converted from Checklist to Manual type
- TBR renamed to "To Be Read" with updated description
- Added pagination loading indicators for collections

### Fixed
- Empty collection UX improvements
- Collection description handling fixes

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
Database schema and API endpoints for three collection types (Manual, Checklist, Automatic).

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
