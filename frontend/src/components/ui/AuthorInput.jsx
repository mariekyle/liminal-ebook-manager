import { useState, useEffect, useRef } from 'react'
import { listAuthors } from '../../api'

export default function AuthorInput({
  value,
  onChange,
  placeholder = 'Separate multiple authors with commas',
  className = '',
  autoFocus = false,
}) {
  const [allAuthors, setAllAuthors] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    listAuthors()
      .then((data) => {
        setAllAuthors((data.authors || []).map((a) => a.name))
      })
      .catch((err) => console.error('AuthorInput: failed to load authors', err))
  }, [])

  const parseParts = (str) => str.split(',')
  const getFragment = (str) => {
    const parts = parseParts(str)
    return parts[parts.length - 1].trimStart()
  }
  const getCommitted = (str) => {
    const parts = parseParts(str)
    return parts.slice(0, -1).map((a) => a.trim()).filter((a) => a.length > 0)
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const fragment = getFragment(value).toLowerCase()
      const committed = getCommitted(value).map((a) => a.toLowerCase())

      if (!fragment) {
        setSuggestions([])
        return
      }

      const filtered = allAuthors
        .filter((a) => a.toLowerCase().includes(fragment))
        .filter((a) => !committed.includes(a.toLowerCase()))
        .sort((a, b) => {
          const aStarts = a.toLowerCase().startsWith(fragment)
          const bStarts = b.toLowerCase().startsWith(fragment)
          if (aStarts && !bStarts) return -1
          if (!aStarts && bStarts) return 1
          return a.localeCompare(b)
        })
        .slice(0, 8)

      setSuggestions(filtered)
    }, 150)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, allAuthors])

  const handleChange = (e) => {
    onChange(e.target.value)
    setShowDropdown(true)
  }

  const handleSelect = (author) => {
    const committed = getCommitted(value)
    const newValue = [...committed, author].join(', ')
    onChange(newValue)
    setShowDropdown(false)
    if (inputRef.current) inputRef.current.focus()
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus={autoFocus}
        className={className}
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-[70] left-0 right-0 top-full mt-1 bg-bg-elevated border border-border-default rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((author, idx) => (
            <button
              key={`${author}-${idx}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(author)
              }}
              className="w-full text-left px-4 py-2 min-h-[44px] text-body-sm text-text-secondary hover:bg-bg-surface hover:text-text-primary transition-all duration-200 ease-out"
            >
              {author}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
