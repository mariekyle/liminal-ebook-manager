import { getApiConfig, getApiUrl } from '../config';

class ApiService {
  constructor() {
    const apiConfig = getApiConfig();
    this.baseURL = apiConfig.baseURL;
    this.timeout = apiConfig.timeout;
    this.retries = apiConfig.retries;
    this.retryDelay = apiConfig.retryDelay;
  }

  async request(endpoint, options = {}) {
    const url = getApiUrl(endpoint);
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add timeout
    if (this.timeout) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      config.signal = controller.signal;
      
      try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
    } else {
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
  }

  async requestWithRetry(endpoint, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        return await this.request(endpoint, options);
      } catch (error) {
        lastError = error;
        
        if (attempt < this.retries) {
          console.warn(`API request failed (attempt ${attempt}/${this.retries}), retrying...`, error);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    
    throw lastError;
  }

  // Books API
  async getBooks(searchQuery = '') {
    const endpoint = searchQuery ? `/books?search=${encodeURIComponent(searchQuery)}` : '/books';
    return this.requestWithRetry(endpoint);
  }

  async getBook(id) {
    return this.requestWithRetry(`/books/${id}`);
  }

  async uploadBook(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = getApiUrl('/books/upload');
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

    const url = getApiUrl(`/books/${id}`);
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
    return this.requestWithRetry(`/books/${id}`, { method: 'DELETE' });
  }

  async downloadBook(id) {
    const url = getApiUrl(`/books/${id}/download`);
    window.open(url, '_blank');
  }

  // Health check
  async healthCheck() {
    return this.requestWithRetry('/health');
  }

  // Stats
  async getStats() {
    return this.requestWithRetry('/stats');
  }
}

export const apiService = new ApiService(); 