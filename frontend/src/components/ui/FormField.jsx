import { forwardRef } from 'react'

/**
 * FormField — Label + input/textarea with error state
 *
 * Usage:
 *   <FormField label="Title" value={title} onChange={setTitle} />
 *   <FormField label="Summary" type="textarea" rows={3} value={summary} onChange={setSummary} />
 *   <FormField label="Email" error="Required field" value={email} onChange={setEmail} />
 *   <FormField label="Author" placeholder="Enter author name" value={author} onChange={setAuthor} />
 */

const FormField = forwardRef(function FormField(
  {
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    rows = 3,
    disabled = false,
    className = '',
    ...props
  },
  ref,
) {
  const inputClasses = `w-full bg-bg-elevated border rounded-lg text-text-primary text-sm font-[inherit] transition-[border-color] duration-[200ms] ease-out placeholder:text-text-muted focus:outline-none focus:ring-[3px] focus:ring-action-primary/15 ${
    error
      ? 'border-action-danger focus:border-action-danger focus:ring-action-danger/15'
      : 'border-border-default focus:border-border-focus'
  } ${disabled ? 'opacity-40 pointer-events-none' : ''}`

  const handleChange = (e) => {
    if (onChange) onChange(e.target.value)
  }

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-body mb-1.5">
          {label}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          ref={ref}
          value={value ?? ''}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={`${inputClasses} min-h-[88px] py-2.5 px-3 resize-y`}
          {...props}
        />
      ) : (
        <input
          ref={ref}
          type={type}
          value={value ?? ''}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`${inputClasses} h-11 px-3`}
          {...props}
        />
      )}

      {error && (
        <p className="mt-1.5 text-xs text-action-danger">{error}</p>
      )}
    </div>
  )
})

export default FormField
