import { useState, useEffect, useRef } from 'react'
import { listBooks } from '../api'
import Button from './ui/Button'

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
        className="fixed inset-0 bg-bg-overlay z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-20 z-50 max-w-lg mx-auto">
        <div className="bg-bg-surface rounded-xl shadow-2xl overflow-hidden border border-border-default">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
            <h3 className="text-text-primary font-medium">Link to Book</h3>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Search Input */}
          <div className="p-3 border-b border-border-default">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search your library..."
              className="w-full bg-bg-elevated text-text-primary text-sm rounded-lg px-4 py-3 border border-border-default placeholder:text-text-muted focus:border-action-primary focus:outline-none"
            />
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-text-muted text-sm">
                Searching...
              </div>
            ) : books.length > 0 ? (
              books.map((book, index) => (
                <button
                  key={book.id}
                  onClick={() => onSelect(book.title)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    index === selectedIndex
                      ? 'bg-action-primary/20'
                      : 'hover:bg-bg-elevated'
                  }`}
                >
                  <div className="font-medium text-text-primary truncate">{book.title}</div>
                  <div className="text-xs text-text-muted truncate">
                    {book.authors?.[0] || 'Unknown Author'}
                    {book.category && ` • ${book.category}`}
                  </div>
                </button>
              ))
            ) : query.trim() ? (
              <div className="px-4 py-8 text-center">
                <p className="text-text-muted text-sm mb-1">No books found</p>
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-text-muted text-sm">
                Type to search your library
              </div>
            )}
          </div>
          
          {/* Footer - Insert anyway option */}
          {query.trim() && (
            <div className="px-4 py-3 border-t border-border-default text-center">
              <Button variant="ghost" size="sm" onClick={() => onSelect(query.trim())}>
                Insert "{query.trim()}" as plain text →
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default BookLinkPopup
