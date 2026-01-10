"""
Automated Backup Service - Phase 9A

Provides grandfather-father-son backup rotation:
- Daily backups (kept for 7 days)
- Weekly backups (kept for 4 weeks, created on Sundays)
- Monthly backups (kept for 6 months, created on 1st of month)
- Pre-sync backups (counted as daily)

Backup location is configurable via settings.
"""

import os
import shutil
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any, List

import aiosqlite
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

# Scheduler instance (initialized once)
_scheduler: Optional[AsyncIOScheduler] = None

# Default backup configuration
DEFAULT_BACKUP_CONFIG = {
    "backup_enabled": True,
    "backup_path": "/app/data/backups",
    "backup_schedule": "both",  # 'before_sync' | 'daily' | 'both'
    "backup_time": "03:00",
    "backup_daily_retention_days": 7,
    "backup_weekly_retention_weeks": 4,
    "backup_monthly_retention_months": 6,
}


async def get_backup_settings(db: aiosqlite.Connection) -> Dict[str, Any]:
    """
    Get current backup settings from database.
    Returns defaults for any missing settings.
    """
    settings = DEFAULT_BACKUP_CONFIG.copy()
    
    cursor = await db.execute("""
        SELECT key, value FROM settings 
        WHERE key LIKE 'backup_%' OR key = 'last_backup_time'
    """)
    rows = await cursor.fetchall()
    
    for row in rows:
        key = row[0]
        value = row[1]
        
        # Type conversion based on key
        if key in ('backup_enabled',):
            settings[key] = value.lower() in ('true', '1', 'yes')
        elif key in ('backup_daily_retention_days', 'backup_weekly_retention_weeks', 'backup_monthly_retention_months'):
            settings[key] = int(value) if value else DEFAULT_BACKUP_CONFIG[key]
        else:
            settings[key] = value
    
    return settings


async def save_backup_settings(db: aiosqlite.Connection, settings: Dict[str, Any]) -> None:
    """Save backup settings to database."""
    for key, value in settings.items():
        if key.startswith('backup_') or key == 'last_backup_time':
            # Convert boolean to string
            if isinstance(value, bool):
                value = 'true' if value else 'false'
            
            await db.execute("""
                INSERT OR REPLACE INTO settings (key, value, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            """, (key, str(value)))
    
    await db.commit()


def get_backup_type_for_date(date: datetime) -> str:
    """
    Determine backup type based on date using grandfather-father-son rotation.
    
    - Monthly: 1st of month
    - Weekly: Sundays
    - Daily: All other days
    """
    if date.day == 1:
        return 'monthly'
    elif date.weekday() == 6:  # Sunday
        return 'weekly'
    else:
        return 'daily'


def get_backup_folder(base_path: str, backup_type: str) -> str:
    """Get the folder path for a specific backup type."""
    if backup_type in ('daily', 'pre_sync', 'manual'):
        return os.path.join(base_path, 'daily')
    elif backup_type == 'weekly':
        return os.path.join(base_path, 'weekly')
    elif backup_type == 'monthly':
        return os.path.join(base_path, 'monthly')
    else:
        return os.path.join(base_path, 'daily')


async def create_backup(
    db: aiosqlite.Connection,
    backup_type: str = 'daily',
    db_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a backup of the database.
    
    Args:
        db: Database connection
        backup_type: One of 'daily', 'weekly', 'monthly', 'pre_sync', 'manual'
        db_path: Path to the database file (will be retrieved if not provided)
    
    Returns:
        Dict with backup info: file_path, file_size, backup_type, status
    """
    try:
        # Get settings
        settings = await get_backup_settings(db)
        
        if not settings['backup_enabled'] and backup_type != 'manual':
            logger.info("Backups are disabled, skipping")
            return {"status": "skipped", "reason": "backups_disabled"}
        
        backup_path = settings['backup_path']
        
        # For scheduled backups, determine type based on date (grandfather-father-son)
        if backup_type == 'daily':
            backup_type = get_backup_type_for_date(datetime.now())
        
        # Get backup folder
        backup_folder = get_backup_folder(backup_path, backup_type)
        
        # Ensure directory exists
        os.makedirs(backup_folder, exist_ok=True)
        
        # Generate backup filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"liminal_{backup_type}_{timestamp}.db"
        full_path = os.path.join(backup_folder, filename)
        
        # Get source database path
        if db_path is None:
            # Import here to avoid circular import
            from database import get_db_path
            db_path = get_db_path()
        
        if not db_path or not os.path.exists(db_path):
            logger.error(f"Source database not found: {db_path}")
            return {"status": "failed", "reason": "database_not_found"}
        
        # Create backup using file copy
        # Note: For better consistency, we could use SQLite's backup API,
        # but file copy is simpler and works well for our use case
        shutil.copy2(db_path, full_path)
        
        # Get file size
        file_size = os.path.getsize(full_path)
        
        # Log to backup_history table
        await db.execute("""
            INSERT INTO backup_history (backup_type, file_path, file_size, created_at, status)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'success')
        """, (backup_type, full_path, file_size))
        
        # Update last_backup_time
        await db.execute("""
            INSERT OR REPLACE INTO settings (key, value, updated_at)
            VALUES ('last_backup_time', ?, CURRENT_TIMESTAMP)
        """, (datetime.now().isoformat(),))
        
        await db.commit()
        
        logger.info(f"Backup created: {full_path} ({file_size} bytes)")
        
        # Run cleanup after successful backup
        await cleanup_old_backups(db)
        
        return {
            "status": "success",
            "file_path": full_path,
            "file_size": file_size,
            "backup_type": backup_type,
            "timestamp": timestamp
        }
        
    except Exception as e:
        logger.error(f"Backup failed: {e}")
        
        # Log failure to backup_history
        try:
            await db.execute("""
                INSERT INTO backup_history (backup_type, file_path, file_size, created_at, status)
                VALUES (?, ?, 0, CURRENT_TIMESTAMP, 'failed')
            """, (backup_type, str(e)))
            await db.commit()
        except Exception:
            pass  # Don't fail on logging failure
        
        return {"status": "failed", "reason": str(e)}


async def cleanup_old_backups(db: aiosqlite.Connection) -> Dict[str, Any]:
    """
    Remove backups older than retention policy.
    
    Returns:
        Dict with cleanup stats: deleted_count, freed_bytes
    """
    try:
        settings = await get_backup_settings(db)
        backup_path = settings['backup_path']
        
        deleted_count = 0
        freed_bytes = 0
        
        now = datetime.now()
        
        # Define retention cutoffs
        daily_cutoff = now - timedelta(days=settings['backup_daily_retention_days'])
        weekly_cutoff = now - timedelta(weeks=settings['backup_weekly_retention_weeks'])
        monthly_cutoff = now - timedelta(days=settings['backup_monthly_retention_months'] * 30)
        
        # Cleanup each backup type folder
        cleanup_configs = [
            ('daily', daily_cutoff),
            ('weekly', weekly_cutoff),
            ('monthly', monthly_cutoff),
        ]
        
        for folder_name, cutoff in cleanup_configs:
            folder_path = os.path.join(backup_path, folder_name)
            
            if not os.path.exists(folder_path):
                continue
            
            for filename in os.listdir(folder_path):
                if not filename.endswith('.db'):
                    continue
                
                file_path = os.path.join(folder_path, filename)
                
                try:
                    # Parse timestamp from filename: liminal_type_YYYYMMDD_HHMMSS.db
                    parts = filename.replace('.db', '').split('_')
                    if len(parts) >= 4:
                        date_str = parts[2]  # YYYYMMDD
                        time_str = parts[3]  # HHMMSS
                        file_datetime = datetime.strptime(f"{date_str}_{time_str}", '%Y%m%d_%H%M%S')
                        
                        if file_datetime < cutoff:
                            file_size = os.path.getsize(file_path)
                            os.remove(file_path)
                            deleted_count += 1
                            freed_bytes += file_size
                            logger.info(f"Deleted old backup: {filename}")
                            
                            # Remove from backup_history
                            await db.execute(
                                "DELETE FROM backup_history WHERE file_path = ?",
                                (file_path,)
                            )
                except (ValueError, IndexError) as e:
                    logger.warning(f"Could not parse backup filename: {filename} - {e}")
                    continue
        
        await db.commit()
        
        logger.info(f"Cleanup complete: deleted {deleted_count} backups, freed {freed_bytes} bytes")
        
        return {
            "deleted_count": deleted_count,
            "freed_bytes": freed_bytes
        }
        
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        return {"deleted_count": 0, "freed_bytes": 0, "error": str(e)}


async def get_backup_stats(db: aiosqlite.Connection) -> Dict[str, Any]:
    """
    Get backup statistics.
    
    Returns:
        Dict with: total_backups, total_size, last_backup_time, backups_by_type
    """
    settings = await get_backup_settings(db)
    backup_path = settings['backup_path']
    
    stats = {
        "total_backups": 0,
        "total_size": 0,
        "last_backup_time": settings.get('last_backup_time'),
        "backups_by_type": {
            "daily": {"count": 0, "size": 0},
            "weekly": {"count": 0, "size": 0},
            "monthly": {"count": 0, "size": 0},
        }
    }
    
    # Count files on disk
    for folder_name in ['daily', 'weekly', 'monthly']:
        folder_path = os.path.join(backup_path, folder_name)
        
        if not os.path.exists(folder_path):
            continue
        
        for filename in os.listdir(folder_path):
            if filename.endswith('.db'):
                file_path = os.path.join(folder_path, filename)
                file_size = os.path.getsize(file_path)
                
                stats["total_backups"] += 1
                stats["total_size"] += file_size
                stats["backups_by_type"][folder_name]["count"] += 1
                stats["backups_by_type"][folder_name]["size"] += file_size
    
    return stats


async def get_backup_history(
    db: aiosqlite.Connection,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Get recent backup history from database.
    
    Args:
        db: Database connection
        limit: Maximum number of records to return
    
    Returns:
        List of backup history records
    """
    cursor = await db.execute("""
        SELECT id, backup_type, file_path, file_size, created_at, status
        FROM backup_history
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))
    
    rows = await cursor.fetchall()
    
    return [
        {
            "id": row[0],
            "backup_type": row[1],
            "file_path": row[2],
            "file_size": row[3],
            "created_at": row[4],
            "status": row[5],
        }
        for row in rows
    ]


def validate_backup_path(path: str) -> Dict[str, Any]:
    """
    Validate that a backup path is writable.
    
    Args:
        path: Path to validate
    
    Returns:
        Dict with: valid (bool), message (str)
    """
    try:
        # Create path if it doesn't exist
        os.makedirs(path, exist_ok=True)
        
        # Test write permission
        test_file = os.path.join(path, '.write_test')
        with open(test_file, 'w') as f:
            f.write('test')
        os.remove(test_file)
        
        return {"valid": True, "message": "Path is writable"}
        
    except PermissionError:
        return {"valid": False, "message": "Permission denied - cannot write to this path"}
    except OSError as e:
        return {"valid": False, "message": f"Path error: {str(e)}"}
    except Exception as e:
        return {"valid": False, "message": f"Unexpected error: {str(e)}"}


async def delete_backup(db: aiosqlite.Connection, backup_id: int) -> Dict[str, Any]:
    """
    Delete a specific backup by ID.
    
    Args:
        db: Database connection
        backup_id: ID of the backup_history record
    
    Returns:
        Dict with: success (bool), message (str)
    """
    try:
        # Get the backup record
        cursor = await db.execute(
            "SELECT file_path FROM backup_history WHERE id = ?",
            (backup_id,)
        )
        row = await cursor.fetchone()
        
        if not row:
            return {"success": False, "message": "Backup not found"}
        
        file_path = row[0]
        
        # Delete the file if it exists
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Remove from history
        await db.execute(
            "DELETE FROM backup_history WHERE id = ?",
            (backup_id,)
        )
        await db.commit()
        
        return {"success": True, "message": "Backup deleted"}
        
    except Exception as e:
        logger.error(f"Failed to delete backup {backup_id}: {e}")
        return {"success": False, "message": str(e)}


# =============================================================================
# SCHEDULER FUNCTIONS
# =============================================================================

async def _scheduled_backup_task(db_path: str) -> None:
    """
    Task executed by the scheduler for daily backups.
    Creates its own database connection since it runs in background.
    """
    try:
        async with aiosqlite.connect(db_path) as db:
            db.row_factory = aiosqlite.Row
            result = await create_backup(db, backup_type='daily', db_path=db_path)
            logger.info(f"Scheduled backup result: {result}")
    except Exception as e:
        logger.error(f"Scheduled backup task failed: {e}")


def schedule_backup_jobs(db_path: str, backup_time: str = "03:00") -> AsyncIOScheduler:
    """
    Set up APScheduler for automated daily backups.
    
    Args:
        db_path: Path to the database file
        backup_time: Time to run daily backup (HH:MM format)
    
    Returns:
        The scheduler instance
    """
    global _scheduler
    
    # Stop existing scheduler if running
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
    
    # Create new scheduler
    _scheduler = AsyncIOScheduler()
    
    # Parse backup time
    try:
        hour, minute = map(int, backup_time.split(':'))
    except ValueError:
        logger.warning(f"Invalid backup_time format: {backup_time}, using 03:00")
        hour, minute = 3, 0
    
    # Add daily backup job
    _scheduler.add_job(
        _scheduled_backup_task,
        CronTrigger(hour=hour, minute=minute),
        args=[db_path],
        id='daily_backup',
        name='Daily Database Backup',
        replace_existing=True,
        misfire_grace_time=3600  # 1 hour grace period
    )
    
    logger.info(f"Backup scheduler configured for {hour:02d}:{minute:02d}")
    
    return _scheduler


def start_scheduler() -> None:
    """Start the backup scheduler if not already running."""
    global _scheduler
    
    if _scheduler and not _scheduler.running:
        _scheduler.start()
        logger.info("Backup scheduler started")


def stop_scheduler() -> None:
    """Stop the backup scheduler."""
    global _scheduler
    
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Backup scheduler stopped")


def get_scheduler() -> Optional[AsyncIOScheduler]:
    """Get the current scheduler instance."""
    return _scheduler


async def update_scheduler_time(db_path: str, new_time: str) -> None:
    """
    Update the scheduled backup time.
    
    Args:
        db_path: Path to the database file
        new_time: New time in HH:MM format
    """
    global _scheduler
    
    if _scheduler:
        # Remove existing job and add with new time
        schedule_backup_jobs(db_path, new_time)
        
        if not _scheduler.running:
            _scheduler.start()
