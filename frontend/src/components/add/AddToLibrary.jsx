/**
 * AddToLibrary.jsx
 * 
 * Unified screen for adding digital files to library.
 * Combines drop zone + file list into single view.
 * 
 * Props:
 *   files: File[] - Currently selected files
 *   onFilesChange: (files: File[]) => void - Called when files added/removed
 *   onContinue: () => void - Called when user clicks Continue
 *   onManualEntry: (format: string) => void - Called when manual entry selected
 *   isAnalyzing: boolean - Whether analyzing modal should show
 *   analyzeProgress: number - Progress percentage (0-100)
 */

import { useState, useRef, useCallback } from 'react'
import StepIndicator from './StepIndicator'
import AnalyzingModal from './AnalyzingModal'

const MAX_VISIBLE_FILES = 5

export default function AddToLibrary({
  files,
  onFilesChange,
  onContinue,
  onManualEntry,
  isAnalyzing,
  analyzeProgress,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [showAllFiles, setShowAllFiles] = useState(false)
  const fileInputRef = useRef(null)
  
  const hasFiles = files.length > 0
  const visibleFiles = showAllFiles ? files : files.slice(0, MAX_VISIBLE_FILES)
  const hiddenCount = files.length - MAX_VISIBLE_FILES
  
  const totalSize = files.reduce((sum, f) => sum + f.size, 0)
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1)

  // File handling
  const handleFiles = useCallback((newFiles) => {
    const fileArray = Array.from(newFiles)
    // Add to existing files (additive behavior)
    onFilesChange([...files, ...fileArray])
  }, [files, onFilesChange])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleInputChange = useCallback((e) => {
    if (e.target.files?.length > 0) {
      handleFiles(e.target.files)
      // Reset input so same files can be selected again
      e.target.value = ''
    }
  }, [handleFiles])

  const handleZoneClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRemoveFile = useCallback((index) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }, [files, onFilesChange])

  const handleClearAll = useCallback(() => {
    onFilesChange([])
    setShowAllFiles(false)
  }, [onFilesChange])

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div>
      {/* Step Indicator */}
      <StepIndicator steps={['Add', 'Review', 'Done']} currentStep={0} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="application/*,text/*,.epub,.pdf,.mobi,.azw3,.azw,.html,.htm"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Drop Zone */}
      <div
        onClick={handleZoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl text-center cursor-pointer
          transition-all duration-200
          ${hasFiles ? 'p-6' : 'p-10'}
          ${isDragging 
            ? 'border-[#667eea] bg-[#667eea]/10' 
            : 'border-gray-600 bg-gray-800/50 hover:border-[#667eea] hover:bg-gray-800'
          }
        `}
      >
        <div className={`${hasFiles ? 'text-3xl' : 'text-5xl'} mb-2`}>📚</div>
        <div className={`${hasFiles ? 'text-sm' : 'text-base'} mb-1`}>
          {isDragging ? 'Drop files here' : hasFiles ? 'Add more files' : 'Drop files here or tap to browse'}
        </div>
        {!hasFiles && (
          <div className="text-sm text-gray-500">
            EPUB • PDF • MOBI • AZW3 • HTML
          </div>
        )}
      </div>

      {/* File List */}
      {hasFiles && (
        <div className="mt-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              {files.length} {files.length === 1 ? 'file' : 'files'} • {totalSizeMB} MB
            </span>
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-500 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>

          {/* File rows */}
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            {visibleFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className={`
                  px-4 py-3 flex items-center gap-3
                  ${index < visibleFiles.length - 1 ? 'border-b border-gray-700' : ''}
                `}
              >
                <span className="text-green-500">✓</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{file.name}</div>
                  <div className="text-xs text-gray-500">{formatSize(file.size)}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFile(index)
                  }}
                  className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}

            {/* Show more/less */}
            {hiddenCount > 0 && (
              <button
                onClick={() => setShowAllFiles(!showAllFiles)}
                className="w-full px-4 py-3 text-sm text-gray-500 hover:text-gray-300 transition-colors text-left"
              >
                {showAllFiles ? 'Show less' : `+ ${hiddenCount} more files`}
              </button>
            )}
          </div>

          {/* Continue Button */}
          <button
            onClick={onContinue}
            className="w-full mt-4 py-4 px-6 bg-[#667eea] hover:bg-[#5a6fd6] text-white font-medium rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      )}

      {/* Manual Entry Section */}
      <div className="mt-8 pt-6 border-t border-gray-700">
        <p className="text-sm text-gray-500 text-center mb-3">
          No files? Enter details manually
        </p>
        <div className="flex justify-center gap-2">
          {['Physical', 'Audiobook', 'Web/URL'].map((format) => (
            <button
              key={format}
              onClick={() => onManualEntry(format.toLowerCase().replace('/', '_'))}
              className="px-4 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
            >
              {format}
            </button>
          ))}
        </div>
      </div>

      {/* Analyzing Modal */}
      <AnalyzingModal isOpen={isAnalyzing} progress={analyzeProgress} />
    </div>
  )
}

