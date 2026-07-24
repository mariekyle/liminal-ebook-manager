import { useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import FormField from './ui/FormField'
import StarRating from './ui/StarRating'

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
  const [dateError, setDateError] = useState(null)

  const handleSubmit = () => {
    if (!dateFinished) {
      setDateError('Pick a date to mark this as finished')
      return
    }
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
          <FormField label="Date finished" error={dateError}>
            <input
              type="date"
              value={dateFinished}
              onChange={(e) => {
                setDateFinished(e.target.value)
                if (e.target.value) setDateError(null)
              }}
              className={`w-full px-3 py-2 bg-bg-elevated border rounded-lg text-text-primary text-sm focus:outline-none ${
                dateError ? 'border-action-danger focus:border-action-danger' : 'border-border-default focus:border-action-primary'
              }`}
            />
          </FormField>
          <FormField label="Rating (optional)">
            <div className="flex flex-wrap items-center gap-1">
              {/* StarRating's toggle-to-clear emits null — normalize to the
                  modal's 0-means-unrated state */}
              <StarRating
                value={rating || null}
                onChange={(val) => setRating(val || 0)}
                size="lg"
              />
              {rating > 0 && (
                <Button type="button" variant="ghost" size="sm" className="ml-2" onClick={() => setRating(0)}>
                  Clear
                </Button>
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
