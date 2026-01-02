/**
 * FilesSelected.jsx
 * 
 * Shows list of selected files with count and total size.
 */

import { useState } from 'react';

const MAX_VISIBLE_FILES = 5;

export default function FilesSelected({ files, totalSizeMB, onAnalyze, onSelectDifferent }) {
  const [showAll, setShowAll] = useState(false);

  const visibleFiles = showAll ? files : files.slice(0, MAX_VISIBLE_FILES);
  const hiddenCount = files.length - MAX_VISIBLE_FILES;

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div>
      {/* File count */}
      <div className="flex items-center gap-2 text-base mb-4">
        <span className="text-xl">📄</span>
        <span>{files.length} files selected</span>
      </div>

      {/* File list */}
      <div className="bg-[#2a2a2a] rounded-lg overflow-hidden mb-4">
        {visibleFiles.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className={`
              px-4 py-3 flex items-center gap-3
              ${index < visibleFiles.length - 1 ? 'border-b border-[#3a3a3a]' : ''}
            `}
          >
            <span className="text-[#28a745]">✓</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{file.name}</div>
              <div className="text-xs text-[#aaa]">{formatSize(file.size)}</div>
            </div>
          </div>
        ))}

        {/* Show more/less */}
        {hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full px-4 py-3 text-sm text-[#aaa] hover:text-[#e0e0e0] transition-colors text-left"
          >
            {showAll ? 'Show less' : `... ${hiddenCount} more files`}
          </button>
        )}
      </div>

      {/* Total size */}
      <div className="text-sm text-[#aaa] mb-6">
        Total: {totalSizeMB} MB
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onAnalyze}
          className="w-full py-4 px-6 bg-[#667eea] hover:bg-[#5568d3] text-white font-medium rounded-lg transition-colors min-h-[52px]"
        >
          Continue
        </button>
        <button
          onClick={onSelectDifferent}
          className="w-full py-4 px-6 bg-transparent border border-[#4a4a4a] hover:border-[#667eea] text-[#aaa] hover:text-[#e0e0e0] rounded-lg transition-colors min-h-[52px]"
        >
          Select Different Files
        </button>
      </div>
    </div>
  );
}
