import { useState, useEffect } from 'react'
import { listTags } from '../api'
import Modal from './ui/Modal'
import Button from './ui/Button'
import SearchInput from './ui/SearchInput'
import { sortTagRecordsByRelevance } from '../utils/searchSort'

function TagsModal({ isOpen, onClose, selectedTags, onApply, category }) {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [localSelected, setLocalSelected] = useState(new Set(selectedTags))

  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    setLocalSelected(new Set(selectedTags))

    listTags({ category: category || undefined })
      .then((data) => {
        setTags(data.tags)
      })
      .catch((err) => {
        console.error('Failed to load tags:', err)
        setTags([])
      })
      .finally(() => setLoading(false))
  }, [isOpen, category, selectedTags])

  const filtered = tags.filter((tag) => tag.name.toLowerCase().includes(search.toLowerCase()))
  const displayTags = sortTagRecordsByRelevance(filtered, search)

  const toggleTag = (tagName) => {
    const newSelected = new Set(localSelected)
    if (newSelected.has(tagName)) {
      newSelected.delete(tagName)
    } else {
      newSelected.add(tagName)
    }
    setLocalSelected(newSelected)
  }

  const handleApply = () => {
    onApply(Array.from(localSelected))
    onClose()
  }

  const handleClear = () => {
    setLocalSelected(new Set())
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Header onClose={onClose}>Filter by Tags</Modal.Header>
      <Modal.Body className="flex flex-col min-h-0 gap-0 p-0">
        <div className="px-5 pt-2 pb-4 border-b border-border-default flex-shrink-0">
          <SearchInput value={search} onChange={setSearch} placeholder="Search tags..." autoFocus />
        </div>
        <div className="flex-1 overflow-y-auto p-2 min-h-[200px] max-h-[50vh]">
          {loading ? (
            <div className="text-center py-8 text-text-secondary text-body-sm">Loading tags...</div>
          ) : displayTags.length === 0 ? (
            <div className="text-center py-8 text-text-secondary text-body-sm">
              {search ? 'No matching tags' : 'No tags found'}
            </div>
          ) : (
            <div className="space-y-1">
              {displayTags.map((tag) => (
                <button
                  key={tag.name}
                  type="button"
                  onClick={() => toggleTag(tag.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ease-out min-h-[44px] ${
                    localSelected.has(tag.name)
                      ? 'bg-action-primary/15 text-text-primary'
                      : 'hover:bg-bg-elevated text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      localSelected.has(tag.name)
                        ? 'bg-action-primary border-action-primary'
                        : 'border-border-default'
                    }`}
                  >
                    {localSelected.has(tag.name) && (
                      <span className="text-text-primary text-caption">✓</span>
                    )}
                  </div>
                  <span className="flex-1 text-left truncate text-body-sm">{tag.name}</span>
                  <span className="text-caption text-text-muted">{tag.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="ghost" onClick={handleClear}>
          Clear All
        </Button>
        <Button type="button" variant="primary" onClick={handleApply}>
          Apply{localSelected.size > 0 && ` (${localSelected.size})`}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default TagsModal
