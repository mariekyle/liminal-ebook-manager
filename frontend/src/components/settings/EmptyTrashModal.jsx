import { useState, useEffect } from 'react'
import { emptyTrash } from '../../api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import FormField from '../ui/FormField'

const CONFIRM_WORD = 'forever'

/**
 * EmptyTrashModal — type-to-confirm gate for the app's only truly
 * irreversible operation (Batch 3 B1, Decisions 2026-07-16).
 *
 * While the request runs, every close path no-ops (Keep files, ×,
 * Escape, backdrop — the v0.57.0 editionDeleting precedent; the shared
 * Modal funnels all three chrome paths through onClose). Partial or
 * total failure keeps the modal open with an inline banner at the point
 * of action and asks the parent to refetch stats so the shown count
 * stays honest.
 */
export default function EmptyTrashModal({
  isOpen,
  onClose,
  itemCount,
  sizeLabel,
  onEmptied,
  onRefreshStats,
}) {
  const [confirmText, setConfirmText] = useState('')
  const [emptying, setEmptying] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    setConfirmText('')
    setError(null)
  }, [isOpen])

  // Case-insensitive + trimmed — strict-case matching would punish
  // mobile keyboards for autocapitalizing
  const confirmed = confirmText.trim().toLowerCase() === CONFIRM_WORD

  const handleClose = () => {
    if (emptying) return
    onClose()
  }

  const handleEmpty = async () => {
    if (emptying || !confirmed) return
    setEmptying(true)
    setError(null)
    try {
      const result = await emptyTrash()
      if ((result.errors || []).length === 0) {
        onEmptied()
      } else {
        const remaining = result.errors.length
        setError(
          `Couldn't empty the trash completely. ${remaining} item${remaining === 1 ? '' : 's'} remain — try again?`
        )
        onRefreshStats()
      }
    } catch {
      setError("Couldn't empty the trash. Try again?")
      onRefreshStats()
    } finally {
      setEmptying(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} aria-label="Empty trash">
      <Modal.Header onClose={handleClose}>Empty trash?</Modal.Header>
      <Modal.Body>
        <p className="text-body-sm text-text-primary">
          This deletes {itemCount} {itemCount === 1 ? 'item' : 'items'} ({sizeLabel}) for
          good. Emptied files skip the NAS recycle bin, and backups cover the library
          database only — not book files. Nothing can bring them back.
        </p>
        <div className="mt-4">
          <FormField label={`Type ${CONFIRM_WORD} to confirm`}>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full bg-bg-elevated px-3 py-2 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm"
              aria-label={`Type ${CONFIRM_WORD} to confirm emptying the trash`}
            />
          </FormField>
        </div>
        {error && (
          <div
            role="alert"
            className="mt-3 rounded-lg px-3 py-2 text-body-sm bg-action-danger/10 border border-action-danger/30 text-action-danger"
          >
            {error}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="ghost" onClick={handleClose} disabled={emptying}>
          Keep files
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleEmpty}
          loading={emptying}
          disabled={emptying || !confirmed}
        >
          Empty trash
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
