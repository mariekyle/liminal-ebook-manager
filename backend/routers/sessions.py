"""
Reading Sessions router - CRUD for multiple reading sessions per book.

Each book can have multiple reading sessions (re-reads).
After any mutation, we sync the cached values on the titles table.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import aiosqlite

from database import get_db, sync_title_from_sessions

router = APIRouter(prefix="/api", tags=["sessions"])


# =============================================================================
# Pydantic Models
# =============================================================================

class SessionCreate(BaseModel):
    date_started: Optional[str] = None      # ISO date: YYYY-MM-DD
    date_finished: Optional[str] = None     # ISO date: YYYY-MM-DD
    session_status: str = "in_progress"     # in_progress, finished, dnf
    rating: Optional[int] = None            # 1-5

class SessionUpdate(BaseModel):
    date_started: Optional[str] = None
    date_finished: Optional[str] = None
    session_status: Optional[str] = None
    rating: Optional[int] = None

class SessionResponse(BaseModel):
    id: int
    title_id: int
    session_number: int
    date_started: Optional[str]
    date_finished: Optional[str]
    session_status: str
    rating: Optional[int]
    created_at: str
    updated_at: str

class SessionsListResponse(BaseModel):
    sessions: List[SessionResponse]
    times_read: int
    average_rating: Optional[float]


# =============================================================================
# Endpoints
# =============================================================================

@router.get("/titles/{title_id}/sessions", response_model=SessionsListResponse)
async def list_sessions(title_id: int, db: aiosqlite.Connection = Depends(get_db)):
    """
    List all reading sessions for a title, newest first.
    Also returns aggregate stats (times_read, average_rating).
    """
    # Verify title exists
    cursor = await db.execute("SELECT id FROM titles WHERE id = ?", (title_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Title not found")
    
    # Get sessions, newest first (highest session_number)
    cursor = await db.execute("""
        SELECT id, title_id, session_number, date_started, date_finished, 
               session_status, rating, created_at, updated_at
        FROM reading_sessions
        WHERE title_id = ?
        ORDER BY session_number DESC
    """, (title_id,))
    rows = await cursor.fetchall()
    
    sessions = []
    ratings = []
    for row in rows:
        sessions.append(SessionResponse(
            id=row[0],
            title_id=row[1],
            session_number=row[2],
            date_started=row[3],
            date_finished=row[4],
            session_status=row[5],
            rating=row[6],
            created_at=row[7],
            updated_at=row[8]
        ))
        if row[6] is not None:
            ratings.append(row[6])
    
    # Calculate stats
    times_read = len(sessions)
    average_rating = round(sum(ratings) / len(ratings), 1) if ratings else None
    
    return SessionsListResponse(
        sessions=sessions,
        times_read=times_read,
        average_rating=average_rating
    )


@router.post("/titles/{title_id}/sessions", response_model=SessionResponse)
async def create_session(
    title_id: int, 
    session: SessionCreate, 
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Add a new reading session for a title.
    Session number is auto-assigned (max + 1).
    """
    # Verify title exists
    cursor = await db.execute("SELECT id FROM titles WHERE id = ?", (title_id,))
    if not await cursor.fetchone():
        raise HTTPException(status_code=404, detail="Title not found")
    
    # Validate session_status
    valid_statuses = ['in_progress', 'finished', 'dnf']
    if session.session_status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid session_status. Must be one of: {valid_statuses}"
        )
    
    # Validate rating if provided
    if session.rating is not None and (session.rating < 1 or session.rating > 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Rating only allowed for finished or dnf
    if session.rating is not None and session.session_status == 'in_progress':
        raise HTTPException(
            status_code=400, 
            detail="Cannot rate a session that is still in progress"
        )
    
    # Get next session number
    cursor = await db.execute(
        "SELECT COALESCE(MAX(session_number), 0) + 1 FROM reading_sessions WHERE title_id = ?",
        (title_id,)
    )
    next_number = (await cursor.fetchone())[0]
    
    # Insert session
    now = datetime.utcnow().isoformat()
    cursor = await db.execute("""
        INSERT INTO reading_sessions (
            title_id, session_number, date_started, date_finished, 
            session_status, rating, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        title_id, next_number, session.date_started, session.date_finished,
        session.session_status, session.rating, now, now
    ))
    session_id = cursor.lastrowid
    await db.commit()
    
    # Sync cached values on title
    await sync_title_from_sessions(db, title_id)
    
    # Return created session
    cursor = await db.execute("""
        SELECT id, title_id, session_number, date_started, date_finished,
               session_status, rating, created_at, updated_at
        FROM reading_sessions WHERE id = ?
    """, (session_id,))
    row = await cursor.fetchone()
    
    return SessionResponse(
        id=row[0],
        title_id=row[1],
        session_number=row[2],
        date_started=row[3],
        date_finished=row[4],
        session_status=row[5],
        rating=row[6],
        created_at=row[7],
        updated_at=row[8]
    )


@router.patch("/sessions/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: int,
    updates: SessionUpdate,
    db: aiosqlite.Connection = Depends(get_db)
):
    """
    Update a reading session (dates, status, rating).
    """
    # Get existing session
    cursor = await db.execute(
        "SELECT id, title_id, session_status FROM reading_sessions WHERE id = ?",
        (session_id,)
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    
    title_id = row[1]
    current_status = row[2]
    
    # Determine new status (use update value or keep current)
    new_status = updates.session_status if updates.session_status is not None else current_status
    
    # Validate session_status if provided
    if updates.session_status is not None:
        valid_statuses = ['in_progress', 'finished', 'dnf']
        if updates.session_status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid session_status. Must be one of: {valid_statuses}"
            )
    
    # Validate rating if provided
    if updates.rating is not None and (updates.rating < 1 or updates.rating > 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Rating only allowed for finished or dnf
    if updates.rating is not None and new_status == 'in_progress':
        raise HTTPException(
            status_code=400,
            detail="Cannot rate a session that is still in progress"
        )
    
    # Build update query dynamically
    update_fields = []
    params = []
    
    # Handle dates: empty string means "clear", None means "don't change"
    if updates.date_started is not None:
        update_fields.append("date_started = ?")
        params.append(updates.date_started if updates.date_started != '' else None)
    
    if updates.date_finished is not None:
        update_fields.append("date_finished = ?")
        params.append(updates.date_finished if updates.date_finished != '' else None)
    
    if updates.session_status is not None:
        update_fields.append("session_status = ?")
        params.append(updates.session_status)
    
    if updates.rating is not None:
        update_fields.append("rating = ?")
        params.append(updates.rating)
    
    # Always update updated_at
    update_fields.append("updated_at = ?")
    params.append(datetime.utcnow().isoformat())
    
    params.append(session_id)
    
    if update_fields:
        await db.execute(f"""
            UPDATE reading_sessions 
            SET {', '.join(update_fields)}
            WHERE id = ?
        """, params)
        await db.commit()
    
    # Sync cached values on title
    await sync_title_from_sessions(db, title_id)
    
    # Return updated session
    cursor = await db.execute("""
        SELECT id, title_id, session_number, date_started, date_finished,
               session_status, rating, created_at, updated_at
        FROM reading_sessions WHERE id = ?
    """, (session_id,))
    row = await cursor.fetchone()
    
    return SessionResponse(
        id=row[0],
        title_id=row[1],
        session_number=row[2],
        date_started=row[3],
        date_finished=row[4],
        session_status=row[5],
        rating=row[6],
        created_at=row[7],
        updated_at=row[8]
    )


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: int, db: aiosqlite.Connection = Depends(get_db)):
    """
    Delete a reading session.
    If this was the only session, title becomes 'Unread'.
    """
    # Get session to find title_id
    cursor = await db.execute(
        "SELECT title_id, session_number FROM reading_sessions WHERE id = ?",
        (session_id,)
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    
    title_id = row[0]
    deleted_number = row[1]
    
    # Delete the session
    await db.execute("DELETE FROM reading_sessions WHERE id = ?", (session_id,))
    
    # Renumber remaining sessions to keep sequence continuous
    await db.execute("""
        UPDATE reading_sessions
        SET session_number = session_number - 1,
            updated_at = ?
        WHERE title_id = ? AND session_number > ?
    """, (datetime.utcnow().isoformat(), title_id, deleted_number))
    
    await db.commit()
    
    # Sync cached values on title
    await sync_title_from_sessions(db, title_id)
    
    return {"message": "Session deleted", "title_id": title_id}

