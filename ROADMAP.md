# Liminal Product Roadmap

> **Last Updated:** July 6, 2026 (v0.48.0 in progress)
> **Current Focus:** Phase 10.0E design consistency sweep (S12) — Batch 1 (straggler file conversions) shipped; Batches 2–3 next.
> **Tracking Philosophy:** This roadmap is the single source of truth. No separate spec documents.

---

## Vision

Liminal is a **connected reading hub** that eliminates friction across your entire reading ecosystem. It integrates with external metadata sources, your reading app, your notes system, and local AI — so you spend less time managing and more time in the liminal space of reading.

**The old vision** was a polished, standalone book management UI.  
**The new vision** is an integration layer that connects everything together.

---

## Current State (v0.47.2)

The app is fully functional for daily use with 1,700+ books. Core systems are stable:

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
| NNG usability audit | ✅ Complete — 141 findings (4 critical, 29 major) |
| UX fix sessions | ✅ Complete — 11/11 shipped, Session 11 regression pass passed (findings logged to Open Questions) |

**What's Missing:**
- ❌ Can't download/open books from the app
- ❌ Wishlist requires manual metadata entry
- ❌ No connection to Moon Reader
- ❌ Notes are siloed from Obsidian
- ❌ No usage analytics to inform UI decisions
- ❌ No intelligent analysis of fanfiction content

---

## Roadmap Overview

```
┌───────────┬──────────────────────────────────────────────────────────────┐
│  CURRENT  │  Phase 10.0D: UX Audit Fix Sessions                         │
│           │  10 + 1 sessions (includes final audit)                           │
│           │  Ship each session independently                             │
├───────────┼──────────────────────────────────────────────────────────────┤
│  ON HOLD  │  Phase 10.1-10.8: Liminal Connects (feature work)           │
│           │  Paused until 10.0D critical/major fixes are resolved        │
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
**Status:** ✅ Complete — ready for 10.0C conversion  
**Sessions:** 2

**The Problem:**  
No reusable components exist. Every screen has slightly different buttons, headers, cards, spacing, and colors. This causes:
- Visual inconsistency across the app
- Slow feature development (reinventing UI each time)
- Maintenance burden (fixing the same thing in 12 places)

**The Solution:**  
Establish design tokens and core components before building Phase 10 features. All new code will use these primitives, ensuring consistency going forward.

**Reference Documents:**
- `DESIGN_SYSTEM_REFACTOR.md` — January 2026 audit of 29 screens, component inventory, inconsistency analysis
- `RN_DESIGN_TOKENS.md` — Token definitions (colors, spacing, typography, etc.)

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
- [x] 10.0.14 Extract `ThreeDotMenu` from BookDetail to `components/ui/ThreeDotMenu.jsx`
  - Desktop dropdown + mobile bottom sheet, zero behavior changes
  - Now importable by Series, Author, Collection detail pages (used in 10.0C)

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
- `text-[#e0e0e0]` wrapper in AddPage.jsx (→ S12 Batch 2)
- ~~CriteriaBuilder.jsx still has legacy gray classes~~ ✅ converted in S12 Batch 1 (v0.48.0)

---

### 10.0D: UX Audit Fix Sessions ← CURRENT

**Priority:** P0 — Fix What's Broken Before Building What's New  
**Status:** ✅ Complete — all 11 sessions shipped; Session 11 regression pass on Sessions 1–10 passed (non-regression findings logged to Open Questions backlog)  
**Sessions:** 10 + 1 (final audit)  
**Based on:** `liminal-ux-audit.md` (141 findings, NNG heuristic + WCAG AA + user flows pass)

**The Problem:**  
A comprehensive NNG usability audit (8 screenshot groups + 10 interactive user flows) revealed 4 critical issues, 29 major issues, and 75 minor issues. One core flow (wishlist-to-library conversion) is completely broken. The most-visited page (BookDetail) has a structural action architecture problem. Text contrast fails WCAG AA. Grid settings don't apply consistently. Building new features on top of these problems would compound them.

**The Solution:**  
10 fix sessions, ordered by severity. Each session follows: review findings → make design decisions (lock in Decisions.md) → write Cursor prompts → implement → verify. No rushing to prompts before decisions are locked.

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

### 10.0E: Design Consistency Sweep (S12) ← CURRENT

**Priority:** P0 — finish the conversion before feature work resumes
**Status:** 🔄 In progress — Batch 1 shipped (v0.48.0 in progress)
**Based on:** `docs/FRONTEND_AUDIT_S12.md` (committed 6a25f82)

| Batch | Scope | Status |
|-------|-------|--------|
| 1 | Straggler file conversions: DuplicateCollectionModal, BookLinkPopup, CriteriaBuilder — colors, ui/Modal, FormField, useStatusLabels (4th straggler DuplicateFinderModal found dead → deleted) | ✅ 2026-07-06 (A1–A5 = 0; pattern G = 0; zero `Abandoned` literals in CriteriaBuilder) |
| 2 | Remaining color drift: App.jsx, Toast, UnifiedNavBar, ReadingStatusCard, Settings, AddPage + H2/H3/I1 leftovers | ⬜ |
| 3 | Sweep close-out + verification vs audit baseline | ⬜ |

**Discovered in Batch 1:** `DuplicateFinderModal.jsx` was imported nowhere (dead since the DuplicatesPage rework) — verified repo-wide and **deleted** same session. Voice-pass candidates left as-is (out of scope): DuplicatesPage:183 "Your library is clean!" exclamation, :196 "books" in the duplicate-count string.

### 10.0E follow-on / parked from S12 sweep
- [ ] **Token migration session** (between S12 and S13): typography scale → tailwind.config fontSize, append colors at unpaired sites, delete tokens.css @layer components block. Enables S13 zero-target.
- [ ] **Raw element conversion backlog** (post-S13, per-file): BookDetail (30) → Library (15) → CollectionDetail (10) → SortDropdown (9) → remainder (≤8 each). Whitelist intentionally-bare buttons per file for lint.
- [ ] **AnalyzingModal → shared Modal** — decide dismiss semantics first (it's a progress surface).
- [ ] **S13 additions:** delete unused .glass-panel; lint ignore-list seeds (BottomNav emoji sizing, wrapper-label patterns per §8, CollectionsTab fixed grid, SeriesCard indigo comment).
- [ ] **Docs:** SKILL.md still lists BottomSheet/ThreeDotMenu under ui/ — remove ghosts.

---

### 10.1: Download & Share — ON HOLD

**Priority:** P0 — Highest Impact  
**Status:** ⏸ On hold (pending 10.0D completion)  
**Sessions:** 1-2

**The Problem:**  
Finding and opening a book currently requires: Open Liminal → Note the book → Open NAS file browser → Navigate to books folder → Search → Download → Open in Moon Reader. This takes 1-2 minutes every time.

**The Solution:**  
One-tap download with share sheet integration.

**Tasks:**
- [ ] 10.1.1 **Serve EPUB Files** — Backend endpoint to serve book files with proper MIME type
- [ ] 10.1.2 **Download Button** — Add "Read" button to ReadingStatusCard on BookDetail
- [ ] 10.1.3 **Edition Selection** — If multiple editions exist, show picker (default to EPUB)
- [ ] 10.1.4 **Web Share API** — Integrate share sheet for "Open in Moon Reader" on mobile
- [ ] 10.1.5 **Fallback Download** — Direct download for browsers without Web Share API
- [ ] 10.1.6 **Download Feedback** — Loading state, success/error toast

**Acceptance Criteria:**
- Tap "Read" on any library book → file downloads or share sheet opens
- Can select Moon Reader from share sheet and book opens
- Works on Android Chrome (primary use case)

**Definition of Done:** The "find book → read book" loop is closed. No more NAS searching.

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
- [ ] 10.4.3 **Network Config** — Ensure Synology/Liminal can reach Ollama endpoint
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
- Enable WebDAV on Synology
- Configure Moon Reader to sync to WebDAV
- Locate `books.sync` file

**Tasks:**
- [ ] 10.6.1 **WebDAV Setup Guide** — Document how to configure Synology + Moon Reader
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
| 10.1 | Download & Share | 1-2 | ⏸ On hold |
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
| 10.0.14 | ThreeDotMenu Extraction | Mar 2026 | Shared component for all detail pages |
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

```
## Infrastructure

**Deployment:** 
Docker container on a self-hosted NAS. FastAPI backend + React frontend served from the same container. SQLite database and book files on mounted volumes.

```

### Future with Moon Reader Sync

```
Moon+ Reader → WebDAV (Synology) → books.sync file
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
| `CURSOR_PROMPT_GUIDE.md` | How to write effective prompts |
| `FRONTEND_AUDIT_2026.md` | Claude Code audit — basis for 10.0C work groups |
| `liminal-ux-audit.md` | NNG usability audit — 141 findings, basis for 10.0D fix sessions |
| `UX_FIX_SESSIONS.md` | 10 prioritized fix sessions with finding IDs and scope |

---

*Roadmap is the single source of truth. Update this document as work progresses.*

*Last updated: May 4, 2026 (v0.47.1)*
