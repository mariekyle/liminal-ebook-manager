# Liminal

> *Liminal* (adj.): occupying a position at, or on both sides of, a boundary or threshold.

**A self-hosted reading companion for readers who collect more than they can read.**

---

## The Problem

If you're like me, you have books everywhere. EPUBs scattered across cloud drives. Fanfiction downloaded from AO3. PDFs from bundles you bought three years ago. Physical books stacked in corners. And somewhere in all of that chaos — a vague memory of which ones you've actually read, which ones you abandoned, and which ones changed your life.
I've tried many excellent tools over the years — Calibre, Goodreads, LibraryThing, StoryGraph, BookFusion, Kavita, Komga, Ubooquity, Calibre Web Automated, Airtable spreadsheets and more. Each one does what it was designed to do remarkably well. But I kept finding myself falling between the cracks:

- Library managers excel at organizing files, but aren't built for mobile browsing or personal note-taking
- Social reading platforms are great for discovery and community, but I wanted something private and personal
- Reading servers serve books beautifully, but tracking and metadata live elsewhere
- Note-taking apps handle thoughts well, but don't understand books as a concept

And then there's fanfiction — a significant part of my reading life that most tools either ignore entirely or treat as an afterthought. I needed a system that could handle a 200,000-word enemies-to-lovers epic with the same care as a published novel, complete with fandom, ships, content ratings, and completion status.

What I actually needed was something purpose-built for how I read: on my phone, across formats, with rich private notes, tracking re-reads, and metadata for literary work in various formats. 

One place. One screen. One source of truth.

So I built Liminal

---

## What Is Liminal?

Liminal is a **self-hosted web app** for managing your personal ebook library. If you have ebooks in a folder, Liminal can instantly allow you begin making sense of your reading life in a visual way. It runs on a NAS or any Docker-capable machine and provides a mobile-friendly interface for:

- **Browsing** your library with beautiful gradient covers
- **Taking notes** with wiki-style `[[linking]]` between books
- **Tracking** reading status, ratings, and re-reads
- **Wishlisting** books you want to acquire
- **Organizing** into curated collections
- **Filtering** by dozens of criteria — including fanfiction-specific metadata

The name comes from that transported mental state you enter when you're truly absorbed in a book — the *liminal space* between the real world and the world on the page. The app is designed to get out of your way so you can spend less time managing and more time *there*.

---

## Who Is This For?

Liminal is built for readers who:

- **Read on mobile** and need an interface that works with their thumbs
- **Have large libraries** (1,000+ books) that need real organization
- **Read fanfiction** and need metadata support for fandoms, ships, and content ratings
- **Take notes** and want them linked, searchable, and permanent
- **Value privacy** and prefer self-hosted solutions
- **Re-read favorites** and want to track each reading separately

If you're the kind of person who has a spreadsheet somewhere tracking your reading, or a folder of markdown files, or a Notion database that's gotten unwieldy — Liminal might be for you.

---

## Features

### Library Management
- **Automatic metadata extraction** from EPUB and PDF files
- **Gradient covers** auto-generated from author names (10 unique presets)
- **Category support** for Fiction, Non-Fiction, and FanFiction
- **Fanfiction metadata** — fandom, ships, characters, content rating, completion status
- **Manual entry** for physical books, audiobooks, and web serials
- **Collection system** for curating themed reading lists
- **Smart paste** — add books to collections using `[[Title]]` markdown links

### Reading Tracking
- **Status tracking** — Unread, In Progress, Finished, DNF (with custom labels)
- **Multiple reading sessions** — track re-reads with separate dates and ratings
- **Reading time estimates** based on word count and your personal WPM
- **Times read & average rating** calculated across all sessions
- **Wishlist system** with priority levels

### Notes & Linking
- **Rich notes editor** with markdown support
- **Wiki-style linking** — type `[[` to search and link to other books
- **Backlinks** — see which books reference the current one
- **Note templates** for structured reviews
- **Author notes** for tracking thoughts about specific writers

### Browsing & Discovery
- **Home dashboard** with Currently Reading, Recently Added, and Quick Reads
- **Powerful filtering** — category, status, tags, read time, and more
- **Sort options** — title, author, date added, publication year
- **Series pages** showing all books in a series
- **Author pages** with bio notes and complete bibliography
- **Search** across titles, authors, and series

### Mobile-First Design (Desktop Too)
- **Bottom navigation** optimized for one-handed use on mobile
- **Responsive layouts** that adapt beautifully to tablet and desktop
- **Filter drawer** slides up on mobile, slides from right on desktop
- **Full-screen notes editor** for distraction-free writing
- **Configurable grid** — choose your preferred column density

---

## Screenshots

*Coming soon — the app is currently in active development.*

---

## Quick Start

### Prerequisites

- Any machine with Docker (NAS, VPS, Raspberry Pi, local server)
- Your ebook library organized in folders
- Tailscale (optional, for remote access)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/liminal.git
   cd liminal
   ```

2. Configure your book storage path in `docker-compose.yml`:
   ```yaml
   volumes:
     - /path/to/your/books:/books:ro
   ```

3. Start the container:
   ```bash
   docker-compose up -d
   ```

4. Open `http://your-server:3000` in your browser

5. Click **Sync** to scan your book folders

### Initial Setup

1. **Sync your library** — Liminal will scan your folders and extract metadata
2. **Set your reading speed** — Used for read time estimates (Settings → WPM)
3. **Configure status labels** — Customize what "Finished" and "DNF" are called
4. **Import existing data** — Migration scripts available for Obsidian and Calibre

---

## Technology

| Component | Technology |
|-----------|------------|
| Backend | Python FastAPI |
| Frontend | React + Vite + Tailwind CSS |
| Database | SQLite (async with aiosqlite) |
| Deployment | Docker / Docker Compose |
| Metadata | ebooklib, PyPDF2 |

---

## Project Structure

```
liminal/
├── backend/           # Python FastAPI
│   ├── routers/       # API endpoints
│   ├── services/      # Business logic
│   └── database.py    # SQLite schema
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── api/
│   └── vite.config.js
├── docs/              # Documentation
├── docker-compose.yml
└── Dockerfile
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture Guide](docs/ARCHITECTURE.md) | System design and data flow |
| [Development Workflow](docs/DEVELOPMENT_WORKFLOW.md) | How to contribute |
| [Roadmap](docs/ROADMAP.md) | Current priorities and future plans |
| [Changelog](docs/CHANGELOG.md) | Version history |

---

## Current Status

**Version:** 0.15.0 (January 2026)

Liminal is in active development and is my daily driver for managing 1,700+ books. The core features are stable:

- ✅ Library browsing and search
- ✅ Metadata extraction and editing
- ✅ Reading status and session tracking
- ✅ Notes with wiki-style linking
- ✅ Wishlist management
- ✅ Collections system
- ✅ Mobile-optimized interface

**Coming soon:**
- Design system refactor for consistent UI patterns
- Custom book covers
- AI-powered recommendations and summaries
- PWA support for offline access

---

## Philosophy

### Mobile-First
Every feature is designed thumbs-first. If it doesn't work well on a phone held in one hand, it doesn't ship.

### Single Source of Truth
Liminal is THE place for book data. No more checking three different apps to remember if you've read something.

### Reduce Friction
The goal is always: if it takes more than 2 taps, find a way to simplify it. Less time managing means more time reading.

### Your Data, Your Server
Self-hosted means your reading history, notes, and library stay private. No accounts, no tracking, no social features you didn't ask for.

### Respect for Fanfiction
Half my library is fanfiction. Liminal treats it as first-class content with proper metadata support — because a 200,000-word enemies-to-lovers epic deserves the same respect as a published novel.

---

## Contributing

This is currently a personal project, but I'm happy to accept contributions that align with the project philosophy. Please open an issue to discuss significant changes before submitting a PR.

---

## License

MIT

---

## Acknowledgments

**Apps and experiences that inspired Liminal:**
- [Hardcover](https://hardcover.app) — the biggest inspiration for what a modern reading tracker could be
- [Moon+ Reader](https://www.moondownload.com/) — my daily reading companion on Android
- [Notion](https://notion.so) — proof that personal databases can be beautiful
- [Plex](https://plex.tv) — the gold standard for self-hosted media management
- [Book of the Month](https://www.bookofthemonth.com/) — for showing how book discovery can feel curated and personal
- [Calibre](https://calibre-ebook.com/) — My constant companion since 2007. Calibre has followed me through trans-Atlantic moves, countless devices, format wars, and nearly two decades of evolving reading habits. It taught me that a personal library could be truly mine — organized exactly how I wanted, converted to any format I needed, backed up and portable forever. The fact that such powerful software exists for free, maintained with such dedication for so many years, is a gift to readers everywhere. Liminal exists because Calibre showed me what was possible.
- [Swan Song (2021)](https://www.imdb.com/title/tt13207508/) — the interfaces and experiences enabled by technology in Ben Cleary's film are the embodiment of calm UX..which is something for with the app. It's one of my favorite movies and a beautiful take on the idea that letting go to build something greater is the hardest and most necessary part of any process.

**Built with:**
- FastAPI, React, Tailwind CSS, SQLite

---

*"A reader lives a thousand lives before he dies. The man who never reads lives only one."* — George R.R. Martin
