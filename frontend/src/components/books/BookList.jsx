import React from 'react';
import BookCard from './BookCard';
import { SORT_OPTIONS } from '../../utils/constants';

const BookList = ({ books, onSelectBook, sortBy, onSortChange }) => {
  const sortBooks = (booksToSort) => {
    const sortedBooks = [...booksToSort];
    
    switch (sortBy) {
      case 'recently-added':
        return sortedBooks.sort((a, b) => new Date(b.added_date) - new Date(a.added_date));
      case 'title-asc':
        return sortedBooks.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return sortedBooks.sort((a, b) => b.title.localeCompare(a.title));
      case 'read-time-asc':
        return sortedBooks.sort((a, b) => (a.word_count || 0) - (b.word_count || 0));
      case 'read-time-desc':
        return sortedBooks.sort((a, b) => (b.word_count || 0) - (a.word_count || 0));
      case 'date-published-desc':
        return sortedBooks.sort((a, b) => {
          const dateA = a.publication_date ? new Date(a.publication_date) : new Date(0);
          const dateB = b.publication_date ? new Date(b.publication_date) : new Date(0);
          return dateB - dateA;
        });
      case 'date-published-asc':
        return sortedBooks.sort((a, b) => {
          const dateA = a.publication_date ? new Date(a.publication_date) : new Date(0);
          const dateB = b.publication_date ? new Date(b.publication_date) : new Date(0);
          return dateA - dateB;
        });
      default:
        return sortedBooks;
    }
  };

  const sortedBooks = sortBooks(books);

  return (
    <div className="books-container">
      {books.length === 0 ? (
        <div className="empty-state">
          <h2>No books yet!</h2>
          <p>Upload your first EPUB file to get started.</p>
        </div>
      ) : (
        <>
          <div className="books-header">
            <h2>Your Library ({books.length} books)</h2>
            <div className="sort-dropdown">
              <select value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
                {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="books-grid">
            {sortedBooks.map((book) => (
              <BookCard 
                key={book.id} 
                book={book} 
                onClick={onSelectBook} 
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BookList; 