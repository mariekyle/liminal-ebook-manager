import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { listBooks, getCategories, listSeries, getSettings } from '../api'
import BookCard from './BookCard'
import SeriesCard from './SeriesCard'
import TagsModal from './TagsModal'
import { getRandomPhrase } from '../utils/categoryPhrases'
import { READ_TIME_FILTERS, matchesReadTimeFilter } from '../utils/readTime'

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
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'title')
  const [categories, setCategories] = useState([])
  const [readTimeFilter, setReadTimeFilter] = useState(searchParams.get('readTime') || '')
  const [wpm, setWpm] = useState(250)
  
  // View state (tabs) - initialize from URL
  const [activeView, setActiveView] = useState(searchParams.get('view') || 'library')
  
  // Series state
  const [seriesList, setSeriesList] = useState([])
  const [seriesTotal, setSeriesTotal] = useState(0)
  const [seriesLoading, setSeriesLoading] = useState(false)
  const [seriesError, setSeriesError] = useState(null)

  // Scroll state for collapsible header
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollY = useRef(0)
  const libraryScrollRef = useRef(null)
  const seriesScrollRef = useRef(null)
  
  // Phrase state - regenerates on filter/search changes
  const [phraseKey, setPhraseKey] = useState(0)

  // Check if any filters are active (excluding "All" category and default sort)
  const hasActiveFilters = category || status || selectedTags.length > 0 || search || readTimeFilter

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

  // Load WPM setting
  useEffect(() => {
    getSettings()
      .then(settings => {
        if (settings.reading_wpm) {
          setWpm(parseInt(settings.reading_wpm, 10) || 250)
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
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
  }, [category, status, selectedTags, search, sort])

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
  }, [category, status, selectedTags, search, activeView, readTimeFilter])

  // Scroll detection for collapsible header
  // Dependencies: activeView (tab switch), loading states (container appears after load)
  useEffect(() => {
    // Select the correct ref based on active view
    const container = activeView === 'library' 
      ? libraryScrollRef.current 
      : seriesScrollRef.current
    
    if (!container) return

    // Reset scroll tracking for new view/container
    lastScrollY.current = 0
    setHeaderVisible(true)

    const handleScroll = () => {
      const currentScrollY = container.scrollTop
      const scrollingDown = currentScrollY > lastScrollY.current
      const scrolledPastThreshold = currentScrollY > 50
      
      if (scrollingDown && scrolledPastThreshold) {
        setHeaderVisible(false)
      } else if (!scrollingDown) {
        setHeaderVisible(true)
      }
      
      lastScrollY.current = currentScrollY
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => container.removeEventListener('scroll', handleScroll)
  }, [activeView, loading, seriesLoading])

  // Sync FROM URL params TO state (for browser back/forward navigation)
  // Only runs when searchParams changes (from browser navigation), not when state changes
  useEffect(() => {
    const urlCategory = searchParams.get('category') || ''
    const urlStatus = searchParams.get('status') || ''
    const urlTags = searchParams.get('tags') ? searchParams.get('tags').split(',') : []
    const urlSearch = searchParams.get('search') || ''
    const urlSort = searchParams.get('sort') || 'title'
    const urlView = searchParams.get('view') || 'library'
    const urlReadTime = searchParams.get('readTime') || ''
    
    // Update state from URL values
    setCategory(urlCategory)
    setStatus(urlStatus)
    setSelectedTags(urlTags)
    setSearch(urlSearch)
    setSort(urlSort)
    setActiveView(urlView)
    setReadTimeFilter(urlReadTime)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Update URL params without triggering re-sync
  const updateUrlParams = useCallback((updates) => {
    const params = new URLSearchParams(searchParams)
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined || 
          (Array.isArray(value) && value.length === 0) ||
          (key === 'sort' && value === 'title') ||
          (key === 'view' && value === 'library')) {
        params.delete(key)
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','))
      } else {
        params.set(key, value)
      }
    })
    
    setSearchParams(params, { replace: true })
  }, [searchParams, setSearchParams])

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Collapsed Header Bar - shows when scrolled */}
      {!headerVisible && hasActiveFilters && (
        <button 
          onClick={() => setHeaderVisible(true)}
          className="flex-shrink-0 w-full px-4 py-2 bg-gray-800/80 border-b border-gray-700 flex items-center gap-3 text-sm"
        >
          <span className="text-gray-400">▼</span>
          
          {search && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-700 rounded text-gray-200">
              🔍 "{search}"
            </span>
          )}
          
          {(category || status || selectedTags.length > 0) && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-library-accent/30 text-library-accent rounded">
              {[category ? 1 : 0, status ? 1 : 0, selectedTags.length].reduce((a, b) => a + b, 0)} filter{[category ? 1 : 0, status ? 1 : 0, selectedTags.length].reduce((a, b) => a + b, 0) > 1 ? 's' : ''}
            </span>
          )}
          
          <span className="ml-auto text-gray-500 text-xs">tap to expand</span>
        </button>
      )}

      {!headerVisible && !hasActiveFilters && (
        <button 
          onClick={() => setHeaderVisible(true)}
          className="flex-shrink-0 w-full px-4 py-2 bg-gray-800/50 border-b border-gray-700 flex items-center justify-center gap-2 text-sm text-gray-400"
        >
          <span>▼</span>
          <span>Search & Filters</span>
        </button>
      )}

      {/* Expandable Header */}
      <div 
        className={`flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
          headerVisible ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {/* Search Bar - Full Width */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search books..."
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                updateUrlParams({ search: e.target.value })
              }}
              className="w-full bg-library-card text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-library-accent focus:outline-none"
            />
            {search && (
              <button 
                onClick={() => {
                  setSearch('')
                  updateUrlParams({ search: '' })
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-4 flex justify-center gap-8 border-b border-gray-700">
          <button
            onClick={() => {
              setActiveView('library')
              updateUrlParams({ view: 'library' })
            }}
            className={`pb-2 text-sm font-medium transition-colors relative ${
              activeView === 'library'
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Library
            {activeView === 'library' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-library-accent" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveView('series')
              updateUrlParams({ view: 'series' })
            }}
            className={`pb-2 text-sm font-medium transition-colors relative ${
              activeView === 'series'
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Series
            {activeView === 'series' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-library-accent" />
            )}
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="pb-2 text-sm font-medium transition-colors relative text-gray-400 hover:text-gray-300"
          >
            Upload
          </button>
        </div>

        {/* Unified Filter Bar */}
        <div className="mb-4 flex items-center justify-center gap-2 flex-wrap">
          {/* Category Pills */}
          <button
            onClick={() => {
              setCategory('')
              updateUrlParams({ category: '' })
            }}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              category === ''
                ? 'bg-library-accent text-white'
                : 'bg-transparent text-gray-300 border border-gray-500 hover:border-gray-400'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat)
                updateUrlParams({ category: cat })
              }}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-library-accent text-white'
                  : 'bg-transparent text-gray-300 border border-gray-500 hover:border-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
          
          {/* Separator - Library view only */}
          {activeView === 'library' && (
            <div className="w-px h-6 bg-gray-600 mx-2" />
          )}
          
          {/* Status Filter - Library view only */}
          {activeView === 'library' && (
            <div className="relative">
              <select
                value={status}
                onChange={e => {
                  setStatus(e.target.value)
                  updateUrlParams({ status: e.target.value })
                }}
                className={`appearance-none px-4 py-1.5 pr-8 rounded-full text-sm cursor-pointer transition-colors ${
                  status
                    ? 'bg-gray-700 text-white border border-gray-600'
                    : 'bg-transparent text-gray-300 border border-gray-500 hover:border-gray-400'
                }`}
              >
                <option value="">Status</option>
                <option value="Unread">Unread</option>
                <option value="In Progress">In Progress</option>
                <option value="Finished">Finished</option>
                <option value="DNF">DNF</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">▼</span>
            </div>
          )}
          
          {/* Tags Button - Library view only */}
          {activeView === 'library' && (
            <button
              onClick={() => setTagsModalOpen(true)}
              className={`px-4 py-1.5 rounded-full text-sm flex items-center gap-2 transition-colors ${
                selectedTags.length > 0
                  ? 'bg-gray-700 text-white border border-gray-600'
                  : 'bg-transparent text-gray-300 border border-gray-500 hover:border-gray-400'
              }`}
            >
              Tags
              {selectedTags.length > 0 && (
                <span className="bg-library-accent/30 text-library-accent px-1.5 py-0.5 rounded text-xs">
                  {selectedTags.length}
                </span>
              )}
              <span className="text-xs text-gray-400">▼</span>
            </button>
          )}
          
          {/* Sort Filter - Library view only */}
          {activeView === 'library' && (
            <div className="relative">
              <select
                value={sort}
                onChange={e => {
                  setSort(e.target.value)
                  updateUrlParams({ sort: e.target.value })
                }}
                className="appearance-none px-4 py-1.5 pr-8 rounded-full text-sm bg-transparent text-gray-300 border border-gray-500 hover:border-gray-400 cursor-pointer"
              >
                <option value="title">Sort: Title</option>
                <option value="author">Sort: Author</option>
                <option value="series">Sort: Series</option>
                <option value="year">Sort: Year</option>
                <option value="updated">Sort: Updated</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">▼</span>
            </div>
          )}
          
          {/* Read Time Filter - Library view only */}
          {activeView === 'library' && (
            <div className="relative">
              <select
                value={readTimeFilter}
                onChange={e => {
                  setReadTimeFilter(e.target.value)
                  updateUrlParams({ readTime: e.target.value })
                }}
                className={`appearance-none px-4 py-1.5 pr-8 rounded-full text-sm cursor-pointer transition-colors ${
                  readTimeFilter
                    ? 'bg-gray-700 text-white border border-gray-600'
                    : 'bg-transparent text-gray-300 border border-gray-500 hover:border-gray-400'
                }`}
              >
                {READ_TIME_FILTERS.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">▼</span>
            </div>
          )}
        </div>

        {/* Active Filters Row - Only show when filters are active */}
        {activeView === 'library' && hasActiveFilters && (
          <div className="mb-4 flex items-center justify-center gap-2 flex-wrap p-3 bg-gray-800/50 rounded-lg">
            <span className="text-gray-500 text-xs uppercase tracking-wide mr-1">Filtering:</span>
            
            {/* Category filter tag */}
            {category && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-700 rounded text-sm text-gray-200">
                {category}
                <button
                  onClick={() => {
                    setCategory('')
                    updateUrlParams({ category: '' })
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
            
            {/* Status filter tag */}
            {status && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-700 rounded text-sm text-gray-200">
                status: {status}
                <button
                  onClick={() => {
                    setStatus('')
                    updateUrlParams({ status: '' })
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
            
            {/* Search filter tag */}
            {search && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-700 rounded text-sm text-gray-200">
                search: "{search}"
                <button
                  onClick={() => {
                    setSearch('')
                    updateUrlParams({ search: '' })
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
            
            {/* Tag filter tags */}
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-700 rounded text-sm text-gray-200"
              >
                {tag}
                <button
                  onClick={() => {
                    const newTags = selectedTags.filter(t => t !== tag)
                    setSelectedTags(newTags)
                    updateUrlParams({ tags: newTags })
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
            
            {/* Read time filter tag */}
            {readTimeFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-700 rounded text-sm text-gray-200">
                {READ_TIME_FILTERS.find(f => f.value === readTimeFilter)?.label}
                <button
                  onClick={() => {
                    setReadTimeFilter('')
                    updateUrlParams({ readTime: '' })
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
            
            {/* Clear All button */}
            <button
              onClick={() => {
                setCategory('')
                setStatus('')
                setSearch('')
                setSelectedTags([])
                setSort('title')
                setReadTimeFilter('')
                setSearchParams({}, { replace: true })
              }}
              className="ml-auto text-library-accent text-sm hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Loading State - Library */}
      {activeView === 'library' && loading && (
        <div className="text-center py-12">
          <div className="animate-pulse-slow text-4xl mb-4">📚</div>
          <p className="text-gray-400">Loading library...</p>
        </div>
      )}

      {/* Error State - Library */}
      {activeView === 'library' && error && !loading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State - Library */}
      {activeView === 'library' && !loading && !error && filteredBooks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔭</div>
          <p className="text-gray-400 mb-4">No books found</p>
          <p className="text-gray-500 text-sm">
            {search || category || status || readTimeFilter
              ? 'Try adjusting your filters' 
              : 'Click "Sync Library" to scan your book folders'
            }
          </p>
        </div>
      )}

      {/* Book Grid - Library View */}
      {activeView === 'library' && !loading && !error && filteredBooks.length > 0 && (
        <div ref={libraryScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Poetic phrase */}
          <div className="text-center py-4 mb-2">
            <p className="text-gray-400 text-sm italic">
              {currentPhrase}
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-4">
            {filteredBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
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
        <div ref={seriesScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Poetic phrase for series */}
          <div className="text-center py-4 mb-2">
            <p className="text-gray-400 text-sm italic">
              {seriesTotal} series. Stories that needed more than one book.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-4">
            {seriesList.map(series => (
              <SeriesCard key={series.name} series={series} />
            ))}
          </div>
        </div>
      )}

      {/* Tags Modal */}
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
