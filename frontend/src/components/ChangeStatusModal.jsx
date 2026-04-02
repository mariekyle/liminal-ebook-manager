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
 */
export default function ChangeStatusModal({ book, onConfirm, onClose }) {
  const { labels } = useStatusLabels()
  const [selectedStatus, setSelectedStatus] = useState('')

  const statusOptions = [
    { value: 'Unread', label: labels['Unread'] },
    { value: 'In Progress', label: labels['In Progress'] },
    { value: 'Abandoned', label: labels['Abandoned'] },
  ]

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <Modal isOpen onClose={onClose} size="md">
      <Modal.Header onClose={onClose}>Change Status</Modal.Header>
      <Modal.Body>
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
        {book.date_finished && (
          <div className="mt-4 p-3 bg-bg-elevated/70 border border-border-subtle rounded-lg">
            <p className="text-body-sm text-text-secondary">
              Finish date will be cleared ({formatDate(book.date_finished)})
            </p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="button" onClick={() => selectedStatus && onConfirm(selectedStatus)} disabled={!selectedStatus}>Apply</Button>
      </Modal.Footer>
    </Modal>
  )
}
