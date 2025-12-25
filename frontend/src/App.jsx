import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Library from './components/Library'
import BookDetail from './components/BookDetail'
import SeriesDetail from './components/SeriesDetail'
import AuthorDetail from './components/AuthorDetail'
import AuthorsList from './pages/AuthorsList'
import ImportPage from './pages/ImportPage'
import UploadPage from './pages/UploadPage'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import { checkHealth } from './api'

function App() {
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
      <div className="min-h-screen bg-library-bg flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-pulse-slow text-4xl mb-4">📚</div>
          <p className="text-gray-400">Connecting to library...</p>
        </div>
      </div>
    )
  }

  if (connected === false) {
    return (
      <div className="min-h-screen bg-library-bg flex items-center justify-center p-4">
        <div className="bg-library-card rounded-lg p-6 max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-white mb-2">Connection Error</h1>
          <p className="text-gray-400 mb-4">Could not connect to the library backend.</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-library-accent text-white px-4 py-2 rounded hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-library-bg pb-16 md:pb-0">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/series/:name" element={<SeriesDetail />} />
          <Route path="/authors" element={<AuthorsList />} />
          <Route path="/author/:name" element={<AuthorDetail />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default App
