import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function ProtectedRoute({ children, requireAuth = true, allowedUserTypes = [] }) {
  const { isAuthenticated, user } = useAuthStore();

  // If route requires authentication and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If specific user types are required, check if user matches
  if (allowedUserTypes.length > 0 && user) {
    if (!allowedUserTypes.includes(user.userType)) {
      // Redirect to appropriate page based on user type
      return <Navigate to={user.userType === 'sme' ? '/dashboard' : '/'} replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
