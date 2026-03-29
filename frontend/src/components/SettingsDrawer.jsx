import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSettings, updateSetting, syncLibrary, previewRescan, rescanMetadata, getBackupSettings, updateBackupSettings, testBackupPath, createManualBackup, bulkExtractCovers } from '../api'
import Button from './ui/Button'
import IconButton from './ui/IconButton'
import FormField from './ui/FormField'

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

function SettingsDrawer({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [wpmInput, setWpmInput] = useState('')
  const [wpmStatus, setWpmStatus] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [gridColumns, setGridColumns] = useState('2')
  const [statusLabels, setStatusLabels] = useState({
    unread: 'Unread',
    in_progress: 'In Progress',
    finished: 'Finished',
    dnf: 'Abandoned'
  })
  const [ratingLabels, setRatingLabels] = useState({
    1: 'Disliked',
    2: 'Disappointing', 
    3: 'Decent/Fine',
    4: 'Better than Good',
    5: 'All-time Fav'
  })
  const [rescanPreview, setRescanPreview] = useState(null)
  const [rescanLoading, setRescanLoading] = useState(false)
  const [rescanResults, setRescanResults] = useState(null)
  const drawerRef = useRef(null)
  const [showTitleBelow, setShowTitleBelow] = useState(false)
  const [showAuthorBelow, setShowAuthorBelow] = useState(false)
  const [showSeriesBelow, setShowSeriesBelow] = useState(false)
  
  // Phase 9A: Backup settings state
  const [backupSettings, setBackupSettings] = useState(null)
  const [backupStats, setBackupStats] = useState(null)
  const [backupPath, setBackupPath] = useState('')
  const [pathTest, setPathTest] = useState(null)
  const [testingPath, setTestingPath] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [backupStatus, setBackupStatus] = useState(null)
  const [savingBackupSettings, setSavingBackupSettings] = useState(false)

  // Phase 9C: Cover extraction state
  const [extracting, setExtracting] = useState(false)
  const [extractCategories, setExtractCategories] = useState({
    Fiction: true,
    'Non-Fiction': true
  })
  const [extractResults, setExtractResults] = useState(null)

  // Load settings when drawer opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      getSettings()
        .then(data => {
          setSettings(data)
          setWpmInput(data.reading_wpm || '250')
          if (data.grid_columns) {
            setGridColumns(data.grid_columns)
          }
          // Load status labels
          setStatusLabels({
            unread: data.status_label_unread || 'Unread',
            in_progress: data.status_label_in_progress || 'In Progress',
            finished: data.status_label_finished || 'Finished',
            dnf: data.status_label_dnf || 'Abandoned'
          })
          // Load rating labels
          setRatingLabels({
            1: data.rating_label_1 || 'Disliked',
            2: data.rating_label_2 || 'Disappointing',
            3: data.rating_label_3 || 'Decent/Fine',
            4: data.rating_label_4 || 'Better than Good',
            5: data.rating_label_5 || 'All-time Fav'
          })
          // Load display settings
          setShowTitleBelow(data.show_title_below === 'true')
          setShowAuthorBelow(data.show_author_below === 'true')
          setShowSeriesBelow(data.show_series_below === 'true')
        })
        .catch(err => console.error('Failed to load settings:', err))
        .finally(() => setLoading(false))
      
      // Load rescan preview
      loadRescanPreview()
      
      // Load backup settings
      loadBackupSettings()
    }
  }, [isOpen])
  
  const loadRescanPreview = async () => {
    try {
      const preview = await previewRescan()
      setRescanPreview(preview)
    } catch (err) {
      console.error('Failed to load rescan preview:', err)
    }
  }

  // Phase 9A: Backup settings handlers
  const loadBackupSettings = async () => {
    try {
      const data = await getBackupSettings()
      setBackupSettings(data.settings)
      setBackupStats(data.stats)
      setBackupPath(data.settings?.backup_path || '/app/data/backups')
      setPathTest(null)
      setBackupStatus(null)
    } catch (err) {
      console.error('Failed to load backup settings:', err)
    }
  }

  const handleBackupSettingsChange = (key, value) => {
    setBackupSettings(prev => ({ ...prev, [key]: value }))
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

  const handleManualBackup = async () => {
    if (creatingBackup) return
    
    setCreatingBackup(true)
    setBackupStatus(null)
    
    try {
      const result = await createManualBackup()
      if (result.success) {
        setBackupStatus({ success: true, message: 'Backup created successfully!' })
        // Reload stats
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

  const handleSaveBackupSettings = async () => {
    if (savingBackupSettings) return
    
    setSavingBackupSettings(true)
    setBackupStatus(null)
    
    try {
      const settingsToSave = {
        backup_enabled: backupSettings?.backup_enabled,
        backup_path: backupPath.trim(),
        backup_schedule: backupSettings?.backup_schedule,
        backup_time: backupSettings?.backup_time,
        backup_daily_retention_days: backupSettings?.backup_daily_retention_days,
        backup_weekly_retention_weeks: backupSettings?.backup_weekly_retention_weeks,
        backup_monthly_retention_months: backupSettings?.backup_monthly_retention_months,
      }
      
      await updateBackupSettings(settingsToSave)
      setBackupStatus({ success: true, message: 'Backup settings saved!' })
      // Reload to confirm
      loadBackupSettings()
    } catch (err) {
      setBackupStatus({ success: false, message: err.message })
    } finally {
      setSavingBackupSettings(false)
    }
  }

  // Phase 9C: Cover extraction handler
  const handleBulkExtract = async () => {
    if (extracting) return
    
    const selectedCategories = Object.entries(extractCategories)
      .filter(([_, selected]) => selected)
      .map(([category]) => category)
    
    if (selectedCategories.length === 0) {
      setExtractResults({ error: 'Select at least one category' })
      return
    }
    
    setExtracting(true)
    setExtractResults(null)
    
    try {
      const results = await bulkExtractCovers(selectedCategories)
      setExtractResults(results)
    } catch (err) {
      setExtractResults({ error: err.message })
    } finally {
      setExtracting(false)
    }
  }

  // Utility: format bytes to human readable
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Utility: format timestamp to relative time
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const handleRescan = async () => {
    if (rescanLoading) return
    
    setRescanLoading(true)
    setRescanResults(null)
    
    try {
      const results = await rescanMetadata()
      setRescanResults(results)
    } catch (err) {
      console.error('Rescan failed:', err)
      setRescanResults({ error: err.message })
    } finally {
      setRescanLoading(false)
      // Refresh preview
      loadRescanPreview()
    }
  }

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Handle escape key
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleWpmChange = (e) => {
    // Only allow numbers, max 4 characters
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setWpmInput(value)
  }

  const handleWpmBlur = async () => {
    const wpmValue = parseInt(wpmInput, 10)
    
    // Validate: must be between 50 and 2000
    if (isNaN(wpmValue) || wpmValue < 50) {
      setWpmInput('50')
      await saveWpm('50')
    } else if (wpmValue > 2000) {
      setWpmInput('2000')
      await saveWpm('2000')
    } else if (wpmInput !== settings.reading_wpm) {
      await saveWpm(wpmInput)
    }
  }

  const saveWpm = async (value) => {
    setWpmStatus('saving')
    try {
      await updateSetting('reading_wpm', value)
      setSettings(prev => ({ ...prev, reading_wpm: value }))
      setWpmStatus('saved')
      setTimeout(() => setWpmStatus(null), 2000)
    } catch (err) {
      console.error('Failed to save WPM:', err)
      setWpmStatus('error')
      setTimeout(() => setWpmStatus(null), 3000)
    }
  }

  const handleGridColumnsChange = async (value) => {
    setGridColumns(value)
    try {
      await updateSetting('grid_columns', value)
      setSettings(prev => ({ ...prev, grid_columns: value }))
      // Notify other components of the change
      window.dispatchEvent(new CustomEvent('settingsChanged', { 
        detail: { grid_columns: value } 
      }))
    } catch (err) {
      console.error('Failed to save grid columns:', err)
    }
  }

  const handleStatusLabelChange = (key, value) => {
    setStatusLabels(prev => ({ ...prev, [key]: value }))
  }

  const handleStatusLabelBlur = async (key) => {
    const value = statusLabels[key]
    const defaults = { unread: 'Unread', in_progress: 'In Progress', finished: 'Finished', dnf: 'Abandoned' }
    
    if (!value.trim()) {
      // Reset to default if empty
      setStatusLabels(prev => ({ ...prev, [key]: defaults[key] }))
      await updateSetting(`status_label_${key}`, defaults[key])
    } else {
      await updateSetting(`status_label_${key}`, value.trim())
    }
  }

  // Rating label handlers (similar to status labels)
  const handleRatingLabelChange = (star, value) => {
    setRatingLabels(prev => ({ ...prev, [star]: value }))
  }

  const handleRatingLabelBlur = async (star) => {
    const value = ratingLabels[star]
    const defaults = { 1: 'Disliked', 2: 'Disappointing', 3: 'Decent/Fine', 4: 'Better than Good', 5: 'All-time Fav' }
    
    try {
      if (!value.trim() || value.trim() === defaults[star]) {
        // Reset to default
        await updateSetting(`rating_label_${star}`, defaults[star])
        setRatingLabels(prev => ({ ...prev, [star]: defaults[star] }))
      } else {
        await updateSetting(`rating_label_${star}`, value.trim())
      }
      // Emit event for other components to refresh
      window.dispatchEvent(new Event('settingsChanged'))
    } catch (err) {
      console.error('Failed to save rating label:', err)
    }
  }

  const handleDisplayToggle = async (setting, currentValue, setter) => {
    const newValue = !currentValue
    setter(newValue)
    try {
      await updateSetting(setting, newValue.toString())
      // Notify other components of the change
      window.dispatchEvent(new CustomEvent('settingsChanged', { 
        detail: { [setting]: newValue } 
      }))
    } catch (err) {
      console.error('Failed to save display setting:', err)
      // Revert on failure
      setter(!newValue)
    }
  }

  const handleSync = async () => {
    if (syncing) return
    
    setSyncing(true)
    setSyncResult(null)
    
    try {
      const result = await syncLibrary()
      setSyncResult({
        success: true,
        message: `Found ${result.added} new, updated ${result.updated} books`
      })
      // Reload page after brief delay so user sees the success message
      if (result.added > 0 || result.updated > 0) {
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (err) {
      console.error('Sync failed:', err)
      setSyncResult({
        success: false,
        message: 'Sync failed. Check console for details.'
      })
    } finally {
      setSyncing(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-bg-overlay z-40 transition-opacity"
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          fixed top-0 right-0 h-full w-full sm:w-80 
          bg-bg-surface border-l border-border-default
          z-50 transform transition-transform duration-200 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          overflow-y-auto
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border-default">
          <h2 className="text-h4 text-text-primary">Settings</h2>
          <IconButton type="button" variant="default" size="md" onClick={onClose} aria-label="Close settings" tooltip="Close">
            <XIcon />
          </IconButton>
        </div>

        {loading ? (
          <div className="p-4 text-body-sm text-text-secondary">Loading settings...</div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Reading Speed Section */}
            <section>
              <FormField label="Reading Speed">
                <p className="text-body-sm text-text-secondary mb-3">
                  Used to estimate how long it takes to finish a book.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={wpmInput}
                    onChange={handleWpmChange}
                    onBlur={handleWpmBlur}
                    className="w-20 bg-bg-elevated px-3 py-2 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-center text-sm"
                    aria-label="Words per minute"
                  />
                  <span className="text-body-sm text-text-secondary">words per minute</span>
                  {wpmStatus === 'saving' && (
                    <span className="text-body-sm text-text-secondary">Saving...</span>
                  )}
                  {wpmStatus === 'saved' && (
                    <span className="text-action-success text-sm">✓</span>
                  )}
                  {wpmStatus === 'error' && (
                    <span className="text-action-danger text-sm">Failed</span>
                  )}
                </div>
              </FormField>
            </section>

            {/* Divider */}
            <hr className="border-border-default" />

            {/* Grid Columns Setting */}
            <section>
              <h3 className="text-h4 mb-2 text-text-primary">Books per row (mobile)</h3>
              <p className="text-body-sm text-text-secondary text-sm mb-3">
                Choose how many book covers to show per row on mobile devices.
              </p>
              
              <div className="flex gap-2">
                {['2', '3', '4'].map((cols) => (
                  <button
                    key={cols}
                    onClick={() => handleGridColumnsChange(cols)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      gridColumns === cols
                        ? 'bg-action-primary text-white'
                        : 'bg-bg-elevated text-text-secondary hover:bg-bg-elevated'
                    }`}
                  >
                    {cols}
                  </button>
                ))}
              </div>
              <p className="text-text-muted text-xs mt-2">
                Desktop always shows 4–6 columns
              </p>
            </section>

            {/* Divider */}
            <hr className="border-border-default" />

            {/* Display Section */}
            <section>
              <h3 className="text-h4 mb-2 text-text-primary">Display</h3>
              <p className="text-body-sm text-text-secondary text-sm mb-4">
                Choose what to show below book covers.
              </p>
              
              <div className="space-y-4">
                {/* Title toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">Show title</span>
                  <button
                    onClick={() => handleDisplayToggle('show_title_below', showTitleBelow, setShowTitleBelow)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${showTitleBelow ? 'bg-action-primary' : 'bg-bg-elevated'}
                    `}
                    role="switch"
                    aria-checked={showTitleBelow}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${showTitleBelow ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
                
                {/* Author toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">Show author</span>
                  <button
                    onClick={() => handleDisplayToggle('show_author_below', showAuthorBelow, setShowAuthorBelow)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${showAuthorBelow ? 'bg-action-primary' : 'bg-bg-elevated'}
                    `}
                    role="switch"
                    aria-checked={showAuthorBelow}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${showAuthorBelow ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
                
                {/* Series toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">Show series</span>
                  <button
                    onClick={() => handleDisplayToggle('show_series_below', showSeriesBelow, setShowSeriesBelow)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${showSeriesBelow ? 'bg-action-primary' : 'bg-bg-elevated'}
                    `}
                    role="switch"
                    aria-checked={showSeriesBelow}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${showSeriesBelow ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Divider */}
            <hr className="border-border-default" />

            {/* Status Labels Section */}
            <section>
              <h3 className="text-h4 mb-2 text-text-primary">Status Labels</h3>
              <p className="text-body-sm text-text-secondary text-sm mb-3">
                Customize the names shown for each reading status.
              </p>
              
              <div className="space-y-3">
                {[
                  { key: 'unread', label: 'Unread', placeholder: 'Unread' },
                  { key: 'in_progress', label: 'In Progress', placeholder: 'In Progress' },
                  { key: 'finished', label: 'Finished', placeholder: 'Finished' },
                  { key: 'dnf', label: 'Abandoned', placeholder: 'Abandoned' }
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-text-muted text-sm w-24">
                      {label}
                    </span>
                    <input
                      type="text"
                      value={statusLabels[key]}
                      onChange={(e) => handleStatusLabelChange(key, e.target.value)}
                      onBlur={() => handleStatusLabelBlur(key)}
                      placeholder={placeholder}
                      className="flex-1 bg-bg-elevated px-3 py-2 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
              
              <p className="text-text-muted text-xs mt-2">
                💡 Changes apply throughout the app
              </p>
            </section>

            {/* Divider */}
            <hr className="border-border-default" />

            {/* Rating Labels Section */}
            <section>
              <h3 className="text-h4 mb-2 text-text-primary">Rating Labels</h3>
              <p className="text-body-sm text-text-secondary text-sm mb-3">
                Customize the descriptions shown for each star rating.
              </p>
              
              <div className="space-y-3">
                {[
                  { star: 5, label: '★★★★★', placeholder: 'All-time Fav' },
                  { star: 4, label: '★★★★☆', placeholder: 'Better than Good' },
                  { star: 3, label: '★★★☆☆', placeholder: 'Decent/Fine' },
                  { star: 2, label: '★★☆☆☆', placeholder: 'Disappointing' },
                  { star: 1, label: '★☆☆☆☆', placeholder: 'Disliked' }
                ].map(({ star, label, placeholder }) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-action-warning text-sm w-24 font-mono">
                      {label}
                    </span>
                    <input
                      type="text"
                      value={ratingLabels[star]}
                      onChange={(e) => handleRatingLabelChange(star, e.target.value)}
                      onBlur={() => handleRatingLabelBlur(star)}
                      placeholder={placeholder}
                      className="flex-1 bg-bg-elevated px-3 py-2 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
              
              <p className="text-text-muted text-xs mt-2">
                💡 Changes apply throughout the app
              </p>
            </section>

            {/* Divider */}
            <hr className="border-border-default" />

            {/* Library Section */}
            <section>
              <h3 className="text-h4 mb-2 text-text-primary">Library</h3>
              <p className="text-body-sm text-text-secondary text-sm mb-3">
                Scan your book folders for new or changed files.
              </p>
              
              <Button
                type="button"
                variant="primary"
                className="w-full"
                loading={syncing}
                disabled={syncing}
                onClick={handleSync}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
              >
                {syncing ? 'Syncing...' : 'Sync Library'}
              </Button>
              
              {syncResult && (
                <p className={`text-sm mt-2 ${syncResult.success ? 'text-action-success' : 'text-action-danger'}`}>
                  {syncResult.message}
                </p>
              )}
              
              {/* Find Duplicates */}
              <Button
                type="button"
                variant="primary"
                className="w-full mt-3 !bg-action-warning hover:!opacity-90"
                onClick={() => {
                  onClose()
                  navigate('/duplicates')
                }}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                }
              >
                Find Duplicates
              </Button>
            </section>

            {/* Divider */}
            <hr className="border-border-default" />

            {/* Rescan Metadata Section */}
            <section>
              <h3 className="text-h4 mb-2 text-text-primary">Enhanced Metadata</h3>
              <p className="text-body-sm text-text-secondary text-sm mb-3">
                Re-extract metadata from your ebook files to populate fandom, 
                relationships, source URLs, and more.
              </p>
              
              {rescanPreview && (
                <div className="bg-bg-elevated/70 border border-border-subtle rounded-lg p-3 mb-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-body-sm text-text-secondary">
                    <span>Total books:</span>
                    <span className="text-text-secondary">{rescanPreview.total_books}</span>
                    
                    <span>With EPUB files:</span>
                    <span className="text-text-secondary">{rescanPreview.books_with_epub}</span>
                    
                    <span>Already have fandom:</span>
                    <span className="text-text-secondary">{rescanPreview.already_has_fandom}</span>
                    
                    <span>Already have source URL:</span>
                    <span className="text-text-secondary">{rescanPreview.already_has_source_url}</span>
                  </div>
                </div>
              )}
              
              <Button
                type="button"
                variant="primary"
                className="w-full"
                loading={rescanLoading}
                disabled={rescanLoading}
                onClick={handleRescan}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                }
              >
                {rescanLoading ? 'Rescanning...' : 'Rescan All Metadata'}
              </Button>
              
              {rescanResults && !rescanResults.error && (
                <div className="mt-3 bg-bg-elevated/70 border border-border-subtle rounded-lg p-3 text-xs">
                  <div className="text-action-primary font-medium mb-2">Rescan Complete!</div>
                  <div className="grid grid-cols-2 gap-1 text-body-sm text-text-secondary">
                    <span>Books scanned:</span>
                    <span className="text-text-secondary">{rescanResults.total}</span>
                    
                    <span>Updated:</span>
                    <span className="text-action-primary">{rescanResults.updated}</span>
                    
                    <span>AO3 metadata parsed:</span>
                    <span className="text-text-secondary">{rescanResults.details?.ao3_parsed || 0}</span>
                    
                    <span>Source URLs found:</span>
                    <span className="text-text-secondary">{rescanResults.details?.source_urls_found || 0}</span>
                    
                    <span>Series extracted:</span>
                    <span className="text-text-secondary">{rescanResults.details?.series_extracted || 0}</span>
                    
                    <span>Skipped (no EPUB):</span>
                    <span className="text-text-muted">{rescanResults.skipped_no_epub}</span>
                    
                    {rescanResults.errors > 0 && (
                      <>
                        <span>Errors:</span>
                        <span className="text-action-danger">{rescanResults.errors}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {rescanResults?.error && (
                <div className="mt-3 bg-action-danger/10 border border-action-danger/30 rounded-lg p-3 text-xs text-action-danger">
                  Error: {rescanResults.error}
                </div>
              )}
            </section>

            {/* Divider */}
            <hr className="border-border-default" />

            {/* Phase 9A: Automated Backups Section */}
            <section>
              <h3 className="text-h4 mb-2 text-text-primary">Automated Backups</h3>
              <p className="text-body-sm text-text-secondary text-sm mb-4">
                Automatic database backups with grandfather-father-son rotation.
              </p>
              
              {backupSettings && (
                <div className="space-y-4">
                  {/* Enable Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Enable automatic backups</span>
                    <button
                      onClick={() => handleBackupSettingsChange('backup_enabled', !backupSettings.backup_enabled)}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${backupSettings.backup_enabled ? 'bg-action-primary' : 'bg-bg-elevated'}
                      `}
                      role="switch"
                      aria-checked={backupSettings.backup_enabled}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${backupSettings.backup_enabled ? 'translate-x-6' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>

                  {/* Settings only shown when enabled */}
                  {backupSettings.backup_enabled && (
                    <>
                      {/* Backup Path */}
                      <div>
                        <FormField label="Backup location">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={backupPath}
                              onChange={(e) => {
                                setBackupPath(e.target.value)
                                setPathTest(null)
                              }}
                              placeholder="/app/data/backups"
                              className="flex-1 min-w-0 bg-bg-elevated px-3 py-2 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm"
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="shrink-0"
                              loading={testingPath}
                              disabled={testingPath || !backupPath.trim()}
                              onClick={handleTestPath}
                            >
                              Test
                            </Button>
                          </div>
                        </FormField>
                        
                        {pathTest && (
                          <p className={`text-xs mt-1 ${pathTest.valid ? 'text-action-success' : 'text-action-danger'}`}>
                            {pathTest.valid ? '✓ Path is writable' : `✗ ${pathTest.error}`}
                          </p>
                        )}
                        
                        <p className="text-text-muted text-xs mt-2">
                          Examples: /app/data/backups (default) • /volumeUSB1/liminal-backups (USB) • /volume1/network-backups (NAS share)
                        </p>
                      </div>

                      {/* Schedule Selector */}
                      <div>
                        <label className="block text-text-secondary text-sm mb-2">Backup schedule</label>
                        <select
                          value={backupSettings.backup_schedule || 'both'}
                          onChange={(e) => handleBackupSettingsChange('backup_schedule', e.target.value)}
                          className="w-full bg-bg-elevated px-3 py-2 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm"
                        >
                          <option value="before_sync">Before every sync only</option>
                          <option value="daily">Daily at specified time</option>
                          <option value="both">Both (before sync + daily)</option>
                        </select>
                      </div>

                      {/* Time Picker - only show when daily or both */}
                      {(backupSettings.backup_schedule === 'daily' || backupSettings.backup_schedule === 'both') && (
                        <div>
                          <label className="block text-text-secondary text-sm mb-2">Daily backup time</label>
                          <input
                            type="time"
                            value={backupSettings.backup_time || '03:00'}
                            onChange={(e) => handleBackupSettingsChange('backup_time', e.target.value)}
                            className="bg-bg-elevated px-3 py-2 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm"
                          />
                        </div>
                      )}

                      {/* Retention Policy */}
                      <div>
                        <label className="block text-text-secondary text-sm mb-2">Retention policy</label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-body-sm text-text-secondary text-sm w-32">Daily backups:</span>
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={backupSettings.backup_daily_retention_days || 7}
                              onChange={(e) => handleBackupSettingsChange('backup_daily_retention_days', parseInt(e.target.value) || 7)}
                              className="w-16 bg-bg-elevated px-2 py-1 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm text-center"
                            />
                            <span className="text-body-sm text-text-secondary text-sm">days</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-body-sm text-text-secondary text-sm w-32">Weekly backups:</span>
                            <input
                              type="number"
                              min="1"
                              max="12"
                              value={backupSettings.backup_weekly_retention_weeks || 4}
                              onChange={(e) => handleBackupSettingsChange('backup_weekly_retention_weeks', parseInt(e.target.value) || 4)}
                              className="w-16 bg-bg-elevated px-2 py-1 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm text-center"
                            />
                            <span className="text-body-sm text-text-secondary text-sm">weeks</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-body-sm text-text-secondary text-sm w-32">Monthly backups:</span>
                            <input
                              type="number"
                              min="1"
                              max="24"
                              value={backupSettings.backup_monthly_retention_months || 6}
                              onChange={(e) => handleBackupSettingsChange('backup_monthly_retention_months', parseInt(e.target.value) || 6)}
                              className="w-16 bg-bg-elevated px-2 py-1 rounded text-text-primary border border-border-default focus:border-action-primary focus:outline-none text-sm text-center"
                            />
                            <span className="text-body-sm text-text-secondary text-sm">months</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Stats Display */}
                  {backupStats && (
                    <div className="bg-bg-elevated/70 border border-border-subtle rounded-lg p-3 text-xs">
                      <div className="grid grid-cols-2 gap-2 text-body-sm text-text-secondary">
                        <span>Last backup:</span>
                        <span className="text-text-secondary">{formatTimeAgo(backupStats.last_backup_time)}</span>
                        
                        <span>Storage used:</span>
                        <span className="text-text-secondary">{formatBytes(backupStats.total_size)}</span>
                        
                        <span>Backup count:</span>
                        <span className="text-text-secondary">{backupStats.total_backups}</span>
                      </div>
                      
                      {backupStats.total_backups > 0 && (
                        <div className="mt-2 pt-2 border-t border-border-default grid grid-cols-3 gap-1 text-center">
                          <div>
                            <div className="text-text-secondary">{backupStats.backups_by_type?.daily?.count || 0}</div>
                            <div className="text-text-muted">daily</div>
                          </div>
                          <div>
                            <div className="text-text-secondary">{backupStats.backups_by_type?.weekly?.count || 0}</div>
                            <div className="text-text-muted">weekly</div>
                          </div>
                          <div>
                            <div className="text-text-secondary">{backupStats.backups_by_type?.monthly?.count || 0}</div>
                            <div className="text-text-muted">monthly</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Backup Button */}
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full"
                    loading={creatingBackup}
                    disabled={creatingBackup}
                    onClick={handleManualBackup}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    }
                  >
                    {creatingBackup ? 'Creating Backup...' : 'Create Backup Now'}
                  </Button>

                  {/* Save Settings Button */}
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full !bg-action-success hover:!opacity-90"
                    loading={savingBackupSettings}
                    disabled={savingBackupSettings}
                    onClick={handleSaveBackupSettings}
                  >
                    {savingBackupSettings ? 'Saving...' : 'Save Backup Settings'}
                  </Button>

                  {/* Status Messages */}
                  {backupStatus && (
                    <div
                      className={
                        backupStatus.success
                          ? 'rounded-lg p-3 text-sm bg-action-success/10 border border-action-success/30 text-action-success'
                          : 'rounded-lg p-3 text-sm bg-action-danger/10 border border-action-danger/30 text-action-danger'
                      }
                    >
                      {backupStatus.message}
                    </div>
                  )}
                </div>
              )}
              
              {!backupSettings && (
                <div className="text-text-muted text-sm">Loading backup settings...</div>
              )}
            </section>

            {/* Divider */}
            <hr className="border-border-default" />

            {/* Phase 9C: Cover Extraction Section */}
            <section>
              <h3 className="text-h4 mb-2 text-text-primary">Cover Extraction</h3>
              <p className="text-body-sm text-text-secondary text-sm mb-4">
                Extract cover images from EPUB files for existing books.
                FanFiction is excluded (uses gradient covers only).
              </p>
              
              <div className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Categories to process</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-text-secondary">
                      <input
                        type="checkbox"
                        checked={extractCategories.Fiction}
                        onChange={(e) => setExtractCategories(prev => ({ ...prev, Fiction: e.target.checked }))}
                        className="rounded border-border-default bg-bg-elevated text-action-primary focus:ring-action-primary"
                      />
                      Fiction
                    </label>
                    <label className="flex items-center gap-2 text-sm text-text-secondary">
                      <input
                        type="checkbox"
                        checked={extractCategories['Non-Fiction']}
                        onChange={(e) => setExtractCategories(prev => ({ ...prev, 'Non-Fiction': e.target.checked }))}
                        className="rounded border-border-default bg-bg-elevated text-action-primary focus:ring-action-primary"
                      />
                      Non-Fiction
                    </label>
                  </div>
                  <p className="text-text-muted text-xs mt-1">
                    Books with custom covers are always preserved.
                  </p>
                </div>

                {/* Extract Button */}
                <Button
                  type="button"
                  variant="primary"
                  className="w-full !bg-chip-fanfiction hover:!opacity-90"
                  loading={extracting}
                  disabled={extracting}
                  onClick={handleBulkExtract}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  {extracting ? 'Extracting Covers...' : 'Extract Covers from EPUBs'}
                </Button>

                {/* Results Display */}
                {extractResults && !extractResults.error && (
                  <div className="bg-bg-elevated/70 border border-border-subtle rounded-lg p-3 text-xs space-y-2">
                    <div className="text-action-success font-medium">
                      ✓ Extracted {extractResults.extracted} covers
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-body-sm text-text-secondary">
                      <span>Processed:</span>
                      <span className="text-text-secondary">{extractResults.processed}</span>
                      <span>Skipped (custom):</span>
                      <span className="text-text-secondary">{extractResults.skipped_custom}</span>
                      <span>Skipped (has cover):</span>
                      <span className="text-text-secondary">{extractResults.skipped_has_cover}</span>
                      <span>Skipped (no EPUB):</span>
                      <span className="text-text-secondary">{extractResults.skipped_no_epub}</span>
                      <span>Skipped (no cover in file):</span>
                      <span className="text-text-secondary">{extractResults.skipped_no_cover || 0}</span>
                      {extractResults.failed > 0 && (
                        <>
                          <span className="text-action-danger">Failed:</span>
                          <span className="text-action-danger">{extractResults.failed}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {extractResults?.error && (
                  <div className="bg-action-danger/10 border border-action-danger/30 rounded-lg p-3 text-xs text-action-danger">
                    Error: {extractResults.error}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </>
  )
}

export default SettingsDrawer

