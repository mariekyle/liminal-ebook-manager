## UI Mockup Sprint — status + prompt queue

Updated: 2026-08-20 · Design-only, no code, no implementation scheduled.

**Law**:

1. [[2026-07-30_ui-mockup-sprint-decisions]] (the law for locked decisions)
2. [[2026-08-02_slice3-library-capture]] (Slice 3 decisions + state system)
3. [[2026-08-03_slice4-search-capture]] (Slice 4 decisions; SRCH9 divider deviation)
4. [[2026-08-05_slice5-collections-capture]] (Slice 5 decisions COLL1–14)
5. [[2026-08-20_slice6-series-author-capture]] (Slice 6 decisions SA1–5, SER1–6+2b, AUTH1–8)
6. [[2026-08-23_home-purpose-capture]] (HP1–HP10; Home purpose, lenses, tally, Stats mandate)
7. `liminal-book-detail-mockup-v5.html` (canonical patterns + exact CSS values)
8. '[[liminal-home-mockup-v8.html]] (canonical — REPLACES v5: reading rail, lens rails, tally)'
9. `liminal-library-mockup-v5.html` (canonical — Collections icon updated 2026-08-03, replaced in place)
10. `liminal-search-mockup-v3.html` (canonical — search interaction contract + grouped-result language)
11. `liminal-collections-mockup-v2-5.html` (canonical — index, detail template, sheets) ← confirm filename vs Decisions' "v2"
12. `liminal-series-author-mockup-v7.html` (canonical — series detail, author Shrine, SA5 top bar)

==IMPORTANT== *All html mockup files cam be found in the "ObsidianVaults/ __ Liminal/ _ liminal artifacts" folder on the NAS*

**Open items**: see [[Open Questions]] — Slice 8 audit inherits the SA1 retro-touch (🟠); Home purpose still gates Slice 7; DNF-red bug, third track, partial stars, teal contrast unchanged from 07-30.

### One-time setup

- [x] Add to Claude project knowledge: 2026-07-30 decisions capture doc
- [x] Add to Claude project knowledge: liminal-book-detail-mockup-v5.html
- [x] Add to Claude project knowledge: liminal-home-mockup-v5.html
- [x] Add to Claude project knowledge: Mockup Sprint Plan.md (this plan's reference copy)

### Slice map

| #   | Slice                                                                                                                                                                        | Status      | Gate                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------- |
| 1   | Book Detail (v5 canonical)                                                                                                                                                   | ✅ done      | —                                       |
| 2   | Home + Nav IA (v4 canonical)                                                                                                                                                 | ✅ done (v8) | __                                      |
| 3   | Library — view scopes (All · Series · Authors), ownership filter, sort, grid/list, filter sheet, A–Z rail, state system                                                      | ✅ done      | —                                       |
| 4   | Search — absorbs Browse; input-as-header, recents + browse-by pre-type, one-tap pills, LIB6 sheet reuse, grouped results, split no-results                                   | ✅ done      | —                                       |
| 5   | Collections — index (flat, art tiles / LIB9 rows), one variant-aware detail template, whispered variant notices, Completed section pattern, sheet-based modals, kebab matrix | ✅ done      | —                                       |
| 6   | Series & Author detail — SA5 top bar, series navigator, author Shrine (palette wash, rail, flat grid)                                                                        | ✅ done      | v7 canonical; SA1 retro-touch → Slice 8 |
| 7   | Stats page — period selector + HP10 content mandate (Volume · Finishes · Rhythm · Set Aside)                                                                                 | ☐ next      |                                         |
| 8   | Settings + audit close — light-token ratification, consistency pass, SA1 retro-touch verification (LIB12/SRCH8)                                                              | ☐           | last                                    |

Out of scope:

- Upload/Add flow, DuplicatesPage (fresh v0.86–0.87 code).
- Implementation of anything = separate track: recon → Decision Sprint confirmation → prompt batches.
- **Queued post-sprint (Slices 9–10, after v0.86–0.87 code settles):** DuplicatesPage restyle and Add-to-Library flow. Both are freshly shipped code — redesigning them mid-sprint fights live implementation. They enter as ordinary slices once the current sprint closes and the code has stopped moving.

### Session ritual

- Open: paste the slice's kickoff prompt + upload CURRENT screenshots.
- Iterate: one change-set per mockup version, phone review each.
- Close: say "capture" → paste-ready Decisions/Open Questions blocks + updated checkboxes here + new canonical mockup swapped into project knowledge.

### Prompt queue — Slice 3: Library

Continuing the Liminal UI Mockup Sprint. Search project knowledge for the 2026-07-30 UI mockup sprint decisions doc before anything else — system rules S1–S9, IA decisions NAV1–NAV7, and the Book Detail / Home patterns are LOCKED. Inherit them; do not relitigate. The canonical mockup HTML files in project knowledge carry the exact token values, scaffold conventions, and component patterns — reuse them.

This session: Slice 3 — the Library screen (the new 4-tab IA's workhorse).

Scope: view scope control All · Series · Authors (anchored in the Library header per NAV2 — floating sub-nav was rejected); ownership filter including Wishlist (NAV3); sort control, grid/list toggle, filter sheet; Authors scope needs an A–Z jump rail and far more rows per screen (currently ~7 of 1,418); Series scope grid with count badges restyled to system.

Known sins from the original audit: index pages stack three control rows before content; sort affordances inconsistent (double-caret + chevron combos); no fast-scroll for long lists.

Open for this slice: scope control form (segmented vs pills), list-row anatomy, grid density, filters as sheet vs inline chips, A–Z rail design, empty states (voice: warm, no exclamation marks).

I'm uploading current screenshots now. Give me your assessment first, then a first-pass mockup — same scaffold conventions (theme toggle + state toggles as needed), both themes, phone-first. At session close I'll say "capture."

### Prompt queue — Slice 4: Search

Continuing the Liminal UI Mockup Sprint. Search project knowledge for the 2026-07-30 UI mockup sprint decisions doc AND the Slice 3 (Library) capture before anything else — the system rules, IA, and Library's filter/row language are LOCKED. Inherit them.

This session: Slice 4 — the Search screen. Per NAV4 it absorbs the old Browse screen entirely; the Home/Browse/Wishlist top-tab row no longer exists.

Scope: search input states (empty, typing, results) with the MICROCOPY_LIBRARY placeholder; Browse's discovery filters folded in as filter chips (read-time tiers, category, status — old ?readTime=30-60 style params become chip state); result rows borrowing Library's row anatomy, grouped results if warranted (titles / series / authors); empty and no-results states — warm, specific, no exclamation marks; and what appears before you type (recents? filter shortcuts?) — propose and argue.

I'm uploading current screenshots of Search and Browse now. Assessment first, then first-pass mockup, both themes. At close I'll say "capture."

HARD REQUIREMENT (from Slice 3 / LIB13): Search must handle author search — the Library Authors scope has no search input by design; the Search tab owns it. Author results use Library's row anatomy (LIB9).

### Prompt queue — Slices 7–8 (stubs; expand when reached)

- Slice 7 Stats: GATED on thinking. Ratified so far: period selector This month / This year / Last year / All-time; Home doorbell links here.
- Slice 8 Settings + audit close: gear destination, remaining sheets, wheat light-mode → formal token ratification, cross-screen consistency audit, SA1 retro-touch verification (LIB12 series rows + SRCH8 series results get the "& others" derivation); findings → Open Questions.

### Standing rules (every slice)

- Decisions.md is law; mockups argue with pixels, not ratified decisions.
- Current-app screenshots open every session — never design from memory.
- Real library data as fixtures; gradients stand in for cover art.
- Both themes, 430px phone frame, scaffold state toggles, 44px targets, WCAG 4.5:1, no exclamation marks, DNF never red.
- No implementation prompts in mockup sessions. Different hat.