/**
 * CollectionModal - Create or edit a collection
 */

import { useState } from 'react'
import { createCollection, updateCollection, updateCollectionCoverType, uploadCollectionCover, deleteCollectionCover } from '../api'

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

export default function CollectionModal({ collection = null, onClose, onSuccess }) {
  const isEditing = !!collection
  
  const [name, setName] = useState(collection?.name || '')
  const [description, setDescription] = useState(collection?.description || '')
  const [coverType, setCoverType] = useState(collection?.cover_type || 'gradient')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  
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
        description: description.trim() || null
      }
      
      if (isEditing) {
        await updateCollection(collection.id, data)
      } else {
        await createCollection({ ...data, cover_type: coverType })
      }
      
      onSuccess()
    } catch (err) {
      console.error('Failed to save collection:', err)
      setError('Failed to save collection')
    } finally {
      setSaving(false)
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
      <div className="relative w-full max-w-md bg-library-card rounded-xl shadow-xl">
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
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                  <div className="w-6 h-6 rounded bg-gray-600 flex items-center justify-center">
                    {uploadingCover ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                    ) : (
                      <CameraIcon />
                    )}
                  </div>
                  <span className="text-sm flex-1">Custom image</span>
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
          
          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 px-4 py-2 bg-library-accent hover:opacity-90 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg font-medium transition-opacity"
            >
              {saving ? 'Saving...' : (isEditing ? 'Save' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

