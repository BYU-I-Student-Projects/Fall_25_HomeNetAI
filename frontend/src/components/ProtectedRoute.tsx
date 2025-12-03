import { Navigate } from "react-router-dom";
import { authAPI } from "@/services/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Development bypass - set to true to skip authentication
  const BYPASS_AUTH = false; // Set to false to enable authentication
  
  // Check if user has auth token
  const token = localStorage.getItem('auth_token');
  
  // If bypass is enabled, allow access without token
  if (BYPASS_AUTH) {
    // Set a dummy token if none exists to prevent API errors
    if (!token) {
      localStorage.setItem('auth_token', 'dev-bypass-token');
    }
    return <>{children}</>;
  }
  
  // Normal authentication flow
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

