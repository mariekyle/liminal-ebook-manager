import { useState, useRef } from 'react'
import { uploadCover, extractCover, revertToGradient } from '../api'
import GradientCover from './GradientCover'

// Inline SVG icons (project doesn't use icon library)
const UploadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
)

const BookIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const PaletteIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
)

const SpinnerIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

const AlertIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CloseIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default function ChangeCoverModal({ book, isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(null) // 'upload' | 'extract' | 'gradient' | null
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  if (!isOpen || !book) return null

  // Determine current cover state
  const hasCustomCover = book.has_cover && book.cover_source === 'custom'
  const hasExtractedCover = book.has_cover && book.cover_source === 'extracted'
  const hasGradient = !book.has_cover
  const isWishlist = book.acquisition_status === 'wishlist'
  
  // Check if book has EPUB files (can extract)
  const hasEpubFiles = book.editions?.some(e => 
    e.file_path?.toLowerCase().endsWith('.epub')
  )

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading('upload')
    setError(null)

    try {
      await uploadCover(book.id, file)
      onSuccess?.('Cover uploaded')
      onClose()
    } catch (err) {
      console.error('Upload failed:', err)
      setError('Failed to upload cover')
    } finally {
      setLoading(null)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleExtract = async () => {
    setLoading('extract')
    setError(null)

    try {
      const result = await extractCover(book.id)
      if (result.extracted) {
        onSuccess?.('Cover extracted')
        onClose()
      } else {
        setError(result.message || 'No cover found in EPUB')
      }
    } catch (err) {
      console.error('Extract failed:', err)
      setError('Failed to extract cover')
    } finally {
      setLoading(null)
    }
  }

  const handleUseGradient = async () => {
    setLoading('gradient')
    setError(null)

    try {
      await revertToGradient(book.id)
      onSuccess?.('Switched to gradient cover')
      onClose()
    } catch (err) {
      console.error('Revert failed:', err)
      setError('Failed to switch to gradient')
    } finally {
      setLoading(null)
    }
  }

  // Get cover source label
  const getCoverSourceLabel = () => {
    if (hasCustomCover) return 'Custom Cover'
    if (hasExtractedCover) return 'Extracted from EPUB'
    return 'Generated Gradient'
  }

  const getCoverSourceStyle = () => {
    if (hasCustomCover) return 'bg-indigo-900/50 text-indigo-300'
    if (hasExtractedCover) return 'bg-cyan-900/50 text-cyan-300'
    return 'bg-gray-700/50 text-gray-400'
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-library-card rounded-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Change Cover</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Cover Preview */}
          <div className="flex justify-center mb-5">
            <div className="w-[200px] h-[300px] rounded-lg overflow-hidden shadow-2xl">
              {book.has_cover ? (
                <img
                  src={`/api/covers/${book.id}?t=${Date.now()}`}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <GradientCover book={book} size="lg" />
              )}
            </div>
          </div>

          {/* Cover Source Badge */}
          <div className="text-center mb-5">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCoverSourceStyle()}`}>
              {getCoverSourceLabel()}
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-2 text-red-300 text-sm">
              <AlertIcon className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Upload Image */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={handleUploadClick}
              disabled={loading !== null}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-library-bg border border-gray-700 rounded-lg text-gray-200 hover:bg-gray-800 hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'upload' ? (
                <SpinnerIcon className="w-5 h-5 animate-spin" />
              ) : (
                <UploadIcon className="w-5 h-5" />
              )}
              <span>{loading === 'upload' ? 'Uploading...' : 'Upload Image'}</span>
            </button>

            {/* Extract from EPUB - only show if has EPUB and not wishlist */}
            {!isWishlist && hasEpubFiles && (
              <button
                onClick={handleExtract}
                disabled={loading !== null || hasExtractedCover}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-library-bg border border-gray-700 rounded-lg text-gray-200 hover:bg-gray-800 hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={hasExtractedCover ? 'Cover already extracted from EPUB' : undefined}
              >
                {loading === 'extract' ? (
                  <SpinnerIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <BookIcon className="w-5 h-5" />
                )}
                <span>{loading === 'extract' ? 'Extracting...' : 'Extract from EPUB'}</span>
              </button>
            )}

            {/* Use Gradient - only show if currently has a custom/extracted cover */}
            {!hasGradient && (
              <>
                <div className="border-t border-gray-700 my-1" />
                <button
                  onClick={handleUseGradient}
                  disabled={loading !== null}
                  className="w-full flex items-center gap-3 px-4 py-3.5 bg-library-bg border border-gray-700 rounded-lg text-gray-200 hover:bg-gray-800 hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'gradient' ? (
                    <SpinnerIcon className="w-5 h-5 animate-spin" />
                  ) : (
                    <PaletteIcon className="w-5 h-5" />
                  )}
                  <span>{loading === 'gradient' ? 'Switching...' : 'Use Gradient Instead'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
