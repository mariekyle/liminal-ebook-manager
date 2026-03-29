import { useState, useRef, useEffect } from 'react'
import { listAuthors } from '../api'
import Button from './ui/Button'

function AuthorChips({ authors, onChange }) {
  const [newAuthor, setNewAuthor] = useState('')
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [allAuthors, setAllAuthors] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  useEffect(() => {
    listAuthors()
      .then(data => {
        setAllAuthors(data.authors.map(a => a.name))
      })
      .catch(err => console.error('Failed to load authors:', err))
  }, [])

  useEffect(() => {
    if (!newAuthor.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const query = newAuthor.toLowerCase()
    const authorsLower = authors.map(a => a.toLowerCase())
    const filtered = allAuthors
      .filter(author => 
        author.toLowerCase().includes(query) && 
        !authorsLower.includes(author.toLowerCase())
      )
      .slice(0, 8)

    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
    setSelectedSuggestionIndex(-1)
  }, [newAuthor, allAuthors, authors])

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddAuthor = (authorName = newAuthor) => {
    const trimmed = authorName.trim()
    const authorsLower = authors.map(a => a.toLowerCase())
    if (trimmed && !authorsLower.includes(trimmed.toLowerCase())) {
      onChange([...authors, trimmed])
      setNewAuthor('')
      setSuggestions([])
      setShowSuggestions(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        handleAddAuthor(suggestions[selectedSuggestionIndex])
      } else {
        handleAddAuthor()
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedSuggestionIndex(-1)
    }
  }

  const handleSuggestionClick = (author) => {
    handleAddAuthor(author)
  }

  const handleRemoveAuthor = (index) => {
    if (authors.length <= 1) return
    const updated = authors.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
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
      <div className="relative">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => newAuthor.trim() && suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Add author..."
            className="flex-1 bg-bg-elevated px-3 py-2 rounded-lg text-text-primary text-sm border border-border-default focus:border-action-primary focus:outline-none"
          />
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={() => handleAddAuthor()}
            disabled={!newAuthor.trim()}
          >
            + Add
          </Button>
        </div>

        {showSuggestions && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-12 mt-1 bg-bg-surface border border-border-default rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
          >
            {suggestions.map((author, index) => (
              <button
                key={author}
                type="button"
                onClick={() => handleSuggestionClick(author)}
                className={`
                  w-full text-left px-3 py-2 text-sm transition-colors
                  ${index === selectedSuggestionIndex 
                    ? 'bg-action-primary/15 text-action-primary' 
                    : 'text-text-secondary hover:bg-bg-elevated'
                  }
                `}
              >
                {author}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-caption text-text-muted">
        Drag to reorder. First author appears on cover.
      </p>

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
              bg-bg-elevated border cursor-grab active:cursor-grabbing
              transition-all duration-150
              ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
              ${dragOverIndex === index ? 'border-action-primary ring-1 ring-action-primary' : 'border-border-default'}
            `}
          >
            <svg 
              className="w-4 h-4 text-text-muted flex-shrink-0" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
            
            <span className="text-text-primary text-sm">{author}</span>
            
            {authors.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveAuthor(index)}
                className="text-text-muted hover:text-action-danger transition-colors ml-1"
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
    </div>
  )
}

export default AuthorChips
