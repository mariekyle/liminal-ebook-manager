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
import NotFoundPage from './pages/NotFoundPage';

import AppLayout from './components/common/AppLayout';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes (wrapped in AppLayout) */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/library" replace />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="books/:bookId" element={<BookDetailPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="collections/:collectionId" element={<CollectionDetailPage />} />
          <Route path="profile" element={<UserProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App; 