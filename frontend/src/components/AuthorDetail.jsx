import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getAuthor, getSettings } from '../api'
import GradientCover from './GradientCover'
import EditAuthorModal from './EditAuthorModal'

function AuthorDetail() {
  const { name } = useParams()
  const navigate = useNavigate()
  const [author, setAuthor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Edit modal state
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

  // Load display settings
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

  // Listen for display setting changes
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
    // If author was renamed, navigate to new URL
    if (result.new_name && result.new_name !== result.old_name) {
      navigate(`/author/${encodeURIComponent(result.new_name)}`, { replace: true })
    } else {
      // Just update local state
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
        <p className="text-gray-400">Loading author...</p>
      </div>
    )
  }

  if (error || !author) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-400">{error || 'Author not found'}</p>
        <button 
          onClick={() => navigate('/')}
          className="text-library-accent mt-4 inline-block"
        >
          ← Back to Library
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8">
      {/* Back link */}
      <button 
        onClick={() => navigate(-1)}
        className="text-gray-400 hover:text-white mb-6 inline-flex items-center gap-2"
      >
        ← Back
      </button>

      {/* Author Header */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-3xl font-bold text-white">
          {author.name}
        </h1>
        <button
          onClick={() => setEditModalOpen(true)}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors flex-shrink-0"
          aria-label="Edit author"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit
        </button>
      </div>
      
      <p className="text-gray-400 mb-8">
        {author.book_count} {author.book_count === 1 ? 'book' : 'books'} in your library
      </p>

      {/* About This Author Card - matches BookDetail "About This Book" style */}
      <div className="bg-library-card rounded-lg p-4 mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-3">About This Author</h2>
        
        {author.notes ? (
          <p className="text-gray-300 text-sm leading-relaxed">
            {author.notes}
          </p>
        ) : (
          <p className="text-gray-500 text-sm italic">
            No notes yet. Click Edit to add notes about this author.
          </p>
        )}
      </div>

      {/* Books by this Author */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 mb-4">
          Books by {author.name}
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {author.books.map(book => (
            <Link
              key={book.id}
              to={`/book/${book.id}`}
              className="group"
            >
              {/* FIX Phase 9C: Pass full book object to enable real cover display */}
              <div className="mb-2 relative">
                <GradientCover
                  book={{
                    ...book,
                    // Ensure author fallback for display
                    author: book.authors?.[0] || author.name,
                    // Pass all gradient color fields for fallback chain
                    cover_color_1: book.cover_color_1 || book.cover_bg_color,
                    cover_color_2: book.cover_color_2 || book.cover_text_color,
                  }}
                />
                {/* Finished checkmark badge */}
                {book.status === 'Finished' && (
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 shadow-lg">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              {showTitleBelow && (
              <h3 className="text-white text-sm font-medium truncate group-hover:text-library-accent transition-colors">
                {book.title}
              </h3>
            )}
            {showSeriesBelow && book.series && (
              <p className="text-gray-500 text-xs truncate">
                {book.series} #{book.series_number || '?'}
              </p>
            )}
            </Link>
          ))}
        </div>
      </div>

      {/* Edit Author Modal */}
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
