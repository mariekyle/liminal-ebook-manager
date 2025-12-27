import { useState, useEffect, useRef } from 'react'
import { getSettings, updateSetting, syncLibrary } from '../api'

function SettingsDrawer({ isOpen, onClose }) {
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
    dnf: 'DNF'
  })
  const drawerRef = useRef(null)

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
            dnf: data.status_label_dnf || 'DNF'
          })
        })
        .catch(err => console.error('Failed to load settings:', err))
        .finally(() => setLoading(false))
    }
  }, [isOpen])

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
    const defaults = { unread: 'Unread', in_progress: 'In Progress', finished: 'Finished', dnf: 'DNF' }
    
    if (!value.trim()) {
      // Reset to default if empty
      setStatusLabels(prev => ({ ...prev, [key]: defaults[key] }))
      await updateSetting(`status_label_${key}`, defaults[key])
    } else {
      await updateSetting(`status_label_${key}`, value.trim())
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
              
              <p className="text-gray-500 text-xs mt-2">
                💡 Average adult: 200–300 WPM
              </p>
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

            {/* Status Labels Section */}
            <section>
              <h3 className="text-sm font-medium text-white mb-2">Status Labels</h3>
              <p className="text-gray-400 text-sm mb-3">
                Customize the names shown for each reading status.
              </p>
              
              <div className="space-y-3">
                {[
                  { key: 'unread', placeholder: 'Unread' },
                  { key: 'in_progress', placeholder: 'In Progress' },
                  { key: 'finished', placeholder: 'Finished' },
                  { key: 'dnf', placeholder: 'DNF' }
                ].map(({ key, placeholder }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm w-24 capitalize">
                      {key.replace('_', ' ')}
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
            </section>
          </div>
        )}
      </div>
    </>
  )
}

export default SettingsDrawer

