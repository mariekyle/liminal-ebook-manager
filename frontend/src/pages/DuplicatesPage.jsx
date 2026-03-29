import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { findDuplicates, mergeTitles } from '../api'
import UnifiedNavBar from '../components/ui/UnifiedNavBar'
import Button from '../components/ui/Button'

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

  useEffect(() => {
    scanForDuplicates()
  }, [])

  const scanForDuplicates = async () => {
    setLoading(true)
    setError(null)
    setSelections({})
    setMergeSuccess({})
    setMergeError({})
    try {
      const data = await findDuplicates()
      setResults(data)
      // Pre-select first book in each group as default "keep"
      const initialSelections = {}
      data.groups.forEach((group, idx) => {
        if (group.books.length > 0) {
          initialSelections[idx] = group.books[0].id
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

  const handleSelectionChange = (groupIndex, bookId) => {
    setSelections(prev => ({ ...prev, [groupIndex]: bookId }))
  }

  const handleMergeGroup = async (groupIndex) => {
    const group = results.groups[groupIndex]
    const keepId = selections[groupIndex]
    
    if (!keepId) {
      setMergeError(prev => ({ ...prev, [groupIndex]: 'Please select a book to keep' }))
      return
    }
    
    // Get IDs of books to merge (all except the one we're keeping)
    const toMerge = group.books.filter(b => b.id !== keepId).map(b => b.id)
    
    if (toMerge.length === 0) {
      return
    }
    
    setMerging(prev => ({ ...prev, [groupIndex]: true }))
    setMergeError(prev => ({ ...prev, [groupIndex]: null }))
    
    try {
      // Merge each book into the target sequentially
      for (const sourceId of toMerge) {
        await mergeTitles(keepId, sourceId)
      }
      
      setMergeSuccess(prev => ({ ...prev, [groupIndex]: true }))
      
      // Remove this group from results after short delay
      setTimeout(() => {
        setResults(prev => ({
          ...prev,
          groups: prev.groups.filter((_, idx) => idx !== groupIndex),
          total_duplicates: prev.total_duplicates - group.books.length
        }))
      }, 1500)
      
    } catch (err) {
      console.error('Failed to merge:', err)
      setMergeError(prev => ({ ...prev, [groupIndex]: err.message || 'Failed to merge' }))
    } finally {
      setMerging(prev => ({ ...prev, [groupIndex]: false }))
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
            <button
              type="button"
              onClick={scanForDuplicates}
              className="ml-4 underline hover:no-underline text-body-sm"
            >
              Try again
            </button>
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
                  <button
                    type="button"
                    onClick={scanForDuplicates}
                    disabled={loading}
                    className="text-text-muted hover:text-text-primary text-body-sm flex items-center gap-1 min-h-[44px]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Rescan
                  </button>
                </div>

                {/* Groups */}
                {results.groups.map((group, groupIndex) => (
                  <div 
                    key={groupIndex}
                    className={`bg-bg-surface rounded-lg overflow-hidden border border-border-default transition-opacity ${
                      mergeSuccess[groupIndex] ? 'opacity-50' : ''
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
                          <span className="px-2 py-0.5 rounded text-caption font-medium bg-chip-fanfiction/15 text-chip-fanfiction">
                            Same Author
                          </span>
                        )}
                        <span className="text-text-muted text-body-sm">
                          {group.books.length} books
                        </span>
                      </div>
                      
                      {/* Merge button */}
                      {!mergeSuccess[groupIndex] && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleMergeGroup(groupIndex)}
                          disabled={merging[groupIndex] || !selections[groupIndex]}
                          className="flex items-center gap-2"
                        >
                          {merging[groupIndex] ? (
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
                      
                      {mergeSuccess[groupIndex] && (
                        <span className="text-action-success text-body-sm flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Merged!
                        </span>
                      )}
                    </div>

                    {/* Error */}
                    {mergeError[groupIndex] && (
                      <div className="px-4 py-2 bg-action-danger/10 text-action-danger text-body-sm border-b border-border-subtle">
                        {mergeError[groupIndex]}
                      </div>
                    )}

                    {/* Books in group */}
                    <div className="divide-y divide-border-subtle">
                      {group.books.map((book) => (
                        <label
                          key={book.id}
                          className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-bg-elevated/50 transition-colors ${
                            selections[groupIndex] === book.id ? 'bg-action-primary/10' : ''
                          }`}
                        >
                          {/* Radio button */}
                          <input
                            type="radio"
                            name={`group-${groupIndex}`}
                            checked={selections[groupIndex] === book.id}
                            onChange={() => handleSelectionChange(groupIndex, book.id)}
                            disabled={merging[groupIndex] || mergeSuccess[groupIndex]}
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
                          {selections[groupIndex] === book.id && (
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

                    {/* Help text */}
                    {!mergeSuccess[groupIndex] && (
                      <div className="px-4 py-3 bg-bg-elevated/50 text-text-muted text-caption border-t border-border-subtle">
                        💡 Select the book to keep, then click &quot;Merge into Selected&quot;. Other books will be merged into it.
                      </div>
                    )}
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
