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
import Modal from './ui/Modal'
import Button from './ui/Button'
import FormField from './ui/FormField'

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
    <Modal isOpen onClose={onClose} size="md" fullscreenOnMobile>
      <Modal.Header onClose={onClose}>Duplicate Collection</Modal.Header>

      <form id="duplicate-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <Modal.Body className="space-y-4">
          <FormField label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Collection name"
              className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-action-primary"
              autoFocus
            />
          </FormField>

          {/* Collection Type Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">Collection Type</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<InfoIcon />}
                onClick={() => setShowTypeInfo(!showTypeInfo)}
              >
                {showTypeInfo ? 'Hide' : 'Info'}
              </Button>
            </div>

            {/* Type info tooltip */}
            {showTypeInfo && (
              <div className="mb-3 p-3 bg-bg-elevated border border-border-default rounded-lg space-y-2 text-sm">
                {COLLECTION_TYPES.map(type => (
                  <div key={type.id}>
                    <span className="font-medium text-text-primary">{type.icon} {type.name}:</span>
                    <span className="text-text-secondary ml-1">{type.description}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Type selector buttons */}
            <div className="grid grid-cols-3 gap-2">
              {COLLECTION_TYPES.map(type => (
                // design-lint-button-chrome: chrome — collection type selector
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

            {/* Copy info */}
            <p className="mt-2 text-xs text-text-muted">
              {getCopyInfo()}
            </p>
          </div>

          {/* Criteria Builder (for automatic type) */}
          {showCriteriaBuilder && (
            <div className="border-t border-border-default pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-text-primary">Rules</span>
                {previewLoading ? (
                  <span className="text-xs text-text-muted">Counting...</span>
                ) : previewCount !== null ? (
                  <span className="text-xs text-action-primary">
                    ~{previewCount} book{previewCount !== 1 ? 's' : ''} match
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">Set rules to see matches</span>
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
            <p className="text-action-danger text-sm">{error}</p>
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
            {saving ? 'Creating...' : 'Duplicate'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}
