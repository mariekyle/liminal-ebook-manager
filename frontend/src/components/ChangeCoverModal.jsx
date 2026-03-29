import { useState, useRef } from 'react'
import { uploadCover, extractCover, revertToGradient } from '../api'
import GradientCover from './GradientCover'
import Modal from './ui/Modal'
import Button from './ui/Button'

const UploadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
)

const BookIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const PaletteIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
)

const AlertIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export default function ChangeCoverModal({ book, isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const hasCustomCover = book?.has_cover && book.cover_source === 'custom'
  const hasExtractedCover = book?.has_cover && book.cover_source === 'extracted'
  const hasGradient = book && !book.has_cover
  const isWishlist = book?.acquisition_status === 'wishlist'
  const hasEpubFiles = book?.editions?.some((e) => e.file_path?.toLowerCase().endsWith('.epub'))

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !book) return
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
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleExtract = async () => {
    if (!book) return
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
    if (!book) return
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

  const getCoverSourceLabel = () => {
    if (!book) return ''
    if (hasCustomCover) return 'Custom Cover'
    if (hasExtractedCover) return 'Extracted from EPUB'
    return 'Generated Gradient'
  }

  const getCoverSourceClasses = () => {
    if (hasCustomCover) return 'bg-chip-fanfiction/20 text-chip-fanfiction'
    if (hasExtractedCover) return 'bg-chip-character/20 text-chip-character'
    return 'bg-bg-elevated text-text-muted'
  }

  if (!book) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" fullscreenOnMobile>
      <Modal.Header onClose={onClose}>Change Cover</Modal.Header>
      <Modal.Body>
        <div className="flex justify-center mb-5">
          <div className="w-[200px] h-[300px] rounded-lg overflow-hidden shadow-lg border border-border-subtle">
            {book.has_cover ? (
              <img src={`/api/covers/${book.id}?t=${Date.now()}`} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <GradientCover book={book} size="lg" />
            )}
          </div>
        </div>

        <div className="text-center mb-5">
          <span className={`inline-block px-3 py-1 rounded-full text-caption font-medium ${getCoverSourceClasses()}`}>
            {getCoverSourceLabel()}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-action-danger/10 border border-action-danger/30 rounded-lg flex items-center gap-2 text-body-sm text-action-danger">
            <AlertIcon className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full justify-start"
            onClick={handleUploadClick}
            disabled={loading !== null && loading !== 'upload'}
            loading={loading === 'upload'}
            icon={<UploadIcon className="w-5 h-5" />}
          >
            {loading === 'upload' ? 'Uploading...' : 'Upload Image'}
          </Button>

          {!isWishlist && hasEpubFiles && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full justify-start"
              onClick={handleExtract}
              disabled={(loading !== null && loading !== 'extract') || hasExtractedCover}
              loading={loading === 'extract'}
              title={hasExtractedCover ? 'Cover already extracted from EPUB' : undefined}
              icon={<BookIcon className="w-5 h-5" />}
            >
              {loading === 'extract' ? 'Extracting...' : 'Extract from EPUB'}
            </Button>
          )}

          {!hasGradient && (
            <>
              <div className="border-t border-border-subtle my-1" />
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="w-full justify-start"
                onClick={handleUseGradient}
                disabled={loading !== null && loading !== 'gradient'}
                loading={loading === 'gradient'}
                icon={<PaletteIcon className="w-5 h-5" />}
              >
                {loading === 'gradient' ? 'Switching...' : 'Use Gradient Instead'}
              </Button>
            </>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost" size="md" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
