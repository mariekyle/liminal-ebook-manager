import { useState, useEffect } from 'react'
import { getSettings, updateSetting } from '../../api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import FormField from '../ui/FormField'

const DEFAULTS = { unread: 'Unread', in_progress: 'In Progress', finished: 'Finished', dnf: 'DNF' }
const FIELDS = ['unread', 'in_progress', 'finished', 'dnf']

export default function StatusLabelsModal({ isOpen, onClose }) {
  const [labels, setLabels] = useState(DEFAULTS)
  const [loadError, setLoadError] = useState(null)
  // { key, message } — renders at the failed field's row (save-on-blur has no
  // Save button, so the field is the point of action)
  const [saveError, setSaveError] = useState(null)

  const loadLabels = () => {
    setLoadError(null)
    getSettings()
      .then(data => {
        setLabels({
          unread: data.status_label_unread || DEFAULTS.unread,
          in_progress: data.status_label_in_progress || DEFAULTS.in_progress,
          finished: data.status_label_finished || DEFAULTS.finished,
          dnf: data.status_label_dnf || DEFAULTS.dnf,
        })
      })
      .catch(err => {
        console.error('Failed to load status labels:', err)
        setLoadError("Couldn't load your labels.")
      })
  }

  useEffect(() => {
    if (!isOpen) return
    setSaveError(null)
    loadLabels()
  }, [isOpen])

  const handleChange = (key, value) => {
    setLabels(prev => ({ ...prev, [key]: value }))
  }

  // Save-on-commit path shared by blur and Reset — this modal has no Save
  // button, so a state-only reset would never persist
  const persistLabel = async (key, value) => {
    const prevValue = labels[key]
    const next = { ...labels, [key]: value }
    setLabels(next)
    setSaveError(null)
    try {
      await updateSetting(`status_label_${key}`, value)
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: { statusLabels: next } }))
    } catch (err) {
      console.error('Failed to save status label:', err)
      // Roll back the optimistic value: the field (and the Reset link's render
      // condition) must reflect what the database still holds — a failed Reset
      // otherwise shows the default while the DB keeps the custom label
      setLabels(prev => ({ ...prev, [key]: prevValue }))
      setSaveError({ key, message: "Couldn't save your changes. Try again?" })
    }
  }

  const handleBlur = (key) => persistLabel(key, labels[key].trim() || DEFAULTS[key])

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} aria-label="Edit status labels">
      <Modal.Header onClose={onClose}>Status Labels</Modal.Header>
      <Modal.Body>
        {loadError && (
          <div
            role="alert"
            className="mb-3 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-body-sm bg-action-danger/10 border border-action-danger/30 text-action-danger"
          >
            <span>{loadError}</span>
            <Button type="button" variant="secondary" size="sm" onClick={loadLabels}>
              Try again
            </Button>
          </div>
        )}
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
                className={`w-full bg-bg-elevated px-3 py-2 rounded text-text-primary border focus:border-action-primary focus:outline-none text-sm ${
                  saveError?.key === key ? 'border-action-danger' : 'border-border-default'
                }`}
              />
              {saveError?.key === key && (
                <p role="alert" className="mt-1.5 text-caption text-action-danger">
                  {saveError.message}
                </p>
              )}
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
