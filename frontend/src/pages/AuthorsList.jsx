import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listAuthors } from '../api'

function AuthorsList() {
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    listAuthors()
      .then(data => {
        setAuthors(data.authors)
      })
      .catch(err => {
        setError(err.message || 'Failed to load authors')
      })
      .finally(() => setLoading(false))
  }, [])

  // Filter authors by search
  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(search.toLowerCase())
  )

  // Group authors alphabetically
  const groupedAuthors = filteredAuthors.reduce((acc, author) => {
    const firstLetter = author.name[0]?.toUpperCase() || '#'
    const key = /[A-Z]/.test(firstLetter) ? firstLetter : '#'
    if (!acc[key]) acc[key] = []
    acc[key].push(author)
    return acc
  }, {})

  const sortedKeys = Object.keys(groupedAuthors).sort((a, b) => {
    if (a === '#') return 1
    if (b === '#') return -1
    return a.localeCompare(b)
  })

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse-slow text-4xl mb-4">✍️</div>
        <p className="text-gray-400">Loading authors...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back to Library */}
      <Link 
        to="/"
        className="text-gray-400 hover:text-white mb-6 inline-flex items-center gap-2"
      >
        ← Back to Library
      </Link>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search authors..."
          className="w-full px-4 py-3 bg-library-card text-white rounded-lg border border-gray-600 focus:border-library-accent focus:outline-none"
        />
      </div>

      {/* Stats */}
      <p className="text-gray-400 text-sm italic text-center mb-6">
        {filteredAuthors.length} authors. {filteredAuthors.length === authors.length ? 'So many voices.' : `Showing matches for "${search}"`}
      </p>

      {/* Author list grouped alphabetically */}
      {sortedKeys.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No authors found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedKeys.map(letter => (
            <div key={letter}>
              <h2 className="text-lg font-bold text-library-accent mb-2 sticky top-0 bg-library-bg py-1">
                {letter}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {groupedAuthors[letter].map(author => (
                  <Link
                    key={author.name}
                    to={`/author/${encodeURIComponent(author.name)}`}
                    className="flex items-center justify-between px-3 py-2 bg-library-card rounded hover:bg-gray-700 transition-colors group"
                  >
                    <span className="text-white group-hover:text-library-accent transition-colors truncate">
                      {author.name}
                    </span>
                    <span className="text-gray-500 text-sm flex-shrink-0 ml-2">
                      {author.book_count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AuthorsList

