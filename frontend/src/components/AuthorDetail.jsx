import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { getAuthor, getSettings, updateBookStatus, updateBookDates, updateBookRating } from '../api'
import EditAuthorModal from './EditAuthorModal'
import UnifiedNavBar from './ui/UnifiedNavBar'
import Button from './ui/Button'
import { useGridColumns } from '../hooks/useGridColumns'
import BookCard from './BookCard'
import BookContextMenu from './BookContextMenu'
import MarkFinishedModal from './MarkFinishedModal'
import ChangeStatusModal from './ChangeStatusModal'

function readPageView(key) {
  try {
    return localStorage.getItem(`liminal-view-${key}`) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

function readGridVariant() {
  try {
    return localStorage.getItem('liminal-grid-variant') === 'standard' ? 'standard' : 'compact'
  } catch {
    return 'compact'
  }
}

function AuthorDetail() {
  const { name } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const returnUrl = location.state?.returnUrl || '/authors'

  const getBackLabel = () => {
    if (returnUrl.startsWith('/collections')) return 'Collections'
    if (returnUrl.startsWith('/series')) return 'Series'
    if (returnUrl.includes('view=series')) return 'Series'
    if (returnUrl.startsWith('/author')) return 'Authors'
    return 'Library'
  }

  const [author, setAuthor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [editModalOpen, setEditModalOpen] = useState(false)
  const { gridClasses } = useGridColumns()
  const [currentView, setCurrentView] = useState(() => readPageView('author'))
  const [gridVariant, setGridVariant] = useState(readGridVariant)

  const updateView = (value) => {
    setCurrentView(value)
    try { localStorage.setItem('liminal-view-author', value) } catch {}
  }

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

  const bookCardVariant = currentView === 'list' ? 'list'
    : gridVariant === 'compact' ? 'compact' : 'standard'

  const [wpm, setWpm] = useState(250)

  const [contextMenu, setContextMenu] = useState({ show: false, book: null, x: 0, y: 0 })
  const [selectedBook, setSelectedBook] = useState(null)
  const [showMarkFinished, setShowMarkFinished] = useState(false)
  const [showChangeStatus, setShowChangeStatus] = useState(false)

  useEffect(() => {
    getSettings()
      .then(settings => {
        if (settings.reading_wpm) {
          setWpm(parseInt(settings.reading_wpm, 10) || 250)
        }
      })
      .catch(err => console.error('Failed to load reading speed:', err))
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    
    getAuthor(name)
      .then(data => {
        setAuthor(data)
      })
      .catch(err => {
        setError(err.message || 'Author not found')
      })
      .finally(() => setLoading(false))
  }, [name])

  const handleAuthorSave = (result) => {
    if (result.new_name && result.new_name !== result.old_name) {
      navigate(`/author/${encodeURIComponent(result.new_name)}`, { replace: true, state: location.state })
    } else {
      setAuthor(prev => ({
        ...prev,
        notes: result.notes
      }))
    }
  }

  const handleBookLongPress = (book, position) => {
    setContextMenu({ show: true, book, x: position.x, y: position.y })
  }

  const handleMarkFinished = async (dateFinished, rating) => {
    if (!selectedBook) return
    try {
      await updateBookStatus(selectedBook.id, 'Finished')
      if (dateFinished) await updateBookDates(selectedBook.id, selectedBook.date_started, dateFinished)
      if (rating) await updateBookRating(selectedBook.id, rating)
      setAuthor(prev => ({
        ...prev,
        books: prev.books.map(b =>
          b.id === selectedBook.id ? { ...b, status: 'Finished', date_finished: dateFinished, rating: rating ?? b.rating } : b
        ),
      }))
    } catch (err) {
      console.error('Failed to mark finished:', err)
    }
    setShowMarkFinished(false)
    setSelectedBook(null)
  }

  const handleChangeStatus = async (newStatus) => {
    if (!selectedBook) return
    try {
      await updateBookStatus(selectedBook.id, newStatus)
      await updateBookDates(selectedBook.id, selectedBook.date_started, null)
      setAuthor(prev => ({
        ...prev,
        books: prev.books.map(b =>
          b.id === selectedBook.id ? { ...b, status: newStatus, date_finished: null } : b
        ),
      }))
    } catch (err) {
      console.error('Failed to change status:', err)
    }
    setShowChangeStatus(false)
    setSelectedBook(null)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse-slow text-4xl mb-4">✍️</div>
        <p className="text-body-sm text-text-secondary">Loading author...</p>
      </div>
    )
  }

  if (error || !author) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-action-danger">{error || 'Author not found'}</p>
        <Link 
          to={returnUrl}
          className="text-action-primary mt-4 inline-block hover:underline"
        >
          ← {getBackLabel()}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <UnifiedNavBar backLabel={getBackLabel()} backTo={returnUrl} />

      <div className="px-4 md:px-8">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-h2 text-text-primary">
          {author.name}
        </h1>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="flex-shrink-0"
          onClick={() => setEditModalOpen(true)}
          aria-label="Edit author"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          }
        >
          Edit
        </Button>
      </div>
      
      <p className="text-body-sm text-text-secondary mb-8">
        {author.book_count} {author.book_count === 1 ? 'book' : 'books'} in your library
      </p>

      <div className="bg-bg-elevated rounded-lg p-4 mb-8 border border-border-default">
        <h2 className="text-label text-text-secondary mb-3">About This Author</h2>
        
        {author.notes ? (
          <p className="text-body text-text-secondary leading-relaxed">
            {author.notes}
          </p>
        ) : (
          <p className="text-body-sm text-text-muted italic">
            No notes yet. Click Edit to add notes about this author.
          </p>
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-label text-text-secondary">
            Books by {author.name}
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border-default bg-bg-surface p-0.5 min-h-[36px]">
              <button
                type="button"
                onClick={() => updateView('grid')}
                className={`min-h-[32px] px-2 rounded-md text-caption transition-all duration-200 ease-out ${
                  currentView === 'grid'
                    ? 'bg-bg-elevated text-text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                aria-pressed={currentView === 'grid'}
                aria-label="Grid view"
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => updateView('list')}
                className={`min-h-[32px] px-2 rounded-md text-caption transition-all duration-200 ease-out ${
                  currentView === 'list'
                    ? 'bg-bg-elevated text-text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                aria-pressed={currentView === 'list'}
                aria-label="List view"
              >
                List
              </button>
            </div>
          </div>
        </div>

        {currentView === 'list' ? (
          <div className="flex flex-col">
            {author.books.map(book => (
              <BookCard
                key={book.id}
                book={{ ...book, authors: book.authors || [author.name] }}
                variant="list"
                wpm={wpm}
                onLongPress={handleBookLongPress}
              />
            ))}
          </div>
        ) : (
          <div className={gridClasses}>
            {author.books.map(book => (
              <BookCard
                key={book.id}
                book={{ ...book, authors: book.authors || [author.name] }}
                variant={bookCardVariant}
                wpm={wpm}
                onLongPress={handleBookLongPress}
              />
            ))}
          </div>
        )}
      </div>
      </div>

      <EditAuthorModal
        author={author}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleAuthorSave}
      />

      {contextMenu.show && (
        <BookContextMenu
          book={contextMenu.book}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onMarkFinished={() => {
            setSelectedBook(contextMenu.book)
            setShowMarkFinished(true)
          }}
          onChangeStatus={() => {
            setSelectedBook(contextMenu.book)
            setShowChangeStatus(true)
          }}
          onClose={() => setContextMenu({ show: false, book: null, x: 0, y: 0 })}
        />
      )}

      {showMarkFinished && selectedBook && (
        <MarkFinishedModal
          book={selectedBook}
          onConfirm={handleMarkFinished}
          onClose={() => { setShowMarkFinished(false); setSelectedBook(null); }}
        />
      )}

      {showChangeStatus && selectedBook && (
        <ChangeStatusModal
          book={selectedBook}
          onConfirm={handleChangeStatus}
          onClose={() => { setShowChangeStatus(false); setSelectedBook(null); }}
        />
      )}
    </div>
  )
}

export default AuthorDetail
