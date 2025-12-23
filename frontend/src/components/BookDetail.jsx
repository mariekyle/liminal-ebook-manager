import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { getBook, getBookNotes, saveNote, updateBookCategory, getCategories, updateBookStatus, updateBookRating, updateBookDates, getSeriesDetail, getSettings } from '../api'
import GradientCover from './GradientCover'
import EditBookModal from './EditBookModal'
import { getReadTimeData } from '../utils/readTime'

// Rating labels - can be customized in future settings
const RATING_LABELS = {
  1: 'Disliked',
  2: 'Disappointing',
  3: 'Decent/Fine',
  4: 'Better than Good',
  5: 'All-time Fav'
}

function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [book, setBook] = useState(null)
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Settings
  const [wpm, setWpm] = useState(250)
  
  // Note editor state
  const [noteContent, setNoteContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  
  // Category editing state
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [categoryStatus, setCategoryStatus] = useState(null)
  
  // Status editing state
  const [selectedStatus, setSelectedStatus] = useState('Unread')
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusStatus, setStatusStatus] = useState(null)
  
  // Rating editing state
  const [selectedRating, setSelectedRating] = useState(null)
  const [ratingLoading, setRatingLoading] = useState(false)
  const [ratingStatus, setRatingStatus] = useState(null)
  
  // Date editing state
  const [dateStarted, setDateStarted] = useState('')
  const [dateFinished, setDateFinished] = useState('')
  const [datesLoading, setDatesLoading] = useState(false)
  const [datesStatus, setDatesStatus] = useState(null)
  
  // Series data (for books in a series)
  const [seriesBooks, setSeriesBooks] = useState([])
  const [seriesLoading, setSeriesLoading] = useState(false)
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Load settings (for WPM)
  useEffect(() => {
    getSettings()
      .then(settings => {
        if (settings.reading_wpm) {
          setWpm(parseInt(settings.reading_wpm, 10) || 250)
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
  }, [])

  // Load book and notes (essential for page)
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
        setSelectedCategory(bookData.category || '')
        setSelectedStatus(bookData.status || 'Unread')
        setSelectedRating(bookData.rating || null)
        setDateStarted(bookData.date_started || '')
        setDateFinished(bookData.date_finished || '')
        // Pre-populate editor with existing note content
        if (notesData.length > 0) {
          setNoteContent(notesData[0].content || '')
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])
  
  // Load categories separately (non-essential, for dropdown only)
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(err => console.error('Failed to load categories:', err))
  }, [])

  // Load series data if book is part of a series
  useEffect(() => {
    if (!book?.series) {
      setSeriesBooks([])
      return
    }
    
    let cancelled = false
    setSeriesLoading(true)
    
    getSeriesDetail(book.series)
      .then(data => {
        if (!cancelled) {
          setSeriesBooks(data.books)
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('Failed to load series:', err)
          setSeriesBooks([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSeriesLoading(false)
        }
      })
    
    return () => {
      cancelled = true
    }
  }, [book?.series])

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

  const handleCategoryChange = async (newCategory) => {
    if (categoryLoading || newCategory === selectedCategory) return
    
    const previousCategory = selectedCategory
    setCategoryLoading(true)
    setCategoryStatus(null)
    
    // Optimistic update
    setSelectedCategory(newCategory)
    
    try {
      await updateBookCategory(id, newCategory)
      setBook(prev => ({ ...prev, category: newCategory }))
      setCategoryStatus('saved')
      setTimeout(() => setCategoryStatus(null), 2000)
    } catch (err) {
      console.error('Failed to update category:', err)
      // Revert on failure
      setSelectedCategory(previousCategory)
      setCategoryStatus('error')
      setTimeout(() => setCategoryStatus(null), 3000)
    } finally {
      setCategoryLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (statusLoading || newStatus === selectedStatus) return
    
    const previousStatus = selectedStatus
    setStatusLoading(true)
    setStatusStatus(null)
    
    // Optimistic update
    setSelectedStatus(newStatus)
    
    try {
      await updateBookStatus(id, newStatus)
      setBook(prev => ({ ...prev, status: newStatus }))
      setStatusStatus('saved')
      setTimeout(() => setStatusStatus(null), 2000)
    } catch (err) {
      console.error('Failed to update status:', err)
      // Revert on failure
      setSelectedStatus(previousStatus)
      setStatusStatus('error')
      setTimeout(() => setStatusStatus(null), 3000)
    } finally {
      setStatusLoading(false)
    }
  }

  const handleRatingChange = async (newRating) => {
    // Convert to number or null
    const ratingValue = newRating === '' ? null : parseInt(newRating, 10)
    
    if (ratingLoading || ratingValue === selectedRating) return
    
    const previousRating = selectedRating
    setRatingLoading(true)
    setRatingStatus(null)
    
    // Optimistic update
    setSelectedRating(ratingValue)
    
    try {
      await updateBookRating(id, ratingValue)
      setBook(prev => ({ ...prev, rating: ratingValue }))
      setRatingStatus('saved')
      setTimeout(() => setRatingStatus(null), 2000)
    } catch (err) {
      console.error('Failed to update rating:', err)
      // Revert on failure
      setSelectedRating(previousRating)
      setRatingStatus('error')
      setTimeout(() => setRatingStatus(null), 3000)
    } finally {
      setRatingLoading(false)
    }
  }

  const handleDateChange = async (field, value) => {
    if (datesLoading) return
    
    const newDateStarted = field === 'started' ? value : dateStarted
    const newDateFinished = field === 'finished' ? value : dateFinished
    
    // Save previous values for rollback
    const previousDateStarted = dateStarted
    const previousDateFinished = dateFinished
    
    // Optimistic update
    if (field === 'started') {
      setDateStarted(value)
    } else {
      setDateFinished(value)
    }
    
    setDatesLoading(true)
    setDatesStatus(null)
    
    try {
      await updateBookDates(id, newDateStarted, newDateFinished)
      setBook(prev => ({ 
        ...prev, 
        date_started: newDateStarted || null,
        date_finished: newDateFinished || null
      }))
      setDatesStatus('saved')
      setTimeout(() => setDatesStatus(null), 2000)
    } catch (err) {
      console.error('Failed to update dates:', err)
      // Revert on failure
      setDateStarted(previousDateStarted)
      setDateFinished(previousDateFinished)
      setDatesStatus('error')
      setTimeout(() => setDatesStatus(null), 3000)
    } finally {
      setDatesLoading(false)
    }
  }

  const handleMetadataSave = (updatedBook) => {
    setBook(updatedBook)
    // Update local state that might be affected
    setSelectedCategory(updatedBook.category || '')
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
        <button 
          onClick={() => {
            const returnUrl = location.state?.returnUrl
            if (returnUrl) {
              navigate(returnUrl)
            } else {
              navigate('/')
            }
          }} 
          className="text-library-accent mt-4 inline-block"
        >
          ← Back
        </button>
      </div>
    )
  }

  const primaryAuthor = book.authors?.[0] || 'Unknown Author'
  const readTimeData = getReadTimeData(book.word_count, wpm)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <button 
        onClick={() => {
          const returnUrl = location.state?.returnUrl
          if (returnUrl) {
            navigate(returnUrl)
          } else {
            navigate('/')
          }
        }} 
        className="text-gray-400 hover:text-white mb-6 inline-flex items-center gap-2"
      >
        ← Back
      </button>

      {/* Book Header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-6">
        {/* Cover */}
        <div className="w-32 sm:w-40 shrink-0">
          <GradientCover
            title={book.title}
            author={primaryAuthor}
            coverGradient={book.cover_gradient}
            coverBgColor={book.cover_bg_color}
            coverTextColor={book.cover_text_color}
          />
        </div>
        
        {/* Title, Author, Read Time */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-1">
            <h1 className="text-2xl font-bold text-white">
              {book.title}
            </h1>
            <button
              onClick={() => setEditModalOpen(true)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors flex-shrink-0"
              aria-label="Edit book details"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </button>
          </div>
          
          <p className="text-gray-400 mb-4">
            by {book.authors?.join(', ') || 'Unknown Author'}
          </p>
          
          {/* Estimated Read Time - Prominent Display */}
          {readTimeData && (
            <div className="bg-library-card rounded-lg px-4 py-3 inline-block">
              <div className="text-2xl font-semibold text-white">
                {readTimeData.display}
              </div>
              <div className="text-gray-400 text-sm">
                {readTimeData.microcopy}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reading Tracker Card */}
      <div className="bg-library-card rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={statusLoading}
            className="bg-library-bg px-3 py-1.5 rounded text-sm text-gray-300 border border-gray-600 focus:border-library-accent focus:outline-none cursor-pointer disabled:opacity-50"
          >
            <option value="Unread">Unread</option>
            <option value="In Progress">In Progress</option>
            <option value="Finished">Finished</option>
            <option value="DNF">DNF</option>
          </select>
          {statusStatus === 'saved' && (
            <span className="text-green-400 text-sm">✓</span>
          )}
          {statusStatus === 'error' && (
            <span className="text-red-400 text-sm">Failed</span>
          )}
          
          {/* Rating */}
          <select
            value={selectedRating ?? ''}
            onChange={(e) => handleRatingChange(e.target.value)}
            disabled={ratingLoading}
            className="bg-library-bg px-3 py-1.5 rounded text-sm text-gray-300 border border-gray-600 focus:border-library-accent focus:outline-none cursor-pointer disabled:opacity-50"
          >
            <option value="">No Rating</option>
            {[5, 4, 3, 2, 1].map(num => (
              <option key={num} value={num}>
                {'★'.repeat(num)}{'☆'.repeat(5-num)} {RATING_LABELS[num]}
              </option>
            ))}
          </select>
          {ratingStatus === 'saved' && (
            <span className="text-green-400 text-sm">✓</span>
          )}
          {ratingStatus === 'error' && (
            <span className="text-red-400 text-sm">Failed</span>
          )}
          
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            disabled={categoryLoading}
            className="bg-library-bg px-3 py-1.5 rounded text-sm text-gray-300 border border-gray-600 focus:border-library-accent focus:outline-none cursor-pointer disabled:opacity-50"
          >
            <option value="">Uncategorized</option>
            <option value="Fiction">Fiction</option>
            <option value="Non-Fiction">Non-Fiction</option>
            <option value="FanFiction">FanFiction</option>
            {categories
              .filter(cat => cat && !['Fiction', 'Non-Fiction', 'FanFiction', 'Uncategorized', ''].includes(cat))
              .map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))
            }
          </select>
          {categoryStatus === 'saved' && (
            <span className="text-green-400 text-sm">✓</span>
          )}
          {categoryStatus === 'error' && (
            <span className="text-red-400 text-sm">Failed</span>
          )}
        </div>
        
        {/* Reading Dates */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-sm">Started:</label>
            <input
              type="date"
              value={dateStarted}
              onChange={(e) => handleDateChange('started', e.target.value)}
              disabled={datesLoading}
              className="bg-library-bg px-3 py-1.5 rounded text-sm text-gray-300 border border-gray-600 focus:border-library-accent focus:outline-none disabled:opacity-50"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-sm">Finished:</label>
            <input
              type="date"
              value={dateFinished}
              onChange={(e) => handleDateChange('finished', e.target.value)}
              disabled={datesLoading}
              className="bg-library-bg px-3 py-1.5 rounded text-sm text-gray-300 border border-gray-600 focus:border-library-accent focus:outline-none disabled:opacity-50"
            />
          </div>
          {datesStatus === 'saved' && (
            <span className="text-green-400 text-sm">✓</span>
          )}
          {datesStatus === 'error' && (
            <span className="text-red-400 text-sm">Failed</span>
          )}
        </div>
      </div>

      {/* About This Book Card */}
      {(book.summary || (book.tags && book.tags.length > 0) || book.word_count || book.publication_year || book.series) && (
        <div className="bg-library-card rounded-lg p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-400 mb-3">About This Book</h2>
          
          {/* Summary */}
          {book.summary && (
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {book.summary}
            </p>
          )}
          
          {/* Tags */}
          {book.tags && book.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
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
          
          {/* Book Details Footer */}
          <div className="text-gray-500 text-xs flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-gray-700">
            {book.word_count && (
              <span>{book.word_count.toLocaleString()} words</span>
            )}
            {book.publication_year && (
              <span>{book.publication_year}</span>
            )}
            {book.series && (
              <span>{book.series} #{book.series_number || '?'}</span>
            )}
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="bg-library-card rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-400">Notes</h2>
          
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
        
        {/* Note Editor */}
        <textarea
          value={noteContent}
          onChange={e => setNoteContent(e.target.value)}
          placeholder="Write your notes here..."
          className="w-full h-48 bg-library-bg text-white p-3 rounded-lg border border-gray-600 focus:border-library-accent focus:outline-none resize-y text-sm"
        />
      </div>

      {/* Series Section */}
      {book.series && (
        <div className="bg-library-card rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-400">
              {book.series}
            </h2>
            <Link 
              to={`/series/${encodeURIComponent(book.series)}`}
              className="text-library-accent text-sm hover:underline"
            >
              View Series →
            </Link>
          </div>
          
          {seriesLoading ? (
            <div className="px-4 py-6 text-center text-gray-400">
              Loading series...
            </div>
          ) : seriesBooks.length > 0 ? (
            <ul className="divide-y divide-gray-700">
              {seriesBooks.map((seriesBook) => {
                const isCurrentBook = seriesBook.id === book.id
                return (
                  <li key={seriesBook.id}>
                    {isCurrentBook ? (
                      <div className="flex items-center gap-4 px-4 py-3 bg-gray-800/50">
                        <span className="text-gray-500 text-sm w-8 flex-shrink-0">
                          {seriesBook.series_number || '—'}
                        </span>
                        <span className="text-library-accent font-medium flex-1 truncate">
                          {seriesBook.title}
                        </span>
                        <span className="text-gray-500 text-xs">You are here</span>
                      </div>
                    ) : (
                      <Link
                        to={`/book/${seriesBook.id}`}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-gray-800/50 transition-colors"
                      >
                        <span className="text-gray-500 text-sm w-8 flex-shrink-0">
                          {seriesBook.series_number || '—'}
                        </span>
                        <span className="text-white flex-1 truncate">
                          {seriesBook.title}
                        </span>
                        {seriesBook.status === 'Finished' && (
                          <span className="text-green-400 text-sm">✓</span>
                        )}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      )}

      {/* File Location */}
      {book.folder_path && (
        <div className="text-gray-500 text-xs">
          <span className="font-medium">Location: </span>
          <code className="bg-library-card px-2 py-1 rounded">
            {book.folder_path}
          </code>
        </div>
      )}

      {/* Edit Metadata Modal */}
      <EditBookModal
        book={book}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleMetadataSave}
      />
    </div>
  )
}

export default BookDetail
