/**
 * UploadSuccess.jsx
 * 
 * Success screen showing upload results summary.
 */

import { useNavigate } from 'react-router-dom';
import StepIndicator from '../add/StepIndicator';

export default function UploadSuccess({ results, books, onGoToLibrary, onUploadMore }) {
  const navigate = useNavigate();

  if (!results) return null;

  // Calculate stats
  const created = results.results.filter(r => r.status === 'created').length;
  const formatAdded = results.results.filter(r => r.status === 'format_added').length;
  const skipped = results.results.filter(r => r.status === 'skipped').length;
  const errors = results.results.filter(r => r.status === 'error').length;
  
  const successCount = created + formatAdded;
  
  const totalFiles = books
    .filter(b => b.action !== 'skip')
    .reduce((sum, b) => sum + (b.files?.length || 0), 0);
  
  const totalSize = books
    .filter(b => b.action !== 'skip')
    .reduce((sum, b) => sum + (b.files?.reduce((s, f) => s + (f.size || 0), 0) || 0), 0);
  
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1);

  // Map results to books for display
  const bookResults = results.results
    .filter(r => r.status !== 'skipped')
    .map(result => {
      const book = books.find(b => b.id === result.id);
      return { ...result, book };
    });

  // Check if single successful book with valid title_id (for "View Story" button)
  // Only show "View Story" if we have a real database title_id (not a session UUID)
  const singleResult = bookResults.length === 1 && bookResults[0].status !== 'error' 
    ? bookResults[0] 
    : null;
  const singleBookId = singleResult?.title_id || singleResult?.book?.title_id || null;
  const singleSuccess = singleBookId !== null;

  const handleViewStory = () => {
    if (singleBookId) {
      navigate(`/book/${singleBookId}`);
    }
  };

  const handleBookClick = (bookId) => {
    if (bookId) {
      navigate(`/book/${bookId}`);
    }
  };

  const getBadge = (status) => {
    switch (status) {
      case 'created':
        return { text: 'NEW', class: 'bg-green-500' };
      case 'format_added':
        return { text: '+FORMAT', class: 'bg-[#667eea]' };
      case 'error':
        return { text: 'ERROR', class: 'bg-red-500' };
      default:
        return null;
    }
  };

  return (
    <div className="py-6">
      {/* Step Indicator */}
      <StepIndicator steps={['Add', 'Review', 'Done']} currentStep={2} />

      {/* Success header */}
      <div className="text-center mb-6">
        <div className="text-5xl text-green-500 mb-4">✓</div>
        <h1 className="text-xl font-semibold text-white mb-1">Added to your library</h1>
        <p className="text-gray-400">
          {successCount === 1 ? 'Your collection grows' : `${successCount} stories added`}
        </p>
      </div>

      {/* Stats summary */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
        <div className="space-y-2">
          {created > 0 && (
            <SummaryRow label="New Stories Added" value={created} />
          )}
          {formatAdded > 0 && (
            <SummaryRow label="Formats Added" value={formatAdded} />
          )}
          {totalFiles > 0 && (
            <SummaryRow label="Files Processed" value={totalFiles} />
          )}
          {totalSize > 0 && (
            <SummaryRow label="Total Size" value={`${totalSizeMB} MB`} />
          )}
        </div>
      </div>

      {/* Results list - tappable */}
      {bookResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm text-gray-500 mb-2">Results</h3>
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            {bookResults.map((result) => {
              const { id, status, book, message, title_id } = result;
              const badge = getBadge(status);
              const isError = status === 'error';
              // Only use valid database title_id (not session UUID)
              const bookId = title_id || book?.title_id || null;
              const isClickable = !isError && bookId !== null;
              
              return (
                <button
                  key={id}
                  onClick={() => isClickable && handleBookClick(bookId)}
                  disabled={!isClickable}
                  className={`
                    w-full px-4 py-3 flex items-center gap-3 text-left
                    border-b border-gray-700 last:border-b-0
                    ${!isClickable 
                      ? 'cursor-default' 
                      : 'hover:bg-gray-700/50 transition-colors'
                    }
                    ${isError ? 'opacity-60' : ''}
                  `}
                >
                  <span className={isError ? 'text-red-500' : 'text-green-500'}>
                    {isError ? '✗' : '✓'}
                  </span>
                  <span className="flex-1 truncate text-sm">
                    {book?.title || 'Unknown'}
                  </span>
                  {badge && (
                    <span className={`text-xs px-2 py-0.5 rounded text-white ${badge.class}`}>
                      {badge.text}
                    </span>
                  )}
                  {isClickable && (
                    <span className="text-gray-500 text-sm">›</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Error messages */}
      {errors > 0 && (
        <div className="mb-6 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <h3 className="text-sm text-red-400 mb-2">Errors</h3>
          {bookResults
            .filter(r => r.status === 'error')
            .map(({ id, book, message }) => (
              <p key={id} className="text-sm text-red-300">
                • {book?.title || 'Unknown'}: {message}
              </p>
            ))}
        </div>
      )}

      {/* Action buttons */}
      <div className={`flex gap-3 ${singleSuccess ? '' : 'flex-col'}`}>
        <button
          onClick={onUploadMore}
          className={`
            py-3 px-6 rounded-lg font-medium transition-colors
            ${singleSuccess 
              ? 'flex-1 bg-gray-700 text-white hover:bg-gray-600' 
              : 'w-full bg-gray-700 text-white hover:bg-gray-600'
            }
          `}
        >
          Add More
        </button>
        {singleSuccess && (
          <button
            onClick={handleViewStory}
            className="flex-1 py-3 px-6 bg-[#667eea] hover:bg-[#5a6fd6] text-white font-medium rounded-lg transition-colors"
          >
            View Story
          </button>
        )}
      </div>
    </div>
  );
}


function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
