"""
Cover Generation Service - Ported from Obsidian Plugin

Deterministic, CSS-only gradient book covers.
Ported from gradient_covers.ts to Python.

Features:
- 10 gradient presets (6 calm + 4 accent)
- Deterministic by title + author (stable across sessions)
- Constrained HSL color space for cohesive library
- Light/dark theme support
- Vignette overlay for text readability
- EPUB cover extraction (Phase 9C)
"""

import os
import math
import logging
from pathlib import Path
from typing import Tuple, List, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum

# For EPUB cover extraction
try:
    import ebooklib
    from ebooklib import epub
    EBOOKLIB_AVAILABLE = True
except ImportError:
    EBOOKLIB_AVAILABLE = False

logger = logging.getLogger(__name__)

# Cover storage paths
COVERS_BASE_PATH = "/app/data/covers"
EXTRACTED_COVERS_PATH = f"{COVERS_BASE_PATH}/extracted"
CUSTOM_COVERS_PATH = f"{COVERS_BASE_PATH}/custom"


# =============================================================================
# TYPES AND CONFIGURATION
# =============================================================================

class Theme(Enum):
    LIGHT = "light"
    DARK = "dark"


class PresetName(Enum):
    # Calm presets (94% of covers)
    MONO_SOFT_LINEAR = "Mono Soft Linear"
    ANALOGOUS_DRIFT = "Analogous Drift"
    DUOTONE_QUIET = "Duotone Quiet"
    RADIAL_FADE = "Radial Fade"
    MUTED_SUNSET = "Muted Sunset"
    MIST = "Mist"
    # Accent presets (6% of covers)
    CONIC_WHISPER = "Conic Whisper"
    TRIAD_SOFT = "Triad Soft"
    DIAMOND_VEIL = "Diamond Veil"
    MESH_GENTLE = "Mesh Gentle"


@dataclass
class CoverStyle:
    """Generated cover style data"""
    css_gradient: str           # CSS background-image value
    background_color: str       # Fallback background color
    text_color: str            # Suggested text color (#000 or #fff)
    preset: str                # Which preset was used
    hue: int                   # Base hue (0-360)


# Default configuration
DEFAULTS = {
    "theme": Theme.LIGHT,
    "accent_chance": 0.06,      # 6% chance of accent preset
    # Hue lanes: Teal, Blue, Indigo, Violet, Magenta, Red-Orange, Gold, Green
    "hue_lanes": [200, 230, 260, 280, 320, 20, 45, 150],
    "saturation_range": (22, 34),   # HSL % - low saturation keeps calm
    "lightness_range": (60, 74),    # HSL % for light theme
    "angles": [90, 135, 180],       # Degrees for linear gradients
    "vignette_opacity": 0.06,       # Light vignette
}

# Dark theme adjustments
DARK_TWEAKS = {
    "lightness_range": (46, 62),
    "vignette_opacity": 0.10,
}

# Preset lists
CALM_PRESETS = [
    PresetName.MONO_SOFT_LINEAR,
    PresetName.ANALOGOUS_DRIFT,
    PresetName.DUOTONE_QUIET,
    PresetName.RADIAL_FADE,
    PresetName.MUTED_SUNSET,
    PresetName.MIST,
]

ACCENT_PRESETS = [
    PresetName.CONIC_WHISPER,
    PresetName.TRIAD_SOFT,
    PresetName.DIAMOND_VEIL,
    PresetName.MESH_GENTLE,
]


# =============================================================================
# HASH AND PRNG FUNCTIONS
# =============================================================================

def cyrb53(text: str, seed: int = 0) -> int:
    """
    Stable 53-bit hash function.
    Provides deterministic hash for any string input.
    """
    h1 = 0xdeadbeef ^ seed
    h2 = 0x41c6ce57 ^ seed
    
    for char in text:
        ch = ord(char)
        h1 = _imul(h1 ^ ch, 2654435761) & 0xFFFFFFFF
        h2 = _imul(h2 ^ ch, 1597334677) & 0xFFFFFFFF
    
    h1 = _imul(h1 ^ (h1 >> 16), 2246822507) & 0xFFFFFFFF
    h1 ^= _imul(h2 ^ (h2 >> 13), 3266489909) & 0xFFFFFFFF
    h2 = _imul(h2 ^ (h2 >> 16), 2246822507) & 0xFFFFFFFF
    h2 ^= _imul(h1 ^ (h1 >> 13), 3266489909) & 0xFFFFFFFF
    
    return ((h2 & 0x1FFFFF) << 32) | (h1 & 0xFFFFFFFF)


def _imul(a: int, b: int) -> int:
    """JavaScript-style 32-bit integer multiplication"""
    a = a & 0xFFFFFFFF
    b = b & 0xFFFFFFFF
    
    ah = (a >> 16) & 0xFFFF
    al = a & 0xFFFF
    bh = (b >> 16) & 0xFFFF
    bl = b & 0xFFFF
    
    result = (al * bl) + (((ah * bl + al * bh) << 16) & 0xFFFFFFFF)
    return result & 0xFFFFFFFF


class Mulberry32:
    """
    Mulberry32 PRNG - fast, seedable random number generator.
    Returns values in [0, 1) range.
    """
    def __init__(self, seed: int):
        self.state = seed & 0xFFFFFFFF
    
    def next(self) -> float:
        self.state = (self.state + 0x6D2B79F5) & 0xFFFFFFFF
        t = self.state
        t = _imul(t ^ (t >> 15), t | 1)
        t = (t ^ ((t + _imul(t ^ (t >> 7), t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def clamp(value: float, min_val: float, max_val: float) -> float:
    """Clamp value between min and max"""
    return max(min_val, min(max_val, value))


def lerp(a: float, b: float, t: float) -> float:
    """Linear interpolation between a and b"""
    return a + (b - a) * t


def pick(rng: Mulberry32, items: list):
    """Pick a random item from list using PRNG"""
    return items[int(rng.next() * len(items)) % len(items)]


def jitter(rng: Mulberry32, base: float, spread: float) -> float:
    """Add random jitter to base value within spread range"""
    half = spread / 2
    return base + (rng.next() * spread - half)


def hsl(h: float, s: float, l: float) -> str:
    """Create HSL color string"""
    return f"hsl({round(h)}, {round(s)}%, {round(l)}%)"


def normalize_key(text: str) -> str:
    """Normalize text for consistent hashing"""
    return " ".join(text.strip().lower().split())


# =============================================================================
# VIGNETTE BUILDER
# =============================================================================

def build_vignette(opacity: float) -> str:
    """
    Create a radial vignette gradient for text legibility.
    Darkens edges slightly to help text pop.
    """
    o = clamp(opacity, 0, 1)
    return f"radial-gradient(75% 85% at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,0,0,{o}) 100%)"


# =============================================================================
# GRADIENT PRESET BUILDERS
# =============================================================================

@dataclass
class BuildContext:
    """Context passed to gradient builders"""
    rng: Mulberry32
    hue: int
    s_range: Tuple[int, int]
    l_range: Tuple[int, int]
    angles: List[int]
    vignette_opacity: float


def mono_soft_linear(ctx: BuildContext) -> str:
    """Single-hue gradient with subtle lightness variation"""
    angle = pick(ctx.rng, ctx.angles)
    s = lerp(ctx.s_range[0], ctx.s_range[1], 0.6)
    L1 = jitter(ctx.rng, ctx.l_range[1], 4)
    L2 = jitter(ctx.rng, lerp(ctx.l_range[0], ctx.l_range[1], 0.55), 3)
    L3 = jitter(ctx.rng, ctx.l_range[0], 4)
    
    return f"linear-gradient({angle}deg, {hsl(ctx.hue, s, L1)} 0%, {hsl(ctx.hue, s-2, L2)} 65%, {hsl(ctx.hue, s-4, L3)} 100%)"


def analogous_drift(ctx: BuildContext) -> str:
    """Gradient that drifts slightly in hue"""
    angle = 180  # Vertical for grid regularity
    dh = jitter(ctx.rng, 10, 8)  # ~6-14° hue shift
    s = lerp(ctx.s_range[0], ctx.s_range[1], 0.55)
    L1 = jitter(ctx.rng, ctx.l_range[1] - 2, 3)
    L2 = jitter(ctx.rng, lerp(ctx.l_range[0], ctx.l_range[1], 0.52), 3)
    L3 = jitter(ctx.rng, ctx.l_range[0], 3)
    
    return f"linear-gradient({angle}deg, {hsl(ctx.hue, s, L1)} 0%, {hsl(ctx.hue + dh, s-2, L2)} 65%, {hsl(ctx.hue + dh, s-4, L3)} 100%)"


def duotone_quiet(ctx: BuildContext) -> str:
    """Two-tone gradient with gentle hue shift"""
    angles_filtered = [a for a in ctx.angles if a != 180]
    angle = pick(ctx.rng, angles_filtered) if angles_filtered else 135
    dh = jitter(ctx.rng, 18, 6)
    s = lerp(ctx.s_range[0], ctx.s_range[1], 0.6)
    L1 = jitter(ctx.rng, ctx.l_range[1] - 1, 3)
    L2 = jitter(ctx.rng, lerp(ctx.l_range[0], ctx.l_range[1], 0.55), 3)
    L3 = jitter(ctx.rng, ctx.l_range[0], 3)
    
    return f"linear-gradient({angle}deg, {hsl(ctx.hue, s, L1)} 0%, {hsl(ctx.hue + dh, s-1, L2)} 65%, {hsl(ctx.hue + dh, s-2, L3)} 100%)"


def radial_fade(ctx: BuildContext) -> str:
    """Radial gradient fading from off-center"""
    cx, cy, r = 48, 42, 78  # Gentle off-center
    s = lerp(ctx.s_range[0], ctx.s_range[1], 0.5)
    Lc = jitter(ctx.rng, lerp(ctx.l_range[0], ctx.l_range[1], 0.58), 3)
    Le = jitter(ctx.rng, ctx.l_range[0] - 2, 3)
    
    return f"radial-gradient({r}% {r}% at {cx}% {cy}%, {hsl(ctx.hue, s, Lc)} 0%, {hsl(ctx.hue, s-2, Le)} 100%)"


def muted_sunset(ctx: BuildContext) -> str:
    """Warm gold/amber gradient regardless of base hue"""
    base = 35  # Gold
    dh = jitter(ctx.rng, -14, 10)  # Tilt to apricot/amber
    s = lerp(ctx.s_range[0], ctx.s_range[1], 0.55)
    angle = 180
    L1 = jitter(ctx.rng, ctx.l_range[1] - 1, 3)
    L2 = jitter(ctx.rng, lerp(ctx.l_range[0], ctx.l_range[1], 0.55), 3)
    L3 = jitter(ctx.rng, ctx.l_range[0], 3)
    
    return f"linear-gradient({angle}deg, {hsl(base, s, L1)} 0%, {hsl(base + dh, s-2, L2)} 65%, {hsl(base + dh, s-3, L3)} 100%)"


def mist(ctx: BuildContext) -> str:
    """Very subtle, almost monochrome wash"""
    angle = pick(ctx.rng, ctx.angles)
    s = lerp(ctx.s_range[0], ctx.s_range[1], 0.35)  # Lower saturation
    L1 = jitter(ctx.rng, ctx.l_range[1] + 2, 2)
    L2 = jitter(ctx.rng, lerp(ctx.l_range[0], ctx.l_range[1], 0.65), 2)
    L3 = jitter(ctx.rng, ctx.l_range[0] + 2, 2)
    
    return f"linear-gradient({angle}deg, {hsl(ctx.hue, s, L1)} 0%, {hsl(ctx.hue, s-1, L2)} 60%, {hsl(ctx.hue, s-2, L3)} 100%)"


def conic_whisper(ctx: BuildContext) -> str:
    """Subtle conic gradient (accent preset)"""
    s = lerp(ctx.s_range[0], ctx.s_range[1], 0.45)
    L1 = jitter(ctx.rng, ctx.l_range[1], 3)
    L2 = jitter(ctx.rng, lerp(ctx.l_range[0], ctx.l_range[1], 0.55), 3)
    dh = jitter(ctx.rng, 12, 6)
    
    return f"conic-gradient(from 45deg at 50% 55%, {hsl(ctx.hue, s, L1)} 0deg, {hsl(ctx.hue + dh, s-2, L2)} 180deg, {hsl(ctx.hue, s, L1)} 360deg)"


def triad_soft(ctx: BuildContext) -> str:
    """Three-color gradient using color wheel triad (accent preset)"""
    angle = pick(ctx.rng, ctx.angles)
    s = lerp(ctx.s_range[0], ctx.s_range[1], 0.50)
    L1 = jitter(ctx.rng, ctx.l_range[1], 3)
    L2 = jitter(ctx.rng, lerp(ctx.l_range[0], ctx.l_range[1], 0.58), 3)
    L3 = jitter(ctx.rng, ctx.l_range[0], 3)
    # Triad: 120° apart on color wheel
    h2 = (ctx.hue + 120) % 360
    h3 = (ctx.hue + 240) % 360
    
    return f"linear-gradient({angle}deg, {hsl(ctx.hue, s, L1)} 0%, {hsl(h2, s-2, L2)} 50%, {hsl(h3, s-3, L3)} 100%)"


def diamond_veil(ctx: BuildContext) -> str:
    """Elliptical radial gradient (accent preset)"""
    s = lerp(ctx.s_range[0], ctx.s_range[1], 0.48)
    Lc = jitter(ctx.rng, lerp(ctx.l_range[0], ctx.l_range[1], 0.62), 3)
    Le = jitter(ctx.rng, ctx.l_range[0] - 1, 3)
    dh = jitter(ctx.rng, 8, 5)
    
    return f"radial-gradient(60% 80% at 50% 48%, {hsl(ctx.hue, s, Lc)} 0%, {hsl(ctx.hue + dh, s-2, Le)} 100%)"


def mesh_gentle(ctx: BuildContext) -> str:
    """Layered radial gradients for mesh effect (accent preset)"""
    s = lerp(ctx.s_range[0], ctx.s_range[1], 0.5)
    Lb = jitter(ctx.rng, lerp(ctx.l_range[0], ctx.l_range[1], 0.60), 3)
    Lc = jitter(ctx.rng, lerp(ctx.l_range[0], ctx.l_range[1], 0.66), 3)
    dh = jitter(ctx.rng, 10, 8)
    
    g1 = f"radial-gradient(40% 45% at 30% 35%, {hsl(ctx.hue + dh, s, Lc)} 0%, {hsl(ctx.hue + dh, s-2, Lb)} 100%)"
    g2 = f"radial-gradient(45% 50% at 70% 65%, {hsl(ctx.hue, s, Lc)} 0%, {hsl(ctx.hue, s-2, Lb)} 100%)"
    
    # Create a fresh context for the base layer
    base = mono_soft_linear(ctx)
    
    return f"{g1}, {g2}, {base}"


# Map preset names to builder functions
PRESET_BUILDERS = {
    PresetName.MONO_SOFT_LINEAR: mono_soft_linear,
    PresetName.ANALOGOUS_DRIFT: analogous_drift,
    PresetName.DUOTONE_QUIET: duotone_quiet,
    PresetName.RADIAL_FADE: radial_fade,
    PresetName.MUTED_SUNSET: muted_sunset,
    PresetName.MIST: mist,
    PresetName.CONIC_WHISPER: conic_whisper,
    PresetName.TRIAD_SOFT: triad_soft,
    PresetName.DIAMOND_VEIL: diamond_veil,
    PresetName.MESH_GENTLE: mesh_gentle,
}


# =============================================================================
# COLOR UTILITIES
# =============================================================================

def hsl_to_rgb(h: float, s: float, l: float) -> Tuple[int, int, int]:
    """Convert HSL to RGB (0-255 range)"""
    h = ((h % 360) + 360) % 360
    s = s / 100
    l = l / 100
    
    c = (1 - abs(2 * l - 1)) * s
    x = c * (1 - abs(((h / 60) % 2) - 1))
    m = l - c / 2
    
    if h < 60:
        r, g, b = c, x, 0
    elif h < 120:
        r, g, b = x, c, 0
    elif h < 180:
        r, g, b = 0, c, x
    elif h < 240:
        r, g, b = 0, x, c
    elif h < 300:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x
    
    return (
        round((r + m) * 255),
        round((g + m) * 255),
        round((b + m) * 255)
    )


def relative_luminance(r: int, g: int, b: int) -> float:
    """Calculate relative luminance for WCAG contrast"""
    def to_linear(v: int) -> float:
        v = v / 255
        return v / 12.92 if v <= 0.04045 else pow((v + 0.055) / 1.055, 2.4)
    
    R = to_linear(r)
    G = to_linear(g)
    B = to_linear(b)
    
    return 0.2126 * R + 0.7152 * G + 0.0722 * B


def suggest_text_color(hue: int, saturation: float, lightness: float) -> str:
    """Suggest black or white text based on background luminance"""
    r, g, b = hsl_to_rgb(hue, saturation, lightness)
    L = relative_luminance(r, g, b)
    return "#000" if L > 0.5 else "#fff"


# =============================================================================
# MAIN API
# =============================================================================

# Simple LRU cache
_cache: Dict[str, CoverStyle] = {}
_cache_max = 500


def get_cover_style(
    title: str,
    author: str,
    theme: Theme = Theme.DARK
) -> CoverStyle:
    """
    Generate deterministic cover style for a book.
    
    Args:
        title: Book title
        author: Primary author name
        theme: Light or dark theme
    
    Returns:
        CoverStyle with CSS gradient and text color
    """
    # Create cache key
    norm = normalize_key(title) + "|" + normalize_key(author)
    seed = cyrb53(norm)
    cache_key = f"{seed}-{theme.value}"
    
    # Check cache
    if cache_key in _cache:
        return _cache[cache_key]
    
    # Get theme-adjusted settings
    if theme == Theme.DARK:
        l_range = DARK_TWEAKS["lightness_range"]
        vignette = DARK_TWEAKS["vignette_opacity"]
    else:
        l_range = DEFAULTS["lightness_range"]
        vignette = DEFAULTS["vignette_opacity"]
    
    # Create PRNG
    rng = Mulberry32(seed)
    
    # Select hue lane deterministically
    hue = DEFAULTS["hue_lanes"][seed % len(DEFAULTS["hue_lanes"])]
    
    # Decide calm vs accent preset
    accent_gate = (seed % 1000) / 1000
    is_accent = accent_gate < DEFAULTS["accent_chance"]
    
    # Select preset
    preset_list = ACCENT_PRESETS if is_accent else CALM_PRESETS
    idx = (seed // 7) % len(preset_list)
    preset = preset_list[idx]
    
    # Build context
    ctx = BuildContext(
        rng=rng,
        hue=hue,
        s_range=DEFAULTS["saturation_range"],
        l_range=l_range,
        angles=DEFAULTS["angles"],
        vignette_opacity=vignette
    )
    
    # Build gradient
    builder = PRESET_BUILDERS[preset]
    gradient = builder(ctx)
    
    # Add vignette layer
    vignette_layer = build_vignette(vignette)
    full_gradient = f"{gradient}, {vignette_layer}"
    
    # Calculate background color and text color
    s_mid = (DEFAULTS["saturation_range"][0] + DEFAULTS["saturation_range"][1]) / 2
    l_base = l_range[0] - 6
    bg_color = hsl(hue, DEFAULTS["saturation_range"][0], l_base)
    text_color = suggest_text_color(hue, s_mid, (l_range[0] + l_range[1]) / 2)
    
    # Create result
    result = CoverStyle(
        css_gradient=full_gradient,
        background_color=bg_color,
        text_color=text_color,
        preset=preset.value,
        hue=hue
    )
    
    # Cache result
    if len(_cache) >= _cache_max:
        # Simple cache eviction: clear oldest half
        keys = list(_cache.keys())[:_cache_max // 2]
        for k in keys:
            del _cache[k]
    _cache[cache_key] = result
    
    return result


def generate_cover_colors(title: str, author: str) -> Tuple[str, str]:
    """
    Legacy API: Generate two gradient colors for a book cover.
    Returns tuple of (color1, color2) as HSL strings.
    
    Kept for backwards compatibility with existing code.
    """
    style = get_cover_style(title, author, Theme.DARK)
    
    # Extract approximate colors from the gradient
    hue = style.hue
    s = (DEFAULTS["saturation_range"][0] + DEFAULTS["saturation_range"][1]) / 2
    l_range = DARK_TWEAKS["lightness_range"]
    
    color1 = hsl(hue, s, l_range[1])
    color2 = hsl(hue, s - 4, l_range[0])
    
    return (color1, color2)


# =============================================================================
# COVER EXTRACTION (Phase 9C)
# =============================================================================

def ensure_cover_directories():
    """Create cover storage directories if they don't exist."""
    Path(EXTRACTED_COVERS_PATH).mkdir(parents=True, exist_ok=True)
    Path(CUSTOM_COVERS_PATH).mkdir(parents=True, exist_ok=True)


def extract_epub_cover(epub_path: str, title_id: int) -> str | None:
    """
    Extract cover image from EPUB file.
    
    Args:
        epub_path: Full path to the EPUB file
        title_id: Database ID for the title (used for filename)
        
    Returns:
        Path to saved cover image, or None if extraction failed
    """
    if not EBOOKLIB_AVAILABLE:
        logger.warning("ebooklib not installed, cannot extract EPUB covers")
        return None
        
    if not epub_path or not os.path.exists(epub_path):
        logger.debug(f"EPUB path invalid or doesn't exist: {epub_path}")
        return None
    
    ensure_cover_directories()
    
    try:
        book = epub.read_epub(epub_path, options={'ignore_ncx': True})
        cover_data = None
        cover_extension = 'jpg'
        
        # Method 1: Look for cover in spine/metadata
        for item in book.get_items():
            # Check for ITEM_COVER type
            if item.get_type() == ebooklib.ITEM_COVER:
                cover_data = item.get_content()
                # Detect extension from media type
                media_type = item.media_type or ''
                if 'png' in media_type:
                    cover_extension = 'png'
                elif 'gif' in media_type:
                    cover_extension = 'gif'
                elif 'webp' in media_type:
                    cover_extension = 'webp'
                break
        
        # Method 2: Look for image file named "cover.*"
        if not cover_data:
            for item in book.get_items_of_type(ebooklib.ITEM_IMAGE):
                item_name = item.get_name().lower()
                if 'cover' in item_name:
                    cover_data = item.get_content()
                    # Detect extension
                    if item_name.endswith('.png'):
                        cover_extension = 'png'
                    elif item_name.endswith('.gif'):
                        cover_extension = 'gif'
                    elif item_name.endswith('.webp'):
                        cover_extension = 'webp'
                    break
        
        # Method 3: Look for first image in manifest (often the cover)
        if not cover_data:
            for item in book.get_items_of_type(ebooklib.ITEM_IMAGE):
                # Skip small images (likely icons/bullets)
                content = item.get_content()
                if len(content) > 10000:  # > 10KB likely a cover
                    cover_data = content
                    item_name = item.get_name().lower()
                    if item_name.endswith('.png'):
                        cover_extension = 'png'
                    elif item_name.endswith('.gif'):
                        cover_extension = 'gif'
                    elif item_name.endswith('.webp'):
                        cover_extension = 'webp'
                    break
        
        if cover_data:
            # Save cover image
            save_path = f"{EXTRACTED_COVERS_PATH}/{title_id}.{cover_extension}"
            with open(save_path, 'wb') as f:
                f.write(cover_data)
            logger.info(f"Extracted cover for title {title_id}: {save_path}")
            return save_path
        
        logger.debug(f"No cover found in EPUB: {epub_path}")
        return None
        
    except Exception as e:
        logger.error(f"Cover extraction failed for {epub_path}: {e}")
        return None


def get_cover_path(title_id: int) -> str | None:
    """
    Get the cover path for a title, checking custom then extracted.
    
    Returns the path if a cover file exists, None otherwise.
    """
    # Check for custom cover first (higher priority)
    for ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
        custom_path = f"{CUSTOM_COVERS_PATH}/{title_id}.{ext}"
        if os.path.exists(custom_path):
            return custom_path
    
    # Check for extracted cover
    for ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
        extracted_path = f"{EXTRACTED_COVERS_PATH}/{title_id}.{ext}"
        if os.path.exists(extracted_path):
            return extracted_path
    
    return None


def delete_cover_file(cover_path: str) -> bool:
    """Delete a cover file from disk."""
    try:
        if cover_path and os.path.exists(cover_path):
            os.remove(cover_path)
            logger.info(f"Deleted cover file: {cover_path}")
            return True
        return False
    except Exception as e:
        logger.error(f"Failed to delete cover file {cover_path}: {e}")
        return False


# =============================================================================
# TESTING
# =============================================================================

if __name__ == "__main__":
    test_books = [
        ("Shadow and Bone", "Leigh Bardugo"),
        ("Six of Crows", "Leigh Bardugo"),
        ("The Institute", "Stephen King"),
        ("The Shining", "Stephen King"),
        ("Pride and Prejudice", "Jane Austen"),
        ("Dune", "Frank Herbert"),
        ("The Hobbit", "J.R.R. Tolkien"),
    ]
    
    print("Cover Style Tests:")
    print("-" * 70)
    
    for title, author in test_books:
        style = get_cover_style(title, author, Theme.DARK)
        print(f"\n{author} - {title}")
        print(f"  Preset: {style.preset}")
        print(f"  Hue: {style.hue}°")
        print(f"  Text: {style.text_color}")
        print(f"  Gradient: {style.css_gradient[:80]}...")
