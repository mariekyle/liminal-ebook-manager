/**
 * SortDropdown - Reusable sort control with direction toggles
 * 
 * Features:
 * - Desktop: Dropdown with inline direction toggles
 * - Mobile: Bottom sheet (< 768px)
 * - Shows current sort + direction in trigger button
 * - Optional "Custom" sort for drag-drop (collections only)
 */
import { useState, useEffect, useRef } from 'react'

// Sort option definitions
const SORT_OPTIONS = {
  title: { label: 'Title', ascLabel: 'A → Z', descLabel: 'Z → A' },
  read_time: { label: 'Est. Read Time', ascLabel: 'Shortest', descLabel: 'Longest' },
  added: { label: 'Recently Added', ascLabel: 'Oldest', descLabel: 'Newest' },
  published: { label: 'Recently Published', ascLabel: 'Oldest', descLabel: 'Newest' },
  finished: { label: 'Recently Finished', ascLabel: 'Oldest', descLabel: 'Newest' },
  author: { label: 'Author', ascLabel: 'A → Z', descLabel: 'Z → A' },
  custom: { label: 'Custom', ascLabel: '', descLabel: '' }
}

// Icons
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

export default function SortDropdown({
  value,           // Current sort field
  direction,       // 'asc' or 'desc'
  onChange,        // (field, direction) => void
  options = ['title', 'read_time', 'added', 'published', 'finished', 'author'],
  showCustom = false,  // Show "Custom" option (for collections)
  onCustomSelect,      // Callback when Custom is selected (enters reorder mode)
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const dropdownRef = useRef(null)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close on outside click
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

  // Close on Escape
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
    
    // If same field, toggle direction; otherwise use default direction
    if (field === value) {
      onChange(field, direction === 'asc' ? 'desc' : 'asc')
    } else {
      // Default directions: 'added', 'published', 'finished' default to desc (newest first)
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

  // Trigger button
  const TriggerButton = (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors ${className}`}
    >
      <span>{currentOption.label}</span>
      {direction === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />}
    </button>
  )

  // Desktop Dropdown
  const DesktopDropdown = (
    <div className="absolute top-full right-0 mt-1 py-1 min-w-[220px] bg-gray-800 rounded-xl shadow-xl border border-gray-700 z-50">
      {availableOptions.map((field) => {
        const opt = SORT_OPTIONS[field]
        if (!opt) return null
        const isActive = field === value

        if (field === 'custom') {
          return (
            <div key={field} className="border-t border-gray-700 mt-1 pt-1">
              <button
                onClick={() => handleOptionClick('custom')}
                className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-700/50 transition-colors ${
                  isActive ? 'bg-teal-500/10' : ''
                }`}
              >
                <span className={`flex items-center gap-2 ${isActive ? 'text-teal-400' : 'text-gray-200'}`}>
                  {opt.label}
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded uppercase font-semibold">
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
            onClick={() => handleOptionClick(field)}
            className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-700/50 transition-colors ${
              isActive ? 'bg-teal-500/10' : ''
            }`}
          >
            <span className={isActive ? 'text-teal-400' : 'text-gray-200'}>
              {opt.label}
            </span>
            
            {/* Direction toggles */}
            <div className={`flex items-center gap-0.5 p-0.5 rounded ${isActive ? 'bg-teal-500/10' : ''}`}>
              <button
                onClick={(e) => handleDirectionClick(field, 'asc', e)}
                className={`p-1 rounded transition-colors ${
                  isActive && direction === 'asc' 
                    ? 'text-teal-400' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                title={opt.ascLabel}
              >
                <ChevronUpIcon />
              </button>
              <button
                onClick={(e) => handleDirectionClick(field, 'desc', e)}
                className={`p-1 rounded transition-colors ${
                  isActive && direction === 'desc' 
                    ? 'text-teal-400' 
                    : 'text-gray-500 hover:text-gray-300'
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

  // Mobile Bottom Sheet
  const MobileBottomSheet = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-40"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-gray-900 rounded-t-2xl">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>
        
        {/* Title */}
        <div className="px-4 pb-2 text-center">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Sort By</span>
        </div>
        
        {/* Options */}
        <div className="px-2 pb-2 max-h-[60vh] overflow-y-auto">
          {availableOptions.map((field) => {
            const opt = SORT_OPTIONS[field]
            if (!opt) return null
            const isActive = field === value

            if (field === 'custom') {
              return (
                <div key={field} className="border-t border-gray-700 mt-2 pt-2">
                  <button
                    onClick={() => handleOptionClick('custom')}
                    className={`w-full px-4 py-3.5 text-left flex items-center justify-between rounded-lg ${
                      isActive ? 'bg-teal-500/10' : 'active:bg-gray-800'
                    }`}
                  >
                    <span className={`flex items-center gap-2 ${isActive ? 'text-teal-400' : 'text-gray-200'}`}>
                      {opt.label}
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded uppercase font-semibold">
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
                onClick={() => handleOptionClick(field)}
                className={`w-full px-4 py-3.5 text-left flex items-center justify-between rounded-lg ${
                  isActive ? 'bg-teal-500/10' : 'active:bg-gray-800'
                }`}
              >
                <span className={isActive ? 'text-teal-400' : 'text-gray-200'}>
                  {opt.label}
                </span>
                
                {/* Direction toggles */}
                <div className={`flex items-center gap-1 p-1 rounded ${isActive ? 'bg-teal-500/10' : ''}`}>
                  <button
                    onClick={(e) => handleDirectionClick(field, 'asc', e)}
                    className={`p-1.5 rounded transition-colors ${
                      isActive && direction === 'asc' 
                        ? 'text-teal-400' 
                        : 'text-gray-500'
                    }`}
                  >
                    <ChevronUpIcon />
                  </button>
                  <button
                    onClick={(e) => handleDirectionClick(field, 'desc', e)}
                    className={`p-1.5 rounded transition-colors ${
                      isActive && direction === 'desc' 
                        ? 'text-teal-400' 
                        : 'text-gray-500'
                    }`}
                  >
                    <ChevronDownIcon />
                  </button>
                </div>
              </button>
            )
          })}
        </div>
        
        {/* Cancel button */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div ref={dropdownRef} className="relative">
      {TriggerButton}
      
      {isOpen && (
        isMobile ? MobileBottomSheet : DesktopDropdown
      )}
    </div>
  )
}
