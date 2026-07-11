/**
 * Shared format constants — S15 two-tier format model.
 *
 * Storage formats are extension-derived labels for file-backed editions.
 * 'ebook' remains a legal editions.format value meaning "ebook, no file."
 * Coarse formats are the human-facing dropdown groups; no dropdown gains
 * options from the storage tier. reading_sessions.format stays coarse.
 *
 * Mirrors backend/constants.py — keep the two in sync.
 */

// Extension-derived formats for file-backed editions
export const STORAGE_FORMATS = ['epub', 'pdf', 'mobi', 'azw3', 'azw', 'html']

// Everything that counts as "an ebook": storage formats plus the
// file-less 'ebook' placeholder
export const EBOOK_FORMATS = [...STORAGE_FORMATS, 'ebook']

// Human-facing dropdown groups (also the reading_sessions.format domain)
export const COARSE_FORMATS = ['ebook', 'physical', 'audiobook', 'web']

// Every legal editions.format value
export const ALL_EDITION_FORMATS = [
  ...EBOOK_FORMATS,
  ...COARSE_FORMATS.filter((f) => !EBOOK_FORMATS.includes(f)),
]

// Chip display config per format — extends the BookDetail formatConfig
// pattern. Storage formats share the ebook chip styling.
const EBOOK_CHIP = 'bg-chip-fiction/20 text-chip-fiction border-chip-fiction/30'

export const FORMAT_CONFIG = {
  ebook: { label: 'Ebook', color: EBOOK_CHIP },
  epub: { label: 'EPUB', color: EBOOK_CHIP },
  pdf: { label: 'PDF', color: EBOOK_CHIP },
  mobi: { label: 'MOBI', color: EBOOK_CHIP },
  azw3: { label: 'AZW3', color: EBOOK_CHIP },
  azw: { label: 'AZW', color: EBOOK_CHIP },
  html: { label: 'HTML', color: EBOOK_CHIP },
  physical: { label: 'Physical', color: 'bg-action-warning/20 text-action-warning border-action-warning/30' },
  audiobook: { label: 'Audiobook', color: 'bg-chip-fandom/20 text-chip-fandom border-chip-fandom/30' },
  web: { label: 'Web', color: 'bg-chip-nonfiction/20 text-chip-nonfiction border-chip-nonfiction/30' },
}

// Display name with raw-value fallback for unknown formats
export function formatLabel(format) {
  return FORMAT_CONFIG[format]?.label || format
}

// Manual-entry option list (no ebook by design — files arrive via upload)
export const MANUAL_ENTRY_FORMATS = [
  { value: 'physical', label: 'Physical' },
  { value: 'audiobook', label: 'Audiobook' },
  { value: 'web', label: 'Web/URL' },
]
