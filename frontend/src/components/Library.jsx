import { useState, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { listBooks, getCategories } from '../api'
import BookCard from './BookCard'

// Hook to track container width for responsive columns
function useContainerWidth(ref) {
  const [width, setWidth] = useState(0)
  
  useEffect(() => {
    if (!ref.current) return
    
    const observer = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width)
    })
    
    observer.observe(ref.current)
    setWidth(ref.current.offsetWidth)
    
    return () => observer.disconnect()
  }, [ref])
  
  return width
}

// Calculate columns based on container width (matches Tailwind breakpoints)
function getColumnCount(width) {
  if (width >= 1280) return 6  // xl
  if (width >= 1024) return 5  // lg
  if (width >= 768) return 4   // md
  if (width >= 640) return 3   // sm
  return 2                      // default
}

function Library() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)
  
  // Filter state
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('title')
  const [categories, setCategories] = useState([])
  
  // Virtual scrolling refs
  const parentRef = useRef(null)
  const gridRef = useRef(null)
  const containerWidth = useContainerWidth(gridRef)

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
      search: search || undefined,
      sort,
      limit: 10000, // Fetch all books, virtual scrolling handles rendering
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
  }, [category, search, sort])

  return (
    <div>
      {/* Filters Bar */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
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
            {search || category 
              ? 'Try adjusting your filters' 
              : 'Click "Sync Library" to scan your book folders'
            }
          </p>
        </div>
      )}

      {/* Virtual Scrolling Book Grid */}
      {!loading && !error && books.length > 0 && (
        <VirtualBookGrid 
          books={books} 
          parentRef={parentRef}
          gridRef={gridRef}
          containerWidth={containerWidth}
        />
      )}
    </div>
  )
}

// Virtual scrolling grid component
function VirtualBookGrid({ books, parentRef, gridRef, containerWidth }) {
  const columns = getColumnCount(containerWidth)
  const gap = 16 // gap-4 = 1rem = 16px
  
  // Calculate card dimensions based on container width
  const cardWidth = containerWidth > 0 
    ? (containerWidth - (gap * (columns - 1))) / columns 
    : 150
  const cardHeight = cardWidth * 1.5 // 2:3 aspect ratio
  const rowHeight = cardHeight + gap
  
  // Group books into rows
  const rowCount = Math.ceil(books.length / columns)
  
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 3, // Render 3 extra rows above/below viewport
  })

  const virtualRows = virtualizer.getVirtualItems()

  return (
    <div 
      ref={parentRef}
      className="h-[calc(100vh-200px)] overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        ref={gridRef}
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map(virtualRow => {
          const startIndex = virtualRow.index * columns
          const rowBooks = books.slice(startIndex, startIndex + columns)
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div 
                className="grid gap-4"
                style={{ 
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                }}
              >
                {rowBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Library
