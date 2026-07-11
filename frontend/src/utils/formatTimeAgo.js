/**
 * Relative timestamp for ambient metadata lines ("2 hours ago").
 * Extracted from Settings.jsx in S15.3b so the sync results view can share it.
 * Falls back to a locale date past one week; 'Never' for missing input.
 */
export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Never'
  const date = new Date(timestamp)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}
