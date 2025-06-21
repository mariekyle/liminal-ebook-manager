import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const colorPalette = [
  '#ff9a9e', '#fecfef', '#f6d365', '#fda085', '#a1c4fd', 
  '#c2e9fb', '#d4fc79', '#96e6a1', '#84fab0', '#8fd3f4',
  '#f093fb', '#f5576c', '#4facfe', '#43e97b', '#fa709a'
];

const generateGradient = () => {
  const color1 = colorPalette[Math.floor(Math.random() * colorPalette.length)];
  const color2 = colorPalette[Math.floor(Math.random() * colorPalette.length)];
  const angle = Math.floor(Math.random() * 360);
  return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
};

const formatReadingTime = (wordCount) => {
  if (wordCount === -1) {
    return 'Could not calculate';
  }
  if (!wordCount || wordCount === 0) {
    return 'Calculating...';
  }

  const wpm = 195; // User's average reading speed
  const minutes = wordCount / wpm;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (minutes < 1) {
    return 'Less than a minute';
  }
  
  const parts = [];
  if (hours > 0) {
    parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  }
  if (remainingMinutes > 0) {
    parts.push(`${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`);
  }
  return parts.join(' ');
};

function App() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', author: '', description: '' });
  const [newCoverFile, setNewCoverFile] = useState(null);
  const [sortBy, setSortBy] = useState('recently-added');

  const fetchBooks = async () => {
    try {
      const response = await fetch(API_URL + '/books');
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const searchBooks = async (query) => {
    if (!query.trim()) {
      fetchBooks();
      return;
    }
    try {
      const response = await fetch(API_URL + '/books?search=' + encodeURIComponent(query));
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const uploadFile = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(API_URL + '/books/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        fetchBooks();
        showNotification('Book uploaded successfully!', 'success');
      } else {
        showNotification('Upload failed!', 'error');
      }
    } catch (error) {
      showNotification('Upload failed!', 'error');
    } finally {
      setUploading(false);
    }
  };

  const updateBook = async () => {
    if (!selectedBook) return;

    const formData = new FormData();
    formData.append('title', editForm.title);
    formData.append('author', editForm.author);
    formData.append('description', editForm.description || '');

    if (newCoverFile) {
      formData.append('cover_file', newCoverFile);
    }

    try {
      const response = await fetch(API_URL + '/books/' + selectedBook.id, {
        method: 'PUT',
        body: formData,
      });
      if (response.ok) {
        const updatedBook = await response.json();
        setBooks(books.map(book => book.id === selectedBook.id ? updatedBook : book));
        setSelectedBook(updatedBook);
        setEditMode(false);
        setNewCoverFile(null);
        showNotification('Book updated successfully!', 'success');
      } else {
        const errorData = await response.json();
        showNotification(`Update failed: ${errorData.detail || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      showNotification('Update failed!', 'error');
    }
  };

  const deleteBook = async (bookId) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      const response = await fetch(API_URL + '/books/' + bookId, { method: 'DELETE' });
      if (response.ok) {
        setBooks(books.filter(book => book.id !== bookId));
        setSelectedBook(null);
        setEditMode(false);
        setNewCoverFile(null);
        showNotification('Book deleted!', 'success');
      }
    } catch (error) {
      showNotification('Delete failed!', 'error');
    }
  };

  const startEdit = () => {
    setEditForm({
      title: selectedBook.title || '',
      author: selectedBook.author || '',
      description: selectedBook.description || ''
    });
    setEditMode(true);
    setNewCoverFile(null);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditForm({ title: '', author: '', description: '' });
    setNewCoverFile(null);
  };

  const showNotification = (message, type) => {
    const notification = document.createElement('div');
    notification.className = 'notification ' + type;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  };

  const sortBooks = (booksToSort) => {
    const sortedBooks = [...booksToSort];
    
    switch (sortBy) {
      case 'recently-added':
        return sortedBooks.sort((a, b) => new Date(b.added_date) - new Date(a.added_date));
      case 'read-time':
        return sortedBooks.sort((a, b) => (b.word_count || 0) - (a.word_count || 0));
      case 'title':
        return sortedBooks.sort((a, b) => a.title.localeCompare(b.title));
      case 'date-published':
        return sortedBooks.sort((a, b) => {
          const dateA = a.publication_date ? new Date(a.publication_date) : new Date(0);
          const dateB = b.publication_date ? new Date(b.publication_date) : new Date(0);
          return dateB - dateA;
        });
      default:
        return sortedBooks;
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return (
    <div className='app'>
      <header className='app-header'>
        <div className='header-content'>
          <div className='app-title'>Liminal</div>
          <div className='search-bar'>
            <input
              type='text'
              placeholder='Search books by title or author...'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchBooks(e.target.value);
              }}
            />
          </div>
          <div className='upload-section'>
            <input
              type='file'
              accept='.epub'
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  uploadFile(e.target.files[0]);
                }
              }}
              disabled={uploading}
              id='file-upload'
              style={{ display: 'none' }}
            />
            <label htmlFor='file-upload' className={uploading ? 'upload-btn uploading' : 'upload-btn'}>
              {uploading ? 'Uploading...' : 'Upload EPUB'}
            </label>
          </div>
        </div>
      </header>
      <main className='main-content'>
        {selectedBook ? (
          <div className='book-detail-container'>
            {editMode ? (
              <div className='edit-book-container'>
                <div className='edit-book-header'>
                  <h2>Edit Book</h2>
                  <button className='back-btn' onClick={() => { setSelectedBook(null); setEditMode(false); }}>
                    ← Back to Library
                  </button>
                </div>
                <div className='edit-book-body'>
                  <div className='edit-form'>
                    <div className='form-group'>
                      <label>Title</label>
                      <input
                        type='text'
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className='form-input'
                      />
                    </div>
                    <div className='form-group'>
                      <label>Author</label>
                      <input
                        type='text'
                        value={editForm.author}
                        onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                        className='form-input'
                      />
                    </div>
                    <div className='form-group'>
                      <label>Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className='form-textarea'
                        rows='6'
                      />
                    </div>
                    <div className='form-group'>
                      <label>Cover Image</label>
                      <label htmlFor='cover-upload' className='custom-file-upload'>
                        Choose File
                      </label>
                      <input
                        id='cover-upload'
                        type='file'
                        accept='image/*'
                        onChange={(e) => setNewCoverFile(e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                      {newCoverFile && <span className='file-name'>{newCoverFile.name}</span>}
                    </div>
                    <div className='form-actions'>
                      <button onClick={updateBook} className='btn btn-primary'>
                        Save Changes
                      </button>
                      <button onClick={cancelEdit} className='btn btn-secondary'>
                        Cancel
                      </button>
                    </div>
                  </div>
                  <div className='edit-book-preview'>
                    {selectedBook.cover_path && (
                      <img src={`${API_URL}/${selectedBook.cover_path}`} alt={`Cover for ${selectedBook.title}`} />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className='book-detail-header'>
                  <div>
                    <h1 className='book-title-large'>{selectedBook.title}</h1>
                    <h2 className='book-author-large'>by {selectedBook.author}</h2>
                  </div>
                  <button className='btn back-btn' onClick={() => setSelectedBook(null)}>
                    ← Back to Library
                  </button>
                </div>
                <div className='book-detail-content-area'>
                  <div className='book-detail-main-content'>
                    <div className='book-metadata-large'>
                      <div className='metadata-item'>
                        <span className='metadata-label'>Est. Reading Time</span>
                        <span className='metadata-value'>{formatReadingTime(selectedBook.word_count)}</span>
                      </div>
                      {selectedBook.file_size && (
                        <div className='metadata-item'>
                          <span className='metadata-label'>File Size</span>
                          <span className='metadata-value'>{(selectedBook.file_size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      )}
                      <div className='metadata-item'>
                        <span className='metadata-label'>Added On</span>
                        <span className='metadata-value'>{new Date(selectedBook.added_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className='book-metadata-grid'>
                      {selectedBook.publication_date && (
                        <div className='metadata-item-grid'>
                          <span className='metadata-label'>Published</span>
                          <span className='metadata-value'>{new Date(selectedBook.publication_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {selectedBook.tags && (
                      <div className='book-tags-section'>
                        <h3 className='tags-header'>Tags</h3>
                        <div className='tags-container'>
                          {selectedBook.tags.split(',').map(tag => tag.trim()).map(tag => (
                            <span key={tag} className='tag-badge'>{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedBook.description && (
                      <p className='book-description-large'>{selectedBook.description}</p>
                    )}
                    
                    <div className='book-actions'>
                      <button onClick={startEdit} className='btn btn-edit'>
                        Edit
                      </button>
                      <a
                        href={`${API_URL}/books/${selectedBook.id}/download`}
                        download
                        className='btn btn-download'
                      >
                        Download
                      </a>
                      <button
                        onClick={() => deleteBook(selectedBook.id)}
                        className='btn btn-delete'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className='book-detail-sidebar'>
                    {selectedBook.cover_path ? (
                      <img
                        src={`${API_URL}/${selectedBook.cover_path}`}
                        alt={selectedBook.title}
                        className='book-cover-large'
                      />
                    ) : (
                      <div className='book-cover-large-placeholder' style={{ background: generateGradient() }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <BookList 
            books={sortBooks(books)} 
            onSelectBook={setSelectedBook} 
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}
      </main>
    </div>
  );
}

function BookList({ books, onSelectBook, sortBy, onSortChange }) {
  const gradientMap = useMemo(() => {
    const map = new Map();
    books.forEach(book => {
      if (!book.cover_path) {
        map.set(book.id, generateGradient());
      }
    });
    return map;
  }, [books]);

  return (
    <div className='books-container'>
      {books.length === 0 ? (
        <div className='empty-state'>
          <h2>No books yet!</h2>
          <p>Upload your first EPUB file to get started.</p>
        </div>
      ) : (
        <>
          <div className='books-header'>
            <h2>Your Library ({books.length} books)</h2>
            <div className='sort-dropdown'>
              <select value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
                <option value='recently-added'>Recently Added</option>
                <option value='read-time'>Read Time</option>
                <option value='title'>Title</option>
                <option value='date-published'>Date Published</option>
              </select>
            </div>
          </div>
          <div className='books-grid'>
            {books.map((book) => (
              <div key={book.id} className='book-card' onClick={() => onSelectBook(book)}>
                <div className='book-cover' style={!book.cover_path ? { background: gradientMap.get(book.id) } : {}}>
                  {book.cover_path ? (
                    <img src={`${API_URL}/${book.cover_path}`} alt={`Cover for ${book.title}`} className='book-cover-image' />
                  ) : (
                    null
                  )}
                </div>
                <h3 className='book-title'>{book.title}</h3>
                <p className='book-author'>by {book.author}</p>
                <p className='book-date'>{new Date(book.added_date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App; 