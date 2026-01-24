/**
 * useSort - Custom hook for sort state with localStorage persistence
 * 
 * @param {string} storageKey - Unique key for localStorage (e.g., 'liminal_sort_library_browse')
 * @param {string} defaultField - Default sort field (e.g., 'title')
 * @param {string} defaultDirection - Default direction: 'asc' or 'desc'
 * @returns {object} { sortField, sortDirection, setSortField, setSortDirection, setSort }
 */
import { useState, useEffect, useCallback } from 'react'

export function useSort(storageKey, defaultField = 'title', defaultDirection = 'asc') {
  // Initialize from localStorage or defaults
  const [sortField, setSortField] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.field || defaultField
      }
    } catch (e) {
      console.warn('Failed to parse sort from localStorage:', e)
    }
    return defaultField
  })

  const [sortDirection, setSortDirection] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.direction || defaultDirection
      }
    } catch (e) {
      // Already warned above
    }
    return defaultDirection
  })

  // Persist to localStorage when sort changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        field: sortField,
        direction: sortDirection
      }))
    } catch (e) {
      console.warn('Failed to save sort to localStorage:', e)
    }
  }, [storageKey, sortField, sortDirection])

  // Convenience setter for both at once
  const setSort = useCallback((field, direction) => {
    setSortField(field)
    if (direction) {
      setSortDirection(direction)
    }
  }, [])

  return {
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    setSort
  }
}

export default useSort
