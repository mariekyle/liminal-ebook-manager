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
    
    const searchParams = { limit: 20 }
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
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-20 z-50 max-w-lg mx-auto">
        <div className="bg-library-card rounded-xl shadow-2xl overflow-hidden border border-gray-600">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <h3 className="text-white font-medium">Link to Book</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Search Input */}
          <div className="p-3 border-b border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search your library..."
              className="w-full bg-library-bg text-white text-sm rounded-lg px-4 py-3 border border-gray-600 focus:border-library-accent focus:outline-none"
            />
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                Searching...
              </div>
            ) : books.length > 0 ? (
              books.map((book, index) => (
                <button
                  key={book.id}
                  onClick={() => onSelect(book.title)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    index === selectedIndex
                      ? 'bg-library-accent/20'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium text-white truncate">{book.title}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {book.authors?.[0] || 'Unknown Author'}
                    {book.category && ` • ${book.category}`}
                  </div>
                </button>
              ))
            ) : query.trim() ? (
              <div className="px-4 py-8 text-center">
                <p className="text-gray-500 text-sm mb-1">No books found</p>
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                Type to search your library
              </div>
            )}
          </div>
          
          {/* Footer - Insert anyway option */}
          {query.trim() && (
            <div className="px-4 py-3 border-t border-gray-700 text-center">
              <button
                onClick={() => onSelect(query.trim())}
                className="text-library-accent text-sm hover:underline"
              >
                Insert "{query.trim()}" as plain text →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default BookLinkPopup
