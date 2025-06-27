import React, { useContext, Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import Loading from '../common/Loading';
import '../../styles/routing.css';

const ProtectedRoute = ({ 
  children, 
  requiredPermission = null, 
  adminOnly = false,
  fallback = '/login' 
}) => {
  const { user, isAuthenticated } = useContext(AppContext);
  const location = useLocation();

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="loading-container">
        <Loading size="large" />
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallback} state={{ from: location }} replace />;
  }

  // Check if user exists
  if (!user) {
    return <Navigate to={fallback} state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (adminOnly && user.role !== 'admin') {
    return (
      <div className="error-container">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <Navigate to="/dashboard" replace />
      </div>
    );
  }

  // Check specific permission
  if (requiredPermission) {
    const hasPermission = user.permissions?.includes(requiredPermission) || 
                         user.role === 'admin';
    
    if (!hasPermission) {
      return (
        <div className="error-container">
          <h2>Access Denied</h2>
          <p>You don't have the required permission: {requiredPermission}</p>
          <Navigate to="/dashboard" replace />
        </div>
      );
    }
  }

  // Render the protected component with Suspense for lazy loading
  return (
    <Suspense fallback={
      <div className="loading-container">
        <Loading size="large" />
        <p>Loading page...</p>
      </div>
    }>
      {children}
    </Suspense>
  );
};

export default ProtectedRoute; 