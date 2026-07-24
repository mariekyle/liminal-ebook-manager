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

// Display config per format: label + ui/Badge tint tone (S4 — the class
// strings moved into Badge's tone tables). Storage formats share the
// ebook tone.
export const FORMAT_CONFIG = {
  ebook: { label: 'Ebook', tone: 'fiction' },
  epub: { label: 'EPUB', tone: 'fiction' },
  pdf: { label: 'PDF', tone: 'fiction' },
  mobi: { label: 'MOBI', tone: 'fiction' },
  azw3: { label: 'AZW3', tone: 'fiction' },
  azw: { label: 'AZW', tone: 'fiction' },
  html: { label: 'HTML', tone: 'fiction' },
  physical: { label: 'Physical', tone: 'warning' },
  audiobook: { label: 'Audiobook', tone: 'fandom' },
  web: { label: 'Web', tone: 'nonfiction' },
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
