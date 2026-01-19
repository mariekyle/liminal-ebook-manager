# Liminal Code Patterns

Battle-tested solutions to common problems. **Reference these before implementing features that involve similar patterns.**

This is a living document — add new patterns as we solve them.

---

## Table of Contents

1. [String Sorting (Case-Insensitive)](#string-sorting-case-insensitive)
2. [Loading State Pattern](#loading-state-pattern)
3. [API Error Handling](#api-error-handling)
4. [LocalStorage with Fallback](#localstorage-with-fallback)
5. [Debounced Search](#debounced-search)
6. [Race Condition Guard (Version Ref)](#race-condition-guard-version-ref)

---

## String Sorting (Case-Insensitive)

**Problem:** Default sorting treats 'A' and 'a' as different characters (ASCII order), causing lowercase titles to sort after all uppercase.

### JavaScript/React (client-side)

```javascript
// ✅ CORRECT: Case-insensitive, locale-aware sort
items.sort((a, b) => 
  a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
)

// ✅ ALSO CORRECT: Simple lowercase comparison
items.sort((a, b) => 
  a.title.toLowerCase().localeCompare(b.title.toLowerCase())
)

// ❌ WRONG: Case-sensitive (ASCII order)
items.sort((a, b) => a.title < b.title ? -1 : 1)
items.sort((a, b) => a.title.localeCompare(b.title))  // localeCompare alone is still case-sensitive!
```

### SQLite (backend)

```python
# ✅ CORRECT: Case-insensitive
"ORDER BY title COLLATE NOCASE ASC"
"ORDER BY t.title COLLATE NOCASE ASC, t.authors COLLATE NOCASE ASC"

# ❌ WRONG: Case-sensitive (default SQLite behavior)
"ORDER BY title ASC"
```

### When to Use
- Any user-facing sorted list (books, collections, authors, series)
- Search result ordering
- Dropdown options

### Files Using This Pattern
- `backend/routers/collections.py` — Automatic collection sorting
- `backend/routers/books.py` — Library book sorting
- `frontend/src/pages/SeriesDetail.jsx` — Series book ordering

---

## Loading State Pattern

**Problem:** Need consistent loading/error/empty state handling across components.

```javascript
// State declarations
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

// Fetch pattern
const fetchData = async () => {
  setLoading(true)
  setError(null)
  try {
    const result = await apiCall()
    setData(result)
  } catch (err) {
    setError(err.message)
    setData([])  // Clear stale data on error
  } finally {
    setLoading(false)
  }
}

// Render pattern
{loading && <LoadingSpinner />}
{error && !loading && <ErrorMessage error={error} />}
{!loading && !error && data.length === 0 && <EmptyState />}
{!loading && !error && data.length > 0 && <DataList data={data} />}
```

### Files Using This Pattern
- `frontend/src/pages/Library.jsx`
- `frontend/src/components/CollectionDetail.jsx`
- `frontend/src/pages/BookDetail.jsx`

---

## API Error Handling

**Problem:** Consistent error handling for API calls.

### Frontend (api.js pattern)

```javascript
export async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }
  
  return response.json()
}
```

### Backend (FastAPI pattern)

```python
from fastapi import HTTPException

# Not found
if not item:
    raise HTTPException(status_code=404, detail="Item not found")

# Validation error
if invalid_condition:
    raise HTTPException(status_code=400, detail="Specific error message")

# Server error (let it bubble up naturally, FastAPI handles it)
```

---

## LocalStorage with Fallback

**Problem:** localStorage can fail (private browsing, quota exceeded) and needs defaults.

```javascript
// Reading with fallback
const [viewMode, setViewMode] = useState(() => {
  try {
    return localStorage.getItem('view_mode') || 'grid'
  } catch {
    return 'grid'
  }
})

// Writing with error handling
const updateViewMode = (mode) => {
  setViewMode(mode)
  try {
    localStorage.setItem('view_mode', mode)
  } catch (e) {
    console.warn('Failed to save to localStorage:', e)
  }
}
```

### Files Using This Pattern
- `frontend/src/components/CollectionDetail.jsx` — View mode preference
- `frontend/src/pages/Library.jsx` — Filter state (via URL params instead)

---

## Debounced Search

**Problem:** Search input fires on every keystroke, causing excessive API calls.

```javascript
import { useState, useEffect, useCallback } from 'react'

// Debounce hook
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debouncedValue
}

// Usage
const [searchInput, setSearchInput] = useState('')
const debouncedSearch = useDebounce(searchInput, 300)

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch)
  }
}, [debouncedSearch])
```

### Files Using This Pattern
- `frontend/src/components/SearchBar.jsx`
- `frontend/src/components/FandomModal.jsx`

---

## Race Condition Guard (Version Ref)

**Problem:** When user changes a filter/sort while a pagination or fetch request is in-flight, the stale response can corrupt state by appending old data to the new filtered list.

### The Pattern

Use a ref to track a "version" number. Increment it when the filter changes, capture it before async calls, and verify it hasn't changed before applying results.

```javascript
// 1. Create version ref
const filterVersionRef = useRef(0)

// 2. Increment when filter changes
const handleFilterChange = (newFilter) => {
  filterVersionRef.current += 1  // Invalidate in-flight requests
  setFilter(newFilter)
  setData([])
  refetch(newFilter)
}

// 3. Guard async operations
const loadMore = useCallback(async () => {
  // Capture version BEFORE the async call
  const requestVersion = filterVersionRef.current
  
  setLoading(true)
  try {
    const result = await fetchData()
    
    // Only apply if version hasn't changed
    if (filterVersionRef.current === requestVersion) {
      setData(prev => [...prev, ...result])
    }
  } finally {
    // Only clear loading if still relevant
    if (filterVersionRef.current === requestVersion) {
      setLoading(false)
    }
  }
}, [/* deps */])
```

### Why Ref Instead of State?

- Refs update synchronously and don't trigger re-renders
- State updates are batched and async, making them unreliable for this check
- The version number doesn't need to be displayed, just compared

### When to Use

- Pagination with user-changeable filters/sorts
- Any "load more" pattern where the base query can change
- Drag-and-drop reorder operations with save-on-drop
- Search-as-you-type with results appending

### Files Using This Pattern

- `frontend/src/components/CollectionDetail.jsx` — Sort change + pagination
- `frontend/src/components/CollectionDetail.jsx` — Drag-to-reorder save protection

---

## Adding New Patterns

When you solve a problem that's likely to recur:

1. Add a new section with:
   - **Problem:** One sentence describing the issue
   - **Solution:** Code examples (correct and incorrect)
   - **When to Use:** Scenarios where this applies
   - **Files Using This Pattern:** Reference implementations

2. Keep examples minimal but complete
3. Show both ✅ correct and ❌ incorrect approaches
4. Update Table of Contents
