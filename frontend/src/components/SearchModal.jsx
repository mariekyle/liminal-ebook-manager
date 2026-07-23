import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { listBooks } from '../api'
import Modal from './ui/Modal'
import SearchInput from './ui/SearchInput'
import Button from './ui/Button'

function SearchModal({ onClose, onApplyFilter, currentSearch = '' }) {
  const [query, setQuery] = useState(currentSearch)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    setQuery(currentSearch)
  }, [currentSearch])

  useEffect(() => {
    if (!query.trim()) {
      setBooks([])
      setLoading(false)
      return
    }

    setLoading(true)
    setSelectedIndex(0)

    const timer = setTimeout(() => {
      listBooks({ search: query.trim(), limit: 20 })
        .then((data) => {
          setBooks(data.books || [])
        })
        .catch((err) => {
          console.error('Failed to search books:', err)
          setBooks([])
        })
        .finally(() => setLoading(false))
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

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
        setSelectedIndex((i) => Math.min(i + 1, books.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (books[selectedIndex]) {
          handleNavigateToBook(books[selectedIndex].id)
        } else if (query.trim()) {
          handleApplyFilter()
        }
        break
      default:
        break
    }
  }

  const handleNavigateToBook = (bookId) => {
    onClose()
    navigate(`/book/${bookId}`)
  }

  const handleApplyFilter = () => {
    onApplyFilter(query.trim())
    onClose()
  }

  return (
    <Modal isOpen={true} onClose={onClose} size="fullscreen">
      <Modal.Header onClose={onClose}>Search Library</Modal.Header>
      <Modal.Body className="flex flex-col gap-3 min-h-0">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search your library…"
          loading={loading}
          autoFocus
          onKeyDown={handleKeyDown}
        />
        <div
          ref={listRef}
          className="flex-1 min-h-0 max-h-[min(50vh,360px)] overflow-y-auto rounded-lg border border-border-subtle bg-bg-elevated/50"
        >
          {loading ? (
            <div className="px-4 py-8 text-center text-text-muted text-body-sm">Searching...</div>
          ) : books.length > 0 ? (
            books.map((book, index) => (
              <button
                key={book.id}
                type="button"
                onClick={() => handleNavigateToBook(book.id)}
                className={`w-full text-left px-4 py-3 transition-all duration-200 ease-out min-h-[44px] border-b border-border-subtle last:border-b-0 ${
                  index === selectedIndex ? 'bg-action-primary/15' : 'hover:bg-bg-surface'
                }`}
              >
                <div className="font-medium text-text-primary truncate text-body-sm">{book.title}</div>
                <div className="text-caption text-text-muted truncate">
                  {book.authors?.[0] || 'Unknown Author'}
                  {book.category && ` • ${book.category}`}
                </div>
              </button>
            ))
          ) : query.trim() ? (
            <div className="px-4 py-8 text-center">
              <p className="text-text-muted text-body-sm mb-1">No books found</p>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-text-muted text-body-sm">Type to search your library</div>
          )}
        </div>
        {query.trim() && (
          <div className="text-center pt-1">
            <Button type="button" variant="ghost" onClick={handleApplyFilter}>
              Filter library by &quot;{query.trim()}&quot; →
            </Button>
          </div>
        )}
      </Modal.Body>
    </Modal>
  )
}

export default SearchModal
