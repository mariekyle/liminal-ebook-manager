import { useState, useEffect } from 'react'
import { getSettings } from '../api'

// Default rating labels
const DEFAULT_LABELS = {
  1: 'Disliked',
  2: 'Disappointing',
  3: 'Decent/Fine',
  4: 'Better than Good',
  5: 'All-time Fav'
}

export function useRatingLabels() {
  const [labels, setLabels] = useState(DEFAULT_LABELS)
  const [loading, setLoading] = useState(true)

  const loadLabels = () => {
    getSettings()
      .then(settings => {
        setLabels({
          1: settings.rating_label_1 || DEFAULT_LABELS[1],
          2: settings.rating_label_2 || DEFAULT_LABELS[2],
          3: settings.rating_label_3 || DEFAULT_LABELS[3],
          4: settings.rating_label_4 || DEFAULT_LABELS[4],
          5: settings.rating_label_5 || DEFAULT_LABELS[5]
        })
      })
      .catch(err => {
        console.error('Failed to load rating labels:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadLabels()

    // Listen for settings changes
    const handleSettingsChange = () => loadLabels()
    window.addEventListener('settingsChanged', handleSettingsChange)
    
    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange)
    }
  }, [])

  // Get label for a rating value (1-5)
  const getLabel = (rating) => {
    if (!rating || rating < 1 || rating > 5) return 'no rating'
    return labels[Math.round(rating)] || DEFAULT_LABELS[Math.round(rating)]
  }

  return { labels, getLabel, loading }
}

export default useRatingLabels

