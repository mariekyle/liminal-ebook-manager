import { useState, useEffect } from 'react'
import { getSettings, updateSetting } from '../../api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import FormField from '../ui/FormField'

const DEFAULTS = { unread: 'Unread', in_progress: 'In Progress', finished: 'Finished', dnf: 'DNF' }
const FIELDS = ['unread', 'in_progress', 'finished', 'dnf']

export default function StatusLabelsModal({ isOpen, onClose }) {
  const [labels, setLabels] = useState(DEFAULTS)

  useEffect(() => {
    if (!isOpen) return
    getSettings()
      .then(data => {
        setLabels({
          unread: data.status_label_unread || DEFAULTS.unread,
          in_progress: data.status_label_in_progress || DEFAULTS.in_progress,
          finished: data.status_label_finished || DEFAULTS.finished,
          dnf: data.status_label_dnf || DEFAULTS.dnf,
        })
      })
      .catch(err => console.error('Failed to load status labels:', err))
  }, [isOpen])

  const handleChange = (key, value) => {
    setLabels(prev => ({ ...prev, [key]: value }))
  }

  // Save-on-commit path shared by blur and Reset — this modal has no Save
  // button, so a state-only reset would never persist
  const persistLabel = async (key, value) => {
    const next = { ...labels, [key]: value }
    setLabels(next)
    try {
      await updateSetting(`status_label_${key}`, value)
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: { statusLabels: next } }))
    } catch (err) {
      console.error('Failed to save status label:', err)
    }
  }

  const handleBlur = (key) => persistLabel(key, labels[key].trim() || DEFAULTS[key])

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} aria-label="Edit status labels">
      <Modal.Header onClose={onClose}>Status Labels</Modal.Header>
      <Modal.Body>
        <p className="text-body-sm text-text-secondary mb-4">
          Rename any reading status. Shorter labels fit better in filters and badges.
        </p>
        <div className="space-y-3">
          {FIELDS.map((key) => (
            <FormField key={key}>
              {/* Static canonical default as the row title — the custom value
                  lives in the input only. min-h-11 keeps row height stable
                  whether or not the Reset link renders. */}
              <div className="flex items-center justify-between min-h-11">
                <label className="block text-label text-text-body">{DEFAULTS[key]}</label>
                {labels[key] !== DEFAULTS[key] && (
                  <button
                    type="button"
                    onClick={() => persistLabel(key, DEFAULTS[key])}
                    aria-label={`Reset ${DEFAULTS[key]} label`}
                    className="min-h-11 px-3 -mr-3 text-body-sm text-action-primary"
                  >
                    Reset
                  </button>
                )}
              </div>
              <input
                type="text"
                value={labels[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                onBlur={() => handleBlur(key)}
                placeholder={DEFAULTS[key]}
                className="w-full bg-bg-elevated px-3 py-2 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm"
              />
            </FormField>
          ))}
        </div>
        <p className="text-text-muted text-xs mt-3">Changes apply throughout the app.</p>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="primary" onClick={onClose}>Done</Button>
      </Modal.Footer>
    </Modal>
  )
}
