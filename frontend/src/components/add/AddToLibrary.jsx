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

import { useEffect, useState } from 'react'
import StepIndicator from './StepIndicator'
import AnalyzingModal from './AnalyzingModal'
import FileDropZone from '../ui/FileDropZone'
import Button from '../ui/Button'

export default function AddToLibrary({
  files,
  onFilesChange,
  onContinue,
  onManualEntry,
  isAnalyzing,
  analyzeProgress,
}) {
  const hasFiles = files.length > 0
  const [maxFileSize, setMaxFileSize] = useState(null)
  const [allowedExtensions, setAllowedExtensions] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/upload/limits')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        if (data.max_file_size) setMaxFileSize(data.max_file_size)
        if (Array.isArray(data.allowed_extensions)) {
          setAllowedExtensions(data.allowed_extensions)
        }
      })
      .catch(() => {
        // If /limits fails, FileDropZone runs without client-side validation;
        // server still enforces both limits, so this is degraded, not broken.
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <StepIndicator steps={['Add', 'Review', 'Done']} currentStep={0} />

      <FileDropZone
        files={files}
        onFilesChange={onFilesChange}
        disabled={isAnalyzing}
        maxFileSize={maxFileSize}
        allowedExtensions={allowedExtensions}
      />

      {hasFiles && (
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full mt-4"
          onClick={onContinue}
          disabled={isAnalyzing}
          loading={isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Continue'}
        </Button>
      )}

      <div className="mt-8 pt-6 border-t border-border-default">
        <p className="text-body-sm text-text-muted text-center mb-3">No files? Enter details manually</p>
        <div className="flex justify-center gap-2 flex-wrap">
          {['Physical', 'Audiobook', 'Web/URL'].map((format) => (
            <Button
              key={format}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onManualEntry(format.toLowerCase().replace('/', '_'))}
            >
              {format}
            </Button>
          ))}
        </div>
      </div>

      <AnalyzingModal isOpen={isAnalyzing} progress={analyzeProgress} />
    </div>
  )
}
