import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider } from './context/SettingsContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/routing/ProtectedRoute';
import Loading from './components/common/Loading';
import NotificationToast from './components/common/NotificationToast';

// Import page components
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LibraryPage from './pages/LibraryPage';
import BookDetailPage from './pages/BookDetailPage';
import SettingsPage from './pages/SettingsPage';

// Import styles
import './App.css';
import './styles/routing.css';

// Loading fallback component
const PageLoading = () => (
  <div className="loading-container">
    <Loading size="large" />
    <p>Loading page...</p>
  </div>
);

// Not Found component
const NotFoundPage = () => (
  <div className="not-found-page">
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>The page you're looking for doesn't exist or has been moved.</p>
    <div className="not-found-actions">
      <button onClick={() => window.history.back()}>Go Back</button>
      <button onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</button>
    </div>
  </div>
);

function App() {
  return (
    <AppProvider>
      <NotificationProvider>
        <SettingsProvider>
          <Router>
            <div className="App">
              {/* Notification Toast */}
              <NotificationToast />
              
              {/* Main Routes */}
              <Suspense fallback={<PageLoading />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  
                  {/* Protected Routes with Layout */}
                  <Route path="/" element={<MainLayout />}>
                    {/* Redirect root to dashboard */}
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    
                    {/* Dashboard */}
                    <Route 
                      path="dashboard" 
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Library */}
                    <Route 
                      path="library" 
                      element={
                        <ProtectedRoute>
                          <LibraryPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Book Details */}
                    <Route 
                      path="books/:id" 
                      element={
                        <ProtectedRoute>
                          <BookDetailPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Settings */}
                    <Route 
                      path="settings" 
                      element={
                        <ProtectedRoute>
                          <SettingsPage />
                        </ProtectedRoute>
                      } 
                    />
                  </Route>
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </div>
          </Router>
        </SettingsProvider>
      </NotificationProvider>
    </AppProvider>
  );
}

export default App; 