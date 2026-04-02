/**
 * BookContextMenu — floating menu shown on long-press/right-click of a BookCard.
 * Offers quick status actions: Mark Finished or Change Status.
 *
 * Props:
 *   book     — the book object (needs .status)
 *   position — { x, y } screen coordinates
 *   onMarkFinished — () => void (opens MarkFinishedModal)
 *   onChangeStatus — () => void (opens ChangeStatusModal)
 *   onClose  — () => void
 */
export default function BookContextMenu({ book, position, onMarkFinished, onChangeStatus, onClose }) {
  if (!book) return null

  const isFinished = book.status === 'Finished'

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-48 bg-bg-elevated rounded-lg shadow-xl border border-border-default overflow-hidden"
        style={{
          left: Math.min(position.x, window.innerWidth - 200),
          top: Math.min(position.y, window.innerHeight - 100),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isFinished ? (
          <button
            type="button"
            onClick={() => { onChangeStatus(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-surface transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M1 4v10h10M23 20V10H13" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Update Status
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { onMarkFinished(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-text-primary hover:bg-bg-surface transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            Mark Finished
          </button>
        )}
      </div>
    </>
  )
}
