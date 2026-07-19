# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.71.0] — 2026-07-19

### Fixed
- **Replace file completes and reports truthfully — the failure string was real, not cosmetic (diagnosis verdict: real masked failure).** Root cause, proven by rebuilding the harness DB with the real `init_db` schema: **`editions` has no `file_size` column** — edition sizes are stat'd at read time by the GET serializer (stale paths → null, never an exception; the `file_size INTEGER` in database.py belongs to `backup_history`). The v0.70.0 endpoint's row update wrote that phantom column, so SQLite raised `OperationalError` AFTER the trash and land steps had both succeeded — every swap fired the post-trash failure string, and same-name swaps masked the never-updated row because it already pointed at the right path (a different-name swap would have left the row aimed at the trashed path; the quarantine was correct). The v0.70.0 harness missed it because its hand-rolled schema included the column the code assumed — the harness now builds from `database.init_db` and mirrors `get_db` semantics exactly. Fix: the UPDATE writes `file_path` only; the response keeps the stat-derived size for the UI's in-place row update; read-time stat makes "re-stat" automatic on every GET. 5/5 proofs: same-name identical-file swap twice end-to-end (success response, row correct, file valid, both originals in `_trash`), different-name swap re-points the row, forced post-trash failure still reports the honest string.
- **The Done page header reflects the outcome (ratified 2026-07-19).** Root cause: the header block was static — green check + "Added to your library" + "{n} stories added" rendered regardless of results, producing "green check, 0 stories added, ERROR row" on an all-refused batch. Now derived from the existing counts: zero successes → ⚠️ (the app's established attention glyph) + **"Nothing was added"**, no count line, Errors block exactly as before; partial → green check + **"Added {n} of {m}"** (m = successes + errors; skips excluded); full success byte-identical to before. Both routes share this surface (the linkTo flow renders the real response since v0.70.0).
- **Wishlist familiar matches: primary chooser action reads "Move to library" (ratified frozen copy edit).** ⚠️ FROZEN-FILE EDIT (flagged + ratified 2026-07-19): `upload/BookCard.jsx`, one line in the chrome zone — the button label becomes conditional (`is_wishlist` → "Move to library", owned → "Add to Existing"). Zero hex in the diff; same string length (15 chars) in a `flex-wrap` row, no mobile wrap risk.
- **Merge note prefix v2 (ratified): "Why this was on the wishlist: "** — supersedes v0.70.0's "Why this one (from the wishlist): "; past tense, since the book isn't on the wishlist anymore. The microcopy pass should treat v2 as the single current string.

### Technical
- **Modified:** `backend/routers/titles.py` (UPDATE drops the phantom column + diagnostic comment; prefix v2), `frontend/src/components/upload/UploadSuccess.jsx` (outcome-derived header), `frontend/src/components/upload/BookCard.jsx` (frozen-ratified one-line label), `backend/main.py` (0.70.0 → 0.71.0), `docs/DESIGN_LINT_REPORT.md` (lint regen), CHANGELOG.md, ROADMAP.md. **Backend files changed: full Docker rebuild required. No schema change — no `library.db` backup needed** (the fix REMOVES a write to a nonexistent column; single-row writes only).
- **Verified:** diagnosis + fix harnesses run against the REAL `init_db` schema with `get_db`-exact connection semantics (the fidelity gap that let v0.70.0's bug through); 5/5 fix proofs; `py_compile` clean; esbuild parse clean ×2; design-lint every strict category 0/pass, raw-`<button>` 125 delta 0; BookCard session diff verified one line, copy-only, zero hex; no identifiers deleted (the UPDATE lost a parameter, not a symbol; `new_size` still feeds the response).
- **Microcopy-pass flags (verbatim):** **"Nothing was added"** · **"Added {n} of {m}"** · **"Move to library"** · prefix v2 **"Why this was on the wishlist: "** (supersedes v0.70.0's prefix — one current string).

## [0.70.0] — 2026-07-19

### Added
- **Per-format [Replace file] in the Files section** — the deliberate swap the fanfic-update workflow needed (D3(i-R), ratified 2026-07-19), turning Remove Format + re-add into one action. Each file-backed edition row gains a swap affordance; an inline confirm (S10 — no modal; a flagged made-call, since the spec described Remove Format as inline-confirm but its actual gate is a modal) states the contract before the picker opens: the current file moves to trash (recoverable until emptied) and the swap never changes the book's details. Backend `POST /editions/{edition_id}/replace-file`: the client sends only the file — every path is server-derived; the incoming extension must match the edition's format (mismatch names Add Format as the right door); the filename is basenamed (v0.68.0 intake rule); the folder passes the v0.68.0 containment family; a collision with any other file in the folder refuses BEFORE anything is trashed; a file shared with another edition row is never trashed or overwritten; then trash-first swap, row re-pointed and re-stat'd (`file_path` + `file_size`). Metadata columns are never touched. Failure after the trash step reports plainly that the original is recoverable in `_trash` — no auto-restore, no silent anything.

### Fixed
- **Merge now converts the wishlist note instead of deleting it (D1(b)).** Root cause (Diagnostic v2): the wishlist detail page's note is the `titles.tbr_reason` column — not a `notes`-table row — and `merge_titles` had no `tbr_*` handling, so the column died with the source row at `DELETE FROM titles`: the cover-columns bug one column over. New step 6b: a non-empty, non-whitespace source `tbr_reason` INSERTs as a real note on the kept title, prefixed **"Why this one (from the wishlist): "** (2026-07-19 rider, superseding the earlier "From the wishlist: " prefix), inside the same transaction; the response reports `wishlist_note_converted`. The rule keys on the COLUMN, not wishlist status — an owned source carrying a stale `tbr_reason` converts too. Target notes untouched.
- **Wishlist familiar matches start unresolved on the review screen (D2(a)).** Root cause: AddPage's initializer auto-resolved every familiar match to 'new', so the v0.69.0 wishlist banner — working correctly — rendered only inside the [Change] chooser, and the sole user concluded the feature didn't exist while one tap from recreating the duplicate. The initializer now starts `familiar_title?.is_wishlist` matches at `action: null`; the existing chooser, attention banner, and Add gate (which always blocked null-action cards and was simply never armed) do the rest. Owned matches keep the long-standing 'new' default; zero edits to BookCard or ReviewBooks.
- **Both upload routes refuse same-format duplicates honestly — the orphan `_1` class is closed at the source (D3(i-R)).** Root cause (Diagnostic v2, harness-proven): the v0.68.0 overwrite-safety rename ran before S15.2b per-format recording, so a file whose format was already recorded landed as `name_1.epub` with no edition row — invisible until a full sync's duplicate-skip report — and the linkTo flow additionally reported nothing: `LinkToTitleResponse` had no message field and AddPage fabricated a message-less synthetic result. Now a per-file pre-check before any move refuses files whose normalized format (`.htm`→`html` included) is already recorded: refused files are never landed nor renamed, the message names the format and points at Replace file, and files of unrecorded formats proceed through the unchanged v0.68.0 containment + S15.2b rename machinery. `LinkToTitleResponse` gains `message`; AddPage renders the real response (synthetic result deleted), so refusals reach the Done screen through the v0.67.0 message line — an all-refused link renders as the error it is. Conversion edge: the wishlist→owned conversion fires only when at least one file actually landed; all-refused leaves the title a wishlist entry, with no file-less marker edition. Legacy `'ebook'` editions match no storage format, so the S15.2b defer path is unaffected.

### Technical
- **Modified:** `backend/routers/titles.py` (merge step 6b + `replace_edition_file` endpoint + imports `EXTENSION_TO_FORMAT`/`TRASH_DIR_NAME`/`validate_file`), `backend/routers/upload.py` (refusal pre-checks both routes; `LinkToTitleResponse.message`), `backend/main.py` (0.69.0 → 0.70.0), `frontend/src/pages/AddPage.jsx` (D2 initializer; real link response), `frontend/src/components/BookDetail.jsx` (Replace-file UI: `REPLACE_ACCEPT`, state + ref + handler, swap IconButton, inline confirm, hidden input), `frontend/src/api.js` (`replaceEditionFile`), CHANGELOG.md, ROADMAP.md. **Backend files changed: full Docker rebuild required. No schema change (`LinkToTitleResponse` is a response model, not a table); single-row writes only — no `library.db` backup needed.**
- **Verified:** `py_compile` clean ×3; esbuild parse clean ×3; cross-module import pairs grep-proven both sides (`constants.py:31 EXTENSION_TO_FORMAT`, `trash.py:16 TRASH_DIR_NAME`, `upload_service.py:150 validate_file`; `replaceEditionFile` export 1 / import+call 2). Harness 17/17 (real functions, throwaway DB + tree): merge conversion with rider prefix and target notes intact, whitespace no-op, owned-source stale-column conversion; review route mixed (epub refused with pointer message + mobi landed + **no orphan file on disk**) and all-refused (per-book error, nothing moved); link route all-refused (files_moved 0, message set, title stays wishlist, no marker edition) and mixed (lands + converts + refusal in message); replace-file happy swap (new bytes landed, old in `_trash`, row re-stat'd, metadata byte-identical), renamed swap re-points, mismatch 400 naming Add Format untouched, collision 409 with nothing trashed, traversal basenamed, shared-file 409 untouched. Design-lint: every strict category 0/pass; raw-`<button>` 125, **delta 0** (new affordances use shared `Button`/`IconButton`). Deletion sweep: no identifiers deleted (the synthetic result was an object literal, not a symbol); introduced identifiers pairing-counted (`files_to_land` 10, `refused_formats` 10, `refusal_message` 9, `recorded_formats` 4 in upload.py; `wishlist_note_converted` 3 in titles.py; `replaceTarget` 5/`setReplaceTarget` 4, `handleReplaceFileChosen` 2, `REPLACE_ACCEPT` 2, `linkResponse` 5 frontend). Frozen files: zero v0.70.0 hunks (BookCard.jsx's working-tree diff is v0.69.0's ratified edit; ReviewBooks.jsx no diff).
- **Microcopy-pass flags (verbatim):** note prefix **"Why this one (from the wishlist): "** · refusal **"Already have an epub for this title — use Replace file in the book's Files section to swap in a new copy."** (article/format vary: "a pdf", "a mobi", "an azw3", "an azw", "a html"; multi-format refusals join with "; ") · mismatch **"That's a mobi file — this slot holds the epub. To add another format, use Add Format instead."** · collision **"{name} already exists in this title's folder — rename the new file, or remove the other copy first."** · shared **"Another format of this title uses this same file — replacing it here would break that one. Rename the new file first."** · trash-step failure **"Couldn't move the current file to trash. Nothing was replaced — try again?"** · post-trash failure **"Couldn't finish the swap. The original file is in the trash folder (recoverable until you empty it); the edition still points at its old path. Run a sync if files look out of step."** · legacy guard **"This format predates the format migration — run a full sync, then try again."** · folder guards **"No folder on record for this edition — run a sync first."** / **"This edition's folder no longer exists — run a sync first."** / **"This edition's folder is outside the library — run a sync first."** / **"This edition's folder is in the trash — run a sync first."** · confirm copy **"Replace the {format} file? The current file moves to trash (recoverable until you empty it), and the swap never changes this book's details."** · buttons **"Choose new file"** / **"Keep current file"** / in-flight **"Replacing…"** · toast **"File replaced"** · frontend fallback **"Couldn't replace the file. Try again?"**

## [0.69.0] — 2026-07-18

### Fixed
- **Uploading a wishlisted book no longer creates a duplicate title — the root of Marie's reported notes/covers loss (chip-spawned investigation, both fixes ratified in-session 2026-07-18).** Root cause chain, fully evidenced: wishlist entries are created with `is_tbr=1` and have no folder, so the folder-duplicate check could never match them — and `check_familiar_titles`, the safety net whose own docstring targets exactly the "in the database but not on disk" case, **excluded every wishlist row** (`WHERE is_tbr = 0`). Every upload of a wishlisted book therefore created a second, unlinked owned title; deleting the wishlist twin afterwards cascaded its notes away and its cover columns died with the row (merge preserved notes but dropped the cover — see below). The query now includes wishlist rows (`ORDER BY is_tbr ASC, id ASC`, so an owned twin still wins exact-match ties deterministically) and `FamiliarTitle` gains an additive `is_wishlist` flag. The review card labels the match honestly: "…is on your wishlist. This file will move it to your library."
- **Adding files to a wishlist title now converts it to owned (Fix A2).** `add_files_to_existing_title` previously landed the files but left `is_tbr`/`acquisition_status` untouched — a wishlist title with files. It now runs the same conversion block as the Acquire link flow (`is_tbr=0`, `acquisition_status='owned'`, `status` COALESCE→'Unread', same transaction as the edition insert) and appends the per-book message "moved to your library from the wishlist". Notes and cover never move because the row never changes — verified byte-level in the harness.
- **Merge no longer drops the source's cover (Fix B).** Root cause: `merge_titles` moved editions, sessions, notes, collections, and backlinks — but no cover fields — before `DELETE FROM titles`, so a custom cover on the merged-away title vanished. New step 6 carries the cover under the ratified rule: a real cover beats none, `custom` beats `extracted`, and a `custom` target is never overridden. Column re-point only — merge deletes no cover files, and neither does title delete, so the carried `cover_path` stays valid. Steps renumbered (docstring updated to match); the response's `merged` dict gains additive `cover_carried`. This also makes cleanup of any existing wishlist/owned duplicate pairs lossless: merge them and both notes and cover survive.

### Technical
- **⚠️ FROZEN-FILE EDIT (flagged + ratified):** `frontend/src/components/upload/BookCard.jsx` — `FamiliarTitleBanner` copy only, the UI-chrome zone CLAUDE.md explicitly marks negotiable for this file; the gradient hex constants (the frozen core) are untouched. Justification: Fix A's ratified requirement that the review card label wishlist matches; ratified by Marie 2026-07-18 in-session before the edit was made.
- **Modified:** `backend/routers/upload.py` (`FamiliarTitle.is_wishlist`; `check_familiar_titles` query + constructors; `add_files_to_existing_title` conversion), `backend/routers/titles.py` (`merge_titles` cover-carry step + renumbering + docstring + response field), `frontend/src/components/upload/BookCard.jsx` (banner copy, see flag above), `backend/main.py` (version 0.68.0 → 0.69.0), CHANGELOG.md, ROADMAP.md. **Backend files changed: full Docker rebuild required. No schema change, no bulk writes — no `library.db` backup needed.**
- **Investigation record (report delivered + ratification received before any code):** routes traced with file:line evidence — link-to-title and the Acquire modal (Ebook → `linkTo`; Physical/Audiobook → `convertTBRToLibrary`) are same-row and were never the loss path; delete cascades notes by design (v0.55.0); merge moved notes but not covers. Notes/covers already destroyed are recoverable only from database backups — out of scope, stated honestly.
- **Verified:** `py_compile` clean on `upload.py`, `titles.py`, `main.py`; esbuild parse clean on `BookCard.jsx` (native darwin-arm64). **17/17 harness checks** (real `check_familiar_titles`, `add_files_to_existing_title`, `merge_titles` against a real aiosqlite schema incl. the sessions-projection tables): exact + fuzzy wishlist matches flagged, owned twin wins the tie, folder-duplicates still skipped; conversion flips the flags with the note and custom cover verified intact on the same row, owned-title control shows no conversion; all six merge-cover cases (carry to bare target ×2, custom-beats-extracted, extracted-vs-extracted no-op, custom target never overridden, coverless source no-op) with notes moving and the source row gone in every case. Design-lint: every strict category 0/pass, raw-`<button>` 125 delta 0 (copy-only edits). Identifier pairing: `cover_carried` 3 (init/set/response), `src_cover` 1+4, `tgt_cover` 1+2, `target_has_cover`/`target_is_custom` 1+1 each; `is_wishlist` pairs 3 backend producers ↔ 3 frontend consumers. No identifiers deleted; no imports added or removed.
- **Microcopy-pass flags (verbatim, new):** "…is on your wishlist." (banner state); "This file will move it to your library." / "These files will move it to your library." (banner consequence); "…and move it to your library" (add-to-existing confirmation suffix); "moved to your library from the wishlist" (per-book result message). Non-wishlist banner strings render byte-identically to before.

## [0.68.0] — 2026-07-17

### Fixed
- **Every upload write path is now contained — the v0.67.0 add_format guard's three siblings (A1-adjacent, chip-spawned).** Root cause, shared: `UploadedFile.original_name` is stored raw from the client at intake, and three paths still joined it into destination folders unguarded — the `'new'` action branch, `add_files_to_existing_title`, and `link_files_to_title` — so a crafted multipart filename like `../evil.epub` could write outside its folder. Closed at BOTH layers (ratified 2026-07-17): intake now keeps only the leaf name (`os.path.basename` after backslash-normalization in `save_uploaded_file` — browsers send bare basenames and no folder-upload mode exists, so this is a no-op for legitimate traffic; consumer sweep verified `parse_filename`, grouping, and UI display are all leaf-compatible), AND each path pre-flights every resolved destination before its first write, which also refuses symlink-at-leaf write-through redirects that basename can't see. Rejections follow the v0.62.0/v0.67.0 contract: per-book error results, never a mid-batch 4xx, nothing written or moved for the rejected book (link-to-title surfaces through its existing generic-500 path, files untouched).
- **`'new'` uploads can no longer silently overwrite an existing library folder's files.** Root cause: `os.makedirs(exist_ok=True)` means a 'new' action whose author-title matches an existing folder (a duplicate the analyzer missed, or a same-batch twin) landed inside it, and `copy2` replaced same-named files with no trace. Ratified 2026-07-17: collisions are **refused per-book** — the error names the colliding files; nothing is written; the deliberate swap-in-a-newer-version path is the review screen's existing Replace action (old folder → `_trash/`, recoverable) or the Files section's per-row remove. The branch also gained the folder-level guard (resolved containment in the books root, `_trash` refusal) against pre-planted symlink redirects of the server-built folder name, and `makedirs` now runs only after the pre-flight passes, so a rejected book leaves no stray empty folder.
- **Link-to-title (one-tap wishlist → library Add Files) no longer silently replaces files the title already owns.** Root cause: its move loop was a bare `shutil.move` onto the joined destination — an existing same-named file was replaced with no trace (rename(2) semantics same-filesystem, copy-overwrite cross-device). Ratified 2026-07-17 ("a wishlist item with a file added is technically no longer a wishlist item — it should be recognized as a normal title"): the flow now uses the exact recorded S15.2b contract of its sibling `add_files_to_existing_title` — collisions rename with a `_1` suffix before the extension, both files kept, real landed paths recorded per-format. `add_files_to_existing_title` itself keeps its rename behavior unchanged and gained only the containment pre-flight.

### Technical
- **Modified:** `backend/services/upload_service.py` (`save_uploaded_file` basename line + the `'new'` branch guard), `backend/routers/upload.py` (`add_files_to_existing_title` pre-flight; `link_files_to_title` pre-flight + rename-on-collision), `backend/main.py` (version 0.67.0 → 0.68.0), CHANGELOG.md, ROADMAP.md. **Backend files changed: full Docker rebuild required. No schema change, no bulk writes — no `library.db` backup needed.** No frontend files touched — design-lint not owed this session (S13 trigger is frontend/src).
- **Verified:** `py_compile` clean on both edited backend files (+ `main.py`). 22/22 end-to-end harness checks (scratchpad venv, real functions, throwaway books root + real aiosqlite schema for titles/editions): intake basename on `../`, `..\`, and nested-path names with plain names untouched and temp files staying in the session dir; 'new' — plain book lands, collision refused with the library file byte-intact and the batch-mate unwritten, injected traversal name rejected with no stray folder created, pre-planted symlink redirect rejected with nothing written outside, mixed batch lands the good book after the bad one errors; add-to-existing — collision still renames to `_1` with the original intact (recorded contract preserved), traversal rejected per-book with temp files unmoved; link-to-title — collision lands as `_1` with the existing file byte-intact and the title still converts to owned, traversal aborts with the endpoint's 500 and the folder byte-identical. Identifier pairing (introduced): `folder_resolved` 1 decl + 1 use, `dest_resolved` 1 decl + 1 use (upload.py); the `'new'` branch reuses the add_format guard's naming (`root`/`target`/`resolved`/`destinations`/`collisions`, one declaration set per branch). No identifiers deleted. No imports added or removed — both sides consume pre-existing imports (`upload_service.py:19` pathlib / `:25` services.trash ↔ `trash.py:16 TRASH_DIR_NAME`; `upload.py:16` pathlib — its duplicate pathlib import at line 25 is pre-existing and untouched).
- **Microcopy-pass flags (verbatim, new per-book rejection strings):** **"Invalid destination filename: {name}"** now also from the `'new'`, add-to-existing, and link flows (same string as v0.67.0 add_format); **"Already in the folder, not overwritten: {names}"** and **"Destination folder is outside the library"** / **"Destination folder is in the trash"** now also from the `'new'` branch (same strings as v0.67.0 — one vocabulary across all four paths, per the C-pass queue).
- **Parked (chip-spawned this session):** Marie-reported notes/custom-covers loss on some wishlist→library conversion route — recon established the link-to-title flow keeps the title row (notes/covers survive it), so the loss happens on a different route (new-title upload + wishlist delete, familiar-title miss, or merge); investigation task filed, out of this session's scope.

## [0.67.0] — 2026-07-17

### Added
- **Unknown URLs land on Library.** New `<Route path="*" element={<Navigate to="/" replace />} />` as the last route inside ConnectedApp's Routes — previously an unrecognized URL (stale bookmark, mistyped path, dead deep link) rendered a blank main area with only the bottom nav. Silent redirect by design: navigation, not an error, no toast. The `/dev/components` route is unaffected (it matches at the outer level before the `*` that mounts ConnectedApp), and no real route can be shadowed — verified with react-router's own `matchRoutes` against the two-level structure, 18/18 (all 13 inner routes + `/dev/components` resolve to themselves; four unknown shapes land on the catch-all).
- **Upload results render the backend's per-book messages (S15.2b carry-over closed).** The finalize response has carried per-book `message` strings since v0.53.0 ("same-format duplicates kept but not recorded: …", "already recorded, kept the existing edition: …", "edition records deferred — run a full sync after the format migration succeeds") but the results view dropped them — `UploadSuccess` destructured `message` and used it only in the Errors block. Non-error result rows now show the message as a second line under the title (`text-body-sm text-text-secondary`, wraps instead of truncating so filenames stay readable). Error messages keep their existing dedicated Errors block — not duplicated inline. Strings render verbatim (backend-supplied; already queued for the C-pass microcopy batch). Recon note: the fix lives in `components/upload/UploadSuccess.jsx` — `AddPage.jsx` reads only `status`/`title_id` (the review-edit re-apply loop) and passes the response through, matching the S15.2b record; the link-mode (`linkTo`) flow builds a synthetic result with no `message` and is unchanged.

### Fixed
- **Desktop download of a stale-path edition no longer fails silently (fold-in, Decisions 2026-07-10).** Root cause: `handleDownloadEdition`'s no-Web-Share branch — the desktop path — was a bare anchor click on the endpoint URL, and an anchor navigation can't observe HTTP status: a 404 either did nothing visible or saved the JSON error body as a fake book file, so the backend's honest detail never surfaced. The handler now fetches first on every path: `!res.ok` parses the backend `detail` and routes it through the existing error-toast path; `res.ok` saves the blob via an object-URL anchor with the edition's real filename, then revokes the URL. That made the desktop branch identical to the v0.51.0 share-without-files fallback, so the two are unified into one blob-save fallback (three branches → one fetch + share attempt + one fallback). Share behavior is unchanged, and AbortError (user closed the share sheet) still clears the loading toast without an error. Scope ruling honored (drift check 2026-07-17): the stale edition row itself is BY DESIGN — sync reports vanished files and re-points on the next scan; this fix is purely the frontend surfacing the designed 404. Verified 10/10 against the real extracted handler source (deno, stubbed fetch/DOM): 404 detail toast, healthy save with the right filename + revoke, share path, abort path, non-JSON error body.
- **`add_format` uploads are contained (A1 review finding).** Root cause: the add-format branch wrote into the client-supplied `existing_folder` with no validation — any absolute path was accepted as-is, `shutil.copy2` silently overwrote existing destination files, and the legacy name-search branch could be steered with `../` names (`original_name` is stored raw from the client at intake, so filenames could traverse too). The branch now mirrors the containment the v0.62.0 replace fix gets from `move_to_trash`: the folder is resolved symlink-safe and must be a real directory inside the books root, never the root itself, never `_trash/` or inside it; every file's destination is resolved and must stay inside the folder (kills traversal filenames) and must not already exist — collisions are refused, never overwritten. Rejection contract (v0.62.0 ratified precedent): every rejection is the per-book error result — never a mid-batch 4xx, nothing written for the rejected book (all destinations pre-flighted before the first copy), books already landed earlier in the batch never discarded. Writes and recorded paths keep the unresolved join style sync records, so edition rows stay byte-compatible — the resolved form is validation-only. Rider: a missing `existing_folder` now gets an explicit rejection (mirroring the replace branch) instead of a TypeError caught into a garbage message. Verified 21/21 (real `finalize_book`/`finalize_batch` against a throwaway books root): out-of-tree, `_trash`, escaping symlink, books root, collision (target content intact, batch-mate unwritten), traversal filename, missing + nonexistent folder, mixed batch lands the valid book and keeps it after a later rejection.
- **Backup rotation now ages out pre-sync backups (the "backup-filename parser" queue item, characterized per the Decisions 2026-07-17 ruling — no invented defects).** The item shipped with no recorded defect description, so recon enumerated writer shapes vs. parser expectations before touching anything. The one real mismatch: full sync's `create_backup(backup_type='pre_sync')` (`sync.py:1138`) writes `liminal_pre_sync_YYYYMMDD_HHMMSS.db` into `daily/` — five underscore tokens — while `cleanup_old_backups` parsed the timestamp positionally (`parts[2]/parts[3]` → `('sync', 'YYYYMMDD')` → strptime ValueError → warning + skip). Consequence: every pre-sync backup — a full database copy per full sync — was exempt from daily retention and accumulated forever, with a parse warning logged per file per cleanup run. The parser now takes the timestamp from the trailing two tokens, strips the `.db` suffix exactly (was a replace-all), and requires the `liminal_` prefix, so deletion eligibility stays a subset of liminal-written names (a foreign `.db` file dropped into a backup folder is now never deletable — before, a date-shaped four-token name was). Enumeration-verified non-defective and untouched: Settings' "Last backup" is the settings-table value (never filename-derived), stats count files without parsing names, and the manual pre-sync-protocol copies (`*.db-*` shapes) live outside the scanned folders entirely. Unparseable names: still skipped with the existing warning, never counted, never a crash. Verified 11/11 (real `cleanup_old_backups` over a shaped tree): old pre_sync now rotates, fresh pre_sync parses and stays, daily/manual/weekly/monthly behavior unchanged, foreign and garbage names untouched, survivor set exact.

### Technical
- **Modified:** `frontend/src/App.jsx` (catch-all route only), `frontend/src/components/BookDetail.jsx` (`handleDownloadEdition` only), `frontend/src/components/upload/UploadSuccess.jsx` (result-row message line), `backend/services/upload_service.py` (add_format branch only), `backend/services/backup.py` (`cleanup_old_backups` filename parse only), `backend/main.py` (version 0.66.0 → 0.67.0), `docs/DESIGN_LINT_REPORT.md` (regenerated), CHANGELOG.md, ROADMAP.md. **Backend files changed: full Docker rebuild required. No schema change, no bulk writes — no `library.db` backup needed for this deploy.**
- **Recon outcomes, no code change (two of the seven batch items):** the `upload.py` background-sync completion log was **already fixed** — `trigger_library_sync` already carries the exact two-line status check the item specifies (`result.status == "error"` → failure line, else success line; the only "Background sync" log sites in the file are that pair plus the except fallback) — skipped per the item's own stop condition. And `getBackLabel`'s `/sync-results` case is **verified still present** in BookDetail after the v0.58–0.65 rewrites (shipped as a v0.57.0 rider); queue item dropped per the drift check.
- **Verified:** `py_compile` clean on `upload_service.py` + `backup.py` + `main.py`; esbuild parse clean on all three JSX files (native darwin-arm64 binary). No imports added or removed on either side — the guard consumes the existing v0.62.0 `services.trash` import (export side re-verified: `trash.py:16 TRASH_DIR_NAME`), and `Navigate` was already imported in App.jsx. Harnesses: routes 18/18 (real react-router `matchRoutes`, two-level structure modeled), download 10/10 (real handler source extracted from the file and run under deno with stubbed fetch/DOM), add_format guard 21/21 and backup rotation 11/11 (both driving the real backend functions from the scratchpad venv). Identifier pairing (introduced, all scoped to the add_format branch): `destinations` 1 decl + 2 uses, `collisions` 1 + 3, `resolved` 1 + 2, `root` 1 + 3, `target` 1 + 7; no identifiers deleted this session — no deletion scorecard owed (the download unification kept every prior name; one duplicate sibling-scope `link` const became a single declaration). Design-lint (deno): every strict category 0/pass; raw-`<button>` report-only **125, delta 0 vs. the v0.63.0 baseline** (the new UploadSuccess lines are spans inside the existing row button).
- **Microcopy-pass flags (verbatim):** item 2 — backend detail passthrough **"File not found — it may have moved since the last library scan"** (downloads.py, now user-visible on desktop) and the existing fallback **"Couldn't download the file. Try again?"** (unchanged, now also the desktop fallback). Item 4 new per-book rejection strings — **"Add format requested but no existing folder was given"**; **"Destination is the library root, not a title folder"**; **"Destination folder is outside the library"**; **"Destination folder is in the trash"**; **"Invalid destination filename: {name}"**; **"Already in the folder, not overwritten: {names}"**. Item 3 renders backend strings already queued for the C-pass ("same-format duplicates kept but not recorded: …", "already recorded, kept the existing edition: …", "edition records deferred — run a full sync after the format migration succeeds").

## [0.66.0] — 2026-07-17

### Added
- **Settings → Trash section — `_trash/` finally has an in-app home (Batch 3 B1, Decisions 2026-07-16).** The trash folder was forgotten multiple times in its first week because the app absorbed every reason to visit the NAS; now Settings shows what's waiting there and offers the one way out. New section directly below Backups: top-level item count + recursive size ("N items · X MB", through the page's existing module-local `formatBytes` — recon found Settings already had one, so no new helper and no cross-page import of BookDetail's `formatFileSize`; the dedup remains a future candidate). Stats load on mount alongside the other Settings fetches. Zero items renders "Trash is empty." and NO button — no dead action offered. Load failure renders the backup-precedent inline danger banner + ghost "Try again" — never a permanent "Loading…".
- **`GET /api/trash/stats` + `POST /api/trash/empty` — new router `backend/routers/trash.py`,** modeled on `downloads.py` (own `APIRouter(prefix="/api/trash")`, registered bare in `main.py`, books root from the `BOOKS_PATH` env like every other router). The trash location is imported from `services.trash.TRASH_DIR_NAME` — grep-verified the `"_trash"` literal has exactly ONE backend definition (`services/trash.py:16`), consumed by the router. Neither endpoint reads or writes the database. Stats contract: top-level entries count as one item each (a trashed title folder is one item, a loose trashed file is one item — matches how things went in); `total_bytes` is recursive with lstat semantics — a symlink contributes the link's own size, never its target's; missing `_trash/` returns zeros with HTTP 200 (missing trash is empty trash, not an error).
- **Emptying is Liminal's ONLY truly irreversible operation, and the flow owns that (Decisions 2026-07-16).** Non-zero trash shows a danger `[Empty trash]` button (shared `ui/Button`, 44px) → confirmation modal (`components/settings/EmptyTrashModal.jsx`, sibling of the other settings modals): title "Empty trash?"; body states the count/size and the two facts the decision requires, plainly — emptied files skip the NAS recycle bin, and backups cover the library database only. Type-to-confirm gate: "Type forever to confirm", matched case-insensitively and whitespace-trimmed (made-call: strict-case matching punishes mobile keyboards for autocapitalizing), `autoCapitalize="none"` + `autoCorrect="off"` on the input. Footer `[Keep files]` / `[Empty trash]` — buttons name outcomes, the safe option is the safe outcome, danger disabled until the word matches. In-flight: ALL close paths no-op (v0.57.0 `editionDeleting` precedent — the shared Modal funnels ×, Escape, and backdrop through the one guarded `onClose`; Keep files is the same guarded handler plus `disabled`) while the danger button shows its loading state.
- **Empty contract (v0.62.0 per-book philosophy, applied per-entry):** containment paranoia guard BEFORE touching anything — refuses (500, plain-language detail) a symlinked `_trash`, a resolution outside the books root, or the books root itself; per top-level entry, real directories go through `shutil.rmtree`, everything else — files AND symlinks, including symlinks to directories — through `unlink`, so a symlink in trash deletes the LINK and never its target; per-entry failures never abort the run — each is collected as `{name, error}` and returned in-band with HTTP 200 alongside `removed_count` and `freed_bytes` (a mid-run abort would strand a half-emptied trash with no report); every removed entry name is logged — the container log is the only surviving record of what died.
- **Success and failure surfaces:** clean run → modal closes, stats refetch, success toast "Trash emptied." Partial or total failure → the modal STAYS OPEN with an inline `role="alert"` banner at the point of action (v0.63.0 banner recipe): "Couldn't empty the trash completely. {N} items remain — try again?", or "Couldn't empty the trash. Try again?" when the request itself died — and stats refetch either way so the shown count stays honest.
- **Backups section clarifier (rides B1, same Decisions):** one caption line under the Backups header — "Backups cover the library database only — book files aren't included." Rendered unconditionally (visible even while backup settings load or fail).

### Technical
- **Created:** `backend/routers/trash.py`, `frontend/src/components/settings/EmptyTrashModal.jsx`. **Modified:** `backend/main.py` (trash router import + bare registration; version 0.65.0 → 0.66.0), `frontend/src/api.js` (`getTrashStats` + `emptyTrash` wrappers — made-call: api.js wasn't named in the session spec, but every Settings fetch routes through it and a raw fetch in the page would break the API-layer pattern), `frontend/src/pages/Settings.jsx` (trash state + loader + section + modal wiring + backup caption), `docs/DESIGN_LINT_REPORT.md` (regenerated), CHANGELOG.md, ROADMAP.md. **Backend files changed: full Docker rebuild required. No schema change; neither endpoint touches the database — no `library.db` backup needed for this deploy.**
- **Two environment traps caught in recon and coded around, both commented in-file:** the container runs Python 3.11 (`Dockerfile`), so `is_dir(follow_symlinks=False)` (3.13+) would crash in production while passing the local 3.14 harness — the router uses `entry.is_dir() and not entry.is_symlink()` instead; and nothing in the backend configures logging, so uvicorn leaves module loggers to Python's last-resort handler (WARNING and above only) — removal records log at `logger.warning` deliberately, or the "only surviving record of what died" would vanish silently (`logger.info` never reaches the container log here).
- **Verified:** 29/29 end-to-end harness checks (scratchpad venv per the standing local-verification pattern — unpinned package names; the pinned pydantic-core 2.14.6 cannot build on local Python 3.14): stats on missing/empty/populated trash; nested folder sizes counted; empty removes only trash contents — `_trash/` itself survives, library folders survive, and symlink targets survive (file, directory, and broken links all exercised); forced per-entry failure via a chmod-locked directory → the run continues, the failure is reported in-band, the lock survives honestly, and a retry after unlock drains clean; containment refusals for symlink-to-outside (stats AND empty), symlink-to-books-root, and a corrupted-constant non-contained resolution — with targets verified untouched after every refusal. `py_compile` clean on both backend files; esbuild parse clean on all three frontend files (native darwin-arm64 binary). Import↔export greps printed in-session for all five new pairs (`TRASH_DIR_NAME`, trash router, `getTrashStats`, `emptyTrash`, `EmptyTrashModal`). Design-lint (deno): all nine strict categories 0, exit 0; raw-`<button>` 125 unchanged — expected delta 0, every new control is shared Button/Modal chrome. Grep scorecard: `alert(` 0 and `window.confirm` 0 across frontend/src. No identifiers deleted this session — no deletion sweep owed.
- **Microcopy-pass flags (verbatim, none in MICROCOPY_LIBRARY yet):** "Empty trash?" (modal title); "This deletes {N} items ({X MB}) for good. Emptied files skip the NAS recycle bin, and backups cover the library database only — not book files. Nothing can bring them back." (modal body); "Type forever to confirm" (input label; aria variant "Type forever to confirm emptying the trash"); [Keep files] / [Empty trash] (footer; "Empty trash" also the section button); "Trash is empty."; "Trash emptied." (toast); "Couldn't empty the trash completely. {N} items remain — try again?"; "Couldn't empty the trash. Try again?" (request-death variant); "Couldn't check the trash." (stats load-failure fallback); "Loading trash…" (transient); "Backups cover the library database only — book files aren't included." (Backups caption).

## [0.65.0] — 2026-07-17

### Added
- **StatusLabelsModal: per-field "Reset" link.** Right-aligned with the field title, `text-body-sm text-action-primary`, renders only while the field's value differs from its canonical default; tapping it sets the field back to the default. It persists through the modal's normal save path — recon fact that shaped this: the modal has **no Save button**; its save flow is per-field save-on-blur (`updateSetting` + `settingsChanged` dispatch on every field commit), so "reset as a form edit" would never persist as a state-only change. Reset therefore funnels through the same `persistLabel` helper that blur uses — it behaves exactly like clearing the field and blurring (a path that already restored the default via `raw.trim() || DEFAULTS[key]`), one tap instead of two steps. 44px touch target via `min-h-11` on both the link and the title row — the row is `min-h-11` unconditionally so field headers don't change height as the link appears/disappears mid-typing. `aria-label="Reset {Label} label"` distinguishes the four otherwise-identical buttons for screen readers. Known transient, accepted: tapping Reset while that field's input is focused fires blur-save (custom value) then reset-save (default) — two sequential writes, last-initiated wins.
- **Microcopy-pass flags:** "Reset" (visible link text) and "Reset {Label} label" (aria) — neither is in the approved-strings set yet; queued for the batch-close microcopy pass.

### Changed
- **StatusLabelsModal field titles are static canonical defaults.** Root cause of the live-updating titles: `label={getLabel(status)}` rendered each row title through `useStatusLabels` — deliberately, per the old in-file comment ("Row titles render the live label") — so the moment you typed a custom value and it saved, the reference label above the input became the custom value and the canonical name was gone from the screen. Titles now render from the in-file `DEFAULTS` map (`Unread / In Progress / Finished / DNF` — same values as `useStatusLabels`' `DEFAULT_LABELS`; the modal keys by setting name, the hook by DB status). The `useStatusLabels` import, `getLabel`, and the `FIELDS` status-key objects left the file with the change (`FIELDS` is now a plain key array).

### Fixed
- **BookDetail 3-dot bottom sheet no longer renders under the bottom nav.** Root cause: `ThreeDotMenu` renders inside `UnifiedNavBar`, whose wrapper is `sticky top-0 z-20` — a stacking context. The mobile sheet (`fixed inset-0 z-50`) resolved its z-index *inside* that z-20 context, so the whole overlay painted below the `fixed z-40` BottomNav no matter how high its own z-index went — nav visible and tappable over the backdrop, Cancel partially buried. The sheet + backdrop now portal to `document.body` (`createPortal`, first portal in the codebase — it is the only in-component escape from an ancestor stacking context), where `z-50` genuinely beats the nav's `z-40`: backdrop covers the nav (a tap there closes the sheet, nothing reaches the nav), Cancel sits fully above it. The outside-mousedown close handler gained a second containment check (`sheetRef`) because the portaled sheet is no longer inside `menuRef`'s DOM subtree — without it, every sheet tap would count as "outside" and close the menu on mousedown before the item's click could fire. Desktop dropdown untouched (still rendered in place; `hidden md:block` unchanged).
- **Recon correction to the session premise (and the roadmap record):** there is no `components/ui/ThreeDotMenu.jsx` — roadmap item 10.0.14 ("Extract ThreeDotMenu…") is checked `[x]` but the extraction never happened (the 2026-07-07 ghost-component cleanup already removed it from SKILL.md's ui/ listing). `ThreeDotMenu` is an inline component in `BookDetail.jsx` (~line 142) with exactly one consumer, so "fix the shared component, all consumers inherit" is satisfied trivially. `SortDropdown.jsx` carries its own separate bottom-sheet implementation (rendered from page bodies, not inside the sticky navbar) and is untouched by this fix. ROADMAP 10.0.14 corrected this session.

### Removed
- **Files section Edit ⇄ Done mode (`filesEditMode`), whole wiring** — reversing the v0.58.0 "toggle survives" call, per the 2026-07-16 ratification (header keeps no affordance; destructive per-row actions are visible but quiet). Deleted: the state declaration, the exit-edit-mode-on-last-delete branch in `handleDeleteEdition`, the reset in the book-id load effect, and the Edit/Done header toggle. The per-row remove × now renders whenever `editions.length > 1` (hidden at a single edition, as before), muted at rest instead of edit-mode-gated: `!text-text-muted hover:!text-text-primary` on the existing 44px default-size `IconButton`. The important modifiers are deliberate — IconButton's default variant hardcodes `text-text-secondary`, and which same-property token class wins from `className` depends on generated-CSS order, which isn't a contract; `!` makes the muted rest state and the hover brighten deterministic. Everything downstream of the × is byte-identical: same confirm modal, same `editionDeleting` in-flight guards from v0.61.0 (onClose/header-close refuse while deleting; Keep disabled; Remove disabled+loading).

### Technical
- **Modified:** `frontend/src/components/settings/StatusLabelsModal.jsx` (static titles, Reset link, `persistLabel` refactor of the blur handler — same write path, no behavior change on blur), `frontend/src/components/BookDetail.jsx` (`createPortal` import + portaled sheet + `sheetRef` containment; `filesEditMode` deletion sweep; × ungating + muted styling), `backend/main.py` (version 0.64.0 → 0.65.0 only), `docs/DESIGN_LINT_REPORT.md` (regenerated), CHANGELOG.md, ROADMAP.md. **Backend files changed (version line only): full Docker rebuild required. No schema change, no file operations, no bulk writes — no `library.db` backup needed.**
- **Verified:** esbuild parse clean on both JSX files (native darwin-arm64 binary). Cross-module import grep, both sides printed in-session: `BookDetail.jsx:2` imports ↔ `node_modules/react-dom/cjs/react-dom.production.min.js:318` `exports.createPortal=function(a,b){…}` (react-dom ^18.2.0 in package.json). Deletion grep scorecard: `filesEditMode` / `setFilesEditMode` / case variants → **0 repo-wide** (code; the only remaining mentions are historical changelog/roadmap entries); `getLabel` / `useStatusLabels` in StatusLabelsModal → 0 (BookDetail's own `useStatusLabels` import untouched and still consumed at line ~426). Design-lint (deno): **all nine strict categories 0**; raw-`<button>` **125 → 125 net-zero, both movements explained** — BookDetail 22 → 21 (the deleted Edit/Done toggle), `settings/StatusLabelsModal.jsx` +1 (the Reset link).
- **Observation for the error-surface ledger, not fixed here (pre-existing path, new caller):** StatusLabelsModal's save catch is console-only — a failed label write (blur or Reset) is invisible to the user. The end-of-session reviewer sharpened the Reset case: the optimistic state set flips the link's render condition false, so a failed Reset shows the default, hides the link, and leaves the DB on the custom label until the next modal open refetches the truth. Rides alongside the CollectionPicker console-only catch already on the ledger. Reviewer's paired recommendations, both future-session items: a `muted` IconButton variant (ui/-scoped session) to retire the Files ×'s important-modifier override, and a one-line StatusLabelsModal exception in DESIGN_SYSTEM.md §4 Status labels so reviews stop re-flagging the ratified DEFAULTS render.

### Fixed
- **Batch remove is retryable after a partial failure — `DELETE /collections/{collection_id}/books/{title_id}` is idempotent now.** Root cause (v0.63.0's "Known edge surfaced, not fixed"): the endpoint 404'd ("Book not in collection") whenever the membership row didn't exist, while `CollectionDetail.handleBatchRemove` removes sequentially and only reconciles local state after the whole loop succeeds — so titles removed before a mid-loop failure stayed in both the UI and the selection, and every retry deterministically re-failed on the first already-removed id until the collection was refetched. The membership pre-check is deleted (`backend/routers/collections.py`, remove endpoint only): removing a non-member is a success no-op, per DELETE semantics — the desired end state ("not in collection") already holds. The real guards stay: unknown collection still 404s ("Collection not found"), automatic collections still 400. `mark_book_completed`'s own "Book not in collection" 404 is deliberately untouched — toggling completion genuinely requires the membership row to exist.
- **Why backend idempotency over the frontend candidates** (per-title success pruning, or refetch-on-catch): it fixes every caller at the root with no pagination-reset or selection-reconciliation machinery — `CollectionPicker`'s uncheck now also survives state drift instead of failing on a 404 — and v0.63.0's "Couldn't remove some titles. Try again?" banner becomes a keepable promise with zero frontend change. Caller sweep before changing the contract (printed in-session): the endpoint's only consumers are `api.js removeBookFromCollection` → `CollectionDetail.handleBatchRemove` and `CollectionPicker.toggleCollection`, neither branching on the 404 (both funnel into generic catches); no script/webhook callers; `titles.py:3097`'s membership delete is internal by-id SQL, not this HTTP contract.
- **Files touched:** `backend/routers/collections.py` (remove endpoint: docstring + membership pre-check removal), `backend/main.py` (version 0.63.0 → 0.64.0 only). **Backend files changed: full Docker rebuild required. No schema change, no file operations, no bulk writes — no `library.db` backup needed.**
- **Verified:** `py_compile` clean on both files; **9/9 end-to-end harness checks** (scratchpad venv per the standing local-verification pattern — real `init_db()` schema with migrations and default collections seeded, router function called directly on an aiosqlite connection): member remove succeeds + row gone; re-remove of the same title is an idempotent success; never-member id is a success no-op; missing collection still 404s; automatic collection still 400s with its membership untouched; and the exact v0.63.0 trap replayed — remove two of four, then retry the FULL selection: drains clean to an empty collection where the old code 404'd on the first already-removed title. Design-lint: frontend/src untouched this session, category summary unchanged (all strict categories 0, raw-`<button>` 125), report file untouched.
- **Observation for the error-surface ledger, not fixed here (pre-existing, out of scope):** `CollectionPicker.toggleCollection`'s catch is console-only — a failed add/remove toggle is invisible to the user. Carried alongside the S10 inline-confirm advisory and the microcopy batch-close queue.

## [0.63.0] — 2026-07-17

### Changed
- **Remove-mode list rows get left breathing room (pre-commit rider, Marie-ratified):** the list-view remove-mode row container gains `pl-2.5` (0.625rem), so the selected-row tint no longer sits flush against the cover — the `inset-0` selection overlay spans the padded row, rendering 0.625rem of tint between the row's left edge and the cover. Applies to all rows while remove mode is active (uniform alignment; no jump on select). List view only — the grid branch is a cover tile in a grid cell, not a row — and the non-remove-mode, reorder-mode, and grid layouts are untouched.

### Fixed
- **Every remaining `alert()` is gone — the batch-3 ledger is closed and the strict lint category finally passes.** Root cause of the ledger: seven blocking failures across the Collections surfaces reported through window-blocking `alert()` with no inline error state — the golden-rule-3 violation on the honest ledger since the strict rule landed as the v0.57.0 rider (13 sites then; B2 took 2, v0.62.0's ImportPage deletion took 4, these are the final 7). Every site now surfaces inline in its host surface with state + render + clear-on-retry/next-action; none of the seven was a disguised confirmation (both delete flows already confirm through proper modals; batch remove confirms through selection + the Remove button), so all seven were straight error-surface swaps:
  - **CollectionsTab (1):** delete-collection failure renders a banner inside the delete-confirm modal, which stays open for retry; cleared when the modal is reopened for a new target and at the start of each retry.
  - **CollectionModal (4):** the three cover actions (style change, upload, remove) plus the 5MB validation share one `coverError` state rendered directly beside the Cover style controls — NOT the modal's top banner, which can be scrolled out of view in the fullscreen mobile modal while the cover controls sit at the bottom; cleared at the start of every cover action, so picking a different file also clears the validation message.
  - **CollectionDetail (2):** delete-collection failure mirrors CollectionsTab (banner in its confirm modal, cleared on menu-open and retry); batch-remove failure renders the banner inside the fixed bottom remove-mode bar, stacked directly above Cancel/Remove where the triggering tap happened — visible regardless of scroll position; remove mode and the selection survive the failure so Remove-again is a real retry.
- **Banner recipe (all five render sites):** `role="alert"` + `rounded-lg px-3 py-2 text-body-sm bg-action-danger/10 border border-action-danger/30 text-action-danger` — CollectionModal's own established in-file banner, token-corrected (`text-sm` → `text-body-sm` per the 8-token rule; the legacy top banner itself is untouched, not in scope).
- **Known edge surfaced, not fixed (pre-existing):** a mid-loop batch-remove failure leaves a retry trap — removals that already succeeded server-side still sit in the UI and in the selection, and `DELETE /collections/{id}/books/{title_id}` 404s on non-members ("Book not in collection"), so the retry re-fails until the collection is refetched (leaving and revisiting the page). The banner surfaces the failure honestly; the idempotency/resync fix is ticketed as a follow-up, not smuggled into this session.

### Technical
- **Modified:** `frontend/src/components/CollectionsTab.jsx` (+`deleteError` state, modal banner), `frontend/src/components/CollectionModal.jsx` (+`coverError` state, cover-section banner), `frontend/src/components/CollectionDetail.jsx` (+`deleteError`/`removeError` state, modal banner + bottom-bar banner; the bar's flex row moved into an inner div so the banner stacks above it — classes otherwise unchanged; rider: remove-mode list-row wrapper `relative` → `relative pl-2.5`), `backend/main.py` (version 0.62.0 → 0.63.0 only), `docs/DESIGN_LINT_REPORT.md` (regenerated: alert() 7 → 0), CHANGELOG.md, ROADMAP.md. **Backend files changed (version line only): full Docker rebuild required. No schema change, no file operations, no bulk writes — no `library.db` backup needed.**
- **Phase-2 finding — the lint flip was already done:** the session spec called for converting the alert rule "baseline-11 fail-on-increase → strict zero," but `scripts/design-lint.mjs` has had `alert-call` at `strict: true` since the rule landed (v0.57.0 rider) and never had a baseline mechanism — the ledgered sites simply rode as a tolerated ❌ FAIL via the pre-commit hook's `--warn` mode. The script is deliberately untouched this session; self-match is structurally impossible (scan root is `frontend/src`, the script lives in `scripts/`). The category's first ✅ pass comes from the conversions, not a rule change.
- **Verified:** `alert(` grep across frontend/src → 0 matches; esbuild parse clean on all three touched files (native darwin-arm64 binary); setter-case pairing scorecard for the four new states — CollectionsTab `deleteError` 3 lines (decl/guard/render) + `setDeleteError(` ×3 (open-clear/retry-clear/catch-set), `coverError` 3 + `setCoverError(` ×7 (three action-start clears, 5MB validation set, three catch sets), CollectionDetail `deleteError` 3 + ×3, `removeError` 3 + ×3 (attempt-clear/catch-set/cancel-clear) — every state declared, rendered, and cleared; no unbound identifiers. Design-lint (deno, no `--warn`): **all nine strict categories 0, exit 0 — alert() calls 0 for the first time since the rule shipped**; raw-`<button>` 125 unchanged (the session spec's expected 128 was the pre-v0.62.0 count; the delta is ImportPage's three buttons, deleted last session — this session's banners are divs and add no buttons).
- **Microcopy pass flag (6 new strings, all on the approved "Couldn't X. Try again?" anatomy, none yet in MICROCOPY_LIBRARY.md):** "Couldn't delete the collection. Try again?" (both delete surfaces), "Couldn't change the cover style. Try again?", "That image is over 5MB. Try a smaller one?", "Couldn't upload the cover. Try again?", "Couldn't remove the cover. Try again?", "Couldn't remove some titles. Try again?" ("titles" per the inclusive-terminology rule — the alert said "books"). All flagged for the batch-close microcopy pass.

## [0.62.0] — 2026-07-16

### Fixed
- **Upload replace could delete any folder the client named — the last unguarded destructive file operation.** Root cause: `finalize_book`'s `replace` branch passed `existing_folder` — a client-supplied string from the `/upload/finalize-batch` payload (`FinalizeRequest.books[].existing_folder`, no validator) — to `shutil.rmtree` with **no containment**: an absolute path was used verbatim (`{"action":"replace","existing_folder":"/app/data"}` would have deleted the database folder), a relative one could traverse out via `../`, and the only gate was `os.path.exists`. The deletion now routes through `move_to_trash` (the v0.55.0 trash contract): the replaced folder is **moved to `_trash/`** (recoverable, same model as Delete Title / Merge / Remove Format), never rmtree'd, and the trash service's own guards do the containment — `resolve()` collapses symlinks, then it refuses the books root itself, anything outside the root, and anything already in `_trash/`. **Any failed or skipped removal aborts the replace before new files are written** and surfaces as the per-book `status:'error'` result with the specific reason (AddPage's existing channel). Two silent paths in the old branch are now explicit errors: replace with no `existing_folder` in the payload, and replace naming a folder that doesn't exist — both previously degraded into `new` without telling anyone.
  - **Spec deviation, reported:** the session spec asked for an HTTP 400 on out-of-tree paths. `/upload/finalize-batch` is a batch endpoint whose established error contract is per-book `{status:'error', message}` results inside an HTTP 200 — a mid-batch 4xx would discard the outcomes of books already landed (folders moved, titles created). The rejection is surfaced with its specific message through that per-book contract instead; no silent path remains.

### Removed
- **The dead Obsidian-import feature, end-to-end (recon finding + mid-session ratification).** `backend/routers/import_metadata.py` (unmounted from `main.py`, file deleted) still queried the pre-Phase-5 **`books` table** (`FROM books` / `UPDATE books` at lines 502, 645, 686, 744, 792, 813–827), so every DB-touching endpoint has 500'd since the rename — the item parked in the roadmap since B1. The session spec expected zero frontend callers; **recon proved that false** (stop condition honored): `pages/ImportPage.jsx` — routed at `/import` but linked from nowhere, reachable only by typed URL — called `/import/stats`, `/import/preview`, and `/import/batch`. Marie ratified the full sweep mid-session: ImportPage.jsx deleted, its import + route removed from App.jsx, so the Phase-2 "zero references to the module or its endpoint paths" verification could actually pass (backend-only removal would have left three orphaned callers 404ing). The dead router's `/books/match` and `/books/{id}/reading-metadata` routes were shadowed duplicates — `titles.py:678` registers its own live `/books/match` first (used by the migration script) and survives untouched.

### Technical
- **Modified:** `backend/services/upload_service.py` (trash import + replace branch only), `backend/main.py` (router import + mount removed; version 0.61.0 → 0.62.0), `frontend/src/App.jsx` (ImportPage import + `/import` route removed), `docs/DESIGN_LINT_REPORT.md` (regenerated — ImportPage's violations left the ledger). **Deleted:** `backend/routers/import_metadata.py`, `frontend/src/pages/ImportPage.jsx`. **Backend files changed: full Docker rebuild required. No schema change, no migration, no bulk writes — no `library.db` backup needed (the changed paths move files, never touch the database).**
- **Verified:** `py_compile` clean on `main.py` + `upload_service.py`; esbuild parse clean on `App.jsx` (native darwin-arm64 binary). Cross-module export grep, both sides printed in-session: `upload_service.py:25` imports ↔ `trash.py:19 class TrashError`, `trash.py:23 def move_to_trash`. **Runtime harness 26/26** (scratchpad venv, real `finalize_book` calls against a throwaway books root): valid replace lands the old folder in `_trash/` and writes the new one; out-of-tree absolute path, in-root symlink pointing outside, relative `../` traversal, the books root itself, a nonexistent folder, and a missing `existing_folder` are all rejected with specific messages, targets untouched, **no new files written after any rejection**; plain `new` action unaffected. Deletion grep scorecard: `rmtree` in backend → exactly one survivor (`upload_service.py:122`, server-derived temp-dir cleanup in `cleanup_session` — justified, not client-influenced); `import_metadata`, `import_router`, `ImportPage`, `/import` route refs, and the endpoint paths (`import/parse|preview|batch|stats`, `reading-metadata`) → zero across backend + frontend/src; sole `books/match` hit is `titles.py`'s own independent endpoint (see above). Design-lint category summary: hardcoded colors 0, library-* 0, indigo 0, cascade-flip 0, window.confirm 0, **alert() 11 → 7** (exactly ImportPage's 4 ledgered sites, deleted with the page — CollectionsTab 1, CollectionModal 4, CollectionDetail 2 remain for batch 3), Abandoned-in-copy 0, font-bold 0, text-h1 0, raw-`<button>` **128 → 125** (report-only; ImportPage's three buttons). Both movements are pure deletions — no new violations, no category regressions.

## [0.61.0] — 2026-07-15

### Changed
- **BookDetail 3-dot menu is page-level actions only (Session B3 menu audit).** Final owned-book menu: Edit · Change Cover ─ Merge · Rescan Metadata ─ Delete Title. "Add Reading Session" and "Add to Collection" are removed — both actions already live on the page (the Reading History header's add button and the Collections section header button). Existing gates untouched (Rescan Metadata still requires `!isWishlist && folder_path`). The `!isWishlist` divider between the removed pair and Merge went with them — `ThreeDotMenu` renders dividers verbatim, so leaving it would have double-divided the owned menu. **Consumer-less sweep result: nothing became consumer-less** — `openAddSession` keeps its three callers (rating stat tile + both Reading History headers) and `setShowCollectionPicker` keeps the Collections-section header button, so no handlers, state, or modal invocations were deleted; the `CollectionPicker` modal and the session-editor modal (whose own title still reads "Add Reading Session" — that string is the flow, not the menu item) are unchanged.
- **Reading History's header button is a + (add) glyph now, in both renders** (mobile History tab + desktop-only section). It was a pencil that already called `openAddSession()` with `aria-label`/`title` "Add reading session" — only the glyph misrepresented the action; handler and labels are byte-identical to before (no MICROCOPY_LIBRARY.md exists; "Add reading session" ratified as-is, B3 ruling 2026-07-15). The per-row pencil inside `CompactSessionRow` (edit session) and the Notes/Collections section-header pencils are genuinely edit actions and are untouched.
- **Remove-format confirm is honest about the file (modal header "Remove Edition" → "Remove Format").** "The file moves to the trash folder." now renders only when the backend will actually move it: the sentence is gated on `file_size != null` — `get_book` returns `file_size: null` exactly when the path is stale (file already gone from disk), the case `delete_edition` deliberately skips — AND on no other of this title's editions sharing the `file_path`. A within-title shared file renders "The file stays — another format still uses it." instead (records-only delete, mirroring the backend's shared-path guard). Fileless editions render no file sentence, as before. Previous gate was `file_path` truthiness alone, which over-promised on both stale and shared paths (Batch-2 S3 carry-over, closed for the within-title case).

### Fixed
- **The History list's order could disagree with the status pill.** Root cause: `list_sessions` ordered `session_number DESC` (creation order) while the v0.59.0 projection (`sync_title_from_sessions`) picks the winning session by `date_started DESC, id DESC` — so a backdated session put a different row on top of History than the one the pill projects from. The endpoint now uses the projection's exact ORDER BY (NULL `date_started` sorts last under DESC in SQLite, same as the projection): the top History row IS the status pill's source.
- **Times Read counted every session** — root cause: `list_sessions` computed `times_read = len(sessions)`, so in-progress and DNF sessions each added a "read"; a first read still in progress already showed "Times Read 1". Now counts closed Done sessions only (`session_status = 'finished'`; B3 ruling 2026-07-15 — DNF is closed but not Done, matching the projection's own finished-only closed-date logic at `database.py:739`). `average_rating` is deliberately unchanged: it still spans all rated sessions, including DNF (rating is valid on finished and dnf).

### Parked
- **Cross-title shared file paths still over-promise the trash sentence** (accepted edge, B3 Option-A ruling 2026-07-15): `delete_edition`'s shared-path check spans ALL edition rows, but the frontend only sees THIS title's editions — a file shared with a different title's edition renders "The file moves to the trash folder." while the backend does a records-only delete. Abnormal DB state (sync ingests per folder); if it ever surfaces, the fix is Option B — a `file_shared` flag on `EditionSummary` in `get_book` computed with the same any-title query the delete uses.

### Technical
- **Modified:** `frontend/src/components/BookDetail.jsx` (menu items + divider removal, two header glyphs, Remove Format header, honesty gating + `editionFileOnDisk`/`editionFileShared` derived consts), `backend/routers/sessions.py` (`list_sessions` ORDER BY, finished-only `times_read`, docstring), `backend/main.py` (version 0.60.0 → 0.61.0 only), `docs/DESIGN_LINT_REPORT.md` (line-number shifts from the removed BookDetail lines). **Backend files changed: full Docker rebuild required. No schema change, no file operations, no bulk writes — no `library.db` backup needed.**
- **Verified:** esbuild parse clean on BookDetail.jsx (native darwin-arm64 binary); `py_compile` clean on `sessions.py` + `main.py`. Exact-symbol pairing sweep (v0.60.0 standing procedure): new consts `editionFileOnDisk`/`editionFileShared` declaration+usage paired (2 decls at 1526–1527, 2 JSX consumers at 3295–3296); setter-case grep `setEditionFileOnDisk|setEditionFileShared` = 0 (derived consts, not state — no setters exist to orphan); retained symbols fully paired — `openAddSession` 1 decl + 3 callers, `showCollectionPicker` decl + render gate, `setShowCollectionPicker` decl + 2 call sites (the capital-S setter-case distinction checked explicitly per the v0.60.0 blank-page lesson); "Remove Edition" 0 hits, "Remove Format" 1 header + 1 comment; pencil path `M17 3a2.83` reduced to exactly the two intentional survivors (Collections + Notes headers); plus path `M12 5v14` exactly the two new History headers. No imports added or removed (cross-module export grep n/a this session). Design-lint category summary: hardcoded colors 0, library-* 0, indigo 0, cascade-flip 0, window.confirm 0, **alert() 11 — exactly the parked ledger (CollectionsTab 1, CollectionModal 4, CollectionDetail 2, ImportPage 4)**, Abandoned-in-copy 0, font-bold 0, text-h1 0, raw-`<button>` **128 vs baseline 128** (report-only; the removed menu entries were array items rendered by ThreeDotMenu's single mapped `<button>` source site, and both glyph swaps reuse their existing buttons).
- **Microcopy pass flag:** "The file stays — another format still uses it." is one new string, flagged for the batch-2 microcopy verification pass alongside the other format-surface strings.

## [0.60.0] — 2026-07-15

### Added
- **Inline 4-state reading-status toggle on BookDetail (S16 Status Knot, Session B2 — frontend half; Decisions 2026-07-14, snap-back semantics ratified 2026-07-15).** A segmented control directly below Download replaces the ReadingStatusCard + modal stack for owned titles. Four segments from `useStatusLabels().getStatusOptions()` — never hardcoded labels, live-updating via the `settingsChanged` event. Grid is **content-driven from the known labels** (ratified 2026-07-15, replacing two earlier width-driven revisions): the labels come from `getStatusOptions()` at render time — no DOM measurement — and if every label is ≤ `STATUS_LABEL_ONE_ROW_MAX` (11) characters the grid is `grid-cols-4` (`repeat(4, minmax(0,1fr))`, one row); if ANY label exceeds it, the whole control flips to `grid-cols-2` (`repeat(2, minmax(0,1fr))`, true 2×2). Labels that still outgrow their segment wrap to a second line inside it (44px min-height grows), never truncate. Revision history on the record: the original `minmax(140px,1fr)` auto-fit forced 2×2 on every phone; the 76px floor fixed that but its narrow-viewport 2×2 fallback was dead in practice (fired only below ~360px; phones start there) and `auto-fit` can never respond to label length (CSS forbids intrinsic tracks in auto-repeat) — the content-driven rule replaces it entirely. **Threshold decision, reported per ratification:** the spec's proposed 10 was checked against the ACTUAL defaults and fails — the default In Progress display label is "In Progress" (11 chars) per both the settings seed (`database.py:299`) and the hook fallback (`useStatusLabels.js`); "Reading" is not a shipped default anywhere. 10 would render the out-of-box control 2×2, defeating the intent, so the threshold is **11** — the tightest bound admitting every shipped default. Consequence, by design and worth knowing: an 11-char CUSTOM label ("Not started") also stays one-row (wrapping in-segment); the flip to 2×2 starts at 12+ characters. 44px minimum targets. Active-segment colors via status tokens (`status-reading` teal, `status-finished` sage, `status-unread`/`status-dnf` neutral). Tap → B1's one-call session-writing endpoint → refetch → **the toggle and the status pill both render the returned PROJECTION, never the tapped value.**
- **Inline Finished capture.** Tapping the Finished segment opens a date row (defaults today, required, inline validation) + interactive star row (optional, shared `StarRating`) in the surface itself — confirm writes ONE `updateBookStatus(id, 'Finished', {dateFinished, rating})` call through the session path. No modal, no status→dates→rating triple-call.
- **Download-triggered transition.** After a download initiates AND the projected status is Unread, a dashed-border "Start reading this now?" card renders above the toggle. Accept → `createSession` with `date_started` today, `session_status` in_progress, `format: 'ebook'` (the coarse `reading_sessions.format` domain — every downloadable edition is ebook-family) → refetch. Decline dismisses, nothing written. Never renders for other statuses (gated at set time and render time).
- **Snap-back microcopy (both ratified cases).** When Unread is requested but the projection disagrees, the toggle renders an inline note: closed history → "Reading history kept — this title stays {Finished-label}. To fully reset it, delete its past reads in History."; dnf winner → "Set-aside record kept — this title stays {DNF-label}. To fully reset it, delete that record in History." Labels via `getLabel`, so custom labels flow through. Resetting to true Unread stays deliberately manual (History tab → delete session).

### Changed
- **The status metadata pill is display-only** (ratified 2026-07-15) — same visual, no button, no onClick. The toggle is its interactive replacement; a scroll-to button would be the desktop-DOM-dependence pattern CLAUDE.md calls a bug. Rider verified: every `setSelectedStatus` site reads a refetched/server value, so the pill always shows the projection.
- **All ChangeStatus/MarkFinished flows move to the one-call contract** — Library, AuthorDetail, and CollectionDetail (the surviving modal consumers) now send a single `updateBookStatus` call and **apply the returned projected `read_status`/`rating`/`date_started`/`date_finished` to local state** instead of the optimistically-assumed tapped value (mandatory: a snap-back otherwise rendered a lie until refetch). Every trailing `updateBookDates(..., null)` call is deleted. CollectionDetail's checklist section moves now key off the projected status (shared `applyProjectedStatus` helper).
- **Status-modal errors surface in the modal** — the three list views now pass the modals' existing `error`/`saving` props (previously silently swallowed to console): failures keep the modal open with the backend's plain-language detail in the banner; rating-write failures ride the same catch. No new infrastructure — the props existed since the modals were built.
- **ChangeStatusModal microcopy honesty:** "Finish date will be cleared (date)" was false advertising under snap-back semantics — nothing is cleared; closed history keeps projecting. Replaced with an info box shown only for the Unread selection on a title with a finish date: "Reading history is kept — this title may stay {Finished-label} until its past reads are deleted in History."
- **api.js `updateBookStatus` grows the one-call contract:** optional `{dateFinished, rating}` extras → `{status, date_finished?, rating?}` body; JSDoc documents that `read_status` in the response is the projection and can differ from the request.
- **Download button:** verified already reads exactly "Download" with no format suffix — no change needed (spec item closed as satisfied, same as the picker was).

### Removed
- **ReadingStatusCard's owned-book usage, MarkFinishedModal, and ChangeStatusModal are evicted from BookDetail** (usage + imports + render blocks + `showMarkFinishedModal`/`markFinishedError`/`markFinishedSaving`/`showChangeStatusModal`/`changeStatusError`/`changeStatusSaving` state + `handleMarkFinishedConfirm`/`handleChangeStatusFromModal` handlers). The modals survive for the three list views. **ReadingStatusCard survives on its wishlist usage only** (the Acquire card — a different surface with a different job): it is now a wishlist-only component wearing a general-purpose name — batch-3 rename candidate, on the record, not a B2 action.
- **Dead code deleted, grep-verified repo-wide (zero references remain):** BookDetail's never-called `handleStatusChange` + its orphaned `statusLoading`/`statusStatus` state; the unreachable date-editor wiring (`handleDateChange` was never invoked, `showDateEditors` never read) + its `datesLoading`/`datesStatus` state + the write-only `dateStarted`/`dateFinished` state and all ten setter calls (write-only after the editor died — no render read them); `getStatusSubtitle` (only consumer was the evicted card). **api.js `updateBookDates` and `updateBookRating` lost their last consumers in this sweep and are deleted too** (repo-wide grep printed in-session; backend endpoints untouched — they remain part of the HTTP contract). Date-clearing lives in the session editor (`updateSession`), per the B1 contract.
- **Two `alert()` calls removed** — they lived inside CollectionDetail's `handleMarkFinished`/`handleChangeStatus`, the exact handlers the drift addendum ordered rewritten; the modal error banner replaces them. Lint ledger: 13 → 11 (CollectionDetail 4 → 2; remaining two are `handleDelete`/`handleBatchRemove`, parked with the batch-3 alert audit).

### Fixed
- **Every BookDetail navigation crashed to a blank page on the first deploy of this build** (pre-release fix, caught by Marie on the rebuilt container before 0.60.0 was called done). Root cause: the dead-code sweep deleted the `showDateEditors` state but missed one surviving `setShowDateEditors(false)` call inside the load effect — it fired on every mount/`:id` change and threw `ReferenceError: setShowDateEditors is not defined`, unmounting the page. **Why the verification missed it:** the orphan grep used the lowercase state name `showDateEditors`, which does not match the setter's capital-S `setShowDateEditors`; and esbuild parse is a syntax check that cannot see unbound identifiers. The sweep was re-run as an exact-symbol scorecard — every deleted identifier AND its setter-case variant, plus a declaration/usage pairing count for every *introduced* identifier across all five components (the one survivor found was this line; the sole remaining `dateFinished` hit is the intentional object-literal key in the `updateBookStatus` extras payload).

### Technical
- **Modified:** `frontend/src/components/BookDetail.jsx` (toggle surface, Finished capture, start-reading prompt, pill display-only, eviction + dead-code sweep), `frontend/src/components/AuthorDetail.jsx`, `frontend/src/components/Library.jsx`, `frontend/src/components/CollectionDetail.jsx` (one-call contract, projected-state application, modal error wiring; CollectionDetail also `applyProjectedStatus` + alert removals), `frontend/src/components/ChangeStatusModal.jsx` (honest info box, dead `formatDate` removed), `frontend/src/api.js` (`updateBookStatus` extras; `updateBookDates`/`updateBookRating` deleted), `backend/main.py` (version 0.59.0 → 0.60.0 only). **Backend file changed (version bump): full Docker rebuild required. No schema change, no file operations, no bulk writes — no `library.db` backup needed for this deploy.**
- **New component props/exports:** none — the toggle is inline JSX; `STATUS_TOGGLE_ACTIVE` map is module-local to BookDetail.
- **Verified:** esbuild parse clean on all six changed frontend files (native darwin-arm64 binary). Cross-module export grep, both sides printed in-session: `updateBookStatus` imports (BookDetail/AuthorDetail/Library/CollectionDetail) ↔ `api.js:238` export; `createSession` (BookDetail) ↔ `api.js:167` export. Orphan grep across every deleted symbol: zero hits repo-wide. Design-lint category summary: hardcoded colors 0, library-* 0, indigo 0, cascade-flip 0, window.confirm 0, **alert 11** (13 → 11, both removals inside the mandated handler rewrites), Abandoned-in-copy 0, font-bold 0, text-h1 0, raw-`<button>` 128 → **128 (net zero: +1 toggle source site, −1 status-pill button)** — the four rendered segments come from one mapped `<button>`; shared `Button` doesn't fit a stateful segmented control (per-status token styling, `aria-pressed`), and `ui/SegmentedControl` was considered and bypassed on the merits (reviewer advisory, answered): it's a no-wrap `flex-1` single row with a uniform elevated-fill active state and no disabled prop — it cannot deliver the ratified `auto-fit` 2×2 wrap for long custom labels, the per-status token active colors, or the disabled-while-saving state. `Button`, `FormField`, and `StarRating` are used everywhere else in the new surface.
- **Pending phone test (Marie):** confirm default labels render one row of four at ~380px with "In Progress" acceptable (11 chars in an ~81px segment wraps to two lines — single-line 4-up isn't physically available at that width); set a status label to 12+ characters (e.g. "Nicht gelesen" or "Not started yet") and confirm the whole control flips to a true 2×2 with no truncation — note "Not started" (11) deliberately does NOT flip it; plus the download→prompt→accept flow on mobile share-sheet paths.
- **Microcopy pass flags (VOICE_AND_TONE / MICROCOPY_LIBRARY):** the two snap-back strings (above), the ChangeStatusModal info box, "Start reading this now?" + [Start reading]/[Not yet], the Finished capture strings ("Date finished", "Rating (optional)", "Mark {Finished-label}", "Cancel", "Pick a date to mark this as finished" — the last reused from MarkFinishedModal), and the two catch fallbacks "Couldn't update the status. Try again?" / "Couldn't start the session. Try again?" (backend detail renders when present; fallbacks only cover network-shaped failures).

## [0.59.0] — 2026-07-15

### Changed
- **Reading status is sessions-canonical (S16 Status Knot, Session B1 — backend half; Decisions 2026-07-14).** `titles.status` / `date_started` / `date_finished` / `rating` are now a pure projection of `reading_sessions`, recomputed inside the same transaction as every session write. No UI-facing path writes those columns directly anymore. No schema change — the columns stay, only their write discipline changed.
  - **Projection rules** (in `sync_title_from_sessions`, which all session writes already called): status and `date_started` come from the session with the **latest `date_started`, ties broken by higher id** (`ORDER BY date_started DESC, id DESC` — was `session_number DESC`, which let a backfilled old read steal the status); `date_finished` comes from the **latest closed (`session_status = 'finished'`) session only** (was: whatever the latest session carried, including NULL from an open or DNF session); `rating` stays the average of non-null session ratings (int when whole, 1-dp otherwise); no sessions → `Unread` / all NULL. `date_started` joining the projection is a rider on the Decisions block (ratified this session — Marie appends the vault line).
  - **`PATCH /books/{id}/status` writes sessions, not columns.** Requested status → session operation → recompute: *In Progress* keeps the open session or starts one dated today; *Finished* closes the open session (end date + optional rating) or, with none open, records an already-closed session whose `date_started` mirrors the finish date (made-call: keeps the new read latest under date ordering); *Abandoned/DNF* marks the open session `dnf` preserving its `date_started` (its own `date_finished` is left as-is; with no open session, a `dnf` session dated today is created — made-call); *Unread* deletes open sessions (all of them, defensively — made-call) and renumbers, so closed history keeps projecting — Unread on a title with finished reads projects back to `Finished`, which is the honest answer. Request body gains optional `date_finished` + `rating` (B2's one-call Finished capture); response now returns the **projected** state (`read_status`, `rating`, `date_started`, `date_finished`), which can differ from the requested status.
  - **`PATCH /books/{id}/rating`** sets/clears the rating on the latest closed (`finished`/`dnf`) session and returns the projected average (can differ from the value sent). With no rateable session: setting → 400 with a plain-language detail; clearing → benign ok (nothing to clear).
  - **`PATCH /books/{id}/dates`** updates the projection-winning session's dates. **Null now means "leave unchanged", not "clear"** — this kills the date_finished clobber at the contract level while the legacy null-passing frontend handlers survive until B2. Clearing a date lives in the session editor (`PATCH /sessions/{id}` with empty string). With no sessions: benign ok returning projected (null) dates.
  - **Session CRUD (`sessions.py` create/update/delete)** now recomputes the projection *before* commit — one transaction instead of the old commit-then-recompute-then-commit-again pair.
  - **Merge** recomputes the target's projection over the merged session history before commit (new step 7 — records-only; the file-move logic is byte-untouched). Previously the target's status/rating/dates went stale the moment sessions moved over.
  - **Completion status needed no backend severing** (recon item 5): `titles.completion_status` is its own column and no endpoint writes it together with reading status — the coupling is display-side JSX (BookDetail ~2123, UnifiedEditModal ~423 run publication state through reading-status label machinery), which is B2 territory.

### Fixed
- **The date_finished clobber is dead at the layer it actually lived** (third strike: S3, S10, this sprint — root cause was the write path, not the handlers). It had TWO homes: (1) `PATCH /dates` wrote both columns unconditionally, and ChangeStatus flows pass `date_finished: null` by design; (2) the old projection itself copied the *latest session's* `date_finished` onto the title, so a latest DNF/open session nulled a real finish date from a prior closed read. Both paths now preserve it: null-means-unchanged on the endpoint, closed-sessions-only in the projection. Harness check 4 is the death certificate.
- **Backfilled old reads no longer steal the title status** — recording a 2019 read after a 2026 one used to flip status to the 2019 session's (projection ordered by `session_number`, i.e. insertion order). Now date-ordered with id tiebreak (day-granular dates make same-day DNF-then-restart a real tie; insertion order resolves it). Harness check 10.
- **Merge left the target's status/rating/dates stale** against its newly-absorbed session history — recompute now runs in the merge transaction.

### Technical
- **⚠️ FROZEN FILE EDITED — `backend/database.py`, ratified by Marie 2026-07-15, scoped to the body of `sync_title_from_sessions` only** (new ordering, closed-only date_finished, no internal commit — runs in the caller's transaction; docstring updated to say so). Nothing else in the file moved; schema untouched, no migration. Chosen over a new non-frozen projection function because that would have stranded the existing one as dead code in a frozen file — all three session-CRUD callers already pointed here.
- **Modified:** `backend/database.py` (projection body, as ratified above), `backend/routers/sessions.py` (three call sites: recompute moved before commit, same transaction), `backend/routers/titles.py` (`BookStatusUpdate` gains optional `date_finished`/`rating`; `update_book_status` rewritten to session semantics + new `_insert_session_row` helper; `update_book_rating` and `update_book_dates` rewritten to session-writing; merge step 7 recompute; imports: `sync_title_from_sessions`, `date`), `backend/main.py` (version 0.58.0 → 0.59.0), `CHANGELOG.md`, `ROADMAP.md`. **Backend changed: full Docker rebuild required. Back up `library.db` BEFORE phone-testing — this release changes write semantics (bulk-write trigger applies).**
- **Not touched, on the record:** `sync.py` (recon confirmed its fill-empty candidate list contains no status/rating/date columns — no drift there, nothing to flag); the initialization-only `COALESCE(NULLIF(status,''),'Unread')` writes (TBR convert, upload auto-convert, startup half-state fixer) stay — they only fill empty to the projection's own default; `import_metadata.py` still writes status/rating/dates but to the pre-Phase-5 `books` table that no longer exists (dead-broken since the rename, throws on use) — **parked as a batch-3 item: unmount/delete it**.
- **Verified:** 21/21 checks in a scratchpad harness (dev-only, not committed) driving the real endpoint functions against aiosqlite + temp DB built from the real `SCHEMA`: latest-date_started wins; same-date tie → higher id; **DNF preserves date_started AND a prior closed session's date_finished (the clobber's death certificate, at the projection layer)**; no-sessions → Unread/all-null; rating averaging incl. int-when-whole; recompute fires on session create, update, and delete; Finished-with-no-open creates the closed session correctly; Finished closes the open session in place; Unread deletes open sessions, renumbers, and lets closed history keep projecting (and goes truly Unread when open was all there was); **backfilled old read no longer steals status (rider check)**; rating-with-no-closed-session → 400, clear → benign ok; dates null-means-unchanged + no-op returns projected values. `py_compile` clean on all four touched files. No `frontend/src` changes → no design-lint run owed; no new cross-module imports beyond `titles.py` → `database.py` (`sync_title_from_sessions` — export grep both sides: `titles.py:26` ↔ `database.py:690 async def sync_title_from_sessions`).
- **Session B2 handoff — api.js functions whose contract changed:** `updateBookStatus(bookId, status)` — endpoint now accepts `{status, date_finished?, rating?}` (one call replaces the MarkFinished status→dates→rating triple) and returns projected `{read_status, rating, date_started, date_finished}` where `read_status` can differ from the request (Unread with closed history → `Finished`; optimistic UI at BookDetail ~1106 will briefly disagree until refetch). `updateBookRating(bookId, rating)` — response `rating` is now the projected AVERAGE, not the echoed value; rating an Unread/no-closed-session title now 400s (star widgets must expect it). `updateBookDates(bookId, dateStarted, dateFinished)` — nulls no longer clear (api.js's `|| null` coercion means "clearing" via this function is now a silent no-change — B2 must route clears through `updateSession`); the ChangeStatus flows' trailing `updateBookDates(..., null)` calls are now harmless and should be deleted. `createSession`/`updateSession`/`deleteSession` — unchanged shapes, projection now recomputes atomically.

## [0.58.0] — 2026-07-14

### Changed
- **BookDetail renders every section fully expanded, always** (Session A — subtractive; decided 2026-07-14 from daily use: scrolling is free on this screen, hiding content is not). No chevrons, no toggles, no "View more" fade, no disclosure of any kind. Pure deletion — no new features, no restyling, no section reordering (order is the next session's decision and needed an honest screen to decide against).
  - **About This Book / Tags / Metadata** no longer render through `ui/CollapsibleSection` — each is now a plain heading + content inlined with the exact markup the component produced in its expanded state (same `h3` classes, same `px-4` spacing, Tags keeps its "N tags" count in the header), so nothing shifts visually except the truncation dying. The `maxHeight`/`overflow-hidden` truncation wrapper, gradient fade, and "View more"/"View less" toggle are gone with the component usage. A long summary is now a long scroll — accepted consequence, on the record.
  - **Files section is always open.** The header is a plain `<h2>` again — the heading-wraps-button disclosure pattern, its `aria-expanded`, and the decorative `aria-hidden` chevron duplicate button are all deleted. Edition rows and the [Add format] / [Add files] footer actions now always show (previously only while expanded).
  - **The Files Edit ⇄ Done toggle survives** — it gates destructive actions, not disclosure. Still in the section header, still hidden at a single edition (`editions.length > 1` guard on both the toggle and the per-row ×), and a successful delete down to one edition still exits edit mode. The "reset edit mode on collapse" half of `toggleFilesSection` is deleted (no collapse to reset on); the **reset-on-id-change in the load effect stays** — that's the v0.57.0 cross-navigation fix, which is about navigation, not disclosure.

### Removed
- `filesExpanded` state, `toggleFilesSection`, the Files chevron SVG, and BookDetail's `CollapsibleSection` import/usages. The Edit-button's dead `e.stopPropagation()` went with the clickable header it was defending against.
- **`ui/CollapsibleSection.jsx` itself is NOT deleted** — recon halt-condition check: `ComponentPreview.jsx` (the component gallery) still imports and demos it, so removing BookDetail's *usage* was the scope. BookDetail was its only production consumer; the batch-3 "CollapsibleSection is a naming lie" item stays open (the component still exists, now gallery-only).

### Technical
- **Modified:** `frontend/src/components/BookDetail.jsx` (three CollapsibleSection usages inlined as plain sections; Files header/body de-disclosed; `filesExpanded` + `toggleFilesSection` deleted; load-effect reset trimmed to `filesEditMode` only; stale "Collapsible" comments corrected), `backend/main.py` (version 0.57.0 → 0.58.0 — **backend file changed: full Docker rebuild required**, even though the change is frontend-only), `CHANGELOG.md`, `ROADMAP.md`. **No schema change, no file operations, no `library.db` backup needed for this deploy.**
- **Verified:** esbuild parse clean on `BookDetail.jsx` (native esbuild via `deno run -A npm:esbuild`); no import added, so no export-side grep owed (only the CollapsibleSection import was *removed*). Leftover grep clean — zero hits for `filesExpanded` / `toggleFilesSection` / `CollapsibleSection` / `aria-expanded` / `rotate-180` in BookDetail; the four surviving `overflow-hidden` in the file are real layout (desktop dropdown, mobile bottom sheet, fullscreen notes editor, Series card corner-clipping), not disclosure. Design-lint category summary: **`alert()` exactly 13** (untouched, per session scope), every other strict category 0, raw-`<button>` report-only **130 → 128** (−2: the Files header disclosure button and the decorative chevron button became a plain heading / were deleted).

## [0.57.0] — 2026-07-13

### Added
- **Files section on BookDetail — format actions have a home** (Batch 2 Session 3; 2026-07-12 decision, hybrid mockup approved 2026-07-13). A collapsed-by-default "Files" section sits directly below Collections (owned titles only): one row per edition — `FORMAT · filename · size` for file-backed editions, `FORMAT · No file` for fileless ones. Size is **stat'd at request time, never stored** (locked decision): `EditionSummary` gains `file_size`, filled per-request in `row_to_title_detail` with a try/except that returns `null` for missing/stale paths — which the row renders as "size unavailable" instead of a wrong number. Footer actions [Add format] (the existing Add-Edition modal) and [Add files] (navigates to `/add?mode=upload&linkTo={id}`) show whenever the section is expanded. Destructive actions are gated: an Edit link in the section header (only when expanded and the title has 2+ editions — same `> 1` guard the old menu item had) flips to Done and reveals a per-row remove × (44px `IconButton`, screen-reader label "Remove [FORMAT]") that opens the existing confirm modal; edit mode resets when the section collapses. Recon finding: the planned "Add files" action needed **no AddPage work** — `/add?mode=upload&linkTo` handling already exists end-to-end (built for the wishlist Acquire flow, which uses the identical navigation); the decision log had it as "never built".
- **Removing a file-backed format now moves its file to `_trash/`** — the last file-touching operation that didn't. New `move_file_to_trash(file_path, books_root)` in `backend/services/trash.py`, a **sibling** of `move_to_trash` (which is untouched — its directory-only raise is the delete-title contract; this one is the mirror image and refuses directories). Same containment guards (outside-root, root itself, already-in-trash, resolved symlink-safe), collision suffix goes before the extension ("book_1.epub"), move-only, never a delete. `delete_edition` applies the v0.55.0 files-first contract: trash the file BEFORE the DB delete; if the DB delete then fails, the file moves back and the request returns a plain-language 500 ("Nothing was removed" register) that surfaces in the modal's existing inline error banner. Guards mirroring `delete_title`: a file another edition row still references is left in place (records-only delete), as is a path already gone from disk; fileless editions keep deleting records-only. The edition's **folder stays put** — other formats live there. Response gains `trashed_file` (mirrors `trashed_folders`).
- **design-lint `alert(` strict rule** — closes the blind spot 0.56.1 documented: the `window.confirm()` check never matched bare `alert(`, which is how 14 Golden-Rule-3 violations survived every audit (one was fixed in 0.56.1; the lint gap was left open deliberately). New strict category "alert() calls" (`/\balert\(/g` — `window.alert(` matches, `showAlert(`/`_alert(` don't), registered beside `window.confirm()`. It reports **exactly 13 strict violations** (CollectionsTab 1, CollectionModal 4, CollectionDetail 4, ImportPage 4) and that failing count is the point — the honest ledger for batch 3, which fixes the sites; this session deliberately does not (out of scope). `docs/DESIGN_LINT_REPORT.md` regenerated.

### Changed
- **Add Format / Remove Format left the 3-dot menu** (2026-07-12 decision: format actions live on the Files section; nothing replaces them in the menu). The Remove-Format picker modal is deleted — per-row remove made it unreachable (grep-verified: `showEditionPicker` had no other references; the picker's `editionExtensionLabel` helper stays, the download picker still uses it).
- **Remove-format confirm modal** now states the file consequence: "Remove [FORMAT] from this title? The file moves to the trash folder." — the trailing sentence only for file-backed editions (fileless keeps just the question). Footer [Cancel]/[Remove] → **[Keep]/[Remove]** — buttons name outcomes, the safe option is the safe outcome (delete-title's [Keep] precedent; retires the 0.55.0 reviewer observation about this modal's "Cancel"). The 0.56.1 inline error banner and the reading-sessions note are unchanged. Strings flagged for the batch-3 microcopy verification pass.
- **`getBackLabel` knows `/sync-results`** — BookDetail's back button now reads "Sync results" instead of "Library" when arriving from the sync results view (which already sent `returnUrl: '/sync-results'`).

### Fixed
*(All six caught pre-ship by the in-session adversarial review — 37-agent multi-lens workflow, every finding independently verified by 3 refuters — plus the repo code-reviewer. None ever shipped.)*
- **Double-delete race could orphan a file outside the DB** (`titles.py`): the conditional DELETE's `rowcount == 0` branch restored the trashed file unconditionally, but rowcount 0 also covers "a concurrent request already deleted the row" — restoring there would drop the file back into the library with no DB row, and the next sync would re-ingest the format the user just deleted. The branch now re-checks the row: still present (last-edition race) → restore + 400 as before; already gone → leave the file in trash and return success, since row-gone-plus-file-trashed is the intended end state.
- **Confirm modal's close paths were live during an in-flight delete** (BookDetail): [Keep], the header ×, Escape, and backdrop-click all closed the modal unguarded while `handleDeleteEdition` was mid-request — the delete would still complete after the user chose Keep, and a failure would write its error into a modal no longer open (silent failure). All close paths now no-op while `editionDeleting`, mirroring the Delete Title modal's `deleteSaving` guard. Pre-existing shape, but this session made the window meaningfully wider (the request now moves a file on NAS storage first).
- **Edit mode became a trap at one edition** (BookDetail): removing the second-to-last format left `filesEditMode` true while the Done toggle hid itself (`> 1` guard), presenting a remove × on the sole remaining edition that could only 400. The per-row × now carries the same `editions.length > 1` guard as the old menu item, and a successful delete down to one edition exits edit mode.
- **Files-section state leaked across in-page book navigation** (BookDetail): the `/book/:id` route reuses the mounted component, and the load-on-id effect didn't reset the new state — following a series-mate or note link from an expanded-and-editing Files section rendered the next title with remove buttons already showing. Both states now reset in the id effect alongside `activeTab`.
- **`formatFileSize` rendered "1024 KB" for the ~0.5 KB window just under 1 MB** (bytes 1,048,064–1,048,575: the KB branch rounded to 1024 before the MB branch could claim it). Branches on the rounded value now — that window reads "1.0 MB".
- **Files-section chevron was missing `ease-out`** — the app's transition convention is uniformly `duration-200 ease-out` (IconButton itself, BottomNav, CollectionPicker, 20+ sites); the new chevron fell back to Tailwind's default curve. Added.

### Technical
- **Modified:** `backend/services/trash.py` (new `move_file_to_trash` only — `move_to_trash` byte-identical), `backend/routers/titles.py` (`delete_edition` files-first rewrite + named-row access; `EditionSummary.file_size`; per-edition stat in `row_to_title_detail`; import line), `backend/main.py` (version 0.56.1 → 0.57.0), `frontend/src/components/BookDetail.jsx` (module `formatFileSize` helper; Files-section state + toggle; menu items removed; Files section JSX; picker modal deleted; confirm-modal copy/footer; `getBackLabel` case), `scripts/design-lint.mjs` (ALERT_CALL pattern + category + runPattern), `docs/DESIGN_LINT_REPORT.md` (regenerated), `CHANGELOG.md`, `ROADMAP.md`. **Backend changed: full Docker rebuild required.** No schema change — `database.py` untouched; no migration. Back up `library.db` before phone-testing Remove Format anyway: file moves are involved (CLAUDE.md bulk-write trigger, applied conservatively).
- **Verified:** 31/31 checks in a scratchpad end-to-end harness (real `move_file_to_trash`, real `delete_edition`, real `row_to_title_detail` against aiosqlite + temp filesystem; dev-only, not added to the repo): all five trash guards including the directory-path raise; collision suffixing before the extension; file-backed delete lands the file in `_trash/` with the sibling format's file and the folder untouched; **the failure contract — a forced DB failure restores the file from trash, leaves the row intact, returns 500 "Nothing was removed"**; shared-`file_path` delete removes the row but not the file; fileless and stale-path deletes trash nothing; last-edition still 400s with the file untouched; **the double-delete race leaves the file in trash instead of restoring it into an orphan** (row deleted out-of-band between the trash move and the conditional DELETE); `file_size` serializes as int / `null` (fileless) / `null` (stale path). `py_compile` clean on `trash.py`, `titles.py`, `main.py`; esbuild parse clean on `BookDetail.jsx`; import grep both sides printed (`titles.py:28` ↔ `trash.py:57 def move_file_to_trash`). Design-lint category summary: **13 strict** (all the new `alert()` category — intentional, see Added), every other strict category 0, raw-`<button>` report-only 128 → 130 (+3 Files-section header buttons − 1 deleted picker button; the remove × uses shared `IconButton`).
- **Reviewed:** repo code-reviewer — frozen clean (list re-read at review time, none of the six intersect the changed set), scope clean (every hunk maps to a session item; the positional→named row access sits entirely inside the rewritten `delete_edition`, not drive-by), pattern conformance verified (files-first mirrors `delete_title` exactly; section wrapper/header classes match the adjacent Collections section; modal conforms to §4). Two advisories recorded, no action: the Files-row × routes to the existing confirm modal rather than S10's inline-confirm-on-the-row (directed by the session prompt — recorded for the pattern ledger), and the raw-button conversion backlog grew by the 2 net header buttons. Adversarial workflow (4 lenses → 3 independent refuters per finding): 11 raw findings → 8 confirmed (two were the same edit-mode-trap defect; the 6 distinct in-scope ones are fixed above), 3 refuted as intended behavior (symlink-guard claim 1/3, "untrashable file blocks deletion" 0/3 — the stale-path skip covers it, CHANGELOG/ROADMAP "scope drift" 0/3 — CLAUDE.md mandates them).
- **Carry-over (batch-3 microcopy pass):** the confirm modal's "The file moves to the trash folder." renders on any file-backed edition, but the backend deliberately skips the move for stale paths and shared files (records-only) — the sentence over-promises in those two edge cases. The strings are spec-locked verbatim this session; the stale case is even client-detectable (`file_size == null`), so the microcopy pass can decide whether to suppress or hedge. Joins the 13 `alert()` sites (CollectionsTab 1, CollectionModal 4, CollectionDetail 4, ImportPage 4) and the modal's pre-existing "Remove Edition" header (vocabulary now says "format") on the batch-3 list.
- **Implementation note:** the Files section uses BookDetail's established section pattern (`border-t border-border-default pt-4 mt-4`, `text-label text-text-body uppercase tracking-wide` header) with local collapse state and a chevron, not the `ui/CollapsibleSection` component — that component is a text-truncation fade ("View more") with no chevron, no header-action slot, and no expanded-state callback, so the mockup's header (Edit link + chevron, tap-to-toggle, reset-on-collapse) can't be expressed with it, and extending it was out of scope. The disclosure button uses the heading-wraps-button pattern (`<h2><button aria-expanded>`), with the decorative chevron duplicate toggle marked `aria-hidden` + `tabIndex={-1}`.

## [0.56.1] — 2026-07-12

### Fixed
- **Remove Edition failures no longer fire a browser `alert()`** (follow-up chip from the v0.56.0 session review; violation pre-existing since Phase 8.7g). Root cause: `handleDeleteEdition`'s catch called `alert(err.message || 'Failed to delete edition')` — a Golden Rule 3 violation that survived every audit because design-lint's check matches `window.confirm()` only, not bare `alert(`. The Remove Edition confirmation modal now surfaces the failure inline in the same token-correct danger banner as the v0.55.0 delete-title modal (`bg-action-danger/20 … text-body-sm`); the modal stays open so retry stays available, and the banner clears on retry and on re-opening from the format picker (the modal's only entry path). Fallback copy "Couldn't remove this edition. Try again?" replaces "Failed to delete edition"; backend `err.message` still flows through first. Files: `frontend/src/components/BookDetail.jsx` (new `editionDeleteError` state, handler catch, picker reset, modal banner — no new imports), `backend/main.py` (version → 0.56.1; deploys inside 0.56.0's already-forced rebuild, same precedent as the 0.55.0 in-session bump). Left open deliberately (out of this chip's scope): this modal's [Cancel] label (0.55.0 reviewer observation) and design-lint's `alert(` blind spot.

## [0.56.0] — 2026-07-12

### Fixed
- **Merge left the source title's folder on disk, so format-aware sync re-ingested it as a new title** (Batch 2 Session 2). Root cause: `POST /api/titles/{target_id}/merge` was DB-only — it moved and deleted rows but never touched the filesystem, and the S15 format-aware full sync treats any book-file folder outside `_trash/` as a title to (re)create. Merging B into A therefore resurrected B on the next full sync. Merge now moves B's folder(s) to `<books_root>/_trash/` BEFORE any DB write; sync already skips `_trash/` (v0.55.0), so a merged-away title cannot come back.
- **Merge could hand the target an edition pointing into another title's folder** (found during batch-2 review, not previously logged). Root cause: the old merge re-pointed the source's non-duplicate-format editions with `UPDATE editions SET title_id = ?` without updating `folder_path`/`file_path`, so the target ended up owning an edition whose file still lived in the source's folder — a cross-folder pointer into a folder no surviving title owned. This state is now unrepresentable: merge drops ALL of the source's editions and never re-points any.

### Changed
- **Merge is a RECORDS operation — files never move between folders** (Decisions.md 2026-07-12, original batch-2 decision REVERSED same day). The original decision had the source's unique-format files moving into the target's folder with the edition re-pointed. Reversed because: the scenario has not occurred in 1+ year of use, cross-folder file motion is the highest-risk operation in the app, and any format lost this way is recoverable from `_trash/` and re-addable via Add Format. What merge does now: the source's reading sessions (renumbered to continue the target's sequence — unchanged behavior), notes, collection memberships, and backlinks move to the target; ALL of the source's editions are dropped; the source's folder(s) go to `_trash/` with files still inside; the target keeps exactly the files it already had. Folders shared with another title's editions stay in place. Files-first with the v0.55.0 restore-on-failure contract: a failed trash move restores already-moved folders, merges nothing (DB untouched), and returns 500 with plain-language copy that surfaces inline in the merge modal (retry stays available).
- **Merge response shape:** `merged.editions` (moved count) → `merged.editions_dropped`; new `trashed_folders` and `shared_folders_kept` arrays (mirrors the delete-title response). Grep-verified before the rename: no frontend reader of `merged.editions` exists — BookDetail and DuplicatesPage both ignore the response body beyond success/failure.
- **Merge confirm copy rewritten** (BookDetail): the "This action cannot be undone" warning is gone because it is no longer true — files go to the trash folder and can come back (history/notes genuinely move, they aren't destroyed). The confirm step now states what moves over vs. what goes to the trash folder, plus "Files can come back from the trash folder. Emptying it is manual." Footer buttons name their action: [Keep separate] / [Merge] replace [Cancel] / [Merge & Delete]. Headers de-shouted: "Merge into another title" / "Merge into this title?". Search-step caption now states the consequence ("its history moves over, its files go to trash"). The touched blocks' raw `text-sm`/`font-medium` utilities were replaced with typography tokens (`text-body-sm`, `text-label`, `text-caption`, each paired with a config color) — pre-existing violations elsewhere in the modal left alone (out of scope).

### Technical
- **Modified:** `backend/routers/titles.py` (merge endpoint only: files-first trash block copied from `delete_title`'s v0.55.0 contract, drop-all-source-editions, response payload, docstring), `backend/main.py` (version 0.55.0 → 0.56.0), `frontend/src/components/BookDetail.jsx` (merge modal copy/buttons only — no new imports, no new API calls; `handleMerge` and `api.js` untouched), `CHANGELOG.md`, `ROADMAP.md`, `CLAUDE.md` (deploy workflow gains the `lcheck` copy-verification step after two v0.55.0 rebuilds failed on silently-missed file copies; verification rules gain the grep-both-sides import rule — `esbuild --parse` can't see whether an imported symbol is exported). **Backend changed: full Docker rebuild required.** No schema change — `database.py` untouched. Back up `library.db` before the first real-data merge: merge now deletes edition rows it previously re-pointed, and moves folders.
- **Verified:** 37/37 checks in a scratchpad end-to-end harness (modeled on `scripts/verify_trash_delete.py`; real `run_sync_standalone`, real `merge_titles`, real schema via `init_db`, throwaway temp dir — dev-only, deliberately not added to the repo). The contract checks: merged-away folder arrives in `_trash/` on disk; **a full sync after the merge does not re-ingest the source**; the target's edition rows are byte-identical before/after (ids, formats, paths); zero editions point into the source's old folder; sessions renumber continuing the target's sequence (target had 1, source's two became 2 and 3); notes/collections/backlinks all land on the target; a NULL-`folder_path` source merges with `trashed_folders: []` and no error; a folder shared with another title stays on disk and reports in `shared_folders_kept` with the other title's edition untouched; the failure path (simulated move failure on folder 2 of 2) returns 500 "Nothing was merged", restores folder 1, leaves the DB fully untouched (source title, both editions, target session count all unchanged), no stray trash copy. `py_compile` clean on `titles.py` and `main.py`; esbuild parse clean on `BookDetail.jsx`; design-lint category summary in the session report. No new frontend import added (grep-verified `mergeTitles` was already imported and exported).

## [0.55.0] — 2026-07-12

### Added
- **Delete Title with a real trash folder** (Batch 2 Session 1; Decisions.md 2026-07-12). Titles can finally be deleted from the app — the previous no-delete policy forced manual filesystem surgery. Deletion is user-initiated only; **sync still never deletes** (contract unchanged).
  - **Trash, not deletion:** the title's folder(s) move to `<books_root>/_trash/` (`shutil.move`, never `rmtree` — a lesson priced at 618 titles). Name collisions inside `_trash` get numeric suffixes ("Author - Title_1"), never clobbered. Nothing in this feature deletes a file outright; emptying `_trash` is a manual step outside the app.
  - **New endpoint `DELETE /api/books/{title_id}`** (`backend/routers/titles.py`): moves every folder the title's editions reference to trash FIRST, then deletes the titles row — editions, reading sessions, notes, links, and collection memberships cascade via the existing `ON DELETE CASCADE` FKs, so no schema change. A folder still referenced by another title's editions is left in place (shared-folder guard). **Failure contract:** if any move fails, already-moved folders are moved back, the DB is untouched, and the request returns 500 with plain-language copy — files and DB stay consistent (better an orphaned folder than an orphaned DB). If even the restore fails, the copy says exactly which state things are in.
  - **New `backend/services/trash.py`:** shared `move_to_trash(folder, books_root)` helper + `TRASH_DIR_NAME` constant. Containment-guarded — refuses folders outside the books root, the root itself, and anything already in trash. The merge-files decision (Decisions 2026-07-12) will reuse this mechanism.
  - **Sync ignores `_trash/`:** the single discovery walker (`get_book_folders`) skips it alongside hidden folders — recon confirmed every sync flavor (full, incremental, Settings action, post-upload background) funnels through this one walker, so one filter covers all. Upload duplicate detection (`check_duplicates`) also skips `_trash` defensively so trashed folders can never match as "existing" upload targets.
  - **BookDetail 3-dot menu gains "Delete Title"** (danger-styled, after a divider, in both the mobile bottom sheet and the desktop dropdown): two-step inline confirmation in a modal, never `window.confirm`. Step 1 states what goes — the title, its N files, its reading history (N reads) and N notes — and that files move to the trash folder on the server, nothing permanently deleted until that folder is emptied manually. Step 2 carries the honest asymmetry: "Files can come back from the trash folder — reading history and notes can't." Buttons name their actions per the voice doc: [Not Now] / [Delete], then [Keep] / [Delete Title]; all 44px `md`. A failed delete surfaces inline in the modal (retry stays available) AND as an error Toast, and never deletes the DB rows; success navigates to the page's returnUrl (merge precedent — the title no longer exists).

### Technical
- **Created:** `backend/services/trash.py`, `scripts/verify_trash_delete.py` (dev-only end-to-end verification — real `_do_sync`, real `delete_title`, real schema via `init_db`, throwaway temp dir; not part of the Docker image). **Modified:** `backend/routers/titles.py` (new `delete_title` endpoint after `delete_tbr`; `shutil` + trash-service imports), `backend/routers/sync.py` (walker skip + import), `backend/services/upload_service.py` (two `_trash` skips in `check_duplicates` + import), `frontend/src/api.js` (`deleteTitle()`), `frontend/src/components/BookDetail.jsx` (menu item, `danger` menu-item flag in the local ThreeDotMenu, delete modal state/handlers/JSX), `backend/main.py` (version string 0.54.0 → 0.55.0 in-session — the rebuild is already forced, same precedent as the 0.54.0 bump), `docs/DESIGN_SYSTEM.md` (§4 "Destructive confirmations" rewritten — Marie's in-session ratification; inline-where-in-place-control-exists, two-step modal for menu/header-launched deletes). **Backend changed: full Docker rebuild required.** No schema change — `database.py` untouched (the existing cascades already do the row cleanup); no library.db backup required for this deploy (no migration, no bulk write — deletion is a per-title user action).
- **Verified:** 25/25 checks in `scripts/verify_trash_delete.py` — full sync ignores pre-seeded `_trash` content; delete moves the folder and cascades sessions/notes; **the contract test: a trashed title does not reappear on the next full sync**; collision suffixing + all four containment guards; the failure path (simulated mid-move failure on a two-folder title → HTTP 500 with "Nothing was deleted" copy, first folder restored, second untouched, DB row intact, no stray trash copy). The test bed caught one real bug pre-ship: the endpoint originally selected `titles.folder_path`, which doesn't exist — folder paths live on `editions` (the API's `book.folder_path` is derived from the primary edition); fixed to edition-sourced folders before any deploy. `py_compile` clean on all four backend files; esbuild parse clean on both frontend files; design-lint 0 strict violations in every category (raw-button report-only unchanged at 128 — the modal uses shared `Button`; `docs/DESIGN_LINT_REPORT.md` regenerated, diff is run-date + BookDetail line shifts only). Repo code-reviewer: frozen clean (list re-read at review time; `database.py` untouched), scope clean (every hunk maps to a session item), pattern conformance verified (Modal/§4 footer order, error-banner class parity with ChangeStatusModal, tokens only, endpoint mirrors `delete_tbr`, no route collision with `/books/{id}/cover`).
- **Ratified in-session:** (3) the confirmation-modal-vs-inline tension is **resolved** — Marie amended DESIGN_SYSTEM.md §4 "Destructive confirmations (S10 pattern)": single-item deletes confirm inline **where an in-place control exists** (row/card/list item); actions launched from a 3-dot menu or section header (no in-place surface) confirm via a two-step modal — step 1 states what's affected in counts, step 2 states what is/isn't recoverable, buttons name their action, safe button is the safe outcome never a deferral. `window.confirm`/`alert` stay banned everywhere. This session's Delete Title flow is the pattern's first instance.
- **Still needs Marie's ratification (reviewer findings, none blocking):** (1) the defensive `_trash` skips in `upload_service.py`'s `check_duplicates` — not strictly sync discovery, but without them a re-upload of a trashed book could match trash content as an "existing" target (recommend keep); (2) the `danger` flag added to the local ThreeDotMenu item shape — minimal mechanism to style the destructive item.
- **Reviewer observations (low, for the batch-2 microcopy pass):** `shared_folders_kept` in the delete response is never surfaced to the user (the title deletes as requested; shared files deliberately stay for the other title — silently); the older Delete Edition modal still says "Cancel" (correctly untouched — out of scope — but now the inconsistency).
- **New microcopy strings pending MICROCOPY_LIBRARY.md addition** (joins the 0.53.0/0.54.0 pending batch): the two-step delete confirmation ("Delete this title?" question; step-1 consequences with counts + "Its N files move to the trash folder on your server. Nothing is permanently deleted until you empty that folder yourself."; step-2 "Files can come back from the trash folder — reading history and notes can't." / "Reading history and notes can't be brought back." / reuse of the approved "This can't be undone."), menu label "Delete Title", button pairs [Not Now]/[Delete] and [Keep]/[Delete Title], and the failure strings ("Couldn't move this title's files to trash. Nothing was deleted — try again?" and its restore-failed variant).
- **Errata applied to earlier entries (factual corrections, no flattening):** [0.53.0] and [0.54.0] headers dated 2026-07-12 (they deployed together); [0.54.0]'s repair note updated from "restoration … a data-ops task" to the closed decision — the 618 titles are not being restored (Decisions.md 2026-07-12).

## [0.54.0] - 2026-07-12

### Fixed
- **P1 — Full sync no longer overwrites manual metadata edits** (Full-Sync Overwrite Contract, Decisions.md 2026-07-11). The v0.53.0 production full sync updated 2,170 titles and overwrote hand-corrected metadata with file-extracted values; a DB diff confirmed **618 damaged titles**. Root cause: the per-folder existing-title UPDATE in `backend/routers/sync.py` (Phase 9B era) wrote `title`, `authors`, `category`, and both cover colors **unconditionally**, and wrote every `COALESCE(?, field)` enhanced field (series, publication year, summary, tags via its own CASE, fandom, relationships, characters, ratings, source URL, ISBN, publisher, chapter count, completion status) **whenever extraction produced a value** — its "(preserve user edits)" comment only held when the file yielded nothing. Phase 9B had made file metadata *primary* for title/authors by design; v0.53.0's Full Library Sync button made the path reachable from the UI at library scale, turning a latent policy into deterministic data loss.
  - **The contract now enforced at the shared write path (`_do_sync`)**: sync is a file registry, not a metadata authority. NEW titles (unknown folders) extract and write everything, exactly as before — that INSERT path is untouched. EXISTING titles get **fill-empty-only**: a field is written only when the stored value is empty (`NULL` or `''`; the JSON-list columns `authors`/`tags` also count their empty serialization `'[]'`) AND the extracted/derived candidate is non-empty by the same test. Populated fields are never written, regardless of source — the test is emptiness, nothing else, so placeholder values (e.g. "Unknown Author") count as populated and are preserved. Per-title **Rescan Metadata** (3-dot menu) remains the deliberate re-extraction surface, untouched; the bulk rescan endpoint already had per-field "only if not already set" semantics and served as the in-repo pattern precedent for the fix.
  - **Not a `full=true` bug — every route is covered.** The overwriting UPDATE also ran on *incremental* syncs for any folder reaching the processing loop without an edition row at its exact path: content-matched relocations (renamed/moved folders), the losing folder of a format conflict, and the background sync every upload triggers. The fix sits at the single shared UPDATE, so no sync mode can overwrite populated fields. Verified end-to-end on the relocation route specifically.
  - **Untouched titles are now byte-identical after a sync.** A title with nothing to fill gets **no UPDATE at all** — previously every existing title's `updated_at` churned on every full sync (and `is_orphaned` was rewritten to 0 unconditionally; it now writes only on actual orphan recovery, which is registry state and still works with zero fills).
  - **Cover fields (recon finding, reported not changed):** the cover-extraction block was already contract-safe for user data — `cover_source='custom'` covers are never touched; non-custom covers re-extract each sync (idempotent same-value DB writes; a stale-clear branch handles vanished covers). Left as-is. `cover_color_1/2`, however, were part of the unconditional UPDATE (regenerated from the possibly-overwritten title every sync) and are now fill-empty like the rest — which also keeps rendered GradientCover gradients stable for existing titles.
  - **Repair note:** this fix stops future damage; it does not restore the 618 already-damaged titles. **Closed 2026-07-12 — no restoration** (Decisions.md, P1 ratifications): too many changes have landed since the pre-sync backups to make a revert worth it; the library moves forward from its current state. *(Erratum: this note originally framed restoration as a pending data-ops task.)*

### Added
- **`SyncResult.fields_backfilled`** — counts empty fields filled across the run (fills, never rewrites). Surfaces in the sync message ("N empty fields backfilled"), and the results view's counts grid gains a conditional "Fields backfilled" row (shown only when > 0; older stored results without the key simply don't show it). No new finding types. The `updated` counter is **redefined** to count only titles that actually had fields filled (previously: every existing title processed — which is how a routine full sync reported "2,170 updated"). `updated` feeds no needs-attention or clean-state math on either surface, so the display contract holds; a clean full sync now honestly reports "0 added, 0 updated".

### Changed
- **Full-sync confirmation copy** (`frontend/src/pages/Settings.jsx`): was "This rescans every folder and refreshes each title's details from its files" — which described the bug as a feature. Now: "Run a full sync? This rescans every folder, registers new files and formats, adds missing titles, and fills gaps in empty fields — it may take a while."

### Technical
- **Modified:** `backend/routers/sync.py` (module-level `_is_empty_field` + `build_fill_empty_updates` helpers; the existing-title branch now SELECTs the full current row — replacing the previous is_orphaned-only SELECT, no net query added — and builds a dynamic fill-empty UPDATE mirroring the bulk-rescan builder; `result.updated += 1` moved from the unconditional post-cover site into the fill path; `fields_backfilled` on SyncResult; message line), `frontend/src/pages/Settings.jsx` (confirmation copy only), `frontend/src/pages/SyncResultsPage.jsx` (conditional counts-grid row). **Backend changed: full Docker rebuild required.** No schema change — `database.py`, `covers.py`, `metadata.py` (all frozen) untouched. `backend/main.py` version string bumped 0.53.0 → 0.54.0 in-session (Marie's call, avoiding another-release drift; the rebuild was already forced).
- **Verified:** end-to-end test against the REAL `_do_sync` in a scratch venv (fastapi/aiosqlite/current pydantic — the pinned pydantic-core 2.14.6 can't build on local Python 3.14; version drift affects only the local test bed, not the container) with real epub metadata extraction (`metadata.py` is stdlib-only, so crafted EPUB2 OPFs drive the true pipeline): (A) a fully-populated hand-edited title survives a **full** sync byte-identical, `updated_at` included, against an epub carrying conflicting title/author/summary/tags; (B) a title with empty category/year/word-count/summary/tags/cover-colors gets exactly those 7 fields filled from the file (logged per-field), while its populated title/authors resist the file's different values and `updated_at` bumps; (C) the **incremental** relocation route re-points the edition (registry write) while the populated title row stays byte-identical, `updated == 0`; (D) a brand-new folder still gets full extraction + edition. Counters and message asserted (`added==1`, `updated==1`, `fields_backfilled>=5`, "empty fields backfilled" present; run 2: `updated==0`, `fields_backfilled==0`, prior folders skipped). Plus `py_compile` clean, esbuild parse clean on both JSX files, design-lint 0 strict violations (raw-button report-only unchanged at 128). Repo code-reviewer: frozen clean (read-only verification reads of metadata.py/database.py only), scope clean (every hunk maps to a prompt item; CHANGELOG/ROADMAP + three-file diffs from the concurrent-in-tree S15.2b session correctly attributed, not drift), pattern conformance to the bulk-rescan precedent confirmed — two recorded divergences, both deliberate: stored `'[]'` counts as empty for authors/tags (the precedent's truthiness test agrees in effect; the contract states it explicitly), and a numeric `0` candidate can fill a NULL numeric field (edge, noted for the record). Reviewer also confirmed `relationships`/`characters` as `json_list=False` matches metadata.py's parser contract (returns `None`, never `'[]'`), and that dropping the unconditional `is_orphaned = 0` is behavior-identical (column defaults to 0).
- **New microcopy strings pending MICROCOPY_LIBRARY.md addition** (joins the 0.53.0 pending batch): the results-view "Fields backfilled" label, the sync-message "N empty fields backfilled" part, and the new full-sync confirmation body.

## [0.53.0] - 2026-07-12

### Added
- **S15.2b — Format-aware upload** (Decisions.md, S15 Decision Sprint 2026-07-10; ROADMAP "Remaining S15 follow-ups"). Sync has been format-aware since v0.52.0; upload still recorded a single `'ebook'` edition for the first moved file, so sibling files stayed invisible until the next **full** sync (incremental sync skips folders that already have editions). Every upload path that records editions now mirrors sync's model — one edition per (title, storage format), format derived via `EXTENSION_TO_FORMAT` from `backend/constants.py`, `.htm` normalizing to `'html'` at derivation time exactly like sync and the relabel migration:
  - **`add_files_to_existing_title`** (finalize `add_to_existing`): one edition per format of the moved files, recorded at each file's **actual** destination — previously the single `'ebook'` record used the first file's original name, so a collision-renamed move ("book_1.epub") recorded a path pointing at the pre-existing same-named file instead of the moved one. Also now populates `acquired_date` like every other insert path (previously left NULL — the old statement set only `created_at`, which the schema defaults anyway).
  - **Finalize `'created'`** — folder discovery is sync's own `discover_book_files` (shared import: hidden AppleDouble-style files excluded, alphabetical pick), replacing a glob loop over `['.epub','.pdf','.mobi','.azw3']` that missed `.azw`/`.html`/`.htm` — uploads of only those formats previously created `file_path=None` editions. The epub-preferred metadata pick is sync's expression verbatim; `create_title_from_upload`'s existing-title early-return also records missed formats now (guarded), closing the same invisible-until-full-sync gap when a re-upload lands new formats into an already-recorded folder.
  - **Finalize `'format_added'`** — previously recorded **no** editions at all (new formats copied into an existing folder waited for a full sync); now records the landed files' formats. `finalize_book` returns the landed paths for this (`moved_files` — internal plumbing, never serialized into the response).
  - **`link-to-title`** (TBR → Library): per-format editions instead of a single first-file `'ebook'` record; keeps a file-less `'ebook'` fallback when nothing recognized moved, so the converted title still reads as an owned ebook. Response gains additive `skipped_duplicates` (older clients ignore it).
  - **Same-format duplicates within one upload:** the alphabetically first file wins, the rest are skipped and surfaced — per-book result `message` on the finalize paths, `skipped_duplicates` + logs on link-to-title. Files always land on disk; only the edition record dedupes (sync's rule, locked decision Decisions 2026-07-10).
  - **Aborted-relabel defer guard, as in sync:** if the target title still has a file-backed legacy `'ebook'` edition, edition recording defers entirely (surfaced in the result message; the post-upload background sync's results view reports the title as deferred) — writing storage rows would duplicate those files AND permanently block the relabel migration on the unique index.
  - New `upload.py` helpers: `group_moved_files_by_format` (alphabetical pick, hidden-file exclusion, `EXTENSION_TO_FORMAT` derivation) and `insert_editions_per_format` (defer guard + per-insert `IntegrityError` backstop; never commits — callers own the transaction).
- **S15.3b — Post-sync results view, persistent + actionable** (Decisions.md 2026-07-11 S15.3 Scope Lock). Sync findings — format conflicts, same-format duplicate skips, missing-file warnings, deferred unmigrated titles, per-format created counts — previously existed only in container logs; this view replaces log-reading and is the ONLY surface for file-level format conflicts (Find Duplicates covers duplicate titles, not files).
  - **The last SyncResult is persisted from every sync path** (`backend/routers/sync.py`): `_do_sync` now writes the finished result as JSON to the settings table under `last_sync_result` (stamped with a UTC `finished_at`) on every exit path — normal completion, the two early returns (books path missing / no folders), and a new interrupted-run handler. Stored in the existing settings storage per the session prompt — no new table, `database.py` untouched (the `value TEXT` column holds a JSON string cleanly; serialization at the router layer follows the `collections.auto_criteria` precedent). Persistence failure is logged and never raised — a sync must not fail because its report couldn't be saved; the caller still receives the live result (accepted narrow gap: the stored copy would go stale until the next sync).
  - **SyncResult now carries the identities behind its counters**: four new detail-list fields (`format_conflict_details` with title + BOTH folder paths, `duplicate_skip_details` with folder + kept file + skipped files, `missing_file_details` with title + expected path, `unmigrated_title_details` with title + folder) — exactly what the existing `print()` log lines already knew, structured instead of printed. No new data invented. Lists are capped at `DETAIL_CAP = 200` entries each to keep the stored blob bounded; the counters are never capped, and the view says "…and N more not shown" past the cap (no silent truncation). The two `IntegrityError` conflict backstops look up the winning edition's folder (`_conflicting_folders`) so even race-detected conflicts show both paths.
  - **Failed and interrupted syncs are recorded** (rider from S15.3a): a mid-sync crash previously escaped as an HTTP 500 and the SyncResult was lost — "Last sync" could have claimed a clean state after a failed run. `_do_sync` now catches the crash, rolls back the open partial transaction (per-folder commits already applied stay, as before), records status `error` with the approved "Sync didn't finish. Your data is safe — try again?" copy, persists it, and returns it (the endpoint contract changes from 500 to a structured `status: "error"` result — the frontend already handled that status).
  - **"Last sync" row on Settings** (Library Tools, under the sync actions): one-line summary — relative time + headline counts, worst news first ("2 hours ago — 3 added, 5 updated, 2 need attention", or "— didn't finish" / "— no folders found"), tap-through to the results view. Shows "No syncs recorded yet." before the first post-deploy sync.
  - **Results view at `/sync-results`** (`frontend/src/pages/SyncResultsPage.jsx`, new): status card (danger-tinted for failed runs, warning-tinted for zero-folder runs with the approved "No folders found" copy, counts grid with Added/Updated/Skipped/Folders scanned + conditional Recovered/Orphaned/Errors); findings grouped by type in plain language, problems first — Format conflicts (title link + both folder paths), Missing files (title link + expected path, hint says the resolution: open the title to remove or merge it), Duplicate files skipped (folder + kept + skipped, "skipped, not deleted"), Deferred titles (title link + folder); created editions get a quiet one-line summary card ("New editions · 12 — 8 epub · 4 pdf" — confirmation, not a problem list). Title links carry `returnUrl: '/sync-results'` so BookDetail's back button returns to the report. Clean sync → "✨ Everything in its place — nothing needs attention" (new string per the MICROCOPY empty-state formula); never-synced → "No syncs yet" with the how-it-gets-here line. Loading / fetch-error (with Try again) states included. Mobile-first: long NAS paths `break-all`, 44px targets, `max-w-2xl` on desktop.
  - **Manual syncs land on the results view**: both the quick "Sync Library" and S15.3a's Full Library Sync navigate to `/sync-results` on every completed run — clean, with findings, failed, or zero folders — replacing S15.3a's interim toast-only outcome surfacing (accepted finding now resolved). Toasts/inline notices remain only for the two cases with no fresh stored result: `already_running`, and the request dying mid-run (the "Lost contact" probe path is unchanged).
- **S15.3a — Full Library Sync action on the Settings page** (Decisions.md 2026-07-10 S15 Session 3 follow-up + 2026-07-11 S15.3 Scope Lock). The API has supported `POST /api/sync?full=true` since v0.52.0, but no UI could send it — the production backfill had to be triggered outside the app. Now a "Full Library Sync" row sits under Library Tools, directly below the quick "Sync Library" row:
  - **Inline confirmation** (never `window.confirm`): tapping the row toggles a neutral-styled card — "Run a full sync? This rescans every folder and refreshes each title's details from its files — it may take a while." with Cancel (ghost) / Run Full Sync (primary), both 44px `md` per the mobile-first minimum. Neutral (not danger) styling is deliberate: a full sync is heavy, not destructive.
  - **Live progress while it runs:** the run uses the existing `syncLibrary(true)` (`api.js` unchanged — the `full` param and `getSyncStatus()` already existed; the latter had zero callers until now). While the synchronous request is in flight, `GET /api/sync/status` is polled every 2s and a caption line under the row shows "Preparing…" then "Scanning folders — X of Y". The row itself shows the SettingsRow spinner and is disabled for the duration. Poll failures are swallowed by design (best-effort telemetry; the POST reports the outcome).
  - **Every outcome surfaces via Toast** (first Toast usage on the Settings page; auto-dismisses after 5s): success → "Library synced — X added, Y updated" (headline counts per the session prompt — S15.3b's results surface hasn't shipped, so this is the interim success surface); completed with per-folder errors → error toast "Sync finished — X added, Y updated, N error(s)" (pluralized); backend `already_running` → "A sync is already running. Try again in a moment."; backend `error` status → the backend message (actionable for a self-hosted admin, e.g. books path missing) with the approved "Sync didn't finish. Your data is safe — try again?" as fallback; empty scan (`total === 0`, e.g. unreachable mount) → error toast "No folders found — check that the library folder is reachable." instead of a false success.
  - **Honest failure copy when the request dies mid-run** (adversarial-verification finding): a minutes-long synchronous fetch can be killed client-side (mobile screen lock, dropped connection) while the server sync keeps running. The catch now probes `GET /sync/status` once — if the sync is still running it says so ("Lost contact with the sync — it may still be running. Check back in a few minutes.") instead of falsely claiming "didn't finish"; the approved incomplete-sync string is reserved for genuine failures. The "Your data is safe" reassurance passed the voice doc's truth check: sync commits per folder and never deletes, so a dead request loses at most the in-flight folder's uncommitted transaction.
  - **Concurrency guards** (adversarial-verification findings): quick sync and full sync mutually exclude via handler guards + row/button `disabled`; the confirm panel's Run Full Sync button is disabled while a quick sync runs (was a silent no-op); a new `reloadPending` flag — set the moment the quick sync schedules its 1.5s post-sync page reload — blocks starting a full sync that the reload would kill; Rescan Metadata and Extract Covers rows are disabled during a full sync (bulk cover extraction has **no** backend guard against a concurrent sync — both write to `titles`; the backend-side guard is noted below as a carry-over).
  - **Screen-reader outcomes:** `ui/Toast.jsx` had no live region, so the Settings render wrapped it in a persistent `<div role="status">` — outcomes announced without touching the shared component. (Superseded before release — Toast.jsx now owns the live region and the wrapper is removed; see Fixed below.) The ticking progress line deliberately carries **no** `role="status"` (a 2s-cadence live region would re-announce for minutes on end).

### Changed
- **Quick "Sync Library" row** (same file): re-entry guard extended to `syncing || fullSyncing`, row disabled during a full sync, and its success path now sets `reloadPending` before scheduling the reload. Handler, inline result line, and reload behavior otherwise untouched. *(S15.3b superseded the success path — see below.)*
- **S15.3b — quick-sync handler rewired** (`frontend/src/pages/Settings.jsx`): completed runs navigate to `/sync-results` instead of showing an inline count line and scheduling a 1.5s `window.location.reload()`. The reload existed to refresh cached library data; navigation makes it unnecessary (Library remounts and refetches when next visited). With the reload gone, the `reloadPending` flag became dead code and was deleted (repo-wide grep: zero references remain); the quick/full mutual-exclusion guards stay. The handler also stops treating backend `already_running` / thrown errors as success: `already_running` gets the approved inline notice, request failure gets the approved "Sync didn't finish. Your data is safe — try again?" instead of "Sync failed. Check console for details." (console-speak, voice violation). The inline notice line is now danger-only — its success branch could no longer be reached (dead branch removed).
- **S15.3b — full-sync confirmation dismissal relabeled "Cancel" → "Not Now"** (rider; Decisions.md 2026-07-11 ratification: voice doc's never-Cancel rule wins over the S15.3a prompt's locked label). "Not Now" is the voice doc's approved secondary/dismissal action (VOICE_AND_TONE Error Messages §3); "Keep"-style safe-outcome verbs don't fit a not-yet-run action. No other dismissal was introduced this session — the results view is a page, not a modal.
- **docs/DESIGN_SYSTEM.md §3 Toast corrected** (named carry-over from the Toast follow-up task): "no live region yet" → the persistent `role="status"` polite live-region contract (gate the `toast` value, never the component), and "Falsy `toast` renders nothing" → "renders an empty (but still mounted) live region". Two sentences, same stale fact.

### Fixed
- **S15.2b — upload's edition inserts were unguarded or riding a broken OR-IGNORE dedupe** (S15 recon fold-in). Root cause: `create_title_from_upload`'s `INSERT OR IGNORE` dedupe worked only because every upload wrote `format='ebook'`, so re-inserts always collided on the `UNIQUE(title_id, format)` index; once uploads write storage formats, legacy-`'ebook'` titles no longer collide and re-uploads could create duplicate editions where they were previously (silently) ignored. `add_files_to_existing_title`'s insert had no guard at all — a unique-index collision crashed the whole finalize request with a 500. Both paths (and all new per-format inserts) now use sync's explicit `aiosqlite.IntegrityError` backstop: the existing edition wins, the collision is logged and surfaced in the result message.
- **S15.2b rider — background-sync log line claimed success for failed syncs** (`backend/routers/upload.py`; reported out-of-scope by S15.3b, in-scope here). Root cause: S15.3b made `_do_sync` absorb its own crashes into a `status='error'` result instead of raising, so `trigger_library_sync`'s `except` branch stopped firing for them and the unconditional "Background sync complete: …" line printed for caught-crash results. The log now checks `result.status` and reports "Background sync failed: …" for error results.
- **Toasts are now announced by screen readers — app-wide** (`frontend/src/components/ui/Toast.jsx`; follow-up task to S15.3a, closing its first carry-over). Root cause: the component early-returned `null` when there was no toast and its container carried no `role`/`aria-live`, so no live region was ever mounted before a toast appeared — and a live region only announces content injected into an *already-mounted* region. Every toast in the app (BookDetail's many, ComponentPreview, Settings) therefore appeared and vanished silently for screen-reader users: the copy-side silent failure VOICE_AND_TONE forbids. Fix: the outer positioning div is now a persistent polite live region (`role="status"`) that stays mounted with no toast; only the toast card inside is conditional. Simply adding the role to the old sometimes-unmounted div would **not** have fixed it — the region-before-content mechanic is documented in the component header, along with the consumer contract (render `<Toast toast={toast} />` unconditionally; gate only the value). The old "entrance animation" classes (`animate-in fade-in slide-in-from-bottom-4 duration-200`) turned out to be dead code, surfaced by this task's adversarial review: they're `tailwindcss-animate` plugin classes and the plugin was never installed (`plugins: []`, not in package.json), so they have emitted zero CSS since the component was written — the toast has never animated. Deleted per golden rule 4; repo-wide grep verified the sole usage was Toast.jsx:25 (zero matches after). Zero visual change; installing the plugin for a real entrance animation is a separate decision. The three type icons gained `aria-hidden="true"` (decorative; SettingsRow spinner precedent); the empty region is zero-size, so nothing at `z-[60]` paints or intercepts taps between toasts. Prop contract unchanged; all three consumers verified rendering unconditionally. `Settings.jsx`'s page-local wrapper (added earlier in 0.53.0) removed as redundant — the only `role="status"` in `frontend/src` now lives in Toast.jsx itself.

### Technical
- **S15.2b session — modified:** `backend/routers/upload.py` (imports from `constants` + `discover_book_files` from sync; `group_moved_files_by_format` + `insert_editions_per_format` helpers; `add_files_to_existing_title`, `create_title_from_upload` (new `files_by_format` param, both branches), finalize `'created'` + `'format_added'` blocks, `link_files_to_title` rewired to per-format recording; `LinkToTitleResponse.skipped_duplicates` additive field; `trigger_library_sync` status check), `backend/services/upload_service.py` (`ALLOWED_EXTENSIONS = set(EXTENSION_TO_FORMAT)` — value identical to the old literal, now single-sourced; `finalize_book` add-format branch returns landed paths), `frontend/src/api.js` (three stale JSDoc `@param` format lists → "any ALL_EDITION_FORMATS value (constants/formats.js)" — comment-only rider from the v0.52.0 sweep; the memory's line numbers had drifted to 477/504/845). **Backend changed: full Docker rebuild required.** No schema change — `database.py` and all six frozen files untouched.
- **S15.2b verified:** `py_compile` clean on both backend files; helper-logic simulation (10 cases — alphabetical pick, `.htm`→`'html'`, `.html`+`.htm` collapse, collision-renamed siblings, hidden-file exclusion, uppercase extensions, unknown-extension safety); SQLite harness against the real editions schema + unique index (multi-format insert, collision-kept-existing, defer on file-backed `'ebook'`, file-less `'ebook'` correctly NOT deferring, mid-loop collision isolation, `acquired_date` populated); esbuild parse clean on `api.js`; design-lint 0 strict violations (raw-button report-only unchanged at 128; report file untouched). Repo code-reviewer: frozen clean, scope clean (every hunk maps to a prompt-named item; `skipped_duplicates` + `moved_files` judged direct enablers of fix 1, not drift), pattern conformance verified against `sync.py` source — defer-guard SQL and epub-preferred pick verbatim. Its two notes: (a) `create_title_from_upload`'s call sites don't surface defer/collision in the `created` result message — race-only reachability, backstopped by the immediately-triggered background sync's results view, accepted as written; (b) `group_moved_files_by_format` initially lacked sync's hidden-file exclusion — **fixed in-session** (a deliberately uploaded `._x.epub` can no longer win the pick), re-verified.
- **S15.2b carry-overs:** AddPage.jsx reads only `status`/`title_id` from finalize results, so the new per-book skip/defer `message`s surface in the API response + backend logs until a session that names AddPage renders them (added to ROADMAP batch-2); new upload message strings ("same-format duplicates kept but not recorded: …", "already recorded, kept the existing edition: …", "edition records deferred — run a full sync after the format migration succeeds") pending MICROCOPY_LIBRARY.md addition alongside the S15.3a/b lists below.
- **Modified:** `frontend/src/pages/Settings.jsx` (S15.3a feature session; Toast-wrapper removal in the follow-up task), `frontend/src/components/ui/Toast.jsx` (follow-up task — persistent live region, see Fixed), `docs/DESIGN_LINT_REPORT.md` (regenerated in the S15.3a session — run date + pre-existing raw-button line-number shifts only; strict violations remain 0; the Toast.jsx change left it content-identical)
- **S15.3b session — created:** `frontend/src/pages/SyncResultsPage.jsx` (results view), `frontend/src/utils/formatTimeAgo.js` (extracted verbatim from Settings.jsx so both surfaces share it). **Modified:** `backend/routers/sync.py` (SyncResult detail fields, `DETAIL_CAP`/`LAST_SYNC_RESULT_KEY` constants, `_append_detail`/`_conflicting_folders`/`_persist_sync_result` helpers, persistence on all exit paths, interrupted-run handler, six detail-capture sites — log lines kept alongside), `backend/main.py` (version string 0.52.0 → 0.53.0, closing that carry-over — **backend changed: full Docker rebuild required**), `frontend/src/api.js` (`getLastSyncResult()` — reads the all-settings map, so a missing key is `null`/never-synced without string-matching 404 messages), `frontend/src/App.jsx` (`/sync-results` route), `frontend/src/pages/Settings.jsx` (see Changed), `docs/DESIGN_SYSTEM.md` (see Changed), `docs/DESIGN_LINT_REPORT.md` (regenerated — strict violations remain 0, raw-button report-only count unchanged at 128). **Deliberately untouched:** `database.py` (frozen — no schema change; the settings table already fits), all six frozen files, `upload.py` (its background sync flows through `_do_sync` and gets persistence for free; upload-path UX is S15.2b's scope).
- **S15.3b new microcopy strings pending MICROCOPY_LIBRARY.md addition:** "Last sync" row summaries ("No syncs recorded yet.", "Couldn't read the last sync summary.", "— didn't finish", "— no folders found", "N need(s) attention"), page states ("No syncs yet" + "Results land here after each sync — conflicts, missing files, and skipped duplicates included.", "Everything in its place" + "Nothing needs attention — no conflicts, missing files, or skipped duplicates.", "A sync is running right now — these results are from the previous run."), the four group hints (conflicts "tidy the folders, then sync again", missing files reuse of the approved "Couldn't find these files…" + "open it to remove or merge it if it no longer belongs", duplicates "The first (A to Z) is in your library; the others were skipped, not deleted.", deferred "If they keep appearing here after a restart, the migration needs a closer look."), "…and N more not shown", the errors caption ("N folder(s) couldn't be processed this run — try another sync; the server logs have the details."), the backend unreachable-library message ("Couldn't reach the library folder. Check that it's connected, then try again." — replaces the raw "Books path does not exist: {path}" on the persisted/user-facing surface; the path now goes to logs only), and the "Not Now" dismissal.
- **Deliberately untouched:** `frontend/src/api.js` (`syncLibrary(full)` + `getSyncStatus()` already existed), all backend files (no rebuild-forcing changes), `settings/SettingsRow.jsx` (out of named scope; `ui/Toast.jsx` was out of the S15.3a scope too, then fixed in its own named follow-up task — see Fixed). `backend/main.py`'s app version string still reads 0.52.0 — bump to 0.53.0 at release (one-line backend edit; folding it into the next backend-touching session avoids a backend-only rebuild). *(✅ folded into S15.3b, which touches the backend anyway.)*
- **New microcopy strings pending MICROCOPY_LIBRARY.md addition:** row label/description, the confirmation body, "A sync is already running. Try again in a moment.", "No folders found — check that the library folder is reachable.", "Lost contact with the sync — it may still be running. Check back in a few minutes.", "Scanning folders — X of Y", and the count-bearing toast variants ("Library synced — X added, Y updated" extends the approved "Library synced" past the five-word toast rule — deviation locked by the session prompt's "Toast with headline counts").
- **Verified:** deno-esbuild parse clean; design-lint 0 strict violations (raw-button report-only count unchanged at 128 — no new raw buttons); 4-lens adversarial verification workflow (repo code-reviewer + correctness + design/voice + regression skeptics) — PASS, 0 blockers across all four; the 8-item fix round it produced was itself re-verified PASS (every fix confirmed with file:line evidence, no new defects). Toast follow-up task: esbuild parse on both files; design-lint re-run twice, content-identical both times; code-reviewer (frozen/scope clean; one doc-drift finding, see carry-overs) + adversarial a11y/regression skeptic (PASS, 0 blockers) — the skeptic confirmed the live-region mechanics (region mounts empty with page render on all three consumer pages; `aria-atomic` re-announces loading→success replacements; no z-index or pointer-event changes; no `null` class leakage) and refuted the animation premise, leading to the dead-class deletion above.
- **S15.3b verified:** python `py_compile` clean on both backend files; deno-esbuild parse clean on all five frontend files; design-lint 0 strict violations (raw-button report-only count unchanged at 128 — the new page adds none; report regenerated, diff is run-metadata + line shifts only). Repo code-reviewer (frozen-file / scope-drift / pattern-conformance): frozen clean; one minor scope flag — `frontend/src/utils/formatTimeAgo.js` (new) is a verbatim extraction of Settings.jsx's own helper so the results view can share it, not named in the prompt, **needs Marie's ratification**; two conformance findings fixed in-session (corrupt stored JSON no longer masquerades as "No syncs recorded yet." — the row says "Couldn't read the last sync summary."; the modified inline-notice line moved from `text-xs` to `text-caption`). Then a 4-lens × 2-skeptic adversarial verification workflow (40 agents): 16 confirmed findings, 14 fixed in-session — highlights: scan-phase exceptions (dead mount, folder vanishing mid-walk) escaped `_do_sync` before the persist guard existed, so the run was never recorded (now caught + persisted); the per-folder error handler never rolled back, so a failed folder's half-applied writes could be flushed by a later commit — including the new persist commit (now rolls back; also narrows a pre-existing flush window via the next folder's commit); the per-entry duplicate `skipped` array was unbounded (now capped at DETAIL_CAP alongside the entry cap); clean-state and "needs attention" math ignored `orphaned` (a title losing its folders IS a finding — now counted, and the ✨ state requires zero orphans); quick sync's catch claimed "didn't finish" without the still-running probe its full-sync sibling had (now probes, shows "Lost contact…" when applicable); title links were ~24px tall on the page whose primary action is tapping them (now 44px per the mobile floor); navigating to the results page was a silent completion signal for screen readers (heading now takes focus on arrival); the page had no in-flight state (one-shot `/sync/status` check shows "A sync is running right now — these results are from the previous run."); the deferred-titles hint promised automatic resolution the migration doesn't guarantee (rewritten to the truth-check-compliant string); the raw "Books path does not exist: /books" string would have rendered verbatim as a durable user-facing headline (replaced with approved-anatomy copy, path logged only); errors caption gained its what-to-do.
- **S15.3b accepted findings (reported, not fixed — with reasons):** the stored blob rides on every `GET /api/settings` response that several pages fetch on mount (bounded by the caps at realistic finding volumes — the known production backlog is 4 conflicts + 25 duplicate skips, a few KB; a dedicated endpoint/key-exclusion is the escape hatch if a pathological sync ever makes it matter); if `_persist_sync_result` itself fails, the navigated-to results page shows the previous stored run with only its stale timestamp as the tell (log-only by documented design — the response-vs-stored dual-source alternative was judged worse); per-folder **error** identities are still count-only (log lines exist, but the session's locked finding types deliberately exclude an errors detail list — the caption points to the logs; candidate for a future session); backend `_sync_status` TOCTOU pre-existing and untouched.
- **S15.3b carry-overs (out-of-scope files — stopped and reported per golden rule 1, NOT fixed):** (1) `backend/routers/upload.py:176` logs "Background sync complete: …" even when the sync returns the new caught-crash `status='error'` result — the old `except` branch no longer fires for crashes `_do_sync` now absorbs; two-line status check, fold into S15.2b (which owns upload). (2) `frontend/src/components/BookDetail.jsx` `getBackLabel()` has no case for `returnUrl: '/sync-results'`, so the back link from a results-page title link reads "← Library" while correctly navigating back to Sync Results — add a `startsWith('/sync-results') → 'Sync Results'` case in a session that names BookDetail. (3) The title/authors full-sync overwrite contract (0.53.0 carry-over assigned to S15.3b) was **not** in this session's prompt scope and remains undecided — sync.py's UPDATE behavior untouched.
- **Accepted findings (reported, not fixed — with reasons):** all failure outcomes are toast-only (code-reviewer advisory: DESIGN_SYSTEM §3 says blocking errors are never toast-only; accepted because the session prompt mandates the Toast pattern and S15.3b's persistent results surface is the real fix) *(✅ resolved by S15.3b — completed runs now land on the persistent results view)*; "Cancel" as the safe button contradicts VOICE_AND_TONE's "never Cancel" rule (label locked by the session prompt; reconcile doc-side or copy-side in S15.3b) *(✅ resolved by S15.3b — relabeled "Not Now", see Changed)*; the 2s poll interval survives SPA navigation for the sync's duration (bounded — it self-clears when the request settles; React 18 no-ops the orphaned setState; completion toast lost on navigate-away is inherent to the locked synchronous design until S15.3b persists results) *(✅ outcome-loss resolved by S15.3b — the stored result survives navigation; the bounded poll itself is unchanged)*; out-of-order poll responses can transiently regress the progress counter (cosmetic); backend `_sync_status` TOCTOU between guard check and set (pre-existing, `sync.py` counters unchanged by S15.3b).
- **Carry-overs for later sessions:** `ui/Toast.jsx` live region app-wide — **✅ resolved same version, see Fixed** (its follow-up review surfaced two new small ones: `docs/DESIGN_SYSTEM.md` §3 Toast now contradicts the component — it still says "no live region yet" and "falsy toast renders nothing"; needs a doc amendment in a session that names it *(✅ resolved by S15.3b — named rider, see Changed)*. And Toast's message span uses raw `text-sm font-medium` instead of a typography token — pre-existing, carried verbatim, left per the no-drive-by rule); `POST /covers/bulk-extract` needs a `_sync_status` guard backend-side; full sync overwrites `title`/`authors` from file metadata without COALESCE (can revert manual edits — surfaced during copy review; the confirmation copy now hints at it, but S15.3b should decide whether that's the desired contract); BookDetail fires "Book updated" toasts while the edit dialog's `aria-modal` is still open (UnifiedEditModal awaits `onSave` — which toasts — *then* calls `onClose`), so screen readers may suppress the announcement — consumer-side ordering fix (close before toasting) in a session that names BookDetail/UnifiedEditModal; ChangeCoverModal's ordering unverified; also pre-existing: BookDetail's loading/error early returns exclude the live region, and book→book navigation can visually resurrect a stale toast (remount-with-content, unannounced).

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
