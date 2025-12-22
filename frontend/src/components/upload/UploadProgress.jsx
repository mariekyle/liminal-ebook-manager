/**
 * UploadProgress.jsx
 * 
 * Shows upload progress for each book.
 */

export default function UploadProgress({ books, progress }) {
  // Simulate per-book progress based on overall progress
  const getBookStatus = (index) => {
    const booksToUpload = books.filter(b => b.action !== 'skip');
    const bookIndex = booksToUpload.findIndex(b => b.id === books[index].id);
    
    if (books[index].action === 'skip') {
      return 'skipped';
    }
    
    if (bookIndex === -1) return 'pending';
    
    const perBookProgress = 100 / booksToUpload.length;
    const bookThreshold = perBookProgress * (bookIndex + 1);
    
    if (progress >= bookThreshold) {
      return 'done';
    } else if (progress >= perBookProgress * bookIndex) {
      return 'uploading';
    }
    return 'pending';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done': return { icon: '✓', class: 'text-[#28a745]' };
      case 'uploading': return { icon: '◐', class: 'text-[#667eea] animate-spin' };
      case 'skipped': return { icon: '⏭', class: 'text-[#666]' };
      default: return { icon: '○', class: 'text-[#666]' };
    }
  };

  const getStatusText = (book, status) => {
    if (status === 'skipped') return 'Skipped';
    if (status === 'done') {
      if (book.action === 'add_format') {
        return `Format added (${book.files.length} file${book.files.length !== 1 ? 's' : ''})`;
      }
      return `${book.files.length} file${book.files.length !== 1 ? 's' : ''} uploaded`;
    }
    if (status === 'uploading') {
      if (book.action === 'add_format') {
        return 'Adding format...';
      }
      return 'Uploading...';
    }
    return 'Waiting...';
  };

  return (
    <div className="py-5">
      <h2 className="text-lg text-center mb-6">Uploading books</h2>

      {/* Per-book progress */}
      <div className="space-y-3">
        {books.map((book, index) => {
          const status = getBookStatus(index);
          const { icon, class: iconClass } = getStatusIcon(status);
          
          return (
            <div key={book.id} className="bg-[#2a2a2a] rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xl ${iconClass}`}>{icon}</span>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${status === 'skipped' ? 'line-through text-[#666]' : ''}`}>
                    {book.title}
                  </div>
                  <div className="text-xs text-[#aaa]">
                    {getStatusText(book, status)}
                  </div>
                </div>
              </div>
              
              {status === 'uploading' && (
                <div className="h-2 bg-[#333] rounded overflow-hidden">
                  <div
                    className="h-full bg-[#667eea] rounded transition-all duration-300 animate-pulse"
                    style={{ width: '67%' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall progress */}
      <div className="mt-6 bg-[#2a2a2a] rounded-lg p-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Overall Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-[#333] rounded overflow-hidden">
          <div
            className="h-full bg-[#667eea] rounded transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
