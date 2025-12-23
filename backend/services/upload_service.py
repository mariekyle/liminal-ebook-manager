"""
Upload Service for Liminal Book Uploader

Handles:
- File grouping by title/author similarity
- Category auto-detection
- Duplicate detection against existing library
- Temp file management
- Final file placement on NAS
"""

import os
import re
import shutil
import uuid
import asyncio
from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path
from dataclasses import dataclass, field
from difflib import SequenceMatcher

# Metadata extraction - disabled for now, using filename parsing only
# from services.metadata import extract_metadata


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class UploadedFile:
    """Represents a single uploaded file"""
    id: str
    original_name: str
    temp_path: str
    size: int
    extension: str
    metadata: Optional[dict] = None


@dataclass
class BookGroup:
    """Represents a group of files that belong to the same book"""
    id: str
    title: str
    author: str
    series: Optional[str] = None
    series_number: Optional[str] = None
    category: str = "Uncategorized"
    category_confidence: float = 0.0
    files: list = field(default_factory=list)
    duplicate: Optional[dict] = None


@dataclass
class UploadSession:
    """Tracks state for an upload session"""
    id: str
    created_at: datetime
    temp_dir: str
    files: list = field(default_factory=list)
    books: list = field(default_factory=list)
    

# =============================================================================
# SESSION MANAGEMENT
# =============================================================================

# In-memory session store (for simplicity - could use Redis for production)
_sessions: dict[str, UploadSession] = {}

# Session timeout (1 hour)
SESSION_TIMEOUT = timedelta(hours=1)

# Temp directory base
TEMP_BASE = "/tmp/liminal-uploads"


def create_session() -> UploadSession:
    """Create a new upload session with temp directory"""
    session_id = str(uuid.uuid4())
    temp_dir = os.path.join(TEMP_BASE, session_id)
    os.makedirs(temp_dir, exist_ok=True)
    
    session = UploadSession(
        id=session_id,
        created_at=datetime.now(),
        temp_dir=temp_dir
    )
    _sessions[session_id] = session
    return session


def get_session(session_id: str) -> Optional[UploadSession]:
    """Get an existing session, checking for expiry"""
    session = _sessions.get(session_id)
    if not session:
        return None
    
    # Check if expired
    if datetime.now() - session.created_at > SESSION_TIMEOUT:
        cleanup_session(session_id)
        return None
    
    return session


def cleanup_session(session_id: str) -> int:
    """Clean up session and its temp files, return count of files cleaned"""
    session = _sessions.pop(session_id, None)
    if not session:
        return 0
    
    files_cleaned = 0
    if os.path.exists(session.temp_dir):
        for f in os.listdir(session.temp_dir):
            files_cleaned += 1
        shutil.rmtree(session.temp_dir, ignore_errors=True)
    
    return files_cleaned


def cleanup_expired_sessions():
    """Clean up all expired sessions (call periodically)"""
    now = datetime.now()
    expired = [
        sid for sid, session in _sessions.items()
        if now - session.created_at > SESSION_TIMEOUT
    ]
    for sid in expired:
        cleanup_session(sid)


# =============================================================================
# FILE HANDLING
# =============================================================================

ALLOWED_EXTENSIONS = {'.epub', '.pdf', '.mobi', '.azw', '.azw3', '.html', '.htm'}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB
MAX_BATCH_SIZE = 500 * 1024 * 1024  # 500 MB


def validate_file(filename: str, size: int) -> tuple[bool, str]:
    """Validate a file for upload. Returns (is_valid, error_message)"""
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file type: {ext}"
    
    if size > MAX_FILE_SIZE:
        return False, f"File too large: {size / 1024 / 1024:.1f} MB (max 100 MB)"
    
    return True, ""


async def save_uploaded_file(session: UploadSession, filename: str, content: bytes) -> UploadedFile:
    """Save an uploaded file to the session's temp directory"""
    file_id = str(uuid.uuid4())[:8]
    ext = os.path.splitext(filename)[1].lower()
    
    # Use original filename but ensure uniqueness
    safe_name = re.sub(r'[^\w\-_\. ]', '_', filename)
    temp_path = os.path.join(session.temp_dir, f"{file_id}_{safe_name}")
    
    # Write file
    with open(temp_path, 'wb') as f:
        f.write(content)
    
    uploaded_file = UploadedFile(
        id=file_id,
        original_name=filename,
        temp_path=temp_path,
        size=len(content),
        extension=ext
    )
    
    session.files.append(uploaded_file)
    return uploaded_file


# =============================================================================
# METADATA EXTRACTION
# =============================================================================

def extract_file_metadata(uploaded_file: UploadedFile) -> dict:
    """Extract metadata from an uploaded file"""
    # For now, use filename parsing only
    # TODO: Integrate with existing metadata extraction once signature is confirmed
    metadata = parse_filename(uploaded_file.original_name)
    uploaded_file.metadata = metadata
    return metadata


def parse_filename(filename: str) -> dict:
    """
    Parse metadata from filename.
    
    Supports formats:
    - "Author - Title.ext" (standard)
    - "Author - [Series ##] Title.ext" (with series)
    - "Author_Name_-_Title.ext" (underscore variant)
    - "12345678_Title.ext" (AO3 with work ID)
    - "Title_With_Underscores.ext" (AO3 without author - most common)
    - "Title.ext" (fallback)
    """
    # Remove extension
    name = os.path.splitext(filename)[0]
    original_name = name  # Keep original for pattern detection
    
    # --- Check for AO3 numeric ID pattern first ---
    # Pattern: "12345678_title" or "12345678 - Author - Title"
    ao3_id_match = re.match(r'^(\d{5,})[\s_-]+(.+)$', name)
    if ao3_id_match:
        work_id = ao3_id_match.group(1)
        rest = ao3_id_match.group(2)
        
        # Check if rest has author info (contains " - " or "_-_")
        if ' - ' in rest:
            parts = rest.split(' - ', 1)
            return {
                'title': parts[1].strip().replace('_', ' ') if len(parts) > 1 else rest.replace('_', ' '),
                'author': parts[0].strip().replace('_', ' '),
                'ao3_work_id': work_id
            }
        elif '_-_' in rest:
            parts = rest.split('_-_', 1)
            return {
                'title': parts[1].strip().replace('_', ' ') if len(parts) > 1 else rest.replace('_', ' '),
                'author': parts[0].strip().replace('_', ' '),
                'ao3_work_id': work_id
            }
        # No author separator - just title
        return {
            'title': rest.replace('_', ' ').strip(),
            'author': 'Unknown',
            'ao3_work_id': work_id
        }
    
    # --- Check for "Author - Title" pattern (standard) ---
    if ' - ' in name:
        parts = name.split(' - ', 1)
        author_part = parts[0].strip().replace('_', ' ')
        title_part = parts[1].strip().replace('_', ' ') if len(parts) > 1 else 'Unknown Title'
        
        # Check for series pattern: [Series ##] Title
        series_match = re.match(r'^\[(.+?)\s+(\d+(?:\.\d+)?)\]\s*(.+)$', title_part)
        if series_match:
            return {
                'author': author_part,
                'title': series_match.group(3).strip(),
                'series': series_match.group(1).strip(),
                'series_number': series_match.group(2)
            }
        
        return {
            'author': author_part,
            'title': title_part
        }
    
    # --- Check for underscore-separated "Author_-_Title" pattern ---
    if '_-_' in name:
        parts = name.split('_-_', 1)
        return {
            'author': parts[0].strip().replace('_', ' '),
            'title': parts[1].strip().replace('_', ' ') if len(parts) > 1 else 'Unknown Title'
        }
    
    # --- Underscores as word separators (no author) ---
    # Could be AO3-style or just a regular title with underscores
    # Let detect_fanfiction_from_filename() determine category with proper confidence
    if '_' in name and name.count('_') >= 2:
        return {
            'title': name.replace('_', ' ').strip(),
            'author': 'Unknown'
        }
    
    # --- Fallback: just a title ---
    display_name = name.replace('_', ' ').strip()
    return {
        'title': display_name,
        'author': 'Unknown'
    }


# =============================================================================
# SMART GROUPING ALGORITHM
# =============================================================================

def similarity_score(s1: str, s2: str) -> float:
    """Calculate similarity between two strings (0.0 to 1.0)"""
    if not s1 or not s2:
        return 0.0
    
    # Normalize: lowercase, remove special chars
    s1 = re.sub(r'[^\w\s]', '', s1.lower())
    s2 = re.sub(r'[^\w\s]', '', s2.lower())
    
    return SequenceMatcher(None, s1, s2).ratio()


def normalize_for_grouping(text: str) -> str:
    """Normalize text for grouping comparison"""
    if not text:
        return ""
    
    # Lowercase, remove extension, remove special chars
    text = os.path.splitext(text)[0]
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def should_group_together(file1: UploadedFile, file2: UploadedFile, threshold: float = 0.80) -> bool:
    """Determine if two files should be grouped as the same book"""
    
    # If both have metadata, compare title + author
    if file1.metadata and file2.metadata:
        title1 = file1.metadata.get('title', '')
        title2 = file2.metadata.get('title', '')
        author1 = file1.metadata.get('author', '')
        author2 = file2.metadata.get('author', '')
        
        title_sim = similarity_score(title1, title2)
        author_sim = similarity_score(author1, author2)
        
        # High title similarity + reasonable author similarity
        if title_sim >= threshold and author_sim >= 0.5:
            return True
        
        # Very high title similarity (same book, maybe different author spelling)
        if title_sim >= 0.95:
            return True
    
    # Fall back to filename comparison
    name1 = normalize_for_grouping(file1.original_name)
    name2 = normalize_for_grouping(file2.original_name)
    
    # Check if one is a subset of the other (common with format variations)
    # e.g., "The_Book.epub" and "The_Book.pdf"
    if name1 == name2:
        return True
    
    # Check similarity
    return similarity_score(name1, name2) >= threshold


def group_files(files: list[UploadedFile]) -> list[BookGroup]:
    """Group uploaded files into books based on similarity"""
    if not files:
        return []
    
    groups: list[BookGroup] = []
    used_files: set[str] = set()
    
    for file in files:
        if file.id in used_files:
            continue
        
        # Start a new group with this file
        group_files = [file]
        used_files.add(file.id)
        
        # Find other files that belong to this group
        for other_file in files:
            if other_file.id in used_files:
                continue
            
            if should_group_together(file, other_file):
                group_files.append(other_file)
                used_files.add(other_file.id)
        
        # Create the book group
        group = create_book_group(group_files)
        groups.append(group)
    
    return groups


def create_book_group(files: list[UploadedFile]) -> BookGroup:
    """Create a BookGroup from a list of files"""
    group_id = str(uuid.uuid4())[:8]
    
    # Find best metadata source (prefer EPUB, then PDF)
    best_metadata = None
    priority_order = ['.epub', '.pdf', '.mobi', '.azw3', '.azw', '.html']
    
    for ext in priority_order:
        for f in files:
            if f.extension == ext and f.metadata:
                best_metadata = f.metadata
                break
        if best_metadata:
            break
    
    # Fall back to first file with any metadata
    if not best_metadata:
        for f in files:
            if f.metadata:
                best_metadata = f.metadata
                break
    
    # Final fallback: parse first filename
    if not best_metadata:
        best_metadata = parse_filename(files[0].original_name)
    
    # Build file list for response
    file_list = [
        {
            "id": f.id,
            "name": f.original_name,
            "size": f.size,
            "extension": f.extension
        }
        for f in files
    ]
    
    return BookGroup(
        id=group_id,
        title=best_metadata.get('title', 'Unknown Title'),
        author=best_metadata.get('author', 'Unknown'),
        series=best_metadata.get('series'),
        series_number=best_metadata.get('series_number'),
        files=file_list
    )


# =============================================================================
# CATEGORY AUTO-DETECTION (IMPROVED)
# =============================================================================

def detect_fanfiction_from_filename(filename: str, author: str) -> tuple[bool, float, str]:
    """
    Detect if a file is FanFiction based on filename and author patterns.
    
    Returns:
        (is_fanfiction, confidence, reason)
    """
    filename_lower = filename.lower()
    name_without_ext = os.path.splitext(filename)[0]
    reasons = []
    confidence = 0.0
    
    # --- HIGH CONFIDENCE: Explicit indicators ---
    
    # AO3 numeric ID at start (e.g., "12345678_story_title.epub")
    if re.match(r'^\d{5,}[\s_-]', filename):
        reasons.append("AO3-style numeric ID in filename")
        confidence += 0.9
    
    # Contains "ao3" or "archiveofourown"
    if 'ao3' in filename_lower or 'archiveofourown' in filename_lower:
        reasons.append("contains 'ao3' or 'archiveofourown'")
        confidence += 0.9
    
    # Contains "fanfic" or "fanfiction"
    if 'fanfic' in filename_lower:
        reasons.append("contains 'fanfic'")
        confidence += 0.8
    
    # Contains "work_id" pattern
    if re.search(r'work[_\s]*id', filename_lower):
        reasons.append("contains 'work_id'")
        confidence += 0.85
    
    # FFN (FanFiction.net) pattern
    if re.search(r'ffn|fanfiction\.net', filename_lower):
        reasons.append("FanFiction.net indicator")
        confidence += 0.85
    
    # Wattpad pattern
    if 'wattpad' in filename_lower:
        reasons.append("Wattpad indicator")
        confidence += 0.8
    
    # --- MEDIUM CONFIDENCE: AO3 download pattern ---
    # Key insight: AO3 downloads use underscores as spaces and have NO author separator
    # Pattern: "Title_With_Underscores.epub" (no " - " anywhere)
    
    has_underscores = '_' in name_without_ext
    has_author_separator = ' - ' in filename or '_-_' in filename
    underscore_count = name_without_ext.count('_')
    
    # Strong AO3 indicator: multiple underscores, no author separator
    if has_underscores and not has_author_separator and underscore_count >= 2:
        reasons.append(f"AO3-style filename (underscores as spaces, no author): {underscore_count} underscores")
        confidence += 0.7
    
    # Ship patterns in filename: "Character x Character" or "CharacterxCharacter"
    ship_pattern = re.search(r'(\w+)\s*[x×]\s*(\w+)', filename_lower)
    if ship_pattern:
        reasons.append(f"ship pattern in filename: '{ship_pattern.group(0)}'")
        confidence += 0.5
    
    # --- MEDIUM CONFIDENCE: Author pattern analysis ---
    if author and author not in ('Unknown', 'Unknown Author', ''):
        author_lower = author.lower()
        
        # Username patterns
        if '_' in author:
            reasons.append(f"author has underscore: '{author}'")
            confidence += 0.4
        elif re.match(r'^[a-zA-Z0-9]+$', author) and re.search(r'\d', author) and len(author) > 3:
            reasons.append(f"author looks like username: '{author}'")
            confidence += 0.35
        elif re.match(r'^[a-z0-9]+$', author) and len(author) > 3:
            reasons.append(f"author is all lowercase (username pattern): '{author}'")
            confidence += 0.35
        elif '-' in author and re.search(r'\d', author) and ' ' not in author:
            reasons.append(f"author looks like username: '{author}'")
            confidence += 0.35
    
    # --- LOW CONFIDENCE: Trope words ---
    trope_words = ['oneshot', 'one-shot', 'one_shot', 'drabble', 'ficlet', 'pwp', 
                   'smut', 'fluff', 'angst', 'lemon', 'lime', 'slash',
                   'au_', '_au', 'alternate_universe', 'alt_universe',
                   'reader_insert', 'x_reader', 'self_insert',
                   'enemies_to_lovers', 'friends_to_lovers', 'slow_burn',
                   'fix_it', 'fix-it', 'canon_divergence']
    for trope in trope_words:
        if trope in filename_lower:
            reasons.append(f"contains trope word: '{trope}'")
            confidence += 0.3
            break
    
    is_fanfiction = confidence >= 0.5
    reason_str = "; ".join(reasons) if reasons else ""
    
    return is_fanfiction, min(confidence, 1.0), reason_str


def detect_nonfiction_from_filename(filename: str, title: str) -> tuple[bool, float, str]:
    """
    Detect if a file is Non-Fiction based on filename and title patterns.
    
    Returns:
        (is_nonfiction, confidence, reason)
    """
    check_text = f"{filename} {title}".lower()
    reasons = []
    confidence = 0.0
    
    # Strong non-fiction indicators in title
    nonfiction_title_patterns = [
        (r'\bhow to\b', "title contains 'how to'", 0.6),
        (r'\bguide to\b', "title contains 'guide to'", 0.5),
        (r'\bintroduction to\b', "title contains 'introduction to'", 0.5),
        (r'\bthe art of\b', "title contains 'the art of'", 0.4),
        (r'\bprinciples of\b', "title contains 'principles of'", 0.5),
        (r'\bthe science of\b', "title contains 'the science of'", 0.5),
        (r'\bthe history of\b', "title contains 'the history of'", 0.5),
        (r'\bmemoir\b', "contains 'memoir'", 0.6),
        (r'\bbiography\b', "contains 'biography'", 0.6),
        (r'\bautobiography\b', "contains 'autobiography'", 0.7),
        (r'\bself[- ]help\b', "contains 'self-help'", 0.6),
        (r'\btextbook\b', "contains 'textbook'", 0.7),
        (r'\bmanual\b', "contains 'manual'", 0.4),
        (r'\bhandbook\b', "contains 'handbook'", 0.5),
    ]
    
    for pattern, reason, score in nonfiction_title_patterns:
        if re.search(pattern, check_text):
            reasons.append(reason)
            confidence += score
    
    is_nonfiction = confidence >= 0.5
    reason_str = "; ".join(reasons) if reasons else ""
    
    return is_nonfiction, min(confidence, 1.0), reason_str


def detect_category(metadata: dict, filename: str = "") -> tuple[str, float]:
    """
    Detect category from metadata and filename.
    
    Priority:
    1. Explicit is_fanfiction flag from parsing
    2. Filename-based FanFiction detection
    3. Filename-based Non-Fiction detection
    4. Default to Fiction with low confidence
    
    Returns (category, confidence) where confidence is 0.0 to 1.0
    """
    title = metadata.get('title', '')
    author = metadata.get('author', '')
    
    # Check if already flagged as fanfiction from parsing (e.g., AO3 pattern)
    if metadata.get('is_fanfiction'):
        return ('FanFiction', 0.9)
    
    # Try filename-based FanFiction detection
    is_fanfic, fanfic_conf, fanfic_reason = detect_fanfiction_from_filename(filename, author)
    if is_fanfic:
        if fanfic_reason:
            print(f"Auto-detected FanFiction: '{title}' - {fanfic_reason}")
        return ('FanFiction', fanfic_conf)
    
    # Try Non-Fiction detection
    is_nonfic, nonfic_conf, nonfic_reason = detect_nonfiction_from_filename(filename, title)
    if is_nonfic:
        if nonfic_reason:
            print(f"Auto-detected Non-Fiction: '{title}' - {nonfic_reason}")
        return ('Non-Fiction', nonfic_conf)
    
    # Default to Fiction with low confidence
    return ('Fiction', 0.3)


def apply_category_detection(books: list[BookGroup], files: list[UploadedFile]):
    """Apply category detection to all book groups"""
    # Build a map of file id to (metadata, filename)
    file_info = {f.id: (f.metadata or {}, f.original_name) for f in files}
    
    for book in books:
        # Get the first file's info for detection
        # (all files in a group should be the same book)
        first_file_id = book.files[0]['id'] if book.files else None
        
        if first_file_id and first_file_id in file_info:
            metadata, filename = file_info[first_file_id]
            # Merge book-level metadata
            combined_metadata = {
                'title': book.title,
                'author': book.author,
                'is_fanfiction': metadata.get('is_fanfiction', False),
                **metadata
            }
            category, confidence = detect_category(combined_metadata, filename)
        else:
            # Fallback
            category, confidence = detect_category({
                'title': book.title,
                'author': book.author
            })
        
        book.category = category
        book.category_confidence = round(confidence, 2)


# =============================================================================
# DUPLICATE DETECTION
# =============================================================================

async def check_duplicates(books: list[BookGroup], books_dir: str):
    """
    Check for duplicates against existing library.
    Updates each BookGroup's duplicate field if a match is found.
    """
    if not os.path.exists(books_dir):
        return
    
    # Get list of existing book folders
    existing_folders = []
    for folder_name in os.listdir(books_dir):
        folder_path = os.path.join(books_dir, folder_name)
        if os.path.isdir(folder_path):
            # Get files in the folder
            files_in_folder = [
                f for f in os.listdir(folder_path)
                if os.path.splitext(f)[1].lower() in ALLOWED_EXTENSIONS
            ]
            existing_folders.append({
                'name': folder_name,
                'path': folder_path,
                'files': files_in_folder
            })
    
    for book in books:
        duplicate = find_duplicate(book, existing_folders)
        if duplicate:
            book.duplicate = duplicate


def find_duplicate(book: BookGroup, existing_folders: list[dict]) -> Optional[dict]:
    """Find if a book already exists in the library"""
    
    # Build expected folder name pattern
    # Format: "Author - Title" or "Author - [Series ##] Title"
    expected_patterns = [
        f"{book.author} - {book.title}".lower(),
        f"{book.author} - [{book.series}".lower() if book.series else None,
        book.title.lower()
    ]
    expected_patterns = [p for p in expected_patterns if p]
    
    for folder in existing_folders:
        folder_lower = folder['name'].lower()
        
        # Check for match
        is_match = False
        for pattern in expected_patterns:
            if similarity_score(folder_lower, pattern) >= 0.85:
                is_match = True
                break
            if pattern in folder_lower or folder_lower in pattern:
                is_match = True
                break
        
        if is_match:
            # Found a matching folder - check what type of duplicate
            uploading_files = {f['name'].lower() for f in book.files}
            existing_files = {f.lower() for f in folder['files']}
            
            # Check for exact duplicates
            exact_matches = uploading_files & existing_files
            new_files = uploading_files - existing_files
            
            if exact_matches and not new_files:
                # All files already exist
                return {
                    'existing_folder': folder['name'],
                    'existing_files': folder['files'],
                    'type': 'exact_match',
                    'message': 'All files already exist in library'
                }
            elif new_files:
                # Some files are new (different formats)
                return {
                    'existing_folder': folder['name'],
                    'existing_files': folder['files'],
                    'type': 'different_format',
                    'new_files': list(new_files),
                    'message': f'New format(s) can be added: {", ".join(new_files)}'
                }
    
    return None


# =============================================================================
# FINALIZATION
# =============================================================================

def build_folder_name(title: str, author: str, series: str = None, series_number: str = None) -> str:
    """Build the folder name for a book"""
    # Sanitize components
    def sanitize(s):
        if not s:
            return s
        # Remove/replace invalid filesystem characters
        s = re.sub(r'[<>:"/\\|?*]', '', s)
        s = s.strip('. ')
        return s
    
    author = sanitize(author) or 'Unknown Author'
    title = sanitize(title) or 'Unknown Title'
    
    if series and series_number:
        series = sanitize(series)
        return f"{author} - [{series} {series_number}] {title}"
    else:
        return f"{author} - {title}"


async def finalize_book(
    session: UploadSession,
    book_data: dict,
    books_dir: str
) -> dict:
    """
    Finalize a single book - move files to NAS.
    
    book_data should contain:
    - id: book group id
    - action: 'new', 'add_format', 'replace', or 'skip'
    - For 'new'/'replace': title, author, series, series_number, category
    - For 'add_format': existing_folder
    """
    action = book_data.get('action', 'new')
    book_id = book_data.get('id')
    
    if action == 'skip':
        return {'id': book_id, 'status': 'skipped'}
    
    # Find the book group in session
    book_group = None
    for bg in session.books:
        if bg.id == book_id:
            book_group = bg
            break
    
    if not book_group:
        return {'id': book_id, 'status': 'error', 'message': 'Book not found in session'}
    
    # Find the actual files
    file_ids = {f['id'] for f in book_group.files}
    files_to_move = [f for f in session.files if f.id in file_ids]
    
    if not files_to_move:
        return {'id': book_id, 'status': 'error', 'message': 'No files found for book'}
    
    try:
        if action == 'add_format':
            # Add to existing folder
            existing_folder = book_data.get('existing_folder')
            target_dir = os.path.join(books_dir, existing_folder)
            
            if not os.path.exists(target_dir):
                return {'id': book_id, 'status': 'error', 'message': 'Existing folder not found'}
            
            for f in files_to_move:
                target_path = os.path.join(target_dir, f.original_name)
                shutil.copy2(f.temp_path, target_path)
            
            return {
                'id': book_id,
                'status': 'format_added',
                'folder': existing_folder,
                'files_added': len(files_to_move)
            }
        
        elif action == 'replace':
            # Delete existing and create new
            existing_folder = book_data.get('existing_folder')
            if existing_folder:
                existing_path = os.path.join(books_dir, existing_folder)
                if os.path.exists(existing_path):
                    shutil.rmtree(existing_path)
            
            # Fall through to 'new' logic
            action = 'new'
        
        if action == 'new':
            # Create new folder
            folder_name = build_folder_name(
                title=book_data.get('title', book_group.title),
                author=book_data.get('author', book_group.author),
                series=book_data.get('series', book_group.series),
                series_number=book_data.get('series_number', book_group.series_number)
            )
            
            target_dir = os.path.join(books_dir, folder_name)
            os.makedirs(target_dir, exist_ok=True)
            
            for f in files_to_move:
                target_path = os.path.join(target_dir, f.original_name)
                shutil.copy2(f.temp_path, target_path)
            
            return {
                'id': book_id,
                'status': 'created',
                'folder': folder_name,
                'files_added': len(files_to_move)
            }
        
        return {'id': book_id, 'status': 'error', 'message': f'Unknown action: {action}'}
        
    except Exception as e:
        return {'id': book_id, 'status': 'error', 'message': str(e)}


async def finalize_batch(
    session: UploadSession,
    books_data: list[dict],
    books_dir: str
) -> list[dict]:
    """Finalize all books in a batch"""
    results = []
    
    for book_data in books_data:
        result = await finalize_book(session, book_data, books_dir)
        results.append(result)
    
    return results
