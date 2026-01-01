import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
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

function Library() {
  const [searchParams, setSearchParams] = useSearchParams()
  
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
  
  // Enhanced metadata filters (Phase 7.2)
  const [fandom, setFandom] = useState(searchParams.get('fandom') || '')
  const [contentRating, setContentRating] = useState(
    searchParams.get('contentRating') ? searchParams.get('contentRating').split(',') : []
  )
  const [completionStatus, setCompletionStatus] = useState(
    searchParams.get('completionStatus') ? searchParams.get('completionStatus').split(',') : []
  )
  const [ship, setShip] = useState(searchParams.get('ship') || '')
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
       fandom || contentRating.length > 0 || completionStatus.length > 0 || ship)
    : (category || search) // Series view only has category and search

  // Count active filters for badge
  // Only count filters relevant to current view
  const activeFilterCount = activeView === 'library'
    ? [category, status, selectedTags.length > 0, readTimeFilter, search,
       fandom, contentRating.length > 0, completionStatus.length > 0, ship].filter(Boolean).length
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
      })
      .catch(err => console.error('Failed to load settings:', err))
  }, [])

  // Listen for settings changes from SettingsDrawer
  useEffect(() => {
    const handleSettingsChange = (event) => {
      if (event.detail.grid_columns) {
        setGridColumns(event.detail.grid_columns)
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
  }, [category, status, selectedTags, search, sort, sortDir, acquisition, fandom, contentRating, completionStatus, ship])

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
  }, [category, status, selectedTags, search, activeView, readTimeFilter, acquisition, fandom, contentRating, completionStatus, ship])

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
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      {/* Toggle Bar + Search/Filter - Sticky below header */}
      <div className="sticky top-[57px] z-30 bg-library-bg">
        {/* Mobile Layout */}
        <div className="md:hidden px-4 pt-3">
          <div className="flex items-center justify-between">
            {/* Toggle Bar - always show in library view */}
            {activeView === 'library' && (
              <div className="inline-flex rounded-lg bg-library-card p-1">
                <button
                  onClick={() => {
                    setAcquisition('owned')
                    updateUrlParams({ acquisition: 'owned' })
                  }}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                    acquisition === 'owned'
                      ? 'bg-library-accent text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    setAcquisition('browse')
                    updateUrlParams({ acquisition: 'browse' })
                  }}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                    acquisition === 'browse'
                      ? 'bg-library-accent text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Browse
                </button>
                <button
                  onClick={() => {
                    setAcquisition('wishlist')
                    updateUrlParams({ acquisition: 'wishlist' })
                  }}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                    acquisition === 'wishlist'
                      ? 'bg-library-accent text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Wishlist
                </button>
              </div>
            )}
            
            {/* Search & Filter Icons - hide on Home tab */}
            {!(activeView === 'library' && acquisition === 'owned') && (
              <SearchBar
                iconsOnly={true}
                showFilter={true}
                filterCount={activeFilterCount}
                searchActive={!!search}
                onSearchClick={() => setSearchModalOpen(true)}
                onFilterClick={() => setFilterDrawerOpen(true)}
              />
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block px-8 pt-3">
          <div className="flex items-center gap-4">
            {/* Toggle Bar - always show in library view */}
            {activeView === 'library' && (
              <div className="inline-flex rounded-lg bg-library-card p-1">
                <button
                  onClick={() => {
                    setAcquisition('owned')
                    updateUrlParams({ acquisition: 'owned' })
                  }}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                    acquisition === 'owned'
                      ? 'bg-library-accent text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    setAcquisition('browse')
                    updateUrlParams({ acquisition: 'browse' })
                  }}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                    acquisition === 'browse'
                      ? 'bg-library-accent text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Browse
                </button>
                <button
                  onClick={() => {
                    setAcquisition('wishlist')
                    updateUrlParams({ acquisition: 'wishlist' })
                  }}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                    acquisition === 'wishlist'
                      ? 'bg-library-accent text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Wishlist
                </button>
              </div>
            )}
            
            {/* Inline Search Bar - hide on Home tab */}
            {!(activeView === 'library' && acquisition === 'owned') && (
              <SearchBar
                value={search}
                onChange={(value) => {
                  setSearch(value)
                  updateUrlParams({ search: value })
                }}
                placeholder={activeView === 'series' ? 'Search series...' : 'Search books...'}
                showFilter={true}
                filterCount={activeFilterCount}
                onFilterClick={() => setFilterDrawerOpen(true)}
              />
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
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="relative flex items-center">
                  <select
                    value={sort}
                    onChange={(e) => {
                      const newSort = e.target.value
                      // Set logical default direction based on sort field
                      const newDir = (newSort === 'title' || newSort === 'author') ? 'asc' : 'desc'
                      setSort(newSort)
                      setSortDir(newDir)
                      updateUrlParams({ sort: newSort, sortDir: newDir })
                    }}
                    className="appearance-none bg-transparent text-gray-500 text-xs pr-4 cursor-pointer hover:text-white focus:outline-none"
                  >
                    <option value="added">Recently Added</option>
                    <option value="title">Title</option>
                    <option value="author">Author</option>
                    <option value="published">Recently Published</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    const newDir = sortDir === 'asc' ? 'desc' : 'asc'
                    setSortDir(newDir)
                    updateUrlParams({ sortDir: newDir })
                  }}
                  className="text-gray-500 hover:text-white text-xs p-1 transition-colors"
                  title={sortDir === 'asc' ? 'Ascending (click to reverse)' : 'Descending (click to reverse)'}
                >
                  {sortDir === 'asc' ? '↑' : '↓'}
                </button>
              </div>
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
              <BookCard key={book.id} book={book} />
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
