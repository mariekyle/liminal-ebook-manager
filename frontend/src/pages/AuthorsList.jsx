import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { listAuthors } from '../api'
import SearchInput from '../components/ui/SearchInput'
import UnifiedNavBar from '../components/ui/UnifiedNavBar'

function AuthorsList() {
  const location = useLocation()
  const listReturnUrl = location.pathname + location.search

  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    document.title = 'Authors'
  }, [])

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

  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(search.toLowerCase())
  )

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
      <div className="flex flex-col min-h-[40vh]">
        <UnifiedNavBar title="Authors" />
        <div className="text-center py-12 flex-1">
          <div className="animate-pulse-slow text-4xl mb-4">✍️</div>
          <p className="text-body-sm text-text-secondary">Loading authors...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-[40vh]">
        <UnifiedNavBar title="Authors" />
        <div className="text-center py-12 flex-1">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-action-danger">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24">
      <UnifiedNavBar title="Authors" />

      <div className="px-4 md:px-8 pt-4">
        <div className="sticky top-[4.5rem] z-30 bg-bg-base/95 backdrop-blur-sm pb-3 -mx-4 px-4 md:mx-0 md:px-0">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search authors..."
          />
        </div>
      </div>

      <div className="px-4 md:px-8 py-3">
        <p className="text-body-sm text-text-secondary italic">
          {filteredAuthors.length} authors. {filteredAuthors.length === authors.length ? 'So many voices.' : `Showing matches for "${search}"`}
        </p>
      </div>

      <div className="px-4 md:px-8 pb-8">
        {sortedKeys.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-body-sm text-text-secondary">No authors found</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl">
            {sortedKeys.map(letter => (
              <div key={letter}>
                <h2 className="text-h4 text-action-primary mb-2 sticky top-28 sm:top-32 bg-bg-base py-1 z-20">
                  {letter}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {groupedAuthors[letter].map(author => (
                    <Link
                      key={author.name}
                      to={`/author/${encodeURIComponent(author.name)}`}
                      state={{ returnUrl: listReturnUrl }}
                      className="flex items-center justify-between px-3 py-2 bg-bg-elevated border border-border-default rounded-lg hover:bg-bg-surface transition-colors duration-200 ease-out group"
                    >
                      <span className="text-text-primary group-hover:text-action-primary transition-colors truncate">
                        {author.name}
                      </span>
                      <span className="text-caption text-text-muted flex-shrink-0 ml-2 tabular-nums">
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
    </div>
  )
}

export default AuthorsList
