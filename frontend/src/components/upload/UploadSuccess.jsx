/**
 * UploadSuccess.jsx
 * 
 * Success screen showing upload results summary.
 */

export default function UploadSuccess({ results, books, onGoToLibrary, onUploadMore }) {
  if (!results) return null;

  // Calculate stats
  const created = results.results.filter(r => r.status === 'created').length;
  const formatAdded = results.results.filter(r => r.status === 'format_added').length;
  const skipped = results.results.filter(r => r.status === 'skipped').length;
  const errors = results.results.filter(r => r.status === 'error').length;
  
  const totalFiles = books
    .filter(b => b.action !== 'skip')
    .reduce((sum, b) => sum + b.files.length, 0);
  
  const totalSize = books
    .filter(b => b.action !== 'skip')
    .reduce((sum, b) => sum + b.files.reduce((s, f) => s + f.size, 0), 0);
  
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1);

  // Map results to books for display
  const bookResults = results.results.map(result => {
    const book = books.find(b => b.id === result.id);
    return { ...result, book };
  });

  const getBadge = (status) => {
    switch (status) {
      case 'created':
        return { text: 'NEW', class: 'bg-[#28a745]' };
      case 'format_added':
        return { text: '+FORMAT', class: 'bg-[#667eea]' };
      case 'skipped':
        return { text: 'SKIPPED', class: 'bg-[#666]' };
      case 'error':
        return { text: 'ERROR', class: 'bg-[#dc3545]' };
      default:
        return null;
    }
  };

  return (
    <div className="text-center py-10">
      {/* Success icon */}
      <div className="text-6xl text-[#28a745] mb-6">✓</div>
      
      {/* Title */}
      <h1 className="text-2xl font-semibold mb-2">Added to your library</h1>
      <p className="text-base text-[#aaa] mb-8">
        {created + formatAdded} {created + formatAdded !== 1 ? 'stories' : 'story'} processed
      </p>

      {/* Summary */}
      <div className="bg-[#2a2a2a] rounded-lg p-5 mb-8 text-left">
        <div className="space-y-2">
          {created > 0 && (
            <SummaryRow label="New Stories Added" value={created} />
          )}
          {formatAdded > 0 && (
            <SummaryRow label="Formats Added" value={formatAdded} />
          )}
          {skipped > 0 && (
            <SummaryRow label="Skipped" value={skipped} />
          )}
          {errors > 0 && (
            <SummaryRow label="Errors" value={errors} isError />
          )}
          <div className="border-t border-[#3a3a3a] my-2" />
          <SummaryRow label="Files Uploaded" value={totalFiles} />
          <SummaryRow label="Total Size" value={`${totalSizeMB} MB`} />
        </div>

        {/* Book list */}
        <div className="mt-4 pt-4 border-t border-[#3a3a3a]">
          <h3 className="text-sm text-[#aaa] mb-3">Results:</h3>
          <div className="space-y-2">
            {bookResults.map(({ id, status, book, message }) => {
              const badge = getBadge(status);
              return (
                <div
                  key={id}
                  className={`flex items-center gap-2 text-sm ${status === 'skipped' ? 'text-[#666] line-through' : ''}`}
                >
                  <span className={status === 'error' ? 'text-[#dc3545]' : 'text-[#28a745]'}>
                    {status === 'error' ? '✗' : status === 'skipped' ? '⏭' : '✓'}
                  </span>
                  <span className="flex-1 truncate">
                    {book?.title || 'Unknown'}
                  </span>
                  {badge && (
                    <span className={`text-[11px] px-2 py-0.5 rounded text-white ${badge.class}`}>
                      {badge.text}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error messages */}
        {errors > 0 && (
          <div className="mt-4 pt-4 border-t border-[#3a3a3a]">
            <h3 className="text-sm text-[#dc3545] mb-2">Errors:</h3>
            {bookResults
              .filter(r => r.status === 'error')
              .map(({ id, book, message }) => (
                <div key={id} className="text-sm text-[#dc3545]">
                  • {book?.title}: {message}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onGoToLibrary}
          className="w-full py-4 px-6 bg-[#667eea] hover:bg-[#5568d3] text-white font-medium rounded-lg transition-colors min-h-[52px]"
        >
          View Library
        </button>
        <button
          onClick={onUploadMore}
          className="w-full py-4 px-6 bg-transparent border border-[#4a4a4a] hover:border-[#667eea] text-[#aaa] hover:text-[#e0e0e0] rounded-lg transition-colors min-h-[52px]"
        >
          Upload More
        </button>
      </div>
    </div>
  );
}


function SummaryRow({ label, value, isError = false }) {
  return (
    <div className="flex justify-between py-2 border-b border-[#3a3a3a] last:border-b-0">
      <span className="text-[#aaa]">{label}</span>
      <span className={`font-medium ${isError ? 'text-[#dc3545]' : ''}`}>{value}</span>
    </div>
  );
}
