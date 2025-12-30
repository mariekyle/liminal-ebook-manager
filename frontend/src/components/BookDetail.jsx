import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { getBook, getBookNotes, saveNote, updateBookCategory, getCategories, updateBookStatus, updateBookRating, updateBookDates, getSeriesDetail, getSettings, lookupBooksByTitles, getBookBacklinks, updateTBR, convertTBRToLibrary, getBookSessions, createSession, updateSession, deleteSession } from '../api'
import GradientCover from './GradientCover'
import EditBookModal from './EditBookModal'
import BookLinkPopup from './BookLinkPopup'
import { getReadTimeData } from '../utils/readTime'
import ReactMarkdown from 'react-markdown'
import { useStatusLabels } from '../hooks/useStatusLabels'

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
  
  // Backlinks (books that reference this book)
  const [backlinks, setBacklinks] = useState([])
  const [backlinksLoading, setBacklinksLoading] = useState(false)
  
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
  
  // TBR priority state
  const [priorityPopupOpen, setPriorityPopupOpen] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState('normal')
  const [priorityLoading, setPriorityLoading] = useState(false)
  const [priorityStatus, setPriorityStatus] = useState(null)
  
  // TBR reason editing state
  const [isEditingReason, setIsEditingReason] = useState(false)
  const [reasonDraft, setReasonDraft] = useState('')
  const [reasonLoading, setReasonLoading] = useState(false)
  
  // TBR acquire modal state
  const [showAcquireModal, setShowAcquireModal] = useState(false)
  const [acquireLoading, setAcquireLoading] = useState(false)
  const [acquireFormat, setAcquireFormat] = useState('ebook')

  // Mobile tab state
  const [activeTab, setActiveTab] = useState('details')
  
  // Date editors visibility
  const [showDateEditors, setShowDateEditors] = useState(false)
  
  // Sessions state
  const [sessions, setSessions] = useState([])
  const [sessionsStats, setSessionsStats] = useState({ times_read: 0, average_rating: null })
  const [sessionsLoading, setSessionsLoading] = useState(false)
  
  // Session editor modal state
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState(null) // null = creating new, object = editing existing
  const [sessionForm, setSessionForm] = useState({
    date_started: '',
    date_finished: '',
    session_status: 'in_progress',
    rating: null
  })
  const [sessionSaving, setSessionSaving] = useState(false)
  const [sessionError, setSessionError] = useState(null)

  // Custom status labels
  const { getLabel, getStatusOptions } = useStatusLabels()

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

  // Fetch sessions for the book
  const fetchSessions = async () => {
    if (!id) return
    setSessionsLoading(true)
    try {
      const data = await getBookSessions(id)
      setSessions(data.sessions || [])
      setSessionsStats({
        times_read: data.times_read || 0,
        average_rating: data.average_rating
      })
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    } finally {
      setSessionsLoading(false)
    }
  }
  
  // Session editor handlers
  const openAddSession = () => {
    setEditingSession(null)
    setSessionForm({
      date_started: '',
      date_finished: '',
      session_status: 'in_progress',
      rating: null
    })
    setSessionError(null)
    setSessionModalOpen(true)
  }

  const openEditSession = (session) => {
    setEditingSession(session)
    setSessionForm({
      date_started: session.date_started || '',
      date_finished: session.date_finished || '',
      session_status: session.session_status,
      rating: session.rating
    })
    setSessionError(null)
    setSessionModalOpen(true)
  }

  const closeSessionModal = () => {
    setSessionModalOpen(false)
    setEditingSession(null)
    setSessionError(null)
  }
  
  const handleSaveSession = async () => {
    setSessionSaving(true)
    setSessionError(null)
    
    try {
      const data = {
        session_status: sessionForm.session_status
      }
      
      // Only include rating if status is finished or dnf
      // (in_progress sessions can't have ratings, but we preserve existing ones by not sending)
      if (sessionForm.session_status !== 'in_progress') {
        data.rating = sessionForm.rating
      }
      
      // Only include dates if we're editing (to allow clearing)
      // For new sessions, empty string is fine (backend handles it)
      if (editingSession) {
        // Send empty string to clear, actual value to set
        data.date_started = sessionForm.date_started
        data.date_finished = sessionForm.date_finished
      } else {
        // For new sessions, only include if set
        if (sessionForm.date_started) data.date_started = sessionForm.date_started
        if (sessionForm.date_finished) data.date_finished = sessionForm.date_finished
      }
      
      if (editingSession) {
        await updateSession(editingSession.id, data)
      } else {
        await createSession(id, data)
      }
      
      closeSessionModal()
      fetchSessions() // Refresh the list
      // Also refresh book data to get updated cached status/rating
      const bookData = await getBook(id)
      setBook(bookData)
      setSelectedStatus(bookData.status || 'Unread')
      setSelectedRating(bookData.rating || null)
      setDateStarted(bookData.date_started || '')
      setDateFinished(bookData.date_finished || '')
    } catch (err) {
      setSessionError(err.message)
    } finally {
      setSessionSaving(false)
    }
  }
  
  const handleDeleteSession = async () => {
    if (!editingSession) return
    
    const confirmDelete = window.confirm(
      `Delete Read #${editingSession.session_number}? This cannot be undone.`
    )
    if (!confirmDelete) return
    
    setSessionSaving(true)
    setSessionError(null)
    
    try {
      await deleteSession(editingSession.id)
      closeSessionModal()
      fetchSessions()
      // Refresh book data to get updated cached status/rating
      const bookData = await getBook(id)
      setBook(bookData)
      setSelectedStatus(bookData.status || 'Unread')
      setSelectedRating(bookData.rating || null)
      setDateStarted(bookData.date_started || '')
      setDateFinished(bookData.date_finished || '')
    } catch (err) {
      setSessionError(err.message)
    } finally {
      setSessionSaving(false)
    }
  }
  
  // Load book and notes (essential for page)
  useEffect(() => {
    setLoading(true)
    setError(null)
    setShowDateEditors(false)
    setActiveTab('details')
    // Reset sessions state when navigating to new book
    setSessions([])
    setSessionsStats({ times_read: 0, average_rating: null })
    setSessionsLoading(true)
    
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
        setSelectedPriority(bookData.tbr_priority || 'normal')
        // Pre-populate editor with existing note content
        if (notesData.length > 0) {
          const content = notesData[0].content || ''
          setNoteContent(content)
          setOriginalNoteContent(content)
        }
        // Fetch sessions after book loads
        fetchSessions()
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

  // Load backlinks (books that reference this book)
  useEffect(() => {
    if (!id) return
    
    let cancelled = false
    setBacklinksLoading(true)
    
    getBookBacklinks(id)
      .then(data => {
        if (!cancelled) {
          setBacklinks(data)
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('Failed to load backlinks:', err)
          setBacklinks([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBacklinksLoading(false)
        }
      })
    
    return () => {
      cancelled = true
    }
  }, [id])

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

  // Lock body scroll when notes editor is open
  useEffect(() => {
    if (isEditingNotes) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [isEditingNotes])

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

  const handlePriorityChange = async (newPriority) => {
    if (priorityLoading || newPriority === selectedPriority) return
    
    const previousPriority = selectedPriority
    setPriorityLoading(true)
    setPriorityStatus(null)
    
    // Optimistic update
    setSelectedPriority(newPriority)
    
    try {
      await updateTBR(id, { tbr_priority: newPriority })
      setBook(prev => ({ ...prev, tbr_priority: newPriority }))
      setPriorityStatus('saved')
      setTimeout(() => setPriorityStatus(null), 2000)
    } catch (err) {
      console.error('Failed to update priority:', err)
      // Revert on failure
      setSelectedPriority(previousPriority)
      setPriorityStatus('error')
      setTimeout(() => setPriorityStatus(null), 3000)
    } finally {
      setPriorityLoading(false)
    }
  }

  const handleReasonSave = async () => {
    setReasonLoading(true)
    try {
      await updateTBR(id, { tbr_reason: reasonDraft || null })
      setBook(prev => ({ ...prev, tbr_reason: reasonDraft || null }))
      setIsEditingReason(false)
    } catch (err) {
      console.error('Failed to update reason:', err)
    } finally {
      setReasonLoading(false)
    }
  }

  const handleAcquire = async () => {
    setAcquireLoading(true)
    try {
      await convertTBRToLibrary(id, { format: acquireFormat })
      // Refresh the book data - it's now in the library
      const updatedBook = await getBook(id)
      setBook(updatedBook)
      setShowAcquireModal(false)
      // Reset to library defaults
      setSelectedStatus(updatedBook.status || 'Unread')
    } catch (err) {
      console.error('Failed to acquire book:', err)
    } finally {
      setAcquireLoading(false)
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
  const isWishlist = book.acquisition_status === 'wishlist'
  
  // Helper functions for sessions
  const formatSessionDate = (dateStr) => {
    if (!dateStr) return null
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatSessionDateRange = (startDate, endDate) => {
    const start = formatSessionDate(startDate)
    const end = formatSessionDate(endDate)
    
    if (start && end) {
      // Check if same year to avoid repetition
      const startYear = startDate?.slice(0, 4)
      const endYear = endDate?.slice(0, 4)
      if (startYear === endYear) {
        // Same year: "Dec 20 – Dec 24, 2025"
        const startShort = new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return `${startShort} – ${end}`
      }
      return `${start} – ${end}`
    }
    if (start) return `Started ${start}`
    if (end) return `Finished ${end}`
    return null
  }
  
  const renderStars = (rating, maxStars = 5) => {
    if (rating === null || rating === undefined) return null
    const stars = []
    for (let i = 1; i <= maxStars; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-yellow-400' : 'text-gray-600'}>
          ★
        </span>
      )
    }
    return <span className="text-lg">{stars}</span>
  }

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

      {/* Wishlist Banner */}
      {isWishlist && (
        <div className="bg-gray-700/50 border border-gray-600 border-dashed rounded-lg px-4 py-2 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="text-gray-300 text-sm font-medium">WISHLIST</span>
          <span className="text-gray-500 text-sm">— You don't own this yet</span>
        </div>
      )}

      {/* Book Header - Horizontal on desktop, stacked on mobile */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Cover - larger on desktop */}
        <div className="w-28 md:w-48 shrink-0 mx-auto md:mx-0">
          <GradientCover
            title={book.title}
            author={primaryAuthor}
            coverGradient={book.cover_gradient}
            coverBgColor={book.cover_bg_color}
            coverTextColor={book.cover_text_color}
          />
        </div>
        
        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Edit button - positioned at top right */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setEditModalOpen(true)}
              className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-700 transition-colors"
              aria-label="Edit book details"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
          
          {/* Series badge */}
          {book.series && (
            <div className="text-gray-500 text-xs mb-1">
              {book.series} #{book.series_number || '?'}
            </div>
          )}
          
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
            {book.title}
          </h1>
          
          {/* Completion status */}
          {book.completion_status && book.completion_status !== 'Complete' && (
            <div className="text-gray-500 text-sm mb-1">
              {book.completion_status}
            </div>
          )}
          
          <p className="text-gray-400 mb-2">
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
          
          {/* Source URL */}
          {book.source_url && (
            <a
              href={book.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-library-accent hover:underline text-sm mb-2 block truncate"
            >
              {book.source_url.replace(/^https?:\/\//, '').split('/').slice(0, 2).join('/')}...
            </a>
          )}
          
          {/* Year and Read Time in a row on desktop */}
          <div className="flex flex-wrap items-center gap-4 mt-3">
            {book.publication_year && (
              <span className="text-gray-500 text-sm">
                {book.publication_year}
              </span>
            )}
            
            {/* Estimated Read Time (only for owned books) */}
            {!isWishlist && readTimeData && (
              <div className="bg-library-card rounded-lg px-3 py-2">
                <span className="text-lg font-semibold text-white">{readTimeData.display}</span>
                <span className="text-gray-400 text-sm ml-2">{readTimeData.microcopy}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation - only show on mobile for owned books */}
      {!isWishlist && (
        <div className="md:hidden mb-4">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'text-library-accent border-b-2 border-library-accent'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'notes'
                  ? 'text-library-accent border-b-2 border-library-accent'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-library-accent border-b-2 border-library-accent'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              History
            </button>
          </div>
        </div>
      )}

      {/* Reading Tracker Card OR TBR Card */}
      {/* On mobile: show in Details tab OR History tab. On desktop: always show */}
      <div className={`bg-library-card rounded-lg p-4 mb-6 ${!isWishlist && activeTab !== 'details' && activeTab !== 'history' ? 'hidden md:block' : ''}`}>
        {isWishlist ? (
          /* TBR UI */
          <div>
            <div className="flex flex-wrap gap-3 items-center mb-4">
              <span className="text-gray-400 text-sm">Priority:</span>
              
              {/* Priority Chip + Popup */}
              <div className="relative">
                <button
                  onClick={() => setPriorityPopupOpen(!priorityPopupOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-library-bg border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer"
                >
                  <span className={`text-sm ${
                    selectedPriority === 'high' ? 'text-amber-400' : 'text-gray-300'
                  }`}>
                    {selectedPriority === 'high' ? '⭐ High Priority' : 'Normal'}
                  </span>
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {priorityPopupOpen && (
                  <>
                    {/* Backdrop to close popup */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setPriorityPopupOpen(false)}
                    />
                    {/* Popup */}
                    <div className="absolute top-full left-0 mt-1 bg-library-bg border border-gray-600 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                      <button
                        onClick={() => {
                          handlePriorityChange('normal')
                          setPriorityPopupOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                          selectedPriority === 'normal' ? 'text-library-accent' : 'text-gray-300'
                        }`}
                      >
                        Normal
                      </button>
                      <button
                        onClick={() => {
                          handlePriorityChange('high')
                          setPriorityPopupOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                          selectedPriority === 'high' ? 'text-amber-400' : 'text-gray-300'
                        }`}
                      >
                        ⭐ High Priority
                      </button>
                    </div>
                  </>
                )}
                
                {priorityStatus === 'saved' && (
                  <span className="text-green-400 text-sm ml-1">✓</span>
                )}
                {priorityStatus === 'error' && (
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
            
            {/* TBR Reason */}
            {(book.tbr_reason || isEditingReason) && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Why this one?</span>
                  {!isEditingReason && (
                    <button
                      onClick={() => {
                        setReasonDraft(book.tbr_reason || '')
                        setIsEditingReason(true)
                      }}
                      className="text-library-accent text-sm hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {isEditingReason ? (
                  <div>
                    <textarea
                      value={reasonDraft}
                      onChange={(e) => setReasonDraft(e.target.value)}
                      placeholder="A friend recommended it, saw it on TikTok..."
                      rows={2}
                      className="w-full bg-library-bg border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-library-accent resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setIsEditingReason(false)}
                        className="text-gray-400 text-sm hover:text-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReasonSave}
                        disabled={reasonLoading}
                        className="text-library-accent text-sm hover:underline disabled:opacity-50"
                      >
                        {reasonLoading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-300 text-sm italic">"{book.tbr_reason}"</p>
                )}
              </div>
            )}
            
            {/* Add reason link if none exists */}
            {!book.tbr_reason && !isEditingReason && (
              <button
                onClick={() => {
                  setReasonDraft('')
                  setIsEditingReason(true)
                }}
                className="text-library-accent text-sm hover:underline mb-4 block"
              >
                + Add why you want to read this
              </button>
            )}
            
            {/* "I got this book" button */}
            <div className="pt-3 border-t border-gray-700">
              <button
                onClick={() => setShowAcquireModal(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              >
                I got this book!
              </button>
            </div>
          </div>
        ) : (
          /* Library Reading Tracker UI */
          <>
            {/* Status and Rating Controls - hide on mobile History tab */}
            <div className={`flex flex-wrap gap-3 items-center mb-4 ${activeTab === 'history' ? 'hidden md:flex' : ''}`}>
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
                    {getLabel(selectedStatus)}
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
                      {getStatusOptions().map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => {
                            handleStatusChange(value)
                            setStatusPopupOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                            selectedStatus === value ? 'text-library-accent' : 'text-gray-300'
                          }`}
                        >
                          {label}
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
            
            {/* Reading History Section */}
            <div className={`mt-4 pt-4 border-t border-gray-700 ${activeTab !== 'history' ? 'hidden md:block' : ''}`}>
              <div className="space-y-4">
                {/* Header with Add button */}
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                    Reading History
                  </h3>
                  <button
                    className="text-violet-400 hover:text-violet-300 text-sm font-medium"
                    onClick={openAddSession}
                  >
                    + Add Session
                  </button>
                </div>

                {/* Sessions List */}
                {sessionsLoading ? (
                  <div className="text-gray-500 text-sm">Loading sessions...</div>
                ) : sessions.length === 0 ? (
                  <div className="text-gray-500 text-sm">No reading sessions recorded</div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="bg-gray-800/50 rounded-lg p-4 relative"
                      >
                        {/* Edit button */}
                        <button
                          className="absolute top-3 right-3 text-gray-500 hover:text-gray-300"
                          onClick={() => openEditSession(session)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>

                        {/* Session number */}
                        <div className="font-semibold text-white mb-1">
                          Read #{session.session_number}
                        </div>

                        {/* Date range */}
                        {formatSessionDateRange(session.date_started, session.date_finished) && (
                          <div className="text-gray-400 text-sm mb-2">
                            {formatSessionDateRange(session.date_started, session.date_finished)}
                          </div>
                        )}

                        {/* Status and rating */}
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-medium ${
                            session.session_status === 'finished' ? 'text-green-400' :
                            session.session_status === 'dnf' ? 'text-pink-400' :
                            'text-gray-400'
                          }`}>
                            {getLabel(session.session_status)}
                          </span>
                          {session.rating && renderStars(session.rating)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stats Row */}
                {sessions.length > 0 && (
                  <div className="border-t border-gray-700 pt-4 mt-4">
                    <div className="flex justify-between text-sm">
                      <div>
                        <div className="text-gray-400">Times Read</div>
                        <div className="text-white font-semibold text-lg">{sessionsStats.times_read}</div>
                      </div>
                      {sessionsStats.average_rating && (
                        <div className="text-right">
                          <div className="text-gray-400">Average Rating</div>
                          <div className="text-white font-semibold text-lg flex items-center justify-end gap-1">
                            {sessionsStats.average_rating}
                            <span className="text-yellow-400">★</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* About This Book Card (hide for wishlist - no metadata yet) */}
      {/* On mobile: only show in Details tab. On desktop: always show */}
      {!isWishlist && (book.summary || (book.tags && book.tags.length > 0) || book.word_count) && (
        <div className={`bg-library-card rounded-lg p-4 mb-6 ${activeTab !== 'details' ? 'hidden md:block' : ''}`}>
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
      {/* On mobile: only show in Notes tab (or always for wishlist). On desktop: always show */}
      <div className={`bg-library-card rounded-lg p-4 mb-6 ${!isWishlist && activeTab !== 'notes' ? 'hidden md:block' : ''}`}>
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
        <div className="fixed inset-0 z-50 bg-library-bg flex flex-col overflow-hidden">
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
          <div className="flex-1 min-h-0 relative">
            <textarea
              ref={textareaRef}
              value={noteContent}
              onChange={handleNoteChange}
              placeholder="Write your notes here... (Type [[ to link to a book)"
              className="absolute inset-0 m-4 bg-transparent text-white focus:outline-none resize-none text-sm leading-relaxed"
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

      {/* Backlinks Section (hide for wishlist items) */}
      {/* On mobile: only show in Notes tab. On desktop: always show */}
      {!isWishlist && (backlinks.length > 0 || backlinksLoading) && (
        <div className={`bg-library-card rounded-lg p-4 mb-6 ${activeTab !== 'notes' ? 'hidden md:block' : ''}`}>
          <h2 className="text-sm font-medium text-gray-400 mb-3">
            Referenced by {!backlinksLoading && <span className="text-gray-500">({backlinks.length})</span>}
          </h2>
          
          {backlinksLoading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : (
            <ul className="space-y-2">
              {backlinks.map(book => (
                <li key={book.id}>
                  <Link
                    to={`/book/${book.id}`}
                    className="flex items-center gap-2 text-sm hover:bg-gray-800/50 -mx-2 px-2 py-1 rounded transition-colors"
                  >
                    <span className="text-library-accent">←</span>
                    <span className="text-white truncate">{book.title}</span>
                    <span className="text-gray-500 truncate text-xs">
                      {book.authors?.[0]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Series Section (hide for wishlist items) */}
      {/* On mobile: only show in Details tab. On desktop: always show */}
      {!isWishlist && book.series && (
        <div className={`bg-library-card rounded-lg overflow-hidden mb-6 ${activeTab !== 'details' ? 'hidden md:block' : ''}`}>
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

      {/* File Location (hide for wishlist items - no files yet) */}
      {/* On mobile: only show in Details tab. On desktop: always show */}
      {!isWishlist && book.folder_path && (
        <div className={`text-gray-500 text-xs ${activeTab !== 'details' ? 'hidden md:block' : ''}`}>
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
      
      {/* Acquire Book Modal (TBR → Library) */}
      {showAcquireModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-library-card rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-semibold text-white mb-2">🎉 You got it!</h2>
            <p className="text-gray-400 text-sm mb-4">
              Moving "{book.title}" to your library.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">What format?</label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // Navigate to upload page with linkTo param
                    navigate(`/add?mode=upload&linkTo=${book.id}`)
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  <div className="text-white font-medium">Ebook</div>
                  <div className="text-gray-400 text-sm">Upload your files now</div>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setAcquireLoading(true)
                    try {
                      await convertTBRToLibrary(id, { format: 'physical' })
                      const updatedBook = await getBook(id)
                      setBook(updatedBook)
                      setShowAcquireModal(false)
                      setSelectedStatus(updatedBook.status || 'Unread')
                    } catch (err) {
                      console.error('Failed to acquire book:', err)
                    } finally {
                      setAcquireLoading(false)
                    }
                  }}
                  disabled={acquireLoading}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  <div className="text-white font-medium">Physical book</div>
                  <div className="text-gray-400 text-sm">No files to upload</div>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setAcquireLoading(true)
                    try {
                      await convertTBRToLibrary(id, { format: 'audiobook' })
                      const updatedBook = await getBook(id)
                      setBook(updatedBook)
                      setShowAcquireModal(false)
                      setSelectedStatus(updatedBook.status || 'Unread')
                    } catch (err) {
                      console.error('Failed to acquire book:', err)
                    } finally {
                      setAcquireLoading(false)
                    }
                  }}
                  disabled={acquireLoading}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  <div className="text-white font-medium">Audiobook</div>
                  <div className="text-gray-400 text-sm">No files to upload</div>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setAcquireLoading(true)
                    try {
                      await convertTBRToLibrary(id, { format: 'web' })
                      const updatedBook = await getBook(id)
                      setBook(updatedBook)
                      setShowAcquireModal(false)
                      setSelectedStatus(updatedBook.status || 'Unread')
                    } catch (err) {
                      console.error('Failed to acquire book:', err)
                    } finally {
                      setAcquireLoading(false)
                    }
                  }}
                  disabled={acquireLoading}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  <div className="text-white font-medium">Web-based</div>
                  <div className="text-gray-400 text-sm">For read tracking only</div>
                </button>
              </div>
            </div>
            
            <button
              onClick={() => setShowAcquireModal(false)}
              className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-500 transition-colors mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Session Editor Modal */}
      {sessionModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
            {/* Close button */}
            <button
              onClick={closeSessionModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            <h2 className="text-xl font-semibold text-white mb-6">
              {editingSession ? `Edit Read #${editingSession.session_number}` : 'Add Reading Session'}
            </h2>

            {/* Error message */}
            {sessionError && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded mb-4">
                {sessionError}
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={sessionForm.date_started}
                  onChange={(e) => setSessionForm({ ...sessionForm, date_started: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={sessionForm.date_finished}
                  onChange={(e) => setSessionForm({ ...sessionForm, date_finished: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <div className="flex gap-2">
                  {['in_progress', 'finished', 'dnf'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setSessionForm({ ...sessionForm, session_status: status })}
                      className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                        sessionForm.session_status === status
                          ? status === 'finished'
                            ? 'bg-green-600 text-white'
                            : status === 'dnf'
                            ? 'bg-pink-600 text-white'
                            : 'bg-gray-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {getLabel(status)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Rating</label>
                <div className={`flex gap-1 ${sessionForm.session_status === 'in_progress' ? 'opacity-40' : ''}`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      disabled={sessionForm.session_status === 'in_progress'}
                      onClick={() => {
                        if (sessionForm.session_status !== 'in_progress') {
                          setSessionForm({
                            ...sessionForm,
                            rating: sessionForm.rating === star ? null : star
                          })
                        }
                      }}
                      className={`text-3xl transition-colors ${
                        sessionForm.session_status === 'in_progress'
                          ? 'cursor-not-allowed text-gray-600'
                          : sessionForm.rating && star <= sessionForm.rating
                          ? 'text-yellow-400 hover:text-yellow-300'
                          : 'text-gray-600 hover:text-gray-500'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {sessionForm.session_status === 'in_progress' && (
                  <p className="text-xs text-gray-500 mt-1">Rating available after marking Finished or DNF</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              {editingSession && (
                <button
                  onClick={handleDeleteSession}
                  disabled={sessionSaving}
                  className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={closeSessionModal}
                disabled={sessionSaving}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSession}
                disabled={sessionSaving}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded font-medium transition-colors disabled:opacity-50"
              >
                {sessionSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookDetail
