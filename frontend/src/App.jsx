import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Library from './components/Library'
import BookDetail from './components/BookDetail'
import SeriesDetail from './components/SeriesDetail'
import CollectionsTab from './components/CollectionsTab'
import CollectionDetail from './components/CollectionDetail'
import AuthorDetail from './components/AuthorDetail'
import AuthorsList from './pages/AuthorsList'
import ImportPage from './pages/ImportPage'
import AddPage from './pages/AddPage'
import DuplicatesPage from './pages/DuplicatesPage'
import Settings from './pages/Settings'
import SyncResultsPage from './pages/SyncResultsPage'
import ComponentPreview from './pages/ComponentPreview'
import BottomNav from './components/BottomNav'
import { checkHealth } from './api'

function ConnectedApp() {
  const [connected, setConnected] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkHealth()
      .then(data => {
        setConnected(true)
        console.log('Backend connected:', data)
      })
      .catch(err => {
        setConnected(false)
        setError(err.message)
        console.error('Backend connection failed:', err)
      })
  }, [])

  if (connected === null) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-text-primary text-center">
          <div className="animate-pulse-slow text-4xl mb-4">📚</div>
          <p className="text-text-secondary">Connecting to library...</p>
        </div>
      </div>
    )
  }

  if (connected === false) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="bg-bg-surface rounded-lg p-6 max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-h3 text-text-primary mb-2">Connection Error</h1>
          <p className="text-text-secondary mb-4">Could not connect to the library backend.</p>
          <p className="text-text-muted text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-action-primary text-text-primary px-4 py-2 rounded hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base pb-16 md:pb-0">
      <main>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/series/:name" element={<SeriesDetail />} />
          <Route path="/authors" element={<AuthorsList />} />
          <Route path="/author/:name" element={<AuthorDetail />} />
          <Route path="/collections" element={<CollectionsTab />} />
          <Route path="/collections/:id" element={<CollectionDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/sync-results" element={<SyncResultsPage />} />
          {/* Redirect /tbr to library with wishlist filter */}
          <Route path="/tbr" element={<Navigate to="/?acquisition=wishlist" replace />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/add" element={<AddPage />} />
          <Route path="/duplicates" element={<DuplicatesPage />} />
          {/* Redirect old /upload URL to /add */}
          <Route path="/upload" element={<Navigate to="/add" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/dev/components" element={<ComponentPreview />} />
      <Route path="*" element={<ConnectedApp />} />
    </Routes>
  )
}

export default App
