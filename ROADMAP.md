# Liminal Product Roadmap — Updates from March 20, 2026 Session

> **Instructions:** These are the specific sections to update in ROADMAP.md.
> Replace the corresponding sections in the current file.
> Updated version: v0.33.0

---

## CHANGE 1: Update header

**Find:**
```
> **Last Updated:** March 19, 2026 (v0.32.0)
```

**Replace with:**
```
> **Last Updated:** March 20, 2026 (v0.33.0)
```

---

## CHANGE 2: Update "What's Missing" list

**Find:**
```
**What's Missing:**
- ❌ No reusable component library (inconsistent UI across screens)
```

**Replace with:**
```
**What's Missing:**
- ❌ Design system components exist but have 0% adoption (62 files, 0 converted)
```

---

## CHANGE 3: Update Roadmap Overview box

**Find:**
```
│  CURRENT  │  Phase 10: Liminal Connects                                  │
│           │  9 sub-phases, ~17-23 sessions                               │
```

**Replace with:**
```
│  CURRENT  │  Phase 10: Liminal Connects                                  │
│           │  10 sub-phases, ~25-31 sessions                              │
```

---

## CHANGE 4: Update 10.0 status line

**Find:**
```
**Status:** 🔄 Sessions A+B mostly complete — BookCard + BottomSheet remain
```

**Replace with:**
```
**Status:** 🔄 Sessions A+B complete, 10.0C (full conversion) planned — BookCard + BottomSheet + gradient palette remain
```

---

## CHANGE 5: Update 10.0.10 BookCard spec

**Find the entire 10.0.10 entry and replace:**

```
- [ ] 10.0.10 **BookCard Redesign** — `components/BookCard.jsx`
  - **Visual refresh**: Review proportions, text treatment, cover display
  - **Cross-screen consistency**: Same component used in Library grid, Collection detail, Series detail, Search results, Author detail
  - **Variants**: Standard, compact, list view
  - **Optional elements**: Status badge, progress indicator, quick actions
```

**Replace with:**

```
- [ ] 10.0.10 **BookCard Redesign** — `components/BookCard.jsx` (mockup v4 approved)
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
```

---

## CHANGE 6: Update "Out of Scope" list

**Find:**

```
**Out of Scope (Build When Needed):**
- ChipInput (complex, defer to when forms need it)
- StarRating (exists, refactor later)
- FileDropZone (Add flow, not Phase 10 priority)
- CoverCard unification (after BookCard is solid)
```

**Replace with:**

```
**Out of Scope (Build When Needed):**
- CoverCard unification (after BookCard is solid)

**Moved INTO 10.0C scope (extracted during conversion pass):**
- ChipInput → standardize during Group 4 (UnifiedEditModal) + Group 7 (Add flows)
- StarRating → extract during Group 1b (BookDetail modals)
- FileDropZone → extract during Group 7 (Add flows)
```

---

## CHANGE 7: Insert new 10.0C section (after 10.0B, before 10.1)

**Insert this entire block after the "Definition of Done" line for 10.0 and before "### 10.1: Download & Share":**

```
### 10.0C: Full Component Conversion

**Priority:** P0 — Without this, the design system is fiction
**Status:** ⬜ Not Started
**Sessions:** 8 (C1-C3 before 10.1, C4-C8 interleaved with features)
**Based on:** `FRONTEND_AUDIT_2026.md` (Claude Code audit, March 2026)

**The Problem:**
The audit revealed 62 JSX files with 0% design system adoption. 9 UI components were built in 10.0B — 6 have never been imported. 26 modals are bespoke. ~262 raw buttons. 81 raw form fields. 1,445 hardcoded color instances. The design system exists on paper only.

**The Solution:**
Systematic conversion of every file. No "convert as you touch" — that's how we got here.

**Work Groups:**

| Group | Files | Focus | Session |
|-------|-------|-------|---------|
| 1a | BookDetail (colors+buttons) | 211 colors, 45 buttons, typography | C1 |
| 1b | BookDetail (modals+forms) | 5 inline modals, 9 form fields, StarRating extract | C2 |
| 2 | Library + HomeTab + TBRList | Daily drivers, missing NavBar, TBR rename | C3 |
| 3+4 | Drawers + UnifiedEditModal + ChangeCoverModal | 204 colors, ChipInput standardize | C4 |
| 5 | Collections family (6 files) | 155 colors, 3 inline modals, SmartPaste Escape fix | C5 |
| 6 | Series + Authors (7 files) | Colors, missing page titles, returnUrl fix | C6 |
| 7+8 | Add flows + Upload flows (12 files) | Forms→FormField, FileDropZone extract | C7 |
| 9+10 | Filter modals + misc (15 files) | Batch modal migration, Escape fixes, BookCard impl | C8 |

**Interleaved Timeline:**
```
C1-C3: Before 10.1 (covers 90%+ of daily screen usage)
C4-C8: Alongside feature phases
```

**Critical Fixes Addressed (free during conversion):**
- [ ] Book Detail layout issues (C1-C2)
- [ ] Notes section layout issues (C1-C2)
- [ ] Author Detail returnUrl (C6)
- [ ] Series Landing missing page title (C6)
- [ ] Authors Landing missing page title (C6)
- [ ] TBRList → WishlistTab rename (C3)
- [ ] HomeTab console-only error → user-visible (C3)
- [ ] 4 modals missing Escape key → fixed by Modal adoption (C5, C8)
- [ ] 5 pages missing UnifiedNavBar (C3, C6, C8)

**Definition of Done:**
- All 62 files use warm token colors
- All 26 modals use shared `<Modal>`
- All ~262 button instances use `<Button>`
- All 81 form elements use `<FormField>`
- All pages have `<UnifiedNavBar>`
- ChipInput, StarRating, FileDropZone extracted to components/ui/
- No visual regressions on mobile
```

---

## CHANGE 8: Insert Gradient Palette task (before 10.0C or as 10.0 warmup)

**Add to end of 10.0B section, before 10.0C:**

```
**Pre-Conversion Warmup: Gradient Palette Shift**

- [ ] 10.0.15 **Warm Gradient Lanes** — Update 10 lane seed colors in `covers.py`
  - Shift from vivid Tailwind-stock colors to warm desaturated palette
  - Clay, Sage Teal, Slate Blue, Amber, Lichen, Ochre, Dusty Plum, Storm, Sandstone, Muted Rose
  - One-time migration script to regenerate all 1,700+ book covers
  - GradientCover.jsx unchanged (FROZEN) — it renders whatever the backend provides
  - Reversible: swap 10 hex values back if needed
  - Rationale: Gradient covers are the dominant visual element. Vivid lanes designed for navy bg clash with warm charcoal palette.
```

---

## CHANGE 9: Update Progress Summary table

**Find:**

```
| Sub-Phase | Name | Sessions | Status |
|-----------|------|----------|--------|
| 10.0 | Component Foundation | 2 | 🔄 BookCard + BottomSheet remain |
| 10.1 | Download & Share | 1-2 | ⬜ |
```

**Replace with:**

```
| Sub-Phase | Name | Sessions | Status |
|-----------|------|----------|--------|
| 10.0 | Component Foundation | 2 | 🔄 BookCard + BottomSheet + gradient palette remain |
| 10.0C | Full Conversion | 8 | ⬜ (C1-C3 before 10.1, C4-C8 interleaved) |
| 10.1 | Download & Share | 1-2 | ⬜ |
```

**And update the Total:**

```
| | **Total** | **25-31** | |
```

---

## CHANGE 10: Update Critical Fixes to mark items being addressed in 10.0C

**Find each of these and add "(→ 10.0C)" annotation:**

```
- [ ] **Author Detail returnUrl** — Pass returnUrl when linking to books (back shows "Library" instead of "Authors")
```
→ add `(→ addressed in 10.0C Group 6)`

```
- [ ] **Book Detail Layout** — Tab content layout issues (reported but specifics TBD)
```
→ add `(→ addressed in 10.0C Group 1)`

```
- [ ] **Notes Section Layout** — Formatting/display issues in notes area
```
→ add `(→ addressed in 10.0C Group 1)`

```
- [ ] **Series Landing Page** — Missing page title, layout issues
```
→ add `(→ addressed in 10.0C Group 6)`

```
- [ ] **Authors Landing Page** — Missing page title, layout issues
```
→ add `(→ addressed in 10.0C Group 6)`

```
- [ ] **TBRList → Wishlist Rename** — File still named TBRList.jsx
```
→ add `(→ addressed in 10.0C Group 2)`
