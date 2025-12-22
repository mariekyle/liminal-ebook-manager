/**
 * BookCard.jsx
 * 
 * Individual book card with:
 * - Expandable metadata editing
 * - Duplicate detection and resolution
 * - Category display with confidence
 */

import { useState, useCallback } from 'react';

// Category gradient colors
const CATEGORY_GRADIENTS = {
  FanFiction: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  Fiction: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'Non-Fiction': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  Uncategorized: 'linear-gradient(135deg, #666 0%, #888 100%)',
};

const CATEGORIES = ['FanFiction', 'Fiction', 'Non-Fiction', 'Uncategorized'];

export default function BookCard({
  book,
  index,
  totalBooks,
  isExpanded,
  onToggle,
  onUpdate,
  onDuplicateAction,
}) {
  const formatSize = (bytes) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleFieldChange = useCallback((field, value) => {
    onUpdate(book.id, { [field]: value });
  }, [book.id, onUpdate]);

  const handleActionClick = useCallback((action) => {
    onDuplicateAction(book.id, action);
  }, [book.id, onDuplicateAction]);

  const isSkipped = book.action === 'skip';
  const hasUnresolvedDuplicate = book.duplicate && !book.action;

  return (
    <div
      className={`
        rounded-lg overflow-hidden transition-all duration-300 mb-3
        ${isExpanded ? 'border-[#667eea] bg-[#2f2f2f]' : 'border-[#3a3a3a] bg-[#2a2a2a]'}
        ${isSkipped ? 'opacity-50' : ''}
        border
      `}
    >
      {/* Header - always visible */}
      <div
        onClick={onToggle}
        className="p-4 cursor-pointer flex items-start gap-3"
      >
        {/* Cover preview */}
        <div
          className="w-[60px] h-[80px] rounded flex items-center justify-center text-[10px] text-white font-medium shrink-0"
          style={{
            background: CATEGORY_GRADIENTS[book.category] || CATEGORY_GRADIENTS.Uncategorized,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {book.category === 'Non-Fiction' ? 'NON-FIC' : book.category?.toUpperCase().slice(0, 7)}
        </div>

        {/* Summary */}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-[#aaa] flex items-center gap-1">
            📚 Book {index + 1} of {totalBooks} {isExpanded ? '▼' : '▶'}
            {hasUnresolvedDuplicate && <span className="ml-1">⚠️</span>}
          </div>
          <div className={`text-[15px] font-medium mt-1 ${isSkipped ? 'line-through' : ''}`}>
            {book.title}
          </div>
          <div className="text-[13px] text-[#aaa] mt-0.5">
            {book.category} {book.category_confidence > 0 && `(${Math.round(book.category_confidence * 100)}%)`} • {book.files.length} file{book.files.length !== 1 ? 's' : ''} • {book.author}
          </div>
        </div>
      </div>

      {/* Body - expandable */}
      {isExpanded && (
        <div
          className="px-4 pb-4 border-t border-[#3a3a3a]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Duplicate Banner */}
          {book.duplicate && (
            <DuplicateBanner
              duplicate={book.duplicate}
              action={book.action}
              onActionClick={handleActionClick}
            />
          )}

          {/* Metadata Form - only show if not add_format and not skipped */}
          {book.action !== 'add_format' && book.action !== 'skip' && (
            <div className="mt-4 space-y-4">
              {/* Author */}
              <div>
                <label className="block text-[13px] text-[#aaa] mb-1.5">Author</label>
                <input
                  type="text"
                  value={book.author}
                  onChange={(e) => handleFieldChange('author', e.target.value)}
                  className="w-full px-3 py-3 bg-[#333] border border-[#3a3a3a] rounded-md text-[15px] text-[#e0e0e0] focus:outline-none focus:border-[#667eea]"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-[13px] text-[#aaa] mb-1.5">Title</label>
                <input
                  type="text"
                  value={book.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="w-full px-3 py-3 bg-[#333] border border-[#3a3a3a] rounded-md text-[15px] text-[#e0e0e0] focus:outline-none focus:border-[#667eea]"
                />
              </div>

              {/* Series row */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[13px] text-[#aaa] mb-1.5">Series (optional)</label>
                  <input
                    type="text"
                    value={book.series || ''}
                    onChange={(e) => handleFieldChange('series', e.target.value || null)}
                    placeholder="Series name"
                    className="w-full px-3 py-3 bg-[#333] border border-[#3a3a3a] rounded-md text-[15px] text-[#e0e0e0] placeholder-[#666] focus:outline-none focus:border-[#667eea]"
                  />
                </div>
                <div className="w-20">
                  <label className="block text-[13px] text-[#aaa] mb-1.5">##</label>
                  <input
                    type="text"
                    value={book.series_number || ''}
                    onChange={(e) => handleFieldChange('series_number', e.target.value || null)}
                    className="w-full px-3 py-3 bg-[#333] border border-[#3a3a3a] rounded-md text-[15px] text-[#e0e0e0] focus:outline-none focus:border-[#667eea]"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[13px] text-[#aaa] mb-1.5">Category</label>
                <div className="flex items-center gap-2">
                  <select
                    value={book.category}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                    className="flex-1 px-3 py-3 bg-[#333] border border-[#3a3a3a] rounded-md text-[15px] text-[#e0e0e0] focus:outline-none focus:border-[#667eea]"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {book.category_confidence > 0 && (
                    <span className="text-[11px] px-2 py-1 bg-[#667eea] rounded opacity-80">
                      auto • {Math.round(book.category_confidence * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* File list */}
          <div className="mt-4">
            <div className="text-[13px] text-[#aaa] mb-2">
              {book.files.length} file{book.files.length !== 1 ? 's' : ''}
            </div>
            {book.files.map((file, i) => (
              <div key={i} className="text-[13px] text-[#aaa] py-1">
                • {file.name} ({formatSize(file.size)})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


/**
 * DuplicateBanner - Shows duplicate status and action buttons
 */
function DuplicateBanner({ duplicate, action, onActionClick }) {
  // No action selected yet - show options
  if (!action) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-[#3a3a2a] border border-[#ffc107]">
        <div className="font-medium flex items-center gap-2 mb-2">
          ⚠️ Book Already Exists
        </div>
        <p className="text-sm text-[#aaa] mb-3">
          {duplicate.type === 'exact_match' 
            ? 'This exact file already exists in your library.'
            : 'You have a different format in your library:'}
        </p>

        {/* Comparison boxes */}
        <div className="bg-[#333] rounded p-3 mb-2">
          <div className="text-xs text-[#666] mb-1">In your library:</div>
          <div className="text-[13px] text-[#aaa]">
            📄 {duplicate.existing_files.join(', ')}
          </div>
        </div>
        {duplicate.type === 'different_format' && duplicate.new_files && (
          <div className="bg-[#333] rounded p-3 mb-3">
            <div className="text-xs text-[#666] mb-1">You're uploading:</div>
            <div className="text-[13px] text-[#28a745]">
              📄 {duplicate.new_files.join(', ')} ← NEW FORMAT
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {duplicate.type === 'different_format' && (
            <ActionButton onClick={() => onActionClick('add_format')}>
              Add Format
            </ActionButton>
          )}
          <ActionButton onClick={() => onActionClick('replace')}>
            Replace
          </ActionButton>
          <ActionButton onClick={() => onActionClick('skip')}>
            Skip
          </ActionButton>
        </div>
      </div>
    );
  }

  // Action selected - show confirmation
  if (action === 'add_format') {
    return (
      <div className="mt-4 p-4 rounded-lg bg-[#2a3a2a] border border-[#28a745]">
        <div className="font-medium flex items-center gap-2 mb-2 text-[#28a745]">
          ✓ Adding New Format
        </div>
        <p className="text-sm text-[#aaa] mb-3">
          The new format will be added to your existing book. No metadata changes needed.
        </p>
        <div className="bg-[#333] rounded p-3 mb-3">
          <div className="text-xs text-[#666] mb-1">Will be added:</div>
          <div className="text-[13px] text-[#28a745]">
            📄 {duplicate.new_files?.join(', ')}
          </div>
        </div>
        <ActionButton onClick={() => onActionClick(null)}>Change</ActionButton>
      </div>
    );
  }

  if (action === 'replace') {
    return (
      <div className="mt-4 p-4 rounded-lg bg-[#2a2a3a] border border-[#667eea]">
        <div className="font-medium flex items-center gap-2 mb-2">
          🔄 Replacing Existing Book
        </div>
        <p className="text-sm text-[#aaa] mb-3">
          The existing book will be deleted. Edit metadata below if needed:
        </p>
        <div className="bg-[#333] rounded p-3 mb-2">
          <div className="text-xs text-[#666] mb-1">Will be DELETED:</div>
          <div className="text-[13px] text-[#dc3545]">
            📄 {duplicate.existing_files.join(', ')} ❌
          </div>
        </div>
        <ActionButton onClick={() => onActionClick(null)}>Change</ActionButton>
      </div>
    );
  }

  if (action === 'skip') {
    return (
      <div className="mt-4 p-4 rounded-lg bg-[#333] border border-[#666]">
        <div className="font-medium flex items-center gap-2 mb-2 text-[#aaa]">
          ⏭️ Skipping This Book
        </div>
        <p className="text-sm text-[#666] mb-3">
          This file will not be uploaded.
        </p>
        <ActionButton onClick={() => onActionClick(null)}>Undo</ActionButton>
      </div>
    );
  }

  return null;
}


/**
 * ActionButton - Small action button for duplicate resolution
 */
function ActionButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-[13px] bg-[#333] border border-[#3a3a3a] rounded-md text-[#aaa] hover:border-[#667eea] hover:text-[#e0e0e0] transition-colors min-h-[44px]"
    >
      {children}
    </button>
  );
}
