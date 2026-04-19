/**
 * SortDropdown - Reusable sort control with direction toggles
 */
import { useState, useEffect, useRef } from 'react'
import Button from './ui/Button'

const SORT_OPTIONS = {
  series: { label: 'Series', ascLabel: 'Grouped', descLabel: 'Grouped' },
  title: { label: 'Title', ascLabel: 'A → Z', descLabel: 'Z → A' },
  read_time: { label: 'Est. Read Time', ascLabel: 'Shortest', descLabel: 'Longest' },
  added: { label: 'Recently Added', ascLabel: 'Oldest', descLabel: 'Newest' },
  published: { label: 'Recently Published', ascLabel: 'Oldest', descLabel: 'Newest' },
  finished: { label: 'Recently Finished', ascLabel: 'Oldest', descLabel: 'Newest' },
  author: { label: 'Author', ascLabel: 'A → Z', descLabel: 'Z → A' },
  custom: { label: 'Custom', ascLabel: '', descLabel: '' },
}

const ChevronUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const SortIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l4 4 4-4M7 8l4-4 4 4" />
  </svg>
)

export default function SortDropdown({
  value,
  direction,
  onChange,
  options = ['title', 'read_time', 'added', 'published', 'finished', 'author'],
  showCustom = false,
  onCustomSelect,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
  const availableOptions = showCustom ? [...options, 'custom'] : options

  const handleOptionClick = (field) => {
    if (field === 'custom') {
      onCustomSelect?.()
      setIsOpen(false)
      return
    }
    if (field === value) {
      onChange(field, direction === 'asc' ? 'desc' : 'asc')
    } else {
      const defaultDesc = ['added', 'published', 'finished'].includes(field)
      onChange(field, defaultDesc ? 'desc' : 'asc')
    }
    setIsOpen(false)
  }

  const handleDirectionClick = (field, dir, e) => {
    e.stopPropagation()
    onChange(field, dir)
    setIsOpen(false)
  }

  const TriggerButton = (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-elevated hover:bg-bg-surface rounded-lg text-body-sm text-text-secondary transition-all duration-200 ease-out ${className}`}
    >
      <SortIcon />
      <span>{currentOption.label}</span>
      {direction === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />}
    </button>
  )

  const DesktopDropdown = (
    <div className="absolute top-full right-0 mt-1 py-1 min-w-[220px] bg-bg-elevated rounded-xl shadow-xl border border-border-default z-50">
      {availableOptions.map((field) => {
        const opt = SORT_OPTIONS[field]
        if (!opt) return null
        const isActive = field === value

        if (field === 'custom') {
          return (
            <div key={field} className="border-t border-border-default mt-1 pt-1">
              <button
                type="button"
                onClick={() => handleOptionClick('custom')}
                className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-bg-surface/80 transition-colors min-h-[44px] ${
                  isActive ? 'bg-action-primary/10' : ''
                }`}
              >
                <span
                  className={`flex items-center gap-2 ${isActive ? 'text-action-primary' : 'text-text-body'}`}
                >
                  {opt.label}
                  <span className="text-[10px] px-1.5 py-0.5 bg-action-warning/15 text-action-warning rounded uppercase font-semibold">
                    Drag to reorder
                  </span>
                </span>
              </button>
            </div>
          )
        }

        return (
          <button
            key={field}
            type="button"
            onClick={() => handleOptionClick(field)}
            className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-bg-surface/80 transition-colors min-h-[44px] ${
              isActive ? 'bg-action-primary/10' : ''
            }`}
          >
            <span className={isActive ? 'text-action-primary' : 'text-text-body'}>{opt.label}</span>
            <div className={`flex items-center gap-0.5 p-0.5 rounded ${isActive ? 'bg-action-primary/10' : ''}`}>
              <button
                type="button"
                onClick={(e) => handleDirectionClick(field, 'asc', e)}
                className={`p-1 rounded transition-colors ${
                  isActive && direction === 'asc' ? 'text-action-primary' : 'text-text-muted hover:text-text-secondary'
                }`}
                title={opt.ascLabel}
              >
                <ChevronUpIcon />
              </button>
              <button
                type="button"
                onClick={(e) => handleDirectionClick(field, 'desc', e)}
                className={`p-1 rounded transition-colors ${
                  isActive && direction === 'desc' ? 'text-action-primary' : 'text-text-muted hover:text-text-secondary'
                }`}
                title={opt.descLabel}
              >
                <ChevronDownIcon />
              </button>
            </div>
          </button>
        )
      })}
    </div>
  )

  const MobileBottomSheet = (
    <>
      <div className="fixed inset-0 bg-bg-overlay z-40" onClick={() => setIsOpen(false)} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-bg-surface rounded-t-2xl border-t border-border-default">
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-border-default rounded-full" />
        </div>
        <div className="px-4 pb-2 text-center">
          <span className="text-label text-text-muted uppercase tracking-wider">Sort By</span>
        </div>
        <div className="px-2 pb-2 max-h-[60vh] overflow-y-auto">
          {availableOptions.map((field) => {
            const opt = SORT_OPTIONS[field]
            if (!opt) return null
            const isActive = field === value

            if (field === 'custom') {
              return (
                <div key={field} className="border-t border-border-default mt-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOptionClick('custom')}
                    className={`w-full px-4 py-3.5 text-left flex items-center justify-between rounded-lg min-h-[48px] ${
                      isActive ? 'bg-action-primary/10' : 'active:bg-bg-elevated'
                    }`}
                  >
                    <span
                      className={`flex items-center gap-2 ${isActive ? 'text-action-primary' : 'text-text-body'}`}
                    >
                      {opt.label}
                      <span className="text-[10px] px-1.5 py-0.5 bg-action-warning/15 text-action-warning rounded uppercase font-semibold">
                        Drag to reorder
                      </span>
                    </span>
                  </button>
                </div>
              )
            }

            return (
              <button
                key={field}
                type="button"
                onClick={() => handleOptionClick(field)}
                className={`w-full px-4 py-3.5 text-left flex items-center justify-between rounded-lg min-h-[48px] ${
                  isActive ? 'bg-action-primary/10' : 'active:bg-bg-elevated'
                }`}
              >
                <span className={isActive ? 'text-action-primary' : 'text-text-body'}>{opt.label}</span>
                <div className={`flex items-center gap-1 p-1 rounded ${isActive ? 'bg-action-primary/10' : ''}`}>
                  <button
                    type="button"
                    onClick={(e) => handleDirectionClick(field, 'asc', e)}
                    className={`p-1.5 rounded transition-colors ${
                      isActive && direction === 'asc' ? 'text-action-primary' : 'text-text-muted'
                    }`}
                  >
                    <ChevronUpIcon />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDirectionClick(field, 'desc', e)}
                    className={`p-1.5 rounded transition-colors ${
                      isActive && direction === 'desc' ? 'text-action-primary' : 'text-text-muted'
                    }`}
                  >
                    <ChevronDownIcon />
                  </button>
                </div>
              </button>
            )
          })}
        </div>
        <div className="p-4 border-t border-border-subtle">
          <Button type="button" variant="secondary" className="w-full" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <div ref={dropdownRef} className="relative">
      {TriggerButton}
      {isOpen && (isMobile ? MobileBottomSheet : DesktopDropdown)}
    </div>
  )
}
