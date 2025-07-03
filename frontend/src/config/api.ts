// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://172.16.3.2:8000',
  ENDPOINTS: {
    AUTH: '/api/v1/auth',
    USERS: '/api/v1/users',
    BOOKS: '/api/v1/books',
    COLLECTIONS: '/api/v1/collections',
  }
};

export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}; 