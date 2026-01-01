/**
 * CollectionsTab - Grid view of all user collections
 */

import { useState, useEffect } from 'react'
import CollectionCard from './CollectionCard'
import CollectionModal from './CollectionModal'
import { listCollections } from '../api'

// Plus icon for the New button
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

export default function CollectionsTab() {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const fetchCollections = async () => {
    try {
      setLoading(true)
      const data = await listCollections()
      setCollections(data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch collections:', err)
      setError('Failed to load collections')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchCollections()
  }, [])
  
  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    fetchCollections()
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-library-accent"></div>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p>{error}</p>
        <button 
          onClick={fetchCollections}
          className="mt-4 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
        >
          Retry
        </button>
      </div>
    )
  }
  
  return (
    <div className="px-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Collections</h1>
          <p className="text-sm text-gray-400">
            {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-library-accent hover:opacity-90 text-white rounded-lg text-sm font-medium transition-opacity"
        >
          <PlusIcon />
          New
        </button>
      </div>
      
      {/* Empty state */}
      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-lg font-medium text-gray-200 mb-2">No collections yet</h2>
          <p className="text-gray-400 mb-6 max-w-xs">
            Create a collection to organize your books into custom lists
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-library-accent hover:opacity-90 text-white rounded-lg font-medium transition-opacity"
          >
            <PlusIcon />
            Create Collection
          </button>
        </div>
      ) : (
        /* Collections grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {collections.map(collection => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      )}
      
      {/* Create Modal */}
      {showCreateModal && (
        <CollectionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  )
}

