import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSettings, updateSetting, syncLibrary, previewRescan, rescanMetadata, getBackupSettings, updateBackupSettings, testBackupPath, createManualBackup, bulkExtractCovers } from '../api'

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
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          fixed top-0 right-0 h-full w-full sm:w-80 
          bg-library-bg border-l border-gray-700
          z-50 transform transition-transform duration-200 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          overflow-y-auto
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
            aria-label="Close settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-4 text-gray-400">Loading settings...</div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Reading Speed Section */}
            <section>
              <h3 className="text-sm font-medium text-white mb-2">Reading Speed</h3>
              <p className="text-gray-400 text-sm mb-3">
                Used to estimate how long it takes to finish a book.
              </p>
              
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  value={wpmInput}
                  onChange={handleWpmChange}
                  onBlur={handleWpmBlur}
                  className="w-20 bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none text-center"
                  aria-label="Words per minute"
                />
                <span className="text-gray-400 text-sm">words per minute</span>
                
                {wpmStatus === 'saving' && (
                  <span className="text-gray-400 text-sm">Saving...</span>
                )}
                {wpmStatus === 'saved' && (
                  <span className="text-green-400 text-sm">✓</span>
                )}
                {wpmStatus === 'error' && (
                  <span className="text-red-400 text-sm">Failed</span>
                )}
              </div>
              
            </section>

            {/* Divider */}
            <hr className="border-gray-700" />

            {/* Grid Columns Setting */}
            <section>
              <h3 className="text-sm font-medium text-white mb-2">Books per row (mobile)</h3>
              <p className="text-gray-400 text-sm mb-3">
                Choose how many book covers to show per row on mobile devices.
              </p>
              
              <div className="flex gap-2">
                {['2', '3', '4'].map((cols) => (
                  <button
                    key={cols}
                    onClick={() => handleGridColumnsChange(cols)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      gridColumns === cols
                        ? 'bg-library-accent text-white'
                        : 'bg-library-card text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {cols}
                  </button>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Desktop always shows 4–6 columns
              </p>
            </section>

            {/* Divider */}
            <hr className="border-gray-700" />

            {/* Display Section */}
            <section>
              <h3 className="text-sm font-medium text-white mb-2">Display</h3>
              <p className="text-gray-400 text-sm mb-4">
                Choose what to show below book covers.
              </p>
              
              <div className="space-y-4">
                {/* Title toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Show title</span>
                  <button
                    onClick={() => handleDisplayToggle('show_title_below', showTitleBelow, setShowTitleBelow)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${showTitleBelow ? 'bg-library-accent' : 'bg-gray-600'}
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
                  <span className="text-gray-300 text-sm">Show author</span>
                  <button
                    onClick={() => handleDisplayToggle('show_author_below', showAuthorBelow, setShowAuthorBelow)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${showAuthorBelow ? 'bg-library-accent' : 'bg-gray-600'}
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
                  <span className="text-gray-300 text-sm">Show series</span>
                  <button
                    onClick={() => handleDisplayToggle('show_series_below', showSeriesBelow, setShowSeriesBelow)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${showSeriesBelow ? 'bg-library-accent' : 'bg-gray-600'}
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
            <hr className="border-gray-700" />

            {/* Status Labels Section */}
            <section>
              <h3 className="text-sm font-medium text-white mb-2">Status Labels</h3>
              <p className="text-gray-400 text-sm mb-3">
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
                    <span className="text-gray-500 text-sm w-24">
                      {label}
                    </span>
                    <input
                      type="text"
                      value={statusLabels[key]}
                      onChange={(e) => handleStatusLabelChange(key, e.target.value)}
                      onBlur={() => handleStatusLabelBlur(key)}
                      placeholder={placeholder}
                      className="flex-1 bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
              
              <p className="text-gray-500 text-xs mt-2">
                💡 Changes apply throughout the app
              </p>
            </section>

            {/* Divider */}
            <hr className="border-gray-700" />

            {/* Rating Labels Section */}
            <section>
              <h3 className="text-sm font-medium text-white mb-2">Rating Labels</h3>
              <p className="text-gray-400 text-sm mb-3">
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
                    <span className="text-yellow-400 text-sm w-24 font-mono">
                      {label}
                    </span>
                    <input
                      type="text"
                      value={ratingLabels[star]}
                      onChange={(e) => handleRatingLabelChange(star, e.target.value)}
                      onBlur={() => handleRatingLabelBlur(star)}
                      placeholder={placeholder}
                      className="flex-1 bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none text-sm"
                    />
                  </div>
                ))}
              </div>
              
              <p className="text-gray-500 text-xs mt-2">
                💡 Changes apply throughout the app
              </p>
            </section>

            {/* Divider */}
            <hr className="border-gray-700" />

            {/* Library Section */}
            <section>
              <h3 className="text-sm font-medium text-white mb-2">Library</h3>
              <p className="text-gray-400 text-sm mb-3">
                Scan your book folders for new or changed files.
              </p>
              
              <button
                onClick={handleSync}
                disabled={syncing}
                className={`
                  w-full px-4 py-2 rounded text-sm font-medium
                  ${syncing 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-library-accent hover:opacity-90'
                  }
                  text-white transition-opacity flex items-center justify-center gap-2
                `}
              >
                {syncing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync Library
                  </>
                )}
              </button>
              
              {syncResult && (
                <p className={`text-sm mt-2 ${syncResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {syncResult.message}
                </p>
              )}
              
              {/* Find Duplicates */}
              <button
                onClick={() => {
                  onClose()
                  navigate('/duplicates')
                }}
                className="w-full mt-3 px-4 py-2 rounded text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Find Duplicates
              </button>
            </section>

            {/* Divider */}
            <hr className="border-gray-700" />

            {/* Rescan Metadata Section */}
            <section>
              <h3 className="text-sm font-medium text-white mb-2">Enhanced Metadata</h3>
              <p className="text-gray-400 text-sm mb-3">
                Re-extract metadata from your ebook files to populate fandom, 
                relationships, source URLs, and more.
              </p>
              
              {rescanPreview && (
                <div className="bg-zinc-800/50 rounded-lg p-3 mb-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-gray-400">
                    <span>Total books:</span>
                    <span className="text-gray-300">{rescanPreview.total_books}</span>
                    
                    <span>With EPUB files:</span>
                    <span className="text-gray-300">{rescanPreview.books_with_epub}</span>
                    
                    <span>Already have fandom:</span>
                    <span className="text-gray-300">{rescanPreview.already_has_fandom}</span>
                    
                    <span>Already have source URL:</span>
                    <span className="text-gray-300">{rescanPreview.already_has_source_url}</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleRescan}
                disabled={rescanLoading}
                className={`
                  w-full px-4 py-2 rounded text-sm font-medium
                  ${rescanLoading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-teal-600 hover:bg-teal-500'
                  }
                  text-white transition-colors flex items-center justify-center gap-2
                `}
              >
                {rescanLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Rescanning...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Rescan All Metadata
                  </>
                )}
              </button>
              
              {rescanResults && !rescanResults.error && (
                <div className="mt-3 bg-zinc-800/50 rounded-lg p-3 text-xs">
                  <div className="text-teal-400 font-medium mb-2">Rescan Complete!</div>
                  <div className="grid grid-cols-2 gap-1 text-gray-400">
                    <span>Books scanned:</span>
                    <span className="text-gray-300">{rescanResults.total}</span>
                    
                    <span>Updated:</span>
                    <span className="text-teal-400">{rescanResults.updated}</span>
                    
                    <span>AO3 metadata parsed:</span>
                    <span className="text-gray-300">{rescanResults.details?.ao3_parsed || 0}</span>
                    
                    <span>Source URLs found:</span>
                    <span className="text-gray-300">{rescanResults.details?.source_urls_found || 0}</span>
                    
                    <span>Series extracted:</span>
                    <span className="text-gray-300">{rescanResults.details?.series_extracted || 0}</span>
                    
                    <span>Skipped (no EPUB):</span>
                    <span className="text-gray-500">{rescanResults.skipped_no_epub}</span>
                    
                    {rescanResults.errors > 0 && (
                      <>
                        <span>Errors:</span>
                        <span className="text-red-400">{rescanResults.errors}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {rescanResults?.error && (
                <div className="mt-3 bg-red-900/30 border border-red-800 rounded-lg p-3 text-xs text-red-400">
                  Error: {rescanResults.error}
                </div>
              )}
            </section>

            {/* Divider */}
            <hr className="border-gray-700" />

            {/* Phase 9A: Automated Backups Section */}
            <section>
              <h3 className="text-sm font-medium text-white mb-2">Automated Backups</h3>
              <p className="text-gray-400 text-sm mb-4">
                Automatic database backups with grandfather-father-son rotation.
              </p>
              
              {backupSettings && (
                <div className="space-y-4">
                  {/* Enable Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Enable automatic backups</span>
                    <button
                      onClick={() => handleBackupSettingsChange('backup_enabled', !backupSettings.backup_enabled)}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${backupSettings.backup_enabled ? 'bg-library-accent' : 'bg-gray-600'}
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
                        <label className="block text-gray-300 text-sm mb-2">Backup location</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={backupPath}
                            onChange={(e) => {
                              setBackupPath(e.target.value)
                              setPathTest(null)
                            }}
                            placeholder="/app/data/backups"
                            className="flex-1 bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none text-sm"
                          />
                          <button
                            onClick={handleTestPath}
                            disabled={testingPath || !backupPath.trim()}
                            className={`
                              px-3 py-2 rounded text-sm font-medium
                              ${testingPath ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500'}
                              text-white transition-colors
                            `}
                          >
                            {testingPath ? '...' : 'Test'}
                          </button>
                        </div>
                        
                        {pathTest && (
                          <p className={`text-xs mt-1 ${pathTest.valid ? 'text-green-400' : 'text-red-400'}`}>
                            {pathTest.valid ? '✓ Path is writable' : `✗ ${pathTest.error}`}
                          </p>
                        )}
                        
                        <p className="text-gray-500 text-xs mt-2">
                          Examples: /app/data/backups (default) • /volumeUSB1/liminal-backups (USB) • /volume1/network-backups (NAS share)
                        </p>
                      </div>

                      {/* Schedule Selector */}
                      <div>
                        <label className="block text-gray-300 text-sm mb-2">Backup schedule</label>
                        <select
                          value={backupSettings.backup_schedule || 'both'}
                          onChange={(e) => handleBackupSettingsChange('backup_schedule', e.target.value)}
                          className="w-full bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none text-sm"
                        >
                          <option value="before_sync">Before every sync only</option>
                          <option value="daily">Daily at specified time</option>
                          <option value="both">Both (before sync + daily)</option>
                        </select>
                      </div>

                      {/* Time Picker - only show when daily or both */}
                      {(backupSettings.backup_schedule === 'daily' || backupSettings.backup_schedule === 'both') && (
                        <div>
                          <label className="block text-gray-300 text-sm mb-2">Daily backup time</label>
                          <input
                            type="time"
                            value={backupSettings.backup_time || '03:00'}
                            onChange={(e) => handleBackupSettingsChange('backup_time', e.target.value)}
                            className="bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none text-sm"
                          />
                        </div>
                      )}

                      {/* Retention Policy */}
                      <div>
                        <label className="block text-gray-300 text-sm mb-2">Retention policy</label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 text-sm w-32">Daily backups:</span>
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={backupSettings.backup_daily_retention_days || 7}
                              onChange={(e) => handleBackupSettingsChange('backup_daily_retention_days', parseInt(e.target.value) || 7)}
                              className="w-16 bg-library-card px-2 py-1 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none text-sm text-center"
                            />
                            <span className="text-gray-400 text-sm">days</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 text-sm w-32">Weekly backups:</span>
                            <input
                              type="number"
                              min="1"
                              max="12"
                              value={backupSettings.backup_weekly_retention_weeks || 4}
                              onChange={(e) => handleBackupSettingsChange('backup_weekly_retention_weeks', parseInt(e.target.value) || 4)}
                              className="w-16 bg-library-card px-2 py-1 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none text-sm text-center"
                            />
                            <span className="text-gray-400 text-sm">weeks</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 text-sm w-32">Monthly backups:</span>
                            <input
                              type="number"
                              min="1"
                              max="24"
                              value={backupSettings.backup_monthly_retention_months || 6}
                              onChange={(e) => handleBackupSettingsChange('backup_monthly_retention_months', parseInt(e.target.value) || 6)}
                              className="w-16 bg-library-card px-2 py-1 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none text-sm text-center"
                            />
                            <span className="text-gray-400 text-sm">months</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Stats Display */}
                  {backupStats && (
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-xs">
                      <div className="grid grid-cols-2 gap-2 text-gray-400">
                        <span>Last backup:</span>
                        <span className="text-gray-300">{formatTimeAgo(backupStats.last_backup_time)}</span>
                        
                        <span>Storage used:</span>
                        <span className="text-gray-300">{formatBytes(backupStats.total_size)}</span>
                        
                        <span>Backup count:</span>
                        <span className="text-gray-300">{backupStats.total_backups}</span>
                      </div>
                      
                      {backupStats.total_backups > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-700 grid grid-cols-3 gap-1 text-center">
                          <div>
                            <div className="text-gray-300">{backupStats.backups_by_type?.daily?.count || 0}</div>
                            <div className="text-gray-500">daily</div>
                          </div>
                          <div>
                            <div className="text-gray-300">{backupStats.backups_by_type?.weekly?.count || 0}</div>
                            <div className="text-gray-500">weekly</div>
                          </div>
                          <div>
                            <div className="text-gray-300">{backupStats.backups_by_type?.monthly?.count || 0}</div>
                            <div className="text-gray-500">monthly</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Backup Button */}
                  <button
                    onClick={handleManualBackup}
                    disabled={creatingBackup}
                    className={`
                      w-full px-4 py-2 rounded text-sm font-medium
                      ${creatingBackup 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-500'
                      }
                      text-white transition-colors flex items-center justify-center gap-2
                    `}
                  >
                    {creatingBackup ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating Backup...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Create Backup Now
                      </>
                    )}
                  </button>

                  {/* Save Settings Button */}
                  <button
                    onClick={handleSaveBackupSettings}
                    disabled={savingBackupSettings}
                    className={`
                      w-full px-4 py-2 rounded text-sm font-medium
                      ${savingBackupSettings 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-500'
                      }
                      text-white transition-colors
                    `}
                  >
                    {savingBackupSettings ? 'Saving...' : 'Save Backup Settings'}
                  </button>

                  {/* Status Messages */}
                  {backupStatus && (
                    <div className={`
                      rounded-lg p-3 text-sm
                      ${backupStatus.success 
                        ? 'bg-green-900/30 border border-green-800 text-green-400' 
                        : 'bg-red-900/30 border border-red-800 text-red-400'
                      }
                    `}>
                      {backupStatus.message}
                    </div>
                  )}
                </div>
              )}
              
              {!backupSettings && (
                <div className="text-gray-500 text-sm">Loading backup settings...</div>
              )}
            </section>

            {/* Divider */}
            <hr className="border-gray-700" />

            {/* Phase 9C: Cover Extraction Section */}
            <section>
              <h3 className="text-sm font-medium text-white mb-2">Cover Extraction</h3>
              <p className="text-gray-400 text-sm mb-4">
                Extract cover images from EPUB files for existing books.
                FanFiction is excluded (uses gradient covers only).
              </p>
              
              <div className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Categories to process</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={extractCategories.Fiction}
                        onChange={(e) => setExtractCategories(prev => ({ ...prev, Fiction: e.target.checked }))}
                        className="rounded border-gray-600 bg-library-card text-library-accent focus:ring-library-accent"
                      />
                      Fiction
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={extractCategories['Non-Fiction']}
                        onChange={(e) => setExtractCategories(prev => ({ ...prev, 'Non-Fiction': e.target.checked }))}
                        className="rounded border-gray-600 bg-library-card text-library-accent focus:ring-library-accent"
                      />
                      Non-Fiction
                    </label>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    Books with custom covers are always preserved.
                  </p>
                </div>

                {/* Extract Button */}
                <button
                  onClick={handleBulkExtract}
                  disabled={extracting}
                  className={`
                    w-full px-4 py-2 rounded text-sm font-medium
                    ${extracting 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-500'
                    }
                    text-white transition-colors flex items-center justify-center gap-2
                  `}
                >
                  {extracting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Extracting Covers...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Extract Covers from EPUBs
                    </>
                  )}
                </button>

                {/* Results Display */}
                {extractResults && !extractResults.error && (
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-xs space-y-2">
                    <div className="text-green-400 font-medium">
                      ✓ Extracted {extractResults.extracted} covers
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-gray-400">
                      <span>Processed:</span>
                      <span className="text-gray-300">{extractResults.processed}</span>
                      <span>Skipped (custom):</span>
                      <span className="text-gray-300">{extractResults.skipped_custom}</span>
                      <span>Skipped (has cover):</span>
                      <span className="text-gray-300">{extractResults.skipped_has_cover}</span>
                      <span>Skipped (no EPUB):</span>
                      <span className="text-gray-300">{extractResults.skipped_no_epub}</span>
                      <span>Skipped (no cover in file):</span>
                      <span className="text-gray-300">{extractResults.skipped_no_cover || 0}</span>
                      {extractResults.failed > 0 && (
                        <>
                          <span className="text-red-400">Failed:</span>
                          <span className="text-red-400">{extractResults.failed}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {extractResults?.error && (
                  <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-xs text-red-400">
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

