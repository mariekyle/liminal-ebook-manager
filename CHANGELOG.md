# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.37.5] - 2026-03-29

### Changed

#### C8 — Filter modals + misc design system
- **Tag search order** (`utils/searchSort.js`): When filtering tags, order is exact match → starts-with (A–Z) → contains (A–Z); empty search in **TagsModal** keeps count-based order. **TagsMultiSelect** uses the same relevance order for string tags.
- **FandomModal**, **ShipModal**, **TagsModal**: Shared **`Modal`** + **`SearchInput`** + **`Button`**; Warm A tokens.
- **SearchModal**: **`Modal size="fullscreen"`** + **`SearchInput`**; tokenized results list.
- **SortDropdown**: Tokens; active sort **`text-action-primary`**; mobile **Cancel** uses **`Button variant="secondary"`**; "Sort By" uses **`text-label`**.
- **TagsMultiSelect**, **BottomNav**, **Header**, **SearchBar**: Token conversion (nav items stay native links/buttons).
- **ReadingStatusCard**: Subtitle typography token.
- **AuthorsList**: **`UnifiedNavBar title="Authors"`** (title-only); sticky search offset adjusted.
- **ImportPage**: **`UnifiedNavBar title="Import"`**; dark theme tokens; **`Button`** for actions; **`useEffect`** for initial stats (replaces mistaken **`useState`** hook).
- **DuplicatesPage**: **`UnifiedNavBar title="Find Duplicates"`**; tokens + **`Button`** merge control.
- **MosaicCover**: Unchanged (no Tailwind chrome to convert).

### Technical
- New: `frontend/src/utils/searchSort.js`
- Modified: `FandomModal.jsx`, `ShipModal.jsx`, `TagsModal.jsx`, `TagsMultiSelect.jsx`, `SortDropdown.jsx`, `SearchModal.jsx`, `BottomNav.jsx`, `Header.jsx`, `SearchBar.jsx`, `ReadingStatusCard.jsx`, `pages/AuthorsList.jsx`, `ImportPage.jsx`, `DuplicatesPage.jsx`

### Notes
- **BookCard `variant`**: Main **`BookCard.jsx`** does not define a `variant` prop; enforcement deferred until the component supports it.
- **SmartPasteModal**: Already absent; no references in repo.

---

## [0.37.4] - 2026-03-29

### Changed

#### C7 — Add flows + Upload flows (design system)
- **New `FileDropZone`**: Desktop drag-and-drop zone; mobile (`matchMedia` ≤768px) compact **Choose files** button, file list with remove, **Add more files**, summary + Clear all; wired from **`AddToLibrary`**.
- **Add flow**: **`AddChoice`**, **`AddToLibrary`**, **`ManualEntryForm`**, **`WishlistForm`**, **`AddSuccess`**, **`StepIndicator`**, **`AnalyzingModal`** — Warm A tokens, **`Button`**, **`FormField`** (manual/wishlist forms; author chips + autocomplete logic unchanged).
- **Upload flow**: **`ReviewBooks`**, **`UploadProgress`**, **`UploadSuccess`**, **`CancelModal`** (shared **`Modal`** + **`Button`**), **`upload/BookCard`** — tokens + **`FormField`** for editable metadata; gradient cover hex styles preserved for dynamic previews.
- **Review title persistence**: After **`finalizeUpload`**, **`AddPage`** applies **`updateBookMetadata`** for each result with `title_id` when the book was edited on the review step (reconciles DB title with user-edited fields after server prefers file metadata on create).
- **AddPage cleanup**: Error banner and linked-book context banner tokenized; series and series_number trimmed before save (consistent with title/author handling).

### Technical
- New: `frontend/src/components/ui/FileDropZone.jsx`
- Modified: `frontend/src/pages/AddPage.jsx`, `frontend/src/components/add/AddChoice.jsx`, `AddToLibrary.jsx`, `ManualEntryForm.jsx`, `WishlistForm.jsx`, `AddSuccess.jsx`, `StepIndicator.jsx`, `AnalyzingModal.jsx`, `frontend/src/components/upload/ReviewBooks.jsx`, `UploadProgress.jsx`, `UploadSuccess.jsx`, `CancelModal.jsx`, `BookCard.jsx`

---

## [0.37.3] - 2026-03-29

### Changed

#### C6 — Series + Authors design system
- **SeriesDetail / SeriesCard**: Warm tokens; series list uses `01`–`02` numbering (decimals supported); finished ✓ uses `text-action-success`; in-progress uses `text-action-warning`; DNF/Abandoned neutral muted text.
- **AuthorDetail**: `returnUrl` from `location.state` (default `/authors`); `UnifiedNavBar` uses `backTo` + label rules aligned with BookDetail; book links pass `returnUrl`; tokens + `Button` for Edit; finished badge uses `bg-action-success`.
- **AuthorChips**: Tokens + `Button` for add; chip/drag styling tokenized.
- **EditAuthorModal**: Shared **`Modal`**, **`FormField`**, **`Button`**; error banner + name field validation.
- **AuthorsList**: **`UnifiedNavBar`** (Library back), **`SearchInput`**, `document.title = 'Authors'`, **`text-h2`** title; author links pass `returnUrl` state.
- **ReadingStatusCard**: Semantic tokens; reading/in-progress `action-primary`; finished `action-success`; DNF/Abandoned neutral `text-text-muted` on elevated surface.

### Technical
- Files modified: `SeriesDetail.jsx`, `SeriesCard.jsx`, `AuthorDetail.jsx`, `AuthorChips.jsx`, `EditAuthorModal.jsx`, `AuthorsList.jsx`, `ReadingStatusCard.jsx`

---

## [0.37.2] - 2026-03-29

### Changed

#### C5 — Collections family design system
- **Removed** `SmartPasteModal.jsx` and all Smart Paste UI/state from `CollectionDetail.jsx`.
- **CollectionDetail.jsx**: Warm tokens throughout; checklist completed rows use `opacity-45` (with `BookCard`); shared **`Modal`** for Mark Finished, Change Status, and Delete Collection (`Button` + `FormField` where specified); menus and banners tokenized.
- **CollectionsTab.jsx**: **`UnifiedNavBar`** title `"Collections"`; **`Modal`** + **`Button`** for delete confirmation; loading/error/empty states and menus use tokens.
- **CollectionModal.jsx**: Shared **`Modal`** (`fullscreenOnMobile`, `lg`) with **`FormField`**, error banner, **`Button`** footer; type/cover controls tokenized (gradient swatch uses design tokens).
- **CollectionPicker.jsx**: Shared **`Modal`** with scrollable body, **`Button variant="secondary"`** Done, token checkbox rows.
- **CollectionCard.jsx**: Distinct container styling (`bg-bg-surface`, border, collection icon, `text-body-sm` / `text-caption`); list + grid + context menu tokenized; copy uses "titles" for counts.
- **CollectionGradient.jsx**: Unchanged (no Tailwind hardcodes outside gradient math).

### Technical
- Files deleted: `frontend/src/components/SmartPasteModal.jsx`
- Files modified: `CollectionDetail.jsx`, `CollectionsTab.jsx`, `CollectionModal.jsx`, `CollectionPicker.jsx`, `CollectionCard.jsx`, `BookCard.jsx` (checklist opacity only)

---

## [0.37.1] - 2026-03-29

### Added

#### Component Preview Page
Dev-only route at `/dev/components` for visual verification of all shared UI components during design system conversion.

- 10 component sections: Button, IconButton, Badge, SearchInput, FormField, StarRating, Modal, Toast, CollapsibleSection, UnifiedNavBar
- All variant/size/state combinations rendered with descriptive labels
- Book-themed placeholder content (Le Guin, Jemisin, Butler, Chiang)
- Token-based layout throughout (`bg-bg-base`, `text-h2`, `bg-bg-surface` cards)
- Inline SVG icon helpers (lucide-react stroke-compatible) since lucide-react is not in package.json
- Route bypasses health check gate so preview works even when backend is down

### Changed

#### C4 — Drawers + UnifiedEditModal + ChangeCoverModal design system
- **SettingsDrawer**: Drawer shell and backdrop use tokens (`bg-bg-surface`, `bg-bg-overlay`, `border-border-default`) aligned with `FilterDrawer`. Section titles use `text-h4`; inputs/selects use `text-text-primary` on `bg-bg-elevated`. Close control uses shared `IconButton`; primary actions use `Button` (sync, duplicates, rescan, backup, save settings, cover extract) with loading states. Reading speed and backup path use `FormField`; backup status toasts use success/danger token surfaces.
- **FilterDrawer**: Drawer container standardized to match SettingsDrawer pattern (same width, animation, overlay). `SearchInput` adoption. Apply/Clear footer uses `Button`. Filter category buttons stay native `<button>` (selection controls). All 48 hardcoded colors replaced with tokens.
- **UnifiedEditModal**: Migrated from bespoke bottom sheet to shared `Modal` (`fullscreenOnMobile`). All 14 form elements (9 inputs, 4 textareas, 1 select) wrapped in `FormField`. Tabs (Details/About/Metadata) stay native `<button>`. `ChipInput` adopted for tags, authors, and other multi-value fields. All 47 hardcoded colors replaced.
- **ChangeCoverModal**: Migrated to shared `Modal` (`fullscreenOnMobile`). Upload, extract, and gradient revert actions use `Button`. All hardcoded colors replaced.
- **New `ChipInput`** (`components/ui/ChipInput.jsx`): Input on top, chips below. Enter/comma to add, × to remove. Optional async `fetchSuggestions`. `FormField` wrapper for label + error. 44px touch targets on chip remove buttons.

#### Modal `size="fullscreen"` support
- Modal component now accepts `size="fullscreen"` as a prop value (previously only supported `fullscreenOnMobile` boolean and the undocumented `fullscreen` boolean)
- `ModalLayoutContext` added so `Modal.Header` automatically uses centered-title layout when parent shell is fullscreen
- Backward compatible: existing `fullscreenOnMobile` and `fullscreen` boolean props still work

### Technical
#### Files Created
- `frontend/src/pages/ComponentPreview.jsx`
- `frontend/src/components/ui/ChipInput.jsx`
#### Files Modified
- `frontend/src/App.jsx` -- `/dev/components` route added outside ConnectedApp (no health check, no BottomNav)
- `frontend/src/components/ui/Modal.jsx` -- `size="fullscreen"` support, ModalLayoutContext for header layout
- `frontend/src/components/SettingsDrawer.jsx`
- `frontend/src/components/FilterDrawer.jsx`
- `frontend/src/components/UnifiedEditModal.jsx`
- `frontend/src/components/ChangeCoverModal.jsx`

---

## [0.37.0] - 2026-03-29

### Changed

#### Phase 10.0C-3: Library + HomeTab + WishlistTab Conversion
Third conversion group: the three daily-driver screens migrated to design tokens, shared components, and Liminal voice conventions.

**Library.jsx:**
- Added `UnifiedNavBar` with dynamic title (Home/Browse/Wishlist/Series) and settings gear `IconButton`
- Settings gear wired to existing `SettingsDrawer`
- Grid/list view preference persisted in `localStorage` as JSON (`liminal-view-preference`), default compact grid
- Compact/Standard grid variant toggle for Browse and Series views
- `BookCard` receives `variant` prop (compact/standard/list) derived from persisted preference
- Browse error state uses `<Button variant="secondary">` for retry
- Filter pills use chip tokens (`chip-fandom`, `chip-ship`, `chip-character`) for enhanced metadata filters
- "Clear all" uses `<Button variant="ghost">`
- Wishlist content rendered via renamed `WishlistTab` component (uses `listTBR` endpoint)
- Filter icon, phrase strip, and sort controls hidden on Home and Wishlist tabs (self-contained)

**HomeTab.jsx:**
- Per-section inline error with retry via shared `SectionError` component
- Full-page retry when all five section loads fail
- Discover refresh uses `IconButton` with `tooltip` (replaces `title` attribute)
- All typography converted to tokens (`text-h4` section headers, `text-body-sm`, `text-caption`, `text-label`, `text-h2` stat numbers)
- All colors use semantic tokens (`bg-bg-surface`, `text-text-muted`, `border-border-default`, `bg-action-primary`)

**WishlistTab.jsx (renamed from TBRList.jsx):**
- File renamed, component renamed, `TBRList.jsx` deleted
- User-facing label stays "Wishlist"
- `TBRCard` renamed to `WishlistCard`
- Priority badge uses `bg-action-warning` + `text-text-inverse`
- Error state with `<Button>` retry, Liminal voice copy
- All typography tokenized; priority filter buttons stay native `<button>` per spec
- Voice fix: "stories" replaced with "titles" / "reads" in subtitle copy

**Voice/copy corrections (cleanup pass):**
- HomeTab: "No books finished" changed to "No titles finished"
- WishlistTab: "Stories calling to you" changed to "Your future reads"; "story/stories waiting to be discovered" changed to "title(s) on your list"

**Tabs and toggles:** Home/Browse/Wishlist tabs, sort triggers, priority filter buttons, and grid/list toggles remain native `<button>` elements per spec (not `<Button>` component).

### Fixed
- HomeTab errors now user-visible with per-section retry (was console-only)
- Library page now has `UnifiedNavBar` (was missing)
- TBRList naming inconsistency resolved (file matched component name)

### Technical
#### Files Created
- `frontend/src/components/WishlistTab.jsx` (renamed from TBRList.jsx)
#### Files Modified
- `frontend/src/components/Library.jsx` -- UnifiedNavBar, view persistence, token conversion, WishlistTab import
- `frontend/src/components/HomeTab.jsx` -- error states, token conversion, voice fix
#### Files Deleted
- `frontend/src/components/TBRList.jsx` (replaced by WishlistTab.jsx)

---

## [0.36.0] - 2026-03-28

### Added

#### Phase 10.0C-2: StarRating Component
- **StarRating** (`components/ui/StarRating.jsx`): shared star rating control with `readOnly` prop
  - Interactive mode: 44px tap targets, hover preview, toggle-to-clear (tap current rating to remove)
  - Read-only mode: no tap targets, no hover, compact spacing
  - Sizes: sm (inline metadata), md (detail display), lg (form input)
  - Token colors: `action-warning` filled, `text-muted` empty

### Changed

#### Phase 10.0C-2: BookDetail Modals + Forms Conversion
Second conversion group: all 5 inline modals in BookDetail migrated to shared `<Modal>` compound API, form fields wrapped in `<FormField>`, star rating extracted to reusable component.

**Modal** (`components/ui/Modal.jsx`): upgraded to compound API
- `Modal.Header` (title as children, `onClose` for X button), `Modal.Body`, `Modal.Footer` (slot-based, children only)
- `fullscreenOnMobile`: below 768px renders full-viewport shell; md+ keeps centered dialog
- Backdrop click closes; Escape key closes; body scrolls independently

**FormField** (`components/ui/FormField.jsx`): children mode added
- Wraps custom controls (selects, date inputs, StarRating) with consistent label + optional error
- Labels use `text-label` token; `mb-0` in children mode so parent `space-y-4` controls spacing
- Error prop: boolean (red border only) or string (red border + message text)
- Original controlled input/textarea path unchanged

**BookDetail modals converted (5 total):**
- Acquire modal (format selection for wishlist-to-library conversion)
- Session editor modal (start/end dates, format, status buttons, StarRating)
- Edition modal (format select + optional acquired date, error banner + red border on invalid field)
- Merge modal (`fullscreenOnMobile`, two-step search-then-confirm flow, "title" copy)
- Delete edition confirmation modal

**BookDetail form fields:** 9 form elements wrapped in `<FormField>` with stacked labels. Session rating uses `<StarRating size="lg">` interactive. Stats pill and CompactSessionRow use `<StarRating readOnly size="sm">`.

**Error pattern (cross-cutting C2-C8 decision):** Banner at top of modal body + red border on offending field. No per-field message text.

### Fixed
- Removed dead `renderStars` helper (defined but zero call sites after StarRating adoption)
- Fixed `text-text-body` token on merge confirm label (changed to `text-text-primary`)

### Technical
- Files modified: `BookDetail.jsx`, `Modal.jsx`, `FormField.jsx`
- Files created: `StarRating.jsx`
- 3 remaining `fixed inset-0` instances in BookDetail are non-modal (ThreeDotMenu bottom sheet, priority popup backdrop, notes editor fullscreen) -- correct, not in C2 scope
- Modal `glass` prop added by Cursor (unused, harmless)
- Status toggle buttons in session modal kept as plain `<button>` with `type="button"` (same C1 precedent as inline text actions)

---

## [0.35.0] - 2026-03-28

### Changed

#### Phase 10.0C-1: BookDetail Color + Button Conversion
Full design token migration of BookDetail.jsx, the largest single file in the app (3,000+ lines). First conversion group in the 10.0C systematic pass.

**Colors:** Replaced all 211 hardcoded Tailwind color classes (zinc-*, gray-*, red-*, green-*, amber-*, blue-*, purple-*, pink-*) with semantic design tokens (text-text-*, bg-bg-*, border-border-*, action-*, chip-*). Zero hardcoded colors remain. All 35 legacy `library-*` references also replaced with semantic tokens.

**Typography:** 51 instances converted to typography tokens (text-h2, text-body-sm, text-caption, text-label). MetadataRow and TagChip helper components fully tokenized.

**Buttons:** 22 raw `<button>` elements replaced with `<Button>` component (primary, ghost, danger variants). 8 replaced with `<IconButton>` (session edit, modal close). 14 intentionally kept as native `<button>`: mobile tabs, priority dropdown, ThreeDotMenu items, star rating inputs.

**Chips/Badges:** Session status badges now use action-success/chip-ship/action-primary. AO3 completion status uses action-success/warning/danger. Tag chips use chip-ship/chip-fandom tokens.

**Tailwind config:** Added `bg.overlay` token (rgba(0,0,0,0.65)) for modal backdrops, replacing hardcoded bg-black/60 and bg-black/70.

### Fixed
- **BookDetail (TBR):** Replaced two ghost Button overrides (using `!min-h-0` and `!border-transparent`) with plain text-styled `<button>` elements. These inline text actions (Edit, Add a reason why) don't need Button's touch target or loading states.

### Technical
- Files modified: `frontend/src/components/BookDetail.jsx`, `frontend/tailwind.config.js`
- Note: BookDetail.jsx lives in `components/`, not `pages/`. Future prompts corrected.
- ThreeDotMenu remains inline in BookDetail; extraction is separate task (10.0.14)
- One `bg-bg-surface/60` opacity modifier on CompactSessionRow; verify renders correctly with Tailwind version

---

## [0.34.0] - 2026-03-24

### Changed

#### Warm Gradient Palette (10.0.15)
- Replaced 8 vivid hue lanes with 10 warm desaturated lanes (Clay, Sage Teal, Slate Blue, Amber, Lichen, Ochre, Dusty Plum, Storm, Sandstone, Muted Rose)
- Lowered saturation range from 22-34% to 18-30% for cohesion with warm charcoal backgrounds
- Adjusted dark theme lightness from 46-62% to 42-58% for better contrast
- Increased vignette opacity from 0.10 to 0.12 for text contrast
- Ran migration script on all ~1,700 titles to regenerate cover_gradient values
- GradientCover.jsx unchanged (FROZEN) -- backend-only change in `backend/services/covers.py`

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
- Zero behavior changes -- desktop dropdown + mobile bottom sheet identical
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
Design-only -- implementation pending.

**Grid view badges:**
- Opaque dark bg (#1a1918 @ 88%) + white icon for all types
- ~7:1 contrast on any gradient cover

**List view:**
- Cover overlays for Finished/DNF, text labels for In Progress
- Est. read time (clock icon + ~Xh)

**Design decisions confirmed:**
- Single `variant` prop (standard/compact/list) replaces boolean soup
- No left-edge stripe, no backdrop-blur, no text DNF badge

### Changed

#### Phase 10.0A: Design Tokens
- Added Warm A color tokens to `tailwind.config.js`
- Background tokens: base, surface, elevated
- Text tokens: primary, secondary, muted
- Action tokens: primary (teal), success (green), danger (red), secondary (gray)
- Chip tokens: category, status, fandom, ship, character
- Custom typography utilities: text-h1 through text-h4, text-body, text-body-sm, text-caption, text-label

#### Phase 10.0B: Core Components
- Created `components/ui/Button.jsx` (primary/secondary/ghost/danger, sm/md/lg, loading/disabled)
- Created `components/ui/IconButton.jsx` (default/accent, sm/default, optional tooltip)
- Created `components/ui/Badge.jsx` (status/category/metadata chips)
- Created `components/ui/SearchInput.jsx` (clear button, loading state)
- Created `components/ui/Modal.jsx` (Header/Body/Footer, sm/md/lg/fullscreen, backdrop close, Escape)
- Created `components/ui/FormField.jsx` (label + input/textarea, controlled, error states)
- Extracted `UnifiedNavBar` to `components/ui/`
- Extracted `Toast` to `components/ui/`
- Extracted `CollapsibleSection` to `components/ui/`
- Extracted `BottomSheet` to `components/ui/`

---

## [0.30.0] - 2026-02-02

### Added

#### Phase 9.5 Sessions A-C: Menu + Modal + Navigation

**Three-Dot Menu Consolidation:**
- Consolidated 8 scattered icon buttons into single 3-dot menu on BookDetail
- Desktop: click-triggered dropdown with hover states
- Mobile: bottom sheet with backdrop
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
- `SortDropdown` -- Reusable sort with localStorage persistence, desktop dropdown + mobile bottom sheet
- `CollapsibleSection` -- Expandable sections with gradient fade, three variants (text/tags/grid)
- `ReadingStatusCard` -- Status-aware display with blue (reading) and green (finished) themes
- `CompactSessionRow` -- Single-row session display with smart date formatting

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
- `CODE_PATTERNS.md` -- Battle-tested solutions for common problems

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
**Collection Gradients** -- 3 styles (Layered Mist, Drift Bloom, Veiled Depth) × 2 color variations.
**Context Menu** -- Right-click (desktop) or long-press (mobile) for Edit/Delete.

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
