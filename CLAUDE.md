# Liminal — Rulebook

Self-hosted reading-management PWA for a ~1,700-title library including fanfiction. FastAPI +
SQLite backend, React 18 + Tailwind 3.4 frontend, one Docker image, run on the Synology NAS
through Container Manager. ~95% of use is on an Android phone with a thumb.

This file is the contract. It wins over `.cursorrules` and the Liminal skill wherever they
disagree; both are orientation, this is law. Never cite its rules (frozen list, golden rules,
buckets) from memory: re-read it first. Machine-specific detail (hostnames, IPs, host paths,
mount points) never goes here; this file is public. It goes in `CLAUDE.local.md`, which is
gitignored, and nothing from that file is ever quoted into a tracked file.

## Design authority — read before touching any UI

**Before creating or modifying any component, style, animation, or user-facing string, read
`docs/DESIGN_SYSTEM.md`, `docs/DESIGN_PHILOSOPHY.md`, `docs/VOICE_AND_TONE.md` and
`docs/MICROCOPY_LIBRARY.md`.** They override any "sensible default" for a library app.
In particular:

- **Tokens live in `frontend/tailwind.config.js`** and are the sole colour and type authority
  (Warm A palette, dark theme always). No Tailwind default palette, no arbitrary hex, no
  `library-*` aliases, no indigo. Every text element maps to one of the eight type tokens,
  always paired with a config colour utility (`text-h4 text-text-primary`).
- Shared components come from `frontend/src/components/ui/`. Never an inline button, modal or
  form field. Verify the inventory against the repo; do not cite it from memory.
- 44px minimum touch targets. Loading, error and empty states for every data-driven view.
  Anything that relies on desktop-only DOM (a `scrollIntoView` target hidden on mobile) is a
  bug by default.
- UI copy says "reads", "works" or "titles", never "books". Status labels only through
  `useStatusLabels`; "Abandoned" is the DB value and never renders (default display "DNF").
  Session statuses translate through `SESSION_STATUS_TO_BACKEND`; handle snake_case variants.
  Buttons name their action, never Yes/No/OK; the safe option is the safe outcome. No
  exclamation marks. Errors say what happened and what to do. Approved strings are in
  `docs/MICROCOPY_LIBRARY.md`.
- Destructive actions confirm inline; never `window.confirm()` or `alert()`.
- `scripts/design-lint.mjs` checks the mechanical parts of this on every commit (warn-and-allow;
  the committed `docs/DESIGN_LINT_REPORT.md` is the enforcement surface). After any session
  that touches `frontend/src`, the category summary goes in the session report.
- Where the docs are silent, pick the quieter option and record it in `docs/DECISIONS.md`
  under `## Pending ratification`. Do not invent a rule. Items in `docs/OPEN_QUESTIONS.md`
  are not yours to resolve.

## Golden rules

1. **Scope discipline.** Touch only the files the step names. If a fix seems to need an
   out-of-scope file, stop and report; don't improvise.
2. **Surgical changes.** No drive-by refactors, no "while I'm here" improvements, no
   reformatting untouched code. After a change, list what changed and what was verified
   unchanged.
3. **No silent failures.** Every error reaches the user. Rejection-only paths get explicit
   states. Validation errors are inline, never toast-only for blocking errors.
4. **Dead code is deleted, not maintained**, after a repo-wide grep proves it dead, with the
   grep noted in the changelog entry.
5. **Stop conditions are real.** When a step says "stop and report", the report is the
   deliverable, not a workaround.
6. **Frozen files require a flag and ratification.** Exactly six, listed below.
7. **Mobile first.** "Does this work with a thumb?"
8. **Decisions before prompts.** A new phase starts with a decision sprint (mockups reviewed
   on the phone, decisions logged), then prompt batches of ~3 sessions against current code,
   with a drift check between batches. If a step starts before its decisions are logged,
   flag it.
9. **Cross-module imports are grepped on both sides.** A parse check can't see whether an
   imported symbol is exported. Any change that adds an import greps the source module for
   the matching `export` and prints the match.

## Frozen files

Frozen means any edit needs a justification against the stated risk, an explicit flag at edit
time, and Marie's ratification, logged in `docs/DECISIONS.md` and `CHANGELOG.md`. A silent
edit is a violation even when correct.

- `frontend/src/components/GradientCover.jsx` — output changes repaint every rendered cover
- `frontend/src/components/MosaicCover.jsx` — same
- `frontend/src/components/upload/BookCard.jsx` — its gradient hex constants are
  cover-generation data; the UI chrome around them is the negotiable zone
- `backend/services/covers.py` — battle-tested extraction pipeline
- `backend/services/metadata.py` — battle-tested extraction pipeline
- `backend/database.py` — the schema; every change is an idempotent migration in
  `run_titles_migrations`, and the database is backed up first and the report says so

`backend/routers/sync.py` is **not** frozen.

## Documentation — same commit as the code, every time

The project record is `docs/`, plus `CHANGELOG.md` and `ROADMAP.md` at the root. A pre-commit
hook (`.githooks/pre-commit`, D-001) rejects any commit that touches app code without touching
the record; `docs/DESIGN_LINT_REPORT.md` alone doesn't count because the hook stages it itself.
Enable the hook once per clone: `git config core.hooksPath .githooks`.

- `docs/PIPELINE.md` — phase table, the current queue, and step status. Queue order is law
  (Decisions 2026-09-03, SEQ1–SEQ10). Update it when a queue item moves.
- `docs/DECISIONS.md` — append-top, one block per decision. Heading format:
  `## D-NNN · YYYY-MM-DD · <the decision itself, not the topic>`. Body: why, what it rules
  out. Anything you decided because the docs were silent goes in `## Pending ratification`.
  Marie ratifies by saying so in a session; then move it below the line. Entries before
  D-001 keep their dated-sprint format and are cited by date.
- `docs/OPEN_QUESTIONS.md` — deferred items, prioritised. Not append-only: resolved items
  are deleted. `# INBOX` at the top is Marie's; write nothing else there.
- `CHANGELOG.md` — Keep a Changelog, append-top, one file, never dated copies. Unshipped work
  goes under `## [Unreleased]`. Never flatten or summarise older entries (a one-line erratum
  for a factual correction is allowed). Detail matches the work: full
  Added/Changed/Fixed/Removed + Technical (files created, modified, deleted) for features and
  schema changes, with root causes for fixes; summary for small fixes; nothing for docs-only
  commits.
- `ROADMAP.md` — the plan, one file, edited in place. Public on GitHub: no infrastructure
  detail, ever. Nothing is ever named "FINAL".
- `docs/ARCHITECTURE.md`, `docs/CODE_PATTERNS.md` — current-state reference. Update when the
  state they describe changes.

Session start: triage everything under `# INBOX` in `docs/OPEN_QUESTIONS.md` into the backlog
with a priority, then clear the Inbox. Then report the top of the queue in `docs/PIPELINE.md`
and anything under `## Pending ratification`, and wait for a step.

Session end (a session that changed code), in this order: the verification rule below; the
`code-reviewer` agent's three checks (frozen-file detection, scope drift, pattern conformance);
changelog entry, decisions, Open Questions triage, Pipeline update; the deploy manifest; then
produce the commit block and the report. Do not commit or push.

## Build, version, deploy

- **Git.** Claude Code runs `git status`, `git diff`, `git log` and the like; every git write
  is a copy-paste block for Marie unless she says to run it. The block format is fixed, because
  she may paste it as-is: one fenced block, one line,
  `git add . && git commit -m "subject" -m "- bullet" -m "- bullet" && git push`. Always
  `git add .`, never a file list (`.gitignore` makes add-all leak-proof; a list can strand a
  file). Multi-line messages only through repeated `-m`; never `\n` or a real line break. No
  double quotes inside message text. An amend is its own block:
  `git commit --amend -m "..." && git push --force-with-lease`. Never "open the default
  editor". Unsure of the format: omit the block.
- Commit directly to `main`, one step per commit, conventional prefix (`feat:`, `fix:`,
  `docs:`, `chore:`).
- **Version of record** is the `version=` string in `backend/main.py` (v0.87.0 as of
  2026-07-26); bump it in the commit that ships the change and head the changelog entry with it.
- **Verification rule, before the session-end sequence:** any change under `frontend/src/`
  runs `npm run build` in `frontend/` and must pass; any change under `backend/` runs
  `python -m compileall -q backend` and must pass; test fixtures are built from the real
  `init_db`, never a hand-written schema (Decisions 2026-07-19). Local Node is 26; the image
  builds with `node:20`. When they disagree, the image is truth.
- **Deploy is manual, and git plays no part in it.** Production is the Synology NAS,
  Container Manager, at the address in `CLAUDE.local.md`. The dev repo (this folder) and the
  NAS docker volume are separate folders, joined by an SMB mount. No SSH, no hot reload.
  A backend change forces a full image rebuild; say so.
  1. Session end: the deploy manifest (below) is the copy instruction.
  2. When Marie says **"deploy"**, and only then, Claude Code runs `scripts/lcheck.sh --apply`.
     It rsyncs the manifest's scope from the repo to `$LIMINAL_VOLUME` (mirroring
     `frontend/src/` and `backend/` with delete, copying the rest one way), then re-checks by
     checksum and exits non-zero if anything still differs. `✓` = safe to rebuild. `✗` = do not
     rebuild; report the named files. Without `--apply` it is a dry run; run it freely.
  3. Marie rebuilds in Container Manager and tests on the phone.
- **Deploy manifest, every session that changes code (Decisions 2026-07-19, amended 2026-07-20).**
  It is a copy instruction, not an inventory: every modified, created or deleted file,
  repo-relative, in exactly three buckets:
  - **VOLUME-COPY** — `frontend/src/` and `backend/`. This is `lcheck`'s mirrored scope, the
    only part it deletes in; say so.
  - **ALSO-COPIED-BY-CONVENTION** — `CHANGELOG.md` and `ROADMAP.md`, always, plus
    `Dockerfile` and the `frontend/` config files (`package.json`, `package-lock.json`,
    `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`) when changed.
    `lcheck` copies these one way and never deletes them.
  - **REPO-ONLY** — `docs/` (including `DESIGN_LINT_REPORT.md`), `scripts/`, `.claude/`,
    `.githooks/`, `CLAUDE.md`, `.cursorrules`, `.gitignore`, `.env.example`. Never copied.
  - **Volume deletions** are a separate named section; state "none" explicitly.
  A file missing from the manifest is a stale file in production.
- **Phase 2 (2026-09-23) is "move to the Beelink", not "change the deploy script":** the
  candidate target is the todo repo's path (GitHub Actions publish → ghcr.io → manual
  "Promote to stable" → the Beelink runs `:stable`), which would also move the data volume off
  the Synology. Until Marie says so, this section describes the Synology path and nothing
  else. If it changes, rewrite this section in the same commit.
- **Data.** One SQLite file, `library.db`, plus `covers/`, under the NAS data volume (host
  path in `CLAUDE.local.md`). Never `liminal.db`. Back up `library.db` before any schema
  change, any migration, and any full library sync: the trigger is bulk writes, not schema
  alone. Say so in the report.

## Stack

- Backend: FastAPI, aiosqlite, Pydantic; `backend/main.py` serves the API under `/api/` and the
  built frontend from `/app/static`. Health: `GET /api/health`.
- Frontend: React 18 + react-router 6, Tailwind 3.4, Vite 5, plain JSX (no TypeScript), no
  component library. @dnd-kit, @tanstack/react-virtual, react-markdown.
- Database table is `titles` (not `books`); the router is `routers/titles.py` and the endpoints
  stay at `/api/books/` for compatibility. Title sorts use `COLLATE NOCASE`. Pagination + filter
  combos need the version-ref race guard. `rating` is `Optional[float]`.
- **The `/books` mount is writable and the app writes to it:** upload creates files, Replace
  file moves them, delete moves them to `_trash/`. It never edits the contents of a book file.
  Folder = one title; file metadata wins over folder name; category comes from the parent
  folder (Fiction / Non-Fiction / FanFiction).
- One image (`Dockerfile`, multi-stage: `node:20` builds the frontend, `python:3.11` serves
  it). Local compose needs `BOOKS_HOST_PATH` in `.env` (copy `.env.example`).

## Environment notes

- All development is on the M1 MacBook at `~/dev/liminal/app`; there is no other working copy.
  Node 26 via Homebrew, so `npm run build` and the design lint run natively.
- The Synology NAS builds and runs the image in Container Manager. Its address, the SMB mount,
  `LIMINAL_VOLUME`, the book library path and the DB location are in `CLAUDE.local.md`.
- The Beelink (TrueNAS SCALE, x86-64) runs todo and other services. Its `liminal_*` containers
  are an unrelated Postgres/Redis prototype from 2025, not this repo; ignore them.
- `~/dev/liminal/files/` (mockups, captures, screenshots) is outside the repo on purpose.
