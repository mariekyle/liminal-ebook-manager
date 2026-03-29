import { useState, useEffect, useRef } from 'react'
import { autocompleteFandoms, autocompleteShips, autocompleteTags, listSeries } from '../api'
import Modal from './ui/Modal'
import Button from './ui/Button'
import FormField from './ui/FormField'
import ChipInput from './ui/ChipInput'

const PAIRING_TYPES = ['None', 'M/M', 'F/F', 'M/F', 'Multi', 'Gen', 'Other']
const COMPLETION_STATUSES = ['Complete', 'In Progress', 'Abandoned', 'Unknown']
const CONTENT_RATINGS = ['Not Rated', 'General', 'Teen', 'Mature', 'Explicit']
const WARNINGS_OPTIONS = ['None', 'Choose Not To Warn', 'Violence', 'Major Character Death']

const selectClasses =
  'w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-default text-text-primary text-body-sm font-[inherit] cursor-pointer focus:outline-none focus:border-action-primary focus:ring-[3px] focus:ring-action-primary/15'

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
        className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-default text-text-primary text-body-sm font-[inherit] placeholder:text-text-muted focus:outline-none focus:border-action-primary focus:ring-[3px] focus:ring-action-primary/15"
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-[70] w-full mt-1 bg-bg-elevated border border-border-default rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((item, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => handleSelect(item)}
              className="w-full text-left px-3 py-2 min-h-[44px] text-body-sm text-text-secondary hover:bg-bg-surface hover:text-text-primary transition-all duration-200 ease-out"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const SeriesInput = ({ value, onChange, allSeries }) => {
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleInputChange = (e) => {
    const val = e.target.value
    onChange(val)

    if (val.trim().length > 0) {
      const filtered = allSeries.filter((s) => s.toLowerCase().includes(val.toLowerCase()))
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
          if (value && suggestions.length > 0) setShowSuggestions(true)
        }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="None"
        className="w-full h-11 px-3 rounded-lg bg-bg-elevated border border-border-default text-text-primary text-body-sm font-[inherit] placeholder:text-text-muted focus:outline-none focus:border-action-primary focus:ring-[3px] focus:ring-action-primary/15"
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-[70] w-full mt-1 bg-bg-elevated border border-border-default rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => {
                onChange(s)
                setShowSuggestions(false)
              }}
              className="w-full text-left px-3 py-2 min-h-[44px] text-body-sm text-text-secondary hover:bg-bg-surface hover:text-text-primary transition-all duration-200 ease-out"
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
  const isFanFiction = book?.category === 'FanFiction'
  const showMetadataTab = isFanFiction && !isWishlist
  const tabs = showMetadataTab ? ['Details', 'About', 'Metadata'] : ['Details', 'About']

  const [activeTab, setActiveTab] = useState('Details')
  const [allSeries, setAllSeries] = useState([])
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    series: '',
    series_number: '',
    category: 'Uncategorized',
    publication_year: '',
    source_url: '',
    summary: '',
    tags: [],
    ao3_category: 'None',
    completion_status: 'Unknown',
    fandom: '',
    ships: '',
    content_rating: 'Not Rated',
    warnings: 'None',
  })

  useEffect(() => {
    if (book && isOpen) {
      setFormData({
        title: book.title || '',
        authors: Array.isArray(book.authors) ? book.authors.join(', ') : book.authors || '',
        series: book.series || '',
        series_number: book.series_number || '',
        category: book.category || 'Uncategorized',
        publication_year: book.publication_year?.toString() || '',
        source_url: book.source_url || '',
        summary: book.summary || '',
        tags: Array.isArray(book.tags) ? book.tags.map((t) => String(t).toLowerCase()) : [],
        ao3_category: Array.isArray(book.ao3_category) && book.ao3_category.length > 0 ? book.ao3_category[0] : 'None',
        completion_status: book.completion_status || 'Unknown',
        fandom: book.fandom || '',
        ships: Array.isArray(book.relationships) ? book.relationships.join(', ') : book.ships || '',
        content_rating: book.content_rating || 'Not Rated',
        warnings: Array.isArray(book.ao3_warnings) && book.ao3_warnings.length > 0 ? book.ao3_warnings[0] : 'None',
      })
      setActiveTab('Details')
    }
  }, [book, isOpen])

  useEffect(() => {
    listSeries({ limit: 10000 })
      .then((data) => {
        const names = data.series.map((s) => s.name)
        setAllSeries(names)
      })
      .catch((err) => console.error('Failed to load series:', err))
  }, [])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const authorsArray = formData.authors
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0)

      const updates = {
        title: formData.title,
        authors: authorsArray,
        series: formData.series || null,
        series_number: formData.series_number || null,
        category: formData.category,
        publication_year: formData.publication_year ? parseInt(formData.publication_year, 10) : null,
        source_url: formData.source_url || null,
        summary: formData.summary || null,
        tags: formData.tags,
      }

      if (formData.category === 'Fiction' || formData.category === 'FanFiction') {
        updates.ao3_category = formData.ao3_category !== 'None' ? [formData.ao3_category] : []
      }

      if (formData.category === 'FanFiction' && !isWishlist) {
        updates.completion_status = formData.completion_status
        updates.fandom = formData.fandom || null
        updates.relationships = formData.ships
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
        updates.content_rating = formData.content_rating
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

  const showPairingType = formData.category === 'Fiction' || formData.category === 'FanFiction'

  const tabBtn = (tab) =>
    `flex-1 min-h-[44px] py-2 px-3 rounded-md text-body-sm font-medium transition-all duration-200 ease-out ${
      activeTab === tab ? 'bg-bg-elevated text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
    }`

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" fullscreenOnMobile>
      <Modal.Header onClose={onClose}>Edit</Modal.Header>
      <Modal.Body className="flex flex-col min-h-0">
        <div className="px-1 pb-4 border-b border-border-subtle flex-shrink-0">
          <div className="flex bg-bg-base rounded-lg p-0.5 border border-border-subtle">
            {tabs.map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={tabBtn(tab)}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {activeTab === 'Details' && (
            <>
              <FormField label="Title" value={formData.title} onChange={(v) => handleInputChange('title', v)} />

              <FormField
                label="Author(s)"
                value={formData.authors}
                onChange={(v) => handleInputChange('authors', v)}
                placeholder="Separate multiple authors with commas"
              />

              <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
                <FormField label="Series">
                  <SeriesInput value={formData.series} onChange={(val) => handleInputChange('series', val)} allSeries={allSeries} />
                </FormField>
                <div className="max-w-48">
                  <FormField
                    label="Number"
                    value={formData.series_number}
                    onChange={(v) => handleInputChange('series_number', v)}
                    placeholder="#"
                  />
                </div>
              </div>

              <FormField label="Category">
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={selectClasses}
                >
                  <option value="Uncategorized">Uncategorized</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="FanFiction">FanFiction</option>
                </select>
              </FormField>

              <div className="max-w-48">
                <FormField
                  label="Year"
                  value={formData.publication_year}
                  onChange={(v) => handleInputChange('publication_year', v)}
                  placeholder="YYYY"
                />
              </div>

              <FormField
                label="Source URL"
                type="url"
                value={formData.source_url}
                onChange={(v) => handleInputChange('source_url', v)}
                placeholder="https://..."
              />
            </>
          )}

          {activeTab === 'About' && (
            <>
              <FormField
                label={isWishlist ? 'Why this one?' : 'Summary'}
                type="textarea"
                rows={5}
                value={formData.summary}
                onChange={(v) => handleInputChange('summary', v)}
                placeholder={
                  isWishlist ? 'Why do you want to read this?' : 'Title summary or description...'
                }
              />

              <ChipInput
                label="Tags"
                value={formData.tags}
                onChange={(tags) => handleInputChange('tags', tags)}
                placeholder="Add tag..."
                fetchSuggestions={(q) => autocompleteTags(q)}
              />

              {showPairingType && (
                <FormField label="Pairing Type">
                  <select
                    value={formData.ao3_category}
                    onChange={(e) => handleInputChange('ao3_category', e.target.value)}
                    className={selectClasses}
                  >
                    {PAIRING_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}
            </>
          )}

          {activeTab === 'Metadata' && showMetadataTab && (
            <>
              <FormField label="Completion Status">
                <select
                  value={formData.completion_status}
                  onChange={(e) => handleInputChange('completion_status', e.target.value)}
                  className={selectClasses}
                >
                  {COMPLETION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Fandom">
                <SearchableInput
                  value={formData.fandom}
                  onChange={(val) => handleInputChange('fandom', val)}
                  placeholder="e.g., Harry Potter"
                  fetchSuggestions={autocompleteFandoms}
                />
              </FormField>

              <FormField label="Ships">
                <SearchableInput
                  value={formData.ships}
                  onChange={(val) => handleInputChange('ships', val)}
                  placeholder="e.g., Hermione Granger/Draco Malfoy"
                  fetchSuggestions={autocompleteShips}
                />
              </FormField>
              <p className="text-caption text-text-muted -mt-2">Separate multiple ships with commas</p>

              <FormField label="Content Rating">
                <select
                  value={formData.content_rating}
                  onChange={(e) => handleInputChange('content_rating', e.target.value)}
                  className={selectClasses}
                >
                  {CONTENT_RATINGS.map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Warnings">
                <select
                  value={formData.warnings}
                  onChange={(e) => handleInputChange('warnings', e.target.value)}
                  className={selectClasses}
                >
                  {WARNINGS_OPTIONS.map((warning) => (
                    <option key={warning} value={warning}>
                      {warning}
                    </option>
                  ))}
                </select>
              </FormField>
            </>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost" size="md" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="md" onClick={handleSave} loading={saving} disabled={saving}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
