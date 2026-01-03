import { useState, useEffect } from 'react'
import { getHomeInProgress, getHomeRecentlyAdded, getHomeDiscover, getHomeQuickReads, getHomeStats, getSettings } from '../api'
import BookCard from './BookCard'

function HomeTab() {
  const [inProgress, setInProgress] = useState([])
  const [recentlyAdded, setRecentlyAdded] = useState([])
  const [discover, setDiscover] = useState([])
  const [stats, setStats] = useState(null)
  const [statsPeriod, setStatsPeriod] = useState('month')
  const [wpm, setWpm] = useState(250)
  const [showTitleBelowCover, setShowTitleBelowCover] = useState(false)
  
  const [loadingInProgress, setLoadingInProgress] = useState(true)
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [loadingDiscover, setLoadingDiscover] = useState(true)
  const [quickReads, setQuickReads] = useState([])
  const [loadingQuickReads, setLoadingQuickReads] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)

  // Load settings for WPM
  useEffect(() => {
    getSettings()
      .then(settings => {
        if (settings.reading_wpm) {
          setWpm(parseInt(settings.reading_wpm, 10) || 250)
        }
        if (settings.show_title_below_cover !== undefined) {
          setShowTitleBelowCover(settings.show_title_below_cover === 'true')
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
  }, [])

  // Listen for display setting changes
  useEffect(() => {
    const handleSettingsChange = (event) => {
      if (event.detail.show_title_below_cover !== undefined) {
        setShowTitleBelowCover(event.detail.show_title_below_cover)
      }
    }
    
    window.addEventListener('settingsChanged', handleSettingsChange)
    return () => window.removeEventListener('settingsChanged', handleSettingsChange)
  }, [])

  // Load in-progress books
  useEffect(() => {
    setLoadingInProgress(true)
    getHomeInProgress()
      .then(data => setInProgress(data.books || []))
      .catch(err => console.error('Failed to load in-progress:', err))
      .finally(() => setLoadingInProgress(false))
  }, [])

  // Load recently added
  useEffect(() => {
    setLoadingRecent(true)
    getHomeRecentlyAdded()
      .then(data => setRecentlyAdded(data.books || []))
      .catch(err => console.error('Failed to load recently added:', err))
      .finally(() => setLoadingRecent(false))
  }, [])

  // Load discover - fresh picks every time
  useEffect(() => {
    loadDiscover()
  }, [])

  const loadDiscover = () => {
    setLoadingDiscover(true)
    getHomeDiscover()
      .then(data => setDiscover(data.books || []))
      .catch(err => console.error('Failed to load discover:', err))
      .finally(() => setLoadingDiscover(false))
  }

  // Load quick reads
  useEffect(() => {
    setLoadingQuickReads(true)
    getHomeQuickReads()
      .then(data => setQuickReads(data.books || []))
      .catch(err => console.error('Failed to load quick reads:', err))
      .finally(() => setLoadingQuickReads(false))
  }, [])

  // Load stats when period changes
  useEffect(() => {
    setLoadingStats(true)
    getHomeStats(statsPeriod)
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load stats:', err))
      .finally(() => setLoadingStats(false))
  }, [statsPeriod])

  // Format reading time from words
  const formatReadingTime = (words) => {
    if (!words) return '0 min'
    const minutes = Math.round(words / wpm)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    if (remainingMins === 0) return `${hours} hr`
    return `${hours} hr ${remainingMins} min`
  }

  // Format large numbers
  const formatNumber = (num) => {
    if (!num) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  return (
    <div className="space-y-8">
      {/* Currently Reading Section */}
      <section>
        <h2 className="text-white text-lg font-medium mb-3 px-4 md:px-0">
          Currently Reading
        </h2>
        
        {loadingInProgress ? (
          <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-shrink-0 w-32 animate-pulse">
                <div className="aspect-[2/3] bg-library-card rounded-lg" />
                <div className="mt-2 h-4 bg-library-card rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : inProgress.length === 0 ? (
          <div className="px-4 md:px-0 py-8 text-center">
            <p className="text-gray-400 italic">
              Every journey begins with a single page. What will you start today?
            </p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-2 scrollbar-hide">
            {inProgress.map(book => (
              <div key={book.id} className="flex-shrink-0 w-32">
                <BookCard book={book} showActivityBar={true} showTitleBelowCover={showTitleBelowCover} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recently Added Section */}
      {(loadingRecent || recentlyAdded.length > 0) && (
        <section>
          <h2 className="text-white text-lg font-medium mb-3 px-4 md:px-0">
            Recently Added
          </h2>
          
          {loadingRecent ? (
            <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-shrink-0 w-32 animate-pulse">
                  <div className="aspect-[2/3] bg-library-card rounded-lg" />
                  <div className="mt-2 h-4 bg-library-card rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-2 scrollbar-hide">
              {recentlyAdded.map(book => (
                <div key={book.id} className="flex-shrink-0 w-32">
                  <BookCard book={book} showTitleBelowCover={showTitleBelowCover} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Discover Section */}
      {(loadingDiscover || discover.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-3 px-4 md:px-0">
            <h2 className="text-white text-lg font-medium">
              Discover Something New
            </h2>
            <button
              onClick={loadDiscover}
              disabled={loadingDiscover}
              className="text-gray-400 hover:text-white transition-colors p-1"
              title="Get new suggestions"
            >
              <svg 
                className={`w-5 h-5 ${loadingDiscover ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>
          </div>
          
          {loadingDiscover ? (
            <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-shrink-0 w-32 animate-pulse">
                  <div className="aspect-[2/3] bg-library-card rounded-lg" />
                  <div className="mt-2 h-4 bg-library-card rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-2 scrollbar-hide">
              {discover.map(book => (
                <div key={book.id} className="flex-shrink-0 w-32">
                  <BookCard book={book} showTitleBelowCover={showTitleBelowCover} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Quick Reads Section */}
      {(loadingQuickReads || quickReads.length > 0) && (
        <section>
          <h2 className="text-white text-lg font-medium mb-3 px-4 md:px-0">
            Quick Reads
            <span className="text-gray-500 text-sm font-normal ml-2">Under 3 hours</span>
          </h2>
          
          {loadingQuickReads ? (
            <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-shrink-0 w-32 animate-pulse">
                  <div className="aspect-[2/3] bg-library-card rounded-lg" />
                  <div className="mt-2 h-4 bg-library-card rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-2 scrollbar-hide">
              {quickReads.map(book => (
                <div key={book.id} className="flex-shrink-0 w-32">
                  <BookCard book={book} showTitleBelowCover={showTitleBelowCover} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Stats Section */}
      <section className="px-4 md:px-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-lg font-medium">
            Your Reading
          </h2>
          <select
            value={statsPeriod}
            onChange={(e) => setStatsPeriod(e.target.value)}
            className="bg-library-card text-gray-300 text-sm px-3 py-1 rounded-lg border border-gray-700 focus:outline-none focus:border-library-accent"
          >
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
        
        {loadingStats ? (
          <div className="bg-library-card rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-700 rounded w-2/3" />
          </div>
        ) : stats ? (
          <div className="bg-library-card rounded-lg p-4">
            <p className="text-gray-500 text-xs mb-3">{stats.period_label}</p>
            
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-2xl font-semibold text-white">
                  {formatNumber(stats.words_read)}
                </p>
                <p className="text-gray-500 text-xs">words read</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">
                  {formatReadingTime(stats.words_read)}
                </p>
                <p className="text-gray-500 text-xs">reading time</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">
                  {stats.titles_finished}
                </p>
                <p className="text-gray-500 text-xs">titles finished</p>
              </div>
            </div>
            
            {/* Category breakdown */}
            {stats.categories && stats.categories.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-gray-700">
                {stats.categories.map(cat => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm w-24 truncate">{cat.name}</span>
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-library-accent rounded-full transition-all duration-500"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <span className="text-gray-500 text-xs w-8 text-right">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Empty state for stats */}
            {stats.titles_finished === 0 && (
              <p className="text-gray-500 text-sm text-center py-2">
                No books finished yet this {statsPeriod === 'month' ? 'month' : 'year'}
              </p>
            )}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default HomeTab

