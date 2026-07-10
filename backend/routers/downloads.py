"""
Ebook file download router.

Serves edition files as attachment downloads (10.1 Download & Share).
The edition id maps to its file_path server-side — no client-supplied paths.
"""

import os
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/editions", tags=["downloads"])

BOOKS_PATH = os.getenv("BOOKS_PATH", "/books")

MEDIA_TYPES = {
    'epub': 'application/epub+zip',
    'pdf': 'application/pdf',
    'mobi': 'application/x-mobipocket-ebook',
    'azw3': 'application/vnd.amazon.ebook',
}


@router.get("/{edition_id}/download")
async def download_edition_file(edition_id: int, db = Depends(get_db)):
    """
    Serve an edition's ebook file as an attachment download.

    404 on: unknown edition, non-ebook edition, missing file
    (paths go stale between syncs), or a path outside BOOKS_PATH.
    """
    cursor = await db.execute(
        "SELECT id, format, file_path FROM editions WHERE id = ?",
        (edition_id,)
    )
    edition = await cursor.fetchone()

    if edition is None:
        raise HTTPException(status_code=404, detail="Edition not found")

    if edition["format"] != "ebook" or not edition["file_path"]:
        raise HTTPException(
            status_code=404,
            detail="No downloadable file for this edition"
        )

    try:
        resolved = Path(edition["file_path"]).resolve(strict=True)
    except OSError:
        raise HTTPException(
            status_code=404,
            detail="File not found — it may have moved since the last library scan"
        )

    if not resolved.is_relative_to(Path(BOOKS_PATH).resolve()):
        logger.warning(
            f"Edition {edition_id} file path resolves outside the books root; refusing to serve"
        )
        raise HTTPException(
            status_code=404,
            detail="No downloadable file for this edition"
        )

    ext = resolved.suffix.lower().lstrip('.')
    media_type = MEDIA_TYPES.get(ext, 'application/octet-stream')

    # filename= sets Content-Disposition: attachment with the basename
    return FileResponse(
        resolved,
        media_type=media_type,
        filename=resolved.name,
    )
