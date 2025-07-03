import { create } from 'zustand';

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
      const res = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        set({ user });
      } else {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('token');
      }
    } catch {
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