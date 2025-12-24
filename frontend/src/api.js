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
 * Get notes for a book
 */
export async function getBookNotes(bookId) {
  return apiFetch(`/books/${bookId}/notes`)
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
