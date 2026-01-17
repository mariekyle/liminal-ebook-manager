/**
 * TagsMultiSelect.jsx
 * 
 * Phase 9E Day 2: Searchable tag selector for automatic collection criteria
 * 
 * Features:
 * - Fetches available tags from /api/tags via listTags()
 * - Search/filter tags by typing
 * - Selected tags shown as removable chips
 * - Click tag to add, click chip X to remove
 * 
 * Location: frontend/src/components/TagsMultiSelect.jsx
 */

import { useState, useEffect, useRef } from 'react'
import { listTags } from '../api'

export default function TagsMultiSelect({ selectedTags = [], onChange }) {
  const [allTags, setAllTags] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Fetch all available tags on mount
  useEffect(() => {
    async function fetchTags() {
      setLoading(true)
      try {
        // Use the API function from api.js
        const data = await listTags()
        
        // listTags returns array of { name, count } objects
        // Extract just the tag names and sort alphabetically
        let tagNames = []
        if (Array.isArray(data)) {
          tagNames = data.map(t => typeof t === 'string' ? t : (t.name || t.tag || '')).filter(Boolean)
        } else if (data?.tags) {
          // Some endpoints return { tags: [...] }
          tagNames = data.tags.map(t => typeof t === 'string' ? t : (t.name || t.tag || '')).filter(Boolean)
        }
        
        setAllTags(tagNames.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })))
      } catch (err) {
        console.error('Failed to fetch tags:', err)
        setAllTags([])
      } finally {
        setLoading(false)
      }
    }
    fetchTags()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter tags by search query, excluding already selected
  const filteredTags = allTags.filter(tag => 
    !selectedTags.includes(tag) &&
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddTag = (tag) => {
    if (!selectedTags.includes(tag)) {
      onChange([...selectedTags, tag])
    }
    setSearchQuery('')
    inputRef.current?.focus()
  }

  const handleRemoveTag = (tagToRemove) => {
    onChange(selectedTags.filter(t => t !== tagToRemove))
  }

  const handleKeyDown = (e) => {
    // Remove last tag on backspace if search is empty
    if (e.key === 'Backspace' && searchQuery === '' && selectedTags.length > 0) {
      handleRemoveTag(selectedTags[selectedTags.length - 1])
    }
    // Add first filtered tag on Enter
    if (e.key === 'Enter' && filteredTags.length > 0) {
      e.preventDefault()
      handleAddTag(filteredTags[0])
    }
    // Close on Escape
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Input area with chips */}
      <div 
        className={`min-h-[42px] px-2 py-1.5 bg-gray-700 border rounded-lg flex flex-wrap items-center gap-1.5 cursor-text transition-colors ${
          isOpen ? 'border-library-accent ring-1 ring-library-accent' : 'border-gray-600'
        }`}
        onClick={() => {
          setIsOpen(true)
          inputRef.current?.focus()
        }}
      >
        {/* Selected tag chips */}
        {selectedTags.map(tag => (
          <span 
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-library-accent/30 text-library-accent text-sm rounded-md"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveTag(tag)
              }}
              className="hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        
        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? 'Search tags...' : ''}
          className="flex-1 min-w-[80px] bg-transparent text-gray-100 placeholder-gray-500 text-sm focus:outline-none"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading tags...</div>
          ) : filteredTags.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchQuery 
                ? 'No matching tags' 
                : allTags.length === 0 
                  ? 'No tags in library' 
                  : 'All tags selected'}
            </div>
          ) : (
            <div className="py-1">
              {filteredTags.slice(0, 30).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  {tag}
                </button>
              ))}
              {filteredTags.length > 30 && (
                <div className="px-3 py-1.5 text-xs text-gray-500 border-t border-gray-700">
                  +{filteredTags.length - 30} more (keep typing to filter)
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
