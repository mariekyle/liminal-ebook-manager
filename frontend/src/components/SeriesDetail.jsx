import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { getSeriesDetail } from '../api'
import UnifiedNavBar from './ui/UnifiedNavBar'

/** Display series order as 01, 02, 03; supports decimals (e.g. 02.5). */
function formatSeriesListNumber(seriesNumber, index) {
  const v = seriesNumber ?? index + 1
  const str = String(v)
  if (str.includes('.')) {
    const [a, b] = str.split('.')
    return `${a.padStart(2, '0')}.${b}`
  }
  return str.padStart(2, '0')
}

function SeriesDetail() {
  const { name } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  const currentUrl = location.pathname + location.search
  const [series, setSeries] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    
    getSeriesDetail(name)
      .then(data => {
        setSeries(data)
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [name])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse-slow text-4xl mb-4">📚</div>
        <p className="text-body-sm text-text-secondary">Loading series...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-action-danger mb-4">{error}</p>
        <Link to="/" className="text-action-primary hover:underline">
          ← Back to Library
        </Link>
      </div>
    )
  }

  if (!series) return null

  return (
    <div className="max-w-3xl mx-auto">
      <UnifiedNavBar backLabel="Series" onBack={() => navigate(-1)} />

      <div className="px-4 md:px-8">
      <div className="mb-8">
        <h1 className="text-h2 text-text-primary mb-2">
          {series.name}
        </h1>
        <p className="text-body-sm text-text-secondary mb-2">
          by {series.author}
        </p>
        <p className="text-body-sm text-text-secondary">
          {series.book_count} {series.book_count === 1 ? 'book' : 'books'} · {series.books_read} finished
        </p>
      </div>

      <div className="bg-bg-elevated rounded-lg overflow-hidden border border-border-default">
        <div className="px-4 py-3 border-b border-border-default">
          <h2 className="text-body-sm font-medium text-text-primary">Books in Series</h2>
        </div>
        <ul className="divide-y divide-border-default">
          {series.books.map((book, index) => (
            <li key={book.id}>
              <Link
                to={`/book/${book.id}`}
                state={{ returnUrl: currentUrl }}
                className="flex items-center gap-4 px-4 py-3 hover:bg-bg-surface transition-colors"
              >
                <span className="text-caption text-text-muted w-10 flex-shrink-0 tabular-nums">
                  {formatSeriesListNumber(book.series_number, index)}
                </span>
                
                <span className="text-text-primary flex-1 truncate">
                  {book.title}
                </span>
                
                {book.status === 'Finished' && (
                  <span className="text-action-success text-sm" aria-hidden>✓</span>
                )}
                {book.status === 'In Progress' && (
                  <span className="text-action-warning text-sm" aria-hidden>📖</span>
                )}
                {(book.status === 'DNF' || book.status === 'Abandoned') && (
                  <span className="text-caption text-text-muted">DNF</span>
                )}
                
                {book.rating && (
                  <span className="text-action-warning text-sm">
                    {'★'.repeat(book.rating)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      </div>
    </div>
  )
}

export default SeriesDetail
