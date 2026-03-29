import { useState, useEffect } from 'react'
import { updateAuthor } from '../api'
import Modal from './ui/Modal'
import Button from './ui/Button'
import FormField from './ui/FormField'

function EditAuthorModal({ author, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (author && isOpen) {
      setFormData({
        name: author.name || '',
        notes: author.notes || ''
      })
      setError(null)
    }
  }, [author, isOpen])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const trimmedName = formData.name.trim()
    
    if (!trimmedName) {
      setError('Author name cannot be empty')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const result = await updateAuthor(author.name, {
        newName: trimmedName !== author.name ? trimmedName : null,
        notes: formData.notes
      })
      
      onSave(result)
      onClose()
    } catch (err) {
      console.error('Failed to update author:', err)
      setError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!author) return null

  const isRenaming = formData.name.trim() !== author?.name
  const nameInvalid = !formData.name.trim()
  const nameErrorMsg = error && error.includes('cannot be empty') ? error : undefined

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <Modal.Header onClose={onClose}>Edit Author</Modal.Header>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <Modal.Body className="space-y-4">
          {error && !nameErrorMsg && (
            <div
              role="alert"
              className="rounded-lg px-3 py-2 text-sm bg-action-danger/10 border border-action-danger/30 text-action-danger"
            >
              {error}
            </div>
          )}

          <FormField label="Name" error={nameErrorMsg}>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 bg-bg-elevated border rounded-lg text-text-primary text-sm focus:outline-none focus:border-action-primary ${
                nameErrorMsg ? 'border-action-danger' : 'border-border-default'
              }`}
            />
          </FormField>
          {isRenaming && (
            <p className="text-caption text-action-warning -mt-2">
              Renaming will update all books by this author
            </p>
          )}

          <FormField
            label="Notes"
            type="textarea"
            rows={6}
            value={formData.notes}
            onChange={(v) => handleInputChange('notes', v)}
            placeholder="Add notes about this author..."
          />
        </Modal.Body>

        <Modal.Footer>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving} disabled={saving || nameInvalid}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}

export default EditAuthorModal
