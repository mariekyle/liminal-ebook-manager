/**
 * AnalyzingModal.jsx
 *
 * Full-screen overlay during file analysis (not the shared Modal — loading only).
 */

export default function AnalyzingModal({ isOpen, progress }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay">
      <div className="bg-bg-surface rounded-xl p-8 max-w-sm w-full mx-4 text-center border border-border-default">
        <div className="text-5xl mb-4 animate-pulse">⏳</div>

        <h2 className="text-h4 text-text-primary mb-2">Analyzing files</h2>
        <p className="text-body-sm text-text-secondary mb-6">Extracting metadata and grouping formats</p>

        <div className="mb-2">
          <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-action-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="text-body-sm text-text-muted">{Math.round(progress)}%</div>
      </div>
    </div>
  )
}
