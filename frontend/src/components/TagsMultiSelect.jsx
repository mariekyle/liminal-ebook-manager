/**
 * TagsMultiSelect — Searchable tag selector for collection criteria
 */

import { useState, useEffect, useRef } from 'react'
import { listTags } from '../api'
import { sortStringsByRelevance } from '../utils/searchSort'

export default function TagsMultiSelect({ selectedTags = [], onChange }) {
  const [allTags, setAllTags] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    async function fetchTags() {
      setLoading(true)
      try {
        const data = await listTags()
        let tagNames = []
        if (Array.isArray(data)) {
          tagNames = data.map((t) => (typeof t === 'string' ? t : t.name || t.tag || '')).filter(Boolean)
        } else if (data?.tags) {
          tagNames = data.tags.map((t) => (typeof t === 'string' ? t : t.name || t.tag || '')).filter(Boolean)
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

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = allTags.filter(
    (tag) => !selectedTags.includes(tag) && tag.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const displayTags = sortStringsByRelevance(filtered, searchQuery)

  const handleAddTag = (tag) => {
    if (!selectedTags.includes(tag)) {
      onChange([...selectedTags, tag])
    }
    setSearchQuery('')
    inputRef.current?.focus()
  }

  const handleRemoveTag = (tagToRemove) => {
    onChange(selectedTags.filter((t) => t !== tagToRemove))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && searchQuery === '' && selectedTags.length > 0) {
      handleRemoveTag(selectedTags[selectedTags.length - 1])
    }
    if (e.key === 'Enter' && displayTags.length > 0) {
      e.preventDefault()
      handleAddTag(displayTags[0])
    }
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`min-h-[42px] px-2 py-1.5 bg-bg-elevated border rounded-lg flex flex-wrap items-center gap-1.5 cursor-text transition-all duration-200 ease-out ${
          isOpen ? 'border-action-primary ring-1 ring-action-primary/30' : 'border-border-default'
        }`}
        onClick={() => {
          setIsOpen(true)
          inputRef.current?.focus()
        }}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-chip-default/25 text-text-secondary text-body-sm rounded-md border border-border-subtle"
          >
            {tag}
            {/* design-lint-button-chrome: chrome — chip remove (IconButton-shaped, post-sprint candidate) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveTag(tag)
              }}
              className="hover:text-text-primary transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
              aria-label={`Remove ${tag}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}

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
          className="flex-1 min-w-[80px] bg-transparent text-text-primary placeholder:text-text-muted text-body-sm focus:outline-none"
        />
      </div>

      {isOpen && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-bg-elevated border border-border-default rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-body-sm text-text-muted">Loading tags...</div>
          ) : displayTags.length === 0 ? (
            <div className="px-3 py-2 text-body-sm text-text-muted">
              {searchQuery
                ? 'No matching tags'
                : allTags.length === 0
                  ? 'No tags in library'
                  : 'All tags selected'}
            </div>
          ) : (
            <div className="py-1">
              {displayTags.slice(0, 30).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  role="option"
                  onClick={() => handleAddTag(tag)}
                  className="w-full px-3 py-1.5 text-left text-body-sm text-text-secondary hover:bg-bg-surface hover:text-text-primary transition-all duration-200 ease-out min-h-[40px]"
                >
                  {tag}
                </button>
              ))}
              {displayTags.length > 30 && (
                <div className="px-3 py-1.5 text-caption text-text-muted border-t border-border-subtle">
                  +{displayTags.length - 30} more (keep typing to filter)
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
