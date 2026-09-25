> Things I need to think about but haven't yet.
> 
> Have time & phone? Grab a question, open the Liminal Claude Project, think it through, then:
> 
> 1. Add the decision to [[Decisions]]
> 2. If it unblocks a prompt, add the prompt to [[Pipeline]] prompt queue
> 3. Delete the question from this list (this file is NOT append-only — clean it up)
> 
> **Structure:** Decision sprints (session-gating) up top. General backlog below, grouped + prioritized. Don't let them merge again. **Priority key:** 🔴 P1 = broken / hurts daily · 🟠 P2 = real friction · ⚪ P3 = nice-to-**have**

---

# INBOX

> Marie drops raw items here in any format, from the phone or mid-session. Claude Code triages
> them at session start: each one gets a priority and a home in BACKLOG (or becomes a decision
> or a Pipeline queue item), then leaves the Inbox. Nothing else writes here.

- 

---

# CURRENT SPRINT GATES

> None. Merge-confirm decisions locked 2026-07-25 (eight decisions + riders); session 2 (v0.85.0) is implementation-only. Next decision sprint on the horizon: date_added semantic (queue #4).

---

# BACKLOG

> Grouped, deduped, prioritized. Work top-down within each tier.


## 2026-08-23 — from Home-Purpose Decision Sprint

- ⚪ **Tally comparison mechanism.** "N words ≈ [book from your library] ×K" needs a word-count-match query + phrase template; recon backend cost and template shapes at implementation. Fallback if it underdelivers: number + period only, no whisper.
- ⚪ **Lens query recon.** Each HP5 lens maps to a query against current schema; verify per-lens cost, the random-draw implementation (HP7), and "last finish" derivation before prompts are written.
## 2026-08-20 — from Slice 6 (Series + Author)
- [ ] 🟡 **SA1 retro-touch** — series byline derivation ("_Name_ & others") must reach LIB12 Library series rows and SRCH8 series results. One-line addendum + verification at the Slice 8 audit.
- [ ] ⚪ **Kebab menu contents (series/author)** — Edit is mocked as the sole action; recon actual edit endpoints/actions at implementation before writing the prompt.
- [ ] ⚪ **Author aliases** — alias tracking lives in freeform bio text today ("aka: …"). Structured aliases/merging is feature territory, Liminal Connects-adjacent. No design work until then.
- [ ] ⚪ **Light-theme wash alpha** — .26 reads rosier on wheat; dedicated light value at the light-token ratification pass.
- [ ] ⚪ **Back-label derivation** — returnUrl carries origin; label text per origin screen needs a recon pass at implementation.
- [x] 🟡 Home-purpose (launcher vs. daily pulse) — still gates Slice 7. 
- [ ] 🟡 BD11 partial-rating rendering — untouched by SER3's filled-only row stars.

## 2026-08-05 — from Slice 5 (Collections)
- [ ] ⚪ **Reorder / remove-books mode banners not re-mocked.** The live app's mode banners (teal "Reorder Mode / Done", red "Select titles to remove" + Cancel/Remove N bar) carry forward functionally; tokenize to the design system at implementation and confirm the remove flow keeps two-step confirmation (GR). Reorder mode is also where the Default/My section split lives (COLL1).
## 2026-08-03 — from Slice 4 (Search)
- [ ] ⚪ **Recents-divider contrast with the SRCH9 divider rule.** Recents keep dividers while preview groups drop them; approved on desktop review. Validate the mixed treatment on device during implementation.

## 2026-08-02 — from Slice 3 (Library)
- [ ] 🟠 **Sort direction reversal.** Sort sheet shows direction hints ("A to Z", "newest first") but no interaction to flip a sort's direction. Decide at implementation: tap-active-option-again to reverse, or per-option direction control. Low stakes, needs a decision before the sort sheet is built.
- [ ] 🟠 **Control row density.** Four controls fit 430px with short sort labels but don't breathe. Marie accepted as-is for mockup; revisit during implementation if real device feel demands it (fallback: icon-only Wishlist chip).
- [ ] 🟠 **A–Z rail touch feel.** 34px visual rail with full-height hit area + drag bubble works in mockup; validate 44px effective target and drag precision on device during implementation (GR3 applies).
- [ ]  **Letterhead sticky offset.** Authors letter headers pin below the Library header; offset must be derived from actual header height at implementation, not hardcoded (mockup uses a fixed calc).

## 2026-07-30 — from UI Mockup Sprint
- [ ] 🟠 **DNF chips render red in the live app.** Quartet History screenshot shows the DNF session chip in dusty red — direct violation of DESIGN_PHILOSOPHY (DNF = neutral warm gray, never failure-colored; "setting aside ≠ failure"). Independent of the redesign; needs recon on where session/status chip colors are sourced before a fix session. Mockup standard: neutral tint.
- [x] 🟠 **Home purpose review.** v4 layout is structurally locked but reads flat. Open question before any implementation: what is Home *for* beyond resume / recent / discover? Marie thinking; no new Home mockups until answered.
- [x] 🟠 **Home third track.** Deck row leaves column 3 as intentional open air. Judge on device; if it reads as a missing tile, candidate fix = a third deck (e.g., To Be Read), not decoration.
- [ ] 🟠 **Partial-rating stars on History.** Mockup shows filled stars + dimmed empties for rated DNF/partial sessions. Confirm, or simplify to filled-only.
- [ ] 🟠 **Dark-mode teal link contrast.** Current app link teal measures ≈4.15:1 on surface — under WCAG AA 4.5:1. Mockups use one-step-lighter link teal (#6f9a9a) on dark. Token decision needed at implementation time.

## 🟠 Metadata scanning (post-S15 cluster) → NON-EPUB EXTRACTION SPRINT
> Sprint input captured: [[2026-07-20_non-epub-metadata-extraction]]. Scoping decisions locked 2026-07-20 (Decisions.md). Sprint runs from the post-adoption queue (Pipeline #5). These three items are inputs to that sprint, not standalone fixes — do not solve them piecemeal.

- [ ] Rescan Metadata doesn't re-extract title/author from the book file — a manually replaced file on the NAS with corrected title/author never propagates. Must respect fill-empty-only (v0.54.0).
- [ ] Fanfic source URL not pulled during metadata scan — AO3 HTML carries the canonical work URL in the preface; solved for free by the AO3 parser.
- [ ] 🟠 Conversion flows skip metadata extraction — BOTH Acquire/link AND add-to-existing land files without a scan (confirmed v0.70.0 testing). Auto-scan on first file landing, fill-empty-only. (2026-07-19)

**Sprint agenda (unanswered):** cascade order per format · confidence tiers + upload-review UI treatment · single-best-file vs cross-format field merge · backfill scope for existing mobi/html-only titles · known-author prior in/out · dispatcher module shape · does upload write into category subfolders again, or stay flat?

## 🟠 Wishlist → Library conversion
- [ ] **Wishlist search only searches the library**, not the wishlist itself.
- [ ] 🟠 Wishlist tab failed to render a genuine wishlist entry — title id 1991 ("A Stage Set for Villains") had acquisition_status wishlist (DB-verified 2026-07-25) but never appeared on the wishlist tab across days of manual scanning; /book/1991 loaded fine and merged normally. Unknown cause — filter, pagination, or query gap. If one entry can hide, others can. Recon candidate: what does the wishlist tab's query/filter actually exclude? (2026-07-25)

## 🔧 Known defects
- [ ] 🟠 Reorder-mode bar isn't sticky — the "drag to reorder / done" block scrolls away on long lists, and as of v0.72.0 it takes the reorder-error banner with it, so a failed order save is invisible again on exactly the lists where reordering is hard. Sticky the bar; the banner rides it. (bumped 2026-07-19)
- [ ] 🟠 **Progress bar missing on cover** for in-progress titles on BookDetail (status shows in pill, but no progress indicator at the cover base). | Session 11 Flow 3
- [ ] ⚪ **Author-list sticky letter gap** — large gap between screen title and the sticky letter heading on mobile scroll. | Session 11 Flow 7, cosmetic
- [ ] ⚪ "File can't be downloaded securely" secondary prompt on mobile downloads (not desktop) — likely the browser flagging an HTTP (non-TLS) download on the local network, i.e. device-side, not Liminal-side. Investigate whether it's suppressible; the real fix may be HTTPS on the NAS, which is its own project.
- [ ] ⚪ BookDetail fires "Book updated" while UnifiedEditModal's aria-modal is still open — announcement may be suppressed; reorder onClose → toast in a session naming those files. (2026-07-11)
- [ ] ⚪ BookDetail book→book navigation can visually resurrect a stale toast; loading/error early returns exclude the live region — and as of v0.84.0 the post-merge toast crosses that loading return during target-page load, so screen readers may miss the merge announcement (LOW advisory, session-1 review). Same fix family. (2026-07-11, upd. 2026-07-25)
- [ ] ⚪ ui/Modal silently drops the aria-label prop every settings modal passes it — pre-existing gap, surfaced in B1 review. (2026-07-17)
- [ ] ⚪ Settings load-error banners (incl. the Backups precedent B1 copied) lack role="alert" — screen readers miss them. Batch-C candidate. (2026-07-17)
- [ ] ⚪ Nothing configures Python logging — only WARNING+ reaches the container log, which forced B1's removal records onto logger.warning. A proper logging config would let records be INFO like they should be. (2026-07-17)
- [x] 🟠 Duplicates page: 76 false-positive groups after the v0.85.0 triage pass (~95% of results are noise) — the dismiss-pair mechanism was parked behind the nav redesign (2026-07-16) before this count existed. Re-evaluate the parking: dismissal is self-contained (dismissed-pairs table + per-group control), doesn't need the redesign, and without it the next real duplicate drowns. Needs a small decision sprint: pair-key shape, where dismissals live, un-dismiss surface. (upd. 2026-07-25)
- [ ] ⚪ Link-to-title containment rejection surfaces as a generic 500 (filename detail is server-log only) — only reachable by crafted clients post-basename; polish candidate. (2026-07-18)
- [ ] ⚪ build_folder_name interpolates raw series_number into folder names — root escape now bounded by the v0.68.0 guard, but odd values still shape odd (contained) folder names. (2026-07-18)
- [ ] 🟠 Acquire flow ("I got this book"): converted titles keep the wishlist-added date as the library add date — no acquisition date stamped. Decide the date_added semantic for conversions (stamp conversion date, or keep both). Queue #4. (2026-07-18)
- [ ] ⚪ Remove Format confirms via a modal — now the recorded outlier vs the inline-confirm pattern Replace file established (v0.70.0). Convert to inline for consistency someday. (2026-07-19)
- [ ] 🟠 Library :181 getCategories fails silently — the FilterDrawer's category options degrade with no surface. Parked out of the B5 audit per the stop rule (an honest surface threads error state into FilterDrawer.jsx, outside the named file set). Needs a session that names FilterDrawer. The primary book-load path already errors loudly with retry, so this is degradation, not a dead screen. (2026-07-19)
- [ ] ⚪ Unguarded localStorage calls at CollectionsTab :138/:173 and CollectionDetail :176/:596/:1058/:1241 — sibling call sites wrap theirs in try/catch. Inconsistent, harmless until a storage-less context. (2026-07-19)
- [ ] ⚪ FormField renders its error text without a live-region role — components using it get a silent error for screen readers. Sits beside the Settings-banner role="alert" gap above; same fix family. (2026-07-19)
- [ ] ⚪ In-page 3-dot menus (CollectionDetail, CollectionsTab) use a z-40 backdrop that TIES BottomNav's z-40 — the nav stays tappable above the backdrop on mobile. Spatially harmless today; same family as the v0.65.0 finding. (2026-07-19)
- [ ] ⚪ ui/SortDropdown renders its own in-tree bottom sheet while ThreeDotMenu uses the portaled one — in-tree re-ratified 2026-07-24 at the extraction (stacking verified clean on all four consumer surfaces; no driving defect). Dedup requires the portal's containment-ref surgery; stays parked for a session that names it. (2026-07-19, upd. 2026-07-25)
- [ ] ⚪ CollectionModal handleDeleteCover (:225) deletes the custom cover with no inline confirmation — S10-era destructive-confirm gap, surfaced by S2 review. Failure path is non-silent; just missing the confirm. (2026-07-22)
- [ ] ⚪ SettingsRow toggle knob bg-white — a default-palette literal now living inside ui/ (post-v0.82.0 rehome), invisible to lint A1's scope. Ratified 2026-07-24, queued for a ui/-touching session. (2026-07-24)
- [ ] ⚪ role="listbox" container additions — the unratified half of the option-row a11y fix: six combobox rows carry role="option" but their containers don't declare listbox. SortDropdown got full listbox semantics at v0.83.0; these six sites didn't. (2026-07-24)
- [ ] ⚪ AuthorInput / CollectionPicker / StatusLabelsModal console-only catches — tracked family from the S2 silent-failure audit; convert to surfaced errors in a session naming those files. (2026-07-24)
- [ ] ⚪ Mixed-register join advisory (upload.py) + microcopy backlog pass over the pre-v0.63.0 window — both for the next microcopy window. (2026-07-24)
- [ ] ⚪ Chip-remove ×2 chrome markers (AuthorChips, TagsMultiSelect) flagged as IconButton candidates — opportunistic adoption, not scheduled. (2026-07-24)
- [ ] ⚪ SettingsRow gallery demo missing since the v0.82.0 rehome — gallery sits at 16 of 17 demoed. Rider queued on merge-confirm session 2 (v0.85.0) to restore the all-demoed invariant. (2026-07-25)
- [ ] ⚪ DuplicatesPage banners untokened as a pair — the new bulkFailure banner deliberately mirrors the pre-existing scan-error banner's untokened typography so the two render identically; fixing either alone desyncs them. Fix both together in the next DuplicatesPage session. (2026-07-25)
- [ ] ⚪ Merge-fail + rescan-fail double-failure leaves stale group rows under two honest banners — pre-existing rescan-failure behavior, surfaced by the v0.85.0 partial-failure review. Truthfully bannered, just not self-healing. (2026-07-25)
- [ ] Add to library (review screen) - add collections field as an option
- [ ] Add to wishlist (save to wishlist screen) - add collections field as an option
- [ ] Book detail screen - when metadata is scanned, source url is not being grabbed for most fanfiction titles
- [ ] DuplicatesPage scan-error banner fires on mount-time auto-scan (a LOAD path) but wears the ACTION register; the ratified "both banners match" pair-constraint (v0.87.0) actively holds it there. Tension between pair-matching and the two-register rule — decide which governs when the DuplicatesPage banner pair is next opened. (filed 2026-07-26)

## Notes section renders on TBR BookDetail (found 2026-07-23, S3 phone test)
- **Issue:** BookDetail shows the Notes section on TBR books. Notes should only render on regular (owned/read) book detail pages; TBR detail should not carry it.
- **Status:** Pre-existing — S3 touched icon-button chrome only, no section visibility logic. Discovered during S3 phone test because the TBR Edit-pencil reclassification forced eyes on a TBR detail page.
- **Scope guess (unverified):** likely a missing status/ownership condition on the Notes section render in BookDetail.jsx. Needs recon before fix — check whether other sections (Reading History, Collections?) have the same leak on TBR, and whether any TBR books already have notes saved (data question: hide the section, or hide only when empty?).
- **When:** Post-adoption-sprint queue. Not S4 scope — no ratified decision exists yet on TBR section visibility rules. Candidate for a small fix session or fold into the next BookDetail-touching sprint after a decision on the visibility matrix.
- **Resolved (2026-07-23, vault check):** tbr_reason (column) and notes (table) are deliberately separate — ratified 2026-07-19 D1(b), which also set the conversion pattern (tbr_reason → real note on merge, wishlist-register prefix). Keep separate. Fix = suppress Notes section render when status is TBR.
- **Recon rider for the fix session:** verify the wishlist→owned conversion paths (A2 add-files flow, Acquire link flow) convert tbr_reason to a note the way merge does. If they don't, the reason text strands in an unrendered column on acquisition — same defect class D1(b) closed for merge.

===

## 🟠 Collections
- [ ] there are currently 2 special collections (to be ready and reading history). The issue? currently there is no way to know what date a book was dnf'd which mean that you can't view a book in dnf'd order (ie, I just dnf'd a book but once I mark it as dnf, I have no indication anywhere in the app that is was the last book I read). Reading history is maybe mislabeled because technically reading history should show all reading activity (not just completed works...hmmm) although I think there should be an additional tabbed area that allows you to quickly flip between completed, dnf, and all. But yeah. I think the other issue is that...there is no way to capture a dnf date. Need a good ux solution for this. I tried crating a regular collection to capture my dnf'd books but the sort options just don't make sense
- [ ] Create-new-collection from the picker (a + / "add new" near the **top** of the modal, in addition to the existing bottom option).
- [ ] Add-to-collection during the add-to-library / add-to-wishlist flow.
- [ ] Upload a cover image when creating a collection.
- [ ] Sort preference doesn't persist per collection (resets on navigate-away).
- [ ] Per-collection setting: "remove read items" toggle.
- [ ] CollectionDetail checklist hint should be dismissible (and stay dismissed).
- [ ] CollectionDetail: show the description directly below the title.

## 🟠 Tags
- [ ] Can't create new tags in the edit modal — only existing tags are lookup-able.
- [ ] Tag filtering is AND-only — want an OR mode (any selected tag).
- [ ] Tag search ordering (partial fix in C8); broader tag discovery/management is a bigger parked project.

## 🟠 Filtering & Sorting
- [ ] Length filter ranges (e.g. "under 4 hours" = 1 min–4 hr), not just fixed presets.
- [ ] Author-detail filtering/sorting when an author has many titles. | C6
- [ ] Author landing: category filter (no way to see only fiction vs non-fiction authors). | Flow 10
- [ ] Sort by estimated read time in Library browse. | C8 — needs a backend sort endpoint

## 🟠 Covers, Images & Metadata
- [ ] Cover-change flow is 6+ taps (BookDetail → dots → change cover → modal → upload → navigate → select → save). Compress it.
- [ ] EPUB image selection — extract-cover can't pick which embedded image when there's more than one.
- [ ] Add-flow title field not persisting — manual title edits on the review screen don't carry to book detail.

## 🟠 BookDetail & list-view polish
- [ ] Add to collection popup - when searching for a collection that does not exisit, 'no collection match (search term)' appears, then "new collection" btn. when new collection btn is pressed, would be better if typed search term pre-populates the name field on the 'create collection' modal
- [ ] Category onclick lands at the top of the edit modal — must scroll to the category field. Deep-link to the section, or open a focused category-only modal.
- [ ] Not all section headers have edit affordances (Metadata, Tags, About lack them). | Convention ratified 2026-07-16: pencil icon = opens an editor. Remaining work is just the sweep.
- [ ] No edit pencil on BookDetail itself — edit is only reachable via the 3-dot menu.
- [ ] Main search can't find authors — author search is siloed on the Authors page. | Flow 2
- [ ] "Identity" section label in the edit modal is confusing — rename or remove.
- [ ] Edit-modal field layout: Series + # on one line (75/25); Source URL + Year on one line (75/25).
- [ ] List-view long-press shows "update state" with a strange icon for finished books.
- [ ] Search notes & summaries ("About this book") — currently impossible.
- [ ] Mark favorite authors — no mechanism.
- [ ] Series page: author name isn't a link (can't navigate series → author).
- [ ] Star rating in grid/list view — show after the time estimate when a title is rated.
- [ ] List/grid toggle is taller than the sort control on grid screens — match heights.
- [x] Library home tab: limit sections to In Progress, Discovery, and Stats.
- [ ] wishlist book detail page - has author name as a link. when clicked, the link goes to an error page since the app currently does not create author detail pages for authors of wishlist titles

## ⚪ Navigation redesign — parked (touches every screen)
> Real, known, big. Needs its own scoping pass — don't pick at it piecemeal.

- [ ] Two bottom bars is the core problem. Usage ranking: Library > Search > Add (+) > Collections > Authors > Series. Can they collapse to one? | C3
- [ ] Wishlist out of the Library tab (not owned content). Placement TBD in the redesign. | Decided 2026-04-14
- [ ] Desktop has no navigation at all (separate from the mobile redesign).
- [ ] Adapt UI to the top-3 actions: search, add-to-library, browse collections.


## ⚪ Deferred from earlier phases
- [ ] Customizable rating labels | since Phase 3
- [ ] Light/dark mode toggle | since Phase 3
- [ ] Manual WPM field (from Moon Reader) | since Phase 3
- [ ] in 3 dot menu on collection detail page, include ability to manually add a book to the collection
- [ ] for book detail, add photo over 5MB limit, similar to the collection detail page ("That image is over 5MB. Try a smaller one?")
- [x] currently reading section on homepage should not be limited to 5 titles. there should be no limit

---

_Delete questions as they get resolved. This file should shrink over time._