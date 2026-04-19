import { useState, useEffect } from 'react'
import { bulkExtractCovers } from '../../api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function ExtractCoversModal({ isOpen, onClose }) {
  const [categories, setCategories] = useState({ Fiction: true, 'Non-Fiction': true })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    setResults(null)
    setError(null)
  }, [isOpen])

  const handleExtract = async () => {
    if (loading) return
    const selected = Object.entries(categories).filter(([, v]) => v).map(([k]) => k)
    if (selected.length === 0) {
      setError('Select at least one category.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await bulkExtractCovers(selected)
      if (data.error) setError(data.error)
      else setResults(data)
    } catch (err) {
      setError(err.message || 'Extraction failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} aria-label="Extract covers">
      <Modal.Header onClose={onClose}>Extract Covers</Modal.Header>
      <Modal.Body>
        <p className="text-body-sm text-text-secondary mb-4">
          Pull cover images from EPUB files for titles without one. FanFiction keeps its gradient covers.
          Custom covers are never overwritten.
        </p>

        {error && (
          <div className="mb-3 bg-action-danger/10 border border-action-danger/30 rounded-lg p-3 text-sm text-action-danger">
            {error}
          </div>
        )}

        {!results && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={categories.Fiction}
                onChange={(e) => setCategories(prev => ({ ...prev, Fiction: e.target.checked }))}
                className="rounded border-border-default bg-bg-elevated text-action-primary focus:ring-action-primary"
              />
              Fiction
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={categories['Non-Fiction']}
                onChange={(e) => setCategories(prev => ({ ...prev, 'Non-Fiction': e.target.checked }))}
                className="rounded border-border-default bg-bg-elevated text-action-primary focus:ring-action-primary"
              />
              Non-Fiction
            </label>
          </div>
        )}

        {results && (
          <div className="bg-bg-elevated/70 border border-border-subtle rounded-lg p-3 text-sm">
            <div className="text-action-success font-medium mb-2">Extracted {results.extracted} covers.</div>
            <div className="grid grid-cols-2 gap-y-1 text-text-secondary">
              <span>Processed:</span><span>{results.processed}</span>
              <span>Skipped (custom):</span><span>{results.skipped_custom}</span>
              <span>Skipped (has cover):</span><span>{results.skipped_has_cover}</span>
              <span>Skipped (no EPUB):</span><span>{results.skipped_no_epub}</span>
              <span>Skipped (no cover in file):</span><span>{results.skipped_no_cover || 0}</span>
              {results.failed > 0 && (
                <>
                  <span>Failed:</span>
                  <span className="text-action-danger">{results.failed}</span>
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
          <Button type="button" variant="primary" loading={loading} disabled={loading} onClick={handleExtract}>
            {loading ? 'Extracting…' : 'Extract Covers'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}
