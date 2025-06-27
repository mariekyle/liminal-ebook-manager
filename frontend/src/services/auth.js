/**
 * Authentication Service
 * Handles user authentication, token management, and API calls
 */

import api from './api';
import { getConfig } from '../config';

class AuthService {
    constructor() {
        this.tokenKey = 'auth_token';
        this.refreshTokenKey = 'refresh_token';
        this.userKey = 'user_data';
        this.config = getConfig();
    }

    /**
     * Get stored access token
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Get stored refresh token
     */
    getRefreshToken() {
        return localStorage.getItem(this.refreshTokenKey);
    }

    /**
     * Get stored user data
     */
    getUser() {
        const userData = localStorage.getItem(this.userKey);
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Store authentication data
     */
    setAuthData(token, refreshToken, user) {
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.refreshTokenKey, refreshToken);
        localStorage.setItem(this.userKey, JSON.stringify(user));
        
        // Update API service with new token
        api.setAuthToken(token);
    }

    /**
     * Clear authentication data
     */
    clearAuthData() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        localStorage.removeItem(this.userKey);
        
        // Clear API service token
        api.setAuthToken(null);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = this.getToken();
        const user = this.getUser();
        return !!(token && user);
    }

    /**
     * Check if token is expired
     */
    isTokenExpired(token) {
        if (!token) return true;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime;
        } catch (error) {
            return true;
        }
    }

    /**
     * Register a new user
     */
    async register(userData) {
        try {
            const response = await api.post('/auth/register', userData);
            
            if (response.success) {
                // Auto-login after successful registration
                return await this.login({
                    email: userData.email,
                    password: userData.password
                });
            }
            
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Login user
     */
    async login(credentials) {
        try {
            const response = await api.post('/auth/login', credentials);
            
            if (response.success) {
                const { access_token, refresh_token, user } = response.data;
                this.setAuthData(access_token, refresh_token, user);
            }
            
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            const token = this.getToken();
            if (token) {
                await api.post('/auth/logout', {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (error) {
            // Continue with logout even if API call fails
            console.warn('Logout API call failed:', error);
        } finally {
            this.clearAuthData();
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken() {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await api.post('/auth/refresh', {
                refresh_token: refreshToken
            });

            if (response.success) {
                const { access_token } = response.data;
                const user = this.getUser();
                
                // Update stored token
                localStorage.setItem(this.tokenKey, access_token);
                api.setAuthToken(access_token);
                
                return access_token;
            }
        } catch (error) {
            // If refresh fails, logout user
            this.clearAuthData();
            throw new Error('Token refresh failed');
        }
    }

    /**
     * Get current user profile
     */
    async getProfile() {
        try {
            const response = await api.get('/auth/me');
            
            if (response.success) {
                // Update stored user data
                localStorage.setItem(this.userKey, JSON.stringify(response.data));
                return response.data;
            }
            
            return null;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(profileData) {
        try {
            const response = await api.put('/auth/me', profileData);
            
            if (response.success) {
                // Update stored user data
                localStorage.setItem(this.userKey, JSON.stringify(response.data));
                return response.data;
            }
            
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Change password
     */
    async changePassword(passwordData) {
        try {
            const response = await api.post('/auth/me/change-password', passwordData);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(email) {
        try {
            const response = await api.post('/auth/password-reset', { email });
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Confirm password reset
     */
    async confirmPasswordReset(token, newPassword) {
        try {
            const response = await api.post('/auth/password-reset/confirm', {
                token,
                new_password: newPassword
            });
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Verify email
     */
    async verifyEmail(token) {
        try {
            const response = await api.post('/auth/verify-email', { token });
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get user sessions
     */
    async getSessions() {
        try {
            const response = await api.get('/auth/me/sessions');
            return response.success ? response.data : [];
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Revoke a session
     */
    async revokeSession(sessionId) {
        try {
            const response = await api.delete(`/auth/me/sessions/${sessionId}`);
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Revoke all sessions
     */
    async revokeAllSessions() {
        try {
            const response = await api.delete('/auth/me/sessions');
            return response;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Handle API errors
     */
    handleError(error) {
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;
            
            switch (status) {
                case 401:
                    // Unauthorized - clear auth data and redirect to login
                    this.clearAuthData();
                    window.location.href = '/login';
                    break;
                case 403:
                    // Forbidden - user doesn't have permission
                    return new Error(data.detail || 'Access denied');
                case 422:
                    // Validation error
                    return new Error(data.detail || 'Validation failed');
                default:
                    return new Error(data.detail || 'An error occurred');
            }
        } else if (error.request) {
            // Network error
            return new Error('Network error - please check your connection');
        } else {
            // Other error
            return new Error(error.message || 'An unexpected error occurred');
        }
    }

    /**
     * Setup automatic token refresh
     */
    setupTokenRefresh() {
        // Check token every 5 minutes
        setInterval(() => {
            const token = this.getToken();
            if (token && this.isTokenExpired(token)) {
                this.refreshToken().catch(() => {
                    // If refresh fails, logout
                    this.logout();
                });
            }
        }, 5 * 60 * 1000);
    }
}

// Create singleton instance
const authService = new AuthService();

export default authService; 