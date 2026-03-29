import { useState, useRef, useCallback } from 'react'
import FormField from './FormField'

/**
 * ChipInput — multi-value field: input on top, chips below.
 * Enter or comma adds a chip (normalized to lowercase). Optional fetchSuggestions(query) for async suggestions.
 */
export default function ChipInput({
  label,
  value = [],
  onChange,
  placeholder = '',
  suggestions: staticSuggestions = null,
  fetchSuggestions = null,
  error,
}) {
  const [inputValue, setInputValue] = useState('')
  const [dropdown, setDropdown] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const timeoutRef = useRef(null)

  const addChip = useCallback(
    (raw) => {
      const chip = String(raw).trim().toLowerCase()
      if (!chip || value.includes(chip)) return
      onChange([...value, chip])
      setInputValue('')
      setDropdown([])
      setShowDropdown(false)
    },
    [value, onChange],
  )

  const removeChip = useCallback(
    (chip) => {
      onChange(value.filter((c) => c !== chip))
    },
    [value, onChange],
  )

  const handleInputChange = (e) => {
    const val = e.target.value
    setInputValue(val)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (staticSuggestions && val.trim()) {
      const f = staticSuggestions.filter(
        (s) => s.toLowerCase().includes(val.toLowerCase()) && !value.includes(s.toLowerCase()),
      )
      setDropdown(f.slice(0, 8))
      setShowDropdown(f.length > 0)
      return
    }

    if (fetchSuggestions && val.trim().length > 0) {
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await fetchSuggestions(val)
          const list = Array.isArray(result) ? result : result?.items || []
          const seen = new Set(value)
          const orig = []
          for (const item of list) {
            const s = String(item).toLowerCase()
            if (seen.has(s)) continue
            seen.add(s)
            orig.push(s)
            if (orig.length >= 8) break
          }
          setDropdown(orig)
          setShowDropdown(orig.length > 0)
        } catch (err) {
          console.error('ChipInput suggestions:', err)
          setDropdown([])
          setShowDropdown(false)
        }
      }, 200)
    } else {
      setDropdown([])
      setShowDropdown(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) addChip(inputValue)
      return
    }
    if (e.key === ',') {
      e.preventDefault()
      const v = inputValue.replace(/,/g, '').trim()
      if (v) addChip(v)
    }
  }

  const inputClasses = `w-full h-11 px-3 rounded-lg text-body-sm text-text-primary bg-bg-surface border
    transition-[border-color] duration-200 ease-out placeholder:text-text-muted font-[inherit]
    focus:outline-none focus:ring-[3px] focus:ring-action-primary/15 ${
      error
        ? 'border-action-danger focus:border-action-danger focus:ring-action-danger/15'
        : 'border-border-default focus:border-action-primary'
    }`

  return (
    <FormField label={label} error={typeof error === 'string' ? error : undefined}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => dropdown.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={placeholder}
          className={inputClasses}
          autoComplete="off"
        />

        {showDropdown && dropdown.length > 0 && (
          <div className="absolute z-[60] w-full mt-1 bg-bg-elevated border border-border-default rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {dropdown.map((item, i) => (
              <button
                key={`${item}-${i}`}
                type="button"
                onMouseDown={(ev) => {
                  ev.preventDefault()
                  addChip(item)
                }}
                className="w-full text-left px-3 py-2 min-h-[44px] text-body-sm text-text-secondary hover:bg-bg-surface hover:text-text-primary transition-all duration-200 ease-out"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {value.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {value.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1.5 bg-bg-elevated text-text-secondary rounded-lg px-3 py-1 text-body-sm"
              >
                {chip}
                <button
                  type="button"
                  onClick={() => removeChip(chip)}
                  className="min-w-[44px] min-h-[44px] -m-2 p-2 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors duration-200 ease-out"
                  aria-label={`Remove ${chip}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </FormField>
  )
}
