import { ReactNode, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNavigationContext } from '@/hooks/useNavigationContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
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
  const location = useLocation();
  const {
    isAuthenticated,
    loading,
    isAdmin,
    isSuperAdmin,
    isAgent,
    isContractingRequired,
  } = useAuth();
  const { isDualRole, viewMode } = useNavigationContext();

  // Track if we've shown the toast to avoid repeated toasts on re-renders
  const hasShownToastRef = useRef(false);

  // Check if dual-role user is trying to access admin routes while in agent view mode
  const isAdminRouteBlockedByViewMode = !loading && isAuthenticated &&
    (requireAdmin || requireSuperAdmin) && isDualRole && viewMode === 'agent';

  // Show toast once when blocked by view mode (must be before any returns per React rules)
  useEffect(() => {
    if (isAdminRouteBlockedByViewMode && !hasShownToastRef.current) {
      hasShownToastRef.current = true;
      toast.info('Switch to Admin View to access admin features');
    }
    // Reset toast flag when conditions change
    if (!isAdminRouteBlockedByViewMode) {
      hasShownToastRef.current = false;
    }
  }, [isAdminRouteBlockedByViewMode]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Block admin routes for dual-role users in agent view mode
  if (isAdminRouteBlockedByViewMode) {
    return <Navigate to="/hub" replace />;
  }

  // Check super admin access
  if (requireSuperAdmin && !isSuperAdmin()) {
    return <Navigate to="/hub" replace />;
  }

  // Check admin access
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/hub" replace />;
  }

  // Check agent access
  if (requireAgent && !isAgent()) {
    return <Navigate to="/hub" replace />;
  }

  // Special case: agents who need contracting should be redirected
  if (isAgent() && isContractingRequired && !allowContractingOnly) {
    return <Navigate to="/contracting" replace />;
  }

  // Special case: agents on allowContractingOnly routes must need contracting
  if (allowContractingOnly && (!isAgent() || !isContractingRequired)) {
    return <Navigate to="/hub" replace />;
  }

  return <>{children}</>;
}
