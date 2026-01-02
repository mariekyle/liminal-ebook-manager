/**
 * SmartPasteModal - Paste markdown with [[Title]] links to add books to collection
 */

import { useState } from 'react'
import { smartPastePreview, smartPasteApply } from '../api'

// Icons
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const QuestionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const XCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

export default function SmartPasteModal({ collectionId, onClose, onSuccess }) {
  const [markdown, setMarkdown] = useState('')
  const [matches, setMatches] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [step, setStep] = useState('paste') // 'paste' or 'preview'

  const handlePreview = async () => {
    if (!markdown.trim()) return
    
    try {
      setLoading(true)
      const result = await smartPastePreview(markdown)
      setMatches(result)
      
      // Auto-select all matched books
      const matchedIds = new Set(
        result.matches
          .filter(m => m.matched_title_id !== null)
          .map(m => m.matched_title_id)
      )
      setSelectedIds(matchedIds)
      setStep('preview')
    } catch (err) {
      console.error('Failed to preview:', err)
      alert('Failed to parse markdown')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (titleId) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(titleId)) {
        next.delete(titleId)
      } else {
        next.add(titleId)
      }
      return next
    })
  }

  const handleApply = async () => {
    if (selectedIds.size === 0) return
    
    try {
      setApplying(true)
      await smartPasteApply(collectionId, Array.from(selectedIds))
      onSuccess()
    } catch (err) {
      console.error('Failed to apply:', err)
      alert('Failed to add books')
    } finally {
      setApplying(false)
    }
  }

  const getConfidenceStyle = (confidence) => {
    switch (confidence) {
      case 'exact':
        return 'text-green-400'
      case 'fuzzy':
        return 'text-yellow-400'
      default:
        return 'text-red-400'
    }
  }

  const getConfidenceIcon = (confidence) => {
    switch (confidence) {
      case 'exact':
        return <CheckIcon />
      case 'fuzzy':
        return <QuestionIcon />
      default:
        return <XCircleIcon />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg max-h-[80vh] bg-library-card rounded-xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            {step === 'paste' ? 'Smart Paste' : 'Preview Matches'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'paste' ? (
            <>
              <p className="text-gray-400 text-sm mb-3">
                Paste text containing <code className="bg-gray-700 px-1 rounded">[[Book Title]]</code> links. 
                Books will be matched to your library.
              </p>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Paste your markdown here...

Example:
- [[The Great Gatsby]]
- [[Pride and Prejudice]]
- [[1984]]"
                className="w-full h-48 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-library-accent resize-none font-mono text-sm"
                autoFocus
              />
            </>
          ) : (
            <>
              {/* Stats summary */}
              <div className="flex gap-4 mb-4 text-sm">
                <span className="text-gray-400">
                  Found: <span className="text-white">{matches?.total_found || 0}</span>
                </span>
                <span className="text-green-400">
                  Matched: {matches?.total_matched || 0}
                </span>
                <span className="text-red-400">
                  Not found: {matches?.total_unmatched || 0}
                </span>
              </div>

              {/* Match list */}
              <div className="space-y-2">
                {matches?.matches?.map((match, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                      match.matched_title_id 
                        ? 'bg-gray-800 cursor-pointer hover:bg-gray-750' 
                        : 'bg-gray-800/50'
                    }`}
                    onClick={() => match.matched_title_id && handleToggle(match.matched_title_id)}
                  >
                    {/* Checkbox for matched items */}
                    {match.matched_title_id ? (
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                        selectedIds.has(match.matched_title_id)
                          ? 'bg-library-accent border-library-accent'
                          : 'border-gray-500'
                      }`}>
                        {selectedIds.has(match.matched_title_id) && (
                          <CheckIcon />
                        )}
                      </div>
                    ) : (
                      <div className="w-5 h-5 shrink-0" />
                    )}

                    {/* Match info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white truncate">
                        {match.matched_title || match.input_title}
                      </div>
                      {match.confidence === 'fuzzy' && (
                        <div className="text-xs text-gray-500">
                          Input: "{match.input_title}" ({match.similarity}% match)
                        </div>
                      )}
                      {match.confidence === 'none' && (
                        <div className="text-xs text-gray-500">
                          "{match.input_title}" not found in library
                        </div>
                      )}
                    </div>

                    {/* Confidence indicator */}
                    <div className={`shrink-0 ${getConfidenceStyle(match.confidence)}`}>
                      {getConfidenceIcon(match.confidence)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-700 flex gap-3">
          {step === 'paste' ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePreview}
                disabled={!markdown.trim() || loading}
                className="flex-1 px-4 py-2 bg-library-accent hover:bg-library-accent/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Scanning...' : 'Find Matches'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('paste')}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleApply}
                disabled={selectedIds.size === 0 || applying}
                className="flex-1 px-4 py-2 bg-library-accent hover:bg-library-accent/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applying ? 'Adding...' : `Add ${selectedIds.size} Book${selectedIds.size !== 1 ? 's' : ''}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

