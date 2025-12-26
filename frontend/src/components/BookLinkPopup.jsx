import { useState, useEffect, useRef } from 'react'
import { listBooks } from '../api'

function BookLinkPopup({ onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Load books (initial load + search)
  useEffect(() => {
    setLoading(true)
    setSelectedIndex(0)
    
    const searchParams = { limit: 10 }
    if (query.trim()) {
      searchParams.search = query.trim()
    }
    
    listBooks(searchParams)
      .then(data => {
        setBooks(data.books || [])
      })
      .catch(err => {
        console.error('Failed to search books:', err)
        setBooks([])
      })
      .finally(() => setLoading(false))
  }, [query])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && books.length > 0) {
      const selectedEl = listRef.current.children[selectedIndex]
      selectedEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex, books.length])

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, books.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (books[selectedIndex]) {
          onSelect(books[selectedIndex].title)
        } else if (query.trim()) {
          // No match - insert query as-is
          onSelect(query.trim())
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      case 'Tab':
        e.preventDefault()
        if (books[selectedIndex]) {
          onSelect(books[selectedIndex].title)
        }
        break
    }
  }

  return (
    <div
      className="bg-library-card border border-gray-600 rounded-lg shadow-xl w-72"
    >
      {/* Search input */}
      <div className="p-2 border-b border-gray-700">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search books..."
          className="w-full bg-library-bg text-white text-sm rounded px-3 py-2 border border-gray-600 focus:border-library-accent focus:outline-none"
        />
      </div>

      {/* Results */}
      <div ref={listRef} className="max-h-48 overflow-y-auto">
        {loading ? (
          <div className="px-3 py-4 text-center text-gray-500 text-sm">
            Searching...
          </div>
        ) : books.length > 0 ? (
          books.map((book, index) => (
            <button
              key={book.id}
              onClick={() => onSelect(book.title)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                index === selectedIndex
                  ? 'bg-library-accent/20 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="font-medium truncate">{book.title}</div>
              {book.authors?.[0] && (
                <div className="text-xs text-gray-500 truncate">
                  {book.authors[0]}
                </div>
              )}
            </button>
          ))
        ) : query.trim() ? (
          <div className="p-3 text-center">
            <p className="text-gray-500 text-sm mb-2">No books found</p>
            <button
              onClick={() => onSelect(query.trim())}
              className="text-library-accent text-sm hover:underline"
            >
              Insert "{query.trim()}" anyway →
            </button>
          </div>
        ) : (
          <div className="px-3 py-4 text-center text-gray-500 text-sm">
            Type to search your library
          </div>
        )}
      </div>
    </div>
  )
}

export default BookLinkPopup

