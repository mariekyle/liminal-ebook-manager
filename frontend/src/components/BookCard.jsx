import { Link } from 'react-router-dom'
import GradientCover from './GradientCover'
import { useStatusLabels } from '../hooks/useStatusLabels'

/**
 * BookCard — renders a title in one of three layouts.
 *
 * Props:
 *   book        — title object from API
 *   variant     — 'compact' | 'standard' | 'list' (default: 'compact')
 *   wpm         — words per minute for read time calculation (default: 250)
 *   isChecklistCompleted — dims card for completed checklist items
 *   linkTo      — navigation target (default: book detail page, null = no link wrapper)
 *   onClick     — optional click handler (used when linkTo is null)
 *   onLongPress — optional callback for long-press/right-click: (book, {x, y}) => void (list variant only)
 */
function BookCard({
  book,
  variant = 'compact',
  wpm = 250,
  isChecklistCompleted = false,
  linkTo,
  onClick,
  onLongPress,
}) {
  const { labels: statusLabels } = useStatusLabels()
  const primaryAuthor = book.authors?.[0] || 'Unknown Author'
  const isWishlist = book.acquisition_status === 'wishlist'

  const seriesDisplay = book.series && book.series_number
    ? `${book.series} #${book.series_number}`
    : null

  // Compute estimated read time from word count
  const readTimeDisplay = (() => {
    if (!book.word_count || book.word_count <= 0) return null
    const hours = book.word_count / wpm / 60
    if (hours < 1) return '< 1h'
    return `~${Math.round(hours)}h`
  })()

  // Normalize status for display logic
  const status = book.status || ''
  const isFinished = status === 'Finished'
  const isInProgress = status === 'In Progress'
  const isDNF = status === 'Abandoned' || status === 'DNF'

  // Custom label for DNF status
  const dnfLabel = statusLabels['Abandoned'] || 'DNF'

  const coverBook = {
    id: book.id,
    title: book.title,
    author: primaryAuthor,
    has_cover: book.has_cover || false,
    cover_path: book.cover_path || null,
    cover_source: book.cover_source || null,
    cover_gradient: book.cover_gradient,
    cover_color_1: book.cover_color_1,
    cover_color_2: book.cover_color_2,
    cover_bg_color: book.cover_bg_color,
    cover_text_color: book.cover_text_color,
  }

  // Resolve link target: default to book detail, null means no navigation
  const resolvedLink = linkTo !== undefined ? linkTo : `/book/${book.id}`

  const CheckIcon = ({ size = 16 }) => (
    <svg style={{ width: size, height: size }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )

  const PauseIcon = ({ size = 16 }) => (
    <svg style={{ width: size, height: size }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <rect x="6" y="4" width="4" height="16" rx="1" strokeWidth={2} />
      <rect x="14" y="4" width="4" height="16" rx="1" strokeWidth={2} />
    </svg>
  )

  const ClockIcon = () => (
    <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )

  // Wrapper: Link when navigating, div when interaction is parent-controlled
  const Wrapper = resolvedLink
    ? ({ children }) => (
        <Link
          to={resolvedLink}
          state={{ returnUrl: window.location.pathname + window.location.search }}
          className="group block"
          onClick={onClick}
        >
          {children}
        </Link>
      )
    : ({ children }) => (
        <div
          className="group block cursor-pointer"
          onClick={onClick}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
        >
          {children}
        </div>
      )

  if (variant === 'list') {
    return (
      <Wrapper>
        <div
          className={`flex gap-3 items-center py-2.5 border-b border-border-subtle ${isChecklistCompleted ? 'opacity-75' : ''}`}
          onContextMenu={(e) => {
            if (onLongPress) {
              e.preventDefault()
              onLongPress(book, { x: e.clientX, y: e.clientY })
            }
          }}
          onTouchStart={(e) => {
            if (!onLongPress) return
            const touch = e.touches[0]
            const timer = setTimeout(() => {
              onLongPress(book, { x: touch.clientX, y: touch.clientY })
            }, 500)
            e.currentTarget._longPressTimer = timer
          }}
          onTouchEnd={(e) => {
            if (e.currentTarget._longPressTimer) {
              clearTimeout(e.currentTarget._longPressTimer)
              e.currentTarget._longPressTimer = null
            }
          }}
          onTouchMove={(e) => {
            if (e.currentTarget._longPressTimer) {
              clearTimeout(e.currentTarget._longPressTimer)
              e.currentTarget._longPressTimer = null
            }
          }}
        >
          {/* Thumbnail — 64×96 */}
          <div className="w-[64px] h-[96px] rounded-md overflow-hidden relative flex-shrink-0">
            <GradientCover
              book={coverBook}
              size="fill"
              showTitle={false}
              showAuthor={false}
              className="w-full h-full"
            />

            {/* Status badges — solid chip with opaque bg */}
            {!isWishlist && isFinished && (
              <div className="absolute inset-0 bg-bg-base/65 flex items-center justify-center">
                <span className="text-text-primary"><CheckIcon size={20} /></span>
              </div>
            )}
            {!isWishlist && isDNF && (
              <div className="absolute inset-0 bg-bg-base/65 flex items-center justify-center">
                <span className="text-text-muted"><PauseIcon size={20} /></span>
              </div>
            )}
            {isChecklistCompleted && (
              <div className="absolute inset-0 bg-bg-base/65 flex items-center justify-center">
                <span className="text-action-success"><CheckIcon size={20} /></span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-body-sm font-medium text-text-primary truncate group-hover:text-action-primary transition-colors duration-200 ease-out">
              {book.title}
            </h3>
            <p className="text-caption text-text-secondary truncate mt-0.5">
              {primaryAuthor}
            </p>
            {seriesDisplay && (
              <p className="text-caption text-text-muted truncate mt-0.5">
                {seriesDisplay}
              </p>
            )}

            {isInProgress && (
              <>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-reading flex-shrink-0" />
                  <span className="text-caption text-status-reading">Reading</span>
                </div>
                <div className="h-[3px] bg-bg-base/50 rounded-full mt-1 w-full">
                  <div className="h-full bg-action-primary rounded-full" style={{ width: '50%' }} />
                </div>
              </>
            )}

            {isDNF && (
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-status-dnf flex-shrink-0" />
                <span className="text-caption text-status-dnf">{dnfLabel}</span>
              </div>
            )}

            {!isInProgress && !isDNF && readTimeDisplay && (
              <div className="flex items-center gap-1.5 mt-1 text-text-muted">
                <ClockIcon />
                <span className="text-caption">{readTimeDisplay}</span>
              </div>
            )}
          </div>
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <div
        className={isChecklistCompleted ? 'opacity-75' : ''}
        onContextMenu={(e) => {
          if (onLongPress) {
            e.preventDefault()
            onLongPress(book, { x: e.clientX, y: e.clientY })
          }
        }}
        onTouchStart={(e) => {
          if (!onLongPress) return
          const touch = e.touches[0]
          const timer = setTimeout(() => {
            onLongPress(book, { x: touch.clientX, y: touch.clientY })
          }, 500)
          e.currentTarget._longPressTimer = timer
        }}
        onTouchEnd={(e) => {
          if (e.currentTarget._longPressTimer) {
            clearTimeout(e.currentTarget._longPressTimer)
            e.currentTarget._longPressTimer = null
          }
        }}
        onTouchMove={(e) => {
          if (e.currentTarget._longPressTimer) {
            clearTimeout(e.currentTarget._longPressTimer)
            e.currentTarget._longPressTimer = null
          }
        }}
      >
        <div className="relative">
          <GradientCover
            book={coverBook}
            showTitle={true}
            showAuthor={true}
            className={isWishlist ? 'border-2 border-dashed border-border-default' : ''}
          />

          {!isWishlist && isInProgress && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-bg-base/50">
              <div className="h-full w-1/2 bg-action-primary" />
            </div>
          )}

          {isChecklistCompleted ? (
            <div
              className="absolute top-2 right-2 w-6 h-6 bg-action-success/90 rounded flex items-center justify-center"
              title="Completed"
            >
              <span className="text-text-primary"><CheckIcon size={16} /></span>
            </div>
          ) : (
            <>
              {!isWishlist && isFinished && (
                <div
                  className="absolute top-2 right-2 w-6 h-6 bg-bg-base/[0.88] rounded flex items-center justify-center"
                  title="Finished"
                >
                  <span className="text-text-primary"><CheckIcon size={16} /></span>
                </div>
              )}

              {!isWishlist && isDNF && (
                <div
                  className="absolute top-2 right-2 w-6 h-6 bg-bg-base/[0.88] rounded flex items-center justify-center"
                  title={dnfLabel}
                >
                  <span className="text-text-muted"><PauseIcon size={16} /></span>
                </div>
              )}

              {isWishlist && (
                <div
                  className="absolute top-2 right-2 w-6 h-6 bg-bg-base/[0.88] rounded flex items-center justify-center"
                  title="Wishlist"
                >
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
              )}
            </>
          )}
        </div>

        {variant === 'standard' && (
          <div className="mt-2 px-1">
            <h3 className="text-text-primary text-body-sm font-medium truncate group-hover:text-action-primary transition-colors duration-200 ease-out">
              {book.title}
            </h3>
            <p className="text-text-secondary text-caption truncate">
              {primaryAuthor}
            </p>
          </div>
        )}
      </div>
    </Wrapper>
  )
}

export default BookCard
