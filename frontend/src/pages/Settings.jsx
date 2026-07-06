import { useState, useEffect } from 'react'
import {
  getSettings,
  updateSetting,
  syncLibrary,
  getBackupSettings,
  updateBackupSettings,
  testBackupPath,
  createManualBackup,
} from '../api'
import UnifiedNavBar from '../components/ui/UnifiedNavBar'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import SettingsRow from '../components/settings/SettingsRow'
import StatusLabelsModal from '../components/settings/StatusLabelsModal'
import RatingLabelsModal from '../components/settings/RatingLabelsModal'
import BackupRetentionModal from '../components/settings/BackupRetentionModal'
import RescanMetadataModal from '../components/settings/RescanMetadataModal'
import ExtractCoversModal from '../components/settings/ExtractCoversModal'
import { useStatusLabels } from '../hooks/useStatusLabels'
import { useRatingLabels } from '../hooks/useRatingLabels'
import { useNavigate } from 'react-router-dom'

// Section header used above each group
function SectionHeader({ children }) {
  return (
    <h2 className="text-label uppercase tracking-wide text-text-muted px-4 pt-6 pb-2">
      {children}
    </h2>
  )
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Never'
  const date = new Date(timestamp)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}

export default function Settings() {
  const navigate = useNavigate()
  const { labels: statusLabels } = useStatusLabels()
  const { labels: ratingLabels } = useRatingLabels()

  // Core settings state
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)

  // Reading speed
  const [wpmInput, setWpmInput] = useState('250')
  const [wpmStatus, setWpmStatus] = useState(null)

  // Grid preferences
  const [gridColumns, setGridColumns] = useState('3')
  const [gridCardVariant, setGridCardVariant] = useState(() => {
    try { return localStorage.getItem('liminal-grid-variant') === 'standard' ? 'standard' : 'compact' }
    catch { return 'compact' }
  })

  // Library Tools action state
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  // Backup state
  const [backupSettings, setBackupSettings] = useState(null)
  const [backupStats, setBackupStats] = useState(null)
  const [backupPath, setBackupPath] = useState('')
  const [pathTest, setPathTest] = useState(null)
  const [testingPath, setTestingPath] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [backupStatus, setBackupStatus] = useState(null)
  const [savingBackupSettings, setSavingBackupSettings] = useState(false)
  const [backupError, setBackupError] = useState(null)

  // Modal open state
  const [statusLabelsOpen, setStatusLabelsOpen] = useState(false)
  const [ratingLabelsOpen, setRatingLabelsOpen] = useState(false)
  const [retentionOpen, setRetentionOpen] = useState(false)
  const [rescanOpen, setRescanOpen] = useState(false)
  const [extractOpen, setExtractOpen] = useState(false)

  // Load initial settings
  useEffect(() => {
    document.title = 'Settings'
    setLoading(true)
    getSettings()
      .then(data => {
        setSettings(data)
        setWpmInput(data.reading_wpm || '250')
        if (data.grid_columns) setGridColumns(data.grid_columns)
      })
      .catch(err => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false))

    loadBackupSettings()
  }, [])

  const loadBackupSettings = async () => {
    try {
      setBackupError(null)
      const data = await getBackupSettings()
      setBackupSettings(data.settings)
      setBackupStats(data.stats)
      setBackupPath(data.settings?.backup_path || '/app/data/backups')
      setPathTest(null)
    } catch (err) {
      console.error('Failed to load backup settings:', err)
      setBackupError(err.message || 'Failed to load backup settings.')
    }
  }

  // --- Reading speed ---
  const handleWpmChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setWpmInput(value)
  }

  const handleWpmBlur = async () => {
    const wpmValue = parseInt(wpmInput, 10)
    let finalValue
    if (isNaN(wpmValue) || wpmValue < 50) finalValue = '50'
    else if (wpmValue > 2000) finalValue = '2000'
    else finalValue = String(wpmValue)   // normalize "0250" → "250"
    setWpmInput(finalValue)
    if (finalValue === String(settings.reading_wpm ?? '')) return
    setWpmStatus('saving')
    try {
      await updateSetting('reading_wpm', finalValue)
      setSettings(prev => ({ ...prev, reading_wpm: finalValue }))
      setWpmStatus('saved')
      setTimeout(() => setWpmStatus(null), 2000)
    } catch {
      setWpmStatus('error')
      setTimeout(() => setWpmStatus(null), 3000)
    }
  }

  // --- Grid columns ---
  const handleGridColumnsChange = async (value) => {
    setGridColumns(value)
    try {
      await updateSetting('grid_columns', value)
      setSettings(prev => ({ ...prev, grid_columns: value }))
      window.dispatchEvent(new CustomEvent('settingsChanged', { detail: { grid_columns: value } }))
    } catch (err) {
      console.error('Failed to save grid columns:', err)
    }
  }

  // --- Grid variant ---
  const handleGridVariantChange = (variant) => {
    setGridCardVariant(variant)
    try { localStorage.setItem('liminal-grid-variant', variant) } catch {}
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: { gridVariant: variant } }))
  }

  // --- Sync ---
  const handleSync = async () => {
    if (syncing) return
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await syncLibrary()
      setSyncResult({ success: true, message: `Found ${result.added} new, updated ${result.updated}` })
      if (result.added > 0 || result.updated > 0) {
        setTimeout(() => { window.location.reload() }, 1500)
      }
    } catch {
      setSyncResult({ success: false, message: 'Sync failed. Check console for details.' })
    } finally {
      setSyncing(false)
    }
  }

  // --- Backup handlers ---
  const handleBackupSettingChange = async (key, value) => {
    setBackupSettings(prev => ({ ...prev, [key]: value }))
    try {
      await updateBackupSettings({ [key]: value })
    } catch (err) {
      setBackupStatus({ success: false, message: err.message || 'Failed to save' })
    }
  }

  const handleTestPath = async () => {
    if (testingPath || !backupPath.trim()) return
    setTestingPath(true)
    setPathTest(null)
    try {
      const result = await testBackupPath(backupPath.trim())
      setPathTest(result)
    } catch (err) {
      setPathTest({ valid: false, error: err.message })
    } finally {
      setTestingPath(false)
    }
  }

  const handleSavePath = async () => {
    if (savingBackupSettings) return
    setSavingBackupSettings(true)
    setBackupStatus(null)
    try {
      await updateBackupSettings({ backup_path: backupPath.trim() })
      setBackupStatus({ success: true, message: 'Backup location saved.' })
      loadBackupSettings()
    } catch (err) {
      setBackupStatus({ success: false, message: err.message })
    } finally {
      setSavingBackupSettings(false)
    }
  }

  const handleManualBackup = async () => {
    if (creatingBackup) return
    setCreatingBackup(true)
    setBackupStatus(null)
    try {
      const result = await createManualBackup()
      if (result.success) {
        setBackupStatus({ success: true, message: 'Backup created.' })
        loadBackupSettings()
      } else {
        setBackupStatus({ success: false, message: result.error || 'Backup failed' })
      }
    } catch (err) {
      setBackupStatus({ success: false, message: err.message })
    } finally {
      setCreatingBackup(false)
    }
  }

  // --- Derived display values ---
  const statusLabelsPreview = [
    statusLabels['Unread'],
    statusLabels['In Progress'],
    statusLabels['Finished'],
    statusLabels['Abandoned'],
  ].join(' · ')

  const ratingLabelsPreview = `${ratingLabels[1]} → ${ratingLabels[5]}`

  const retentionPreview = backupSettings
    ? `${backupSettings.backup_daily_retention_days || 7}d · ${backupSettings.backup_weekly_retention_weeks || 4}w · ${backupSettings.backup_monthly_retention_months || 6}m`
    : '—'

  return (
    <div className="min-h-screen bg-bg-base pb-24">
      <UnifiedNavBar backLabel="Library" backTo="/" />

      <h1 className="text-h2 text-text-primary px-4 pt-4 pb-2">Settings</h1>

      {loading && (
        <div className="px-4 py-8 text-body-sm text-text-secondary">Loading settings…</div>
      )}

      {!loading && (
        <>
          {/* ================= APPEARANCE ================= */}
          <SectionHeader>Appearance</SectionHeader>
          <div className="px-2 space-y-1">
            {/* Books per row — inline segmented */}
            <div className="px-4 py-3">
              <div className="flex flex-col mb-3">
                <span className="text-body text-text-primary">Books per row (mobile)</span>
                <span className="text-body-sm text-text-muted mt-0.5">Applies to grid views.</span>
              </div>
              <div className="flex gap-2">
                {['2', '3', '4'].map(cols => (
                  <button
                    key={cols}
                    type="button"
                    onClick={() => handleGridColumnsChange(cols)}
                    className={`flex-1 min-h-[44px] px-4 rounded-lg text-sm font-medium transition-colors ${
                      gridColumns === cols
                        ? 'bg-action-primary text-text-primary'
                        : 'bg-bg-elevated text-text-secondary hover:bg-bg-surface'
                    }`}
                  >
                    {cols}
                  </button>
                ))}
              </div>
            </div>

            {/* Card style — inline segmented */}
            <div className="px-4 py-3">
              <div className="flex flex-col mb-3">
                <span className="text-body text-text-primary">Card style</span>
                <span className="text-body-sm text-text-muted mt-0.5">
                  Compact shows covers only. Standard adds title and author below.
                </span>
              </div>
              <div className="flex gap-2">
                {[
                  { value: 'compact', label: 'Compact' },
                  { value: 'standard', label: 'Standard' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleGridVariantChange(value)}
                    className={`flex-1 min-h-[44px] px-4 rounded-lg text-sm font-medium transition-colors ${
                      gridCardVariant === value
                        ? 'bg-action-primary text-text-primary'
                        : 'bg-bg-elevated text-text-secondary hover:bg-bg-surface'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <SettingsRow
              label="Status Labels"
              description={statusLabelsPreview}
              type="navigation"
              onClick={() => setStatusLabelsOpen(true)}
            />
            <SettingsRow
              label="Rating Labels"
              description={ratingLabelsPreview}
              type="navigation"
              onClick={() => setRatingLabelsOpen(true)}
            />
          </div>

          {/* ================= READING ================= */}
          <SectionHeader>Reading</SectionHeader>
          <div className="px-2 space-y-1">
            <div className="px-4 py-3">
              <div className="flex flex-col mb-3">
                <span className="text-body text-text-primary">Reading Speed</span>
                <span className="text-body-sm text-text-muted mt-0.5">Used to estimate read times.</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  value={wpmInput}
                  onChange={handleWpmChange}
                  onBlur={handleWpmBlur}
                  className="w-24 bg-bg-elevated px-3 py-2 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-center text-sm"
                  aria-label="Words per minute"
                />
                <span className="text-body-sm text-text-secondary">words per minute</span>
                {wpmStatus === 'saving' && <span className="text-body-sm text-text-secondary">Saving…</span>}
                {wpmStatus === 'saved' && <span className="text-action-success text-sm">✓</span>}
                {wpmStatus === 'error' && <span className="text-action-danger text-sm">Failed</span>}
              </div>
            </div>
          </div>

          {/* ================= LIBRARY TOOLS ================= */}
          <SectionHeader>Library Tools</SectionHeader>
          <div className="px-2 space-y-1">
            <SettingsRow
              label="Sync Library"
              description="Pull new titles from the library folder."
              type="navigation"
              onClick={handleSync}
              loading={syncing}
            />
            {syncResult && (
              <p className={`px-4 text-xs ${syncResult.success ? 'text-action-success' : 'text-action-danger'}`}>
                {syncResult.message}
              </p>
            )}
            <SettingsRow
              label="Find Duplicates"
              description="Review possible duplicate titles and merge them."
              type="navigation"
              onClick={() => navigate('/duplicates')}
            />
            <SettingsRow
              label="Rescan Metadata"
              description="Re-extract fandom, ships, source URLs, and more from EPUB files."
              type="navigation"
              onClick={() => setRescanOpen(true)}
            />
            <SettingsRow
              label="Extract Covers"
              description="Pull cover images from EPUB files for missing covers."
              type="navigation"
              onClick={() => setExtractOpen(true)}
            />
          </div>

          {/* ================= BACKUPS ================= */}
          <SectionHeader>Backups</SectionHeader>
          <div className="px-2 space-y-1">
            {backupSettings ? (
              <>
                <SettingsRow
                  label="Automated backups"
                  description="Scheduled grandfather–father–son rotation."
                  type="toggle"
                  checked={!!backupSettings.backup_enabled}
                  onChange={(val) => handleBackupSettingChange('backup_enabled', val)}
                />

                {backupSettings.backup_enabled && (
                  <>
                    {/* Schedule — inline select */}
                    <div className="px-4 py-3">
                      <FormField label="Schedule">
                        <select
                          value={backupSettings.backup_schedule || 'both'}
                          onChange={(e) => handleBackupSettingChange('backup_schedule', e.target.value)}
                          className="w-full bg-bg-elevated px-3 py-2 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm"
                        >
                          <option value="before_sync">Before every sync only</option>
                          <option value="daily">Daily at specified time</option>
                          <option value="both">Both (before sync + daily)</option>
                        </select>
                      </FormField>
                      {(backupSettings.backup_schedule === 'daily' || backupSettings.backup_schedule === 'both') && (
                        <div className="mt-3">
                          <FormField label="Daily time">
                            <input
                              type="time"
                              value={backupSettings.backup_time || '03:00'}
                              onChange={(e) => handleBackupSettingChange('backup_time', e.target.value)}
                              className="bg-bg-elevated px-3 py-2 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm"
                            />
                          </FormField>
                        </div>
                      )}
                    </div>

                    {/* Backup location — inline path + Test + Save */}
                    <div className="px-4 py-3">
                      <FormField label="Backup location">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={backupPath}
                            onChange={(e) => { setBackupPath(e.target.value); setPathTest(null) }}
                            placeholder="/app/data/backups"
                            className="flex-1 min-w-0 bg-bg-elevated px-3 py-2 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="shrink-0"
                            loading={testingPath}
                            disabled={testingPath || !backupPath.trim()}
                            onClick={handleTestPath}
                          >
                            Test
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            className="shrink-0"
                            loading={savingBackupSettings}
                            disabled={savingBackupSettings || !backupPath.trim() || backupPath === backupSettings.backup_path}
                            onClick={handleSavePath}
                          >
                            Save
                          </Button>
                        </div>
                      </FormField>
                      {pathTest && (
                        <p className={`text-xs mt-1 ${pathTest.valid ? 'text-action-success' : 'text-action-danger'}`}>
                          {pathTest.valid ? '✓ Path is writable' : `✗ ${pathTest.error}`}
                        </p>
                      )}
                    </div>

                    <SettingsRow
                      label="Retention"
                      description={retentionPreview}
                      type="navigation"
                      onClick={() => setRetentionOpen(true)}
                    />
                  </>
                )}

                {/* Stats */}
                {backupStats && (
                  <div className="mx-4 mt-2 bg-bg-elevated/70 border border-border-subtle rounded-lg p-3 text-xs">
                    <div className="grid grid-cols-2 gap-y-1 text-text-secondary">
                      <span>Last backup:</span><span>{formatTimeAgo(backupStats.last_backup_time)}</span>
                      <span>Storage used:</span><span>{formatBytes(backupStats.total_size)}</span>
                      <span>Total backups:</span><span>{backupStats.total_backups}</span>
                    </div>
                  </div>
                )}

                {/* Status banner */}
                {backupStatus && (
                  <div
                    className={`mx-4 mt-2 rounded-lg p-3 text-sm ${
                      backupStatus.success
                        ? 'bg-action-success/10 border border-action-success/30 text-action-success'
                        : 'bg-action-danger/10 border border-action-danger/30 text-action-danger'
                    }`}
                  >
                    {backupStatus.message}
                  </div>
                )}

                {/* Manual backup */}
                <div className="px-4 pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full"
                    loading={creatingBackup}
                    disabled={creatingBackup}
                    onClick={handleManualBackup}
                  >
                    {creatingBackup ? 'Creating backup…' : 'Create backup now'}
                  </Button>
                </div>
              </>
            ) : backupError ? (
              <div className="mx-4 my-2 space-y-2">
                <div className="bg-action-danger/10 border border-action-danger/30 rounded-lg p-3 text-sm text-action-danger">
                  {backupError}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={loadBackupSettings}>
                  Try again
                </Button>
              </div>
            ) : (
              <p className="px-4 py-3 text-body-sm text-text-muted">Loading backup settings…</p>
            )}
          </div>
        </>
      )}

      {/* Sub-modals */}
      <StatusLabelsModal isOpen={statusLabelsOpen} onClose={() => setStatusLabelsOpen(false)} />
      <RatingLabelsModal isOpen={ratingLabelsOpen} onClose={() => setRatingLabelsOpen(false)} />
      <BackupRetentionModal
        isOpen={retentionOpen}
        onClose={() => { setRetentionOpen(false); loadBackupSettings() }}
      />
      <RescanMetadataModal isOpen={rescanOpen} onClose={() => setRescanOpen(false)} />
      <ExtractCoversModal isOpen={extractOpen} onClose={() => setExtractOpen(false)} />
    </div>
  )
}
