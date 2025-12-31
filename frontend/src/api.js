/**
 * API client for communicating with the backend.
 * 
 * All API calls go through these functions, making it easy to:
 * - Add authentication later
 * - Handle errors consistently
 * - Mock for testing
 */

const API_BASE = '/api'

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `API error: ${response.status}`)
  }
  
  return response.json()
}

/**
 * Check if the backend is reachable
 */
export async function checkHealth() {
  return apiFetch('/health')
}

/**
 * List books with optional filtering
 * 
 * @param {Object} params - Query parameters
 * @param {string} params.category - Filter by category
 * @param {string} params.series - Filter by series
 * @param {string} params.search - Search in title/author
 * @param {string} params.sort - Sort field (title, author, series, updated, year)
 * @param {string} params.order - Sort order (asc, desc)
 * @param {string} params.acquisition - Filter by acquisition status: 'owned', 'wishlist', or 'all'
 * @param {number} params.limit - Max results
 * @param {number} params.offset - Pagination offset
 */
export async function listBooks(params = {}) {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value)
    }
  })
  
  const query = searchParams.toString()
  return apiFetch(`/books${query ? `?${query}` : ''}`)
}

/**
 * Search for books by exact titles
 * Returns a map of title -> book (or null if not found)
 * 
 * @param {string[]} titles - Array of book titles to look up
 */
export async function lookupBooksByTitles(titles) {
  if (!titles || titles.length === 0) return {}
  
  // Search for each title and collect results
  const results = {}
  
  // Do individual searches since we need exact matches
  await Promise.all(
    titles.map(async (title) => {
      try {
        const data = await listBooks({ search: title, limit: 5 })
        // Find exact match (case-insensitive)
        const exactMatch = data.books?.find(
          book => book.title.toLowerCase() === title.toLowerCase()
        )
        results[title] = exactMatch || null
      } catch (err) {
        console.error(`Failed to lookup book "${title}":`, err)
        results[title] = null
      }
    })
  )
  
  return results
}

/**
 * List all series with metadata
 */
export async function listSeries({ category, search } = {}) {
  const params = new URLSearchParams()
  if (category) params.append('category', category)
  if (search) params.append('search', search)
  
  const query = params.toString()
  return apiFetch(`/series${query ? `?${query}` : ''}`)
}

/**
 * List all tags with counts
 */
export async function listTags({ category } = {}) {
  const params = new URLSearchParams()
  if (category) params.append('category', category)
  
  const query = params.toString()
  return apiFetch(`/tags${query ? `?${query}` : ''}`)
}

/**
 * Get details for a specific series
 */
export async function getSeriesDetail(seriesName) {
  return apiFetch(`/series/${encodeURIComponent(seriesName)}`)
}

/**
 * Get full details for a single book
 */
export async function getBook(bookId) {
  return apiFetch(`/books/${bookId}`)
}

/**
 * Get reading sessions for a book
 */
export async function getBookSessions(titleId) {
  return apiFetch(`/titles/${titleId}/sessions`)
}

/**
 * Create a new reading session for a book
 */
export async function createSession(titleId, sessionData) {
  return apiFetch(`/titles/${titleId}/sessions`, {
    method: 'POST',
    body: JSON.stringify(sessionData)
  })
}

/**
 * Update an existing reading session
 */
export async function updateSession(sessionId, sessionData) {
  return apiFetch(`/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify(sessionData)
  })
}

/**
 * Delete a reading session
 */
export async function deleteSession(sessionId) {
  return apiFetch(`/sessions/${sessionId}`, {
    method: 'DELETE'
  })
}

/**
 * Get notes for a book
 */
export async function getBookNotes(bookId) {
  return apiFetch(`/books/${bookId}/notes`)
}

/**
 * Get backlinks for a book (other books that link to this one)
 */
export async function getBookBacklinks(bookId) {
  const data = await apiFetch(`/books/${bookId}/backlinks`)
  return data.backlinks || []
}

/**
 * Create or update a note for a book
 */
export async function saveNote(bookId, content) {
  return apiFetch(`/books/${bookId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

/**
 * Update a book's category
 */
export async function updateBookCategory(bookId, category) {
  return apiFetch(`/books/${bookId}/category`, {
    method: 'PATCH',
    body: JSON.stringify({ category }),
  })
}

/**
 * Update a book's read status
 */
export async function updateBookStatus(bookId, status) {
  return apiFetch(`/books/${bookId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

/**
 * Update a book's rating
 */
export async function updateBookRating(bookId, rating) {
  return apiFetch(`/books/${bookId}/rating`, {
    method: 'PATCH',
    body: JSON.stringify({ rating }),
  })
}

/**
 * Update a book's reading dates
 */
export async function updateBookDates(bookId, dateStarted, dateFinished) {
  return apiFetch(`/books/${bookId}/dates`, {
    method: 'PATCH',
    body: JSON.stringify({ 
      date_started: dateStarted || null,
      date_finished: dateFinished || null
    }),
  })
}

/**
 * Update book metadata (title, authors, series, etc.)
 * @param {number} bookId - Book ID
 * @param {Object} metadata - Fields to update
 * @param {string} [metadata.title] - Book title
 * @param {string[]} [metadata.authors] - List of authors
 * @param {string} [metadata.series] - Series name (empty string to remove)
 * @param {string} [metadata.series_number] - Series number
 * @param {string} [metadata.category] - Category
 * @param {number} [metadata.publication_year] - Publication year (0 to remove)
 */
export async function updateBookMetadata(bookId, metadata) {
  return apiFetch(`/books/${bookId}/metadata`, {
    method: 'PUT',
    body: JSON.stringify(metadata)
  })
}

/**
 * Get list of valid statuses
 */
export async function getStatuses() {
  return apiFetch('/statuses')
}

/**
 * Get list of categories
 */
export async function getCategories() {
  return apiFetch('/categories')
}

/**
 * Get list of series (optionally filtered by category)
 */
export async function getSeries(category = null) {
  const query = category ? `?category=${encodeURIComponent(category)}` : ''
  return apiFetch(`/series${query}`)
}

/**
 * Trigger a library sync
 * 
 * @param {boolean} full - If true, re-sync all books. Otherwise only new ones.
 */
export async function syncLibrary(full = false) {
  return apiFetch(`/sync?full=${full}`, { method: 'POST' })
}

/**
 * Get current sync status
 */
export async function getSyncStatus() {
  return apiFetch('/sync/status')
}

// ============================================================
// Rescan Metadata (Phase 7.0)
// ============================================================

/**
 * Preview what a rescan would find - counts books by source type
 */
export async function previewRescan() {
  return apiFetch('/sync/rescan-metadata/preview')
}

/**
 * Re-extract enhanced metadata from all ebook files
 * @param {string} category - Optional category filter
 */
export async function rescanMetadata(category = null) {
  const params = category ? `?category=${encodeURIComponent(category)}` : ''
  return apiFetch(`/sync/rescan-metadata${params}`, {
    method: 'POST'
  })
}

// =============================================================================
// TBR (TO BE READ) API
// =============================================================================

/**
 * List all TBR items
 * @param {Object} params - Query parameters
 * @param {string} params.priority - Filter by priority ('high', 'normal')
 * @param {string} params.sort - Sort field (added, title, author)
 */
export async function listTBR(params = {}) {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value)
    }
  })
  
  const query = searchParams.toString()
  return apiFetch(`/tbr${query ? `?${query}` : ''}`)
}

/**
 * Add a book to TBR list
 * @param {Object} data - TBR item data
 * @param {string} data.title - Book title
 * @param {string[]} data.authors - Authors
 * @param {string} data.series - Series name (optional)
 * @param {string} data.series_number - Series number (optional)
 * @param {string} data.category - Category (optional)
 * @param {string} data.tbr_priority - Priority: 'normal' or 'high'
 * @param {string} data.tbr_reason - Why you want to read this
 * @param {string} data.source_url - Source URL for fanfiction (optional)
 * @param {string} data.completion_status - 'Complete', 'WIP', or 'Abandoned' (optional)
 */
export async function addToTBR(data) {
  return apiFetch('/tbr', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * Update a TBR item's priority, reason, source URL, or completion status
 * @param {number} bookId - Book ID
 * @param {Object} data - Fields to update
 * @param {string} [data.tbr_priority] - Priority: 'normal' or 'high'
 * @param {string} [data.tbr_reason] - Why you want to read this
 * @param {string} [data.source_url] - Source URL for fanfiction
 * @param {string} [data.completion_status] - 'Complete', 'WIP', or 'Abandoned'
 */
export async function updateTBR(bookId, data) {
  return apiFetch(`/tbr/${bookId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

/**
 * Convert a TBR item to a library book ("I got this book!")
 * @param {number} bookId - Book ID
 * @param {Object} options - Conversion options
 * @param {string} [options.format] - Edition format to add ('ebook', 'physical', 'audiobook')
 */
export async function convertTBRToLibrary(bookId, options = {}) {
  return apiFetch(`/tbr/${bookId}/acquire`, {
    method: 'POST',
    body: JSON.stringify(options)
  })
}

/**
 * Remove a book from TBR (delete it entirely, not convert to library)
 * @param {number} bookId - Book ID
 */
export async function removeFromTBR(bookId) {
  return apiFetch(`/tbr/${bookId}`, {
    method: 'DELETE'
  })
}

/**
 * Create a new title manually (for physical, audiobook, web-based books)
 * @param {Object} data - Title data
 * @param {string} data.title - Book title
 * @param {string[]} data.authors - Authors
 * @param {string} data.series - Series name (optional)
 * @param {string} data.series_number - Series number (optional)
 * @param {string} data.category - Category (optional)
 * @param {string} data.format - Edition format: 'physical', 'audiobook', 'web'
 * @param {string} data.source_url - Source URL (optional)
 * @param {string} data.completion_status - For fanfic: 'Complete', 'WIP', 'Abandoned'
 */
export async function createTitle(data) {
  return apiFetch('/titles', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// =============================================================================
// UPLOAD API
// =============================================================================

/**
 * Upload files for analysis
 * @param {File[]} files - Array of File objects to upload
 * @param {function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<Object>} Analysis results with session_id and books
 */
export async function analyzeUploadedFiles(files, onProgress = null) {
  const formData = new FormData()
  
  for (const file of files) {
    formData.append('files', file)
  }
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    xhr.open('POST', `${API_BASE}/upload/analyze-batch`)
    
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          onProgress(percent)
        }
      }
    }
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch (e) {
          reject(new Error('Invalid response from server'))
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText)
          reject(new Error(error.detail || 'Upload failed'))
        } catch (e) {
          reject(new Error(`Upload failed: ${xhr.status}`))
        }
      }
    }
    
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send(formData)
  })
}

/**
 * Finalize the upload - move files to NAS
 * @param {string} sessionId - Session ID from analyzeUploadedFiles
 * @param {Array} books - Array of book actions
 */
export async function finalizeUpload(sessionId, books) {
  return apiFetch('/upload/finalize-batch', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      books: books,
    }),
  })
}

/**
 * Cancel an upload session
 * @param {string} sessionId - Session ID to cancel
 */
export async function cancelUpload(sessionId) {
  return apiFetch('/upload/cancel', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
    }),
  })
}

/**
 * Link uploaded files to an existing title (TBR → Library conversion)
 * @param {string} sessionId - Session ID from analyzeUploadedFiles
 * @param {number} titleId - ID of existing title to link files to
 */
export async function linkFilesToTitle(sessionId, titleId) {
  return apiFetch('/upload/link-to-title', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      title_id: parseInt(titleId, 10),
    }),
  })
}

// =============================================================================
// SETTINGS API
// =============================================================================

/**
 * Get all settings as key-value pairs
 */
export async function getSettings() {
  return apiFetch('/settings')
}

/**
 * Get a single setting by key
 */
export async function getSetting(key) {
  return apiFetch(`/settings/${key}`)
}

/**
 * Update or create a setting
 * @param {string} key - Setting key
 * @param {string|number} value - Setting value (will be converted to string)
 */
export async function updateSetting(key, value) {
  return apiFetch(`/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value: String(value) })
  })
}

// =============================================================================
// AUTHORS API
// =============================================================================

/**
 * List all unique authors with book counts
 */
export async function listAuthors() {
  return apiFetch('/authors')
}

/**
 * Get author details with their books
 * @param {string} name - Author name
 */
export async function getAuthor(name) {
  return apiFetch(`/authors/${encodeURIComponent(name)}`)
}

/**
 * Update or create notes for an author
 * @param {string} name - Author name
 * @param {string} notes - Notes content
 */
export async function updateAuthorNotes(name, notes) {
  return apiFetch(`/authors/${encodeURIComponent(name)}/notes`, {
    method: 'PUT',
    body: JSON.stringify({ notes })
  })
}

/**
 * Update author (rename and/or update notes)
 * @param {string} name - Current author name
 * @param {Object} data - Update data
 * @param {string} [data.newName] - New author name (null to keep current)
 * @param {string} [data.notes] - Updated notes
 */
export async function updateAuthor(name, { newName, notes }) {
  return apiFetch(`/authors/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify({ 
      new_name: newName,
      notes: notes
    })
  })
}

// =============================================================================
// HOME DASHBOARD API
// =============================================================================

/**
 * Get in-progress books for home dashboard (max 5)
 */
export async function getHomeInProgress() {
  return apiFetch('/home/in-progress')
}

/**
 * Get recently added books for home dashboard (20 most recent)
 */
export async function getHomeRecentlyAdded() {
  return apiFetch('/home/recently-added')
}

/**
 * Get random unread books for discovery (6 books)
 */
export async function getHomeDiscover() {
  return apiFetch('/home/discover')
}

/**
 * Get quick reads - unread books under 3 hours based on user's WPM
 */
export async function getHomeQuickReads() {
  return apiFetch('/home/quick-reads')
}

/**
 * Get reading stats for home dashboard
 * @param {string} period - 'month' or 'year'
 */
export async function getHomeStats(period = 'month') {
  return apiFetch(`/home/stats?period=${period}`)
}
