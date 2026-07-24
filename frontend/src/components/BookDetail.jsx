import { useState, useEffect, useRef, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { getBook, listBooks, getBookNotes, saveNote, updateBookCategory, getCategories, updateBookStatus, getSeriesDetail, getSettings, lookupBooksByTitles, getBookBacklinks, updateTBR, convertTBRToLibrary, getBookSessions, createSession, updateSession, deleteSession, createEdition, deleteEdition, replaceEditionFile, mergeTitles, deleteTitle, rescanBookMetadata, updateEnhancedMetadata, updateBookMetadata, getCollectionsForBook } from '../api'
import Button from './ui/Button'
import IconButton from './ui/IconButton'
import AcquireCard from './AcquireCard'
import GradientCover from './GradientCover'
import UnifiedEditModal from './UnifiedEditModal'
import ChangeCoverModal from './ChangeCoverModal'
import CollectionPicker from './CollectionPicker'
import BookLinkPopup from './BookLinkPopup'
import UnifiedNavBar from './ui/UnifiedNavBar'
import Toast from './ui/Toast'
import Modal from './ui/Modal'
import FormField from './ui/FormField'
import StarRating from './ui/StarRating'
import { getReadTimeData } from '../utils/readTime'
import ReactMarkdown from 'react-markdown'
import { useStatusLabels } from '../hooks/useStatusLabels'
import { useRatingLabels } from '../hooks/useRatingLabels'
import { EBOOK_FORMATS, FORMAT_CONFIG, formatLabel } from '../constants/formats'

// Decode HTML entities in text (e.g., &amp; -> &, &quot; -> ")
function decodeHtmlEntities(text) {
  if (!text) return text
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

// Bare filename of an edition's file (file_path is an absolute server path)
function editionFileName(edition) {
  const base = (edition?.file_path || '').split('/').pop()
  return base || `edition-${edition?.id}`
}

// Extension label for the edition picker (EPUB / PDF / MOBI ...)
function editionExtensionLabel(edition) {
  const name = editionFileName(edition)
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toUpperCase() : 'FILE'
}

// File-picker accept strings per storage format for Replace file; every
// other format's extension equals its name
const REPLACE_ACCEPT = { html: '.html,.htm' }

// Human-readable file size for the Files section (B/KB/MB, one decimal for MB)
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  // Branch on the rounded value so 1,048,500 B reads "1.0 MB", not "1024 KB"
  const kb = Math.round(bytes / 1024)
  if (kb < 1024) return `${kb} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const SESSION_STATUS_TO_BACKEND = {
  in_progress: 'In Progress',
  finished: 'Finished',
  dnf: 'Abandoned',
}

// Longest label (chars) that keeps the status toggle on one row of four.
// 11 admits every shipped default incl. "In Progress" (11); any custom
// label past it flips the whole control to 2×2 (ratified 2026-07-15).
const STATUS_LABEL_ONE_ROW_MAX = 11

// Active-state classes for the inline status toggle (B2) — reading teal,
// finished sage, unread/dnf neutral, all via status tokens
const STATUS_TOGGLE_ACTIVE = {
  Unread: 'bg-status-unread/20 border-status-unread text-text-primary',
  'In Progress': 'bg-status-reading/20 border-status-reading text-status-reading',
  Finished: 'bg-status-finished/20 border-status-finished text-status-finished',
  Abandoned: 'bg-status-dnf/20 border-status-dnf text-text-secondary',
}

// Helper component for displaying labeled metadata (Phase 7.0)
const MetadataRow = ({ label, children, show = true }) => {
  if (!show || !children) return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 mb-2">
      <span className="text-caption text-text-muted min-w-[80px]">{label}</span>
      <div className="text-body-sm text-text-secondary">{children}</div>
    </div>
  )
}

// Helper for displaying tag chips (Phase 7.0)
const TagChip = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-chip-default/20 text-text-secondary',
    rating: 'bg-action-danger/20 text-action-danger border border-action-danger/30',
    warning: 'bg-action-warning/20 text-action-warning border border-action-warning/30',
    ship: 'bg-chip-ship/20 text-chip-ship border border-chip-ship/30',
    fandom: 'bg-chip-fandom/20 text-chip-fandom border border-chip-fandom/30',
  }

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs ${variants[variant]}`}>
      {children}
    </span>
  )
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
    label: 'Notes While Reading',
    content: `## Notes While Reading

`
  },
  thoughts: {
    label: 'Thoughts After Reading',
    content: `## Thoughts After Reading

`
  }
}

// 3-Dot Menu Component (moved outside for stability)
const ThreeDotMenu = ({ 
  menuOpen, 
  setMenuOpen, 
  menuItems 
}) => {
  const menuRef = useRef(null)
  // The portaled mobile sheet lives outside menuRef's DOM subtree — without
  // this second containment check, a tap on any sheet item would count as
  // "outside" and close the menu on mousedown, before the item's click fires
  const sheetRef = useRef(null)

  // Close menu when clicking outside (desktop)
  useEffect(() => {
    if (!menuOpen) return

    const handleClickOutside = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        !(sheetRef.current && sheetRef.current.contains(e.target))
      ) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen, setMenuOpen])
  
  // Close menu on escape
  useEffect(() => {
    if (!menuOpen) return
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [menuOpen, setMenuOpen])
  
  // Filter out items that shouldn't show
  const visibleItems = menuItems.filter(item => item.show !== false)
  
  return (
    <div className="relative" ref={menuRef}>
      {/* 3-dot button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="text-text-secondary hover:text-text-primary p-1.5 rounded hover:bg-bg-elevated transition-colors"
        aria-label="More actions"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      
      {/* Desktop Dropdown */}
      {menuOpen && (
        <>
          {/* Desktop dropdown - hidden on mobile */}
          <div className="hidden md:block absolute right-0 top-full mt-1 w-56 bg-bg-surface border border-border-default rounded-lg shadow-xl z-50 py-1 overflow-hidden">
            {visibleItems.map((item, idx) => (
              item.type === 'divider' ? (
                <div key={idx} className="border-t border-border-default my-1" />
              ) : (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-bg-elevated transition-colors ${item.danger ? 'text-action-danger' : 'text-text-body'}`}
                >
                  {item.label}
                </button>
              )
            ))}
          </div>
          
          {/* Mobile Bottom Sheet — portaled to <body>: the sticky UnifiedNavBar
              wrapper (z-20) is a stacking context, so rendered in place the
              sheet's z-50 resolves inside it and paints under the z-40 bottom
              nav no matter how high its own z-index goes */}
          {createPortal(
          <div ref={sheetRef} className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-bg-overlay"
              onClick={() => setMenuOpen(false)}
            />
            
            {/* Sheet */}
            <div className="absolute bottom-0 left-0 right-0 bg-bg-surface rounded-t-2xl overflow-hidden">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-bg-elevated rounded-full" />
              </div>
              
              {/* Menu Items */}
              <div className="px-2 pb-2">
                {visibleItems.map((item, idx) => (
                  item.type === 'divider' ? (
                    <div key={idx} className="border-t border-border-default my-1 mx-2" />
                  ) : (
                    <button
                      key={idx}
                      onClick={item.onClick}
                      className={`w-full text-left px-4 py-3.5 text-base hover:bg-bg-elevated rounded-lg transition-colors ${item.danger ? 'text-action-danger' : 'text-text-body'}`}
                    >
                      {item.label}
                    </button>
                  )
                ))}
              </div>
              
              {/* Cancel Button */}
              <div className="px-2 pb-6 pt-2 border-t border-border-default">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full py-3.5 text-base font-medium text-text-secondary hover:bg-bg-elevated rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
          )}
        </>
      )}
    </div>
  )
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

  // Rating editing state
  const [selectedRating, setSelectedRating] = useState(null)

  // Rescan metadata state
  const [rescanning, setRescanning] = useState(false)
  
  // Unified edit modal state
  const [showUnifiedEditModal, setShowUnifiedEditModal] = useState(false)
  
  // Change cover modal state
  const [showCoverModal, setShowCoverModal] = useState(false)

  // Collections state
  const [bookCollections, setBookCollections] = useState([])
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)

  // Series data (for books in a series)
  const [seriesBooks, setSeriesBooks] = useState([])
  const [seriesLoading, setSeriesLoading] = useState(false)
  
  // 3-dot menu state
  const [menuOpen, setMenuOpen] = useState(false)

  // Toast notification state
  const [toast, setToast] = useState(null) // { message: string, type: 'success' | 'error' | 'loading' }
  const toastTimeoutRef = useRef(null)

  // Download & Share state (10.1)
  const [showDownloadSheet, setShowDownloadSheet] = useState(false)
  const [downloading, setDownloading] = useState(false)
  
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

  // Inline status toggle state (B2) — writes through the one-call
  // session-writing endpoint; the toggle renders the projection
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState(null)
  const [statusNote, setStatusNote] = useState(null) // snap-back microcopy
  const [showFinishedCapture, setShowFinishedCapture] = useState(false)
  const [finishDate, setFinishDate] = useState('')
  const [finishDateError, setFinishDateError] = useState(null)
  const [finishRating, setFinishRating] = useState(null)

  // Download-triggered "Start reading?" prompt (B2) — Unread only
  const [showStartPrompt, setShowStartPrompt] = useState(false)
  const [startPromptSaving, setStartPromptSaving] = useState(false)

  // Mobile tab state
  const [activeTab, setActiveTab] = useState('details')
  
  // Sessions state
  const [sessions, setSessions] = useState([])
  const [sessionsStats, setSessionsStats] = useState({ times_read: 0, average_rating: null })
  const [sessionsLoading, setSessionsLoading] = useState(false)
  
  // Session editor modal state
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState(null) // null = creating new, object = editing existing
  const [showSessionDeleteConfirm, setShowSessionDeleteConfirm] = useState(false)

  // Edition modal state (Phase 8.7b)
  const [editionModalOpen, setEditionModalOpen] = useState(false)
  const [editionForm, setEditionForm] = useState({ format: '', acquired_date: '' })
  const [editionSaving, setEditionSaving] = useState(false)
  const [editionError, setEditionError] = useState(null)
  
  // Edition delete state (Phase 8.7g)
  const [editionToDelete, setEditionToDelete] = useState(null)
  const [editionDeleting, setEditionDeleting] = useState(false)
  const [editionDeleteError, setEditionDeleteError] = useState(null)

  // Replace file state (D3(i-R), v0.70.0) — inline confirm per S10;
  // errors render at the point of action (v0.63.0)
  const [replaceTarget, setReplaceTarget] = useState(null) // { edition, label }
  const [replacing, setReplacing] = useState(false)
  const [replaceError, setReplaceError] = useState(null)
  const replaceFileInputRef = useRef(null)

  const handleReplaceFileChosen = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !replaceTarget) return
    setReplacing(true)
    setReplaceError(null)
    try {
      const res = await replaceEditionFile(replaceTarget.edition.id, file)
      setBook(prev => ({
        ...prev,
        editions: (prev.editions || []).map(ed =>
          ed.id === res.edition.id
            ? { ...ed, file_path: res.edition.file_path, file_size: res.edition.file_size }
            : ed
        ),
      }))
      setReplaceTarget(null)
      showToast('File replaced', 'success')
    } catch (err) {
      setReplaceError(err.message || "Couldn't replace the file. Try again?")
    } finally {
      setReplacing(false)
    }
  }

  // Merge modal state (Phase 8.7d)
  const [mergeModalOpen, setMergeModalOpen] = useState(false)
  const [mergeStep, setMergeStep] = useState('search') // 'search' | 'confirm'
  const [mergeSearch, setMergeSearch] = useState('')
  const [mergeResults, setMergeResults] = useState([])
  const [mergeSearching, setMergeSearching] = useState(false)
  const [mergeTarget, setMergeTarget] = useState(null) // The book we're merging INTO
  const [mergeSaving, setMergeSaving] = useState(false)
  const [mergeError, setMergeError] = useState(null)

  // Delete title modal state (Batch 2 S1 — files move to _trash, DB rows cascade)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState(1) // 1 = consequences, 2 = final confirm
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  
  const [sessionForm, setSessionForm] = useState({
    date_started: '',
    date_finished: '',
    session_status: 'in_progress',
    rating: null,
    format: ''
  })
  const [sessionSaving, setSessionSaving] = useState(false)
  const [sessionError, setSessionError] = useState(null)

  // Custom status labels
  const { getLabel, getStatusOptions } = useStatusLabels()
  const { getLabel: getRatingLabel } = useRatingLabels()

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

  // Cleanup toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  // Download sheet: Escape closes, body scroll locks (mirrors Modal behavior)
  useEffect(() => {
    if (!showDownloadSheet) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowDownloadSheet(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [showDownloadSheet])

  // Load collections this book belongs to
  useEffect(() => {
    if (!book?.id) return
    
    let cancelled = false
    setBookCollections([]) // Reset on navigation
    setCollectionsLoading(true)
    
    const loadCollections = async () => {
      try {
        const collections = await getCollectionsForBook(book.id)
        if (!cancelled) {
          setBookCollections(collections)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load collections:', err)
        }
      } finally {
        if (!cancelled) {
          setCollectionsLoading(false)
        }
      }
    }
    
    loadCollections()
    
    return () => {
      cancelled = true
    }
  }, [book?.id])

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
      date_started: new Date().toISOString().split('T')[0],
      date_finished: '',
      session_status: 'in_progress',
      rating: null,
      format: 'ebook'
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
      rating: session.rating,
      format: session.format || ''
    })
    setSessionError(null)
    setSessionModalOpen(true)
  }

  const closeSessionModal = () => {
    setSessionModalOpen(false)
    setShowSessionDeleteConfirm(false)
    setEditingSession(null)
    setSessionError(null)
  }

  // Get the most recent reading session for status card subtitle
  const getMostRecentSession = () => {
    if (!sessions || sessions.length === 0) return null
    
    // Sort by date_finished or date_started descending
    const sorted = [...sessions].sort((a, b) => {
      const dateA = new Date(a.date_finished || a.date_started || 0)
      const dateB = new Date(b.date_finished || b.date_started || 0)
      return dateB - dateA
    })
    
    return sorted[0]
  }

  // Normalize status from backend (may be capitalized) to lowercase for component
  const normalizeStatus = (status) => {
    if (!status) return 'unread'
    // Convert to lowercase and replace spaces with underscores
    const normalized = status.toLowerCase().replace(/\s+/g, '_')
    // Map any variations
    if (normalized === 'not_prioritized') return 'unread'
    // DB stores 'Abandoned'; the component vocabulary is 'dnf'
    if (normalized === 'abandoned') return 'dnf'
    // Handle "in progress" → "in_progress"
    return normalized
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
        data.format = sessionForm.format
      } else {
        // For new sessions, only include if set
        if (sessionForm.date_started) data.date_started = sessionForm.date_started
        if (sessionForm.date_finished) data.date_finished = sessionForm.date_finished
        if (sessionForm.format) data.format = sessionForm.format
      }
      
      if (editingSession) {
        await updateSession(editingSession.id, data)
      } else {
        await createSession(id, data)
      }
      
      closeSessionModal()
      await fetchSessions() // Refresh the list
      // Also refresh book data to get updated cached status/rating
      const bookData = await getBook(id)
      setBook(bookData)
      setSelectedStatus(bookData.status || 'Unread')
      setSelectedRating(bookData.rating ?? null)
    } catch (err) {
      setSessionError(err.message)
    } finally {
      setSessionSaving(false)
    }
  }
  
  const handleDeleteSession = () => {
    if (!editingSession) return
    setSessionError(null)
    setShowSessionDeleteConfirm(true)
  }

  const handleConfirmDeleteSession = async () => {
    if (!editingSession) return
    setSessionSaving(true)
    setSessionError(null)
    try {
      await deleteSession(editingSession.id)
      closeSessionModal()
      await fetchSessions()
      // Refresh book data to get updated cached status/rating
      const bookData = await getBook(id)
      setBook(bookData)
      setSelectedStatus(bookData.status || 'Unread')
      setSelectedRating(bookData.rating ?? null)
    } catch (err) {
      setSessionError(err.message)
      setShowSessionDeleteConfirm(false) // return to form so user sees the error banner
    } finally {
      setSessionSaving(false)
    }
  }
  
  // Edition handlers (Phase 8.7b)
  const openAddEdition = () => {
    setEditionForm({ format: '', acquired_date: '' })
    setEditionError(null)
    setEditionModalOpen(true)
  }
  
  const handleSaveEdition = async () => {
    if (!editionForm.format) {
      setEditionError('Please select a format')
      return
    }
    
    setEditionSaving(true)
    setEditionError(null)
    
    try {
      const data = { format: editionForm.format }
      if (editionForm.acquired_date) {
        data.acquired_date = editionForm.acquired_date
      }
      
      await createEdition(book.id, data)
      
      // Refresh book data to show new edition (before closing modal)
      const updatedBook = await getBook(id)
      setBook(updatedBook)
      
      // Only close modal after everything succeeds
      setEditionModalOpen(false)
    } catch (err) {
      console.error('Failed to add edition:', err)
      setEditionError(err.message || 'Failed to add edition')
    } finally {
      setEditionSaving(false)
    }
  }
  
  // Edition delete handler (Phase 8.7g)
  const handleDeleteEdition = async () => {
    if (!editionToDelete) return
    
    setEditionDeleting(true)
    setEditionDeleteError(null)
    try {
      await deleteEdition(editionToDelete.id)

      // Refresh book data
      const updatedBook = await getBook(id)
      setBook(updatedBook)

      setEditionToDelete(null)
    } catch (err) {
      console.error('Failed to delete edition:', err)
      setEditionDeleteError(err.message || "Couldn't remove this edition. Try again?")
    } finally {
      setEditionDeleting(false)
    }
  }

  // Merge handlers (Phase 8.7d)
  const openMergeModal = () => {
    setMergeStep('search')
    setMergeSearch('')
    setMergeResults([])
    setMergeTarget(null)
    setMergeError(null)
    setMergeModalOpen(true)
  }
  
  const handleMergeSearch = async (query) => {
    setMergeSearch(query)
    if (query.length < 2) {
      setMergeResults([])
      return
    }
    
    setMergeSearching(true)
    try {
      const data = await listBooks({ search: query, limit: 10 })
      // Filter out the current book
      const filtered = (data.books || []).filter(b => b.id !== book.id)
      setMergeResults(filtered)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setMergeSearching(false)
    }
  }
  
  const selectMergeTarget = (target) => {
    setMergeTarget(target)
    setMergeStep('confirm')
  }
  
  const handleMerge = async () => {
    if (!mergeTarget) return
    
    setMergeSaving(true)
    setMergeError(null)
    
    try {
      await mergeTitles(mergeTarget.id, book.id)
      
      // Close modal before navigating
      setMergeModalOpen(false)
      
      // Navigate to the target book (since current book no longer exists)
      navigate(`/book/${mergeTarget.id}`)
    } catch (err) {
      console.error('Merge failed:', err)
      setMergeError(err.message || 'Failed to merge titles')
    } finally {
      setMergeSaving(false)
    }
  }

  const openDeleteModal = () => {
    setDeleteStep(1)
    setDeleteError(null)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    setDeleteSaving(true)
    setDeleteError(null)

    try {
      await deleteTitle(book.id)

      // Close modal before navigating (the title no longer exists)
      setDeleteModalOpen(false)
      navigate(returnUrl)
    } catch (err) {
      // A failed move never deletes the DB rows — surface and allow retry
      console.error('Delete failed:', err)
      const message = err.message || "Couldn't delete this title. Try again?"
      setDeleteError(message)
      showToast(message, 'error')
    } finally {
      setDeleteSaving(false)
    }
  }

  // Load book and notes (essential for page)
  useEffect(() => {
    setLoading(true)
    setError(null)
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
        setSelectedRating(bookData.rating ?? null)
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

  // Toggle tap → B1 one-call endpoint → refetch → pill and toggle both
  // render the PROJECTION, never the tapped value (snap-back, 2026-07-15)
  const applyStatus = async (backendStatus, extras = {}) => {
    if (!book || !id) return false
    setStatusSaving(true)
    setStatusError(null)
    setStatusNote(null)
    try {
      const result = await updateBookStatus(id, backendStatus, extras)
      if (backendStatus === 'Unread' && result.read_status === 'Finished') {
        setStatusNote(`Reading history kept — this title stays ${getLabel('Finished')}. To fully reset it, delete its past reads in History.`)
      } else if (backendStatus === 'Unread' && result.read_status === 'Abandoned') {
        setStatusNote(`Set-aside record kept — this title stays ${getLabel('Abandoned')}. To fully reset it, delete that record in History.`)
      }
      const bookData = await getBook(id)
      setBook(bookData)
      setSelectedStatus(bookData.status || 'Unread')
      setSelectedRating(bookData.rating ?? null)
      await fetchSessions()
      setShowFinishedCapture(false)
      return true
    } catch (err) {
      setStatusError(err.message || "Couldn't update the status. Try again?")
      return false
    } finally {
      setStatusSaving(false)
    }
  }

  const handleToggleTap = (value) => {
    if (statusSaving) return
    setStatusError(null)
    setStatusNote(null)
    if (value === 'Finished') {
      if (selectedStatus === 'Finished') return
      setFinishDate(new Date().toISOString().split('T')[0])
      setFinishRating(null)
      setFinishDateError(null)
      setShowFinishedCapture(true)
      return
    }
    setShowFinishedCapture(false)
    if (value === selectedStatus) return
    applyStatus(value)
  }

  const handleFinishedConfirm = () => {
    if (!finishDate) {
      setFinishDateError('Pick a date to mark this as finished')
      return
    }
    setFinishDateError(null)
    applyStatus('Finished', { dateFinished: finishDate, rating: finishRating })
  }

  // Accept on the download-triggered prompt → open In Progress session
  // dated today with the downloaded format (coarse domain: 'ebook')
  const handleStartReadingAccept = async () => {
    if (!book || !id || startPromptSaving) return
    setStartPromptSaving(true)
    setStatusError(null)
    try {
      await createSession(id, {
        date_started: new Date().toISOString().split('T')[0],
        session_status: 'in_progress',
        format: 'ebook',
      })
      const bookData = await getBook(id)
      setBook(bookData)
      setSelectedStatus(bookData.status || 'Unread')
      setSelectedRating(bookData.rating ?? null)
      await fetchSessions()
      setShowStartPrompt(false)
    } catch (err) {
      setStatusError(err.message || "Couldn't start the session. Try again?")
    } finally {
      setStartPromptSaving(false)
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

  // Toast notification helper
  const showToast = (message, type = 'success', duration = 3000) => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = null
    }
    
    setToast({ message, type })
    
    if (type !== 'loading') {
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null)
        toastTimeoutRef.current = null
      }, duration)
    }
  }

  const handleRescanMetadata = async () => {
    if (rescanning || !book?.id) return
    
    setRescanning(true)
    showToast('Rescanning metadata...', 'loading')
    
    try {
      const result = await rescanBookMetadata(book.id)
      
      // Refresh book data to get updated metadata
      const updatedBook = await getBook(book.id)
      if (updatedBook) {
        setBook(updatedBook)
      }
      
      showToast(result.message || 'Metadata updated', 'success')
    } catch (err) {
      console.error('Rescan failed:', err)
      showToast(err.message || 'Failed to rescan metadata', 'error')
    } finally {
      setRescanning(false)
    }
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

  // Get returnUrl from state, default to Library (defined early for use in error state)
  const returnUrl = location.state?.returnUrl || '/'

  // Determine back label based on returnUrl
  const getBackLabel = () => {
    if (returnUrl.startsWith('/collections')) return 'Collections'
    if (returnUrl.startsWith('/series')) return 'Series'
    if (returnUrl.includes('view=series')) return 'Series'
    if (returnUrl.startsWith('/author')) return 'Authors'
    if (returnUrl.startsWith('/sync-results')) return 'Sync results'
    return 'Library'
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse-slow text-4xl mb-4">📖</div>
        <p className="text-text-secondary">Loading book...</p>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-action-danger">{error || 'Book not found'}</p>
        <Link 
          to={returnUrl} 
          className="text-action-primary mt-4 inline-block"
        >
          ← {getBackLabel()}
        </Link>
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
            className="text-action-primary hover:underline"
          >
            {part.title}
          </Link>
        )
      } else {
        // Book not found - render as gray text
        return (
          <span key={key} className="text-text-secondary">
            {part.title}
          </span>
        )
      }
    })
  }

  const primaryAuthor = book.authors?.[0] || 'Unknown Author'
  const readTimeData = getReadTimeData(book.word_count, wpm)
  const isWishlist = book.acquisition_status === 'wishlist'

  // Download & Share (10.1) — never touches reading status or sessions
  const downloadableEditions = (book.editions || []).filter(
    (e) => EBOOK_FORMATS.includes(e.format) && e.file_path
  )

  // Toggle grid is content-driven from the known labels — no DOM
  // measurement: one row of four unless any label exceeds the max
  const statusToggleOptions = getStatusOptions()
  const statusToggleTwoUp = statusToggleOptions.some(
    (o) => (o.label || '').length > STATUS_LABEL_ONE_ROW_MAX
  )

  // After a download initiates AND the projection is Unread, offer the
  // inline "Start reading?" prompt. Never renders for other statuses.
  const maybeOfferStartReading = () => {
    if (normalizeStatus(book.status) === 'unread') setShowStartPrompt(true)
  }

  const handleDownloadEdition = async (edition) => {
    if (downloading) return
    setShowDownloadSheet(false)
    setDownloading(true)
    const url = `/api/editions/${edition.id}/download`
    const filename = editionFileName(edition)
    showToast('Preparing…', 'loading')
    try {
      // Fetch first on every path — a bare anchor navigation to a stale
      // path either fails silently or saves the JSON error body as a
      // file, so the backend's 404 detail has to be read before saving
      const response = await fetch(url)
      if (!response.ok) {
        let message = "Couldn't download the file. Try again?"
        try {
          const data = await response.json()
          if (typeof data.detail === 'string') message = data.detail
        } catch {
          // non-JSON error body — keep the generic message
        }
        throw new Error(message)
      }
      const blob = await response.blob()
      if (navigator.canShare) {
        const file = new File([blob], filename, { type: blob.type })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file] })
          showToast('Shared', 'success')
          maybeOfferStartReading()
          return
        }
      }
      // No file sharing — save the fetched blob
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
      showToast('Download started', 'success')
      maybeOfferStartReading()
    } catch (err) {
      if (err.name === 'AbortError') {
        // User closed the share sheet — clear the loading toast, no error
        setToast(null)
      } else {
        showToast(err.message || "Couldn't download the file. Try again?", 'error')
      }
    } finally {
      setDownloading(false)
    }
  }

  const handleDownloadClick = () => {
    if (downloadableEditions.length === 1) {
      handleDownloadEdition(downloadableEditions[0])
    } else if (downloadableEditions.length > 1) {
      setShowDownloadSheet(true)
    }
  }
  
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
        // Same year: "Read Dec 20 – Dec 24, 2025"
        const startShort = new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return `Read ${startShort} – ${end}`
      }
      return `Read ${start} – ${end}`
    }
    if (start) return `Started ${start}`
    if (end) return `Finished ${end}`
    return null
  }

  // Compact session row for Reading History
  const CompactSessionRow = ({ session, onEdit }) => (
    <div className="bg-bg-surface/60 rounded-lg px-4 py-3 flex justify-between items-center gap-3 border border-border-default">
      {/* Session info */}
      <div className="flex-1 min-w-0">
        {/* Date line - primary element */}
        {formatSessionDateRange(session.date_started, session.date_finished) && (
          <div className="text-body-sm text-text-secondary mb-1">
            {formatSessionDateRange(session.date_started, session.date_finished)}
          </div>
        )}
        
        {/* Status badge + rating inline */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
            session.session_status === 'finished' 
              ? 'bg-action-success/20 text-action-success' 
              : session.session_status === 'dnf'
              ? 'bg-chip-ship/20 text-chip-ship'
              : 'bg-action-primary/20 text-action-primary'
          }`}>
            {session.session_status === 'finished' ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            ) : session.session_status === 'in_progress' ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
              </svg>
            ) : null}
            {getLabel(SESSION_STATUS_TO_BACKEND[session.session_status] || session.session_status)}
          </span>
          {session.rating && (
            <StarRating value={session.rating} readOnly size="sm" />
          )}
        </div>
      </div>
      
      {/* Edit button */}
      <IconButton
        size="sm"
        className="flex-shrink-0"
        aria-label="Edit session"
        onClick={() => onEdit(session)}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </IconButton>
    </div>
  )

  // Menu items for 3-dot menu — page-level actions only (B3, v0.61.0);
  // add-session lives in Reading History, collections in its section
  const menuItems = [
    { label: 'Edit', onClick: () => { setShowUnifiedEditModal(true); setMenuOpen(false) } },
    { label: 'Change Cover', onClick: () => { setShowCoverModal(true); setMenuOpen(false) } },
    { type: 'divider' },
    { label: 'Merge', onClick: () => { openMergeModal(); setMenuOpen(false) } },
    { label: 'Rescan Metadata', onClick: () => { handleRescanMetadata(); setMenuOpen(false) }, show: !isWishlist && !!book?.folder_path },
    { type: 'divider' },
    { label: 'Delete Title', onClick: () => { openDeleteModal(); setMenuOpen(false) }, danger: true },
  ]

  // Remove Format modal facts — the trash sentence must match what the
  // backend actually does: stale paths (file_size null) and files another
  // of this title's editions still references are never moved (B3, v0.61.0)
  const editionFileOnDisk = !!editionToDelete?.file_path && editionToDelete.file_size != null
  const editionFileShared = editionFileOnDisk &&
    (book?.editions || []).some(e => e.id !== editionToDelete.id && e.file_path === editionToDelete.file_path)

  // Delete Title modal facts — counts stated in step 1
  const deleteFileCount = book?.editions?.filter(e => e.file_path).length || 0
  const deleteReadCount = sessions.length
  const deleteNoteCount = notes.length
  const deleteRemovedParts = [
    deleteReadCount > 0 && `${deleteReadCount} ${deleteReadCount === 1 ? 'read' : 'reads'} of reading history`,
    deleteNoteCount > 0 && `${deleteNoteCount} ${deleteNoteCount === 1 ? 'note' : 'notes'}`,
  ].filter(Boolean)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Sticky nav bar */}
      <UnifiedNavBar backLabel={getBackLabel()} backTo={returnUrl}>
        <ThreeDotMenu 
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          menuItems={menuItems}
        />
      </UnifiedNavBar>

      <div className="px-4 md:px-8">
      {/* Wishlist Banner */}
      {isWishlist && (
        <div className="bg-bg-elevated/50 border border-border-default border-dashed rounded-lg px-4 py-2 mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="text-label text-text-body">WISHLIST</span>
          <span className="text-text-secondary text-sm">— You don't own this yet</span>
        </div>
      )}

      {/* Book Header - Horizontal on desktop, stacked on mobile */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Cover - larger on desktop */}
        <div className="w-48 md:w-48 shrink-0 mx-auto md:mx-0">
          <GradientCover
            book={{
              id: book.id,
              title: book.title,
              author: primaryAuthor,
              // Cover image fields (Phase 9C)
              has_cover: book.has_cover || false,
              cover_path: book.cover_path || null,
              cover_source: book.cover_source || null,
              // Gradient fallback fields
              cover_gradient: book.cover_gradient,  // PRIMARY: calm HSL gradients
              cover_color_1: book.cover_color_1,    // FALLBACK only
              cover_color_2: book.cover_color_2,
            }}
            size="lg"
          />
        </div>
        
        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Series line - clickable link to series page */}
          {book.series && (
            <Link 
              to={`/series/${encodeURIComponent(book.series)}`}
              className="text-action-primary hover:underline text-sm mb-1 text-center md:text-left block transition-colors"
            >
              {book.series} #{book.series_number || '?'}
            </Link>
          )}
          
          <h1 className="text-h2 text-text-primary mb-1 text-center md:text-left">
            {book.title}
          </h1>
          
          {/* Completion status */}
          {book.completion_status && book.completion_status !== 'Complete' && (
            <div className="text-text-secondary text-sm mb-1 text-center md:text-left">
              {book.completion_status}
            </div>
          )}
          
          <p className="text-text-secondary mb-3 flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span>By{' '}
              {book.authors?.length > 0 ? (
                book.authors.map((author, index) => (
                  <span key={`${author}-${index}`}>
                    <Link
                      to={`/author/${encodeURIComponent(author)}`}
                      className="text-action-primary hover:underline transition-colors"
                    >
                      {author}
                    </Link>
                    {index < book.authors.length - 1 && ', '}
                  </span>
                ))
              ) : (
                'Unknown Author'
              )}
            </span>
            {book.publication_year && (
              <>
                <span className="text-text-muted">•</span>
                <span className="text-text-secondary">{book.publication_year}</span>
              </>
            )}
          </p>
          
          {/* Metadata Pill Boxes - only for owned books */}
          {!isWishlist && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
              {/* Read Time */}
              {readTimeData && (
                <div className="px-3 py-2 text-center">
                  <div className="text-h4 text-text-primary">{readTimeData.display}</div>
                  <div className="text-caption text-text-muted">{readTimeData.microcopy}</div>
                </div>
              )}
              
              {/* Status — display only; the toggle below Download is the
                  interactive surface (B2, ratified 2026-07-15) */}
              <div className="bg-bg-surface rounded-lg px-3 py-2 text-center border border-border-default">
                <div className="text-h4 text-text-primary">{getLabel(selectedStatus)}</div>
                <div className="text-caption text-text-muted">status</div>
              </div>
              
              {/* Rating — opens session editor (ratings live on reading sessions) */}
              <button
                type="button"
                onClick={() => {
                  const session = getMostRecentSession()
                  if (session) {
                    openEditSession(session)
                  } else {
                    openAddSession()
                  }
                }}
                className="bg-bg-surface rounded-lg px-3 py-2 text-center hover:bg-bg-elevated transition-colors border border-border-default"
              >
                <StarRating value={sessionsStats.average_rating || 0} readOnly size="sm" className="justify-center" />
                <div className="text-caption text-text-muted">
                  {sessionsStats.average_rating > 0 
                    ? getRatingLabel(sessionsStats.average_rating)
                    : 'no rating'}
                </div>
              </button>
              
              {/* Category — opens edit modal */}
              <button
                type="button"
                onClick={() => setShowUnifiedEditModal(true)}
                className="bg-bg-surface rounded-lg px-3 py-2 text-center hover:bg-bg-elevated transition-colors border border-border-default"
              >
                <div className="text-h4 text-text-primary">{selectedCategory || 'Uncategorized'}</div>
                <div className="text-caption text-text-muted">category</div>
              </button>
            </div>
          )}
          
          {/* Edition Format Badges - show which formats user owns */}
          {!isWishlist && (
            <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
              {book.editions?.map((edition) => {
                const config = FORMAT_CONFIG[edition.format] || { label: edition.format, color: 'bg-bg-elevated text-text-secondary border-border-default' }

                return (
                  <span
                    key={edition.id}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
                    title={edition.file_path || edition.folder_path || `${config.label} edition`}
                  >
                    {config.label}
                  </span>
                )
              })}
            </div>
          )}
          
          {/* Source URL - full display below pills (only for owned books with source) */}
          {!isWishlist && book.source_url && (
            <a
              href={book.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-action-primary hover:underline text-sm mt-3 block truncate"
            >
              {book.source_url.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </div>

      {isWishlist && (
        <div className="py-3">
          <AcquireCard
            status="unread"
            subtitle={book.tbr_priority ? `${book.tbr_priority.charAt(0).toUpperCase() + book.tbr_priority.slice(1)} priority` : null}
            isWishlist
            onAcquire={() => setShowAcquireModal(true)}
          />
        </div>
      )}

      {/* Mobile Tab Navigation - only show on mobile for owned books */}
      {!isWishlist && (
        <div className="md:hidden mb-4">
          <div className="flex border-b border-border-default">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'text-action-primary border-b-2 border-action-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'notes'
                  ? 'text-action-primary border-b-2 border-action-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'text-action-primary border-b-2 border-action-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              History
            </button>
          </div>
        </div>
      )}

      {/* TBR Card (Wishlist) OR Reading History (Mobile only for Library books) */}
      {/* On mobile: show in Details tab OR History tab. On desktop: only show for Wishlist */}
      <div className={`${
  isWishlist 
    ? 'bg-bg-surface border border-border-default rounded-lg p-4 mb-6' 
    : (activeTab === 'details' || activeTab === 'history') 
      ? 'border-t border-border-default pt-4 mt-4 md:hidden'
      : 'hidden'
}`}>
        {isWishlist ? (
          /* TBR UI */
          <div>
            <div className="flex flex-wrap gap-3 items-center mb-4">
              <span className="text-label text-text-body">Priority:</span>
              
              {/* Priority Chip + Popup */}
              <div className="relative">
                <button
                  onClick={() => setPriorityPopupOpen(!priorityPopupOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-base border border-border-default hover:border-text-muted transition-colors cursor-pointer"
                >
                  <span className={`text-sm ${
                    selectedPriority === 'high' ? 'text-action-warning' : 'text-text-body'
                  }`}>
                    {selectedPriority === 'high' ? '⭐ High Priority' : 'Normal'}
                  </span>
                  <svg className="w-3 h-3 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <div className="absolute top-full left-0 mt-1 bg-bg-base border border-border-default rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                      <button
                        onClick={() => {
                          handlePriorityChange('normal')
                          setPriorityPopupOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-bg-elevated transition-colors ${
                          selectedPriority === 'normal' ? 'text-action-primary' : 'text-text-body'
                        }`}
                      >
                        Normal
                      </button>
                      <button
                        onClick={() => {
                          handlePriorityChange('high')
                          setPriorityPopupOpen(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-bg-elevated transition-colors ${
                          selectedPriority === 'high' ? 'text-action-warning' : 'text-text-body'
                        }`}
                      >
                        ⭐ High Priority
                      </button>
                    </div>
                  </>
                )}
                
                {priorityStatus === 'saved' && (
                  <span className="text-action-success text-sm ml-1">✓</span>
                )}
                {priorityStatus === 'error' && (
                  <span className="text-action-danger text-sm ml-1">!</span>
                )}
              </div>
              
              {/* Category - Read Only Chip */}
              {selectedCategory && (
                <span className="px-3 py-1.5 rounded-full bg-bg-base border border-border-default text-sm text-text-body">
                  {selectedCategory}
                </span>
              )}
            </div>
            
            {/* TBR Reason */}
            {(book.tbr_reason || isEditingReason) && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-label text-text-body">Why this one?</span>
                  {!isEditingReason && (
                    <IconButton
                      type="button"
                      size="sm"
                      style={{ color: '#5c5752' }}
                      title="Edit"
                      aria-label="Edit reason"
                      onClick={() => {
                        setReasonDraft(book.tbr_reason || '')
                        setIsEditingReason(true)
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                        <path d="m15 5 4 4"/>
                      </svg>
                    </IconButton>
                  )}
                </div>
                {isEditingReason ? (
                  <div>
                    <textarea
                      value={reasonDraft}
                      onChange={(e) => setReasonDraft(e.target.value)}
                      placeholder="A friend recommended it, saw it on TikTok..."
                      rows={2}
                      className="w-full bg-bg-base border border-border-default rounded-lg px-3 py-2 text-sm text-text-body placeholder:text-text-muted focus:outline-none focus:border-border-focus resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingReason(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleReasonSave}
                        disabled={reasonLoading}
                        loading={reasonLoading}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-body-sm text-text-secondary italic">"{book.tbr_reason}"</p>
                )}
              </div>
            )}
            
            {/* Add reason link if none exists */}
            {!book.tbr_reason && !isEditingReason && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-4"
                onClick={() => {
                  setReasonDraft('')
                  setIsEditingReason(true)
                }}
              >
                + Add a reason why
              </Button>
            )}
            
          </div>
        ) : (
          /* Library Reading Tracker UI - Reading History Only */
          <>
            {/* Reading History Section */}
            <div className={`mt-4 pt-4 border-t border-border-default ${activeTab !== 'history' ? 'hidden md:block' : ''}`}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 id="reading-history" className="text-label text-text-body uppercase tracking-wide">
                    Reading History
                  </h3>
                  <IconButton
                    type="button"
                    size="sm"
                    style={{ color: '#5c5752' }}
                    onClick={() => openAddSession()}
                    title="Add reading session"
                    aria-label="Add reading session"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M12 5v14"/>
                      <path d="M5 12h14"/>
                    </svg>
                  </IconButton>
                </div>

                {/* Sessions List */}
                {sessionsLoading ? (
                  <div className="text-text-secondary text-sm">Loading sessions...</div>
                ) : sessions.length === 0 ? (
                  <div className="text-text-secondary text-sm">No reading sessions recorded</div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <CompactSessionRow 
                        key={session.id} 
                        session={session} 
                        onEdit={openEditSession} 
                      />
                    ))}
                  </div>
                )}

                {/* Stats Row */}
                {sessions.length > 0 && (
                  <div className="border-t border-border-default pt-4 mt-4">
                    <div className="flex justify-between text-sm">
                      <div>
                        <div className="text-text-secondary">Times Read</div>
                        <div className="text-h4 text-text-primary">{sessionsStats.times_read}</div>
                      </div>
                      {sessionsStats.average_rating && (
                        <div className="text-right">
                          <div className="text-text-secondary">Average Rating</div>
                          <div className="text-h4 text-text-primary flex items-center justify-end gap-1">
                            {sessionsStats.average_rating}
                            <span className="text-action-warning">★</span>
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

      {/* Reading status — inline segmented toggle (B2, v0.60.0) */}
      {!isWishlist && (
        <div className={`px-4 py-3 ${activeTab !== 'details' ? 'hidden md:block' : ''}`}>
          {downloadableEditions.length >= 1 && (
            <Button
              variant="primary"
              className="w-full mb-3"
              loading={downloading}
              onClick={handleDownloadClick}
            >
              Download
            </Button>
          )}

          {/* Download-triggered transition — Unread only, dashed card */}
          {showStartPrompt && normalizeStatus(book.status) === 'unread' && (
            <div className="border border-dashed border-border-focus rounded-lg p-3 mb-3">
              <p className="text-body-sm text-text-body mb-3">Start reading this now?</p>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  loading={startPromptSaving}
                  onClick={handleStartReadingAccept}
                >
                  Start reading
                </Button>
                <Button
                  variant="ghost"
                  disabled={startPromptSaving}
                  onClick={() => setShowStartPrompt(false)}
                >
                  Not yet
                </Button>
              </div>
            </div>
          )}

          <div
            role="group"
            aria-label="Reading status"
            className={`grid gap-2 ${statusToggleTwoUp ? 'grid-cols-2' : 'grid-cols-4'}`}
          >
            {statusToggleOptions.map(({ value, label }) => {
              const active = value === selectedStatus
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  disabled={statusSaving}
                  onClick={() => handleToggleTap(value)}
                  className={`min-h-[44px] px-2 py-2 rounded-lg border text-label transition-colors duration-calm ease-calm disabled:opacity-60 ${
                    active
                      ? STATUS_TOGGLE_ACTIVE[value]
                      : 'bg-bg-surface border-border-default text-text-secondary hover:bg-bg-elevated'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Finished tap → inline date + rating capture */}
          {showFinishedCapture && (
            <div className="bg-bg-surface border border-border-default rounded-lg p-3 mt-3">
              <div className="space-y-3">
                <FormField label="Date finished" error={finishDateError}>
                  <input
                    type="date"
                    value={finishDate}
                    onChange={(e) => {
                      setFinishDate(e.target.value)
                      if (e.target.value) setFinishDateError(null)
                    }}
                    className={`w-full px-3 py-2 bg-bg-elevated border rounded-lg text-text-primary text-body-sm focus:outline-none ${
                      finishDateError
                        ? 'border-action-danger focus:border-action-danger'
                        : 'border-border-default focus:border-action-primary'
                    }`}
                  />
                </FormField>
                <FormField label="Rating (optional)">
                  <StarRating value={finishRating} onChange={setFinishRating} size="lg" />
                </FormField>
              </div>
              <div className="flex gap-2 justify-end mt-3">
                <Button
                  variant="ghost"
                  disabled={statusSaving}
                  onClick={() => setShowFinishedCapture(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" loading={statusSaving} onClick={handleFinishedConfirm}>
                  Mark {getLabel('Finished')}
                </Button>
              </div>
            </div>
          )}

          {statusNote && (
            <p className="text-body-sm text-text-secondary mt-2" role="status">
              {statusNote}
            </p>
          )}
          {statusError && (
            <p className="text-body-sm text-action-danger mt-2" role="alert">
              {statusError}
            </p>
          )}
        </div>
      )}

      {/* Book Details Sections (Flattened) */}
      {/* On mobile: only show in Details tab. On desktop: always show */}
      {!isWishlist && (
        <div className={`${activeTab !== 'details' ? 'hidden md:block' : ''}`}>
          {(() => {
            // Combine all tags for display
            const allTags = [
              ...(book.tags || []),
              ...(book.characters || []),
              ...(book.additional_tags || [])
            ]
            
            // Build metadata entries - only include non-empty values
            const metadataEntries = []
            
            // FanFiction-only fields
            if (book.category === 'FanFiction') {
              if (book.fandom) metadataEntries.push({ 
                label: 'Fandom', 
                value: <TagChip variant="fandom">{book.fandom}</TagChip>
              })
              if (book.content_rating) metadataEntries.push({ 
                label: 'Rating', 
                value: <TagChip variant="rating">{book.content_rating}</TagChip>
              })
              if (book.relationships && book.relationships.length > 0) metadataEntries.push({ 
                label: 'Ships', 
                value: (
                  <div className="flex flex-wrap gap-1.5">
                    {book.relationships.map((ship, i) => (
                      <TagChip key={i} variant="ship">{ship}</TagChip>
                    ))}
                  </div>
                )
              })
              if (book.ao3_category && book.ao3_category.length > 0) metadataEntries.push({ 
                label: 'Pairing Type', 
                value: (
                  <div className="flex flex-wrap gap-1.5">
                    {book.ao3_category.map((cat, i) => (
                      <TagChip key={i} variant="ship">{cat}</TagChip>
                    ))}
                  </div>
                )
              })
              if (book.ao3_warnings && book.ao3_warnings.length > 0) metadataEntries.push({ 
                label: 'Warnings', 
                value: (
                  <div className="flex flex-wrap gap-1.5">
                    {book.ao3_warnings.map((warning, i) => (
                      <TagChip key={i} variant="warning">{warning}</TagChip>
                    ))}
                  </div>
                )
              })
              if (book.completion_status) metadataEntries.push({ 
                label: 'Status', 
                value: (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    book.completion_status === 'Complete' ? 'bg-action-success/20 text-action-success' :
                    book.completion_status === 'WIP' ? 'bg-action-warning/20 text-action-warning' :
                    book.completion_status === 'Abandoned' ? 'bg-status-dnf/20 text-status-dnf' :
                    'bg-chip-default/20 text-text-muted'
                  }`}>
                    {getLabel(SESSION_STATUS_TO_BACKEND[book.completion_status] || book.completion_status)}
                  </span>
                )
              })
              if (book.source_url) metadataEntries.push({ 
                label: 'Source', 
                value: (
                  <a 
                    href={book.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-action-primary hover:opacity-90 text-xs truncate max-w-[250px] inline-block"
                  >
                    {book.source_url?.replace(/^https?:\/\//, '')?.split('/')?.slice(0, 2)?.join('/')}
                  </a>
                )
              })
            } else {
              // Fiction/Non-Fiction fields
              if (book.publisher) metadataEntries.push({ label: 'Publisher', value: book.publisher })
              if (book.isbn) metadataEntries.push({ 
                label: 'ISBN', 
                value: <span className="font-mono text-xs">{book.isbn}</span>
              })
            }
            
            // Common fields for all categories
            if (book.chapter_count != null) metadataEntries.push({ 
              label: 'Chapters', 
              value: `${book.chapter_count} chapters`
            })
            if (book.word_count) metadataEntries.push({ 
              label: 'Words', 
              value: book.word_count.toLocaleString()
            })
            if (book.created_at) metadataEntries.push({ 
              label: 'Added', 
              value: new Date(book.created_at).toLocaleDateString()
            })
            
            // Calculate if ANY content exists
            const hasSummary = !!book.summary
            const hasTags = allTags.length > 0
            const hasMetadata = metadataEntries.length > 0
            
            return (
              <>
                {/* About This Book - Summary */}
                {hasSummary && (
                  <div className="border-t border-border-default pt-4 mt-4">
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                      <h3 className="text-label text-text-body uppercase tracking-wider">
                        About This Book
                      </h3>
                    </div>
                    <div className="px-4 pb-2">
                      <p className="text-body-sm text-text-secondary leading-relaxed">
                        {decodeHtmlEntities(book.summary)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tags Section */}
                {hasTags && (
                  <div className="border-t border-border-default pt-4 mt-4">
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                      <h3 className="text-label text-text-body uppercase tracking-wider">
                        Tags
                      </h3>
                      <span className="text-caption text-text-muted">{allTags.length} tags</span>
                    </div>
                    <div className="px-4 pb-2">
                      <div className="flex flex-wrap gap-2">
                        {allTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-bg-elevated rounded-md text-sm text-text-body border border-border-default"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata Section */}
                {hasMetadata && (
                  <div className="border-t border-border-default pt-4 mt-4">
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                      <h3 className="text-label text-text-body uppercase tracking-wider">
                        Metadata
                      </h3>
                    </div>
                    <div className="px-4 pb-2">
                      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                        {metadataEntries.map((entry, idx) => (
                          <Fragment key={idx}>
                            <span className="text-caption text-text-muted">{entry.label}</span>
                            <div className="text-body-sm text-text-secondary">{entry.value}</div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}


      {/* Reading History Section - Desktop only (appears after About This Book) */}
      {!isWishlist && (
        <div className="hidden md:block border-t border-border-default pt-4 mt-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 id="reading-history-desktop" className="text-label text-text-body uppercase tracking-wide">
                Reading History
              </h3>
              <IconButton
                type="button"
                size="sm"
                style={{ color: '#5c5752' }}
                onClick={() => openAddSession()}
                title="Add reading session"
                aria-label="Add reading session"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M12 5v14"/>
                  <path d="M5 12h14"/>
                </svg>
              </IconButton>
            </div>

            {/* Sessions List */}
            {sessionsLoading ? (
              <div className="text-text-secondary text-sm">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="text-text-secondary text-sm">No reading sessions recorded</div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <CompactSessionRow 
                    key={session.id} 
                    session={session} 
                    onEdit={openEditSession} 
                  />
                ))}
              </div>
            )}

            {/* Stats Row */}
            {sessions.length > 0 && (
              <div className="border-t border-border-default pt-4 mt-4">
                <div className="flex justify-between text-sm">
                  <div>
                    <div className="text-text-secondary">Times Read</div>
                    <div className="text-h4 text-text-primary">{sessionsStats.times_read}</div>
                  </div>
                  {sessionsStats.average_rating && (
                    <div className="text-right">
                      <div className="text-text-secondary">Average Rating</div>
                      <div className="text-h4 text-text-primary flex items-center justify-end gap-1">
                        {sessionsStats.average_rating}
                        <span className="text-action-warning">★</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collections Section - show for owned books */}
      {!isWishlist && (
        <div className={`border-t border-border-default pt-4 mt-4 ${activeTab !== 'details' ? 'hidden md:block' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-label text-text-body uppercase tracking-wide">Collections</h2>
            <IconButton
              type="button"
              size="sm"
              style={{ color: '#5c5752' }}
              onClick={() => setShowCollectionPicker(true)}
              title="Edit"
              aria-label="Edit collections"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                <path d="m15 5 4 4"/>
              </svg>
            </IconButton>
          </div>
          
          {collectionsLoading ? (
            <div className="text-text-secondary text-sm">Loading...</div>
          ) : bookCollections.length > 0 ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {bookCollections.map(collection => (
                <Link
                  key={collection.id}
                  to={`/collections/${collection.id}`}
                  className="text-action-primary hover:underline text-sm"
                >
                  {collection.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary text-sm">Not in any collections</p>
          )}
        </div>
      )}

      {/* Files Section (Batch 2 S3) — owns all format actions */}
      {!isWishlist && (
        <div className={`border-t border-border-default pt-4 mt-4 ${activeTab !== 'details' ? 'hidden md:block' : ''}`}>
          <div className="flex items-center">
            <h2 className="flex-1 min-w-0 flex items-center min-h-11 text-label text-text-body uppercase tracking-wide">
              Files
            </h2>
          </div>

          <div className="mt-1">
              <ul>
                {(book?.editions || []).map((edition) => {
                  const label = formatLabel(edition.format)
                  return (
                    <li key={edition.id}>
                      <div className="flex items-center gap-2 min-h-11">
                        <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                          <span className="text-body-sm text-text-primary flex-shrink-0">{label}</span>
                          <span className="text-body-sm text-text-muted flex-shrink-0">·</span>
                          {edition.file_path ? (
                            <>
                              <span className="text-body-sm text-text-secondary truncate">{editionFileName(edition)}</span>
                              <span className="text-body-sm text-text-muted flex-shrink-0">·</span>
                              <span className="text-body-sm text-text-secondary flex-shrink-0 whitespace-nowrap">
                                {edition.file_size != null ? formatFileSize(edition.file_size) : 'size unavailable'}
                              </span>
                            </>
                          ) : (
                            <span className="text-body-sm text-text-secondary">No file</span>
                          )}
                        </div>
                        {edition.file_path && (
                          <IconButton
                            variant="muted"
                            aria-label={`Replace ${label} file`}
                            onClick={() => {
                              setReplaceError(null)
                              setReplaceTarget(prev => prev?.edition.id === edition.id ? null : { edition, label })
                            }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                              <path d="M21 3v5h-5" />
                              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                              <path d="M3 21v-5h5" />
                            </svg>
                          </IconButton>
                        )}
                        {book?.editions?.length > 1 && (
                          <IconButton
                            variant="muted"
                            aria-label={`Remove ${label}`}
                            onClick={() => {
                              setEditionDeleteError(null)
                              setEditionToDelete({ ...edition, label })
                            }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                          </IconButton>
                        )}
                      </div>
                      {replaceTarget?.edition.id === edition.id && (
                        <div className="mb-2 p-3 rounded-lg bg-bg-elevated border border-border-default">
                          <p className="text-body-sm text-text-secondary mb-2">
                            Replace the {label} file? The current file moves to trash (recoverable
                            until you empty it), and the swap never changes this title&apos;s details.
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={replacing}
                              onClick={() => replaceFileInputRef.current?.click()}
                            >
                              {replacing ? 'Replacing…' : 'Choose new file'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={replacing}
                              onClick={() => { setReplaceTarget(null); setReplaceError(null) }}
                            >
                              Keep current file
                            </Button>
                          </div>
                          {replaceError && (
                            <p className="text-body-sm text-action-danger mt-2">{replaceError}</p>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
              <input
                ref={replaceFileInputRef}
                type="file"
                accept={replaceTarget ? (REPLACE_ACCEPT[replaceTarget.edition.format] || `.${replaceTarget.edition.format}`) : undefined}
                onChange={handleReplaceFileChosen}
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
              />
              <div className="flex items-center gap-2 mt-2">
                <Button variant="ghost" onClick={openAddEdition}>
                  Add format
                </Button>
                <Button variant="ghost" onClick={() => navigate(`/add?mode=upload&linkTo=${book.id}`)}>
                  Add files
                </Button>
              </div>
            </div>
        </div>
      )}

      {/* Notes Section */}
      {/* On mobile: only show in Notes tab (or always for wishlist). On desktop: always show */}
      <div className={`border-t border-border-default pt-4 mt-4 ${!isWishlist && activeTab !== 'notes' ? 'hidden md:block' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-label text-text-body uppercase tracking-wide">Notes</h2>
            <IconButton
              type="button"
              size="sm"
              style={{ color: '#5c5752' }}
              onClick={() => setIsEditingNotes(true)}
              title="Edit"
              aria-label="Edit notes"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                <path d="m15 5 4 4"/>
              </svg>
            </IconButton>
          </div>

          <div className="flex items-center gap-2">
            {saveStatus === 'saved' && (
              <span className="text-action-success text-sm">✓ Saved</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-action-danger text-sm">Failed to save</span>
            )}
          </div>
        </div>
        
        {/* Note Content - Read mode only */}
        {noteContent ? (
          <div className="prose prose-invert prose-sm max-w-none text-text-body">
            <ReactMarkdown
              components={{
                h2: ({children}) => <h2 className="text-h4 text-text-primary mt-4 mb-2 first:mt-0">{children}</h2>,
                h3: ({children}) => <h3 className="text-label text-text-primary mt-3 mb-1">{children}</h3>,
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
                  
                  return <p className="text-body-sm text-text-secondary mb-2">{processed}</p>
                },
                hr: () => <hr className="border-border-default my-4" />,
                strong: ({children}) => <strong className="text-label text-text-primary">{children}</strong>,
                em: ({children}) => <em className="text-text-body">{children}</em>,
                ul: ({children}) => <ul className="list-disc list-inside text-sm text-text-body mb-2">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside text-sm text-text-body mb-2">{children}</ol>,
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
          <p className="text-text-secondary text-sm italic">No notes yet. Click the edit button to add some.</p>
        )}
      </div>

      {/* Notes Editor Full-Screen Modal */}
      {isEditingNotes && (
        <div className="fixed inset-0 z-50 bg-bg-base flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default bg-bg-surface">
            <IconButton
              onClick={saving ? undefined : handleCancelEdit}
              disabled={saving}
              aria-label="Close editor"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </IconButton>
            
            <h2 className="text-h3 text-text-primary">Edit Notes</h2>
            
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveNote}
              disabled={saving}
              loading={saving}
            >
              Save
            </Button>
          </div>
          
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-2">
            <select
              onChange={(e) => {
                handleTemplateSelect(e.target.value)
                e.target.value = ''
              }}
              className="bg-bg-base text-text-body text-sm rounded px-2 py-1 border border-border-default focus:border-border-focus focus:outline-none cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>+ Template</option>
              <option value="structured">Structured Review</option>
              <option value="reading">Notes While Reading</option>
              <option value="thoughts">Thoughts After Reading</option>
            </select>
            
            {saveStatus === 'error' && (
              <span className="text-action-danger text-sm ml-auto">Failed to save</span>
            )}
          </div>
          
          {/* Editor Area */}
          <div className="flex-1 min-h-0 relative">
            <textarea
              ref={textareaRef}
              value={noteContent}
              onChange={handleNoteChange}
              placeholder="Write your notes here... (Type [[ to link to a book)"
              className="absolute inset-0 m-4 bg-transparent text-text-primary focus:outline-none resize-none text-sm leading-relaxed"
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
        <div className={`border-t border-border-default pt-4 mt-4 ${activeTab !== 'notes' ? 'hidden md:block' : ''}`}>
          <h2 className="text-label text-text-body uppercase tracking-wide mb-3">
            Referenced by {!backlinksLoading && <span className="text-text-secondary">({backlinks.length})</span>}
          </h2>
          
          {backlinksLoading ? (
            <p className="text-text-secondary text-sm">Loading...</p>
          ) : (
            <ul className="space-y-2">
              {backlinks.map(book => (
                <li key={book.id}>
                  <Link
                    to={`/book/${book.id}`}
                    className="flex items-center gap-2 text-sm hover:bg-bg-elevated/50 -mx-2 px-2 py-1 rounded transition-colors"
                  >
                    <span className="text-action-primary">←</span>
                    <span className="text-text-primary truncate">{book.title}</span>
                    <span className="text-text-secondary truncate text-xs">
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
        <div className={`bg-bg-surface rounded-lg overflow-hidden mb-6 ${activeTab !== 'details' ? 'hidden md:block' : ''}`}>
          <div className="px-4 py-3 border-b border-border-default flex items-center justify-between">
            <h2 className="text-label text-text-body">
              {book.series}
            </h2>
            <Link 
              to={`/series/${encodeURIComponent(book.series)}`}
              className="text-action-primary text-sm hover:underline"
            >
              View Series →
            </Link>
          </div>
          
          {seriesLoading ? (
            <div className="px-4 py-6 text-center text-text-secondary">
              Loading series...
            </div>
          ) : seriesBooks.length > 0 ? (
            <ul className="divide-y divide-border-default">
              {seriesBooks.map((seriesBook) => {
                const isCurrentBook = seriesBook.id === book.id
                return (
                  <li key={seriesBook.id}>
                    {isCurrentBook ? (
                      <div className="flex items-center gap-4 px-4 py-3 bg-bg-elevated/50">
                        <span className="text-caption text-text-muted w-8 flex-shrink-0">
                          {seriesBook.series_number ? String(seriesBook.series_number).padStart(2, '0') : '—'}
                        </span>
                        <span className="text-action-primary font-medium flex-1 truncate">
                          {seriesBook.title}
                        </span>
                        <span className="text-text-secondary text-xs">You are here</span>
                      </div>
                    ) : (
                      <Link
                        to={`/book/${seriesBook.id}`}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-bg-elevated/50 transition-colors"
                      >
                        <span className="text-caption text-text-muted w-8 flex-shrink-0">
                          {seriesBook.series_number ? String(seriesBook.series_number).padStart(2, '0') : '—'}
                        </span>
                        <span className="text-text-primary flex-1 truncate">
                          {seriesBook.title}
                        </span>
                        {seriesBook.status === 'Finished' && (
                          <span className="text-action-success">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                          </span>
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
        <div className={`text-text-muted text-xs ${activeTab !== 'details' ? 'hidden md:block' : ''}`}>
          <span className="font-medium">Location: </span>
          <code className="bg-bg-surface px-2 py-1 rounded border border-border-default">
            {book.folder_path}
          </code>
        </div>
      )}

      {/* Acquire Book Modal (TBR → Library) */}
      <Modal
        isOpen={showAcquireModal}
        onClose={() => setShowAcquireModal(false)}
        size="sm"
      >
        <Modal.Header onClose={() => setShowAcquireModal(false)}>
          🎉 You got it!
        </Modal.Header>
        <Modal.Body>
          <p className="text-text-secondary text-sm mb-4">
            Moving "{book.title}" to your library.
          </p>
          
          <div>
            <span className="text-label text-text-body block mb-2">What format?</span>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full !justify-start flex-col items-stretch h-auto py-3 min-h-0 gap-0.5"
                onClick={() => {
                  navigate(`/add?mode=upload&linkTo=${book.id}`)
                }}
              >
                <span className="text-text-primary font-medium w-full text-left">Ebook</span>
                <span className="text-text-secondary text-sm font-normal w-full text-left">Upload your files now</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full !justify-start flex-col items-stretch h-auto py-3 min-h-0 gap-0.5"
                disabled={acquireLoading}
                onClick={async () => {
                  setAcquireLoading(true)
                  try {
                    await convertTBRToLibrary(id, { format: 'physical' })
                    const updatedBook = await getBook(id)
                    setBook(updatedBook)
                    setShowAcquireModal(false)
                    setSelectedStatus(updatedBook.status || 'Unread')
                    showToast('Moved to your library', 'success')
                  } catch (err) {
                    console.error('Failed to acquire book:', err)
                    setShowAcquireModal(false)
                    showToast('Something went wrong. Try again?', 'error')
                  } finally {
                    setAcquireLoading(false)
                  }
                }}
              >
                <span className="text-text-primary font-medium w-full text-left">Physical</span>
                <span className="text-text-secondary text-sm font-normal w-full text-left">No files to upload</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full !justify-start flex-col items-stretch h-auto py-3 min-h-0 gap-0.5"
                disabled={acquireLoading}
                onClick={async () => {
                  setAcquireLoading(true)
                  try {
                    await convertTBRToLibrary(id, { format: 'audiobook' })
                    const updatedBook = await getBook(id)
                    setBook(updatedBook)
                    setShowAcquireModal(false)
                    setSelectedStatus(updatedBook.status || 'Unread')
                    showToast('Moved to your library', 'success')
                  } catch (err) {
                    console.error('Failed to acquire book:', err)
                    setShowAcquireModal(false)
                    showToast('Something went wrong. Try again?', 'error')
                  } finally {
                    setAcquireLoading(false)
                  }
                }}
              >
                <span className="text-text-primary font-medium w-full text-left">Audiobook</span>
                <span className="text-text-secondary text-sm font-normal w-full text-left">No files to upload</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full !justify-start flex-col items-stretch h-auto py-3 min-h-0 gap-0.5"
                disabled={acquireLoading}
                onClick={async () => {
                  setAcquireLoading(true)
                  try {
                    await convertTBRToLibrary(id, { format: 'web' })
                    const updatedBook = await getBook(id)
                    setBook(updatedBook)
                    setShowAcquireModal(false)
                    setSelectedStatus(updatedBook.status || 'Unread')
                    showToast('Moved to your library', 'success')
                  } catch (err) {
                    console.error('Failed to acquire book:', err)
                    setShowAcquireModal(false)
                    showToast('Something went wrong. Try again?', 'error')
                  } finally {
                    setAcquireLoading(false)
                  }
                }}
              >
                <span className="text-text-primary font-medium w-full text-left">Web-based</span>
                <span className="text-text-secondary text-sm font-normal w-full text-left">For read tracking only</span>
              </Button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="!justify-stretch flex-col items-stretch gap-2">
          <Button variant="ghost" className="w-full" onClick={() => setShowAcquireModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Session Editor Modal */}
      <Modal
        isOpen={sessionModalOpen}
        onClose={() => {
          if (showSessionDeleteConfirm) {
            setShowSessionDeleteConfirm(false)
            return
          }
          closeSessionModal()
        }}
        size="md"
      >
        <Modal.Header onClose={() => {
          if (showSessionDeleteConfirm) {
            setShowSessionDeleteConfirm(false)
            return
          }
          closeSessionModal()
        }}>
          {editingSession ? `Edit Read #${editingSession.session_number}` : 'Add Reading Session'}
        </Modal.Header>
        <Modal.Body>
          {showSessionDeleteConfirm ? (
            <div className="flex flex-col items-center justify-center text-center px-6 py-8 gap-6">
              <div className="space-y-2">
                <h3 className="text-h4 text-text-primary">
                  Delete Read #{editingSession?.session_number}?
                </h3>
                <p className="text-body-sm text-text-secondary max-w-xs">
                  This can&apos;t be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full max-w-xs">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setShowSessionDeleteConfirm(false)}
                  disabled={sessionSaving}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={handleConfirmDeleteSession}
                  disabled={sessionSaving}
                  loading={sessionSaving}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Error banner */}
              {sessionError && (
                <div className="bg-action-danger/20 border border-action-danger text-action-danger px-4 py-2 rounded mb-4">
                  {sessionError}
                </div>
              )}

              <div className="space-y-4">
                {/* Start Date */}
                <FormField label="Start Date">
                  <input
                    type="date"
                    value={sessionForm.date_started}
                    onChange={(e) => setSessionForm({ ...sessionForm, date_started: e.target.value })}
                    className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-border-focus"
                  />
                </FormField>

                {/* End Date */}
                <FormField label="End Date">
                  <input
                    type="date"
                    value={sessionForm.date_finished}
                    onChange={(e) => setSessionForm({ ...sessionForm, date_finished: e.target.value })}
                    className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-border-focus"
                  />
                </FormField>

                {/* Format */}
                <FormField label="Format">
                  <select
                    value={sessionForm.format}
                    onChange={(e) => setSessionForm({ ...sessionForm, format: e.target.value })}
                    className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-border-focus h-11"
                  >
                    <option value="">— Not specified</option>
                    <option value="ebook">Ebook</option>
                    <option value="physical">Physical</option>
                    <option value="audiobook">Audiobook</option>
                    <option value="web">Web</option>
                  </select>
                </FormField>

                {/* Status */}
                <FormField label="Status">
                  <div className="flex gap-2">
                    {['in_progress', 'finished', 'dnf'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setSessionForm({ ...sessionForm, session_status: status })}
                        className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                          sessionForm.session_status === status
                            ? status === 'finished'
                              ? 'bg-action-success text-text-inverse'
                              : status === 'dnf'
                              ? 'bg-chip-ship/40 text-chip-ship'
                              : 'bg-action-secondary text-text-primary'
                            : 'bg-bg-elevated text-text-secondary hover:bg-bg-surface'
                        }`}
                      >
                        {getLabel(SESSION_STATUS_TO_BACKEND[status])}
                      </button>
                    ))}
                  </div>
                </FormField>

                {sessionForm.session_status !== 'in_progress' && (
                  <FormField label="Rating">
                    <StarRating
                      value={sessionForm.rating}
                      onChange={(val) => setSessionForm({ ...sessionForm, rating: val })}
                      size="lg"
                    />
                  </FormField>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        {!showSessionDeleteConfirm && (
          <Modal.Footer>
            {/* Footer as slot: danger left, standard right */}
            <div className="flex gap-3 w-full">
              {editingSession && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteSession}
                  disabled={sessionSaving}
                >
                  Delete
                </Button>
              )}
              <div className="flex-1" />
              <Button variant="ghost" onClick={closeSessionModal} disabled={sessionSaving}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveSession}
                disabled={sessionSaving}
                loading={sessionSaving}
              >
                Save
              </Button>
            </div>
          </Modal.Footer>
        )}
      </Modal>

      {/* Add Edition Modal (Phase 8.7b) */}
      <Modal
        isOpen={editionModalOpen}
        onClose={() => setEditionModalOpen(false)}
        size="sm"
      >
        <Modal.Header onClose={() => setEditionModalOpen(false)}>
          Add Format
        </Modal.Header>
        <Modal.Body>
          {editionError && (
            <div className="bg-action-danger/20 border border-action-danger rounded p-3 text-action-danger text-sm mb-4">
              {editionError}
            </div>
          )}

          <div className="space-y-4">
            <FormField label="Format *" error={editionError && !editionForm.format}>
              <select
                value={editionForm.format}
                onChange={(e) => setEditionForm({ ...editionForm, format: e.target.value })}
                className={`w-full bg-bg-elevated border rounded-lg px-3 py-2 text-text-primary text-sm h-11 focus:outline-none focus:border-border-focus ${
                  editionError && !editionForm.format ? 'border-action-danger' : 'border-border-default'
                }`}
              >
                <option value="">Select format...</option>
                <option value="ebook">Ebook</option>
                <option value="physical">Physical</option>
                <option value="audiobook">Audiobook</option>
                <option value="web">Web</option>
              </select>
            </FormField>

            <FormField label="Acquired Date (optional)">
              <input
                type="date"
                value={editionForm.acquired_date}
                onChange={(e) => setEditionForm({ ...editionForm, acquired_date: e.target.value })}
                className="w-full max-w-48 bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-border-focus"
              />
            </FormField>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={() => setEditionModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveEdition}
            disabled={editionSaving || !editionForm.format}
            loading={editionSaving}
          >
            Add Format
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Merge Modal (Phase 8.7d) */}
      <Modal
        isOpen={mergeModalOpen}
        onClose={() => setMergeModalOpen(false)}
        size="lg"
        fullscreenOnMobile
      >
        <Modal.Header onClose={() => setMergeModalOpen(false)}>
          {mergeStep === 'search' ? 'Merge into another title' : 'Merge into this title?'}
        </Modal.Header>
        <Modal.Body className="overflow-y-auto">
          {mergeError && (
            <div className="bg-action-danger/20 border border-action-danger rounded p-3 text-action-danger text-sm mb-4">
              {mergeError}
            </div>
          )}

          {mergeStep === 'search' && (
            <>
              <p className="text-text-secondary text-sm mb-4">
                Search for the title you want to merge this one INTO. The selected title will be kept, and this one's data will be moved to it.
              </p>

              {/* Current book preview */}
              <div className="bg-bg-base border border-border-default rounded-lg p-3 mb-4">
                <div className="text-caption text-text-muted mb-1">This title — its history moves over, its files go to trash</div>
                <div className="font-medium text-text-primary">{book.title}</div>
                <div className="text-sm text-text-secondary">{book.authors?.join(', ') || 'Unknown Author'}</div>
              </div>

              {/* Search input */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={mergeSearch}
                  onChange={(e) => handleMergeSearch(e.target.value)}
                  placeholder="Search by title..."
                  className="w-full bg-bg-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-border-focus"
                  autoFocus
                />
                {mergeSearching && (
                  <div className="absolute right-3 top-2.5 text-text-secondary text-sm">
                    Searching...
                  </div>
                )}
              </div>

              {/* Search results */}
              {mergeResults.length > 0 && (
                <div className="space-y-2">
                  <div className="text-caption text-text-muted mb-2">Select the title to merge into:</div>
                  {mergeResults.map((result) => (
                    <Button
                      key={result.id}
                      type="button"
                      variant="secondary"
                      onClick={() => selectMergeTarget(result)}
                      className="w-full !justify-start flex-col items-stretch h-auto py-3 min-h-0 gap-0.5 !text-left"
                    >
                      <span className="font-medium text-text-primary w-full">{result.title}</span>
                      <span className="text-sm text-text-secondary font-normal w-full">{result.authors?.join(', ') || 'Unknown Author'}</span>
                      {result.category && (
                        <span className="text-caption text-text-muted mt-1 w-full">{result.category}</span>
                      )}
                    </Button>
                  ))}
                </div>
              )}

              {mergeSearch.length >= 2 && mergeResults.length === 0 && !mergeSearching && (
                <div className="text-text-secondary text-sm text-center py-4">
                  No matching titles found
                </div>
              )}
            </>
          )}

          {mergeStep === 'confirm' && mergeTarget && (
            <>
              <div className="bg-bg-elevated border border-border-default rounded-lg p-4 mb-4">
                <div className="text-body-sm text-text-secondary">
                  This title's reading history, notes, and collections move to the one you picked. Its files move to the trash folder — the kept title stays with the files it already has.
                </div>
              </div>

              {/* Visual merge preview */}
              <div className="space-y-3">
                {/* Source (current book - will be deleted) */}
                <div className="bg-action-danger/20 border border-action-danger rounded-lg p-3">
                  <div className="text-xs text-action-danger mb-1 font-medium">SOURCE (will be deleted)</div>
                  <div className="font-medium text-text-primary">{book.title}</div>
                  <div className="text-sm text-text-secondary">{book.authors?.join(', ') || 'Unknown Author'}</div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center text-text-secondary">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>

                {/* Target (selected book - will be kept) */}
                <div className="bg-action-success/20 border border-action-success rounded-lg p-3">
                  <div className="text-xs text-action-success mb-1 font-medium">TARGET (will be kept)</div>
                  <div className="font-medium text-text-primary">{mergeTarget.title}</div>
                  <div className="text-sm text-text-secondary">{mergeTarget.authors?.join(', ') || 'Unknown Author'}</div>
                </div>
              </div>

              <div className="mt-4 text-body-sm text-text-secondary">
                <div className="text-label text-text-primary mb-2">Moves over</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Reading sessions</li>
                  <li>Notes</li>
                  <li>Collection memberships</li>
                  <li>Backlinks</li>
                </ul>
                <div className="text-label text-text-primary mt-4 mb-2">Goes to the trash folder</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>This title's files and its folder</li>
                </ul>
                <div className="text-caption text-text-muted mt-3">
                  Files can come back from the trash folder. Emptying it is manual.
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {/* Footer as slot: Back on left for confirm step, Cancel + action on right */}
          <div className="flex justify-between gap-3 w-full">
            {mergeStep === 'confirm' && (
              <Button variant="ghost" onClick={() => setMergeStep('search')}>
                ← Back
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="ghost" onClick={() => setMergeModalOpen(false)}>
              {mergeStep === 'confirm' ? 'Keep separate' : 'Cancel'}
            </Button>
            {mergeStep === 'confirm' && (
              <Button
                variant="danger"
                onClick={handleMerge}
                disabled={mergeSaving}
                loading={mergeSaving}
              >
                Merge
              </Button>
            )}
          </div>
        </Modal.Footer>
      </Modal>

      {/* Collection Picker Modal */}
      {showCollectionPicker && (
        <CollectionPicker
          bookId={book.id}
          currentCollectionIds={bookCollections.map(c => c.id)}
          onClose={() => setShowCollectionPicker(false)}
          onUpdate={async () => {
            try {
              const collections = await getCollectionsForBook(book.id)
              setBookCollections(collections)
            } catch (err) {
              console.error('Failed to refresh collections:', err)
            }
          }}
        />
      )}

      {/* Unified Edit Modal */}
      <UnifiedEditModal
        isOpen={showUnifiedEditModal}
        onClose={() => setShowUnifiedEditModal(false)}
        book={book}
        isWishlist={book?.acquisition_status === 'wishlist'}
        onSave={async (updates) => {
          try {
            // Split updates into metadata and enhanced metadata
            const metadataFields = {
              title: updates.title,
              authors: updates.authors,
              series: updates.series,
              series_number: updates.series_number,
              category: updates.category,
              publication_year: updates.publication_year,
              source_url: updates.source_url
            }
            
            // Only include completion_status for FanFiction library books
            if (updates.completion_status !== undefined) {
              metadataFields.completion_status = updates.completion_status
            }
            
            const enhancedFields = {
              summary: updates.summary,
              tags: updates.tags,
              fandom: updates.fandom,
              relationships: updates.relationships,
              content_rating: updates.content_rating,
              ao3_warnings: updates.ao3_warnings,
              ao3_category: updates.ao3_category
            }
            
            // Update basic metadata
            await updateBookMetadata(book.id, metadataFields)
            
            // Update enhanced metadata
            await updateEnhancedMetadata(book.id, enhancedFields)
            
            // Refresh book data
            const updatedBook = await getBook(book.id)
            setBook(updatedBook)
            setSelectedCategory(updatedBook.category || '')
            
            showToast('Book updated', 'success')
          } catch (error) {
            console.error('Failed to update book:', error)
            showToast('Failed to update book', 'error')
          }
        }}
      />

      {/* Change Cover Modal */}
      <ChangeCoverModal
        book={book}
        isOpen={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        onSuccess={async (message) => {
          showToast(message, 'success')
          // Refresh book data to show new cover
          const updatedBook = await getBook(book.id)
          setBook(updatedBook)
        }}
      />

      {/* Delete Edition Confirmation Modal (Phase 8.7g) */}
      <Modal
        isOpen={!!editionToDelete}
        onClose={() => { if (!editionDeleting) setEditionToDelete(null) }}
        size="sm"
      >
        <Modal.Header onClose={() => { if (!editionDeleting) setEditionToDelete(null) }}>
          Remove Format
        </Modal.Header>
        <Modal.Body>
          {editionDeleteError && (
            <div className="bg-action-danger/20 border border-action-danger text-action-danger px-4 py-2 rounded mb-4 text-body-sm">
              {editionDeleteError}
            </div>
          )}
          <p className="text-body-sm text-text-secondary">
            Remove <span className="text-label text-text-primary">{editionToDelete?.label}</span> from this title?
            {editionFileOnDisk && !editionFileShared && <> The file moves to the trash folder.</>}
            {editionFileShared && <> The file stays — another format still uses it.</>}
          </p>
          <p className="text-text-secondary text-sm mt-2">
            This won't delete any reading sessions associated with this format.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={() => setEditionToDelete(null)} disabled={editionDeleting}>
            Keep
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteEdition}
            disabled={editionDeleting}
            loading={editionDeleting}
          >
            Remove
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Title Confirmation Modal (Batch 2 S1) — two-step */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => { if (!deleteSaving) setDeleteModalOpen(false) }}
        size="sm"
      >
        <Modal.Header onClose={() => { if (!deleteSaving) setDeleteModalOpen(false) }}>
          Delete this title?
        </Modal.Header>
        <Modal.Body>
          {deleteError && (
            <div className="bg-action-danger/20 border border-action-danger text-action-danger px-4 py-2 rounded mb-4 text-body-sm">
              {deleteError}
            </div>
          )}
          {deleteStep === 1 ? (
            <>
              <p className="text-body-sm text-text-primary">
                &ldquo;{decodeHtmlEntities(book.title)}&rdquo; leaves your library
                {deleteRemovedParts.length > 0 && <>, along with {deleteRemovedParts.join(' and ')}</>}.
              </p>
              {deleteFileCount > 0 && (
                <p className="text-body-sm text-text-secondary mt-2">
                  Its {deleteFileCount} {deleteFileCount === 1 ? 'file moves' : 'files move'} to
                  the trash folder on your server. Nothing is permanently deleted until you
                  empty that folder yourself.
                </p>
              )}
            </>
          ) : (
            <p className="text-body-sm text-text-primary">
              {deleteFileCount > 0
                ? "Files can come back from the trash folder — reading history and notes can't."
                : (deleteReadCount > 0 || deleteNoteCount > 0)
                  ? "Reading history and notes can't be brought back."
                  : "This can't be undone."}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          {deleteStep === 1 ? (
            <>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setDeleteModalOpen(false)}
              >
                Not Now
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => setDeleteStep(2)}
              >
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteSaving}
              >
                Keep
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmDelete}
                disabled={deleteSaving}
                loading={deleteSaving}
              >
                Delete Title
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      </div>

      {/* Download edition picker — bottom sheet (10.1 Treatment A) */}
      {showDownloadSheet && (
        <div
          className="fixed inset-0 z-50"
          role="presentation"
          onClick={() => setShowDownloadSheet(false)}
        >
          <div className="absolute inset-0 bg-bg-overlay" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Choose a format to download"
            className="absolute bottom-0 left-0 right-0 bg-bg-surface border-t border-border-default rounded-t-xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-h4 text-text-primary mb-3">Choose a format</div>
            <div className="flex flex-col gap-2">
              {downloadableEditions.map((edition) => (
                <button
                  key={edition.id}
                  type="button"
                  onClick={() => handleDownloadEdition(edition)}
                  className="w-full min-h-[44px] flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-default text-left hover:bg-bg-elevated/80 transition-colors duration-[200ms] ease-out"
                >
                  <span className="text-label text-text-primary flex-shrink-0">
                    {editionExtensionLabel(edition)}
                  </span>
                  {editionExtensionLabel(edition) === 'EPUB' && (
                    <span className="text-caption text-text-muted border border-border-default rounded-full px-2 py-0.5 flex-shrink-0">
                      Default
                    </span>
                  )}
                  <span className="text-body-sm text-text-secondary truncate flex-1 text-right">
                    {editionFileName(edition)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast toast={toast} />
    </div>
  )
}

export default BookDetail
