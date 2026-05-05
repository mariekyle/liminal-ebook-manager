import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import Button from './Button'

const MAX_VISIBLE_FILES = 5

/**
 * Controlled file picker: desktop = dashed drop zone; mobile (≤768px) = compact button + list.
 *
 * Constraints (extensions, size) are passed in by the parent — typically
 * fetched from `/api/upload/limits` so the backend stays the single source
 * of truth.
 *
 * Props:
 *   allowedExtensions — array of lowercase extensions like ['.epub', '.pdf'].
 *     If provided: drives the file picker `accept` attribute, the displayed
 *     format hint, and client-side rejection of mismatched files.
 *     If null/empty: no extension validation; picker accepts any file.
 *   maxFileSize — bytes; if set, files larger than this are rejected client-side.
 *   formatHint — optional override for the label shown below the drop zone.
 *     If omitted and allowedExtensions is provided, the label is derived
 *     (e.g. 'EPUB • PDF • MOBI').
 */
export default function FileDropZone({
  allowedExtensions,
  formatHint,
  maxFiles,
  maxFileSize,
  files = [],
  onFilesChange,
  disabled = false,
}) {
  const [rejections, setRejections] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [showAllFiles, setShowAllFiles] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const fileInputRef = useRef(null)

  // Derive picker behavior from allowedExtensions (single source of truth).
  // useMemo so the Set identity is stable across renders for handleFiles deps.
  const allowedSet = useMemo(
    () =>
      allowedExtensions?.length
        ? new Set(allowedExtensions.map((e) => e.toLowerCase()))
        : null,
    [allowedExtensions],
  )
  const acceptAttr = allowedExtensions?.length
    ? allowedExtensions.join(',')
    : undefined
  const derivedFormatLabel = allowedExtensions?.length
    ? allowedExtensions.map((e) => e.replace(/^\./, '').toUpperCase()).join(' • ')
    : ''
  const displayLabel = formatHint ?? derivedFormatLabel

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const fn = () => setIsMobile(mq.matches)
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  const hasFiles = files.length > 0
  const visibleFiles = showAllFiles ? files : files.slice(0, MAX_VISIBLE_FILES)
  const hiddenCount = files.length - MAX_VISIBLE_FILES

  const totalSize = files.reduce((sum, f) => sum + f.size, 0)
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1)

  const clampFiles = useCallback(
    (list) => {
      if (maxFiles == null || maxFiles <= 0) return list
      return list.slice(0, maxFiles)
    },
    [maxFiles],
  )

  const handleFiles = useCallback(
    (newFiles) => {
      if (disabled) return
      const fileArray = Array.from(newFiles)
      const accepted = []
      const localRejections = []

      for (const file of fileArray) {
        if (maxFileSize && file.size > maxFileSize) {
          const maxMB = (maxFileSize / 1024 / 1024).toFixed(0)
          const fileMB = (file.size / 1024 / 1024).toFixed(1)
          localRejections.push({
            filename: file.name,
            reason: `File too large: ${fileMB} MB (max ${maxMB} MB)`,
          })
          continue
        }
        if (allowedSet) {
          const ext = file.name.includes('.')
            ? `.${file.name.split('.').pop().toLowerCase()}`
            : ''
          if (!allowedSet.has(ext)) {
            localRejections.push({
              filename: file.name,
              reason: `Unsupported file type: ${ext || '(none)'}`,
            })
            continue
          }
        }
        accepted.push(file)
      }

      setRejections(localRejections)
      const merged = clampFiles([...files, ...accepted])
      onFilesChange(merged)
    },
    [files, onFilesChange, disabled, clampFiles, maxFileSize, allowedSet],
  )

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      if (disabled || !e.dataTransfer.files?.length) return
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles, disabled],
  )

  const handleInputChange = useCallback(
    (e) => {
      if (e.target.files?.length > 0) {
        handleFiles(e.target.files)
        e.target.value = ''
      }
    },
    [handleFiles],
  )

  const handleZoneClick = useCallback(() => {
    if (!disabled) fileInputRef.current?.click()
  }, [disabled])

  const handleRemoveFile = useCallback(
    (index) => {
      const newFiles = files.filter((_, i) => i !== index)
      onFilesChange(newFiles)
    },
    [files, onFilesChange],
  )

  const handleClearAll = useCallback(() => {
    onFilesChange([])
    setShowAllFiles(false)
    setRejections([])
  }, [onFilesChange])

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const openPicker = () => fileInputRef.current?.click()

  const inputEl = (
    <input
      ref={fileInputRef}
      type="file"
      multiple
      accept={acceptAttr}
      onChange={handleInputChange}
      className="hidden"
      disabled={disabled}
    />
  )

  const rejectionSection = rejections.length > 0 && (
    <div className="mt-4 p-3 rounded-lg border border-action-danger/30 bg-action-danger/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-body-sm text-action-danger">
          {rejections.length} {rejections.length === 1 ? 'file' : "files"} couldn't be added
        </span>
        <button
          type="button"
          onClick={() => setRejections([])}
          className="text-body-sm text-text-muted hover:text-text-secondary transition-all duration-200 ease-out min-h-[44px] px-1"
        >
          Dismiss
        </button>
      </div>
      <ul className="space-y-1">
        {rejections.map((r, i) => (
          <li key={`${r.filename}-${i}`} className="text-caption text-text-secondary">
            <span className="text-text-primary">{r.filename}</span> — {r.reason}
          </li>
        ))}
      </ul>
    </div>
  )

  const fileListSection = hasFiles && (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-body-sm text-text-secondary">
          {files.length} {files.length === 1 ? 'file' : 'files'} · {totalSizeMB} MB
        </span>
        <button
          type="button"
          onClick={handleClearAll}
          className="text-body-sm text-text-muted hover:text-action-danger transition-all duration-200 ease-out min-h-[44px] px-1"
        >
          Clear all
        </button>
      </div>

      <div className="bg-bg-surface/80 rounded-lg overflow-hidden border border-border-subtle">
        {visibleFiles.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className={`px-4 py-3 flex items-center gap-3 ${
              index < visibleFiles.length - 1 ? 'border-b border-border-default' : ''
            }`}
          >
            <span className="text-action-success shrink-0">✓</span>
            <div className="flex-1 min-w-0">
              <div className="text-body-sm text-text-primary truncate">{file.name}</div>
              <div className="text-caption text-text-muted">{formatSize(file.size)}</div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveFile(index)}
              className="text-text-muted hover:text-action-danger p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all duration-200 ease-out"
              aria-label="Remove file"
            >
              ×
            </button>
          </div>
        ))}

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAllFiles(!showAllFiles)}
            className="w-full px-4 py-3 text-left text-body-sm text-text-muted hover:text-text-secondary transition-all duration-200 ease-out min-h-[44px]"
          >
            {showAllFiles ? 'Show less' : `+ ${hiddenCount} more files`}
          </button>
        )}
      </div>

      {isMobile && hasFiles && (
        <div className="mt-3">
          <Button type="button" variant="ghost" size="sm" onClick={openPicker} disabled={disabled}>
            Add more files
          </Button>
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <div>
        {inputEl}
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full"
            onClick={openPicker}
            disabled={disabled}
            icon={<UploadIcon />}
          >
            Choose files
          </Button>
          {!hasFiles && displayLabel && (
            <p className="text-caption text-text-muted text-center">{displayLabel}</p>
          )}
        </div>
        {rejectionSection}
        {fileListSection}
      </div>
    )
  }

  return (
    <div>
      {inputEl}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleZoneClick()
          }
        }}
        onClick={handleZoneClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl text-center cursor-pointer
          transition-all duration-200 ease-out
          ${hasFiles ? 'p-6' : 'p-10'}
          ${
            disabled
              ? 'opacity-40 pointer-events-none border-border-default bg-bg-surface/50'
              : isDragging
                ? 'border-action-primary bg-action-primary/10'
                : 'border-border-default bg-bg-surface/50 hover:border-action-primary hover:bg-bg-surface'
          }
        `}
      >
        <div className={`${hasFiles ? 'text-3xl' : 'text-5xl'} mb-2`}>📚</div>
        <div className={`${hasFiles ? 'text-body-sm' : 'text-body'} mb-1 text-text-primary`}>
          {isDragging
            ? 'Drop files here'
            : hasFiles
              ? 'Add more files'
              : 'Drop files here or tap to browse'}
        </div>
        {!hasFiles && displayLabel && (
          <div className="text-body-sm text-text-muted">{displayLabel}</div>
        )}
      </div>
      {rejectionSection}
      {fileListSection}
    </div>
  )
}

function UploadIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  )
}
