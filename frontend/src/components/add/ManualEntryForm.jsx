/**
 * ManualEntryForm.jsx
 * 
 * Form for manually adding books to library (physical, audiobook, web-based)
 */

import { useState, useEffect, useRef } from 'react'
import { listAuthors, listBooks } from '../../api'

export default function ManualEntryForm({ onSubmit, onCancel, isSubmitting, initialFormat = 'physical' }) {
  const [form, setForm] = useState({
    title: '',
    authors: [],
    authorInput: '',
    series: '',
    seriesNumber: '',
    category: 'FanFiction',
    format: initialFormat,
    sourceUrl: '',
    completionStatus: '',
  })
  
  const [errors, setErrors] = useState({})
  const [allAuthors, setAllAuthors] = useState([])
  const [filteredAuthors, setFilteredAuthors] = useState([])
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false)
  const authorInputRef = useRef(null)

  // Title autocomplete state
  const [titleSuggestions, setTitleSuggestions] = useState([])
  const [showTitleDropdown, setShowTitleDropdown] = useState(false)
  const titleSearchTimeoutRef = useRef(null)
  const titleJustSelectedRef = useRef(false)
  
  // Track if user selected an existing title (for "add format" mode)
  const [selectedExistingTitle, setSelectedExistingTitle] = useState(null)
  
  const showFanficFields = form.category === 'FanFiction'
  const isAddingFormat = selectedExistingTitle !== null
  const showUrlField = form.format === 'web' || showFanficFields
  
  // Fetch all authors on mount
  useEffect(() => {
    listAuthors().then(data => {
      setAllAuthors((data.authors || []).map(a => a.name))
    }).catch(console.error)
  }, [])
  
  // Filter authors as user types
  useEffect(() => {
    if (form.authorInput.trim()) {
      const query = form.authorInput.toLowerCase()
      const filtered = allAuthors
        .filter(a => a.toLowerCase().includes(query))
        .filter(a => !form.authors.includes(a))
        .slice(0, 8)
      setFilteredAuthors(filtered)
      setShowAuthorDropdown(filtered.length > 0)
    } else {
      setFilteredAuthors([])
      setShowAuthorDropdown(false)
    }
  }, [form.authorInput, allAuthors, form.authors])

  // Search titles as user types (debounced)
  useEffect(() => {
    // Clear previous timeout
    if (titleSearchTimeoutRef.current) {
      clearTimeout(titleSearchTimeoutRef.current)
    }
    
    // Skip search if we just selected a suggestion
    if (titleJustSelectedRef.current) {
      titleJustSelectedRef.current = false
      return
    }
    
    if (form.title.trim().length >= 2) {
      // Debounce search by 300ms
      titleSearchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await listBooks({ search: form.title.trim(), limit: 8 })
          const suggestions = response.books || []
          setTitleSuggestions(suggestions)
          setShowTitleDropdown(suggestions.length > 0)
        } catch (err) {
          console.error('Title search failed:', err)
          setTitleSuggestions([])
          setShowTitleDropdown(false)
        }
      }, 300)
    } else {
      setTitleSuggestions([])
      setShowTitleDropdown(false)
    }
    
    // Cleanup on unmount or before next effect run
    return () => {
      if (titleSearchTimeoutRef.current) {
        clearTimeout(titleSearchTimeoutRef.current)
      }
    }
  }, [form.title])
  
  const validate = () => {
    const newErrors = {}
    if (!form.title.trim()) newErrors.title = 'Title is required'
    if (form.authors.length === 0 && !form.authorInput.trim()) {
      newErrors.author = 'At least one author is required'
    }
    if (form.format === 'web' && !form.sourceUrl.trim()) {
      newErrors.sourceUrl = 'URL is required for web-based books'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Add any pending author input
    let finalAuthors = [...form.authors]
    if (form.authorInput.trim() && !finalAuthors.includes(form.authorInput.trim())) {
      finalAuthors.push(form.authorInput.trim())
    }
    
    if (!form.title.trim() || finalAuthors.length === 0) {
      const newErrors = {}
      if (!form.title.trim()) newErrors.title = 'Title is required'
      if (finalAuthors.length === 0) newErrors.author = 'At least one author is required'
      setErrors(newErrors)
      return
    }
    
    onSubmit({
      title: form.title.trim(),
      authors: finalAuthors,
      series: form.series.trim() || null,
      series_number: form.seriesNumber.trim() || null,
      category: form.category,
      format: form.format,
      source_url: form.sourceUrl.trim() || null,
      completion_status: form.completionStatus || null,
      is_tbr: false,
      // Include existing title ID if adding format to existing book
      existingTitleId: selectedExistingTitle?.id || null,
    })
  }
  
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }
  
  const addAuthor = (author) => {
    if (author && !form.authors.includes(author)) {
      setForm(prev => ({
        ...prev,
        authors: [...prev.authors, author],
        authorInput: ''
      }))
      setShowAuthorDropdown(false)
      setErrors(prev => ({ ...prev, author: null }))
    }
  }
  
  const removeAuthor = (author) => {
    setForm(prev => ({
      ...prev,
      authors: prev.authors.filter(a => a !== author)
    }))
  }

  const selectTitleSuggestion = (book) => {
    titleJustSelectedRef.current = true
    // Store the existing title for "add format" mode
    setSelectedExistingTitle({
      id: book.id,
      title: book.title,
      authors: book.authors || [],
      category: book.category,
    })
    setForm(prev => ({
      ...prev,
      title: book.title,
      authors: book.authors || [],
      authorInput: '',
      series: book.series || '',
      seriesNumber: book.series_number || '',
      category: book.category || prev.category,
    }))
    setTitleSuggestions([])
    setShowTitleDropdown(false)
    setErrors({})
  }

  const clearExistingSelection = () => {
    setSelectedExistingTitle(null)
  }
  
  const handleAuthorKeyDown = (e) => {
    if (e.key === 'Enter' && form.authorInput.trim()) {
      e.preventDefault()
      addAuthor(form.authorInput.trim())
    } else if (e.key === 'Backspace' && !form.authorInput && form.authors.length > 0) {
      // Remove last author if input is empty
      removeAuthor(form.authors[form.authors.length - 1])
    }
  }
  
  return (
    <div className="py-4">
      <div className="mb-6 text-center max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Another Format</h1>
        <p className="text-gray-400">What do you know about it?</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        {/* Format */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Format</label>
          <div className="flex gap-2">
            {['physical', 'audiobook', 'web'].map(fmt => (
              <button
                key={fmt}
                type="button"
                onClick={() => updateForm('format', fmt)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  form.format === fmt
                    ? 'bg-library-accent text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {fmt === 'physical' ? 'Physical' : fmt === 'audiobook' ? 'Audiobook' : 'Web/URL'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Title */}
        <div className="relative">
          <label className="block text-sm text-gray-400 mb-2">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => {
              updateForm('title', e.target.value)
              // Clear existing selection if user manually edits the title
              if (selectedExistingTitle && e.target.value !== selectedExistingTitle.title) {
                clearExistingSelection()
              }
            }}
            onFocus={() => titleSuggestions.length > 0 && setShowTitleDropdown(true)}
            onBlur={() => setTimeout(() => setShowTitleDropdown(false), 200)}
            placeholder="What's it called?"
            className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-library-accent ${
              errors.title ? 'border-red-500' : 'border-gray-700'
            }`}
          />
          
          {/* Title suggestions dropdown */}
          {showTitleDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-700">
                Already in your library:
              </div>
              {titleSuggestions.map(book => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => selectTitleSuggestion(book)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                >
                  <div className="text-sm text-white">{book.title}</div>
                  <div className="text-xs text-gray-400">
                    {book.authors?.join(', ')} • {book.category}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Adding Format Banner - show when existing title selected */}
        {isAddingFormat && (
          <div className="p-4 rounded-lg bg-green-900/30 border border-green-700/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-green-300 flex items-center gap-2 mb-1">
                  <span>✓</span> Adding format to existing title
                </div>
                <p className="text-sm text-gray-400">
                  "{selectedExistingTitle.title}" is already in your library. 
                  This will add a new {form.format} format.
                </p>
              </div>
              <button
                type="button"
                onClick={clearExistingSelection}
                className="text-gray-500 hover:text-gray-300 p-1"
                title="Create as new title instead"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {/* Author */}
        <div className="relative">
          <label className="block text-sm text-gray-400 mb-2">Author *</label>
          
          {/* Author chips */}
          {form.authors.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {form.authors.map(author => (
                <span
                  key={author}
                  className="bg-library-accent/20 text-library-accent px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {author}
                  <button
                    type="button"
                    onClick={() => removeAuthor(author)}
                    className="hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          
          <input
            ref={authorInputRef}
            type="text"
            value={form.authorInput}
            onChange={(e) => updateForm('authorInput', e.target.value)}
            onKeyDown={handleAuthorKeyDown}
            onFocus={() => form.authorInput.trim() && setShowAuthorDropdown(filteredAuthors.length > 0)}
            onBlur={() => setTimeout(() => setShowAuthorDropdown(false), 200)}
            placeholder={form.authors.length > 0 ? "Add another author..." : "Who wrote it?"}
            className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-library-accent ${
              errors.author ? 'border-red-500' : 'border-gray-700'
            }`}
          />
          
          {/* Autocomplete dropdown */}
          {showAuthorDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredAuthors.map(author => (
                <button
                  key={author}
                  type="button"
                  onClick={() => addAuthor(author)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  {author}
                </button>
              ))}
            </div>
          )}
          
          {errors.author && <p className="text-red-400 text-sm mt-1">{errors.author}</p>}
          <p className="text-gray-500 text-xs mt-1">Press Enter to add multiple authors</p>
        </div>
        
        {/* Series Row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">Series</label>
            <input
              type="text"
              value={form.series}
              onChange={(e) => updateForm('series', e.target.value)}
              placeholder="Series name"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-library-accent"
            />
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
        
        {/* FanFiction: Completion Status */}
        {showFanficFields && (
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
        )}
        
        {/* Source URL */}
        {showUrlField && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Source URL {form.format === 'web' ? '*' : '(optional)'}
            </label>
            <input
              type="url"
              value={form.sourceUrl}
              onChange={(e) => updateForm('sourceUrl', e.target.value)}
              placeholder="https://archiveofourown.org/works/..."
              className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-library-accent ${
                errors.sourceUrl ? 'border-red-500' : 'border-gray-700'
              }`}
            />
            {errors.sourceUrl && <p className="text-red-400 text-sm mt-1">{errors.sourceUrl}</p>}
          </div>
        )}
        
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
            className={`flex-1 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-50 ${
              isAddingFormat ? 'bg-green-600 hover:bg-green-700' : 'bg-library-accent'
            }`}
          >
            {isSubmitting 
              ? 'Adding...' 
              : isAddingFormat 
                ? 'Add Format' 
                : 'Add to Library'
            }
          </button>
        </div>
      </form>
    </div>
  )
}
