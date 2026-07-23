# Liminal Design System

> **Precedence:** CLAUDE.md wins on frozen files and standing agent rules. `frontend/tailwind.config.js` wins on token values — never copy values into this doc. This doc wins on usage patterns. DESIGN_PHILOSOPHY.md = why, VOICE_AND_TONE = how to write; cross-link, don't duplicate.

Written against the v0.50.0 tree (S13). Component facts below were read from source, not recalled — if a prop list here disagrees with the component file, the file wins and this doc needs a fix.

**Enforcement:** greppable rules are enforced by `scripts/design-lint.mjs` (report: `docs/DESIGN_LINT_REPORT.md`); judgment rules are checked by the end-of-session reviewer (`.claude/agents/code-reviewer.md`). Section 5 maps which is which.

---

## 1. Tokens

All color goes through the semantic tokens defined in `frontend/tailwind.config.js` (the single token source since v0.49.0). Names and when to use them — values live in the config only:

| Group | Tokens | Use for |
|---|---|---|
| Backgrounds | `bg-base` · `bg-surface` · `bg-elevated` · `bg-overlay` | Page background · cards/sections/modals · inputs, hover fills, nested chrome · modal backdrops (only) |
| Text | `text-primary` · `text-body` · `text-secondary` · `text-muted` · `text-inverse` | Headings and emphasis · body copy · supporting text/labels · captions, placeholders, disabled · text on light/colored fills |
| Borders | `border-default` · `border-subtle` · `border-focus` | Standard 1px borders · barely-there separators · focus rings/borders on inputs |
| Actions | `action-primary` · `action-secondary` · `action-success` · `action-danger` · `action-warning` (each with a `-hover` partner) | Primary buttons/links · neutral buttons · confirm/positive · destructive · caution. Primary is a muted teal; indigo is dead. |
| Chips | `chip-fiction` · `chip-fanfiction` · `chip-nonfiction` · `chip-fandom` · `chip-ship` · `chip-character` · `chip-default` · `chip-filter` | Ambient metadata pills. Desaturated on purpose — chips are information, not buttons. |
| Status | `status-unread` · `status-reading` · `status-finished` · `status-dnf` | Reading-status dots/badges. `status-dnf` is a neutral warm gray, **never** red — setting a title aside is not a failure (see DESIGN_PHILOSOPHY, Self-Compassion Loops). |

Usage rules:

- Utility form is `{property}-{token}`: `bg-bg-surface`, `text-text-secondary`, `border-border-default`, `text-action-primary`.
- No Tailwind default palette, no raw hex in classNames, no `library-*` aliases (deleted v0.48.0). Lint-enforced.
- Transitions: 200ms ease-out (`duration-calm ease-calm` or the equivalent) — breathing, not clicking.
- Touch targets: 44px minimum (`h-11`, `min-h-[44px]`, `w-11`). ~95% of usage is mobile.

## 2. Typography

Seven token classes, defined as `fontSize` entries in `tailwind.config.js` (size + line-height + weight). A typography token is **always paired with a config color utility** — the token carries no color:

| Class | Role | Pair with (typical) |
|---|---|---|
| `text-h2` | Page/wordmark-level heading — the largest type in the app | `text-text-primary` |
| `text-h3` | Section heading | `text-text-primary` |
| `text-h4` | Card titles, subsection headings, **stat values** | `text-text-primary` |
| `text-body` | Default body copy | `text-text-body` |
| `text-body-sm` | Dense body copy, list rows, modal text | `text-text-secondary` |
| `text-label` | Form labels, uppercase section labels, **inline emphasis** | `text-text-body` |
| `text-caption` | Timestamps, counts, footnotes | `text-text-muted` |

- **There is no `text-h1` — intentionally absent; the largest heading is h2 (the wordmark). Do not re-add without a decision.** Any `text-h1` usage is a strict lint error (the class no longer exists in the config, so it would also silently render at browser default).
- Emphasis mapping (Decisions recorded in CHANGELOG 0.48.0): stat values → `text-h4`; inline emphasis inside body-size sentences → `text-label`, **never `text-h4` mid-sentence** (16px bold inside a 14px sentence).
- Never combine a token class with a core Tailwind size (`text-xs`…`text-3xl`) in one className — the pairing is a cascade-order coin flip. Lint-enforced ("cascade-flip").
- No `font-bold` on heading elements or beside token classes — weights live in the token definitions. Lint-enforced.
- Every text element maps to one of the seven tokens. Known sanctioned exceptions are glyph-sizing, not typography (emoji icons, star glyphs); see the lint report's ignore inventory (currently empty — the existing sites don't trip any pattern).

## 3. Component inventory — `frontend/src/components/ui/`

Thirteen components. Import directly (no barrel): `import Button from '../ui/Button'` or the relative equivalent.

Shared conventions across the directory: semantic tokens only; 200ms ease-out transitions; 44px tap targets at default (`md`) sizes — the explicit `sm` sizes drop to 36px (Button, IconButton) and SegmentedControl's segments sit at 40px inside a 44px container; `onChange` receives the **value** (string/array), not the event, in form components; autocomplete dropdowns cap at 8 suggestions, close 200ms after blur, and have no arrow-key navigation (pointer + typing only).

### AuthorInput

- **Purpose:** Author field with comma-separated multi-author support and autocomplete against the library's author list (fetched once on mount).
- **Variants & states:** Error state via `error` boolean (danger border/ring). Suggestion dropdown filters the fragment after the last comma; committed authors are excluded.
- **Required props:** `value` (comma-joined **string**), `onChange(string)`. Optional: `placeholder`, `error`, `className`, `autoFocus`.
- **When to use:** Any author entry — edit modal, manual add, wishlist form.
- **When NOT to use:** Tag-like multi-value fields — that's ChipInput (array contract, renders its own label).
- **Common mistakes:** Treating `value` as an array (it's a string — ChipInput is the array one). Expecting it to render a label or error message — it renders neither; wrap it in `FormField` and pass `error` yourself.
- **Frozen behaviors:** None.

### Badge

- **Purpose:** Status/category/chip pills for ambient metadata.
- **Variants & states:** Three mutually exclusive modes by prop priority: `status` (unread/reading/finished/dnf, renders a dot; label goes through `useStatusLabels`) → `category` (fiction/fanfiction/nonfiction, fixed labels, case-insensitive lookup) → `chip` + `label` (fandom/ship/character/tag; unknown chip types fall back to tag). Unknown status/category renders `null` silently.
- **Required props:** exactly one mode: `status`, or `category`, or `chip` **and** `label`. Optional: `className`.
- **When to use:** Reading-status dots, category pills, fandom/ship/character/tag chips.
- **When NOT to use:** Interactive/filter chips (Badge is non-interactive, no button semantics); bespoke one-off badges — extend the config maps instead.
- **Common mistakes:** Passing two mode props (status silently wins). Chip mode without `label` renders nothing. Trying to restyle text color via `className` — variant text colors are inline styles and win. Note: several screens (WishlistTab, ImportPage, UploadSuccess) still carry local badge implementations predating Badge; don't copy those as precedent.
- **Frozen behaviors:** None.

### Button

- **Purpose:** The action component. Raw `<button>` outside `ui/` is a lint category (report-only until the conversion backlog clears, then strict).
- **Variants & states:** `variant`: primary / secondary / ghost / danger / success / warning. `size`: sm (36px) / md (44px) / lg (48px). `loading` (spinner, disables), `disabled` (dimmed, disables). `icon` slot (hidden while loading). Extra props spread to the native button.
- **Required props:** `children`. Optional: `variant='primary'`, `size='md'`, `icon`, `loading`, `disabled`, `className`.
- **When to use:** On-page actions — save, delete, toggle, open-modal (Ghost for section-header modal triggers). Buttons act; links navigate.
- **When NOT to use:** Navigation (use a Link styled as text — "View Series"); icon-only actions (IconButton).
- **Common mistakes:** Unknown `variant`/`size` injects `undefined` into the className — no fallback, silent visual break. `className` is for **layout only** (`w-full`, `flex-1`, `shrink-0`); overriding colors via `!important` classes was the S12 Category-C drift that the success/warning variants exist to prevent.
- **Frozen behaviors:** None.

### ChipInput

- **Purpose:** Multi-value field (input on top, chips below); Enter or comma commits a chip; optional async `fetchSuggestions`.
- **Variants & states:** Error via `error` (truthy → danger border; string → also rendered as the message through its embedded FormField). Static `suggestions` take precedence over `fetchSuggestions`.
- **Required props:** `value` (**array** of strings), `onChange(array)`. Optional: `label`, `placeholder`, `suggestions`, `fetchSuggestions`, `error`.
- **When to use:** Tags and tag-like lists where values are freeform and multiple.
- **When NOT to use:** Authors (AuthorInput's string contract matches the DB shape); single-value autocomplete.
- **Common mistakes:** Wrapping it in another FormField — it embeds its own (label + error included). Expecting case preservation: chips are normalized to lowercase on entry. There is no `className` prop.
- **Frozen behaviors:** None.

### FileDropZone

- **Purpose:** Controlled file picker — dashed drop zone on desktop, compact button + list on mobile (≤768px).
- **Variants & states:** dragging highlight, disabled, has-files compaction, client-side rejection panel (size/extension), file list capped at 5 visible with show-more.
- **Required props:** `files` (controlled array), `onFilesChange`. Optional: `allowedExtensions`, `maxFileSize`, `maxFiles`, `formatHint`, `disabled`.
- **When to use:** Any file upload surface (AddToLibrary is the reference caller). Fetch constraints from `/api/upload/limits` so the backend stays the single source of truth.
- **When NOT to use:** Single-image pickers with previews (covers use their own flow).
- **Common mistakes:** Merging files yourself — the component merges and clamps, then hands you the full array. Assuming rejections accumulate — each pick replaces the rejection list.
- **Frozen behaviors:** None.

### FormField

- **Purpose:** Label + input/textarea with error state; the form-row primitive.
- **Variants & states:** Controlled mode (`value`/`onChange`, `type='text'|'textarea'|native types`) or children mode (custom control inside; FormField renders label + string-error message only — the child styles its own error border). String `error` → border + message; boolean `error` → border only (children mode: nothing visible from FormField itself).
- **Required props:** none strictly, but `label` in practice. Controlled: `value`, `onChange(string)`. Optional: `type`, `placeholder`, `error`, `rows`, `disabled`, `className`, `children`.
- **When to use:** Every labeled form control. Stacked labels (label above control) is the form layout.
- **When NOT to use:** Wrapper-label tap targets (checkbox rows, radio rows, file-picker buttons) — those are sanctioned label patterns FormField doesn't cover (audit §8). Don't wrap ChipInput (embeds its own).
- **Common mistakes:** `onChange` receives the string value, not the event. Children-mode boolean errors render nothing — pass a string if the user needs a message (no silent failures). Children-mode inputs re-implementing the input recipe drift — copy FormField's own input classes exactly if you must inline one.
- **Frozen behaviors:** None.

### IconButton

- **Purpose:** Icon-only button, 44px default.
- **Variants & states:** `variant`: default / accent / muted (rest color drops to the muted text token; hover matches default). `size`: md (44px) / sm (36px). Optional visual `tooltip` on hover. Disabled comes through native attribute via prop spread.
- **Required props:** `children` (an svg) and — practically — `aria-label` via spread. Optional: `variant`, `size`, `tooltip`, `className`.
- **When to use:** Section-header pencil actions (36px `sm`), nav-bar icon actions, close buttons in bespoke chrome.
- **When NOT to use:** Actions with visible text (Button); anything needing a loading state.
- **Common mistakes:** Omitting `aria-label` (nothing supplies one). Omitting `type="button"` inside forms — the native default is submit. JSDoc calls the 44px size "default" but the prop key is `md`.
- **Frozen behaviors:** None.

### Modal

- **Purpose:** The one modal. Compound layout: `Modal.Header` / `Modal.Body` / `Modal.Footer`.
- **Variants & states:** `size`: sm / md / lg / `"fullscreen"` (prefer the size string over the boolean `fullscreen` prop). `fullscreenOnMobile` — full-viewport panel below 768px, centered card above; this is the pattern for complex modals. Escape closes in every mode; backdrop click closes centered mode; body scroll locks while open. Fullscreen header: close control on the left, centered title, optional `right` slot.
- **Required props:** `isOpen`, `onClose`, children built from the three sub-components. Optional: `size='md'`, `fullscreen`, `fullscreenOnMobile`, `className`.
- **When to use:** Every modal. All modal components are on it except one: `add/AnalyzingModal.jsx` still renders a bespoke overlay — conversion parked on a dismiss-semantics decision (it's a progress surface), and not precedent. (The audit's other two stragglers are gone: DuplicateCollectionModal was converted and DuplicateFinderModal deleted in S12.)
- **When NOT to use:** Non-modal overlays — drawers (FilterDrawer is a sanctioned one-off), long-press context menus, click-away popups.
- **Common mistakes:** Rebuilding a `fixed inset-0` overlay by hand. Passing layout overrides into `Modal.Body` (`p-0`, `min-h-0` flex chains) works but relies on class order — keep them layout-only. Guarding close: `Modal`'s `onClose` handles Escape and backdrop click, but the ✕ button is wired to `Modal.Header`'s **own** `onClose` prop — a close guard must be passed to **both**, or the ✕ bypasses it.
- **Frozen behaviors:** ✕ close in the top-right of standard modals; footer is a slot (`Modal.Footer` children), actions right-aligned with Cancel-style action left of the primary. Buttons name their action — never Yes/No/OK (VOICE_AND_TONE, Buttons & Confirmations).

### SearchInput

- **Purpose:** Search field with magnifier icon, clear button, and loading spinner.
- **Variants & states:** `loading` swaps the clear button for a spinner; clear button appears when non-empty; clearing re-focuses the input. No error/disabled states.
- **Required props:** `value`, `onChange(string)`. Optional: `placeholder` (defaults to the approved "Search your library..."), `loading`, `autoFocus`, `className`; extra props (e.g. `onKeyDown`) spread to the input.
- **When to use:** Every search box — library search modal, picker modals, authors list.
- **When NOT to use:** Generic text fields (FormField).
- **Common mistakes:** `onChange` string-value signature. The user can't clear while `loading` is true — don't hold `loading` longer than the actual request.
- **Frozen behaviors:** None.

### SegmentedControl

- **Purpose:** Mutually exclusive pill-row toggle (Fiction / Non-Fiction / FanFiction category picker is the canonical use).
- **Variants & states:** `size`: sm (11px labels) / md. Active segment gets the elevated fill; segments are equal-width.
- **Required props:** `value`, `onChange(option.value)`, `options` (`{ value, label }[]`). Optional: `size='md'`, `ariaLabel`, `className`.
- **When to use:** 2–4 mutually exclusive choices that should all stay visible (category selection in forms).
- **When NOT to use:** Longer option lists (select inside FormField); multi-select (chips/checkboxes); navigation tabs.
- **Common mistakes:** Mixed value types — matching is strict `===`, so a number value never matches a string option. All production callers pass `size="sm"` + `ariaLabel`; follow that shape.
- **Frozen behaviors:** The 11px `sm` label size is locked (Fix Session 5, 2026-04-13) — do not "fix" it to a token size.

### StarRating

- **Purpose:** Display or collect a 1–N star rating.
- **Variants & states:** `size`: sm / md / lg. Interactive only when `onChange` is a function and neither `readOnly` nor `disabled` — otherwise renders read-only spans. Interactive stars have hover fill and 44px tap targets. Clicking the current rating **clears it** (`onChange(null)`).
- **Required props:** `value`. For input: `onChange`. Optional: `max=5`, `size='md'`, `disabled`, `readOnly`, `className`.
- **When to use:** Session rating entry (lg), compact read-only display in stats/session rows (sm).
- **When NOT to use:** Rating *labels* — the label text comes from `useRatingLabels`, not this component.
- **Common mistakes:** Not handling `null` from toggle-to-clear. Passing floats and expecting halves — fill truncates (4.5 shows 4 stars). Forgetting that omitting `onChange` silently renders read-only.
- **Frozen behaviors:** None.

### Toast

- **Purpose:** Transient confirmation strip (success / error / loading), bottom-center.
- **Variants & states:** `toast.type`: success / error / loading (spinner). Falsy `toast` renders an empty (but still mounted) live region. No dismiss button, no timing — the **caller** owns state and timeout (BookDetail's `showToast` helper, 3s default, is the reference implementation; there is no global toast manager).
- **Required props:** `toast` (`{ message, type }`).
- **When to use:** Subtle confirmations of successful actions; approved strings live in MICROCOPY_LIBRARY (Toast strings).
- **When NOT to use:** **Blocking errors — never toast-only** (CLAUDE.md golden rule). Validation errors are inline. Loading states that block interaction deserve real affordances.
- **Common mistakes:** Forgetting timeout cleanup on unmount. Unmounting the component between toasts — the outer `role="status"` div is a persistent polite live region and must stay mounted (gate the `toast` value, never the component), or screen readers miss the announcement. Still: don't make a toast the only confirmation of anything important.
- **Frozen behaviors:** None.

### UnifiedNavBar

- **Purpose:** Sticky contextual top bar for every routed page — back affordance or page title, plus a right-side slot.
- **Variants & states:** Three shapes: back link (`backLabel` + `backTo`), back callback (`backLabel` + `onBack`), title-only (`title`). `children` render right-aligned (3-dot menus) — except in title-only mode, where they're ignored.
- **Required props:** one of the three shapes above. No `className` — its look is not overridable, on purpose.
- **When to use:** **Every routed page renders one** — 12/12 adoption, lint-guarded intent (audit Category E). Use with the `returnUrl` pattern for smart back navigation.
- **When NOT to use:** Inside modals or sub-sections; never stack a second nav bar.
- **Common mistakes:** Passing `title` plus back props — title silently wins and drops the back affordance and children. Sibling sticky elements must coordinate with its height and z-order (Library's tab bar and AuthorsList's sticky search do this by hand today).
- **Frozen behaviors:** None.

### Adjacent shared components (not in `ui/`)

- **`components/BookCard.jsx`** — the title card. **Frozen behavior: the single `variant` prop API — `'compact'` (cover only, default) | `'standard'` (cover + title/author text block) | `'list'` (horizontal row with thumbnail, status, read-time)**. All grids/lists render titles through it; every status label it renders routes through `useStatusLabels` (DNF label, Finished tooltip, and the list variant's in-progress label — the last was hardcoded "Reading" until v0.50.0); wishlist items get the dashed cover border. Don't add layout-mode props — new layouts are new `variant` values, by decision.
- **Do not confuse it with `components/upload/BookCard.jsx`** — a different, frozen component (its gradient hex constants are cover-generation data; CLAUDE.md).
- **`GradientCover.jsx` / `MosaicCover.jsx`** — frozen (output changes repaint every rendered cover). Consume, never edit.

## 4. Pattern docs

### Modals

Build on `ui/Modal` exclusively. Complex modals (multi-section, pickers, editors) use `fullscreenOnMobile` — full-viewport panel on phones, centered card at md+. Simple confirms stay centered at `sm`/`md`. Footer actions: right-aligned in `Modal.Footer`, safe action left of the primary, buttons name their action (never Yes/No/OK — VOICE_AND_TONE, Buttons & Confirmations). No tabs inside modals — split into steps or sections instead. The three bespoke modals are backlog (see §3 Modal).

### Forms

`FormField` for every labeled control; labels stacked above controls. Validation errors are **inline**: banner at the form level when needed plus danger border + message at the field — never `window.confirm`/`alert`, never toast-only (no silent failures, CLAUDE.md golden rule 3). Category selection uses SegmentedControl `sm`; authors use AuthorInput; tags use ChipInput. Wrapper-label patterns (checkbox/radio rows, file-picker buttons) are sanctioned exceptions to FormField (audit §8 list).

### Empty / loading / error states

Every data-driven view ships all three. Loading: skeletons or the pulse pattern, not spinners-only for full screens. Empty states get approved copy (MICROCOPY_LIBRARY, Empty States) — warm, one action offered. Errors: what happened + what to do + a way to do it (VOICE_AND_TONE, Error Messages); rejection-only paths get explicit states.

**Two error registers, split by who acted (ratified 2026-07-19):**

- **LOAD failures** — passive; the user didn't act, a fetch failed under them. Render quiet inline text (`text-text-secondary`) plus a Try again affordance, **inside the failed region**. No danger banner: the user has nothing to undo and nothing urgent to react to.
- **ACTION failures** — the user acted and it didn't take (save, delete, upload, rename). Render the **danger banner at the point of action** (danger border/background tokens, inline, cleared on retry or next action). The v0.63.0 inline-banner precedent governs **this register only** — do not cite it to justify danger styling on load failures.

### List / grid

Title grids use `useGridColumns` — the user's grid-columns setting controls mobile columns; desktop breakpoints are fixed in the hook's `gridClasses`. Adopters: Library, CollectionDetail, AuthorDetail, WishlistTab. **Group views are exempt by decision:** the Collections card grid and Library's Series tab keep fixed grids (they lay out groups, not titles). Rows in list mode come from `BookCard variant="list"`.

### Destructive confirmations (S10 pattern)

**Single-item deletes confirm inline where an in-place control exists** — a row, a card, a list item: the thing being deleted is on screen and can host its own confirm. The triggering control swaps to a confirm/cancel pair (or an adjacent inline strip) styled with `action-danger` for the destructive choice.

**Actions launched from a 3-dot menu or a section header have no in-place surface.** These confirm via a **two-step modal**: step 1 states what is affected (counts, not adjectives); step 2 states what is and isn't recoverable. Buttons name their action; the safe button is the safe outcome, never a deferral.

`window.confirm()` and `alert()` remain banned everywhere, without exception (`window.confirm` lint-enforced). Copy follows the confirmation pattern: title asks, buttons answer ("Remove from library?" → [Remove] [Keep]).

### Page layout

Every routed page renders `UnifiedNavBar` at the top (12/12 today — keep it that way), inside the app shell (`bg-bg-base`, bottom nav clearance on mobile). Detail pages: every section is a `bg-surface` card with border; section header = heading token left, pencil IconButton (36px) right; page-level actions (delete, merge, change cover) live in the 3-dot menu, not scattered buttons. Filter state persists in URL params; back navigation uses the `returnUrl` pattern.

### Status labels

Display labels come from `useStatusLabels` — **only**. "Abandoned" is the internal DB value; the display label is user-configurable and defaults to "DNF"; the literal word "Abandoned" never renders (lint-enforced for literals; the hook is the mechanism). Session-status keys (snake_case: `in_progress`/`finished`/`dnf`) translate through `SESSION_STATUS_TO_BACKEND` (BookDetail) before hitting `getLabel`. Status options in selects come from `getStatusOptions()`, never hand-built arrays. Rating labels likewise via `useRatingLabels`.

**Ratified exception (StatusLabelsModal, v0.65.0):** the settings modal's field labels render the static canonical defaults (Unread / In Progress / Finished / DNF) — never the live-updating custom values — so the canonical name stays on screen while a custom label is typed; the per-field Reset link renders only while the field's value differs from its default. Reviews should not re-flag this render.

## 5. Anti-patterns ("Cursor, don't")

| Don't | Enforcement |
|---|---|
| Indigo, anywhere — any `indigo-*` utility | **Lint (strict)** |
| Red/danger styling on DNF or set-aside states — DNF is neutral | **Judgment** (code-reviewer; philosophy: setting aside ≠ failure) |
| Raw `<button>` outside `components/ui/` | **Lint (report-only** until the conversion backlog clears, then strict**)** |
| Hardcoded colors outside frozen files — default palette, raw hex, arbitrary hex values | **Lint (strict**, audit patterns A1–A5 plus A6 since v0.74.0: unbracketed hex in className strings, SVG `stroke=`/`fill=` attributes, and CSS declarations (minus index.css's sanctioned token-mirror block) is lint-caught; inline-style values and generation-data constants are **judgment** — code-reviewer scope, ratified 2026-07-20. Non-listed hues remain the CHANGELOG 0.50.0 logged gap**)** |
| Color-bearing component classes in `tokens.css` — the `@layer components` token era is over (deleted v0.49.0) | **Judgment** (code-reviewer; config is the only token source) |
| "Abandoned" / "Did Not Finish" as UI copy | **Lint (strict** for literals**)** + `useStatusLabels` pattern |
| SmartPaste references in the frontend — feature removed (C5, v0.44); backend endpoints linger but have no UI | **Judgment** |
| `font-bold` on headings or beside typography tokens | **Lint (strict)** |
| Tabs inside modals | **Judgment** (code-reviewer; restructure as steps/sections) |
| `window.confirm(` — and `alert()` for blocking errors | **Lint (strict** for `window.confirm(` and bare `confirm(` — same function, both spellings matched since S16 C1; `alert(` strict since the v0.57.0 rider — the ledger closed at v0.63.0 with 0 call sites**)** |
| Typography token + core Tailwind size in one className | **Lint (strict**, cascade-flip**)** |
| `text-h1` | **Lint (strict)** — see §2 |

Lint = `scripts/design-lint.mjs` (`npm run design-lint` from `frontend/`; report at `docs/DESIGN_LINT_REPORT.md`). Judgment = `.claude/agents/code-reviewer.md`, run at the end of every session that changes code.

## 6. Cross-links

- **Why:** `docs/DESIGN_PHILOSOPHY.md` — Swan Song aesthetic, behavioral principles (self-compassion loops, gentle gamification, forgiving interactions), emotional design.
- **Words:** `docs/VOICE_AND_TONE.md` (July 2026 revision — some older docs cite it as "VOICE_AND_TONE_v2.md"; same document) and `docs/MICROCOPY_LIBRARY.md` (the approved strings).
- **Law:** `CLAUDE.md` (repo root) — frozen files, golden rules, git policy, session rules. Not tracked; wins over everything here on those subjects.
- **Enforcement:** `docs/DESIGN_LINT_REPORT.md` (current counts + active-ignores inventory), `scripts/design-lint.mjs`, `.claude/agents/code-reviewer.md`.
- **Baseline:** `docs/FRONTEND_AUDIT_S12.md` — the S12 audit this system's zero-targets derive from.
- **System shape:** `docs/ARCHITECTURE.md`.
