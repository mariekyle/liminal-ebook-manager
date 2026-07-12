import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import UnifiedNavBar from '../components/ui/UnifiedNavBar'
import Button from '../components/ui/Button'
import { getLastSyncResult, getSyncStatus } from '../api'
import { formatTimeAgo } from '../utils/formatTimeAgo'

/**
 * SyncResultsPage — persistent view of the last sync (S15.3b).
 *
 * Reads the stored SyncResult (settings key 'last_sync_result', written by the
 * backend at the end of every sync, including failed ones) and presents each
 * finding type in plain language. This page replaces container-log reading and
 * is the only surface for file-level format conflicts — Find Duplicates covers
 * duplicate titles, not files.
 *
 * Reached from the Settings "Last sync" row, and directly after every manual
 * sync completes. Detail lists are capped at 200 entries per group on the
 * backend; the counters are uncapped, so groups show "and N more" past the cap.
 */

const RETURN_STATE = { returnUrl: '/sync-results' }

function TitleLink({ id, children }) {
  return (
    <Link
      to={`/book/${id}`}
      state={RETURN_STATE}
      className="text-body text-action-primary hover:underline break-words inline-flex items-center min-h-[44px] flex-1"
    >
      {children}
    </Link>
  )
}

function StatusCard({ result }) {
  const isError = result.status === 'error'
  // "complete" with zero folders scanned usually means the library folder
  // isn't reachable — never dress that up as a clean sync (S15.3a stance)
  const noFolders = !isError && (result.total ?? 0) === 0
  const cardTone = isError
    ? 'bg-action-danger/10 border-action-danger/30'
    : noFolders
      ? 'bg-action-warning/10 border-action-warning/30'
      : 'bg-bg-surface border-border-default'
  return (
    <section className={`mx-4 mt-4 rounded-lg border p-4 ${cardTone}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-h4 text-text-primary">Last sync</h2>
        <span className="text-caption text-text-muted shrink-0">
          {formatTimeAgo(result.finished_at)}
        </span>
      </div>
      {isError && (
        <p className="text-body-sm text-action-danger mt-2">
          {result.message || "Sync didn't finish. Your data is safe — try again?"}
        </p>
      )}
      {noFolders && (
        <p className="text-body-sm text-action-warning mt-2">
          No folders found — check that the library folder is reachable.
        </p>
      )}
      <div className="grid grid-cols-2 gap-y-1 mt-3 text-body-sm text-text-secondary">
        <span>Added</span>
        <span className="text-right text-text-primary">{result.added ?? 0}</span>
        <span>Updated</span>
        <span className="text-right text-text-primary">{result.updated ?? 0}</span>
        {result.fields_backfilled > 0 && (
          <>
            <span>Fields backfilled</span>
            <span className="text-right text-text-primary">{result.fields_backfilled}</span>
          </>
        )}
        <span>Skipped</span>
        <span className="text-right text-text-primary">{result.skipped ?? 0}</span>
        <span>Folders scanned</span>
        <span className="text-right text-text-primary">{result.total ?? 0}</span>
        {result.recovered > 0 && (
          <>
            <span>Recovered</span>
            <span className="text-right text-text-primary">{result.recovered}</span>
          </>
        )}
        {result.orphaned > 0 && (
          <>
            <span>Orphaned</span>
            <span className="text-right text-text-primary">{result.orphaned}</span>
          </>
        )}
        {result.errors > 0 && (
          <>
            <span>Errors</span>
            <span className="text-right text-action-danger">{result.errors}</span>
          </>
        )}
      </div>
      {result.errors > 0 && (
        <p className="text-caption text-text-muted mt-2">
          {result.errors === 1
            ? "One folder couldn't be processed this run — try another sync; the server logs have the details."
            : `${result.errors} folders couldn't be processed this run — try another sync; the server logs have the details.`}
        </p>
      )}
    </section>
  )
}

function CreatedEditionsCard({ editionsCreated }) {
  const entries = Object.entries(editionsCreated || {}).sort()
  const totalCount = entries.reduce((sum, [, count]) => sum + count, 0)
  if (totalCount === 0) return null
  return (
    <section className="mx-4 mt-4 bg-bg-surface border border-border-subtle rounded-lg px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-h4 text-text-primary">New editions</h2>
        <span className="text-caption text-text-muted shrink-0">{totalCount}</span>
      </div>
      <p className="text-caption text-text-secondary mt-1">
        {entries.map(([format, count]) => `${count} ${format}`).join(' · ')}
      </p>
    </section>
  )
}

function FindingGroup({ title, count, hint, moreCount, children }) {
  return (
    <section className="mx-4 mt-4 bg-bg-surface border border-border-default rounded-lg">
      <div className="px-4 pt-3 pb-2 border-b border-border-subtle">
        <h2 className="text-h4 text-text-primary">
          {title} · {count}
        </h2>
        <p className="text-caption text-text-muted mt-1">{hint}</p>
      </div>
      <ul className="divide-y divide-border-subtle">{children}</ul>
      {moreCount > 0 && (
        <p className="px-4 py-2 text-caption text-text-muted border-t border-border-subtle">
          …and {moreCount} more not shown
        </p>
      )}
    </section>
  )
}

export default function SyncResultsPage() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [result, setResult] = useState(null)
  const [syncRunning, setSyncRunning] = useState(false)
  const headingRef = useRef(null)

  const load = () => {
    setLoading(true)
    setLoadError(null)
    getLastSyncResult()
      .then(setResult)
      .catch(err => setLoadError(err.message || "Couldn't load the last sync results."))
      .finally(() => setLoading(false))
    // One-shot check, not a poll: the stored result is always the *previous*
    // run while a sync is in flight — say so instead of passing it off as new
    getSyncStatus()
      .then(status => setSyncRunning(!!status.in_progress && status.current_operation !== 'rescan'))
      .catch(() => {})
  }

  useEffect(() => {
    document.title = 'Sync Results'
    load()
    // Arriving here is the completion signal for a just-finished sync — move
    // focus to the heading so the page change is announced, not silent
    headingRef.current?.focus()
  }, [])

  const conflicts = result?.format_conflict_details || []
  const missing = result?.missing_file_details || []
  const duplicates = result?.duplicate_skip_details || []
  const deferred = result?.unmigrated_title_details || []
  const hasFindings =
    (result?.format_conflicts ?? 0) > 0 ||
    (result?.missing_files ?? 0) > 0 ||
    (result?.duplicate_files_skipped ?? 0) > 0 ||
    (result?.unmigrated_titles ?? 0) > 0
  const cleanRun =
    result && result.status !== 'error' && (result.total ?? 0) > 0 &&
    !hasFindings && (result.errors ?? 0) === 0 && (result.orphaned ?? 0) === 0

  return (
    <div className="min-h-screen bg-bg-base pb-24">
      <UnifiedNavBar backLabel="Settings" backTo="/settings" />

      <div className="max-w-2xl mx-auto">
        <h1 ref={headingRef} tabIndex={-1} className="text-h2 text-text-primary px-4 pt-4 pb-2 outline-none">
          Sync Results
        </h1>

        {syncRunning && (
          <p className="mx-4 mt-2 px-4 py-3 bg-bg-elevated/70 border border-border-subtle rounded-lg text-body-sm text-text-secondary">
            A sync is running right now — these results are from the previous run.
          </p>
        )}

        {loading && (
          <div className="px-4 py-8 text-body-sm text-text-secondary">Loading sync results…</div>
        )}

        {!loading && loadError && (
          <div className="mx-4 my-2 space-y-2">
            <div className="bg-action-danger/10 border border-action-danger/30 rounded-lg p-3 text-body-sm text-action-danger">
              {loadError}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={load}>
              Try again
            </Button>
          </div>
        )}

        {!loading && !loadError && !result && (
          <div className="text-center py-20 px-4">
            <div className="text-4xl mb-4">🔭</div>
            <div className="text-h4 text-text-primary mb-2">No syncs yet</div>
            <p className="text-body-sm text-text-secondary">
              Results land here after each sync — conflicts, missing files, and
              skipped duplicates included.
            </p>
          </div>
        )}

        {!loading && !loadError && result && (
          <>
            <StatusCard result={result} />

            {cleanRun && (
              <div className="text-center py-16 px-4">
                <div className="text-4xl mb-4">✨</div>
                <div className="text-h4 text-text-primary mb-2">Everything in its place</div>
                <p className="text-body-sm text-text-secondary">
                  Nothing needs attention — no conflicts, missing files, or
                  skipped duplicates.
                </p>
              </div>
            )}

            {(result.format_conflicts ?? 0) > 0 && (
              <FindingGroup
                title="Format conflicts"
                count={result.format_conflicts}
                hint="The same format lives in two folders for one title. Both were left untouched — tidy the folders, then sync again."
                moreCount={Math.max(0, result.format_conflicts - conflicts.length)}
              >
                {conflicts.map((conflict, index) => (
                  <li key={`${conflict.title_id}-${conflict.format}-${index}`} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <TitleLink id={conflict.title_id}>{conflict.title}</TitleLink>
                      <span className="text-caption text-text-muted uppercase shrink-0">
                        {conflict.format}
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {(conflict.folders || []).map(folder => (
                        <p key={folder} className="text-caption text-text-secondary break-all">
                          {folder}
                        </p>
                      ))}
                    </div>
                  </li>
                ))}
              </FindingGroup>
            )}

            {(result.missing_files ?? 0) > 0 && (
              <FindingGroup
                title="Missing files"
                count={result.missing_files}
                hint="Couldn't find these files — they may have moved since the last scan. Each title was kept; open it to remove or merge it if it no longer belongs."
                moreCount={Math.max(0, result.missing_files - missing.length)}
              >
                {missing.map((item, index) => (
                  <li key={`${item.title_id}-${item.format}-${index}`} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <TitleLink id={item.title_id}>{item.title}</TitleLink>
                      <span className="text-caption text-text-muted uppercase shrink-0">
                        {item.format}
                      </span>
                    </div>
                    <p className="mt-1 text-caption text-text-secondary break-all">
                      {item.expected_path}
                    </p>
                  </li>
                ))}
              </FindingGroup>
            )}

            {(result.duplicate_files_skipped ?? 0) > 0 && (
              <FindingGroup
                title="Duplicate files skipped"
                count={result.duplicate_files_skipped}
                hint="A folder held more than one file of the same format. The first (A to Z) is in your library; the others were skipped, not deleted."
                moreCount={Math.max(
                  0,
                  result.duplicate_files_skipped -
                    duplicates.reduce((sum, entry) => sum + (entry.skipped?.length || 0), 0)
                )}
              >
                {duplicates.map((entry, index) => (
                  <li key={`${entry.folder}-${entry.format}-${index}`} className="px-4 py-3">
                    <p className="text-caption text-text-secondary break-all">{entry.folder}</p>
                    <p className="mt-1 text-body-sm text-text-primary break-all">
                      Kept: {entry.kept}
                    </p>
                    {(entry.skipped || []).map(name => (
                      <p key={name} className="text-body-sm text-text-secondary break-all">
                        Skipped: {name}
                      </p>
                    ))}
                  </li>
                ))}
              </FindingGroup>
            )}

            {(result.unmigrated_titles ?? 0) > 0 && (
              <FindingGroup
                title="Deferred titles"
                count={result.unmigrated_titles}
                hint="These titles still use an older edition record, so sync left them untouched. If they keep appearing here after a restart, the migration needs a closer look."
                moreCount={Math.max(0, result.unmigrated_titles - deferred.length)}
              >
                {deferred.map((item, index) => (
                  <li key={`${item.title_id}-${index}`} className="px-4 py-3">
                    <TitleLink id={item.title_id}>{item.title}</TitleLink>
                    <p className="mt-1 text-caption text-text-secondary break-all">{item.folder}</p>
                  </li>
                ))}
              </FindingGroup>
            )}

            <CreatedEditionsCard editionsCreated={result.editions_created} />
          </>
        )}
      </div>
    </div>
  )
}
