/**
 * WishlistForm.jsx
 * 
 * Form for adding stories to the Wishlist
 * Features: Multi-author chips, autocomplete for title/author/series
 */

import { useState, useEffect, useRef } from 'react'
import { listBooks, listAuthors, listSeries } from '../../api'

export default function WishlistForm({ onSubmit, onCancel, isSubmitting }) {
  const [form, setForm] = useState({
    title: '',
    authors: [],
    series: '',
    seriesNumber: '',
    category: 'FanFiction',
    priority: 'normal',
    reason: '',
    completionStatus: '',
    sourceUrl: '',
  })
  
  const [errors, setErrors] = useState({})
  
  // Author input (separate from form.authors array)
  const [authorInput, setAuthorInput] = useState('')
  
  // Autocomplete states
  const [titleSuggestions, setTitleSuggestions] = useState([])
  const [authorSuggestions, setAuthorSuggestions] = useState([])
  const [seriesSuggestions, setSeriesSuggestions] = useState([])
  const [showTitleDropdown, setShowTitleDropdown] = useState(false)
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false)
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false)
  
  // Familiar title warning
  const [familiarTitle, setFamiliarTitle] = useState(null)
  
  // Refs for managing focus
  const authorInputRef = useRef(null)
  
  const showFanficFields = form.category === 'FanFiction'
  
  // Title autocomplete - check for existing books
  useEffect(() => {
    if (!form.title || form.title.length < 2) {
      setTitleSuggestions([])
      setFamiliarTitle(null)
      return
    }
    
    const timer = setTimeout(async () => {
      try {
        const data = await listBooks({ search: form.title, limit: 5, acquisition: 'all' })
        const matches = data.books || []
        
        setTitleSuggestions(matches)
        
        // Check for exact or very similar match
        const exactMatch = matches.find(
          book => book.title.toLowerCase() === form.title.toLowerCase()
        )
        
        if (exactMatch) {
          setFamiliarTitle(exactMatch)
        } else {
          // Check for high similarity (>85%)
          const similarMatch = matches.find(book => {
            const similarity = calculateSimilarity(
              form.title.toLowerCase(),
              book.title.toLowerCase()
            )
            return similarity > 0.85
          })
          setFamiliarTitle(similarMatch || null)
        }
      } catch (err) {
        console.error('Title autocomplete error:', err)
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [form.title])
  
  // Author autocomplete
  useEffect(() => {
    if (!authorInput || authorInput.length < 1) {
      setAuthorSuggestions([])
      return
    }
    
    const timer = setTimeout(async () => {
      try {
        const data = await listAuthors()
        // Extract author names from response object
        const authorNames = (data.authors || []).map(a => a.name)
        const filtered = authorNames
          .filter(author => 
            author.toLowerCase().includes(authorInput.toLowerCase()) &&
            !form.authors.includes(author)
          )
          .sort((a, b) => {
            // Prioritize starts-with matches
            const aStarts = a.toLowerCase().startsWith(authorInput.toLowerCase())
            const bStarts = b.toLowerCase().startsWith(authorInput.toLowerCase())
            if (aStarts && !bStarts) return -1
            if (!aStarts && bStarts) return 1
            return a.localeCompare(b)
          })
          .slice(0, 5)
        
        setAuthorSuggestions(filtered)
      } catch (err) {
        console.error('Author autocomplete error:', err)
      }
    }, 200)
    
    return () => clearTimeout(timer)
  }, [authorInput, form.authors])
  
  // Series autocomplete
  useEffect(() => {
    if (!form.series || form.series.length < 2) {
      setSeriesSuggestions([])
      return
    }
    
    const timer = setTimeout(async () => {
      try {
        const data = await listSeries()
        const matches = (data.series || [])
          .map(s => s.name)
          .filter(name => 
            name.toLowerCase().includes(form.series.toLowerCase())
          )
          .slice(0, 5)
        
        setSeriesSuggestions(matches)
      } catch (err) {
        console.error('Series autocomplete error:', err)
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [form.series])
  
  // Similarity calculation (Levenshtein-based)
  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = levenshtein(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }
  
  const levenshtein = (str1, str2) => {
    // Initialize full 2D matrix
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(0)
    )
    
    // Fill first column
    for (let i = 0; i <= str2.length; i++) {
      matrix[i][0] = i
    }
    
    // Fill first row
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }
  
  const validate = () => {
    const newErrors = {}
    if (!form.title.trim()) newErrors.title = 'Title is required'
    if (form.authors.length === 0) newErrors.authors = 'At least one author is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    
    onSubmit({
      title: form.title.trim(),
      authors: form.authors,
      series: form.series.trim() || null,
      series_number: form.seriesNumber.trim() || null,
      category: form.category,
      tbr_priority: form.priority,
      tbr_reason: form.reason.trim() || null,
      completion_status: form.completionStatus || null,
      source_url: form.sourceUrl.trim() || null,
    })
  }
  
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }
  
  // Author management
  const handleAddAuthor = (author) => {
    const trimmed = author.trim()
    if (!trimmed) return
    
    // Check if author already exists (case-insensitive)
    const existingIndex = form.authors.findIndex(
      a => a.toLowerCase() === trimmed.toLowerCase()
    )
    
    if (existingIndex >= 0) {
      // Replace existing with new version (better capitalization from autocomplete)
      const updatedAuthors = [...form.authors]
      updatedAuthors[existingIndex] = trimmed
      setForm(prev => ({ ...prev, authors: updatedAuthors }))
    } else {
      // Add new author
      setForm(prev => ({ ...prev, authors: [...prev.authors, trimmed] }))
    }
    
    setAuthorInput('')
    setShowAuthorDropdown(false)
    if (errors.authors) {
      setErrors(prev => ({ ...prev, authors: null }))
    }
  }
  
  const handleRemoveAuthor = (authorToRemove) => {
    setForm(prev => ({
      ...prev,
      authors: prev.authors.filter(a => a !== authorToRemove)
    }))
  }
  
  // FIXED: Mobile-friendly Enter key handling
  const handleAuthorKeyDown = (e) => {
    // Check both e.key and e.keyCode for mobile compatibility
    const isEnterKey = e.key === 'Enter' || e.keyCode === 13
    
    if (isEnterKey) {
      // ALWAYS prevent default first to stop form submission / field navigation
      e.preventDefault()
      e.stopPropagation()
      
      if (authorSuggestions.length > 0) {
        handleAddAuthor(authorSuggestions[0])
      } else if (authorInput.trim()) {
        handleAddAuthor(authorInput)
      }
    }
  }
  
  return (
    <div className="py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Save to Wishlist</h1>
        <p className="text-gray-400">A story for another day</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        {/* Title with Autocomplete */}
        <div className="relative">
          <label className="block text-sm text-gray-400 mb-2">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => {
              updateForm('title', e.target.value)
              setShowTitleDropdown(true)
            }}
            onFocus={() => setShowTitleDropdown(true)}
            onBlur={() => setTimeout(() => setShowTitleDropdown(false), 200)}
            placeholder="What's it called?"
            className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-library-accent ${
              errors.title ? 'border-red-500' : 'border-gray-700'
            }`}
          />
          {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
          
          {/* Familiar Title Warning */}
          {familiarTitle && (
            <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="text-amber-400 text-sm font-medium">A Familiar Title</p>
                  <p className="text-gray-300 text-xs mt-1">
                    "{familiarTitle.title}" by {familiarTitle.authors?.join(', ')} is already {familiarTitle.acquisition_status === 'wishlist' ? 'on your wishlist' : 'in your library'}.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Title Suggestions Dropdown */}
          {showTitleDropdown && titleSuggestions.length > 0 && !familiarTitle && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {titleSuggestions.map((book, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    setFamiliarTitle(book)
                    setShowTitleDropdown(false)
                  }}
                >
                  <div className="text-white text-sm">{book.title}</div>
                  <div className="text-gray-400 text-xs">
                    {book.authors?.join(', ')} • {book.acquisition_status === 'wishlist' ? 'On Wishlist' : 'In Library'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Authors with Chips and Autocomplete */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Author(s) *</label>
          
          {/* Author Chips */}
          {form.authors.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {form.authors.map((author, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-library-accent/20 text-library-accent rounded-full text-sm"
                >
                  {author}
                  <button
                    type="button"
                    onClick={() => handleRemoveAuthor(author)}
                    className="hover:text-white ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {/* Author Input with Autocomplete */}
          <div className="relative">
            <input
              ref={authorInputRef}
              type="text"
              value={authorInput}
              onChange={(e) => {
                setAuthorInput(e.target.value)
                setShowAuthorDropdown(true)
              }}
              onKeyDown={handleAuthorKeyDown}
              onFocus={() => setShowAuthorDropdown(true)}
              onBlur={() => setTimeout(() => setShowAuthorDropdown(false), 200)}
              placeholder={form.authors.length === 0 ? "Who wrote it?" : "Add another author..."}
              enterKeyHint="done"
              autoComplete="off"
              className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-library-accent ${
                errors.authors ? 'border-red-500' : 'border-gray-700'
              }`}
            />
            
            {/* Author Suggestions Dropdown */}
            {showAuthorDropdown && authorSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {authorSuggestions.map((author, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-white text-sm"
                    onClick={() => handleAddAuthor(author)}
                  >
                    {author}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {errors.authors && <p className="text-red-400 text-sm mt-1">{errors.authors}</p>}
          <p className="text-gray-500 text-xs mt-1">Press Enter to add each author</p>
        </div>
        
        {/* Series with Autocomplete */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <label className="block text-sm text-gray-400 mb-2">Series</label>
            <input
              type="text"
              value={form.series}
              onChange={(e) => {
                updateForm('series', e.target.value)
                setShowSeriesDropdown(true)
              }}
              onFocus={() => setShowSeriesDropdown(true)}
              onBlur={() => setTimeout(() => setShowSeriesDropdown(false), 200)}
              placeholder="Series name"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-library-accent"
            />
            
            {/* Series Suggestions Dropdown */}
            {showSeriesDropdown && seriesSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {seriesSuggestions.map((series, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-white text-sm"
                    onClick={() => {
                      updateForm('series', series)
                      setShowSeriesDropdown(false)
                    }}
                  >
                    {series}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="w-20">
            <label className="block text-sm text-gray-400 mb-2">#</label>
            <input
              type="text"
              value={form.seriesNumber}
              onChange={(e) => updateForm('seriesNumber', e.target.value)}
              placeholder="1"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-library-accent"
            />
          </div>
        </div>
        
        {/* Category */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Category</label>
          <select
            value={form.category}
            onChange={(e) => updateForm('category', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-library-accent"
          >
            <option value="Fiction">Fiction</option>
            <option value="Non-Fiction">Non-Fiction</option>
            <option value="FanFiction">FanFiction</option>
          </select>
        </div>
        
        {/* FanFiction fields */}
        {showFanficFields && (
          <>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Completion Status</label>
              <div className="flex gap-2">
                {['Complete', 'WIP', 'Abandoned'].map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateForm('completionStatus', form.completionStatus === status ? '' : status)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      form.completionStatus === status
                        ? 'bg-library-accent text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Source URL</label>
              <input
                type="url"
                value={form.sourceUrl}
                onChange={(e) => updateForm('sourceUrl', e.target.value)}
                placeholder="https://archiveofourown.org/works/..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-library-accent"
              />
            </div>
          </>
        )}
        
        {/* Priority */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Priority</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateForm('priority', 'normal')}
              className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                form.priority === 'normal'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => updateForm('priority', 'high')}
              className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                form.priority === 'high'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              ⭐ High Priority
            </button>
          </div>
        </div>
        
        {/* Reason */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Why this one?</label>
          <textarea
            value={form.reason}
            onChange={(e) => updateForm('reason', e.target.value)}
            placeholder="A friend recommended it, saw it on TikTok, loved the author's other work..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-library-accent resize-none"
          />
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-library-accent text-white py-3 rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save for Later'}
          </button>
        </div>
      </form>
    </div>
  )
}
