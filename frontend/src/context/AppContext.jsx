import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiService } from '../services/api';

// Initial state
const initialState = {
  // Books state
  books: [],
  selectedBook: null,
  loading: false,
  error: null,
  searchQuery: '',
  
  // UI state
  sortBy: 'recently-added',
  view: 'library', // 'library' or 'detail'
  editMode: false,
  uploading: false,
  
  // User preferences
  preferences: {
    theme: 'light',
    itemsPerPage: 20,
    showCovers: true,
    autoRefresh: true
  },
  
  // Notifications
  notifications: []
};

// Action types
export const ACTIONS = {
  // Books actions
  SET_BOOKS: 'SET_BOOKS',
  ADD_BOOK: 'ADD_BOOK',
  UPDATE_BOOK: 'UPDATE_BOOK',
  DELETE_BOOK: 'DELETE_BOOK',
  SET_SELECTED_BOOK: 'SET_SELECTED_BOOK',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  
  // Search and sort
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_SORT_BY: 'SET_SORT_BY',
  
  // UI actions
  SET_VIEW: 'SET_VIEW',
  SET_EDIT_MODE: 'SET_EDIT_MODE',
  SET_UPLOADING: 'SET_UPLOADING',
  
  // Preferences
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
  
  // Notifications
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS'
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_BOOKS:
      return {
        ...state,
        books: action.payload,
        loading: false,
        error: null
      };
      
    case ACTIONS.ADD_BOOK:
      return {
        ...state,
        books: [action.payload, ...state.books],
        loading: false,
        error: null
      };
      
    case ACTIONS.UPDATE_BOOK:
      return {
        ...state,
        books: state.books.map(book => 
          book.id === action.payload.id ? action.payload : book
        ),
        selectedBook: state.selectedBook?.id === action.payload.id 
          ? action.payload 
          : state.selectedBook,
        loading: false,
        error: null
      };
      
    case ACTIONS.DELETE_BOOK:
      return {
        ...state,
        books: state.books.filter(book => book.id !== action.payload),
        selectedBook: state.selectedBook?.id === action.payload 
          ? null 
          : state.selectedBook,
        loading: false,
        error: null
      };
      
    case ACTIONS.SET_SELECTED_BOOK:
      return {
        ...state,
        selectedBook: action.payload,
        view: action.payload ? 'detail' : 'library'
      };
      
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
      
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
      
    case ACTIONS.SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload
      };
      
    case ACTIONS.SET_SORT_BY:
      return {
        ...state,
        sortBy: action.payload
      };
      
    case ACTIONS.SET_VIEW:
      return {
        ...state,
        view: action.payload
      };
      
    case ACTIONS.SET_EDIT_MODE:
      return {
        ...state,
        editMode: action.payload
      };
      
    case ACTIONS.SET_UPLOADING:
      return {
        ...state,
        uploading: action.payload
      };
      
    case ACTIONS.UPDATE_PREFERENCES:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload
        }
      };
      
    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: Date.now(),
            ...action.payload
          }
        ]
      };
      
    case ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };
      
    case ACTIONS.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: []
      };
      
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('liminal-preferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ 
          type: ACTIONS.UPDATE_PREFERENCES, 
          payload: preferences 
        });
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('liminal-preferences', JSON.stringify(state.preferences));
  }, [state.preferences]);

  // Actions
  const actions = {
    // Books actions
    fetchBooks: async (searchQuery = '') => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        const books = await apiService.getBooks(searchQuery);
        dispatch({ type: ACTIONS.SET_BOOKS, payload: books });
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      }
    },

    uploadBook: async (file) => {
      try {
        dispatch({ type: ACTIONS.SET_UPLOADING, payload: true });
        const book = await apiService.uploadBook(file);
        dispatch({ type: ACTIONS.ADD_BOOK, payload: book });
        return { success: true };
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        return { success: false, error: error.message };
      } finally {
        dispatch({ type: ACTIONS.SET_UPLOADING, payload: false });
      }
    },

    updateBook: async (bookId, bookData, coverFile) => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        const updatedBook = await apiService.updateBook(bookId, bookData, coverFile);
        dispatch({ type: ACTIONS.UPDATE_BOOK, payload: updatedBook });
        return { success: true, book: updatedBook };
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        return { success: false, error: error.message };
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    deleteBook: async (bookId) => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        await apiService.deleteBook(bookId);
        dispatch({ type: ACTIONS.DELETE_BOOK, payload: bookId });
        return { success: true };
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        return { success: false, error: error.message };
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    downloadBook: async (bookId) => {
      try {
        await apiService.downloadBook(bookId);
        return { success: true };
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        return { success: false, error: error.message };
      }
    },

    // UI actions
    setSelectedBook: (book) => {
      dispatch({ type: ACTIONS.SET_SELECTED_BOOK, payload: book });
    },

    setSearchQuery: (query) => {
      dispatch({ type: ACTIONS.SET_SEARCH_QUERY, payload: query });
    },

    setSortBy: (sortBy) => {
      dispatch({ type: ACTIONS.SET_SORT_BY, payload: sortBy });
    },

    setView: (view) => {
      dispatch({ type: ACTIONS.SET_VIEW, payload: view });
    },

    setEditMode: (editMode) => {
      dispatch({ type: ACTIONS.SET_EDIT_MODE, payload: editMode });
    },

    // Preferences actions
    updatePreferences: (preferences) => {
      dispatch({ type: ACTIONS.UPDATE_PREFERENCES, payload: preferences });
    },

    // Notification actions
    addNotification: (notification) => {
      dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: notification });
    },

    removeNotification: (id) => {
      dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id });
    },

    clearNotifications: () => {
      dispatch({ type: ACTIONS.CLEAR_NOTIFICATIONS });
    }
  };

  // Computed values
  const computed = {
    // Filtered and sorted books
    sortedBooks: () => {
      const { books, sortBy } = state;
      const sortedBooks = [...books];
      
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
    },

    // Search filtered books
    filteredBooks: () => {
      const { books, searchQuery } = state;
      if (!searchQuery.trim()) return books;
      
      const query = searchQuery.toLowerCase();
      return books.filter(book => 
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.description && book.description.toLowerCase().includes(query)) ||
        (book.tags && book.tags.toLowerCase().includes(query))
      );
    },

    // Final books to display (filtered and sorted)
    displayBooks: () => {
      const filtered = computed.filteredBooks();
      const sorted = [...filtered];
      
      switch (state.sortBy) {
        case 'recently-added':
          return sorted.sort((a, b) => new Date(b.added_date) - new Date(a.added_date));
        case 'title-asc':
          return sorted.sort((a, b) => a.title.localeCompare(b.title));
        case 'title-desc':
          return sorted.sort((a, b) => b.title.localeCompare(a.title));
        case 'read-time-asc':
          return sorted.sort((a, b) => (a.word_count || 0) - (b.word_count || 0));
        case 'read-time-desc':
          return sorted.sort((a, b) => (b.word_count || 0) - (a.word_count || 0));
        case 'date-published-desc':
          return sorted.sort((a, b) => {
            const dateA = a.publication_date ? new Date(a.publication_date) : new Date(0);
            const dateB = b.publication_date ? new Date(b.publication_date) : new Date(0);
            return dateB - dateA;
          });
        case 'date-published-asc':
          return sorted.sort((a, b) => {
            const dateA = a.publication_date ? new Date(a.publication_date) : new Date(0);
            const dateB = b.publication_date ? new Date(b.publication_date) : new Date(0);
            return dateA - dateB;
          });
        default:
          return sorted;
      }
    }
  };

  const value = {
    state,
    actions,
    computed
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 