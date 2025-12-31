"""
Metadata Extraction Service

Extracts metadata from ebook files (EPUB, PDF).
Ported from the Obsidian plugin's MetadataExtractor class.

This module reads book files to extract:
- Title
- Authors
- Publication year
- Summary/description
- Tags/subjects
- Word count (approximate)
"""

import json
import re
import zipfile
from pathlib import Path
from typing import Optional
from urllib.parse import unquote
from xml.etree import ElementTree as ET

# For PDF handling
try:
    from PyPDF2 import PdfReader
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False
    print("Warning: PyPDF2 not installed. PDF metadata extraction disabled.")


async def extract_metadata(file_path: Path) -> dict:
    """
    Extract metadata from a book file.
    
    Args:
        file_path: Path to the book file (.epub, .pdf)
    
    Returns:
        dict with: title, authors, publication_year, summary, tags, word_count
    """
    suffix = file_path.suffix.lower()
    
    if suffix == '.epub':
        return await extract_from_epub(file_path)
    elif suffix == '.pdf':
        return await extract_from_pdf(file_path)
    else:
        # Unsupported format
        return {}


async def extract_from_epub(file_path: Path) -> dict:
    """
    Extract metadata from an EPUB file.
    
    EPUB files are ZIP archives containing:
    - META-INF/container.xml (points to content.opf)
    - OEBPS/content.opf (or similar path) - contains Dublin Core metadata
    - HTML/XHTML content files
    """
    result = {
        "title": None,
        "authors": [],
        "publication_year": None,
        "summary": None,
        "tags": [],
        "word_count": None,
        # Enhanced metadata (Phase 7.0)
        "fandom": None,
        "relationships": None,
        "characters": None,
        "content_rating": None,
        "ao3_warnings": None,
        "ao3_category": None,
        "source_url": None,
        "isbn": None,
        "publisher": None,
        "chapter_count": None,
        "completion_status": None,
    }
    
    try:
        with zipfile.ZipFile(file_path, 'r') as zf:
            # Find the content.opf file
            opf_path = await _find_opf_path(zf)
            
            if not opf_path:
                return result
            
            # Read and parse the OPF file
            opf_content = zf.read(opf_path).decode('utf-8')
            
            # Parse XML (handling namespaces)
            root = ET.fromstring(opf_content)
            
            # Define namespace prefixes
            namespaces = {
                'opf': 'http://www.idpf.org/2007/opf',
                'dc': 'http://purl.org/dc/elements/1.1/'
            }
            
            # Find metadata element (might be with or without namespace)
            metadata = root.find('.//opf:metadata', namespaces)
            if metadata is None:
                metadata = root.find('.//{http://www.idpf.org/2007/opf}metadata')
            if metadata is None:
                metadata = root.find('.//metadata')
            
            if metadata is not None:
                # Extract title
                title_elem = metadata.find('dc:title', namespaces)
                if title_elem is None:
                    title_elem = metadata.find('.//{http://purl.org/dc/elements/1.1/}title')
                if title_elem is not None and title_elem.text:
                    result["title"] = title_elem.text.strip()
                
                # Extract authors (dc:creator)
                creators = metadata.findall('dc:creator', namespaces)
                if not creators:
                    creators = metadata.findall('.//{http://purl.org/dc/elements/1.1/}creator')
                
                result["authors"] = [
                    c.text.strip() for c in creators 
                    if c.text and c.text.strip()
                ]
                
                # Extract publication date
                date_elem = metadata.find('dc:date', namespaces)
                if date_elem is None:
                    date_elem = metadata.find('.//{http://purl.org/dc/elements/1.1/}date')
                if date_elem is not None and date_elem.text:
                    result["publication_year"] = _extract_year(date_elem.text)
                
                # Extract description/summary
                desc_elem = metadata.find('dc:description', namespaces)
                if desc_elem is None:
                    desc_elem = metadata.find('.//{http://purl.org/dc/elements/1.1/}description')
                if desc_elem is not None and desc_elem.text:
                    # Strip HTML from description
                    result["summary"] = _strip_html(desc_elem.text)
                
                # Extract subjects/tags
                subjects = metadata.findall('dc:subject', namespaces)
                if not subjects:
                    subjects = metadata.findall('.//{http://purl.org/dc/elements/1.1/}subject')
                
                raw_tags = [s.text.strip() for s in subjects if s.text and s.text.strip()]
                
                # Extract publisher for source detection
                result["publisher"] = extract_publisher(root, namespaces)
                
                # Detect source type
                source_type = detect_source_type(opf_content, result.get("publisher"))
                
                # Enhanced extraction based on source type
                if source_type == "ao3" or (result.get("publisher") and "archive of our own" in result.get("publisher", "").lower()):
                    # Parse AO3 structured tags
                    parsed = parse_ao3_subjects(raw_tags)
                    result["fandom"] = parsed["fandom"]
                    result["relationships"] = json.dumps(parsed["relationships"]) if parsed["relationships"] else None
                    result["characters"] = json.dumps(parsed["characters"]) if parsed["characters"] else None
                    result["content_rating"] = parsed["content_rating"]
                    result["ao3_warnings"] = json.dumps(parsed["ao3_warnings"]) if parsed["ao3_warnings"] else None
                    result["ao3_category"] = json.dumps(parsed["ao3_category"]) if parsed["ao3_category"] else None
                    # Only keep freeform tags
                    result["tags"] = [_sanitize_tag(t) for t in parsed["freeform_tags"]]
                else:
                    # Standard tag processing
                    result["tags"] = [_sanitize_tag(t) for t in raw_tags]
                    
                    # Still try to detect completion status from tags
                    detected_status = detect_completion_status(raw_tags, result.get("summary"))
                    if detected_status:
                        result["completion_status"] = detected_status
                
                # Extract source URL (works for FanFicFare, etc.)
                result["source_url"] = extract_source_url(root, namespaces)
                
                # Extract ISBN (for published books)
                result["isbn"] = extract_isbn(root, namespaces)
                
                # Extract Calibre series info (may override filename-parsed series)
                calibre_series, calibre_index = extract_calibre_series(root, namespaces)
                if calibre_series and not result.get("series"):
                    result["series"] = calibre_series
                if calibre_index is not None and not result.get("series_number"):
                    result["series_number"] = str(calibre_index)
                
                # Count chapters
                result["chapter_count"] = count_chapters_from_manifest(root, namespaces)
                
                # Detect completion status from tags/summary (if not already set by AO3 parsing)
                if not result.get("completion_status"):
                    result["completion_status"] = detect_completion_status(
                        raw_tags, 
                        result.get("summary")
                    )
            
            # Count words in content files
            result["word_count"] = await _count_epub_words(zf, opf_path)
    
    except Exception as e:
        print(f"Error extracting EPUB metadata from {file_path}: {e}")
    
    return result


async def _find_opf_path(zf: zipfile.ZipFile) -> Optional[str]:
    """
    Find the path to content.opf in an EPUB archive.
    """
    # Try reading container.xml first
    try:
        container_content = zf.read('META-INF/container.xml').decode('utf-8')
        root = ET.fromstring(container_content)
        
        # Find rootfile element
        for rootfile in root.iter():
            if rootfile.tag.endswith('rootfile'):
                return rootfile.get('full-path')
    except (KeyError, ET.ParseError):
        pass
    
    # Fallback: search for .opf file
    for name in zf.namelist():
        if name.endswith('.opf'):
            return name
    
    return None


async def _count_epub_words(zf: zipfile.ZipFile, opf_path: str) -> Optional[int]:
    """
    Count words in EPUB content files.
    This is approximate but gives a reasonable estimate.
    """
    try:
        opf_content = zf.read(opf_path).decode('utf-8')
        root = ET.fromstring(opf_content)
        
        # Get the directory containing the OPF
        opf_dir = str(Path(opf_path).parent)
        if opf_dir == '.':
            opf_dir = ''
        
        # Build a set of all file paths in the ZIP for fast lookup
        zip_files = set(zf.namelist())
        
        # Find manifest items that are HTML/XHTML
        total_words = 0
        files_processed = 0
        
        for item in root.iter():
            if item.tag.endswith('item'):
                media_type = item.get('media-type', '')
                href = item.get('href', '')
                
                if not href:
                    continue
                
                if 'html' in media_type or 'xhtml' in media_type:
                    # URL decode the href (handles %20, etc.)
                    href = unquote(href)
                    
                    # Try multiple path resolution strategies
                    possible_paths = []
                    
                    # Strategy 1: Relative to OPF directory
                    if opf_dir:
                        possible_paths.append(f"{opf_dir}/{href}")
                    
                    # Strategy 2: href as-is (might be absolute within ZIP)
                    possible_paths.append(href)
                    
                    # Strategy 3: Without leading slash if present
                    if href.startswith('/'):
                        possible_paths.append(href[1:])
                    
                    # Strategy 4: Resolve .. in paths
                    if opf_dir and '..' in href:
                        # Manual normalization for ZIP paths
                        parts = f"{opf_dir}/{href}".split('/')
                        resolved_parts = []
                        for part in parts:
                            if part == '..':
                                if resolved_parts:
                                    resolved_parts.pop()
                            elif part and part != '.':
                                resolved_parts.append(part)
                        possible_paths.append('/'.join(resolved_parts))
                    
                    # Try each possible path
                    content = None
                    for content_path in possible_paths:
                        if content_path in zip_files:
                            try:
                                content = zf.read(content_path).decode('utf-8', errors='ignore')
                                break
                            except Exception:
                                continue
                    
                    if content:
                        # Strip HTML and count words
                        text = _strip_html(content)
                        words = len(text.split())
                        total_words += words
                        files_processed += 1
        
        # Log for debugging if we got suspiciously low counts
        if files_processed > 0 and total_words < 1000:
            print(f"Warning: EPUB word count suspiciously low: {total_words} words from {files_processed} files")
        
        return total_words if total_words > 0 else None
        
    except Exception as e:
        print(f"Error counting EPUB words: {e}")
        return None


async def extract_from_pdf(file_path: Path) -> dict:
    """
    Extract metadata from a PDF file.
    
    PDFs have a metadata dictionary that may contain:
    - Title, Author, Subject, Keywords
    - CreationDate, ModDate
    """
    result = {
        "title": None,
        "authors": [],
        "publication_year": None,
        "summary": None,
        "tags": [],
        "word_count": None,
    }
    
    if not PDF_SUPPORT:
        return result
    
    try:
        reader = PdfReader(str(file_path))
        info = reader.metadata
        
        if info:
            # Extract title
            if info.get('/Title'):
                result["title"] = str(info['/Title']).strip()
            
            # Extract author
            if info.get('/Author'):
                author_str = str(info['/Author']).strip()
                # Split multiple authors
                authors = re.split(r'[,;&]|(?:\sand\s)', author_str, flags=re.IGNORECASE)
                result["authors"] = [a.strip() for a in authors if a.strip()]
            
            # Extract date
            date_str = info.get('/CreationDate') or info.get('/ModDate')
            if date_str:
                result["publication_year"] = _extract_year(str(date_str))
            
            # Extract subject as summary
            if info.get('/Subject'):
                result["summary"] = str(info['/Subject']).strip()
            
            # Extract keywords as tags
            if info.get('/Keywords'):
                keywords = str(info['/Keywords'])
                tags = re.split(r'[,;]', keywords)
                result["tags"] = [_sanitize_tag(t) for t in tags if t.strip()]
        
        # Count words (can be slow for large PDFs)
        try:
            total_words = 0
            for page in reader.pages[:20]:  # Limit to first 20 pages for speed
                text = page.extract_text()
                if text:
                    total_words += len(text.split())
            
            # Extrapolate if we limited pages
            if len(reader.pages) > 20:
                total_words = int(total_words * (len(reader.pages) / 20))
            
            result["word_count"] = total_words if total_words > 0 else None
        except Exception:
            pass
    
    except Exception as e:
        print(f"Error extracting PDF metadata from {file_path}: {e}")
    
    return result


def _extract_year(date_str: str) -> Optional[int]:
    """
    Extract a 4-digit year from various date string formats.
    
    Handles:
    - "2023"
    - "2023-01-15"
    - "D:20230115120000" (PDF format)
    - "January 15, 2023"
    """
    if not date_str or not isinstance(date_str, str):
        return None
    
    # Look for 4-digit year pattern
    match = re.search(r'\b(19|20)\d{2}\b', date_str)
    if match:
        return int(match.group(0))
    
    return None


def _strip_html(html: str) -> str:
    """
    Remove HTML tags and decode entities from a string.
    """
    if not html:
        return ""
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', html)
    
    # Decode common HTML entities
    entities = {
        '&nbsp;': ' ',
        '&quot;': '"',
        '&apos;': "'",
        '&lt;': '<',
        '&gt;': '>',
        '&amp;': '&',
        '&#39;': "'",
        '&#x27;': "'",
    }
    
    for entity, char in entities.items():
        text = text.replace(entity, char)
    
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()


def _sanitize_tag(tag: str) -> str:
    """
    Sanitize a tag for use in the app.
    - Convert spaces to hyphens
    - Lowercase
    - Remove special characters
    """
    if not tag:
        return ""
    
    sanitized = tag.strip().lower()
    sanitized = re.sub(r'\s+', '-', sanitized)  # Spaces to hyphens
    sanitized = re.sub(r'[^\w\-]', '', sanitized)  # Remove special chars
    
    return sanitized


# ============================================================
# AO3 Tag Parsing (Phase 7.0)
# ============================================================

# Known AO3 content ratings
AO3_RATINGS = {
    "explicit", "mature", "teen and up audiences", 
    "general audiences", "not rated"
}

# Known AO3 archive warnings
AO3_WARNINGS = {
    "graphic depictions of violence",
    "major character death", 
    "no archive warnings apply",
    "choose not to use archive warnings",
    "rape/non-con",
    "underage"
}

# Known AO3 relationship categories
AO3_CATEGORIES = {"f/f", "f/m", "m/m", "gen", "multi", "other"}

# Meta tags to skip (not useful as freeform tags)
AO3_SKIP_TAGS = {"fanworks", "fanfiction", "fanfic"}


def parse_ao3_subjects(subjects: list[str]) -> dict:
    """
    Parse AO3 dc:subject tags into structured fields.
    
    AO3 stores all metadata in dc:subject tags with patterns:
    - Fandom: "Series Name - Creator Name"
    - Relationship: "Character/Character" (romantic) or "Character & Character" (platonic)
    - Rating: "Explicit", "Mature", "Teen And Up Audiences", "General Audiences"
    - Warning: "Graphic Depictions Of Violence", etc.
    - Category: "F/F", "F/M", "M/M", "Gen", "Multi"
    - Everything else: Freeform tags (tropes, themes, etc.)
    
    Returns dict with:
        fandom: str or None
        relationships: list[str]
        characters: list[str]  
        content_rating: str or None
        ao3_warnings: list[str]
        ao3_category: list[str]
        freeform_tags: list[str]
    """
    result = {
        "fandom": None,
        "relationships": [],
        "characters": [],
        "content_rating": None,
        "ao3_warnings": [],
        "ao3_category": [],
        "freeform_tags": []
    }
    
    # Track seen character names to avoid duplicates
    seen_characters = set()
    
    for tag in subjects:
        if not tag or not tag.strip():
            continue
            
        tag = tag.strip()
        tag_lower = tag.lower()
        
        # Skip meta tags
        if tag_lower in AO3_SKIP_TAGS:
            continue
        
        # Check for rating
        if tag_lower in AO3_RATINGS:
            # Normalize rating display
            if tag_lower == "teen and up audiences":
                result["content_rating"] = "Teen"
            elif tag_lower == "general audiences":
                result["content_rating"] = "General"
            elif tag_lower == "not rated":
                result["content_rating"] = "Not Rated"
            else:
                result["content_rating"] = tag.title()
            continue
        
        # Check for archive warning
        if tag_lower in AO3_WARNINGS:
            result["ao3_warnings"].append(tag)
            continue
        
        # Check for category (F/M, M/M, etc.)
        if tag_lower in AO3_CATEGORIES:
            result["ao3_category"].append(tag.upper())
            continue
        
        # Check for fandom: "Series Name - Creator Name" pattern
        # Must have exactly one " - " separator
        if " - " in tag and tag.count(" - ") == 1:
            parts = tag.split(" - ")
            # Verify it looks like a fandom (second part is usually an author name)
            if len(parts) == 2 and len(parts[0]) > 2 and len(parts[1]) > 2:
                fandom_name = parts[0].strip()
                # Only set if we don't already have a fandom
                if result["fandom"] is None:
                    result["fandom"] = fandom_name
                continue
        
        # Check for relationship: contains "/" (but not URL) or " & "
        if ("/" in tag and not tag.startswith("http") and not tag.startswith("www")) or " & " in tag:
            result["relationships"].append(tag)
            
            # Extract character names from relationship
            if "/" in tag:
                chars = tag.split("/")
            else:
                chars = tag.split(" & ")
            
            for char in chars:
                char = char.strip()
                char_lower = char.lower()
                if char and char_lower not in seen_characters and len(char) > 1:
                    # Skip if it's just a single letter or looks like a tag
                    if not re.match(r'^[a-z]$', char_lower):
                        result["characters"].append(char)
                        seen_characters.add(char_lower)
            continue
        
        # Everything else is a freeform tag
        # Note: We only extract characters from relationships (above) because
        # standalone character tags are indistinguishable from Title Case freeform tags
        result["freeform_tags"].append(tag)
    
    return result


def detect_source_type(opf_content: str, publisher: str = None) -> str:
    """
    Detect the source type of an EPUB based on metadata patterns.
    
    Returns: "ao3", "fanficfare", "fichub", "calibre", or "unknown"
    """
    content_lower = opf_content.lower()
    
    # AO3 direct download
    if publisher and "archive of our own" in publisher.lower():
        return "ao3"
    if "archive of our own" in content_lower:
        return "ao3"
    
    # FanFicFare (used for Wattpad, FFN, etc.)
    if "fanficfare" in content_lower:
        return "fanficfare"
    
    # FicHub
    if "ebook-lib" in content_lower or "fichub" in content_lower:
        return "fichub"
    
    # Calibre processed
    if "calibre" in content_lower:
        return "calibre"
    
    return "unknown"


def extract_source_url(opf_root, namespaces: dict) -> Optional[str]:
    """
    Extract source URL from EPUB metadata.
    
    Checks:
    1. dc:source (FanFicFare uses this)
    2. dc:identifier with scheme="URL"
    """
    # Try dc:source first
    for source in opf_root.findall('.//dc:source', namespaces):
        if source is not None and source.text:
            url = source.text.strip()
            if url.startswith('http'):
                return url
    
    # Also try without namespace prefix
    for source in opf_root.findall('.//{http://purl.org/dc/elements/1.1/}source'):
        if source is not None and source.text:
            url = source.text.strip()
            if url.startswith('http'):
                return url
    
    # Fallback: check identifiers
    for identifier in opf_root.findall('.//dc:identifier', namespaces):
        # Check opf:scheme attribute
        scheme = identifier.get('{http://www.idpf.org/2007/opf}scheme', '')
        if scheme.upper() == 'URL' and identifier.text:
            url = identifier.text.strip()
            if url.startswith('http'):
                return url
        
        # Check if the identifier itself is a URL
        if identifier.text and identifier.text.strip().startswith('http'):
            return identifier.text.strip()
    
    return None


def extract_isbn(opf_root, namespaces: dict) -> Optional[str]:
    """Extract ISBN from EPUB metadata."""
    for identifier in opf_root.findall('.//dc:identifier', namespaces):
        scheme = identifier.get('{http://www.idpf.org/2007/opf}scheme', '')
        if scheme.upper() == 'ISBN' and identifier.text:
            return identifier.text.strip()
    
    # Also check without namespace
    for identifier in opf_root.findall('.//{http://purl.org/dc/elements/1.1/}identifier'):
        scheme = identifier.get('{http://www.idpf.org/2007/opf}scheme', '')
        if scheme.upper() == 'ISBN' and identifier.text:
            return identifier.text.strip()
    
    return None


def extract_publisher(opf_root, namespaces: dict) -> Optional[str]:
    """Extract publisher from EPUB metadata."""
    publisher = opf_root.find('.//dc:publisher', namespaces)
    if publisher is not None and publisher.text:
        return publisher.text.strip()
    
    # Try without namespace
    publisher = opf_root.find('.//{http://purl.org/dc/elements/1.1/}publisher')
    if publisher is not None and publisher.text:
        return publisher.text.strip()
    
    return None


def extract_calibre_series(opf_root, namespaces: dict) -> tuple[Optional[str], Optional[float]]:
    """
    Extract series info from Calibre metadata.
    
    Returns: (series_name, series_index)
    """
    series_name = None
    series_index = None
    
    # Find all meta tags
    for meta in opf_root.findall('.//meta'):
        name = meta.get('name', '')
        content = meta.get('content', '')
        
        if name == 'calibre:series' and content:
            series_name = content.strip()
        elif name == 'calibre:series_index' and content:
            try:
                series_index = float(content)
            except ValueError:
                pass
    
    return series_name, series_index


def detect_completion_status(subjects: list[str], summary: str = None) -> Optional[str]:
    """
    Detect completion status from tags or summary.
    
    Returns: "Complete", "WIP", "Abandoned", "Hiatus", or None
    """
    # Check tags first (FanFicFare includes status as tag)
    for tag in subjects:
        tag_lower = tag.lower().strip()
        
        if tag_lower in ["in-progress", "in progress", "wip", "work in progress"]:
            return "WIP"
        if tag_lower in ["complete", "completed"]:
            return "Complete"
        if tag_lower in ["abandoned", "discontinued"]:
            return "Abandoned"
        if tag_lower in ["hiatus", "on hiatus"]:
            return "Hiatus"
    
    # Check summary for patterns
    if summary:
        summary_lower = summary.lower()
        
        # Be careful with word boundaries
        if re.search(r'\b(complete|completed)\b', summary_lower):
            # Make sure it's not "incomplete"
            if not re.search(r'\bincomplete\b', summary_lower):
                return "Complete"
        
        if re.search(r'\b(wip|work in progress)\b', summary_lower):
            return "WIP"
    
    return None


def count_chapters_from_manifest(opf_root, namespaces: dict) -> Optional[int]:
    """
    Count chapter files in EPUB manifest.
    
    This is approximate - counts HTML/XHTML files that look like chapters.
    """
    count = 0
    
    for item in opf_root.findall('.//item'):
        href = item.get('href', '').lower()
        media_type = item.get('media-type', '')
        
        # Skip non-content files
        if 'html' not in media_type:
            continue
        
        # Skip common non-chapter files
        skip_patterns = ['toc', 'nav', 'cover', 'title', 'copyright', 'stylesheet', 'index']
        if any(pattern in href for pattern in skip_patterns):
            continue
        
        # Looks like a chapter file
        count += 1
    
    return count if count > 0 else None


# For testing
if __name__ == "__main__":
    import asyncio
    import sys
    
    async def test():
        if len(sys.argv) > 1:
            file_path = Path(sys.argv[1])
            print(f"Extracting metadata from: {file_path}")
            result = await extract_metadata(file_path)
            
            for key, value in result.items():
                print(f"  {key}: {value}")
        else:
            print("Usage: python metadata.py <book_file>")
    
    asyncio.run(test())
