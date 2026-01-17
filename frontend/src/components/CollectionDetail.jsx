/**
 * CollectionDetail - View a collection with all its books
 * 
 * Phase 9E: Smart Collections support
 * - Manual: Standard add/remove
 * - Checklist: Books can be marked complete, show divided sections
 * - Automatic: Read-only, books populated by criteria
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCollection, deleteCollection, removeBookFromCollection, updateCollection, getSettings, updateBookStatus, updateBookDates, updateBookRating } from '../api'
import BookCard from './BookCard'
import CollectionModal from './CollectionModal'
import MosaicCover from './MosaicCover'
import SmartPasteModal from './SmartPasteModal'

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
  
  const fetchCollection = async () => {
    try {
      setLoading(true)
      const data = await getCollection(id, {
        limit: BOOKS_PER_PAGE,
        offset: 0,
        incompleteLimit: BOOKS_PER_PAGE,
        incompleteOffset: 0,
        completedLimit: BOOKS_PER_PAGE,
        completedOffset: 0
      })
      
      setCollection(data)
      setTotalBooks(data.total_books || 0)
      
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
      console.error('Failed to fetch collection:', err)
      setError('Collection not found')
    } finally {
      setLoading(false)
    }
  }
  
  // Load more for non-checklist collections
  const loadMoreBooks = useCallback(async () => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    try {
      const data = await getCollection(id, { limit: BOOKS_PER_PAGE, offset })
      setBooks(prev => [...prev, ...data.books])
      setHasMore(data.has_more)
      setOffset(prev => prev + BOOKS_PER_PAGE)
    } catch (err) {
      console.error('Failed to load more books:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [id, offset, hasMore, loadingMore])
  
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
    fetchCollection()
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
    }
    
    window.addEventListener('settingsChanged', handleSettingsChange)
    return () => window.removeEventListener('settingsChanged', handleSettingsChange)
  }, [])

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
  
  const handleEditSuccess = () => {
    setShowEditModal(false)
    fetchCollection()
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
                
                {/* Remove Books - only for manual/checklist */}
                {!isAutomatic && (
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
          variant="banner"
        />
      </div>

      {/* Collection Info */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-white">
            {collection.name}
          </h1>
          {/* Collection type badge */}
          {isChecklist && (
            <span className="text-xs px-2 py-0.5 bg-emerald-900/50 text-emerald-300 rounded">
              Checklist
            </span>
          )}
          {isAutomatic && (
            <span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded">
              Auto
            </span>
          )}
        </div>
        <p className="text-gray-400 mb-2">
          {collection.book_count} {collection.book_count === 1 ? 'book' : 'books'}
          {isChecklist && completedTotal > 0 && (
            <span className="text-emerald-400"> · {completedTotal} completed</span>
          )}
        </p>
        {collection.description && (
          <p className="text-gray-300 text-sm whitespace-pre-wrap">
            {collection.description}
          </p>
        )}
      </div>

      {/* Checklist hint */}
      {isChecklist && !removeMode && (incompleteBooks.length > 0 || completedBooks.length > 0) && (
        <div className="mb-4 px-4 py-3 bg-emerald-900/20 border border-emerald-800/50 rounded-lg">
          <p className="text-emerald-200 text-sm">
            💡 Long-press or right-click a book to mark it complete
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

      {/* Automatic collection info */}
      {isAutomatic && (
        <div className="mb-4 px-4 py-3 bg-blue-900/20 border border-blue-800/50 rounded-lg">
          <p className="text-blue-200 text-sm">
            📋 This collection updates automatically based on your reading activity
          </p>
        </div>
      )}
      
      {/* Books Grid */}
      {isChecklist ? (
        /* Checklist collections: separate incomplete and completed sections */
        (incompleteBooks.length > 0 || completedBooks.length > 0) ? (
          <>
            {/* Incomplete books section */}
            {incompleteBooks.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {incompleteBooks.map(book => (
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
                      <button
                        onClick={() => handleRemoveBook(book.id)}
                        className="w-full text-left group"
                      >
                        <div className="relative">
                          <BookCard book={book} showTitleBelow={showTitleBelow} showAuthorBelow={showAuthorBelow} showSeriesBelow={showSeriesBelow} />
                          <div className="absolute inset-0 bg-red-900/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-red-600 rounded-full p-2">
                              <XIcon />
                            </div>
                          </div>
                        </div>
                      </button>
                    ) : (
                      <BookCard book={book} showTitleBelow={showTitleBelow} showAuthorBelow={showAuthorBelow} showSeriesBelow={showSeriesBelow} />
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Incomplete section loader */}
            {incompleteHasMore && (
              <div ref={incompleteLoaderRef} className="w-full py-4 flex justify-center">
                {loadingSection === 'incomplete' && (
                  <span className="text-gray-400 text-sm">Loading more...</span>
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

            {/* Completed books section */}
            {completedBooks.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {completedBooks.map(book => (
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
                            isChecklistCompleted={true}
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
                        isChecklistCompleted={true}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Completed section loader */}
            <div ref={completedLoaderRef} className="w-full py-8 flex justify-center">
              {loadingSection === 'completed' && (
                <span className="text-gray-400 text-sm">Loading more...</span>
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
            <p className="text-gray-400 mb-2">This collection is empty</p>
            <p className="text-gray-500 text-sm">Add books from the book detail page</p>
          </div>
        )
      ) : (
        /* Non-checklist collections: single books grid */
        books.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {books.map(book => (
                <div 
                  key={book.id} 
                  className="relative"
                >
                  {removeMode ? (
                    <button
                      onClick={() => handleRemoveBook(book.id)}
                      className="w-full text-left group"
                    >
                      <div className="relative">
                        <BookCard book={book} showTitleBelow={showTitleBelow} showAuthorBelow={showAuthorBelow} showSeriesBelow={showSeriesBelow} />
                        <div className="absolute inset-0 bg-red-900/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-red-600 rounded-full p-2">
                            <XIcon />
                          </div>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <BookCard book={book} showTitleBelow={showTitleBelow} showAuthorBelow={showAuthorBelow} showSeriesBelow={showSeriesBelow} />
                  )}
                </div>
              ))}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={loaderRef} className="w-full py-8 flex justify-center">
              {loadingMore && (
                <span className="text-gray-400 text-sm">Loading more...</span>
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
            <p className="text-gray-400 mb-2">This collection is empty</p>
            <p className="text-gray-500 text-sm">
              {isAutomatic 
                ? 'No books match the current criteria'
                : 'Add books from the book detail page'
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

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-library-card rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Delete Collection?
            </h3>
            <p className="text-gray-400 mb-6">
              This will delete "{collection.name}". Books will not be removed from your library.
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
    if (book.date_finished) return book.date_finished
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
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg">
            <p className="text-blue-200 text-sm">
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
