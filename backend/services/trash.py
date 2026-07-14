"""
Trash service — user-initiated deletion support (Batch 2, Decisions 2026-07-12).

Deletion is a MOVE to <books_root>/_trash/, never a permanent delete.
Nothing in this module removes files; emptying the trash folder is a
manual step outside the app. Sync discovery and upload duplicate
detection skip TRASH_DIR_NAME so trashed folders never reappear as
titles.
"""

import shutil
from pathlib import Path

# Folder name reserved for trashed title folders, directly under the
# books root.
TRASH_DIR_NAME = "_trash"


class TrashError(Exception):
    """A folder could not be moved to trash."""


def move_to_trash(folder: str, books_root: str) -> str:
    """
    Move a title folder into <books_root>/_trash/, collision-safe.

    Name collisions inside _trash get a numeric suffix
    ("Author - Title_1") instead of overwriting. Refuses folders outside
    the books root, the root itself, and anything already in trash.
    Returns the destination path.
    """
    root = Path(books_root).resolve()
    src = Path(folder).resolve()

    if not src.is_dir():
        raise TrashError(f"Not a folder: {folder}")
    if src == root:
        raise TrashError("Refusing to trash the books root")
    if not src.is_relative_to(root):
        raise TrashError(f"Folder is outside the books root: {folder}")
    if TRASH_DIR_NAME in src.relative_to(root).parts:
        raise TrashError(f"Folder is already in trash: {folder}")

    trash_dir = root / TRASH_DIR_NAME
    trash_dir.mkdir(parents=True, exist_ok=True)

    dest = trash_dir / src.name
    counter = 1
    while dest.exists():
        dest = trash_dir / f"{src.name}_{counter}"
        counter += 1

    shutil.move(str(src), str(dest))
    return str(dest)


def move_file_to_trash(file_path: str, books_root: str) -> str:
    """
    Move a single file into <books_root>/_trash/, collision-safe.

    Sibling of move_to_trash for edition-level deletes (Batch 2 S3).
    Refuses directories — folder moves stay on move_to_trash, whose
    directory-only raise is the delete-title contract. Refuses paths
    outside the books root, the root itself, and anything already in
    trash. Name collisions inside _trash get a numeric suffix before
    the extension ("name_1.epub") instead of overwriting. Returns the
    destination path.
    """
    root = Path(books_root).resolve()
    src = Path(file_path).resolve()

    if src == root:
        raise TrashError("Refusing to trash the books root")
    if src.is_dir():
        raise TrashError(f"Not a file: {file_path}")
    if not src.is_file():
        raise TrashError(f"Not a file: {file_path}")
    if not src.is_relative_to(root):
        raise TrashError(f"File is outside the books root: {file_path}")
    if TRASH_DIR_NAME in src.relative_to(root).parts:
        raise TrashError(f"File is already in trash: {file_path}")

    trash_dir = root / TRASH_DIR_NAME
    trash_dir.mkdir(parents=True, exist_ok=True)

    dest = trash_dir / src.name
    counter = 1
    while dest.exists():
        dest = trash_dir / f"{src.stem}_{counter}{src.suffix}"
        counter += 1

    shutil.move(str(src), str(dest))
    return str(dest)
