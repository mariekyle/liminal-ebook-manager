import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { listBooks, getCategories, listSeries, getSettings } from '../api'
import BookCard from './BookCard'
import SeriesCard from './SeriesCard'
import TagsModal from './TagsModal'
import { getRandomPhrase } from '../utils/categoryPhrases'
import { READ_TIME_FILTERS, matchesReadTimeFilter } from '../utils/readTime'
import SearchBar from './SearchBar'
import FilterDrawer from './FilterDrawer'
import HomeTab from './HomeTab'
import SearchModal from './SearchModal'
import FandomModal from './FandomModal'
import ShipModal from './ShipModal'
import SortDropdown from './SortDropdown'

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
  const [gridColumns, setGridColumns] = useState('2')
  const [showTitleBelow, setShowTitleBelow] = useState(false)
  const [showAuthorBelow, setShowAuthorBelow] = useState(false)
  const [showSeriesBelow, setShowSeriesBelow] = useState(false)
  
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

  // Load settings (WPM, grid columns)
  useEffect(() => {
    getSettings()
      .then(settings => {
        if (settings.reading_wpm) {
          setWpm(parseInt(settings.reading_wpm, 10) || 250)
        }
        if (settings.grid_columns) {
          setGridColumns(settings.grid_columns)
        }
        if (settings.show_title_below !== undefined) {
          setShowTitleBelow(settings.show_title_below === 'true')
        }
        if (settings.show_author_below !== undefined) {
          setShowAuthorBelow(settings.show_author_below === 'true')
        }
        if (settings.show_series_below !== undefined) {
          setShowSeriesBelow(settings.show_series_below === 'true')
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
  }, [])

  // Listen for settings changes from SettingsDrawer
  useEffect(() => {
    const handleSettingsChange = (event) => {
      if (event.detail.grid_columns) {
        setGridColumns(event.detail.grid_columns)
      }
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

  // Load books when filters change
  useEffect(() => {
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

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Tab Bar - Now top element */}
      <div className="sticky top-0 z-30 bg-library-bg">
        <div className="flex justify-between items-center px-4 pt-4">
          {/* Tabs on left */}
          {activeView === 'library' && (
            <div className="flex gap-6">
              <button
                onClick={() => {
                  setAcquisition('owned')
                  updateUrlParams({ acquisition: 'owned' })
                }}
                className={`text-sm pb-3 border-b-2 transition-colors ${
                  acquisition === 'owned'
                    ? 'text-library-accent border-library-accent'
                    : 'text-gray-500 border-transparent'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => {
                  setAcquisition('browse')
                  updateUrlParams({ acquisition: 'browse' })
                }}
                className={`text-sm pb-3 border-b-2 transition-colors ${
                  acquisition === 'browse'
                    ? 'text-library-accent border-library-accent'
                    : 'text-gray-500 border-transparent'
                }`}
              >
                Browse
              </button>
              <button
                onClick={() => {
                  setAcquisition('wishlist')
                  updateUrlParams({ acquisition: 'wishlist' })
                }}
                className={`text-sm pb-3 border-b-2 transition-colors ${
                  acquisition === 'wishlist'
                    ? 'text-library-accent border-library-accent'
                    : 'text-gray-500 border-transparent'
                }`}
              >
                Wishlist
              </button>
            </div>
          )}

          {/* Actions on right - context dependent */}
          <div className="flex items-center gap-1">
            {/* Add button - all tabs */}
            <button
              onClick={() => navigate('/add')}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-library-card transition-colors"
              aria-label="Add book"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Search button - all tabs */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-library-card transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Filter button - Browse and Wishlist only */}
            {activeView === 'library' && (acquisition === 'browse' || acquisition === 'wishlist') && (
              <button
                onClick={() => setFilterDrawerOpen(true)}
                className={`relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-library-card transition-colors ${
                  activeFilterCount > 0 ? 'text-library-accent' : 'text-gray-400 hover:text-white'
                }`}
                aria-label="Filter"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-library-accent text-white text-xs rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Poetic phrase + Sort + Active filters - hide on Home tab */}
      {!(activeView === 'library' && acquisition === 'owned') && (
      <div className="px-4 md:px-8 py-3">
        <div className="flex flex-col gap-2">
          {/* Top row: phrase and sort */}
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-xs">
              {activeView === 'series' 
                ? `${seriesTotal} series. Stories that needed more than one book.`
                : acquisition === 'wishlist'
                  ? `${filteredBooks.length} on the wishlist. Dreams waiting to become reality.`
                  : acquisition === 'browse'
                    ? currentPhrase
                    : `${filteredBooks.length} titles. Your library awaits.`
              }
            </p>
            
            {/* Sort dropdown + direction toggle */}
            {activeView === 'library' && (
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
          
          {/* Active filter pills row */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-library-accent/20 text-library-accent rounded-full text-xs">
                  {category}
                  <button 
                    onClick={() => {
                      setCategory('')
                      updateUrlParams({ category: '' })
                    }} 
                    className="hover:text-white ml-0.5"
                  >×</button>
                </span>
              )}
              {/* Library-only filter pills */}
              {activeView === 'library' && status && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-library-accent/20 text-library-accent rounded-full text-xs">
                  {status}
                  <button 
                    onClick={() => {
                      setStatus('')
                      updateUrlParams({ status: '' })
                    }} 
                    className="hover:text-white ml-0.5"
                  >×</button>
                </span>
              )}
              {activeView === 'library' && selectedTags.map(tag => (
                <span 
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-library-accent/20 text-library-accent rounded-full text-xs"
                >
                  {tag}
                  <button 
                    onClick={() => {
                      const newTags = selectedTags.filter(t => t !== tag)
                      setSelectedTags(newTags)
                      updateUrlParams({ tags: newTags })
                    }} 
                    className="hover:text-white ml-0.5"
                  >×</button>
                </span>
              ))}
              {activeView === 'library' && readTimeFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-library-accent/20 text-library-accent rounded-full text-xs">
                  {READ_TIME_FILTERS.find(f => f.value === readTimeFilter)?.label || readTimeFilter}
                  <button 
                    onClick={() => {
                      setReadTimeFilter('')
                      updateUrlParams({ readTime: '' })
                    }} 
                    className="hover:text-white ml-0.5"
                  >×</button>
                </span>
              )}
              {/* Enhanced metadata filter pills */}
              {activeView === 'library' && fandom && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                  {fandom}
                  <button 
                    onClick={() => {
                      setFandom('')
                      updateUrlParams({ fandom: '' })
                    }} 
                    className="hover:text-white ml-0.5"
                  >×</button>
                </span>
              )}
              {activeView === 'library' && ship && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs">
                  {ship}
                  <button 
                    onClick={() => {
                      setShip('')
                      updateUrlParams({ ship: '' })
                    }} 
                    className="hover:text-white ml-0.5"
                  >×</button>
                </span>
              )}
              {activeView === 'library' && contentRating.map(rating => (
                <span 
                  key={rating}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs"
                >
                  {rating}
                  <button 
                    onClick={() => {
                      const newRatings = contentRating.filter(r => r !== rating)
                      setContentRating(newRatings)
                      updateUrlParams({ contentRating: newRatings })
                    }} 
                    className="hover:text-white ml-0.5"
                  >×</button>
                </span>
              ))}
              {activeView === 'library' && completionStatus.map(status => (
                <span 
                  key={status}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs"
                >
                  {status}
                  <button 
                    onClick={() => {
                      const newStatuses = completionStatus.filter(s => s !== status)
                      setCompletionStatus(newStatuses)
                      updateUrlParams({ completionStatus: newStatuses })
                    }} 
                    className="hover:text-white ml-0.5"
                  >×</button>
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
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-900/40 text-blue-300 rounded-full text-xs"
                  >
                    {formatLabels[format] || format}
                    <button
                      onClick={() => {
                        const newFormats = selectedFormats.filter(f => f !== format)
                        setSelectedFormats(newFormats)
                        updateUrlParams({ format: newFormats.length > 0 ? newFormats.join(',') : '' })
                      }}
                      className="hover:text-white ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                )
              })}
              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-library-accent/20 text-library-accent rounded-full text-xs">
                  "{search}"
                  <button 
                    onClick={() => {
                      setSearch('')
                      updateUrlParams({ search: '' })
                    }} 
                    className="hover:text-white ml-0.5"
                  >×</button>
                </span>
              )}
              <button 
                onClick={handleClearFilters}
                className="text-gray-500 text-xs hover:text-white"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Content Area */}
      <div className="flex-1 px-4 md:px-8 pb-8">
        {/* Home Dashboard - show when on Home tab */}
        {activeView === 'library' && acquisition === 'owned' && (
          <HomeTab />
        )}

        {/* Loading State - Library (Browse/Wishlist only) */}
        {activeView === 'library' && acquisition !== 'owned' && loading && (
          <div className="text-center py-12">
            <div className="animate-pulse-slow text-4xl mb-4">📚</div>
            <p className="text-gray-400">Loading library...</p>
          </div>
        )}

        {/* Error State - Library (Browse/Wishlist only) */}
        {activeView === 'library' && acquisition !== 'owned' && error && !loading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Empty State - Library (Browse/Wishlist only) */}
        {activeView === 'library' && acquisition !== 'owned' && !loading && !error && filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔭</div>
            <p className="text-gray-400 mb-4">No books found</p>
            <p className="text-gray-500 text-sm">
              {search || category || status || readTimeFilter
                ? 'Try adjusting your filters' 
                : 'Click "Sync Library" in settings to scan your book folders'
              }
            </p>
          </div>
        )}

        {/* Book Grid - Library View (Browse/Wishlist only) */}
        {activeView === 'library' && acquisition !== 'owned' && !loading && !error && filteredBooks.length > 0 && (
          <div className={`grid gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 ${
            gridColumns === '2' ? 'grid-cols-2' :
            gridColumns === '3' ? 'grid-cols-3' :
            'grid-cols-4'
          }`}>
            {filteredBooks.map(book => (
              <BookCard key={book.id} book={book} showTitleBelow={showTitleBelow} showAuthorBelow={showAuthorBelow} showSeriesBelow={showSeriesBelow} />
            ))}
          </div>
        )}

        {/* Loading State - Series */}
        {activeView === 'series' && seriesLoading && (
          <div className="text-center py-12">
            <div className="animate-pulse-slow text-4xl mb-4">📚</div>
            <p className="text-gray-400">Loading series...</p>
          </div>
        )}

        {/* Error State - Series */}
        {activeView === 'series' && seriesError && !seriesLoading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-400">{seriesError}</p>
          </div>
        )}

        {/* Empty State - Series */}
        {activeView === 'series' && !seriesLoading && !seriesError && seriesList.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-gray-400 mb-4">No series found</p>
            <p className="text-gray-500 text-sm">
              {search || category 
                ? 'Try adjusting your filters' 
                : 'Books with series information will appear here'
              }
            </p>
          </div>
        )}

        {/* Series Grid - Series View */}
        {activeView === 'series' && !seriesLoading && !seriesError && seriesList.length > 0 && (
          <div className={`grid gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 ${
            gridColumns === '2' ? 'grid-cols-2' :
            gridColumns === '3' ? 'grid-cols-3' :
            'grid-cols-4'
          }`}>
            {seriesList.map(series => (
              <SeriesCard key={series.name} series={series} />
            ))}
          </div>
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
        statuses={['Any', 'Unread', 'In Progress', 'Finished', 'DNF']}
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
    </div>
  )
}

export default Library
