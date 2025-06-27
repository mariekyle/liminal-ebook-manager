import { API_URL } from '../utils/constants';

class ApiService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Books API
  async getBooks(searchQuery = '') {
    const endpoint = searchQuery ? `/books?search=${encodeURIComponent(searchQuery)}` : '/books';
    return this.request(endpoint);
  }

  async getBook(id) {
    return this.request(`/books/${id}`);
  }

  async uploadBook(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = `${this.baseURL}/books/upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Upload failed! status: ${response.status}`);
    }

    return await response.json();
  }

  async updateBook(id, bookData, coverFile = null) {
    const formData = new FormData();
    
    // Add text fields
    Object.keys(bookData).forEach(key => {
      if (bookData[key] !== undefined && bookData[key] !== null) {
        if (Array.isArray(bookData[key])) {
          formData.append(key, bookData[key].join(','));
        } else {
          formData.append(key, bookData[key]);
        }
      }
    });

    // Add cover file if provided
    if (coverFile) {
      formData.append('cover_file', coverFile);
    }

    const url = `${this.baseURL}/books/${id}`;
    const response = await fetch(url, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Update failed! status: ${response.status}`);
    }

    return await response.json();
  }

  async deleteBook(id) {
    return this.request(`/books/${id}`, { method: 'DELETE' });
  }

  async downloadBook(id) {
    const url = `${this.baseURL}/books/${id}/download`;
    window.open(url, '_blank');
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Stats
  async getStats() {
    return this.request('/stats');
  }
}

export const apiService = new ApiService(API_URL); 