import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { listBooks, getCategories, listSeries, getSettings, updateBookStatus, updateBookDates, updateBookRating } from '../api'
import BookCard from './BookCard'
import SeriesCard from './SeriesCard'
import TagsModal from './TagsModal'
import { getRandomPhrase } from '../utils/categoryPhrases'
import { READ_TIME_FILTERS, matchesReadTimeFilter } from '../utils/readTime'
import FilterDrawer from './FilterDrawer'
import HomeTab from './HomeTab'
import SearchModal from './SearchModal'
import FandomModal from './FandomModal'
import ShipModal from './ShipModal'
import SortDropdown from './SortDropdown'
import WishlistTab from './WishlistTab'
import UnifiedNavBar from './ui/UnifiedNavBar'
import BookContextMenu from './BookContextMenu'
import MarkFinishedModal from './MarkFinishedModal'
import ChangeStatusModal from './ChangeStatusModal'
import IconButton from './ui/IconButton'
import Button from './ui/Button'
import { useGridColumns } from '../hooks/useGridColumns'

function readPageView(pageKey) {
  try {
    return localStorage.getItem(`liminal-view-${pageKey}`) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

function readGridVariant() {
  try {
    return localStorage.getItem('liminal-grid-variant') === 'standard' ? 'standard' : 'compact'
  } catch {
    return 'compact'
  }
}

function Library() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)
  
  // Filter state - initialize from URL params
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [selectedTags, setSelectedTags] = useState(
    searchParams.get('tags') ? searchParams.get('tags').split(',') : []
  )
  const [tagsModalOpen, setTagsModalOpen] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [fandomModalOpen, setFandomModalOpen] = useState(false)
  const [shipModalOpen, setShipModalOpen] = useState(false)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'added')
  const [categories, setCategories] = useState([])
  const [readTimeFilter, setReadTimeFilter] = useState(searchParams.get('readTime') || '')
  const [wpm, setWpm] = useState(250)
  const { gridClasses: settingsGridClasses } = useGridColumns()
  
  // Enhanced metadata filters (Phase 7.2)
  const [fandom, setFandom] = useState(searchParams.get('fandom') || '')
  const [contentRating, setContentRating] = useState(
    searchParams.get('contentRating') ? searchParams.get('contentRating').split(',') : []
  )
  const [completionStatus, setCompletionStatus] = useState(
    searchParams.get('completionStatus') ? searchParams.get('completionStatus').split(',') : []
  )
  const [ship, setShip] = useState(searchParams.get('ship') || '')
  const [selectedFormats, setSelectedFormats] = useState(
    searchParams.get('format') ? searchParams.get('format').split(',') : []
  )
  const [sortDir, setSortDir] = useState(searchParams.get('sortDir') || 'desc')
  
  // View state (tabs) - initialize from URL
  const [activeView, setActiveView] = useState(searchParams.get('view') || 'library')
  
  // Acquisition filter state - 'owned', 'browse', or 'wishlist'
  const [acquisition, setAcquisition] = useState(searchParams.get('acquisition') || 'owned')
  
  // Series state
  const [seriesList, setSeriesList] = useState([])
  const [seriesTotal, setSeriesTotal] = useState(0)
  const [seriesLoading, setSeriesLoading] = useState(false)
  const [seriesError, setSeriesError] = useState(null)
  
  // Phrase state - regenerates on filter/search changes
  const [phraseKey, setPhraseKey] = useState(0)

  const [contextMenu, setContextMenu] = useState({ show: false, book: null, x: 0, y: 0 })
  const [selectedBook, setSelectedBook] = useState(null)
  const [showMarkFinished, setShowMarkFinished] = useState(false)
  const [showChangeStatus, setShowChangeStatus] = useState(false)

  const [browseView, setBrowseView] = useState(() => readPageView('browse'))
  const [seriesView, setSeriesView] = useState(() => readPageView('series'))
  const [gridVariant, setGridVariant] = useState(readGridVariant)

  const currentView = activeView === 'series' ? seriesView : browseView

  const setCurrentView = useCallback((value) => {
    const key = activeView === 'series' ? 'series' : 'browse'
    const setter = activeView === 'series' ? setSeriesView : setBrowseView
    setter(value)
    try { localStorage.setItem(`liminal-view-${key}`, value) } catch {}
  }, [activeView])

  // Listen for grid variant changes from Settings
  useEffect(() => {
    const handleSettingsChange = (event) => {
      if (event.detail?.gridVariant) {
        setGridVariant(event.detail.gridVariant)
      }
    }
    window.addEventListener('settingsChanged', handleSettingsChange)
    return () => window.removeEventListener('settingsChanged', handleSettingsChange)
  }, [])

  const libraryNavTitle = useMemo(() => {
    if (activeView === 'series') return 'Series'
    if (acquisition === 'owned') return 'Home'
    if (acquisition === 'browse') return 'Browse'
    return 'Wishlist'
  }, [activeView, acquisition])

  const bookCardVariant = useMemo(() => {
    if (currentView === 'list') return 'list'
    return gridVariant === 'compact' ? 'compact' : 'standard'
  }, [currentView, gridVariant])

  const manifestGridClass = useMemo(() => {
    if (currentView === 'list') return ''
    return settingsGridClasses
  }, [currentView, settingsGridClasses])

  // Filters that apply to current view
  const hasActiveFilters = activeView === 'library'
    ? (category || status || selectedTags.length > 0 || search || readTimeFilter || 
       fandom || contentRating.length > 0 || completionStatus.length > 0 || ship || selectedFormats.length > 0)
    : (category || search) // Series view only has category and search

  // Count active filters for badge
  // Only count filters relevant to current view
  const activeFilterCount = activeView === 'library'
    ? [category, status, selectedTags.length > 0, readTimeFilter, search,
       fandom, contentRating.length > 0, completionStatus.length > 0, ship, selectedFormats.length > 0].filter(Boolean).length
    : [category, search].filter(Boolean).length // Series view has category and search

  // Filter books by read time (client-side filtering since backend doesn't support it)
  // Defined early so we can use filteredBooks.length for the phrase
  const filteredBooks = useMemo(() => {
    if (!readTimeFilter) return books
    return books.filter(book => {
      // Books without word count are excluded when a filter is active
      if (!book.word_count) return false
      return matchesReadTimeFilter(book.word_count, readTimeFilter, wpm)
    })
  }, [books, readTimeFilter, wpm])

  // Get random phrase - regenerates when phraseKey, category, or displayed count changes
  // Uses filteredBooks.length to account for client-side read time filtering
  const currentPhrase = useMemo(() => {
    return getRandomPhrase(category, filteredBooks.length)
  }, [category, filteredBooks.length, phraseKey])

  // Load categories on mount
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(err => console.error('Failed to load categories:', err))
  }, [])

  // Load settings (WPM)
  useEffect(() => {
    getSettings()
      .then(settings => {
        if (settings.reading_wpm) {
          setWpm(parseInt(settings.reading_wpm, 10) || 250)
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
  }, [])

  // Load books when filters change (wishlist tab uses WishlistTab + listTBR)
  useEffect(() => {
    if (acquisition === 'wishlist') {
      setLoading(false)
      setError(null)
      setBooks([])
      setTotal(0)
      return
    }

    setLoading(true)
    setError(null)

    listBooks({
      category: category || undefined,
      status: status || undefined,
      tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
      search: search || undefined,
      sort,
      sort_dir: sortDir,
      acquisition: acquisition === 'browse' ? 'owned' : (acquisition || 'owned'),
      // Enhanced metadata filters
      fandom: fandom || undefined,
      content_rating: contentRating.length > 0 ? contentRating.join(',') : undefined,
      completion_status: completionStatus.length > 0 ? completionStatus.join(',') : undefined,
      ship: ship || undefined,
      format: selectedFormats.length > 0 ? selectedFormats.join(',') : undefined,
      limit: 10000, // Load all books
    })
      .then(data => {
        setBooks(data.books)
        setTotal(data.total)
      })
      .catch(err => {
        setError(err.message)
        setBooks([])
      })
      .finally(() => setLoading(false))
  }, [category, status, selectedTags, search, sort, sortDir, acquisition, fandom, contentRating, completionStatus, ship, selectedFormats])

  // Load series when Series tab is active and filters change
  useEffect(() => {
    if (activeView !== 'series') return
    
    setSeriesLoading(true)
    setSeriesError(null)
    
    listSeries({
      category: category || undefined,
      search: search || undefined,
    })
      .then(data => {
        setSeriesList(data.series)
        setSeriesTotal(data.total)
      })
      .catch(err => {
        setSeriesError(err.message)
        setSeriesList([])
      })
      .finally(() => setSeriesLoading(false))
  }, [activeView, category, search])

  // Regenerate phrase when filters change
  useEffect(() => {
    setPhraseKey(k => k + 1)
  }, [category, status, selectedTags, search, activeView, readTimeFilter, acquisition, fandom, contentRating, completionStatus, ship, selectedFormats])

  // Sync FROM URL params TO state (for browser back/forward navigation)
  // Only runs when searchParams changes (from browser navigation), not when state changes
  useEffect(() => {
    const urlCategory = searchParams.get('category') || ''
    const urlStatus = searchParams.get('status') || ''
    const urlTags = searchParams.get('tags') ? searchParams.get('tags').split(',') : []
    const urlSearch = searchParams.get('search') || ''
    const urlSort = searchParams.get('sort') || 'added'
    const urlView = searchParams.get('view') || 'library'
    const urlReadTime = searchParams.get('readTime') || ''
    const urlAcquisition = searchParams.get('acquisition') || 'owned'
    // Enhanced metadata filters
    const urlFandom = searchParams.get('fandom') || ''
    const urlContentRating = searchParams.get('contentRating') ? searchParams.get('contentRating').split(',') : []
    const urlCompletionStatus = searchParams.get('completionStatus') ? searchParams.get('completionStatus').split(',') : []
    const urlShip = searchParams.get('ship') || ''
    const urlFormat = searchParams.get('format') ? searchParams.get('format').split(',') : []
    const urlSortDir = searchParams.get('sortDir') || 'desc'
    
    // Update state from URL values
    setCategory(urlCategory)
    setStatus(urlStatus)
    setSelectedTags(urlTags)
    setSearch(urlSearch)
    setSort(urlSort)
    setActiveView(urlView)
    setReadTimeFilter(urlReadTime)
    setAcquisition(urlAcquisition)
    // Enhanced metadata filters
    setFandom(urlFandom)
    setContentRating(urlContentRating)
    setCompletionStatus(urlCompletionStatus)
    setShip(urlShip)
    setSelectedFormats(urlFormat)
    setSortDir(urlSortDir)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Update URL params without triggering re-sync
  const updateUrlParams = useCallback((updates) => {
    const params = new URLSearchParams(searchParams)
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined || 
          (Array.isArray(value) && value.length === 0) ||
          (key === 'sort' && value === 'added') ||
          (key === 'view' && value === 'library') ||
          (key === 'acquisition' && value === 'owned') ||
          (key === 'sortDir' && value === 'desc')) {
        params.delete(key)
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','))
      } else {
        params.set(key, value)
      }
    })
    
    setSearchParams(params, { replace: true })
  }, [searchParams, setSearchParams])

  // Clear all filters (preserves sort, sort direction, and current tab)
  const handleClearFilters = useCallback(() => {
    setCategory('')
    setStatus('')
    setSelectedTags([])
    setReadTimeFilter('')
    setSearch('')
    // Enhanced metadata filters
    setFandom('')
    setContentRating([])
    setCompletionStatus([])
    setShip('')
    setSelectedFormats([])
    // Preserve current sort, direction, and acquisition (stay on current tab)
    const params = new URLSearchParams()
    if (sort !== 'added') {
      params.set('sort', sort)
    }
    if (sortDir !== 'desc') {
      params.set('sortDir', sortDir)
    }
   // Keep acquisition if on browse or wishlist
   if (acquisition === 'browse' || acquisition === 'wishlist') {
    params.set('acquisition', acquisition)
  }
  // Keep view if on series tab
  if (activeView === 'series') {
    params.set('view', activeView)
  }
  setSearchParams(params, { replace: true })
}, [setSearchParams, sort, sortDir, acquisition, activeView])

  const handleBookLongPress = (book, position) => {
    setContextMenu({ show: true, book, x: position.x, y: position.y })
  }

  const handleMarkFinished = async (dateFinished, rating) => {
    if (!selectedBook) return
    try {
      await updateBookStatus(selectedBook.id, 'Finished')
      if (dateFinished) await updateBookDates(selectedBook.id, selectedBook.date_started, dateFinished)
      if (rating) await updateBookRating(selectedBook.id, rating)
      setBooks(prev => prev.map(b =>
        b.id === selectedBook.id ? { ...b, status: 'Finished', date_finished: dateFinished, rating: rating ?? b.rating } : b
      ))
    } catch (err) {
      console.error('Failed to mark finished:', err)
    }
    setShowMarkFinished(false)
    setSelectedBook(null)
  }

  const handleChangeStatus = async (newStatus) => {
    if (!selectedBook) return
    try {
      await updateBookStatus(selectedBook.id, newStatus)
      await updateBookDates(selectedBook.id, selectedBook.date_started, null)
      setBooks(prev => prev.map(b =>
        b.id === selectedBook.id ? { ...b, status: newStatus, date_finished: null } : b
      ))
    } catch (err) {
      console.error('Failed to change status:', err)
    }
    setShowChangeStatus(false)
    setSelectedBook(null)
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <UnifiedNavBar title={libraryNavTitle} />

      {/* Tab Bar */}
      <div className="sticky top-0 z-30 bg-bg-base border-b border-border-subtle">
        <div className="flex justify-between items-center px-4 pt-4">
          {/* Tabs on left */}
          {activeView === 'library' && (
            <div className="flex gap-6 min-h-[44px] items-end">
              <button
                type="button"
                onClick={() => {
                  setAcquisition('owned')
                  updateUrlParams({ acquisition: 'owned' })
                }}
                className={`text-body-sm pb-3 border-b-2 transition-all duration-200 ease-out min-h-[44px] ${
                  acquisition === 'owned'
                    ? 'text-action-primary border-action-primary'
                    : 'text-text-muted border-transparent'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => {
                  setAcquisition('browse')
                  updateUrlParams({ acquisition: 'browse' })
                }}
                className={`text-body-sm pb-3 border-b-2 transition-all duration-200 ease-out min-h-[44px] ${
                  acquisition === 'browse'
                    ? 'text-action-primary border-action-primary'
                    : 'text-text-muted border-transparent'
                }`}
              >
                Browse
              </button>
              <button
                type="button"
                onClick={() => {
                  setAcquisition('wishlist')
                  updateUrlParams({ acquisition: 'wishlist' })
                }}
                className={`text-body-sm pb-3 border-b-2 transition-all duration-200 ease-out min-h-[44px] ${
                  acquisition === 'wishlist'
                    ? 'text-action-primary border-action-primary'
                    : 'text-text-muted border-transparent'
                }`}
              >
                Wishlist
              </button>
            </div>
          )}

          {/* Actions on right - context dependent */}
          <div className="flex items-center gap-1">
            <IconButton
              type="button"
              variant="default"
              size="md"
              aria-label="Add book"
              onClick={() => navigate('/add')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </IconButton>

            <IconButton
              type="button"
              variant="default"
              size="md"
              aria-label="Search"
              onClick={() => setSearchModalOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </IconButton>

            {/* Filter button - Browse only (Wishlist uses WishlistTab) */}
            {activeView === 'library' && acquisition === 'browse' && (
              <IconButton
                type="button"
                variant={activeFilterCount > 0 ? 'accent' : 'default'}
                size="md"
                aria-label="Filter"
                onClick={() => setFilterDrawerOpen(true)}
                className="relative"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-0.5 bg-action-primary text-text-primary text-caption rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </IconButton>
            )}
          </div>
        </div>
      </div>

      {/* Poetic phrase + Sort + Active filters — hide on Home and Wishlist (WishlistTab is self-contained) */}
      {!(activeView === 'library' && acquisition === 'owned') &&
        !(activeView === 'library' && acquisition === 'wishlist') && (
      <div className="px-4 md:px-8 py-3">
        <div className="flex flex-col gap-2">
          {/* Top row: phrase, view controls, sort */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-caption text-text-muted max-w-[min(100%,28rem)]">
              {activeView === 'series'
                ? `${seriesTotal} series. Stories that needed more than one book.`
                : currentPhrase}
            </p>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {/* Grid / List toggle — Browse and Series */}
              {(activeView === 'library' && acquisition === 'browse') || activeView === 'series' ? (
                <div className="flex items-center rounded-lg border border-border-default bg-bg-surface p-0.5 min-h-[44px]">
                  <button
                    type="button"
                    onClick={() => setCurrentView('grid')}
                    className={`min-h-[40px] px-2.5 rounded-md text-caption transition-all duration-200 ease-out ${
                      currentView === 'grid'
                        ? 'bg-bg-elevated text-text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                    aria-pressed={currentView === 'grid'}
                    aria-label="Grid view"
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('list')}
                    className={`min-h-[40px] px-2.5 rounded-md text-caption transition-all duration-200 ease-out ${
                      currentView === 'list'
                        ? 'bg-bg-elevated text-text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                    aria-pressed={currentView === 'list'}
                    aria-label="List view"
                  >
                    List
                  </button>
                </div>
              ) : null}

              {activeView === 'library' && acquisition === 'browse' && (
                <SortDropdown
                  value={sort}
                  direction={sortDir}
                  onChange={(field, dir) => {
                    setSort(field)
                    setSortDir(dir)
                    updateUrlParams({ sort: field, sortDir: dir })
                  }}
                  options={['added', 'title', 'author', 'published']}
                />
              )}
            </div>
          </div>
          
          {/* Active filter pills row */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-action-primary/15 text-action-primary rounded-full text-caption">
                  {category}
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('')
                      updateUrlParams({ category: '' })
                    }}
                    className="hover:text-text-primary ml-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center -m-1"
                  >
                    ×
                  </button>
                </span>
              )}
              {/* Library-only filter pills */}
              {activeView === 'library' && status && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-action-primary/15 text-action-primary rounded-full text-caption">
                  {status}
                  <button
                    type="button"
                    onClick={() => {
                      setStatus('')
                      updateUrlParams({ status: '' })
                    }}
                    className="hover:text-text-primary ml-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center -m-1"
                  >
                    ×
                  </button>
                </span>
              )}
              {activeView === 'library' && selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-action-primary/15 text-action-primary rounded-full text-caption"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      const newTags = selectedTags.filter(t => t !== tag)
                      setSelectedTags(newTags)
                      updateUrlParams({ tags: newTags })
                    }}
                    className="hover:text-text-primary ml-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center -m-1"
                  >
                    ×
                  </button>
                </span>
              ))}
              {activeView === 'library' && readTimeFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-action-primary/15 text-action-primary rounded-full text-caption">
                  {READ_TIME_FILTERS.find(f => f.value === readTimeFilter)?.label || readTimeFilter}
                  <button
                    type="button"
                    onClick={() => {
                      setReadTimeFilter('')
                      updateUrlParams({ readTime: '' })
                    }}
                    className="hover:text-text-primary ml-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center -m-1"
                  >
                    ×
                  </button>
                </span>
              )}
              {/* Enhanced metadata filter pills */}
              {activeView === 'library' && fandom && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-chip-fandom/20 text-chip-fandom rounded-full text-caption">
                  {fandom}
                  <button
                    type="button"
                    onClick={() => {
                      setFandom('')
                      updateUrlParams({ fandom: '' })
                    }}
                    className="hover:text-text-primary ml-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center -m-1"
                  >
                    ×
                  </button>
                </span>
              )}
              {activeView === 'library' && ship && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-chip-ship/20 text-chip-ship rounded-full text-caption">
                  {ship}
                  <button
                    type="button"
                    onClick={() => {
                      setShip('')
                      updateUrlParams({ ship: '' })
                    }}
                    className="hover:text-text-primary ml-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center -m-1"
                  >
                    ×
                  </button>
                </span>
              )}
              {activeView === 'library' && contentRating.map(rating => (
                <span
                  key={rating}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-action-danger/15 text-action-danger rounded-full text-caption"
                >
                  {rating}
                  <button
                    type="button"
                    onClick={() => {
                      const newRatings = contentRating.filter(r => r !== rating)
                      setContentRating(newRatings)
                      updateUrlParams({ contentRating: newRatings })
                    }}
                    className="hover:text-text-primary ml-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center -m-1"
                  >
                    ×
                  </button>
                </span>
              ))}
              {activeView === 'library' && completionStatus.map(status => (
                <span
                  key={status}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-action-success/15 text-action-success rounded-full text-caption"
                >
                  {status}
                  <button
                    type="button"
                    onClick={() => {
                      const newStatuses = completionStatus.filter(s => s !== status)
                      setCompletionStatus(newStatuses)
                      updateUrlParams({ completionStatus: newStatuses })
                    }}
                    className="hover:text-text-primary ml-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center -m-1"
                  >
                    ×
                  </button>
                </span>
              ))}
              {/* Format pills */}
              {activeView === 'library' && selectedFormats.map(format => {
                const formatLabels = {
                  ebook: 'Ebook',
                  physical: 'Physical',
                  audiobook: 'Audiobook',
                  web: 'Web'
                }
                return (
                  <span
                    key={format}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-chip-character/20 text-chip-character rounded-full text-caption"
                  >
                    {formatLabels[format] || format}
                    <button
                      type="button"
                      onClick={() => {
                        const newFormats = selectedFormats.filter(f => f !== format)
                        setSelectedFormats(newFormats)
                        updateUrlParams({ format: newFormats.length > 0 ? newFormats.join(',') : '' })
                      }}
                      className="hover:text-text-primary ml-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center -m-1"
                    >
                      ×
                    </button>
                  </span>
                )
              })}
              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-action-primary/15 text-action-primary rounded-full text-caption">
                  &quot;{search}&quot;
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      updateUrlParams({ search: '' })
                    }}
                    className="hover:text-text-primary ml-0.5 min-w-[44px] min-h-[44px] flex items-center justify-center -m-1"
                  >
                    ×
                  </button>
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Content Area — WishlistTab brings its own horizontal padding */}
      <div
        className={`flex-1 pb-8 ${
          activeView === 'library' && acquisition === 'wishlist' ? '' : 'px-4 md:px-8'
        }`}
      >
        {/* Home Dashboard - show when on Home tab */}
        {activeView === 'library' && acquisition === 'owned' && (
          <HomeTab />
        )}

        {/* Wishlist — dedicated tab (listTBR) */}
        {activeView === 'library' && acquisition === 'wishlist' && <WishlistTab />}

        {/* Loading State - Library Browse only */}
        {activeView === 'library' && acquisition === 'browse' && loading && (
          <div className="text-center py-12">
            <div className="animate-pulse-slow text-4xl mb-4">📚</div>
            <p className="text-body-sm text-text-secondary">Loading library...</p>
          </div>
        )}

        {/* Error State - Library Browse */}
        {activeView === 'library' && acquisition === 'browse' && error && !loading && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-body-sm text-text-secondary mb-1">Well, that wasn&apos;t supposed to happen.</p>
            <p className="text-caption text-text-muted mb-4">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setLoading(true)
                setError(null)
                listBooks({
                  category: category || undefined,
                  status: status || undefined,
                  tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
                  search: search || undefined,
                  sort,
                  sort_dir: sortDir,
                  acquisition: 'owned',
                  fandom: fandom || undefined,
                  content_rating: contentRating.length > 0 ? contentRating.join(',') : undefined,
                  completion_status: completionStatus.length > 0 ? completionStatus.join(',') : undefined,
                  ship: ship || undefined,
                  format: selectedFormats.length > 0 ? selectedFormats.join(',') : undefined,
                  limit: 10000,
                })
                  .then(data => {
                    setBooks(data.books)
                    setTotal(data.total)
                  })
                  .catch(err => {
                    setError(err.message)
                    setBooks([])
                  })
                  .finally(() => setLoading(false))
              }}
            >
              Try again
            </Button>
          </div>
        )}

        {/* Empty State - Library Browse */}
        {activeView === 'library' &&
          acquisition === 'browse' &&
          !loading &&
          !error &&
          filteredBooks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔭</div>
              <p className="text-body-sm text-text-secondary mb-4">No titles found</p>
              <p className="text-caption text-text-muted">
                {search || category || status || readTimeFilter
                  ? 'Try adjusting your filters'
                  : 'Click "Sync Library" in settings to scan your book folders'}
              </p>
            </div>
          )}

        {/* Book grid / list — Browse only */}
        {activeView === 'library' &&
          acquisition === 'browse' &&
          !loading &&
          !error &&
          filteredBooks.length > 0 &&
          (currentView === 'list' ? (
            <div className="flex flex-col gap-4">
              {filteredBooks.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  variant={bookCardVariant}
                  wpm={wpm}
                  onLongPress={handleBookLongPress}
                />
              ))}
            </div>
          ) : (
            <div className={manifestGridClass}>
              {filteredBooks.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  variant={bookCardVariant}
                  wpm={wpm}
                  onLongPress={handleBookLongPress}
                />
              ))}
            </div>
          ))}

        {/* Loading State - Series */}
        {activeView === 'series' && seriesLoading && (
          <div className="text-center py-12">
            <div className="animate-pulse-slow text-4xl mb-4">📚</div>
            <p className="text-body-sm text-text-secondary">Loading series...</p>
          </div>
        )}

        {/* Error State - Series */}
        {activeView === 'series' && seriesError && !seriesLoading && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-body-sm text-text-secondary mb-1">Well, that wasn&apos;t supposed to happen.</p>
            <p className="text-caption text-text-muted mb-4">{seriesError}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSeriesLoading(true)
                setSeriesError(null)
                listSeries({
                  category: category || undefined,
                  search: search || undefined,
                })
                  .then(data => {
                    setSeriesList(data.series)
                    setSeriesTotal(data.total)
                  })
                  .catch(err => {
                    setSeriesError(err.message)
                    setSeriesList([])
                  })
                  .finally(() => setSeriesLoading(false))
              }}
            >
              Try again
            </Button>
          </div>
        )}

        {/* Empty State - Series */}
        {activeView === 'series' && !seriesLoading && !seriesError && seriesList.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-body-sm text-text-secondary mb-4">No series found</p>
            <p className="text-caption text-text-muted">
              {search || category
                ? 'Try adjusting your filters'
                : 'Books with series information will appear here'}
            </p>
          </div>
        )}

        {/* Series grid / list */}
        {activeView === 'series' && !seriesLoading && !seriesError && seriesList.length > 0 && (
          currentView === 'list' ? (
            <div className="flex flex-col gap-4">
              {seriesList.map(series => (
                <SeriesCard key={series.name} series={series} variant={bookCardVariant} />
              ))}
            </div>
          ) : (
            <div className={manifestGridClass}>
              {seriesList.map(series => (
                <SeriesCard key={series.name} series={series} variant={bookCardVariant} />
              ))}
            </div>
          )
        )}
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        categories={['All', ...categories]}
        selectedCategory={category}
        onCategoryChange={(cat) => {
          setCategory(cat)
          updateUrlParams({ category: cat })
        }}
        statuses={['Any', 'Unread', 'In Progress', 'Finished', 'Abandoned']}
        selectedStatus={status}
        onStatusChange={(s) => {
          setStatus(s)
          updateUrlParams({ status: s })
        }}
        readTimeTiers={READ_TIME_FILTERS.filter(f => f.value !== '')}
        selectedReadTime={readTimeFilter}
        onReadTimeChange={(rt) => {
          setReadTimeFilter(rt)
          updateUrlParams({ readTime: rt })
        }}
        onOpenTagsModal={() => setTagsModalOpen(true)}
        selectedTagsCount={selectedTags.length}
        onClearAll={handleClearFilters}
        showLibraryFilters={activeView === 'library'}
        // Enhanced metadata filters (Phase 7.2)
        selectedFandom={fandom}
        onOpenFandomModal={() => setFandomModalOpen(true)}
        selectedContentRating={contentRating}
        onContentRatingChange={(ratings) => {
          setContentRating(ratings)
          updateUrlParams({ contentRating: ratings })
        }}
        selectedCompletionStatus={completionStatus}
        onCompletionStatusChange={(statuses) => {
          setCompletionStatus(statuses)
          updateUrlParams({ completionStatus: statuses })
        }}
        selectedShip={ship}
        onOpenShipModal={() => setShipModalOpen(true)}
        selectedFormats={selectedFormats}
        onFormatsChange={(formats) => {
          setSelectedFormats(formats)
          updateUrlParams({ format: formats.length > 0 ? formats.join(',') : '' })
        }}
      />

      {/* Search Modal (mobile) */}
      {searchModalOpen && (
        <SearchModal
          onClose={() => setSearchModalOpen(false)}
          onApplyFilter={(searchTerm) => {
            setSearch(searchTerm)
            updateUrlParams({ search: searchTerm })
          }}
          currentSearch={search}
        />
      )}

      {/* Fandom Modal */}
      <FandomModal
        isOpen={fandomModalOpen}
        onClose={() => setFandomModalOpen(false)}
        selectedFandom={fandom}
        onApply={(f) => {
          setFandom(f)
          updateUrlParams({ fandom: f })
        }}
      />

      {/* Ship Modal */}
      <ShipModal
        isOpen={shipModalOpen}
        onClose={() => setShipModalOpen(false)}
        selectedShip={ship}
        onApply={(s) => {
          setShip(s)
          updateUrlParams({ ship: s })
        }}
      />

      {/* Tags Modal - keep existing */}
      <TagsModal
        isOpen={tagsModalOpen}
        onClose={() => setTagsModalOpen(false)}
        selectedTags={selectedTags}
        onApply={(tags) => {
          setSelectedTags(tags)
          updateUrlParams({ tags })
        }}
        category={category}
      />

      {contextMenu.show && (
        <BookContextMenu
          book={contextMenu.book}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onMarkFinished={() => {
            setSelectedBook(contextMenu.book)
            setShowMarkFinished(true)
          }}
          onChangeStatus={() => {
            setSelectedBook(contextMenu.book)
            setShowChangeStatus(true)
          }}
          onClose={() => setContextMenu({ show: false, book: null, x: 0, y: 0 })}
        />
      )}

      {showMarkFinished && selectedBook && (
        <MarkFinishedModal
          book={selectedBook}
          onConfirm={handleMarkFinished}
          onClose={() => { setShowMarkFinished(false); setSelectedBook(null); }}
        />
      )}

      {showChangeStatus && selectedBook && (
        <ChangeStatusModal
          book={selectedBook}
          onConfirm={handleChangeStatus}
          onClose={() => { setShowChangeStatus(false); setSelectedBook(null); }}
        />
      )}

    </div>
  )
}

export default Library
