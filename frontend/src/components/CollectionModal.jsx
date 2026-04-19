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
import Modal from './ui/Modal'
import Button from './ui/Button'
import FormField from './ui/FormField'

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
      
      let result = null
      if (isEditing) {
        // When editing, update name/description
        // For automatic collections, also update criteria (if not a default collection)
        if (collection.collection_type === 'automatic' && !collection.is_default) {
          data.auto_criteria = criteria
        }
        result = await updateCollection(collection.id, data)
      } else {
        // When creating, include type and criteria
        result = await createCollection({ 
          ...data, 
          cover_type: coverType,
          collection_type: collectionType,
          auto_criteria: collectionType === 'automatic' ? criteria : null
        })
      }
      
      onSuccess(result)
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
  
  const nameHasError = !!error && /name|required/i.test(error)

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      fullscreenOnMobile
      className="max-h-[90vh] sm:max-h-[85vh]"
    >
      <Modal.Header onClose={onClose}>
        {isEditing ? 'Edit Collection' : 'Create Collection'}
      </Modal.Header>

      <form id="collection-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <Modal.Body className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg px-3 py-2 text-sm bg-action-danger/10 border border-action-danger/30 text-action-danger"
            >
              {error}
            </div>
          )}

          <FormField label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Collection"
              className={`w-full px-3 py-2 bg-bg-elevated border rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-action-primary ${
                nameHasError ? 'border-action-danger' : 'border-border-default'
              }`}
              autoFocus
            />
          </FormField>

          <FormField label="Description (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this collection about?"
              rows={3}
              className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-action-primary resize-none"
            />
            <p className="mt-1 text-caption text-text-muted">Supports markdown formatting</p>
          </FormField>
          
          {/* ===== Phase 9E: Collection Type Selector (only when creating) ===== */}
          {!isEditing && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-label text-text-primary">Type</span>
                <button
                  type="button"
                  onClick={() => setShowTypeInfo(!showTypeInfo)}
                  className="flex items-center gap-1 text-caption text-action-primary hover:opacity-90"
                >
                  <InfoIcon />
                  {showTypeInfo ? 'Hide' : 'Info'}
                </button>
              </div>

              {showTypeInfo && (
                <div className="mb-3 p-3 bg-bg-elevated border border-border-default rounded-lg space-y-2 text-body-sm">
                  {COLLECTION_TYPES.map(type => (
                    <div key={type.id}>
                      <span className="font-medium text-text-primary">{type.icon} {type.name}:</span>
                      <span className="text-text-secondary ml-1">{type.description}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {COLLECTION_TYPES.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setCollectionType(type.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                      collectionType === type.id
                        ? 'bg-action-primary/15 border-action-primary text-text-primary'
                        : 'bg-bg-elevated border-border-default text-text-secondary hover:border-action-primary/50 hover:text-text-primary'
                    }`}
                  >
                    <span className="text-lg mb-0.5">{type.icon}</span>
                    <span className="text-xs font-medium">{type.name}</span>
                  </button>
                ))}
              </div>

              <p className="mt-1.5 text-caption text-text-muted">
                e.g. {COLLECTION_TYPES.find(t => t.id === collectionType)?.example}
              </p>
            </div>
          )}

          {isEditing && collection?.collection_type && collection.collection_type !== 'manual' && (
            <FormField label="Type">
              <div className="px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-body-sm text-text-secondary flex items-center gap-2">
                <span>{COLLECTION_TYPES.find(t => t.id === collection.collection_type)?.icon}</span>
                <span className="capitalize">{collection.collection_type}</span>
                <span className="text-caption text-text-muted ml-auto">(cannot be changed)</span>
              </div>
            </FormField>
          )}

          {showCriteriaBuilder && (
            <div className="border-t border-border-default pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-label text-text-primary">Rules</span>
                {previewLoading ? (
                  <span className="text-caption text-text-muted">Counting...</span>
                ) : previewCount !== null ? (
                  <span className="text-caption text-action-primary">
                    ~{previewCount} book{previewCount !== 1 ? 's' : ''} match
                  </span>
                ) : (
                  <span className="text-caption text-text-muted">Set rules to see matches</span>
                )}
              </div>

              <CriteriaBuilder 
                criteria={criteria}
                onChange={setCriteria}
              />
            </div>
          )}

          {criteriaReadOnly && (
            <div className="border-t border-border-default pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-label text-text-primary">Rules</span>
                <span className="text-caption text-text-muted">(cannot be changed)</span>
              </div>
              <div className="px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-body-sm text-text-secondary">
                {Object.entries(criteria).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-text-muted">{key}:</span> {JSON.stringify(value)}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {collection?.id && (
            <FormField label="Cover style">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleCoverTypeChange('gradient')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    coverType === 'gradient'
                      ? 'bg-action-primary/15 text-text-primary ring-1 ring-action-primary'
                      : 'bg-bg-elevated text-text-primary hover:bg-bg-surface'
                  }`}
                >
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-action-primary to-chip-fanfiction" />
                  <span className="text-sm">Gradient</span>
                </button>
                
                <label
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    coverType === 'custom'
                      ? 'bg-action-primary/15 text-text-primary ring-1 ring-action-primary'
                      : 'bg-bg-elevated text-text-primary hover:bg-bg-surface'
                  } ${uploadingCover ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="w-6 h-6 rounded bg-bg-surface flex items-center justify-center overflow-hidden">
                    {uploadingCover ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-action-primary" />
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
                    <span className="text-xs text-text-muted">✓ Set</span>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleCoverUpload}
                    className="hidden"
                    disabled={uploadingCover}
                  />
                </label>
                
                {coverType === 'custom' && (
                  <button
                    type="button"
                    onClick={handleDeleteCover}
                    className="w-full text-sm text-action-danger hover:opacity-90 py-1 text-left"
                  >
                    Remove custom cover
                  </button>
                )}
              </div>
            </FormField>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={saving || !name.trim()}
          >
            {saving ? 'Saving...' : (isEditing ? 'Save' : 'Create')}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}
