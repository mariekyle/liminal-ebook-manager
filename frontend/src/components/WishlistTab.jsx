import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listTBR } from '../api'
import GradientCover from './GradientCover'
import SortDropdown from './SortDropdown'
import { useSort } from '../hooks/useSort'
import Button from './ui/Button'
import Badge from './ui/Badge'
import SegmentedControl from './ui/SegmentedControl'
import { useGridColumns } from '../hooks/useGridColumns'

// Empty state component
function EmptyState() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">📚</div>
      <h2 className="text-h3 text-text-primary mb-2">All quiet on the threshold</h2>
      <p className="text-body-sm text-text-secondary mb-6 max-w-md">
        Heard a whisper of something good? Glimpsed a cover that caught your eye? Save it here —— a promise to your future self.
      </p>
      <Button variant="primary" onClick={() => navigate('/add?mode=tbr')}>
        Add a Future Read
      </Button>
    </div>
  )
}

// Wishlist card component
// Sibling to BookCard — check for visual parity when BookCard changes
function WishlistCard({ book, onClick, variant = 'compact' }) {
  const coverBook = {
    id: book.id,
    title: book.title,
    author: book.authors?.[0] || 'Unknown Author',
    has_cover: book.has_cover || false,
    cover_path: book.cover_path || null,
    cover_source: book.cover_source || null,
    cover_gradient: book.cover_gradient,
    cover_color_1: book.cover_color_1,
    cover_color_2: book.cover_color_2,
    cover_bg_color: book.cover_bg_color,
    cover_text_color: book.cover_text_color,
  }

  return (
    <div
      onClick={onClick}
      className="cursor-pointer group"
    >
      <div className="relative">
        <GradientCover
          book={coverBook}
          showTitle={true}
          showAuthor={true}
          className=""
        />
        {book.tbr_priority === 'high' && (
          <Badge variant="solid" tone="warning" size="sm" className="absolute top-1.5 left-1.5">
            High
          </Badge>
        )}
        {/* Wishlist bookmark badge */}
        <div
          className="absolute top-2 right-2 w-6 h-6 bg-bg-base/[0.88] rounded flex items-center justify-center"
          title="Wishlist"
        >
          <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
      </div>

      {variant === 'standard' && book.tbr_reason && (
        <div className="mt-2 px-1">
          <p className="text-caption text-text-muted line-clamp-2 italic">
            &quot;{book.tbr_reason}&quot;
          </p>
        </div>
      )}
    </div>
  )
}

function WishlistTab() {
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'high', 'normal'
  const { gridClasses } = useGridColumns()
  const [gridVariant, setGridVariant] = useState(() => {
    try {
      return localStorage.getItem('liminal-grid-variant') === 'standard' ? 'standard' : 'compact'
    } catch { return 'compact' }
  })

  // Listen for grid variant changes from Settings
  useEffect(() => {
    const handleSettingsChange = (event) => {
      if (event.detail?.gridVariant) {
        setGridVariant(event.detail.gridVariant)
      }
    }
    window.addEventListener('settingsChanged', handleSettingsChange)
    return () => window.removeEventListener('settingsChanged', handleSettingsChange)
  }, [])

  // Sort state with localStorage persistence
  const { sortField, sortDirection, setSort } = useSort(
    'liminal_sort_wishlist',
    'added',
    'desc'
  )

  useEffect(() => {
    loadWishlist()
  }, [])

  const loadWishlist = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listTBR()
      setBooks(data.books || [])
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Filter books
  const filteredBooks = books.filter(book => {
    if (filter === 'all') return true
    if (filter === 'high') return book.tbr_priority === 'high'
    if (filter === 'normal') return book.tbr_priority !== 'high'
    return true
  })

  // Sort books
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    let result = 0
    if (sortField === 'added') {
      result = new Date(a.created_at) - new Date(b.created_at)
    } else if (sortField === 'title') {
      result = (a.title || '').localeCompare(b.title || '')
    } else if (sortField === 'author') {
      const authorA = a.authors?.[0] || ''
      const authorB = b.authors?.[0] || ''
      result = authorA.localeCompare(authorB)
    }
    return sortDirection === 'desc' ? -result : result
  })

  // Count by priority
  const highCount = books.filter(b => b.tbr_priority === 'high').length
  const normalCount = books.filter(b => b.tbr_priority !== 'high').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-body-sm text-text-secondary">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
        <p className="text-body-sm text-text-secondary mb-1">Well, that wasn&apos;t supposed to happen.</p>
        <p className="text-caption text-text-muted mb-4">Your wishlist couldn&apos;t load right now.</p>
        <Button variant="secondary" size="sm" onClick={loadWishlist}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 md:px-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-h2 text-text-primary mb-1">Wishlist</h1>
          <p className="text-body-sm text-text-secondary">
            {books.length === 0
              ? 'Your future reads'
              : `${books.length} ${books.length === 1 ? 'title' : 'titles'} on your list`}
          </p>
        </div>
        {books.length > 0 && (
          <Button variant="primary" size="sm" onClick={() => navigate('/add?mode=tbr')}>
            + Add
          </Button>
        )}
      </div>

      {books.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Filters and Sort */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Priority Filter */}
            <SegmentedControl
              size="sm"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: `All (${books.length})` },
                { value: 'high', label: `High (${highCount})` },
                { value: 'normal', label: `Normal (${normalCount})` },
              ]}
              ariaLabel="Filter by priority"
            />

            {/* Sort Dropdown */}
            <div className="ml-auto">
              <SortDropdown
                value={sortField}
                direction={sortDirection}
                onChange={setSort}
                options={['added', 'title', 'author']}
              />
            </div>
          </div>

          {/* Grid */}
          <div className={gridClasses}>
            {sortedBooks.map(book => (
              <WishlistCard
                key={book.id}
                book={book}
                variant={gridVariant}
                onClick={() => navigate(`/book/${book.id}`)}
              />
            ))}
          </div>

          {/* Filtered empty state */}
          {sortedBooks.length === 0 && books.length > 0 && (
            <div className="text-center py-12 text-body-sm text-text-secondary">
              No books match the current filter
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default WishlistTab
