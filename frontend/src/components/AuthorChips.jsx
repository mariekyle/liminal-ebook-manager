import { useState, useRef } from 'react'

function AuthorChips({ authors, onChange }) {
  const [newAuthor, setNewAuthor] = useState('')
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const inputRef = useRef(null)

  const handleAddAuthor = () => {
    const trimmed = newAuthor.trim()
    if (trimmed && !authors.includes(trimmed)) {
      onChange([...authors, trimmed])
      setNewAuthor('')
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddAuthor()
    }
  }

  const handleRemoveAuthor = (index) => {
    // Don't allow removing the last author
    if (authors.length <= 1) return
    const updated = authors.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    // Required for Firefox
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const updated = [...authors]
    const [dragged] = updated.splice(draggedIndex, 1)
    updated.splice(dropIndex, 0, dragged)
    
    onChange(updated)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-3">
      {/* Author chips */}
      <div className="flex flex-wrap gap-2">
        {authors.map((author, index) => (
          <div
            key={`${author}-${index}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg
              bg-library-card border cursor-grab active:cursor-grabbing
              transition-all duration-150
              ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
              ${dragOverIndex === index ? 'border-library-accent ring-1 ring-library-accent' : 'border-gray-600'}
            `}
          >
            {/* Drag handle */}
            <svg 
              className="w-4 h-4 text-gray-500 flex-shrink-0" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
            
            <span className="text-white text-sm">{author}</span>
            
            {/* Remove button - only show if more than 1 author */}
            {authors.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveAuthor(index)}
                className="text-gray-400 hover:text-red-400 transition-colors ml-1"
                aria-label={`Remove ${author}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add author input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newAuthor}
          onChange={(e) => setNewAuthor(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add author..."
          className="flex-1 bg-library-card px-3 py-2 rounded text-white text-sm border border-gray-600 focus:border-library-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAddAuthor}
          disabled={!newAuthor.trim()}
          className="px-3 py-2 bg-library-accent text-white text-sm rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          + Add
        </button>
      </div>

      {/* Helper text */}
      <p className="text-gray-500 text-xs">
        Drag to reorder. First author appears on cover.
      </p>
    </div>
  )
}

export default AuthorChips

