# Liminal — Design Philosophy

> "Designing for calm isn't just aesthetic — it's psychological architecture."
> — Anjani Varma, *Calm by Design*

This document is the North Star. It defines how Liminal should look, feel, and behave — the foundational principles that every screen, interaction, and design decision should trace back to. It does not cover specific copy, microcopy, or language patterns; those live in `VOICE_AND_TONE_v2.md`.

Three layers, one intent: **make the reader feel at home.**

---

## Vision

Liminal is a sanctuary for readers. Whether the library holds thirty books or three thousand, across Fiction, Non-Fiction, and FanFiction, the experience should be the same: a calm, unhurried space where browsing and discovery feel like coming home.

The app is named for the transported space you enter when reading — that threshold between your world and the world of the story. The design should honor that liminality: quiet, warm, inviting.

The reader who opens Liminal at midnight after a hard day should feel the same gentle welcome as the reader who opens it on a lazy Sunday. No urgency, no judgment, no performance metrics. Just a door into something good.

---

## Layer 1: Visual Identity

### Aesthetic North Star: Swan Song (2021)

The UI design in the film *Swan Song* (designed by Territory Studio for Apple TV+) exemplifies the visual language Liminal is pursuing. Their work for Cameron Turner's personal interfaces demonstrates that technology can feel intimate rather than industrial.

Key qualities to internalize:

- **Muted, considered palette** — warm grays, soft teals, desaturated earth tones. Never vivid, never competing for attention. The colors should feel like they belong in a room with warm lighting, not a conference room with fluorescent overhead.
- **Gentle texture** — subtle grain or noise that feels human, not clinical. Surfaces should have just enough visual weight to feel real without becoming distracting. A screen should feel more like paper than glass.
- **Clear typography on neat tile layouts** — generous spacing, no visual clutter. Information has room to breathe. The eye is never overwhelmed, even on screens with dense metadata.
- **Context-aware and unobtrusive** — the UI recedes when not needed and surfaces when it is. Controls that aren't relevant right now should not demand attention. The interface should feel like it's anticipating, not interrupting.
- **Glassmorphism done subtly** — frosted panels with soft blur, not heavy shadows or neon borders. Depth is suggested, not shouted. When a modal opens, it should feel like turning a page, not opening a popup.

Territory Studio described Cameron's personal UI as *"considered, uncluttered, unobtrusive, with gentle texture and clear text."* That sentence is the design brief.

### Color Philosophy

The Warm A palette (implemented in `liminal-tokens-warm.css`) translates Swan Song's visual language into CSS variables. The thinking behind key choices:

**Backgrounds:** Warm charcoal with brown/amber undertones (`#1a1918` base). The base should feel like a dimly lit reading room, not a Discord server. Each elevation step adds warmth, not blue.

**Text:** Warm off-white (`#e8e4df`) rather than pure `#ffffff`. Pure white on warm backgrounds reads as the wrong temperature — it's harsh, clinical, like a flashlight in a candlelit room.

**Primary action:** Muted teal (`#5e8a8a`). Calm, considered, Swan Song. Desaturated enough not to compete with book covers, saturated enough to clearly signal interactivity. The primary color should whisper "you can tap this," not shout it.

**Chips and metadata:** Desaturated versions of categorical colors — dusty blue for fiction, dusty violet for fanfiction, dusty sage for nonfiction. On the book detail page, these are ambient metadata labels, not colorful buttons screaming for clicks.

**Status colors carry emotional weight.** DNF is warm neutral gray — the same visual weight as "unread." Red universally signals "error, danger, something went wrong," and setting a book aside is not an error. Two neutral states (unread, set aside) bookend two active states (reading, finished). The emotional hierarchy:

```
Unread    → neutral (waiting, no judgment)
Reading   → active (engaged)
Finished  → accomplished (gentle positive)
DNF       → neutral (paused, not failed)
```

**Dark mode is not optional.** Many readers read at night. The warm dark palette isn't a "dark theme" — it's the theme. Light mode, if it ever exists, would be the alternate.

### Gradient Covers

Books without cover art get deterministic gradient covers generated from title + author hash. The 10 color lanes (Clay, Sage Teal, Slate Blue, Amber, Lichen, Ochre, Dusty Plum, Storm, Sandstone, Muted Rose) are desaturated to 18-30% saturation so they harmonize with the warm palette rather than fighting it. Every gradient is unique to its book but belongs to the same visual family.

The gradients are the dominant visual element on every screen. They set the temperature of the entire app. Vivid stock colors would undermine every other design decision.

### Additional Visual Inspirations

- **Things 3 by Cultured Code** — invisible UI that never interferes with focus. The task list disappears; the work remains. Liminal's chrome should similarly recede behind the library.
- **Apple visionOS design language** — glass materials, soft depth, spatial calm. The principle of depth-through-translucency rather than depth-through-shadow applies well to modals and overlays.
- **Physical bookshops** — warm wood, warm light, books facing outward. The visual density of a well-curated shelf, not the sterile grid of a database viewer.

---

## Layer 2: Behavioral Principles

Based on Anjani Varma's "Calm by Design" framework, Liminal's interaction design follows five principles. These govern how the app behaves — what it does, what it doesn't do, and what it never does.

### 1. Self-Compassion Loops

Users arrive with invisible emotional baggage — guilt about unread books, abandoned reads, reading goals that slipped. The app should forgive rather than judge.

**What this means in practice:**
- No guilt-inducing metrics. Never "You haven't read in 12 days." Never a counter that makes a large unread collection feel like a failure.
- Progress shown gently, without pressure. "A third of the way through" rather than "34% complete." The framing is descriptive, not evaluative.
- No competitive streaks or shame-based motivation. Reading is not a game to win. The moment the app makes someone feel bad for not reading, it has failed.
- DNF is a neutral state, not a negative one. The color is warm gray, not red. The language is "moved on," not "abandoned." The door is still open.

**The test:** If a user hasn't opened the app in six months, their return should feel like coming home — not like opening an overdue library notice.

### 2. Gentle Gamification

Metrics and milestones exist to celebrate, never to pressure. The difference is subtle but critical: "12 worlds visited this year" feels like a warm observation; "12 books read (goal: 24)" feels like a performance review.

**What this means in practice:**
- Milestones are soft and optional. "Worlds Visited" instead of "Books Read." "Quiet Hours" instead of "Reading Streak."
- Numbers describe, they don't prescribe. The library count is "1,700 doors" — an invitation, not an obligation.
- No leaderboards, no comparisons, no rankings. This is a personal library, not a social platform.
- If analytics (Phase 10.2) surface reading patterns, they should be framed as self-knowledge ("You tend to read more in winter") rather than performance data ("Your reading dropped 40% in Q3").

### 3. Affirming Microcopy

Every piece of text is an opportunity to set emotional tone. Language should welcome rather than judge, invite rather than command.

**The four balances:**
- Warm but not saccharine
- Poetic but not precious
- Gentle but not vague
- Practical when needed, soft when possible

Detailed copy guidance, examples, and the tone spectrum live in `VOICE_AND_TONE_v2.md`. The principle here is the *why*: every word the app says either builds trust or erodes it. There are no neutral interactions.

### 4. Autonomy Support

The app is a co-pilot, not a commander. It suggests, never demands. Users feel in control at every moment.

**What this means in practice:**
- No forced workflows. If someone wants to add a book with just a title and nothing else, let them. Metadata is optional, not gated.
- No default sorting that implies judgment. "Recently added" is neutral. "Unfinished" as a default sort would be passive-aggressive.
- Customizable where it matters. Reading statuses can be renamed. Views can be switched. Filters persist. The app remembers your preferences and doesn't reset them.
- Features surface when relevant, not always. The "Analyze" button appears on fanfiction, not on every book. Context-awareness reduces noise.

**The test:** The user should never feel like the app is steering them. They wander; the app follows.

### 5. Forgiving Interactions

Mistakes are easy to undo. Destructive actions require confirmation. The app assumes good intent.

**What this means in practice:**
- Undo for destructive actions. Deleting a book, removing from a collection, clearing notes — these should be recoverable, at least briefly.
- Non-destructive defaults. "Archive" over "Delete" where possible. Soft delete before hard delete.
- Confirmation only for truly irreversible actions. "Remove from library?" yes. "Are you sure you want to change the sort order?" absolutely not. Over-confirming trains users to click through dialogs without reading them.
- Error recovery should be graceful. If a sync fails, the data is preserved. If an upload breaks, the user doesn't have to start over. The app catches you when you fall.

**The test:** A user who taps the wrong button should be able to recover in one tap, not three.

---

## Layer 3: Emotional Design

### Target Emotional States

When users open the app, they should feel:

- **Relief** — a sense of coming home. The visual warmth, the familiar layout, the ambient phrase that says "welcome back" without an exclamation mark.
- **Calm** — no urgency, no pressure. Nothing blinks, nothing counts down, nothing demands immediate attention.
- **Anticipation** — gentle excitement about what to read next. The library should feel like possibility, not obligation.
- **Welcome** — the app is glad they're here. Not performatively glad ("Welcome back, Marie!!!"), just quietly glad. A warm room with the light already on.

### Anti-Patterns (The App Should Never)

- Make users feel **guilty** about unread books. A large "unread" count is a sign of curiosity, not failure.
- Make users feel **pressured** to read more or faster. Speed and volume are not values.
- Make users feel **overwhelmed** by their collection. 1,700 books is a treasure, not a burden. The UI's job is to make it feel curated, not chaotic.
- Make users feel **judged** for their reading choices. Especially fanfiction — which is a labor of love created by passionate communities. The app should honor that, never diminish it.
- Make users feel **surveilled**. Analytics exist to improve the app, not to grade the user. Reading patterns are private self-knowledge.

### The Liminal Moment

The app's namesake is the liminal space — the threshold between worlds that a reader crosses when they open a book. The best version of Liminal would itself feel like a liminal space: a quiet room between the noise of daily life and the immersion of reading. You pass through it on the way to somewhere better, and it makes the journey feel intentional.

Every design decision should serve that transition. The warm colors lower your shoulders. The generous spacing slows your breathing. The soft language reminds you that this is your space, your pace, your library.

---

## Mobile-First

The primary access point is a mobile device (Android phone), used ~95% of the time. This isn't a constraint to work around — it's the design context.

- **Touch targets are generous.** 44px minimum. A thumb should never miss.
- **Information hierarchy is ruthless at small sizes.** What matters most is biggest and highest. Metadata is discoverable but not competing with the title and cover.
- **Ambient details earn their space.** Poetic phrases, soft milestones, reading time estimates — all present, none cramped. If an element doesn't have room to breathe on a 360px-wide screen, it doesn't belong.
- **Dark mode is for reading in bed.** OLED screens with warm charcoal backgrounds. The phone should feel like a nightstand lamp, not a flashlight.
- **Scrolling and browsing should feel smooth and unhurried.** No jank, no layout shifts, no skeleton screens that last too long. The transition from loading to loaded should be gentle, not jarring.

---

## Sources and Inspirations

- **Swan Song (2021)** — Territory Studio's UI design for Apple TV+. The visual north star.
- **Anjani Varma** — "Calm by Design: UX Principles for Mindful Engagement." The behavioral framework.
- **Things 3 by Cultured Code** — Invisible UI that never interferes with focus.
- **Apple visionOS design language** — Glass materials, soft depth, spatial calm.
- **Independent bookshops** — Warm wood, warm light, books facing outward. The feeling of browsing without being sold to.
- **AO3 (Archive of Our Own)** — Respectful treatment of fan-created works. The term "works" as a universal, genre-neutral label.

---

## Companion Documents

- `VOICE_AND_TONE_v2.md` — How Liminal speaks: copy, microcopy, status labels, punctuation, inclusive language
- `liminal-tokens-warm.css` — The Warm A palette as CSS custom properties
- `tailwind.config.js` — Token mappings to Tailwind utility classes

---

*Last updated: March 28, 2026*
