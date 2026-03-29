/**
 * ReviewBooks.jsx
 *
 * Container for reviewing books before upload.
 */

import { useState, useCallback } from 'react'
import BookCard from './BookCard'
import StepIndicator from '../add/StepIndicator'
import Button from '../ui/Button'

export default function ReviewBooks({
  books,
  onBookUpdate,
  onDuplicateAction,
  onUpload,
  onCancel,
  booksToUpload,
  filesToUpload = 0,
  canUpload,
}) {
  const [expandedBookId, setExpandedBookId] = useState(
    books.length > 0 ? books[0].id : null,
  )

  const handleToggle = useCallback((bookId) => {
    setExpandedBookId((prev) => (prev === bookId ? null : bookId))
  }, [])

  const needsAttention = books.filter(
    (b) => (b.duplicate && !b.action) || (b.familiar_title && !b.duplicate && !b.action),
  ).length

  return (
    <div>
      <StepIndicator steps={['Add', 'Review', 'Done']} currentStep={1} />

      {needsAttention > 0 && (
        <div className="mb-4 p-3 bg-bg-elevated border border-border-focus rounded-lg text-body-sm text-text-primary">
          <span className="mr-2">⚠️</span>
          {needsAttention} {needsAttention !== 1 ? 'items need' : 'item needs'} your attention
        </div>
      )}

      <div className="space-y-3">
        {books.map((book, index) => (
          <BookCard
            key={book.id}
            book={book}
            index={index}
            totalBooks={books.length}
            isExpanded={expandedBookId === book.id}
            onToggle={() => handleToggle(book.id)}
            onUpdate={onBookUpdate}
            onDuplicateAction={onDuplicateAction}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 mt-6">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full"
          onClick={onUpload}
          disabled={!canUpload}
          aria-label={`Add ${booksToUpload} ${booksToUpload === 1 ? 'story' : 'stories'}, ${filesToUpload} files`}
        >
          Add {booksToUpload} {booksToUpload === 1 ? 'Story' : 'Stories'}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
