import { useState, useEffect } from 'react'
import { getSettings } from '../api'

// Internal status keys (never change - used for DB storage and logic)
export const STATUS_KEYS = ['unread', 'in_progress', 'finished', 'dnf']

// Map from internal key to default display label
const DEFAULT_LABELS = {
  unread: 'Unread',
  in_progress: 'In Progress',
  finished: 'Finished',
  dnf: 'DNF'
}

// Map from display value to internal key (for backwards compatibility)
const VALUE_TO_KEY = {
  'Unread': 'unread',
  'In Progress': 'in_progress',
  'Finished': 'finished',
  'DNF': 'dnf'
}

export function useStatusLabels() {
  const [labels, setLabels] = useState(DEFAULT_LABELS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    
    getSettings()
      .then(settings => {
        if (cancelled) return
        
        setLabels({
          unread: settings.status_label_unread || DEFAULT_LABELS.unread,
          in_progress: settings.status_label_in_progress || DEFAULT_LABELS.in_progress,
          finished: settings.status_label_finished || DEFAULT_LABELS.finished,
          dnf: settings.status_label_dnf || DEFAULT_LABELS.dnf
        })
      })
      .catch(err => {
        console.error('Failed to load status labels:', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    
    return () => { cancelled = true }
  }, [])

  // Get display label for a status value (handles both old format like "Finished" and new format)
  const getLabel = (statusValue) => {
    if (!statusValue) return labels.unread
    
    // Check if it's an internal key
    if (labels[statusValue]) {
      return labels[statusValue]
    }
    
    // Check if it's a legacy display value
    const key = VALUE_TO_KEY[statusValue]
    if (key) {
      return labels[key]
    }
    
    // Fallback to the value itself
    return statusValue
  }

  // Get internal key from display value
  const getKey = (displayValue) => {
    return VALUE_TO_KEY[displayValue] || displayValue
  }

  // Get all statuses as array of { key, value, label } for dropdowns
  const getStatusOptions = (includeAny = false) => {
    const options = STATUS_KEYS.map(key => ({
      key,
      value: DEFAULT_LABELS[key], // Use original value for API compatibility
      label: labels[key]
    }))
    
    if (includeAny) {
      return [{ key: '', value: 'Any', label: 'Any' }, ...options]
    }
    return options
  }

  return { labels, getLabel, getKey, getStatusOptions, loading }
}

export default useStatusLabels

