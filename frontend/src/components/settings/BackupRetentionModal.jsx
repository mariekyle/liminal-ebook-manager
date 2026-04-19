import { useState, useEffect } from 'react'
import { getBackupSettings, updateBackupSettings } from '../../api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import FormField from '../ui/FormField'

const DEFAULTS = {
  backup_daily_retention_days: 7,
  backup_weekly_retention_weeks: 4,
  backup_monthly_retention_months: 6,
}

export default function BackupRetentionModal({ isOpen, onClose }) {
  const [values, setValues] = useState(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    getBackupSettings()
      .then(data => {
        const s = data.settings || {}
        setValues({
          backup_daily_retention_days: s.backup_daily_retention_days ?? 7,
          backup_weekly_retention_weeks: s.backup_weekly_retention_weeks ?? 4,
          backup_monthly_retention_months: s.backup_monthly_retention_months ?? 6,
        })
      })
      .catch(err => setError(err.message || 'Failed to load retention settings'))
  }, [isOpen])

  const handleChange = (key, raw, min, max) => {
    const parsed = parseInt(raw, 10)
    const clamped = isNaN(parsed) ? DEFAULTS[key] : Math.max(min, Math.min(max, parsed))
    setValues(prev => ({ ...prev, [key]: clamped }))
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      await updateBackupSettings(values)
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: { backupSettings: true } }))
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save retention settings')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} aria-label="Edit backup retention">
      <Modal.Header onClose={onClose}>Backup Retention</Modal.Header>
      <Modal.Body>
        <p className="text-body-sm text-text-secondary mb-4">
          How long to keep each backup tier before automatic cleanup.
        </p>
        {error && (
          <div className="mb-3 bg-action-danger/10 border border-action-danger/30 rounded-lg p-3 text-sm text-action-danger">
            {error}
          </div>
        )}
        <div className="space-y-3">
          <FormField label="Daily backups (days)">
            <input
              type="number"
              min="1"
              max="30"
              value={values.backup_daily_retention_days}
              onChange={(e) => handleChange('backup_daily_retention_days', e.target.value, 1, 30)}
              className="w-24 bg-bg-elevated px-3 py-2 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm text-center"
            />
          </FormField>
          <FormField label="Weekly backups (weeks)">
            <input
              type="number"
              min="1"
              max="12"
              value={values.backup_weekly_retention_weeks}
              onChange={(e) => handleChange('backup_weekly_retention_weeks', e.target.value, 1, 12)}
              className="w-24 bg-bg-elevated px-3 py-2 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm text-center"
            />
          </FormField>
          <FormField label="Monthly backups (months)">
            <input
              type="number"
              min="1"
              max="24"
              value={values.backup_monthly_retention_months}
              onChange={(e) => handleChange('backup_monthly_retention_months', e.target.value, 1, 24)}
              className="w-24 bg-bg-elevated px-3 py-2 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm text-center"
            />
          </FormField>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="button" variant="primary" onClick={handleSave} loading={saving} disabled={saving}>Save</Button>
      </Modal.Footer>
    </Modal>
  )
}
