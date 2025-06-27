import React, { useMemo } from 'react';
import { API_URL } from '../../utils/constants';
import { generateGradient, formatDate } from '../../utils/helpers';

const BookCard = ({ book, onClick }) => {
  const gradient = useMemo(() => {
    if (book.cover_path) return null;
    return generateGradient();
  }, [book.cover_path]);

  return (
    <div className="book-card" onClick={() => onClick(book)}>
      <div 
        className="book-cover" 
        style={!book.cover_path ? { background: gradient } : {}}
      >
        {book.cover_path ? (
          <img 
            src={`${API_URL}/${book.cover_path}`} 
            alt={`Cover for ${book.title}`} 
            className="book-cover-image" 
          />
        ) : (
          <div className="book-cover-placeholder">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
          </div>
        )}
      </div>
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">by {book.author}</p>
        <p className="book-date">{formatDate(book.added_date)}</p>
      </div>
    </div>
  );
};

export default BookCard; 