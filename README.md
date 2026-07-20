# Liminal

> *Liminal* (adj.): occupying a position at, or on both sides of, a boundary or threshold.

**A self-hosted reading library for people who collect more than they can read.**

Liminal is a self-hosted web app for managing a personal reading library. It runs on any Docker-capable machine and provides a mobile-first interface for browsing, tracking, note-taking, and organizing your reads across published works and fanfiction: all in one place, on one screen.

The name comes from that transported mental state you enter when you're truly absorbed in a book: the space between the real world and the world on the page. The app is designed to get out of your way so you can spend less time managing and more time *there*.

---

## Features

### Library Management
- **Automatic metadata extraction** from EPUB and PDF files
- **Multi-format editions**: one title, many files — track EPUB, PDF, MOBI, AZW3, and HTML formats side by side, with per-format add, replace, and remove actions on the book page
- **Gradient covers**: warm desaturated palettes auto-generated from author names
- **Custom covers**: upload images or extract embedded covers
- **Category support**: Fiction, Non-Fiction, and FanFiction with dedicated metadata fields (fandoms, ships, tags, source URLs)
- **Manual entry** for physical books, audiobooks, and web serials
- **Duplicate finder**: review possible duplicate titles and merge them — merges move files, carry covers and notes, and drop nothing silently

### Data Safety
- **Nothing is hard-deleted.** Every destructive file operation — removing a title, removing a format, replacing a file, merging duplicates — moves files to a trash folder instead of deleting them
- **In-app Trash**: review what's accumulated and empty it behind the app's only type-to-confirm gate
- **Fill-empty-only sync**: library rescans fill in missing metadata but never overwrite your hand-corrected fields
- **Contained uploads**: every upload path validates its destination and refuses collisions instead of overwriting
- **Automated backups** with grandfather–father–son rotation, scheduled daily and before syncs

### Collections
- **Three collection types**: Manual (curated), Checklist (track completion), Automatic (criteria-based)
- **Smart filtering** by status, category, tags, rating, and more
- **Drag-to-reorder** books and collections
- **Custom collection covers**: upload an image or use the generated mosaic

### Reading Tracking
- **Status tracking**: Unread, In Progress, Finished, DNF — with customizable display labels
- **Multiple reading sessions**: track re-reads with separate dates and ratings; your status always reflects your real reading history
- **Reading time estimates** based on word count and your personal reading speed
- **Wishlist** with priority levels and "why I wanted this" notes — when you get the book, conversion to your library is lossless: notes, covers, and the reason you wanted it all carry over

### Notes & Linking
- **Rich notes editor** with markdown support
- **Wiki-style linking**: type `[[` to search and link between books
- **Backlinks**: see which books reference the current one
- **Note templates** for reviews, reading notes, and reflections
- **Author notes** for tracking thoughts about specific writers

### Browsing & Discovery
- **Home dashboard**: Currently Reading, Recently Added, Quick Reads
- **Filtering and sorting**: by category, status, tags, read time, date added, and more
- **Series pages** with reading order and completion tracking
- **Author pages** with bio notes and full bibliography
- **Search** across titles, authors, and series
- **Sync results you can act on**: every library scan produces a persistent, reviewable report of what was added, updated, or skipped

### Mobile-First (Desktop Too)
- **Bottom navigation**: Library, Series, Collections, Authors, Settings
- **One-tap download** into your reading app of choice
- **Contextual back navigation** that always knows where you came from
- **Responsive layouts** for phone, tablet, and desktop
- **Full-screen notes editor** for distraction-free writing

### Design System
- **A calm, warm interface** inspired by the UI design of *Swan Song* (2021): warm charcoal, off-white, muted teal, minimal animation
- **Token-driven styling**: every color flows from a single source of truth
- **No silent failures**: every error renders where the action happened, says what went wrong, and offers a way forward
- **Honest language**: no "Oops," no guilt, no gamified pressure — DNF is a status, not a failure
- **Enforced by tooling**: a custom design-lint script and per-session code review keep the system from drifting

---

## Quick Start

### Prerequisites
- A machine with Docker (NAS, VPS, Raspberry Pi, local server)
- Ebook library organized in folders (one folder per book)

### Installation

```bash
git clone https://github.com/yourusername/liminal.git
cd liminal
```

Configure your book storage path — copy `.env.example` to `.env` and set the host path (the compose file reads it and refuses to start without one):

```bash
cp .env.example .env
# then edit .env:
# BOOKS_HOST_PATH=/path/to/your/books
```

Start the container:

```bash
docker-compose up -d
```

Open `http://your-server:3000` and click **Sync** to scan your library.

### First Steps
1. **Sync**: scans folders and extracts metadata from EPUB/PDF files
2. **Set reading speed**: used for time estimates (Settings → Reading Speed)
3. **Configure labels**: customize status and rating names if you want
4. **Set up backups**: automated rotation is one toggle away (Settings → Backups)

---

## Technology

| Component | Technology |
|-----------|------------|
| Backend | Python FastAPI (async) |
| Frontend | React 18 + Vite 5 + Tailwind CSS 3.4 |
| Database | SQLite (async via aiosqlite) |
| Deployment | Docker / Docker Compose |
| Metadata | ebooklib, PyPDF2 |

---

## Project Structure

```
liminal/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── database.py          # SQLite schema + migrations
│   ├── routers/             # titles, sync, upload, downloads,
│   │                        # series, collections, backups
│   └── services/
│       ├── metadata.py      # EPUB/PDF metadata extraction
│       ├── covers.py        # Gradient cover generation
│       └── backup.py        # Backup rotation
├── frontend/
│   ├── src/
│   │   ├── pages/           # Library, Series, Authors, Collections, Settings
│   │   ├── components/      # BookDetail, BookCard, covers, modals, ui/ primitives
│   │   └── api.js           # Backend API wrapper
│   └── vite.config.js
├── scripts/
│   └── design-lint.mjs      # Design-system lint (tokens, copy rules, patterns)
├── docker-compose.yml
└── Dockerfile
```

---

## Documentation

| Document | Description |
|----------|-------------|
| `ARCHITECTURE.md` | System design and data flow |
| `ROADMAP.md` | Priorities and future plans |
| `CHANGELOG.md` | Version history |
| `CODE_PATTERNS.md` | Reusable code solutions |
| `docs/DESIGN_SYSTEM.md` | Tokens, components, and pattern law |
| `docs/DESIGN_PHILOSOPHY.md` | Why the app feels the way it does |
| `docs/VOICE_AND_TONE.md` | How the app speaks |
| `docs/MICROCOPY_LIBRARY.md` | The approved strings |

---

## Current Status

**Version:** 0.74.0 (July 2026), in active development.

Core systems are stable: library browsing, metadata extraction, multi-format editions, reading tracking, wiki-style notes, wishlist management, smart collections, automated backups, and mobile-optimized navigation.

Recent development focused on **data safety and honest failure handling**: trash-first file operations, overwrite-proof syncing, contained uploads, lossless wishlist conversion, and an interface where every failure speaks. Current focus is design-system consolidation, with metadata extraction for non-EPUB formats and external integrations (reading apps, Obsidian, metadata sources, local AI) on the roadmap.

See `ROADMAP.md` for full details.

---

## Philosophy

- **Mobile-first**: if it doesn't work with one thumb, it doesn't ship
- **Single source of truth**: one place for all reading data, not three apps and a spreadsheet
- **Nothing is lost silently**: destructive actions are recoverable, failures are visible, and your corrections are never overwritten
- **Reduce friction**: less time managing, more time reading
- **Connect, don't rebuild**: integrate with existing tools instead of replacing them
- **Your data, your server**: no accounts, no tracking, no social features you didn't ask for
- **All reading counts**: fanfiction gets the same metadata support as published work

---

## Contributing

This is currently a personal project, but contributions that align with the project philosophy are welcome. Please open an issue before submitting significant changes.

---

## License

MIT

---

## Acknowledgments

Inspired by [Hardcover](https://hardcover.app), [Moon+ Reader](https://www.moondownload.com/), [Notion](https://notion.so), [Plex](https://plex.tv), [Calibre](https://calibre-ebook.com/), and the UI design of [Swan Song (2021)](https://www.imdb.com/title/tt13207508/).

Built with FastAPI, React, Tailwind CSS, and SQLite.

---

## Why I Built This

I have 2,200+ books. EPUBs scattered across drives. PDFs from bundles I bought three years ago and still haven't opened. Fanfiction downloaded from AO3 that I will defend with my life. Physical books I keep meaning to shelve properly. I will not be shelving them properly.

Over the years I've used Calibre, Goodreads, LibraryThing, StoryGraph, Kavita, and more note-taking apps than I'd like to admit (Apple Notes, Simplenote, Evernote, Obsidian) trying to piece together a system that worked to help me read, track, rediscover, and grow my library of stories. Each tool does its own job well. None of them did *my* job. Library managers don't do notes. Social platforms don't do privacy. Reading servers don't do tracking. Note apps don't know what a book is. And almost nothing treats fanfiction like it counts. (It counts.)

So I did the only rational thing a person can do when six apps aren't enough: I built one to replace them all. And when AWS goes down, and half these services get acquired by some company that ruins them, and the rest quietly sunset, my little self-hosted app that could will still be running on a NAS in my living room.

Built over many, many moons of iterative development with the help of Claude Projects and Claude Code for implementation. Every feature was designed, tested, and refined by hand on the device it's meant for.

---

*"A reader lives a thousand lives before he dies. The man who never reads lives only one."* ~ George R.R. Martin