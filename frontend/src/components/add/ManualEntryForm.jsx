/**
 * ManualEntryForm.jsx
 * 
 * Form for manually adding books to library (physical, audiobook, web-based)
 */

import { useState, useEffect, useRef } from 'react'
import { listBooks } from '../../api'
import { useStatusLabels } from '../../hooks/useStatusLabels'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import SegmentedControl from '../ui/SegmentedControl'
import AuthorInput from '../ui/AuthorInput'
import { MANUAL_ENTRY_FORMATS } from '../../constants/formats'

const inputClass = (hasError) =>
  `w-full bg-bg-elevated border rounded-lg px-4 py-3 text-text-primary text-sm font-[inherit] placeholder:text-text-muted transition-[border-color] duration-200 ease-out focus:outline-none focus:ring-[3px] focus:ring-action-primary/15 focus:border-border-focus ${
    hasError ? 'border-action-danger' : 'border-border-default'
  }`

const CATEGORY_OPTIONS = [
  { value: 'Uncategorized', label: 'Uncategorized' },
  { value: 'Fiction', label: 'Fiction' },
  { value: 'Non-Fiction', label: 'Non-Fiction' },
  { value: 'FanFiction', label: 'FanFiction' },
]

export default function ManualEntryForm({ onSubmit, onCancel, isSubmitting, initialFormat = 'physical' }) {
  const { getLabel } = useStatusLabels()
  const [form, setForm] = useState({
    title: '',
    authors: '',
    series: '',
    seriesNumber: '',
    category: 'Uncategorized',
    format: initialFormat,
    sourceUrl: '',
    completionStatus: '',
  })
  
  const [errors, setErrors] = useState({})

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
    const parsedAuthors = form.authors.split(',').map((a) => a.trim()).filter((a) => a.length > 0)
    if (parsedAuthors.length === 0) {
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

    const finalAuthors = form.authors.split(',').map((a) => a.trim()).filter((a) => a.length > 0)

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
    if (field === 'authors' && errors.author) {
      setErrors(prev => ({ ...prev, author: null }))
    }
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
      authors: Array.isArray(book.authors) ? book.authors.join(', ') : (book.authors || ''),
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
  
  return (
    <div className="py-4">
      <div className="mb-6 text-center max-w-md mx-auto">
        <h1 className="text-h2 text-text-primary mb-2">Another Format</h1>
        <p className="text-body-sm text-text-secondary">What do you know about it?</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div>
          <span className="block text-label text-text-body mb-2">Format</span>
          <div className="flex gap-2 flex-wrap">
            {MANUAL_ENTRY_FORMATS.map((opt) => (
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
              {/* design-lint-button-chrome: chrome — banner dismiss (structural exclusion, S3) */}
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

        <FormField label="Author *" error={errors.author}>
          <AuthorInput
            value={form.authors}
            onChange={(v) => updateForm('authors', v)}
            error={!!errors.author}
          />
        </FormField>

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
          <SegmentedControl
            size="sm"
            value={form.category}
            onChange={(val) => updateForm('category', val)}
            options={CATEGORY_OPTIONS}
            ariaLabel="Category"
          />
        </FormField>

        {showFanficFields && (
          <div>
            <span className="block text-label text-text-body mb-2">Completion Status</span>
            <div className="flex gap-2 flex-wrap">
              {['Complete', 'WIP', 'Abandoned'].map((status) => (
                <Button
                  key={status}
                  type="button"
                  size="sm"
                  variant={form.completionStatus === status ? 'primary' : 'secondary'}
                  onClick={() => updateForm('completionStatus', form.completionStatus === status ? '' : status)}
                >
                  {status === 'Abandoned' ? getLabel('Abandoned') : status}
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
            variant={isAddingFormat ? 'success' : 'primary'}
            className="flex-1"
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
