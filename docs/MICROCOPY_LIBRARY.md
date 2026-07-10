# Liminal Microcopy Library

A collection of approved phrases, labels, and language patterns for use throughout the app. Organized by feature area.

**`VOICE_AND_TONE_v2.md` is the law; this library is the approved instances.** When the two disagree, the voice doc wins and this file gets corrected.

**Genre scoping:** "stories" is legal only in Fiction and FanFiction contexts. Everywhere else — General, Uncategorized, Non-Fiction, milestones, stats — use "reads," "works," or "titles."

---

## Library Browsing — Ambient Phrases

These phrases appear in the library view, combining the current count with a gentle invitation. They rotate on each visit or can be category-specific.

Format: `[count] [phrase]`
Example: "1,687 doors. Wander freely."

### General (All Categories / No Filter)

- "[count] doors. Wander freely."
- "[count] reads waiting to be remembered."
- "[count] worlds. Browse without a destination."
- "[count] titles. Nothing here expires."
- "[count] beginnings. A fresh page awaits."
- "[count] covers. So many places to land."
- "[count] thresholds. Take your time."
- "[count] quiet companions. No rush."
- "[count] possibilities. The right one will find you."
- "[count] journeys. All of them patient."
- "[count] escapes. Whenever you're ready."
- "[count] invitations. Browse at your own pace."

### Fiction

- "[count] invented worlds. Which one calls to you?"
- "[count] lives unlived. Wander freely."
- "[count] doorways to elsewhere."
- "[count] stories. Every one a small escape."
- "[count] fictions. All of them true in their way."
- "[count] imagined places. Real enough when you're there."
- "[count] other lives to borrow."
- "[count] adventures, patient on the shelf."
- "[count] portals. No passport required."
- "[count] dreams waiting to be opened."

### Non-Fiction

- "[count] ways to understand the world."
- "[count] voices to learn from."
- "[count] questions answered. More to ask."
- "[count] paths to knowing."
- "[count] teachers on your shelf."
- "[count] windows onto what is."
- "[count] truths. Take what resonates."
- "[count] lenses. See something new."
- "[count] ideas. No quiz at the end."
- "[count] discoveries. At your own pace."

### FanFiction

- "[count] reimagined worlds. Old friends, new doors."
- "[count] love letters to stories that mattered."
- "[count] what-ifs. Explore freely."
- "[count] familiar faces in unfamiliar places."
- "[count] gifts from fellow dreamers."
- "[count] alternate doors. The characters remember you."
- "[count] labors of love. Handle with joy."
- "[count] worlds extended. The story never really ends."
- "[count] passionate detours. Wander without guilt."
- "[count] reunions. Welcome back."
- "[count] works of devotion. Someone wrote this just for you."
- "[count] threads to follow home."

### Uncategorized

- "[count] reads yet to be sorted. No hurry."
- "[count] mysteries. Even you don't know what's here."
- "[count] unmarked doors. Surprise yourself."
- "[count] unclaimed adventures."
- "[count] reads without a box. They don't mind."
- "[count] secrets on your shelf."
- "[count] wildcards. Browse and discover."
- "[count] works awaiting introduction."
- "[count] unnamed paths. Wander in."
- "[count] uncharted. The best kind."

---

## Estimated Reading Time

Displayed on book detail pages. Format uses a hierarchy:

- Heading (larger): "About [X] hours" or "About [X] min"
- Subheading (smaller): Soft descriptor

These descriptors are **system-defined labels** and may stay poetic even for mixed-genre items — they name the tier, not the item (see the carve-out in `VOICE_AND_TONE_v2.md`).

### Time Tiers

| Range | Subheading |
|-------|------------|
| Under 30 min | a quick visit |
| 30 min – 2 hours | a short journey |
| 2 – 4 hours | room to settle in |
| 4 – 8 hours | a deeper dive |
| 8 – 20 hours | a slow unfolding |
| 20 – 30 hours | an epic voyage |
| 30+ hours | a true saga |

### Example Display

> About 6 hours
> a deeper dive

> About 45 hours
> a true saga

---

## Reading Time — Filter Labels

For the library filter dropdown, use these bucket labels:

| Filter Label | Range |
|--------------|-------|
| A quick visit | Under 30 min |
| A short journey | 30 min – 2 hours |
| Room to settle in | 2 – 4 hours |
| A deeper dive | 4 – 8 hours |
| A slow unfolding | 8 – 20 hours |
| An epic voyage | 20 – 30 hours |
| A true saga | 30+ hours |

### Ambient Text When Filter Selected

| Filter | Ambient Phrase |
|--------|----------------|
| A quick visit | "[count] quick escapes. Just enough time." |
| A short journey | "[count] short journeys. No long commitment." |
| Room to settle in | "[count] reads to settle into." |
| A deeper dive | "[count] deeper dives. Worth the immersion." |
| A slow unfolding | "[count] slow unfoldings. Let them breathe." |
| An epic voyage | "[count] epics. Pack provisions." |
| A true saga | "[count] sagas. When you're ready to commit." |

---

## Ratings

Star-based rating system with soft language, especially at the lower end.

| Stars | Label |
|-------|-------|
| ★★★★★ | All-time Fav |
| ★★★★☆ | A great find |
| ★★★☆☆ | Solid read |
| ★★☆☆☆ | Didn't land |
| ★☆☆☆☆ | Not for me |
| No rating | No Rating |

Note: Lower ratings use "didn't land" and "not for me" rather than "disappointing" or "disliked." This acknowledges fit rather than assigning blame — gentler on both the work and the reader.

---

## Book Status — Progress Language

For displaying reading status and progress.

### Status Labels

| Status | Display |
|--------|---------|
| Not started | "Waiting on your shelf" |
| In progress | "In progress" — may pair with a progress display below |
| Finished | "Finished" |
| Did not finish | "DNF" |

**Implementation note:** the internal database value is `abandoned`; the display label comes from `useStatusLabels`, is user-configurable, and defaults to "DNF." "Abandoned" never renders in the UI. (This table replaces the earlier "Set aside" label — see `VOICE_AND_TONE_v2.md` → Status Language for the full rationale.)

The label is functional; the surrounding language stays warm:

- DNF filter active: "[count] reads you moved on from"
- Changing status to DNF: "No need to finish everything"

### Progress Display Options

**Soft version (qualitative):**

- "Just begun"
- "A third of the way through"
- "About halfway"
- "More than halfway"
- "Almost there"
- "Finished"

**Hybrid version (number + context):**

- "12% — just getting started"
- "34% — a third of the way through"
- "52% — past the halfway mark"
- "89% — almost there"

### Long-Unread Items

For items started but not touched in a while:

- **Default (any genre):** "Paused for a while. Ready when you are."
- **Fiction & FanFiction only:** "You began this one 9 months ago. Pick it up anytime."

Never: "Last read: 6 months ago."

---

## Soft Milestones

Gentle alternatives to competitive metrics. These could appear on a stats page or as ambient discoveries throughout the app.

Milestone names are **system-defined labels** — poetic is fine even when the counted items are mixed-genre (see the carve-out in `VOICE_AND_TONE_v2.md`).

| Traditional | Soft Alternative |
|-------------|------------------|
| Books read | Worlds Visited |
| Reading time | Quiet Hours |
| Reading streak | — (avoid entirely) |
| Books in library | Doors on your shelf |
| Unread books | Reads waiting |
| Books finished this year | Journeys completed |
| Series completed | Sagas finished |

### Stats Page Phrases

For a dedicated "celebrated" stats view:

- "You've visited [X] worlds this year."
- "[X] quiet hours spent reading."
- "[X] journeys completed."
- "[X] reads still waiting for you."

---

## Empty States

Formula: **what lives here + how it gets here** — then, optionally, one clause of warmth. Warmth is seasoning, not the meal.

| Context | Empty State Message |
|---------|---------------------|
| Empty library (first run) | "Your library is empty. Ready to add your first read?" |
| No search results | "Nothing found — try different words?" |
| Empty category | "Nothing here yet. Reads in this category will show up here." |
| No finished reads | "Nothing finished yet. Reads you complete will gather here. No rush." |
| DNF shelf | "Nothing here yet. Reads you set aside will show up here." |
| No notes on a read | "A blank page. Add thoughts whenever you're ready." |
| No TBR items | "Nothing saved for later yet. Reads you add to your TBR will wait here." |

---

## Confirmations & Buttons

Pattern: **the title asks the question; the buttons answer it.** Buttons are verbs — never Yes / No / OK. Full anatomy in `VOICE_AND_TONE_v2.md` → Buttons & Confirmations.

### Approved confirmation pairs

| Action | Title | Buttons |
|--------|-------|---------|
| Remove a read | "Remove from library?" | [Remove] [Keep] |
| Delete all notes for a read | "Delete all notes for this read?" | [Delete notes] [Keep notes] |
| Bulk remove | "Remove [X] reads from your library?" | [Remove [X]] [Keep] |

Body text only when there's a real consequence to state — e.g., "This also deletes your notes for it." **Verify the consequence against actual app behavior before shipping the line.**

### Toast strings (subtle confirmations)

Past tense, five words or fewer, no exclamation, no terminal period.

- "Added to your library"
- "Removed" — with an Undo action when available
- "Saved"
- "Status updated"
- "Library synced"
- "Downloaded"
- "Preparing…" — loading toast, clears on success/failure/cancel

---

## Error Strings

Anatomy: **what happened + what to do next + a way to do it.** Specific, plain, no codes, no "Oops." Full rules in `VOICE_AND_TONE_v2.md` → Error Messages.

| Situation | Message |
|-----------|---------|
| Save failed | "Couldn't save your changes. Try again?" |
| Can't reach backend | "Couldn't reach your library. Check your connection and try again." |
| Upload failed | "Couldn't upload [filename]. The file is still on your device — try again?" |
| Metadata lookup failed | "Couldn't find details for this one. Add them manually?" |
| Cover fetch failed | "Couldn't fetch a cover. Using a generated one for now." |
| Sync incomplete | "Sync didn't finish. Your data is safe — try again?" |
| Download failed | "Couldn't download the file. Try again?" |
| File moved/missing | "Couldn't find the file — it may have moved since the last scan." |

**Truth check:** reassurance clauses ("The file is still on your device," "Your data is safe") may only ship where the behavior actually guarantees it. Calm is built on honesty.

---

## Screen Reader Labels

Assistive text is always in the functional register — no poetry, no questions, no invitations. Full rules in `VOICE_AND_TONE_v2.md` → Screen Reader Text.

| Element | Pattern | Example |
|---------|---------|---------|
| Icon-only button | Verb + object | "Add to library" / "Open filters" / "Clear search" / "Close" |
| Bottom nav tab | Plain name only | "Library" / "Series" / "Stats" / "Settings" — never emoji descriptions |
| Cover (art or gradient) | "Cover: [Title] by [Author]" | "Cover: Circe by Madeline Miller" |
| Rating (display) | "Rated [N] of 5 — [label]" | "Rated 4 of 5 — A great find" |
| Rating (interactive) | "Rate [N] of 5" | "Rate 3 of 5" |
| Progress | Hybrid form | "34 percent — a third of the way through" |
| Ambient count phrase | Plain equivalent exposed; poetry marked decorative | "1,687 titles" |

---

## Microcopy Principles

When writing new copy for the app:

- **Invite, don't command** — "Browse freely," not "Start browsing"
- **Acknowledge, don't guilt** — "DNF," not "Abandoned"; "reads you moved on from," not "failed to finish"
- **Suggest, don't assume** — "Whenever you're ready," not "Read now"
- **Include all formats** — "reads," "works," "titles" by default; "stories" only in Fiction and FanFiction contexts
- **Avoid time-of-day** — not everyone reads in the evening or on weekends
- **Keep it brief** — microcopy should feel like a gentle whisper, not a speech
- **Buttons answer the question** — specific verbs, never Yes / No / OK
- **Every failure speaks** — no silent errors; name what happened and what to do next

---

*Last updated: July 8, 2026 — synced with the July 2026 revision of `VOICE_AND_TONE_v2.md`. Supersedes the December 2025 draft (status labels moved from "Set aside" to "DNF"; genre-neutral "stories" phrasing converted to universal terms; empty states rewritten to the formula; Confirmations, Errors, Toasts, and Screen Reader sections added).*
