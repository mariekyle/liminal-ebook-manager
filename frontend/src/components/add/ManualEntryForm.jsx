/**
 * ManualEntryForm.jsx
 * 
 * Form for manually adding books to library (physical, audiobook, web-based)
 */

import { useState } from 'react'

export default function ManualEntryForm({ onSubmit, onCancel, isSubmitting }) {
  const [form, setForm] = useState({
    title: '',
    author: '',
    series: '',
    seriesNumber: '',
    category: 'FanFiction',
    format: 'physical',
    sourceUrl: '',
    completionStatus: '',
  })
  
  const [errors, setErrors] = useState({})
  
  const showFanficFields = form.category === 'FanFiction'
  const showUrlField = form.format === 'web' || showFanficFields
  
  const validate = () => {
    const newErrors = {}
    if (!form.title.trim()) newErrors.title = 'Title is required'
    if (!form.author.trim()) newErrors.author = 'Author is required'
    if (form.format === 'web' && !form.sourceUrl.trim()) {
      newErrors.sourceUrl = 'URL is required for web-based books'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    
    onSubmit({
      title: form.title.trim(),
      authors: [form.author.trim()],
      series: form.series.trim() || null,
      series_number: form.seriesNumber.trim() || null,
      category: form.category,
      format: form.format,
      source_url: form.sourceUrl.trim() || null,
      completion_status: form.completionStatus || null,
      is_tbr: false,
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
        <h1 className="text-2xl font-bold text-white mb-2">Another Format</h1>
        <p className="text-gray-400">What do you know about it?</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        {/* Format */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Format</label>
          <div className="flex gap-2">
            {[
              { value: 'physical', label: 'Physical' },
              { value: 'audiobook', label: 'Audiobook' },
              { value: 'web', label: 'Web/URL' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateForm('format', opt.value)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  form.format === opt.value
                    ? 'bg-library-accent text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {form.format === 'web' && (
            <p className="text-gray-500 text-sm mt-2 italic">Choose this option for web-based works</p>
          )}
        </div>
        
        {/* Title */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateForm('title', e.target.value)}
            placeholder="What's it called?"
            className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-library-accent ${
              errors.title ? 'border-red-500' : 'border-gray-700'
            }`}
          />
          {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
        </div>
        
        {/* Author */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Author *</label>
          <input
            type="text"
            value={form.author}
            onChange={(e) => updateForm('author', e.target.value)}
            placeholder="Who wrote it?"
            className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-library-accent ${
              errors.author ? 'border-red-500' : 'border-gray-700'
            }`}
          />
          {errors.author && <p className="text-red-400 text-sm mt-1">{errors.author}</p>}
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
            className="flex-1 bg-library-accent text-white py-3 rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add to Library'}
          </button>
        </div>
      </form>
    </div>
  )
}
