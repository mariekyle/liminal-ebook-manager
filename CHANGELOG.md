# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
