"""
Cover Generation Service

Generates consistent gradient colors for book covers based on title/author.
This creates a visually consistent library even when books don't have covers.

Ported from the Obsidian plugin's gradient cover system.
"""

import hashlib
from typing import Tuple


# Curated color palettes that work well together
# Each palette is (color1, color2) - designed for gradients
COLOR_PALETTES = [
    ("#667eea", "#764ba2"),  # Purple blend
    ("#f093fb", "#f5576c"),  # Pink/coral
    ("#4facfe", "#00f2fe"),  # Ocean blue
    ("#43e97b", "#38f9d7"),  # Mint green
    ("#fa709a", "#fee140"),  # Sunset
    ("#a8edea", "#fed6e3"),  # Soft pastels
    ("#ff9a9e", "#fecfef"),  # Rose
    ("#ffecd2", "#fcb69f"),  # Peach
    ("#a1c4fd", "#c2e9fb"),  # Sky blue
    ("#d299c2", "#fef9d7"),  # Lavender cream
    ("#89f7fe", "#66a6ff"),  # Bright blue
    ("#cd9cf2", "#f6f3ff"),  # Light purple
    ("#fddb92", "#d1fdff"),  # Yellow to cyan
    ("#9890e3", "#b1f4cf"),  # Purple to green
    ("#96fbc4", "#f9f586"),  # Green to yellow
    ("#2af598", "#009efd"),  # Teal to blue
    ("#cd9cf2", "#6dd5ed"),  # Purple to cyan
    ("#f5f7fa", "#c3cfe2"),  # Silver
    ("#e0c3fc", "#8ec5fc"),  # Cotton candy
    ("#f093fb", "#f5576c"),  # Magenta
]


def string_to_hash(text: str) -> int:
    """
    Convert a string to a consistent integer hash.
    Used to pick colors deterministically based on text.
    """
    # MD5 gives us good distribution, we don't need cryptographic security
    hash_bytes = hashlib.md5(text.encode('utf-8')).digest()
    # Convert first 4 bytes to integer
    return int.from_bytes(hash_bytes[:4], byteorder='big')


def generate_cover_colors(title: str, author: str) -> Tuple[str, str]:
    """
    Generate two gradient colors for a book cover.
    
    Uses the author name primarily so books by the same author
    have similar color schemes (creating visual grouping).
    
    Args:
        title: Book title
        author: Primary author name
    
    Returns:
        Tuple of (color1, color2) as hex strings
    """
    # Use author for primary color selection (groups author's books together)
    # Add a bit of title to create slight variations within an author's books
    seed = f"{author.lower().strip()}:{title[:3].lower()}"
    
    hash_value = string_to_hash(seed)
    palette_index = hash_value % len(COLOR_PALETTES)
    
    return COLOR_PALETTES[palette_index]


def generate_cover_svg(
    title: str,
    author: str,
    width: int = 200,
    height: int = 300
) -> str:
    """
    Generate an SVG cover image with gradient background and text.
    
    This can be used if you want to serve actual cover images rather than
    generating them client-side with CSS.
    
    Args:
        title: Book title
        author: Author name
        width: Image width in pixels
        height: Image height in pixels
    
    Returns:
        SVG string
    """
    color1, color2 = generate_cover_colors(title, author)
    
    # Truncate long titles
    display_title = title[:40] + "..." if len(title) > 40 else title
    display_author = author[:30] + "..." if len(author) > 30 else author
    
    # Simple SVG with gradient and text
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:{color2};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" rx="8"/>
  <text x="50%" y="45%" text-anchor="middle" fill="white" font-family="Georgia, serif" font-size="18" font-weight="bold">
    {_escape_xml(display_title)}
  </text>
  <text x="50%" y="85%" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="12">
    {_escape_xml(display_author)}
  </text>
</svg>'''
    
    return svg


def _escape_xml(text: str) -> str:
    """Escape special characters for XML."""
    return (text
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;"))


# For testing
if __name__ == "__main__":
    # Test color generation
    test_books = [
        ("Shadow and Bone", "Leigh Bardugo"),
        ("Six of Crows", "Leigh Bardugo"),  # Same author = similar colors
        ("The Institute", "Stephen King"),
        ("The Shining", "Stephen King"),    # Same author = similar colors
        ("Pride and Prejudice", "Jane Austen"),
    ]
    
    print("Cover Color Tests:")
    print("-" * 50)
    
    for title, author in test_books:
        c1, c2 = generate_cover_colors(title, author)
        print(f"{author}: {title[:30]:<30} -> {c1} / {c2}")
