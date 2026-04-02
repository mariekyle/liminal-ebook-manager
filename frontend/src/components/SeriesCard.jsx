import { Link } from 'react-router-dom'

/**
 * Generate a 2-letter abbreviation for a series name.
 * Skips leading articles (The, A, An), takes first letter of
 * first two significant words. Single words use first two letters.
 */
function seriesAbbrev(name) {
  if (!name) return '??'
  const words = name.split(/\s+/).filter(w =>
    !['the', 'a', 'an'].includes(w.toLowerCase())
  )
  if (words.length === 0) return name.slice(0, 2).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

/**
 * SeriesCard — renders a series in one of three layouts.
 *
 * Props:
 *   series   — series object from API ({ name, author, book_count, finished_count, cover_gradient, ... })
 *   variant  — 'compact' | 'standard' | 'list' (default: 'compact')
 */
function SeriesCard({ series, variant = 'compact' }) {
  // Warm palette fallback (replaces old cold indigo #667eea/#764ba2)
  const gradient = series.cover_gradient || 'linear-gradient(135deg, #8a6e5e 0%, #5e7a6e 100%)'
  const bgColor = series.cover_bg_color || '#8a6e5e'
  const textColor = series.cover_text_color || '#fff'
  
  const displayName = series.name.length > 50
    ? series.name.slice(0, 47) + '...'
    : series.name

  const finishedCount = series.finished_count ?? 0
  const primaryAuthor = series.author || 'Unknown Author'

  if (variant === 'list') {
    return (
      <Link
        to={`/series/${encodeURIComponent(series.name)}`}
        className="group block"
      >
        <div className="flex gap-3 items-center py-2.5 border-b border-border-subtle">
          {/* Thumbnail — 64×96 to match BookCard list */}
          <div
            className="w-[64px] h-[96px] rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ backgroundImage: gradient, backgroundColor: bgColor }}
          >
            <span
              className="text-sm font-bold font-serif"
              style={{ color: textColor, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
            >
              {seriesAbbrev(series.name)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-body-sm font-medium text-text-primary truncate group-hover:text-action-primary transition-colors duration-200 ease-out">
              {series.name}
            </h3>
            <p className="text-caption text-text-secondary truncate mt-0.5">
              {primaryAuthor}
            </p>
            <p className="text-caption text-text-muted mt-1">
              {series.book_count} {series.book_count === 1 ? 'title' : 'titles'} · {finishedCount} finished
            </p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link 
      to={`/series/${encodeURIComponent(series.name)}`}
      className="group block"
    >
      {/* Stacked card effect */}
      <div className="relative" style={{ marginRight: 8, marginBottom: 8 }}>
        <div
          className="absolute rounded-lg"
          style={{
            top: 8,
            left: 8,
            right: -8,
            bottom: -8,
            border: '1px solid rgba(58, 54, 51, 0.5)',
            background: '#242220',
          }}
        />
        <div
          className="absolute rounded-lg"
          style={{
            top: 4,
            left: 4,
            right: -4,
            bottom: -4,
            border: '1px solid rgba(58, 54, 51, 0.8)',
            background: '#2a2826',
          }}
        />

        <div className="relative z-10">
          <div
            className="relative aspect-[2/3] rounded-lg overflow-hidden"
            style={{ backgroundImage: gradient, backgroundColor: bgColor }}
          >
            {/* Series name — centered */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
              <h3
                className="text-center font-serif font-bold text-sm leading-tight"
                style={{ color: textColor, textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)' }}
              >
                {displayName}
              </h3>

              {variant === 'standard' && (
                <p
                  className="text-center text-caption mt-1"
                  style={{ color: textColor, opacity: 0.65, textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
                >
                  {series.book_count} {series.book_count === 1 ? 'title' : 'titles'}
                </p>
              )}
            </div>

            {/* Author — bottom of cover, both compact and standard */}
            <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
              <p
                className="text-center truncate"
                style={{
                  fontSize: '10px',
                  color: textColor,
                  opacity: 0.6,
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
                }}
              >
                {primaryAuthor}
              </p>
            </div>

            {/* Count badge — top-right corner, matching BookCard badge pattern */}
            <div
              className="absolute top-2 right-2 min-w-[22px] h-[22px] bg-bg-base/[0.88] rounded flex items-center justify-center px-1 z-20"
            >
              <span className="text-caption text-text-primary font-medium" style={{ fontSize: '11px' }}>
                {series.book_count}
              </span>
            </div>

            {/* Noise texture overlay */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Text below cover — standard only (compact has no external text) */}
      {variant === 'standard' && (
        <div className="mt-2 px-1">
          <h3 className="text-body-sm font-medium text-text-primary truncate group-hover:text-action-primary transition-colors duration-200 ease-out">
            {series.name}
          </h3>
          <p className="text-caption text-text-muted truncate">
            {primaryAuthor}
          </p>
        </div>
      )}
    </Link>
  )
}

export default SeriesCard
