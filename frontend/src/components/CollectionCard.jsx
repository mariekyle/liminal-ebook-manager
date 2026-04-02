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

const DragHandleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-text-muted">
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
  
  const handleContextMenu = (e) => {
    if (isReorderMode) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const x = Math.min(e.clientX, window.innerWidth - 200)
    const y = Math.min(e.clientY, window.innerHeight - 150)
    
    setMenuPosition({ x, y })
    setShowContextMenu(true)
  }
  
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
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }
  
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
    
    return (
      <CollectionGradient
        collectionId={collection.id}
        collectionName={collection.name}
        className={`${className} rounded-lg`}
      />
    )
  }
  
  const ContextMenu = () => {
    if (!showContextMenu) return null
    
    return (
      <>
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowContextMenu(false)}
        />
        
        <div 
          className="fixed z-50 w-48 bg-bg-elevated rounded-lg shadow-xl border border-border-default py-1"
          style={{
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowContextMenu(false)
              onEdit?.(collection)
            }}
            className="w-full px-4 py-2 text-left text-text-primary hover:bg-bg-surface transition-colors"
          >
            Edit Collection
          </button>
          
          {!collection.is_default && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowContextMenu(false)
                onDelete?.(collection)
              }}
              className="w-full px-4 py-2 text-left text-action-danger hover:bg-bg-surface transition-colors"
            >
              Delete Collection
            </button>
          )}
        </div>
      </>
    )
  }
  
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
            flex items-center gap-3 px-3 py-2 rounded-lg border border-border-default bg-bg-surface
            hover:bg-bg-elevated transition-colors duration-200 ease-out
            ${!isReorderMode ? 'cursor-pointer' : 'cursor-default'}
          `}
        >
          <div className="flex-shrink-0 w-12 h-16 overflow-hidden rounded-md border border-border-subtle">
            {renderCover('w-full h-full')}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="min-w-0">
              <h3 className="text-body-sm text-text-primary font-medium truncate">
                {collection.name}
              </h3>
              {collection.description && (
                <p className="text-caption text-text-muted truncate">
                  {collection.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex-shrink-0 text-caption text-text-muted tabular-nums">
            {collection.book_count}
          </div>
          
          {isReorderMode && dragHandleProps && (
            <button
              type="button"
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
  
  return (
    <>
      <button
        type="button"
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
        <div className="bg-bg-surface border border-border-default rounded-lg p-2 transition-all duration-200 ease-out group-hover:border-action-primary/30">
          <div className="relative rounded-md overflow-hidden shadow-md group-hover:shadow-lg aspect-square">
            {renderCover('w-full h-full')}
          </div>
          
          <div className="mt-2 px-0.5">
            <div className="min-w-0">
              <h3 className="text-body-sm text-text-primary font-medium truncate group-hover:text-action-primary transition-colors">
                {collection.name}
              </h3>
              <p className="text-caption text-text-muted">
                {collection.book_count} {collection.book_count === 1 ? 'title' : 'titles'}
              </p>
            </div>
          </div>
        </div>
      </button>
      
      <ContextMenu />
    </>
  )
}
