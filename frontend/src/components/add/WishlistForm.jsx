/**
 * WishlistForm.jsx
 * 
 * Form for adding stories to the Wishlist
 * Features: Multi-author chips, autocomplete for title/author/series
 */

import { useState, useEffect } from 'react'
import { listBooks, listSeries } from '../../api'
import { useStatusLabels } from '../../hooks/useStatusLabels'
import Button from '../ui/Button'
import FormField from '../ui/FormField'
import SegmentedControl from '../ui/SegmentedControl'
import AuthorInput from '../ui/AuthorInput'

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

export default function WishlistForm({ onSubmit, onCancel, isSubmitting }) {
  const { getLabel } = useStatusLabels()
  const [form, setForm] = useState({
    title: '',
    authors: '',
    series: '',
    seriesNumber: '',
    category: 'Uncategorized',
    priority: 'normal',
    reason: '',
    completionStatus: '',
    sourceUrl: '',
  })
  
  const [errors, setErrors] = useState({})
  
  // Autocomplete states
  const [titleSuggestions, setTitleSuggestions] = useState([])
  const [seriesSuggestions, setSeriesSuggestions] = useState([])
  const [showTitleDropdown, setShowTitleDropdown] = useState(false)
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false)
  
  // Familiar title warning
  const [familiarTitle, setFamiliarTitle] = useState(null)
  
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
    const parsedAuthors = form.authors.split(',').map((a) => a.trim()).filter((a) => a.length > 0)
    if (parsedAuthors.length === 0) newErrors.authors = 'At least one author is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    
    onSubmit({
      title: form.title.trim(),
      authors: form.authors.split(',').map((a) => a.trim()).filter((a) => a.length > 0),
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
  
  return (
    <div className="py-4">
      <div className="mb-6">
        <h1 className="text-h2 text-text-primary mb-2">Save to Wishlist</h1>
        <p className="text-body-sm text-text-secondary">A story for another day</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div className="relative">
          <FormField label="Title *" error={errors.title}>
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
              className={inputClass(!!errors.title)}
            />
          </FormField>

          {familiarTitle && (
            <div className="mt-2 p-3 bg-action-warning/10 border border-action-warning/30 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-action-warning text-lg">⚠️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-action-warning font-medium">A Familiar Title</p>
                  <p className="text-caption text-text-secondary mt-1">
                    &quot;{familiarTitle.title}&quot; by {familiarTitle.authors?.join(', ')} is already{' '}
                    {familiarTitle.acquisition_status === 'wishlist' ? 'on your wishlist' : 'in your library'}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {showTitleDropdown && titleSuggestions.length > 0 && !familiarTitle && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-bg-elevated border border-border-default rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {titleSuggestions.map((book, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="w-full text-left px-4 py-2 min-h-[44px] hover:bg-bg-surface"
                  onClick={() => {
                    setFamiliarTitle(book)
                    setShowTitleDropdown(false)
                  }}
                >
                  <div className="text-body-sm text-text-primary">{book.title}</div>
                  <div className="text-caption text-text-secondary">
                    {book.authors?.join(', ')} •{' '}
                    {book.acquisition_status === 'wishlist' ? 'On Wishlist' : 'In Library'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <FormField label="Author(s) *" error={errors.authors}>
          <AuthorInput
            value={form.authors}
            onChange={(v) => updateForm('authors', v)}
            error={!!errors.authors}
          />
        </FormField>

        <div className="flex gap-3">
          <div className="flex-1">
            <div className="relative">
              <FormField
                label="Series"
                value={form.series}
                onChange={(v) => {
                  updateForm('series', v)
                  setShowSeriesDropdown(true)
                }}
                onFocus={() => setShowSeriesDropdown(true)}
                onBlur={() => setTimeout(() => setShowSeriesDropdown(false), 200)}
                placeholder="Series name"
              />
              {showSeriesDropdown && seriesSuggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-bg-elevated border border-border-default rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {seriesSuggestions.map((series, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="w-full text-left px-4 py-2 min-h-[44px] text-body-sm text-text-primary hover:bg-bg-surface"
                    onClick={() => {
                      updateForm('series', series)
                      setShowSeriesDropdown(false)
                    }}
                  >
                    {series}
                  </button>
                ))}
                </div>
              )}
            </div>
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
          <>
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
            <FormField
              label="Source URL"
              type="url"
              value={form.sourceUrl}
              onChange={(v) => updateForm('sourceUrl', v)}
              placeholder="https://archiveofourown.org/works/..."
            />
          </>
        )}

        <div>
          <span className="block text-label text-text-body mb-2">Priority</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={form.priority === 'normal' ? 'primary' : 'secondary'}
              className="flex-1"
              onClick={() => updateForm('priority', 'normal')}
            >
              Normal
            </Button>
            <Button
              type="button"
              variant={form.priority === 'high' ? 'warning' : 'secondary'}
              className="flex-1"
              onClick={() => updateForm('priority', 'high')}
            >
              ⭐ High Priority
            </Button>
          </div>
        </div>

        <FormField
          label="Why this one?"
          type="textarea"
          rows={3}
          value={form.reason}
          onChange={(v) => updateForm('reason', v)}
          placeholder="A friend recommended it, saw it on TikTok, loved the author's other work..."
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save for Later'}
          </Button>
        </div>
      </form>
    </div>
  )
}
