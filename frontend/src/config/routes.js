/**
 * Route Configuration
 * Defines all application routes with protection and lazy loading
 */

import { lazy } from 'react';

// Lazy load components for better performance
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const LibraryPage = lazy(() => import('../pages/LibraryPage'));
const BookDetailPage = lazy(() => import('../pages/BookDetailPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

// Route configuration
export const routes = [
  // Public routes (no authentication required)
  {
    path: '/',
    element: 'DashboardPage',
    protected: true,
    redirect: '/login'
  },
  {
    path: '/login',
    element: 'LoginPage',
    protected: false,
    title: 'Login'
  },
  {
    path: '/register',
    element: 'RegisterPage',
    protected: false,
    title: 'Create Account'
  },

  // Protected routes (authentication required)
  {
    path: '/dashboard',
    element: 'DashboardPage',
    protected: true,
    title: 'Dashboard',
    icon: 'Home'
  },
  {
    path: '/library',
    element: 'LibraryPage',
    protected: true,
    title: 'Library',
    icon: 'BookOpen'
  },
  {
    path: '/books/:id',
    element: 'BookDetailPage',
    protected: true,
    title: 'Book Details',
    icon: 'Book'
  },
  {
    path: '/settings',
    element: 'SettingsPage',
    protected: true,
    title: 'Settings',
    icon: 'Settings'
  },

  // Catch-all route
  {
    path: '*',
    element: 'NotFoundPage',
    protected: false,
    title: 'Page Not Found'
  }
];

// Component mapping
export const componentMap = {
  LoginPage,
  RegisterPage,
  DashboardPage,
  LibraryPage,
  BookDetailPage,
  SettingsPage
};

// Navigation menu configuration
export const navigationMenu = [
  {
    title: 'Main',
    items: [
      { path: '/dashboard', title: 'Dashboard', icon: 'Home' },
      { path: '/library', title: 'Library', icon: 'BookOpen' }
    ]
  },
  {
    title: 'Account',
    items: [
      { path: '/settings', title: 'Settings', icon: 'Settings' }
    ]
  }
];

// Route helpers
export const getRouteByPath = (path) => {
  return routes.find(route => route.path === path);
};

export const getProtectedRoutes = () => {
  return routes.filter(route => route.protected);
};

export const getPublicRoutes = () => {
  return routes.filter(route => !route.protected);
};

export const getNavigationRoutes = () => {
  return routes.filter(route => route.protected && route.title && route.icon);
};

// Breadcrumb helpers
export const getBreadcrumbs = (pathname) => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ path: '/', title: 'Home' }];
  
  let currentPath = '';
  
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const route = getRouteByPath(currentPath);
    
    if (route) {
      breadcrumbs.push({
        path: currentPath,
        title: route.title || segment
      });
    } else {
      // Handle dynamic routes like /books/:id
      if (segment === 'books' && pathSegments[index + 1]) {
        breadcrumbs.push({
          path: currentPath,
          title: 'Books'
        });
      } else {
        breadcrumbs.push({
          path: currentPath,
          title: segment.charAt(0).toUpperCase() + segment.slice(1)
        });
      }
    }
  });
  
  return breadcrumbs;
}; 