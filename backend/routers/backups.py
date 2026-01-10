"""
Backups Router - Automated backup management API (Phase 9A)

Endpoints:
- GET /api/backups/settings - Get backup configuration + stats
- PATCH /api/backups/settings - Update backup configuration
- POST /api/backups/test-path - Test if a path is writable
- POST /api/backups/manual - Trigger immediate backup
- GET /api/backups/history - Get list of recent backups
- DELETE /api/backups/history/{backup_id} - Delete specific backup
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from database import get_db, get_db_path
from services.backup import (
    get_backup_settings,
    save_backup_settings,
    create_backup,
    get_backup_stats,
    get_backup_history,
    validate_backup_path,
    delete_backup,
    update_scheduler_time,
    schedule_backup_jobs,
    start_scheduler,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/backups", tags=["backups"])


# =============================================================================
# Pydantic Models
# =============================================================================

class BackupSettingsUpdate(BaseModel):
    """Request body for updating backup settings."""
    backup_enabled: Optional[bool] = None
    backup_path: Optional[str] = None
    backup_schedule: Optional[str] = None  # 'before_sync' | 'daily' | 'both'
    backup_time: Optional[str] = None  # HH:MM format
    backup_daily_retention_days: Optional[int] = None
    backup_weekly_retention_weeks: Optional[int] = None
    backup_monthly_retention_months: Optional[int] = None


class PathTestRequest(BaseModel):
    """Request body for testing a backup path."""
    path: str


class PathTestResponse(BaseModel):
    """Response for path test."""
    valid: bool
    error: Optional[str] = None


class ManualBackupResponse(BaseModel):
    """Response for manual backup trigger."""
    success: bool
    backup_id: Optional[int] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    error: Optional[str] = None


# =============================================================================
# Endpoints
# =============================================================================

@router.get("/settings")
async def get_settings(db=Depends(get_db)):
    """
    Get current backup configuration and statistics.
    
    Returns backup settings plus:
    - Total backup count
    - Total size on disk
    - Last backup time
    - Breakdown by type (daily/weekly/monthly)
    """
    try:
        settings = await get_backup_settings(db)
        stats = await get_backup_stats(db)
        
        return {
            "settings": settings,
            "stats": stats
        }
    except Exception as e:
        logger.error(f"Failed to get backup settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/settings")
async def update_settings(update: BackupSettingsUpdate, db=Depends(get_db)):
    """
    Update backup configuration.
    
    If backup_path changes, validates the new path is writable.
    If backup_time changes, updates the scheduler.
    """
    try:
        # Get current settings
        current = await get_backup_settings(db)
        
        # Build updated settings dict
        new_settings = {}
        
        if update.backup_enabled is not None:
            new_settings['backup_enabled'] = update.backup_enabled
        
        if update.backup_path is not None:
            # Validate new path before saving
            validation = validate_backup_path(update.backup_path)
            if not validation['valid']:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid backup path: {validation['message']}"
                )
            new_settings['backup_path'] = update.backup_path
        
        if update.backup_schedule is not None:
            if update.backup_schedule not in ('before_sync', 'daily', 'both'):
                raise HTTPException(
                    status_code=400,
                    detail="backup_schedule must be 'before_sync', 'daily', or 'both'"
                )
            new_settings['backup_schedule'] = update.backup_schedule
        
        if update.backup_time is not None:
            # Validate time format
            try:
                parts = update.backup_time.split(':')
                if len(parts) != 2:
                    raise ValueError("Invalid format")
                hour, minute = int(parts[0]), int(parts[1])
                if not (0 <= hour <= 23 and 0 <= minute <= 59):
                    raise ValueError("Invalid time")
            except (ValueError, IndexError):
                raise HTTPException(
                    status_code=400,
                    detail="backup_time must be in HH:MM format (00:00 to 23:59)"
                )
            new_settings['backup_time'] = update.backup_time
        
        if update.backup_daily_retention_days is not None:
            if update.backup_daily_retention_days < 1:
                raise HTTPException(status_code=400, detail="Retention must be at least 1")
            new_settings['backup_daily_retention_days'] = update.backup_daily_retention_days
        
        if update.backup_weekly_retention_weeks is not None:
            if update.backup_weekly_retention_weeks < 1:
                raise HTTPException(status_code=400, detail="Retention must be at least 1")
            new_settings['backup_weekly_retention_weeks'] = update.backup_weekly_retention_weeks
        
        if update.backup_monthly_retention_months is not None:
            if update.backup_monthly_retention_months < 1:
                raise HTTPException(status_code=400, detail="Retention must be at least 1")
            new_settings['backup_monthly_retention_months'] = update.backup_monthly_retention_months
        
        # Save updated settings
        if new_settings:
            await save_backup_settings(db, new_settings)
            logger.info(f"Backup settings updated: {list(new_settings.keys())}")
        
        # Update scheduler if time changed
        if update.backup_time is not None and update.backup_time != current.get('backup_time'):
            db_path = get_db_path()
            if db_path:
                await update_scheduler_time(db_path, update.backup_time)
                logger.info(f"Scheduler updated to {update.backup_time}")
        
        # Return updated settings
        updated = await get_backup_settings(db)
        return {"settings": updated, "updated": list(new_settings.keys())}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update backup settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-path", response_model=PathTestResponse)
async def test_path(request: PathTestRequest):
    """
    Test if a backup path is writable.
    
    Use this before saving a new backup_path to ensure it works.
    """
    result = validate_backup_path(request.path)
    return PathTestResponse(
        valid=result['valid'],
        error=result.get('message') if not result['valid'] else None
    )


@router.post("/manual", response_model=ManualBackupResponse)
async def trigger_manual_backup(db=Depends(get_db)):
    """
    Trigger an immediate manual backup.
    
    Creates a backup regardless of schedule settings.
    Manual backups are stored in the 'daily' folder and
    follow daily retention policy.
    """
    try:
        db_path = get_db_path()
        result = await create_backup(db, backup_type='manual', db_path=db_path)
        
        if result.get('status') == 'success':
            # Get the backup_id from backup_history
            cursor = await db.execute(
                "SELECT id FROM backup_history WHERE file_path = ?",
                (result['file_path'],)
            )
            row = await cursor.fetchone()
            backup_id = row[0] if row else None
            
            logger.info(f"Manual backup created: {result['file_path']}")
            
            return ManualBackupResponse(
                success=True,
                backup_id=backup_id,
                file_path=result['file_path'],
                file_size=result['file_size']
            )
        else:
            logger.warning(f"Manual backup failed: {result.get('reason')}")
            return ManualBackupResponse(
                success=False,
                error=result.get('reason', 'Unknown error')
            )
    
    except Exception as e:
        logger.error(f"Manual backup failed: {e}")
        return ManualBackupResponse(success=False, error=str(e))


@router.get("/history")
async def get_history(limit: int = 50, db=Depends(get_db)):
    """
    Get list of recent backups from backup_history table.
    
    Args:
        limit: Maximum number of records to return (default 50)
    
    Returns list of backup records with:
    - id, backup_type, file_path, file_size, created_at, status
    """
    try:
        if limit < 1 or limit > 500:
            limit = 50
        
        history = await get_backup_history(db, limit=limit)
        return {"history": history, "count": len(history)}
    
    except Exception as e:
        logger.error(f"Failed to get backup history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history/{backup_id}")
async def delete_backup_by_id(backup_id: int, db=Depends(get_db)):
    """
    Delete a specific backup file and database record.
    
    Args:
        backup_id: ID of the backup_history record
    
    Returns success status.
    """
    try:
        result = await delete_backup(db, backup_id)
        
        if result['success']:
            logger.info(f"Backup {backup_id} deleted")
            return {"success": True, "message": result['message']}
        else:
            raise HTTPException(status_code=404, detail=result['message'])
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete backup {backup_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
