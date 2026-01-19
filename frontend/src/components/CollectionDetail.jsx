/**
 * CollectionDetail - View a collection with all its books
 * 
 * Phase 9E: Smart Collections support
 * - Manual: Standard add/remove
 * - Checklist: Books can be marked complete, show divided sections
 * - Automatic: Read-only, books populated by criteria
 * 
 * Phase 9E.5: Polish
 * - Grid/List view toggle with localStorage persistence
 * - Books per row from settings
 * - Greyscale type badges and info banners
 * - Drag-to-reorder books (Manual/Checklist only)
 * - Taller header banner
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core'
import { 
  SortableContext, 
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getCollection, deleteCollection, removeBookFromCollection, updateCollection, getSettings, updateBookStatus, updateBookDates, updateBookRating, reorderBooksInCollection } from '../api'
import BookCard from './BookCard'
import CollectionModal from './CollectionModal'
import MosaicCover from './MosaicCover'
import SmartPasteModal from './SmartPasteModal'
import GradientCover from './GradientCover'

// LocalStorage key for view mode preference
const VIEW_MODE_KEY = 'collection_detail_view_mode'

// Icons
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const DotsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
)

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const PasteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M9 12l2 2 4-4" />
    <circle cx="12" cy="12" r="10" />
  </svg>
)

const UndoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M3 10h10a5 5 0 0 1 5 5v2M3 10l4-4M3 10l4 4" />
  </svg>
)

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/>
  </svg>
)

const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/>
  </svg>
)

const DragHandleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-500">
    <path d="M9 5h2v2H9V5zm0 6h2v2H9v-2zm0 6h2v2H9v-2zm4-12h2v2h-2V5zm0 6h2v2h-2v-2zm0 6h2v2h-2v-2z" />
  </svg>
)

const ReorderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
  </svg>
)

// ============================================
// BookListItem - List view for individual books
// ============================================
function BookListItem({ book, onClick, isChecklistCompleted, readingSpeed = 180 }) {
  // Format series info
  const seriesInfo = book.series 
    ? ` (${book.series}${book.series_number ? ` #${book.series_number}` : ''})`
    : ''
  
  // Format author(s)
  const authorDisplay = Array.isArray(book.authors) 
    ? book.authors.join(', ')
    : book.authors || 'Unknown Author'
  
  // Calculate estimated reading time
  const getReadingTime = () => {
    if (!book.word_count) return null
    const minutes = Math.round(book.word_count / readingSpeed)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    if (remainingMins === 0) return `${hours}h`
    return `${hours}h ${remainingMins}m`
  }
  
  const readingTime = getReadingTime()
  
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer ${
        isChecklistCompleted ? 'opacity-60' : ''
      }`}
    >
      {/* Book cover thumbnail - hide text overlay for gradient covers */}
      <div className="flex-shrink-0 w-12 h-[72px] rounded overflow-hidden [&_span]:opacity-0 [&_p]:opacity-0 [&_h1]:opacity-0 [&_h2]:opacity-0 [&_h3]:opacity-0 [&_.truncate]:opacity-0">
        <GradientCover book={book} size="sm" />
      </div>
      
      {/* Book info */}
      <div className="flex-1 min-w-0">
        {/* Line 1: Title (Series #N) */}
        <p className="text-gray-100 font-medium truncate">
          {book.title}{seriesInfo}
        </p>
        
        {/* Line 2: By Author • Year • Est. read time */}
        <p className="text-sm text-gray-400 truncate">
          By {authorDisplay}
          {book.publication_year ? ` • ${book.publication_year}` : ''}
          {readingTime ? ` • Est. read time ${readingTime}` : ''}
        </p>
      </div>
      
      {/* Checkmark for completed items */}
      {isChecklistCompleted && (
        <div className="flex-shrink-0 text-emerald-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
      )}
    </div>
  )
}

// ============================================
// SortableBookItem - Wrapper for drag-and-drop reordering
// ============================================
function SortableBookItem({ 
  book, 
  children,
  isReorderMode,
  disabled = false
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: book.id,
    disabled: disabled
  })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined
  }
  
  if (!isReorderMode) {
    return children
  }
  
  // Build drag handle props conditionally
  const dragHandleProps = disabled ? {} : { ...attributes, ...listeners }
  
  return (
    <div ref={setNodeRef} style={style} className="relative">
      {children}
      {/* Drag handle overlay */}
      <div 
        {...dragHandleProps}
        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 touch-none bg-gray-900/80 rounded-lg ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        <DragHandleIcon />
      </div>
    </div>
  )
}

export default function CollectionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [collection, setCollection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [removeMode, setRemoveMode] = useState(false)
  const [showSmartPaste, setShowSmartPaste] = useState(false)
  const [showTitleBelow, setShowTitleBelow] = useState(false)
  const [showAuthorBelow, setShowAuthorBelow] = useState(false)
  const [showSeriesBelow, setShowSeriesBelow] = useState(false)
  
  // View mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem(VIEW_MODE_KEY) || 'grid'
  })
  
  // Grid columns from settings (default to 2 for mobile, matching original layout)
  const [gridColumns, setGridColumns] = useState(2)
  
  // Reading speed from settings (for estimated read time)
  const [readingSpeed, setReadingSpeed] = useState(180)
  
  // Sort state for automatic collections
  // null = use collection's default sort from criteria
  const [sortOption, setSortOption] = useState(null)
  const [sortDir, setSortDir] = useState('desc')
  
  // Reorder mode state
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [preReorderViewMode, setPreReorderViewMode] = useState(null) // Track view mode before reorder
  const [isSavingReorder, setIsSavingReorder] = useState(false) // Prevent race conditions during save
  
  // Configure drag sensors with activation constraint
  // Memoize the activation constraint to prevent recreation on each render
  const pointerSensorOptions = useMemo(() => ({
    activationConstraint: {
      distance: 8 // Prevents accidental drags
    }
  }), [])
  
  const sensors = useSensors(
    useSensor(PointerSensor, pointerSensorOptions)
  )
  
  // Pagination state
  const BOOKS_PER_PAGE = 50
  
  // For automatic/manual collections
  const [books, setBooks] = useState([])
  const [totalBooks, setTotalBooks] = useState(0)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  
  // For checklist collections - separate section state
  const [incompleteBooks, setIncompleteBooks] = useState([])
  const [completedBooks, setCompletedBooks] = useState([])
  const [incompleteOffset, setIncompleteOffset] = useState(0)
  const [completedOffset, setCompletedOffset] = useState(0)
  const [incompleteHasMore, setIncompleteHasMore] = useState(true)
  const [completedHasMore, setCompletedHasMore] = useState(true)
  const [incompleteTotal, setIncompleteTotal] = useState(0)
  const [completedTotal, setCompletedTotal] = useState(0)
  
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadingSection, setLoadingSection] = useState(null) // 'incomplete' | 'completed' | null
  
  const incompleteLoaderRef = useRef(null)
  const completedLoaderRef = useRef(null)
  const loaderRef = useRef(null) // For non-checklist collections
  
  // Track sort version to prevent stale pagination responses from corrupting the list
  const sortVersionRef = useRef(0)
  
  // Phase 9E: Book context menu for checklist actions
  const [contextMenu, setContextMenu] = useState({ show: false, book: null, x: 0, y: 0 })
  
  // Phase 9E: Checklist modals
  const [showMarkFinishedModal, setShowMarkFinishedModal] = useState(false)
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [statusLabels, setStatusLabels] = useState({
    unread: 'Unread',
    in_progress: 'Reading', 
    finished: 'Done',
    dnf: 'DNF'
  })
  
  // sortOverride: undefined = use sortOption state, null = force backend default, string = use that sort
  const fetchCollection = async (sortOverride = undefined) => {
    // Capture version before async call to detect stale responses
    const requestVersion = sortVersionRef.current
    
    try {
      setLoading(true)
      // undefined means use state, null means force backend default, string means use that value
      const effectiveSort = sortOverride !== undefined ? sortOverride : sortOption
      const params = {
        limit: BOOKS_PER_PAGE,
        offset: 0,
        incompleteLimit: BOOKS_PER_PAGE,
        incompleteOffset: 0,
        completedLimit: BOOKS_PER_PAGE,
        completedOffset: 0,
      }
      // Only add sort param if we have an explicit sort preference
      if (effectiveSort !== null) {
        params.sort = effectiveSort
      }
      const data = await getCollection(id, params)
      
      // Only apply results if this request is still relevant
      if (sortVersionRef.current !== requestVersion) {
        // Sort/collection changed while request was in flight - discard stale response
        return
      }
      
      setCollection(data)
      setTotalBooks(data.total_books || 0)
      
      // Set sort from response on collection change (sortOverride === null)
      // This sets the initial sort to the collection's configured default
      if (data.current_sort && sortOverride === null) {
        setSortOption(data.current_sort)
        // Also sync the direction state
        setSortDir(getSortDir(data.current_sort))
      }
      
      if (data.collection_type === 'checklist') {
        // Checklist: use separate section data
        setIncompleteBooks(data.incomplete_books || [])
        setCompletedBooks(data.completed_books || [])
        setIncompleteTotal(data.incomplete_total || 0)
        setCompletedTotal(data.completed_total || 0)
        setIncompleteHasMore(data.incomplete_has_more || false)
        setCompletedHasMore(data.completed_has_more || false)
        setIncompleteOffset(BOOKS_PER_PAGE)
        setCompletedOffset(BOOKS_PER_PAGE)
        // Also set combined books for backward compatibility
        setBooks(data.books || [])
      } else {
        // Automatic/Manual: use combined books array
        setBooks(data.books || [])
        setHasMore(data.has_more || false)
        setOffset(BOOKS_PER_PAGE)
      }
      setError(null)
    } catch (err) {
      // Only set error if this request is still relevant
      if (sortVersionRef.current === requestVersion) {
        console.error('Failed to fetch collection:', err)
        setError('Collection not found')
      }
    } finally {
      // Only clear loading if this request is still relevant
      if (sortVersionRef.current === requestVersion) {
        setLoading(false)
      }
    }
  }
  
  // Helper: Build sort key from field + direction
  const buildSortKey = (field, dir) => {
    const sortKeys = {
      'added': dir === 'desc' ? 'added_desc' : 'added_asc',
      'title': dir === 'asc' ? 'title_asc' : 'title_desc',
      'author': dir === 'asc' ? 'author_asc' : 'author_desc',
      'finished': dir === 'desc' ? 'finished_date_desc' : 'finished_date_asc',
    }
    return sortKeys[field] || 'title_asc'
  }
  
  // Helper: Extract field from full sort key
  const getSortField = (sortKey) => {
    if (!sortKey) return 'title'
    if (sortKey.startsWith('added')) return 'added'
    if (sortKey.startsWith('title')) return 'title'
    if (sortKey.startsWith('author')) return 'author'
    if (sortKey.startsWith('finished')) return 'finished'
    return 'title'
  }
  
  // Helper: Extract direction from full sort key
  const getSortDir = (sortKey) => {
    if (!sortKey) return 'asc'
    return sortKey.endsWith('_desc') ? 'desc' : 'asc'
  }
  
  // Handle sort field change for automatic collections
  const handleSortChange = (newSortField) => {
    // Increment version to invalidate any in-flight pagination requests
    sortVersionRef.current += 1
    
    // Build the full sort key (field + direction)
    const newSort = buildSortKey(newSortField, sortDir)
    setSortOption(newSort)
    
    // Reset pagination and refetch
    setOffset(0)
    setBooks([])
    fetchCollection(newSort)
  }
  
  // Handle sort direction toggle
  const handleSortDirChange = () => {
    const newDir = sortDir === 'asc' ? 'desc' : 'asc'
    setSortDir(newDir)
    
    // Increment version to invalidate any in-flight pagination requests
    sortVersionRef.current += 1
    
    // Build the full sort key with new direction
    const currentField = getSortField(sortOption)
    const newSort = buildSortKey(currentField, newDir)
    setSortOption(newSort)
    
    // Reset pagination and refetch
    setOffset(0)
    setBooks([])
    fetchCollection(newSort)
  }
  
  // Load more for non-checklist collections
  const loadMoreBooks = useCallback(async () => {
    if (loadingMore || !hasMore) return
    
    // Capture current sort version before async call
    const requestSortVersion = sortVersionRef.current
    
    setLoadingMore(true)
    try {
      const params = { limit: BOOKS_PER_PAGE, offset }
      if (sortOption !== null) {
        params.sort = sortOption
      }
      const data = await getCollection(id, params)
      
      // Only apply results if sort hasn't changed during the request
      if (sortVersionRef.current === requestSortVersion) {
        setBooks(prev => [...prev, ...data.books])
        setHasMore(data.has_more)
        setOffset(prev => prev + BOOKS_PER_PAGE)
      }
    } catch (err) {
      console.error('Failed to load more books:', err)
    } finally {
      // Always clear loading flag - even if sort changed, we need to allow new requests
      setLoadingMore(false)
    }
  }, [id, offset, hasMore, loadingMore, sortOption])
  
  // Load more incomplete books (checklist)
  const loadMoreIncomplete = useCallback(async () => {
    if (loadingSection || !incompleteHasMore) return
    
    setLoadingSection('incomplete')
    try {
      const data = await getCollection(id, {
        incompleteLimit: BOOKS_PER_PAGE,
        incompleteOffset: incompleteOffset,
        completedLimit: 0,
        completedOffset: 0
      })
      setIncompleteBooks(prev => [...prev, ...(data.incomplete_books || [])])
      setIncompleteHasMore(data.incomplete_has_more || false)
      setIncompleteOffset(prev => prev + BOOKS_PER_PAGE)
    } catch (err) {
      console.error('Failed to load more incomplete books:', err)
    } finally {
      setLoadingSection(null)
    }
  }, [id, incompleteOffset, incompleteHasMore, loadingSection])
  
  // Load more completed books (checklist)
  const loadMoreCompleted = useCallback(async () => {
    if (loadingSection || !completedHasMore) return
    
    setLoadingSection('completed')
    try {
      const data = await getCollection(id, {
        incompleteLimit: 0,
        incompleteOffset: 0,
        completedLimit: BOOKS_PER_PAGE,
        completedOffset: completedOffset
      })
      setCompletedBooks(prev => [...prev, ...(data.completed_books || [])])
      setCompletedHasMore(data.completed_has_more || false)
      setCompletedOffset(prev => prev + BOOKS_PER_PAGE)
    } catch (err) {
      console.error('Failed to load more completed books:', err)
    } finally {
      setLoadingSection(null)
    }
  }, [id, completedOffset, completedHasMore, loadingSection])
  
  useEffect(() => {
    // Reset sort to null when navigating to a different collection
    // This allows the new collection to use its own default sort from criteria
    setSortOption(null)
    // INCREMENT version to invalidate any in-flight requests from previous collection
    // Don't reset to 0 - a previous request might have captured version 0
    sortVersionRef.current += 1
    // Pass null explicitly to force backend default (not stale sortOption state)
    fetchCollection(null)
  }, [id])
  
  // Observer for non-checklist collections
  useEffect(() => {
    if (collection?.collection_type === 'checklist') return
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreBooks()
        }
      },
      { threshold: 0.1 }
    )
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }
    
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, loadMoreBooks, collection?.collection_type])
  
  // Observer for incomplete section
  useEffect(() => {
    if (collection?.collection_type !== 'checklist') return
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && incompleteHasMore && !loadingSection && !loading) {
          loadMoreIncomplete()
        }
      },
      { threshold: 0.1 }
    )
    
    if (incompleteLoaderRef.current) {
      observer.observe(incompleteLoaderRef.current)
    }
    
    return () => observer.disconnect()
  }, [incompleteHasMore, loadingSection, loading, loadMoreIncomplete, collection?.collection_type])
  
  // Observer for completed section
  useEffect(() => {
    if (collection?.collection_type !== 'checklist') return
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && completedHasMore && !loadingSection && !loading) {
          loadMoreCompleted()
        }
      },
      { threshold: 0.1 }
    )
    
    if (completedLoaderRef.current) {
      observer.observe(completedLoaderRef.current)
    }
    
    return () => observer.disconnect()
  }, [completedHasMore, loadingSection, loading, loadMoreCompleted, collection?.collection_type])

  // Load display settings and custom status labels
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
        // Load grid columns setting
        if (settings.grid_columns) {
          setGridColumns(parseInt(settings.grid_columns, 10) || 3)
        }
        // Load reading speed
        if (settings.reading_speed) {
          setReadingSpeed(parseInt(settings.reading_speed, 10) || 180)
        }
        // Load custom status labels
        setStatusLabels({
          unread: settings.status_label_unread || 'Unread',
          in_progress: settings.status_label_in_progress || 'Reading',
          finished: settings.status_label_finished || 'Done',
          dnf: settings.status_label_dnf || 'DNF'
        })
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
      if (event.detail.grid_columns !== undefined) {
        setGridColumns(parseInt(event.detail.grid_columns, 10) || 3)
      }
      if (event.detail.reading_speed !== undefined) {
        setReadingSpeed(parseInt(event.detail.reading_speed, 10) || 180)
      }
    }
    
    window.addEventListener('settingsChanged', handleSettingsChange)
    return () => window.removeEventListener('settingsChanged', handleSettingsChange)
  }, [])

  // Persist view mode to localStorage (but not during reorder mode)
  useEffect(() => {
    if (!isReorderMode) {
      localStorage.setItem(VIEW_MODE_KEY, viewMode)
    }
  }, [viewMode, isReorderMode])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu({ show: false, book: null, x: 0, y: 0 })
    if (contextMenu.show) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu.show])
  
  const handleDelete = async () => {
    try {
      await deleteCollection(id)
      navigate('/collections')
    } catch (err) {
      console.error('Failed to delete collection:', err)
      alert('Failed to delete collection')
    }
  }
  
  const handleRemoveBook = async (titleId) => {
    try {
      await removeBookFromCollection(id, titleId)
      
      // Update local state based on collection type
      if (collection?.collection_type === 'checklist') {
        // Check which section the book is in
        const inIncomplete = incompleteBooks.some(b => b.id === titleId)
        if (inIncomplete) {
          setIncompleteBooks(prev => prev.filter(b => b.id !== titleId))
          setIncompleteTotal(prev => prev - 1)
        } else {
          setCompletedBooks(prev => prev.filter(b => b.id !== titleId))
          setCompletedTotal(prev => prev - 1)
        }
      } else {
        setBooks(prev => prev.filter(b => b.id !== titleId))
      }
      
      setTotalBooks(prev => prev - 1)
      setCollection(prev => ({
        ...prev,
        book_count: prev.book_count - 1
      }))
    } catch (err) {
      console.error('Failed to remove book:', err)
      alert('Failed to remove book')
    }
  }

  // Phase 9E: Open appropriate modal based on book status
  const handleChecklistAction = (book) => {
    // For checklist, look in both arrays
    const currentBook = incompleteBooks?.find(b => b.id === book.id) || 
                       completedBooks?.find(b => b.id === book.id) ||
                       books?.find(b => b.id === book.id)
    if (!currentBook) {
      setContextMenu({ show: false, book: null, x: 0, y: 0 })
      return
    }
    
    setSelectedBook(currentBook)
    setContextMenu({ show: false, book: null, x: 0, y: 0 })
    
    if (currentBook.status === 'Finished') {
      setShowChangeStatusModal(true)
    } else {
      setShowMarkFinishedModal(true)
    }
  }

  // Handle marking book as finished
  const handleMarkFinished = async (dateFinished, rating) => {
    if (!selectedBook) return
    
    try {
      await updateBookStatus(selectedBook.id, 'Finished')
      if (dateFinished) {
        await updateBookDates(selectedBook.id, selectedBook.date_started, dateFinished)
      }
      if (rating) {
        await updateBookRating(selectedBook.id, rating)
      }
      
      const updatedBook = { 
        ...selectedBook, 
        status: 'Finished', 
        date_finished: dateFinished, 
        rating: rating || selectedBook.rating 
      }
      
      // Update local state - move book between sections for checklist
      if (collection?.collection_type === 'checklist') {
        // Remove from incomplete, add to completed
        setIncompleteBooks(prev => prev.filter(b => b.id !== selectedBook.id))
        setCompletedBooks(prev => [...prev, updatedBook])
        setIncompleteTotal(prev => prev - 1)
        setCompletedTotal(prev => prev + 1)
      } else {
        setBooks(prev => prev.map(b => 
          b.id === selectedBook.id ? updatedBook : b
        ))
      }
    } catch (err) {
      console.error('Failed to mark book as finished:', err)
      alert('Failed to update book')
    }
    
    setShowMarkFinishedModal(false)
    setSelectedBook(null)
  }

  // Handle changing status (from finished to something else)
  const handleChangeStatus = async (newStatus) => {
    if (!selectedBook) return
    
    try {
      await updateBookStatus(selectedBook.id, newStatus)
      // Clear date_finished when changing away from Finished
      await updateBookDates(selectedBook.id, selectedBook.date_started, null)
      
      const updatedBook = { ...selectedBook, status: newStatus, date_finished: null }
      
      // Update local state - move book between sections for checklist
      if (collection?.collection_type === 'checklist') {
        if (newStatus === 'Finished' && selectedBook.status !== 'Finished') {
          // Moving to completed
          setIncompleteBooks(prev => prev.filter(b => b.id !== selectedBook.id))
          setCompletedBooks(prev => [...prev, updatedBook])
          setIncompleteTotal(prev => prev - 1)
          setCompletedTotal(prev => prev + 1)
        } else if (newStatus !== 'Finished' && selectedBook.status === 'Finished') {
          // Moving to incomplete
          setCompletedBooks(prev => prev.filter(b => b.id !== selectedBook.id))
          setIncompleteBooks(prev => [...prev, updatedBook])
          setCompletedTotal(prev => prev - 1)
          setIncompleteTotal(prev => prev + 1)
        } else {
          // Status changed but staying in same section
          setIncompleteBooks(prev => prev.map(b => 
            b.id === selectedBook.id ? updatedBook : b
          ))
        }
      } else {
        setBooks(prev => prev.map(b => 
          b.id === selectedBook.id ? updatedBook : b
        ))
      }
    } catch (err) {
      console.error('Failed to change status:', err)
      alert('Failed to update book')
    }
    
    setShowChangeStatusModal(false)
    setSelectedBook(null)
  }

  // Handle long press / right click for checklist context menu
  const handleBookContextMenu = (e, book) => {
    if (collection?.collection_type !== 'checklist') return
    e.preventDefault()
    e.stopPropagation()
    
    // Position menu near the click/touch
    const x = e.clientX || e.touches?.[0]?.clientX || 100
    const y = e.clientY || e.touches?.[0]?.clientY || 100
    
    setContextMenu({ show: true, book, x, y })
  }

  // Handle drag end for reordering books
  const handleDragEnd = async (event) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) return
    
    // Prevent concurrent drags to avoid race conditions
    if (isSavingReorder) return
    
    // Determine which array we're working with
    let booksArray, setBooksArray
    if (collection?.collection_type === 'checklist') {
      // For checklists, only reorder incomplete books (completed section stays sorted by completion)
      booksArray = incompleteBooks
      setBooksArray = setIncompleteBooks
    } else {
      booksArray = books
      setBooksArray = setBooks
    }
    
    const oldIndex = booksArray.findIndex(b => b.id === active.id)
    const newIndex = booksArray.findIndex(b => b.id === over.id)
    
    if (oldIndex === -1 || newIndex === -1) return
    
    // Optimistically update UI
    const newOrder = arrayMove(booksArray, oldIndex, newIndex)
    setBooksArray(newOrder)
    
    // Persist to backend - send ALL book IDs in new order
    setIsSavingReorder(true)
    try {
      const allBookIds = newOrder.map(b => b.id)
      await reorderBooksInCollection(parseInt(id), allBookIds)
    } catch (err) {
      console.error('Failed to reorder books:', err)
      // Revert on error - safe now since we blocked concurrent drags
      setBooksArray(booksArray)
    } finally {
      setIsSavingReorder(false)
    }
  }
  
  const handleEditSuccess = () => {
    setShowEditModal(false)
    fetchCollection()
  }

  // Get grid classes based on settings
  const getGridClasses = () => {
    if (viewMode === 'list') {
      return 'flex flex-col gap-2'
    }
    // Mobile uses gridColumns, desktop expands
    const mobileColsMap = {
      2: 'grid-cols-2',
      3: 'grid-cols-3', 
      4: 'grid-cols-4'
    }
    const mobileCols = mobileColsMap[gridColumns] || 'grid-cols-3'
    return `grid ${mobileCols} sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`
  }

  // Navigate to book detail
  const handleBookClick = (book) => {
    if (removeMode) {
      handleRemoveBook(book.id)
    } else {
      navigate(`/book/${book.id}`)
    }
  }

  // For non-checklist collections, use books array directly
  // For checklist collections, use incompleteBooks and completedBooks arrays
  
  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse-slow text-4xl mb-4">📚</div>
        <p className="text-gray-400">Loading collection...</p>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-400 mb-4">{error}</p>
        <Link to="/collections" className="text-library-accent hover:underline">
          ← Back to Collections
        </Link>
      </div>
    )
  }
  
  if (!collection) return null

  const isChecklist = collection.collection_type === 'checklist'
  const isAutomatic = collection.collection_type === 'automatic'
  const isDefault = collection.is_default
  
  // Render a single book (grid or list)
  // Render a single book (grid or list)
  // canSort: whether this book should be wrapped in SortableBookItem (only true for incomplete in reorder mode)
  const renderBook = (book, isChecklistCompleted = false, canSort = true) => {
    // In reorder mode (list view), use SortableBookItem wrapper - but ONLY if canSort is true
    if (isReorderMode && canSort) {
      return (
        <SortableBookItem 
          key={book.id} 
          book={book} 
          isReorderMode={true}
          disabled={isSavingReorder}
        >
          <BookListItem 
            book={book} 
            onClick={() => {}} // Disable click during reorder
            isChecklistCompleted={isChecklistCompleted}
            readingSpeed={readingSpeed}
          />
        </SortableBookItem>
      )
    }
    
    if (viewMode === 'list') {
      return (
        <div 
          key={book.id}
          onContextMenu={(e) => handleBookContextMenu(e, book)}
          onTouchStart={(e) => {
            if (collection?.collection_type !== 'checklist') return
            const timer = setTimeout(() => handleBookContextMenu(e, book), 500)
            e.currentTarget._longPressTimer = timer
          }}
          onTouchEnd={(e) => {
            if (e.currentTarget._longPressTimer) {
              clearTimeout(e.currentTarget._longPressTimer)
              e.currentTarget._longPressTimer = null
            }
          }}
          onTouchMove={(e) => {
            if (e.currentTarget._longPressTimer) {
              clearTimeout(e.currentTarget._longPressTimer)
              e.currentTarget._longPressTimer = null
            }
          }}
        >
          {removeMode ? (
            <div className="relative group">
              <BookListItem 
                book={book} 
                onClick={() => handleRemoveBook(book.id)}
                isChecklistCompleted={isChecklistCompleted}
                readingSpeed={readingSpeed}
              />
              <div className="absolute inset-0 bg-red-900/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-red-600 rounded-full p-2">
                  <XIcon />
                </div>
              </div>
            </div>
          ) : (
            <BookListItem 
              book={book} 
              onClick={() => handleBookClick(book)}
              isChecklistCompleted={isChecklistCompleted}
              readingSpeed={readingSpeed}
            />
          )}
        </div>
      )
    }
    
    // Grid view
    return (
      <div 
        key={book.id} 
        className="relative"
        onContextMenu={(e) => handleBookContextMenu(e, book)}
        onTouchStart={(e) => {
          if (collection?.collection_type !== 'checklist') return
          const timer = setTimeout(() => handleBookContextMenu(e, book), 500)
          e.currentTarget._longPressTimer = timer
        }}
        onTouchEnd={(e) => {
          if (e.currentTarget._longPressTimer) {
            clearTimeout(e.currentTarget._longPressTimer)
            e.currentTarget._longPressTimer = null
          }
        }}
        onTouchMove={(e) => {
          if (e.currentTarget._longPressTimer) {
            clearTimeout(e.currentTarget._longPressTimer)
            e.currentTarget._longPressTimer = null
          }
        }}
      >
        {removeMode ? (
          <button
            onClick={() => handleRemoveBook(book.id)}
            className="w-full text-left group"
          >
            <div className="relative">
              <BookCard 
                book={book} 
                showTitleBelow={showTitleBelow} 
                showAuthorBelow={showAuthorBelow} 
                showSeriesBelow={showSeriesBelow}
                isChecklistCompleted={isChecklistCompleted}
              />
              <div className="absolute inset-0 bg-red-900/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-red-600 rounded-full p-2">
                  <XIcon />
                </div>
              </div>
            </div>
          </button>
        ) : (
          <BookCard 
            book={book} 
            showTitleBelow={showTitleBelow} 
            showAuthorBelow={showAuthorBelow} 
            showSeriesBelow={showSeriesBelow}
            isChecklistCompleted={isChecklistCompleted}
          />
        )}
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <button
          onClick={() => navigate('/collections')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <BackIcon />
          <span>Collections</span>
        </button>
        
        {/* Menu button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <DotsIcon />
          </button>
          
          {/* Dropdown menu */}
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setShowMenu(false)
                    setShowEditModal(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-200 hover:bg-gray-700 transition-colors"
                >
                  <PencilIcon />
                  Edit Collection
                </button>
                
                {/* Smart Paste - only for manual/checklist */}
                {!isAutomatic && (
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowSmartPaste(true)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-200 hover:bg-gray-700 transition-colors"
                  >
                    <PasteIcon />
                    Smart Paste
                  </button>
                )}
                
                {/* Remove Books - only for manual/checklist with books, not in reorder mode */}
                {!isAutomatic && totalBooks > 0 && !isReorderMode && (
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setRemoveMode(!removeMode)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-200 hover:bg-gray-700 transition-colors"
                  >
                    <XIcon />
                    {removeMode ? 'Done Removing' : 'Remove Books'}
                  </button>
                )}
                
                {/* Reorder Books - only for manual/checklist with sortable books, not in remove mode, and ALL books loaded */}
                {/* For checklists: need 2+ incomplete books. For manual: need 2+ total books */}
                {!isAutomatic && !removeMode && 
                 (isChecklist 
                   ? (!incompleteHasMore && incompleteBooks.length > 1)
                   : (!hasMore && totalBooks > 1)
                 ) && (
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      if (isReorderMode) {
                        // Restore original view mode when exiting reorder
                        if (preReorderViewMode) {
                          setViewMode(preReorderViewMode)
                          localStorage.setItem(VIEW_MODE_KEY, preReorderViewMode)
                        }
                        setPreReorderViewMode(null)
                        setIsReorderMode(false)
                      } else {
                        // Save current view mode and switch to list for reordering
                        setPreReorderViewMode(viewMode)
                        setViewMode('list') // Force list view for reordering (don't save to localStorage)
                        setIsReorderMode(true)
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-200 hover:bg-gray-700 transition-colors"
                  >
                    <ReorderIcon />
                    {isReorderMode ? 'Done Reordering' : 'Reorder Books'}
                  </button>
                )}
                
                {/* View toggle - not in reorder mode */}
                {!isReorderMode && (
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setViewMode(prev => prev === 'grid' ? 'list' : 'grid')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-200 hover:bg-gray-700 transition-colors"
                  >
                    {viewMode === 'grid' ? <ListIcon /> : <GridIcon />}
                    View: {viewMode === 'grid' ? 'List' : 'Grid'}
                  </button>
                )}
                
                {/* Delete - not for default collections */}
                {!isDefault && (
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowDeleteConfirm(true)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-700 transition-colors"
                  >
                    <TrashIcon />
                    Delete Collection
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Banner Cover */}
      <div className="mb-4">
        <MosaicCover 
          coverType={collection.cover_type || 'gradient'}
          collectionId={collection.id}
          collectionName={collection.name}
          variant="banner"
        />
      </div>

      {/* Collection Info */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-white">
            {collection.name}
          </h1>
          {/* Collection type badge - greyscale */}
          {isChecklist && (
            <span className="text-xs px-2 py-0.5 bg-gray-600/30 text-gray-400 rounded">
              Checklist
            </span>
          )}
          {isAutomatic && (
            <span className="text-xs px-2 py-0.5 bg-gray-600/30 text-gray-400 rounded">
              Auto
            </span>
          )}
        </div>
        {/* Book count row with sort (for automatic collections) */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-400">
            {collection.book_count} {collection.book_count === 1 ? 'book' : 'books'}
            {isChecklist && completedTotal > 0 && (
              <span className="text-emerald-400"> · {completedTotal} completed</span>
            )}
          </p>
          
          {/* Sort controls - automatic collections only */}
          {isAutomatic && !loading && (
            <div className="flex items-center gap-1">
              <select
                value={getSortField(sortOption)}
                onChange={(e) => handleSortChange(e.target.value)}
                className="appearance-none bg-transparent text-gray-500 text-xs pr-4 cursor-pointer hover:text-white focus:outline-none"
              >
                <option value="added">Recently Added</option>
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="finished">Recently Finished</option>
              </select>
              <button
                onClick={handleSortDirChange}
                className="text-gray-500 hover:text-white text-xs p-1 transition-colors"
                title={sortDir === 'asc' ? 'Ascending (click to reverse)' : 'Descending (click to reverse)'}
              >
                {sortDir === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          )}
        </div>
        {collection.description && (
          <p className="text-gray-300 text-sm whitespace-pre-wrap">
            {collection.description}
          </p>
        )}
      </div>

      {/* Checklist hint - greyscale */}
      {isChecklist && !removeMode && (incompleteBooks.length > 0 || completedBooks.length > 0) && (
        <div className="mb-4 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg">
          <p className="text-gray-400 text-sm">
            Long-press or right-click a book to mark it complete
          </p>
        </div>
      )}
      
      {/* Remove mode banner */}
      {removeMode && (
        <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-800 rounded-lg flex items-center justify-between">
          <span className="text-red-200">Tap a book to remove it from this collection</span>
          <button
            onClick={() => setRemoveMode(false)}
            className="text-red-300 hover:text-red-100 font-medium"
          >
            Done
          </button>
        </div>
      )}

      {/* Reorder mode banner */}
      {isReorderMode && (
        <div className="mb-4 px-4 py-3 flex items-center justify-between bg-library-accent/20 border border-library-accent rounded-lg">
          <span className="text-sm text-gray-200 font-medium">
            {isSavingReorder ? 'Saving...' : 'Drag to reorder books'}
          </span>
          <button
            onClick={() => {
              if (isSavingReorder) return // Don't exit while saving
              // Restore original view mode when exiting reorder
              if (preReorderViewMode) {
                setViewMode(preReorderViewMode)
                localStorage.setItem(VIEW_MODE_KEY, preReorderViewMode)
              }
              setPreReorderViewMode(null)
              setIsReorderMode(false)
            }}
            disabled={isSavingReorder}
            className={`px-3 py-1 text-sm font-medium rounded transition-opacity ${
              isSavingReorder 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-library-accent hover:opacity-90 text-white'
            }`}
          >
            Done
          </button>
        </div>
      )}

      {/* Automatic collection info - greyscale */}
      {isAutomatic && (
        <div className="mb-4 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg">
          <p className="text-gray-400 text-sm">
            This collection updates automatically based on your reading activity
          </p>
        </div>
      )}

      {/* Books Grid/List */}
      {isChecklist ? (
        /* Checklist collections: separate incomplete and completed sections */
        (incompleteBooks.length > 0 || completedBooks.length > 0) ? (
          <>
            {/* Incomplete books section */}
            {incompleteBooks.length > 0 && (
              isReorderMode ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={incompleteBooks.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className={getGridClasses()}>
                      {incompleteBooks.map(book => renderBook(book, false))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className={getGridClasses()}>
                  {incompleteBooks.map(book => renderBook(book, false))}
                </div>
              )
            )}
            
            {/* Incomplete section loader */}
            {incompleteHasMore && (
              <div ref={incompleteLoaderRef} className="w-full py-4 flex justify-center">
                {loadingSection === 'incomplete' && (
                  <div className="inline-flex items-center gap-2 text-zinc-400">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm">Loading more books...</span>
                  </div>
                )}
              </div>
            )}

            {/* Completed section divider */}
            {(completedBooks.length > 0 || completedHasMore) && (
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-gray-500 text-sm font-medium">
                  Completed · {completedTotal}
                </span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>
            )}

            {/* Completed books section - canSort=false since completed section isn't sortable */}
            {completedBooks.length > 0 && (
              <div className={getGridClasses()}>
                {completedBooks.map(book => renderBook(book, true, false))}
              </div>
            )}
            
            {/* Completed section loader */}
            <div ref={completedLoaderRef} className="w-full py-8 flex justify-center">
              {loadingSection === 'completed' && (
                <div className="inline-flex items-center gap-2 text-zinc-400">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Loading more books...</span>
                </div>
              )}
              {!incompleteHasMore && !completedHasMore && (incompleteBooks.length > 0 || completedBooks.length > 0) && (
                <span className="text-gray-500 text-sm">
                  All {totalBooks} books loaded
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-gray-400">An empty collection, ready for whatever arrives</p>
          </div>
        )
      ) : (
        /* Non-checklist collections: single books grid */
        books.length > 0 ? (
          <>
            {isReorderMode ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={books.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className={getGridClasses()}>
                    {books.map(book => renderBook(book, false))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className={getGridClasses()}>
                {books.map(book => renderBook(book, false))}
              </div>
            )}

            {/* Infinite scroll trigger */}
            <div ref={loaderRef} className="w-full py-8 flex justify-center">
              {loadingMore && (
                <div className="inline-flex items-center gap-2 text-zinc-400">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Loading more books...</span>
                </div>
              )}
              {!hasMore && books.length > 0 && (
                <span className="text-gray-500 text-sm">
                  All {totalBooks} books loaded
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-gray-400">
              {isAutomatic 
                ? 'No books match the current criteria'
                : 'An empty collection, ready for whatever arrives'
              }
            </p>
          </div>
        )
      )}

      {/* Context menu for checklist actions */}
      {contextMenu.show && contextMenu.book && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu({ show: false, book: null, x: 0, y: 0 })}
          />
          <div 
            className="fixed z-50 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden"
            style={{ 
              left: Math.min(contextMenu.x, window.innerWidth - 200),
              top: Math.min(contextMenu.y, window.innerHeight - 100)
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleChecklistAction(contextMenu.book)}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-200 hover:bg-gray-700 transition-colors"
            >
              {contextMenu.book.status === 'Finished' ? (
                <>
                  <UndoIcon />
                  Update Status
                </>
              ) : (
                <>
                  <CheckCircleIcon />
                  Mark Finished
                </>
              )}
            </button>
          </div>
        </>
      )}
      
      {/* Edit Modal */}
      {showEditModal && (
        <CollectionModal
          collection={collection}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Smart Paste Modal */}
      {showSmartPaste && (
        <SmartPasteModal
          collectionId={parseInt(id)}
          onClose={() => setShowSmartPaste(false)}
          onSuccess={() => {
            setShowSmartPaste(false)
            fetchCollection()
          }}
        />
      )}

      {/* Mark Finished Modal */}
      {showMarkFinishedModal && selectedBook && (
        <MarkFinishedModal
          book={selectedBook}
          statusLabel={statusLabels.finished}
          onConfirm={handleMarkFinished}
          onClose={() => {
            setShowMarkFinishedModal(false)
            setSelectedBook(null)
          }}
        />
      )}

      {/* Change Status Modal */}
      {showChangeStatusModal && selectedBook && (
        <ChangeStatusModal
          book={selectedBook}
          statusLabels={statusLabels}
          onConfirm={handleChangeStatus}
          onClose={() => {
            setShowChangeStatusModal(false)
            setSelectedBook(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-gray-800 rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Delete Collection?
            </h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete "{collection.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Mark Finished Modal Component
// ============================================
function MarkFinishedModal({ book, statusLabel, onConfirm, onClose }) {
  const [dateFinished, setDateFinished] = useState(() => {
    // Use existing date if available, otherwise default to today
    if (book.date_finished) {
      return book.date_finished.split('T')[0]
    }
    return new Date().toISOString().split('T')[0]
  })
  const [rating, setRating] = useState(book.rating || 0)
  const [hoveredRating, setHoveredRating] = useState(0)

  const handleSubmit = () => {
    onConfirm(dateFinished, rating || null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-library-card rounded-xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Mark as {statusLabel}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Date Finished */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Date Finished
            </label>
            <input
              type="date"
              value={dateFinished}
              onChange={(e) => setDateFinished(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-library-accent"
            />
          </div>
          
          {/* Rating (optional) */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Rating (optional)
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? 0 : star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-colors"
                >
                  <svg
                    className={`w-7 h-7 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-600'
                    }`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className="ml-2 text-xs text-gray-500 hover:text-gray-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Change Status Modal Component
// ============================================
function ChangeStatusModal({ book, statusLabels, onConfirm, onClose }) {
  const [selectedStatus, setSelectedStatus] = useState('')

  // Status options (excluding Finished since we're moving away from it)
  const statusOptions = [
    { value: 'Unread', label: statusLabels.unread },
    { value: 'In Progress', label: statusLabels.in_progress },
    { value: 'Abandoned', label: statusLabels.dnf },
  ]

  const handleSubmit = () => {
    if (selectedStatus) {
      onConfirm(selectedStatus)
    }
  }

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-library-card rounded-xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Update Status
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-2">
          {statusOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedStatus === option.value
                  ? 'bg-gray-700 border border-library-accent'
                  : 'bg-gray-800 border border-transparent hover:bg-gray-750'
              }`}
            >
              <input
                type="radio"
                name="status"
                value={option.value}
                checked={selectedStatus === option.value}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                selectedStatus === option.value
                  ? 'border-library-accent'
                  : 'border-gray-500'
              }`}>
                {selectedStatus === option.value && (
                  <div className="w-2 h-2 rounded-full bg-library-accent" />
                )}
              </div>
              <span className="text-gray-200">{option.label}</span>
            </label>
          ))}
        </div>

        {/* Gentle reminder about date being cleared */}
        {book.date_finished && (
          <div className="mt-4 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
            <p className="text-gray-400 text-sm">
              ℹ️ Finish date will be cleared ({formatDate(book.date_finished)})
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedStatus}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedStatus
                ? 'bg-library-accent hover:bg-library-accent/80 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
