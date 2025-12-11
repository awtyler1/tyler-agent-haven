import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireAgent?: boolean;
  allowContractingOnly?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireSuperAdmin = false,
  requireAgent = false,
  allowContractingOnly = false,
}: ProtectedRouteProps) {
  const { 
    isAuthenticated, 
    loading, 
    isContractingRequired, 
    canAccessAdmin,
    isAgent,
    isSuperAdmin,
  } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - redirect to auth
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Super admin route but user is not super admin
  if (requireSuperAdmin && !isSuperAdmin()) {
    return <Navigate to="/" replace />;
  }

  // Admin route but user is not admin
  if (requireAdmin && !canAccessAdmin()) {
    return <Navigate to="/" replace />;
  }

  // Agent route but user is not agent
  if (requireAgent && !isAgent()) {
    return <Navigate to="/" replace />;
  }

  // Agent in contracting mode trying to access non-contracting route
  if (isAgent() && isContractingRequired && !allowContractingOnly) {
    return <Navigate to="/contracting" replace />;
  }

  return <>{children}</>;
}
