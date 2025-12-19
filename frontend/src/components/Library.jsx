import { useState, useEffect } from 'react'
import { listBooks, getCategories, listSeries } from '../api'
import BookCard from './BookCard'
import SeriesCard from './SeriesCard'
import TagsModal from './TagsModal'

function Library() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)
  
  // Filter state
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [tagsModalOpen, setTagsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('title')
  const [categories, setCategories] = useState([])
  
  // View state (tabs)
  const [activeView, setActiveView] = useState('library')
  
  // Series state
  const [seriesList, setSeriesList] = useState([])
  const [seriesTotal, setSeriesTotal] = useState(0)
  const [seriesLoading, setSeriesLoading] = useState(false)
  const [seriesError, setSeriesError] = useState(null)

  // Check if any filters are active (excluding "All" category and default sort)
  const hasActiveFilters = category || status || selectedTags.length > 0 || search

  // Load categories on mount
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(err => console.error('Failed to load categories:', err))
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

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Search Bar - Full Width */}
      <div className="mb-4 flex-shrink-0">
        <input
          type="text"
          placeholder="Search books..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-library-card text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-library-accent focus:outline-none"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="mb-4 flex gap-8 border-b border-gray-700 flex-shrink-0">
        <button
          onClick={() => setActiveView('library')}
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
          onClick={() => setActiveView('series')}
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
      </div>

      {/* Unified Filter Bar */}
      <div className="mb-4 flex items-center gap-2 flex-wrap flex-shrink-0">
        {/* Category Pills */}
        <button
          onClick={() => setCategory('')}
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
            onClick={() => setCategory(cat)}
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
              onChange={e => setStatus(e.target.value)}
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
              onChange={e => setSort(e.target.value)}
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
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Book/Series Count */}
        <span className="text-gray-500 text-sm">
          {activeView === 'library' ? `${total} books` : `${seriesTotal} series`}
        </span>
      </div>

      {/* Active Filters Row - Only show when filters are active */}
      {activeView === 'library' && hasActiveFilters && (
        <div className="mb-4 flex items-center gap-2 flex-wrap p-3 bg-gray-800/50 rounded-lg flex-shrink-0">
          <span className="text-gray-500 text-xs uppercase tracking-wide mr-1">Filtering:</span>
          
          {/* Category filter tag */}
          {category && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-700 rounded text-sm text-gray-200">
              {category}
              <button
                onClick={() => setCategory('')}
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
                onClick={() => setStatus('')}
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
                onClick={() => setSearch('')}
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
                onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
          
          {/* Clear All button */}
          <button
            onClick={() => {
              setCategory('')
              setStatus('')
              setSearch('')
              setSelectedTags([])
            }}
            className="ml-auto text-library-accent text-sm hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

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
      {activeView === 'library' && !loading && !error && books.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-400 mb-4">No books found</p>
          <p className="text-gray-500 text-sm">
            {search || category || status
              ? 'Try adjusting your filters' 
              : 'Click "Sync Library" to scan your book folders'
            }
          </p>
        </div>
      )}

      {/* Book Grid - Library View */}
      {activeView === 'library' && !loading && !error && books.length > 0 && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-4">
            {books.map(book => (
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
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
        onApply={setSelectedTags}
        category={category}
      />
    </div>
  )
}

export default Library
