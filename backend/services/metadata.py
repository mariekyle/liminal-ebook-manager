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
                
                result["tags"] = [
                    _sanitize_tag(s.text) for s in subjects 
                    if s.text and s.text.strip()
                ]
            
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
