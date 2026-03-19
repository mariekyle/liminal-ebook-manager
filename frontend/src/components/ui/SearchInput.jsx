import { useState, useRef, useEffect } from 'react'

/**
 * SearchInput — Search field with clear button and loading state
 *
 * Usage:
 *   <SearchInput
 *     value={search}
 *     onChange={setSearch}
 *     placeholder="Search your library..."
 *     loading={isSearching}
 *   />
 */
export default function SearchInput({
  value = '',
  onChange,
  placeholder = 'Search your library...',
  loading = false,
  autoFocus = false,
  className = '',
  ...props
}) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search icon */}
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </span>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 bg-bg-elevated border border-border-default rounded-lg text-text-primary text-sm pl-10 pr-10 font-[inherit] transition-[border-color] duration-[200ms] ease-out placeholder:text-text-muted focus:outline-none focus:border-border-focus focus:ring-[3px] focus:ring-action-primary/15"
        {...props}
      />

      {/* Clear button or loading spinner */}
      {loading ? (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          <span className="block w-[18px] h-[18px] border-2 border-action-primary/30 border-t-action-primary rounded-full animate-spin" />
        </span>
      ) : value ? (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-bg-surface text-text-muted rounded hover:text-text-primary transition-colors duration-[200ms] ease-out"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  )
}

