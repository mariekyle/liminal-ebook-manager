import { useState, useEffect } from 'react'
import { getSettings, updateSetting } from '../../api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import FormField from '../ui/FormField'

const DEFAULTS = {
  1: 'Disliked',
  2: 'Disappointing',
  3: 'Decent/Fine',
  4: 'Better than Good',
  5: 'All-time Fav',
}

export default function RatingLabelsModal({ isOpen, onClose }) {
  const [labels, setLabels] = useState(DEFAULTS)

  useEffect(() => {
    if (!isOpen) return
    getSettings()
      .then(data => {
        setLabels({
          1: data.rating_label_1 || DEFAULTS[1],
          2: data.rating_label_2 || DEFAULTS[2],
          3: data.rating_label_3 || DEFAULTS[3],
          4: data.rating_label_4 || DEFAULTS[4],
          5: data.rating_label_5 || DEFAULTS[5],
        })
      })
      .catch(err => console.error('Failed to load rating labels:', err))
  }, [isOpen])

  const handleChange = (star, value) => {
    setLabels(prev => ({ ...prev, [star]: value }))
  }

  const handleBlur = async (star) => {
    const raw = labels[star]
    const value = raw.trim() || DEFAULTS[star]
    setLabels(prev => ({ ...prev, [star]: value }))
    try {
      await updateSetting(`rating_label_${star}`, value)
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: { ratingLabels: true } }))
    } catch (err) {
      console.error('Failed to save rating label:', err)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} aria-label="Edit rating labels">
      <Modal.Header onClose={onClose}>Rating Labels</Modal.Header>
      <Modal.Body>
        <p className="text-body-sm text-text-secondary mb-4">
          Customize what each star rating means. Used everywhere ratings appear.
        </p>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(star => (
            <FormField key={star} label={`${star} ★`}>
              <input
                type="text"
                value={labels[star]}
                onChange={(e) => handleChange(star, e.target.value)}
                onBlur={() => handleBlur(star)}
                placeholder={DEFAULTS[star]}
                className="w-full bg-bg-elevated px-3 py-2 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm"
              />
            </FormField>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="primary" onClick={onClose}>Done</Button>
      </Modal.Footer>
    </Modal>
  )
}
