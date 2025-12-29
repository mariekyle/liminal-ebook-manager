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

# Metadata extraction from EPUB/PDF files
from services.metadata import extract_metadata as extract_epub_metadata


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

async def extract_file_metadata(uploaded_file: UploadedFile) -> dict:
    """
    Extract metadata from an uploaded file.
    
    Priority:
    1. EPUB/PDF metadata (author, title from file)
    2. Filename parsing (fallback)
    """
    # Start with filename parsing as base
    metadata = parse_filename(uploaded_file.original_name)
    
    # Try to extract richer metadata from EPUB/PDF files
    if uploaded_file.extension in ('.epub', '.pdf'):
        try:
            file_path = Path(uploaded_file.temp_path)
            extracted = await extract_epub_metadata(file_path)
            
            # Merge extracted data (prefer extracted over filename-parsed)
            if extracted.get('title'):
                metadata['title'] = extracted['title']
            
            if extracted.get('authors') and len(extracted['authors']) > 0:
                # Join multiple authors with ", "
                metadata['author'] = ', '.join(extracted['authors'])
            
            if extracted.get('publication_year'):
                metadata['publication_year'] = extracted['publication_year']
            
            if extracted.get('summary'):
                metadata['summary'] = extracted['summary']
            
            if extracted.get('tags'):
                metadata['tags'] = extracted['tags']
            
            if extracted.get('word_count'):
                metadata['word_count'] = extracted['word_count']
            
            print(f"Extracted metadata from {uploaded_file.original_name}: author='{metadata.get('author')}', title='{metadata.get('title')}'")
                
        except Exception as e:
            print(f"Metadata extraction failed for {uploaded_file.original_name}: {e}")
            # Continue with filename-parsed metadata
    
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
    has_author_separator = ' - ' in name_without_ext or '_-_' in name_without_ext
    
    if has_underscores and not has_author_separator:
        # Count underscores - more underscores = more likely AO3
        underscore_count = name_without_ext.count('_')
        if underscore_count >= 3:
            reasons.append(f"AO3-style underscore pattern ({underscore_count} underscores)")
            confidence += 0.3
        elif underscore_count >= 2:
            reasons.append("some underscores, possibly AO3")
            confidence += 0.15
    
    # --- MEDIUM CONFIDENCE: Username-style author ---
    # AO3 authors often have username patterns: lowercase, underscores, numbers
    if author and author != 'Unknown':
        author_lower = author.lower()
        # Check for username patterns
        if re.match(r'^[a-z0-9_]+$', author_lower) and len(author) < 25:
            reasons.append("username-style author")
            confidence += 0.2
    
    # --- MEDIUM CONFIDENCE: Fandom-specific keywords ---
    fandom_keywords = [
        'drarry', 'dramione', 'wolfstar', 'jily', 'hinny', 'romione',  # Harry Potter
        'destiel', 'sabriel', 'wincest',  # Supernatural  
        'stucky', 'stony', 'thorki', 'ironstrange',  # Marvel
        'johnlock', 'mystrade',  # Sherlock
        'klance', 'sheith',  # Voltron
        'sterek', 'stydia',  # Teen Wolf
        'obikin', 'reylo', 'stormpilot',  # Star Wars
        'bakudeku', 'tododeku', 'kiribaku',  # My Hero Academia
        'ereri', 'levihan',  # Attack on Titan
        'larry', 'ziam',  # One Direction (RPF)
        'supercorp', 'clexa',  # DC/CW
        'malec', 'clace',  # Shadowhunters
        'percabeth', 'solangelo',  # Percy Jackson
        'nalu', 'gruvia',  # Fairy Tail
        'sasunaru', 'kakairu',  # Naruto
    ]
    
    for keyword in fandom_keywords:
        if keyword in filename_lower:
            reasons.append(f"fandom keyword: {keyword}")
            confidence += 0.4
            break  # Only count once
    
    # --- MEDIUM CONFIDENCE: Common fanfic tropes in filename ---
    trope_keywords = [
        'soulmate', 'soulmates', 'soulbond',
        'omegaverse', 'alpha', 'omega', 'abo',
        'enemies to lovers', 'enemies-to-lovers', 'enemies_to_lovers',
        'fake dating', 'fake-dating', 'fake_dating',
        'slow burn', 'slow-burn', 'slowburn',
        'coffee shop', 'coffeeshop', 'coffee_shop',
        'high school', 'highschool', 'college au',
        'modern au', 'no powers', 'canon divergent',
        'fix-it', 'fixit', 'fix_it',
        'time travel', 'timetravel',
        'oneshot', 'one-shot', 'one_shot',
        'pwp', 'smut', 'fluff', 'angst',
        'hurt comfort', 'hurt-comfort', 'hurtcomfort',
        'found family',
        'mpreg',
        'hanahaki',
        'wingfic',
    ]
    
    for trope in trope_keywords:
        if trope in filename_lower:
            reasons.append(f"trope keyword: {trope}")
            confidence += 0.3
            break  # Only count once
    
    # Cap confidence at 1.0
    confidence = min(confidence, 1.0)
    
    is_fanfiction = confidence >= 0.3
    reason_str = "; ".join(reasons) if reasons else "no strong indicators"
    
    return is_fanfiction, confidence, reason_str


def detect_category(metadata: dict, filename: str = None) -> tuple[str, float]:
    """
    Detect the category for a book.
    
    Returns:
        (category, confidence)
    """
    # First check for fanfiction
    author = metadata.get('author', 'Unknown')
    check_filename = filename or metadata.get('original_filename', '')
    
    is_ff, ff_confidence, reason = detect_fanfiction_from_filename(check_filename, author)
    
    if is_ff:
        return "FanFiction", ff_confidence
    
    # Check metadata for fanfiction indicators
    if metadata.get('is_fanfiction'):
        return "FanFiction", 0.8
    
    # Check tags for non-fiction indicators
    tags = metadata.get('tags', [])
    if tags:
        tags_lower = [t.lower() for t in tags]
        nonfiction_tags = ['non-fiction', 'nonfiction', 'biography', 'history', 
                          'science', 'self-help', 'business', 'memoir', 'reference']
        for tag in nonfiction_tags:
            if any(tag in t for t in tags_lower):
                return "Non-Fiction", 0.6
    
    # Default to Fiction with low confidence
    return "Fiction", 0.3


def apply_category_detection(books: list[BookGroup], files: list[UploadedFile]):
    """Apply category detection to all books"""
    for book in books:
        # Get first file's info for detection
        if book.files:
            file_id = book.files[0]['id']
            filename = book.files[0]['name']
            
            # Find the uploaded file to get its metadata
            metadata = None
            for f in files:
                if f.id == file_id:
                    metadata = f.metadata
                    break
            
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
# DUPLICATE DETECTION (FIXED - Now scans category subdirectories)
# =============================================================================

async def check_duplicates(books: list[BookGroup], books_dir: str):
    """
    Check for duplicates against existing library.
    Updates each BookGroup's duplicate field if a match is found.
    
    FIXED: Now properly scans category subdirectories (FanFiction/, Fiction/, Non-Fiction/)
    """
    if not os.path.exists(books_dir):
        return
    
    # Get list of existing book folders from ALL category subdirectories
    existing_folders = []
    
    # Known category directories
    categories = ['FanFiction', 'Fiction', 'Non-Fiction']
    
    for category in categories:
        category_path = os.path.join(books_dir, category)
        if not os.path.exists(category_path) or not os.path.isdir(category_path):
            continue
        
        # Scan book folders within this category
        for folder_name in os.listdir(category_path):
            folder_path = os.path.join(category_path, folder_name)
            if os.path.isdir(folder_path):
                # Get files in the folder
                files_in_folder = [
                    f for f in os.listdir(folder_path)
                    if os.path.splitext(f)[1].lower() in ALLOWED_EXTENSIONS
                ]
                existing_folders.append({
                    'name': folder_name,
                    'path': folder_path,
                    'category': category,
                    'files': files_in_folder
                })
    
    # Also check root level for any books directly in books_dir (legacy support)
    for folder_name in os.listdir(books_dir):
        folder_path = os.path.join(books_dir, folder_name)
        # Skip category directories themselves
        if folder_name in categories:
            continue
        if os.path.isdir(folder_path):
            files_in_folder = [
                f for f in os.listdir(folder_path)
                if os.path.splitext(f)[1].lower() in ALLOWED_EXTENSIONS
            ]
            if files_in_folder:  # Only add if there are book files
                existing_folders.append({
                    'name': folder_name,
                    'path': folder_path,
                    'category': None,  # Root level
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
                    'existing_folder': folder['path'],  # Use full path now
                    'existing_files': folder['files'],
                    'type': 'exact_match',
                    'category': folder.get('category'),
                    'message': 'All files already exist in library'
                }
            elif new_files:
                # Some files are new (different formats)
                return {
                    'existing_folder': folder['path'],  # Use full path now
                    'existing_files': folder['files'],
                    'type': 'different_format',
                    'new_files': list(new_files),
                    'category': folder.get('category'),
                    'message': f'New format(s) can be added: {", ".join(new_files)}'
                }
    
    return None


# =============================================================================
# FINALIZATION (FIXED - Now includes category in path)
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
    
    FIXED: Now properly creates folders in category subdirectories
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
            # Add to existing folder - existing_folder now contains full path
            existing_folder = book_data.get('existing_folder')
            
            # Check if it's already a full path
            if os.path.isabs(existing_folder) or existing_folder.startswith(books_dir):
                target_dir = existing_folder
            else:
                # Legacy support: if just folder name, search for it
                target_dir = None
                for category in ['FanFiction', 'Fiction', 'Non-Fiction']:
                    potential_path = os.path.join(books_dir, category, existing_folder)
                    if os.path.exists(potential_path):
                        target_dir = potential_path
                        break
                # Also check root level
                if not target_dir:
                    root_path = os.path.join(books_dir, existing_folder)
                    if os.path.exists(root_path):
                        target_dir = root_path
            
            if not target_dir or not os.path.exists(target_dir):
                return {'id': book_id, 'status': 'error', 'message': f'Existing folder not found: {existing_folder}'}
            
            for f in files_to_move:
                target_path = os.path.join(target_dir, f.original_name)
                shutil.copy2(f.temp_path, target_path)
            
            return {
                'id': book_id,
                'status': 'format_added',
                'folder': target_dir,
                'files_added': len(files_to_move)
            }
        
        elif action == 'replace':
            # Delete existing and create new
            existing_folder = book_data.get('existing_folder')
            if existing_folder:
                # existing_folder might be full path or just name
                if os.path.isabs(existing_folder):
                    existing_path = existing_folder
                else:
                    # Search for it
                    existing_path = None
                    for category in ['FanFiction', 'Fiction', 'Non-Fiction']:
                        potential_path = os.path.join(books_dir, category, existing_folder)
                        if os.path.exists(potential_path):
                            existing_path = potential_path
                            break
                    if not existing_path:
                        existing_path = os.path.join(books_dir, existing_folder)
                
                if os.path.exists(existing_path):
                    shutil.rmtree(existing_path)
            
            # Fall through to 'new' logic
            action = 'new'
        
        if action == 'new':
            # Create new folder - flat structure: /books/Author - Title/
            folder_name = build_folder_name(
                title=book_data.get('title', book_group.title),
                author=book_data.get('author', book_group.author),
                series=book_data.get('series', book_group.series),
                series_number=book_data.get('series_number', book_group.series_number)
            )
            
            # Build full path: books_dir / Author - Title (NO category subfolder)
            target_dir = os.path.join(books_dir, folder_name)
            os.makedirs(target_dir, exist_ok=True)
            
            for f in files_to_move:
                target_path = os.path.join(target_dir, f.original_name)
                shutil.copy2(f.temp_path, target_path)
            
            return {
                'id': book_id,
                'status': 'created',
                'folder': target_dir,
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
