# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.38.0] - 2026-03-31

### Fixed

#### Fix Session 1: Wishlist-to-Library Conversion (UF-14, UF-15, UF-16)
Two critical bugs and one major bug resolved. The wishlist-to-library conversion flow was the only non-functional flow in the app.

- **Silent conversion failure (UF-14, Critical):** Path A (ebook upload via `linkFilesToTitle`) created the edition record but never flipped `acquisition_status` from `wishlist` to `owned`. The success screen rendered optimistically on frontend state, not confirmed server response. Path B (physical/audiobook via `acquire_tbr`) swallowed errors with `console.error` only. Both paths now handle TBR-to-library conversion atomically within a single database transaction: edition creation + acquisition flip + status defaulting to `Unread`.
- **Raw SQL error on retry (UF-15, Critical):** Retrying a failed conversion hit `UNIQUE constraint failed: editions.title_id, editions.format` because the edition was half-created on the first attempt. Both backend endpoints now catch `IntegrityError` on the edition INSERT, skip the duplicate insert, and proceed with the acquisition conversion. Idempotent retry: same code path handles fresh conversions and retries.
- **Dead results link on success screen (UF-16, Major):** The synthetic `uploadResults` object in AddPage's linkTo flow omitted `title_id`, so UploadSuccess couldn't build a working "View Story" navigation link. Both the `books` array and `uploadResults` now include `title_id: parseInt(linkToId, 10)`.

### Added
- **Startup migration for half-state TBR titles:** On every Docker boot, the backend checks for titles where `acquisition_status = 'wishlist'` (or `is_tbr = 1`) that already have edition records, and converts them to `owned`. Logs result count to Docker container logs. Idempotent: finds zero rows after first run.
- **Toast feedback on wishlist acquisition:** All three conversion buttons in the BookDetail acquire modal (ebook, physical, audiobook) now show "Moved to your library" on success and "Something went wrong. Try again?" on failure. Previously, errors were silently logged to console.
- **API error sanitization safety net:** The frontend fetch wrapper catches raw database error strings (`UNIQUE constraint failed`, `FOREIGN KEY constraint`, `NOT NULL constraint`, `CHECK constraint`) and replaces them with user-facing copy. Backend sanitizes first; this is the belt to the backend's suspenders.

### Technical
#### Files Modified
- `backend/main.py` -- Startup half-state TBR migration (`fix_halfstate_tbr_titles`)
- `backend/routers/titles.py` -- `acquire_tbr` endpoint: IntegrityError catch, atomic transaction, sanitized 500 response
- `backend/routers/upload.py` -- `link_files_to_title` endpoint: IntegrityError catch, TBR auto-conversion in same transaction, sanitized error response
- `frontend/src/pages/AddPage.jsx` -- Synthetic `title_id` in linkTo flow results
- `frontend/src/pages/BookDetail.jsx` -- Toast feedback on all acquire modal buttons
- `frontend/src/api.js` -- SQL error sanitization in fetch wrapper

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
- Priority segmented control, sort controls, empty state all tokenized
- `<Button>` for add, sort uses inline buttons (selection controls, not actions)
- Reason quotes use `text-caption` italic
- Sort persistence in localStorage (`liminal_sort_wishlist`)

**Cross-cutting:**
- `Library.jsx` defers to `WishlistTab` when `acquisition === 'wishlist'` (wishlist has its own data loading via `listTBR`)

### Technical
#### Files Created
- `frontend/src/components/WishlistTab.jsx` (renamed from `TBRList.jsx`)
#### Files Deleted
- `frontend/src/components/TBRList.jsx`
#### Files Modified
- `frontend/src/pages/Library.jsx`
- `frontend/src/pages/HomeTab.jsx`

---

## [0.36.0] - 2026-03-28

### Changed

#### Phase 10.0C-2: BookDetail Modals + Forms Conversion
Second conversion group: BookDetail's 5 inline modals migrated to shared Modal, all 9 form fields to FormField, and StarRating extracted.

**Shared Modal adoption (5 modals):**
- Session editor modal, Edition modal, Edition delete confirmation, Merge search + confirm modal, Rescan confirm modal
- All use `Modal` with `Modal.Header` / `Modal.Body` / `Modal.Footer`
- ✕ always on right, consistent Cancel + Primary footer
- Escape key, backdrop click, overflow scroll all inherited

**FormField adoption (9 fields):**
- Session: date_started, date_finished, session_status select, format select, rating (StarRating)
- Edition: format select, acquired_date
- Merge: search input
- Each with label, optional helper text, error state

**StarRating extraction:**
- New `components/ui/StarRating.jsx`: 0-5 interactive stars, half-star display, optional disabled state
- Controlled component (value + onChange), 44px touch targets, warm gold fill

### Technical
#### Files Created
- `frontend/src/components/ui/StarRating.jsx`
#### Files Modified
- `frontend/src/pages/BookDetail.jsx`

---

## [0.35.0] - 2026-03-28

### Changed

#### Phase 10.0C-1: BookDetail Color + Button + Typography Conversion
First conversion group: BookDetail.jsx (the app's largest file) fully migrated from hardcoded Tailwind to Warm A design tokens and shared components.

- 211 hardcoded color instances → semantic tokens
- 30 raw buttons → `Button` component (primary, secondary, ghost, danger variants)
- 15 icon-only buttons → `IconButton` component (44px/36px touch targets)
- All typography mapped to 8 token classes (text-h1 through text-caption)
- `ThreeDotMenu` component adopted for page-level actions
- `UnifiedNavBar` adopted with `backTo` prop for smart back navigation
- Zero behavior changes: all click handlers, state management, and data flow preserved

### Technical
- Files modified: `frontend/src/pages/BookDetail.jsx`

---

## [0.34.0] - 2026-03-27

### Added

#### NNG Usability Audit
Comprehensive usability audit of the entire app based on Nielsen Norman Group heuristics, WCAG AA compliance checks, and 10 interactive user flows tested tap-by-tap.

- 141 total findings: 4 critical, 29 major, 75 minor, 33 positive
- 8 screenshot groups covering all screens
- 10 user flows tested interactively with real tasks
- Full report: `liminal-ux-audit.md`
- Fix plan: `UX_FIX_SESSIONS.md` (10 sessions, ordered by severity)

### Fixed
- Pydantic `rating` field type: `Optional[int]` → `Optional[float]` in `TitleSummary`, `TitleDetail`, `FanficTitleDetail`, `BookRatingUpdate` (was causing 500 errors for half-star ratings)
- File: `backend/routers/titles.py`

---

## [0.33.0] - 2026-03-26

### Added

#### Phase 10.0B: Core Components
9 reusable UI components built as the design system foundation.

- `Button` -- primary/secondary/ghost/danger, sm/md/lg, loading/disabled, 44px touch targets
- `IconButton` -- 44px default, 36px small, optional tooltip
- `Badge` -- Status, category, metadata chips
- `SearchInput` -- Clear button, loading state
- `Modal` -- Header/Body/Footer, ✕ on right, sm/md/lg/fullscreen
- `FormField` -- Label + input/textarea, error state, forwardRef
- `CollapsibleSection` -- Expandable with gradient fade, three content variants
- `Toast` -- Notification system extracted from BookDetail
- `ThreeDotMenu` -- Desktop dropdown + mobile bottom sheet

### Changed
- `BookCard` v4: `variant` prop (standard/compact/list), grid badges (opaque dark bg), progress bar
- `UnifiedNavBar` moved to `components/ui/`

---

## [0.32.0] - 2026-03-25

### Added

#### Phase 10.0A: Design Tokens
- Color tokens in `tailwind.config.js`: bg (base/surface/elevated), text (primary/secondary/muted), action (primary/success/danger/secondary), chip colors, border tokens
- Typography classes in `tokens.css`: h1-h4, body, body-sm, label, caption
- Warm A palette: charcoal/off-white/muted teal, desaturated dusty chip colors

---

## [0.31.0] - 2026-02-02

### Changed

#### Phase 9.5C: Navigation Redesign
- Bottom nav redesign with 5 tabs (Home, Browse, Add, Collections, Authors)
- UnifiedNavBar with scroll-to-hide behavior and collapsible header
- Script L integration for header phrases
- Smart back navigation via returnUrl pattern

---

## [0.30.0] - 2026-02-01

### Added

#### Phase 9.5A-B: Consolidation
- 3-dot menu system with desktop dropdown + mobile bottom sheet
- Toast notification system
- Unified Edit Modal with tabbed interface (Details/About/Metadata)
- Change Cover Modal for cover management

---

## [0.29.0] - 2026-01-25

### Added

#### Phase 9F: Book Detail Foundation
- CollapsibleSection, ReadingStatusCard, CompactSessionRow components
- Book Detail page structure overhaul (flat sections, border separators)
- Series section with numbered list and status indicators

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
