import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { getAuthor, getSettings, updateBookStatus } from '../api'
import EditAuthorModal from './EditAuthorModal'
import UnifiedNavBar from './ui/UnifiedNavBar'
import Button from './ui/Button'
import { useGridColumns } from '../hooks/useGridColumns'
import BookCard from './BookCard'
import BookContextMenu from './BookContextMenu'
import MarkFinishedModal from './MarkFinishedModal'
import ChangeStatusModal from './ChangeStatusModal'
import SortDropdown from './SortDropdown'

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

function readAuthorSort() {
  try {
    const stored = localStorage.getItem('liminal-author-sort')
    if (['series', 'title', 'added', 'published'].includes(stored)) return stored
  } catch {}
  return 'series'
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
  const [sortField, setSortField] = useState(() => readAuthorSort())
  const [sortDir, setSortDir] = useState(() => {
    const field = readAuthorSort()
    return ['added', 'published', 'finished'].includes(field) ? 'desc' : 'asc'
  })

  const updateView = (value) => {
    setCurrentView(value)
    try { localStorage.setItem('liminal-view-author', value) } catch {}
  }

  const handleSortChange = (field, dir) => {
    setSortField(field)
    setSortDir(dir)
    try { localStorage.setItem('liminal-author-sort', field) } catch {}
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
  // Shared by both status modals (never open together) — surfaces the
  // backend's plain-language detail in the modal error banner (B2)
  const [statusActionError, setStatusActionError] = useState(null)
  const [statusActionSaving, setStatusActionSaving] = useState(false)

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

  // One-call contract (B2): the endpoint writes sessions and returns the
  // PROJECTED status/rating/dates — apply those, never the tapped values
  const handleMarkFinished = async (dateFinished, rating) => {
    if (!selectedBook) return
    setStatusActionSaving(true)
    setStatusActionError(null)
    try {
      const result = await updateBookStatus(selectedBook.id, 'Finished', { dateFinished, rating })
      setAuthor(prev => ({
        ...prev,
        books: prev.books.map(b =>
          b.id === selectedBook.id
            ? { ...b, status: result.read_status, rating: result.rating, date_started: result.date_started, date_finished: result.date_finished }
            : b
        ),
      }))
      setShowMarkFinished(false)
      setSelectedBook(null)
    } catch (err) {
      setStatusActionError(err.message || "Couldn't update the status. Try again?")
    } finally {
      setStatusActionSaving(false)
    }
  }

  const handleChangeStatus = async (newStatus) => {
    if (!selectedBook) return
    setStatusActionSaving(true)
    setStatusActionError(null)
    try {
      const result = await updateBookStatus(selectedBook.id, newStatus)
      setAuthor(prev => ({
        ...prev,
        books: prev.books.map(b =>
          b.id === selectedBook.id
            ? { ...b, status: result.read_status, rating: result.rating, date_started: result.date_started, date_finished: result.date_finished }
            : b
        ),
      }))
      setShowChangeStatus(false)
      setSelectedBook(null)
    } catch (err) {
      setStatusActionError(err.message || "Couldn't update the status. Try again?")
    } finally {
      setStatusActionSaving(false)
    }
  }

  // --- Sort + grouping helpers (Track A) ---

  const ChevronRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-text-muted">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )

  const renderBookCard = (book, options = {}) => {
    const { seriesBadge = null } = options
    const card = (
      <BookCard
        book={{ ...book, authors: book.authors || [author?.name].filter(Boolean) }}
        variant={currentView === 'list' ? 'list' : bookCardVariant}
        wpm={wpm}
        onLongPress={handleBookLongPress}
      />
    )

    if (seriesBadge && currentView === 'grid') {
      return (
        <div key={book.id} className="relative">
          {card}
          <span className="absolute top-2 left-2 bg-bg-base/85 text-text-primary text-caption px-1.5 py-0.5 rounded font-medium backdrop-blur-sm">
            #{seriesBadge}
          </span>
        </div>
      )
    }

    return <div key={book.id}>{card}</div>
  }

  const renderBookList = (books, withSeriesBadge = false) => {
    if (currentView === 'list') {
      return (
        <div className="flex flex-col">
          {books.map(b => renderBookCard(b, { seriesBadge: withSeriesBadge ? b.series_number : null }))}
        </div>
      )
    }
    return (
      <div className={gridClasses}>
        {books.map(b => renderBookCard(b, { seriesBadge: withSeriesBadge ? b.series_number : null }))}
      </div>
    )
  }

  const renderBooksSection = () => {
    if (!author?.books) return null

    // --- Series grouping mode ---
    if (sortField === 'series') {
      const seriesMap = new Map()
      const standalone = []

      author.books.forEach(book => {
        if (book.series) {
          if (!seriesMap.has(book.series)) seriesMap.set(book.series, [])
          seriesMap.get(book.series).push(book)
        } else {
          standalone.push(book)
        }
      })

      const sortedSeriesNames = Array.from(seriesMap.keys()).sort((a, b) => {
        const cmp = a.localeCompare(b, undefined, { sensitivity: 'base' })
        return sortDir === 'desc' ? -cmp : cmp
      })

      sortedSeriesNames.forEach(name => {
        seriesMap.get(name).sort((a, b) => {
          const aNum = parseFloat(a.series_number)
          const bNum = parseFloat(b.series_number)
          if (Number.isNaN(aNum) && Number.isNaN(bNum)) return 0
          if (Number.isNaN(aNum)) return 1
          if (Number.isNaN(bNum)) return -1
          return aNum - bNum
        })
      })

      standalone.sort((a, b) => {
        const cmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
        return sortDir === 'desc' ? -cmp : cmp
      })

      return (
        <div className="space-y-8">
          {sortedSeriesNames.map(seriesName => {
            const books = seriesMap.get(seriesName)
            return (
              <div key={seriesName}>
                <Link
                  to={`/series/${encodeURIComponent(seriesName)}`}
                  state={{ returnUrl: location.pathname + location.search }}
                  className="flex items-center justify-between mb-3 px-2 py-2 -mx-2 rounded-lg hover:bg-bg-elevated transition-colors duration-200 ease-out min-h-[44px]"
                >
                  <span className="text-label text-text-primary">
                    Series: {seriesName} · {books.length} {books.length === 1 ? 'title' : 'titles'}
                  </span>
                  <ChevronRightIcon />
                </Link>
                {renderBookList(books, true)}
              </div>
            )
          })}

          {standalone.length > 0 && (
            <div>
              <div className="flex items-center mb-3 px-2 py-2 -mx-2 min-h-[44px]">
                <span className="text-label text-text-primary">
                  Standalone · {standalone.length} {standalone.length === 1 ? 'title' : 'titles'}
                </span>
              </div>
              {renderBookList(standalone, false)}
            </div>
          )}
        </div>
      )
    }

    // --- Flat sort mode (title / added / published) ---
    const sorted = [...author.books].sort((a, b) => {
      let cmp = 0
      if (sortField === 'title') {
        cmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
      } else if (sortField === 'added') {
        const aVal = a.date_added || ''
        const bVal = b.date_added || ''
        cmp = aVal.localeCompare(bVal)
      } else if (sortField === 'published') {
        cmp = (a.publication_year || 0) - (b.publication_year || 0)
      }
      return sortDir === 'desc' ? -cmp : cmp
    })

    return renderBookList(sorted, false)
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
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-label text-text-secondary">
            Books by {author.name}
          </h2>
          <div className="flex items-center gap-2">
            <SortDropdown
              value={sortField}
              direction={sortDir}
              onChange={handleSortChange}
              options={['series', 'title', 'added', 'published']}
            />
            <div className="flex items-center rounded-lg border border-border-default bg-bg-surface p-0.5 min-h-[36px]">
              {/* design-lint-button-chrome: chrome — view toggle */}
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
              {/* design-lint-button-chrome: chrome — view toggle */}
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

        {renderBooksSection()}
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
          onClose={() => { setShowMarkFinished(false); setSelectedBook(null); setStatusActionError(null); }}
          error={statusActionError}
          saving={statusActionSaving}
        />
      )}

      {showChangeStatus && selectedBook && (
        <ChangeStatusModal
          book={selectedBook}
          onConfirm={handleChangeStatus}
          onClose={() => { setShowChangeStatus(false); setSelectedBook(null); setStatusActionError(null); }}
          error={statusActionError}
          saving={statusActionSaving}
        />
      )}
    </div>
  )
}

export default AuthorDetail
