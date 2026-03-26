# Liminal

> *Liminal* (adj.): occupying a position at, or on both sides of, a boundary or threshold.

**A self-hosted reading library for people who collect more than they can read.**

Liminal is a self-hosted web app for managing a personal reading library. It runs on any Docker-capable machine and provides a mobile-first interface for browsing, tracking, note-taking, and organizing books across published works and fanfiction — all in one place, on one screen.

The name comes from that transported mental state you enter when you're truly absorbed in a book — the space between the real world and the world on the page. The app is designed to get out of your way so you can spend less time managing and more time *there*.

---

## Features

### Library Management
- **Automatic metadata extraction** from EPUB and PDF files
- **Gradient covers** — warm desaturated palettes auto-generated from author names
- **Custom covers** — upload images or extract embedded covers
- **Category support** — Fiction, Non-Fiction, and FanFiction with dedicated metadata fields
- **Manual entry** for physical books, audiobooks, and web serials
- **Editions system** — track multiple formats per title, merge duplicates

### Collections
- **Three collection types** — Manual (curated), Checklist (track completion), Automatic (criteria-based)
- **Smart filtering** by status, category, tags, rating, and more
- **Drag-to-reorder** books and collections
- **Smart paste** — add books using `[[Title]]` markdown links

### Reading Tracking
- **Status tracking** — Unread, In Progress, Finished, DNF
- **Multiple reading sessions** — track re-reads with separate dates and ratings
- **Reading time estimates** based on word count and personal WPM
- **Wishlist** with priority levels and notes

### Notes & Linking
- **Rich notes editor** with markdown support
- **Wiki-style linking** — type `[[` to search and link between books
- **Backlinks** — see which books reference the current one
- **Note templates** for reviews, reading notes, and reflections
- **Author notes** for tracking thoughts about specific writers

### Browsing & Discovery
- **Home dashboard** — Currently Reading, Recently Added, Quick Reads
- **Filtering and sorting** — by category, status, tags, read time, date added, and more
- **Series pages** with reading order and completion tracking
- **Author pages** with bio notes and full bibliography
- **Search** across titles, authors, and series

### Mobile-First (Desktop Too)
- **Bottom navigation** — Library, Series, Collections, Authors, Settings
- **Contextual back navigation** that always knows where you came from
- **Responsive layouts** for phone, tablet, and desktop
- **Full-screen notes editor** for distraction-free writing

### Infrastructure
- **Automated backups** with grandfather-father-son rotation
- **Docker deployment** — single container, runs anywhere
- **Tailscale ready** for secure remote access

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

Configure your book storage path in `docker-compose.yml`:

```yaml
volumes:
  - /path/to/your/books:/books:ro
```

Start the container:

```bash
docker-compose up -d
```

Open `http://your-server:3000` and click **Sync** to scan your library.

### First Steps
1. **Sync** — scans folders and extracts metadata from EPUB/PDF files
2. **Set reading speed** — used for time estimates (Settings → WPM)
3. **Configure labels** — customize status names if you want
4. **Import** — migration scripts available for Obsidian vaults

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
│   ├── routers/
│   │   ├── titles.py        # Book CRUD, notes, search, filtering
│   │   ├── sync.py          # Folder scanning + metadata extraction
│   │   ├── series.py        # Series endpoints
│   │   ├── collections.py   # Collections CRUD
│   │   └── backups.py       # Backup system
│   └── services/
│       ├── metadata.py      # EPUB/PDF metadata extraction
│       ├── covers.py        # Gradient cover generation
│       └── backup.py        # Backup rotation
├── frontend/
│   ├── src/
│   │   ├── pages/           # Library, BookDetail, Series, Authors, Collections, Settings
│   │   ├── components/      # BookCard, GradientCover, modals, UI primitives
│   │   └── api.js           # Backend API wrapper
│   └── vite.config.js
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

---

## Current Status

**Version:** 0.34.0 (March 2026) — in active development.

Core systems are stable: library browsing, metadata extraction, reading tracking, wiki-style notes, wishlist management, smart collections, editions, automated backups, and mobile-optimized navigation.

**Current focus — Phase 10: Liminal Connects** — integrating with external tools including Moon Reader, Obsidian, Google Books, Open Library, and local AI via Ollama.

See `ROADMAP.md` for full details.

---

## Philosophy

- **Mobile-first** — if it doesn't work with one thumb, it doesn't ship
- **Single source of truth** — one place for all reading data, not three apps and a spreadsheet
- **Reduce friction** — less time managing, more time reading
- **Connect, don't rebuild** — integrate with existing tools instead of replacing them
- **Your data, your server** — no accounts, no tracking, no social features you didn't ask for
- **All reading counts** — fanfiction gets the same metadata support as published work

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

I have 1,700+ books. EPUBs scattered across drives. PDFs from bundles I bought three years ago and still haven't opened. Fanfiction downloaded from AO3 that I will defend with my life. Physical books I keep meaning to shelve properly. I will not be shelving them properly.

Over the years I've used Calibre, Goodreads, LibraryThing, StoryGraph, Kavita, and more note-taking apps than I'd like to admit — Apple Notes, Simplenote, Evernote, Obsidian — trying to piece together a system that worked. Each tool does its own job well. None of them did *my* job. Library managers don't do notes. Social platforms don't do privacy. Reading servers don't do tracking. Note apps don't know what a book is. And almost nothing treats fanfiction like it counts. (It counts.)

So I did the only rational thing a person can do when six apps aren't enough: I built one to replace them all. And when AWS goes down, and half these services get acquired by some company that ruins them, and the rest quietly sunset — my little self-hosted app that could will still be running on a NAS in my living room.

---

*"A reader lives a thousand lives before he dies. The man who never reads lives only one."* — George R.R. Martin
