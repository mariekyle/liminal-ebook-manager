/**
 * UploadProgress.jsx
 *
 * Shows upload progress for each book.
 */

export default function UploadProgress({ books, progress }) {
  const getBookStatus = (index) => {
    const booksToUpload = books.filter((b) => b.action !== 'skip')
    const bookIndex = booksToUpload.findIndex((b) => b.id === books[index].id)

    if (books[index].action === 'skip') {
      return 'skipped'
    }

    if (bookIndex === -1) return 'pending'

    const perBookProgress = 100 / booksToUpload.length
    const bookThreshold = perBookProgress * (bookIndex + 1)

    if (progress >= bookThreshold) {
      return 'done'
    }
    if (progress >= perBookProgress * bookIndex) {
      return 'uploading'
    }
    return 'pending'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done':
        return { icon: '✓', className: 'text-action-success' }
      case 'uploading':
        return { icon: '◐', className: 'text-action-primary animate-spin' }
      case 'skipped':
        return { icon: '⏭', className: 'text-text-muted' }
      default:
        return { icon: '○', className: 'text-text-muted' }
    }
  }

  const getStatusText = (book, status) => {
    if (status === 'skipped') return 'Skipped'
    if (status === 'done') {
      if (book.action === 'add_format') {
        return `Format added (${book.files.length} file${book.files.length !== 1 ? 's' : ''})`
      }
      return `${book.files.length} file${book.files.length !== 1 ? 's' : ''} uploaded`
    }
    if (status === 'uploading') {
      if (book.action === 'add_format') {
        return 'Adding format...'
      }
      return 'Uploading...'
    }
    return 'Waiting...'
  }

  return (
    <div className="py-5">
      <h2 className="text-h4 text-center mb-6 text-text-primary">Uploading books</h2>

      <div className="space-y-3">
        {books.map((book, index) => {
          const status = getBookStatus(index)
          const { icon, className: iconClass } = getStatusIcon(status)

          return (
            <div key={book.id} className="bg-bg-surface rounded-lg p-4 border border-border-subtle">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xl ${iconClass}`}>{icon}</span>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-body-sm font-medium ${
                      status === 'skipped' ? 'line-through text-text-muted' : 'text-text-primary'
                    }`}
                  >
                    {book.title}
                  </div>
                  <div className="text-caption text-text-secondary">{getStatusText(book, status)}</div>
                </div>
              </div>

              {status === 'uploading' && (
                <div className="h-2 bg-bg-elevated rounded overflow-hidden">
                  <div
                    className="h-full bg-action-primary rounded transition-all duration-300 ease-out animate-pulse"
                    style={{ width: '67%' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 bg-bg-surface rounded-lg p-4 border border-border-subtle">
        <div className="flex justify-between text-body-sm mb-2 text-text-primary">
          <span>Overall Progress</span>
          <span className="text-text-secondary">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-bg-elevated rounded overflow-hidden">
          <div
            className="h-full bg-action-primary rounded transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
