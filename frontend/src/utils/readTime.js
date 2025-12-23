/**
 * Read time calculation and microcopy utilities
 */

// Microcopy tiers based on estimated read time
const MICROCOPY_TIERS = [
  { maxMinutes: 30, label: 'a quick visit' },
  { maxMinutes: 120, label: 'a short journey' },      // 30 min - 2 hours
  { maxMinutes: 240, label: 'a generous escape' },    // 2-4 hours
  { maxMinutes: 480, label: 'room to get attached' }, // 4-8 hours
  { maxMinutes: 1200, label: 'a slow unfolding' },    // 8-20 hours
  { maxMinutes: 1800, label: 'an epic voyage' },      // 20-30 hours
  { maxMinutes: Infinity, label: 'a true saga' }      // 30+ hours
]

// Filter tiers for library dropdown
export const READ_TIME_FILTERS = [
  { value: '', label: 'Any length' },
  { value: '0-30', label: 'Under 30 min', minMinutes: 0, maxMinutes: 29 },
  { value: '30-60', label: '30–60 min', minMinutes: 30, maxMinutes: 59 },
  { value: '60-120', label: '1–2 hours', minMinutes: 60, maxMinutes: 119 },
  { value: '120-240', label: '2–4 hours', minMinutes: 120, maxMinutes: 239 },
  { value: '240-480', label: '4–8 hours', minMinutes: 240, maxMinutes: 479 },
  { value: '480-1200', label: '8–20 hours', minMinutes: 480, maxMinutes: 1199 },
  { value: '1200-1800', label: '20–30 hours', minMinutes: 1200, maxMinutes: 1799 },
  { value: '1800+', label: '30+ hours', minMinutes: 1800, maxMinutes: Infinity }
]

/**
 * Calculate estimated read time in minutes
 * @param {number} wordCount - Number of words in the book
 * @param {number} wpm - Words per minute reading speed
 * @returns {number} Estimated minutes to read
 */
export function calculateReadTimeMinutes(wordCount, wpm = 250) {
  if (!wordCount || wordCount <= 0) return 0
  if (!wpm || wpm <= 0) wpm = 250
  return Math.round(wordCount / wpm)
}

/**
 * Format read time for display
 * @param {number} minutes - Total minutes
 * @returns {string} Formatted string like "5 hours" or "45 min"
 */
export function formatReadTime(minutes) {
  if (!minutes || minutes <= 0) return null
  
  if (minutes < 60) {
    // Round to nearest 5 minutes
    const rounded = Math.round(minutes / 5) * 5
    return `${Math.max(5, rounded)} min`
  }
  
  // Convert to hours, round to nearest hour
  const hours = Math.round(minutes / 60)
  return hours === 1 ? '1 hour' : `${hours} hours`
}

/**
 * Get poetic microcopy for read time
 * @param {number} minutes - Total minutes
 * @returns {string} Microcopy like "a slow unfolding"
 */
export function getReadTimeMicrocopy(minutes) {
  if (!minutes || minutes <= 0) return null
  
  for (const tier of MICROCOPY_TIERS) {
    if (minutes <= tier.maxMinutes) {
      return tier.label
    }
  }
  return MICROCOPY_TIERS[MICROCOPY_TIERS.length - 1].label
}

/**
 * Get complete read time display data
 * @param {number} wordCount - Number of words
 * @param {number} wpm - Words per minute
 * @returns {{ minutes: number, display: string, microcopy: string } | null}
 */
export function getReadTimeData(wordCount, wpm = 250) {
  const minutes = calculateReadTimeMinutes(wordCount, wpm)
  if (!minutes) return null
  
  return {
    minutes,
    display: formatReadTime(minutes),
    microcopy: getReadTimeMicrocopy(minutes)
  }
}

/**
 * Check if a book matches a read time filter
 * @param {number} wordCount - Book's word count
 * @param {string} filterValue - Filter value like "60-120" or "1800+"
 * @param {number} wpm - Words per minute
 * @returns {boolean}
 */
export function matchesReadTimeFilter(wordCount, filterValue, wpm = 250) {
  if (!filterValue) return true // No filter = match all
  if (!wordCount) return false // No word count = can't match
  
  const minutes = calculateReadTimeMinutes(wordCount, wpm)
  const filter = READ_TIME_FILTERS.find(f => f.value === filterValue)
  
  if (!filter) return true
  
  return minutes >= filter.minMinutes && minutes <= filter.maxMinutes
}

