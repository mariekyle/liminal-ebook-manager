import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string | string[];
  fallbackPath?: string;
  showUnauthorizedMessage?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  fallbackPath = '/login',
  showUnauthorizedMessage = false,
}) => {
  const { isAuthenticated, user, hasRole, fetchCurrentUser } = useAuthStore();
  const location = useLocation();

  // Fetch current user on mount if we have a token but no user data
  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchCurrentUser();
    }
  }, [isAuthenticated, user, fetchCurrentUser]);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // If we have required roles, check if user has the necessary role
  if (requiredRoles && !hasRole(requiredRoles)) {
    if (showUnauthorizedMessage) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500">
              Required role(s): {Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Your role: {user?.role || 'Unknown'}
            </p>
          </div>
        </div>
      );
    }
    return <Navigate to="/" replace />;
  }

  // If authenticated and has required role (if any), render children
  return <>{children}</>;
};

export default ProtectedRoute; 