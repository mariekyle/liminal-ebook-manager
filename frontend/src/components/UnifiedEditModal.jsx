import { useState, useEffect, useRef } from 'react'
import {
  autocompleteFandoms,
  autocompleteShips,
  autocompleteTags,
  listSeries
} from '../api'

// Predefined options
const PAIRING_TYPES = ['None', 'M/M', 'F/F', 'M/F', 'Multi', 'Gen', 'Other']
const COMPLETION_STATUSES = ['Complete', 'In Progress', 'Abandoned', 'Unknown']
const CONTENT_RATINGS = ['Not Rated', 'General', 'Teen', 'Mature', 'Explicit']
const WARNINGS_OPTIONS = ['None', 'Choose Not To Warn', 'Violence', 'Major Character Death']

// Tag input component
const TagInput = ({ tags, onChange, placeholder = "Add tag...", fetchSuggestions }) => {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const timeoutRef = useRef(null)

  const handleInputChange = (e) => {
    const val = e.target.value
    setInputValue(val)

    // Debounced search for suggestions
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (val.trim().length > 0 && fetchSuggestions) {
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await fetchSuggestions(val)
          // Filter out already-added tags
          const filtered = (result.items || []).filter(item => 
            !tags.includes(item.toLowerCase())
          )
          setSuggestions(filtered.slice(0, 5))
          setShowSuggestions(filtered.length > 0)
        } catch (err) {
          console.error('Tag autocomplete error:', err)
        }
      }, 200)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const addTag = (tagValue = inputValue) => {
    const tag = tagValue.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag])
    }
    setInputValue('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const removeTag = (tagToRemove) => {
    onChange(tags.filter(t => t !== tagToRemove))
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 bg-[#1a1f2e] border border-white/15 rounded-lg min-h-[44px]">
        {tags.map(tag => (
          <span 
            key={tag} 
            className="inline-flex items-center gap-1 px-2 py-1 bg-teal-500/20 text-teal-400 rounded-full text-xs font-medium"
          >
            {tag}
            <button 
              type="button"
              onClick={() => removeTag(tag)} 
              className="opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag()
            }
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => {
            setTimeout(() => {
              if (inputValue.trim()) addTag()
              setShowSuggestions(false)
            }, 200)
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] bg-transparent border-none text-white text-sm outline-none placeholder-gray-500"
        />
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((item, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => addTag(item)}
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

// Searchable input with autocomplete (for single-value fields like Fandom)
const SearchableInput = ({ value, onChange, placeholder, fetchSuggestions }) => {
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const timeoutRef = useRef(null)

  const handleInputChange = (e) => {
    const val = e.target.value
    onChange(val)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (val.trim().length > 0 && fetchSuggestions) {
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await fetchSuggestions(val)
          setSuggestions(result.items || [])
          setShowSuggestions((result.items || []).length > 0)
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
    onChange(item)
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className="w-full p-3 bg-[#1a1f2e] border border-white/15 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
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

// Series input with autocomplete
const SeriesInput = ({ value, onChange, allSeries }) => {
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleInputChange = (e) => {
    const val = e.target.value
    onChange(val)

    if (val.trim().length > 0) {
      const filtered = allSeries.filter(s =>
        s.toLowerCase().includes(val.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 8))
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (value && suggestions.length > 0) {
            setShowSuggestions(true)
          }
        }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="None"
        className="w-full p-3 bg-[#1a1f2e] border border-white/15 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => {
                onChange(s)
                setShowSuggestions(false)
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function UnifiedEditModal({ isOpen, onClose, book, onSave, isWishlist }) {
  const modalRef = useRef(null)
  
  // Determine tabs based on category and wishlist status
  const isFanFiction = book?.category === 'FanFiction'
  const showMetadataTab = isFanFiction && !isWishlist
  const tabs = showMetadataTab 
    ? ['Details', 'About', 'Metadata'] 
    : ['Details', 'About']
  
  const [activeTab, setActiveTab] = useState('Details')
  const [allSeries, setAllSeries] = useState([])
  const [saving, setSaving] = useState(false)
  
  // Form data state
  const [formData, setFormData] = useState({
    // Details
    title: '',
    authors: '',
    series: '',
    series_number: '',
    category: 'Uncategorized',
    publication_year: '',
    source_url: '',
    
    // About
    summary: '',
    tags: [],
    ao3_category: 'None',
    
    // Metadata (FanFiction only)
    completion_status: 'Unknown',
    fandom: '',
    ships: '',
    content_rating: 'Not Rated',
    warnings: 'None',
  })
  
  // Initialize form when book changes or modal opens
  useEffect(() => {
    if (book && isOpen) {
      setFormData({
        // Details
        title: book.title || '',
        authors: Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || ''),
        series: book.series || '',
        series_number: book.series_number || '',
        category: book.category || 'Uncategorized',
        publication_year: book.publication_year?.toString() || '',
        source_url: book.source_url || '',
        
        // About
        summary: book.summary || '',
        tags: Array.isArray(book.tags) ? book.tags : [],
        ao3_category: Array.isArray(book.ao3_category) && book.ao3_category.length > 0 ? book.ao3_category[0] : 'None',
        
        // Metadata (FanFiction only)
        completion_status: book.completion_status || 'Unknown',
        fandom: book.fandom || '',
        ships: Array.isArray(book.relationships) ? book.relationships.join(', ') : (book.ships || ''),
        content_rating: book.content_rating || 'Not Rated',
        warnings: Array.isArray(book.ao3_warnings) && book.ao3_warnings.length > 0 ? book.ao3_warnings[0] : 'None',
      })
      setActiveTab('Details')
    }
  }, [book, isOpen])
  
  // Load all series for autocomplete
  useEffect(() => {
    listSeries({ limit: 10000 })
      .then(data => {
        const names = data.series.map(s => s.name)
        setAllSeries(names)
      })
      .catch(err => console.error('Failed to load series:', err))
  }, [])
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const handleSave = async () => {
    setSaving(true)
    
    try {
      // Parse authors from comma-separated string to array
      const authorsArray = formData.authors
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0)
      
      // Build updates object with all visible/editable fields
      const updates = {
        title: formData.title,
        authors: authorsArray,
        series: formData.series || null,
        series_number: formData.series_number || null,
        category: formData.category,
        publication_year: formData.publication_year ? parseInt(formData.publication_year) : null,
        source_url: formData.source_url || null,
        summary: formData.summary || null,
        tags: formData.tags,
      }
      
      // Add ao3_category only for Fiction/FanFiction
      if (formData.category === 'Fiction' || formData.category === 'FanFiction') {
        updates.ao3_category = formData.ao3_category !== 'None' ? [formData.ao3_category] : []
      }
      
      // Add metadata fields only for FanFiction library books
      if (formData.category === 'FanFiction' && !isWishlist) {
        updates.completion_status = formData.completion_status
        updates.fandom = formData.fandom || null
        // Parse ships from comma-separated string to array
        updates.relationships = formData.ships
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0)
        updates.content_rating = formData.content_rating
        // Store warnings as array for backwards compatibility
        updates.ao3_warnings = formData.warnings !== 'None' ? [formData.warnings] : []
      }
      
      await onSave(updates)
      onClose()
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }
  
  if (!isOpen || !book) return null
  
  // Determine if pairing type should show (Fiction or FanFiction)
  const showPairingType = formData.category === 'Fiction' || formData.category === 'FanFiction'
  
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      
      {/* Modal - bottom sheet style */}
      <div className="fixed inset-0 z-50 flex items-end pointer-events-none">
        <div 
          ref={modalRef}
          className="w-full max-h-[90%] bg-[#242b3d] rounded-t-[20px] flex flex-col pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <span className="font-semibold text-white">Edit</span>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="text-teal-400 font-medium hover:text-teal-300 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          
          {/* Segmented Control Tabs */}
          <div className="p-3 border-b border-white/10">
            <div className="flex bg-[#1a1f2e] rounded-lg p-0.5">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all
                    ${activeTab === tab 
                      ? 'bg-[#2d3548] text-white shadow' 
                      : 'text-gray-400 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          {/* Tab Content (scrollable) */}
          <div className="flex-1 overflow-y-auto p-4">
            
            {/* Details Tab */}
            {activeTab === 'Details' && (
              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full p-3 bg-[#1a1f2e] border border-white/15 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                
                {/* Author(s) */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Author(s)</label>
                  <input
                    type="text"
                    value={formData.authors}
                    onChange={(e) => handleInputChange('authors', e.target.value)}
                    placeholder="Separate multiple authors with commas"
                    className="w-full p-3 bg-[#1a1f2e] border border-white/15 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                
                {/* Series + Number row */}
                <div className="grid grid-cols-[2fr_1fr] gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Series</label>
                    <SeriesInput
                      value={formData.series}
                      onChange={(val) => handleInputChange('series', val)}
                      allSeries={allSeries}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Number</label>
                    <input
                      type="text"
                      value={formData.series_number}
                      onChange={(e) => handleInputChange('series_number', e.target.value)}
                      placeholder="#"
                      className="w-full p-3 bg-[#1a1f2e] border border-white/15 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full p-3 bg-[#1a1f2e] border border-white/15 rounded-lg text-white focus:border-teal-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Uncategorized">Uncategorized</option>
                    <option value="Fiction">Fiction</option>
                    <option value="Non-Fiction">Non-Fiction</option>
                    <option value="FanFiction">FanFiction</option>
                  </select>
                </div>
                
                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Year</label>
                  <input
                    type="text"
                    value={formData.publication_year}
                    onChange={(e) => handleInputChange('publication_year', e.target.value)}
                    placeholder="YYYY"
                    className="w-full p-3 bg-[#1a1f2e] border border-white/15 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                
                {/* Source URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Source URL</label>
                  <input
                    type="url"
                    value={formData.source_url}
                    onChange={(e) => handleInputChange('source_url', e.target.value)}
                    placeholder="https://..."
                    className="w-full p-3 bg-[#1a1f2e] border border-white/15 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
            
            {/* About Tab */}
            {activeTab === 'About' && (
              <div className="space-y-5">
                {/* Summary */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {isWishlist ? 'Why this one?' : 'Summary'}
                  </label>
                  <textarea
                    value={formData.summary}
                    onChange={(e) => handleInputChange('summary', e.target.value)}
                    rows={5}
                    placeholder={isWishlist ? "Why do you want to read this?" : "Book summary or description..."}
                    className="w-full p-3 bg-[#1a1f2e] border border-white/15 rounded-lg text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none resize-none"
                  />
                </div>
                
                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
                  <TagInput
                    tags={formData.tags}
                    onChange={(tags) => handleInputChange('tags', tags)}
                    placeholder="Add tag..."
                    fetchSuggestions={autocompleteTags}
                  />
                </div>
                
                {/* Pairing Type - only for Fiction/FanFiction */}
                {showPairingType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Pairing Type</label>
                    <select
                      value={formData.ao3_category}
                      onChange={(e) => handleInputChange('ao3_category', e.target.value)}
                      className="w-full p-3 bg-[#1a1f2e] border border-white/15 rounded-lg text-white focus:border-teal-500 focus:outline-none cursor-pointer"
                    >
                      {PAIRING_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
            
            {/* Metadata Tab (FanFiction library books only) */}
            {activeTab === 'Metadata' && showMetadataTab && (
              <div className="space-y-5">
                {/* Completion Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Completion Status</label>
                  <select
                    value={formData.completion_status}
                    onChange={(e) => handleInputChange('completion_status', e.target.value)}
                    className="w-full p-3 bg-[#1a1f2e] border border-white/15 rounded-lg text-white focus:border-teal-500 focus:outline-none cursor-pointer"
                  >
                    {COMPLETION_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                
                {/* Fandom */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Fandom</label>
                  <SearchableInput
                    value={formData.fandom}
                    onChange={(val) => handleInputChange('fandom', val)}
                    placeholder="e.g., Harry Potter"
                    fetchSuggestions={autocompleteFandoms}
                  />
                </div>
                
                {/* Ships */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Ships</label>
                  <SearchableInput
                    value={formData.ships}
                    onChange={(val) => handleInputChange('ships', val)}
                    placeholder="e.g., Hermione Granger/Draco Malfoy"
                    fetchSuggestions={autocompleteShips}
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple ships with commas</p>
                </div>
                
                {/* Content Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Content Rating</label>
                  <select
                    value={formData.content_rating}
                    onChange={(e) => handleInputChange('content_rating', e.target.value)}
                    className="w-full p-3 bg-[#1a1f2e] border border-white/15 rounded-lg text-white focus:border-teal-500 focus:outline-none cursor-pointer"
                  >
                    {CONTENT_RATINGS.map(rating => (
                      <option key={rating} value={rating}>{rating}</option>
                    ))}
                  </select>
                </div>
                
                {/* Warnings */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Warnings</label>
                  <select
                    value={formData.warnings}
                    onChange={(e) => handleInputChange('warnings', e.target.value)}
                    className="w-full p-3 bg-[#1a1f2e] border border-white/15 rounded-lg text-white focus:border-teal-500 focus:outline-none cursor-pointer"
                  >
                    {WARNINGS_OPTIONS.map(warning => (
                      <option key={warning} value={warning}>{warning}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </>
  )
}
