/**
 * ManualEntryForm.jsx
 * 
 * Form for manually adding books to library (physical, audiobook, web-based)
 */

import { useState, useEffect, useRef } from 'react'
import { listAuthors, listBooks } from '../../api'
import Button from '../ui/Button'
import FormField from '../ui/FormField'

const inputClass = (hasError) =>
  `w-full bg-bg-elevated border rounded-lg px-4 py-3 text-text-primary text-sm font-[inherit] placeholder:text-text-muted transition-[border-color] duration-200 ease-out focus:outline-none focus:ring-[3px] focus:ring-action-primary/15 focus:border-border-focus ${
    hasError ? 'border-action-danger' : 'border-border-default'
  }`

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
  
  // FIXED: Mobile-friendly Enter key handling
  const handleAuthorKeyDown = (e) => {
    // Check both e.key and e.keyCode for mobile compatibility
    const isEnterKey = e.key === 'Enter' || e.keyCode === 13
    const isBackspace = e.key === 'Backspace' || e.keyCode === 8
    
    if (isEnterKey) {
      // ALWAYS prevent default first to stop form submission / field navigation
      e.preventDefault()
      e.stopPropagation()
      
      if (form.authorInput.trim()) {
        addAuthor(form.authorInput.trim())
      }
    } else if (isBackspace && !form.authorInput && form.authors.length > 0) {
      // Remove last author if input is empty
      removeAuthor(form.authors[form.authors.length - 1])
    }
  }
  
  return (
    <div className="py-4">
      <div className="mb-6 text-center max-w-md mx-auto">
        <h1 className="text-h2 mb-2">Another Format</h1>
        <p className="text-body-sm text-text-secondary">What do you know about it?</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div>
          <span className="block text-label mb-2">Format</span>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'physical', label: 'Physical' },
              { value: 'audiobook', label: 'Audiobook' },
              { value: 'web', label: 'Web/URL' },
            ].map((opt) => (
              <Button
                key={opt.value}
                type="button"
                size="sm"
                variant={form.format === opt.value ? 'primary' : 'secondary'}
                onClick={() => updateForm('format', opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          {form.format === 'web' && (
            <p className="text-caption text-text-muted mt-2 italic">Choose this option for web-based works</p>
          )}
        </div>

        <FormField label="Title *" error={errors.title}>
          <div className="relative">
            <input
              type="text"
              value={form.title}
              onChange={(e) => {
                updateForm('title', e.target.value)
                if (selectedExistingTitle) {
                  setSelectedExistingTitle(null)
                }
              }}
              onFocus={() =>
                form.title.trim().length >= 2 && setShowTitleDropdown(titleSuggestions.length > 0)
              }
              onBlur={() => setTimeout(() => setShowTitleDropdown(false), 200)}
              placeholder="What's it called?"
              className={inputClass(!!errors.title)}
            />
            {showTitleDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-bg-elevated border border-border-default rounded-lg shadow-lg max-h-64 overflow-y-auto">
                <div className="px-3 py-2 text-caption text-text-muted border-b border-border-default">
                  Already in your library:
                </div>
                {titleSuggestions.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => selectTitleSuggestion(book)}
                    className="w-full text-left px-4 py-2 min-h-[44px] hover:bg-bg-surface transition-all duration-200 ease-out"
                  >
                    <div className="text-body-sm text-text-primary">{book.title}</div>
                    <div className="text-caption text-text-secondary">
                      {book.authors?.join(', ')} • {book.category}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </FormField>

        {isAddingFormat && (
          <div className="p-4 rounded-lg bg-action-success/10 border border-action-success/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-action-success flex items-center gap-2 mb-1">
                  <span>✔</span> Adding format to existing title
                </div>
                <p className="text-body-sm text-text-secondary">
                  &quot;{selectedExistingTitle.title}&quot; is already in your library. This will add a new{' '}
                  {form.format} format.
                </p>
              </div>
              <button
                type="button"
                onClick={clearExistingSelection}
                className="text-text-muted hover:text-text-primary p-2 min-w-[44px] min-h-[44px]"
                title="Create as new title instead"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <span className="block text-label mb-2">Author *</span>
          {form.authors.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {form.authors.map((author) => (
                <span
                  key={author}
                  className="bg-action-primary/15 text-action-primary px-3 py-1 rounded-full text-body-sm inline-flex items-center gap-2"
                >
                  {author}
                  <button
                    type="button"
                    onClick={() => removeAuthor(author)}
                    className="hover:text-text-primary transition-colors"
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
            placeholder={form.authors.length > 0 ? 'Add another author...' : 'Who wrote it?'}
            enterKeyHint="done"
            autoComplete="off"
            className={inputClass(!!errors.author)}
          />
          {showAuthorDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-bg-elevated border border-border-default rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredAuthors.map((author) => (
                <button
                  key={author}
                  type="button"
                  onClick={() => addAuthor(author)}
                  className="w-full text-left px-4 py-2 min-h-[44px] text-body-sm text-text-secondary hover:bg-bg-surface"
                >
                  {author}
                </button>
              ))}
            </div>
          )}
          {errors.author && <p className="mt-1.5 text-xs text-action-danger">{errors.author}</p>}
          <p className="text-caption text-text-muted mt-1">Press Enter to add multiple authors</p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <FormField
              label="Series"
              value={form.series}
              onChange={(v) => updateForm('series', v)}
              placeholder="Series name"
            />
          </div>
          <div className="w-24">
            <FormField label="#" value={form.seriesNumber} onChange={(v) => updateForm('seriesNumber', v)} placeholder="1" />
          </div>
        </div>

        <FormField label="Category">
          <select
            value={form.category}
            onChange={(e) => updateForm('category', e.target.value)}
            className="w-full h-11 px-3 rounded-lg text-body-sm text-text-primary bg-bg-elevated border border-border-default focus:outline-none focus:ring-[3px] focus:ring-action-primary/15 focus:border-border-focus"
          >
            <option value="Fiction">Fiction</option>
            <option value="Non-Fiction">Non-Fiction</option>
            <option value="FanFiction">FanFiction</option>
          </select>
        </FormField>

        {showFanficFields && (
          <div>
            <span className="block text-label mb-2">Completion Status</span>
            <div className="flex gap-2 flex-wrap">
              {['Complete', 'WIP', 'Abandoned'].map((status) => (
                <Button
                  key={status}
                  type="button"
                  size="sm"
                  variant={form.completionStatus === status ? 'primary' : 'secondary'}
                  onClick={() => updateForm('completionStatus', form.completionStatus === status ? '' : status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        )}

        {showUrlField && (
          <FormField
            label={`Source URL ${form.format === 'web' ? '*' : '(optional)'}`}
            error={errors.sourceUrl}
          >
            <input
              type="url"
              value={form.sourceUrl}
              onChange={(e) => updateForm('sourceUrl', e.target.value)}
              placeholder="https://archiveofourown.org/works/..."
              className={inputClass(!!errors.sourceUrl)}
            />
          </FormField>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className={
              isAddingFormat ? 'flex-1 !bg-action-success hover:!bg-action-success-hover' : 'flex-1'
            }
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : isAddingFormat ? 'Add Format' : 'Add to Library'}
          </Button>
        </div>
      </form>
    </div>
  )
}
