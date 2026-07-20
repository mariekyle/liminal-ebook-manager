import { useStatusLabels } from '../hooks/useStatusLabels'

/**
 * AcquireCard - Displays current reading status with contextual action
 */

const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
)

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
  </svg>
)

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
  </svg>
)

const STATUS_CONFIG = {
  unread: {
    icon: BookIcon,
    bgClass: 'bg-action-primary/15',
    iconClass: 'text-action-primary',
    showDownload: true,
    showEdit: false
  },
  not_prioritized: {
    icon: BookIcon,
    bgClass: 'bg-action-primary/15',
    iconClass: 'text-action-primary',
    showDownload: true,
    showEdit: false
  },
  in_progress: {
    label: 'Currently Reading',
    icon: BookIcon,
    bgClass: 'bg-action-primary/15',
    iconClass: 'text-action-primary',
    showDownload: false,
    showEdit: false
  },
  finished: {
    icon: CheckIcon,
    bgClass: 'bg-action-success/15',
    iconClass: 'text-action-success',
    showDownload: false,
    showEdit: true
  },
  dnf: {
    icon: CheckIcon,
    bgClass: 'bg-bg-elevated/50',
    iconClass: 'text-text-muted',
    showDownload: false,
    showEdit: true
  }
}

export default function AcquireCard({
  status = 'unread',
  subtitle = null,
  fileUrl = null,
  hasFile = false,
  onEditSession,
  onMarkFinished = null,
  onChangeStatus = null,
  onAcquire = null,
  isWishlist = false,
  className = ''
}) {
  const { getLabel } = useStatusLabels()
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unread
  const IconComponent = config.icon

  const displayLabel =
    status === 'finished'
      ? getLabel('Finished')
      : status === 'dnf'
        ? getLabel('Abandoned')
        : config.label || getLabel('Unread')

  const handleDownload = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank')
    }
  }

  const handleEdit = () => {
    onEditSession?.()
  }

  const showDownloadAction = config.showDownload && hasFile && fileUrl

  return (
    <div className={`p-3 rounded-xl border border-border-default bg-bg-surface ${config.bgClass} ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 ${config.iconClass}`}>
          <IconComponent />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-text-primary">
            {displayLabel}
          </div>
          {subtitle && (
            <div className="text-body-sm text-text-secondary truncate">
              {subtitle}
            </div>
          )}
        </div>

        {showDownloadAction && (
          <button
            type="button"
            onClick={handleDownload}
            className="flex-shrink-0 p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            title="Download"
          >
            <DownloadIcon />
          </button>
        )}

        {config.showEdit && (
          <button
            type="button"
            onClick={handleEdit}
            className="flex-shrink-0 p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            title="Edit reading session"
          >
            <EditIcon />
          </button>
        )}
      </div>

      {/* Inline action buttons — only for statuses where finishing is relevant */}
      {onMarkFinished && !['finished', 'dnf'].includes(status) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border-default">
          <button
            type="button"
            onClick={onMarkFinished}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-action-primary text-text-primary font-medium text-sm transition-colors hover:opacity-90"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            Mark Finished
          </button>
          {onChangeStatus && (
            <button
              type="button"
              onClick={onChangeStatus}
              className="px-4 py-2.5 rounded-lg border border-border-default bg-bg-elevated text-text-secondary text-sm transition-colors hover:bg-bg-surface"
            >
              Status ▾
            </button>
          )}
        </div>
      )}

      {/* Wishlist acquire button — above the fold */}
      {isWishlist && onAcquire && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border-default">
          <button
            type="button"
            onClick={onAcquire}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-action-primary text-text-primary font-medium text-sm transition-colors hover:opacity-90"
          >
            🎉 I Got This Book!
          </button>
        </div>
      )}
    </div>
  )
}
