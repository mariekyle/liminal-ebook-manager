import { useState, useEffect, useRef } from 'react'
import { 
  autocompleteFandoms, 
  autocompleteCharacters, 
  autocompleteShips, 
  autocompleteTags 
} from '../api'

// Predefined options
const CONTENT_RATINGS = ['General', 'Teen', 'Mature', 'Explicit', 'Not Rated']
const AO3_WARNINGS = [
  'No Archive Warnings Apply',
  'Graphic Depictions Of Violence', 
  'Major Character Death',
  'Rape/Non-Con',
  'Underage',
  'Creator Chose Not To Use Archive Warnings'
]
const PAIRING_TYPES = ['F/F', 'F/M', 'Gen', 'M/M', 'Multi', 'Other']
const COMPLETION_STATUSES = ['Complete', 'WIP', 'Abandoned', 'Hiatus']

// Searchable input with autocomplete
function SearchableInput({ label, value, onChange, placeholder, fetchSuggestions }) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = (e) => {
    const val = e.target.value
    setInputValue(val)
    onChange(val)

    // Debounced search
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (val.trim().length > 0 && fetchSuggestions) {
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await fetchSuggestions(val)
          setSuggestions(result.items || [])
          setShowSuggestions(result.items?.length > 0)
        } catch (err) {
          console.error('Autocomplete error:', err)
        }
      }, 200)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSelect = (item) => {
    setInputValue(item)
    onChange(item)
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className="w-full bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none"
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((item, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => handleSelect(item)}
              className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Searchable chip editor with input ABOVE chips
function SearchableChipEditor({ label, items, onChange, placeholder, fetchSuggestions }) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const timeoutRef = useRef(null)

  const handleInputChange = (e) => {
    const val = e.target.value
    setInputValue(val)

    // Debounced search
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (val.trim().length > 0 && fetchSuggestions) {
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await fetchSuggestions(val)
          // Filter out already-added items
          const filtered = (result.items || []).filter(item => !items.includes(item))
          setSuggestions(filtered)
          setShowSuggestions(filtered.length > 0)
        } catch (err) {
          console.error('Autocomplete error:', err)
        }
      }, 200)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleAdd = (value = inputValue) => {
    const trimmed = value.trim()
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed])
      setInputValue('')
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleRemove = (index) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      
      {/* Input and Add button ABOVE chips */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className="flex-1 bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => handleAdd()}
            disabled={!inputValue.trim()}
            className="px-4 py-2 bg-library-accent hover:opacity-90 disabled:bg-gray-600 disabled:opacity-50 rounded text-sm font-medium text-white"
          >
            Add
          </button>
        </div>
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((item, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => handleAdd(item)}
                className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Chips BELOW input */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {items.map((item, i) => (
            <span 
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 rounded-lg text-sm text-gray-200"
            >
              {item}
              <button 
                type="button"
                onClick={() => handleRemove(i)}
                className="text-gray-400 hover:text-white ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Multi-select for predefined options
function MultiSelect({ label, options, selected, onChange }) {
  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => toggleOption(option)}
            className={`px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
              selected.includes(option)
                ? 'bg-library-accent text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function EnhancedMetadataModal({ book, onClose, onSave }) {
  const modalRef = useRef(null)
  
  // Initialize state from book data
  const [summary, setSummary] = useState(book.summary || '')
  const [fandom, setFandom] = useState(book.fandom || '')
  const [relationships, setRelationships] = useState(
    Array.isArray(book.relationships) ? book.relationships : []
  )
  const [characters, setCharacters] = useState(
    Array.isArray(book.characters) ? book.characters : []
  )
  const [contentRating, setContentRating] = useState(book.content_rating || '')
  const [warnings, setWarnings] = useState(
    Array.isArray(book.ao3_warnings) ? book.ao3_warnings : []
  )
  const [pairingTypes, setPairingTypes] = useState(
    Array.isArray(book.ao3_category) ? book.ao3_category : []
  )
  const [tags, setTags] = useState(
    Array.isArray(book.tags) ? book.tags : []
  )
  const [sourceUrl, setSourceUrl] = useState(book.source_url || '')
  const [completionStatus, setCompletionStatus] = useState(book.completion_status || '')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      await onSave({
        summary: summary.trim() || null,  // Ensure empty string becomes null
        fandom: fandom.trim() || null,
        relationships,
        characters,
        content_rating: contentRating || null,
        ao3_warnings: warnings,
        ao3_category: pairingTypes,
        tags,
        source_url: sourceUrl.trim() || null,
        completion_status: completionStatus || null
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Close on Escape key only (NOT on backdrop click)
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <>
      {/* Backdrop - NO click handler */}
      <div className="fixed inset-0 bg-black/60 z-40" aria-hidden="true" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="bg-library-bg border border-gray-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Edit about"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Edit About</h2>
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

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Summary - Always show */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Summary</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Book summary or description..."
                rows={4}
                className="w-full bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none resize-none"
              />
            </div>

            {/* Fandom - FanFiction only */}
            {book.category === 'FanFiction' && (
              <SearchableInput
                label="Fandom"
                value={fandom}
                onChange={setFandom}
                placeholder="e.g., Harry Potter"
                fetchSuggestions={autocompleteFandoms}
              />
            )}

            {/* Content Rating - FanFiction or Fiction */}
            {(book.category === 'FanFiction' || book.category === 'Fiction') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Content Rating</label>
                <select
                  value={contentRating}
                  onChange={(e) => setContentRating(e.target.value)}
                  className="w-full bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none cursor-pointer"
                >
                  <option value="">Select rating...</option>
                  {CONTENT_RATINGS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Pairing Types - FanFiction or Fiction */}
            {(book.category === 'FanFiction' || book.category === 'Fiction') && (
              <MultiSelect
                label="Pairing Type"
                options={PAIRING_TYPES}
                selected={pairingTypes}
                onChange={setPairingTypes}
              />
            )}

            {/* Completion Status - FanFiction only */}
            {book.category === 'FanFiction' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Completion Status</label>
                <select
                  value={completionStatus}
                  onChange={(e) => setCompletionStatus(e.target.value)}
                  className="w-full bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none cursor-pointer"
                >
                  <option value="">Select status...</option>
                  {COMPLETION_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Ships/Relationships - FanFiction only */}
            {book.category === 'FanFiction' && (
              <SearchableChipEditor
                label="Ships / Relationships"
                items={relationships}
                onChange={setRelationships}
                placeholder="e.g., Hermione Granger/Draco Malfoy"
                fetchSuggestions={autocompleteShips}
              />
            )}

            {/* Characters - FanFiction only */}
            {book.category === 'FanFiction' && (
              <SearchableChipEditor
                label="Characters"
                items={characters}
                onChange={setCharacters}
                placeholder="e.g., Hermione Granger"
                fetchSuggestions={autocompleteCharacters}
              />
            )}

            {/* Archive Warnings - FanFiction only */}
            {book.category === 'FanFiction' && (
              <MultiSelect
                label="Archive Warnings"
                options={AO3_WARNINGS}
                selected={warnings}
                onChange={setWarnings}
              />
            )}

            {/* Tags - Always show */}
            <SearchableChipEditor
              label="Tags"
              items={tags}
              onChange={setTags}
              placeholder="e.g., slow-burn"
              fetchSuggestions={autocompleteTags}
            />

            {/* Source URL - Always show */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Source URL</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://archiveofourown.org/works/..."
                className="w-full bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`
                px-4 py-2 rounded font-medium text-white transition-opacity
                ${saving ? 'bg-gray-600 cursor-not-allowed' : 'bg-library-accent hover:opacity-90'}
              `}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
