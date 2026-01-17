/**
 * CriteriaBuilder.jsx
 * 
 * Phase 9E Day 2: Criteria builder for automatic collections
 * 
 * IMPORTANT: Uses INTERNAL database values for queries, not display labels.
 * Database stores: 'Unread', 'In Progress', 'Finished', 'Abandoned'
 * User can customize display labels in settings.
 * 
 * All criteria are AND'd together.
 * 
 * Location: frontend/src/components/CriteriaBuilder.jsx
 */

import { useState, useEffect } from 'react'
import TagsMultiSelect from './TagsMultiSelect'
import { getSettings } from '../api'

// Internal database values - these MUST match what's stored in titles.status
const INTERNAL_STATUS_VALUES = {
  UNREAD: 'Unread',
  IN_PROGRESS: 'In Progress',
  FINISHED: 'Finished',
  ABANDONED: 'Abandoned'
}

// Default labels (used if settings not loaded)
const DEFAULT_STATUS_LABELS = {
  'Unread': 'Unread',
  'In Progress': 'In Progress',
  'Finished': 'Finished',
  'Abandoned': 'Abandoned'
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'Any category' },
  { value: 'Fiction', label: 'Fiction' },
  { value: 'Non-Fiction', label: 'Non-Fiction' },
  { value: 'FanFiction', label: 'FanFiction' }
]

const RATING_OPTIONS = [
  { value: '', label: 'Any rating' },
  { value: '1', label: '1+ stars' },
  { value: '2', label: '2+ stars' },
  { value: '3', label: '3+ stars' },
  { value: '4', label: '4+ stars' },
  { value: '5', label: '5 stars only' }
]

const FINISHED_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'this_year', label: 'This year' },
  { value: 'last_year', label: 'Last year' }
]

function CriteriaDropdown({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {label}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-library-accent appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem'
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function WordCountInput({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {label}
      </label>
      <input
        type="number"
        min="0"
        step="1000"
        value={value || ''}
        onChange={(e) => {
          const val = e.target.value
          onChange(val ? parseInt(val, 10) : null)
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-library-accent"
      />
    </div>
  )
}

export default function CriteriaBuilder({ criteria, onChange }) {
  const [statusLabels, setStatusLabels] = useState(DEFAULT_STATUS_LABELS)
  
  // Fetch custom status labels from settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings()
        // Settings come as array of {key, value} or object
        const settingsMap = Array.isArray(settings) 
          ? settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {})
          : settings
        
        // Map settings keys to internal status values
        // IMPORTANT: Settings keys are:
        // - status_label_unread
        // - status_label_in_progress
        // - status_label_finished
        // - status_label_dnf (NOT status_label_abandoned!)
        setStatusLabels({
          'Unread': settingsMap.status_label_unread || 'Unread',
          'In Progress': settingsMap.status_label_in_progress || 'In Progress',
          'Finished': settingsMap.status_label_finished || 'Finished',
          'Abandoned': settingsMap.status_label_dnf || 'Abandoned'  // NOTE: key is 'dnf'
        })
      } catch (err) {
        console.error('Failed to load status labels:', err)
        // Keep defaults on error
      }
    }
    loadSettings()
  }, [])

  // Build status options using internal values but custom labels
  const statusOptions = [
    { value: '', label: 'Any status' },
    { value: INTERNAL_STATUS_VALUES.FINISHED, label: statusLabels['Finished'] },
    { value: INTERNAL_STATUS_VALUES.IN_PROGRESS, label: statusLabels['In Progress'] },
    { value: INTERNAL_STATUS_VALUES.ABANDONED, label: statusLabels['Abandoned'] },
    { value: INTERNAL_STATUS_VALUES.UNREAD, label: statusLabels['Unread'] }
  ]

  const updateCriteria = (key, value) => {
    const updated = { ...criteria }
    if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      delete updated[key]
    } else {
      updated[key] = value
    }
    onChange(updated)
  }

  const activeCount = Object.keys(criteria).length

  return (
    <div className="space-y-3">
      {/* Tags FIRST - most commonly used for smart collections */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Tags <span className="text-gray-500">(must have ALL selected)</span>
        </label>
        <TagsMultiSelect
          selectedTags={criteria.tags || []}
          onChange={(tags) => updateCriteria('tags', tags)}
        />
      </div>

      {/* Row 1: Status & Category */}
      <div className="grid grid-cols-2 gap-3">
        <CriteriaDropdown
          label="Reading Status"
          value={criteria.status}
          options={statusOptions}
          onChange={(v) => updateCriteria('status', v)}
        />
        <CriteriaDropdown
          label="Category"
          value={criteria.category}
          options={CATEGORY_OPTIONS}
          onChange={(v) => updateCriteria('category', v)}
        />
      </div>

      {/* Row 2: Rating & Finished */}
      <div className="grid grid-cols-2 gap-3">
        <CriteriaDropdown
          label="Minimum Rating"
          value={criteria.rating_min?.toString()}
          options={RATING_OPTIONS}
          onChange={(v) => updateCriteria('rating_min', v ? parseInt(v, 10) : null)}
        />
        <CriteriaDropdown
          label="Finished"
          value={criteria.finished}
          options={FINISHED_OPTIONS}
          onChange={(v) => updateCriteria('finished', v)}
        />
      </div>

      {/* Row 3: Word Count Range */}
      <div className="grid grid-cols-2 gap-3">
        <WordCountInput
          label="Min Words"
          placeholder="e.g. 10000"
          value={criteria.word_count_min}
          onChange={(v) => updateCriteria('word_count_min', v)}
        />
        <WordCountInput
          label="Max Words"
          placeholder="e.g. 100000"
          value={criteria.word_count_max}
          onChange={(v) => updateCriteria('word_count_max', v)}
        />
      </div>

      {/* Criteria summary */}
      {activeCount > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
          <span className="text-xs text-gray-500">
            {activeCount} rule{activeCount !== 1 ? 's' : ''} active
          </span>
          <button
            type="button"
            onClick={() => onChange({})}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
