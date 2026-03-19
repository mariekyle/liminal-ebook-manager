import { useEffect, useCallback } from 'react'

/**
 * Modal — Standardized modal with Header/Body/Footer
 *
 * Variants:
 *   standard: ✕ on right, footer with Cancel + primary action
 *   fullscreen: ✕ on left, primary action in header right (mobile)
 *
 * Sizes: sm (360px), md (480px), lg (640px), fullscreen
 *
 * Usage:
 *   <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Details">
 *     <Modal.Body>
 *       <form fields here />
 *     </Modal.Body>
 *     <Modal.Footer>
 *       <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button>
 *       <Button variant="primary" onClick={handleSave}>Save</Button>
 *     </Modal.Footer>
 *   </Modal>
 *
 *   <Modal isOpen={showNotes} onClose={close} title="Edit Notes" fullscreen>
 *     <Modal.Header right={<Button variant="primary" size="sm" onClick={save}>Save</Button>} />
 *     <Modal.Body>...</Modal.Body>
 *   </Modal>
 */
const SIZES = {
  sm: 'max-w-[360px]',
  md: 'max-w-[480px]',
  lg: 'max-w-[640px]',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  fullscreen = false,
  glass = false,
  children,
  className = '',
}) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const modalClasses = fullscreen
    ? 'fixed inset-0 bg-bg-surface flex flex-col z-50'
    : `w-full ${SIZES[size]} max-h-[85vh] flex flex-col rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] ${
        glass ? 'glass-panel' : 'bg-bg-surface border border-border-default'
      }`

  return (
    <>
      {/* Backdrop (not for fullscreen) */}
      {!fullscreen && (
        <div
          className="fixed inset-0 z-40 bg-[rgba(12,11,10,0.6)] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <div className={`${modalClasses} ${className}`}>
            {/* Default header for standard modals */}
            <ModalHeader title={title} onClose={onClose} fullscreen={false} />
            {children}
          </div>
        </div>
      )}

      {/* Fullscreen variant */}
      {fullscreen && (
        <div className={`${modalClasses} ${className}`}>
          {children}
        </div>
      )}
    </>
  )
}

// Internal header — automatically rendered by Modal
function ModalHeader({ title, onClose, fullscreen = false, right }) {
  const closeButton = (
    <button
      onClick={onClose}
      className="w-9 h-9 flex items-center justify-center bg-transparent text-text-muted rounded hover:bg-bg-elevated hover:text-text-primary transition-all duration-[200ms] ease-out"
    >
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )

  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border-default flex-shrink-0">
      {fullscreen ? (
        <>
          {closeButton}
          <span className="text-base font-semibold text-text-primary">{title}</span>
          {right || <span className="w-9" />}
        </>
      ) : (
        <>
          <span className="text-lg font-semibold text-text-primary">{title}</span>
          {closeButton}
        </>
      )}
    </div>
  )
}

// Compound component: Modal.Body
function ModalBody({ children, className = '' }) {
  return <div className={`px-5 py-5 overflow-y-auto flex-1 ${className}`}>{children}</div>
}

// Compound component: Modal.Footer
function ModalFooter({ children, className = '' }) {
  return (
    <div className={`flex justify-end gap-2.5 px-5 py-4 border-t border-border-default flex-shrink-0 ${className}`}>
      {children}
    </div>
  )
}

// Attach compound components
Modal.Header = ModalHeader
Modal.Body = ModalBody
Modal.Footer = ModalFooter

