import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import type { ProtectedRouteProps } from '../types';

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
}

export default ProtectedRoute;