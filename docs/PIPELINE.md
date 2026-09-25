> Where am I? What's next? Open this at the start of any session.

---

## Phase 10: At a Glance

|Sub-Phase|Name|Est. Sessions|Status|Notes|
|---|---|---|---|---|
|**10.0**|Component Foundation|2|[x] DONE|Tokens, 9 components, BookCard v4, warm gradients|
|**10.0C**|Design System Conversion|8|[X] DONE|C1-C3 before 10.1, C4-C8 interleaved|
|10.0D|UX Audit Fix Sessions|10 + 1|[X] DONE|Sessions 1-11 shipped, 10 decisions locked, regression pass passed|
|**10.1**|Download & Share|1-2|[X] DONE|~~One-tap open in Moon Reader (after S12/S13 consolidation)~~ v0.51.0 (S14) + Multi-Format Editions v0.52.0 (S15)|
|**10.1b**|Metadata Extraction (non-EPUB)|2-3|Scoped, queued|Completes S15: mobi/azw3/html/pdf title+author, category detection. Offline — external lookup stays 10.3. Note: [[2026-07-20_non-epub-metadata-extraction]]\||
|**10.2**|Usage Analytics|1|On hold|Event logging to SQLite|
|**10.3**|External Book Search|2-3|On hold|Google Books / Open Library / Hardcover|
|**10.4**|Local AI Infrastructure|1-2|On hold|Ollama on Beelink|
|**10.5**|Fanfic Analysis Pipeline|2-3|On hold|Tone, tropes, emotional impact via local AI|
|**10.6**|Moon Reader Integration|3-4|On hold|Reading progress + highlights sync|
|**10.7**|Notes <-> Obsidian Sync|2-3|On hold|Bi-directional markdown sync|
|**10.8**|Photo Lookup|1-2|On hold|Camera -> vision AI -> book search|

**After Phase 10:** Phase 11 -- Smart Features (recommendations, mood-based discovery). Requires 10.5 data.

---




## Current Queue: sequencing ratified 2026-09-03

> v0.88.0 (2026-09-24) is the Beelink-migration repo half; v0.87.0 (2026-07-26) is the last product code. Order below is law — Decisions.md SEQ1–SEQ10, with the cutover (D-003–D-013) ahead of it.

| #   | Item                                                                                   | Status                         |
| --- | -------------------------------------------------------------------------------------- | ------------------------------ |
| 0   | **Beelink cutover (D-011 steps 2–9)** — repo half shipped v0.88.0; preconditions 1–7 on a throwaway container, then steps 4–9 | Next                           |
| 1   | Slice 7 Stats — device review + capture (ST1–ST7)                                      | Queued                          |
| 2   | Slice 8 Settings + audit close — incl. Open Questions Defects/Wants split              | Queued                         |
| 3   | Slice 10 Add flow — mocked with 10.3 lookup states                                     | Queued                         |
| 4   | **10.3 External Book Search** — decision sprint → prompts (first implementation block) | Queued                         |
| 5   | Foundation block — nav IA + Button bordered variant + light tokens                     | Queued                         |
| 6   | Per-screen block order — decision sprint after Foundation recon                        | Queued                         |
| —   | 10.1b non-EPUB extraction (+ date_added rider)                                         | Floating — interleave anywhere |
| —   | Search Expansion                                                                       | Rides the Search screen block  |
| —   | Standalone-defect session (3 items, SEQ9)                                              | Unscheduled                    |
| —   | Slice 9 DuplicatesPage restyle                                                         | Tail                           |



---

## Prompt Queue

> _**Standard post-prompt steps** (apply after every prompt):_
> 
> - _Copy changed files dev → Docker volume
> - Run lcheck (do not rebuild on ✗)
> - Rebuild the container
> - Test on mobile
> - Commit to git — CHANGELOG/ROADMAP ship in the same commit._

### Completed

- [x] 10.0B -- Warm Gradient Palette Swap (2026-03-24)
- [x] 10.0B -- BottomSheet + ThreeDotMenu Extraction (2026-03-24)
- [x] 10.0B -- BookCard v4 Redesign (2026-03-24)
- [x] 10.0C/C1 -- BookDetail color + button conversion (2026-03-28) [[C1-BookDetail-colors-buttons]]
- [x] 10.0C/C2 -- BookDetail modals + forms + StarRating | File: [[C2-BookDetail-modals-forms]]
- [x] [[component-preview-prompt]]
- [x] 10.0C/C3 -- [[C3-Library-HomeTab-WishlistTab]]
- [x] 10.0C/C4 - [[C4-Drawers-EditModal-CoverModal]]
- [x] 10.0C/C5 - [[C5-Collections-Family]]
- [x] 10.0C/C6 - [[C6-Series-Authors]]
- [x] 10.0C/C7 - [[C7-Add-Upload-Flows]]
- [x] 10.0C/C8 - [[C8-Filter-Modals-Misc]]
- [x] 10.0D S1 - [[Fix Session 1 Prompt]]
- [x] 10.0D S2 - [[Fix Session 2 Prompt]]
- [x] 10.0D S2.1 - [[Fix Session 2.1 Prompts]]
    - [x] **Prompt 1** — Foundations (hook + GradientCover + settings event)
    - [x] **Prompt 2** — SeriesCard overhaul
    - [x] **Prompt 3** — BookCard upgrade (depends on Prompt 1 for useStatusLabels)
    - [x] **Prompt 4** — CollectionDetail migration (depends on Prompt 3 for linkTo/onClick)
    - [x] **Prompt 5** — View preference restructure (independent, but cleaner after 3)
    - [x] **Prompt 6** — Backend finished_count (independent, requires Docker rebuild)
    - [x] [[fix session 2.1-hotfix]]
- [x] 10.0D S2.2 - [[fix session 2.2 - prompts]]
- [x] 10.0D S3- Session 3: BookDetail Action Architecture
    - [x] Paste [[fix-session-3-track-a-prompt]] in Cursor → let it run
    - [x] When Track A finishes, review → paste [[fix-session-3-track-b-prompt]] in cursor → let it run
    - [x] Return to Claude project with results for audit
- [x] 10.0D S4 - Session 4: Edit Modal Reorganization — write prompt after Session 3 ships [[fix-session-4-prompt]]
- [x] 10.0D S5 - Session 5: Form Input Guards — write prompt after Session 4 ships [[fix-session-5-prompt]]
- [x] 10.0D S7 - Session 7: Settings Consolidation (biggest structural change — ship first) [[fix-session-7-prompt]]
- [x] 10.0D S6 - Session 6: Search and Sort Everywhere
    - [x] track a [[fix-session-6-track-a-prompt]]
    - [x] track b [[fix-session-6-track-b-prompt]]
- [x] 10.0D S8 - Session 8: Status Label + Voice/Tone (20260422) [[fix-session-8-prompt]] + [[fix-session-8-followup-prompt]]
- [x] Session 9: Mobile-First Polish [[fix-session-9-prompt]], [[fix-session-9-review-fix]]
- [x] Session 10: Destructive Action Guards [[fix-session-10-prompt]]
- [x] Session 11: regression pass [[Regression Audit Protocol TEMPLATE]] — passed, findings → [[Open Questions]]
- [x] Post-10.0D hotfix: v0.47.2 BookDetail contrast fix
- [x] 10.0E S12 complete — v0.48.0 shipped 2026-07-06 (3 batches + DuplicateFinderModal deletion). Next: token migration session, then S13.
- [x] 13: pre-work decision queue (review [[Open Questions]] for sessions 12 & 13) _once these are answered, move answers into `Decisions.md` with rationale, then followup with claude to write the session 12 prompt_
- [x] S13 prompt(s): design-lint script + report, DESIGN_SYSTEM.md, ARCHITECTURE.md rewrite, code-reviewer subagent — decisions locked 2026-07-08, write prompts against v0.49.0 tree
- [x] S14 — 10.1 Download & Share, v0.51.0 (2026-07-09)
- [x] S15 — Multi-Format Editions: constants, relabel migration, format-aware sync + backfill, v0.52.0 (2026-07-10)
- [x] S15.3 + Batch 2 decision sprint (answer S15.3b scope question first)
- [x] Batch 1: S15.3a Full Sync in Settings + S15.3b persistent results view + S15.2b upload fixes — v0.53.0, deployed 2026-07-12
- [x] P1 hotfix: Overwrite Contract — fill-empty-only at the shared existing-title write path in sync.py — v0.54.0, deployed with v0.53.0 (2026-07-12)
- [x] Batch 2 Session 1: Delete Title + `_trash/` folder (sync ignores `_trash/`; two-step confirm) — v0.55.0
- [x] Batch 2 Session 2: records-only Merge (trashes source folder; decision reversed 2026-07-12) — v0.56.0
- [x] Batch 2 Session 3: Files section owns all format actions (per-edition rows + size, Add format/files, per-row remove) — v0.57.0
- [x] Session A: subtractive BookDetail — all collapse/disclosure deleted, sections render fully expanded — v0.58.0 (2026-07-14)
- [x] S16 Status Knot B1: sessions-canonical projection (ratified scoped edit to sync_title_from_sessions; harness 21/21) — v0.59.0 (2026-07-15)
- [x] S16 Status Knot B2: BookDetail action surface — inline 4-state toggle, Finished capture, download-triggered transition, one-call contract everywhere — v0.60.0 (2026-07-15). S16 CLOSED.
- [x] Session B3: menu audit + History fixes (projection-ordered list, finished-only Times Read, + glyph, honest Remove Format) — v0.61.0 (2026-07-15), phone-tested 5/5
- [x] Batch-3 A1: replace containment via _trash + import feature full sweep (router + ImportPage) — v0.62.0 (2026-07-16)
- [x] Batch-3 A2: alert() → 0, inline banners, strict lint all-pass — v0.63.0 (2026-07-17)
- [x] Batch-3 A2 rider: idempotent collection remove, retry trap closed — v0.64.0 (2026-07-17)
- [x] Batch-3 A3: StatusLabelsModal defaults + Reset, ThreeDotMenu portal fix, Files ungating — v0.65.0 (2026-07-17)
- [x] B-batch drift check + prompts B1–B3 (new chat — handoff written 2026-07-17)
- [x] Batch-3 B1: Settings Trash surface + empty trash + backup microcopy — v0.66.0 (2026-07-17)
- [x] Batch-3 B2: small-fix sweep (5 shipped, 2 verified-no-change) — v0.67.0 (2026-07-17)
- [x] Batch-3 B3 (unplanned): upload write-path containment, all four paths — v0.68.0 (2026-07-17)
- [x] Batch-3 B4 (unplanned): wishlist conversion Fix A + merge cover-carry Fix B, frozen BookCard chrome edit — v0.69.0 (2026-07-18)
- [x] Diagnostic v2 (recon-only): D1 tbr_reason storage, D2 hidden-chooser default, D3 linkTo message gap — ratified 2026-07-19
- [x] D-Fix session: merge converts wishlist note, unresolved wishlist chooser, duplicate refusal + Replace file — v0.70.0 (2026-07-19)
- [x] Aftermath: replace nonexistent-column fix, honest Done header, Move to library, prefix v2 — v0.71.0 (2026-07-19)
- [x] Batch-3 B5: ReadingStatusCard→AcquireCard, CollapsibleSection→TruncatedText, list-view silent-failure audit (10 converted), SortDropdown verified sound — v0.72.0 (2026-07-19)
- [x] Batch-3 C1: TruncatedText + AcquireCard dead code deleted, IconButton muted variant, danger border, lint comment-strip + bare confirm( (baseline 125→124→120); 2 honest stops (gallery link, hex rescope) — v0.73.0 (2026-07-20)
- [x] Batch-3 C2: E1–E6 copy corrections, A6 hex rescope (4 written ignores), MICROCOPY reconciled v0.63.0–v0.72.0 (audited zero-missing), docs errata D1–D5 — v0.74.0, BATCH 3 CLOSED (2026-07-20)
- [x] Adoption sprint decision sprint: Badge conditional-rebuild gate, MenuItem contract locked (selected state excluded), three-mechanism raw-button exemption, S1→S4 order + drift check, S1 scope amended — locked 2026-07-21/22
- [x] Adoption sprint S1–S4b — v0.75.0–v0.82.0 (2026-07-21→24): gallery real exit + 15 sections + Settings "Developer" link · S2: 19 real-action raw buttons → Button · S3: icon-only → IconButton (A6 stroke ignores cleared) · S4: MenuItem primitive shipped + all 15 menu-item sites across six containers · ThreeDotMenu extracted to ui/ (3 consumers — ROADMAP 10.0.14 finally true) · Badge rebuilt on tokens (solid/tint/outline/muted, 8 sites) · SettingsRow rehomed to ui/ · SegmentedControl ×3 + StarRating adopted · ghost borderless (61 sites) · raw-< button> STRICT at zero: 47 annotated markers + 20 structural exemptions, zero ignore lines, all ten lint categories pass · scorecard 124 → 47 marked / 0 strict · five STOPs honored, zero improvised fixes. SPRINT CLOSED at v0.82.0.
- [x] SortDropdown restructure decision sprint (four-item agenda + recon) + implementation — v0.83.0 (2026-07-24): chevron buttons deleted both variants (nested-button defect structurally gone), active row shows direction label + glyph, extracted to ui/ as the seventeenth shared component (four consumers), single body + CSS variant split, GR4 custom-path/read_time/default-options deletions, all 9 provisional markers retired (chrome inventory 47 → 38), listbox/option/dialog a11y, 44px trigger, defaultSortDirection exported (AuthorDetail dedup).
- [x] Merge-confirm decision sprint (recon + eight decisions locked 2026-07-25) + Session 1 (BookDetail) — v0.84.0 (2026-07-25): confirm describes the computed outcome — Keeping-first cards, real counts with zero rows suppressed, conditional trash line (editionFileOnDisk), metadata-honesty caption, select-time target fetch (never blocks), post-merge toast from the previously-discarded response; "of reading history" retired both occurrences; riders: mergeTitles JSDoc, token classes in touched blocks, SortDropdown gallery demo (16 of 17 — SettingsRow gap named).
- [x] Merge-confirm Session 2 (v0.85.0): DuplicatesPage + find_duplicates serializer — prompt from the Claude project, written against post-v0.84.0 code.
- [x]  Duplicate-pair triage pass (Marie-run, 2026-07-25): owned/owned groups cleared on the v0.85.0 page; 7 wishlist/owned pairs found by recon query and merged via BookDetail (note-carry verified); 76 false-positive groups counted → dismiss-mechanism re-evaluation item filed; data-ops backup question closed moving-forward. JANUARY BACKLOG EMPTY.
- [x] Dismiss-pair mechanism + DuplicatesPage polish — v0.86.0 + v0.87.0 (2026-07-26): dismissed_duplicate_pairs table (pre-ratified frozen edit), two-point matcher filtering (fuzzy pairwise guard + exact-bucket component split), POST/GET/DELETE endpoints, DuplicatesPage Not-duplicates control + Dismissed-pairs panel + per-pair Restore; v0.87.0 verdict-row two-row header + banner typography tokens; §2 STOPPED (Button has no bordered variant). Triage complete: 76 → 0, 67 dismissed.
- [x] Wishlist rendering-gap recon (2026-07-26): title 1991 diagnosed as is_tbr/acquisition_status desync; unconfirmable (row merged away pre-snapshot); snapshot shows zero desynced rows; downgraded 🟠→⚪, fix rides next /tbr session.
### Get Shit Done



---

_Update the sprint section when a sub-phase ships. Replace it with the next one._