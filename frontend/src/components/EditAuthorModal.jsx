import { useState, useEffect, useRef } from 'react'
import { updateAuthor } from '../api'

function EditAuthorModal({ author, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const modalRef = useRef(null)

  // Initialize form when author changes or modal opens
  useEffect(() => {
    if (author && isOpen) {
      setFormData({
        name: author.name || '',
        notes: author.notes || ''
      })
      setError(null)
    }
  }, [author, isOpen])

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Handle escape key
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const trimmedName = formData.name.trim()
    
    if (!trimmedName) {
      setError('Author name cannot be empty')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const result = await updateAuthor(author.name, {
        newName: trimmedName !== author.name ? trimmedName : null,
        notes: formData.notes
      })
      
      onSave(result)
      onClose()
    } catch (err) {
      console.error('Failed to update author:', err)
      setError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const isRenaming = formData.name.trim() !== author?.name

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-40"
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="bg-library-bg border border-gray-700 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Edit author"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Edit Author</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}

            {/* Author Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Author Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none"
                required
              />
              {isRenaming && (
                <p className="text-yellow-400 text-xs mt-1.5">
                  ⚠️ Renaming will update all books by this author
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add notes about this author..."
                className="w-full h-32 bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none resize-y text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`
                  px-4 py-2 rounded font-medium
                  ${saving 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-library-accent hover:opacity-90'
                  }
                  text-white transition-opacity
                `}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default EditAuthorModal

