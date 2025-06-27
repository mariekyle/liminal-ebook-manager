import React from 'react';
import { API_URL } from '../../utils/constants';
import { generateGradient, formatReadingTime, formatFileSize, formatDate } from '../../utils/helpers';
import Button from '../common/Button';

const BookDetail = ({ book, onBack, onEdit, onDelete, onDownload }) => {
  const gradient = generateGradient();

  return (
    <div className="book-detail-container">
      <div className="book-detail-header">
        <div>
          <h1 className="book-title-large">{book.title}</h1>
          <h2 className="book-author-large">by {book.author}</h2>
        </div>
        <Button variant="secondary" onClick={onBack}>
          ← Back to Library
        </Button>
      </div>
      
      <div className="book-detail-content-area">
        <div className="book-detail-main-content">
          <div className="book-metadata-large">
            <div className="metadata-item">
              <span className="metadata-label">Est. Reading Time</span>
              <span className="metadata-value">{formatReadingTime(book.word_count)}</span>
            </div>
            {book.file_size && (
              <div className="metadata-item">
                <span className="metadata-label">File Size</span>
                <span className="metadata-value">{formatFileSize(book.file_size)}</span>
              </div>
            )}
            <div className="metadata-item">
              <span className="metadata-label">Added On</span>
              <span className="metadata-value">{formatDate(book.added_date)}</span>
            </div>
          </div>
          
          <div className="book-metadata-grid">
            {book.publication_date && (
              <div className="metadata-item-grid">
                <span className="metadata-label">Published</span>
                <span className="metadata-value">{formatDate(book.publication_date)}</span>
              </div>
            )}
          </div>
          
          {book.tags && (
            <div className="book-tags-section">
              <h3 className="tags-header">Tags</h3>
              <div className="tags-container">
                {book.tags.split(',').map(tag => tag.trim()).map(tag => (
                  <span key={tag} className="tag-badge">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {book.description && (
            <p className="book-description-large">{book.description}</p>
          )}
          
          <div className="book-actions">
            <Button variant="primary" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="success" onClick={() => onDownload(book.id)}>
              Download
            </Button>
            <Button variant="danger" onClick={() => onDelete(book.id)}>
              Delete
            </Button>
          </div>
        </div>
        
        <div className="book-detail-sidebar">
          {book.cover_path ? (
            <img
              src={`${API_URL}/${book.cover_path}`}
              alt={book.title}
              className="book-cover-large"
            />
          ) : (
            <div className="book-cover-large-placeholder" style={{ background: gradient }}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="64" 
                height="64" 
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
      </div>
    </div>
  );
};

export default BookDetail; 