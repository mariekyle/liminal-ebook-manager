/**
 * CollectionModal - Create or edit a collection
 * 
 * Phase 9E Day 2: Added collection type selector and criteria builder
 * 
 * Collection Types:
 * - manual: User adds/removes books manually (existing behavior)
 * - checklist: User adds manually, books auto-complete when marked Done
 * - automatic: Books auto-populate based on criteria rules
 * 
 * FIXES in this version:
 * - Shows criteria builder when EDITING automatic collections (not just creating)
 * - Uses form id to properly link external submit button
 */

import { useState, useEffect, useRef } from 'react'
import { createCollection, updateCollection, updateCollectionCoverType, uploadCollectionCover, deleteCollectionCover } from '../api'
import CriteriaBuilder from './CriteriaBuilder'

// X icon for close button
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
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
    example: 'Favorites, Beach Reads'
  },
  {
    id: 'checklist',
    name: 'Checklist',
    icon: '✓',
    description: 'Books get checked off when finished',
    example: 'TBR, Reading Challenge'
  },
  {
    id: 'automatic',
    name: 'Automatic',
    icon: '⚡',
    description: 'Books appear based on rules',
    example: '5-Star Books, Read This Year'
  }
]

export default function CollectionModal({ collection = null, onClose, onSuccess }) {
  const isEditing = !!collection
  
  const [name, setName] = useState(collection?.name || '')
  const [description, setDescription] = useState(collection?.description || '')
  const [coverType, setCoverType] = useState(collection?.cover_type || 'gradient')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  
  // State for cover preview (when editing collection with custom cover)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null)
  // Ref to track previous blob URL for cleanup (avoids closure issues)
  const prevCoverUrlRef = useRef(null)
  // Track if user uploaded a cover this session (for type switching)
  const [uploadedThisSession, setUploadedThisSession] = useState(false)
  
  // Phase 9E: New state for collection type and criteria
  const [collectionType, setCollectionType] = useState(collection?.collection_type || 'manual')
  const [criteria, setCriteria] = useState(() => {
    // Parse existing criteria if editing an automatic collection
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
  const [previewCount, setPreviewCount] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Fetch preview count when criteria changes (for automatic type)
  useEffect(() => {
    if (collectionType !== 'automatic') {
      setPreviewCount(null)
      return
    }

    // Check if we have at least one criteria set
    const hasAnyCriteria = Object.values(criteria).some(v => 
      v !== null && v !== undefined && v !== '' && 
      (Array.isArray(v) ? v.length > 0 : true)
    )
    
    if (!hasAnyCriteria) {
      setPreviewCount(null)
      return
    }

    // Debounce the preview request
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

  // Load cover preview for existing collections with custom covers
  useEffect(() => {
    if (collection?.id && collection?.cover_type === 'custom') {
      // Use the cover endpoint with cache buster
      setCoverPreviewUrl(`/api/collections/${collection.id}/cover?t=${Date.now()}`)
    }
  }, [collection?.id, collection?.cover_type])

  // Cleanup previous blob URL when coverPreviewUrl changes
  useEffect(() => {
    // Revoke the PREVIOUS blob URL (stored in ref)
    const prevUrl = prevCoverUrlRef.current
    if (prevUrl && prevUrl.startsWith('blob:')) {
      URL.revokeObjectURL(prevUrl)
    }
    
    // Store current URL in ref for next cleanup
    prevCoverUrlRef.current = coverPreviewUrl
  }, [coverPreviewUrl])

  // Cleanup on unmount (separate effect with empty deps)
  useEffect(() => {
    return () => {
      // On unmount: revoke whatever blob URL is stored in ref
      if (prevCoverUrlRef.current && prevCoverUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(prevCoverUrlRef.current)
      }
    }
  }, [])
  
  const handleCoverTypeChange = async (type) => {
    if (!collection?.id) {
      // For new collections, just update local state
      setCoverType(type)
      return
    }
    
    // For existing collections, update via API
    try {
      await updateCollectionCoverType(collection.id, type)
      setCoverType(type)
      
      // Manage cover preview URL based on new type
      if (type === 'custom' && (collection?.custom_cover_path || uploadedThisSession)) {
        // Switching TO custom: reload preview with fresh cache buster
        // Works for both pre-existing covers and covers uploaded this session
        setCoverPreviewUrl(`/api/collections/${collection.id}/cover?t=${Date.now()}`)
      } else if (type !== 'custom') {
        // Switching AWAY from custom: clear the preview
        setCoverPreviewUrl(null)
      }
    } catch (err) {
      console.error('Failed to update cover type:', err)
      alert('Failed to update cover type')
    }
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !collection?.id) return
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB')
      return
    }
    
    try {
      setUploadingCover(true)
      await uploadCollectionCover(collection.id, file)
      setCoverType('custom')
      setUploadedThisSession(true)  // Track that we uploaded this session
      // Show preview of uploaded image (cleanup handled by useEffect)
      setCoverPreviewUrl(URL.createObjectURL(file))
    } catch (err) {
      console.error('Failed to upload cover:', err)
      alert('Failed to upload cover')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleDeleteCover = async () => {
    if (!collection?.id) return
    
    try {
      await deleteCollectionCover(collection.id)
      setCoverType('gradient')
      setUploadedThisSession(false)  // Reset since cover was deleted
      // Clear preview (cleanup handled by useEffect)
      setCoverPreviewUrl(null)
    } catch (err) {
      console.error('Failed to delete cover:', err)
      alert('Failed to remove cover')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Collection name is required')
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      
      const data = {
        name: name.trim(),
        description: description.trim()  // Send empty string, not null - backend converts to NULL
      }
      
      if (isEditing) {
        // When editing, update name/description
        // For automatic collections, also update criteria (if not a default collection)
        if (collection.collection_type === 'automatic' && !collection.is_default) {
          data.auto_criteria = criteria
        }
        await updateCollection(collection.id, data)
      } else {
        // When creating, include type and criteria
        await createCollection({ 
          ...data, 
          cover_type: coverType,
          collection_type: collectionType,
          auto_criteria: collectionType === 'automatic' ? criteria : null
        })
      }
      
      onSuccess()
    } catch (err) {
      console.error('Failed to save collection:', err)
      setError('Failed to save collection')
    } finally {
      setSaving(false)
    }
  }
  
  // Check if this is a default collection (TBR or Reading History)
  const isDefaultCollection = collection?.is_default === 1
  
  // Determine if we should show the criteria builder
  // Show when: creating automatic collection OR editing non-default automatic collection
  const showCriteriaBuilder = (
    (!isEditing && collectionType === 'automatic') ||
    (isEditing && collection?.collection_type === 'automatic' && !isDefaultCollection)
  )
  
  // Determine if criteria is read-only (default automatic collections)
  const criteriaReadOnly = isEditing && isDefaultCollection && collection?.collection_type === 'automatic'
  
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full sm:max-w-md max-h-[90vh] bg-library-card rounded-t-xl sm:rounded-xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">
            {isEditing ? 'Edit Collection' : 'New Collection'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-200 rounded"
          >
            <XIcon />
          </button>
        </div>
        
        {/* Form - Scrollable */}
        <form id="collection-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Collection"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-library-accent"
              autoFocus
            />
          </div>
          
          {/* Description field */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this collection about?"
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-library-accent resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">Supports markdown formatting</p>
          </div>
          
          {/* ===== Phase 9E: Collection Type Selector (only when creating) ===== */}
          {!isEditing && (
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

              {/* Example text for selected type */}
              <p className="mt-1.5 text-xs text-gray-500">
                e.g. {COLLECTION_TYPES.find(t => t.id === collectionType)?.example}
              </p>
            </div>
          )}

          {/* Show current type when editing (read-only badge) */}
          {isEditing && collection?.collection_type && collection.collection_type !== 'manual' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Collection Type
              </label>
              <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-sm flex items-center gap-2">
                <span>{COLLECTION_TYPES.find(t => t.id === collection.collection_type)?.icon}</span>
                <span className="capitalize">{collection.collection_type}</span>
                <span className="text-gray-500 text-xs ml-auto">(cannot be changed)</span>
              </div>
            </div>
          )}

          {/* ===== Phase 9E: Criteria Builder ===== */}
          {/* Show for: new automatic collections OR editing non-default automatic collections */}
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

          {/* Show criteria as read-only for default automatic collections */}
          {criteriaReadOnly && (
            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">
                  Rules
                </label>
                <span className="text-xs text-gray-500">(cannot be changed)</span>
              </div>
              <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 text-sm">
                {Object.entries(criteria).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-gray-500">{key}:</span> {JSON.stringify(value)}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Cover Type - only show when editing existing collection */}
          {collection?.id && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cover Style
              </label>
              <div className="space-y-2">
                {/* Gradient option */}
                <button
                  type="button"
                  onClick={() => handleCoverTypeChange('gradient')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    coverType === 'gradient'
                      ? 'bg-library-accent/20 text-white ring-1 ring-library-accent'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-600 to-pink-500" />
                  <span className="text-sm">Gradient</span>
                </button>
                
                {/* Custom upload option */}
                <label
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    coverType === 'custom'
                      ? 'bg-library-accent/20 text-white ring-1 ring-library-accent'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  } ${uploadingCover ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {/* Thumbnail preview or camera icon */}
                  <div className="w-6 h-6 rounded bg-gray-600 flex items-center justify-center overflow-hidden">
                    {uploadingCover ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                    ) : coverPreviewUrl ? (
                      <img 
                        src={coverPreviewUrl} 
                        alt="Cover preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <CameraIcon />
                    )}
                  </div>
                  <span className="text-sm flex-1">
                    {coverPreviewUrl ? 'Change image' : 'Custom image'}
                  </span>
                  {coverPreviewUrl && (
                    <span className="text-xs text-gray-400">✓ Set</span>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleCoverUpload}
                    className="hidden"
                    disabled={uploadingCover}
                  />
                </label>
                
                {/* Remove custom cover */}
                {coverType === 'custom' && (
                  <button
                    type="button"
                    onClick={handleDeleteCover}
                    className="w-full text-sm text-red-400 hover:text-red-300 py-1"
                  >
                    Remove custom cover
                  </button>
                )}
              </div>
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
            form="collection-form"
            disabled={saving || !name.trim()}
            className="flex-1 px-4 py-2 bg-library-accent hover:opacity-90 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg font-medium transition-opacity"
          >
            {saving ? 'Saving...' : (isEditing ? 'Save' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  )
}
