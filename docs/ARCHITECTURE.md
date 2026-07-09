# Liminal Architecture

> Describes the system as of **v0.50.0**. History lives in git and `CHANGELOG.md` — this doc is current-state only. Public repo: paths below are container-relative; deployment is described generically.

## 1. System overview

Liminal is a self-hosted library manager for a personal collection of ~1,700+ reads — published books and fanfiction — with reading tracking, notes, collections, and wishlist management. Mobile-first (~95% of use is a phone browser).

One Docker container runs everything: a FastAPI backend serving a REST API under `/api`, the built React SPA as static files, and SQLite as storage. Two volumes matter: the app data volume (database, covers, backups) and the library volume holding the actual ebook files in `Author - Title` folders (under category subfolders for older material; new uploads write flat — see §10). The app only writes to the library volume when uploading new files; existing files are read-only inputs for metadata extraction.

```
Browser (React SPA) ──/api──▶ FastAPI (uvicorn, port 3000)
                                 │
                    ┌────────────┼─────────────┐
                    ▼            ▼             ▼
              SQLite (aiosqlite)  /books    /app/data/covers
              /app/data/library.db (ebooks)  (extracted + custom)
```

The SPA is served by the same FastAPI process (static mount + catch-all to `index.html`), so there is no separate web server and no CORS in production (the CORS middleware exists for dev, when Vite serves the frontend separately).

## 2. Stack + versions

Read from `backend/requirements.txt` and `frontend/package.json` (pinned there; this table is a snapshot):

| Layer | Tech / version |
|---|---|
| Runtime image | `python:3.11-slim` (frontend build stage: `node:20-slim`) |
| API | FastAPI 0.109.0 on uvicorn[standard] 0.27.0 |
| DB driver | aiosqlite 0.19.0 |
| Metadata extraction | ebooklib 0.18 · PyPDF2 3.0.1 · lxml 5.1.0 |
| Validation | pydantic 2.5.3 (+ pydantic-settings 2.1.0) |
| Scheduling | APScheduler 3.10.4 (automated backups) |
| Uploads | python-multipart 0.0.6 |
| UI | React 18.2 + react-router-dom 6.21 |
| Rendering extras | react-markdown 9 (notes) · @dnd-kit (collections reorder) · @tanstack/react-virtual 3.13 (installed, currently unused — see §7) |
| Styling | Tailwind CSS 3.4 — semantic tokens in `tailwind.config.js` (single token source) |
| Bundler | Vite 5 |

Plain JSX (no TypeScript), no component library, no state-management library.

## 3. File structure (current, trimmed)

```
liminal/
├── backend/
│   ├── main.py                  # FastAPI app, lifespan (init_db, TBR repair, backup scheduler), static serving
│   ├── database.py              # schema + idempotent migrations + sync_title_from_sessions  ⚠️ FROZEN
│   ├── requirements.txt
│   ├── routers/
│   │   ├── titles.py            # book CRUD, TBR, editions, merge, duplicates, covers (renamed from books.py, Phase 5)
│   │   ├── sessions.py          # reading sessions
│   │   ├── collections.py       # manual / checklist / automatic collections
│   │   ├── upload.py            # analyze/finalize upload batches, link-to-title
│   │   ├── sync.py              # library folder scan, metadata rescan
│   │   ├── authors.py           # author list/detail/rename/notes
│   │   ├── home.py              # home-screen shelves + stats
│   │   ├── settings.py          # key-value settings
│   │   ├── backups.py           # backup settings/history/manual
│   │   ├── covers.py            # cover image serving
│   │   └── import_metadata.py   # Obsidian reading-metadata import
│   └── services/
│       ├── metadata.py          # EPUB/PDF metadata extraction  ⚠️ FROZEN
│       ├── covers.py            # gradient colors + EPUB cover extraction  ⚠️ FROZEN
│       ├── upload_service.py    # temp sessions, validation, grouping
│       └── backup.py            # APScheduler jobs, retention
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # routes + connection gate
│   │   ├── api.js               # single fetch layer (~100 functions, error sanitization)
│   │   ├── components/          # screens + shared components
│   │   │   ├── ui/              # the 14-component design-system layer (see DESIGN_SYSTEM.md)
│   │   │   ├── add/             # add-flow (manual entry, wishlist, upload hand-off)
│   │   │   ├── settings/        # settings modals + rows
│   │   │   ├── upload/          # upload review flow (upload/BookCard.jsx ⚠️ FROZEN)
│   │   │   ├── GradientCover.jsx  ⚠️ FROZEN
│   │   │   ├── MosaicCover.jsx    ⚠️ FROZEN
│   │   │   └── … (Library, BookDetail, CollectionDetail, …)
│   │   ├── hooks/               # useStatusLabels, useGridColumns, useRatingLabels, useSort
│   │   ├── pages/               # routed pages (Settings, AddPage, ImportPage, AuthorsList, …)
│   │   ├── styles/tokens.css    # grain overlay only — tokens live in tailwind.config.js
│   │   └── utils/               # readTime, searchSort, categoryPhrases
│   ├── tailwind.config.js       # THE token source (colors + typography)
│   └── vite.config.js
├── scripts/
│   ├── design-lint.mjs          # design-system lint (see DESIGN_LINT_REPORT.md)
│   └── pre-commit               # warn-and-allow hook source
├── docs/                        # this file + design docs + audits
├── Dockerfile                   # two-stage: node build → python runtime
└── docker-compose.yml
```

## 4. Current schema

**If this contradicts `backend/database.py`, `database.py` wins.**

SQLite, accessed exclusively through aiosqlite. One fresh connection per request via the `get_db` dependency; `aiosqlite.Row` row factory. No ORM — raw SQL throughout. `PRAGMA foreign_keys = ON` is set on the request connections (`get_db`), on init, and on the sync background connection — but **not** on the maintenance connections main.py opens at startup (TBR half-state repair, backup scheduler) or the scheduled-backup task's own connection, so FK cascades are not guaranteed on those paths.

**Migrations:** there is no version table and no framework. `init_db()` runs the full `CREATE TABLE IF NOT EXISTS` schema, then `run_migrations()` applies idempotent steps: column-existence checks via `PRAGMA table_info` before `ALTER TABLE` (most columns) or unconditional `ALTER TABLE` inside a duplicate-error-swallowing `try/except` (the cover and gradient-color columns), `INSERT OR IGNORE` for defaults, one-time flags in `settings` (e.g. `links_reparsed`), and data backfills guarded by presence checks. Every container start re-runs the whole chain safely. Schema changes are a frozen-file edit — backup first, migration discipline per CLAUDE.md.

### titles — the core entity

One row per *work* (independent of file format). Groups of columns:

- **Identity/metadata:** `title`, `authors` (JSON array as TEXT), `series`, `series_number`, `category` (Fiction / Non-Fiction / FanFiction), `publication_year`, `word_count`, `summary`, `tags` (JSON), `isbn`, `publisher`, `chapter_count`.
- **Fanfiction metadata (Phase 7):** `source_url`, `completion_status` (Complete / WIP / Abandoned — note: this "Abandoned" is a *fic* completion state, distinct from reading status), `fandom`, `relationships` (JSON), `characters` (JSON), `content_rating`, `ao3_warnings` (JSON), `ao3_category` (JSON).
- **Covers:** `cover_color_1/2` (gradient pair, generated at creation), plus migration-added `cover_path`, `has_cover`, `cover_source` (`extracted` | `custom`).
- **Reading cache:** `status` (`Unread` / `In Progress` / `Finished` / `Abandoned`, legacy `DNF` accepted), `rating`, `date_started`, `date_finished`.
  *Known drift: Title status/rating/date cache overlaps ReadingSession — redesign parked (see Open Questions, "Status Knot"). Current shape is documented, not endorsed.*
- **Wishlist/TBR:** `acquisition_status` (`owned` | `wishlist`, migration-added) with legacy `is_tbr` kept in lockstep, `tbr_priority`, `tbr_reason`.
- **Housekeeping:** `is_orphaned` (folder missing at last sync), `created_at`, `updated_at`.

### reading_sessions — one row per read

`title_id` (FK → titles, CASCADE), `session_number` (1..n per title), `session_status` (`in_progress` / `finished` / `dnf` — snake_case at this layer), `rating`, `format` (ebook / physical / audiobook / web), `date_started`, `date_finished`.

After **any** session change, `sync_title_from_sessions()` (in `database.py`) recomputes the title cache: the latest session's status maps up to the title (`dnf` → `Abandoned`), its dates are copied up, and `titles.rating` becomes the average of rated sessions. No sessions → title reverts to `Unread` with cleared dates/rating.

### editions — formats owned per title

`title_id` (FK, CASCADE), `format` (ebook / physical / audiobook / web), `file_path`, `folder_path`, `narrators` (JSON, audiobooks), `acquired_date`. A **unique index on (title_id, format)** prevents duplicate formats at the DB level. Deleting the last edition of a title is refused at the API layer.

### notes + links — the Obsidian-style layer

`notes`: one markdown note per title (create-or-update), with `[[Title]]` links parsed on save into `links` (`from_note_id`, `to_title_id`, `link_text`; both FKs CASCADE). Backlinks are queried from `links`.

### collections + collection_books

`collections`: `name`, `description`, cover fields (`cover_type` mosaic/gradient/custom, gradient color pair, `custom_cover_path`), `sort_order`, `collection_type` (`manual` | `checklist` | `automatic`), `auto_criteria` (JSON, automatic only), `is_default` (TBR and Reading History cannot be deleted). `collection_books`: membership rows with `position`, `added_at`, `completed_at` (checklist ticking), UNIQUE (collection_id, title_id), FKs CASCADE.

### Supporting tables

- `settings` — key/value store: status/rating display labels, `reading_wpm`, `grid_columns`, backup config, migration flags.
- `author_notes` — notes keyed by `author_name` (no FK; author names live inside `titles.authors` JSON).
- `backup_history` — backup log (type, path, size, status), created by migration.
- `books` — **legacy pre-Phase-5 table**; not created on fresh databases. See Open Questions.

Indexes: single-column b-trees on the hot lookups (titles: category / series / title / status / is_tbr / acquisition_status / has_cover; the FK columns on editions, notes, links, reading_sessions, collection_books; also `editions.format`, `collections.sort_order`, `backup_history.created_at`) plus the unique composite `editions(title_id, format)`. No triggers, no views.

## 5. API surface

All endpoints live under `/api`; the FastAPI docs UI is at `/docs`. Naming history, one line: the router is `titles.py` and the table is `titles`, but most endpoint paths still say `/books/...` for frontend compatibility (renamed from `books.py` in Phase 5; the list response still calls its array `books`).

| Router | Base | Endpoint groups |
|---|---|---|
| `titles.py` | `/api` | Library list (`/titles`, legacy `/books`) with filter/sort/pagination; title detail + per-field PATCHes (category, status, rating, dates, metadata, enhanced metadata, rescan); notes + backlinks; browse aggregates (categories, statuses, series, tags) + autocompletes; TBR CRUD + acquire; manual title creation; editions add/delete; title merge; duplicate finder; title covers (upload custom, delete/revert, extract, bulk-extract) |
| `sessions.py` | `/api` | `GET/POST /titles/{id}/sessions`, `PATCH/DELETE /sessions/{id}` — there is no separate "finish" endpoint; finishing = PATCH with `session_status: "finished"` |
| `collections.py` | `/api` | Collections CRUD + reorder; membership add/remove/reorder; checklist complete-toggle; automatic-criteria preview; smart-paste parse/apply (backend only — no UI since C5); collection covers; duplicate collection |
| `upload.py` | `/api/upload` | `analyze-batch` → `finalize-batch` (per-book actions: new / add_format / add_to_existing / replace / skip); `link-to-title` (wishlist conversion with files); `cancel`; `limits`; `health` |
| `sync.py` | `/api/sync` | `POST /sync` (folder scan; `?full=` re-extracts), `GET /sync/status` (in-memory progress), metadata rescan + preview |
| `authors.py` | `/api/authors` | List with counts; author detail (notes + works); rename (rewrites `titles.authors` JSON everywhere); author-notes upsert |
| `home.py` | `/api/home` | Shelves: in-progress, recently-added, discover (random unread), quick-reads (word-count window from the WPM setting); period stats from finished sessions |
| `settings.py` | `/api/settings` | Get all / get one / upsert one |
| `backups.py` | `/api/backups` | Settings (+ path test), manual backup, history list/delete |
| `covers.py` | `/api/covers` | `GET /covers/{title_id}` — serves custom-else-extracted image; 404 means "frontend renders the gradient" |
| `import_metadata.py` | `/api` | Obsidian import: parse / preview / batch apply; reading-metadata update (POST). ⚠ queries the legacy `books` table — see Open Questions |

Registration order matters in two places: `titles.py` registers before `import_metadata.py`, so its `GET /books/match` wins over the duplicate path defined there; the SPA catch-all registers last so `/docs` and `/api/*` stay reachable.

## 6. Data flows

### Book lifecycle: upload → extract → library

```
POST /api/upload/analyze-batch  (multipart)
  └─ temp session /tmp/liminal-uploads/{session_id}
     validate (extension whitelist, 250 MB cap) — rejected files reported, not fatal
     extract metadata per file → group by title/author similarity (≥0.80)
     duplicate check (library folders) + familiar-title check (existing titles)
        ▼ user reviews groups in the Add flow (action per book)
POST /api/upload/finalize-batch
  ├─ action=new:             move files → /books/{Author - Title}/
  │                          generate_cover_colors() → gradient pair
  │                          extract_metadata() (EPUB/PDF → summary, tags, AO3 fields, …)
  │                          INSERT titles + editions('ebook')
  ├─ action=add_format:      INSERT edition on the existing title
  ├─ action=add_to_existing: move files into the existing title's folder + edition row
  └─ then: background library sync
POST /api/sync  (same path the manual Sync button uses)
  └─ walk /books folders → parse folder name → pick best file per folder
     extract_metadata (file data wins over folder name) → UPDATE (COALESCE) or INSERT
     extract EPUB cover image → /app/data/covers/extracted/{title_id}.*
        (skipped for FanFiction — gradient covers only; never overwrites a custom cover)
     orphan detection: folder gone from disk → titles.is_orphaned = 1
```

### Reading-session lifecycle

```
POST /api/titles/{id}/sessions        PATCH /api/sessions/{sid}          DELETE /api/sessions/{sid}
  session_number = max+1                null = "unchanged"; '' clears      delete row, renumber the
  status ∈ in_progress|finished|dnf     dates/format only (status can't    remaining sessions
  (rating only on ended sessions)       be cleared; rating has no clear
                                        path); "finish" = status+date
        │                                     │                                  │
        └───────────────┬─────────────────────┴──────────────────────────────────┘
                        ▼
        sync_title_from_sessions(title_id)          ← the ONLY intended writer of the title cache
          latest session status → titles.status   (in_progress→In Progress, finished→Finished, dnf→Abandoned)
          latest session dates  → titles.date_started / date_finished
          avg(rated sessions)   → titles.rating
          no sessions           → Unread, dates/rating cleared
```

### Wishlist → library conversion

```
POST /api/tbr  ──▶  titles row: acquisition_status='wishlist', is_tbr=1, status='Unread', gradient colors
                                    │
   ┌────────────────────────────────┼──────────────────────────────┬─────────────────────────┐
   ▼                                ▼                              ▼                         ▼
POST /tbr/{id}/acquire        POST /upload/link-to-title     POST /books/{id}/editions   startup repair
(no files; optional format;   (move uploaded files into      (adding any edition to a    (any wishlist title
 edition + convert in one      the title folder; edition +    wishlist title converts     that already has
 transaction)                  convert + background sync)     it first)                   editions gets fixed)
   └────────────────────────────────┴──────────────────────────────┴─────────────────────────┘
                                    ▼
              UPDATE titles SET is_tbr=0, acquisition_status='owned', status=COALESCE(status,'Unread')
```

## 7. Frontend architecture

- **Routing** (`App.jsx`; `BrowserRouter` is mounted in `main.jsx`): `/dev/components` (component gallery) sits outside the connection gate; everything else renders inside `ConnectedApp`, which health-checks `/api/health` first (connecting / error / connected states). Routes: `/` Library, `/book/:id`, `/series/:name`, `/authors`, `/author/:name`, `/collections`, `/collections/:id`, `/settings`, `/import`, `/add`, `/duplicates`, plus redirects `/tbr → /?acquisition=wishlist` and `/upload → /add`. Every routed page renders `UnifiedNavBar`; `BottomNav` is the mobile tab bar.
- **State:** local component state + prop drilling — no global store, no app-level context (the only `createContext` in the tree is Modal's internal layout context). Cross-cutting signals: the `settingsChanged` window CustomEvent (settings hooks re-read on it) and `localStorage` (per-view sort via `useSort`). Filter state lives in URL params; back navigation uses the `returnUrl` pattern.
- **Fetch layer:** `src/api.js` — single file, `API_BASE = '/api'` (same-origin; Vite dev proxy in development), ~100 exported functions. The central `apiFetch` sanitizes raw DB constraint errors into human copy before throwing; upload progress uses XHR; cover uploads use raw fetch/FormData. A handful of components still fetch directly — treat `api.js` as the front door for new code.
- **Hooks:** `useStatusLabels` (internal DB value → user-configurable display label; "Abandoned" displays as "DNF" by default; module-level cache), `useGridColumns` (user's mobile column setting → grid classes), `useRatingLabels`, `useSort`. Session snake_case statuses map through `SESSION_STATUS_TO_BACKEND` (in BookDetail) before labeling.
- **ui/ layer:** 14 shared components — inventory, props, and usage rules live in `DESIGN_SYSTEM.md`. Covers render via frozen `GradientCover` / `MosaicCover`.
- **Performance reality check:** the Library loads the whole collection in one request (limit 10000) and renders it without virtualization — `@tanstack/react-virtual` is an installed but currently **unused** dependency. The version-ref stale-response guard exists in exactly one place today (CollectionDetail's sort logic); treat it as the pattern to copy when adding any async-race-prone list, not as something already applied everywhere.

## 8. Deployment workflow

Generic by design (public repo):

1. Edit in the dev repo (Claude Code sessions; git is read-only for the agent — commits are manual).
2. Copy changed files from the dev repo to the container volume. The two locations are separate folders — the end-of-session **deploy manifest** lists every changed file so nothing goes stale in production.
3. Rebuild via Container Manager. The Dockerfile builds the frontend (node stage → static bundle at `/app/static`) and the Python runtime in one image. Backend or frontend-config changes require the rebuild; there is no hot reload.
4. Doc updates (CHANGELOG, ROADMAP, this file) ship in the same commit as the code they describe.

The SQLite database, covers, and backups live on the data volume and survive rebuilds. Back up the database file before any schema change — non-negotiable (CLAUDE.md).

## 9. Frozen subsystems

The canonical list and rules live in **CLAUDE.md** (repo root, untracked — re-read it, don't recall it). The six files and their one-line whys:

| File | Why frozen |
|---|---|
| `frontend/src/components/GradientCover.jsx` | output changes repaint every rendered cover |
| `frontend/src/components/MosaicCover.jsx` | output changes repaint every rendered cover |
| `frontend/src/components/upload/BookCard.jsx` | gradient hex constants are cover-generation data; the UI chrome around them is the negotiable zone |
| `backend/services/covers.py` | battle-tested extraction pipeline |
| `backend/services/metadata.py` | battle-tested extraction pipeline |
| `backend/database.py` | schema; migration discipline required |

Frozen ≠ untouchable: edits require an explicit flag, justification against the stated risk, and ratification — silent edits are violations even when correct.

## 10. 11pm debug

**Where everything is (container paths):**

| Thing | Path / endpoint |
|---|---|
| API + SPA | port `3000` (uvicorn) |
| Health | `GET /api/health` (books path existence) · `GET /api/upload/health` · `GET /api/sync/status` |
| API docs | `/docs` (FastAPI default) |
| Database | `/app/data/library.db` — **always `library.db`, never `liminal.db`** |
| Covers | `/app/data/covers/extracted/{title_id}.*` · `/app/data/covers/custom/{title_id}.*` |
| Backups | `/app/data/backups` (default; the `backup_history` table logs runs) |
| Ebooks | `/books/…` — mixed tree: category subfolders (`Fiction/`, `Non-Fiction/`, `FanFiction/`) are scanned as the primary structure; **new uploads write flat** to `/books/{Author - Title}/` (root-level flat is also scanned, labeled legacy in code) |
| Upload temp | `/tmp/liminal-uploads/{session_id}` (cleaned on finalize/cancel/expiry) |

**Env vars** (read at startup): `BOOKS_PATH` (default `/books`, scan root) · `DATABASE_PATH` (default `/app/data/library.db`) · `BOOKS_DIR` (default `/books`, upload destination — a *separate* variable from BOOKS_PATH) · `COVERS_DIR` (collection covers only; the in-code default and the compose value differ — trust compose, which points inside `/app/data`).

**Logs:** nothing writes log files. Everything (uvicorn access log, sync progress prints, backup scheduler messages) goes to the container's stdout/stderr — read it in the Container Manager log view. If the app seems dead: that log stream first, `GET /api/health` second.

**DB inspection:** open a *copy* of `library.db` in DB Browser for SQLite (pull it from the data volume; don't edit the live file while the container runs). Sanity queries: `SELECT COUNT(*) FROM titles;` · cache vs sessions for one title: `SELECT status, rating, date_finished FROM titles WHERE id = ?;` against `SELECT * FROM reading_sessions WHERE title_id = ? ORDER BY session_number;`.

**Clean-ish reset steps, escalating:**
1. Restart the container — startup re-runs the idempotent migrations and the wishlist half-state repair; the backup scheduler re-registers.
2. `POST /api/sync` (or `?full=true` to re-extract metadata) — rebuilds library state from the `/books` folders; orphan flags update.
3. Cover weirdness: `DELETE /api/books/{id}/cover?revert_to_gradient=true` per title, or the Settings bulk cover-extract pass.
4. Real corruption: stop the container, restore the newest file from `/app/data/backups`, start, verify with the sanity queries.

## 11. Open questions

- **The Status Knot:** `titles.status/rating/date_started/date_finished` is a cache derived from `reading_sessions` (`sync_title_from_sessions` is the only intended writer), but the same columns are also directly PATCHable via the `/books/{id}/status`-family endpoints — two write paths to one truth. Redesign parked; the current shape is documented in §4, not endorsed.
- **Import router targets the legacy table:** `import_metadata.py` queries `FROM books` throughout; fresh databases only have `titles` (`books` exists solely on pre-Phase-5 databases). Observed drift, recorded here — the import flow needs a decision (port to `titles` or retire) before it's trusted on a fresh DB.
- **Smart-paste endpoints have no UI:** the frontend was removed in C5; three backend endpoints remain in `collections.py`. Keep or cull — decision pending.
- **`text-h1` is intentionally absent** (the largest heading is h2); recorded in DESIGN_SYSTEM.md §2 so it doesn't get "fixed" back in.

## 12. Cross-links

- `docs/DESIGN_SYSTEM.md` — tokens, typography, the ui/ inventory, patterns, anti-patterns.
- `docs/DESIGN_LINT_REPORT.md` — current lint counts + active ignores (regenerated by `scripts/design-lint.mjs`).
- `CHANGELOG.md` — versioned history (append-top; full root causes).
- `ROADMAP.md` — the single source of truth for plans.
- `CLAUDE.md` (repo root, untracked) — frozen files, golden rules, session rules; wins on those subjects.
