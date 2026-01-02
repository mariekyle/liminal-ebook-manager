/**
 * AnalyzingProgress.jsx
 * 
 * Shows animated progress bar during file analysis.
 */

export default function AnalyzingProgress({ progress }) {
  return (
    <div className="text-center py-10">
      {/* Animated icon */}
      <div className="text-5xl mb-4 animate-pulse">⏳</div>
      
      {/* Title */}
      <h2 className="text-lg font-medium mb-2">Analyzing files</h2>
      <p className="text-sm text-[#aaa] mb-6">
        Extracting metadata and grouping formats
      </p>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-2 bg-[#333] rounded overflow-hidden">
          <div
            className="h-full bg-[#667eea] rounded transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Progress text */}
      <div className="text-sm text-[#aaa] text-right">
        {Math.round(progress)}%
      </div>
    </div>
  );
}
