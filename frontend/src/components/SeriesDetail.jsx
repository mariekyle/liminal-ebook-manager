import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSeriesDetail } from '../api'

function SeriesDetail() {
  const { name } = useParams()
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
        <p className="text-gray-400">Loading series...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-400 mb-4">{error}</p>
        <Link to="/" className="text-library-accent hover:underline">
          ← Back to Library
        </Link>
      </div>
    )
  }

  if (!series) return null

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link 
        to="/"
        onClick={(e) => {
          e.preventDefault()
          window.history.back()
        }}
        className="text-gray-400 hover:text-white mb-6 inline-block"
      >
        ← Back
      </Link>

      {/* Series Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {series.name}
        </h1>
        <p className="text-gray-400 text-lg mb-2">
          by {series.author}
        </p>
        <p className="text-gray-500">
          {series.book_count} {series.book_count === 1 ? 'book' : 'books'} · {series.books_read} finished
        </p>
      </div>

      {/* Books List */}
      <div className="bg-library-card rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700">
          <h2 className="text-white font-medium">Books in Series</h2>
        </div>
        <ul className="divide-y divide-gray-700">
          {series.books.map((book, index) => (
            <li key={book.id}>
              <Link
                to={`/book/${book.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-800 transition-colors"
              >
                {/* Series number */}
                <span className="text-gray-500 text-sm w-8 flex-shrink-0">
                  {book.series_number || index + 1}
                </span>
                
                {/* Title */}
                <span className="text-white flex-1 truncate">
                  {book.title}
                </span>
                
                {/* Status indicator */}
                {book.status === 'Finished' && (
                  <span className="text-green-400 text-sm">✓</span>
                )}
                {book.status === 'In Progress' && (
                  <span className="text-yellow-400 text-sm">📖</span>
                )}
                {book.status === 'DNF' && (
                  <span className="text-gray-500 text-sm">DNF</span>
                )}
                
                {/* Rating */}
                {book.rating && (
                  <span className="text-yellow-400 text-sm">
                    {'★'.repeat(book.rating)}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default SeriesDetail




