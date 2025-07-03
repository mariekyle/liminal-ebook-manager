import { create } from 'zustand';
import { getCurrentUser } from '../services/auth';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  // Add more fields as needed
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  login: (token: string) => void;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  hasRole: (requiredRoles: string | string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set: any, get: any) => ({
  token: localStorage.getItem('token'),
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),
  setToken: (token: string | null) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token, isAuthenticated: !!token });
  },
  setUser: (user: User | null) => set({ user }),
  login: (token: string) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },
  fetchCurrentUser: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const user = await getCurrentUser(token);
      set({ user });
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      set({ user: null, token: null, isAuthenticated: false });
      localStorage.removeItem('token');
    }
  },
  hasRole: (requiredRoles: string | string[]) => {
    const { user } = get();
    if (!user) return false;
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(user.role);
  },
})); 