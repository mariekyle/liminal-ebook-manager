/**
 * SortDropdown — reusable sort control: trigger + desktop dropdown +
 * mobile bottom sheet (single option-list body, CSS variant split).
 * Stays in-tree — no portal; the single-ref outside-click containment
 * depends on it.
 *
 * Option rows display selection intrinsically (tinted row + current
 * direction label + glyph). Rows are bespoke by decision (2026-07-24):
 * MenuItem's contract excludes selected state, so selection styling
 * lives container-side here.
 *
 * Props:
 *   value, direction — controlled selection state ('asc' | 'desc')
 *   onChange(field, direction) — every selection tap closes the menu
 *   options — required array of SORT_OPTIONS keys (no default)
 *   className — extra classes for the trigger button
 */
import { useState, useEffect, useRef } from 'react'
import Button from './Button'

const SORT_OPTIONS = {
  series: { label: 'Series', ascLabel: 'A → Z', descLabel: 'Z → A' },
  title: { label: 'Title', ascLabel: 'A → Z', descLabel: 'Z → A' },
  added: { label: 'Recently Added', ascLabel: 'Oldest', descLabel: 'Newest' },
  published: { label: 'Recently Published', ascLabel: 'Oldest', descLabel: 'Newest' },
  finished: { label: 'Recently Finished', ascLabel: 'Oldest', descLabel: 'Newest' },
  author: { label: 'Author', ascLabel: 'A → Z', descLabel: 'Z → A' },
}

// Recency sorts open newest-first; everything else A→Z / oldest-first.
// Exported so consumers re-deriving a default direction (AuthorDetail's
// localStorage restore) share this list instead of duplicating it.
export function defaultSortDirection(field) {
  return ['added', 'published', 'finished'].includes(field) ? 'desc' : 'asc'
}

const ChevronUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
)

const ChevronDownIcon = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const SortIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l4 4 4-4M7 8l4-4 4 4" />
  </svg>
)

export default function SortDropdown({ value, direction, onChange, options, className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const currentOption = SORT_OPTIONS[value] || SORT_OPTIONS.title

  const handleOptionClick = (field) => {
    if (field === value) {
      onChange(field, direction === 'asc' ? 'desc' : 'asc')
    } else {
      onChange(field, defaultSortDirection(field))
    }
    setIsOpen(false)
  }

  // One row body for both containers: base classes are the sheet's,
  // md: overrides are the dropdown's.
  const optionRows = options.map((field) => {
    const opt = SORT_OPTIONS[field]
    if (!opt) return null
    const isActive = field === value

    return (
      <button
        key={field}
        type="button"
        role="option"
        aria-selected={isActive}
        onClick={() => handleOptionClick(field)}
        className={`w-full px-4 py-3.5 md:py-2.5 min-h-[48px] md:min-h-[44px] text-left flex items-center justify-between rounded-lg md:rounded-none md:transition-colors ${
          isActive ? 'bg-action-primary/10' : 'max-md:active:bg-bg-surface md:hover:bg-bg-surface/80'
        }`}
      >
        <span className={isActive ? 'text-action-primary' : 'text-text-body'}>{opt.label}</span>
        {isActive && (
          <span className="flex items-center gap-1 text-body-sm text-action-primary">
            {direction === 'asc' ? opt.ascLabel : opt.descLabel}
            <ChevronDownIcon className={direction === 'asc' ? 'rotate-180' : ''} />
          </span>
        )}
      </button>
    )
  })

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 min-h-[44px] bg-bg-elevated hover:bg-bg-surface rounded-lg text-body-sm text-text-secondary transition-all duration-200 ease-out ${className}`}
      >
        <SortIcon />
        <span>{currentOption.label}</span>
        {direction === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </button>

      {isOpen && (
        <>
          {/* Desktop dropdown */}
          <div
            role="listbox"
            className="hidden md:block absolute top-full right-0 mt-1 py-1 min-w-[220px] bg-bg-elevated rounded-xl shadow-xl border border-border-default z-50"
          >
            {optionRows}
          </div>

          {/* Mobile bottom sheet — in-tree fixed pair (backdrop z-40,
              sheet z-50); stacking verified clean on all four consumer
              surfaces, so no portal and no second containment ref */}
          <div className="md:hidden">
            <div className="fixed inset-0 bg-bg-overlay z-40" onClick={() => setIsOpen(false)} />
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-x-0 bottom-0 z-50 bg-bg-elevated rounded-t-2xl border-t border-border-default"
            >
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-border-default rounded-full" />
              </div>
              <div className="px-4 pb-2 text-center">
                <span className="text-label text-text-muted uppercase tracking-wider">Sort By</span>
              </div>
              <div role="listbox" className="px-2 pb-2 max-h-[60vh] overflow-y-auto">
                {optionRows}
              </div>
              <div className="p-4 border-t border-border-subtle">
                <Button type="button" variant="secondary" className="w-full" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
