import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { getBook, getBookNotes, saveNote, updateBookCategory, getCategories, updateBookStatus, updateBookRating, updateBookDates, getSeriesDetail, getSettings, lookupBooksByTitles } from '../api'
import GradientCover from './GradientCover'
import EditBookModal from './EditBookModal'
import BookLinkPopup from './BookLinkPopup'
import { getReadTimeData } from '../utils/readTime'
import ReactMarkdown from 'react-markdown'

// Decode HTML entities in text (e.g., &amp; -> &, &quot; -> ")
function decodeHtmlEntities(text) {
  if (!text) return text
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

// Rating labels - can be customized in future settings
const RATING_LABELS = {
  1: 'Disliked',
  2: 'Disappointing',
  3: 'Decent/Fine',
  4: 'Better than Good',
  5: 'All-time Fav'
}

// Note templates
const NOTE_TEMPLATES = {
  structured: {
    label: 'Structured Review',
    content: `## Characters


## Atmosphere/World


## Writing


## Plot


## Enjoyment


## Steam


## Believability

`
  },
  reading: {
    label: 'Reading Notes',
    content: `## Thoughts While Reading


## Reactions After Finishing

`
  }
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
  const [originalNoteContent, setOriginalNoteContent] = useState('')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  // Book link popup state
  const [linkPopup, setLinkPopup] = useState({ open: false, cursorPos: 0 })
  const textareaRef = useRef(null)
  // Linked books lookup (for rendering [[Book Title]] in read mode)
  const [linkedBooks, setLinkedBooks] = useState({})
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
  
  // Popup state for status and rating
  const [statusPopupOpen, setStatusPopupOpen] = useState(false)
  const [ratingPopupOpen, setRatingPopupOpen] = useState(false)

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
          const content = notesData[0].content || ''
          setNoteContent(content)
          setOriginalNoteContent(content)
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

  // Look up books referenced in notes with [[Book Title]] syntax
  useEffect(() => {
    // Extract all [[...]] patterns from note content
    const linkPattern = /\[\[([^\]]+)\]\]/g
    const matches = []
    let match
    
    while ((match = linkPattern.exec(noteContent)) !== null) {
      matches.push(match[1])
    }
    
    // Remove duplicates
    const uniqueTitles = [...new Set(matches)]
    
    if (uniqueTitles.length === 0) {
      setLinkedBooks({})
      return
    }
    
    let cancelled = false
    
    // Look up books
    lookupBooksByTitles(uniqueTitles)
      .then(results => {
        if (!cancelled) {
          setLinkedBooks(results)
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('Failed to lookup linked books:', err)
          setLinkedBooks({})
        }
      })
    
    return () => {
      cancelled = true
    }
  }, [noteContent])

  const handleSaveNote = async () => {
    if (saving) return
    
    setSaving(true)
    setSaveStatus(null)
    
    try {
      const savedNote = await saveNote(id, noteContent)
      setNotes([savedNote])
      setOriginalNoteContent(noteContent)
      setSaveStatus('saved')
      setIsEditingNotes(false)
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (err) {
      setSaveStatus('error')
      console.error('Failed to save note:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setNoteContent(originalNoteContent)
    setIsEditingNotes(false)
    setLinkPopup({ open: false, cursorPos: 0 })
  }

  const handleNoteChange = (e) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart
    setNoteContent(value)
    
    const textBeforeCursor = value.substring(0, cursorPos)
    
    // Check if user just typed [[
    if (textBeforeCursor.endsWith('[[')) {
      setLinkPopup({ open: true, cursorPos: cursorPos })
    } 
    // Close popup if [[ is no longer at the expected position
    else if (linkPopup.open) {
      const storedPos = linkPopup.cursorPos
      const expectedMarker = value.substring(storedPos - 2, storedPos)
      
      if (expectedMarker !== '[[') {
        setLinkPopup({ open: false, cursorPos: 0 })
      } else {
        const textAfterMarker = value.substring(storedPos, cursorPos)
        if (textAfterMarker.includes(']]')) {
          setLinkPopup({ open: false, cursorPos: 0 })
        }
      }
    }
  }

  const handleBookSelect = (bookTitle) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    // Position right after [[ was typed
    const linkMarkerEnd = linkPopup.cursorPos
    // Current cursor position (may have moved if user typed in textarea)
    const currentCursorPos = textarea.selectionStart
    
    // Text before [[ (linkMarkerEnd - 2 gives us position before [[)
    const beforeLink = noteContent.substring(0, linkMarkerEnd - 2)
    // Text after current cursor (skips any characters typed after [[)
    const textAfter = noteContent.substring(currentCursorPos)
    
    const link = `[[${bookTitle}]]`
    const newText = beforeLink + link + textAfter
    const newCursorPos = beforeLink.length + link.length
    
    setNoteContent(newText)
    setLinkPopup({ open: false, cursorPos: 0 })
    
    // Refocus textarea and set cursor position after the inserted link
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleLinkPopupClose = () => {
    setLinkPopup({ open: false, cursorPos: 0 })
    textareaRef.current?.focus()
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

  const handleTemplateSelect = (templateKey) => {
    if (!templateKey || !NOTE_TEMPLATES[templateKey]) return
    
    const template = NOTE_TEMPLATES[templateKey]
    
    setNoteContent(prev => {
      if (prev.trim()) {
        // Append with separator if there's existing content
        return prev + '\n\n---\n\n' + template.content
      }
      return template.content
    })
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

  // Render note content with [[Book Title]] converted to links/spans
  const renderNoteWithLinks = (text, keyPrefix = '') => {
    if (!text) return null
    
    // Split text by [[...]] pattern, keeping the matches
    const parts = []
    let lastIndex = 0
    const linkPattern = /\[\[([^\]]+)\]\]/g
    let match
    
    while ((match = linkPattern.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        })
      }
      
      // Add the link
      const title = match[1]
      const book = linkedBooks[title]
      parts.push({
        type: 'link',
        title: title,
        book: book
      })
      
      lastIndex = match.index + match[0].length
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      })
    }
    
    return parts.map((part, index) => {
      const key = `${keyPrefix}${index}`
      if (part.type === 'text') {
        return <span key={key}>{part.content}</span>
      } else if (part.book) {
        // Book exists - render as link
        return (
          <Link
            key={key}
            to={`/book/${part.book.id}`}
            className="text-library-accent hover:underline"
          >
            {part.title}
          </Link>
        )
      } else {
        // Book not found - render as gray text
        return (
          <span key={key} className="text-gray-500">
            {part.title}
          </span>
        )
      }
    })
  }

  const primaryAuthor = book.authors?.[0] || 'Unknown Author'
  const readTimeData = getReadTimeData(book.word_count, wpm)

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8">
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
          {/* Series badge - above title */}
          {book.series && (
            <div className="text-gray-500 text-xs mb-1">
              {book.series} #{book.series_number || '?'}
            </div>
          )}
          
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
          
          <p className="text-gray-400 mb-1">
            by{' '}
            {book.authors?.length > 0 ? (
              book.authors.map((author, index) => (
                <span key={`${author}-${index}`}>
                  <Link
                    to={`/author/${encodeURIComponent(author)}`}
                    className="hover:text-library-accent transition-colors"
                  >
                    {author}
                  </Link>
                  {index < book.authors.length - 1 && ', '}
                </span>
              ))
            ) : (
              'Unknown Author'
            )}
          </p>
          
          {/* Year - below author */}
          {book.publication_year && (
            <p className="text-gray-500 text-sm mb-4">
              {book.publication_year}
            </p>
          )}
          
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
          {/* Status Chip + Popup */}
          <div className="relative">
            <button
              onClick={() => {
                setStatusPopupOpen(!statusPopupOpen)
                setRatingPopupOpen(false)
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-library-bg border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer"
            >
              <span className={`text-sm ${
                selectedStatus === 'Finished' ? 'text-green-400' :
                selectedStatus === 'In Progress' ? 'text-blue-400' :
                selectedStatus === 'DNF' ? 'text-red-400' :
                'text-gray-300'
              }`}>
                {selectedStatus}
              </span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {statusPopupOpen && (
              <>
                {/* Backdrop to close popup */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setStatusPopupOpen(false)}
                />
                {/* Popup */}
                <div className="absolute top-full left-0 mt-1 bg-library-bg border border-gray-600 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                  {['Unread', 'In Progress', 'Finished', 'DNF'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        handleStatusChange(status)
                        setStatusPopupOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                        selectedStatus === status ? 'text-library-accent' : 'text-gray-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </>
            )}
            
            {statusStatus === 'saved' && (
              <span className="text-green-400 text-sm ml-1">✓</span>
            )}
            {statusStatus === 'error' && (
              <span className="text-red-400 text-sm ml-1">!</span>
            )}
          </div>
          
          {/* Rating Chip + Popup */}
          <div className="relative">
            <button
              onClick={() => {
                setRatingPopupOpen(!ratingPopupOpen)
                setStatusPopupOpen(false)
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-library-bg border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer"
            >
              <span className="text-sm text-gray-300">
                {selectedRating 
                  ? `${'★'.repeat(selectedRating)}${'☆'.repeat(5-selectedRating)}`
                  : 'No Rating'
                }
              </span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {ratingPopupOpen && (
              <>
                {/* Backdrop to close popup */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setRatingPopupOpen(false)}
                />
                {/* Popup */}
                <div className="absolute top-full left-0 mt-1 bg-library-bg border border-gray-600 rounded-lg shadow-lg z-20 py-1 min-w-[180px]">
                  <button
                    onClick={() => {
                      handleRatingChange('')
                      setRatingPopupOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                      !selectedRating ? 'text-library-accent' : 'text-gray-300'
                    }`}
                  >
                    No Rating
                  </button>
                  {[5, 4, 3, 2, 1].map(num => (
                    <button
                      key={num}
                      onClick={() => {
                        handleRatingChange(num.toString())
                        setRatingPopupOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                        selectedRating === num ? 'text-library-accent' : 'text-gray-300'
                      }`}
                    >
                      {'★'.repeat(num)}{'☆'.repeat(5-num)} <span className="text-gray-500 ml-1">{RATING_LABELS[num]}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            
            {ratingStatus === 'saved' && (
              <span className="text-green-400 text-sm ml-1">✓</span>
            )}
            {ratingStatus === 'error' && (
              <span className="text-red-400 text-sm ml-1">!</span>
            )}
          </div>
          
          {/* Category - Read Only Chip */}
          {selectedCategory && (
            <span className="px-3 py-1.5 rounded-full bg-library-bg border border-gray-600 text-sm text-gray-300">
              {selectedCategory}
            </span>
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
      {(book.summary || (book.tags && book.tags.length > 0) || book.word_count) && (
        <div className="bg-library-card rounded-lg p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-400 mb-3">About This Book</h2>
          
          {/* Summary */}
          {book.summary && (
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {decodeHtmlEntities(book.summary)}
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
          {(book.word_count || book.created_at) && (
            <div className="text-gray-500 text-xs pt-2 border-t border-gray-700 flex justify-between">
              {book.word_count && (
                <span>{book.word_count.toLocaleString()} words</span>
              )}
              {book.created_at && (
                <span>Added {new Date(book.created_at).toLocaleDateString()}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Notes Section */}
      <div className="bg-library-card rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-400">Notes</h2>
          
          <div className="flex items-center gap-2">
            {saveStatus === 'saved' && (
              <span className="text-green-400 text-sm">✓ Saved</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-400 text-sm">Failed to save</span>
            )}
            
            <button
              onClick={() => setIsEditingNotes(true)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
              aria-label="Edit notes"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </button>
          </div>
        </div>
        
        {/* Note Content - Read mode only */}
        {noteContent ? (
          <div className="prose prose-invert prose-sm max-w-none text-gray-300">
            <ReactMarkdown
              components={{
                h2: ({children}) => <h2 className="text-base font-semibold text-white mt-4 mb-2 first:mt-0">{children}</h2>,
                h3: ({children}) => <h3 className="text-sm font-semibold text-white mt-3 mb-1">{children}</h3>,
                p: ({children}) => {
                  // Process children to handle [[Book Title]] links
                  const processChildren = (child, childIndex) => {
                    if (typeof child === 'string') {
                      return renderNoteWithLinks(child, `p-${childIndex}-`)
                    }
                    return child
                  }
                  
                  const processed = Array.isArray(children) 
                    ? children.map((child, i) => processChildren(child, i)).flat()
                    : processChildren(children, 0)
                  
                  return <p className="text-gray-300 text-sm mb-2">{processed}</p>
                },
                hr: () => <hr className="border-gray-600 my-4" />,
                strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                em: ({children}) => <em className="text-gray-300">{children}</em>,
                ul: ({children}) => <ul className="list-disc list-inside text-sm text-gray-300 mb-2">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside text-sm text-gray-300 mb-2">{children}</ol>,
                li: ({children}) => {
                  const processChildren = (child, childIndex) => {
                    if (typeof child === 'string') {
                      return renderNoteWithLinks(child, `li-${childIndex}-`)
                    }
                    return child
                  }
                  
                  const processed = Array.isArray(children) 
                    ? children.map((child, i) => processChildren(child, i)).flat()
                    : processChildren(children, 0)
                  
                  return <li>{processed}</li>
                },
              }}
            >
              {noteContent}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">No notes yet. Click Edit to add some.</p>
        )}
      </div>

      {/* Notes Editor Full-Screen Modal */}
      {isEditingNotes && (
        <div className="fixed inset-0 z-50 bg-library-bg flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-library-card">
            <button
              onClick={saving ? undefined : handleCancelEdit}
              disabled={saving}
              className={`p-1 ${saving ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
              aria-label="Close editor"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-lg font-medium text-white">Edit Notes</h2>
            
            <button
              onClick={handleSaveNote}
              disabled={saving}
              className={`
                px-4 py-1.5 rounded-lg text-sm font-medium
                ${saving 
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
                  : 'bg-library-accent hover:opacity-90 text-white'
                }
              `}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-700">
            <select
              onChange={(e) => {
                handleTemplateSelect(e.target.value)
                e.target.value = ''
              }}
              className="bg-library-bg text-gray-300 text-sm rounded px-2 py-1 border border-gray-600 focus:border-library-accent focus:outline-none cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>+ Template</option>
              <option value="structured">Structured Review</option>
              <option value="reading">Reading Notes</option>
            </select>
            
            {saveStatus === 'error' && (
              <span className="text-red-400 text-sm ml-auto">Failed to save</span>
            )}
          </div>
          
          {/* Editor Area */}
          <div className="flex-1 min-h-0 p-4">
            <textarea
              ref={textareaRef}
              value={noteContent}
              onChange={handleNoteChange}
              placeholder="Write your notes here... (Type [[ to link to a book)"
              className="w-full h-full bg-transparent text-white focus:outline-none resize-none text-sm leading-relaxed overflow-y-auto"
              autoFocus
            />
          </div>
          
          {/* Book Link Modal */}
          {linkPopup.open && (
            <BookLinkPopup
              onSelect={handleBookSelect}
              onClose={handleLinkPopupClose}
            />
          )}
        </div>
      )}

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
