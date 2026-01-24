import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listTBR } from '../api'
import GradientCover from './GradientCover'
import SortDropdown from './SortDropdown'
import { useSort } from '../hooks/useSort'

// Priority badge component
function PriorityBadge({ priority }) {
  if (priority !== 'high') return null
  
  return (
    <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
      High
    </span>
  )
}

// Empty state component
function EmptyState() {
  const navigate = useNavigate()
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">📚</div>
      <h2 className="text-xl font-semibold text-white mb-2">All quiet on the threshold</h2>
      <p className="text-gray-400 mb-6 max-w-md">
        Heard a whisper of something good? Glimpsed a cover that caught your eye? Save it here —— a promise to your future self.
      </p>
      <button
        onClick={() => navigate('/add?mode=tbr')}
        className="bg-library-accent text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
      >
        Add a Future Read
      </button>
    </div>
  )
}

// TBR Card component
function TBRCard({ book, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-library-card rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-library-accent transition-all"
    >
      <div className="relative aspect-[2/3]">
        <GradientCover
          title={book.title}
          author={book.authors?.[0] || 'Unknown'}
          cssGradient={book.cover_gradient}
          textColor={book.cover_text_color}
        />
        <PriorityBadge priority={book.tbr_priority} />
      </div>
      
      <div className="p-3">
        <h3 className="text-white font-medium text-sm line-clamp-2 mb-1">
          {book.title}
        </h3>
        <p className="text-gray-400 text-xs line-clamp-1">
          {book.authors?.join(', ') || 'Unknown Author'}
        </p>
        {book.tbr_reason && (
          <p className="text-gray-500 text-xs mt-2 line-clamp-2 italic">
            "{book.tbr_reason}"
          </p>
        )}
      </div>
    </div>
  )
}

function TBRList() {
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'high', 'normal'
  
  // Sort state with localStorage persistence
  const { sortField, sortDirection, setSort } = useSort(
    'liminal_sort_wishlist',
    'added',
    'desc'
  )

  useEffect(() => {
    loadTBR()
  }, [])

  const loadTBR = async () => {
    try {
      setLoading(true)
      const data = await listTBR()
      setBooks(data.books || [])
    } catch (err) {
      console.error('Failed to load TBR:', err)
      setError(err.message)
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
    // Reverse for descending
    return sortDirection === 'desc' ? -result : result
  })

  // Count by priority
  const highCount = books.filter(b => b.tbr_priority === 'high').length
  const normalCount = books.filter(b => b.tbr_priority !== 'high').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-red-400 mb-2">Failed to load TBR list</div>
          <button 
            onClick={loadTBR}
            className="text-library-accent hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 md:px-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">TBR</h1>
          <p className="text-gray-400 text-sm">
            {books.length === 0 
              ? "Stories calling to you"
              : `${books.length} ${books.length === 1 ? 'story' : 'stories'} waiting to be discovered`
            }
          </p>
        </div>
        {books.length > 0 && (
          <button
            onClick={() => navigate('/add?mode=tbr')}
            className="bg-library-accent text-white text-sm px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            + Add
          </button>
        )}
      </div>

      {books.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Filters and Sort */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Priority Filter */}
            <div className="flex items-center gap-1 bg-library-card rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  filter === 'all' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All ({books.length})
              </button>
              <button
                onClick={() => setFilter('high')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  filter === 'high' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                High ({highCount})
              </button>
              <button
                onClick={() => setFilter('normal')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  filter === 'normal' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Normal ({normalCount})
              </button>
            </div>

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {sortedBooks.map(book => (
              <TBRCard
                key={book.id}
                book={book}
                onClick={() => navigate(`/book/${book.id}`)}
              />
            ))}
          </div>

          {/* Filtered empty state */}
          {sortedBooks.length === 0 && books.length > 0 && (
            <div className="text-center py-12 text-gray-400">
              No books match the current filter
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default TBRList
