import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider } from './context/SettingsContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/routing/ProtectedRoute';
import Loading from './components/common/Loading';
import NotificationToast from './components/common/NotificationToast';

// Import styles
import './App.css';

// Lazy load page components
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const LibraryPage = React.lazy(() => import('./pages/LibraryPage'));
const BookDetailPage = React.lazy(() => import('./pages/BookDetailPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));

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
              <NotificationToast />
              
              <Suspense fallback={<PageLoading />}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    
                    <Route 
                      path="dashboard" 
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="library" 
                      element={
                        <ProtectedRoute>
                          <LibraryPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="books/:id" 
                      element={
                        <ProtectedRoute>
                          <BookDetailPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="settings" 
                      element={
                        <ProtectedRoute>
                          <SettingsPage />
                        </ProtectedRoute>
                      } 
                    />
                  </Route>
                  
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