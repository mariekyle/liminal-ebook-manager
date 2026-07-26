import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { findDuplicates, mergeTitles, dismissDuplicateGroup, getDismissedDuplicates, restoreDismissedPair } from '../api'
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
  // Bulk partial-failure message when the failed group no longer exists
  // after the auto-rescan (its remaining titles stopped matching as
  // duplicates) — rendered as a page banner instead of a group row
  const [bulkFailure, setBulkFailure] = useState(null)
  // Per-group "Not duplicates" progress + failure
  const [dismissing, setDismissing] = useState({})
  const [dismissError, setDismissError] = useState({})
  // Dismissed-pairs panel: null until the first load succeeds, so the
  // affordance never flashes in before the count is known
  const [dismissedPairs, setDismissedPairs] = useState(null)
  const [dismissedError, setDismissedError] = useState(null)
  const [showDismissed, setShowDismissed] = useState(false)
  // Per-pair restore progress + failure, keyed `${title_id_a}-${title_id_b}`
  const [restoring, setRestoring] = useState({})
  const [restoreError, setRestoreError] = useState({})

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
    setBulkFailure(null)
    setDismissing({})
    setDismissError({})
    // Refresh the dismissed-pairs list alongside every scan (own error
    // handling, never blocks the scan): merges delete titles, and stale
    // pairs drop out of the backend list only when it is re-read
    loadDismissedPairs()
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
      // Returned so the partial-failure path can locate the surviving
      // group in the fresh scan; other callers ignore the return value
      return groupsWithKeys
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
      setMergeError(prev => ({ ...prev, [groupKey]: 'Select a title to keep' }))
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

    // Sum what actually moved across the loop's response bodies — the
    // conditional carries (cover, wishlist note) are only knowable from
    // the responses, never predicted (Decisions 2026-07-25)
    let completed = 0
    let sessionsMoved = 0
    let notesMoved = 0
    let collectionsMoved = 0
    let coverCarried = false
    let wishlistNoteCarried = false

    try {
      // Merge each title into the target sequentially
      for (const sourceId of toMerge) {
        const result = await mergeTitles(keepId, sourceId)
        completed += 1
        const m = result?.merged || {}
        sessionsMoved += m.sessions || 0
        notesMoved += m.notes || 0
        collectionsMoved += m.collections || 0
        if (m.cover_carried) coverCarried = true
        if (m.wishlist_note_converted) wishlistNoteCarried = true
      }

      const movedParts = [
        sessionsMoved > 0 && `${sessionsMoved} ${sessionsMoved === 1 ? 'read' : 'reads'}`,
        notesMoved > 0 && `${notesMoved} ${notesMoved === 1 ? 'note' : 'notes'}`,
        collectionsMoved > 0 && `${collectionsMoved} ${collectionsMoved === 1 ? 'collection' : 'collections'}`,
      ].filter(Boolean)
      const carriedParts = [
        coverCarried && 'cover carried',
        wishlistNoteCarried && 'wishlist note carried',
      ].filter(Boolean)
      const segments = []
      if (movedParts.length > 0) segments.push(`${movedParts.join(', ')} moved over`)
      if (carriedParts.length > 0) segments.push(carriedParts.join(', '))
      setMergeSuccess(prev => ({
        ...prev,
        [groupKey]: segments.length > 0 ? `Merged — ${segments.join(' · ')}` : 'Merged',
      }))
      setMerging(prev => ({ ...prev, [groupKey]: false }))

      // Remove this group from results after short delay, and drop its entries
      // from every per-group state map. Using _key means we never have to care
      // about array index shifts — each map is a dictionary, not a positional list.
      setTimeout(() => {
        setResults(prev => {
          // A rescan (manual, or a later group's failure path) may have
          // replaced the groups since this timer was set — never decrement
          // the fresh scan's count for a key it doesn't contain
          if (!prev || !prev.groups.some(g => g._key === groupKey)) return prev
          return {
            ...prev,
            groups: prev.groups.filter(g => g._key !== groupKey),
            total_duplicates: prev.total_duplicates - group.books.length
          }
        })
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
      // Bulk partial-failure (Decisions 2026-07-25): stop the loop, rescan
      // for truth (completed merges deleted titles — the page must never
      // render rows that no longer exist), and name what completed.
      // Completed merges were valid and stay; no rollback pretense.
      console.error('Failed to merge:', err)
      const message = `Merged ${completed} of ${toMerge.length}, then failed`
      const freshGroups = await scanForDuplicates()
      const survivor = (freshGroups || []).find(g => g.books.some(b => b.id === keepId))
      if (survivor) {
        setMergeError(prev => ({ ...prev, [survivor._key]: message }))
      } else {
        setBulkFailure(message)
      }
    }
  }

  const loadDismissedPairs = async () => {
    setDismissedError(null)
    try {
      const data = await getDismissedDuplicates()
      setDismissedPairs(data.pairs || [])
      // Fresh list, fresh per-pair state — old keys may no longer exist
      setRestoring({})
      setRestoreError({})
    } catch (err) {
      console.error('Failed to load dismissed pairs:', err)
      setDismissedError(err.message || "Couldn't load dismissed pairs.")
    }
  }

  const handleDismissGroup = async (groupKey) => {
    const group = results.groups.find(g => g._key === groupKey)
    if (!group) return

    setDismissing(prev => ({ ...prev, [groupKey]: true }))
    setDismissError(prev => ({ ...prev, [groupKey]: null }))

    try {
      await dismissDuplicateGroup(group.books.map(b => b.id))

      // The group leaves the list immediately — no rescan (Decisions
      // 2026-07-26); the summary count follows, same arithmetic as the
      // merge removal path. Guard against a rescan having replaced the
      // groups while the request was in flight.
      setResults(prev => {
        if (!prev || !prev.groups.some(g => g._key === groupKey)) return prev
        return {
          ...prev,
          groups: prev.groups.filter(g => g._key !== groupKey),
          total_duplicates: prev.total_duplicates - group.books.length
        }
      })
      const drop = (obj) => {
        const { [groupKey]: _, ...rest } = obj
        return rest
      }
      setSelections(drop)
      setMerging(drop)
      setMergeSuccess(drop)
      setMergeError(drop)
      setConfirmingMerge(drop)
      setDismissing(drop)
      setDismissError(drop)
      // Pull the authoritative pair list so the affordance count is
      // backend truth, not client arithmetic
      loadDismissedPairs()
    } catch (err) {
      console.error('Failed to dismiss group:', err)
      setDismissing(prev => ({ ...prev, [groupKey]: false }))
      setDismissError(prev => ({
        ...prev,
        [groupKey]: err.message || "Couldn't dismiss this group. Try again?"
      }))
    }
  }

  const handleRestorePair = async (pair) => {
    const pairKey = `${pair.title_id_a}-${pair.title_id_b}`
    setRestoring(prev => ({ ...prev, [pairKey]: true }))
    setRestoreError(prev => ({ ...prev, [pairKey]: null }))

    try {
      await restoreDismissedPair(pair.title_id_a, pair.title_id_b)
      // Row leaves the list; the pair is eligible again on the next scan —
      // deliberately no auto-rescan (Decisions 2026-07-26)
      setDismissedPairs(prev =>
        (prev || []).filter(p =>
          !(p.title_id_a === pair.title_id_a && p.title_id_b === pair.title_id_b)
        )
      )
      setRestoring(prev => {
        const { [pairKey]: _, ...rest } = prev
        return rest
      })
    } catch (err) {
      console.error('Failed to restore pair:', err)
      setRestoring(prev => ({ ...prev, [pairKey]: false }))
      setRestoreError(prev => ({
        ...prev,
        [pairKey]: err.message || "Couldn't restore this pair. Try again?"
      }))
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
          <div className="bg-action-danger/10 border border-action-danger/30 rounded-lg p-4 text-body-sm text-action-danger">
            {error}
            <Button type="button" variant="ghost" size="sm" className="ml-4" onClick={scanForDuplicates}>
              Try again
            </Button>
          </div>
        )}

        {/* Bulk partial-failure banner — only when the failed group is gone
            from the post-failure rescan; otherwise the message lands in the
            surviving group's error row. Cleared by the next scan. */}
        {bulkFailure && !loading && (
          <div className="bg-action-danger/10 border border-action-danger/30 rounded-lg p-4 text-body-sm text-action-danger mb-6">
            {bulkFailure}
          </div>
        )}

        {results && !loading && (
          <>
            {results.groups.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-text-primary text-h4 mb-2">No duplicates found</div>
                <div className="text-text-secondary text-body-sm">Your library is clean.</div>
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
                    Found {results.groups.length} potential duplicate {results.groups.length === 1 ? 'group' : 'groups'} ({results.total_duplicates} titles)
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
                    {/* Group Header — two fixed rows (Decisions 2026-07-26,
                        NNG deterministic-placement finding): row 1 is
                        metadata and never interactive; row 2 is the verdict
                        row with both actions in the same positions in every
                        group, whatever the badge count. items-stretch +
                        min-h-[44px] on the row gives both actions their
                        44px touch height. Dismissal stays ghost: the
                        bordered-variant promotion STOPPED this session
                        (Button has no bordered variant), never danger —
                        it destroys nothing. */}
                    <div className="px-4 py-3 border-b border-border-default">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="tint"
                          tone={group.match_type === 'exact' ? 'danger' : 'warning'}
                          size="sm"
                          pill={false}
                        >
                          {group.match_type === 'exact' ? 'Exact Match' : 'Similar Title'}
                        </Badge>
                        {group.same_author && (
                          <Badge variant="tint" tone="fanfiction" size="sm" pill={false}>
                            Same Author
                          </Badge>
                        )}
                        <span className="text-text-muted text-body-sm">
                          {group.books.length} titles
                        </span>
                      </div>

                      {/* Verdict row — hidden during confirmation (the
                          confirm strip at the card foot is the acting
                          surface there) */}
                      {!mergeSuccess[group._key] && !confirmingMerge[group._key] && (
                        <div className="mt-3 flex items-stretch justify-between gap-2 min-h-[44px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismissGroup(group._key)}
                            loading={dismissing[group._key]}
                            disabled={merging[group._key]}
                          >
                            Not duplicates
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setConfirmingMerge(prev => ({ ...prev, [group._key]: true }))}
                            disabled={merging[group._key] || dismissing[group._key] || !selections[group._key]}
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
                              <>Merge into selected</>
                            )}
                          </Button>
                        </div>
                      )}

                      {mergeSuccess[group._key] && (
                        <div className="mt-3 flex items-center min-h-[44px]">
                          <span className="text-action-success text-body-sm flex items-center gap-1">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {mergeSuccess[group._key]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Error */}
                    {mergeError[group._key] && (
                      <div className="px-4 py-2 bg-action-danger/10 text-action-danger text-body-sm border-b border-border-subtle">
                        {mergeError[group._key]}
                      </div>
                    )}

                    {/* Dismiss failure — same slot styling; the two never
                        coexist (actions are sequential per group) */}
                    {dismissError[group._key] && (
                      <div className="px-4 py-2 bg-action-danger/10 text-action-danger text-body-sm border-b border-border-subtle">
                        {dismissError[group._key]}
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
                              <span>•</span>
                              <span>{book.session_count} {book.session_count === 1 ? 'read' : 'reads'}</span>
                              <span>•</span>
                              <span>{book.note_count} {book.note_count === 1 ? 'note' : 'notes'}</span>
                              {book.has_file === false && (
                                <>
                                  <span>•</span>
                                  <span>no file on disk</span>
                                </>
                              )}
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
                            title="View title details"
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
                        Select the title to keep, then tap &quot;Merge into selected&quot;. Other titles will be merged into it.
                      </div>
                    )}

                    {/* Confirmation row — replaces help text when user taps Merge into
                        Selected. Describes the computed outcome across the merging-away
                        titles (Decisions 2026-07-25): real aggregated counts, zero rows
                        suppressed, verb by total, trash clause only when files will
                        actually move. */}
                    {!mergeSuccess[group._key] && confirmingMerge[group._key] && (() => {
                      const keptBook = group.books.find(b => b.id === selections[group._key])
                      const mergingAway = group.books.filter(b => b.id !== selections[group._key])
                      const keptTitle = keptBook?.title || 'the selected title'
                      const totalReads = mergingAway.reduce((sum, b) => sum + (b.session_count || 0), 0)
                      const totalNotes = mergingAway.reduce((sum, b) => sum + (b.note_count || 0), 0)
                      const fileCount = mergingAway.filter(b => b.has_file).length
                      const historyParts = [
                        totalReads > 0 && `${totalReads} ${totalReads === 1 ? 'read' : 'reads'}`,
                        totalNotes > 0 && `${totalNotes} ${totalNotes === 1 ? 'note' : 'notes'}`,
                      ].filter(Boolean)
                      const sentences = [
                        `Merge ${mergingAway.length} ${mergingAway.length === 1 ? 'title' : 'titles'} into "${keptTitle}"?`,
                      ]
                      if (historyParts.length > 0) {
                        sentences.push(`${historyParts.join(' and ')} ${totalReads + totalNotes === 1 ? 'moves' : 'move'} over.`)
                      }
                      if (fileCount > 0) {
                        sentences.push(`${fileCount} ${fileCount === 1 ? 'file goes' : 'files go'} to the trash folder.`)
                      }
                      return (
                        <div className="px-4 py-3 bg-action-danger/5 border-t border-action-danger/20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-body-sm text-text-primary">
                            {sentences.join(' ')}
                          </p>
                          <div className="flex gap-2 sm:flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmingMerge(prev => ({ ...prev, [group._key]: false }))}
                              disabled={merging[group._key]}
                            >
                              Keep separate
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleMergeGroup(group._key)}
                              disabled={merging[group._key]}
                            >
                              Merge
                            </Button>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                ))}
              </div>
            )}

            {/* Dismissed pairs — hidden entirely at zero. Dismiss happens in
                groups, restore in pairs: the stored pair list is the only
                identity that survives a rescan (Decisions 2026-07-26) */}
            {dismissedError && (
              <div className="mt-8 flex flex-wrap items-center gap-2 text-body-sm text-text-secondary">
                <span>{dismissedError}</span>
                <Button type="button" variant="ghost" size="sm" onClick={loadDismissedPairs}>
                  Try again
                </Button>
              </div>
            )}
            {!dismissedError && dismissedPairs && dismissedPairs.length > 0 && (
              <div className="mt-8">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDismissed(prev => !prev)}
                  aria-expanded={showDismissed}
                  icon={
                    <svg className={`w-4 h-4 ${showDismissed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  }
                >
                  Dismissed pairs ({dismissedPairs.length})
                </Button>
                {showDismissed && (
                  <div className="mt-3 bg-bg-surface rounded-lg border border-border-default divide-y divide-border-subtle">
                    {dismissedPairs.map((pair) => {
                      const pairKey = `${pair.title_id_a}-${pair.title_id_b}`
                      return (
                        <div key={pairKey} className="p-4 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-body-sm text-text-primary truncate">
                              {pair.title_a}
                              <span className="text-text-muted"> — {pair.authors_a}</span>
                            </div>
                            <div className="text-body-sm text-text-primary truncate">
                              {pair.title_b}
                              <span className="text-text-muted"> — {pair.authors_b}</span>
                            </div>
                            {restoreError[pairKey] && (
                              <div className="mt-1 text-caption text-action-danger">
                                {restoreError[pairKey]}
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestorePair(pair)}
                            loading={restoring[pairKey]}
                          >
                            Restore
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default DuplicatesPage
