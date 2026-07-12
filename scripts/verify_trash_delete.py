"""
Batch 2 S1 verification — trash mechanism + sync ignores _trash.

Dev-only script; not part of the Docker image. Run from any Python 3.11+
env with the backend deps installed (fastapi, aiosqlite, ebooklib,
PyPDF2, lxml, pillow, apscheduler, pydantic-settings, python-multipart):

    python scripts/verify_trash_delete.py

Everything runs against a throwaway temp dir — no production data.

Runs the REAL backend modules (sync._do_sync, titles.delete_title,
services.trash) against a temp books root and a temp library.db created
by database.init_db. No production data involved.

Checks:
 1. Full sync discovers a live title, and NEVER discovers folders under
    <books_root>/_trash/ (pre-seeded trash content stays invisible).
 2. delete_title moves the folder to _trash and deletes the DB rows
    (sessions/notes/collection memberships cascade).
 3. THE CONTRACT: after delete, the next full sync does not re-add the
    trashed title.
 4. move_to_trash collision-safety and containment guards.
 5. Failure path: if a move fails mid-way (multi-folder title), already-
    moved folders are restored and DB rows are NOT deleted.
"""

import asyncio
import os
import sys
import tempfile
from pathlib import Path

REPO = str(Path(__file__).resolve().parent.parent)  # repo root (this file lives in scripts/)
TMP = tempfile.mkdtemp(prefix="liminal-trash-test-")
BOOKS = Path(TMP) / "books"
DB_PATH = str(Path(TMP) / "library.db")

os.environ["BOOKS_PATH"] = str(BOOKS)
os.environ["DATABASE_PATH"] = DB_PATH
sys.path.insert(0, os.path.join(REPO, "backend"))

from ebooklib import epub  # noqa: E402  (venv dep, used to craft real EPUBs)

PASS, FAIL = [], []


def check(name, cond, detail=""):
    (PASS if cond else FAIL).append(name)
    print(f"  {'PASS' if cond else 'FAIL'}: {name}" + (f" — {detail}" if detail and not cond else ""))


def make_epub(folder: Path, title: str, author: str, filename: str):
    folder.mkdir(parents=True, exist_ok=True)
    book = epub.EpubBook()
    book.set_identifier(f"test-{title}")
    book.set_title(title)
    book.set_language("en")
    book.add_author(author)
    ch = epub.EpubHtml(title="c1", file_name="c1.xhtml", lang="en")
    ch.content = "<h1>hi</h1>"
    book.add_item(ch)
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())
    book.spine = ["nav", ch]
    epub.write_epub(str(folder / filename), book)


async def main():
    import database
    from database import init_db
    from routers import sync
    from routers.titles import delete_title
    from services import trash
    from services.trash import move_to_trash, TrashError
    from fastapi import HTTPException
    import aiosqlite

    # --- fixtures ---------------------------------------------------------
    live = BOOKS / "Fiction" / "Alice Author - Live Book"
    trashed_preseed = BOOKS / "_trash" / "Bob Author - Trashed Book"
    make_epub(live, "Live Book", "Alice Author", "live.epub")
    make_epub(trashed_preseed, "Trashed Book", "Bob Author", "trashed.epub")

    await init_db(DB_PATH)

    async def titles_in_db():
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute("""
                SELECT t.id, t.title,
                       (SELECT GROUP_CONCAT(e.folder_path) FROM editions e WHERE e.title_id = t.id) AS folder_path
                FROM titles t ORDER BY t.id
            """)
            return [dict(r) for r in await cur.fetchall()]

    # --- 1. full sync ignores pre-seeded _trash ---------------------------
    print("\n[1] Full sync with pre-seeded _trash content")
    result = await sync.run_sync_standalone(full=True)
    rows = await titles_in_db()
    check("sync succeeded", result.status in ("success", "completed", "complete"), result.status)
    check("live title discovered", any(r["title"] == "Live Book" for r in rows), str(rows))
    check("_trash folder NOT discovered as a title",
          not any("_trash" in (r["folder_path"] or "") for r in rows), str(rows))
    check("exactly one title", len(rows) == 1, str(rows))

    # --- 2. delete_title: move folder + cascade DB rows -------------------
    print("\n[2] delete_title endpoint (direct call)")
    title_id = rows[0]["id"]
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA foreign_keys = ON")
        # seed children to prove the cascade
        await db.execute(
            "INSERT INTO reading_sessions (title_id, session_number, session_status) VALUES (?, 1, 'finished')",
            [title_id],
        )
        await db.execute(
            "INSERT INTO notes (title_id, content) VALUES (?, 'a note')", [title_id]
        )
        await db.commit()
        resp = await delete_title(book_id=title_id, db=db)

    check("endpoint reports deleted", resp["status"] == "deleted", str(resp))
    check("folder arrived in _trash",
          (BOOKS / "_trash" / "Alice Author - Live Book").is_dir())
    check("source folder gone", not live.exists())
    check("epub file survived the move",
          (BOOKS / "_trash" / "Alice Author - Live Book" / "live.epub").is_file())
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute("SELECT COUNT(*) FROM titles")
        n_titles = (await cur.fetchone())[0]
        cur = await db.execute("SELECT COUNT(*) FROM reading_sessions")
        n_sessions = (await cur.fetchone())[0]
        cur = await db.execute("SELECT COUNT(*) FROM notes")
        n_notes = (await cur.fetchone())[0]
    check("title row deleted", n_titles == 0, f"titles={n_titles}")
    check("sessions cascaded", n_sessions == 0, f"sessions={n_sessions}")
    check("notes cascaded", n_notes == 0, f"notes={n_notes}")

    # --- 3. THE CONTRACT: trashed title does not reappear on full sync ----
    print("\n[3] Full sync after delete — trashed folder must not reappear")
    result = await sync.run_sync_standalone(full=True)
    rows = await titles_in_db()
    check("no titles re-added from _trash", len(rows) == 0, str(rows))

    # --- 4. move_to_trash guards ------------------------------------------
    print("\n[4] move_to_trash collision + containment guards")
    a = BOOKS / "Fiction" / "Dup Author - Same Name"
    make_epub(a, "Same Name", "Dup Author", "a.epub")
    d1 = move_to_trash(str(a), str(BOOKS))
    make_epub(a, "Same Name", "Dup Author", "b.epub")
    d2 = move_to_trash(str(a), str(BOOKS))
    check("collision suffixed, not clobbered",
          d1.endswith("Dup Author - Same Name") and d2.endswith("Dup Author - Same Name_1"),
          f"{d1} / {d2}")
    check("both trash copies exist", Path(d1).is_dir() and Path(d2).is_dir())

    outside = Path(TMP) / "outside-root"
    outside.mkdir()
    for name, target in [
        ("rejects folder outside books root", str(outside)),
        ("rejects books root itself", str(BOOKS)),
        ("rejects folder already in trash", d1),
        ("rejects nonexistent folder", str(BOOKS / "nope")),
    ]:
        try:
            move_to_trash(target, str(BOOKS))
            check(name, False, "no exception raised")
        except TrashError:
            check(name, True)

    # --- 5. failure path: restore + DB untouched --------------------------
    print("\n[5] Failed move restores folders and keeps DB rows")
    f1 = BOOKS / "Fiction" / "Carol Author - Two Folders"
    f2 = BOOKS / "Non-Fiction" / "Carol Author - Two Folders Alt"
    make_epub(f1, "Two Folders", "Carol Author", "one.epub")
    make_epub(f2, "Two Folders", "Carol Author", "two.epub")
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA foreign_keys = ON")
        cur = await db.execute(
            "INSERT INTO titles (title, authors) VALUES (?, ?)", ["Two Folders", '["Carol Author"]']
        )
        tid = cur.lastrowid
        await db.execute(
            "INSERT INTO editions (title_id, format, folder_path) VALUES (?, 'epub', ?)",
            [tid, str(f1)],
        )
        await db.execute(
            "INSERT INTO editions (title_id, format, folder_path) VALUES (?, 'pdf', ?)",
            [tid, str(f2)],
        )
        await db.commit()

        real_move = trash.shutil.move
        calls = {"n": 0}

        def flaky_move(src, dst):
            calls["n"] += 1
            if calls["n"] == 2:
                raise OSError("simulated SMB failure")
            return real_move(src, dst)

        trash.shutil.move = flaky_move
        try:
            raised = False
            try:
                await delete_title(book_id=tid, db=db)
            except HTTPException as e:
                raised = True
                check("failure surfaces as HTTP 500", e.status_code == 500, str(e.status_code))
                check("error copy says nothing was deleted",
                      "Nothing was deleted" in e.detail, e.detail)
            check("failed move raises", raised)
        finally:
            trash.shutil.move = real_move

        cur = await db.execute("SELECT COUNT(*) FROM titles WHERE id = ?", [tid])
        still_there = (await cur.fetchone())[0]
    check("DB row NOT deleted after failed move", still_there == 1)
    check("first folder restored", f1.is_dir() and (f1 / "one.epub").is_file())
    check("second folder untouched", f2.is_dir() and (f2 / "two.epub").is_file())
    check("no stray copy left in trash",
          not (BOOKS / "_trash" / "Carol Author - Two Folders").exists())

    # --- summary -----------------------------------------------------------
    print(f"\n{'='*60}\n{len(PASS)} passed, {len(FAIL)} failed")
    if FAIL:
        print("FAILED:", *FAIL, sep="\n  - ")
        sys.exit(1)


asyncio.run(main())
