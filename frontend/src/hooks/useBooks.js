import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

export const useBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBooks = useCallback(async (query = '') => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getBooks(query);
      setBooks(data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch books:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchBooks = useCallback(async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      await fetchBooks();
    } else {
      await fetchBooks(query);
    }
  }, [fetchBooks]);

  const uploadBook = useCallback(async (file) => {
    try {
      setLoading(true);
      await apiService.uploadBook(file);
      await fetchBooks(searchQuery); // Refresh the list
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchBooks, searchQuery]);

  const updateBook = useCallback(async (id, bookData, coverFile) => {
    try {
      setLoading(true);
      const updatedBook = await apiService.updateBook(id, bookData, coverFile);
      setBooks(prevBooks => 
        prevBooks.map(book => book.id === id ? updatedBook : book)
      );
      return { success: true, book: updatedBook };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBook = useCallback(async (id) => {
    try {
      setLoading(true);
      await apiService.deleteBook(id);
      setBooks(prevBooks => prevBooks.filter(book => book.id !== id));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadBook = useCallback(async (id) => {
    try {
      await apiService.downloadBook(id);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return {
    books,
    loading,
    error,
    searchQuery,
    fetchBooks,
    searchBooks,
    uploadBook,
    updateBook,
    deleteBook,
    downloadBook,
  };
}; 