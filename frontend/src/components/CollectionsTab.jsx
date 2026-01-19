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
        
        {/* Menu button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <DotsIcon />
          </button>
          
          {/* Dropdown menu */}
          {showMenu && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMenu(false)}
              />
              
              {/* Menu */}
              <div className="absolute right-0 mt-1 py-1 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
                <button
                  onClick={() => handleMenuAction('add')}
                  className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 transition-colors"
                >
                  Add Collection
                </button>
                
                {/* Only show when NOT in reorder mode */}
                {!isReorderMode && (
                  <>
                    <button
                      onClick={() => handleMenuAction('reorder')}
                      className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 transition-colors"
                    >
                      Reorder Collections
                    </button>
                    <button
                      onClick={() => handleMenuAction('toggle_view')}
                      className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 transition-colors"
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
        <div className="mb-4 px-4 py-3 flex items-center justify-between bg-library-accent/20 border border-library-accent rounded-lg">
          <span className="text-sm text-gray-200 font-medium">Reorder Mode</span>
          <button
            onClick={exitReorderMode}
            className="px-3 py-1 text-sm font-medium bg-library-accent hover:opacity-90 text-white rounded transition-opacity"
          >
            Done
          </button>
        </div>
      )}
      
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
      ) : isReorderMode ? (
        /* Reorder Mode - Split into Default and User sections */
        <>
          {/* Default Collections Section - No drag handles */}
          {defaultCollections.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
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

          {/* Visual Separator */}
          {defaultCollections.length > 0 && userCollections.length > 0 && (
            <div className="my-4 border-t border-gray-700"></div>
          )}

          {/* User Collections Section - With drag handles */}
          {userCollections.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
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
        /* Normal view - grid or list */
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
      
      {/* Create Modal */}
      {showCreateModal && (
        <CollectionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
      
      {/* Edit Modal */}
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
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && collectionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-gray-800 rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Delete Collection?
            </h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete "{collectionToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
