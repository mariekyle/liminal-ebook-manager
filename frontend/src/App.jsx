import React, { useState } from 'react';
import Header from './components/layout/Header';
import Library from './pages/Library';
import BookDetailPage from './pages/BookDetailPage';
import { useBooks } from './hooks/useBooks';
import { useNotification } from './hooks/useNotification';
import './App.css';

function App() {
  const [selectedBook, setSelectedBook] = useState(null);
  const [sortBy, setSortBy] = useState('recently-added');
  const [uploading, setUploading] = useState(false);

  const {
    books,
    loading,
    error,
    searchQuery,
    searchBooks,
    uploadBook,
    updateBook,
    deleteBook,
    downloadBook,
  } = useBooks();

  const { showNotification } = useNotification();

  const handleSearchChange = (query) => {
    searchBooks(query);
  };

  const handleUpload = async (file) => {
    setUploading(true);
    const result = await uploadBook(file);
    
    if (result.success) {
      showNotification('Book uploaded successfully!', 'success');
    } else {
      showNotification(`Upload failed: ${result.error}`, 'error');
    }
    
    setUploading(false);
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
  };

  const handleBackToLibrary = () => {
    setSelectedBook(null);
  };

  const handleUpdateBook = async (bookId, formData, coverFile) => {
    const result = await updateBook(bookId, formData, coverFile);
    
    if (result.success) {
      setSelectedBook(result.book);
      showNotification('Book updated successfully!', 'success');
    } else {
      showNotification(`Update failed: ${result.error}`, 'error');
    }
    
    return result;
  };

  const handleDeleteBook = async (bookId) => {
    const result = await deleteBook(bookId);
    
    if (result.success) {
      showNotification('Book deleted!', 'success');
    } else {
      showNotification(`Delete failed: ${result.error}`, 'error');
    }
    
    return result;
  };

  const handleDownloadBook = async (bookId) => {
    const result = await downloadBook(bookId);
    
    if (!result.success) {
      showNotification(`Download failed: ${result.error}`, 'error');
    }
    
    return result;
  };

  // Show error notification if there's an error
  React.useEffect(() => {
    if (error) {
      showNotification(`Error: ${error}`, 'error');
    }
  }, [error, showNotification]);

  return (
    <div className="app">
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onUpload={handleUpload}
        uploading={uploading}
      />
      
      <main className="main-content">
        {selectedBook ? (
          <BookDetailPage
            book={selectedBook}
            onBack={handleBackToLibrary}
            onUpdateBook={handleUpdateBook}
            onDelete={handleDeleteBook}
            onDownload={handleDownloadBook}
          />
        ) : (
          <Library
            books={books}
            loading={loading}
            onSelectBook={handleSelectBook}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}
      </main>
    </div>
  );
}

export default App; 