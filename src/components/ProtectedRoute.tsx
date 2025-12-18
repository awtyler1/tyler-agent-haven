import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireDeveloper?: boolean;
  requireAgent?: boolean;
  allowContractingOnly?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireSuperAdmin = false,
  requireDeveloper = false,
  requireAgent = false,
  allowContractingOnly = false,
}: ProtectedRouteProps) {
  const location = useLocation();
  const {
    isAuthenticated,
    loading,
    isAdmin,
    isSuperAdmin,
    isAgent,
    isContractingRequired,
    hasDeveloperAccess,
  } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check developer access
  if (requireDeveloper && !hasDeveloperAccess()) {
    return <Navigate to="/" replace />;
  }

  // Check super admin access
  if (requireSuperAdmin && !isSuperAdmin()) {
    return <Navigate to="/" replace />;
  }

  // Check admin access
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  // Check agent access
  if (requireAgent && !isAgent()) {
    return <Navigate to="/" replace />;
  }

  // Special case: agents who need contracting should be redirected
  if (isAgent() && isContractingRequired && !allowContractingOnly) {
    return <Navigate to="/contracting" replace />;
  }

  // Special case: agents on allowContractingOnly routes must need contracting
  if (allowContractingOnly && (!isAgent() || !isContractingRequired)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
