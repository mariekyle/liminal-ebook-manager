/**
 * ReviewBooks.jsx
 * 
 * Container for reviewing books before upload.
 * Shows all detected books and upload button.
 */

import { useState, useCallback } from 'react';
import BookCard from './BookCard';

export default function ReviewBooks({
  books,
  onBookUpdate,
  onDuplicateAction,
  onUpload,
  onCancel,
  booksToUpload,
  filesToUpload,
  canUpload,
}) {
  const [expandedBookId, setExpandedBookId] = useState(
    // Expand first book by default
    books.length > 0 ? books[0].id : null
  );

  const handleToggle = useCallback((bookId) => {
    setExpandedBookId(prev => prev === bookId ? null : bookId);
  }, []);

  // Count books needing attention (duplicates or familiar titles without action)
  const needsAttention = books.filter(b => 
    (b.duplicate && !b.action) || 
    (b.familiar_title && !b.duplicate && !b.action)
  ).length;

  return (
    <div>
      {/* Needs attention notice */}
      {needsAttention > 0 && (
        <div className="mb-4 p-3 bg-[#3a3a2a] border border-[#ffc107] rounded-lg text-sm">
          <span className="mr-2">⚠️</span>
          {needsAttention} {needsAttention !== 1 ? 'items need' : 'item needs'} your attention
        </div>
      )}

      {/* Book cards */}
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

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-6">
        <button
          onClick={onUpload}
          disabled={!canUpload}
          className={`
            w-full py-4 px-6 font-medium rounded-lg transition-colors min-h-[52px]
            ${canUpload 
              ? 'bg-[#667eea] hover:bg-[#5568d3] text-white' 
              : 'bg-[#3a3a3a] text-[#666] cursor-not-allowed'}
          `}
        >
          Add {booksToUpload} {booksToUpload !== 1 ? 'Stories' : 'Story'} ({filesToUpload} {filesToUpload !== 1 ? 'files' : 'file'})
        </button>
        <button
          onClick={onCancel}
          className="w-full py-3 text-[#aaa] hover:text-[#e0e0e0] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
