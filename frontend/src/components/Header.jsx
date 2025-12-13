import { useState } from 'react'
import { Link } from 'react-router-dom'
import { syncLibrary, getSyncStatus } from '../api'

function Header() {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  const handleSync = async () => {
    if (syncing) return
    
    setSyncing(true)
    setSyncResult(null)
    
    try {
      const result = await syncLibrary(false)
      setSyncResult(result)
      
      // Reload the page after successful sync to show new books
      if (result.added > 0 || result.updated > 0) {
        setTimeout(() => window.location.reload(), 2000)
      }
    } catch (error) {
      setSyncResult({ status: 'error', message: error.message })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <header className="bg-library-card border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo/Title */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <h1 className="text-xl font-bold text-white">Liminal</h1>
        </Link>
        
        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Sync Result Toast */}
          {syncResult && (
            <div className={`text-sm px-3 py-1 rounded ${
              syncResult.status === 'error' 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-green-500/20 text-green-400'
            }`}>
              {syncResult.status === 'error' 
                ? syncResult.message 
                : `+${syncResult.added} added, ${syncResult.updated} updated`
              }
            </div>
          )}
          
          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg
              ${syncing 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-library-accent hover:opacity-90'
              }
              text-white text-sm font-medium transition-opacity
            `}
          >
            <span className={syncing ? 'animate-spin' : ''}>🔄</span>
            {syncing ? 'Syncing...' : 'Sync Library'}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
