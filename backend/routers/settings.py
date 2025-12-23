"""
Settings Router - User preferences API

Endpoints:
- GET /api/settings - Get all settings
- GET /api/settings/{key} - Get a single setting
- PUT /api/settings/{key} - Update or create a setting
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from database import get_db

router = APIRouter(prefix="/settings", tags=["settings"])


class SettingUpdate(BaseModel):
    value: str


class SettingResponse(BaseModel):
    key: str
    value: str


@router.get("")
async def get_all_settings(db=Depends(get_db)):
    """Get all settings as key-value pairs"""
    cursor = await db.execute("SELECT key, value FROM settings")
    rows = await cursor.fetchall()
    return {row[0]: row[1] for row in rows}


@router.get("/{key}")
async def get_setting(key: str, db=Depends(get_db)):
    """Get a single setting by key"""
    cursor = await db.execute(
        "SELECT key, value FROM settings WHERE key = ?", (key,)
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")
    return {"key": row[0], "value": row[1]}


@router.put("/{key}")
async def update_setting(key: str, update: SettingUpdate, db=Depends(get_db)):
    """Update or create a setting"""
    await db.execute(
        """
        INSERT INTO settings (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET 
            value = excluded.value,
            updated_at = CURRENT_TIMESTAMP
        """,
        (key, update.value)
    )
    await db.commit()
    return {"key": key, "value": update.value}

