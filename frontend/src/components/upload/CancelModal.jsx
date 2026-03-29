/**
 * CancelModal.jsx
 *
 * Confirmation modal for canceling an upload.
 */

import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function CancelModal({ isOpen, onClose, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <Modal.Header onClose={onClose}>Cancel Upload?</Modal.Header>
      <Modal.Body>
        <p className="text-body-sm text-text-secondary">
          Your selected files will be discarded. This action cannot be undone.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" onClick={onClose}>
          Keep Editing
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm}>
          Discard
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
