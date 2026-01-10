# Changelog

All notable changes to Liminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 9: Feature Completion (In Progress)
- Phase 9B: Folder structure independence
- Phase 9C: Cover improvements  
- Phase 9D: Bug fixes & UI polish
- Phase 9E: Smart Collections system
- Phase 9F: Book detail redesign
- Phase 9G: Library/Home improvements
- Phase 9H: Stats page
- Phase 9I: Collections polish
- Phase 9J: Deduplication tools
- Phase 9K: Unprocessed files detection

---

## [0.19.0] - 2026-01-10

### Added

#### Phase 9A: Automated Backup System 🎉
Complete automated database backup system with grandfather-father-son rotation, fully configurable via Settings UI with no Docker knowledge required.

**Backend - Database Schema:**
- **Backup settings columns** — Added to `settings` table:
  - `backup_enabled` (BOOLEAN, default TRUE)
  - `backup_path` (TEXT, default '/app/data/backups')
  - `backup_schedule` (TEXT, default 'both') — Options: 'before_sync' | 'daily' | 'both'
  - `backup_time` (TEXT, default '03:00')
  - `backup_daily_retention_days` (INTEGER, default 7)
  - `backup_weekly_retention_weeks` (INTEGER, default 4)
  - `backup_monthly_retention_months` (INTEGER, default 6)
  - `last_backup_time` (TIMESTAMP)
- **Backup history table** — New `backup_history` table tracks all backups:
  - `id` (PRIMARY KEY)
  - `backup_type` (TEXT) — Values: 'daily' | 'weekly' | 'monthly' | 'manual' | 'pre_sync'
  - `file_path` (TEXT) — Full path to backup file
  - `file_size` (INTEGER) — Size in bytes
  - `created_at` (TIMESTAMP)
  - `status` (TEXT) — 'success' | 'failed'
  - Index on `created_at` for performance

**Backend - Backup Service (`backend/services/backup.py`):**
- **Grandfather-father-son rotation** — Automatic categorization:
  - Monthly backups on 1st of month
  - Weekly backups on Sundays
  - Daily backups on all other days
- **Core functions:**
  - `get_backup_settings()` — Load configuration from database
  - `save_backup_settings()` — Persist configuration changes
  - `create_backup()` — Create database backup with type detection
  - `cleanup_old_backups()` — Enforce retention policy, delete old backups
  - `get_backup_stats()` — Calculate total size, count, breakdown by type
  - `get_backup_history()` — Query recent backups
  - `validate_backup_path()` — Test if path is writable
  - `delete_backup()` — Remove specific backup file and record
  - `schedule_backup_jobs()` — Set up APScheduler with cron triggers
  - `start_scheduler()` / `stop_scheduler()` — Control scheduler lifecycle
  - `update_scheduler_time()` — Modify schedule without restart
- **Automatic cleanup** — Old backups deleted based on retention policy
- **Error handling** — Failed backups logged to history table with error message

**Backend - REST API (`backend/routers/backups.py`):**
- **GET `/api/backups/settings`** — Returns current configuration + stats
  - Response includes: settings, last backup time, total storage used, backup count, breakdown by type
- **PATCH `/api/backups/settings`** — Update backup configuration
  - Validates time format (HH:MM)
  - Validates retention values (positive integers)
  - Tests path writability before saving
  - Updates scheduler if backup_time changes
- **POST `/api/backups/test-path`** — Test if path is writable
  - Creates directory if needed
  - Tests write permissions with temporary file
  - Returns `{valid: true/false, error: "message"}`
- **POST `/api/backups/manual`** — Trigger immediate backup
  - Returns `{success: true, backup_id: int, file_path: string, file_size: int}`
- **GET `/api/backups/history`** — List recent backups (limit 50)
  - Returns array of backup records with full details
- **DELETE `/api/backups/history/{id}`** — Delete specific backup
  - Removes file from disk and record from database

**Backend - Integration:**
- **Pre-sync backups** — Modified `backend/routers/sync.py`
  - Triggers backup before sync when schedule is 'before_sync' or 'both'
  - Non-blocking: sync continues even if backup fails
  - Logs result to console
- **Scheduler lifecycle** — Modified `backend/main.py`
  - Starts scheduler on app startup (if enabled + daily/both schedule)
  - Stops scheduler cleanly on shutdown
  - Tracks scheduler state to prevent multiple instances
- **Dependencies** — Added `apscheduler==3.10.4` to `requirements.txt`

**Frontend - API Integration (`frontend/src/api.js`):**
- **New API functions:**
  - `getBackupSettings()` — Load configuration and stats
  - `updateBackupSettings(settings)` — Save configuration
  - `testBackupPath(path)` — Validate path writability
  - `createManualBackup()` — Trigger backup immediately
  - `getBackupHistory()` — List all backups
  - `deleteBackup(backupId)` — Remove specific backup

**Frontend - Settings UI (`frontend/src/components/SettingsDrawer.jsx`):**
- **"Automated Backups" section** — New section in Settings drawer
- **Enable/disable toggle** — Checkbox to enable automatic backups
- **Backup location input** — Text input for path with real-time validation
  - Default: `/app/data/backups` (same volume as database)
  - "Test" button validates path writability before saving
  - Validation feedback: Green checkmark or red error message
  - Help text with example paths (USB, network mounts)
- **Schedule selector** — Dropdown with 3 options:
  - "Before every sync only" → Creates backup before each sync
  - "Daily at specified time" → Scheduled daily backup
  - "Both (before sync + daily)" → Combined approach (default)
- **Time picker** — Input for daily backup time (appears when schedule includes daily)
  - Format: HH:MM (24-hour)
  - Default: 03:00 AM
- **Retention policy controls** — Number inputs for each rotation level:
  - Daily backups: Keep last N days (default: 7)
  - Weekly backups: Keep last N weeks (default: 4)
  - Monthly backups: Keep last N months (default: 6)
  - Min/max validation on inputs
- **Stats display card** — Real-time statistics:
  - Last backup: Relative time (e.g., "Just now", "2 hours ago", "Never")
  - Storage used: Human-readable format (e.g., "6.5 MB")
  - Backup count: Total number of backups
  - Breakdown: Count by type (daily, weekly, monthly)
- **Manual backup button** — "Create Backup Now"
  - Loading state: "Creating Backup..."
  - Disabled while in progress
  - Success message on completion
- **Save settings button** — "Save Backup Settings" (green)
  - Validates all inputs before saving
  - Shows success/error messages
  - Reloads stats after save
- **Helper functions:**
  - `formatBytes()` — Convert bytes to human-readable (B, KB, MB, GB, TB, PB)
  - `formatTimeAgo()` — Convert timestamp to relative time

**Key Features:**
- ✅ **Works out-of-box** — Sensible defaults, no configuration required
- ✅ **Path flexibility** — Changeable anytime via Settings UI
  - Start with default location (same volume)
  - Move to USB drive anytime: `/volumeUSB1/liminal-backups`
  - Move to network storage: `/volume1/network-backups`
  - Test button validates before saving
- ✅ **No Docker knowledge required** — All configuration via web UI
- ✅ **Automatic rotation** — Intelligent backup type detection
- ✅ **Retention enforcement** — Old backups auto-deleted
- ✅ **Pre-sync safety** — Backup before potentially destructive operations
- ✅ **Manual override** — On-demand backup button
- ✅ **Real-time stats** — Live updates after operations
- ✅ **Error handling** — Clear error messages, non-blocking failures

**Default Configuration:**
```json
{
  "enabled": true,
  "path": "/app/data/backups",
  "schedule": "both",
  "time": "03:00",
  "retention": {
    "daily_days": 7,
    "weekly_weeks": 4,
    "monthly_months": 6
  }
}
```

**Backup Folder Structure:**
```
/app/data/backups/
├── daily/
│   ├── liminal_daily_20260110_030001.db
│   ├── liminal_pre_sync_20260110_153022.db
│   └── liminal_manual_20260110_201028.db
├── weekly/
│   └── liminal_weekly_20260105_030001.db  (Sundays)
└── monthly/
    └── liminal_monthly_20260101_030001.db  (1st of month)
```

### Changed

- **Startup sequence** — App now initializes backup scheduler during lifespan
- **Shutdown sequence** — Scheduler stopped cleanly on app termination
- **Sync endpoint** — Pre-sync backup integration (non-blocking)

### Fixed

- **Array bounds in formatBytes** — Added TB and PB units, safeguard against overflow
- **Backup settings keys** — Used consistent `backup_` prefix for all settings
- **Scheduler cleanup** — Proper shutdown prevents resource leaks

### Technical

#### Database Changes
- Migration: Added 8 columns to `settings` table for backup configuration
- Migration: Created `backup_history` table with status tracking
- Index: `CREATE INDEX idx_backup_history_created ON backup_history(created_at)`
- Default values inserted for all backup settings

#### New Files
- `backend/services/backup.py` (544 lines) — Complete backup service
- `backend/routers/backups.py` (320 lines) — REST API endpoints

#### Modified Files
- `backend/database.py` — Backup system migrations
- `backend/routers/sync.py` — Pre-sync backup integration
- `backend/main.py` — Scheduler lifecycle management
- `backend/requirements.txt` — Added apscheduler dependency
- `frontend/src/api.js` — 6 new backup API functions
- `frontend/src/components/SettingsDrawer.jsx` — Complete backup UI section

#### Dependencies
- Added: `apscheduler==3.10.4` — For scheduled backup automation

#### API Endpoints
- `GET /api/backups/settings` — Get configuration and stats
- `PATCH /api/backups/settings` — Update configuration
- `POST /api/backups/test-path` — Validate path writability
- `POST /api/backups/manual` — Trigger backup immediately
- `GET /api/backups/history` — List recent backups
- `DELETE /api/backups/history/{id}` — Delete specific backup

### Security

- **Path validation** — All paths tested for writability before use
- **Permission checks** — Backup operations fail gracefully if permissions insufficient
- **No credentials stored** — All paths use local file system
- **Non-blocking failures** — Backup failures never prevent app operations

### Performance

- **Minimal overhead** — Scheduler runs in background, zero impact on API requests
- **Async operations** — All backup operations use async I/O
- **Efficient cleanup** — Retention policy enforced during backup creation
- **Indexed queries** — backup_history table indexed on created_at

### Data Protection

**What's backed up:**
- Complete SQLite database (liminal.db)
- All book metadata (1,796 titles)
- All reading sessions and history
- All notes with wiki-style links (251 notes)
- All collections and memberships
- All user settings and preferences
- All fanfiction metadata
- All edition records

**What's NOT backed up:**
- Book files themselves (EPUBs, PDFs) — remain in original location
- Cover images — regenerated from gradient system if needed
- Application code — managed via Git

**Recovery process:**
1. Stop Liminal container
2. Replace `/app/data/liminal.db` with backup file
3. Restart container
4. All data restored ✅

### User Impact

- **Zero learning curve** — Works automatically with no setup
- **Peace of mind** — Library data protected from NAS failures
- **Flexible storage** — Can move backups to USB or network storage anytime
- **No maintenance** — Automatic cleanup, no manual intervention needed
- **Mobile accessible** — All configuration via Settings (no SSH required)

### Development Stats

- **Implementation time:** 3 days (Jan 10, 2026)
  - Day 1: Database schema + backup service
  - Day 2: REST API + integration
  - Day 3: Settings UI + testing
- **Lines of code:** ~1,500 lines
- **Files changed:** 7 files (3 backend, 2 frontend, 2 config)
- **Tests conducted:** Manual verification of all endpoints and UI flows
- **Data protected:** 1,796 books, 251 notes, complete reading history 🛡️

---

## [0.18.0] - 2026-01-04

### Added

#### Phase 8.7a: Session Format Tracking
Track which format (ebook, physical, audiobook, web) was used for each reading session.

- **Format column** — New `format` TEXT column in `reading_sessions` table
- **Format dropdown** — Session modal includes format picker (after End Date)
- **Format validation** — Backend validates format is one of: ebook, physical, audiobook, web
- **Format badges on sessions** — Reading History cards show format with color-coded badge:
  - 📱 Digital (blue)
  - 📖 Physical (amber)
  - 🎧 Audiobook (purple)
  - 🌐 Web (emerald)
- **Backward compatible** — Existing sessions display correctly with no format set
- **Empty string handling** — Users can clear format by selecting "— Not specified"

#### Phase 8.7b: Add Edition to Existing Title
Add new formats to existing books without creating duplicate title records.

- **"+ Add Format" button** — Appears on BookDetail page next to format badges
- **AddEditionModal** — Modal with format picker (Digital, Physical, Audiobook, Web)
- **POST /api/books/{id}/editions** — New endpoint to create edition records
- **Wishlist conversion** — Adding edition to wishlist item automatically converts to owned
- **Race condition handling** — Returns friendly error for concurrent duplicate edition attempts
- **Modal waits for refresh** — Modal stays open until book data refreshes (ensures errors visible)

#### Phase 8.7d: Merge Duplicate Titles Tool
Combine duplicate title records into a single consolidated entry.

- **"Merge Into..." menu option** — Available in BookDetail three-dot menu
- **MergeTitleModal** — Search for target title with preview of merge results
- **POST /api/titles/{id}/merge** — Merge endpoint that:
  - Moves all editions from source to target
  - Moves all reading sessions from source to target
  - Moves all notes from source to target
  - Moves all collection memberships from source to target
  - Deletes the empty source title
- **Duplicate check** — Prevents merging into self
- **Success navigation** — Navigates to merged title after completion

### Changed

- **Session models** — SessionCreate, SessionUpdate, SessionResponse now include optional `format` field
- **Session queries** — All SELECT/INSERT/UPDATE queries updated for format column

### Fixed

- **Format validation edge case** — Empty strings now allowed to clear format field
- **Merge modal state** — Modal properly closes and resets mergeSaving state after completion
- **Edition modal timing** — Modal waits for book refresh before closing

### Technical

#### Database Changes
- Migration: `ALTER TABLE reading_sessions ADD COLUMN format TEXT`
- Index: `CREATE INDEX IF NOT EXISTS idx_sessions_format ON reading_sessions(format)`

#### New Files
- `frontend/src/components/AddEditionModal.jsx` — Add format modal
- `frontend/src/components/MergeTitleModal.jsx` — Merge titles modal

#### Modified Files
- `backend/database.py` — Migration for format column
- `backend/routers/sessions.py` — Format field in all session operations
- `backend/routers/titles.py` — Create edition endpoint, merge endpoint
- `frontend/src/components/BookDetail.jsx` — Format dropdown in session modal, session badges, "+ Add Format" button, merge menu option
- `frontend/src/api.js` — createEdition(), mergeTitles() functions

---

## [0.17.0] - 2026-01-03

### Added

#### Phase 8.3: Book Detail Header Redesign
Complete redesign of the book detail header with metadata pill boxes.

- **Pill box layout** — Status, Rating, Category displayed as clickable pill boxes
- **Read time pill** — Shows estimated read time with microcopy (e.g., "2 hours / a short journey")
- **Clickable pills** — Status and Rating pills scroll to Reading History section
- **Rating descriptions** — Shows label like "Better than Good" under stars
- **Mobile centering** — Title, author, series centered on mobile, left-aligned on desktop
- **Larger mobile cover** — Cover size increased from w-28 to w-48 on mobile
- **Full source URL** — Source URL displayed in full below pills (not truncated)

#### Phase 8.4: Rating Label System
Customizable labels for each star rating with sensible defaults.

- **Rating settings UI** — New section in Settings drawer to customize rating labels
- **Default labels:**
  - 1 star: "Disliked"
  - 2 stars: "Disappointing"
  - 3 stars: "Decent/Fine"
  - 4 stars: "Better than Good"
  - 5 stars: "All-time Fav"
- **Persistent storage** — Labels saved to settings table
- **Live updates** — Rating descriptions update throughout app after saving

### Changed

- **Book detail header** — Complete layout redesign with pill boxes
- **Cover display** — Larger on mobile for better visual hierarchy
- **Rating display** — Now shows both stars and custom label

### Technical

#### New Settings
- `rating_label_1` through `rating_label_5` — Custom text for each star rating

#### Modified Files
- `frontend/src/components/BookDetail.jsx` — Header redesign
- `frontend/src/components/SettingsDrawer.jsx` — Rating labels section
- `frontend/src/hooks/useRatingLabels.js` — NEW - Custom hook for rating labels

---

*For earlier versions, see full CHANGELOG.md file.*
