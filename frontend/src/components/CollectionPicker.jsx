/**
 * CollectionPicker - Modal to add a book to collections
 * 
 * Shows list of all collections with checkmarks for ones the book is already in.
 * Allows adding to multiple collections at once.
 */

import { useState, useEffect } from 'react'
import { listCollections, addBooksToCollection, removeBookFromCollection } from '../api'
import Modal from './ui/Modal'
import Button from './ui/Button'

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M5 13l4 4L19 7" />
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
        await removeBookFromCollection(collectionId, bookId)
        setSelectedIds(prev => {
          const next = new Set(prev)
          next.delete(collectionId)
          return next
        })
      } else {
        await addBooksToCollection(collectionId, [bookId])
        setSelectedIds(prev => new Set([...prev, collectionId]))
      }
      
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Failed to update collection:', err)
    } finally {
      setUpdating(null)
    }
  }
  
  return (
    <Modal isOpen onClose={onClose} size="md" fullscreenOnMobile>
      <Modal.Header onClose={onClose}>Add to Collection</Modal.Header>
      <Modal.Body className="max-h-[60vh] sm:max-h-[min(70vh,520px)] p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-action-primary" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-8 px-2">
            <p className="text-body-sm text-text-secondary mb-2">No collections yet</p>
            <p className="text-caption text-text-muted">
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
                  type="button"
                  onClick={() => toggleCollection(collection.id)}
                  disabled={isUpdating}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200 ease-out ${
                    isSelected 
                      ? 'bg-action-primary/15 text-text-primary border border-action-primary/40' 
                      : 'text-text-primary hover:bg-bg-elevated border border-transparent'
                  } ${isUpdating ? 'opacity-50' : ''}`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                    isSelected 
                      ? 'bg-action-primary border-action-primary text-text-primary' 
                      : 'border-border-default'
                  }`}>
                    {isSelected && <CheckIcon />}
                  </div>
                  
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-body-sm truncate">{collection.name}</div>
                    <div className="text-caption text-text-muted">
                      {collection.book_count} {collection.book_count === 1 ? 'book' : 'books'}
                    </div>
                  </div>
                  
                  {isUpdating && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-action-primary shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
          Done
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
