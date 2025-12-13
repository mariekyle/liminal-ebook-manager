import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getBook, getBookNotes, saveNote } from '../api'
import GradientCover from './GradientCover'

function BookDetail() {
  const { id } = useParams()
  const [book, setBook] = useState(null)
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Note editor state
  const [noteContent, setNoteContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

  // Load book and notes
  useEffect(() => {
    setLoading(true)
    setError(null)
    
    Promise.all([
      getBook(id),
      getBookNotes(id)
    ])
      .then(([bookData, notesData]) => {
        setBook(bookData)
        setNotes(notesData)
        // Pre-populate editor with existing note content
        if (notesData.length > 0) {
          setNoteContent(notesData[0].content || '')
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleSaveNote = async () => {
    if (saving) return
    
    setSaving(true)
    setSaveStatus(null)
    
    try {
      const savedNote = await saveNote(id, noteContent)
      setNotes([savedNote])
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (err) {
      setSaveStatus('error')
      console.error('Failed to save note:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse-slow text-4xl mb-4">📖</div>
        <p className="text-gray-400">Loading book...</p>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-400">{error || 'Book not found'}</p>
        <Link to="/" className="text-library-accent mt-4 inline-block">
          ← Back to Library
        </Link>
      </div>
    )
  }

  const primaryAuthor = book.authors?.[0] || 'Unknown Author'

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link 
        to="/" 
        className="text-gray-400 hover:text-white mb-6 inline-flex items-center gap-2"
      >
        ← Back to Library
      </Link>

      {/* Book Header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        {/* Cover */}
        <div className="w-40 shrink-0">
          <GradientCover
            title={book.title}
            author={primaryAuthor}
            color1={book.cover_color_1}
            color2={book.cover_color_2}
          />
        </div>
        
        {/* Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white mb-2">
            {book.title}
          </h1>
          
          <p className="text-gray-400 mb-4">
            by {book.authors?.join(', ') || 'Unknown Author'}
          </p>
          
          {/* Metadata pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {book.category && (
              <span className="bg-library-card px-3 py-1 rounded text-sm text-gray-300">
                {book.category}
              </span>
            )}
            {book.series && (
              <span className="bg-library-card px-3 py-1 rounded text-sm text-gray-300">
                {book.series} #{book.series_number}
              </span>
            )}
            {book.publication_year && (
              <span className="bg-library-card px-3 py-1 rounded text-sm text-gray-300">
                {book.publication_year}
              </span>
            )}
            {book.word_count && (
              <span className="bg-library-card px-3 py-1 rounded text-sm text-gray-300">
                {book.word_count.toLocaleString()} words
              </span>
            )}
          </div>
          
          {/* Summary */}
          {book.summary && (
            <div className="bg-library-card rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Summary</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {book.summary}
              </p>
            </div>
          )}
          
          {/* Tags */}
          {book.tags && book.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {book.tags.map(tag => (
                <span 
                  key={tag}
                  className="bg-library-accent/20 text-library-accent px-2 py-0.5 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-library-card rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">📝 Notes</h2>
          
          {/* Save status indicator */}
          <div className="flex items-center gap-2">
            {saveStatus === 'saved' && (
              <span className="text-green-400 text-sm">✓ Saved</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-400 text-sm">Failed to save</span>
            )}
            
            <button
              onClick={handleSaveNote}
              disabled={saving}
              className={`
                px-4 py-2 rounded text-sm font-medium
                ${saving 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-library-accent hover:opacity-90'
                }
                text-white transition-opacity
              `}
            >
              {saving ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </div>
        
        {/* Note Editor */}
        <textarea
          value={noteContent}
          onChange={e => setNoteContent(e.target.value)}
          placeholder="Write your notes here... Use [[Book Title]] to link to other books."
          className="w-full h-64 bg-library-bg text-white p-4 rounded-lg border border-gray-600 focus:border-library-accent focus:outline-none resize-y font-mono text-sm"
        />
        
        {/* Linking hint */}
        <p className="text-gray-500 text-xs mt-2">
          Tip: Use [[Book Title]] to create links to other books in your library.
        </p>
      </div>

      {/* File Location (for debugging/reference) */}
      {book.folder_path && (
        <div className="mt-6 text-gray-500 text-xs">
          <span className="font-medium">Location: </span>
          <code className="bg-library-card px-2 py-1 rounded">
            {book.folder_path}
          </code>
        </div>
      )}
    </div>
  )
}

export default BookDetail
