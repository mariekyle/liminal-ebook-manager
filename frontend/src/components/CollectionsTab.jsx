/**
 * CollectionsTab - Grid/list view of all user collections with reorder support
 * 
 * Features:
 * - 3-dot menu with Add, Reorder, View toggle options
 * - Grid/list view toggle with localStorage persistence
 * - Drag-to-reorder mode using @dnd-kit (user collections only)
 * - Default collections (TBR, Reading History) pinned at top without drag handles
 * - Context menu on cards for Edit/Delete
 */

import { useState, useEffect } from 'react'
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core'
import { 
  SortableContext, 
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import CollectionCard from './CollectionCard'
import CollectionModal from './CollectionModal'
import UnifiedNavBar from './ui/UnifiedNavBar'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { listCollections, reorderCollections, deleteCollection } from '../api'

// LocalStorage key for view mode preference
const VIEW_MODE_KEY = 'collections_view_mode'

// Icons
const DotsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

/**
 * SortableCollectionCard - Wrapper for CollectionCard with drag-and-drop
 */
function SortableCollectionCard({ collection, viewMode, isReorderMode, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: collection.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined
  }
  
  return (
    <div ref={setNodeRef} style={style}>
      <CollectionCard
        collection={collection}
        viewMode={viewMode}
        isReorderMode={isReorderMode}
        dragHandleProps={isReorderMode ? { ...attributes, ...listeners } : null}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

export default function CollectionsTab() {
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  
  // View mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem(VIEW_MODE_KEY) || 'grid'
  })
  
  // Reorder mode state
  const [isReorderMode, setIsReorderMode] = useState(false)
  
  // Edit/Delete state
  const [collectionToEdit, setCollectionToEdit] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [collectionToDelete, setCollectionToDelete] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Configure drag sensors with activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // Prevents accidental drags
      }
    })
  )
  
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
  
  // Persist view mode to localStorage
  useEffect(() => {
    if (!isReorderMode) {
      localStorage.setItem(VIEW_MODE_KEY, viewMode)
    }
  }, [viewMode, isReorderMode])
  
  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    fetchCollections()
  }
  
  // Menu handlers
  const handleMenuAction = (action) => {
    setShowMenu(false)
    
    switch (action) {
      case 'add':
        setShowCreateModal(true)
        break
      case 'reorder':
        if (!isReorderMode) {
          enterReorderMode()
        }
        break
      case 'toggle_view':
        if (!isReorderMode) {
          setViewMode(prev => prev === 'grid' ? 'list' : 'grid')
        }
        break
    }
  }
  
  // Enter reorder mode
  const enterReorderMode = () => {
    setViewMode('list') // Force list view for reordering
    setIsReorderMode(true)
  }
  
  // Exit reorder mode
  const exitReorderMode = () => {
    setIsReorderMode(false)
    // Restore view mode from localStorage
    const savedMode = localStorage.getItem(VIEW_MODE_KEY) || 'grid'
    setViewMode(savedMode)
  }
  
  // Edit/Delete handlers
  const handleEditCollection = (collection) => {
    setCollectionToEdit(collection)
    setShowEditModal(true)
  }
  
  const handleDeleteCollection = (collection) => {
    setCollectionToDelete(collection)
    setShowDeleteConfirm(true)
  }
  
  const confirmDelete = async () => {
    if (!collectionToDelete) return
    
    try {
      await deleteCollection(collectionToDelete.id)
      setShowDeleteConfirm(false)
      setCollectionToDelete(null)
      fetchCollections()
    } catch (err) {
      console.error('Failed to delete collection:', err)
      alert('Failed to delete collection')
    }
  }
  
  // Split collections for reorder mode
  const defaultCollections = collections.filter(c => c.is_default)
  const userCollections = collections.filter(c => !c.is_default)
  
  // Handle drag end - only for user collections now
  const handleDragEnd = async (event) => {
    const { active, over } = event
    
    if (!over || active.id === over.id) return
    
    const oldIndex = userCollections.findIndex(c => c.id === active.id)
    const newIndex = userCollections.findIndex(c => c.id === over.id)
    
    if (oldIndex === -1 || newIndex === -1) return
    
    // Reorder user collections
    const newUserCollections = arrayMove(userCollections, oldIndex, newIndex)
    
    // Combine with default collections for the full list
    const newCollections = [...defaultCollections, ...newUserCollections]
    
    // Optimistic update
    setCollections(newCollections)
    
    // Save to backend
    try {
      await reorderCollections(newCollections.map(c => c.id))
    } catch (err) {
      console.error('Failed to reorder collections:', err)
      // Revert on error
      fetchCollections()
    }
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh]">
        <UnifiedNavBar title="Collections" />
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action-primary" />
        </div>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col min-h-[50vh]">
        <UnifiedNavBar title="Collections" />
        <div className="flex flex-col items-center justify-center flex-1 px-4 text-text-secondary">
          <p>{error}</p>
          <Button variant="secondary" className="mt-4" type="button" onClick={fetchCollections}>
            Retry
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="pb-24">
      <UnifiedNavBar title="Collections" />
      
      <div className="px-4">
        <div className="flex items-center justify-between py-3">
          <p className="text-caption text-text-muted">
            {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
          </p>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors duration-200 ease-out"
            >
              <DotsIcon />
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMenu(false)}
                />
                
                <div className="absolute right-0 mt-1 py-1 w-48 bg-bg-elevated rounded-lg shadow-xl border border-border-default z-50">
                  <button
                    type="button"
                    onClick={() => handleMenuAction('add')}
                    className="w-full px-4 py-2 text-left text-text-primary hover:bg-bg-surface transition-colors"
                  >
                    Add Collection
                  </button>
                  
                  {!isReorderMode && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleMenuAction('reorder')}
                        className="w-full px-4 py-2 text-left text-text-primary hover:bg-bg-surface transition-colors"
                      >
                        Reorder Collections
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMenuAction('toggle_view')}
                        className="w-full px-4 py-2 text-left text-text-primary hover:bg-bg-surface transition-colors"
                      >
                        View: {viewMode === 'grid' ? 'List' : 'Grid'}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      
      {/* Reorder Mode Banner */}
      {isReorderMode && (
        <div className="mb-4 px-4 py-3 flex items-center justify-between bg-action-primary/15 border border-action-primary rounded-lg">
          <span className="text-body-sm text-text-primary font-medium">Reorder Mode</span>
          <Button type="button" size="sm" variant="primary" onClick={exitReorderMode}>
            Done
          </Button>
        </div>
      )}
      
      {/* Empty state */}
      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-h4 text-text-primary mb-2">No collections yet</h2>
          <p className="text-body-sm text-text-secondary mb-6 max-w-xs">
            Create a collection to organize your books into custom lists
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            icon={<PlusIcon />}
          >
            Create Collection
          </Button>
        </div>
      ) : isReorderMode ? (
        <>
          {defaultCollections.length > 0 && (
            <div className="mb-4">
              <div className="text-caption text-text-muted uppercase tracking-wider mb-2 px-2">
                Default Collections
              </div>
              <div className="space-y-2">
                {defaultCollections.map(collection => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    viewMode="list"
                    isReorderMode={false}
                    dragHandleProps={null}
                    onEdit={handleEditCollection}
                    onDelete={handleDeleteCollection}
                  />
                ))}
              </div>
            </div>
          )}

          {defaultCollections.length > 0 && userCollections.length > 0 && (
            <div className="my-4 border-t border-border-default" />
          )}

          {userCollections.length > 0 && (
            <div>
              <div className="text-caption text-text-muted uppercase tracking-wider mb-2 px-2">
                My Collections
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={userCollections.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {userCollections.map(collection => (
                      <SortableCollectionCard
                        key={collection.id}
                        collection={collection}
                        viewMode={viewMode}
                        isReorderMode={isReorderMode}
                        onEdit={handleEditCollection}
                        onDelete={handleDeleteCollection}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </>
      ) : (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {collections.map(collection => (
              <CollectionCard 
                key={collection.id} 
                collection={collection}
                viewMode="grid"
                onEdit={handleEditCollection}
                onDelete={handleDeleteCollection}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {collections.map(collection => (
              <CollectionCard 
                key={collection.id} 
                collection={collection}
                viewMode="list"
                onEdit={handleEditCollection}
                onDelete={handleDeleteCollection}
              />
            ))}
          </div>
        )
      )}
      
      {showCreateModal && (
        <CollectionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
      
      {showEditModal && (
        <CollectionModal
          collection={collectionToEdit}
          onClose={() => {
            setShowEditModal(false)
            setCollectionToEdit(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setCollectionToEdit(null)
            fetchCollections()
          }}
        />
      )}
      
      <Modal
        isOpen={showDeleteConfirm && !!collectionToDelete}
        onClose={() => setShowDeleteConfirm(false)}
        size="sm"
      >
        <Modal.Header onClose={() => setShowDeleteConfirm(false)}>Delete Collection?</Modal.Header>
        <Modal.Body>
          <p className="text-body-sm text-text-secondary">
            Are you sure you want to delete &quot;{collectionToDelete?.name}&quot;? This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" type="button" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" type="button" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
      </div>
    </div>
  )
}
