/**
 * CollectionModal - Create or edit a collection
 */

import { useState } from 'react'
import { createCollection, updateCollection } from '../api'

// X icon for close button
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export default function CollectionModal({ collection = null, onClose, onSuccess }) {
  const isEditing = !!collection
  
  const [name, setName] = useState(collection?.name || '')
  const [description, setDescription] = useState(collection?.description || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  
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
        await createCollection(data)
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

