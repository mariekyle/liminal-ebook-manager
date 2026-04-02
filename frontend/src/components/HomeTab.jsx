import { useState, useEffect, useCallback } from 'react'
import {
  getHomeInProgress,
  getHomeRecentlyAdded,
  getHomeDiscover,
  getHomeQuickReads,
  getHomeStats,
  getSettings,
} from '../api'
import BookCard from './BookCard'
import Button from './ui/Button'
import IconButton from './ui/IconButton'

function SectionError({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
      <p className="text-body-sm text-text-secondary mb-1">Well, that wasn&apos;t supposed to happen.</p>
      <p className="text-caption text-text-muted mb-4">This section couldn&apos;t load right now.</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

function HomeTab() {
  const [inProgress, setInProgress] = useState([])
  const [recentlyAdded, setRecentlyAdded] = useState([])
  const [discover, setDiscover] = useState([])
  const [stats, setStats] = useState(null)
  const [statsPeriod, setStatsPeriod] = useState('month')
  const [wpm, setWpm] = useState(250)

  const [loadingInProgress, setLoadingInProgress] = useState(true)
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [loadingDiscover, setLoadingDiscover] = useState(true)
  const [quickReads, setQuickReads] = useState([])
  const [loadingQuickReads, setLoadingQuickReads] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)

  const [errorInProgress, setErrorInProgress] = useState(null)
  const [errorRecent, setErrorRecent] = useState(null)
  const [errorDiscover, setErrorDiscover] = useState(null)
  const [errorQuickReads, setErrorQuickReads] = useState(null)
  const [errorStats, setErrorStats] = useState(null)

  // Load settings for WPM
  useEffect(() => {
    getSettings()
      .then(settings => {
        if (settings.reading_wpm) {
          setWpm(parseInt(settings.reading_wpm, 10) || 250)
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
  }, [])

  const loadInProgress = useCallback(() => {
    setLoadingInProgress(true)
    setErrorInProgress(null)
    getHomeInProgress()
      .then(data => setInProgress(data.books || []))
      .catch(err => setErrorInProgress(err.message || 'Failed to load'))
      .finally(() => setLoadingInProgress(false))
  }, [])

  const loadRecentlyAdded = useCallback(() => {
    setLoadingRecent(true)
    setErrorRecent(null)
    getHomeRecentlyAdded()
      .then(data => setRecentlyAdded(data.books || []))
      .catch(err => setErrorRecent(err.message || 'Failed to load'))
      .finally(() => setLoadingRecent(false))
  }, [])

  const loadDiscover = useCallback(() => {
    setLoadingDiscover(true)
    setErrorDiscover(null)
    getHomeDiscover()
      .then(data => setDiscover(data.books || []))
      .catch(err => setErrorDiscover(err.message || 'Failed to load'))
      .finally(() => setLoadingDiscover(false))
  }, [])

  const loadQuickReads = useCallback(() => {
    setLoadingQuickReads(true)
    setErrorQuickReads(null)
    getHomeQuickReads()
      .then(data => setQuickReads(data.books || []))
      .catch(err => setErrorQuickReads(err.message || 'Failed to load'))
      .finally(() => setLoadingQuickReads(false))
  }, [])

  const loadStats = useCallback(() => {
    setLoadingStats(true)
    setErrorStats(null)
    getHomeStats(statsPeriod)
      .then(data => setStats(data))
      .catch(err => setErrorStats(err.message || 'Failed to load'))
      .finally(() => setLoadingStats(false))
  }, [statsPeriod])

  useEffect(() => {
    loadInProgress()
  }, [loadInProgress])

  useEffect(() => {
    loadRecentlyAdded()
  }, [loadRecentlyAdded])

  useEffect(() => {
    loadDiscover()
  }, [loadDiscover])

  useEffect(() => {
    loadQuickReads()
  }, [loadQuickReads])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const allSectionsFailed =
    errorInProgress &&
    errorRecent &&
    errorDiscover &&
    errorQuickReads &&
    errorStats &&
    !loadingInProgress &&
    !loadingRecent &&
    !loadingDiscover &&
    !loadingQuickReads &&
    !loadingStats

  const retryEntirePage = useCallback(() => {
    loadInProgress()
    loadRecentlyAdded()
    loadDiscover()
    loadQuickReads()
    loadStats()
  }, [loadInProgress, loadRecentlyAdded, loadDiscover, loadQuickReads, loadStats])

  // Format reading time from words
  const formatReadingTime = words => {
    if (!words) return '0 min'
    const minutes = Math.round(words / wpm)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    if (remainingMins === 0) return `${hours} hr`
    return `${hours} hr ${remainingMins} min`
  }

  // Format large numbers
  const formatNumber = num => {
    if (!num) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  if (allSectionsFailed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
        <p className="text-body-sm text-text-secondary mb-1">Well, that wasn&apos;t supposed to happen.</p>
        <p className="text-caption text-text-muted mb-4">The home screen couldn&apos;t load right now.</p>
        <Button variant="secondary" size="sm" onClick={retryEntirePage}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Currently Reading Section */}
      <section>
        <h2 className="text-h4 mb-3 px-4 md:px-0">Currently Reading</h2>

        {loadingInProgress ? (
          <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-shrink-0 w-32 animate-pulse">
                <div className="aspect-[2/3] bg-bg-surface rounded-lg" />
                <div className="mt-2 h-4 bg-bg-surface rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : errorInProgress ? (
          <SectionError onRetry={loadInProgress} />
        ) : inProgress.length === 0 ? (
          <div className="px-4 md:px-0 py-8 text-center">
            <p className="text-body-sm text-text-secondary italic">
              Every journey begins with a single page. What will you start today?
            </p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-2 scrollbar-hide">
            {inProgress.map(book => (
              <div key={book.id} className="flex-shrink-0 w-32">
                <BookCard
                  book={book}
                  variant="compact"
                  wpm={wpm}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recently Added Section */}
      {(loadingRecent || recentlyAdded.length > 0 || errorRecent) && (
        <section>
          <h2 className="text-h4 mb-3 px-4 md:px-0">Recently Added</h2>

          {loadingRecent ? (
            <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-shrink-0 w-32 animate-pulse">
                  <div className="aspect-[2/3] bg-bg-surface rounded-lg" />
                  <div className="mt-2 h-4 bg-bg-surface rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : errorRecent ? (
            <SectionError onRetry={loadRecentlyAdded} />
          ) : (
            <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-2 scrollbar-hide">
              {recentlyAdded.map(book => (
                <div key={book.id} className="flex-shrink-0 w-32">
                  <BookCard
                    book={book}
                    variant="compact"
                    wpm={wpm}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Discover Section */}
      {(loadingDiscover || discover.length > 0 || errorDiscover) && (
        <section>
          <div className="flex items-center justify-between mb-3 px-4 md:px-0">
            <h2 className="text-h4">Discover Something New</h2>
            <IconButton
              type="button"
              variant="default"
              size="md"
              tooltip="Get new suggestions"
              aria-label="Refresh suggestions"
              onClick={loadDiscover}
              disabled={loadingDiscover}
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
            </IconButton>
          </div>

          {loadingDiscover ? (
            <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-shrink-0 w-32 animate-pulse">
                  <div className="aspect-[2/3] bg-bg-surface rounded-lg" />
                  <div className="mt-2 h-4 bg-bg-surface rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : errorDiscover ? (
            <SectionError onRetry={loadDiscover} />
          ) : (
            <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-2 scrollbar-hide">
              {discover.map(book => (
                <div key={book.id} className="flex-shrink-0 w-32">
                  <BookCard
                    book={book}
                    variant="compact"
                    wpm={wpm}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Quick Reads Section */}
      {(loadingQuickReads || quickReads.length > 0 || errorQuickReads) && (
        <section>
          <h2 className="text-h4 mb-3 px-4 md:px-0">
            Quick Reads
            <span className="text-caption text-text-muted font-normal ml-2">Under 3 hours</span>
          </h2>

          {loadingQuickReads ? (
            <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-shrink-0 w-32 animate-pulse">
                  <div className="aspect-[2/3] bg-bg-surface rounded-lg" />
                  <div className="mt-2 h-4 bg-bg-surface rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : errorQuickReads ? (
            <SectionError onRetry={loadQuickReads} />
          ) : (
            <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-2 scrollbar-hide">
              {quickReads.map(book => (
                <div key={book.id} className="flex-shrink-0 w-32">
                  <BookCard
                    book={book}
                    variant="compact"
                    wpm={wpm}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Stats Section */}
      <section className="px-4 md:px-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h4">Your Reading</h2>
          <select
            value={statsPeriod}
            onChange={e => setStatsPeriod(e.target.value)}
            className="bg-bg-surface text-label px-3 py-1 rounded-lg border border-border-default focus:outline-none focus:border-action-primary min-h-[44px]"
          >
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {loadingStats ? (
          <div className="bg-bg-surface rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-bg-elevated rounded w-1/3 mb-4" />
            <div className="h-4 bg-bg-elevated rounded w-1/2 mb-2" />
            <div className="h-4 bg-bg-elevated rounded w-2/3" />
          </div>
        ) : errorStats ? (
          <SectionError onRetry={loadStats} />
        ) : stats ? (
          <div className="bg-bg-surface rounded-lg p-4">
            <p className="text-caption text-text-muted mb-3">{stats.period_label}</p>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-h2">{formatNumber(stats.words_read)}</p>
                <p className="text-caption text-text-muted">words read</p>
              </div>
              <div>
                <p className="text-h2">{formatReadingTime(stats.words_read)}</p>
                <p className="text-caption text-text-muted">reading time</p>
              </div>
              <div>
                <p className="text-h2">{stats.titles_finished}</p>
                <p className="text-caption text-text-muted">titles finished</p>
              </div>
            </div>

            {/* Category breakdown */}
            {stats.categories && stats.categories.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-border-default">
                {stats.categories.map(cat => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <span className="text-body-sm text-text-secondary w-24 truncate">{cat.name}</span>
                    <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full bg-action-primary rounded-full transition-all duration-500"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <span className="text-caption text-text-muted w-8 text-right">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state for stats */}
            {stats.titles_finished === 0 && (
              <p className="text-body-sm text-text-muted text-center py-2">
                No titles finished yet this {statsPeriod === 'month' ? 'month' : 'year'}
              </p>
            )}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default HomeTab
