import { useState, useEffect, useRef } from 'react'
import { updateBookMetadata, listSeries, uploadCover, deleteCover, extractCover } from '../api'
import AuthorChips from './AuthorChips'
import GradientCover from './GradientCover'

function EditBookModal({ book, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    authors: [],
    series: '',
    series_number: '',
    category: '',
    publication_year: '',
    source_url: '',
    completion_status: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [allSeries, setAllSeries] = useState([])
  const [seriesSuggestions, setSeriesSuggestions] = useState([])
  const [showSeriesSuggestions, setShowSeriesSuggestions] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverError, setCoverError] = useState('')
  // Local book state for cover updates (so we can update the preview without closing modal)
  const [localBook, setLocalBook] = useState(book)
  const modalRef = useRef(null)

  // Initialize form when book changes or modal opens
  useEffect(() => {
    if (book && isOpen) {
      setFormData({
        title: book.title || '',
        authors: book.authors || ['Unknown Author'],
        series: book.series || '',
        series_number: book.series_number || '',
        category: book.category || '',
        publication_year: book.publication_year?.toString() || '',
        source_url: book.source_url || '',
        completion_status: book.completion_status || ''
      })
      setLocalBook(book)
      setError(null)
      setCoverError('')
      setShowSeriesSuggestions(false)
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

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  // Handle escape key
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSeriesInput = (value) => {
    setFormData(prev => ({ ...prev, series: value }))
    
    if (value.trim().length > 0) {
      const filtered = allSeries.filter(s =>
        s.toLowerCase().includes(value.toLowerCase())
      )
      setSeriesSuggestions(filtered.slice(0, 8))
      setShowSeriesSuggestions(filtered.length > 0)
    } else {
      setSeriesSuggestions([])
      setShowSeriesSuggestions(false)
    }
  }

  const handleSeriesSelect = (selectedSeries) => {
    setFormData(prev => ({ ...prev, series: selectedSeries }))
    setShowSeriesSuggestions(false)
    setSeriesSuggestions([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }
    
    if (formData.authors.length === 0) {
      setError('At least one author is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const updateData = {
        title: formData.title.trim(),
        authors: formData.authors,
        series: formData.series.trim(),
        series_number: formData.series_number.trim(),
        category: formData.category,
        publication_year: formData.publication_year ? parseInt(formData.publication_year, 10) : 0,
        source_url: formData.source_url.trim() || null,
        completion_status: formData.completion_status || null
      }

      const updatedBook = await updateBookMetadata(localBook.id, updateData)
      // Merge cover info from localBook (in case cover was updated during this session)
      const mergedBook = {
        ...updatedBook,
        has_cover: localBook?.has_cover,
        cover_path: localBook?.cover_path,
        cover_source: localBook?.cover_source
      }
      onSave(mergedBook)
      onClose()
    } catch (err) {
      console.error('Failed to update book:', err)
      setError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Cover upload handler
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setCoverError('Please upload a JPEG, PNG, WebP, or GIF image')
      return
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setCoverError('Image must be under 10MB')
      return
    }
    
    setCoverUploading(true)
    setCoverError('')
    
    try {
      const result = await uploadCover(localBook.id, file)
      // Update local book state with new cover info
      const updatedBook = {
        ...localBook,
        has_cover: true,
        cover_path: result.cover_path,
        cover_source: 'custom'
      }
      setLocalBook(updatedBook)
      // Notify parent of the update
      if (onSave) {
        onSave(updatedBook)
      }
    } catch (err) {
      setCoverError(err.message || 'Failed to upload cover')
    } finally {
      setCoverUploading(false)
      // Clear file input
      e.target.value = ''
    }
  }
  
  // Cover delete handler
  const handleDeleteCover = async () => {
    if (!confirm('Remove custom cover? Will revert to extracted cover or gradient.')) {
      return
    }
    
    setCoverUploading(true)
    setCoverError('')
    
    try {
      const result = await deleteCover(localBook.id)
      // Update local book state with reverted cover info
      const updatedBook = {
        ...localBook,
        has_cover: result.has_cover ?? false,
        cover_path: result.cover_path ?? null,
        cover_source: result.cover_source ?? null
      }
      setLocalBook(updatedBook)
      // Notify parent of the update
      if (onSave) {
        onSave(updatedBook)
      }
    } catch (err) {
      setCoverError(err.message || 'Failed to delete cover')
    } finally {
      setCoverUploading(false)
    }
  }
  
  // Extract cover from EPUB handler
  const handleExtractCover = async () => {
    setCoverUploading(true)
    setCoverError('')
    
    try {
      const result = await extractCover(localBook.id)
      if (result.extracted) {
        // Update local book state with extracted cover info
        const updatedBook = {
          ...localBook,
          has_cover: true,
          cover_path: result.cover_path,
          cover_source: 'extracted'
        }
        setLocalBook(updatedBook)
        // Notify parent of the update
        if (onSave) {
          onSave(updatedBook)
        }
      } else {
        setCoverError(result.message || 'No cover found in EPUB')
      }
    } catch (err) {
      setCoverError(err.message || 'Failed to extract cover')
    } finally {
      setCoverUploading(false)
    }
  }

  if (!isOpen || !localBook) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-40" />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="bg-library-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Edit Book Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-200 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            {/* Cover Section */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Cover Image
              </label>
              <div className="flex gap-4">
                {/* Cover preview */}
                <div className="flex-shrink-0">
                  <GradientCover book={localBook} size="md" />
                </div>
                
                {/* Cover controls */}
                <div className="flex flex-col gap-2 justify-center">
                  {/* Current cover source indicator */}
                  {localBook.cover_source && (
                    <span className={`text-xs px-2 py-0.5 rounded w-fit ${
                      localBook.cover_source === 'custom' 
                        ? 'bg-blue-600/30 text-blue-300' 
                        : 'bg-green-600/30 text-green-300'
                    }`}>
                      {localBook.cover_source === 'custom' ? 'Custom cover' : 'Extracted from EPUB'}
                    </span>
                  )}
                  {!localBook.has_cover && (
                    <span className="text-xs px-2 py-0.5 rounded w-fit bg-gray-600/30 text-gray-400">
                      Using gradient
                    </span>
                  )}
                  
                  {/* Upload input */}
                  <div className="flex items-center gap-2">
                    <label className={`
                      px-3 py-1.5 rounded text-sm cursor-pointer
                      ${coverUploading 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'}
                    `}>
                      {coverUploading ? 'Uploading...' : 'Upload Cover'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleCoverUpload}
                        disabled={coverUploading}
                        className="hidden"
                      />
                    </label>
                    
                    {/* Extract from EPUB button */}
                    {!localBook.has_cover && (
                      <button
                        type="button"
                        onClick={handleExtractCover}
                        disabled={coverUploading}
                        className="px-3 py-1.5 rounded text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50"
                      >
                        Extract from EPUB
                      </button>
                    )}
                  </div>
                  
                  {/* Delete cover button */}
                  {localBook.cover_source === 'custom' && (
                    <button
                      type="button"
                      onClick={handleDeleteCover}
                      disabled={coverUploading}
                      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 text-left"
                    >
                      Remove custom cover
                    </button>
                  )}
                  
                  {/* Error message */}
                  {coverError && (
                    <p className="text-sm text-red-400">{coverError}</p>
                  )}
                  
                  {/* Help text */}
                  <p className="text-xs text-gray-500">
                    JPEG, PNG, WebP, or GIF. Max 10MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none"
                required
              />
            </div>

            {/* Authors */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Authors
              </label>
              <AuthorChips
                authors={formData.authors}
                onChange={(authors) => handleInputChange('authors', authors)}
              />
            </div>

            {/* Series row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 relative">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Series
                </label>
                <input
                  type="text"
                  value={formData.series}
                  onChange={(e) => handleSeriesInput(e.target.value)}
                  onFocus={() => {
                    if (formData.series && seriesSuggestions.length > 0) {
                      setShowSeriesSuggestions(true)
                    }
                  }}
                  onBlur={() => {
                    // Delay to allow click on suggestion
                    setTimeout(() => setShowSeriesSuggestions(false), 200)
                  }}
                  placeholder="None"
                  className="w-full bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none"
                  autoComplete="off"
                />
                
                {/* Series Autocomplete Dropdown */}
                {showSeriesSuggestions && seriesSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {seriesSuggestions.map((s, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSeriesSelect(s)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Number
                </label>
                <input
                  type="text"
                  value={formData.series_number}
                  onChange={(e) => handleInputChange('series_number', e.target.value)}
                  placeholder="#"
                  className="w-full bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Category and Year row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none cursor-pointer"
                >
                  <option value="">Uncategorized</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="FanFiction">FanFiction</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Publication Year
                </label>
                <input
                  type="number"
                  value={formData.publication_year}
                  onChange={(e) => handleInputChange('publication_year', e.target.value)}
                  placeholder="YYYY"
                  min="1000"
                  max="2100"
                  className="w-full bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none"
                />
              </div>
            </div>

            {/* FanFiction-specific fields */}
            {formData.category === 'FanFiction' && (
              <>
                {/* Completion Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Completion Status
                  </label>
                  <div className="flex gap-2">
                    {['Complete', 'WIP', 'Abandoned'].map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleInputChange('completion_status', 
                          formData.completion_status === status ? '' : status
                        )}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          formData.completion_status === status
                            ? 'bg-library-accent text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Source URL
                  </label>
                  <input
                    type="url"
                    value={formData.source_url}
                    onChange={(e) => handleInputChange('source_url', e.target.value)}
                    placeholder="https://archiveofourown.org/works/..."
                    className="w-full bg-library-card px-3 py-2 rounded text-white border border-gray-600 focus:border-library-accent focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`
                  px-4 py-2 rounded font-medium
                  ${saving 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-library-accent hover:opacity-90'
                  }
                  text-white transition-opacity
                `}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default EditBookModal
