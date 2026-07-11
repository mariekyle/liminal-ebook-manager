# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.53.0] — in progress

### Added
- **S15.3a — Full Library Sync action on the Settings page** (Decisions.md 2026-07-10 S15 Session 3 follow-up + 2026-07-11 S15.3 Scope Lock). The API has supported `POST /api/sync?full=true` since v0.52.0, but no UI could send it — the production backfill had to be triggered outside the app. Now a "Full Library Sync" row sits under Library Tools, directly below the quick "Sync Library" row:
  - **Inline confirmation** (never `window.confirm`): tapping the row toggles a neutral-styled card — "Run a full sync? This rescans every folder and refreshes each title's details from its files — it may take a while." with Cancel (ghost) / Run Full Sync (primary), both 44px `md` per the mobile-first minimum. Neutral (not danger) styling is deliberate: a full sync is heavy, not destructive.
  - **Live progress while it runs:** the run uses the existing `syncLibrary(true)` (`api.js` unchanged — the `full` param and `getSyncStatus()` already existed; the latter had zero callers until now). While the synchronous request is in flight, `GET /api/sync/status` is polled every 2s and a caption line under the row shows "Preparing…" then "Scanning folders — X of Y". The row itself shows the SettingsRow spinner and is disabled for the duration. Poll failures are swallowed by design (best-effort telemetry; the POST reports the outcome).
  - **Every outcome surfaces via Toast** (first Toast usage on the Settings page; auto-dismisses after 5s): success → "Library synced — X added, Y updated" (headline counts per the session prompt — S15.3b's results surface hasn't shipped, so this is the interim success surface); completed with per-folder errors → error toast "Sync finished — X added, Y updated, N error(s)" (pluralized); backend `already_running` → "A sync is already running. Try again in a moment."; backend `error` status → the backend message (actionable for a self-hosted admin, e.g. books path missing) with the approved "Sync didn't finish. Your data is safe — try again?" as fallback; empty scan (`total === 0`, e.g. unreachable mount) → error toast "No folders found — check that the library folder is reachable." instead of a false success.
  - **Honest failure copy when the request dies mid-run** (adversarial-verification finding): a minutes-long synchronous fetch can be killed client-side (mobile screen lock, dropped connection) while the server sync keeps running. The catch now probes `GET /sync/status` once — if the sync is still running it says so ("Lost contact with the sync — it may still be running. Check back in a few minutes.") instead of falsely claiming "didn't finish"; the approved incomplete-sync string is reserved for genuine failures. The "Your data is safe" reassurance passed the voice doc's truth check: sync commits per folder and never deletes, so a dead request loses at most the in-flight folder's uncommitted transaction.
  - **Concurrency guards** (adversarial-verification findings): quick sync and full sync mutually exclude via handler guards + row/button `disabled`; the confirm panel's Run Full Sync button is disabled while a quick sync runs (was a silent no-op); a new `reloadPending` flag — set the moment the quick sync schedules its 1.5s post-sync page reload — blocks starting a full sync that the reload would kill; Rescan Metadata and Extract Covers rows are disabled during a full sync (bulk cover extraction has **no** backend guard against a concurrent sync — both write to `titles`; the backend-side guard is noted below as a carry-over).
  - **Screen-reader outcomes:** `ui/Toast.jsx` had no live region, so the Settings render wrapped it in a persistent `<div role="status">` — outcomes announced without touching the shared component. (Superseded before release — Toast.jsx now owns the live region and the wrapper is removed; see Fixed below.) The ticking progress line deliberately carries **no** `role="status"` (a 2s-cadence live region would re-announce for minutes on end).

### Changed
- **Quick "Sync Library" row** (same file): re-entry guard extended to `syncing || fullSyncing`, row disabled during a full sync, and its success path now sets `reloadPending` before scheduling the reload. Handler, inline result line, and reload behavior otherwise untouched.

### Fixed
- **Toasts are now announced by screen readers — app-wide** (`frontend/src/components/ui/Toast.jsx`; follow-up task to S15.3a, closing its first carry-over). Root cause: the component early-returned `null` when there was no toast and its container carried no `role`/`aria-live`, so no live region was ever mounted before a toast appeared — and a live region only announces content injected into an *already-mounted* region. Every toast in the app (BookDetail's many, ComponentPreview, Settings) therefore appeared and vanished silently for screen-reader users: the copy-side silent failure VOICE_AND_TONE forbids. Fix: the outer positioning div is now a persistent polite live region (`role="status"`) that stays mounted with no toast; only the toast card inside is conditional. Simply adding the role to the old sometimes-unmounted div would **not** have fixed it — the region-before-content mechanic is documented in the component header, along with the consumer contract (render `<Toast toast={toast} />` unconditionally; gate only the value). The old "entrance animation" classes (`animate-in fade-in slide-in-from-bottom-4 duration-200`) turned out to be dead code, surfaced by this task's adversarial review: they're `tailwindcss-animate` plugin classes and the plugin was never installed (`plugins: []`, not in package.json), so they have emitted zero CSS since the component was written — the toast has never animated. Deleted per golden rule 4; repo-wide grep verified the sole usage was Toast.jsx:25 (zero matches after). Zero visual change; installing the plugin for a real entrance animation is a separate decision. The three type icons gained `aria-hidden="true"` (decorative; SettingsRow spinner precedent); the empty region is zero-size, so nothing at `z-[60]` paints or intercepts taps between toasts. Prop contract unchanged; all three consumers verified rendering unconditionally. `Settings.jsx`'s page-local wrapper (added earlier in 0.53.0) removed as redundant — the only `role="status"` in `frontend/src` now lives in Toast.jsx itself.

### Technical
- **Modified:** `frontend/src/pages/Settings.jsx` (S15.3a feature session; Toast-wrapper removal in the follow-up task), `frontend/src/components/ui/Toast.jsx` (follow-up task — persistent live region, see Fixed), `docs/DESIGN_LINT_REPORT.md` (regenerated in the S15.3a session — run date + pre-existing raw-button line-number shifts only; strict violations remain 0; the Toast.jsx change left it content-identical)
- **Deliberately untouched:** `frontend/src/api.js` (`syncLibrary(full)` + `getSyncStatus()` already existed), all backend files (no rebuild-forcing changes), `settings/SettingsRow.jsx` (out of named scope; `ui/Toast.jsx` was out of the S15.3a scope too, then fixed in its own named follow-up task — see Fixed). `backend/main.py`'s app version string still reads 0.52.0 — bump to 0.53.0 at release (one-line backend edit; folding it into the next backend-touching session avoids a backend-only rebuild).
- **New microcopy strings pending MICROCOPY_LIBRARY.md addition:** row label/description, the confirmation body, "A sync is already running. Try again in a moment.", "No folders found — check that the library folder is reachable.", "Lost contact with the sync — it may still be running. Check back in a few minutes.", "Scanning folders — X of Y", and the count-bearing toast variants ("Library synced — X added, Y updated" extends the approved "Library synced" past the five-word toast rule — deviation locked by the session prompt's "Toast with headline counts").
- **Verified:** deno-esbuild parse clean; design-lint 0 strict violations (raw-button report-only count unchanged at 128 — no new raw buttons); 4-lens adversarial verification workflow (repo code-reviewer + correctness + design/voice + regression skeptics) — PASS, 0 blockers across all four; the 8-item fix round it produced was itself re-verified PASS (every fix confirmed with file:line evidence, no new defects). Toast follow-up task: esbuild parse on both files; design-lint re-run twice, content-identical both times; code-reviewer (frozen/scope clean; one doc-drift finding, see carry-overs) + adversarial a11y/regression skeptic (PASS, 0 blockers) — the skeptic confirmed the live-region mechanics (region mounts empty with page render on all three consumer pages; `aria-atomic` re-announces loading→success replacements; no z-index or pointer-event changes; no `null` class leakage) and refuted the animation premise, leading to the dead-class deletion above.
- **Accepted findings (reported, not fixed — with reasons):** all failure outcomes are toast-only (code-reviewer advisory: DESIGN_SYSTEM §3 says blocking errors are never toast-only; accepted because the session prompt mandates the Toast pattern and S15.3b's persistent results surface is the real fix); "Cancel" as the safe button contradicts VOICE_AND_TONE's "never Cancel" rule (label locked by the session prompt; reconcile doc-side or copy-side in S15.3b); the 2s poll interval survives SPA navigation for the sync's duration (bounded — it self-clears when the request settles; React 18 no-ops the orphaned setState; completion toast lost on navigate-away is inherent to the locked synchronous design until S15.3b persists results); out-of-order poll responses can transiently regress the progress counter (cosmetic); backend `_sync_status` TOCTOU between guard check and set (pre-existing, `sync.py` untouched).
- **Carry-overs for later sessions:** `ui/Toast.jsx` live region app-wide — **✅ resolved same version, see Fixed** (its follow-up review surfaced two new small ones: `docs/DESIGN_SYSTEM.md` §3 Toast now contradicts the component — it still says "no live region yet" and "falsy toast renders nothing"; needs a doc amendment in a session that names it. And Toast's message span uses raw `text-sm font-medium` instead of a typography token — pre-existing, carried verbatim, left per the no-drive-by rule); `POST /covers/bulk-extract` needs a `_sync_status` guard backend-side; full sync overwrites `title`/`authors` from file metadata without COALESCE (can revert manual edits — surfaced during copy review; the confirmation copy now hints at it, but S15.3b should decide whether that's the desired contract); BookDetail fires "Book updated" toasts while the edit dialog's `aria-modal` is still open (UnifiedEditModal awaits `onSave` — which toasts — *then* calls `onClose`), so screen readers may suppress the announcement — consumer-side ordering fix (close before toasting) in a session that names BookDetail/UnifiedEditModal; ChangeCoverModal's ordering unverified; also pre-existing: BookDetail's loading/error early returns exclude the live region, and book→book navigation can visually resurrect a stale toast (remount-with-content, unannounced).

## [0.52.0] - 2026-07-10

> S15 Multi-Format Editions, complete in three sessions (Decisions.md, S15 Decision Sprint 2026-07-10). `format='ebook'` split into extension-derived storage formats (`epub`/`pdf`/`mobi`/`azw3`/`azw`/`html`): Session 1 built the shared constants and converted every consumer (no behavior change on unmigrated data, two intentional exceptions called out below); Session 2 relabeled the recorded library by extension via a startup migration; Session 3 made sync format-aware — every sibling ebook file becomes its own edition. `'ebook'` survives as "ebook, no file"; dropdowns stay coarse; `reading_sessions.format` untouched.

**Deploy procedure (followed as executed):** back up `library.db` FIRST — the relabel migration rewrites `editions.format` at first startup — and back up again before triggering the first full sync (the backfill creates thousands of edition rows; verify counts after). Full Docker rebuild (backend: new `constants.py`; `database.py`, `main.py`, `titles.py`, `sessions.py`, `downloads.py`, `sync.py` modified).

**Verified in production (2026-07-10):** relabel executed clean — 2,173 editions relabeled, 0 left as `'ebook'`. Full-sync backfill created **3,939 editions** (933 azw3, 4 epub, 1015 html, 973 mobi, 1014 pdf), 0 errors, 0 missing files. Post-sync DB audit passed all integrity checks: no extension/format mismatches, no duplicate `(title, format)` pairs, no duplicate file paths. 25 same-format duplicate files skipped and 4 format conflicts surfaced by the sync summary for manual cleanup.

### Added
- **`backend/constants.py` (new)** — single source of truth for format domains: `STORAGE_FORMATS = ['epub','pdf','mobi','azw3','azw','html']`; `EBOOK_FORMATS = STORAGE_FORMATS + ['ebook']` (`'ebook'` stays legal, meaning "ebook, no file"); `COARSE_FORMATS = ['ebook','physical','audiobook','web']`; `ALL_EDITION_FORMATS` = the union. The recon (S15 recon §8) found 10+ hardcoded inline format lists and zero shared constants; that ends here.
- **`frontend/src/constants/formats.js` (new)** — mirrors the four backend lists, plus display config: `FORMAT_CONFIG` (label + chip classes per format, extending the old BookDetail `formatConfig` pattern — storage formats get uppercase labels EPUB/PDF/MOBI/AZW3/AZW/HTML and reuse the ebook chip styling), `formatLabel()` with raw-value fallback for unknown formats, and `MANUAL_ENTRY_FORMATS` for the manual-entry surfaces.
- **Format validation on `POST /titles`** (`titles.py`) — the endpoint previously inserted `TitleCreate.format` into `editions.format` verbatim, accepting any string (recon incidental finding #2; fold-in fix, Decisions 2026-07-10). Now 400s with an explicit message on anything outside `ALL_EDITION_FORMATS`. The only frontend caller (ManualEntryForm) sends only legal values, so no user-visible path changes.
- **`text/html` in download media types** (`downloads.py` `MEDIA_TYPES`) — HTML is a first-class downloadable storage format (Decisions 2026-07-10; `.html` copies verified on the NAS). Intentional behavior change on existing data: an `'ebook'` edition whose file is `.html` now downloads as `text/html` instead of the `application/octet-stream` fallback (attachment disposition and bytes unchanged).
- **Session 2 — relabel migration (`database.py` ⚠️ frozen, edit pre-ratified and scoped to one block):** idempotent startup migration appended to the `run_titles_migrations` chain, following the established block pattern. For each edition with a file and `format='ebook'`, derives the storage format from the `file_path` extension (lowercased; `.htm` normalizes to `'html'` — the S1 finding); unknown or missing extensions stay `'ebook'` (decided fallback — expected count zero: a 2026-07-10 db copy shows 1957 epub / 203 pdf / 12 mobi / 1 azw3). File-less and non-`'ebook'` editions untouched. Idempotent by construction — relabeled rows no longer match the `format='ebook'` guard, so re-runs are no-ops. Logs a one-line summary every run (counts per resulting format + count left as `'ebook'`). The whole relabel runs in one transaction preceded by a `commit()` that isolates it from earlier chain work; an impossible-today `(title_id, format)` unique-index collision (possible only if a storage-format edition was hand-created via the S1-widened API before migrating) aborts cleanly via `IntegrityError` → rollback, data unchanged, clear log line.
- **Session 2 — `azw` and `htm` download media types** (`downloads.py` `MEDIA_TYPES`, keyed by file extension): `.azw` files now serve as `application/vnd.amazon.ebook` and `.htm` as `text/html` instead of the octet-stream fallback — closes the S1 sweep finding; the map now covers every `STORAGE_FORMATS` member plus the `.htm` spelling.
- **Session 2 — `.gitignore` hardening:** `*.db-*` added under Local data. `*.db` already covered the database file itself, but not SQLite sidecars (`library.db-journal`/`-wal`/`-shm`), which the glob's required `.db` suffix misses — a WAL file can contain row data, so it must never land in the public repo.
- **Session 3 — `EXTENSION_TO_FORMAT` in `backend/constants.py`:** canonical extension → storage-format mapping (`.epub`/`.pdf`/`.mobi`/`.azw3`/`.azw`/`.html`/`.htm`, with `.htm` → `'html'`) for sync and future upload consumers. Backend-only by design — the frontend never scans files. `database.py`'s relabel migration keeps its own inline derivation (frozen file, not consolidated).
- **Session 3 — format-aware sync (`sync.py`), the backfill engine:** sync now registers **every** sibling ebook file as its own edition. `folder_contains_books` and discovery recognize all `EXTENSION_TO_FORMAT` extensions (adds `.azw`/`.html`/`.htm` — html-only folders become visible to sync for the first time). New `discover_book_files()` returns one file per storage format per folder; the same storage format twice in one folder (two epubs, or an `.html` plus an `.htm`) takes the alphabetically first file and skips the rest, counted in the summary (locked decision). Hidden files are excluded from discovery and from `folder_contains_books` (adversarial-verification finding: macOS/SMB AppleDouble siblings like `._book.epub` carry real extensions, and the alphabetical sort would have made the junk file win deterministically — `.` sorts before every letter — demoting the real file to a "duplicate"). Metadata extraction and cover extraction still use the epub-preferred single "best file" (`STORAGE_FORMATS` order). Sync summary gains: editions created per format, same-format duplicate files skipped, missing-file warnings, format conflicts, deferred unmigrated titles.

### Changed
- **Every named inline format list replaced with a constants import.**
  - Backend: TBR acquire validation and edition-create validation (`titles.py`) → `ALL_EDITION_FORMATS`; session create/update validation (`sessions.py`) → `COARSE_FORMATS` — `reading_sessions.format` is untouched by S15, sessions stay coarse by locked decision. Three stale Pydantic field comments updated to point at the constants.
  - Frontend: BookDetail edition-chip `formatConfig` → shared `FORMAT_CONFIG` (unknown-format neutral fallback preserved); Remove Format picker labels and Library active-filter chip labels → `formatLabel()`; FilterDrawer format checkboxes → `COARSE_FORMATS`; ManualEntryForm format buttons and AddToLibrary manual-entry buttons → `MANUAL_ENTRY_FORMATS`.
  - **Dropdown option lists stay coarse — no dropdown gained options.** BookDetail's session-format select, Add Format modal select, and acquire modal buttons are deliberately untouched.
- **`'ebook'`-keyed backend logic widened to `format IN EBOOK_FORMATS`** so it keeps working when Session 2 relabels file-backed editions: the `GET /books?format=` filter expands a coarse `ebook` request to every `EBOOK_FORMATS` member (the Library Ebook checkbox keeps working post-migration; other values pass through, deduped), TitleDetail's `folder_path` pick, and the bulk cover-extraction join (now parameterized; JOIN-params-before-WHERE-params order verified by execution). All three match today's all-`'ebook'` data identically.
- **Download gates are now `format IN EBOOK_FORMATS AND file_path`** — the two confirmed gates (Decisions 2026-07-10): the `downloads.py` 404 guard and BookDetail's `downloadableEditions` filter.
- **AddToLibrary still emits the label-derived `web_url` slug** to `onManualEntry` — AddPage's `formatMap` falls back to `'physical'` for unknown keys, so passing the format value `'web'` directly would have silently remapped Web/URL manual entries to Physical. AddPage is out of scope this session; the fragile coupling is noted below as a carry-over.
- **Session 2 — edition format chips show real storage formats post-migration:** once the relabel runs, BookDetail's edition chips render EPUB/PDF/MOBI/AZW3/AZW/HTML (uppercase labels, ebook chip styling) instead of a single "Ebook" — no frontend change in Session 2; this is the S1 `FORMAT_CONFIG` doing its job against relabeled data. Coarse filtering, downloads, folder-path picks, and cover extraction keep working via the S1 `EBOOK_FORMATS` widening.
- **Session 3 — sync edition matching is now `(folder_path, storage format)`, and sync never writes `format='ebook'` again.** Root cause of the removed bug (recon §7): sync matched titles by folder but editions by `(title_id, format='ebook')`, so post-migration full syncs would have missed relabeled editions and inserted duplicate `'ebook'` rows. New reconciliation per discovered format: edition exists in this folder with this format → refresh `file_path` if changed; none in this folder but the title holds one elsewhere → **relocation** vs **conflict**, decided by whether the old folder *still holds a file of that storage format* (adversarial-verification fix: a bare `os.path.exists` test misjudged a moved file as a conflict whenever the old folder survived with only stray non-book files, leaving a permanently dead `file_path` and a phantom conflict every sync) — relocation re-points the edition (preserves the old folder-move recovery; also claims file-less placeholders of that storage format), conflict skips both untouched and counts + reports; no edition anywhere → INSERT with the storage format (`IntegrityError` race backstop, same pattern as edition-create). Editions whose format isn't a storage format (physical/audiobook/web/file-less `'ebook'`) are invisible to sync — never updated, never deleted.
- **Session 3 — aborted-relabel guard:** a title that still has a *file-backed* `'ebook'` edition (the exact state a Session 2 relabel abort preserves) defers edition reconciliation entirely, counted and explained in the summary. Adversarial-verification fix for a ratchet: without the guard, full sync would create storage-format rows for the same files, after which the relabel migration could never succeed for that title — the `'ebook'` row's relabel would collide with the sync-created row on the unique `(title_id, format)` index at every startup, converting a loud recoverable state into an unrecoverable one plus visible duplicate editions.
- **Session 3 — vanished files are reported, never deleted** (matches the S14 stale-path stance): an edition in a scanned folder whose file is gone stays in the DB and shows up in the sync summary as a missing-file warning.
- **Session 3 — default (non-full) sync semantics preserved:** a folder already known via any edition's `folder_path` still skips. One sharpening: a conflict folder (its file's edition lives elsewhere) is *not* known by folder_path, so default sync reprocesses it and re-surfaces the conflict each run instead of the old behavior — which would have silently re-pointed the edition back and forth between folders on every sync (flapping).

### Fixed
- **Session 3 follow-up — orphan detection now judges titles, not folders** (`sync.py`; Decisions 2026-07-10, S15 Session 3 follow-up). Root cause: the orphan pass marked a title orphaned if *any* edition's folder was dead, but titles can legitimately span two folders since the S15 format-aware sync (live format conflicts keep the old edition while new formats register in the scanned folder) — such a title flip-flopped between recovered and re-orphaned on every full sync, and default sync left it stuck orphaned. Fix: folders grouped per title; a title is orphaned only when **none** of its folder-backed editions' folders survives (found-folders check plus the same filesystem double-check as before). Single-folder titles behave exactly as before — the all-folders-dead test degenerates to the old per-edition test. Verified: multi-folder title with one live folder stays un-orphaned across full re-runs (no flip-flop), all-folders-dead title still orphans once, already-orphaned titles aren't re-counted.
- **Rescan-Metadata cover extraction could fail with an epub present** (`titles.py` `extract_cover_on_demand`, same session, found by the Session 1 verification sweep). Root cause: the cover-source query joined editions with no format filter and `ORDER BY e.id ASC LIMIT 1`, so a title whose lowest-id edition was file-less (physical/audiobook — or, post-migration, the legal file-less `'ebook'` placeholder) got that row, failed the `.epub` guard, and returned `extracted: False` even when an epub edition existed. Pre-existing gap, not an S15 regression — the exact analog of the bulk-extract join fixed above. Fix: join restricted to `e.format IN EBOOK_FORMATS` (parameterized, JOIN params before the WHERE param) and `ORDER BY` prefers `.epub`-bearing rows, then any file-bearing row (`extract_epub_cover` is the only parser downstream); `LEFT JOIN` kept so the title-exists 404 check still works. Verified with an in-memory SQLite matrix (shadowing physical, file-less placeholder + epub, pdf + epub preference, no-editions title, single-`'ebook'` unmigrated row, missing title): new query correct on all six, old query demonstrably returned the shadowing row on three.

### Removed
- **Session 3 — `find_book_file()` deleted from `sync.py`** — replaced by `discover_book_files()`. Repo-wide grep verified before deletion: its only callers were `sync.py` itself (definition at :124, single call at :395); zero references remain after.
- **Dead acquire-flow remnants in `BookDetail.jsx`** (same session, found by the Session 1 verification sweep): the `acquireFormat`/`setAcquireFormat` state pair and the `handleAcquire` handler — leftovers from a superseded acquire flow; the live acquire modal buttons call `convertTBRToLibrary` inline with their own per-format logic. Verified by repo-wide grep before deletion: the only three matches for `acquireFormat|setAcquireFormat|handleAcquire` were the pair itself; zero matches after. Deliberately kept: `acquireLoading`/`setAcquireLoading` — it looked like part of the same rot, but the live buttons both set it (6 call sites) and read it (`disabled` props), so it is fully live.

### Technical
- **Created:** `backend/constants.py`, `frontend/src/constants/formats.js`
- **Modified:** `backend/main.py` (FastAPI app version 0.51.0 → **0.52.0** — the app's only version string), `backend/routers/sync.py` (Session 3 — discovery, per-format reconciliation, summary, per-title orphan semantics; `find_book_file` deleted), `backend/constants.py` (Session 3 — `EXTENSION_TO_FORMAT`), `backend/database.py` (⚠️ frozen — pre-ratified S15 Session 2 edit, exactly one migration block appended to `run_titles_migrations`; full diff flagged in the session report for ratification), `.gitignore` (`*.db-*`), `backend/routers/titles.py` (acquire + edition-create validation, POST /titles validation, format-filter expansion, folder_path pick, cover-extraction join, 3 field comments), `backend/routers/sessions.py` (2 validations → `COARSE_FORMATS`), `backend/routers/downloads.py` (guard + MEDIA_TYPES incl. Session 2 `azw`/`htm`), `frontend/src/components/BookDetail.jsx` (constants import, `downloadableEditions`, edition chips, Remove Format labels, dead acquire-flow deletion — see Removed), `frontend/src/components/FilterDrawer.jsx`, `frontend/src/components/Library.jsx`, `frontend/src/components/add/ManualEntryForm.jsx`, `frontend/src/components/add/AddToLibrary.jsx`, `docs/DESIGN_LINT_REPORT.md` (regenerated: 85 files scanned — `formats.js` is new; raw-button count unchanged at 128, remaining diff is line-number shifts)
- **Untouched by constraint:** `backend/routers/upload.py` write paths (S15.2b, split out — see ROADMAP), the three coarse format selectors in BookDetail; Session 3 additionally left `database.py`, `downloads.py`, and all frontend files untouched. (`backend/database.py` was untouched in Session 1 — no schema change, no migration; Session 2 then modified it under the pre-ratified single-block exception, see Modified. `sync.py` was untouched by constraint in Sessions 1–2, then rewritten per-format in Session 3, see Modified.)
- **Verified (Session 3):** end-to-end sync test driving the real `_do_sync` (vendored aiosqlite/fastapi) against a temp DB and temp folder tree — nine scenarios: 5-file folder → 5 editions with AppleDouble/hidden junk never picked; same-format duplicates (two epubs, `.html`+`.htm`) → alphabetical pick + 2 counted skips; existing epub edition refreshed + pdf sibling registered; folder relocation re-points the edition (no duplicate row); moved-file relocation with surviving old folder correctly NOT flagged as conflict; vanished pdf kept + warned; same-format-two-live-folders conflict skipped + counted; unmigrated file-backed `'ebook'` title deferred with its row untouched. Plus: default-sync skip semantics (7 known folders skip; conflict folder re-surfaces), full re-run idempotent (zero new editions, data byte-identical), and sync writes zero `format='ebook'` rows. A separate adversarial verification pass (3 agents + code-reviewer) reproduced each fixed defect against the pre-fix code and independently confirmed pydantic per-instance default isolation, Docker import layout, and py3.11 type-hint compatibility; a 23-check line-by-line walkthrough reproduced the removed recon-§7 bug against the old code (post-migration full sync would have inserted one phantom `'ebook'` duplicate per relabeled title).
- **Verified (Session 2):** end-to-end migration test driving the real `database.py` code (vendored aiosqlite) against a seeded temp DB — full extension matrix incl. uppercase `.EPUB` and `.htm`→`html` (8 relabeled with correct per-format counts, no-ext row left `'ebook'`, file-less and non-`'ebook'` rows untouched); idempotency re-run byte-identical with no-op log line; forced `(title_id, format)` collision aborts with rollback leaving all rows — including same-transaction bystanders — unchanged.
- **Verified (Session 1):** `python3 -m py_compile` on all four backend files; esbuild parse on all six frontend files; deno-eval of `formats.js` (lists mirror `constants.py` exactly; all storage formats reuse the ebook chip class); design-lint 0 strict violations (raw-button report-only, 128, count unchanged); adversarial behavior-preservation review against unmigrated data — old-vs-new SQL identical for ebook/physical/mixed/duplicate filter inputs with correct placeholder/param counts, download guard and `downloadableEditions` produce identical result sets on all-`'ebook'` data, manual-entry `web_url` seam intact; session/edition format-domain cross-contamination sweep clean; code-reviewer subagent — no frozen-file findings, no scope drift.
- **Found for later sessions (verification sweep):** `titles.py` `extract_cover_on_demand` edition join had **no** format filter — pre-existing gap the recon missed; **fixed same session, see Fixed above**; `MEDIA_TYPES` had no `azw`/`htm` keys — **resolved in Session 2, see Added above**; `upload.py:711` primary-file locator misses `.azw`/`.html`/`.htm` so those uploads create `file_path=None` editions (Session 2 domain); `upload_service.py` `ALLOWED_EXTENSIONS` includes `.htm` with no `STORAGE_FORMATS` counterpart — Session 2 needs an explicit `.htm` → `'html'` normalization; three `api.js` JSDoc format lists are stale (comment-only; api.js not named this session); BookDetail carried a dead `acquireFormat`/`handleAcquire` pair — **removed same session, see Removed above**. Session 3's orphan-detection limitation was decided and **fixed same day, see Fixed above** (Decisions 2026-07-10, S15 Session 3 follow-up).

## [0.51.0] - 2026-07-10

> S14 — 10.1 Download & Share. Full-width "Download" button on BookDetail (owned titles with an ebook file): Web Share sheet with the actual file on Android — reader apps like Moon Reader appear as share targets — direct attachment download elsewhere. Multiple ebook editions open a bottom-sheet format picker (Treatment A, Decisions 2026-07-09). The feature never writes reading status or sessions.

**Docker rebuild required** (backend: new `downloads.py` router, `main.py` registration + version bump). `BookDetail.jsx` rides the same rebuild.

### Added
#### Backend — edition file serving (`backend/routers/downloads.py`, new)
- `GET /api/editions/{edition_id}/download` — small standalone router modeled on `covers.py` (own `APIRouter(prefix="/api/editions")`, registered bare in `main.py`; `titles.py` stays untouched at ~3000 lines).
- Serves `editions.file_path` via `FileResponse`: media type by extension (`.epub` → `application/epub+zip`, `.pdf`, `.mobi`, `.azw3`, else `application/octet-stream`), `Content-Disposition: attachment` with the file's basename (FileResponse `filename=`, which RFC-5987-encodes non-ASCII names).
- Defense in depth, all 404: unknown edition; non-ebook edition (the frontend never offers these, but the path is guarded anyway); `Path.resolve(strict=True)` failure — paths go stale between syncs, same reality `sync.py` guards — with a "may have moved since the last library scan" detail the frontend surfaces; resolved path outside `BOOKS_PATH` (symlink-safe containment via `is_relative_to` on the resolved path — the id maps to `file_path` server-side, nothing client-supplied is ever served).

#### Frontend — Download button + share flow (`frontend/src/components/BookDetail.jsx`)
- Full-width primary `Button` above the owned-variant ReadingStatusCard, inside the same wrapper so it inherits mobile tab visibility. Renders only when the title has ≥1 ebook edition with a file — no disabled state; the wishlist variant gets no button.
- Flow per edition: `Preparing…` loading toast → if `navigator.canShare`, fetch the file and offer `navigator.share({files: [File]})` (typed blob, so ebook readers appear as targets); if share exists but can't take files, reuse the fetched blob via object-URL anchor click; with no Web Share at all, a temporary anchor click on the endpoint URL (attachment disposition handles the save). Success/error via the existing local `showToast` + `ui/Toast` — no new hook. Share-sheet cancel (`AbortError`) clears the loading toast quietly — cancel is not an error.
- Multiple downloadable editions → lightweight in-file bottom sheet (checked first per prompt: no `ui/BottomSheet` exists; house Modal is centered/fullscreen, not a sheet): rows show extension label, `Default` chip on EPUB, bare filename; 44px touch targets; backdrop tap + Escape close; body scroll locks (mirrors Modal). Note: edition-create and merge both enforce one edition per format, so the sheet triggers only if that invariant ever relaxes — shipped per locked Treatment A regardless.
- Double-tap guard: `downloading` state drives the Button's `loading` prop.

### Technical
- **Created:** `backend/routers/downloads.py`
- **Modified:** `backend/main.py` (downloads router import + registration, version 0.50.0 → 0.51.0), `frontend/src/components/BookDetail.jsx` (module-level `editionFileName`/`editionExtensionLabel` helpers, download state + Escape/scroll-lock effect, `downloadableEditions` + `handleDownloadEdition`/`handleDownloadClick`, full-width button, bottom sheet), `docs/DESIGN_LINT_REPORT.md` (regenerated: raw-button count 127 → 128 — the sheet's row button, report-only category; all 8 strict categories remain 0)
- **Frozen files untouched:** `database.py` (no migration — `editions.file_path`/`format` already exist), `covers.py` (read as template only). `ReadingStatusCard.jsx` untouched: its dormant `fileUrl`/`hasFile`/`showDownload` affordance stays exactly as-is, reserved for the S15 knot sprint.
- **Verified:** `python3 -m py_compile` on both backend files; esbuild parse of `BookDetail.jsx`; design lint 0 strict violations; grep scorecard — no status/session writes anywhere in the download path, dormant ReadingStatusCard props still `fileUrl={null}`/`hasFile={false}`.

## [0.50.0] - 2026-07-09

> S13 complete, in two prompts. **Prompt A** — guardrail tooling: design-system lint (script + warn-and-allow pre-commit hook + committed report), code-reviewer subagent, locked cleanups. **Prompt B** — the canonical docs: `docs/DESIGN_SYSTEM.md` (new) and `docs/ARCHITECTURE.md` (full rewrite against the current tree), plus carry-over fixes (.glass-panel + Modal `glass` prop deleted together; content-aware lint-report writes; hook now stages the report). The lint mechanizes the FRONTEND_AUDIT_S12 zero-target; the committed `docs/DESIGN_LINT_REPORT.md` is the enforcement surface — commits are never blocked (Decisions 2026-07-08).

**Docker rebuild required** (`backend/main.py` version bump). Frontend changes (`Modal.jsx`, `tokens.css`, `tailwind.config.js`) ride the same rebuild; all render identically (deleted code had zero callers / zero usages).

### Added
#### Design lint (`scripts/design-lint.mjs`)
- Plain Node, zero dependencies (node: builtins only). Scans `frontend/src/**/*.{jsx,js,css}` on the audit scope (frozen files allowlisted; canonical list in CLAUDE.md, derived copy in the script).
- **Strict categories (target 0):** hardcoded colors (audit Appendix A patterns A1–A5 verbatim), legacy `library-*` aliases, indigo utilities, cascade-flip pairing (typography token + core `text-xs`–`3xl` in one className — brace-aware across template literals and ternaries), `window.confirm(`, `"Abandoned"`/`"Did Not Finish"` as rendered UI copy (DB-value constants exempt by matcher shape), `font-bold` on headings or beside token classes, `text-h1` (class deleted this session).
- **Report-only:** raw `<button>` outside `components/ui/` — becomes strict after the post-S13 conversion backlog clears.
- Exceptions: `// design-lint-ignore` on the same line or the line above (CSS: `/* design-lint-ignore */`); every active ignore is inventoried in the report so exceptions stay visible.
- Regenerates `docs/DESIGN_LINT_REPORT.md` every run (committed). Exit 1 on strict violations for CI-style use; `--warn` always exits 0 (hook mode).
- First run: **0 strict violations across all 8 categories; 127 raw buttons counted.** None of the seven pre-sanctioned ignore sites from the session prompt actually trips the pattern set, so zero inline ignores were added (each verified individually; see session report).
#### Pre-commit hook (`scripts/pre-commit` → `.git/hooks/pre-commit`)
- Warn-and-allow: prints the category summary, **always exits 0** — the committed report is the enforcement surface, never the commit gate (Decisions 2026-07-08).
- Falls back to Deno's node-compat layer when Node is absent (the SMB dev machine has no Node runtime — without this the hook would print nothing useful on every local commit), and to a skip message when neither runtime exists. Node remains the primary path per the prompt.
#### Code-reviewer subagent (`.claude/agents/code-reviewer.md`)
- End-of-session reviewer, runs before the deploy manifest; findings append to the session report beside the lint summary. Exactly three judgment checks (Decisions 2026-07-08): frozen-file detection (re-reads CLAUDE.md at review time, quotes the "why frozen" line, requires an explicit ratifiable exception), scope drift (Files to Modify + Out of Scope comparison), and pattern-conformance spot-check for un-greppable rules (cites DESIGN_SYSTEM.md section names; cites CLAUDE.md until DESIGN_SYSTEM.md ships later in S13). Checklist-with-pointers only — restates no rules.
#### `npm run design-lint`
- Added to `frontend/package.json` as `node ../scripts/design-lint.mjs` (the repo's only `package.json` lives in `frontend/`; the script resolves all paths from its own location, so it runs correctly from any cwd).
#### CLAUDE.md standing rule
- Appended: after any session that touches `frontend/src`, run `npm run design-lint` and include the category summary in the session report.
#### `docs/DESIGN_SYSTEM.md` (new — Prompt B)
- The canonical usage rulebook: token groups (names only — values stay in `tailwind.config.js`), the 7-class typography system with the emphasis mapping (stat values → `text-h4`, inline emphasis → `text-label`) and the explicit "no `text-h1`, largest heading is h2" decision, a full 14-component `ui/` inventory (every entry: Purpose / Variants & states / Required props / When to use / When NOT to use / Common mistakes / Frozen behaviors — written from source, adoption counts included), pattern docs (modals, forms, empty/loading/error, list/grid, S10 inline confirmation, page layout, status labels), and an anti-patterns table marking each rule lint-enforced vs judgment. Precedence block at top: CLAUDE.md > config values > this doc > philosophy/voice docs.
- Frozen-behavior seeds recorded: SegmentedControl's 11px `sm` label (Fix Session 5), Modal's ✕-top-right + right-aligned footer-as-slot, BookCard's single `variant` prop API (documented under "adjacent shared components" — BookCard lives outside `ui/`).
#### `docs/ARCHITECTURE.md` (full rewrite — Prompt B)
- Phases 1–6 narrative deleted (git has it). Now current-state only against v0.50.0: system overview, stack with pinned versions read from the manifests, trimmed real file tree, hand-written schema from `database.py` (opens with "database.py wins"; Status-Knot drift note in the reading-cache section: documented, not endorsed), API surface per router with the `/api/books/` ↔ `titles` naming line, three ASCII data flows (upload→extract→library, session lifecycle, wishlist→owned conversion incl. all four conversion paths), frontend architecture (routing, no-global-state approach, api.js front door, hooks), generic deployment workflow, frozen subsystems table pointing at CLAUDE.md, an 11pm-debug section (container paths, env vars incl. the BOOKS_DIR/BOOKS_PATH split and COVERS_DIR compose-vs-code discrepancy, stdout-only logging, DB inspection, escalating reset steps), and Open Questions (Status Knot; `import_metadata.py` still queries the legacy `books` table — broken on fresh DBs, decision pending; UI-less smart-paste endpoints).
- Public-repo constraint enforced: no IPs, hostnames, share names, or host volume paths — container-relative paths only; deployment described generically.

### Changed
- `frontend/tailwind.config.js` — `h1` fontSize key deleted (zero `text-h1` usages repo-wide; Decisions 2026-07-08). The remaining 7 typography tokens are unchanged; config import-verified post-edit. Any future `text-h1` usage is now a strict lint error.
- `CHANGELOG.md` — one-line erratum added under [0.47.1] "Files Verified, No Changes": `metadata.py` is the frozen file, not `sync.py` (`sync.py` was never frozen). Original line preserved verbatim.
- `scripts/design-lint.mjs` — report writes are now content-aware (Prompt B §0.2): the new report is compared against the on-disk file ignoring the run-date line; identical → no write, stdout says "Report unchanged". The run date is date-only and stamps the last *content* change — verified: two consecutive clean runs leave an identical checksum, and an introduce-violation→fix cycle returns the file byte-identical, so a clean tree stays clean.
- `scripts/pre-commit` (+ reinstalled `.git/hooks/pre-commit`, byte-identical, executable) — after the lint runs, the hook stages `docs/DESIGN_LINT_REPORT.md` so the committed report never lags the commit it describes (resolves the "hook/report design tension" flagged in Prompt A). Staging is skipped on the no-runtime fallback path — a stale report is never staged blind — and a failed stage prints a warning instead of being swallowed (code-reviewer finding, same session). Hook still always exits 0.
- `backend/main.py` — FastAPI app version 0.49.0 → **0.50.0** (the only backend change; forces the rebuild).
- `ROADMAP.md` — S13 closed under 10.0E, current-focus line updated to 10.1 (pending go-decision), version header bumped.

### Removed
- **`.glass-panel` + Modal `glass` prop, deleted together** (Prompt B §0.1 — resolves Prompt A's stop-and-report, below). `ui/Modal.jsx` loses the zero-caller `glass` prop and its class branch (non-glass class string kept verbatim); `frontend/src/styles/tokens.css` loses the `.glass-panel` block, leaving only the grain overlay. Verified: `grep -rn "glass" frontend/src` returns zero hits; both files pass an esbuild parse.

### Fixed
- **BookCard list variant ignored the user's In Progress label.** `frontend/src/components/BookCard.jsx` hardcoded the string "Reading" for in-progress titles in `variant="list"`, bypassing `useStatusLabels` — anyone who renamed the In Progress status in Settings still saw "Reading" on list rows. Root cause: the list variant's status strip was built before the label hook covered this path; the file's other labels (DNF, Finished tooltip) already routed through `getLabel`. One-line fix: `{getLabel('In Progress')}`. Found by the S13 doc fact-check (recorded as known drift in DESIGN_SYSTEM.md §3, now updated to compliance). Verified: esbuild parse clean, no residual hardcoded rendered status strings in the file, design-lint 0 strict.

### Security
- **Host library path removed from the public repo.** `docker-compose.yml` no longer carries the real NAS volume path (flagged by the S13 doc-verification privacy scan); the `/books` mount now reads `${BOOKS_HOST_PATH:?…}` — *required* on purpose, so compose fails loudly instead of silently mounting a wrong path (matters because the auto-deploy webhook rebuilds from the tracked compose after `git reset --hard`). New committed `.env.example` documents `BOOKS_HOST_PATH` (+ optional `WEBHOOK_SECRET`); `.env` was already gitignored. Ripple fixes so instructions match the new mechanism: README installation block now says copy `.env.example` (its old example also showed a `:ro` mount that would have broken uploads — the app writes to `/books`); `docs/AUTO_DEPLOY.md` genericized both `/volume1/docker/liminal` example paths and its `.env` step now *appends* (`>>`) the webhook secret instead of overwriting the file. Tracked-file sweep for `/volume1`, LAN IPs, and hostnames is clean; webhook/ scripts are container-relative only. **Note: git history still contains the old path** — rewriting history vs. accepting the historical exposure is Marie's call (the folder structure it reveals is only as sensitive as the share names themselves).
- **One-time step on the NAS clone before the next rebuild/auto-deploy:** create `.env` next to the compose file with the real `BOOKS_HOST_PATH` (and `WEBHOOK_SECRET` if the webhook is in use). Without it, `docker-compose up` now refuses to start the app — by design.

### Skipped in Prompt A (stop-and-report — resolved in Prompt B)
- **`.glass-panel` deletion NOT performed in Prompt A.** The prompt (and audit §12.6) called it unused, but `ui/Modal.jsx:76` referenced it via a `glass` prop (`glass ? 'glass-panel' : ...`) — the dead-code grep verification required by the golden rules failed. The prop itself had zero callers, so the class was only *transitively* dead; removing it cleanly meant also touching `Modal.jsx`, out of scope for Prompt A. **Resolution:** Prompt B named both files and locked the decision — prop + class deleted together (see Removed).

### Technical
#### Pattern gaps noted (not acted on — pattern set is locked to the prompt/audit; S13+ extension candidates)
- `ui/CollapsibleSection.jsx:96` carries `text-teal-400`, a default-palette color A5 doesn't match (A5 covers indigo/red/green/blue/yellow only). Candidate A5 extension: remaining default hues (teal/orange/purple/amber/…).
- **14 bare `alert()` calls on error paths** (BookDetail 673; CollectionDetail 609/638/676/721; CollectionsTab 197; CollectionModal 193/202/215/232; ImportPage 77/119/173/207) — CLAUDE.md golden rule 3 forbids alert for blocking errors, but the lint's `window.confirm(` category doesn't cover `alert(`. Also, bare `confirm(` (no `window.` prefix, zero current uses) would evade the literal pattern. Both are candidate categories/pattern widenings pending a decision.
- Un-bracketed raw colors escape A4 by design (`[#hex]` only): index.css token-mirror hexes (commented as sanctioned), BookDetail inline-SVG `stroke="#5c5752"` ×4, SeriesCard/Badge inline-style hexes, `bg-white`/`border-white` utilities ×4, and one cool-toned `rgb(26,26,31)` fade in CollapsibleSection:86 that visibly mismatches the warm surface palette (bug candidate independent of lint).
- **Hook/report design tension — RESOLVED in Prompt B** (both options taken: content-aware writes + hook staging; see Changed). Original Prompt A note: the hook regenerated the report at commit time but did not `git add` it, so the committed report always lagged one commit and the run-date stamp left the working tree dirty after every commit.
#### Verification — Prompt B
- Checklist greps all pass: zero hex values in DESIGN_SYSTEM.md; zero IPs/hostnames/share names/host-volume paths in either doc; all 14 ui/ inventory entries carry all seven headings (Frozen behaviors never omitted); "Abandoned" appears in docs only as the internal-DB-value/fic-completion explanation; ROADMAP gained no infrastructure details; version reads 0.50.0; design-lint clean (0 strict / 127 report-only) with the report file untouched by the content-aware writer.
- Code-reviewer subagent (first production run): all three checks pass — no frozen-file edits, no scope drift, dead-code deletions grep-verified. Its one tooling suggestion (hook's `git add` failed silently) was applied same-session.
- Adversarial 3-agent fact-check of both docs against source caught **10 real doc errors before commit**, all fixed: stale-audit modal counts (DuplicateCollectionModal already converted, DuplicateFinderModal deleted in S12 — only AnalyzingModal is bespoke), Modal ✕-guard routing (Header has its own `onClose`), BookCard's hardcoded "Reading" (doc had claimed full useStatusLabels compliance; drift now recorded as such), a performance bullet describing nonexistent virtualization (`@tanstack/react-virtual` is installed but unused; Library loads all titles at once — doc now states reality), inverted ebook-tree claim (category subfolders are primary; new uploads write flat), `PRAGMA foreign_keys` not actually on for main.py/backup maintenance connections, session-PATCH clear semantics ('' clears dates/format only; rating has no clear path), reading-metadata endpoint is POST not PATCH, two omitted indexes, BrowserRouter lives in main.jsx.
#### Verification — Prompt A (no Node runtime on this machine — CLAUDE.md substitutes applied)
- Adversarial multi-agent verification pass (4 independent agents): category counts re-derived without reading the script — all match (strict 0s; raw-button 127 confirmed by two exactly-agreeing methods); deliverables audit passed all 9 checks; hostile script review found no blockers, and its two confirmed latent defects were fixed and regression-tested same-session: (1) quotes inside comments within `className={...}` silently blinded the brace scanner (now comment-aware; regex literals remain a documented limitation), (2) multi-line heading tags with `font-bold` would have corrupted the report's markdown table (matched text now whitespace-collapsed).
- Lint executed via Deno's node-compat layer (same V8 regex engine; script unchanged, plain Node remains the target runtime). Self-test exercised every strict category, both exit modes, ignore same-line/line-above suppression, and the ignores inventory, via a temporary file (created, linted, deleted).
- Frozen-file exclusion spot-checked: `GradientCover.jsx` contains A-pattern-shaped content and appears nowhere in the report.
- Hook tested with a deliberately introduced violation: summary printed, exit 0; clean re-run exits 0; `scripts/pre-commit` and `.git/hooks/pre-commit` byte-identical (`cmp`).
- `grep -rn "text-h1" frontend/src` returns nothing (the only remaining `text-h1` strings in the repo are the lint script's own pattern and docs).
- `tailwind.config.js` import-verified under Deno: parses, `h1` absent, 7 fontSize keys + color tokens intact. **`npm run build` not run locally (impossible without Node) — the next NAS container rebuild is the real build check; risk is nil since JIT never emitted `.text-h1` (zero usages, v0.49.0 verification).**
- No new dependencies: `package-lock.json` and `node_modules` untouched.
#### Files Created
- `scripts/design-lint.mjs`
- `scripts/pre-commit` (+ installed copy at `.git/hooks/pre-commit`, executable, untracked by design)
- `docs/DESIGN_LINT_REPORT.md` (generated; committed)
- `.claude/agents/code-reviewer.md`
- `docs/DESIGN_SYSTEM.md` (Prompt B)
- `.env.example` (Security follow-up)
#### Files Modified
- `frontend/package.json` — `design-lint` script entry
- `frontend/tailwind.config.js` — `h1` fontSize key removed
- `docs/ARCHITECTURE.md` — full rewrite (Prompt B)
- `frontend/src/components/ui/Modal.jsx` — `glass` prop removed (Prompt B)
- `frontend/src/styles/tokens.css` — `.glass-panel` removed (Prompt B)
- `scripts/design-lint.mjs` + `scripts/pre-commit` — content-aware write + report staging (Prompt B; created and revised same session)
- `backend/main.py` — version 0.50.0 (Prompt B)
- `ROADMAP.md` — S13/10.0E close-out (Prompt B)
- `CHANGELOG.md` — this entry + [0.47.1] erratum
- `CLAUDE.md` — design-lint standing rule appended (untracked file, not in git)
- `docker-compose.yml`, `README.md`, `docs/AUTO_DEPLOY.md` — host-path removal + instruction updates (Security follow-up)
- `frontend/src/components/BookCard.jsx` — In Progress label routed through `useStatusLabels` (see Fixed)
#### Files Deliberately NOT Modified
- All frozen files (read-only reads of `database.py` for the ARCHITECTURE schema section)
- The 11 stale cross-references to `VOICE_AND_TONE_v2.md` in DESIGN_PHILOSOPHY.md / MICROCOPY_LIBRARY.md — the real file is `docs/VOICE_AND_TONE.md`; out of scope this session, flagged for a follow-up rename-or-fix decision

---

## [0.49.0] - 2026-07-06

> Token migration session (10.0E follow-on): one token system. The 8 typography classes move from `tokens.css` `@layer components` to `tailwind.config.js` `theme.extend.fontSize` (same class names), every call site that relied on the class-carried color gets that color appended explicitly, and the `@layer components` block is deleted. Zero intended visual change. `tailwind.config.js` is now the single token source, and the S13 lint gets a zero-target instead of freezing the old usage count.

**Docker rebuild required** (backend version bump).

### Added
#### `action.warning-hover` token (Decisions 2026-07-06 scope addition)
- `'warning-hover': '#ab825c'` in the config `action` colors — ~13% deeper, same derivation as the other `-hover` tokens.
- `ui/Button` warning variant hover: `hover:bg-action-warning/85` opacity workaround → `hover:bg-action-warning-hover` (the 0.48.0 comment noting the missing token is gone with it).

### Changed
#### Typography tokens: `@layer components` → `theme.extend.fontSize`
- All 8 classes (`text-h1`–`h4`, `text-body`, `text-body-sm`, `text-caption`, `text-label`) are now first-class Tailwind utilities defined in `tailwind.config.js` with identical size / line-height / weight. `body`/`body-sm`/`caption` set no font-weight, exactly as before.
- Root cause this kills: component-layer classes lose the cascade to any utility and fail silently — the 0.47.2 BookDetail bug. As config-driven utilities they can't drop out of the build behind an import-order change.
- **71 unpaired call sites** (across 21 files) carried their color only via the deleted classes; each got exactly the color the class carried, appended in place: `text-h1`–`h4` → `text-text-primary` · `text-body` → `text-text-body` · `text-body-sm` → `text-text-secondary` · `text-caption` → `text-text-muted` · `text-label` → `text-text-body`. One class appended per site, no other changes — rendering is preserved exactly.

### Removed
#### `tokens.css` `@layer components` block
- Block and its header comment deleted. The file stays (with the `@import` in `index.css`): `.glass-panel` (unused — S13 deletion item) and `.grain-overlay` remain.

### Technical
#### Pre-edit sweep (classification report)
- 437 occurrences = 8 definitions + **429 usages**: 357 paired (334 same-string, 19 all-branches-colored ternaries, 4 indirect via always-colored function/map/variable), **71 unpaired**, 1 comment mention (`index.css:11`, untouched). S12 Batch 2's 14 D-fix sites all classified paired, as designed.
- **Baseline reconciliation:** `docs/FRONTEND_AUDIT_S12.md` §1 says 394 (audit commit) / 408 (post-S12) — correct within the audit's scope, which excludes the 3 frozen frontend files by design. This session swept repo-wide: frozen `upload/BookCard.jsx` carries the other 21 usages (13 `text-body-sm` + 7 `text-caption` + 1 `text-label`), so **429 is the true repo-wide count** (415 at the audit commit). The S13 lint zero-target stays on the 408 audit scope, because lint allowlists frozen files.
#### Verification
- `npm run build` (vite) passes; compiled CSS emits all used typography utilities with the exact former values and no color declarations; `.text-h1` is no longer force-emitted (0 usages — JIT drops it).
- Post-edit sweep: usage count unchanged at 429; unpaired = 0; cascade-flip grep (token class + core `text-xs`–`3xl` in one className) = 0 including `ui/`; audit patterns A1–A5 = 0 repo-wide outside frozen files; `warning/85` = 0.
#### Files Modified
- `frontend/tailwind.config.js` — `theme.extend.fontSize` (8 keys) + `action.warning-hover`
- `frontend/src/styles/tokens.css` — `@layer components` block deleted
- `frontend/src/components/ui/Button.jsx` — warning variant hover on the new token
- `backend/main.py` — version 0.49.0
- 21 files, 71 one-line color appends: `BookDetail.jsx` (25), `FilterDrawer.jsx` (9), `HomeTab.jsx` (9), `ManualEntryForm.jsx`/`WishlistForm.jsx`/`ComponentPreview.jsx` (3 each), `CollectionPicker.jsx`/`WishlistTab.jsx`/`CollapsibleSection.jsx`/`FormField.jsx` (2 each), `BookCard.jsx`, `CollectionModal.jsx`, `FandomModal.jsx`, `SeriesCard.jsx`, `ShipModal.jsx`, `TagsModal.jsx`, `AddChoice.jsx`, `upload/BookCard.jsx`, `UploadSuccess.jsx`, `DuplicatesPage.jsx`, `ImportPage.jsx` (1 each)
- **Frozen-file exception (sanctioned):** `components/upload/BookCard.jsx` is on the frozen list; it took exactly one of the 71 appends (`text-label` → `+ text-text-body`, its unpaired Category label) because the `@layer components` deletion would otherwise have recolored that site. The frozen list is otherwise untouched (`GradientCover.jsx`, `MosaicCover.jsx`, `covers.py`, `metadata.py`, `database.py`).

---

## [0.48.0] - 2026-07-06

> Phase 10.0E design consistency sweep (S12), shipped in three batches: straggler conversions (Batch 1), scattered mechanical cleanup (Batch 2), S11 regression defects + close-out verification (Batch 3).

### Changed — Batch 1: Straggler File Conversions (2026-07-06)

The four files that never received a C-series conversion (81% of remaining hardcoded colors, per `docs/FRONTEND_AUDIT_S12.md` §2) are now on the design system. Appendix A patterns A1–A5 return 0 matches across all four; no legacy `library-*` aliases remain in them.

#### DuplicateCollectionModal — rebuilt on shared ui/Modal
- Bespoke fixed overlay → `ui/Modal` (`size="md"`, fullscreen on mobile, matching sibling CollectionModal), with `Modal.Header`/`Body`/`Footer` and ✕ top-right.
- Footer raw buttons → `<Button>` (Cancel = ghost, Duplicate = primary with loading state); right-aligned per the 16-modal precedent instead of full-width halves.
- Name field → `FormField`; Collection Type and Rules headers follow the CollectionModal span-row pattern (FormField has no right-side slot for the Info toggle / preview count — same resolution as the precedent file, zero raw `<label>`s remain).
- 35 hardcoded color instances → semantic tokens (type selector now `action-primary/15` selected state, info tooltip on `bg-elevated`, copy-info and counts on `text-muted`).

#### BookLinkPopup — color conversion only
- 15 hardcoded color instances + legacy `library-*` aliases → semantic tokens; `bg-black/60` backdrop → `bg-bg-overlay` (the token that exists to replace it). Search input moved to the standard `bg-elevated` input treatment.
- Bespoke popup shell and raw buttons intentionally kept — sanctioned one-off per audit §7.

#### CriteriaBuilder — FormField + useStatusLabels adoption
- Three raw `<label>`+input fields (Tags, dropdowns, word-count inputs) → `FormField` children mode; labels lose bespoke `text-xs text-gray-400` styling.
- 14 hardcoded color instances → semantic tokens; selects keep the custom chevron (stroke updated to warm `text-secondary`); Clear all → `action-danger`/`-hover`.

### Fixed
#### CriteriaBuilder status-label drift (audit H3 #2, I1)
- Root cause: a bespoke settings loader duplicated `useStatusLabels` with the wrong fallback — the status dropdown showed **"Abandoned"** instead of "DNF" whenever the setting was absent. Loader deleted; the shared hook (with its live `settingsChanged` updates and caching) now supplies both internal DB values and display labels. Zero `Abandoned` literals remain in the file.
- The date-finished dropdown was hard-labeled "Finished" while the status name is user-configurable in the same form — now uses the hook's Finished label (I1).
- Status dropdown option order now matches the app-wide `getStatusOptions()` order (Unread, In Progress, Finished, DNF) used by BookDetail and friends, instead of the bespoke Finished-first order.

### Removed
#### DuplicateFinderModal.jsx — dead code deleted
- Discovered during the Batch 1 conversion: the component was imported nowhere (only its own definition and export). It was superseded by `pages/DuplicatesPage.jsx`, which App.jsx routes at `/duplicates`. Verified repo-wide (no static, lazy, or string-based imports; the repo has no test files) and deleted. Its 27 hardcoded-color instances leave the audit baseline with it.

### Technical
#### Files Deleted
- `frontend/src/components/DuplicateFinderModal.jsx` — dead since the DuplicatesPage rework; superseded by the routed page
#### Files Modified
- `frontend/src/components/DuplicateCollectionModal.jsx` — Modal/Button/FormField rebuild + tokens; XIcon component deleted (Modal.Header owns ✕)
- `frontend/src/components/BookLinkPopup.jsx` — tokens only
- `frontend/src/components/CriteriaBuilder.jsx` — FormField + useStatusLabels + tokens; `INTERNAL_STATUS_VALUES`/`DEFAULT_STATUS_LABELS` maps and settings fetch deleted
- No shared `ui/` component, config, or tokens.css changes; no token typography classes (`text-h*`/`text-body*`/`text-caption`/`text-label`) added in converted code, per the S12→S13 migration rule.

### Changed — Batch 2: Scattered Mechanical Cleanup (2026-07-06)

Zeroes out audit categories A, C, and D (per `docs/FRONTEND_AUDIT_S12.md`), the H philosophy violations, the I1 hook-adoption gaps, and both out-of-category bonus finds. Appendix A patterns A1–A5 return 0 repo-wide outside frozen files; pattern D returns 0 outside `ui/` with one sanctioned exception (BottomNav emoji sizing — S13 lint ignore-list seed).

#### Category A — the last 21 hardcoded color instances (7 files)
- Batch 1 mapping table applied: `text-white` → `text-text-primary`, `text-gray-400/500` → `text-text-secondary`/`text-text-muted`, `border-gray-700` → `border-border-default`, `bg-zinc-700` → `bg-bg-elevated`, `bg-green-600`/`bg-red-600` → `bg-action-success`/`bg-action-danger`, `text-[#e0e0e0]` → `text-text-primary`.
- Files: `App.jsx` (pre-connection screens), `ui/Toast.jsx`, `ui/UnifiedNavBar.jsx`, `ui/Button.jsx`, `ReadingStatusCard.jsx`, `pages/Settings.jsx`, `pages/AddPage.jsx`.

#### Category C — shared-component className overrides (3 sites → 0)
- `ui/Button` gains real `success` and `warning` variants on the `action-success`/`action-warning` tokens, matching the existing variant API. ManualEntryForm's and WishlistForm's `!bg-` force-overrides now use the variants. (`warning` hovers at `action-warning/85` — the config defines no `warning-hover` token; matches the former override.)
- `ui/AuthorInput` now owns the standard input treatment (mirrors FormField's input styling, including error state via a new `error` prop). UnifiedEditModal's full-restyle override deleted; the add-form callers pass `error={...}` instead of `inputClass(...)`.

#### Category D — typography drift (21 sites fixed, 1 skipped)
All fixes written in paired form (`token class + config color utility`) so the sites survive the upcoming token migration zero-touch. Per-site mapping:

| Site | Before | After |
|------|--------|-------|
| BookDetail stat values ×7 (metadata pills; Times Read / Average Rating ×2) | `text-text-primary font-semibold` (+`text-lg`) | `text-h4 text-text-primary` (stat values are h4-weight emphasis) |
| BookDetail notes-markdown `h3` renderer | `text-body-sm font-semibold text-text-primary` | `text-label text-text-primary` |
| BookDetail notes-markdown `strong` renderer | `text-text-primary font-semibold` | `text-label text-text-primary` |
| BookDetail delete-edition name emphasis | `font-semibold text-text-primary` | `text-label text-text-primary` |
| App.jsx "Connection Error" heading | `text-xl font-bold text-white` | `text-h3 text-text-primary` |
| Header wordmark | `text-xl font-bold text-text-primary` | `text-h2 text-text-primary` (exact size match) |
| UploadProgress status glyph | `text-xl` + status color | `text-h2` + status color (glyph sizing — S13 ignore-list candidate alongside BottomNav) |
| SortDropdown "Drag to reorder" badge ×2 | `text-[10px] font-semibold` | `text-caption text-action-warning` (uppercase kept) |
| AddPage linked-book title | `text-text-primary font-semibold` | `text-h4 text-text-primary` |
| ImportPage "Import Complete" heading | `font-semibold text-action-success … text-h4` | `text-h4 text-action-success` (redundant weight dropped) |
| SeriesCard cover lettering ×2 | `font-bold` utility | `fontWeight: 700` in the existing inline style (cover art — color/shadow already inline; a token class would repaint rendered covers) |
| BottomNav emoji icon | `text-2xl` | **skipped** — sanctioned lint ignore-list seed |

Note on the "stat-value ×10" decision: 3 of BookDetail's 10 `font-semibold` hits are inline emphasis inside 14px sentences (the markdown renderers and the delete-edition confirmation), not stat values — `text-h4` there would put 16px bold mid-sentence, so those map to `text-label` (nearest token, 14px/500) instead.

#### Bonus finds
- `index.css` scrollbar: the frontend's last navy hexes (slate `#1e293b`/`#475569`/`#64748b`) → warm values taken from `tailwind.config.js` (`bg.surface` `#242220` / `action.secondary` `#4a4541` / `action.secondary-hover` `#5e5954`), each commented with its config source (scrollbar CSS needs raw values).
- Legacy `library-*` alias vocabulary deleted: the 9 remaining usages (App.jsx ×5, ui/UnifiedNavBar ×4; the rest died with Batch 1) migrated per the alias definitions — `bg-library-bg` → `bg-bg-base`, `bg-library-card` → `bg-bg-surface`, `library-accent` → `action-primary` — then the alias block removed from `tailwind.config.js`. `grep -rn "library-" frontend/src` → 0. The third color vocabulary is gone.

### Fixed — Batch 2

#### P1: DNF books rendered as "Not Started" on BookDetail (audit I1; S11 regression finding)
- Root cause: BookDetail's `normalizeStatus` lowercases the DB value `'Abandoned'` to `'abandoned'`, which is not a `STATUS_CONFIG` key in ReadingStatusCard — the card fell back to the unread config and displayed its hardcoded `'Not Started'` label. `normalizeStatus` now maps `'abandoned'` → `'dnf'`, and ReadingStatusCard's hardcoded `'Not Started'` strings are deleted in favor of `useStatusLabels().getLabel('Unread')` (I1). DNF books now get the neutral dnf treatment and the user's configured DNF label. (`'Currently Reading'` kept — distinct copy, not a configurable status label.)

#### H2: Abandoned fanfic completion badge no longer danger-red
- BookDetail's completion-status badge (`Complete`/`WIP`/`Abandoned`) rendered `'Abandoned'` in `action-danger`; now the neutral `status-dnf` treatment, matching ImportPage's handling of the identical status. Setting aside ≠ failure.

#### H3: "Abandoned" no longer rendered as display text
- BookDetail's completion badge rendered the raw DB value; it now routes through `getLabel(SESSION_STATUS_TO_BACKEND[…] || value)` — the documented translation-map pattern (snake_case variants covered) — so abandoned fics display "DNF" (or the custom label). (`Complete`/`WIP` pass through unchanged.)
- The Settings status-rename row was titled "Abandoned" (`StatusLabelsModal` `FIELDS`); row titles now render the live label for each status via `useStatusLabels`, so they track renames.

#### I1: CollectionDetail bespoke status-label loader deleted
- The duplicated settings loader (with drifted `'Reading'`/`'Done'` fallbacks — the same drift class that produced Batch 1's CriteriaBuilder bug) fed a `statusLabels` state that was **never read**: ChangeStatusModal and MarkFinishedModal self-serve via the shared hook. Dead state + loader portion removed outright; nothing in the file renders status labels, so no hook import was needed. Zero bespoke label loaders remain repo-wide.

### Technical — Batch 2

#### Files Modified
- `frontend/tailwind.config.js` — `library` alias block deleted (only change)
- `frontend/src/index.css` — scrollbar colors → warm palette values with config-source comments
- `frontend/src/App.jsx` — tokens (colors + `text-h3` heading), `library-*` migration
- `frontend/src/components/ui/Button.jsx` — `success`/`warning` variants added; `text-white` → `text-text-primary` in primary/danger; JSDoc variant list updated
- `frontend/src/components/ui/AuthorInput.jsx` — owns FormField-standard input styling; new `error` prop; `className` now appends to the base
- `frontend/src/components/ui/Toast.jsx` — semantic tokens (success/danger/elevated + text-primary)
- `frontend/src/components/ui/UnifiedNavBar.jsx` — tokens + `library-*` migration
- `frontend/src/components/BookDetail.jsx` — D ×10, H2 badge, H3 label translation, `normalizeStatus` `'abandoned'` → `'dnf'`
- `frontend/src/components/ReadingStatusCard.jsx` — `'Not Started'` literals deleted (hook Unread label), `text-white` ×2
- `frontend/src/components/CollectionDetail.jsx` — dead `statusLabels` state + loader removed
- `frontend/src/components/UnifiedEditModal.jsx` — AuthorInput override removed
- `frontend/src/components/add/ManualEntryForm.jsx` — Button `success` variant; AuthorInput `error` prop
- `frontend/src/components/add/WishlistForm.jsx` — Button `warning` variant; AuthorInput `error` prop
- `frontend/src/components/settings/StatusLabelsModal.jsx` — row titles via `useStatusLabels`
- `frontend/src/components/Header.jsx`, `SeriesCard.jsx`, `SortDropdown.jsx`, `upload/UploadProgress.jsx`, `pages/Settings.jsx`, `pages/AddPage.jsx`, `pages/ImportPage.jsx` — per the A/D tables above
- Frozen files untouched. Batch 1's "no token typography classes" rule deliberately relaxed for Category-D fix sites only, always in paired `token + color utility` form.

### Fixed — Batch 3: S11 Regression Defects (2026-07-06)

The four behavioral defects logged to Open Questions during the Session 11 regression pass. Surgical fixes only — the status data-model cluster (Title cache vs sessions, pill↔session sync, `date_finished` clobbering) remains parked for its own decision sprint.

#### BookDetail rating pill dead on mobile (from S3)
- Root cause: Session 3 locked all three hero metadata blocks as tappable. Status and category got modal wiring; the rating pill kept a scroll-to-history handler targeting `reading-history-desktop` / `reading-history` — both anchors live in containers hidden on mobile outside the active tab (`hidden md:block` / tab-gated), so `scrollIntoView` silently no-ops where ~95% of usage happens. The S3-era popup cluster was left declared but never wired — removed in this batch: `ratingPopupOpen`, its dead twin `statusPopupOpen`, `handleRatingChange`, and the `ratingLoading`/`ratingStatus` state that existed only to serve it (verified zero references repo-wide; `selectedRating` kept — its setters still run in live refresh paths, parked with the status data-model cluster).
- Fix: mirrors the category block — `type="button"` opening the existing rating-edit surface. Tap now opens the session editor on the most recent reading session (ratings live on sessions), falling back to `openAddSession()` when none exist — the same wiring ReadingStatusCard's `onEditSession` already uses. No new surface invented.

#### Series sort direction dead (from S6)
- Root cause: Session 6 shipped AuthorDetail's series-grouping sort with the comparators hardcoded ascending — series names and the standalone-titles section ignored `sortDir` while every flat sort (title/added/published) honors it. SortDropdown's `Grouped`/`Grouped` direction labels documented the wrong assumption ("direction is semantically irrelevant").
- Fix: both comparators now apply the flat-mode idiom (`sortDir === 'desc' ? -cmp : cmp`). Within-series `series_number` order intentionally stays ascending — that's reading order, not a sort preference. SortDropdown's series direction labels now read `A → Z` / `Z → A`. Checked for duplicated logic: WishlistTab, CollectionDetail, and Library/backend sorts all honor direction; no other series comparator exists repo-wide.

#### Grid-columns setting leaking onto the Series landing page (from S2)
- Root cause: the Series tab in `Library.jsx` shared `manifestGridClass` (settings-driven `useGridColumns`) with the Browse book grid. Series represents *groups* — like Collections, which is intentionally exempt.
- Fix: series grid now mirrors CollectionsTab's fixed grid (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4`) and ignores the setting entirely. Browse grid unchanged. Adds 3 sanctioned I2 raw matches (same treatment as the CollectionsTab precedent — S13 lint ignore-list seed).

#### MarkFinishedModal saves silently with no date (from S10)
- Root cause: `handleSubmit` passed `dateFinished` through unvalidated; every consumer guards `if (dateFinished)`, so an empty date silently skipped the date update while status/rating still saved — success theater with no date recorded.
- Fix: inline validation per house pattern — empty date blocks the save, FormField error state ("Pick a date to mark this as finished") with danger border on the field, clearing as soon as a date is picked. No `window.alert`, no toast. Consumers untouched; the `date_finished`-on-status-change behavior stays parked (Status Knot).

### S12 Close-Out Verification (finalizes 10.0E)

Full Appendix A re-run (`docs/FRONTEND_AUDIT_S12.md`, same engine semantics) against the post-Batch-3 tree. Scope: 84 files (85 at baseline − deleted `DuplicateFinderModal.jsx`). **A1–A5 re-confirmed 0 repo-wide after the defect fixes.**

| Pattern | Audit baseline (`6b9789c`) | Post-S12 (v0.48.0) | Verdict |
|---------|---------------------------|--------------------|---------|
| §1 token-class usages | 394 | 408 | **Parked** — token migration session; +14 by design (Batch 2's paired `token + color` D fixes) |
| A1–A5 hardcoded colors | 112 | **0** | ✅ |
| B raw elements outside ui/ | 182 | 175 | **Parked** — conversion backlog; −7 via Batch 1 conversions + dead-file deletion |
| C ui/ className overrides | 3 | **0** | ✅ — 1 engine false positive: `<span>` nested in CriteriaBuilder's FormField `label` prop, not an override (ignore-list seed) |
| D typography outside ui/ | 24 | **1** | ✅ — the sanctioned BottomNav emoji sizing (ignore-list seed) |
| E routed pages missing UnifiedNavBar | 0 | **0** (12/12) | ✅ |
| F bespoke modals | 3 | 1 | **Parked** — AnalyzingModal (dismiss-semantics decision first) |
| G raw labeled fields | 6 | **0** | ✅ — 8 wrapper-labels remain sanctioned per audit §8 |
| H1 indigo | 0 code (1 comment) | 0 code (1 comment) | ✅ — SeriesCard history comment (ignore-list seed) |
| H2 red-on-DNF pairings | 1 | **0** | ✅ |
| H3 "Abandoned" user-facing | 2 (+1 raw render) | **0** | ✅ — 40 raw occurrences all internal DB values/keys/`getLabel` routing |
| I1 labels bypassing useStatusLabels | 3 (+2 loaders) | **0** | ✅ — 47 raw matches all internal; "Not Started" gone repo-wide |
| I2 hardcoded grid-cols candidates | 1 (21 raw) | **0** (24 raw) | ✅ resolved — CollectionsTab + Series landing are intentional fixed group grids |
| `library-*` aliases | 24 | **0** | ✅ — alias block deleted from config |

### Technical — Batch 3

#### Files Modified
- `frontend/src/components/BookDetail.jsx` — rating pill onClick → session editor wiring; dead S3 popup cluster deleted (`ratingPopupOpen`, `statusPopupOpen`, `handleRatingChange`, `ratingLoading`, `ratingStatus`)
- `frontend/src/components/AuthorDetail.jsx` — series-name + standalone comparators honor `sortDir`
- `frontend/src/components/SortDropdown.jsx` — series direction labels `A → Z` / `Z → A`
- `frontend/src/components/Library.jsx` — Series tab grid fixed (mirrors Collections), ignores `useGridColumns`
- `frontend/src/components/MarkFinishedModal.jsx` — inline empty-date validation (FormField error state)
- `backend/main.py` — FastAPI `version` constant `0.10.0` → `0.48.0` (had been stale since v0.10.0; the repo's only in-code version constant). **Backend change — Docker rebuild required.**

---

## [0.47.3] - 2026-07-03

### Fixed
#### BookDetail unreadable text — tokens.css was never in the build
- Root cause: `@import './styles/tokens.css'` in `index.css` appeared AFTER the `@tailwind` directives. Per CSS spec, `@import` must precede all other rules, so the import was silently dropped from the build. Every typography token class (`text-h1`–`h4`, `text-body`, `text-body-sm`, `text-caption`, `text-label`) was absent from shipped CSS; elements using them rendered unstyled and inherited default black on the dark theme.
- Moved the import above the Tailwind directives.
- Rewrote `tokens.css` typography classes to `@apply` semantic color utilities from `tailwind.config.js` instead of duplicating hex values — config is now the single source of color truth. (Caption's WCAG AA fix — #6e6962 → text-muted #918b84, ~5:1 — already landed in 0.47.2; this change only moves the value's source of truth to the config.)
- Converted `CollapsibleSection.jsx` header from hardcoded `text-gray-500` (dead cool-gray palette) to `text-label` / `text-caption`, matching sibling section headers.
- Note: token typography now renders app-wide for the first time; headers on several screens gained their intended size/weight.
- Files: `frontend/src/index.css`, `frontend/src/styles/tokens.css`, `frontend/src/components/ui/CollapsibleSection.jsx`

---

## [0.47.2] - 2026-06-28

### Fixed
#### BookDetail readability (WCAG AA)
- Raised `.text-caption` from #6e6962 (3.2:1, failed AA) to #918b84 (~5:1), matching the config `text-muted` token. Fixes stat sub-labels, metadata keys, and read-time microcopy across the app.
- Added a base `body` text color (#cdc8c1) in index.css so any element whose token color fails to apply falls back to readable warm-gray instead of near-black.
- Pinned the BookDetail title and section headers (Reading History, Collections, Notes) to config utility colors (`text-text-primary` / `text-text-body`), which render reliably, instead of relying solely on the tokens.css component-layer color.
- Root cause: BookDetail was already fully tokenized (no hardcoded colors beyond intentional icon strokes). The dimness came from two parallel color systems: `tokens.css` typography classes under `@layer components` (whose colors lose the cascade to any utility, and silently fail with no base fallback) versus the `tailwind.config.js` semantic utilities (`text-text-*`, reliable). AuthorDetail and SeriesDetail render fine because they lean on the utilities; BookDetail leaned on the component classes. Months of prior fix attempts tuned `tokens.css` color *values* that were never the ones rendering on this page. Flagged for the Session 12 consistency sweep (migrate component-class colors to config utilities) and the Session 13 lint guardrail.
- Files: `frontend/src/styles/tokens.css`, `frontend/src/index.css`, `frontend/src/components/BookDetail.jsx`
- **Phase 10.0D — UX Audit Fix Sessions: complete.** Session 11 regression pass on Sessions 1–10 passed — no regressions from the fix work itself. Non-regression findings surfaced during the pass (DNF label on ReadingStatusCard, series sort asc/desc, MarkFinished date validation, grid setting leaking onto the Series landing, plus polish items) were logged to Open Questions rather than fixed in-scope. 11/11 sessions shipped (v0.38.0–v0.47.2).

---

## [0.47.1] - 2026-05-04

### Changed

- **Upload hotfix:** Per-file upload limit raised from 100 MB to 250 MB; removed the 500 MB batch total cap. `POST /api/upload/analyze-batch` no longer returns 400 for “all invalid”; it returns HTTP 200 with `rejected_files: [{ filename, reason }]` and empty `books` when every file fails validation, so the UI can list reasons per file. Successful responses include the same `rejected_files` array for partial failures (invalid files skipped, valid ones analyzed). New `GET /api/upload/limits` exposes `max_file_size`, `max_file_size_mb`, and `allowed_extensions` for client pre-checks.
- **Frontend:** `AddToLibrary` loads limits and passes `maxFileSize` and `allowed_extensions` to `FileDropZone`, which rejects oversize and unsupported extensions before upload and shows a dismissible inline list. `AddPage` parses `rejected_files`, stays on the add step when there are no valid books but there are rejections, shows a per-file banner (and “Something went wrong” only when both lists are empty), and passes rejections into `ReviewBooks` when some files succeeded.
- Per-file upload validation now uses a single source of truth: backend `ALLOWED_EXTENSIONS` is exposed via `GET /api/upload/limits` and consumed by `FileDropZone` for both the file picker `accept` attribute and client-side rejection. Removed duplicate extension lists (`DEFAULT_ACCEPT`, `DEFAULT_FORMAT_LABEL`, `UPLOAD_ALLOWED_EXTENSIONS`) from `FileDropZone.jsx`.
- `AnalyzeResponse.session_id` is now `Optional[str]`; backend returns `None` (JSON `null`, not `""`) when all files were rejected during validation.

#### Hotfix: Upload flow — file size limit, error surfacing, and SSOT cleanup

Out-of-session hotfix triggered by a 104MB EPUB upload (cookbook with photo plates) failing with a generic "No valid files uploaded" banner. Investigation surfaced four problems compounding into one bad UX: an arbitrary 100MB per-file limit, silent rejection inside the analyze loop, no client-side pre-validation (so the user ate a 4-second upload before the server quietly threw the file away), and three duplicate hardcoded extension lists across backend and frontend.

Shipped in two waves in the same session.

**Wave 1 — limits and error surfacing:**
- `MAX_FILE_SIZE` raised from 100MB to 250MB. Covers cookbooks, art books, and other image-heavy formats without re-opening this same hotfix in three months.
- Redundant `MAX_BATCH_SIZE` constant removed entirely. Per-file validation runs on every file in the batch; the separate batch ceiling was dead defense and a second source of truth waiting to drift.
- `analyze-batch` no longer silently skips invalid files. Each rejection now appends to a new `rejected_files: list[RejectedFile]` field on `AnalyzeResponse`, with `{filename, reason}` per entry. Reason strings come from `validate_file()` and are user-facing (`"File too large: 104.0 MB (max 250 MB)"`, `"Unsupported file type: .docx"`).
- All-rejected branch returns 200 with empty `books` and populated `rejected_files` instead of 400 with a generic `detail`. Frontend can now show per-file errors with filenames instead of a banner that doesn't tell the user which file or why.
- New `GET /api/upload/limits` endpoint returns `{max_file_size, max_file_size_mb, allowed_extensions}` so the frontend can pre-validate before sending bytes. Single source of truth for both constraints.
- `FileDropZone.jsx` gained a `maxFileSize` prop. On file selection, files exceeding the limit are rejected client-side with a dismissible red panel listing each rejected filename and reason — no network request fired for files that would fail anyway.
- `AddPage.jsx` and `UploadPage.jsx` (the analyze-batch callers) parse the new `rejected_files` field. Combined danger banner shows server-side rejections; cleared on file change, reset, upload-more, dismiss, and analyze error. `ReviewBooks.jsx` accepts an optional `rejectedFiles` prop and renders the list at the top when present, so the user sees what was excluded alongside what's queued for review.

**Wave 2 — single source of truth cleanup, plus dead code purge:**
- Three hardcoded extension lists in `FileDropZone.jsx` collapsed into one prop. `DEFAULT_ACCEPT` (input `accept` attribute), `DEFAULT_FORMAT_LABEL` (display string), and `UPLOAD_ALLOWED_EXTENSIONS` (validation set) all removed. Component now takes a single `allowedExtensions` array prop and derives all three values internally via `useMemo`. Backend's `ALLOWED_EXTENSIONS` is now the only place upload extensions are defined anywhere in the codebase.
- `acceptedTypes` prop removed from `FileDropZone.jsx`. The `accept` attribute on the file input is now derived from `allowedExtensions` directly.
- `formatHint` prop kept as an optional override for callers who want a curated label string instead of the auto-derived one.
- `AddToLibrary.jsx` extended to fetch `allowed_extensions` alongside `max_file_size` from `/api/upload/limits` and pass both down. Both states default to `null` — if the limits fetch fails, FileDropZone falls back to no client-side validation; server still enforces both, so the failure mode is degradation, not breakage.
- `AnalyzeResponse.session_id` typed as `Optional[str] = None`. Previously `str` with `""` returned on the all-rejected path — a contract hack to satisfy a non-optional field with no real value. Now returns `None` properly. Frontend never read the field on the rejection path, so this is invisible to users and visible only in the schema.
- **Deleted `frontend/src/pages/UploadPage.jsx`.** The `/upload` route has been a redirect to `/add` since the AddPage merge; UploadPage was never being rendered. Cursor briefly maintained "parity" between AddPage and UploadPage in Wave 1 — work for a file no user has hit since the redirect shipped. Deleted outright. The redirect route in `App.jsx` stays so old bookmarks still land somewhere useful.
- Dead `'/upload'` pathname check removed from `Header.jsx` active-tab logic. The redirect on the `/upload` route guarantees the Header can never observe `/upload` as the live pathname.

### Fixed

- **104MB cookbook EPUB no longer rejected as "No valid files uploaded".** Original symptom that triggered the whole hotfix. Now uploads cleanly, advances to Review.
- **Silent rejection of invalid files.** Files failing `validate_file()` were being skipped without any user-facing signal — the batch loop just `continue`'d past them. Now every rejection produces a structured error visible in the UI with filename and reason.
- **Wasted upload time on doomed requests.** Files exceeding the size limit or with the wrong extension were being uploaded in full (consuming bandwidth, blocking the UI for the duration) before the server validated them. Client-side pre-check now fails them at file-select time with no network round-trip.

### Technical

#### Files Created
None.

#### Files Modified
- `backend/services/upload_service.py` — `MAX_FILE_SIZE` constant raised to `250 * 1024 * 1024`; `MAX_BATCH_SIZE` constant removed; `validate_file()` error string derives the limit from `MAX_FILE_SIZE` instead of hardcoding "100 MB"
- `backend/routers/upload.py` — `Optional` import; `MAX_BATCH_SIZE` removed from `upload_service` import, `MAX_FILE_SIZE` and `ALLOWED_EXTENSIONS` added; `RejectedFile` Pydantic model added; `AnalyzeResponse.session_id` typed `Optional[str] = None` with docstring; `AnalyzeResponse.rejected_files: list[RejectedFile] = []` added; batch-size check in `analyze_batch` removed; per-file rejections collected into `rejected_files` instead of silent `continue`; all-rejected branch returns 200 with `session_id=None` instead of raising 400; success path includes `rejected_files`; new `GET /upload/limits` endpoint
- `frontend/src/components/ui/FileDropZone.jsx` — `useMemo` added to imports; `DEFAULT_ACCEPT`, `DEFAULT_FORMAT_LABEL`, and `UPLOAD_ALLOWED_EXTENSIONS` constants removed; `acceptedTypes` prop removed; `allowedExtensions`, `maxFileSize` props added; `formatHint` prop kept as optional override; `rejections` state; `allowedSet` (memoized), `acceptAttr`, `derivedFormatLabel`, `displayLabel` derived from `allowedExtensions`; `handleFiles` validates size and extension client-side, populates `rejections`; `inputEl` `accept={acceptAttr}`; `rejectionSection` renders dismissible red panel above file list in both mobile and desktop branches; format hint label only renders when `displayLabel` is truthy; `handleClearAll` clears rejections
- `frontend/src/components/add/AddToLibrary.jsx` — `useEffect`, `useState` imports added; `maxFileSize` and `allowedExtensions` state; effect fetches `/api/upload/limits` with `cancelled` cleanup flag and `Array.isArray` guard; both states passed into `<FileDropZone>` as props
- `frontend/src/pages/AddPage.jsx` — `analyzeRejections` state; analyze-batch response branches on `response.books.length` + `response.rejected_files.length` (stays on Add step if no books accepted, advances to Review with rejection list passed down if some were); combined danger banner; cleared on file change, reset, upload-more, dismiss; cleared in `catch` on analyze error; UploadPage references removed from comments (mechanical comment cleanup, no logic change)
- `frontend/src/components/upload/ReviewBooks.jsx` — optional `rejectedFiles` prop renders rejection list at top of view when populated
- `frontend/src/components/Header.jsx` — `'/upload'` removed from `add`-tab `isActive` predicate; only `location.pathname === '/add'` remains

#### Files Deleted
- `frontend/src/pages/UploadPage.jsx` — never rendered since the `/upload → /add` redirect shipped; deleted outright. Confirmed via `grep -r "UploadPage" frontend/src/` returning empty.
- `frontend/src/pages/UploadPage.jsx` — dead file. The `/upload` route has been a redirect to `/add` since the AddPage merge; `UploadPage` was never rendered.
- Dead `'/upload'` pathname check in `Header.jsx`.

#### Files Verified, No Changes
- `App.jsx` — `/upload → /add` redirect route retained for legacy bookmarks
- `GradientCover.jsx`, `BookCard.jsx`, `sync.py` — frozen, untouched
  - *Erratum (2026-07-08): `metadata.py` is the frozen file, not `sync.py` — `sync.py` was never on the frozen list. Original line preserved above.*
- `database.py` — no schema changes
- `validate_file()` signature unchanged; only the constant it references and its error message changed
- `books`, `total_files`, `total_size` semantics on `AnalyzeResponse` unchanged for successful analyses; only additive `rejected_files` and the `Optional` re-typing of `session_id`

#### Requires Docker Rebuild
Yes. Backend changes to `upload_service.py` and `upload.py` require a container rebuild to pick up the new `MAX_FILE_SIZE` constant and the `/api/upload/limits` endpoint.

### Parked (logged for later)

- **FileDropZone format-hint label aesthetics.** Auto-derived from backend `allowed_extensions` produces `AZW • AZW3 • EPUB • HTM • HTML • MOBI • PDF`. Longer than the previous hardcoded `EPUB • PDF • MOBI • AZW3 • HTML` and includes formats (`.htm`, `.azw`) that were silently dropped from the old display. Accuracy beats brevity here, but if it reads as cluttered in production use, `AddToLibrary.jsx` can pass a curated `formatHint` override prop and FileDropZone will use it instead of the derived value. Skip unless actually annoying.
- **Cursor scope drift watch.** Second hotfix in a row where Cursor edited files not on the explicit "Files to Modify" list. Wave 1: `AddPage.jsx` comment cleanup that wasn't requested. Wave 2: same. Both edits were comment-only and harmless, but the pattern is worth flagging in `CURSOR_PROMPT_GUIDE.md` if it happens a third time. No action this session.



---

## [0.47.0] - 2026-04-23

### Changed

#### Fix Session 10: Destructive Action Guards
Three tracks replaced silent-failure and browser-native destructive paths with in-app confirmations and consistent error surfaces. Also cleared the last-remaining `window.confirm` call in the app. Addresses audit findings G8-02, G3-13, plus the modal-closes-on-failure item parked from Session 3 (v0.40.0 CHANGELOG).

**Track 1 — DuplicatesPage inline merge confirmation (G8-02):**
- Tapping "Merge into Selected" on a duplicate group no longer merges immediately. The button hides and a confirmation row appears at the bottom of the group card: `Merge N titles into "KeptTitle"? This can't be undone.` with Cancel (ghost) and Merge & Delete (danger) buttons. Cancel returns the card to default state; Merge & Delete performs the actual merge.
- Pluralization handled: `1 title` vs `N titles`. Kept title pulled from the current radio selection; graceful fallback to `the selected title` if selection is somehow missing.
- Layout stacks vertical on narrow mobile (`flex-col`) and goes horizontal at the `sm:` breakpoint so long fanfic titles don't crowd the buttons.
- Help text (`💡 Select the book to keep...`) hidden during the in-flight merge and during confirmation, so only one signal is ever visible at a time.

**Track 1 follow-up — Group state keyed by stable UUIDs, not array indices:**
- Discovered during mobile testing: after a successful merge's 1.5s post-success `setTimeout` removed the group from `results.groups`, the group that slid up into its place inherited stale `mergeSuccess`/`merging`/etc. flags from the removed group's old index — rendering as dimmed with a phantom "Merged!" chip until the next rescan.
- Root cause was pre-existing: every per-group state map (`selections`, `merging`, `mergeSuccess`, `mergeError`, the new `confirmingMerge`) was keyed by array position, and filtering `groups` didn't shift the indices in the state maps.
- Fixed by assigning each group a stable client-side UUID (`group._key`, via `crypto.randomUUID()` with a math-based fallback for older contexts) on load in `scanForDuplicates`. All per-group state maps, the React list `key` prop, and the radio-button `name` attribute now key on `group._key` instead of array index. Post-merge cleanup is a single `delete` per map — no more index arithmetic.
- `scanForDuplicates` also now resets `setMerging({})` alongside the other state maps — previously missed, which could have left stale in-flight flags across a rescan mid-merge. Small correctness drive-by.
- Picks up a latent React reconciliation benefit: DOM nodes no longer reused across groups after array mutations, because the `key` prop is now identity-stable.
- Project-wide grep for `groupIndex` in `DuplicatesPage.jsx` returns zero matches — entire index-based keying pattern eliminated.

**Track 2 — Session delete inline confirmation (G3-13):**
- `window.confirm()` in `handleDeleteSession` replaced with an in-app confirmation view inside the session edit modal, matching the Session 4 "Discard unsaved changes?" pattern in `UnifiedEditModal`.
- Tapping Delete in the footer swaps the form body for a centered confirmation view titled `Delete Read #N?` with subtext `This can't be undone.` and Cancel (ghost) / Delete (danger) buttons. Footer hidden during confirmation (no stray buttons).
- Cancel returns to the form with all field values preserved. X / backdrop / Escape while confirming dismiss only the confirm view (same no-double-loss behavior as Session 4), not the whole modal.
- On delete API failure, the confirmation dismisses and the form reappears with the existing `sessionError` banner showing the message — errors have a consistent surface instead of a dead-end confirmation.
- `handleDeleteSession` split into two functions: `handleDeleteSession` now only opens the confirmation; `handleConfirmDeleteSession` runs the actual `deleteSession` call + refresh flow.
- `closeSessionModal` clears the new `showSessionDeleteConfirm` state so reopening the modal always starts in the form view.
- `window.confirm` grep in `BookDetail.jsx` returns zero matches.

**Track 3 — Modal-closes-on-failure for MarkFinishedModal and ChangeStatusModal (parked from Session 3):**
- Both modals previously closed unconditionally — on success AND on API failure, with the failure silently swallowed. Deferred from v0.40.0 with a note pointing to Session 10 for consistent treatment.
- `MarkFinishedModal` and `ChangeStatusModal` now accept optional `error` and `saving` props. When `error` is truthy, the modal renders a non-blocking danger banner at the top of the body (same visual style as the existing `sessionError` banner in the session editor modal, for consistency).
- Primary action buttons (`Mark Finished`, `Apply`) support `loading={saving}` and `disabled={saving}`. Ghost Cancel button also disabled during the in-flight call to prevent mid-save cancels.
- `BookDetail.jsx` handlers `handleMarkFinishedConfirm` and `handleChangeStatusFromModal` rewritten: `setXSaving(true)` at start, `setXError(null)` to clear prior, move `setShowXModal(false)` into the `try` block so close only fires on success. `catch` sets the error state, leaves the modal open. `finally` clears saving.
- Both modals' `onClose` handlers now clear the corresponding error state so a fresh open never renders a stale banner.
- Props are optional on both modal components — no breaking changes for call sites that don't pass them (`Library.jsx`, `CollectionDetail.jsx`, `AuthorDetail.jsx`).

### Fixed

- **`await` missing on `fetchSessions()` in `handleConfirmDeleteSession`.** Flagged by Cursor review agent after initial implementation. The finally block's `setSessionSaving(false)` was racing the un-awaited `fetchSessions()`, marking the operation complete before the reading-history list finished reloading. Now awaited, matching the pattern already in `handleMarkFinishedConfirm` and `handleChangeStatusFromModal`.
- **`||` instead of `??` for rating in `handleConfirmDeleteSession`.** Flagged by Cursor review agent. A rating of `0` was being coerced to `null` by the `||` operator, wiping a legitimate zero rating on delete refresh. Switched to `??`, which only substitutes null/undefined.
- **`||` vs `??` swept across entire `BookDetail.jsx` (drive-by during the review-agent fix).** `handleSaveSession` had the same `||` + un-awaited `fetchSessions()` pattern; fixed both. The initial `getBook` effect in the book-load `useEffect` used `||` for rating; fixed. `handleChangeStatusFromModal` gained a `setSelectedRating(bookData.rating ?? null)` after status refresh so all four `bookData`-consuming handlers align on `??` and awaited session refetches. `grep "bookData.rating || null"` returns zero matches in `BookDetail.jsx`.

### Technical

#### Files Created
None. Session 10 is all modifications to existing files.

#### Files Modified
- `frontend/src/pages/DuplicatesPage.jsx` — `makeGroupKey()` helper (UUID + fallback); `scanForDuplicates` builds `groupsWithKeys` with `_key` and initializes selections by `_key`; added `setMerging({})` reset; `handleSelectionChange(groupKey, bookId)`; `handleMergeGroup(groupKey)` with `find(g => g._key === groupKey)` lookup and `drop()` cleanup across all five maps; JSX `key={group._key}`; all state lookups on `group._key`; confirmation row with pluralization + mobile-stacked layout; help text gated on `!mergeSuccess && !confirmingMerge && !merging`
- `frontend/src/components/BookDetail.jsx` — `showSessionDeleteConfirm` state; `closeSessionModal` clears it; `handleDeleteSession` split into opener + `handleConfirmDeleteSession` executor; session-editor Modal `onClose` and header X intercept when confirming (dismiss confirm, not modal); Modal.Body conditional renders confirmation view or form; Modal.Footer hidden during confirmation; MarkFinished/ChangeStatus error + saving state (`markFinishedError`/`markFinishedSaving`/`changeStatusError`/`changeStatusSaving`); parent handlers rewritten to close-on-success-only; modal render blocks pass `error` + `saving` props, `onClose` clears error; `await fetchSessions()` + `bookData.rating ?? null` sweep
- `frontend/src/components/MarkFinishedModal.jsx` — optional `error` + `saving` props; danger error banner at top of body; primary button `loading` + `disabled`; ghost Cancel disabled while saving; JSDoc updated
- `frontend/src/components/ChangeStatusModal.jsx` — same pattern as MarkFinishedModal; primary button adds `|| saving` to existing `disabled` condition; JSDoc updated

#### Files Verified, No Changes
- `frontend/src/components/UnifiedEditModal.jsx` — reference pattern for the session-delete confirmation view; not edited
- `mergeTitles`, `deleteSession`, `updateBookStatus`, `updateBookDates`, `updateBookRating`, `getBook`, `fetchSessions`, `findDuplicates` — API surface unchanged
- `Library.jsx`, `CollectionDetail.jsx`, `AuthorDetail.jsx` — still render `MarkFinishedModal`/`ChangeStatusModal` without `error`/`saving` props; new props are optional, call sites unaffected
- BookDetail merge modal (G3-10 already had confirmation; unchanged)
- No backend or frozen files modified

#### Requires Docker Rebuild
No. Frontend-only changes.

### Parked (not addressed in this session)

- **Reading session / status architecture cluster.** Four interdependent questions surfaced during Session 8 and Session 10 testing: (1) Status pill should probably be an inline dropdown, not a modal; (2) Status pill ↔ reading-session sync is one-way; (3) Is MarkFinished modal still necessary if every status change becomes a session? (4) `handleChangeStatusFromModal` (and its identical sibling in `Library.jsx`) unconditionally clears `date_finished`, wiping the finish date on Finished → Abandoned. All four are symptoms of the same unresolved architectural question: is the `Title` cache the source of truth with sessions as journal entries, or are sessions the source of truth with Title fields as a materialized view? A one-off fix to #4 would just move the drift elsewhere. Consolidated in Open Questions, scoped for a dedicated decision sprint after Session 11 ships. Not Session 10 scope.
- **ImportPage `StatusBadge` dual-keyed color map.** Still worth an hour of investigation before Session 11. Noted.
- **Desktop navigation.** Still no nav on desktop. Triaged separately.
- **G8-04: post-merge dimmed-group state in DuplicatesPage.** The 1.5s window where a merged group stays visible with a "Merged!" chip creates visual noise in batch processing. Separate audit finding, not Session 10 scope, flagged during testing.

---

## [0.46.0] - 2026-04-23

### Changed

#### Fix Session 9: Mobile-First Polish
Four fixes that remove desktop-oriented patterns and plug navigation gaps. The common thread: things that were invisible, confusing, or wasted screen space on mobile. Addresses audit findings G2-14, G5-10, G5-03, G7-01, G7-15.

**Edition badges display-only, "Remove Format" moved to 3-dot menu (G2-14):**
- Edition format badges on BookDetail are now pure display chips — the inline ✕ button (`opacity-0 group-hover:opacity-100`) is gone. That pattern was invisible on mobile and violated the page's established "all edits go through modals" architecture.
- New `Remove Format` menu item in the 3-dot menu, gated on `!isWishlist && book.editions.length > 1`. Tapping it opens an edition picker modal listing all formats with filename context. Selecting a format closes the picker and triggers the existing `editionToDelete` → confirmation modal → `handleDeleteEdition` flow. Zero changes to the delete logic itself.
- `showEditionPicker` state added. Picker buttons use `type="button"` to prevent accidental form submits.

**Checklist hint drops desktop language (G5-10):**
- CollectionDetail checklist instruction changed from "Long-press or right-click a book to mark it complete" to "Long-press a book to mark it complete." On a 95%-mobile app, "or right-click" is noise. Desktop users discover right-click without instruction.

**Collection banner cover capped at 200px (G5-03):**
- MosaicCover banner variant reduced from `h-96 md:h-[28rem]` (384px mobile / 448px desktop) to `h-[200px]` on both custom-image and gradient paths. The old height consumed the entire phone screen before any books were visible. Card and square variants unchanged.

**AddChoice gets back navigation and context (G7-01, G7-15):**
- AddPage's header config now returns `showBack: true` for MAIN_CHOICE, rendering "← Library" that navigates to `/`. All other screens keep "← Back" routing through `handleBack`. This follows AddPage's existing nav ownership pattern — AddChoice stays a content component like WishlistForm and ManualEntryForm.
- AddChoice gains a dynamic book count subtitle ("N titles and counting") via `listBooks({ limit: 1, acquisition: 'all' })`. Count includes both library and wishlist items. Graceful fallback: if the fetch fails, the subtitle is omitted and spacing preserved via a fixed `mb-8` placeholder.
- Initial implementation gave AddChoice its own `UnifiedNavBar` + `min-h-screen` wrapper, creating a nested page shell inside AddPage's `<main>`. Caught by Cursor review agent; fixed in a follow-up pass that moved nav ownership to AddPage and reverted AddChoice to content-only.

### Technical

#### Files Created
None. Session 9 is all modifications to existing files.

#### Files Modified
- `frontend/src/components/BookDetail.jsx` — Edition badges stripped of `group`, `gap-1`, `hoverX`, `canDelete`, and entire `IconButton` block; `showEditionPicker` state added; `Remove Format` menu item added after `Add Format`; edition picker modal added before existing delete confirmation modal
- `frontend/src/components/CollectionDetail.jsx` — Checklist hint text: removed "or right-click"
- `frontend/src/components/MosaicCover.jsx` — Banner variant (both custom and gradient paths): `h-96 md:h-[28rem]` → `h-[200px]`
- `frontend/src/components/add/AddChoice.jsx` — Removed `UnifiedNavBar`, `min-h-screen`, `bg-bg-base` wrapper; added `listBooks` import, `bookCount` state, dynamic subtitle with loading placeholder
- `frontend/src/pages/AddPage.jsx` — `getHeaderConfig()` MAIN_CHOICE returns `showBack: true`; `UnifiedNavBar` renders "← Library" with `navigate('/')` for MAIN_CHOICE, "← Back" with `handleBack` for all other screens

#### Files Verified, No Changes
- `editionToDelete` / `editionDeleting` state, `handleDeleteEdition` function, `deleteEdition` import, Delete Edition Confirmation Modal — all unchanged, reused by new 3-dot menu → picker → confirmation flow
- MosaicCover card and square variants — unchanged
- No backend or frozen files modified

#### Requires Docker Rebuild
No. Frontend-only changes.

---

## [0.45.0] - 2026-04-22

### Changed

#### Fix Session 8: Status Label + Voice/Tone Cleanup
Closed the gap left by Session 2.1 — status display strings that were still hardcoded in individual components now route through `useStatusLabels.getLabel()`, so custom labels from Settings propagate everywhere automatically. Reading-session UI (snake_case values) bridged to the hook via a local translation map. Microcopy warmed in two places, one technical-status footer removed entirely. Addresses audit findings G6-04, UF-10, G6-13, G5-14.

**Note on pre-audit findings already resolved:** G3-06 (`Paused indefinitely` default) and G4-04 (StatusLabelsModal default mismatch) were found to be already correct at session start — `useStatusLabels.DEFAULT_LABELS.Abandoned` already returned `'DNF'`, and `StatusLabelsModal.DEFAULTS.dnf` was already `'DNF'` with soft-guidance copy already present in the modal intro. No change needed; flagged in session audit before prompting to prevent double-fixing. Decisions.md was ahead of the code review.

**Title status — `getLabel()` applied to all remaining display surfaces (G6-04):**
- `FilterDrawer.jsx` — fanfic completion pill for backend `Abandoned` now uses `getLabel('Abandoned')`
- `Badge.jsx` — status dots route through `getLabel()` via `STATUS_BACKEND_KEY` map (Unread / In Progress / Finished / Abandoned)
- `ReadingStatusCard.jsx` — `finished` and `dnf` section headings use `getLabel('Finished')` / `getLabel('Abandoned')`
- `BookCard.jsx` — Finished overlay `title` attribute and DNF tooltip both use `getLabel()`
- `ImportPage.jsx` — `StatusBadge` renders `getLabel()`; color map supports both `DNF` and `Abandoned` keys as a defensive safety net
- `UnifiedEditModal.jsx` — completion `<option>` text for `In Progress` and `Abandoned` uses `getLabel()`; `value` attributes unchanged (backend canonical)
- `ManualEntryForm.jsx`, `WishlistForm.jsx` — fanfic completion `Abandoned` button label uses `getLabel()`

**Reading-session status — snake_case → title-case translation via local map (G6-04 follow-up):**
- `BookDetail.jsx` gained a module-level `SESSION_STATUS_TO_BACKEND` map: `{ in_progress: 'In Progress', finished: 'Finished', dnf: 'Abandoned' }`
- Edit Reading Session modal buttons previously rendered raw enum values (`in_progress`, `dnf`) — now render `getLabel(SESSION_STATUS_TO_BACKEND[value])`
- Reading History row chip on the Details tab had the same bug (out-of-scope flagged by Cursor in the follow-up pass, caught in user testing) — now uses the same translation
- Session status values saved to DB remain snake_case (`in_progress`, `finished`, `dnf`); only display text changed
- Harden: `getLabel(SESSION_STATUS_TO_BACKEND[session.session_status] || session.session_status)` — unknown values fall through to raw display instead of rendering a silent empty chip

**Already-hooked consumers verified, no re-migration needed:** BookCard (prior use), SeriesDetail, FilterDrawer, anywhere touched by Session 2.1.

**Non-display contexts deliberately left alone:** equality comparisons (`book.status === 'Abandoned'`), filter-payload arrays (`{ statuses: ['Abandoned', 'Finished'] }`), API request bodies, and object keys in backend-keyed maps. Backend canonical values (`Abandoned`, `In Progress`, `Finished`, `Unread` for titles; `in_progress`, `finished`, `dnf` for sessions) unchanged everywhere in state, payloads, and DB.

**Microcopy warmed (UF-10, G6-13):**
- `Add Story` → `Add to Library`: grep confirmed zero remaining instances at session start — already resolved in prior work (`AddPage.jsx`, `AddChoice.jsx`, `ManualEntryForm.jsx` all use "Add to Library"). Verified and documented, no edit required.
- `SearchModal.jsx`: `Search books...` → `Search your library…` (single-char ellipsis, matches rest of app's placeholder style). Scoped placeholders (`Search titles…`, `Search tags…`, `Search collections…`, `Search authors…`) deliberately left unchanged — only the generic surface swapped.

### Removed

- **End-of-list footer on collection pages (G5-14).** `All {totalBooks} books loaded` was system-state language rendered as content — minimalist design (NNG H8) says end-of-list is visually self-evident. Removed from `CollectionDetail.jsx` entirely: both the checklist branch (`totalBooks >= 20`) and the non-checklist infinite-scroll branch (`!hasMore && books.length >= 20`). No threshold, no fallback copy, no "That's the full list." The initial Session 8 plan called for a ≥20 threshold fallback; user review flagged that as unjustified — defending "why 20?" is harder than just removing the footer. `totalBooks` retained (still used elsewhere for header / sort messaging).

### Technical

#### Files Created
None. Session 8 is all modifications to existing files + one module-level const.

#### Files Modified
- `frontend/src/components/BookDetail.jsx` — `SESSION_STATUS_TO_BACKEND` const at module scope; reading-session edit modal buttons and Reading History row chip both route through `getLabel(SESSION_STATUS_TO_BACKEND[status])`
- `frontend/src/components/Badge.jsx` — status dots use `getLabel()` via `STATUS_BACKEND_KEY`
- `frontend/src/components/FilterDrawer.jsx` — fanfic completion pill uses `getLabel('Abandoned')`
- `frontend/src/components/ReadingStatusCard.jsx` — section headings use `getLabel('Finished')` / `getLabel('Abandoned')`
- `frontend/src/components/BookCard.jsx` — Finished overlay title + DNF tooltip use `getLabel()`
- `frontend/src/components/ImportPage.jsx` — `StatusBadge` uses `getLabel()`; color map dual-keyed
- `frontend/src/components/UnifiedEditModal.jsx` — completion option text uses `getLabel()`
- `frontend/src/components/add/ManualEntryForm.jsx` — abandoned button uses `getLabel('Abandoned')`
- `frontend/src/components/add/WishlistForm.jsx` — same
- `frontend/src/components/SearchModal.jsx` — placeholder swapped to `Search your library…`
- `frontend/src/components/CollectionDetail.jsx` — both end-of-list footer blocks removed; comment scrubbed so `books loaded` no longer appears in source

#### Files Verified, No Changes
- `frontend/src/hooks/useStatusLabels.js` — defaults already correct (`Abandoned: 'DNF'`)
- `frontend/src/components/settings/StatusLabelsModal.jsx` — default already correct (`dnf: 'DNF'`); soft-guidance copy already in intro
- `ChangeStatusModal.jsx` — already uses its own `labels` source, correctly
- `CriteriaBuilder.jsx` — builds labels from settings for smart lists, correctly
- `Library.jsx` — `statuses` prop correctly passes API values, not display strings
- `AddPage.jsx`, `AddChoice.jsx`, `ManualEntryForm.jsx` — "Add Story" grep returned zero; already use "Add to Library"

#### Requires Docker Rebuild
No. Frontend-only changes.

### Parked (not addressed in this session)

- **BookDetail status pill redesign (`Reading` block in metadata grid).** The current `ChangeStatusModal` flow is multi-line and multi-button — overkill for a single-value change. Proposed alternative: make the status block (under title/author/year) a tappable dropdown directly, alongside the existing tappable category block. NNG H7 (flexibility) + fewer taps. Not addressed here — reopens a Session 3 locked decision ("Status pill opens ChangeStatusModal") and requires a fresh decision sprint. Logged in Open Questions.
- **Status pill ↔ reading-session one-way sync.** Changing status from the BookDetail status area does not create or update a reading session, but editing the most recent reading session's status does update the pill. Data-model work, not microcopy. Should be decided together with the pill redesign above — they're the same feature. Logged in Open Questions.
- **ImportPage `StatusBadge` dual-keyed color map.** Color map supports both `DNF` and `Abandoned` as keys. Backend canonical is `Abandoned`; the `DNF` key is either a defensive safety net against an upstream rendering bug, or dead code. Worth an hour of investigation before Session 11's final audit — not blocking.
- **Desktop navigation.** Desktop rendering has no navigation affordance (cannot move between pages). Surfaced during Session 8 testing; not an S8 finding. Triage separately.

---

## [0.44.0] - 2026-04-19

### Added

#### Fix Session 6: Search and Sort Everywhere
Two independent tracks landed in one release: (A) author pages gained a sort dropdown with default series grouping; (B) collection pickers and large collection detail pages gained search. The `SortDropdown` primitive also picked up a left-side sort icon so it reads as a sort control at a glance, everywhere it's used. Addresses audit findings UF-21, UF-30, UF-31, G3-08, G5-13.

**Track A — Author sort + series grouping:**
- `AuthorDetail.jsx` gains a `<SortDropdown>` beside the Grid/List toggle with four options: `Series` (default), `Title A-Z`, `Recently Added`, `Year Published`. Sort choice persists to `localStorage` under `liminal-author-sort`.
- When sort is `Series`, books are grouped by series with tappable section headers rendered as `Series: {name} · N titles` with a right chevron. Tap a header → navigates to `/series/{encodeURIComponent(name)}` with `returnUrl` state so back returns to the author page.
- Within a series, books sort by `series_number` (parseFloat, NaN entries sort to end). Standalone books appear below all series in a `Standalone · N titles` section, alphabetized by title.
- Grid view displays a `#N` badge overlay (top-left, `bg-bg-base/85` + backdrop blur) on each series book. List view omits the badge — the series group header provides context.
- Selecting any non-`series` sort flattens groups into a single grid/list.
- Controls row uses `flex-wrap gap-2` so SortDropdown + Grid/List toggle wrap cleanly on narrow mobile.

**Track A — `SortDropdown` primitive enhancement:**
- New `SortIcon` component (small, bi-directional arrows) prepended to the trigger button: `[sort icon] [label] [chevron]`. Every consumer (Library, CollectionDetail, AuthorDetail) inherits the change — sort controls are now immediately recognizable as sort controls. Addresses a minor discoverability gap flagged during Session 6 decisions.
- `series` added as the first entry in `SORT_OPTIONS` with `Grouped`/`Grouped` direction labels (direction is semantically irrelevant for series grouping). `DesktopDropdown` and `MobileBottomSheet` render paths unchanged.

**Track A — Backend `authors.py`:**
- `AuthorBookItem` Pydantic model extended with `date_added: Optional[str] = None`.
- `get_author` SELECT now includes `created_at` from the `titles` table. There is no `date_added` column on `titles` — `created_at` is the canonical "when did this enter the library" field; the `AuthorBookItem` JSON field name stays `date_added` for frontend consistency.
- `AuthorBookItem(...)` constructor passes `date_added=book.get('created_at')`.

**Track B — CollectionPicker search + inline create (UF-21, G3-08):**
- `CollectionPicker.jsx` gains a `<SearchInput>` at the top of the list. Collections render alphabetized (case-insensitive `localeCompare` with `sensitivity: 'base'`), filtered client-side by trimmed lowercase name match.
- Empty-state copy distinguishes "no collections yet" from "no match for '{query}'".
- Dashed `+ New Collection` footer button (44px minimum touch target, `border-dashed border-border-default`) opens `CollectionModal` stacked on top of the picker.
- On successful creation: the new collection auto-pre-selects (book is added via `addBooksToCollection`), the picker list reloads with the new entry in its alphabetical slot, and the checkbox is already checked. `onUpdate` fires on both success and error paths so the parent `BookDetail` page always reflects current state.
- If the API returns no `id` (shouldn't happen — defensive): fall back to list reload only, still call `onUpdate`.

**Track B — `CollectionModal` contract (minor, additive):**
- `handleSubmit` now captures the return value of `createCollection` / `updateCollection` into a local `result` and calls `onSuccess(result)`. Existing callers in `CollectionsTab.jsx` and `CollectionDetail.jsx` ignore the new positional arg — backward compatible.
- Both `createCollection` and `updateCollection` in `api.js` already `return response.json()`, so `result` is the full collection object including `id`.

**Track B — CollectionDetail search (G5-13):**
- `CollectionDetail.jsx` gains a `<SearchInput>` between the book-count row and the Grid/List toggle. Filter is client-side on title + any author substring match (case-insensitive, trimmed).
- Placeholder: `Search this collection...`.
- `SortableContext items={...}` in reorder mode always uses the full, unfiltered book array to preserve DnD integrity — the filter applies only to the `.map(...)` rendering book cards.
- `All {totalBooks} books loaded` footer is hidden when a search query is active (inaccurate message against a filtered view; wording rewrite deferred to Session 8 per Decisions.md).

### Changed

- **Search input placement in CollectionDetail (design iteration during testing):** The locked Session 6 decision was to show search only on collections with 15+ books. Testing revealed this was confusing in practice — users would open a small collection, miss the search that wasn't there, and wonder why the behavior changed. Also repositioned from a standalone row above the book count to share a row with the Grid/List toggle. Final state: search is always visible on all collection types, sits on the same row as the Grid/List toggle with `flex-1 min-w-0` sizing, and is hidden only in reorder mode.

### Fixed

- **CollectionPicker: missing parent notification on creation error paths.** The `handleNewCollectionSuccess` callback only called `onUpdate()` on the happy path. If `createCollection` returned without an id, or if `addBooksToCollection` threw, the parent `BookDetail` page never got told its collection landscape had changed. Both error branches now call `onUpdate()` after `loadCollections()`. Caught by Cursor review agent.
- **CollectionDetail: `SortableContext` drift when entering reorder with an active search.** The search input is hidden when reorder mode activates, but `searchQuery` state stays populated — the filtered `.map(...)` would render fewer DOM elements than `SortableContext`'s `items` prop, breaking DnD. Entering reorder mode now clears `searchQuery` and saves the previous value to `preReorderSearchQuery`. Caught by Cursor review agent.
- **CollectionDetail: search query lost after reorder.** Follow-up to the above fix: entering reorder cleared the query, but exiting didn't restore it. Mirroring the existing `preReorderViewMode` save/restore pattern, both exit paths (3-dot menu toggle and the reorder banner's Done button) now restore `searchQuery` from `preReorderSearchQuery` and clear the save slot. Caught by Cursor review agent.

### Technical

#### Files Created
None. Session 6 is all modifications to existing files.

#### Files Modified
- `backend/routers/authors.py` — `AuthorBookItem.date_added` field, SELECT includes `created_at`, constructor maps `date_added=book.get('created_at')`
- `frontend/src/components/SortDropdown.jsx` — `SortIcon` component, `series` option in `SORT_OPTIONS`, icon prepended to trigger button
- `frontend/src/components/AuthorDetail.jsx` — `SortDropdown` import, `readAuthorSort()` helper, `sortField`/`sortDir`/`handleSortChange` state, `renderBooksSection()` with series grouping and flat-sort branches, `#N` grid badge overlay
- `frontend/src/components/CollectionModal.jsx` — `handleSubmit` captures API result, `onSuccess(result)` passes the created/updated collection
- `frontend/src/components/CollectionPicker.jsx` — `useMemo`, `SearchInput`, `CollectionModal`, `AddIcon` imports; `searchQuery` + `showCreateModal` state; `visibleCollections` memo (alphabetical + filtered); `handleNewCollectionSuccess` handler; dashed `+ New Collection` footer; nested `CollectionModal` stacking
- `frontend/src/components/CollectionDetail.jsx` — `SearchInput` import; `searchQuery` + `preReorderSearchQuery` state; `filterBySearch` helper; search input positioned in controls row beside Grid/List toggle; reorder-mode entry clears and saves search, exit restores; `All N books loaded` footer gated on `!searchQuery`

#### Requires Docker Rebuild
Yes. Backend change on `authors.py` (`AuthorBookItem.date_added` field + SELECT column addition).

### Parked (not addressed in this session)
- **Large-collection search only filters loaded books.** For a 408-book automatic collection like Reading History, client-side search narrows the currently-paginated set. Books not yet loaded via infinite scroll aren't searchable until the user scrolls them in. Acceptable trade-off for Session 6 scope — server-side search would require a backend endpoint change and a new API surface. Revisit if this causes real friction.
- **Backend `date_added` column rename.** `titles` stores `created_at`, not `date_added`. Frontend requests `date_added` from the author endpoint — the name mismatch is intentional compatibility bridging. A broader schema alignment (either rename the column or rename the API field) is out of Session 6 scope.
- **"All N books loaded" end-of-list wording.** The message reads like a technical status. Flagged by audit finding G5-14, scoped for Session 8 (Status Label + Voice/Tone) — not rewritten here.

---

## [0.43.0] - 2026-04-19

### Added

#### Fix Session 7: Settings Consolidation
Killed the 5-screen `SettingsDrawer` overlay and rebuilt `/settings` as a proper goal-grouped page. The bottom-nav Settings tab (previously a placeholder dead end) is now the primary entry point; desktop `Header` keeps a persistent top-right NavLink. All settings action buttons unified under primary teal — no more four-color rainbow. Addresses audit findings G1-11, G6-08, G1-07, and G6-09.

**New Settings page layout** (`pages/Settings.jsx`) — four sections, grouped by user goal per NNG H4:
- **Appearance** — Books per row (segmented 2/3/4), Card style (segmented Compact/Standard), Status Labels (preview + Edit), Rating Labels (preview + Edit)
- **Reading** — Reading Speed (WPM input with blur-save, 50-2000 clamp, leading-zero normalization)
- **Library Tools** — Sync Library, Find Duplicates, Rescan Metadata, Extract Covers (all single-purpose primary-teal actions with one-line descriptions)
- **Backups** — Automated backups toggle, Schedule select + daily time, Backup location (inline test + save), Retention (preview + Edit), stats card (last backup / storage / total), Create backup now button

**Five sub-modals lift fussy editors and multi-step actions out of the page flow:**
- `StatusLabelsModal` — blur-saves each of four status labels with default-on-empty reset; dispatches `CustomEvent('settingsChanged', { detail: { statusLabels } })`
- `RatingLabelsModal` — same pattern for five rating labels
- `BackupRetentionModal` — three number inputs (daily/weekly/monthly) with min/max clamps, explicit Save + Cancel, error banner on load failure
- `RescanMetadataModal` — preview stats → confirm → run → results breakdown in one modal, with inline error handling
- `ExtractCoversModal` — Fiction / Non-Fiction category checkboxes → run → results breakdown

**New shared primitive:** `components/settings/SettingsRow.jsx` — single row component with three modes (`navigation`, `toggle`, `display`), 56px minimum height, optional value/description/loading props, chevron-right for navigation, token-styled toggle switch.

**Gear icon removed from `Library.jsx`** — `SettingsDrawer` import, `SettingsGearIcon` component, `settingsDrawerOpen` state, and the gear `IconButton` inside `UnifiedNavBar` all deleted. Nav reduces to `<UnifiedNavBar title={libraryNavTitle} />`. `SeriesDetail.jsx` confirmed gear-free on review — no changes needed there.

**Desktop `Header.jsx` settings control** converted from drawer-opener to `NavLink to="/settings"` — mobile uses bottom nav, desktop uses Header NavLink, both route to the same page. One destination, two platform-appropriate entry points. Consistent with the 2026-03-28 decision that kept the desktop settings affordance separate from mobile.

**`SettingsDrawer.jsx` deleted** — project-wide grep for `SettingsDrawer` and `SettingsGearIcon` returns zero results.

### Changed

- All settings action buttons use `variant="primary"` (teal). No more orange/amber/sage/purple variants — G6-09 resolved.
- `useGridColumns.js` and `useStatusLabels.js` doc comments updated to reference the Settings page + modals as the event source (was `SettingsDrawer`). No behavior change.

### Fixed

- **Silent backup-load failure loop:** when `getBackupSettings()` failed, the catch block only logged to console and `backupSettings` stayed `null`, leaving the UI permanently at "Loading backup settings…" with no error visible. Added `backupError` state, set on catch, rendered as a `bg-action-danger/10` banner with a "Try again" ghost button that re-runs `loadBackupSettings`. NNG H1 (visibility of system status). Caught by Cursor review agent.
- **WPM early-return short-circuit broken by type mismatch:** `handleWpmBlur` compared `finalValue` (always a string) to `settings.reading_wpm` (arrives as a number from the API), so the `===` check never matched and saved unnecessarily on every blur. Fixed by normalizing with `String(settings.reading_wpm ?? '')`. Caught by Cursor review agent.
- **WPM leading-zero round-trip:** typing `0250` passed clamp validation untouched and would have persisted as the literal string `"0250"`. `handleWpmBlur` now normalizes valid inputs through `String(parseInt(...))`, stripping leading zeros before save. Bundled into the type-mismatch fix.
- **Plain `Event` dispatches would have crashed `useGridColumns`:** `RatingLabelsModal` and `BackupRetentionModal` dispatched `new Event('settingsChanged')` with no `detail`, while `useGridColumns` accessed `event.detail.grid_columns` directly (no optional chaining). First grid column change after editing a rating/retention would have thrown `TypeError: Cannot read properties of undefined`. Defense-in-depth fix: both modals now dispatch `new CustomEvent('settingsChanged', { detail: { ... } })`, and `useGridColumns` gained optional chaining (`event.detail?.grid_columns`). Project-wide grep for `new Event('settingsChanged')` returns zero results. Caught by Cursor review agent.
- **Grid columns default drift:** `Settings.jsx` initialized `gridColumns` to `'2'` while `useGridColumns` defaults to `'3'`, so a first-time user with no `grid_columns` setting in the DB would have seen the Settings UI show 2-column selected while the app rendered 3 columns. Settings.jsx now initializes to `'3'`, matching the hook. API-loaded value still overrides the default as before. Caught by Cursor review agent.

### Removed

- `frontend/src/components/SettingsDrawer.jsx` — full 5-screen drawer implementation.
- `SettingsGearIcon` component and `settingsDrawerOpen` state from `Library.jsx`.

### Technical

#### Files Created
- `frontend/src/components/settings/SettingsRow.jsx` — NEW primitive (navigation/toggle/display modes)
- `frontend/src/components/settings/StatusLabelsModal.jsx`
- `frontend/src/components/settings/RatingLabelsModal.jsx`
- `frontend/src/components/settings/BackupRetentionModal.jsx`
- `frontend/src/components/settings/RescanMetadataModal.jsx`
- `frontend/src/components/settings/ExtractCoversModal.jsx`

#### Files Modified
- `frontend/src/pages/Settings.jsx` — full rewrite from placeholder
- `frontend/src/components/Library.jsx` — gear / drawer removal
- `frontend/src/components/Header.jsx` — desktop settings control → NavLink
- `frontend/src/hooks/useGridColumns.js` — optional chaining + doc comment update
- `frontend/src/hooks/useStatusLabels.js` — doc comment update only

#### Files Deleted
- `frontend/src/components/SettingsDrawer.jsx`

#### Requires Docker Rebuild
No. Frontend-only changes; backup/sync/rescan/extract endpoints unchanged.

### Parked (not addressed in this session)
- **Manual `loadBackupSettings` refresh on retention modal close:** current implementation calls `loadBackupSettings` from the modal's `onClose`. If the save succeeds but the close is skipped (e.g. navigate away), stats won't refresh. Acceptable trade-off; user returns to Settings and sees current state.
- **Test button → Save button workflow for backup path:** path must be manually saved after a successful Test — no auto-save on Test success. Kept deliberate to avoid committing a path without the user's intent.

---

## [0.42.0] - 2026-04-18

### Changed

#### Fix Session 5: Form Input Guards
Eliminated silent data loss and reduced friction across category, author, date, format, and rating inputs. Two new reusable primitives extracted; three form consumers and the session editor modal migrated. Addresses audit findings UF-11, UF-07, UF-12, UF-03, G3-07.

**Author fields standardized (UF-11):**
- Killed the ad-hoc chip + Enter-to-commit pattern in WishlistForm and ManualEntryForm
- All three author-entry surfaces (UnifiedEditModal, WishlistForm, ManualEntryForm) now use a single `<AuthorInput>` primitive: plain text input with comma separation, shared autocomplete
- "Press Enter to add" is gone; save always commits whatever is in the field
- UnifiedEditModal previously had no author autocomplete — now does, for consistency

**Category selector is a segmented control (UF-12):**
- Replaced `<select>` dropdowns with a new `<SegmentedControl>` primitive in all three forms
- Four options visible at once: Uncategorized / Fiction / Non-Fiction / FanFiction
- 11px text (`size="sm"`) fits the row on mobile widths
- WishlistForm and ManualEntryForm now default to `'Uncategorized'` (was `'FanFiction'`) — honest "I don't know" beats a confident wrong default; gives a natural triage workflow via filter-by-Uncategorized

**New reading session smart defaults (UF-07):**
- `date_started` pre-filled with today's date (user still has a calendar picker for backdating)
- `format` pre-selected to `'ebook'` (matches the library composition; still editable)
- Common path: zero taps to log a session starting today in the default format

**Rating visibility fixed (UF-03, G3-07):**
- StarRating component + label + help text are hidden entirely when session status is In Progress — no more disabled/grayed stars as a false affordance
- Renders only when status is Finished or DNF
- Rating value preserved across status toggles (pick 4 stars on Finished → flip to In Progress and back → 4 stars still there)

### Added

- **`frontend/src/components/ui/SegmentedControl.jsx`** — NEW primitive. `role="group"`, `aria-pressed` on each option, `size` prop (`sm` for dense 4-option rows at 11px, `md` for default at text-body-sm). 44px total touch target (40px button inside 44px container). Full labels, no truncation, `flex-1` width distribution.
- **`frontend/src/components/ui/AuthorInput.jsx`** — NEW primitive. Single-line text input for comma-separated authors with built-in autocomplete. Fetches `listAuthors()` once on mount and caches client-side. Debounced (150ms) suggestion filter on the last comma-delimited fragment. Committed names excluded from suggestions. Suggestions sorted starts-with first, then alphabetical, capped at 8. `onMouseDown` + `preventDefault` on suggestion buttons prevents input blur before the click registers. Dropdown `z-[70]` works in both modal and page contexts.

### Fixed

- **`WishlistForm` / `ManualEntryForm` validate() falsely accepted comma-only strings:** strings like `", , "` passed the simple `.trim()` check, then split to `[]`, producing a silent-failure submit. Both validators now mirror the submit logic — split by comma, trim, filter empty, require `length > 0`. Caught by Cursor review agent.
- **`openAddSession` introduced invalid `rating: 0` default:** the Session 5 prompt wrote `rating: 0`, but the API validator only accepts `1-5` or `null`. Would have thrown 422 on any Finished/DNF session saved without tapping a star. Restored to `rating: null`. `StarRating` already treats null as "no rating set" (shows 0 lit stars, clickable). Caught by Cursor review agent.

### Technical
- Files created: `frontend/src/components/ui/SegmentedControl.jsx`, `frontend/src/components/ui/AuthorInput.jsx`
- Files modified: `frontend/src/components/UnifiedEditModal.jsx`, `frontend/src/components/add/WishlistForm.jsx`, `frontend/src/components/add/ManualEntryForm.jsx`, `frontend/src/components/BookDetail.jsx`
- Frontend only — no Docker rebuild required.
- `listAuthors` import moved from the two forms into `AuthorInput`; `useRef` removed from forms where no longer referenced.
- `selectClasses` constant in UnifiedEditModal preserved — still used by Pairing Type, Completion Status, Content Rating, Warnings selects.
- Priority segmented (WishlistForm), Format segmented (ManualEntryForm), Completion Status segmented (both), and Status segmented (BookDetail session modal) deliberately left as their existing Button-based pseudo-segmented patterns — out of Session 5 scope.

### Parked (not addressed in this session)
- **AuthorInput cursor-mid-string limitation:** if the user positions their cursor mid-string and types, fragment detection still reads the last comma-delimited segment. Matches `SearchableInput` behavior. Most users edit author lists at end; defer unless this causes real friction.
- **Optional: show full author list on empty focus:** currently the dropdown only opens after typing. "Show me what's available" preview could help discoverability but risks noise. Revisit if testing surfaces the need.

---

## [0.41.0] - 2026-04-18

### Changed

#### Fix Session 4: Edit Modal Reorganization
Restructured UnifiedEditModal from a three-tab layout into a single scrollable form with labeled section dividers. Addresses audit findings UF-25, UF-26, UF-27, G3-02, G3-03.

**Tabs killed.** `activeTab` state, `tabs` array, `showMetadataTab` flag, and `tabBtn` helper removed. No more tab navigation UI — users scroll through one continuous form.

**Three labeled sections:**
- **Identity** — Title, Author(s), Series + Number, Year, Source URL
- **Classification** (divider above) — Category, Tags, Pairing Type (conditional on Fiction/FanFiction), Summary / "Why this one?"
- **Fandom Details** (conditional on FanFiction + non-wishlist) — Completion Status, Fandom, Ships, Content Rating, Warnings. Wrapped in a subtle teal-tinted card (`bg-action-primary/5` + `border-action-primary/20`) to visually group the fandom-only fields.

**Category now lives in Classification** alongside Tags, fixing UF-26 (previously split across Details and About tabs).

### Added

- **Scroll reset on open (G3-02):** `bodyRef` + `requestAnimationFrame` sets `scrollTop = 0` when modal opens. No more mid-form start position.
- **Unsaved changes guard (G3-03):** dirty-flag comparison via `JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current)`. When the user attempts to close (Cancel / X / backdrop / Escape) with unsaved edits, the form body is replaced by a centered confirmation view — "Discard unsaved changes?" with Keep Editing (ghost) and Discard (danger) buttons. Keep Editing restores the form and scroll position via `savedScrollTopRef`. Footer hidden during confirmation. While confirmation is showing, X/backdrop/Escape behave as Keep Editing (no double-loss).
- `initialFormDataRef` refreshed after successful save, so edit → save → edit again → Cancel correctly re-triggers confirmation.

### Technical
- Files modified: `frontend/src/components/UnifiedEditModal.jsx`, `.cursorrules` (description updated from "Tabbed edit modal" to "Single-scroll edit modal with section dividers")
- Frontend only — no Docker rebuild required.
- `Button` component supports `variant="danger"` natively; no className fallback needed.

### Parked (not addressed in this session)
- **Book prop change during editing:** if the parent re-renders the modal with a different `book` prop while `isOpen` is true, the initialization `useEffect` resets `formData` and silently discards in-progress edits. This is pre-existing behavior inherited from the tabbed version, not a Session 4 regression. No current flow triggers it (BookDetail does not refetch or swap `book` while the modal is open). Defer until a refetch/polling mechanism makes the failure mode reachable.

---

## [0.40.0] - 2026-04-18

### Added

#### Fix Session 3: BookDetail Action Architecture
Structural rework of the most-visited page. Actions moved from the buried 3-dot menu into the primary flow; metadata blocks became actionable; wishlist acquire CTA hoisted above the fold. Addresses audit findings UF-01, UF-02, UF-05, UF-06, UF-20, UF-24, G2-11, G2-12.

**ReadingStatusCard action surface:**
- New props: `onMarkFinished`, `onChangeStatus`, `onAcquire`, `isWishlist`
- Inline "Mark Finished" primary button + "Status ▾" secondary when status ∈ {unread, not_prioritized, in_progress}
- Inline "I Got This Book!" button when `isWishlist && onAcquire`
- Outer card wraps the existing icon/label/subtitle row plus the new action row; download/edit affordances on the inner row unchanged

**BookDetail modal wiring (reuses Library.jsx pattern):**
- `MarkFinishedModal` and `ChangeStatusModal` now triggered from BookDetail
- `handleMarkFinishedConfirm`: updates status to Finished, optionally sets `date_finished` and `rating`, then refreshes book + sessions
- `handleChangeStatusFromModal`: updates status, clears `date_finished`, refreshes book + sessions
- Status pill (hero metadata) opens `ChangeStatusModal` instead of scrolling to history
- Category pill opens `UnifiedEditModal` (user scrolls to Classification section)

**Inline section actions (pencil icons, stroke `#5c5752`, 36px hit target):**
- Notes section → opens note editor (replaces previous `IconButton` edit control; save/error status stays on the right)
- Reading History section (mobile + desktop headers) → `openAddSession()`
- Collections section → opens `CollectionPicker`

**Wishlist layout:**
- `ReadingStatusCard` with `isWishlist` and `onAcquire` now sits above the fold, directly under the book header
- Duplicate "I Got This Book!" block removed from the bottom of the TBR card — single acquire CTA lives in the card above the fold

### Changed

**Hero metadata as text links (not chips):**
- Author names: plain teal links (`text-action-primary hover:underline`), still route to `/author/:name`
- Hero series line: same treatment, still routes to `/series/:name`
- Read time + category: `bg-bg-surface`, `rounded-lg`, `border` stripped — flat metadata
- Status + rating pills: card styling preserved (still the only interactive pills)

**Collections rendering:**
- Replaced chip-style boxes (`px-3 py-1.5 bg-bg-surface rounded-full border` + hamburger SVG) with plain teal text links in a `flex flex-wrap gap-x-4 gap-y-1` row
- Navigation now client-side via React Router `<Link>` (was `<a href>`)
- Route corrected to `/collections/:id` (matches `App.jsx` routing; prompt's original `/collection/:id` would 404)

### Fixed

- **Misleading Reading History pencil labels (a11y):** Both pencil buttons (mobile + desktop) had `title="Edit"` despite opening the Add Session flow. Now `title="Add reading session"` with matching `aria-label`.
- **Raw `tbr_priority` values in wishlist subtitle:** `ReadingStatusCard` subtitle rendered "Priority: high" / "Priority: normal". Now humanized to "High priority" / "Normal priority" / "Low priority". Still `null` when `tbr_priority` is absent.

### Technical
- Files modified: `frontend/src/components/BookDetail.jsx`, `frontend/src/components/ReadingStatusCard.jsx`
- Frontend only — no Docker rebuild required.
- Pencil stroke color (`#5c5752`) is a deliberate hardcoded override per locked Session 3 decision (2026-04-13); `.cursorrules` token-preference flag is expected for these specific instances.

### Parked (not addressed in this session)
- **Modal-closes-on-failure UX** for both `MarkFinishedModal` and `ChangeStatusModal`: matches `Library.jsx` pattern. Deferred to Session 10 (Destructive Action Guards) for consistent treatment across all modal error paths.
- **`handleChangeStatusFromModal` always clears `date_finished`:** identical to `Library.jsx`. If this is a bug, it's a bug in both places — not a Session 3 scope item.

---

## [0.39.1] - 2026-04-02

### Fixed

#### Post-Session-2 Visual & Interaction Bugs
Three issues found during visual testing after v0.39.0 shipped.

- **WishlistCard dotted border removed:** `GradientCover` in WishlistCard had `border-2 border-dashed border-border-default`, giving wishlist covers a dashed outline that BookCard grid covers don't have. Removed.
- **WishlistCard priority badge oversized:** "High" badge was `text-caption` with `px-2` padding — visually heavy on small covers. Shrunk to `text-[0.625rem]` with `px-1.5` and tighter positioning (`top-1.5 left-1.5`), now proportional to author text on covers.
- **Collection remove bar hidden behind BottomNav:** Bottom bar was `z-30`, BottomNav is `z-40`. Bar was invisible on mobile. Bumped to `z-50`.
- **Long-press context menu missing on grid views:** `onLongPress` handlers (contextmenu, touch timer) were only wired on the list variant. Added same handlers to the grid variant's outer div. Browse and Author grid cards now open the context menu on long-press.

### Technical
- Files modified: `WishlistTab.jsx`, `CollectionDetail.jsx`, `BookCard.jsx`
- Frontend only — no Docker rebuild required.

---

## [0.39.0] - 2026-04-01

### Added

#### Fix Session 2: Cards, Grids, and Context Menus
Comprehensive card system overhaul, per-page view preferences, shared status modals, long-press context menus, and batch collection management. Twelve Cursor prompts across two sub-sessions (2.1 and 2.2).

**New shared components:**
- `MarkFinishedModal.jsx` -- Date picker + optional rating, extracted from CollectionDetail and now shared across Library, AuthorDetail, CollectionDetail
- `ChangeStatusModal.jsx` -- Status dropdown via `useStatusLabels()`, same sharing pattern
- `BookContextMenu.jsx` -- Floating menu on long-press/right-click with "Mark Finished" and "Update Status" actions

**Long-press context menu (Library, AuthorDetail, CollectionDetail):**
- BookCard list rows support `onLongPress(book, {x, y})` via 500ms touch timer + right-click
- Opens BookContextMenu at touch/click coordinates
- Mark Finished and Change Status actions update local state without page reload

**Batch remove mode (CollectionDetail):**
- Select-then-confirm pattern replaces single-tap instant delete
- "Select titles to remove" banner with multi-select toggles
- Fixed bottom bar with Cancel and Remove N button (disabled when nothing selected)
- Safe area inset padding for home indicator
- Check badge overlay on selected items in both grid and list views

**WishlistCard compact/standard awareness:**
- Compact: cover-only with priority badge (top-left) and wishlist bookmark (top-right)
- Standard: cover row plus italic "why this one" note when present, no duplicate title/author
- Responds to global `liminal-grid-variant` setting via `settingsChanged` event

**Inline Grid/List toggle (CollectionsTab, CollectionDetail):**
- Moved out of overflow menu into visible toolbar (NNG Heuristic #4: consistency)
- Per-page localStorage keys: `liminal-view-collections`, `liminal-view-collection-detail`

**Backend: `finished_count` on series list endpoint:**
- `SeriesSummary` Pydantic model gains `finished_count` field
- SQL subquery in `list_series` uses `SUM(CASE WHEN status = 'Finished')` (replaces misaligned `books_read` alias)
- Both `books_read` and `finished_count` populated from same value for backward compatibility

### Changed

**BookCard overhaul (Prompts 1, 3, 7, 10):**
- Checklist completed dimming: `opacity-45` to `opacity-75` (better readability while still visually distinct)
- `linkTo` prop (default `/book/{id}`, `null` for div wrapper) and `onClick` prop for universal use
- `onLongPress` prop for context menu integration (list variant only)
- List thumbnails: 64x96px (up from 44x66)
- Status badges: solid `bg-bg-base/65` scrim
- Custom status labels via `useStatusLabels` hook

**SeriesCard rewrite:**
- Warm fallback gradients (`#8a6e5e` to `#5e7a6e`, replacing cold indigo `#667eea`/`#764ba2`)
- Compact: top-right count badge, first author on cover bottom, no external text
- List: 64x96 thumbnail consistent with BookCard

**GradientCover title (frozen file unlock, font size only):**
- `.875rem` to `1rem` (16px), `line-clamp-3` to `line-clamp-4`, `lineHeight` to `1.2`

**View preference restructure:**
- Per-page localStorage keys: `liminal-view-browse`, `liminal-view-series`, `liminal-view-author`
- Compact/Standard toggle removed from toolbar, moved to SettingsDrawer as "Grid card style"
- Global `liminal-grid-variant` key, dispatched via `settingsChanged` event

**CollectionDetail completed section:**
- Wrapped in `bg-bg-surface` container with border and rounded corners (visual grouping)
- "Completed * N" caption inside the card

**CollectionCard:**
- `CollectionIcon` removed from grid and list views (zero imports remain)

**SeriesDetail:**
- DNF label uses `getLabel('Abandoned')` from `useStatusLabels` hook (respects custom labels)

### Fixed
- **DNF status filter silently returned zero results:** FilterDrawer and Library passed `'DNF'` as the status value to the API, but the database stores `'Abandoned'`. Changed both `statuses` arrays to use `'Abandoned'`; `getLabel('Abandoned')` already handles display. Filter now correctly returns abandoned books.
- **Series cards showed 0 finished count:** The SQL subquery exposed `books_read` but `SeriesCard` read `finished_count`. Added `finished_count` alias to the query and Pydantic model.
- **CollectionDetail inline modals replaced with shared components:** Removed local `MarkFinishedModal`/`ChangeStatusModal` definitions and unused `CheckCircleIcon`/`UndoIcon`; imports shared versions.
- **Old view preference keys orphaned:** `liminal-view-preference` (global), `collections_view_mode`, `collection_detail_view_mode` no longer read. Users may need to re-select Grid/List once.

### Technical

#### New Files
- `frontend/src/hooks/useStatusLabels.js` -- Shared hook: `{ labels, getLabel, getStatusOptions }`
- `frontend/src/components/MarkFinishedModal.jsx`
- `frontend/src/components/ChangeStatusModal.jsx`
- `frontend/src/components/BookContextMenu.jsx`

#### Files Modified
- `backend/routers/titles.py` -- `SeriesSummary` model + `list_series` SQL (finished_count)
- `frontend/src/components/BookCard.jsx` -- Full rewrite: variants, 64x96, linkTo/onClick, onLongPress, opacity-75
- `frontend/src/components/SeriesCard.jsx` -- Full rewrite: warm gradients, compact redesign
- `frontend/src/components/GradientCover.jsx` -- Title font size only (frozen file)
- `frontend/src/components/Library.jsx` -- Per-page view keys, gridVariant, long-press wiring, shared modals, status filter fix
- `frontend/src/components/AuthorDetail.jsx` -- Per-page view key, gridVariant, long-press wiring, shared modals
- `frontend/src/components/CollectionDetail.jsx` -- Completed container, inline toggle, shared modals, batch remove, BookCard adoption
- `frontend/src/components/CollectionsTab.jsx` -- Inline toggle, per-page key
- `frontend/src/components/WishlistTab.jsx` -- WishlistCard compact/standard, gridVariant listener
- `frontend/src/components/HomeTab.jsx` -- variant="compact" + wpm
- `frontend/src/components/SettingsDrawer.jsx` -- Grid card style section, statusLabel event dispatch
- `frontend/src/components/FilterDrawer.jsx` -- Status filter fix (DNF to Abandoned)
- `frontend/src/components/SeriesDetail.jsx` -- useStatusLabels for DNF label
- `frontend/src/components/CollectionCard.jsx` -- CollectionIcon removed
- `frontend/tailwind.config.js` -- text-muted token value

#### Requires Docker Rebuild
Backend change to `titles.py` (finished_count on series endpoint).

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
