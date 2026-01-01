/**
 * CollectionPicker - Modal to add a book to collections
 * 
 * Shows list of all collections with checkmarks for ones the book is already in.
 * Allows adding to multiple collections at once.
 */

import { useState, useEffect } from 'react'
import { listCollections, addBooksToCollection, removeBookFromCollection } from '../api'

// Icons
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M5 13l4 4L19 7" />
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

export default function CollectionPicker({ bookId, currentCollectionIds = [], onClose, onUpdate }) {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null) // Collection ID being updated
  const [selectedIds, setSelectedIds] = useState(new Set(currentCollectionIds))
  
  useEffect(() => {
    loadCollections()
  }, [])
  
  useEffect(() => {
    setSelectedIds(new Set(currentCollectionIds))
  }, [currentCollectionIds])
  
  const loadCollections = async () => {
    try {
      setLoading(true)
      const data = await listCollections()
      setCollections(data)
    } catch (err) {
      console.error('Failed to load collections:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const toggleCollection = async (collectionId) => {
    if (updating) return
    
    const isCurrentlySelected = selectedIds.has(collectionId)
    setUpdating(collectionId)
    
    try {
      if (isCurrentlySelected) {
        // Remove from collection
        await removeBookFromCollection(collectionId, bookId)
        setSelectedIds(prev => {
          const next = new Set(prev)
          next.delete(collectionId)
          return next
        })
      } else {
        // Add to collection
        await addBooksToCollection(collectionId, [bookId])
        setSelectedIds(prev => new Set([...prev, collectionId]))
      }
      
      // Notify parent to refresh
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Failed to update collection:', err)
    } finally {
      setUpdating(null)
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm bg-library-card rounded-xl shadow-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
          <h2 className="text-lg font-semibold text-gray-100">
            Add to Collection
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-200 rounded"
          >
            <XIcon />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-library-accent"></div>
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No collections yet</p>
              <p className="text-gray-500 text-sm">
                Create a collection from the Collections tab
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {collections.map(collection => {
                const isSelected = selectedIds.has(collection.id)
                const isUpdating = updating === collection.id
                
                return (
                  <button
                    key={collection.id}
                    onClick={() => toggleCollection(collection.id)}
                    disabled={isUpdating}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                      isSelected 
                        ? 'bg-library-accent/20 text-white' 
                        : 'text-gray-200 hover:bg-gray-700'
                    } ${isUpdating ? 'opacity-50' : ''}`}
                  >
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      isSelected 
                        ? 'bg-library-accent border-library-accent' 
                        : 'border-gray-500'
                    }`}>
                      {isSelected && <CheckIcon />}
                    </div>
                    
                    {/* Collection info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium truncate">{collection.name}</div>
                      <div className="text-sm text-gray-400">
                        {collection.book_count} {collection.book_count === 1 ? 'book' : 'books'}
                      </div>
                    </div>
                    
                    {/* Loading indicator */}
                    {isUpdating && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-library-accent"></div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-700 shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

