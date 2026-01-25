/**
 * ReadingStatusCard - Displays current reading status with contextual action
 * 
 * States:
 * - not_prioritized / unread: "Not Started" - blue book icon, optional download action
 * - in_progress: "Currently Reading" - blue book icon, no action
 * - finished: "Finished" - green checkmark, edit action
 * - dnf: "Abandoned" - green checkmark, edit action
 * 
 * Actions:
 * - Download: Opens file URL (for Not Started books with file_url)
 * - Edit: Opens reading session modal (for Finished/Abandoned)
 */

// Icons
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

// Status configuration
const STATUS_CONFIG = {
  unread: {
    label: 'Not Started',
    icon: BookIcon,
    bgClass: 'bg-indigo-500/20',
    iconClass: 'text-indigo-400',
    showDownload: true,
    showEdit: false
  },
  not_prioritized: {
    label: 'Not Started',
    icon: BookIcon,
    bgClass: 'bg-indigo-500/20',
    iconClass: 'text-indigo-400',
    showDownload: true,
    showEdit: false
  },
  in_progress: {
    label: 'Currently Reading',
    icon: BookIcon,
    bgClass: 'bg-indigo-500/20',
    iconClass: 'text-indigo-400',
    showDownload: false,
    showEdit: false
  },
  finished: {
    label: 'Finished',
    icon: CheckIcon,
    bgClass: 'bg-green-500/20',
    iconClass: 'text-green-400',
    showDownload: false,
    showEdit: true
  },
  dnf: {
    label: 'Abandoned',
    icon: CheckIcon,
    bgClass: 'bg-green-500/20',
    iconClass: 'text-green-400',
    showDownload: false,
    showEdit: true
  }
}

export default function ReadingStatusCard({
  status = 'unread',
  subtitle = null,        // e.g., "Jan 15 – Jan 22, 2026" for finished books
  fileUrl = null,         // URL to download file (for ebooks)
  hasFile = false,        // Whether book has a downloadable file
  onEditSession,          // Callback to open reading session modal
  className = ''
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unread
  const IconComponent = config.icon

  const handleDownload = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank')
    }
  }

  const handleEdit = () => {
    onEditSession?.()
  }

  // Determine if we should show the download action
  const showDownloadAction = config.showDownload && hasFile && fileUrl

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${config.bgClass} ${className}`}>
      {/* Status Icon */}
      <div className={`flex-shrink-0 ${config.iconClass}`}>
        <IconComponent />
      </div>

      {/* Status Text */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-100">
          {config.label}
        </div>
        {subtitle && (
          <div className="text-sm text-gray-400 truncate">
            {subtitle}
          </div>
        )}
      </div>

      {/* Action Button */}
      {showDownloadAction && (
        <button
          onClick={handleDownload}
          className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-colors"
          title="Download"
        >
          <DownloadIcon />
        </button>
      )}

      {config.showEdit && (
        <button
          onClick={handleEdit}
          className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-colors"
          title="Edit reading session"
        >
          <EditIcon />
        </button>
      )}
    </div>
  )
}
