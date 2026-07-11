/**
 * Toast notification component
 *
 * Props:
 *   toast: { message: string, type: 'success' | 'error' | 'loading' }
 *
 * The outer div is a persistent polite live region (role="status") — it must
 * stay mounted even while there is no toast, or screen readers miss the
 * announcement when one appears. Render <Toast toast={toast} /> unconditionally
 * and gate only the `toast` value, never the component itself.
 */
export default function Toast({ toast }) {
  const bgColor = toast
    ? {
        success: 'bg-action-success',
        error: 'bg-action-danger',
        loading: 'bg-bg-elevated',
      }[toast.type] || 'bg-bg-elevated'
    : null

  return (
    <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
      {toast && (
        <div
          className={`${bgColor} text-text-primary px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[200px] max-w-[90vw]`}
        >
          {toast.type === 'loading' && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {toast.type === 'success' && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.type === 'error' && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  )
}
