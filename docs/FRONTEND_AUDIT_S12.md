# FRONTEND_AUDIT_S12 — Design Consistency Sweep (Phase 10.0E)

**Audit date:** 2026-07-05 · **Code state:** commit `6b9789c` (v0.47.3, "fix tokens.css never loading") · **Read-only — no source files modified.**

**Scope:** `frontend/src/**` — all `.jsx`, `.js`, `.css` (85 files = 88 found − 3 frozen exclusions: `GradientCover.jsx`, `MosaicCover.jsx`, `upload/BookCard.jsx`). Backend frozen files contain no frontend classes and are outside the swept tree.

**Counting rules** (uniform across categories, documented for S13 reuse):
- An **instance** is one regex match (occurrence-level, `re.finditer`), not one line — a line with `text-gray-400 hover:text-gray-300` counts 2.
- Counts include comments/JSDoc; every comment-hit is footnoted where it changes a verdict (H1, S1).
- Variant prefixes (`hover:`, `focus:`, `md:`) count as part of the same instance, not separate ones.
- Definition sites are excluded from their own usage counts: `styles/tokens.css` for Section 1 and Category D; `hooks/useStatusLabels.js` for I1; `hooks/useGridColumns.js` for I2; `components/ui/` for B, D, G.
- Reproducibility: the full engine was run twice; outputs are byte-identical.

---

## 0. Baseline Summary — S13 Lint Zero-Target

**This table is the zero-target baseline for the Session 13 lint script.** "Lint target" is the number the lint asserts must not grow (and drives to zero for Fix-now categories).

| # | Category | Instances | Files | Jan 2026 (before) | Proposed triage |
|---|----------|-----------|-------|-------------------|-----------------|
| 1 | tokens.css component-layer class usages | **394** | 58 | n/a (system introduced post-Jan) | **Park** — migration project (S13+ decision) + lint freeze |
| A | Hardcoded colors | **112** | 11 | ~1,445 / 56¹ | **Fix-now** (mapping table below) |
| B | Raw `<button>`/`<input>`/`<select>`/`<textarea>` outside ui/ | **182** | 43 | buttons ~262 / 48 · forms 81 / 20 | **Park** — conversion batches (not mechanical) |
| C | ui/ component className overrides | **3** | 3 | n/a | **Fix-now** |
| D | Typography drift outside ui/ | **24** | 11 | n/a | **Fix-now** |
| E | Routed pages missing UnifiedNavBar | **0** | 0 | adoption was partial | **Lint-enforced** (keep at 0) |
| F | Bespoke modals (of 19 modal components) | **3** | 3 | n/a | **Park** — per-modal conversion prompts |
| G | Labeled form fields not on FormField | **6** | 2 | (forms 81 / 20) | **Fix-now** |
| H1 | `indigo` anywhere | **0 code** (1 comment) | 0 (1) | — | **Lint-enforced** (target 0; see note) |
| H2 | Red/danger within 5 lines of DNF/abandoned logic | **1** | 1 | — | **Fix-now** |
| H3 | "Abandoned"/"Did Not Finish" in user-facing copy | **2 literals** (+1 raw-value render) | 3 | — | **Fix-now** |
| I1 | Status labels rendered without useStatusLabels | **3** (+2 bespoke loaders) | 2 (+2) | — | **Fix-now** |
| I2 | Hardcoded `grid-cols-*` on book/title grids | **1 candidate** | 1 | — | **Park** — needs a product decision |

¹ Session-12 prompt says 56 files; Decisions.md (2026-03-27) says 62. Both cited; the instance count 1,445 is consistent.

**Headline:** hardcoded colors are down **92%** (1,445 → 112) and the remaining debt is concentrated in **4 never-converted files** (§2). BookDetail — January's worst offender at 211 colors — is now at **0** (§11). The two-token-systems migration (§1) is the largest open surface: 394 usages.

---

## 1. Two-Token-Systems Migration Targets (tokens.css `@layer components`)

Classes defined in `frontend/src/styles/tokens.css` under `@layer components` that declare or `@apply` a color. **All 8 typography token classes qualify** — each `@apply`s a semantic color utility (`text-text-primary`, `text-text-body`, `text-text-secondary`, or `text-text-muted`). This is the layer that silently dropped out of the build in 0.47.2 (import-order bug, fixed 0.47.3) — every usage below is a migration target from CSS-layer classes to `tailwind.config.js`-driven utilities.

Not qualifying: `.glass-panel` and `.grain-overlay::after` declare colors but sit **outside** `@layer components` (see Observations, §12.6).

| Class | Applies (color part) | Usages | Files | Top offenders |
|-------|----------------------|--------|-------|---------------|
| `text-h1` | `text-text-primary` | **0** | 0 | — (defined but unused) |
| `text-h2` | `text-text-primary` | **13** | 11 | HomeTab 3; 10 files ×1 |
| `text-h3` | `text-text-primary` | **2** | 2 | BookDetail 1, WishlistTab 1 |
| `text-h4` | `text-text-primary` | **20** | 14 | HomeTab 5, BookDetail 2, ImportPage 2 |
| `text-body` | `text-text-body` | **9**² | 6 | Settings 3, SettingsRow 2 |
| `text-body-sm` | `text-text-secondary` | **197** | 51 | ImportPage 18, BookDetail 11, DuplicatesPage 11, Library 9, ComponentPreview 9 |
| `text-caption` | `text-text-muted` | **113** | 35 | Library 18, BookDetail 11, CollectionModal 8, HomeTab 8 |
| `text-label` | `text-text-body` | **40** | 14 | BookDetail 10, FilterDrawer 8, AuthorDetail 4 |
| **Total** | | **394** | **58 unique** | |

² Includes 1 comment mention (`index.css:11` — `/* text-body — base... */`); real usages: 8.

Samples: [AuthorDetail.jsx:315](frontend/src/components/AuthorDetail.jsx:315) `<p className="text-body-sm text-text-secondary">Loading author...</p>` · [Library.jsx](frontend/src/components/Library.jsx) (18× `text-caption`) · [BookDetail.jsx:1529](frontend/src/components/BookDetail.jsx:1529) `<h1 className="text-h2 text-text-primary mb-1 ...">` · [AuthorChips.jsx:193](frontend/src/components/AuthorChips.jsx:193) `<p className="text-caption text-text-muted">`

**Migration-relevant observation:** a large share of usages pair the token class with an explicit duplicate of the same color (`text-body-sm text-text-secondary`, `text-h2 text-text-primary`) — defensive additions from the 0.47.2 era. Where the pair exists, removing the token class is loss-free for color; only size/weight must be re-expressed. This makes a mechanical migration substantially safer.

Note: 2 of the 40 `text-label` usages are inside `ui/FormField.jsx` (the component's own label styling) — migrate with the component, not per call site.

---

## 2. Category A — Hardcoded Colors

**112 instances / 11 files** (Jan: ~1,445 / 56¹ → **−92% instances**). Sub-pattern breakdown:

| Sub | Pattern (see Appendix) | Instances | Files |
|-----|------------------------|-----------|-------|
| A1 | `text-white` | 25 | 9 |
| A2 | `text-gray-*`, `bg-gray-*`, `border-gray-*` | 69 | 6 |
| A3 | any `zinc-*` / `slate-*` utility | 2 | 1 |
| A4 | raw hex in className `[#...]` | 1 | 1 |
| A5 | default palette: text/bg/border/ring × indigo/red/green/blue/yellow | 15 | 4 |

**Top offenders (all sub-patterns combined):**

| Instances | File |
|-----------|------|
| 35 | components/DuplicateCollectionModal.jsx |
| 27 | components/DuplicateFinderModal.jsx |
| 15 | components/BookLinkPopup.jsx |
| 14 | components/CriteriaBuilder.jsx |
| 6 | App.jsx |
| 5 | components/ui/Toast.jsx |
| 3 | components/ui/UnifiedNavBar.jsx |
| 2 | components/ReadingStatusCard.jsx · ui/Button.jsx · pages/Settings.jsx |
| 1 | pages/AddPage.jsx |

**The four never-converted stragglers (Duplicates pair, BookLinkPopup, CriteriaBuilder) hold 91 of 112 instances (81%).** These are whole-file conversions, not scattered drift.

Samples:
- [App.jsx:40](frontend/src/App.jsx:40) `<p className="text-gray-400">Connecting to library...</p>` (pre-connection screens, also `text-white` ×3)
- [BookLinkPopup.jsx:93](frontend/src/components/BookLinkPopup.jsx:93) `className="text-gray-400 hover:text-white p-1"`
- [DuplicateFinderModal.jsx:85](frontend/src/components/DuplicateFinderModal.jsx:85) `bg-red-900/30 border border-red-800 ... text-red-400` (A5)
- [CriteriaBuilder.jsx:233](frontend/src/components/CriteriaBuilder.jsx:233) `text-xs text-red-400 hover:text-red-300` (A5)
- [ui/Toast.jsx:13](frontend/src/components/ui/Toast.jsx:13) `loading: 'bg-zinc-700'` (A3 — both zinc hits; inside ui/ itself)
- [AddPage.jsx:526](frontend/src/pages/AddPage.jsx:526) `<div className="text-[#e0e0e0]">` (the only raw-hex arbitrary value in the tree)

**Fix-now mapping table (mechanical):** `text-white→text-text-primary` · `text-gray-300→text-body` context / `text-text-body` · `text-gray-400→text-text-secondary` · `text-gray-500→text-text-muted` · `bg-gray-700/800/900→bg-bg-elevated/surface/base` · `border-gray-600/700→border-border-default` · `bg-zinc-700→bg-bg-elevated` · `text-[#e0e0e0]→text-text-primary` · error reds `red-300/400/800/900→action-danger` family · `text-blue-300/400→action-primary` · greens→`action-success`. Edge cases for eyes-on review: `text-white` on colored chip backgrounds (contrast), Toast's zinc loading state (pick a semantic), UnifiedNavBar/Button hits live inside ui/ components.

---

## 3. Category B — Raw Interactive Elements Outside `components/ui/`

**182 instances / 43 files** (Jan: buttons ~262/48, form elements 81/20). By element: `<button` **134/35** (−49%) · `<input` **33/21** · `<select` **12/7** · `<textarea` **3/2** (forms combined: 48/24³).

³ Forms: instances 81→48 but files 20→24. January's count predates the add/upload flows and settings modals; per-file adoption of FormField (§8) rose while raw inputs spread across more, smaller files.

**Adoption matrix — top 15 by total (b/i/s/t = button/input/select/textarea):**

| Total | b | i | s | t | File |
|-------|---|---|---|---|------|
| 30 | 21 | 4 | 3 | 2 | components/BookDetail.jsx |
| 15 | 15 | 0 | 0 | 0 | components/Library.jsx |
| 10 | 10 | 0 | 0 | 0 | components/CollectionDetail.jsx |
| 9 | 9 | 0 | 0 | 0 | components/SortDropdown.jsx |
| 8 | 2 | 2 | 4 | 0 | components/UnifiedEditModal.jsx |
| 7 | 4 | 2 | 0 | 1 | components/CollectionModal.jsx |
| 6 | 5 | 1 | 0 | 0 | components/DuplicateCollectionModal.jsx |
| 6 | 5 | 0 | 1 | 0 | components/FilterDrawer.jsx |
| 6 | 2 | 3 | 1 | 0 | pages/Settings.jsx |
| 5 | 5 | 0 | 0 | 0 | components/CollectionsTab.jsx |
| 5 | 5 | 0 | 0 | 0 | components/ReadingStatusCard.jsx |
| 5 | 4 | 1 | 0 | 0 | components/SearchBar.jsx |
| 5 | 3 | 2 | 0 | 0 | pages/ImportPage.jsx |
| 4 | 4 | 0 | 0 | 0 | components/CollectionCard.jsx |
| 4 | 4 | 0 | 0 | 0 | components/DuplicateFinderModal.jsx |

Remaining 28 files: ≤4 each (full list reproducible via Appendix pattern B). Samples: [App.jsx:54](frontend/src/App.jsx:54), [AuthorChips.jsx:174](frontend/src/components/AuthorChips.jsx:174), [BookContextMenu.jsx:29](frontend/src/components/BookContextMenu.jsx:29).

**Triage: Park.** Each site needs a variant/size decision (`Button` primary/secondary/ghost/danger, `IconButton`, or intentionally-bare chip buttons like category pills). Not a find/replace. Recommend the January approach: per-file conversion prompts, largest first — BookDetail (30) and Library (15) cover 25% of the debt. A subset is legitimately bare (e.g., card-sized tap surfaces); the conversion prompts should whitelist those explicitly so the lint can ignore them by file:line or wrapper comment.

---

## 4. Category C — Shared-Component className Overrides

**3 instances / 3 files.** All ui/ components enumerated from the actual directory: AuthorInput, Badge, Button, ChipInput, CollapsibleSection, FileDropZone, FormField, IconButton, Modal, SearchInput, SegmentedControl, StarRating, Toast, UnifiedNavBar. (BottomSheet and ThreeDotMenu no longer exist in ui/ — see §12.5.)

| File:line | Component | Override |
|-----------|-----------|----------|
| [UnifiedEditModal.jsx:320](frontend/src/components/UnifiedEditModal.jsx:320) | `<AuthorInput>` | full input restyle passed in: `bg-bg-elevated border-border-default text-text-primary text-body-sm placeholder:text-text-muted focus:border-action-primary` |
| [ManualEntryForm.jsx:340](frontend/src/components/add/ManualEntryForm.jsx:340) | `<Button>` | `!bg-action-success hover:!bg-action-success-hover` (force-overrides variant with `!important`) |
| [WishlistForm.jsx:356](frontend/src/components/add/WishlistForm.jsx:356) | `<Button>` | `!bg-action-warning hover:!bg-action-warning/85` (same pattern) |

All three use **semantic** tokens (no raw palette), so this is API drift, not color drift: the two `!bg-` Buttons are variants that don't exist (`success`, `warning`) being forced from outside; AuthorInput either needs these as its defaults or a `size`/`variant` prop. **Fix-now:** add `success`/`warning` variants to Button (or use existing semantics), fold AuthorInput's styling into the component.

---

## 5. Category D — Typography Drift (outside ui/, excluding tokens.css definitions)

**24 instances / 11 files**: `text-xl|2xl|3xl` **4/4** · `font-bold|semibold` **20/9**.

| Instances | File |
|-----------|------|
| 10 | components/BookDetail.jsx (all `font-semibold`) |
| 2 | App.jsx · Header.jsx · SeriesCard.jsx · SortDropdown.jsx |
| 1 | BottomNav.jsx · DuplicateCollectionModal.jsx · DuplicateFinderModal.jsx · upload/UploadProgress.jsx · pages/AddPage.jsx · pages/ImportPage.jsx |

Samples: [App.jsx:51](frontend/src/App.jsx:51) `text-xl font-bold text-white` (Connection Error h1 → should be `text-h3`+semantic) · [BookDetail.jsx:1572](frontend/src/components/BookDetail.jsx:1572) `text-text-primary font-semibold` (stat values → closest token `text-h4`/`text-label` decision) · [Header.jsx:86](frontend/src/components/Header.jsx:86) `text-xl font-bold text-text-primary` (app wordmark) · [BottomNav.jsx:6](frontend/src/components/BottomNav.jsx:6) `text-2xl leading-none` (emoji icon sizing — arguably not typography; flag for the lint's ignore-list).

**Fix-now** via mapping: `text-xl font-bold → text-h3` · `font-semibold` value-emphasis → `text-h4` or keep-with-token decision per the 8-token rule. BookDetail's 10 are one repeated stat-value pattern — single find/replace.

---

## 6. Category E — UnifiedNavBar Adoption

**12/12 routed pages render `<UnifiedNavBar>` — 100% adoption, zero misses.** Routes enumerated from [App.jsx](frontend/src/App.jsx) (plus `/tbr` and `/upload` redirects, which render no component).

| Route | Page component | Renders UnifiedNavBar |
|-------|----------------|-----------------------|
| `/` | components/Library.jsx | ✅ (explicitly verified) |
| `/book/:id` | components/BookDetail.jsx | ✅ |
| `/series/:name` | components/SeriesDetail.jsx | ✅ |
| `/authors` | pages/AuthorsList.jsx | ✅ (explicitly verified) |
| `/author/:name` | components/AuthorDetail.jsx | ✅ |
| `/collections` | components/CollectionsTab.jsx | ✅ (explicitly verified) |
| `/collections/:id` | components/CollectionDetail.jsx | ✅ |
| `/settings` | pages/Settings.jsx | ✅ |
| `/import` | pages/ImportPage.jsx | ✅ (explicitly verified) |
| `/add` | pages/AddPage.jsx | ✅ |
| `/duplicates` | pages/DuplicatesPage.jsx | ✅ (explicitly verified) |
| `/dev/components` | pages/ComponentPreview.jsx | ✅ (dev-only route) |

**Lint-enforced going forward** (assert import+render in every file registered as a `<Route element>`).

---

## 7. Category F — Modal Adoption

19 modal-named components (excluding the ui/Modal primitive itself): **16 on shared `<Modal>`, 3 bespoke.**

| Modal | Built on ui/Modal? |
|-------|--------------------|
| ChangeCoverModal, ChangeStatusModal, CollectionModal, EditAuthorModal, FandomModal, MarkFinishedModal, SearchModal, ShipModal, TagsModal, UnifiedEditModal | ✅ shared |
| settings/: BackupRetentionModal, ExtractCoversModal, RatingLabelsModal, RescanMetadataModal, StatusLabelsModal | ✅ shared |
| upload/CancelModal | ✅ shared |
| **components/DuplicateCollectionModal.jsx** | ❌ bespoke (own `fixed` overlay; also top color offender) |
| **components/DuplicateFinderModal.jsx** | ❌ bespoke (own `fixed` overlay; #2 color offender) |
| **components/add/AnalyzingModal.jsx** | ❌ bespoke (own `fixed` overlay) |

Fixed-position overlays that are **not** modals (inventoried; bespoke by design or sanctioned):
- FilterDrawer — sanctioned one-off drawer (Decisions.md: "one drawer = a component, not a pattern")
- BookContextMenu (long-press menu) · BookLinkPopup (note-link popup) · SortDropdown (backdrop)
- Click-away backdrops: [CollectionCard.jsx:110](frontend/src/components/CollectionCard.jsx:110), [CollectionsTab.jsx:317](frontend/src/components/CollectionsTab.jsx:317), [CollectionDetail.jsx:1016](frontend/src/components/CollectionDetail.jsx:1016), [BookDetail.jsx:1738](frontend/src/components/BookDetail.jsx:1738)
- BookDetail: [line 180](frontend/src/components/BookDetail.jsx:180) mobile action-menu overlay · [line 2289](frontend/src/components/BookDetail.jsx:2289) fullscreen notes editor
- False positive of the overlay heuristic: `tokens.css` `.grain-overlay` (`position: fixed`, decorative) — excluded.

**Park:** the 3 bespoke modals each need a conversion prompt (DuplicateCollection/DuplicateFinder conversions should be bundled with their §2 color work — same two files). AnalyzingModal is a progress surface; decide whether Modal's dismiss semantics fit before converting.

---

## 8. Category G — FormField Adoption

25 non-ui files render form elements; 14 import FormField. Raw `<label>`+input pairs bypassing FormField: **6 instances / 2 files** — the same two straggler files as §2:

| File | Raw labeled fields | Notes |
|------|--------------------|-------|
| [CriteriaBuilder.jsx](frontend/src/components/CriteriaBuilder.jsx) (lines 62, 90, 167) | 3 | labels styled `text-xs font-medium text-gray-400` (also A2/D hits) |
| [DuplicateCollectionModal.jsx](frontend/src/components/DuplicateCollectionModal.jsx) (lines 203, 219, 273) | 3 | labels styled `text-sm font-medium text-gray-300` |

`<label>` occurrences that are **not** FormField gaps (wrapper-label patterns FormField doesn't cover — flag as lint ignores): FilterDrawer 302/334/374 (checkbox-row tap targets), ExtractCoversModal 57/66 (checkboxes), DuplicatesPage 282 (radio row), ImportPage 280 (file-picker button), CollectionModal 456 (upload button). Partial adopters worth noting: CollectionModal (4 FormField + 1 wrapper-label ✓ fine), FilterDrawer (1 FormField + 3 wrapper-labels ✓ fine).

**Fix-now:** 6 fields → `<FormField>`, mechanical (both files get touched by the §2 color batch anyway).

---

## 9. Category H — Philosophy Drift

**H1 — indigo anywhere: 0 in code.** ✅ Target met. Raw grep returns exactly 1 hit and it is a comment: [SeriesCard.jsx:26](frontend/src/components/SeriesCard.jsx:26) `// Warm palette fallback (replaces old cold indigo #667eea/#764ba2)`. S13 note: either strip comments before matching or set baseline to 1-comment-hit.

**H2 — red/danger within 5 lines of DNF/set-aside/abandoned logic: 1 pair.**
[BookDetail.jsx:1999](frontend/src/components/BookDetail.jsx:1999):
```jsx
book.completion_status === 'Abandoned' ? 'bg-action-danger/20 text-action-danger' :
```
Context: this is the **fanfic completion-status** badge (Complete/WIP/Abandoned), not reading status — but the philosophy applies and the codebase already disagrees with itself: [ImportPage.jsx:24](frontend/src/pages/ImportPage.jsx:24) renders the same `'Abandoned'` status neutral (`bg-status-dnf/20 text-status-dnf`). **Fix-now:** align BookDetail to the neutral treatment (`status-dnf` or `chip-default`), per "setting aside ≠ failure."

**H3 — "Abandoned" / "Did Not Finish" in user-facing copy: 2 literal violations (+1 raw-value render) across 3 files.** Raw grep: 46 occurrences; 44 are internal DB values (`completion_status === 'Abandoned'`), map keys, JSDoc, or the sanctioned definition sites. "Did Not Finish": 0 anywhere. The violations:

1. [settings/StatusLabelsModal.jsx:12](frontend/src/components/settings/StatusLabelsModal.jsx:12) — `{ key: 'dnf', label: 'Abandoned' }`: the Settings row for renaming the DNF status is itself titled **"Abandoned"** in the UI. Should be "DNF".
2. [CriteriaBuilder.jsx:132](frontend/src/components/CriteriaBuilder.jsx:132) — `settingsMap.status_label_dnf || 'Abandoned'`: fallback renders **"Abandoned"** in the status dropdown when the setting is absent. The shared hook's fallback is `'DNF'` — this bespoke loader drifted (see I1).
3. [BookDetail.jsx:2003](frontend/src/components/BookDetail.jsx:2003) — `{book.completion_status}` renders the raw DB value, so abandoned fics display **"Abandoned"**. Precedent exists for mapping it: ManualEntryForm:314, WishlistForm:330 and UnifiedEditModal:424 all route `'Abandoned'` through `getLabel()`.

---

## 10. Category I — Hook Adoption

**I1 — status labels bypassing `useStatusLabels`: 3 rendered instances / 2 files, plus 2 bespoke re-implementations.** Raw grep: 65 occurrences; the majority are internal DB-value comparisons (`status === 'Finished'`), API arguments, backend-key maps, or `labels[...]`/`getLabel(...)` lookups — all sanctioned. Violations:

| Where | Problem |
|-------|---------|
| [ReadingStatusCard.jsx:33](frontend/src/components/ReadingStatusCard.jsx:33), [:41](frontend/src/components/ReadingStatusCard.jsx:41) | `label: 'Not Started'` rendered directly (file imports the hook but not for this label). "Not Started" is not a configurable status label — decide: route through `getLabel('Unread')` or whitelist as distinct copy. |
| [CriteriaBuilder.jsx:201](frontend/src/components/CriteriaBuilder.jsx:201) | `label="Finished"` on the date-finished field — renders the fixed word while the status name is user-configurable elsewhere in the same form (`statusLabels['Finished']` exists 55 lines up). |

Bespoke loaders duplicating the hook (drift risk — one already produced the H3 #2 bug):
- [CriteriaBuilder.jsx:128-133](frontend/src/components/CriteriaBuilder.jsx:128) — refetches settings, rebuilds the label map, wrong `'Abandoned'` fallback.
- [CollectionDetail.jsx:582](frontend/src/components/CollectionDetail.jsx:582) — same pattern (`status_label_dnf || 'DNF'`), correct fallbacks today, unguarded tomorrow.

**Fix-now:** replace both loaders with `useStatusLabels`, fix the 3 rendered labels. (StatusLabelsModal's own DEFAULTS are sanctioned — it edits the labels.)

**I2 — hardcoded `grid-cols-*` on book/title grids: 1 candidate.** Raw grep: 21 matches on 13 lines / 11 files. Confirmed `useGridColumns` adopters: **Library, CollectionDetail, AuthorDetail, WishlistTab** ✅ (SeriesDetail renders a list, no grid — consistent). Of the 13 hardcoded sites, 12 are non-book layout grids (HomeTab stats trio, settings summary two-columns, CriteriaBuilder form rows, metadata `[auto_1fr]`, cover-style pickers, AuthorsList name cards). The candidate:

- [CollectionsTab.jsx:433](frontend/src/components/CollectionsTab.jsx:433) `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` — the collections-card grid. **Park (product decision):** should collection cards follow the Library grid-columns setting, or is a fixed collection grid intentional? Not mechanical either way.

---

## 11. BookDetail Spotlight

| Category | Jan 2026 | Now | Verdict |
|----------|----------|-----|---------|
| A hardcoded colors | **211** | **0** | ✅ fully converted |
| S1 token-class usages | — | 36 (11 body-sm, 11 caption, 10 label, 2 h4, 1 h2, 1 h3) | migrates with §1 |
| B raw elements | 45 buttons (Jan) | **30** (21 b / 4 i / 3 s / 2 t) | largest file in B — first conversion batch |
| C ui/ overrides | — | 0 | ✅ |
| D typography | — | 10 (`font-semibold` stat-value pattern) | one mechanical replace |
| E UnifiedNavBar | — | ✅ renders | ✅ |
| F | — | shared Modal ✅ + 3 sanctioned overlays + mobile menu + fullscreen notes | inventoried §7 |
| G FormField | — | 7 FormField uses, 0 raw labels | ✅ adopted |
| H2 red-on-DNF | — | **1** (completion badge, line 1999) | Fix-now |
| H3 "Abandoned" | — | 1 raw-value render (line 2003) | Fix-now |
| I1 / I2 | — | 0 violations (4/3 raw hits all internal/layout) | ✅ |

**Decision input:** BookDetail does **not** need a dedicated re-conversion prompt. Its color debt is gone; what remains is the shared B backlog (where it should be batch #1), a 10-instance typography replace, and two one-line H fixes.

---

## 12. Out-of-Category Observations (not counted above)

1. **Old navy palette survives in `index.css:20-29`** — scrollbar colors `#1e293b`, `#475569`, `#64748b` (slate-800/600/500). The only navy left in the frontend. One-line fix batch candidate.
2. **Legacy `library-*` aliases: 24 occurrences** (`bg-library-bg/card/accent`, `text-library-accent`), including 4 inside `ui/UnifiedNavBar.jsx` and clusters in the Duplicates pair + App.jsx. Mapped to Warm A values in config, so visually safe — but it is a third color vocabulary in flight; fold into the §2 mapping table (`bg-library-bg→bg-bg-base`, `bg-library-card→bg-bg-surface`, `library-accent→action-primary`).
3. **Token + duplicate color pairing** (`text-body-sm text-text-secondary`) is widespread — see §1; makes migration safer, but S13 lint should eventually flag the redundancy.
4. **`ui/Toast.jsx` carries the tree's only zinc** (`bg-zinc-700` loading state) — drift inside the design system itself.
5. **Docs drift:** `BottomSheet.jsx` and `ThreeDotMenu.jsx` no longer exist under `ui/` but are still listed in SKILL.md/component docs (superseded by BookContextMenu + inline menus).
6. **`.glass-panel` (tokens.css:52)** declares raw `rgba` background/border outside `@layer components` — if it stays, it belongs in the config-token world too; currently unused? (usage grep: 0 hits in jsx) — candidate for deletion in S13.

---

## Appendix A — Exact Patterns (verbatim, Python `re` / PCRE)

Engine: Python 3 `re.finditer` over full file text (occurrence counting). Scope construction:

```
find frontend/src -type f \( -name '*.jsx' -o -name '*.js' -o -name '*.css' \) \
  ! -path '*/node_modules/*' ! -path '*/dist/*' ! -path '*/build/*'
# then remove: components/GradientCover.jsx, components/MosaicCover.jsx, components/upload/BookCard.jsx
```

Boundary guards used throughout: `(?<![\w-])` prefix (also `(?<![\w.-])` where CSS selectors must not match, e.g. `.text-h1 {`) and `(?![\w-])` suffix — these prevent matches inside longer utility names (`text-text-body` when counting `text-body`; `text-body-sm` when counting `text-body`).

**Section 1 (per class C):** `(?<![\w.-])C(?![\w-])` for each of `text-h1, text-h2, text-h3, text-h4, text-body, text-body-sm, text-caption, text-label` · exclude `styles/tokens.css`.

**A1:** `(?<![\w-])text-white(?![\w-])`
**A2:** `(?<![\w-])(?:text|bg|border)-gray-\d{2,3}(?![\w-])`
**A3:** `(?<![\w-])[a-z][\w-]*-(?:zinc|slate)-\d{2,3}(?![\w-])`
**A4:** `\[#[0-9a-fA-F]{3,8}\]`
**A5:** `(?<![\w-])(?:text|bg|border|ring)-(?:indigo|red|green|blue|yellow)-\d{2,3}(?![\w-])`

**B (outside components/ui/):** `<button\b` · `<input\b` · `<select\b` · `<textarea\b`

**C:** JSX opening tags of the 14 ui/ components located via `<(AuthorInput|Badge|Button|ChipInput|CollapsibleSection|FileDropZone|FormField|IconButton|Modal|SearchInput|SegmentedControl|StarRating|Toast|UnifiedNavBar)\b` scanned brace-aware to the tag-closing `>`; the `className` value (string or `{...}` expression) then matched against:
- color: `(?<![\w-])(?:[a-z][\w-]*:)*(?:text|bg|border)-(?:white|black|(?:gray|zinc|slate|red|green|blue|yellow|indigo|orange|amber|lime|emerald|teal|cyan|sky|violet|purple|fuchsia|pink|rose|stone|neutral)-\d{2,3}|\[#[0-9a-fA-F]{3,8}\]|text-(?:primary|secondary|muted|inverse|body)|bg-(?:base|surface|elevated|overlay)|border-(?:default|subtle|focus)|action-[\w-]+|chip-[\w-]+|status-[\w-]+|library-[\w-]+)(?![\w-])`
- typography: `(?<![\w-])(?:[a-z][\w-]*:)*(?:text-(?:xl|2xl|3xl)|font-(?:bold|semibold))(?![\w-])`
- token-class: `(?<![\w.-])text-(?:h[1-4]|body(?:-sm)?|caption|label)(?![\w-])`

**D (outside ui/ and tokens.css):** `(?<![\w-])text-(?:xl|2xl|3xl)(?![\w-])` · `(?<![\w-])font-(?:bold|semibold)(?![\w-])`

**E:** per routed file: `import\s+UnifiedNavBar` and `<UnifiedNavBar\b`

**F:** modal set = basename contains `Modal` (excluding ui/Modal.jsx); overlay heuristic = `fixed\s+inset-0|inset-0[^\n"']*fixed|position:\s*fixed`; shared = `import\s+Modal\s+from\s+['"].*ui/Modal` or `<Modal[\s>]`

**G:** `<label\b` · `<FormField\b` · `<(?:input|textarea|select)\b` per non-ui .jsx file; verdicts per §8.

**H1:** `indigo` (case-insensitive)
**H2:** status keywords `(?i)\b(dnf|set_aside|setaside|abandoned)\b` × red utilities `(?<![\w-])(?:[a-z][\w-]*:)*(?:text|bg|border|ring)-(?:red-\d{2,3}|action-danger(?:-hover)?)(?![\w-])`, pair when `|line_status − line_red| ≤ 5` within the same file
**H3:** `(?:Abandoned|Did Not Finish)` (then manual user-facing classification, §9)

**I1 (excluding hooks/useStatusLabels.js):** `(['"`>])(Not Started|In Progress|Finished|Paused|DNF)(['"`<])` — capture 1/3 both `>`/`<` ⇒ JSX text (then manual rendered-vs-internal classification, §10)
**I2 (excluding hooks/useGridColumns.js):** `(?<![\w-])(?:[a-z][\w-]*:)*grid-cols-(?:\d+|\[[^\]]+\])(?![\w-])`

## Appendix B — Verification Checklist

- [x] Report at repo root; all 9 categories + Section 1 token-class section populated
- [x] Every category includes sample matches with file:line
- [x] Frozen files at zero in every count — programmatic check across all per-file maps: none present; spot-check: `GradientCover.jsx` contains 3 A-pattern color hits, absent from all results
- [x] Counts reproduce — full engine run twice, byte-identical output (covers Category A re-run)
- [x] Zero source files modified — audit performed on a fresh clone of `mariekyle/liminal-ebook-manager` @ `6b9789c`; `git status` shows only this report as untracked
