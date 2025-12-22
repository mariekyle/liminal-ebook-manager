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

ALLOWED_EXTENSIONS = {'.epub', '.pdf', '.mobi', '.azw3', '.html', '.htm'}
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
    """Parse metadata from filename as fallback"""
    # Remove extension
    name = os.path.splitext(filename)[0]
    
    # Common patterns:
    # "Author - Title"
    # "Author - [Series ##] Title"
    # "Title - Author"
    # "Title"
    
    # Replace underscores with spaces
    name = name.replace('_', ' ')
    
    # Try "Author - Title" pattern
    if ' - ' in name:
        parts = name.split(' - ', 1)
        # Heuristic: if first part looks like an author name (shorter, no numbers)
        if len(parts[0]) < len(parts[1]) and not re.search(r'\d', parts[0]):
            return {
                'author': parts[0].strip(),
                'title': parts[1].strip()
            }
        else:
            return {
                'title': parts[0].strip(),
                'author': parts[1].strip() if len(parts) > 1 else 'Unknown'
            }
    
    return {
        'title': name.strip(),
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
    priority_order = ['.epub', '.pdf', '.mobi', '.azw3', '.html']
    
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
        author=best_metadata.get('author', 'Unknown Author'),
        series=best_metadata.get('series'),
        series_number=best_metadata.get('series_number'),
        files=file_list
    )


# =============================================================================
# CATEGORY AUTO-DETECTION
# =============================================================================

# Fanfiction indicators (high confidence)
FANFIC_INDICATORS = {
    'tags': ['fanworks', 'ao3', 'fanfiction', 'fandom', 'ship'],
    'author_patterns': [r'_', r'\d{2,}', r'^[a-z]+\d+$'],  # underscores, numbers in name
    'summary_keywords': [
        'this fic', 'slow burn', 'enemies to lovers', 'friends to lovers',
        'one shot', 'oneshot', 'drabble', 'fluff', 'angst', 'smut',
        'AU', 'alternate universe', 'canon divergence', 'fix-it',
        'OTP', 'pairing', 'ship', 'x reader', 'reader insert'
    ],
    'ship_pattern': r'\b\w+/\w+\b'  # Name/Name pattern
}

# Non-fiction indicators
NONFICTION_INDICATORS = {
    'tags': ['non-fiction', 'nonfiction', 'biography', 'memoir', 'self-help', 
             'business', 'science', 'history', 'psychology', 'philosophy',
             'economics', 'politics', 'health', 'finance'],
    'title_keywords': ['how to', 'guide to', 'introduction to', 'the art of',
                       'principles of', 'the science of', 'the history of']
}


def detect_category(metadata: dict) -> tuple[str, float]:
    """
    Detect category from metadata.
    Returns (category, confidence) where confidence is 0.0 to 1.0
    """
    title = (metadata.get('title') or '').lower()
    author = (metadata.get('author') or '').lower()
    summary = (metadata.get('summary') or '').lower()
    tags = [t.lower() for t in (metadata.get('tags') or [])]
    
    # Check for FanFiction
    fanfic_score = 0.0
    
    # Tag matches (high confidence)
    for tag in tags:
        if any(indicator in tag for indicator in FANFIC_INDICATORS['tags']):
            fanfic_score += 0.4
    
    # Author pattern matches
    for pattern in FANFIC_INDICATORS['author_patterns']:
        if re.search(pattern, author):
            fanfic_score += 0.2
    
    # Summary keyword matches
    for keyword in FANFIC_INDICATORS['summary_keywords']:
        if keyword.lower() in summary:
            fanfic_score += 0.15
    
    # Ship pattern in tags or title
    if re.search(FANFIC_INDICATORS['ship_pattern'], ' '.join(tags) + ' ' + title):
        fanfic_score += 0.3
    
    if fanfic_score >= 0.5:
        return ('FanFiction', min(fanfic_score, 1.0))
    
    # Check for Non-Fiction
    nonfic_score = 0.0
    
    for tag in tags:
        if any(indicator in tag for indicator in NONFICTION_INDICATORS['tags']):
            nonfic_score += 0.3
    
    for keyword in NONFICTION_INDICATORS['title_keywords']:
        if keyword in title:
            nonfic_score += 0.25
    
    if nonfic_score >= 0.4:
        return ('Non-Fiction', min(nonfic_score, 1.0))
    
    # Default to Fiction with low confidence
    return ('Fiction', 0.3)


def apply_category_detection(books: list[BookGroup], files: list[UploadedFile]):
    """Apply category detection to all book groups"""
    # Build a map of file id to metadata
    file_metadata = {f.id: f.metadata or {} for f in files}
    
    for book in books:
        # Combine metadata from all files in the group
        combined_metadata = {
            'title': book.title,
            'author': book.author,
            'summary': '',
            'tags': []
        }
        
        for file_info in book.files:
            file_id = file_info['id']
            if file_id in file_metadata:
                meta = file_metadata[file_id]
                if meta.get('summary'):
                    combined_metadata['summary'] += ' ' + meta['summary']
                if meta.get('tags'):
                    combined_metadata['tags'].extend(meta['tags'])
        
        category, confidence = detect_category(combined_metadata)
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
