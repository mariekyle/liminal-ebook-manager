import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getAuthor, updateAuthorNotes } from '../api'
import GradientCover from './GradientCover'

function AuthorDetail() {
  const { name } = useParams()
  const navigate = useNavigate()
  const [author, setAuthor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Notes editing state
  const [notesContent, setNotesContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    
    getAuthor(name)
      .then(data => {
        setAuthor(data)
        setNotesContent(data.notes || '')
      })
      .catch(err => {
        setError(err.message || 'Author not found')
      })
      .finally(() => setLoading(false))
  }, [name])

  const handleSaveNotes = async () => {
    if (saving) return
    
    setSaving(true)
    setSaveStatus(null)
    
    try {
      await updateAuthorNotes(name, notesContent)
      setAuthor(prev => ({ ...prev, notes: notesContent }))
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (err) {
      setSaveStatus('error')
      console.error('Failed to save notes:', err)
    } finally {
      setSaving(false)
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {author.name}
        </h1>
        <p className="text-gray-400">
          {author.book_count} {author.book_count === 1 ? 'book' : 'books'} in your library
        </p>
      </div>

      {/* Notes Section */}
      <div className="bg-library-card rounded-lg p-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-400">Notes about this author</h2>
          
          <div className="flex items-center gap-2">
            {saveStatus === 'saved' && (
              <span className="text-green-400 text-sm">✓ Saved</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-400 text-sm">Failed to save</span>
            )}
            
            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className={`
                px-4 py-1.5 rounded text-sm font-medium
                ${saving 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-library-accent hover:opacity-90'
                }
                text-white transition-opacity
              `}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        
        <textarea
          value={notesContent}
          onChange={e => setNotesContent(e.target.value)}
          placeholder="Add notes about this author..."
          className="w-full h-32 bg-library-bg text-white p-3 rounded-lg border border-gray-600 focus:border-library-accent focus:outline-none resize-y text-sm"
        />
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
    </div>
  )
}

export default AuthorDetail

