# Liminal Product Roadmap

> **Last Updated:** July 22, 2026 (v0.77.0)
> **Current Focus:** Batch 3 closed at v0.74.0. The batch moved the app from "features ship" to "failures speak": every destructive file operation routes through the trash folder with an in-app Trash surface behind the app's only type-to-confirm gate, every upload write path is contained and refuses collisions instead of overwriting, wishlist-to-library conversion is lossless for notes and covers, every blocking error renders where the failed action lives, and the design lint's baselines are true (comment-aware matching, bare confirm( caught, hex rules scoped to what they can honestly enforce). Now underway: the shared-component adoption sprint (raw-button conversion, a MenuItem primitive, gallery completion — S1 shipped across v0.75.0–v0.76.0; S2 shipped v0.77.0, every real-action text-labeled button now on the shared Button), then the post-batch queue — conversion auto-scan, duplicate-pair triage, the merge-confirm redesign, and the date_added semantic decision. Full history lives in CHANGELOG.md.
> **Tracking Philosophy:** This roadmap is the single source of truth. No separate spec documents.

---

## Vision

Liminal is a **connected reading hub** that eliminates friction across your entire reading ecosystem. It integrates with external metadata sources, your reading app, your notes system, and local AI — so you spend less time managing and more time in the liminal space of reading.

**The old vision** was a polished, standalone book management UI.  
**The new vision** is an integration layer that connects everything together.

---

## Current State (v0.76.0)

The app is fully functional for daily use with 1,700+ titles. Core systems are stable:

| System | Status |
|--------|--------|
| Library browsing & search | ✅ Stable |
| Book upload & metadata extraction | ✅ Stable |
| Reading status & session tracking | ✅ Stable |
| Notes with wiki-style linking | ✅ Stable |
| Wishlist management | ✅ Conversion fixed (v0.38.0) |
| Collections system | ✅ Smart Collections complete |
| Enhanced fanfiction metadata | ✅ Stable |
| Add book flow | ✅ Redesigned |
| Editions system | ✅ Add formats, merge duplicates |
| Automated backups | ✅ Grandfather-father-son rotation |
| Navigation | ✅ UnifiedNavBar, bottom nav redesign |
| Design tokens & core components | ✅ Phase 10.0 complete |
| Design system conversion | ✅ Phase 10.0C complete (C1-C8) |
| Design consistency sweep | ✅ Phase 10.0E complete (S12, v0.48.0) |
| NNG usability audit | ✅ Complete — 141 findings (4 critical, 29 major) |
| UX fix sessions | ✅ Complete — 11/11 shipped, Session 11 regression pass passed (findings logged to Open Questions) |
| Download & share | ✅ Shipped v0.51.0 |
| Multi-format editions (S15) | ✅ One edition per file format; format-aware sync + upload (v0.52.0–v0.53.0) |
| Sync safety & visibility | ✅ Fill-empty-only overwrite contract, persistent results view (v0.53.0–v0.54.0) |
| Delete & merge with trash folder | ✅ Files move to `_trash/`, never deleted outright (v0.55.0–v0.56.0) |
| Files section (format management) | ✅ BookDetail owns format actions; remove trashes the file (v0.57.0) |
| BookDetail always-expanded | ✅ All collapse/disclosure deleted — every section renders in full (v0.58.0) |
| Sessions-canonical reading status | ✅ Complete: backend projection (B1, v0.59.0) + BookDetail inline 4-state toggle with Finished capture, download-triggered start prompt, snap-back microcopy; all list-view flows on the one-call contract rendering the projection (B2, v0.60.0) |
| Trash surface in Settings | ✅ Item count + size, `[Empty trash]` behind type-to-confirm — the app's only irreversible operation, and the copy owns it (Batch 3 B1, v0.66.0) |
| Upload write-path containment | ✅ Every path contained; collisions and same-format duplicates refused, never overwritten (v0.67.0–v0.70.0) |
| Wishlist → library conversion | ✅ Lossless — notes and covers survive; familiar-match includes wishlist entries (v0.69.0–v0.71.0) |

**What's Missing:**
- ❌ Wishlist requires manual metadata entry
- ❌ No connection to Moon Reader
- ❌ Notes are siloed from Obsidian
- ❌ No usage analytics to inform UI decisions
- ❌ No intelligent analysis of content

---

## Roadmap Overview

```
┌───────────┬──────────────────────────────────────────────────────────────┐
│  CURRENT  │  S15 batch-2 UI sessions (Files section shipped v0.57.0)    │
│           │  Phase 10.0D Session 11 Final Audit still open               │
│           │  Ship each session independently                             │
├───────────┼──────────────────────────────────────────────────────────────┤
│  ON HOLD  │  Phase 10.2-10.8: Liminal Connects (feature work)           │
│           │  10.1 shipped v0.51.0; rest paused pending go-decisions      │
├───────────┼──────────────────────────────────────────────────────────────┤
│  PARALLEL │  Critical Fixes                                              │
│           │  Cherry-picked bugs from Phase 9.5                           │
│           │  Some now covered by audit findings                          │
├───────────┼──────────────────────────────────────────────────────────────┤
│  FUTURE   │  Phase 11: Smart Features                                    │
│           │  Recommendations, mood-based discovery                       │
│           │  Requires Phase 10 data/infrastructure                       │
└───────────┴──────────────────────────────────────────────────────────────┘
```

---

## Phase 10: Liminal Connects ← CURRENT

**Goal:** Transform Liminal from a standalone app into a connected hub that integrates with your reading ecosystem.

**Philosophy:** Each sub-phase ships independently and delivers immediate value. No waiting for a "big bang" release.

**Estimated Timeline:** 25-31 working sessions (~8-10 weeks)

---

### 10.0: Component Foundation ✅

**Priority:** P0 — Prerequisite for Consistent Development  
**Status:** ✅ Complete
**Sessions:** 2

**The Problem:**  
No reusable components exist. Every screen has slightly different buttons, headers, cards, spacing, and colors. This causes:
- Visual inconsistency across the app
- Slow feature development (reinventing UI each time)
- Maintenance burden (fixing the same thing in 12 places)

**The Solution:**  
Establish design tokens and core components before building Phase 10 features. All new code will use these primitives, ensuring consistency going forward.

**Reference Documents:**
- `docs/DESIGN_SYSTEM.md` — the living design system (tokens, components, patterns); supersedes the archived refactor audit and token-definition docs

---

**Session 10.0A: Tokens + Audit Refresh** ✅

- [x] 10.0.1 **Audit Refresh** — Quick review of components built since January:
  - UnifiedNavBar (good pattern, extract)
  - Toast (good pattern, already extracted)
  - ThreeDotMenu/BottomSheet (good pattern, extract)
  - CollapsibleSection (good pattern, extract)
  - ReadingStatusCard (review for reusability)
  - UnifiedEditModal tabs (SegmentedControl pattern)
- [x] 10.0.2 **Color Tokens** — Add to `tailwind.config.js`:
  - Background: base, surface, elevated
  - Text: primary, secondary, muted
  - Action: primary (indigo), success (green), danger (red), secondary (gray)
  - Chip colors: category, status, metadata
- [x] 10.0.3 **Typography Classes** — Custom Tailwind utilities:
  - Headings: h1, h2, h3, h4
  - Body: body, bodySmall, caption, label
- [x] 10.0.4 **Document Token Usage** — Quick reference for which classes to use where

**Session 10.0B: Core Components** ✅

- [x] 10.0.5 **Button Component** — `components/ui/Button.jsx`
  - Variants: primary, secondary, ghost, danger
  - Sizes: sm, md, lg
  - States: loading, disabled
  - 44px minimum touch target
- [x] 10.0.6 **IconButton Component** — `components/ui/IconButton.jsx`
  - Consistent sizing and hover states
  - Optional tooltip
- [x] 10.0.7 **Badge Component** — `components/ui/Badge.jsx`
  - Status badges, category pills, metadata chips
  - Consistent sizing and colors
- [x] 10.0.8 **SearchInput Component** — `components/ui/SearchInput.jsx`
  - Clear button, loading state
  - Consistent with existing search patterns
- [x] 10.0.9 **Modal Component** — `components/ui/Modal.jsx`
  - Standardized Header/Body/Footer structure
  - ✕ always on right
  - Consistent footer pattern (Cancel + Primary action)
  - Sizes: sm, md, lg, fullscreen
- [x] 10.0.9b **FormField Component** — `components/ui/FormField.jsx`
  - Label + input/textarea with error state
  - Controlled with value fallback, forwardRef
  - Warm A token styling
- [x] 10.0.10 **BookCard Redesign** — `components/BookCard.jsx` (v4 implemented)
  - **Variants**: standard, compact, list (single `variant` prop replaces 3 booleans)
  - **Grid badges**: Opaque dark bg (#1a1918 @ 88%) + white icon for all types. ~7:1 contrast.
    - Finished: checkmark icon
    - DNF: pause icon (⏸) — works regardless of user's configured status label
    - Wishlist: bookmark icon (no border on card — badge is sufficient)
    - Unread: no badge (absence = default)
    - In Progress: no badge, 4px progress bar with opaque dark track (50% default until real data)
    - Checklist done: green bg badge + card dimmed to 45%
  - **List view**:
    - Finished: checkmark overlay on 52px cover thumbnail (50% scrim), no text status
    - DNF: pause overlay on cover thumbnail (50% scrim, warm gray icon), no text status
    - In Progress: teal dot + label + progress bar (only status with text)
    - Unread: completely clean row — no indicator
    - Est. read time (clock icon + ~Xh) shown for all items
  - **Killed**: left-edge color stripe, wishlist border, backdrop-blur, text DNF badge

**Components Extracted:**
- [x] 10.0.11 Move `UnifiedNavBar` to `components/ui/`
- [x] 10.0.12 Move `Toast` to `components/ui/` (extracted from BookDetail inline)
- [x] 10.0.13 Move `CollapsibleSection` to `components/ui/`
- [ ] 10.0.14 Extract `ThreeDotMenu` from BookDetail to `components/ui/ThreeDotMenu.jsx`
  - **Record corrected 2026-07-17 (v0.65.0):** previously checked, but the extraction never happened — `ThreeDotMenu` is still an inline component in `BookDetail.jsx` (single consumer), no `ui/ThreeDotMenu.jsx` exists, and the 2026-07-07 ghost-component cleanup had already removed it from SKILL.md's ui/ listing. The v0.65.0 stacking fix (mobile sheet portaled to body) lives in the inline component; `SortDropdown.jsx` carries its own separate bottom-sheet implementation. Extraction stays open for if Series/Author/Collection detail pages ever need the menu.
  - Desktop dropdown + mobile bottom sheet, zero behavior changes

**Warm Gradient Palette:**
- [x] 10.0.15 **Warm Gradient Lanes** — Updated 10 lane seed colors in `covers.py`
  - Shifted from vivid Tailwind-stock colors to warm desaturated palette
  - Clay, Sage Teal, Slate Blue, Amber, Lichen, Ochre, Dusty Plum, Storm, Sandstone, Muted Rose
  - Migration script regenerated all ~1,700 book covers
  - GradientCover.jsx unchanged (FROZEN) — backend-only change
  - Saturation lowered (18-30%), dark lightness adjusted (42-58%)

**Out of Scope (Build When Needed):**
- CoverCard unification (after BookCard is solid)

**Moved INTO 10.0C scope (extracted during conversion pass):**
- ChipInput → standardize during Group 4 (UnifiedEditModal) + Group 7 (Add flows)
- StarRating → extract during Group 1b (BookDetail modals)
- FileDropZone → extract during Group 7 (Add flows)

---

### 10.0C: Full Component Conversion ✅

**Priority:** P0 — Without this, the design system is fiction  
**Status:** ✅ Complete (C1-C8, v0.35.0-v0.37.5)  
**Sessions:** 8  
**Based on:** `FRONTEND_AUDIT_2026.md` (Claude Code audit, March 2026)

**The Problem:**  
The audit revealed 62 JSX files with 0% design system adoption. 9 UI components were built in 10.0B — 6 have never been imported. 26 modals are bespoke. ~262 raw buttons. 81 raw form fields. 1,445 hardcoded color instances. The design system exists on paper only.

**The Solution:**  
Systematic conversion of every file. No "convert as you touch" — that's how we got here.

**Work Groups:**

| Group | Files | Focus | Session | Status |
|-------|-------|-------|---------|--------|
| 1a | BookDetail (colors+buttons) | 211 colors, 45 buttons, typography | C1 | ✅ Complete |
| 1b | BookDetail (modals+forms) | 5 inline modals, 9 form fields, StarRating extract | C2 | ✅ Complete |
| 2 | Library + HomeTab + WishlistTab | Daily drivers, NavBar, view persistence, TBR rename | C3 | ✅ Complete |
| 3+4 | Drawers + UnifiedEditModal + ChangeCoverModal | 204 colors, ChipInput standardize | C4 | ✅ Complete |
| 5 | Collections family (6 files) | 155 colors, 3 inline modals, SmartPaste removal | C5 | ✅ Complete |
| 6 | Series + Authors (7 files) | Colors, missing page titles, returnUrl fix | C6 | ✅ Complete |
| 7+8 | Add flows + Upload flows (12 files) | Forms→FormField, FileDropZone extract | C7 | ✅ Complete |
| 9+10 | Filter modals + misc (15 files) | Batch modal migration, Escape fixes, search sort | C8 | ✅ Complete |

**Critical Fixes Addressed (free during conversion):**
- [x] Book Detail layout issues (C1-C2)
- [x] Author Detail returnUrl (C6)
- [x] Series Landing missing page title (C6)
- [x] Authors Landing missing page title (C6)
- [x] TBRList → WishlistTab rename (C3)
- [x] HomeTab console-only error → user-visible (C3)
- [x] 4 modals missing Escape key → fixed by Modal adoption (C5, C8)
- [x] Library page missing UnifiedNavBar (C3) + 4 remaining pages (C6, C8)
- [x] SmartPasteModal removed (C5)
- [x] ImportPage useState hook bug fixed (C8)

**New components extracted during conversion:**
- ChipInput (C4)
- StarRating (C2)
- FileDropZone (C7)
- searchSort.js utility (C8)

**Known stragglers (batch later):**
- ~~`text-[#e0e0e0]` wrapper in AddPage.jsx~~ ✅ converted in S12 Batch 2 (v0.48.0)
- ~~CriteriaBuilder.jsx still has legacy gray classes~~ ✅ converted in S12 Batch 1 (v0.48.0)

---

### 10.0D: UX Audit Fix Sessions

**Priority:** P0 — Fix What's Broken Before Building What's New  
**Status:** ✅ Complete — all 11 sessions shipped; Session 11 regression pass on Sessions 1–10 passed (non-regression findings logged to Open Questions backlog)  
**Sessions:** 10 + 1 (final audit)  
**Based on:** `liminal-ux-audit.md` (141 findings, NNG heuristic + WCAG AA + user flows pass)

**The Problem:**  
A comprehensive NNG usability audit (8 screenshot groups + 10 interactive user flows) revealed 4 critical issues, 29 major issues, and 75 minor issues. One core flow (wishlist-to-library conversion) is completely broken. The most-visited page (BookDetail) has a structural action architecture problem. Text contrast fails WCAG AA. Grid settings don't apply consistently. Building new features on top of these problems would compound them.

**The Solution:**  
10 fix sessions, ordered by severity. Each session follows: review findings → make design decisions (lock in Decisions.md) → write Claude Code prompts → implement → verify. No rushing to prompts before decisions are locked.

**Session Plan:** See `UX_FIX_SESSIONS.md` for full session details, finding IDs, and scope.

**Sessions:**

| # | Name | Scope | Findings | Status |
|---|------|-------|----------|--------|
| 1 | Emergency: Broken Wishlist Conversion | Silent failure, fake success screen, raw SQL error, half-state data | UF-14, UF-15, UF-16 | ✅ v0.38.0 |
| 2 | One-Line Wins: Contrast + Grid | Lighten text-caption token, fix grid settings across pages | G1-02, G2-03, UF-32, G1-03, G4-02 | ✅ v0.39.1 |
| 3 | BookDetail Action Architecture | Make metadata blocks tappable, add Mark Finished shortcut, inline section actions | UF-01, UF-02, UF-05, UF-06, UF-20, UF-24, G2-11, G2-12 | ✅ v0.40.0 |
| 4 | Edit Modal Reorganization | Kill tabs → single scroll form, section dividers, unsaved changes guard | UF-25, UF-26, UF-27, G3-02, G3-03 | ✅ v0.41.0 |
| 5 | Form Input Guards | Plain text authors, default date+format, segmented category, hide rating | UF-11, UF-07, UF-12, UF-03, G3-07 | ✅ v0.42.0 |
| 6 | Search and Sort Everywhere | CollectionPicker search+create, author sort+series grouping, collection search | UF-21, UF-30, UF-31, G3-08, G5-13 | ✅ v0.44.0 |
| 7 | Settings Consolidation | SettingsDrawer → /settings page, NNG goal-based sections, kill gear icon | G1-11, G6-08, G1-07 | ✅ v0.43.0 |
| 8 | Status Label + Voice/Tone | DNF defaults, useStatusLabels everywhere, microcopy fixes | G3-06, G4-04, G6-04, UF-10, G6-13, G5-14 | ✅ v0.45.0 |
| 9 | Mobile-First Polish | Edition badges display-only, collection cover cap, add choice nav | G2-14, G5-10, G5-03, G7-01, G7-15 | ✅ v0.46.0 |
| 10 | Destructive Action Guards | DuplicatesPage inline confirm, session delete in-app confirm, modal-closes-on-failure | G8-02, G3-13, parked Session 3 modal error path | ✅ v0.47.0 |
| 11 | Final Audit | Re-audit all changed areas, tap through 10 user flows, regression check | — | ⬜ Planned |

**Already resolved (scratched from original sessions):** G3-10 (merge confirm — already in BookDetail), UF-33 (author view toggle — already exists).

**Priority tiers:**
- **Fix now (Sessions 1-2):** Broken flow + accessibility failure + quick wins ✅
- **Batch A (Sessions 3-5):** Core interaction quality (BookDetail + forms) ✅
- **Batch B (Sessions 6-8):** Structural improvements (search/sort, settings, terminology) ✅
- **Batch C (Sessions 9-11):** Polish, guards, final re-audit

**Acceptance Criteria:**
- All 4 critical findings resolved
- All 29 major findings addressed or explicitly deferred with rationale
- BookDetail friction reduced (mark-finished flow under 5 taps)
- WCAG AA contrast compliance for all text tokens

**Definition of Done:** The app's existing features work reliably and feel good to use. Then feature work resumes.

---

### 10.0E: Design Consistency Sweep (S12)

**Priority:** P0 — finish the conversion before feature work resumes
**Status:** ✅ Complete & closed — 3 batches shipped as v0.48.0 (2026-07-06); token migration v0.49.0 (2026-07-06); S13 guardrails + canonical docs v0.50.0 (2026-07-09). Remaining unchecked items below are post-S13 backlog, not part of this phase's close.
**Based on:** `docs/FRONTEND_AUDIT_S12.md` (committed 6a25f82)

| Batch | Scope | Status |
|-------|-------|--------|
| 1 | Straggler file conversions: DuplicateCollectionModal, BookLinkPopup, CriteriaBuilder — colors, ui/Modal, FormField, useStatusLabels (4th straggler DuplicateFinderModal found dead → deleted) | ✅ 2026-07-06 (A1–A5 = 0; pattern G = 0; zero `Abandoned` literals in CriteriaBuilder) |
| 2 | Scattered mechanical cleanup: category A remainder (21), C overrides (Button success/warning variants, AuthorInput fold-in), D typography (21 fixed / BottomNav skipped), H2/H3, I1 (P1 DNF-renders-as-Not-Started fixed), scrollbar navy hexes, `library-*` alias deletion | ✅ 2026-07-06 (A1–A5 = 0; D outside ui/ = 0 + BottomNav exception; `library-` = 0, alias block deleted; zero bespoke label loaders) |
| 3 | S11 regression defects: rating tappable, series sort asc/desc, grid setting leaking onto Series landing, MarkFinished date validation (close-out verification folds into this batch) | ✅ 2026-07-06 (all 4 fixed; A/C/D/G/H/I + `library-*` verified at target — full table in CHANGELOG) |

**Discovered in Batch 1:** `DuplicateFinderModal.jsx` was imported nowhere (dead since the DuplicatesPage rework) — verified repo-wide and **deleted** same session. Voice-pass candidates left as-is (out of scope): DuplicatesPage:183 "Your library is clean!" exclamation, :196 "books" in the duplicate-count string.

### 10.0E follow-on / parked from S12 sweep
- [x] **Token migration session** (between S12 and S13): typography scale → tailwind.config fontSize, append colors at unpaired sites, delete tokens.css @layer components block. Enables S13 zero-target. — ✅ 2026-07-06 (v0.49.0). Note for S13: repo-wide typography-token count is **429**; the audit's 408 is scope-correct (the 3 frozen frontend files are excluded by design — `upload/BookCard.jsx` holds the other 21). The lint zero-target stays on the 408 audit scope since lint allowlists frozen files. One sanctioned frozen-file color append in `upload/BookCard.jsx` (see CHANGELOG 0.49.0).
- [ ] **Raw element conversion backlog** (post-S13, per-file): BookDetail (30) → Library (15) → CollectionDetail (10) → SortDropdown (9) → remainder (≤8 each). Whitelist intentionally-bare buttons per file for lint.
- [ ] **AnalyzingModal → shared Modal** — decide dismiss semantics first (it's a progress surface).
- [x] **S13 additions:** delete unused .glass-panel; lint ignore-list seeds (BottomNav emoji sizing, wrapper-label patterns per §8, CollectionsTab fixed grid, SeriesCard indigo comment; from Batch 3 close-out: Library Series-tab fixed grid, and the C-engine false positive on CriteriaBuilder's FormField `label`-prop span — nested JSX in a prop, not an override). — ✅ 2026-07-09 (v0.50.0): `.glass-panel` deleted together with Modal's zero-caller `glass` prop; all seven ignore seeds verified against the shipped lint's pattern set — **none trips it**, so zero inline ignores exist (the report's active-ignores inventory is empty; seeds stay listed here as documentation of the verification).
- [x] **BookDetail dead code from the never-landed S3 rating popup** — deleted 2026-07-06 (same v0.48.0 tree): `ratingPopupOpen`, dead twin `statusPopupOpen`, `handleRatingChange`, and its private `ratingLoading`/`ratingStatus` state. `selectedRating` kept (write-only now; setters live in refresh paths — belongs to the parked status data-model sprint).
- [x] **Docs:** SKILL.md still lists BottomSheet/ThreeDotMenu under ui/ — remove ghosts. — ✅ 2026-07-07, with frozen-list and database-name corrections in the same pass.

---

### 10.1: Download & Share — ✅ Shipped v0.51.0 (S14)

**Priority:** P0 — Highest Impact  
**Status:** ✅ Shipped 2026-07-10 (S14, v0.51.0) — decisions locked in Decisions.md 2026-07-09  
**Sessions:** 1-2 (shipped in 1)

**The Problem:**  
Finding and opening a book currently requires: Open Liminal → Note the book → Open NAS file browser → Navigate to books folder → Search → Download → Open in Moon Reader. This takes 1-2 minutes every time.

**The Solution:**  
One-tap download with share sheet integration.

**Tasks:**
- [x] 10.1.1 **Serve EPUB Files** — Backend endpoint to serve book files with proper MIME type — ✅ `GET /api/editions/{id}/download` in new `downloads.py` router; MIME by extension, attachment disposition, path-containment + stale-file guards
- [x] 10.1.2 **Download Button** — ✅ shipped as a full-width "Download" button ABOVE ReadingStatusCard (not wired into the card — its dormant download affordance is reserved for the S15 knot sprint; Decisions 2026-07-09)
- [x] 10.1.3 **Edition Selection** — If multiple editions exist, show picker (default to EPUB) — ✅ bottom-sheet picker (Treatment A); note: edition-create and merge both enforce one edition per format, so the picker triggers only if that invariant ever relaxes
- [x] 10.1.4 **Web Share API** — Integrate share sheet for "Open in Moon Reader" on mobile — ✅ shares a typed `File` so reader apps appear as targets
- [x] 10.1.5 **Fallback Download** — Direct download for browsers without Web Share API — ✅ temporary anchor click; attachment disposition handles the save
- [x] 10.1.6 **Download Feedback** — Loading state, success/error toast — ✅ existing Toast pattern; share-sheet cancel fails quietly

**Acceptance Criteria:**
- Tap "Read" on any library book → file downloads or share sheet opens — *(label shipped as "Download" per Decisions 2026-07-09)*
- Can select Moon Reader from share sheet and book opens
- Works on Android Chrome (primary use case)

**Definition of Done:** The "find book → read book" loop is closed. No more NAS searching.

---

### Multi-Format Editions (S15) — ✅ Core shipped v0.52.0; follow-ups queued

**Priority:** P0 — follow-on to 10.1 (the download picker can't distinguish formats it doesn't know about)
**Status:** ✅ Sessions 1–3 shipped in v0.52.0 (2026-07-10) and verified in production: relabel clean (2,173 relabeled, 0 left as `'ebook'`), full-sync backfill created 3,939 editions with 0 errors, DB audit passed all integrity checks; 25 same-format duplicate files and 4 format conflicts surfaced for manual cleanup. Decisions locked in Decisions.md, S15 Decision Sprint 2026-07-10. S15.3a + S15.3b + S15.2b shipped v0.53.0, deployed 2026-07-12. Remaining: batch-2 UI items (Sessions 1–3 built: Delete Title with trash v0.55.0, merge trashes the source folder v0.56.0, Files section owns format actions v0.57.0).
**Sessions:** 3 shipped + follow-ups

**The Problem:**
The database records one file per title even when the folder holds several — upload records only the first moved file, sync records a single epub-preferred edition. Every file-backed edition is `format='ebook'`, so sibling files (mobi/azw3/html) are invisible to the app and the download picker.

**The Solution (two-tier format model):**
Humans pick coarse groups (ebook/physical/audiobook/web) — no dropdown gains options. File-backed editions store extension-derived storage formats (epub/pdf/mobi/azw3/azw/html). `'ebook'` survives as a legal value meaning "ebook, no file." `reading_sessions.format` stays coarse and untouched.

**Tasks (shipped in v0.52.0):**
- [x] Session 1 **Format constants + consumers** — shared constants once per side (`backend/constants.py`, `frontend/src/constants/formats.js`); every named inline format list replaced with imports; `POST /titles` format validation added (fold-in fix); download gates → `format IN EBOOK_FORMATS AND file_path`; `text/html` media type; coarse-`ebook` filter expansion so the Library Ebook checkbox survives the migration — ✅ v0.52.0, verified no behavior change on unmigrated data
- [x] Session 2 **Relabel migration** — idempotent startup migration relabels file-backed editions by extension (`.htm` → `'html'`; file-less/unknown → `'ebook'`); one-line run summary; collision-safe (transaction + clean abort); riders: `azw`/`htm` download media types, `*.db-*` gitignore hardening — ✅ v0.52.0, end-to-end tested; ran clean in production (2,173 relabeled)
- [x] Session 3 **Format-aware sync** — one edition per recognized file per folder, matched by (folder_path, storage format); deterministic same-format pick (alphabetical, skip + report); relocation vs conflict handling; per-title orphan semantics; vanished files reported, never deleted; kills the full-sync duplicate-edition bug; sync never writes `'ebook'` again — ✅ v0.52.0, end-to-end tested; production backfill created 3,939 editions, 0 errors

**In flight — S15.3: Sync Control & Visibility**
- [x] P1 **Full-Sync Overwrite Contract** (Decisions.md 2026-07-11; carry-over first surfaced in the S15.3a copy review) — the v0.53.0 production full sync overwrote hand-corrected metadata on 618 titles (DB-diff confirmed). ✅ shipped v0.54.0, deployed 2026-07-12: existing titles get fill-empty-only writes at the shared `_do_sync` path (NULL/'' — plus '[]' for authors/tags — is the only test; new titles still extract fully; per-title Rescan Metadata unchanged); covers all routes including incremental relocations, not just `full=true`; untouched titles stay byte-identical (no more updated_at churn); `fields_backfilled` counter + results-view row; confirmation copy corrected. End-to-end verified: edited title survives a full sync byte-identical, empty fields fill, relocation route can't overwrite. Damaged-title restoration: **closed 2026-07-12, not restoring** — too many changes since the last backup to make a revert worth it; moving forward from current state.
- [x] S15.3a **Full Sync action on the Settings page** with a confirmation step — the API supports `?full=true` but the UI could not send it (discovered at deploy; the backfill had to be triggered outside the app) — ✅ shipped v0.53.0, deployed 2026-07-12: inline confirmation, live scan progress via the status endpoint, mutual-exclusion guards, every outcome surfaced; 4-lens adversarial verification passed with 0 blockers
- [x] S15.3b **Post-sync results view** — list format conflicts, same-format duplicate skips, and missing-file warnings in plain language so the 4 surfaced conflicts (and future ones) can be investigated without reading container logs. Note: Find Duplicates covers duplicate *titles* only, not file-level format conflicts — this view is the only surface for those. Decisions locked 2026-07-11: persistent + actionable — last-sync summary lives on the Settings page (stored SyncResult), shown after a manual sync via the same component; every warning links to its title. Also absorbs S15.3a's interim choices: replaces toast-only outcome surfacing and resolves the "Cancel" label tension with the voice doc (see CHANGELOG 0.53.0 accepted findings) — ✅ shipped v0.53.0, deployed 2026-07-12: SyncResult persisted from every sync path including failed/interrupted runs, "Last sync" Settings row, grouped results view at /sync-results, manual syncs navigate there on completion, "Not Now" dismissal ratified. Note: stored details populate on the first post-deploy sync — the 4 known conflicts and 25 duplicate skips surface in the view after one Full Library Sync.

**Remaining S15 follow-ups:**
- [x] S15.2b **Upload fixes** (split out — not covered by the Session 2 prompt): upload records every moved file as its own edition (not first-only); unguarded edition insert fix (fold-in); primary-file locator misses `.azw`/`.html`/`.htm` — ✅ shipped v0.53.0, deployed 2026-07-12: all four upload edition-writing paths mirror sync's model (one edition per storage format, alphabetical same-format pick with skips surfaced, aborted-relabel defer guard, IntegrityError backstops); `.htm` → `'html'` at format-derivation time; locator replaced by sync's shared `discover_book_files`. Carry-over folded into batch-2: AddPage doesn't yet render per-book finalize messages, so skip/defer surfacing lives in the API response + logs until then — closed v0.67.0, rendered in the upload results rows.
- [x] **Batch-2 Session 1 — Delete Title with trash** (Decisions 2026-07-12: UI-initiated deletion + move-to-`_trash`) — ✅ built 2026-07-12, v0.55.0 in progress: `DELETE /api/books/{id}` moves the title's edition folders to `<books_root>/_trash/` (shared `services/trash.py` helper — `shutil.move`, collision-suffixed, containment-guarded, never `rmtree`) then deletes the row (children cascade); sync's discovery walker and upload duplicate detection skip `_trash/`; BookDetail 3-dot menu "Delete Title" behind a two-step inline confirmation (consequences with counts, honest files-vs-history asymmetry, [Not Now]/[Delete] then [Keep]/[Delete Title]); failed moves restore already-moved folders and never touch the DB. Sync still never deletes. End-to-end verified (25 checks, incl. trashed-folder-never-reappears and the failure/restore path). Session 2 reuses this mechanism for merge (records-only — the merge-files decision was reversed).
- [x] **Batch-2 Session 2 — Merge trashes the source folder** (Decisions 2026-07-12, REVERSED 2026-07-12: merge is a records operation — files never move between folders; the original move-unique-formats-into-the-kept-folder plan is dropped as the app's highest-risk file operation for a scenario unseen in 1+ year of use, recoverable anyway via `_trash/` + Add Format) — ✅ built 2026-07-12, v0.56.0: merging B into A moves B's folder(s) to `_trash/` files-first with the same restore-on-failure contract as Delete Title; ALL of B's editions are dropped (files ride along to trash inside B's folder), so A keeps exactly the files it had and no edition can point into a folder its title doesn't own — this also fixes the old merge's cross-folder edition pointers (re-pointed `title_id` without updating `folder_path`); folders shared with another title stay put; sessions (renumbered to continue A's sequence), notes, collections, and backlinks still move over; confirm copy rewritten — it no longer claims irreversibility, because files come back from `_trash/`. End-to-end verified (37 checks, incl. merged-title-never-reappears-on-sync and the failure/restore path).
- [x] **Batch-2 Session 3 — Files section owns format actions** (2026-07-12 decision; hybrid mockup approved 2026-07-13) — ✅ built 2026-07-13, v0.57.0: BookDetail gains a collapsed-by-default Files section directly below Collections — one row per edition ("FORMAT · filename · size" for file-backed editions, size stat'd at request time and never stored; "FORMAT · No file" for fileless; "size unavailable" when the path is stale), footer [Add format] / [Add files] visible whenever the section is expanded, per-row remove (44px ×) gated behind an Edit ⇄ Done header toggle that resets on collapse and hides entirely with a single edition. Add Format / Remove Format left the 3-dot menu and the Remove-Format picker modal is deleted. Removing a file-backed format now moves its file to `_trash/` files-first (new `move_file_to_trash` sibling helper; same restore-on-failure contract as Delete Title; a file shared with another edition, or already missing from disk, stays put — records-only delete). The confirm modal states the file consequence and its footer is [Keep] / [Remove]. Riders: design-lint `alert(` strict rule (closing the 0.56.1 blind spot — 13 pre-existing sites now on the honest ledger for batch 3), `getBackLabel` "Sync results" case. Recon finding: "Add files" needed no AddPage work — `/add?mode=upload&linkTo={id}` handling already existed end-to-end (built for the wishlist Acquire flow); the new action just navigates to it. End-to-end verified (31 checks, incl. the DB-failure file-restore path).
- [x] **Session A — Kill collapse on BookDetail (subtractive)** (decided 2026-07-14 from daily use: scrolling is free on this screen, hiding content is not) — ✅ built 2026-07-14, v0.58.0: every BookDetail section renders fully expanded, always — the three `CollapsibleSection` usages (About This Book / Tags / Metadata) inlined as plain headings + full content (no "View more" fade, no truncation), the Files section's disclosure (heading-wraps-button, `aria-expanded`, decorative chevron) deleted with its `filesExpanded` state, and the [Add format] / [Add files] footer now always visible. The Files Edit ⇄ Done toggle survives (gates destructive actions, not disclosure; `> 1` guards and delete-to-one-exits-edit-mode intact), as does the v0.57.0 reset-on-id-change. `ui/CollapsibleSection.jsx` NOT deleted — ComponentPreview still demos it (recon halt-condition); BookDetail was its only production consumer. Section ORDER deliberately untouched — next session's decision, made against the honest screen.
- [x] **S16 Status Knot, Session B1 — sessions-canonical status projection (backend)** (Decisions 2026-07-14) — ✅ built 2026-07-15, v0.59.0: `titles.status`/`date_started`/`date_finished`/`rating` are a projection of `reading_sessions`, recomputed inside the same transaction as every session write (`sync_title_from_sessions` rewritten under a ratified, scoped frozen-file edit: latest `date_started` wins with id tiebreak, `date_finished` from closed sessions only, no internal commit). The status/rating/dates endpoints write sessions, never title columns — Reading keeps/starts an open session, Finished closes it (or records a closed read), DNF marks it `dnf` preserving `date_started`, Unread deletes open sessions while closed history keeps projecting; `PATCH /dates` treats null as leave-unchanged (the clobber's contract-level fix). Merge now recomputes the target's projection (staleness bug, records-only fix). Completion status needed no backend severing — separate column, separate write paths; the coupling is display-side JSX (B2). 21/21 harness checks incl. the two riders (backfilled-read status steal, DNF-preserves-prior-finish-date). Parked to batch 3: unmount dead-broken `import_metadata.py` (writes to the pre-Phase-5 `books` table) — ✅ pulled forward and done, v0.62.0, as a full sweep (router unmounted + deleted, orphaned ImportPage and its `/import` route deleted with it).
- [x] **S16 Status Knot, Session B2 — BookDetail action surface (frontend)** (Decisions 2026-07-14; snap-back semantics + rulings 1–8 ratified 2026-07-15) — ✅ built 2026-07-15, v0.60.0: inline 4-state segmented toggle below Download (labels via `useStatusLabels`; content-driven grid — one row of four when every label ≤ 11 chars, any longer label flips the control to true 2×2, in-segment wrap covers the rest, no truncation; status-token active colors, 44px targets) → one-call endpoint → refetch, toggle and display-only status pill both render the returned projection; Finished tap opens inline date+rating capture writing a single `updateBookStatus` call; download on an Unread title offers a dashed "Start reading?" card (accept → in-progress session dated today, format ebook; decline writes nothing); snap-back microcopy for both ratified Unread cases. ReadingStatusCard (owned-book usage) + MarkFinishedModal + ChangeStatusModal evicted from BookDetail; modals survive in Library/AuthorDetail/CollectionDetail, all rewritten to the one-call contract applying the projected response (snap-backs no longer render a lie in list views) with errors in the modal banner instead of silent console swallows; ChangeStatusModal's false "Finish date will be cleared" replaced with snap-back-honest copy. Dead code deleted grep-verified: `handleStatusChange`, the unreachable date-editor wiring, `getStatusSubtitle`, and consumer-less api.js `updateBookDates`/`updateBookRating`. ReadingStatusCard is now wishlist-only under a general-purpose name — batch-3 rename candidate. Pending phone test: long-label 2×2 wrap, download→prompt flow.
- [ ] **Batch-2 UI items (remaining):** coarse-chip collapse (multiple storage-format chips reading as one Ebook group where appropriate); ~~desktop stale-path download bug (fold-in, Decisions 2026-07-10)~~ ✅ closed v0.67.0 — desktop downloads fetch first and surface the backend's 404 detail as the error toast; the no-share and share-fallback branches unified into one blob-save path; ~~backup-filename parser~~ ✅ closed v0.67.0 — recon characterized the one real defect per the 2026-07-17 no-invented-defects ruling (the rotation parser misread `liminal_pre_sync_*` names positionally and exempted them from retention; timestamp now parsed from the trailing tokens with the `liminal_` prefix required; "Last backup"/stats were never filename-derived and are untouched); microcopy verification pass over the new format surfaces (now including the Session 3 strings: confirm-modal file consequence, "size unavailable", "No file"); ~~render S15.2b's per-book upload messages (skips/defers) in AddPage~~ ✅ closed v0.67.0 — rendered as secondary lines on the UploadSuccess result rows (error messages keep their Errors block); the `getBackLabel` `/sync-results` queue item was re-verified present and dropped this session — it shipped as a v0.57.0 rider; ~~the `alert()` sites surfaced by the lint rule~~ ✅ closed v0.63.0 — all 7 remaining (CollectionsTab 1, CollectionModal 4, CollectionDetail 2) converted to inline error banners in their host surfaces; the lint's alert category is at 0 and every strict category passes; the 6 new error strings joined the microcopy-pass queue; from the 2026-07-12 decision sprint: download picker drops file size (the size now lives in the Files section — the picker-side removal remains); ~~3-dot menu audit~~ ✅ done v0.61.0 (Session B3): Edit · Change Cover ─ Merge · Rescan Metadata ─ Delete Title, add-session and add-to-collection removed (both live in their sections), plus the B3 History fixes (projection-ordered session list, finished-only Times Read, + glyph) and the honest Remove Format confirm (stale/within-title-shared paths no longer promise a trash move; cross-title sharing parked as an accepted edge). ~~Merge actually merges files~~ — decision REVERSED 2026-07-12; shipped instead as records-only merge in Session 2 (v0.56.0)

**Definition of Done:** Every file in a title's folder is a visible, downloadable edition with its real format — shipped; follow-ups close the loop on adding files and investigating sync findings in-app.

---

### Shared-Component Adoption Sprint (decisions locked 2026-07-22)

**Priority:** P1 — current sprint
**Sessions:** 4, sequencing ratified (Decisions.md, Adoption Sprint Decision Sprint); mandatory drift check between S3 and S4

| Session | Scope | Status |
|---------|-------|--------|
| S1 | Gallery exit + Settings link, 4 missing demos + StarRating slot, Badge verdict recon, MenuItem five-site recon, doc riders | ✅ Shipped in full — v0.75.0 (demos, recon verdicts, doc riders) + v0.76.0 rider (demo-frame z-0 fix, gallery exit, Settings "Developer" link); mobile verify pending |
| S2 | B1: real-action text-labeled raw buttons → Button | ✅ Shipped v0.77.0 — 17 sites / 13 files converted, variants mapped per site, zero style overrides; raw-button count 120 → 103. Census corrected 19 → 17: the triage's two extra sites were AcquireCard dormant-block buttons already deleted in v0.73.0 |
| S3 | B2: raw buttons → IconButton — clears the four A6 stroke ignores | Queued |
| S4 | MenuItem primitive (contract locked 2026-07-22) + adoption, ThreeDotMenu extraction to `ui/`, Badge rebuild (survived S1 recon: 7 adoptable sites), raw-`<button>` strict flip | Queued |

---

### Search Expansion (scoped 2026-07-20)

**Priority:** P2 — queued behind the shared-component adoption sprint
**Sessions:** 1–2

One sprint closing the three known search gaps: full-text search across notes
and summaries (LIKE-based — no schema change; FTS revisited only if
performance demands it), authors surfaced in main search, and wishlist search
actually searching the wishlist. Results render as grouped sections in the
main search surface with matched-text snippets. Distinct from 10.3 External
Book Search: this searches what you own; 10.3 searches the outside world.
Scoping decisions pending (Decisions.md will hold them): which note types are
searchable, result anatomy, priority order.

---

### 10.2: Usage Analytics

**Priority:** P1 — Foundational  
**Status:** ⏸ On hold (pending 10.0D completion)  
**Sessions:** 1

**The Problem:**  
No data on how the app is actually used. UI decisions are based on guesswork instead of evidence.

**The Solution:**  
Simple event logging to SQLite. No external tools needed.

**Tasks:**
- [ ] 10.2.1 **Events Table** — Create `events` table (event, timestamp, metadata JSON)
- [ ] 10.2.2 **Log Endpoint** — `POST /api/analytics/event` 
- [ ] 10.2.3 **Frontend Helper** — `trackEvent(event, metadata)` function
- [ ] 10.2.4 **Core Events** — Instrument key interactions:
  - `nav_tapped` (item: library/series/collections/authors/settings)
  - `search_opened` (from: home/browse/wishlist)
  - `book_opened` (book_id, from: library/collection/series/search)
  - `book_downloaded` (book_id)
  - `wishlist_added` (method: manual/search/photo)
  - `filter_applied` (filter_type)
  - `tab_switched` (tab: home/browse/wishlist)
- [ ] 10.2.5 **Query Examples** — Document useful SQL queries for analysis

**Acceptance Criteria:**
- Events are logged to database
- Can query "what do I tap most?" and get real data
- No visible impact on app performance

**Definition of Done:** Data collection begins. Every day of usage adds insight.

---

### 10.3: External Book Search

**Priority:** P2 — High Frequency Pain  
**Status:** ⏸ On hold (pending 10.0D completion)  
**Sessions:** 2-3

**The Problem:**  
Adding a book to wishlist requires manually typing title, author, summary. This happens weekly and takes 5+ minutes per book.

**The Solution:**  
Search external APIs and one-tap import.

**Tasks:**
- [ ] 10.3.1 **Google Books Integration** — Search endpoint, parse results
- [ ] 10.3.2 **Open Library Fallback** — Secondary source when Google Books misses
- [ ] 10.3.3 **Hardcover Integration** — Third source (has good romance/genre coverage)
- [ ] 10.3.4 **Search UI** — Search input on Add page with results list
- [ ] 10.3.5 **Result Display** — Cover, title, author, year for each result
- [ ] 10.3.6 **One-Tap Import** — Select result → pre-fill form → confirm
- [ ] 10.3.7 **Debounced Search** — Don't hit API on every keystroke
- [ ] 10.3.8 **Loading/Empty/Error States** — Handle all cases gracefully
- [ ] 10.3.9 **Works for Library Too** — "Search External" option when editing library books with bad metadata

**API Details:**

| Source | API | Auth | Coverage |
|--------|-----|------|----------|
| Google Books | REST, free | None (basic) | Broad, weak on romance |
| Open Library | REST, free | None | Good classics, variable |
| Hardcover | GraphQL | API key | Strong genre fiction |

**Acceptance Criteria:**
- Search "tomorrow tomorrow zevin" → find the book
- One tap to add to wishlist with full metadata
- Works when only partial info is known

**Definition of Done:** Wishlist entry goes from 5 minutes to 30 seconds.

---

### 10.4: Local AI Infrastructure

**Priority:** P3 — Foundational for Future Features  
**Status:** ⏸ On hold (pending 10.0D completion)  
**Sessions:** 1-2

**The Problem:**  
AI features (analysis, photo lookup) would require expensive cloud API calls. Infrastructure for local inference doesn't exist.

**The Solution:**  
Set up Ollama on self hosted NAS as a local AI server.

**Hardware:**
- Separate compute host on local network (sufficient RAM + SSD for model inference)

**Tasks:**
- [ ] 10.4.1 **Install Ollama** — Docker container on TrueNAS or native install
- [ ] 10.4.2 **Pull Models** — Llama 3 8B (text), LLaVA 13B (vision)
- [ ] 10.4.3 **Network Config** — Ensure the NAS/Liminal can reach Ollama endpoint
- [ ] 10.4.4 **Health Check Endpoint** — Liminal can verify Ollama is running
- [ ] 10.4.5 **Test Inference** — Verify text and vision models respond correctly
- [ ] 10.4.6 **Document Setup** — Add to ARCHITECTURE.md for future reference

**Acceptance Criteria:**
- Ollama endpoint returns a valid model response over the local network
- Liminal backend can call Ollama successfully
- Vision model can describe an image

**Definition of Done:** Local AI infrastructure is operational and ready for features.

---

### 10.5: Fanfic Analysis Pipeline

**Priority:** P4 — Leverages 10.4  
**Status:** ⏸ On hold (pending 10.0D completion)  
**Sessions:** 2-3

**The Problem:**  
Fanfiction has rich metadata potential (tone, tropes, emotional impact) but it's not captured. Previous manual analysis via ChatGPT was tedious.

**The Solution:**  
Background analysis using local Ollama, storing structured metadata.

**Tasks:**
- [ ] 10.5.1 **Analysis Schema** — Define fields: tone, smut_level, angst_level, serotonin_level, emotional_impact, tropes, hook, warnings
- [ ] 10.5.2 **Database Fields** — Add JSON column for AI analysis metadata
- [ ] 10.5.3 **Analysis Prompt** — Craft prompt for consistent, structured output
- [ ] 10.5.4 **Single Book Analysis** — "Analyze" button on BookDetail for fanfic
- [ ] 10.5.5 **Background Worker** — Queue-based processing for batch analysis
- [ ] 10.5.6 **Analysis Display** — Show tone/tropes/hook in BookDetail metadata section
- [ ] 10.5.7 **Smart Chunking** — For long fics: AO3 tags + first/last chapters only (context limits)
- [ ] 10.5.8 **Progress Tracking** — "X of Y books analyzed" indicator
- [ ] 10.5.9 **Filter by Analysis** — Collections can filter by tone, tropes, etc.

**Analysis Output Example:**
```json
{
  "tone": 2,
  "smut_level": 4,
  "angst_level": 5,
  "serotonin_level": 2,
  "emotional_impact": 5,
  "tropes": ["enemies to lovers", "slow burn", "redemption arc", "war trauma"],
  "hook": "Draco Malfoy is assigned to protect the one person who could destroy him...",
  "warnings": ["violence", "trauma", "dark themes"]
}
```

**Acceptance Criteria:**
- Can analyze any fanfic book with one tap
- Analysis runs locally (no API costs)
- Can batch-analyze library overnight
- Analysis data is queryable in collections

**Definition of Done:** Fanfic library has rich, searchable metadata without manual entry.

---

### 10.6: Moon Reader Integration

**Priority:** P5 — High Value, Requires Setup  
**Status:** ⏸ On hold (pending 10.0D completion)  
**Sessions:** 3-4

**The Problem:**  
Reading sessions are entered manually. Highlights and bookmarks are trapped in Moon Reader.

**The Solution:**  
Read Moon Reader's sync data (via MoonSync approach) and import into Liminal.

**Prerequisites:**
- Enable WebDAV on the NAS
- Configure Moon Reader to sync to WebDAV
- Locate `books.sync` file

**Tasks:**
- [ ] 10.6.1 **WebDAV Setup Guide** — Document how to configure the NAS's WebDAV + Moon Reader
- [ ] 10.6.2 **Parse books.sync** — Understand format (reference MoonSync project)
- [ ] 10.6.3 **Book Matching** — Match Moon Reader entries to Liminal books (by filename or title)
- [ ] 10.6.4 **Import Reading Progress** — Pages read, percentage, current position
- [ ] 10.6.5 **Import Highlights** — Text, color, location
- [ ] 10.6.6 **Import Sessions** — Reading dates, duration (if available)
- [ ] 10.6.7 **Sync Trigger** — Manual "Sync from Moon Reader" button
- [ ] 10.6.8 **Auto-Sync Option** — Periodic background sync (optional)
- [ ] 10.6.9 **Conflict Handling** — What if Liminal has different data?
- [ ] 10.6.10 **Display Highlights** — Show in Notes section or dedicated tab

**Reference:** [MoonSync GitHub](https://github.com/titandrive/Obsidian-MoonSync) — MIT licensed, shows sync file format

**Acceptance Criteria:**
- Finish reading in Moon Reader → data appears in Liminal without manual entry
- Highlights are captured and viewable
- Reading progress syncs automatically (or one-tap)

**Definition of Done:** Moon Reader and Liminal share reading data. Manual session entry eliminated.

---

### 10.7: Notes ↔ Obsidian Sync

**Priority:** P6 — Important but Not Urgent  
**Status:** ⏸ On hold (pending 10.0D completion)  
**Sessions:** 2-3

**The Problem:**  
Notes in Liminal are siloed. Can't search them in Obsidian, can't link to them from other notes, can't use them in AI analysis workflows.

**The Solution:**  
Bi-directional sync between Liminal notes and markdown files in Obsidian vault.

**Tasks:**
- [ ] 10.7.1 **File Naming Convention** — `{Title} - {Author}.md` with YAML frontmatter
- [ ] 10.7.2 **Frontmatter Schema** — book_id, title, author, series, status, rating
- [ ] 10.7.3 **Export to Files** — Write Liminal notes as .md files
- [ ] 10.7.4 **Import from Files** — Read .md files back into Liminal
- [ ] 10.7.5 **Conflict Detection** — Warn if both Liminal and file have changed
- [ ] 10.7.6 **Last-Write-Wins Option** — Simple resolution strategy
- [ ] 10.7.7 **Sync Folder Config** — Settings to specify Obsidian vault path
- [ ] 10.7.8 **Manual Sync Trigger** — "Sync Notes" button in Settings
- [ ] 10.7.9 **Auto-Sync Option** — Periodic background sync

**File Format Example:**
```markdown
---
book_id: 1234
title: "Tomorrow, and Tomorrow, and Tomorrow"
author: "Gabrielle Zevin"
series: null
status: "read"
rating: 5
synced_at: 2026-03-09T10:30:00Z
---

## Notes While Reading

The video game development scenes feel so authentic...

## Thoughts After Reading

This book broke me in the best way.
```

**Acceptance Criteria:**
- Notes appear in Obsidian vault as .md files
- Can edit in either location (with conflict warning)
- Can search book notes in Obsidian

**Definition of Done:** Notes flow between Liminal and Obsidian. Both systems have access.

---

### 10.8: Photo Lookup

**Priority:** P7 — Nice to Have (Free with Local AI)  
**Status:** ⏸ On hold (pending 10.0D completion)  
**Sessions:** 1-2

**The Problem:**  
Photos of book covers sitting in camera roll, not added to wishlist because it's too tedious.

**The Solution:**  
Upload photo → local vision AI extracts title/author → feeds into external search.

**Tasks:**
- [ ] 10.8.1 **Photo Upload UI** — Camera/gallery button on Add page
- [ ] 10.8.2 **Vision API Call** — Send image to Ollama LLaVA
- [ ] 10.8.3 **Extract Title/Author** — Parse model response
- [ ] 10.8.4 **Feed to Search** — Auto-search with extracted text
- [ ] 10.8.5 **Confidence Display** — "Found: The Love Hypothesis by Ali Hazelwood — is this right?"
- [ ] 10.8.6 **Fallback to Manual** — If vision fails, allow manual entry
- [ ] 10.8.7 **Screenshot Support** — Works for screenshots of book recommendations too

**Acceptance Criteria:**
- Take photo of book → Liminal identifies it → one tap to add
- Runs locally (no API costs)
- Works for most clear cover photos

**Definition of Done:** Photo backlog can be cleared. Physical books easily added.

---

### Phase 10 Progress Summary

| Sub-Phase | Name | Sessions | Status |
|-----------|------|----------|--------|
| 10.0 | Component Foundation | 2 | ✅ Complete |
| 10.0C | Full Conversion | 8 | ✅ Complete |
| **10.0D** | **UX Audit Fix Sessions** | **10 + 1** | **🔄 In Progress (10/10 shipped, Session 11 Final Audit next)** |
| 10.1 | Download & Share | 1-2 | ✅ Shipped v0.51.0 (1 session) |
| — | Multi-Format Editions (S15) | 3 + follow-ups | ✅ Shipped v0.52.0; S15.3a/b + S15.2b (v0.53.0) + P1 contract (v0.54.0) deployed 2026-07-12; batch-2 UI in progress (S1 Delete Title with trash v0.55.0, S2 merge trashes source v0.56.0, S3 Files section owns format actions v0.57.0) |
| 10.2 | Usage Analytics | 1 | ⏸ On hold |
| 10.3 | External Book Search | 2-3 | ⏸ On hold |
| 10.4 | Local AI Infrastructure | 1-2 | ⏸ On hold |
| 10.5 | Fanfic Analysis Pipeline | 2-3 | ⏸ On hold |
| 10.6 | Moon Reader Integration | 3-4 | ⏸ On hold |
| 10.7 | Notes ↔ Obsidian Sync | 2-3 | ⏸ On hold |
| 10.8 | Photo Lookup | 1-2 | ⏸ On hold |
| | **Total** | **35-41** | |

---

## Critical Fixes (Parallel Track)

**Goal:** Address genuinely broken functionality from Phase 9.5, without getting lost in polish work.

**Philosophy:** Many of these are now covered by 10.0D audit fix sessions. Items marked with 🔗 will be addressed during the linked session.

### Navigation & Scroll Issues ⚠️

- [ ] **Scroll Position Restoration** — Back navigation should return to previous scroll position
- [x] **Author Detail returnUrl** — Pass returnUrl when linking to books (fixed in C6, v0.37.3)
- [ ] **Search Filter Redirect** — Filter link in search modal goes to Home instead of filtered Browse

### Layout Issues ⚠️

- [x] **Book Detail Layout** — Tab content layout issues (color/button in C1, modal/form in C2)
- [ ] **Notes Section Layout** — Formatting/display issues in notes area
- [x] **Series Landing Page** — Missing page title, layout issues (fixed in C6, v0.37.3)
- [x] **Authors Landing Page** — Missing page title, layout issues (fixed in C6/C8, v0.37.3/v0.37.5)

### Functional Bugs ⚠️

- [ ] **Checklist Pagination Loop** — Infinite spinner flicker at bottom of large checklists
- [ ] **Cover Cache Issues** — Changes don't reflect immediately after editing many covers

### Low Priority Cleanup

- [x] **TBRList → Wishlist Rename** — Renamed to WishlistTab.jsx in C3 (v0.37.0)

---

## Killed / Deferred

These items were on the previous roadmap but are **no longer planned**:

| Item | Reason |
|------|--------|
| **Phase 9.5 (91 polish items)** | Mostly cosmetic polish that doesn't solve real problems. Critical bugs moved to Critical Fixes track. |
| **Phase 10 Design System Refactor** | Premature optimization. Can refactor when patterns stabilize. |
| **Phase 11 React Native Learning** | Not needed. Web Share API provides sufficient mobile integration. |
| **Phase 12 React Native Migration** | Massive effort with unclear benefit. Current web app works well. |
| **Smart Suggestions** | Deferred until Phase 10.5 provides analysis data to make suggestions meaningful. |

**Time Saved:** ~8-10 weeks of planned work that wasn't going to help.

---

## Technical Debt

Items to address when time permits:

### Browser Cache Issues with Covers
**Symptom:** Cover changes may not reflect immediately after editing many covers.  
**Workaround:** Clear browser cache for past hour.  
**Priority:** Low

### Checklist Collection Pagination
**Symptom:** Infinite spinner flicker at bottom of large checklist collections.  
**Workaround:** Visual noise only, collection still usable.  
**Priority:** Medium — moved to Critical Fixes

### Pydantic Rating Type (Fixed v0.34.0)
**Was:** `rating` field typed as `Optional[int]` in four Pydantic models (`TitleSummary`, `TitleDetail`, `FanficTitleDetail`, `BookRatingUpdate`) while the database contained float values (e.g., 4.5). Caused 500 errors on Browse screen.  
**Fix:** Changed all four to `Optional[float]` in `backend/routers/titles.py`.  
**Watch for:** If Pydantic models are regenerated or new ones are added, `rating` must always be `float`, not `int`. Half-star ratings are valid (range 1.0-5.0).  
**Priority:** ✅ Fixed — documented here as a gotcha

### Minor Design System Stragglers
- `text-[#e0e0e0]` wrapper in `AddPage.jsx` (should be `text-text-primary`)
- `CriteriaBuilder.jsx` still has legacy gray classes (embedded in collection create/edit automatic mode)
**Priority:** Low — batch in a future cleanup pass

### Batch Collection Removal Error Handling
**Symptom:** If one API call fails during batch remove in CollectionDetail, the sequential `for` loop throws to `catch` and local state stays unchanged — but earlier calls in the batch already succeeded on the backend. UI shows all books present; some are already gone server-side.  
**Workaround:** Refresh the page to get true state from backend.  
**Priority:** Low (local NAS, partial failure extremely unlikely) — revisit if Liminal moves to a remote server

### Author Endpoint Field Name Mismatch (Known from v0.44.0)
**Symptom:** `AuthorBookItem` exposes `date_added` (for frontend consistency with other list views), but the underlying `titles` column is `created_at`. The backend maps `created_at → date_added` inside `get_author`.  
**Workaround:** None needed — frontend works as expected; mismatch is documentation-only.  
**Priority:** Low — either rename the column or rename the API field in a future schema pass; out of Session 6 scope

### Client-Side Search on Paginated Collections (Known from v0.44.0)
**Symptom:** CollectionDetail search filters only books already loaded via infinite scroll. For a 408-book automatic collection, a query won't surface matches from un-paginated books until the user scrolls them in.  
**Workaround:** Scroll to load more, then search; or wait on backend search endpoint.  
**Priority:** Low — revisit if daily use surfaces real friction. Server-side search would require a new endpoint.

---

## Future: Phase 11 — Smart Features

**Status:** Future (after Phase 10)

**Potential Features:**
- **Mood-based suggestions** — "I want something angsty" → recommendations based on analysis data
- **Similar book discovery** — "More like this" using trope/tone matching
- **Reading insights** — Patterns in what you read, when, how fast
- **Author affinity** — "You've loved 5 books by this author, here's another"

**Prerequisite:** Phase 10.5 (Fanfic Analysis) provides the data foundation.

---

## Completed Phases (Reference)

### Phase 9A-9F Summary

| Phase | Name | Completed | Key Deliverables |
|-------|------|-----------|------------------|
| 9A | Automated Backups | Jan 10 | Grandfather-father-son rotation, settings UI |
| 9B | Folder Independence | Jan 10 | File metadata primary, smart parsing |
| 9C | Cover System | Jan 11-13 | Auto-extraction, custom upload, bulk tool |
| 9D | Bug Fixes | Jan 15 | Add page simplification, mobile fixes |
| 9E | Smart Collections | Jan 15-17 | Manual/Checklist/Auto types, criteria builder |
| 9E.5 | Collections Polish | Jan 18-19 | Landing page, detail page, reorder, gradients |
| 9F | Book Detail Foundation | Jan 25 | CollapsibleSection, ReadingStatusCard, page structure |

### Phase 9.5 Sessions A-C (Partial)

| Session | Name | Completed | Key Deliverables |
|---------|------|-----------|------------------|
| A | Menu Consolidation | Feb 1 | 3-dot menu, toast system |
| B | Unified Edit Modal | Feb 1 | Tabbed edit modal |
| B+ | Change Cover Modal | Feb 1 | Cover management |
| C1-C3 | Navigation Redesign | Feb 2 | Script L, tab bar, UnifiedNavBar |

**Note:** Phase 9.5 Sessions C4-F and Work Groups 2-11 were **not completed** and are now **abandoned** (except items moved to Critical Fixes).

### Phase 10.0 Component Foundation

| Task | Name | Completed | Key Deliverables |
|------|------|-----------|------------------|
| 10.0A | Tokens + Audit Refresh | Mar 2026 | Color tokens, typography classes, Tailwind config |
| 10.0B | Core Components | Mar 2026 | Button, IconButton, Badge, SearchInput, Modal, FormField |
| 10.0.10 | BookCard v4 | Mar 2026 | variant prop, grid badges, progress bar, list view |
| 10.0.14 | ThreeDotMenu Extraction | — | Record corrected 2026-07-17: never extracted — still inline in BookDetail (see 10.0.14 above) |
| 10.0.15 | Warm Gradient Palette | Mar 2026 | 10 warm lanes, migration of 1,700+ covers |

### Phase 10.0C Design System Conversion

| Group | Name | Completed | Key Deliverables |
|-------|------|-----------|------------------|
| C1 | BookDetail colors+buttons | Mar 28 | 211 colors tokenized, 30 buttons converted, typography mapped |
| C2 | BookDetail modals+forms | Mar 28 | 5 modals to shared Modal, 9 FormFields, StarRating extracted |
| C3 | Library+HomeTab+WishlistTab | Mar 29 | UnifiedNavBar, view persistence, error states, TBR rename, voice fixes |
| C4 | Drawers+EditModal+CoverModal | Mar 29 | 204 colors, ChipInput extracted, 4 files to shared Modal |
| C5 | Collections family | Mar 29 | SmartPaste removed, 3 modals migrated, 6 files tokenized |
| C6 | Series+Authors | Mar 29 | returnUrl threading, page titles, 7 files tokenized |
| C7 | Add+Upload flows | Mar 29 | FileDropZone extracted, 12 files tokenized, series trim fix |
| C8 | Filter modals+misc | Mar 29 | 4 modals migrated, searchSort utility, 13 files tokenized |

---

## Infrastructure

### Current Architecture

**Deployment:** Docker container on a self-hosted NAS. FastAPI backend + React frontend served from the same container. SQLite database and book files on mounted volumes.

### Future with Moon Reader Sync

```
Moon+ Reader → WebDAV (on the NAS) → books.sync file
                                        ↓
                              Liminal reads + imports
                                        ↓
                              Reading data in DB
```

---

## Development Philosophy

1. **Solve real friction first** — Features that save time daily beat polish that looks nice
2. **Ship incrementally** — Each sub-phase delivers value independently
3. **Connect, don't rebuild** — Integrate with existing tools (Moon Reader, Obsidian, Google Books) instead of replacing them
4. **Local-first AI** — Use Ollama on self hosted NAS to avoid API costs and keep data private
5. **Mobile-first** — Every feature works great on Android
6. **Data integrity** — Never lose user's notes or reading history
7. **Measure, then optimize** — Analytics before UI redesign

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| `ARCHITECTURE.md` | System design, data flow (needs update after Phase 10) |
| `CHANGELOG.md` | Version history |
| `CODE_PATTERNS.md` | Battle-tested code solutions |
| `FRONTEND_AUDIT_2026.md` | Claude Code audit — basis for 10.0C work groups |
| `liminal-ux-audit.md` | NNG usability audit — 141 findings, basis for 10.0D fix sessions |
| `UX_FIX_SESSIONS.md` | 10 prioritized fix sessions with finding IDs and scope |

---

*Roadmap is the single source of truth. Update this document as work progresses.*

*Last updated: July 22, 2026 (v0.76.0)*
