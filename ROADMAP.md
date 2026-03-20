# Liminal Product Roadmap

> **Last Updated:** March 19, 2026 (v0.32.0)  
> **Current Focus:** Phase 10 — Liminal Connects  
> **Tracking Philosophy:** This roadmap is the single source of truth. No separate spec documents.

---

## Vision

Liminal is a **connected reading hub** that eliminates friction across your entire reading ecosystem. It integrates with external metadata sources, your reading app, your notes system, and local AI — so you spend less time managing and more time in the liminal space of reading.

**The old vision** was a polished, standalone book management UI.  
**The new vision** is an integration layer that connects everything together.

---

## Current State (v0.31.0)

The app is fully functional for daily use with 1,700+ books. Core systems are stable:

| System | Status |
|--------|--------|
| Library browsing & search | ✅ Stable |
| Book upload & metadata extraction | ✅ Stable |
| Reading status & session tracking | ✅ Stable |
| Notes with wiki-style linking | ✅ Stable |
| Wishlist management | ✅ Stable |
| Collections system | ✅ Smart Collections complete |
| Enhanced fanfiction metadata | ✅ Stable |
| Add book flow | ✅ Redesigned |
| Editions system | ✅ Add formats, merge duplicates |
| Automated backups | ✅ Grandfather-father-son rotation |
| Navigation | ✅ UnifiedNavBar, bottom nav redesign |

**What's Missing:**
- ❌ No reusable component library (inconsistent UI across screens)
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
│  CURRENT  │  Phase 10: Liminal Connects                                  │
│           │  9 sub-phases, ~17-23 sessions                               │
│           │  Ship each sub-phase independently                           │
├───────────┼──────────────────────────────────────────────────────────────┤
│  PARALLEL │  Critical Fixes                                              │
│           │  Cherry-picked bugs from Phase 9.5                           │
│           │  Address opportunistically between features                  │
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

**Estimated Timeline:** 17-23 working sessions (~5-7 weeks)

---

### 10.0: Component Foundation

**Priority:** P0 — Prerequisite for Consistent Development  
**Status:** 🔄 Sessions A+B mostly complete — BookCard + BottomSheet remain  
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

**⚠️ Caveat:** These documents were created in January 2026. Several features have shipped since then (UnifiedEditModal, ChangeCoverModal, UnifiedNavBar, Toast, ThreeDotMenu, CollapsibleSection, ReadingStatusCard, Smart Collections). Session 10.0A should begin with a quick audit refresh to capture new patterns.

---

**Session 10.0A: Tokens + Audit Refresh**

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

**Session 10.0B: Core Components**

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
- [ ] 10.0.10 **BookCard Redesign** — `components/BookCard.jsx`
  - **Visual refresh**: Review proportions, text treatment, cover display
  - **Cross-screen consistency**: Same component used in Library grid, Collection detail, Series detail, Search results, Author detail
  - **Variants**: Standard, compact, list view
  - **Optional elements**: Status badge, progress indicator, quick actions

**Components to Extract (Already Built Well):**
- [x] 10.0.11 Move `UnifiedNavBar` to `components/ui/`
- [x] 10.0.12 Move `Toast` to `components/ui/` (extracted from BookDetail inline)
- [x] 10.0.13 Move `CollapsibleSection` to `components/ui/`
- [ ] 10.0.14 Extract `BottomSheet` from ThreeDotMenu to `components/ui/`

**Out of Scope (Build When Needed):**
- ChipInput (complex, defer to when forms need it)
- StarRating (exists, refactor later)
- FileDropZone (Add flow, not Phase 10 priority)
- CoverCard unification (after BookCard is solid)

---

**Acceptance Criteria:**
- Tokens are defined in Tailwind config
- Core components exist in `components/ui/`
- BookCard looks consistent across all screens
- New Phase 10 features can import and use these components

**Definition of Done:** Foundation exists. All Phase 10.1+ code uses shared components.

---

### 10.1: Download & Share

**Priority:** P0 — Highest Impact  
**Status:** ⬜ Not Started  
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
**Status:** ⬜ Not Started  
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
**Status:** ⬜ Not Started  
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
**Status:** ⬜ Not Started  
**Sessions:** 1-2

**The Problem:**  
AI features (analysis, photo lookup) would require expensive cloud API calls. Infrastructure for local inference doesn't exist.

**The Solution:**  
Set up Ollama on Beelink as a local AI server.

**Hardware:**
- Beelink SER8: Ryzen 7 8845HS, 32GB RAM, 1TB SSD
- Running TrueNAS Scale
- Connected to Synology via local network

**Tasks:**
- [ ] 10.4.1 **Install Ollama** — Docker container on TrueNAS or native install
- [ ] 10.4.2 **Pull Models** — Llama 3 8B (text), LLaVA 13B (vision)
- [ ] 10.4.3 **Network Config** — Ensure Synology/Liminal can reach Ollama endpoint
- [ ] 10.4.4 **Health Check Endpoint** — Liminal can verify Ollama is running
- [ ] 10.4.5 **Test Inference** — Verify text and vision models respond correctly
- [ ] 10.4.6 **Document Setup** — Add to ARCHITECTURE.md for future reference

**Acceptance Criteria:**
- `curl http://beelink:11434/api/generate` returns model response
- Liminal backend can call Ollama successfully
- Vision model can describe an image

**Definition of Done:** Local AI infrastructure is operational and ready for features.

---

### 10.5: Fanfic Analysis Pipeline

**Priority:** P4 — Leverages 10.4  
**Status:** ⬜ Not Started  
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
**Status:** ⬜ Not Started  
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
**Status:** ⬜ Not Started  
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
**Status:** ⬜ Not Started  
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
| 10.0 | Component Foundation | 2 | 🔄 BookCard + BottomSheet remain |
| 10.1 | Download & Share | 1-2 | ⬜ |
| 10.2 | Usage Analytics | 1 | ⬜ |
| 10.3 | External Book Search | 2-3 | ⬜ |
| 10.4 | Local AI Infrastructure | 1-2 | ⬜ |
| 10.5 | Fanfic Analysis Pipeline | 2-3 | ⬜ |
| 10.6 | Moon Reader Integration | 3-4 | ⬜ |
| 10.7 | Notes ↔ Obsidian Sync | 2-3 | ⬜ |
| 10.8 | Photo Lookup | 1-2 | ⬜ |
| | **Total** | **17-23** | |

---

## Critical Fixes (Parallel Track)

**Goal:** Address genuinely broken functionality from Phase 9.5, without getting lost in polish work.

**Philosophy:** Fix these opportunistically — as warmup tasks, or when they actively annoy you. Don't block feature work.

### Navigation & Scroll Issues ⚠️

- [ ] **Scroll Position Restoration** — Back navigation should return to previous scroll position
- [ ] **Author Detail returnUrl** — Pass returnUrl when linking to books (back shows "Library" instead of "Authors")
- [ ] **Search Filter Redirect** — Filter link in search modal goes to Home instead of filtered Browse

### Layout Issues ⚠️

- [ ] **Book Detail Layout** — Tab content layout issues (reported but specifics TBD)
- [ ] **Notes Section Layout** — Formatting/display issues in notes area
- [ ] **Series Landing Page** — Missing page title, layout issues
- [ ] **Authors Landing Page** — Missing page title, layout issues

### Functional Bugs ⚠️

- [ ] **Checklist Pagination Loop** — Infinite spinner flicker at bottom of large checklists
- [ ] **Cover Cache Issues** — Changes don't reflect immediately after editing many covers

### Low Priority Cleanup

- [ ] **TBRList → Wishlist Rename** — File still named TBRList.jsx

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

---

## Infrastructure

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Tailscale Network                        │
│                                                              │
│   ┌─────────────┐         ┌─────────────────────┐           │
│   │  Your Phone │◄───────►│      Beelink        │           │
│   │             │         │   (TrueNAS Scale)   │           │
│   └─────────────┘         │                     │           │
│                           │  • Plex             │           │
│                           │  • Ollama (10.4)    │           │
│                           │  • Other apps       │           │
│                           └──────────┬──────────┘           │
│                                      │                      │
│   ┌─────────────┐         ┌──────────▼──────────┐           │
│   │   Synology  │◄───────►│    Synology NAS     │           │
│   │  (Liminal)  │         │    (Storage)        │           │
│   │             │         │                     │           │
│   │  • Backend  │         │  • Book files       │           │
│   │  • Frontend │         │  • SQLite DB        │           │
│   │  • Docker   │         │  • Obsidian vault   │           │
│   └─────────────┘         └─────────────────────┘           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
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
4. **Local-first AI** — Use Ollama on Beelink to avoid API costs and keep data private
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

---

*Roadmap is the single source of truth. Update this document as work progresses.*

*Last updated: March 19, 2026*
