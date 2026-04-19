import { useState, useEffect } from 'react'
import { getSettings } from '../api'

/**
 * Shared hook for custom status labels from Settings.
 * Maps internal status values → user-configured display labels.
 * Listens for live changes via the settingsChanged custom event.
 *
 * Returns:
 *   labels          — raw map keyed by DB status: { Unread, 'In Progress', Finished, Abandoned }
 *   getLabel(status) — lookup function: getLabel('Abandoned') → 'DNF' (or custom label)
 *   getStatusOptions() — array of { value, label } for dropdowns
 *
 * Usage (BookCard):
 *   const { labels } = useStatusLabels()
 *   const dnfLabel = labels['Abandoned']
 *
 * Usage (BookDetail / FilterDrawer):
 *   const { getLabel, getStatusOptions } = useStatusLabels()
 *   getLabel('Finished') → 'Finished' (or custom label)
 */

const DEFAULT_LABELS = {
  Unread: 'Unread',
  'In Progress': 'In Progress',
  Finished: 'Finished',
  Abandoned: 'DNF',
}

let cachedLabels = null

export function useStatusLabels() {
  const [labels, setLabels] = useState(cachedLabels || DEFAULT_LABELS)

  useEffect(() => {
    if (cachedLabels) {
      setLabels(cachedLabels)
      return
    }
    getSettings()
      .then(data => {
        const resolved = {
          Unread: data.status_label_unread || 'Unread',
          'In Progress': data.status_label_in_progress || 'In Progress',
          Finished: data.status_label_finished || 'Finished',
          Abandoned: data.status_label_dnf || 'DNF',
        }
        cachedLabels = resolved
        setLabels(resolved)
      })
      .catch(() => {
        // Fail silently, defaults are fine
      })
  }, [])

  // Listen for live changes from Settings (modals / page)
  useEffect(() => {
    const handleSettingsChange = (event) => {
      if (event.detail?.statusLabels) {
        const sl = event.detail.statusLabels
        const resolved = {
          Unread: sl.unread || 'Unread',
          'In Progress': sl.in_progress || 'In Progress',
          Finished: sl.finished || 'Finished',
          Abandoned: sl.dnf || 'DNF',
        }
        cachedLabels = resolved
        setLabels(resolved)
      }
    }
    window.addEventListener('settingsChanged', handleSettingsChange)
    return () => window.removeEventListener('settingsChanged', handleSettingsChange)
  }, [])

  // Helper: look up a status label, fallback to the raw status string
  const getLabel = (status) => labels[status] || status

  // Helper: return status options array for dropdowns
  const getStatusOptions = () => [
    { value: 'Unread', label: labels['Unread'] },
    { value: 'In Progress', label: labels['In Progress'] },
    { value: 'Finished', label: labels['Finished'] },
    { value: 'Abandoned', label: labels['Abandoned'] },
  ]

  return { labels, getLabel, getStatusOptions }
}
