/**
 * DuplicateCollectionModal - Create a copy of an existing collection
 * 
 * Allows user to:
 * - Set a new name (defaults to "Copy of [original]")
 * - Optionally change the collection type
 * - For automatic type, set new criteria or copy existing
 */

import { useState, useEffect } from 'react'
import { duplicateCollection } from '../api'
import CriteriaBuilder from './CriteriaBuilder'

// X icon for close button
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// Info icon for tooltip
const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
)

// Collection type definitions
const COLLECTION_TYPES = [
  {
    id: 'manual',
    name: 'Manual',
    icon: '📚',
    description: 'Add and remove books yourself',
  },
  {
    id: 'checklist',
    name: 'Checklist',
    icon: '✔',
    description: 'Books get checked off when finished',
  },
  {
    id: 'automatic',
    name: 'Automatic',
    icon: '⚡',
    description: 'Books appear based on rules',
  }
]

export default function DuplicateCollectionModal({ collection, onClose, onSuccess }) {
  const [name, setName] = useState(`Copy of ${collection?.name || ''}`)
  const [collectionType, setCollectionType] = useState(collection?.collection_type || 'manual')
  const [criteria, setCriteria] = useState(() => {
    // Copy existing criteria if source is automatic
    if (collection?.auto_criteria) {
      try {
        return typeof collection.auto_criteria === 'string' 
          ? JSON.parse(collection.auto_criteria) 
          : collection.auto_criteria
      } catch {
        return {}
      }
    }
    return {}
  })
  const [showTypeInfo, setShowTypeInfo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  
  // Preview count for automatic collections
  const [previewCount, setPreviewCount] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Fetch preview count when criteria changes (for automatic type)
  useEffect(() => {
    if (collectionType !== 'automatic') {
      setPreviewCount(null)
      return
    }

    const hasAnyCriteria = Object.values(criteria).some(v => 
      v !== null && v !== undefined && v !== '' && 
      (Array.isArray(v) ? v.length > 0 : true)
    )
    
    if (!hasAnyCriteria) {
      setPreviewCount(null)
      return
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const response = await fetch('/api/collections/preview-criteria', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(criteria)
        })
        if (response.ok) {
          const data = await response.json()
          setPreviewCount(data.count)
        }
      } catch (err) {
        console.error('Preview fetch failed:', err)
      } finally {
        setPreviewLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [criteria, collectionType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Collection name is required')
      return
    }
    
    // Automatic collections require at least one criterion
    if (collectionType === 'automatic') {
      const hasAnyCriteria = Object.values(criteria).some(v => 
        v !== null && v !== undefined && v !== '' && 
        (Array.isArray(v) ? v.length > 0 : true)
      )
      if (!hasAnyCriteria) {
        setError('Automatic collections require at least one rule')
        return
      }
    }
    
    try {
      setSaving(true)
      setError(null)
      
      const data = {
        name: name.trim(),
        collection_type: collectionType,
      }
      
      if (collectionType === 'automatic') {
        data.auto_criteria = criteria
      }
      
      await duplicateCollection(collection.id, data)
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Failed to duplicate collection:', err)
      setError(err.message || 'Failed to duplicate collection')
    } finally {
      setSaving(false)
    }
  }

  // Show criteria builder when type is automatic
  const showCriteriaBuilder = collectionType === 'automatic'
  
  // Info about what will be copied
  const getCopyInfo = () => {
    const sourceType = collection?.collection_type || 'manual'
    const sourceIsAuto = sourceType === 'automatic'
    
    if (collectionType === 'automatic') {
      return sourceIsAuto 
        ? 'Criteria will be copied. Books will populate based on rules.'
        : 'Set rules below. Source books will not be copied.'
    } else {
      return sourceIsAuto
        ? 'No books will be copied (source is automatic).'
        : `${collection?.book_count || 0} books will be copied.`
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
      <div className="relative w-full max-w-md bg-library-card rounded-xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Duplicate Collection</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XIcon />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <form id="duplicate-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Collection name"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-library-accent"
              autoFocus
            />
          </div>
          
          {/* Collection Type Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Collection Type
              </label>
              <button
                type="button"
                onClick={() => setShowTypeInfo(!showTypeInfo)}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                <InfoIcon />
                {showTypeInfo ? 'Hide' : 'Info'}
              </button>
            </div>

            {/* Type info tooltip */}
            {showTypeInfo && (
              <div className="mb-3 p-3 bg-gray-800 border border-gray-700 rounded-lg space-y-2 text-sm">
                {COLLECTION_TYPES.map(type => (
                  <div key={type.id}>
                    <span className="font-medium text-gray-200">{type.icon} {type.name}:</span>
                    <span className="text-gray-400 ml-1">{type.description}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Type selector buttons */}
            <div className="grid grid-cols-3 gap-2">
              {COLLECTION_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setCollectionType(type.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                    collectionType === type.id
                      ? 'bg-library-accent/20 border-library-accent text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                  }`}
                >
                  <span className="text-lg mb-0.5">{type.icon}</span>
                  <span className="text-xs font-medium">{type.name}</span>
                </button>
              ))}
            </div>
            
            {/* Copy info */}
            <p className="mt-2 text-xs text-gray-500">
              {getCopyInfo()}
            </p>
          </div>

          {/* Criteria Builder (for automatic type) */}
          {showCriteriaBuilder && (
            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-300">
                  Rules
                </label>
                {previewLoading ? (
                  <span className="text-xs text-gray-500">Counting...</span>
                ) : previewCount !== null ? (
                  <span className="text-xs text-blue-400">
                    ~{previewCount} book{previewCount !== 1 ? 's' : ''} match
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">Set rules to see matches</span>
                )}
              </div>

              <CriteriaBuilder 
                criteria={criteria}
                onChange={setCriteria}
              />
            </div>
          )}
          
          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </form>
        
        {/* Actions - Fixed at bottom */}
        <div className="flex gap-3 p-4 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="duplicate-form"
            disabled={saving || !name.trim()}
            className="flex-1 px-4 py-2 bg-library-accent hover:opacity-90 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg font-medium transition-opacity"
          >
            {saving ? 'Creating...' : 'Duplicate'}
          </button>
        </div>
      </div>
    </div>
  )
}
