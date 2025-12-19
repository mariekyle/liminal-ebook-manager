import { useState, useEffect } from 'react'
import { listBooks, getCategories } from '../api'
import BookCard from './BookCard'

function Library() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)
  
  // Filter state
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('title')
  const [categories, setCategories] = useState([])
  
  // View state (tabs)
  const [activeView, setActiveView] = useState('library')

  // Load categories on mount
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(err => console.error('Failed to load categories:', err))
  }, [])

  // Load books when filters change
  useEffect(() => {
    setLoading(true)
    setError(null)
    
    listBooks({
      category: category || undefined,
      status: status || undefined,
      search: search || undefined,
      sort,
      limit: 10000, // Load all books
    })
      .then(data => {
        setBooks(data.books)
        setTotal(data.total)
      })
      .catch(err => {
        setError(err.message)
        setBooks([])
      })
      .finally(() => setLoading(false))
  }, [category, status, search, sort])

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Search Bar - Full Width */}
      <div className="mb-4 flex-shrink-0">
        <input
          type="text"
          placeholder="Search books..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-library-card text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-library-accent focus:outline-none"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="mb-4 flex gap-8 border-b border-gray-700 flex-shrink-0">
        <button
          onClick={() => setActiveView('library')}
          className={`pb-2 text-sm font-medium transition-colors relative ${
            activeView === 'library'
              ? 'text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Library
          {activeView === 'library' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-library-accent" />
          )}
        </button>
        <button
          onClick={() => setActiveView('series')}
          className={`pb-2 text-sm font-medium transition-colors relative ${
            activeView === 'series'
              ? 'text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Series
          {activeView === 'series' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-library-accent" />
          )}
        </button>
      </div>

      {/* Category Pills */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-shrink-0">
        {['', ...categories].map((cat) => (
          <button
            key={cat || 'all'}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              category === cat
                ? 'bg-library-accent text-white'
                : 'bg-transparent text-gray-300 border border-gray-500 hover:border-gray-400'
            }`}
          >
            {cat || 'All Categories'}
          </button>
        ))}
      </div>

      {/* Info Row: Count + Sort + Status */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
        {/* Book Count */}
        <div className="text-gray-400 text-sm">
          {total} books
        </div>
        
        {/* Sort and Status Filters */}
        <div className="flex gap-3">
          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="bg-library-card text-white text-sm px-3 py-1.5 rounded-lg border border-gray-600 focus:border-library-accent focus:outline-none"
          >
            <option value="title">Sort by Title</option>
            <option value="author">Sort by Author</option>
            <option value="series">Sort by Series</option>
            <option value="year">Sort by Year</option>
            <option value="updated">Recently Updated</option>
          </select>
          
          {/* Status Filter */}
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="bg-library-card text-white text-sm px-3 py-1.5 rounded-lg border border-gray-600 focus:border-library-accent focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Unread">Unread</option>
            <option value="In Progress">In Progress</option>
            <option value="Finished">Finished</option>
            <option value="DNF">DNF</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {activeView === 'library' && loading && (
        <div className="text-center py-12">
          <div className="animate-pulse-slow text-4xl mb-4">📚</div>
          <p className="text-gray-400">Loading library...</p>
        </div>
      )}

      {/* Error State */}
      {activeView === 'library' && error && !loading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {activeView === 'library' && !loading && !error && books.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-400 mb-4">No books found</p>
          <p className="text-gray-500 text-sm">
            {search || category || status
              ? 'Try adjusting your filters' 
              : 'Click "Sync Library" to scan your book folders'
            }
          </p>
        </div>
      )}

      {/* Book Grid - Library View */}
      {activeView === 'library' && !loading && !error && books.length > 0 && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-4">
            {books.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}

      {/* Series View - Placeholder for now */}
      {activeView === 'series' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-4">📚</div>
            <p>Series view coming soon</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Library
