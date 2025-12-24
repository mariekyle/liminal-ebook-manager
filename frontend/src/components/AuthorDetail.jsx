import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getAuthor } from '../api'
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
    <div className="max-w-4xl mx-auto">
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
              <div className="aspect-[2/3] mb-2">
                <GradientCover
                  title={book.title}
                  author={book.authors?.[0] || author.name}
                  coverGradient={book.cover_gradient}
                  coverBgColor={book.cover_bg_color}
                  coverTextColor={book.cover_text_color}
                  showFinished={book.status === 'Finished'}
                />
              </div>
              <h3 className="text-white text-sm font-medium truncate group-hover:text-library-accent transition-colors">
                {book.title}
              </h3>
              {book.series && (
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
