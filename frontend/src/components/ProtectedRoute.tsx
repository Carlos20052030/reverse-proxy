import { Navigate } from 'react-router-dom';
import { Layout } from './Layout';

/**
 * ProtectedRoute - Wrapper for routes that require authentication.
 * Checks for JWT token in localStorage and redirects to /login if not present.
 * If authenticated, renders the Layout (with navigation) which contains its own Outlet for child routes.
 */
export function ProtectedRoute() {
  const token = localStorage.getItem('token');

  if (!token) {
    // Redirect to login before rendering anything
    return <Navigate to="/login" replace />;
  }

  // Token exists - render Layout (which has its own Outlet for child routes)
  return <Layout />;
}