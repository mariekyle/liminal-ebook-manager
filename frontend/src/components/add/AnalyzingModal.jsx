/**
 * AnalyzingModal.jsx
 * 
 * Full-screen modal overlay shown during file analysis.
 * Displays progress bar and status text.
 */

export default function AnalyzingModal({ isOpen, progress }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-gray-900 rounded-xl p-8 max-w-sm w-full mx-4 text-center">
        {/* Animated icon */}
        <div className="text-5xl mb-4 animate-pulse">⏳</div>
        
        {/* Title */}
        <h2 className="text-lg font-medium text-white mb-2">Analyzing files</h2>
        <p className="text-sm text-gray-400 mb-6">
          Extracting metadata and grouping formats
        </p>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#667eea] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Progress text */}
        <div className="text-sm text-gray-500">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  )
}

