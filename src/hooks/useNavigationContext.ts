import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useViewMode, ViewMode } from '@/contexts/ViewModeContext';

/**
 * Navigation context hook for dual-role users.
 * Combines auth state with view mode to provide consistent navigation.
 */
export function useNavigationContext() {
  const navigate = useNavigate();
  const { isAdmin, isAgent, isSuperAdmin, canAccessAdmin } = useAuth();
  const { viewMode, setViewMode, toggleViewMode } = useViewMode();

  // Show switcher for: super_admin OR (admin + agent dual-role)
  const isDualRole = useMemo(() => {
    return isSuperAdmin() || (canAccessAdmin() && isAgent());
  }, [isSuperAdmin, canAccessAdmin, isAgent]);

  // Current mode (for single-role users, always their role)
  const effectiveMode: ViewMode = useMemo(() => {
    if (!isDualRole) {
      // Single-role users: determine their mode from their role
      return canAccessAdmin() ? 'admin' : 'agent';
    }
    return viewMode;
  }, [isDualRole, canAccessAdmin, viewMode]);

  // Home path based on effective mode
  const homePath = effectiveMode === 'admin' ? '/admin' : '/';

  // Whether currently in admin mode
  const isInAdminMode = effectiveMode === 'admin';

  // Navigate to the appropriate dashboard
  const goToDashboard = useCallback(() => {
    navigate(homePath);
  }, [navigate, homePath]);

  // Alias for goToDashboard
  const backToDashboard = goToDashboard;

  // Switch mode and navigate (only for dual-role users)
  const switchMode = useCallback((mode: ViewMode) => {
    if (!isDualRole) return;

    setViewMode(mode);
    // Navigate to the new mode's dashboard
    navigate(mode === 'admin' ? '/admin' : '/');
  }, [isDualRole, setViewMode, navigate]);

  // Toggle and navigate (only for dual-role users)
  const toggleMode = useCallback(() => {
    if (!isDualRole) return;

    const newMode = viewMode === 'agent' ? 'admin' : 'agent';
    setViewMode(newMode);
    navigate(newMode === 'admin' ? '/admin' : '/');
  }, [isDualRole, viewMode, setViewMode, navigate]);

  return {
    // Mode state
    viewMode: effectiveMode,
    isDualRole,
    isInAdminMode,

    // Navigation
    homePath,
    goToDashboard,
    backToDashboard,

    // Mode switching (only works for dual-role)
    switchMode,
    toggleMode,
  };
}
