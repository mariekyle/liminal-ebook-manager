import { useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import FormField from './ui/FormField'

/**
 * MarkFinishedModal — quick-action modal for marking a book as finished.
 * Collects date finished and optional rating.
 *
 * Props:
 *   book      — the book object
 *   onConfirm — (dateFinished: string, rating: number|null) => void
 *   onClose   — () => void
 *   error     — optional string; when set, renders a non-blocking error banner
 *               at the top of the body so the user sees why a prior submit failed.
 *   saving    — optional boolean; disables submit button and shows loading state.
 */
export default function MarkFinishedModal({ book, onConfirm, onClose, error, saving }) {
  const [dateFinished, setDateFinished] = useState(() => {
    if (book.date_finished) {
      return book.date_finished.split('T')[0]
    }
    return new Date().toISOString().split('T')[0]
  })
  const [rating, setRating] = useState(book.rating || 0)
  const [hoveredRating, setHoveredRating] = useState(0)

  const handleSubmit = () => {
    onConfirm(dateFinished, rating || null)
  }

  return (
    <Modal isOpen onClose={onClose} size="md">
      <Modal.Header onClose={onClose}>Mark as Finished</Modal.Header>
      <Modal.Body>
        {error && (
          <div className="bg-action-danger/20 border border-action-danger text-action-danger px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <FormField label="Date finished">
            <input
              type="date"
              value={dateFinished}
              onChange={(e) => setDateFinished(e.target.value)}
              className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-action-primary"
            />
          </FormField>
          <FormField label="Rating (optional)">
            <div className="flex flex-wrap items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? 0 : star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-colors"
                >
                  <svg
                    className={`w-7 h-7 ${
                      star <= (hoveredRating || rating)
                        ? 'text-action-warning fill-current'
                        : 'text-text-muted'
                    }`}
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className="ml-2 text-caption text-text-muted hover:text-text-secondary"
                >
                  Clear
                </button>
              )}
            </div>
          </FormField>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="primary" type="button" onClick={handleSubmit} disabled={saving} loading={saving}>Mark Finished</Button>
      </Modal.Footer>
    </Modal>
  )
}
