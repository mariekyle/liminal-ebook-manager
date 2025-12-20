import { useState, useEffect } from 'react'
import { listTags } from '../api'

function TagsModal({ isOpen, onClose, selectedTags, onApply, category }) {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [localSelected, setLocalSelected] = useState(new Set(selectedTags))

  // Load tags when modal opens
  useEffect(() => {
    if (!isOpen) return
    
    setLoading(true)
    setLocalSelected(new Set(selectedTags))
    
    listTags({ category: category || undefined })
      .then(data => {
        setTags(data.tags)
      })
      .catch(err => {
        console.error('Failed to load tags:', err)
        setTags([])
      })
      .finally(() => setLoading(false))
  }, [isOpen, category, selectedTags])

  if (!isOpen) return null

  // Filter tags by search
  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  )

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-library-card rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Filter by Tags</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        {/* Search */}
        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            placeholder="Search tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-library-accent focus:outline-none"
          />
        </div>
        
        {/* Tag List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Loading tags...
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {search ? 'No matching tags' : 'No tags found'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTags.map(tag => (
                <button
                  key={tag.name}
                  onClick={() => toggleTag(tag.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    localSelected.has(tag.name)
                      ? 'bg-library-accent/20 text-white'
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    localSelected.has(tag.name)
                      ? 'bg-library-accent border-library-accent'
                      : 'border-gray-500'
                  }`}>
                    {localSelected.has(tag.name) && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                  
                  {/* Tag name */}
                  <span className="flex-1 text-left truncate">
                    {tag.name}
                  </span>
                  
                  {/* Count */}
                  <span className="text-gray-500 text-sm">
                    {tag.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-white text-sm"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="bg-library-accent text-white px-6 py-2 rounded-lg hover:opacity-90"
          >
            Apply{localSelected.size > 0 && ` (${localSelected.size})`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TagsModal




