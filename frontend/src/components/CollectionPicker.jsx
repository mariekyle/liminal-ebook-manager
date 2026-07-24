/**
 * CollectionPicker - Modal to add a book to collections
 * 
 * Shows list of all collections with checkmarks for ones the book is already in.
 * Allows adding to multiple collections at once.
 */

import { useState, useEffect, useMemo } from 'react'
import { listCollections, addBooksToCollection, removeBookFromCollection } from '../api'
import Modal from './ui/Modal'
import Button from './ui/Button'
import SearchInput from './ui/SearchInput'
import CollectionModal from './CollectionModal'

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M5 13l4 4L19 7" />
  </svg>
)

const AddIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
  </svg>
)

export default function CollectionPicker({ bookId, currentCollectionIds = [], onClose, onUpdate }) {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null) // Collection ID being updated
  const [selectedIds, setSelectedIds] = useState(new Set(currentCollectionIds))
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    loadCollections()
  }, [])
  
  useEffect(() => {
    setSelectedIds(new Set(currentCollectionIds))
  }, [currentCollectionIds])
  
  const loadCollections = async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const data = await listCollections()
      setCollections(data)
    } catch (err) {
      console.error('Failed to load collections:', err)
      setLoadError("Couldn't load your collections.")
    } finally {
      setLoading(false)
    }
  }

  const visibleCollections = useMemo(() => {
    const sorted = [...collections].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
    const q = searchQuery.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter(c => c.name.toLowerCase().includes(q))
  }, [collections, searchQuery])

  const handleNewCollectionSuccess = async (newCollection) => {
    setShowCreateModal(false)
    setSaveError(null)
    if (!newCollection?.id) {
      // Fallback: just refresh the list if we didn't get the new collection back
      await loadCollections()
      if (onUpdate) onUpdate()
      return
    }
    try {
      await addBooksToCollection(newCollection.id, [bookId])
      setSelectedIds(prev => new Set([...prev, newCollection.id]))
      await loadCollections()
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Failed to add book to new collection:', err)
      setSaveError("Created the collection, but couldn't add this title to it. Tap it below to try again.")
      // Still reload so the user at least sees the new (empty) collection
      await loadCollections()
      if (onUpdate) onUpdate()
    }
  }
  
  const toggleCollection = async (collectionId) => {
    if (updating) return
    
    const isCurrentlySelected = selectedIds.has(collectionId)
    setUpdating(collectionId)
    setSaveError(null)

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
      setSaveError("Couldn't save your changes. Try again?")
    } finally {
      setUpdating(null)
    }
  }
  
  return (
    <Modal isOpen onClose={onClose} size="md" fullscreenOnMobile>
      <Modal.Header onClose={onClose}>Add to Collection</Modal.Header>
      <Modal.Body className="max-h-[60vh] sm:max-h-[min(70vh,520px)] p-2 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-action-primary" />
          </div>
        ) : loadError ? (
          <div className="px-1 py-4 text-center">
            <div
              role="alert"
              className="mb-3 rounded-lg px-3 py-2 text-body-sm bg-action-danger/10 border border-action-danger/30 text-action-danger"
            >
              {loadError}
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={loadCollections}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            {saveError && (
              <div
                role="alert"
                className="mx-1 mt-1 mb-2 rounded-lg px-3 py-2 text-body-sm bg-action-danger/10 border border-action-danger/30 text-action-danger"
              >
                {saveError}
              </div>
            )}
            {collections.length > 0 && (
              <div className="px-1 pb-2 pt-1">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Find a collection..."
                />
              </div>
            )}

            {collections.length === 0 ? (
              <div className="text-center py-8 px-2">
                <p className="text-body-sm text-text-secondary mb-2">No collections yet</p>
                <p className="text-caption text-text-muted">
                  Create your first collection below.
                </p>
              </div>
            ) : visibleCollections.length === 0 ? (
              <div className="text-center py-6 px-2">
                <p className="text-body-sm text-text-muted">
                  No collections match "{searchQuery}"
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {visibleCollections.map(collection => {
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
                        <div className="font-medium text-body-sm text-text-secondary truncate">{collection.name}</div>
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

            {/* design-lint-button-chrome: create-slot affordance (parked NOT-B1, 2026-07-22) */}
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 mt-2 rounded-lg border-2 border-dashed border-border-default text-text-secondary hover:border-action-primary hover:text-action-primary transition-colors duration-200 ease-out min-h-[44px]"
            >
              <AddIcon />
              <span className="text-body-sm text-text-secondary font-medium">New Collection</span>
            </button>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
          Done
        </Button>
      </Modal.Footer>

      {showCreateModal && (
        <CollectionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleNewCollectionSuccess}
        />
      )}
    </Modal>
  )
}
