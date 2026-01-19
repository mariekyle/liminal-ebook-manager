/**
 * CollectionCard - Display card for a collection with grid/list view support
 * 
 * Props:
 * - collection: Collection object
 * - viewMode: 'grid' or 'list'
 * - isReorderMode: When true, disables navigation and shows drag handles
 * - dragHandleProps: Props to spread on drag handle from dnd-kit
 * - onEdit: Callback when "Edit Collection" is clicked
 * - onDelete: Callback when "Delete Collection" is clicked
 */

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import CollectionGradient from './CollectionGradient'
import MosaicCover from './MosaicCover'

// Drag handle icon (6 dots in 2 columns)
const DragHandleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-500">
    <path d="M9 5h2v2H9V5zm0 6h2v2H9v-2zm0 6h2v2H9v-2zm4-12h2v2h-2V5zm0 6h2v2h-2v-2zm0 6h2v2h-2v-2z" />
  </svg>
)

export default function CollectionCard({ 
  collection, 
  viewMode = 'grid',
  isReorderMode = false,
  dragHandleProps = null,
  onEdit,
  onDelete
}) {
  const navigate = useNavigate()
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const longPressTimerRef = useRef(null)
  
  const handleClick = () => {
    if (!isReorderMode && !showContextMenu) {
      navigate(`/collections/${collection.id}`)
    }
  }
  
  // Context menu handler (right-click)
  const handleContextMenu = (e) => {
    if (isReorderMode) return
    
    e.preventDefault()
    e.stopPropagation()
    
    // Adjust position to keep menu in viewport
    const x = Math.min(e.clientX, window.innerWidth - 200)
    const y = Math.min(e.clientY, window.innerHeight - 150)
    
    setMenuPosition({ x, y })
    setShowContextMenu(true)
  }
  
  // Long press handlers for mobile
  const handleTouchStart = (e) => {
    if (isReorderMode) return
    
    longPressTimerRef.current = setTimeout(() => {
      const touch = e.touches[0]
      const x = Math.min(touch.clientX, window.innerWidth - 200)
      const y = Math.min(touch.clientY, window.innerHeight - 150)
      
      setMenuPosition({ x, y })
      setShowContextMenu(true)
    }, 500)
  }
  
  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }
  
  const handleTouchMove = () => {
    // Cancel long press if finger moves
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }
  
  // Determine which cover component to use
  const renderCover = (className) => {
    if (collection.cover_type === 'custom') {
      return (
        <MosaicCover 
          coverType="custom"
          collectionId={collection.id}
          variant="square"
          className={className}
        />
      )
    }
    
    // Use CollectionGradient for non-custom covers
    return (
      <CollectionGradient
        collectionId={collection.id}
        collectionName={collection.name}
        className={`${className} rounded-lg`}
      />
    )
  }
  
  // Context Menu Component
  const ContextMenu = () => {
    if (!showContextMenu) return null
    
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowContextMenu(false)}
        />
        
        {/* Menu */}
        <div 
          className="fixed z-50 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowContextMenu(false)
              onEdit?.(collection)
            }}
            className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 transition-colors"
          >
            Edit Collection
          </button>
          
          {!collection.is_default && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowContextMenu(false)
                onDelete?.(collection)
              }}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 transition-colors"
            >
              Delete Collection
            </button>
          )}
        </div>
      </>
    )
  }
  
  // LIST VIEW
  if (viewMode === 'list') {
    return (
      <>
        <div 
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          className={`
            flex items-center gap-3 px-3 py-2 rounded-lg
            bg-gray-800/50 hover:bg-gray-800
            transition-colors
            ${!isReorderMode ? 'cursor-pointer' : 'cursor-default'}
          `}
        >
          {/* Mini thumbnail */}
          <div className="flex-shrink-0 w-12 h-16 overflow-hidden rounded">
            {renderCover('w-full h-full')}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-100 truncate">
              {collection.name}
            </h3>
            {collection.description && (
              <p className="text-xs text-gray-500 truncate">
                {collection.description}
              </p>
            )}
          </div>
          
          {/* Book count */}
          <div className="flex-shrink-0 text-sm text-gray-400">
            {collection.book_count} {collection.book_count === 1 ? 'book' : 'books'}
          </div>
          
          {/* Drag handle - only shown in reorder mode */}
          {isReorderMode && dragHandleProps && (
            <button
              {...dragHandleProps}
              className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing touch-none"
              onClick={(e) => e.stopPropagation()}
            >
              <DragHandleIcon />
            </button>
          )}
        </div>
        
        <ContextMenu />
      </>
    )
  }
  
  // GRID VIEW (default)
  return (
    <>
      <button
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        disabled={isReorderMode}
        className={`
          text-left w-full group
          ${isReorderMode ? 'cursor-default' : ''}
        `}
      >
        {/* Cover - square aspect ratio */}
        <div className="relative rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow aspect-square">
          {renderCover('w-full h-full')}
        </div>
        
        {/* Info - below the cover */}
        <div className="mt-2 px-0.5">
          <h3 className="font-medium text-gray-100 truncate group-hover:text-white transition-colors">
            {collection.name}
          </h3>
          <p className="text-sm text-gray-400">
            {collection.book_count} {collection.book_count === 1 ? 'book' : 'books'}
          </p>
        </div>
      </button>
      
      <ContextMenu />
    </>
  )
}
