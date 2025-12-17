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
      {/* Filters Bar */}
      <div className="mb-6 flex flex-wrap gap-4 items-center flex-shrink-0">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search books..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-library-card text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-library-accent focus:outline-none"
          />
        </div>
        
        {/* Category Filter */}
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="bg-library-card text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-library-accent focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        
        {/* Status Filter */}
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="bg-library-card text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-library-accent focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Unread">Unread</option>
          <option value="In Progress">In Progress</option>
          <option value="Finished">Finished</option>
          <option value="DNF">DNF</option>
        </select>
        
        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="bg-library-card text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-library-accent focus:outline-none"
        >
          <option value="title">Sort by Title</option>
          <option value="author">Sort by Author</option>
          <option value="series">Sort by Series</option>
          <option value="year">Sort by Year</option>
          <option value="updated">Recently Updated</option>
        </select>
        
        {/* Count */}
        <div className="text-gray-400 text-sm">
          {total} books
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-pulse-slow text-4xl mb-4">📚</div>
          <p className="text-gray-400">Loading library...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && books.length === 0 && (
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

      {/* Book Grid - Scrollable container */}
      {!loading && !error && books.length > 0 && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-4">
            {books.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Library
