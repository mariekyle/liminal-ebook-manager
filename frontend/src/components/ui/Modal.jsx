import { useEffect, useCallback, useState, createContext, useContext } from 'react'

const ModalLayoutContext = createContext({ fullscreen: false })

/**
 * Modal — Compound layout: Modal.Header, Modal.Body, Modal.Footer
 *
 * Sizes: sm (360px), md (480px), lg (640px), fullscreen (full viewport panel)
 * fullscreen: true → full viewport panel (no outer backdrop card); prefer size="fullscreen"
 * fullscreenOnMobile: below md (768px), same as fullscreen; md+ uses normal centered modal
 *
 * Usage:
 *   <Modal isOpen={open} onClose={close} size="md">
 *     <Modal.Header onClose={close}>Title</Modal.Header>
 *     <Modal.Body>...</Modal.Body>
 *     <Modal.Footer>...</Modal.Footer>
 *   </Modal>
 */
const SIZES = {
  sm: 'max-w-[360px]',
  md: 'max-w-[480px]',
  lg: 'max-w-[640px]',
}

function useMdBreakpoint() {
  const [mdUp, setMdUp] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const fn = () => setMdUp(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return mdUp
}

export default function Modal({
  isOpen,
  onClose,
  size = 'md',
  fullscreen = false,
  fullscreenOnMobile = false,
  children,
  className = '',
}) {
  const mdUp = useMdBreakpoint()
  const effectiveFullscreen =
    size === 'fullscreen' || fullscreen || (fullscreenOnMobile && !mdUp)

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

  const sizeClass = size === 'fullscreen' ? '' : SIZES[size] || SIZES.md
  const shellClasses = effectiveFullscreen
    ? `fixed inset-0 z-50 flex flex-col bg-bg-surface min-h-0 ${className}`
    : `w-full ${sizeClass} max-h-[85vh] flex flex-col min-h-0 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-bg-surface border border-border-default ${className}`

  const layoutValue = { fullscreen: effectiveFullscreen }

  if (effectiveFullscreen) {
    return (
      <ModalLayoutContext.Provider value={layoutValue}>
        <div className={shellClasses}>{children}</div>
      </ModalLayoutContext.Provider>
    )
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-bg-overlay flex items-center justify-center p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <ModalLayoutContext.Provider value={layoutValue}>
        <div className={shellClasses} role="dialog" aria-modal="true">
          {children}
        </div>
      </ModalLayoutContext.Provider>
    </div>
  )
}

function ModalHeader({ onClose, children, right, fullscreen }) {
  const { fullscreen: ctxFullscreen } = useContext(ModalLayoutContext)
  const useFullscreenHeader = fullscreen ?? ctxFullscreen
  const closeBtn = (
    <button
      type="button"
      onClick={onClose}
      className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-transparent text-text-muted rounded hover:bg-bg-elevated hover:text-text-primary transition-all duration-[200ms] ease-out"
      aria-label="Close"
    >
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )

  if (useFullscreenHeader) {
    return (
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-default flex-shrink-0 gap-2">
        {closeBtn}
        <span className="text-base font-semibold text-text-primary flex-1 text-center truncate min-w-0">
          {children}
        </span>
        {right ?? <span className="w-9 flex-shrink-0" />}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border-default flex-shrink-0 gap-3">
      <span className="text-lg font-semibold text-text-primary min-w-0 flex-1">{children}</span>
      {closeBtn}
    </div>
  )
}

function ModalBody({ children, className = '' }) {
  return <div className={`px-5 py-5 overflow-y-auto flex-1 min-h-0 ${className}`}>{children}</div>
}

function ModalFooter({ children, className = '' }) {
  return (
    <div
      className={`w-full flex flex-wrap items-center justify-end gap-2.5 px-5 py-4 border-t border-border-default flex-shrink-0 ${className}`}
    >
      {children}
    </div>
  )
}

Modal.Header = ModalHeader
Modal.Body = ModalBody
Modal.Footer = ModalFooter
