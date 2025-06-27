import React, { useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { useBooks } from '../hooks/useBooks';
import BookList from '../components/books/BookList';
import '../styles/library.css';

const LibraryPage = () => {
  const { state, actions } = useContext(AppContext);
  const { books, loading, error } = useBooks();

  // Load books on mount
  useEffect(() => {
    actions.fetchBooks();
  }, []);

  const handleSearchChange = (query) => {
    actions.setSearchQuery(query);
    actions.fetchBooks(query);
  };

  const handleSortChange = (sortBy) => {
    actions.setSortBy(sortBy);
  };

  if (loading && books.length === 0) {
    return (
      <div className="library-loading">
        <div className="loading-spinner"></div>
        <p>Loading your library...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="library-error">
        <h2>Error loading library</h2>
        <p>{error}</p>
        <button onClick={() => actions.fetchBooks()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>Your Library</h1>
        <p>Manage and organize your digital books</p>
      </div>

      <BookList
        books={books}
        loading={loading}
        searchQuery={state.searchQuery}
        sortBy={state.sortBy}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
      />
    </div>
  );
};

export default LibraryPage; 