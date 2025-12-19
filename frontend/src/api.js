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
