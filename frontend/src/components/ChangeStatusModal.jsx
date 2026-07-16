import { useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import FormField from './ui/FormField'
import { useStatusLabels } from '../hooks/useStatusLabels'

/**
 * ChangeStatusModal — change a finished book back to another status.
 *
 * Props:
 *   book      — the book object (expects .date_finished for info display)
 *   onConfirm — (newStatus: string) => void
 *   onClose   — () => void
 *   error     — optional string; renders an error banner at the top of the body
 *               so the user sees why a prior submit failed.
 *   saving    — optional boolean; disables apply button and shows loading state.
 */
export default function ChangeStatusModal({ book, onConfirm, onClose, error, saving }) {
  const { labels } = useStatusLabels()
  const [selectedStatus, setSelectedStatus] = useState('')

  const statusOptions = [
    { value: 'Unread', label: labels['Unread'] },
    { value: 'In Progress', label: labels['In Progress'] },
    { value: 'Abandoned', label: labels['Abandoned'] },
  ]

  return (
    <Modal isOpen onClose={onClose} size="md">
      <Modal.Header onClose={onClose}>Change Status</Modal.Header>
      <Modal.Body>
        {error && (
          <div className="bg-action-danger/20 border border-action-danger text-action-danger px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        <FormField label="Status">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-action-primary"
          >
            <option value="">Select status…</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </FormField>
        {/* Snap-back honesty (B2): Unread deletes open sessions only —
            closed history keeps projecting, so nothing is "cleared" */}
        {selectedStatus === 'Unread' && book.date_finished && (
          <div className="mt-4 p-3 bg-bg-elevated/70 border border-border-subtle rounded-lg">
            <p className="text-body-sm text-text-secondary">
              Reading history is kept — this title may stay {labels['Finished']} until its past reads are deleted in History.
            </p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="primary" type="button" onClick={() => selectedStatus && onConfirm(selectedStatus)} disabled={!selectedStatus || saving} loading={saving}>Apply</Button>
      </Modal.Footer>
    </Modal>
  )
}
