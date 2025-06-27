import os
import re
from typing import Optional

def validate_file_size(file_size: int) -> bool:
    """Validate file size against maximum allowed size."""
    max_size = os.getenv('MAX_FILE_SIZE', '100MB')
    
    if max_size.endswith('MB'):
        max_bytes = int(max_size[:-2]) * 1024 * 1024
    elif max_size.endswith('GB'):
        max_bytes = int(max_size[:-2]) * 1024 * 1024 * 1024
    else:
        max_bytes = int(max_size)
    
    return file_size <= max_bytes

def validate_epub_file(filename: str) -> bool:
    """Validate that the file is an EPUB."""
    return filename.lower().endswith('.epub')

def validate_image_file(content_type: str) -> bool:
    """Validate that the file is an image."""
    return content_type.startswith('image/') 