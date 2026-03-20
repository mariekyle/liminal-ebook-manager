## [0.33.0] - 2026-03-20

### Added

#### Phase 10.0.10: BookCard Redesign (mockup v4 approved)
Design-only — implementation pending.

**Grid view badges:**
- Opaque dark bg (`rgba(26,25,24,0.88)`) + white icons for all badge types — ~7:1 contrast on any gradient
- Finished: checkmark icon. DNF: pause icon (⏸). Wishlist: bookmark icon. Unread: no badge.
- In Progress: 4px progress bar with opaque dark track (50% default until real percentage data exists)
- Checklist completed: green bg badge + card dimmed to 45%

**List view:**
- Finished: checkmark overlay on cover thumbnail (50% scrim), no text status
- DNF: pause overlay on cover thumbnail (50% scrim), no text status
- In Progress: teal dot + label + progress bar (only status with text indicator)
- Unread: clean row with no status indicator
- Est. read time shown for all items

**Killed from earlier mockup iterations:**
- Left-edge color stripe (couldn't be intuited, added visual noise)
- Wishlist dashed/subtle border (bookmark badge is sufficient)
- Backdrop-blur on badges (inconsistent across gradients, poor performance)
- Text "DNF" badge (breaks when user renames status in settings)
- Status dot/label for finished and DNF in list view (cover overlays are clearer)

**Component API simplified:**
- Three boolean props (`showTitleBelow`, `showAuthorBelow`, `showSeriesBelow`) → single `variant` prop
- Variants: standard (3-col grid), compact (4-col grid), list (horizontal row)

#### Phase 10.0C: Full Component Conversion (planned)
8-session systematic conversion of all 62 JSX files to shared design system components.

**Scope determined by Claude Code frontend audit (`FRONTEND_AUDIT_2026.md`):**
- 26 bespoke modals → shared `<Modal>`
- ~262 raw `<button>` instances → `<Button>` component
- 81 raw form elements → `<FormField>` component
- ~1,445 hardcoded color instances → warm token variables
- 5 pages missing `<UnifiedNavBar>` → add nav
- 4 modals missing Escape handler → fixed by Modal adoption
- ChipInput, StarRating, FileDropZone → extract to components/ui/

**Timeline:** C1-C3 before 10.1 (BookDetail + Library + HomeTab), C4-C8 interleaved with features.

#### Gradient Palette Warm Shift (approved)
10 gradient lane seed colors updated from vivid Tailwind-stock to warm desaturated palette matching Warm A tokens. Implementation pending — backend-only change + database migration. GradientCover.jsx stays frozen.

### Changed
- Roadmap updated with 10.0C conversion plan, BookCard v4 spec, gradient palette task
- Estimated Phase 10 total: 17-23 → 25-31 sessions (10.0C adds 8 sessions)
- ChipInput, StarRating, FileDropZone moved from "Out of Scope" back into 10.0C

### Documentation
- `FRONTEND_AUDIT_2026.md` — Complete frontend audit via Claude Code (62 files, all modals/buttons/forms/colors inventoried)
- `bookcard-v4-final.html` — Approved BookCard mockup with all NNG recommendations
- `gradient-cover-exploration.html` — Vivid vs warm gradient lane comparison

---
