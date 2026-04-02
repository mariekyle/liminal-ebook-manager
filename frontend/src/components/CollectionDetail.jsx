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
import { useGridColumns } from '../hooks/useGridColumns'
import Modal from './ui/Modal'
import Button from './ui/Button'
import FormField from './ui/FormField'
import DuplicateCollectionModal from './DuplicateCollectionModal'
import SortDropdown from './SortDropdown'
import UnifiedNavBar from './ui/UnifiedNavBar'
import MarkFinishedModal from './MarkFinishedModal'
import ChangeStatusModal from './ChangeStatusModal'
import BookContextMenu from './BookContextMenu'

const VIEW_MODE_KEY = 'liminal-view-collection-detail'

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

const DragHandleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-text-muted">
    <path d="M9 5h2v2H9V5zm0 6h2v2H9v-2zm0 6h2v2H9v-2zm4-12h2v2h-2V5zm0 6h2v2h-2v-2zm0 6h2v2h-2v-2z" />
  </svg>
)

const ReorderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
  </svg>
)

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
)

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
        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 touch-none bg-bg-base/80 rounded-lg ${
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
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [removeMode, setRemoveMode] = useState(false)
  const [selectedForRemoval, setSelectedForRemoval] = useState(new Set())
  const { gridClasses: settingsGridClasses } = useGridColumns()
  
  // View mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem(VIEW_MODE_KEY) || 'grid'
  })
  
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
  
  // Ref to prevent concurrent pagination requests - avoids callback identity changes
  const loadingSectionRef = useRef(null)
  
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
  // Uses ref for loading guard to keep callback identity stable
  const loadMoreIncomplete = useCallback(async () => {
    // Use ref for guard - prevents callback recreation when loadingSection changes
    if (loadingSectionRef.current || !incompleteHasMore) return
    
    loadingSectionRef.current = 'incomplete'
    setLoadingSection('incomplete')
    
    try {
      const data = await getCollection(id, {
        incompleteLimit: BOOKS_PER_PAGE,
        incompleteOffset: incompleteOffset,
        completedLimit: 0,
        completedOffset: 0
      })
      
      const newBooks = data.incomplete_books || []
      setIncompleteBooks(prev => [...prev, ...newBooks])
      
      // Safety: if we got no books, there are no more regardless of API response
      const hasMore = newBooks.length > 0 && (data.incomplete_has_more ?? false)
      setIncompleteHasMore(hasMore)
      
      setIncompleteOffset(prev => prev + BOOKS_PER_PAGE)
    } catch (err) {
      console.error('Failed to load more incomplete books:', err)
    } finally {
      loadingSectionRef.current = null
      setLoadingSection(null)
    }
  }, [id, incompleteOffset, incompleteHasMore]) // Removed loadingSection!
  
  // Load more completed books (checklist)
  // Uses ref for loading guard to keep callback identity stable
  const loadMoreCompleted = useCallback(async () => {
    // Use ref for guard - prevents callback recreation when loadingSection changes
    if (loadingSectionRef.current || !completedHasMore) return
    
    loadingSectionRef.current = 'completed'
    setLoadingSection('completed')
    
    try {
      const data = await getCollection(id, {
        incompleteLimit: 0,
        incompleteOffset: 0,
        completedLimit: BOOKS_PER_PAGE,
        completedOffset: completedOffset
      })
      
      const newBooks = data.completed_books || []
      setCompletedBooks(prev => [...prev, ...newBooks])
      
      // Safety: if we got no books, there are no more regardless of API response
      const hasMore = newBooks.length > 0 && (data.completed_has_more ?? false)
      setCompletedHasMore(hasMore)
      
      setCompletedOffset(prev => prev + BOOKS_PER_PAGE)
    } catch (err) {
      console.error('Failed to load more completed books:', err)
    } finally {
      loadingSectionRef.current = null
      setLoadingSection(null)
    }
  }, [id, completedOffset, completedHasMore]) // Removed loadingSection!
  
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
  // Note: Guards removed from callback - loadMoreIncomplete handles all checks internally
  // This prevents infinite loops from observer recreation when loadingSection changes
  useEffect(() => {
    if (collection?.collection_type !== 'checklist') return
    if (!incompleteHasMore) return  // Don't even create observer if no more books
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreIncomplete()
        }
      },
      { threshold: 0.1 }
    )
    
    if (incompleteLoaderRef.current) {
      observer.observe(incompleteLoaderRef.current)
    }
    
    return () => observer.disconnect()
  }, [incompleteHasMore, loadMoreIncomplete, collection?.collection_type])
  
  // Observer for completed section
  // Note: Guards removed from callback - loadMoreCompleted handles all checks internally
  // This prevents infinite loops from observer recreation when loadingSection changes
  useEffect(() => {
    if (collection?.collection_type !== 'checklist') return
    if (!completedHasMore) return  // Don't even create observer if no more books
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreCompleted()
        }
      },
      { threshold: 0.1 }
    )
    
    if (completedLoaderRef.current) {
      observer.observe(completedLoaderRef.current)
    }
    
    return () => observer.disconnect()
  }, [completedHasMore, loadMoreCompleted, collection?.collection_type])

  // Load display settings and custom status labels
  useEffect(() => {
    getSettings()
      .then(settings => {
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
  
  const handleBatchRemove = async () => {
    if (selectedForRemoval.size === 0) return
    try {
      for (const titleId of selectedForRemoval) {
        await removeBookFromCollection(id, titleId)
      }
      if (collection?.collection_type === 'checklist') {
        const removedIncomplete = incompleteBooks.filter(b => selectedForRemoval.has(b.id)).length
        const removedCompleted = completedBooks.filter(b => selectedForRemoval.has(b.id)).length
        setIncompleteBooks(prev => prev.filter(b => !selectedForRemoval.has(b.id)))
        setCompletedBooks(prev => prev.filter(b => !selectedForRemoval.has(b.id)))
        setIncompleteTotal(prev => prev - removedIncomplete)
        setCompletedTotal(prev => prev - removedCompleted)
      } else {
        setBooks(prev => prev.filter(b => !selectedForRemoval.has(b.id)))
      }
      setTotalBooks(prev => prev - selectedForRemoval.size)
      setCollection(prev => ({
        ...prev,
        book_count: prev.book_count - selectedForRemoval.size
      }))
      setSelectedForRemoval(new Set())
      setRemoveMode(false)
    } catch (err) {
      console.error('Failed to remove books:', err)
      alert('Failed to remove some books')
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

  // Handle long press / right click for quick status menu
  const handleBookContextMenu = (e, book) => {
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
    return settingsGridClasses
  }

  // Navigate to book detail (list view; remove mode uses selection on BookCard instead)
  const handleBookClick = (book) => {
    navigate(`/book/${book.id}`)
  }

  // For non-checklist collections, use books array directly
  // For checklist collections, use incompleteBooks and completedBooks arrays
  
  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse-slow text-4xl mb-4">📚</div>
        <p className="text-text-secondary">Loading collection...</p>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-action-danger mb-4">{error}</p>
        <Link to="/collections" className="text-action-primary hover:underline">
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
  // canSort: whether this book should be wrapped in SortableBookItem (only true for incomplete in reorder mode)
  const renderBook = (book, isChecklistCompleted = false, canSort = true) => {
    // In reorder mode, use SortableBookItem wrapper — only if canSort is true
    if (isReorderMode && canSort) {
      return (
        <SortableBookItem 
          key={book.id} 
          book={book} 
          isReorderMode={true}
          disabled={isSavingReorder}
        >
          <BookCard
            book={book}
            variant="list"
            wpm={readingSpeed}
            isChecklistCompleted={isChecklistCompleted}
            linkTo={null}
            onClick={() => {}}
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
            <div className="relative">
              <BookCard
                book={book}
                variant="list"
                wpm={readingSpeed}
                isChecklistCompleted={isChecklistCompleted}
                linkTo={null}
                onClick={() => {
                  setSelectedForRemoval(prev => {
                    const next = new Set(prev)
                    if (next.has(book.id)) {
                      next.delete(book.id)
                    } else {
                      next.add(book.id)
                    }
                    return next
                  })
                }}
              />
              {selectedForRemoval.has(book.id) && (
                <div className="absolute inset-0 bg-action-danger/25 rounded-lg flex items-end justify-end p-2 pointer-events-none">
                  <div className="bg-action-danger text-text-primary rounded-full p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <BookCard
              book={book}
              variant="list"
              wpm={readingSpeed}
              isChecklistCompleted={isChecklistCompleted}
              linkTo={`/book/${book.id}`}
              onClick={() => handleBookClick(book)}
            />
          )}
        </div>
      )
    }
    
    // Grid view — unchanged
    return (
      <div 
        key={book.id} 
        className="relative"
        onContextMenu={(e) => handleBookContextMenu(e, book)}
        onTouchStart={(e) => {
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
          <div className="relative cursor-pointer">
            <BookCard
              book={book}
              variant="compact"
              isChecklistCompleted={isChecklistCompleted}
              linkTo={null}
              onClick={() => {
                setSelectedForRemoval(prev => {
                  const next = new Set(prev)
                  if (next.has(book.id)) {
                    next.delete(book.id)
                  } else {
                    next.add(book.id)
                  }
                  return next
                })
              }}
            />
            {selectedForRemoval.has(book.id) && (
              <div className="absolute inset-0 bg-action-danger/25 rounded-lg flex items-end justify-end p-2 pointer-events-none">
                <div className="bg-action-danger text-text-primary rounded-full p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ) : (
          <BookCard 
            book={book} 
            variant="compact"
            isChecklistCompleted={isChecklistCompleted}
          />
        )}
      </div>
    )
  }
  
  return (
    <div className={`max-w-4xl mx-auto ${removeMode ? 'pb-40' : 'pb-24'}`}>
      {/* Header */}
      <UnifiedNavBar backLabel="Collections" backTo="/collections">
        {/* Menu button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-elevated transition-colors"
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
              <div className="absolute right-0 top-full mt-1 w-48 bg-bg-elevated rounded-lg shadow-xl border border-border-default z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setShowMenu(false)
                    setShowEditModal(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-surface transition-colors"
                >
                  <PencilIcon />
                  Edit Collection
                </button>
                
                {/* Duplicate - available for all collections */}
                <button
                  onClick={() => {
                    setShowMenu(false)
                    setShowDuplicateModal(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-surface transition-colors"
                >
                  <CopyIcon />
                  Duplicate
                </button>
                
                {/* Remove Books - only for manual/checklist with books, not in reorder mode */}
                {!isAutomatic && totalBooks > 0 && !isReorderMode && !removeMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false)
                      setRemoveMode(true)
                      setSelectedForRemoval(new Set())
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-surface transition-colors"
                  >
                    <XIcon />
                    Remove Books
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
                    className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-surface transition-colors"
                  >
                    <ReorderIcon />
                    {isReorderMode ? 'Done Reordering' : 'Reorder Books'}
                  </button>
                )}
                
                {/* Delete - not for default collections */}
                {!isDefault && (
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowDeleteConfirm(true)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-action-danger hover:bg-bg-surface transition-colors"
                  >
                    <TrashIcon />
                    Delete Collection
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </UnifiedNavBar>
      
      <div className="px-4">
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
          <h1 className="text-h2 text-text-primary">
            {collection.name}
          </h1>
          {/* Collection type badge - greyscale */}
          {isChecklist && (
            <span className="text-xs px-2 py-0.5 bg-bg-elevated/80 text-text-muted rounded">
              Checklist
            </span>
          )}
          {isAutomatic && (
            <span className="text-xs px-2 py-0.5 bg-bg-elevated/80 text-text-muted rounded">
              Auto
            </span>
          )}
        </div>
        {/* Book count row with sort (for automatic collections) */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-text-secondary">
            {collection.book_count} {collection.book_count === 1 ? 'book' : 'books'}
            {isChecklist && completedTotal > 0 && (
              <span className="text-action-success"> · {completedTotal} completed</span>
            )}
          </p>
          
          {/* Sort controls - automatic collections only */}
          {isAutomatic && !loading && (
            <SortDropdown
              value={getSortField(sortOption)}
              direction={sortDir}
              onChange={(field, dir) => {
                // Build the full sort key and update
                const newSort = buildSortKey(field, dir)
                setSortOption(newSort)
                setSortDir(dir)
                sortVersionRef.current += 1
                setOffset(0)
                setBooks([])
                fetchCollection(newSort)
              }}
              options={['added', 'title', 'author', 'finished']}
            />
          )}
        </div>
        {collection.description && (
          <p className="text-body-sm text-text-secondary whitespace-pre-wrap">
            {collection.description}
          </p>
        )}
      </div>

      {/* Checklist hint - greyscale */}
      {isChecklist && !removeMode && (incompleteBooks.length > 0 || completedBooks.length > 0) && (
        <div className="mb-4 px-4 py-3 bg-bg-elevated/70 border border-border-subtle rounded-lg">
          <p className="text-body-sm text-text-secondary">
            Long-press or right-click a book to mark it complete
          </p>
        </div>
      )}

      {/* Grid/List toggle */}
      {!isReorderMode && !removeMode && books.length + incompleteBooks.length + completedBooks.length > 0 && (
        <div className="flex justify-end mb-4">
          <div className="flex items-center rounded-lg border border-border-default bg-bg-surface p-0.5 min-h-[44px]">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`min-h-[40px] px-2.5 rounded-md text-caption transition-all duration-200 ease-out ${
                viewMode === 'grid'
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              aria-pressed={viewMode === 'grid'}
              aria-label="Grid view"
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`min-h-[40px] px-2.5 rounded-md text-caption transition-all duration-200 ease-out ${
                viewMode === 'list'
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              aria-pressed={viewMode === 'list'}
              aria-label="List view"
            >
              List
            </button>
          </div>
        </div>
      )}
      
      {/* Remove mode banner */}
      {removeMode && (
        <div className="mb-4 px-4 py-3 bg-action-danger/10 border border-action-danger/30 rounded-lg">
          <p className="text-body-sm text-text-secondary">Select titles to remove</p>
        </div>
      )}

      {/* Reorder mode banner */}
      {isReorderMode && (
        <div className="mb-4 px-4 py-3 flex items-center justify-between bg-action-primary/15 border border-action-primary rounded-lg">
          <span className="text-body-sm text-text-primary font-medium">
            {isSavingReorder ? 'Saving...' : 'Drag to reorder books'}
          </span>
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={isSavingReorder}
            onClick={() => {
              if (isSavingReorder) return
              if (preReorderViewMode) {
                setViewMode(preReorderViewMode)
                localStorage.setItem(VIEW_MODE_KEY, preReorderViewMode)
              }
              setPreReorderViewMode(null)
              setIsReorderMode(false)
            }}
          >
            Done
          </Button>
        </div>
      )}

      {/* Automatic collection info - greyscale */}
      {isAutomatic && (
        <div className="mb-4 px-4 py-3 bg-bg-elevated/70 border border-border-subtle rounded-lg">
          <p className="text-body-sm text-text-secondary">
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
                  <div className="inline-flex items-center gap-2 text-text-muted">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm">Loading more books...</span>
                  </div>
                )}
              </div>
            )}

            {/* Completed section */}
            {(completedBooks.length > 0 || completedHasMore) && (
              <div className="mt-8 bg-bg-surface border border-border-default rounded-lg p-4">
                <p className="text-caption text-text-muted font-medium mb-4">
                  Completed · {completedTotal}
                </p>

                {/* Completed books - canSort=false since completed section isn't sortable */}
                {completedBooks.length > 0 && (
                  <div className={getGridClasses()}>
                    {completedBooks.map(book => renderBook(book, true, false))}
                  </div>
                )}
                
                {/* Completed section loader */}
                {completedHasMore && (
                  <div ref={completedLoaderRef} className="w-full py-8 flex justify-center">
                    {loadingSection === 'completed' && (
                      <div className="inline-flex items-center gap-2 text-text-muted">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm">Loading more books...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* "All books loaded" message - show when both sections are done */}
            {!incompleteHasMore && !completedHasMore && (incompleteBooks.length > 0 || completedBooks.length > 0) && (
              <div className="w-full py-8 flex justify-center">
                <span className="text-caption text-text-muted">
                  All {totalBooks} books loaded
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-text-secondary">An empty collection, ready for whatever arrives</p>
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
                <div className="inline-flex items-center gap-2 text-text-muted">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Loading more books...</span>
                </div>
              )}
              {!hasMore && books.length > 0 && (
                <span className="text-caption text-text-muted">
                  All {totalBooks} books loaded
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-text-secondary">
              {isAutomatic 
                ? 'No books match the current criteria'
                : 'An empty collection, ready for whatever arrives'
              }
            </p>
          </div>
        )
      )}

      {contextMenu.show && contextMenu.book && (
        <BookContextMenu
          book={contextMenu.book}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onMarkFinished={() => {
            setSelectedBook(contextMenu.book)
            setShowMarkFinishedModal(true)
          }}
          onChangeStatus={() => {
            setSelectedBook(contextMenu.book)
            setShowChangeStatusModal(true)
          }}
          onClose={() => setContextMenu({ show: false, book: null, x: 0, y: 0 })}
        />
      )}
      
      {/* Edit Modal */}
      {showEditModal && (
        <CollectionModal
          collection={collection}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Duplicate Collection Modal */}
      {showDuplicateModal && (
        <DuplicateCollectionModal
          collection={collection}
          onClose={() => setShowDuplicateModal(false)}
          onSuccess={() => {
            // Navigate to collections list to see the new collection
            navigate('/collections')
          }}
        />
      )}

      {/* Mark Finished Modal */}
      {showMarkFinishedModal && selectedBook && (
        <MarkFinishedModal
          book={selectedBook}
          onConfirm={handleMarkFinished}
          onClose={() => {
            setShowMarkFinishedModal(false)
            setSelectedBook(null)
          }}
        />
      )}

      {showChangeStatusModal && selectedBook && (
        <ChangeStatusModal
          book={selectedBook}
          onConfirm={handleChangeStatus}
          onClose={() => {
            setShowChangeStatusModal(false)
            setSelectedBook(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        size="sm"
      >
        <Modal.Header onClose={() => setShowDeleteConfirm(false)}>Delete Collection</Modal.Header>
        <Modal.Body>
          <p className="text-body-sm text-text-secondary">
            Are you sure you want to delete &quot;{collection.name}&quot;? This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" type="button" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" type="button" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {removeMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg-elevated border-t border-border-default px-4 py-3 flex items-center justify-between pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          <button
            type="button"
            onClick={() => { setRemoveMode(false); setSelectedForRemoval(new Set()) }}
            className="text-body-sm text-text-secondary hover:text-text-primary transition-colors min-h-[44px] px-3"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBatchRemove}
            disabled={selectedForRemoval.size === 0}
            className={`text-body-sm font-medium min-h-[44px] px-4 rounded-lg transition-colors ${
              selectedForRemoval.size > 0
                ? 'bg-action-danger text-text-primary hover:bg-action-danger-hover'
                : 'bg-bg-surface text-text-muted cursor-not-allowed'
            }`}
          >
            {selectedForRemoval.size > 0
              ? `Remove ${selectedForRemoval.size}`
              : 'Remove'}
          </button>
        </div>
      )}
      </div>
    </div>
  )
}
