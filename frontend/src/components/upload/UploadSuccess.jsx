/**
 * UploadSuccess.jsx
 *
 * Success screen showing upload results summary.
 */

import { useNavigate } from 'react-router-dom'
import StepIndicator from '../add/StepIndicator'
import Button from '../ui/Button'

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

  const getBadge = (status) => {
    switch (status) {
      case 'created':
        return { text: 'NEW', className: 'bg-action-success text-text-primary' }
      case 'format_added':
        return { text: '+FORMAT', className: 'bg-action-primary text-text-primary' }
      case 'error':
        return { text: 'ERROR', className: 'bg-action-danger text-text-primary' }
      default:
        return null
    }
  }

  return (
    <div className="py-6">
      <StepIndicator steps={['Add', 'Review', 'Done']} currentStep={2} />

      <div className="text-center mb-6">
        <div className="text-5xl text-action-success mb-4">✓</div>
        <h1 className="text-h4 text-text-primary mb-1">Added to your library</h1>
        <p className="text-body-sm text-text-secondary">
          {successCount === 1 ? 'Your collection grows' : `${successCount} stories added`}
        </p>
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
              const badge = getBadge(status)
              const isError = status === 'error'
              const bookId = tid || book?.title_id || null
              const isClickable = !isError && bookId !== null

              return (
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
                  <span className="flex-1 truncate text-body-sm text-text-primary">
                    {book?.title || 'Unknown'}
                  </span>
                  {badge && (
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${badge.className}`}>
                      {badge.text}
                    </span>
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
    <div className="flex justify-between text-body-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary font-medium">{value}</span>
    </div>
  )
}
