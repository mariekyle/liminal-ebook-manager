"""
Sync API Router

Handles scanning book folders and importing/updating library data.
This is where the magic happens - reading your book folders and extracting metadata.

Phase 5 update: Now creates titles + editions instead of flat books table.
"""

import os
import json
import re
import aiosqlite
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel

from database import get_db, get_db_path
from constants import EXTENSION_TO_FORMAT, STORAGE_FORMATS
from services.metadata import extract_metadata
from services.covers import generate_cover_colors, extract_epub_cover
from services.backup import get_backup_settings, create_backup
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["sync"])

# Get books path from environment
BOOKS_PATH = os.getenv("BOOKS_PATH", "/books")


class SyncResult(BaseModel):
    """Result of a sync operation."""
    status: str
    added: int = 0
    updated: int = 0
    skipped: int = 0
    errors: int = 0
    total: int = 0
    orphaned: int = 0      # Titles marked as orphaned (folder missing)
    recovered: int = 0     # Previously orphaned titles now found
    editions_created: dict = {}       # S15: new editions per storage format
    duplicate_files_skipped: int = 0  # S15: same-format duplicate files in one folder
    missing_files: int = 0            # S15: edition files gone from disk (kept, not deleted)
    format_conflicts: int = 0         # S15: same format live in two folders for one title
    unmigrated_titles: int = 0        # S15: titles with file-backed 'ebook' rows (relabel pending)
    # S15.3b: the identities behind the four counters above, for the results
    # view — the same facts the container-log lines record, structured instead
    # of printed. Each list is capped at DETAIL_CAP entries; the counters stay
    # authoritative, so the view can say "and N more" past the cap.
    format_conflict_details: list = []    # {title_id, title, format, folders: [a, b]}
    duplicate_skip_details: list = []     # {folder, format, kept, skipped: [names]}
    missing_file_details: list = []       # {title_id, title, format, expected_path, folder}
    unmigrated_title_details: list = []   # {title_id, title, folder}
    message: str = ""


class SyncStatus(BaseModel):
    """Current sync status (for progress tracking)."""
    in_progress: bool
    current_book: Optional[str] = None
    current_operation: Optional[str] = None  # "sync" or "rescan"
    processed: int = 0
    total: int = 0


# Simple in-memory sync status (could be Redis for multi-worker setups)
_sync_status = SyncStatus(in_progress=False)

# S15.3b: per-list cap on stored finding details — keeps the persisted JSON
# blob bounded no matter how bad a sync gets. Counters are never capped.
DETAIL_CAP = 200

# Settings key holding the last completed/failed sync as JSON (S15.3b)
LAST_SYNC_RESULT_KEY = "last_sync_result"


def _append_detail(items: list, entry: dict) -> None:
    """Append a finding detail unless its list already holds DETAIL_CAP entries."""
    if len(items) < DETAIL_CAP:
        items.append(entry)


async def _conflicting_folders(db, title_id: int, storage_format: str, folder_str: str) -> list:
    """
    Both folder paths of a format conflict detected via the unique-index
    backstop, where only the losing folder is in scope — the winning edition's
    folder comes from the database. Falls back to the one known folder.
    """
    cursor = await db.execute(
        "SELECT folder_path FROM editions WHERE title_id = ? AND format = ?",
        [title_id, storage_format]
    )
    row = await cursor.fetchone()
    if row and row["folder_path"] and row["folder_path"] != folder_str:
        return [row["folder_path"], folder_str]
    return [folder_str]


async def _persist_sync_result(db, result: SyncResult) -> None:
    """
    Store the finished (or failed) SyncResult as JSON under LAST_SYNC_RESULT_KEY
    in the settings table, stamped with a UTC finished_at, so the results view
    survives page loads. Every _do_sync exit path calls this — including error
    exits, so "Last sync" never claims a clean state after a failed run.
    Persistence failure is logged, never raised: a sync must not fail because
    its report could not be saved (the caller still receives the live result).
    """
    try:
        payload = result.model_dump()
        payload["finished_at"] = datetime.now(timezone.utc).isoformat()
        await db.execute(
            """
            INSERT INTO settings (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = CURRENT_TIMESTAMP
            """,
            (LAST_SYNC_RESULT_KEY, json.dumps(payload)),
        )
        await db.commit()
    except Exception as e:
        logger.error(f"Could not store the sync result for the results view: {e}")


# --------------------------------------------------------------------------
# Folder Name Parsing (ported from Obsidian plugin)
# --------------------------------------------------------------------------

def parse_folder_name(folder_name: str) -> dict:
    """
    Parse book information from folder name.
    
    Supports formats:
    - "Author - [Series ##] Title"
    - "Author - [Series ##]Title" (no space after bracket)
    - "Author1, Author2 - [Series ##] Title"
    - "Author - Title"
    - "Author1, Author2 - Title"
    
    Returns dict with: title, authors, series, series_number
    """
    result = {
        "title": folder_name,
        "authors": [],
        "series": None,
        "series_number": None
    }
    
    # Split on " - " to separate author from rest
    dash_index = folder_name.find(" - ")
    
    if dash_index > 0:
        authors_part = folder_name[:dash_index]
        rest_part = folder_name[dash_index + 3:]
        
        # Parse multiple authors (separated by &, "and", or comma)
        authors = re.split(r'[&,]|(?:\sand\s)', authors_part, flags=re.IGNORECASE)
        result["authors"] = [a.strip() for a in authors if a.strip()]
        
        # Check for series format: [Series name ##] or [Series name ##]Title
        series_match = re.match(r'^\[(.*?)\s+(\d+(?:\.\d+)?)\]\s*(.+)$', rest_part)
        
        if series_match:
            result["series"] = series_match.group(1).strip()
            result["series_number"] = series_match.group(2)
            result["title"] = series_match.group(3).strip()
        else:
            result["title"] = rest_part
    else:
        # No author in folder name
        result["authors"] = ["Unknown Author"]
    
    return result


def folder_contains_books(folder_path: Path) -> bool:
    """Check if a folder contains book files (hidden files don't count)."""
    try:
        for item in folder_path.iterdir():
            if (item.is_file() and not item.name.startswith('.')
                    and item.suffix.lower() in EXTENSION_TO_FORMAT):
                return True
    except PermissionError:
        pass

    return False


def discover_book_files(folder_path: Path) -> tuple[dict, list]:
    """
    Discover every recognized book file in a folder, one per storage format.

    Returns ({storage_format: Path}, [skipped Paths]). When a folder holds
    the same storage format twice (two epubs, or an .html and an .htm), the
    alphabetically first file wins and the rest are skipped — deterministic
    pick, locked decision (Decisions 2026-07-10).
    """
    files_by_format = {}
    skipped = []
    try:
        # Hidden files excluded — macOS/SMB AppleDouble siblings ("._x.epub")
        # carry real extensions and would otherwise win the alphabetical pick
        candidates = sorted(
            (item for item in folder_path.iterdir()
             if item.is_file() and not item.name.startswith('.')
             and item.suffix.lower() in EXTENSION_TO_FORMAT),
            key=lambda p: p.name,
        )
    except PermissionError:
        return files_by_format, skipped

    for item in candidates:
        storage_format = EXTENSION_TO_FORMAT[item.suffix.lower()]
        if storage_format in files_by_format:
            skipped.append(item)
        else:
            files_by_format[storage_format] = item

    return files_by_format, skipped


def folder_has_format(folder_str: str, storage_format: str) -> bool:
    """
    True if the folder still holds a (non-hidden) file of this storage format.
    Used to tell a live same-format conflict apart from a relocation whose old
    folder survives but no longer contains the file.
    """
    try:
        for item in Path(folder_str).iterdir():
            if (item.is_file() and not item.name.startswith('.')
                    and EXTENSION_TO_FORMAT.get(item.suffix.lower()) == storage_format):
                return True
    except (OSError, PermissionError):
        return False
    return False


def get_book_folders(root_path: Path) -> list[Path]:
    """
    Recursively find all folders containing book files.
    
    This handles nested structures like:
    - Fiction/Author Name/Book Title/
    - Fiction/Author - [Series] Title/
    """
    book_folders = []
    
    try:
        for item in root_path.iterdir():
            # Skip hidden folders
            if item.name.startswith('.'):
                continue
            
            if item.is_dir():
                if folder_contains_books(item):
                    book_folders.append(item)
                else:
                    # Recurse into subdirectories
                    book_folders.extend(get_book_folders(item))
    except PermissionError:
        pass
    
    return book_folders


async def find_existing_title_by_content(db, title: str, authors: list[str]) -> Optional[dict]:
    """
    Find existing title by title and first author.
    Used to preserve category when folder paths change.
    """
    if not authors:
        return None
    
    first_author = authors[0]
    cursor = await db.execute(
        """SELECT t.id, t.category 
           FROM titles t
           WHERE t.title = ? AND t.authors LIKE ?""",
        [title, f'%"{first_author}"%']
    )
    return await cursor.fetchone()


async def find_existing_title_by_folder(db, folder_str: str) -> Optional[dict]:
    """
    Find existing title by folder path (via editions table).
    """
    cursor = await db.execute(
        """SELECT t.id, t.category 
           FROM titles t
           JOIN editions e ON e.title_id = t.id
           WHERE e.folder_path = ?""",
        [folder_str]
    )
    return await cursor.fetchone()


def detect_fanfiction(parsed: dict, authors: list[str]) -> tuple[bool, str]:
    """
    Detect if a book is likely FanFiction based on metadata patterns.
    
    Returns:
        tuple: (is_fanfiction: bool, reason: str)
    """
    reasons = []
    
    # --- Check tags ---
    tags = parsed.get("tags", [])
    if tags:
        tags_lower = [t.lower() if isinstance(t, str) else "" for t in tags]
        
        fanfic_tag_patterns = [
            "fanworks", "fanfiction", "fanfic", "ao3", "archive of our own",
            "fandom", "fan fiction", "transformative work"
        ]
        for pattern in fanfic_tag_patterns:
            if any(pattern in tag for tag in tags_lower):
                reasons.append(f"tag contains '{pattern}'")
                break
        
        # Ship patterns: "Character/Character" or "Character x Character"
        ship_patterns = [
            r'\w+\s*/\s*\w+',  # Name/Name
            r'\w+\s*x\s*\w+',  # Name x Name  
        ]
        for tag in tags_lower:
            for pattern in ship_patterns:
                if re.search(pattern, tag, re.IGNORECASE):
                    reasons.append("ship tag detected")
                    break
            if reasons:
                break
    
    # --- Check author patterns ---
    if authors:
        for author in authors:
            author_lower = author.lower()
            # Username patterns
            if re.search(r'^\w+_\w+$', author):  # underscore_style
                reasons.append(f"author '{author}' looks like username")
            elif re.search(r'^\w+\d{2,}$', author):  # name followed by numbers
                reasons.append(f"author '{author}' has number suffix")
    
    # --- Check summary ---
    summary = parsed.get("summary", "")
    if summary:
        summary_lower = summary.lower()
        fanfic_summary_patterns = [
            "ao3", "archive of our own", "fanfiction", "fanfic",
            "between chapters", "one-shot", "oneshot",
            "based on", "inspired by", "au where", "alternate universe",
            "kudos", "bookmarks"
        ]
        for pattern in fanfic_summary_patterns:
            if pattern in summary_lower:
                reasons.append(f"summary contains '{pattern}'")
                break
    
    # --- Check title patterns ---
    title = parsed.get("title", "")
    if title:
        title_lower = title.lower()
        # Common fanfic title patterns
        if re.search(r'\[.*?\]', title):  # Brackets in title
            if any(x in title_lower for x in ["wip", "complete", "abandoned", "hiatus"]):
                reasons.append("title has fanfic status markers")
    
    is_fanfic = len(reasons) > 0
    reason = "; ".join(reasons) if reasons else ""
    
    return is_fanfic, reason


def determine_category_from_path(folder_path: Path, root_path: Path) -> Optional[str]:
    """
    Determine book category from folder path structure.
    Checks if any part of the path contains Fiction, Non-Fiction, or FanFiction.
    """
    relative_path = folder_path.relative_to(root_path)
    path_parts = str(relative_path).lower().split(os.sep)
    
    # Check each part of the path for category indicators
    for part in path_parts:
        if 'fanfiction' in part or 'fan-fiction' in part or 'fan fiction' in part:
            return 'FanFiction'
        elif 'non-fiction' in part or 'nonfiction' in part or 'non fiction' in part:
            return 'Non-Fiction'
        elif 'fiction' in part:
            return 'Fiction'
    
    return None


# --------------------------------------------------------------------------
# Standalone Sync (for background tasks)
# --------------------------------------------------------------------------

async def run_sync_standalone(full: bool = False) -> SyncResult:
    """
    Run sync operation with its own database connection.
    Used by background tasks that can't use FastAPI's Depends.
    """
    db_path = get_db_path()
    if not db_path:
        return SyncResult(status="error", message="Database not initialized")
    
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA foreign_keys = ON")
        return await _do_sync(db, full)


async def _do_sync(db, full: bool = False) -> SyncResult:
    """Core sync logic, shared between endpoint and standalone."""
    global _sync_status
    
    books_root = Path(BOOKS_PATH)
    
    # Scanning can fail outright (dead mount, folder vanishing mid-walk, the
    # I/O errors a network share is prone to) — every outcome here must still
    # be persisted, or the results view keeps presenting the previous run
    try:
        books_path_exists = books_root.exists()
        book_folders = get_book_folders(books_root) if books_path_exists else []
    except Exception as e:
        logger.error(f"Sync could not scan the library folders: {e}")
        result = SyncResult(
            status="error",
            message="Sync didn't finish. Your data is safe — try again?"
        )
        await _persist_sync_result(db, result)
        return result

    if not books_path_exists:
        # Full path in the logs only — this message renders on the results page
        logger.error(f"Sync: books path does not exist: {BOOKS_PATH}")
        result = SyncResult(
            status="error",
            message="Couldn't reach the library folder. Check that it's connected, then try again."
        )
        await _persist_sync_result(db, result)
        return result

    if not book_folders:
        result = SyncResult(
            status="complete",
            message="No book folders found"
        )
        await _persist_sync_result(db, result)
        return result
    
    # Update sync status
    _sync_status = SyncStatus(
        in_progress=True,
        total=len(book_folders)
    )
    
    result = SyncResult(status="complete", total=len(book_folders))
    
    # Track all found folder paths for orphan detection
    found_folder_paths = set()
    
    try:
        for folder in book_folders:
            _sync_status.current_book = folder.name
            _sync_status.processed += 1
            
            folder_str = str(folder)
            found_folder_paths.add(folder_str)  # Track this folder
            
            # Check if title already exists by folder_path (via editions)
            existing = await find_existing_title_by_folder(db, folder_str)
            existing_category = None
            
            if not existing:
                # Folder path changed - try matching by title+author
                parsed_temp = parse_folder_name(folder.name)
                
                if parsed_temp["authors"] and parsed_temp["authors"] != ["Unknown Author"]:
                    existing = await find_existing_title_by_content(
                        db, 
                        parsed_temp["title"], 
                        parsed_temp["authors"]
                    )
                    if existing:
                        existing_category = existing["category"]
                        print(f"Matched existing title by content: {parsed_temp['title']}")
            elif existing:
                existing_category = existing["category"] if "category" in existing.keys() else None
            
            if existing and not full:
                # For non-full sync, check if edition with this folder already exists
                cursor = await db.execute(
                    "SELECT id FROM editions WHERE folder_path = ?",
                    [folder_str]
                )
                if await cursor.fetchone():
                    result.skipped += 1
                    continue
            
            try:
                # Parse folder name for basic info
                parsed = parse_folder_name(folder.name)

                # Discover every recognized book file, one per storage format (S15)
                files_by_format, duplicate_files = discover_book_files(folder)
                if duplicate_files:
                    result.duplicate_files_skipped += len(duplicate_files)
                    skipped_by_format = {}
                    for dup in duplicate_files:
                        dup_format = EXTENSION_TO_FORMAT[dup.suffix.lower()]
                        skipped_by_format.setdefault(dup_format, []).append(dup.name)
                        print(f"Sync: same-format duplicate skipped in {folder_str}: {dup.name}")
                    for dup_format, skipped_names in skipped_by_format.items():
                        kept_file = files_by_format.get(dup_format)
                        _append_detail(result.duplicate_skip_details, {
                            "folder": folder_str,
                            "format": dup_format,
                            "kept": kept_file.name if kept_file else None,
                            # Inner list capped too — a single 2,000-file folder
                            # must not blow up the stored blob; the counter
                            # keeps the true total
                            "skipped": skipped_names[:DETAIL_CAP],
                        })

                # Best file for metadata extraction (epub-preferred order)
                book_file = next(
                    (files_by_format[f] for f in STORAGE_FORMATS if f in files_by_format),
                    None
                )
                
                # Try to extract richer metadata from the file
                if book_file:
                    try:
                        file_metadata = await extract_metadata(book_file)
                        
                        # =======================================================
                        # PHASE 9B: File metadata is PRIMARY for title/authors
                        # Folder name parsing is now just the FALLBACK
                        # =======================================================
                        
                        # Title: Use file metadata if available and valid
                        file_title = file_metadata.get("title", "").strip() if file_metadata.get("title") else ""
                        if file_title and len(file_title) > 2:
                            # Check it's not a placeholder/invalid title
                            invalid_titles = ["unknown", "untitled", "no title", "title"]
                            if file_title.lower() not in invalid_titles:
                                parsed["title"] = file_title
                        
                        # Authors: Use file metadata if available and valid
                        file_authors = file_metadata.get("authors", [])
                        if file_authors:
                            # Filter out empty strings and whitespace
                            file_authors = [a.strip() for a in file_authors if a and a.strip()]
                            # Check they're not placeholder authors
                            invalid_authors = ["unknown", "unknown author", "author", "anonymous"]
                            valid_authors = [a for a in file_authors if a.lower() not in invalid_authors]
                            if valid_authors:
                                parsed["authors"] = valid_authors
                        
                        # =======================================================
                        # END PHASE 9B - Rest of metadata merge unchanged
                        # =======================================================
                        
                        # Merge other fields: prefer extracted over parsed
                        if file_metadata.get("publication_year"):
                            parsed["publication_year"] = file_metadata["publication_year"]
                        if file_metadata.get("summary"):
                            parsed["summary"] = file_metadata["summary"]
                        if file_metadata.get("tags"):
                            parsed["tags"] = file_metadata["tags"]
                        if file_metadata.get("word_count"):
                            parsed["word_count"] = file_metadata["word_count"]
                        
                        # Enhanced metadata fields (Phase 7.1)
                        if file_metadata.get("fandom"):
                            parsed["fandom"] = file_metadata["fandom"]
                        if file_metadata.get("relationships"):
                            parsed["relationships"] = file_metadata["relationships"]
                        if file_metadata.get("characters"):
                            parsed["characters"] = file_metadata["characters"]
                        if file_metadata.get("content_rating"):
                            parsed["content_rating"] = file_metadata["content_rating"]
                        if file_metadata.get("ao3_warnings"):
                            parsed["ao3_warnings"] = file_metadata["ao3_warnings"]
                        if file_metadata.get("ao3_category"):
                            parsed["ao3_category"] = file_metadata["ao3_category"]
                        if file_metadata.get("source_url"):
                            parsed["source_url"] = file_metadata["source_url"]
                        if file_metadata.get("isbn"):
                            parsed["isbn"] = file_metadata["isbn"]
                        if file_metadata.get("publisher"):
                            parsed["publisher"] = file_metadata["publisher"]
                        if file_metadata.get("chapter_count") is not None:
                            parsed["chapter_count"] = file_metadata["chapter_count"]
                        if file_metadata.get("completion_status"):
                            parsed["completion_status"] = file_metadata["completion_status"]
                        # Calibre series extraction
                        if file_metadata.get("series") and not parsed.get("series"):
                            parsed["series"] = file_metadata["series"]
                        if file_metadata.get("series_number") and not parsed.get("series_number"):
                            parsed["series_number"] = file_metadata["series_number"]
                    except Exception as e:
                        print(f"Metadata extraction failed for {book_file}: {e}")
                
                # Generate cover colors
                author_for_color = parsed["authors"][0] if parsed["authors"] else "Unknown"
                color1, color2 = generate_cover_colors(parsed["title"], author_for_color)
                
                # Determine category
                if existing_category:
                    category = existing_category
                else:
                    category = determine_category_from_path(folder, books_root)
                    
                    if not category:
                        is_fanfic, detection_reason = detect_fanfiction(parsed, parsed.get("authors", []))
                        if is_fanfic:
                            category = "FanFiction"
                            print(f"Auto-detected FanFiction: {parsed.get('title', folder.name)} - Reason: {detection_reason}")
                        else:
                            category = "Uncategorized"
                
                if existing:
                    # Check if this was previously orphaned (for recovery tracking)
                    cursor = await db.execute(
                        "SELECT is_orphaned FROM titles WHERE id = ?",
                        [existing["id"]]
                    )
                    orphan_row = await cursor.fetchone()
                    was_orphaned = orphan_row and orphan_row["is_orphaned"] == 1
                    
                    # Update existing title (and recover if orphaned)
                    # Only update enhanced fields if they have new values (preserve user edits)
                    await db.execute(
                        """UPDATE titles SET
                            title = ?, authors = ?, series = COALESCE(?, series), series_number = COALESCE(?, series_number),
                            category = ?, publication_year = COALESCE(?, publication_year), word_count = COALESCE(?, word_count),
                            summary = COALESCE(?, summary), tags = CASE WHEN ? != '[]' THEN ? ELSE tags END,
                            cover_color_1 = ?, cover_color_2 = ?,
                            fandom = COALESCE(?, fandom),
                            relationships = COALESCE(?, relationships),
                            characters = COALESCE(?, characters),
                            content_rating = COALESCE(?, content_rating),
                            ao3_warnings = COALESCE(?, ao3_warnings),
                            ao3_category = COALESCE(?, ao3_category),
                            source_url = COALESCE(?, source_url),
                            isbn = COALESCE(?, isbn),
                            publisher = COALESCE(?, publisher),
                            chapter_count = COALESCE(?, chapter_count),
                            completion_status = COALESCE(?, completion_status),
                            is_orphaned = 0,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?""",
                        [
                            parsed["title"], json.dumps(parsed["authors"]),
                            parsed.get("series"), parsed.get("series_number"),
                            category, parsed.get("publication_year"),
                            parsed.get("word_count"), parsed.get("summary"),
                            json.dumps(parsed.get("tags", [])), json.dumps(parsed.get("tags", [])),
                            color1, color2,
                            parsed.get("fandom"),
                            parsed.get("relationships"),
                            parsed.get("characters"),
                            parsed.get("content_rating"),
                            parsed.get("ao3_warnings"),
                            parsed.get("ao3_category"),
                            parsed.get("source_url"),
                            parsed.get("isbn"),
                            parsed.get("publisher"),
                            parsed.get("chapter_count"),
                            parsed.get("completion_status"),
                            existing["id"]
                        ]
                    )
                    
                    if was_orphaned:
                        result.recovered += 1
                        print(f"Recovered orphaned title: {parsed['title']}")
                    
                    # Aborted-relabel guard: a file-backed 'ebook' edition on
                    # this title means the S15 relabel migration hasn't
                    # succeeded here. Creating storage-format rows now would
                    # duplicate the same files AND permanently block the
                    # relabel (unique-index collision at every startup) —
                    # defer reconciliation until the migration has run clean.
                    cursor = await db.execute(
                        "SELECT id FROM editions WHERE title_id = ? AND format = 'ebook' AND file_path IS NOT NULL",
                        [existing["id"]]
                    )
                    if await cursor.fetchone():
                        result.unmigrated_titles += 1
                        _append_detail(result.unmigrated_title_details, {
                            "title_id": existing["id"],
                            "title": parsed["title"],
                            "folder": folder_str,
                        })
                        print(
                            f"Sync: title {existing['id']} still has a file-backed 'ebook' "
                            f"edition (relabel migration pending) — edition reconciliation "
                            f"deferred for {folder_str}"
                        )
                    else:
                        # Reconcile editions per storage format (S15): matched by
                        # (folder_path, storage format) — sync never writes 'ebook'.
                        # Non-storage formats (physical/audiobook/web/file-less
                        # 'ebook') are invisible here: never updated, never deleted.
                        for storage_format, discovered_file in files_by_format.items():
                            file_str = str(discovered_file)
                            cursor = await db.execute(
                                "SELECT id, file_path FROM editions WHERE folder_path = ? AND format = ?",
                                [folder_str, storage_format]
                            )
                            edition = await cursor.fetchone()
                            if edition:
                                if edition["file_path"] != file_str:
                                    await db.execute(
                                        "UPDATE editions SET file_path = ? WHERE id = ?",
                                        [file_str, edition["id"]]
                                    )
                                continue

                            # No edition for this format in this folder — the title
                            # may still hold one elsewhere (folder moved, or the
                            # same format is live in two folders)
                            cursor = await db.execute(
                                "SELECT id, folder_path FROM editions WHERE title_id = ? AND format = ?",
                                [existing["id"], storage_format]
                            )
                            title_edition = await cursor.fetchone()
                            if title_edition:
                                old_folder = title_edition["folder_path"]
                                if (old_folder and old_folder != folder_str
                                        and folder_has_format(old_folder, storage_format)):
                                    # Same format live in two folders — keep both
                                    # untouched, surface in the summary
                                    result.format_conflicts += 1
                                    _append_detail(result.format_conflict_details, {
                                        "title_id": existing["id"],
                                        "title": parsed["title"],
                                        "format": storage_format,
                                        "folders": [old_folder, folder_str],
                                    })
                                    print(
                                        f"Sync: format conflict for title {existing['id']} "
                                        f"({storage_format}): {old_folder} vs {folder_str} — skipped"
                                    )
                                else:
                                    # Folder moved / old folder no longer holds this
                                    # format / file-less placeholder — re-point
                                    # instead of duplicating
                                    await db.execute(
                                        "UPDATE editions SET file_path = ?, folder_path = ? WHERE id = ?",
                                        [file_str, folder_str, title_edition["id"]]
                                    )
                                    print(
                                        f"Sync: relocated {storage_format} edition of title "
                                        f"{existing['id']} to {folder_str}"
                                    )
                            else:
                                try:
                                    await db.execute(
                                        """INSERT INTO editions (title_id, format, file_path, folder_path, acquired_date)
                                        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)""",
                                        [existing["id"], storage_format, file_str, folder_str]
                                    )
                                    result.editions_created[storage_format] = (
                                        result.editions_created.get(storage_format, 0) + 1
                                    )
                                except aiosqlite.IntegrityError:
                                    # Race backstop, same shape as the pre-check above
                                    result.format_conflicts += 1
                                    _append_detail(result.format_conflict_details, {
                                        "title_id": existing["id"],
                                        "title": parsed["title"],
                                        "format": storage_format,
                                        "folders": await _conflicting_folders(
                                            db, existing["id"], storage_format, folder_str
                                        ),
                                    })
                                    print(
                                        f"Sync: insert collision for title {existing['id']} "
                                        f"({storage_format}) in {folder_str} — skipped"
                                    )

                        # Files gone from disk: report, never delete (S14 stale-path stance)
                        cursor = await db.execute(
                            "SELECT format, file_path FROM editions WHERE folder_path = ?",
                            [folder_str]
                        )
                        folder_editions = await cursor.fetchall()
                        for folder_edition in folder_editions:
                            if (folder_edition["format"] in STORAGE_FORMATS
                                    and folder_edition["format"] not in files_by_format):
                                result.missing_files += 1
                                _append_detail(result.missing_file_details, {
                                    "title_id": existing["id"],
                                    "title": parsed["title"],
                                    "format": folder_edition["format"],
                                    "expected_path": folder_edition["file_path"],
                                    "folder": folder_str,
                                })
                                print(
                                    f"Sync: file missing for {folder_edition['format']} edition in "
                                    f"{folder_str} ({folder_edition['file_path']}) — edition kept"
                                )
                    
                    # Extract cover from EPUB if available (Phase 9C)
                    # Only for titles without covers or without custom covers
                    # Skip FanFiction - they use gradient covers only
                    epub_path = str(book_file) if book_file and str(book_file).lower().endswith('.epub') else None
                    if epub_path and category != 'FanFiction':
                        try:
                            # Check if title already has a cover
                            cover_cursor = await db.execute(
                                "SELECT has_cover, cover_source FROM titles WHERE id = ?",
                                (existing["id"],)
                            )
                            cover_row = await cover_cursor.fetchone()
                            
                            # Only extract if no cover or no custom cover
                            should_extract = (
                                not cover_row or 
                                not cover_row[0] or 
                                cover_row[1] != 'custom'
                            )
                            
                            if should_extract:
                                cover_path = extract_epub_cover(epub_path, existing["id"])
                                if cover_path:
                                    await db.execute("""
                                        UPDATE titles 
                                        SET cover_path = ?, has_cover = 1, cover_source = 'extracted'
                                        WHERE id = ?
                                    """, (cover_path, existing["id"]))
                                elif cover_row and cover_row[1] == 'extracted':
                                    # Clear stale extracted cover status if re-extraction found no cover
                                    await db.execute("""
                                        UPDATE titles 
                                        SET cover_path = NULL, has_cover = 0, cover_source = NULL
                                        WHERE id = ?
                                    """, (existing["id"],))
                        except Exception as e:
                            logger.warning(f"Cover extraction failed for title {existing['id']}: {e}")
                            # Don't fail sync if cover extraction fails
                    
                    result.updated += 1
                else:
                    # Insert new title with all enhanced metadata
                    cursor = await db.execute(
                        """INSERT INTO titles 
                            (title, authors, series, series_number, category,
                             publication_year, word_count, summary, tags,
                             cover_color_1, cover_color_2,
                             fandom, relationships, characters, content_rating,
                             ao3_warnings, ao3_category, source_url, isbn, publisher,
                             chapter_count, completion_status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        [
                            parsed["title"], json.dumps(parsed["authors"]),
                            parsed.get("series"), parsed.get("series_number"),
                            category, parsed.get("publication_year"),
                            parsed.get("word_count"), parsed.get("summary"),
                            json.dumps(parsed.get("tags", [])),
                            color1, color2,
                            parsed.get("fandom"),
                            parsed.get("relationships"),
                            parsed.get("characters"),
                            parsed.get("content_rating"),
                            parsed.get("ao3_warnings"),
                            parsed.get("ao3_category"),
                            parsed.get("source_url"),
                            parsed.get("isbn"),
                            parsed.get("publisher"),
                            parsed.get("chapter_count"),
                            parsed.get("completion_status")
                        ]
                    )
                    title_id = cursor.lastrowid
                    
                    # Insert one edition per discovered storage format (S15) —
                    # sync never writes 'ebook'
                    for storage_format, discovered_file in files_by_format.items():
                        try:
                            await db.execute(
                                """INSERT INTO editions (title_id, format, file_path, folder_path, acquired_date)
                                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)""",
                                [title_id, storage_format, str(discovered_file), folder_str]
                            )
                            result.editions_created[storage_format] = (
                                result.editions_created.get(storage_format, 0) + 1
                            )
                        except aiosqlite.IntegrityError:
                            result.format_conflicts += 1
                            _append_detail(result.format_conflict_details, {
                                "title_id": title_id,
                                "title": parsed["title"],
                                "format": storage_format,
                                "folders": await _conflicting_folders(
                                    db, title_id, storage_format, folder_str
                                ),
                            })
                            print(
                                f"Sync: insert collision for new title {title_id} "
                                f"({storage_format}) in {folder_str} — skipped"
                            )
                    
                    # Extract cover from EPUB if available (Phase 9C)
                    # Skip FanFiction - they use gradient covers only
                    epub_path = str(book_file) if book_file and str(book_file).lower().endswith('.epub') else None
                    if epub_path and title_id and category != 'FanFiction':
                        try:
                            cover_path = extract_epub_cover(epub_path, title_id)
                            if cover_path:
                                await db.execute("""
                                    UPDATE titles 
                                    SET cover_path = ?, has_cover = 1, cover_source = 'extracted'
                                    WHERE id = ?
                                """, (cover_path, title_id))
                        except Exception as e:
                            logger.warning(f"Cover extraction failed for title {title_id}: {e}")
                            # Don't fail sync if cover extraction fails
                    
                    result.added += 1
                
                await db.commit()
                
            except Exception as e:
                print(f"Error processing {folder}: {e}")
                result.errors += 1
                # Discard this folder's half-applied writes so a later commit
                # (next folder, orphan pass, result persist) can't flush them
                try:
                    await db.rollback()
                except Exception as rollback_error:
                    print(f"Rollback after folder error also failed: {rollback_error}")

        # =====================================================================
        # ORPHAN DETECTION: Find editions with missing folders
        # =====================================================================
        try:
            # Find all editions with folder_path that are NOT in our found_folder_paths
            # Only check ebook editions (they have folder_path), exclude TBR/manual entries
            cursor = await db.execute("""
                SELECT DISTINCT e.folder_path, t.id as title_id, t.title, t.is_orphaned
                FROM editions e
                JOIN titles t ON t.id = e.title_id
                WHERE e.folder_path IS NOT NULL
                  AND t.is_tbr = 0
            """)
            all_editions = await cursor.fetchall()

            # Group folders per title: a title is orphaned only when NONE of
            # its edition folders survives (Decisions 2026-07-10 — titles can
            # legitimately span two folders since S15; one live folder keeps
            # the title un-orphaned). Single-folder titles behave as before.
            title_folders = {}
            for edition in all_editions:
                entry = title_folders.setdefault(edition["title_id"], {
                    "title": edition["title"],
                    "already_orphaned": edition["is_orphaned"] == 1,
                    "folders": [],
                })
                entry["folders"].append(edition["folder_path"])

            orphaned_count = 0
            for title_id, entry in title_folders.items():
                # Check found folders first; double-check the filesystem
                # (in case of path format differences)
                all_folders_dead = all(
                    folder_path not in found_folder_paths and not os.path.exists(folder_path)
                    for folder_path in entry["folders"]
                )
                if all_folders_dead and not entry["already_orphaned"]:
                    # Mark as orphaned
                    await db.execute(
                        "UPDATE titles SET is_orphaned = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        [title_id]
                    )
                    orphaned_count += 1
                    print(f"Marked as orphaned: {entry['title']} (folders: {', '.join(entry['folders'])})")
            
            if orphaned_count > 0:
                await db.commit()
                result.orphaned = orphaned_count
        
        except Exception as e:
            print(f"Error during orphan detection: {e}")
        
        # Build result message
        msg_parts = [f"Sync complete: {result.added} added, {result.updated} updated, {result.skipped} skipped"]
        if result.recovered > 0:
            msg_parts.append(f"{result.recovered} recovered")
        if result.orphaned > 0:
            msg_parts.append(f"{result.orphaned} orphaned")
        editions_created_total = sum(result.editions_created.values())
        if editions_created_total > 0:
            per_format = ", ".join(
                f"{count} {fmt}" for fmt, count in sorted(result.editions_created.items())
            )
            msg_parts.append(f"{editions_created_total} editions created ({per_format})")
        if result.duplicate_files_skipped > 0:
            msg_parts.append(f"{result.duplicate_files_skipped} same-format duplicate files skipped")
        if result.missing_files > 0:
            msg_parts.append(f"{result.missing_files} edition files missing (kept, not deleted)")
        if result.format_conflicts > 0:
            msg_parts.append(f"{result.format_conflicts} format conflicts")
        if result.unmigrated_titles > 0:
            msg_parts.append(
                f"{result.unmigrated_titles} titles deferred (unmigrated 'ebook' editions — "
                "run again after the relabel migration succeeds)"
            )
        if result.errors > 0:
            msg_parts.append(f"{result.errors} errors")
        result.message = ", ".join(msg_parts)

    except Exception as e:
        # S15.3b: an unexpected mid-sync crash used to vanish into an HTTP 500
        # with the SyncResult lost. Record the interrupted run instead, so the
        # results view never shows a stale clean state after a failed sync.
        # Per-folder commits already applied stay; the open partial transaction
        # is rolled back before the error record is written.
        logger.error(f"Sync stopped partway ({type(e).__name__}): {e}")
        try:
            await db.rollback()
        except Exception as rollback_error:
            logger.error(f"Rollback after interrupted sync also failed: {rollback_error}")
        result.status = "error"
        result.message = "Sync didn't finish. Your data is safe — try again?"

    finally:
        _sync_status = SyncStatus(in_progress=False)

    await _persist_sync_result(db, result)
    return result


# --------------------------------------------------------------------------
# Sync Endpoints
# --------------------------------------------------------------------------

@router.get("/sync/status", response_model=SyncStatus)
async def get_sync_status():
    """Get current sync status."""
    return _sync_status


@router.post("/sync", response_model=SyncResult)
async def sync_library(
    background_tasks: BackgroundTasks,
    full: bool = False,
    db = Depends(get_db)
):
    """
    Scan book folders and sync to database.
    
    Args:
        full: If True, re-scan all books. If False, only scan new folders.
    """
    global _sync_status
    
    if _sync_status.in_progress:
        return SyncResult(
            status="already_running",
            message="A sync is already in progress"
        )
    
    # Phase 9A: Create pre-sync backup if enabled
    try:
        backup_settings = await get_backup_settings(db)
        if backup_settings.get('backup_enabled') and backup_settings.get('backup_schedule') in ('before_sync', 'both'):
            db_path = get_db_path()
            await create_backup(db, backup_type='pre_sync', db_path=db_path)
            print("Pre-sync backup created")
    except Exception as e:
        # Don't fail sync if backup fails - just log it
        print(f"Pre-sync backup failed (continuing with sync): {e}")
    
    return await _do_sync(db, full)


# --------------------------------------------------------------------------
# Rescan Metadata Endpoints (Phase 7.0)
# --------------------------------------------------------------------------

@router.post("/sync/rescan-metadata")
async def rescan_metadata(
    category: Optional[str] = None,
    db = Depends(get_db)
):
    """
    Re-extract enhanced metadata from all ebook files.
    
    This updates:
    - Fandom, relationships, characters (from AO3 tags)
    - Content rating, warnings, category (from AO3 tags)
    - Source URL (from FanFicFare/Wattpad)
    - ISBN, publisher (from published books)
    - Series info (from Calibre metadata)
    - Completion status (from tags/summary)
    - Chapter count (from manifest)
    
    Args:
        category: Optional filter - only rescan books in this category
    """
    global _sync_status
    
    # Prevent concurrent operations
    if _sync_status.in_progress:
        return {"error": "A sync operation is already in progress. Please wait."}
    
    _sync_status.in_progress = True
    _sync_status.current_operation = "rescan"
    
    try:
        results = {
            "total": 0,
            "updated": 0,
            "skipped_no_file": 0,
            "skipped_no_epub": 0,
            "errors": 0,
            "details": {
                "ao3_parsed": 0,
                "source_urls_found": 0,
                "series_extracted": 0,
                "isbn_found": 0,
                "completion_status_detected": 0,
            }
        }
        
        # Build query with optional category filter BEFORE GROUP BY
        where_clause = "(t.is_tbr = 0 OR t.is_tbr IS NULL)"
        params = []
        
        if category:
            where_clause += " AND t.category = ?"
            params.append(category)
        
        query = f"""
            SELECT t.id, t.title, e.file_path, e.folder_path, t.category,
                   t.series, t.fandom, t.source_url, t.relationships, t.characters,
                   t.content_rating, t.ao3_warnings, t.ao3_category, t.publisher,
                   t.isbn, t.chapter_count, t.completion_status, t.tags
            FROM titles t
            LEFT JOIN editions e ON t.id = e.title_id
            WHERE {where_clause}
            GROUP BY t.id
        """
        
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        
        results["total"] = len(rows)
        
        for row in rows:
            title_id = row[0]
            title_name = row[1]
            file_path = row[2]
            folder_path = row[3]
            current_category = row[4]
            current_series = row[5]
            current_fandom = row[6]
            current_source_url = row[7]
            current_relationships = row[8]
            current_characters = row[9]
            current_content_rating = row[10]
            current_ao3_warnings = row[11]
            current_ao3_category = row[12]
            current_publisher = row[13]
            current_isbn = row[14]
            current_chapter_count = row[15]
            current_completion_status = row[16]
            current_tags = row[17]
            
            # Find the ebook file
            epub_path = None
            
            if file_path and Path(file_path).exists():
                if file_path.lower().endswith('.epub'):
                    epub_path = file_path
            elif folder_path and Path(folder_path).exists():
                # Look for EPUB in folder
                folder = Path(folder_path)
                epubs = list(folder.glob('*.epub')) + list(folder.glob('*.EPUB'))
                if epubs:
                    epub_path = str(epubs[0])
            
            if not epub_path:
                results["skipped_no_epub"] += 1
                continue
            
            if not Path(epub_path).exists():
                results["skipped_no_file"] += 1
                continue
            
            try:
                # Extract metadata
                metadata = await extract_metadata(Path(epub_path))
                
                if not metadata:
                    results["errors"] += 1
                    continue
                
                # Build update query - only update fields that have new values
                updates = []
                values = []
                
                # Fandom (only if not already set)
                if metadata.get("fandom") and not current_fandom:
                    updates.append("fandom = ?")
                    values.append(metadata["fandom"])
                    results["details"]["ao3_parsed"] += 1
                
                # Relationships (only if not already set)
                if metadata.get("relationships") and not current_relationships:
                    updates.append("relationships = ?")
                    values.append(metadata["relationships"])
                
                # Characters (only if not already set)
                if metadata.get("characters") and not current_characters:
                    updates.append("characters = ?")
                    values.append(metadata["characters"])
                
                # Content rating (only if not already set)
                if metadata.get("content_rating") and not current_content_rating:
                    updates.append("content_rating = ?")
                    values.append(metadata["content_rating"])
                
                # AO3 warnings (only if not already set)
                if metadata.get("ao3_warnings") and not current_ao3_warnings:
                    updates.append("ao3_warnings = ?")
                    values.append(metadata["ao3_warnings"])
                
                # AO3 category (only if not already set)
                if metadata.get("ao3_category") and not current_ao3_category:
                    updates.append("ao3_category = ?")
                    values.append(metadata["ao3_category"])
                
                # Source URL (only if not already set)
                if metadata.get("source_url") and not current_source_url:
                    updates.append("source_url = ?")
                    values.append(metadata["source_url"])
                    results["details"]["source_urls_found"] += 1
                
                # ISBN (only if not already set)
                if metadata.get("isbn") and not current_isbn:
                    updates.append("isbn = ?")
                    values.append(metadata["isbn"])
                    results["details"]["isbn_found"] += 1
                
                # Publisher (only if not already set)
                if metadata.get("publisher") and not current_publisher:
                    updates.append("publisher = ?")
                    values.append(metadata["publisher"])
                
                # Series (only if not already set and found in Calibre metadata)
                if metadata.get("series") and not current_series:
                    updates.append("series = ?")
                    values.append(metadata["series"])
                    results["details"]["series_extracted"] += 1
                    
                    if metadata.get("series_number"):
                        updates.append("series_number = ?")
                        values.append(metadata["series_number"])
                
                # Chapter count (only if not already set)
                if metadata.get("chapter_count") and current_chapter_count is None:
                    updates.append("chapter_count = ?")
                    values.append(metadata["chapter_count"])
                
                # Completion status (only if not already set)
                if metadata.get("completion_status") and not current_completion_status:
                    updates.append("completion_status = ?")
                    values.append(metadata["completion_status"])
                    results["details"]["completion_status_detected"] += 1
                
                # Update tags (only if not already set)
                if metadata.get("tags") and not current_tags:
                    updates.append("tags = ?")
                    values.append(json.dumps(metadata["tags"]))
                
                # Apply updates
                if updates:
                    values.append(title_id)
                    update_query = f"""
                        UPDATE titles 
                        SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    """
                    await db.execute(update_query, values)
                    results["updated"] += 1
                
            except Exception as e:
                print(f"Error rescanning {title_name}: {e}")
                results["errors"] += 1
                continue
        
        await db.commit()
        
        return results
    
    finally:
        _sync_status.in_progress = False
        _sync_status.current_operation = None


@router.get("/sync/rescan-metadata/preview")
async def preview_rescan(db = Depends(get_db)):
    """
    Preview what a rescan would find - counts books by source type.
    """
    # Count total books (all owned, not TBR)
    cursor = await db.execute("""
        SELECT COUNT(*) FROM titles
        WHERE is_tbr = 0 OR is_tbr IS NULL
    """)
    total_books = (await cursor.fetchone())[0]
    
    # Count books with EPUB files AND their enhanced metadata status
    # This ensures estimates are accurate (only counting EPUB books)
    cursor2 = await db.execute("""
        SELECT 
            COUNT(DISTINCT t.id) as epub_count,
            SUM(CASE WHEN t.fandom IS NOT NULL THEN 1 ELSE 0 END) as has_fandom,
            SUM(CASE WHEN t.source_url IS NOT NULL THEN 1 ELSE 0 END) as has_source_url,
            SUM(CASE WHEN t.isbn IS NOT NULL THEN 1 ELSE 0 END) as has_isbn,
            SUM(CASE WHEN t.relationships IS NOT NULL THEN 1 ELSE 0 END) as has_relationships
        FROM titles t
        JOIN editions e ON t.id = e.title_id
        WHERE (e.file_path LIKE '%.epub' OR e.file_path LIKE '%.EPUB')
        AND (t.is_tbr = 0 OR t.is_tbr IS NULL)
        GROUP BY t.id
    """)
    rows = await cursor2.fetchall()
    
    # Aggregate the results (each row is one title due to GROUP BY)
    epub_count = len(rows)
    has_fandom = sum(1 for r in rows if r[1])
    has_source_url = sum(1 for r in rows if r[2])
    has_isbn = sum(1 for r in rows if r[3])
    has_relationships = sum(1 for r in rows if r[4])
    
    return {
        "total_books": total_books,
        "books_with_epub": epub_count,
        "already_has_fandom": has_fandom,
        "already_has_source_url": has_source_url,
        "already_has_isbn": has_isbn,
        "already_has_relationships": has_relationships,
        "estimated_to_update": max(0, epub_count - has_fandom)  # Books with EPUB but no fandom yet
    }
