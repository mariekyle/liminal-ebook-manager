"""
Trash folder router — stats + empty (Batch 3 B1, Decisions 2026-07-16).

Reads and empties <books_root>/_trash/. The trash location derives from
services.trash.TRASH_DIR_NAME — this router must never hold a second
definition of where trash lives. Emptying is the app's only truly
irreversible operation: emptied files skip the NAS recycle bin, and
backups cover the library database only. Neither endpoint reads or
writes the database.
"""

import os
import logging
import shutil
import stat
from pathlib import Path

from fastapi import APIRouter, HTTPException

from services.trash import TRASH_DIR_NAME

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/trash", tags=["trash"])

BOOKS_PATH = os.getenv("BOOKS_PATH", "/books")


def _resolved_trash_dir() -> Path:
    """
    The trash directory under the books root, containment-verified.

    Refuses (500) if <books_root>/_trash is itself a symlink or resolves
    outside the books root — impossible in normal operation, but the
    empty endpoint has no undo, so verify before touching anything.
    Returns the resolved path; callers handle nonexistence.
    """
    books_root = Path(BOOKS_PATH).resolve()
    trash_path = books_root / TRASH_DIR_NAME
    if trash_path.is_symlink():
        raise HTTPException(
            status_code=500,
            detail="The trash folder is a symlink, which isn't safe to read or empty. Nothing was changed.",
        )
    resolved = trash_path.resolve()
    if resolved == books_root or not resolved.is_relative_to(books_root):
        raise HTTPException(
            status_code=500,
            detail="The trash folder doesn't resolve to a location inside the library, which isn't safe. Nothing was changed.",
        )
    return resolved


def _entry_bytes(path: Path) -> int:
    """
    Recursive size of a trash entry using lstat semantics.

    Symlinks contribute the link's own size, never the target's —
    sizing must not follow a link out of the trash. Directory inode
    sizes aren't counted; unreadable entries count as 0 so one bad
    entry can't fail the whole stats read.
    """
    try:
        st = path.lstat()
    except OSError:
        return 0
    if stat.S_ISDIR(st.st_mode):
        total = 0
        try:
            for child in path.iterdir():
                total += _entry_bytes(child)
        except OSError:
            pass
        return total
    return st.st_size


@router.get("/stats")
async def get_trash_stats():
    """
    Top-level item count + recursive byte size of the trash folder.

    A trashed title folder counts as one item; a trashed loose file
    counts as one item — matching how things went in. A missing trash
    folder is empty trash (zeros, 200), not an error.
    """
    trash_dir = _resolved_trash_dir()
    if not trash_dir.is_dir():
        return {"item_count": 0, "total_bytes": 0}
    try:
        entries = list(trash_dir.iterdir())
    except OSError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Couldn't read the trash folder: {e}",
        )
    return {
        "item_count": len(entries),
        "total_bytes": sum(_entry_bytes(entry) for entry in entries),
    }


@router.post("/empty")
async def empty_trash():
    """
    Permanently delete every top-level entry inside the trash folder.

    The one operation in the app with no undo. Real directories are
    removed recursively; files and symlinks are unlinked — a symlink in
    trash deletes the link, never its target. Per-entry failures don't
    abort the run (v0.62.0 per-book contract): the run continues and
    failures come back in `errors` with HTTP 200. Each removed entry is
    logged — the container log is the only surviving record of what died.
    """
    trash_dir = _resolved_trash_dir()
    if not trash_dir.is_dir():
        return {"removed_count": 0, "freed_bytes": 0, "errors": []}

    try:
        entries = sorted(trash_dir.iterdir())
    except OSError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Couldn't read the trash folder: {e}",
        )

    removed_count = 0
    freed_bytes = 0
    errors = []
    for entry in entries:
        size = _entry_bytes(entry)
        try:
            # Container Python is 3.11 — is_dir(follow_symlinks=False)
            # needs 3.13, so symlinks are excluded explicitly. A symlink
            # to a directory is unlinked, never rmtree'd through.
            if entry.is_dir() and not entry.is_symlink():
                shutil.rmtree(entry)
            else:
                entry.unlink()
        except OSError as e:
            errors.append({"name": entry.name, "error": str(e)})
            logger.error(f"Couldn't remove from trash: {entry.name} — {e}")
            continue
        removed_count += 1
        freed_bytes += size
        # warning level on purpose: nothing configures logging, so only
        # WARNING+ reaches the container log via the last-resort handler,
        # and this record must not vanish silently.
        logger.warning(f"Emptied from trash: {entry.name}")

    return {
        "removed_count": removed_count,
        "freed_bytes": freed_bytes,
        "errors": errors,
    }
