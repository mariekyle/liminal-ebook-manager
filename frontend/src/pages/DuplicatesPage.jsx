import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { findDuplicates, mergeTitles } from '../api'
import UnifiedNavBar from '../components/ui/UnifiedNavBar'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

// Stable client-side group ID. Prefers crypto.randomUUID (modern browsers, Android
// WebView ≥ recent) with a math-based fallback so we never crash on older contexts.
const makeGroupKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

// Simple color generator based on string hash (no text display)
function getColorFromString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 45%, 35%)`
}

function DuplicatesPage() {
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  
  // Track selected "keep" book for each group
  const [selections, setSelections] = useState({})
  // Track merge progress per group
  const [merging, setMerging] = useState({})
  const [mergeSuccess, setMergeSuccess] = useState({})
  const [mergeError, setMergeError] = useState({})
  // Track which groups are showing the merge confirmation (one extra tap before merge)
  const [confirmingMerge, setConfirmingMerge] = useState({})

  useEffect(() => {
    scanForDuplicates()
  }, [])

  const scanForDuplicates = async () => {
    setLoading(true)
    setError(null)
    setSelections({})
    setMerging({})
    setMergeSuccess({})
    setMergeError({})
    setConfirmingMerge({})
    try {
      const data = await findDuplicates()
      // Assign a stable client-side key to every group so all per-group state maps
      // (selections, merging, mergeSuccess, mergeError, confirmingMerge) and React's
      // reconciliation key stay correct across mutations (merge-and-remove, rescan).
      const groupsWithKeys = (data.groups || []).map((group) => ({
        ...group,
        _key: makeGroupKey(),
      }))
      setResults({ ...data, groups: groupsWithKeys })
      // Pre-select first book in each group as default "keep"
      const initialSelections = {}
      groupsWithKeys.forEach((group) => {
        if (group.books.length > 0) {
          initialSelections[group._key] = group.books[0].id
        }
      })
      setSelections(initialSelections)
    } catch (err) {
      console.error('Failed to find duplicates:', err)
      setError(err.message || 'Failed to scan for duplicates')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectionChange = (groupKey, bookId) => {
    setSelections(prev => ({ ...prev, [groupKey]: bookId }))
  }

  const handleMergeGroup = async (groupKey) => {
    const group = results.groups.find(g => g._key === groupKey)
    if (!group) return
    const keepId = selections[groupKey]

    if (!keepId) {
      setMergeError(prev => ({ ...prev, [groupKey]: 'Please select a book to keep' }))
      return
    }

    // Get IDs of books to merge (all except the one we're keeping)
    const toMerge = group.books.filter(b => b.id !== keepId).map(b => b.id)

    if (toMerge.length === 0) {
      return
    }

    setMerging(prev => ({ ...prev, [groupKey]: true }))
    setMergeError(prev => ({ ...prev, [groupKey]: null }))
    setConfirmingMerge(prev => ({ ...prev, [groupKey]: false }))

    try {
      // Merge each book into the target sequentially
      for (const sourceId of toMerge) {
        await mergeTitles(keepId, sourceId)
      }

      setMergeSuccess(prev => ({ ...prev, [groupKey]: true }))

      // Remove this group from results after short delay, and drop its entries
      // from every per-group state map. Using _key means we never have to care
      // about array index shifts — each map is a dictionary, not a positional list.
      setTimeout(() => {
        setResults(prev => ({
          ...prev,
          groups: prev.groups.filter(g => g._key !== groupKey),
          total_duplicates: prev.total_duplicates - group.books.length
        }))
        const drop = (obj) => {
          const { [groupKey]: _, ...rest } = obj
          return rest
        }
        setSelections(drop)
        setMerging(drop)
        setMergeSuccess(drop)
        setMergeError(drop)
        setConfirmingMerge(drop)
      }, 1500)

    } catch (err) {
      console.error('Failed to merge:', err)
      setMergeError(prev => ({ ...prev, [groupKey]: err.message || 'Failed to merge' }))
    } finally {
      setMerging(prev => ({ ...prev, [groupKey]: false }))
    }
  }

  const formatSeriesInfo = (book) => {
    if (!book.series) return null
    const num = book.series_number ? ` #${book.series_number}` : ''
    return `${book.series}${num}`
  }

  return (
    <div className="min-h-screen bg-bg-base pb-24">
      <UnifiedNavBar title="Find Duplicates" />

      <div className="max-w-4xl mx-auto px-4 py-4">
        <p className="text-body-sm text-text-secondary mb-6">
          Review and merge duplicate entries in your library
        </p>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <svg className="animate-spin h-10 w-10 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-body text-text-secondary">Scanning library for duplicates...</span>
          </div>
        )}

        {error && (
          <div className="bg-action-danger/10 border border-action-danger/30 rounded-lg p-4 text-action-danger">
            {error}
            <Button type="button" variant="ghost" size="sm" className="ml-4" onClick={scanForDuplicates}>
              Try again
            </Button>
          </div>
        )}

        {results && !loading && (
          <>
            {results.groups.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">✨</div>
                <div className="text-text-primary text-h4 mb-2">No duplicates found</div>
                <div className="text-text-secondary text-body-sm">Your library is clean!</div>
                <Link
                  to="/"
                  className="inline-block mt-6 px-6 py-2 bg-action-primary text-text-primary rounded-lg hover:bg-action-primary-hover transition-colors"
                >
                  Back to Library
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div className="flex items-center justify-between">
                  <div className="text-text-secondary text-body-sm">
                    Found {results.groups.length} potential duplicate {results.groups.length === 1 ? 'group' : 'groups'} ({results.total_duplicates} books)
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={scanForDuplicates}
                    disabled={loading}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    }
                  >
                    Rescan
                  </Button>
                </div>

                {/* Groups */}
                {results.groups.map((group) => (
                  <div
                    key={group._key}
                    className={`bg-bg-surface rounded-lg overflow-hidden border border-border-default transition-opacity ${
                      mergeSuccess[group._key] ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Group Header */}
                    <div className="px-4 py-3 border-b border-border-default flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-caption font-medium ${
                          group.match_type === 'exact' 
                            ? 'bg-action-danger/15 text-action-danger' 
                            : 'bg-action-warning/15 text-action-warning'
                        }`}>
                          {group.match_type === 'exact' ? 'Exact Match' : 'Similar Title'}
                        </span>
                        {group.same_author && (
                          <Badge variant="tint" tone="fanfiction" size="sm" pill={false}>
                            Same Author
                          </Badge>
                        )}
                        <span className="text-text-muted text-body-sm">
                          {group.books.length} books
                        </span>
                      </div>
                      
                      {/* Merge button — hidden during confirmation */}
                      {!mergeSuccess[group._key] && !confirmingMerge[group._key] && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setConfirmingMerge(prev => ({ ...prev, [group._key]: true }))}
                          disabled={merging[group._key] || !selections[group._key]}
                          className="flex items-center gap-2"
                        >
                          {merging[group._key] ? (
                            <>
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Merging...
                            </>
                          ) : (
                            <>Merge into Selected</>
                          )}
                        </Button>
                      )}
                      
                      {mergeSuccess[group._key] && (
                        <span className="text-action-success text-body-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Merged!
                        </span>
                      )}
                    </div>

                    {/* Error */}
                    {mergeError[group._key] && (
                      <div className="px-4 py-2 bg-action-danger/10 text-action-danger text-body-sm border-b border-border-subtle">
                        {mergeError[group._key]}
                      </div>
                    )}

                    {/* Books in group */}
                    <div className="divide-y divide-border-subtle">
                      {group.books.map((book) => (
                        <label
                          key={book.id}
                          className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-elevated/50 transition-colors ${
                            selections[group._key] === book.id ? 'bg-action-primary/10' : ''
                          }`}
                        >
                          {/* Radio button */}
                          <input
                            type="radio"
                            name={`group-${group._key}`}
                            checked={selections[group._key] === book.id}
                            onChange={() => handleSelectionChange(group._key, book.id)}
                            disabled={merging[group._key] || mergeSuccess[group._key]}
                            className="w-4 h-4 text-action-primary bg-bg-elevated border-border-default focus:ring-action-primary focus:ring-offset-bg-surface"
                          />
                          
                          {/* Cover (simple color, no text) */}
                          <div 
                            className="w-10 h-14 flex-shrink-0 rounded"
                            style={{ backgroundColor: getColorFromString(book.title + book.authors) }}
                          />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-text-primary font-medium truncate text-body-sm">
                              {book.title}
                            </div>
                            <div className="text-text-secondary text-body-sm truncate">
                              {book.authors}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-caption text-text-muted">
                              <span>{book.edition_count} {book.edition_count === 1 ? 'edition' : 'editions'}</span>
                              {book.category && (
                                <>
                                  <span>•</span>
                                  <span>{book.category}</span>
                                </>
                              )}
                              {formatSeriesInfo(book) && (
                                <>
                                  <span>•</span>
                                  <span className="text-chip-fanfiction">{formatSeriesInfo(book)}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Keep indicator */}
                          {selections[group._key] === book.id && (
                            <span className="px-2 py-1 bg-action-success/15 text-action-success text-caption rounded">
                              Keep
                            </span>
                          )}

                          {/* View link */}
                          <Link
                            to={`/book/${book.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-text-muted hover:text-text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                            title="View book details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        </label>
                      ))}
                    </div>

                    {/* Help text — default state (hide during active merge so it doesn't duel with the "Merging..." button) */}
                    {!mergeSuccess[group._key] && !confirmingMerge[group._key] && !merging[group._key] && (
                      <div className="px-4 py-3 bg-bg-elevated/50 text-text-muted text-caption border-t border-border-subtle">
                        💡 Select the book to keep, then click &quot;Merge into Selected&quot;. Other books will be merged into it.
                      </div>
                    )}

                    {/* Confirmation row — replaces help text when user taps Merge into Selected */}
                    {!mergeSuccess[group._key] && confirmingMerge[group._key] && (() => {
                      const keptBook = group.books.find(b => b.id === selections[group._key])
                      const mergeCount = group.books.length - 1
                      const keptTitle = keptBook?.title || 'the selected title'
                      return (
                        <div className="px-4 py-3 bg-action-danger/5 border-t border-action-danger/20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-body-sm text-text-primary">
                            Merge {mergeCount} {mergeCount === 1 ? 'title' : 'titles'} into &quot;{keptTitle}&quot;? This can&apos;t be undone.
                          </p>
                          <div className="flex gap-2 sm:flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmingMerge(prev => ({ ...prev, [group._key]: false }))}
                              disabled={merging[group._key]}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleMergeGroup(group._key)}
                              disabled={merging[group._key]}
                            >
                              Merge &amp; Delete
                            </Button>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default DuplicatesPage
