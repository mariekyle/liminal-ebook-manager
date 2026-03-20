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
