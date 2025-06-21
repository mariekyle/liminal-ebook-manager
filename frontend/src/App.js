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

function App() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', author: '', description: '' });
  const [newCoverFile, setNewCoverFile] = useState(null);

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

  useEffect(() => {
    fetchBooks();
  }, []);

  return (
    <div className='app'>
      <header className='app-header'>
        <h1>📚 Liminal Ebook Manager</h1>
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
            {uploading ? '⏳ Uploading...' : '📤 Upload EPUB'}
          </label>
        </div>
      </header>
      <main className='main-content'>
        {selectedBook ? (
          <div className='book-detail'>
            <button className='back-btn' onClick={() => { setSelectedBook(null); setEditMode(false); }}>
              ← Back to Library
            </button>
            {editMode ? (
              <div className='edit-form'>
                <h2>Edit Book</h2>
                <div className='form-group'>
                  <label>Title</label>
                  <input
                    type='text'
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className='form-input'
                  />
                </div>
                <div className='form-group'>
                  <label>Author</label>
                  <input
                    type='text'
                    value={editForm.author}
                    onChange={(e) => setEditForm({...editForm, author: e.target.value})}
                    className='form-input'
                  />
                </div>
                <div className='form-group'>
                  <label>Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    className='form-textarea'
                    rows='6'
                  />
                </div>
                <div className='form-group'>
                  <label>Cover Image</label>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={(e) => setNewCoverFile(e.target.files[0])}
                    className='form-input'
                  />
                </div>
                <div className='form-actions'>
                  <button onClick={updateBook} className='btn btn-primary'>
                    💾 Save Changes
                  </button>
                  <button onClick={cancelEdit} className='btn btn-secondary'>
                    ❌ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="book-detail-content">
                {selectedBook.cover_path && (
                  <div className="book-detail-cover">
                    <img src={`${API_URL}/${selectedBook.cover_path}`} alt={`Cover for ${selectedBook.title}`} />
                  </div>
                )}
                <div className='book-info-main'>
                  <h2>{selectedBook.title}</h2>
                  <p className='author'>by {selectedBook.author}</p>
                  {selectedBook.description && (
                    <div className='description'>
                      <h3>Description</h3>
                      <p>{selectedBook.description}</p>
                    </div>
                  )}
                  <div className='metadata'>
                    <p><strong>Added:</strong> {new Date(selectedBook.added_date).toLocaleDateString()}</p>
                    {selectedBook.file_size && (
                      <p><strong>File Size:</strong> {(selectedBook.file_size / 1024 / 1024).toFixed(2)} MB</p>
                    )}
                  </div>
                  <div className='actions'>
                    <button onClick={startEdit} className='btn btn-edit'>
                      ✏️ Edit
                    </button>
                    {selectedBook.file_path && (
                      <a 
                        href={`${API_URL}/${selectedBook.file_path}`} 
                        download 
                        className='btn btn-download'
                      >
                        📥 Download
                      </a>
                    )}
                    <button 
                      onClick={() => deleteBook(selectedBook.id)}
                      className='btn btn-delete'
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <BookList books={books} onSelectBook={setSelectedBook} />
        )}
      </main>
    </div>
  );
}

function BookList({ books, onSelectBook }) {
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