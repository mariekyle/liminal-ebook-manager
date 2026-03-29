import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { getAuthor, getSettings } from '../api'
import GradientCover from './GradientCover'
import EditAuthorModal from './EditAuthorModal'
import UnifiedNavBar from './ui/UnifiedNavBar'
import Button from './ui/Button'

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
  const [showTitleBelow, setShowTitleBelow] = useState(false)
  const [showAuthorBelow, setShowAuthorBelow] = useState(false)
  const [showSeriesBelow, setShowSeriesBelow] = useState(false)

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

  useEffect(() => {
    getSettings()
      .then(settings => {
        if (settings.show_title_below !== undefined) {
          setShowTitleBelow(settings.show_title_below === 'true')
        }
        if (settings.show_author_below !== undefined) {
          setShowAuthorBelow(settings.show_author_below === 'true')
        }
        if (settings.show_series_below !== undefined) {
          setShowSeriesBelow(settings.show_series_below === 'true')
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
  }, [])

  useEffect(() => {
    const handleSettingsChange = (event) => {
      if (event.detail.show_title_below !== undefined) {
        setShowTitleBelow(event.detail.show_title_below)
      }
      if (event.detail.show_author_below !== undefined) {
        setShowAuthorBelow(event.detail.show_author_below)
      }
      if (event.detail.show_series_below !== undefined) {
        setShowSeriesBelow(event.detail.show_series_below)
      }
    }
    
    window.addEventListener('settingsChanged', handleSettingsChange)
    return () => window.removeEventListener('settingsChanged', handleSettingsChange)
  }, [])

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

  const bookReturnUrl = location.pathname + location.search

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
        <h2 className="text-label text-text-secondary mb-4">
          Books by {author.name}
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {author.books.map(book => (
            <Link
              key={book.id}
              to={`/book/${book.id}`}
              state={{ returnUrl: bookReturnUrl }}
              className="group"
            >
              <div className="mb-2 relative">
                <GradientCover
                  book={{
                    ...book,
                    author: book.authors?.[0] || author.name,
                    cover_color_1: book.cover_color_1 || book.cover_bg_color,
                    cover_color_2: book.cover_color_2 || book.cover_text_color,
                  }}
                />
                {book.status === 'Finished' && (
                  <div className="absolute top-2 right-2 bg-action-success rounded-full p-1 shadow-lg">
                    <svg className="w-3 h-3 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              {showTitleBelow && (
              <h3 className="text-text-primary text-sm font-medium truncate group-hover:text-action-primary transition-colors">
                {book.title}
              </h3>
            )}
            {showSeriesBelow && book.series && (
              <p className="text-caption text-text-muted truncate">
                {book.series} #{book.series_number || '?'}
              </p>
            )}
            </Link>
          ))}
        </div>
      </div>
      </div>

      <EditAuthorModal
        author={author}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleAuthorSave}
      />
    </div>
  )
}

export default AuthorDetail
