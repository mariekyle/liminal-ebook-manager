"""
Shared format constants — S15 two-tier format model.

Storage formats are extension-derived labels for file-backed editions.
'ebook' remains a legal editions.format value meaning "ebook, no file."
Coarse formats are the human-facing dropdown groups; no dropdown gains
options from the storage tier. reading_sessions.format stays coarse.

Mirrored in frontend/src/constants/formats.js — keep the two in sync.
"""

# Extension-derived formats for file-backed editions
STORAGE_FORMATS = ['epub', 'pdf', 'mobi', 'azw3', 'azw', 'html']

# Everything that counts as "an ebook": storage formats plus the
# file-less 'ebook' placeholder
EBOOK_FORMATS = STORAGE_FORMATS + ['ebook']

# Human-facing dropdown groups (also the reading_sessions.format domain)
COARSE_FORMATS = ['ebook', 'physical', 'audiobook', 'web']

# Every legal editions.format value
ALL_EDITION_FORMATS = EBOOK_FORMATS + [
    f for f in COARSE_FORMATS if f not in EBOOK_FORMATS
]

# Canonical extension → storage-format mapping for file discovery (sync,
# future upload consumers). Backend-only — the frontend never scans files.
# '.htm' normalizes to 'html'. database.py's relabel migration keeps its
# own inline derivation (frozen file — do not consolidate).
EXTENSION_TO_FORMAT = {
    '.epub': 'epub',
    '.pdf': 'pdf',
    '.mobi': 'mobi',
    '.azw3': 'azw3',
    '.azw': 'azw',
    '.html': 'html',
    '.htm': 'html',
}
