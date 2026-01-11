"""
Cover image serving router.

Serves cover images for books, with proper caching headers.
"""

import os
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from services.covers import get_cover_path, EXTRACTED_COVERS_PATH, CUSTOM_COVERS_PATH

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/covers", tags=["covers"])


@router.get("/{title_id}")
async def get_cover_image(title_id: int):
    """
    Serve cover image for a title.
    
    Checks custom covers first, then extracted covers.
    Returns 404 if no cover exists (frontend should show gradient).
    """
    cover_path = get_cover_path(title_id)
    
    if not cover_path:
        raise HTTPException(status_code=404, detail="No cover found")
    
    # Determine media type from extension
    ext = cover_path.split('.')[-1].lower()
    media_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
    }
    media_type = media_types.get(ext, 'image/jpeg')
    
    return FileResponse(
        cover_path,
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=86400",  # Cache for 24 hours
        }
    )
