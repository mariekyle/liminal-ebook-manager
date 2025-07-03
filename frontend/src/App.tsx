import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LibraryPage from './pages/LibraryPage';
import BookDetailPage from './pages/BookDetailPage';
import CollectionsPage from './pages/CollectionsPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import UserProfilePage from './pages/UserProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

import AppLayout from './components/common/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import { ROLES, ROLE_GROUPS } from './types/roles';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes (wrapped in AppLayout) */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/library" replace />} />
          
          {/* Basic user routes - accessible to all authenticated users */}
          <Route path="library" element={
            <ProtectedRoute>
              <LibraryPage />
            </ProtectedRoute>
          } />
          <Route path="books/:bookId" element={
            <ProtectedRoute>
              <BookDetailPage />
            </ProtectedRoute>
          } />
          <Route path="collections" element={
            <ProtectedRoute>
              <CollectionsPage />
            </ProtectedRoute>
          } />
          <Route path="collections/:collectionId" element={
            <ProtectedRoute>
              <CollectionDetailPage />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          } />
          
          {/* Settings - accessible to all authenticated users */}
          <Route path="settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          
          {/* Admin-only routes */}
          <Route path="admin" element={
            <ProtectedRoute 
              requiredRoles={ROLE_GROUPS.ADMIN_ONLY}
              showUnauthorizedMessage={true}
            >
              <AdminPage />
            </ProtectedRoute>
          } />
          
          {/* Premium and above routes */}
          <Route path="premium" element={
            <ProtectedRoute 
              requiredRoles={ROLE_GROUPS.PREMIUM_AND_ABOVE}
              showUnauthorizedMessage={true}
            >
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Premium Features</h1>
                <p>This page is for premium users and above.</p>
              </div>
            </ProtectedRoute>
          } />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App; 