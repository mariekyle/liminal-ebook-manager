/**
 * UploadSuccess.jsx
 *
 * Success screen showing upload results summary.
 */

import { useNavigate } from 'react-router-dom'
import StepIndicator from '../add/StepIndicator'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

export default function UploadSuccess({ results, books, onGoToLibrary, onUploadMore }) {
  const navigate = useNavigate()

  if (!results) return null

  const created = results.results.filter((r) => r.status === 'created').length
  const formatAdded = results.results.filter((r) => r.status === 'format_added').length
  const errors = results.results.filter((r) => r.status === 'error').length

  const successCount = created + formatAdded

  const totalFiles = books
    .filter((b) => b.action !== 'skip')
    .reduce((sum, b) => sum + (b.files?.length || 0), 0)

  const totalSize = books
    .filter((b) => b.action !== 'skip')
    .reduce((sum, b) => sum + (b.files?.reduce((s, f) => s + (f.size || 0), 0) || 0), 0)

  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1)

  const bookResults = results.results
    .filter((r) => r.status !== 'skipped')
    .map((result) => {
      const book = books.find((b) => b.id === result.id)
      return { ...result, book }
    })

  const singleResult =
    bookResults.length === 1 && bookResults[0].status !== 'error' ? bookResults[0] : null
  const singleBookId = singleResult?.title_id || singleResult?.book?.title_id || null
  const singleSuccess = singleBookId !== null

  const handleViewStory = () => {
    if (singleBookId) {
      navigate(`/book/${singleBookId}`)
    }
  }

  const handleBookClick = (bookId) => {
    if (bookId) {
      navigate(`/book/${bookId}`)
    }
  }

  // Result badge text + ui/Badge solid tone per row status (S4 — the
  // class strings moved into Badge's tone tables)
  const RESULT_BADGES = {
    created: { text: 'NEW', tone: 'success' },
    format_added: { text: '+FORMAT', tone: 'primary' },
    error: { text: 'ERROR', tone: 'danger' },
  }

  return (
    <div className="py-6">
      <StepIndicator steps={['Add', 'Review', 'Done']} currentStep={2} />

      {/* Header reflects the OUTCOME (ratified 2026-07-19): zero adds
          never renders a green check; partial success states counts */}
      <div className="text-center mb-6">
        {successCount === 0 ? (
          <div className="text-5xl mb-4">⚠️</div>
        ) : (
          <div className="text-5xl text-action-success mb-4">✓</div>
        )}
        <h1 className="text-h4 text-text-primary mb-1">
          {successCount === 0 ? 'Nothing was added' : 'Added to your library'}
        </h1>
        {successCount > 0 && (
          <p className="text-body-sm text-text-secondary">
            {errors > 0
              ? `Added ${successCount} of ${successCount + errors}`
              : successCount === 1
                ? 'Your collection grows'
                : `${successCount} stories added`}
          </p>
        )}
      </div>

      <div className="bg-bg-surface/80 rounded-lg p-4 mb-6 border border-border-subtle">
        <div className="space-y-2">
          {created > 0 && <SummaryRow label="New Stories Added" value={created} />}
          {formatAdded > 0 && <SummaryRow label="Formats Added" value={formatAdded} />}
          {totalFiles > 0 && <SummaryRow label="Files Processed" value={totalFiles} />}
          {totalSize > 0 && <SummaryRow label="Total Size" value={`${totalSizeMB} MB`} />}
        </div>
      </div>

      {bookResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-label text-text-muted mb-2">Results</h3>
          <div className="bg-bg-surface/80 rounded-lg overflow-hidden border border-border-subtle">
            {bookResults.map((result) => {
              const { id, status, book, message, title_id: tid } = result
              const badge = RESULT_BADGES[status] || null
              const isError = status === 'error'
              const bookId = tid || book?.title_id || null
              const isClickable = !isError && bookId !== null

              return (
                // design-lint-button-chrome: content row — span-composed, below the element-children bar; re-anatomize post-sprint
                <button
                  key={id}
                  type="button"
                  onClick={() => isClickable && handleBookClick(bookId)}
                  disabled={!isClickable}
                  className={`
                    w-full px-4 py-3 flex items-center gap-3 text-left min-h-[44px]
                    border-b border-border-default last:border-b-0
                    transition-all duration-200 ease-out
                    ${
                      !isClickable
                        ? 'cursor-default opacity-80'
                        : 'hover:bg-bg-elevated cursor-pointer'
                    }
                    ${isError ? 'opacity-60' : ''}
                  `}
                >
                  <span className={isError ? 'text-action-danger' : 'text-action-success'}>
                    {isError ? '✗' : '✓'}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-body-sm text-text-primary">
                      {book?.title || 'Unknown'}
                    </span>
                    {/* Backend skip/defer notes (S15.2b) — error messages
                        stay in the Errors block below, not duplicated here */}
                    {message && !isError && (
                      <span className="block text-body-sm text-text-secondary break-words">
                        {message}
                      </span>
                    )}
                  </span>
                  {badge && (
                    <Badge variant="solid" tone={badge.tone} size="sm" pill={false}>
                      {badge.text}
                    </Badge>
                  )}
                  {isClickable && <span className="text-text-muted text-sm">›</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {errors > 0 && (
        <div className="mb-6 p-3 bg-action-danger/10 border border-action-danger/30 rounded-lg">
          <h3 className="text-body-sm text-action-danger mb-2">Errors</h3>
          {bookResults
            .filter((r) => r.status === 'error')
            .map(({ id, book: b, message: msg }) => (
              <p key={id} className="text-body-sm text-action-danger">
                • {b?.title || 'Unknown'}: {msg}
              </p>
            ))}
        </div>
      )}

      <div className={`flex gap-3 ${singleSuccess ? '' : 'flex-col'}`}>
        <Button
          type="button"
          variant="secondary"
          className={singleSuccess ? 'flex-1' : 'w-full'}
          onClick={onUploadMore}
        >
          Add More
        </Button>
        {singleSuccess && (
          <Button type="button" variant="primary" className="flex-1" onClick={handleViewStory}>
            View Story
          </Button>
        )}
      </div>

      {typeof onGoToLibrary === 'function' && (
        <Button type="button" variant="ghost" className="w-full mt-3" onClick={onGoToLibrary}>
          Back to library
        </Button>
      )}
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between text-body-sm text-text-secondary">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary font-medium">{value}</span>
    </div>
  )
}
