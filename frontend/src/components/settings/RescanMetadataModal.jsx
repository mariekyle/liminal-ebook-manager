import { useState, useEffect } from 'react'
import { previewRescan, rescanMetadata } from '../../api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function RescanMetadataModal({ isOpen, onClose }) {
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    setPreview(null)
    setResults(null)
    setError(null)
    previewRescan()
      .then(setPreview)
      .catch(err => setError(err.message || 'Failed to load preview'))
  }, [isOpen])

  const handleRescan = async () => {
    if (loading) return
    setLoading(true)
    setResults(null)
    setError(null)
    try {
      const data = await rescanMetadata()
      if (data.error) {
        setError(data.error)
      } else {
        setResults(data)
      }
    } catch (err) {
      setError(err.message || 'Rescan failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} aria-label="Rescan metadata">
      <Modal.Header onClose={onClose}>Rescan Metadata</Modal.Header>
      <Modal.Body>
        <p className="text-body-sm text-text-secondary mb-4">
          Re-extract metadata from EPUB files — fandom, relationships, source URLs, and more.
          Safe to run anytime; existing custom fields are preserved.
        </p>

        {error && (
          <div className="mb-3 bg-action-danger/10 border border-action-danger/30 rounded-lg p-3 text-sm text-action-danger">
            {error}
          </div>
        )}

        {preview && !results && (
          <div className="bg-bg-elevated/70 border border-border-subtle rounded-lg p-3 text-sm">
            <div className="grid grid-cols-2 gap-y-1 text-text-secondary">
              <span>Total titles:</span>
              <span>{preview.total_books}</span>
              <span>With EPUB files:</span>
              <span>{preview.books_with_epub}</span>
              <span>Already have fandom:</span>
              <span>{preview.already_has_fandom}</span>
              <span>Already have source URL:</span>
              <span>{preview.already_has_source_url}</span>
            </div>
          </div>
        )}

        {results && (
          <div className="bg-bg-elevated/70 border border-border-subtle rounded-lg p-3 text-sm">
            <div className="text-action-primary font-medium mb-2">Done.</div>
            <div className="grid grid-cols-2 gap-y-1 text-text-secondary">
              <span>Scanned:</span><span>{results.total}</span>
              <span>Updated:</span><span className="text-action-primary">{results.updated}</span>
              <span>AO3 parsed:</span><span>{results.details?.ao3_parsed || 0}</span>
              <span>Source URLs found:</span><span>{results.details?.source_urls_found || 0}</span>
              <span>Series extracted:</span><span>{results.details?.series_extracted || 0}</span>
              <span>Skipped (no EPUB):</span><span>{results.skipped_no_epub}</span>
              {results.errors > 0 && (
                <>
                  <span>Errors:</span>
                  <span className="text-action-danger">{results.errors}</span>
                </>
              )}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
          {results ? 'Close' : 'Cancel'}
        </Button>
        {!results && (
          <Button type="button" variant="primary" loading={loading} disabled={loading || !preview} onClick={handleRescan}>
            {loading ? 'Rescanning…' : 'Rescan All'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}
