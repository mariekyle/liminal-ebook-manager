/**
 * CriteriaBuilder.jsx
 *
 * Phase 9E Day 2: Criteria builder for automatic collections
 *
 * IMPORTANT: Uses INTERNAL database values for queries, not display labels.
 * Both come from useStatusLabels — values match what's stored in titles.status,
 * labels reflect the user's custom names from Settings.
 *
 * All criteria are AND'd together.
 *
 * Location: frontend/src/components/CriteriaBuilder.jsx
 */

import TagsMultiSelect from './TagsMultiSelect'
import FormField from './ui/FormField'
import { useStatusLabels } from '../hooks/useStatusLabels'

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
    <FormField label={label}>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-action-primary appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239a958e' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
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
    </FormField>
  )
}

function WordCountInput({ label, placeholder, value, onChange }) {
  return (
    <FormField label={label}>
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
        className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-action-primary"
      />
    </FormField>
  )
}

export default function CriteriaBuilder({ criteria, onChange }) {
  const { labels, getStatusOptions } = useStatusLabels()

  // Internal DB values with the user's custom display labels, via the shared hook
  const statusOptions = [
    { value: '', label: 'Any status' },
    ...getStatusOptions()
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
      <FormField
        label={
          <>
            Tags <span className="font-normal text-text-muted">(must have ALL selected)</span>
          </>
        }
      >
        <TagsMultiSelect
          selectedTags={criteria.tags || []}
          onChange={(tags) => updateCriteria('tags', tags)}
        />
      </FormField>

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
          label={labels['Finished']}
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
        <div className="flex items-center justify-between pt-2 border-t border-border-default">
          <span className="text-xs text-text-muted">
            {activeCount} rule{activeCount !== 1 ? 's' : ''} active
          </span>
          <button
            type="button"
            onClick={() => onChange({})}
            className="text-xs text-action-danger hover:text-action-danger-hover transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
