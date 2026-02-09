import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { useNavigationContext } from '@/hooks/useNavigationContext';

interface DashboardHeaderProps {
  fullName: string | null;
  syncStatus: 'synced' | 'stale' | 'never';
  lastSyncDate?: string | null;
}

/**
 * DashboardHeader - Sticky header with branding, sync status, and user menu
 *
 * Features:
 * - TIG logo and portal label
 * - Dual-role mode toggle (Admin/Agent) when applicable
 * - Sync status indicator with colored dot
 * - User avatar dropdown
 */
export function DashboardHeader({ fullName, syncStatus, lastSyncDate }: DashboardHeaderProps) {
  const { isDualRole, viewMode, toggleMode } = useNavigationContext();

  const getSyncLabel = () => {
    if (syncStatus === 'never') return 'Sync to start';
    if (syncStatus === 'stale') return 'Sync needed';
    if (lastSyncDate) {
      const date = new Date(lastSyncDate);
      return `Synced ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return 'Synced';
  };

  const getSyncDotColor = () => {
    if (syncStatus === 'synced') return 'bg-emerald-400';
    if (syncStatus === 'stale') return 'bg-amber-400';
    return 'bg-slate-300';
  };

  return (
    <header className="relative z-10 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-10 h-10 bg-gradient-to-br from-[hsl(43,56%,45%)] to-[hsl(43,56%,38%)] rounded-xl shadow-sm border border-[rgba(184,134,11,0.15)] flex items-center justify-center">
          <span className="font-bold text-white">T</span>
        </div>

        {/* Labels */}
        <div>
          <p className="text-xs text-slate-400">TIG Platform</p>
          <p className="font-semibold text-slate-800">Agent Portal</p>
        </div>

        {/* Dual-role toggle */}
        {isDualRole && (
          <button
            onClick={toggleMode}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer hover:opacity-80 ${
              viewMode === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-green-100 text-green-700'
            }`}
            title={`Click to switch to ${viewMode === 'admin' ? 'Agent' : 'Admin'} View`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              viewMode === 'admin' ? 'bg-purple-500' : 'bg-green-500'
            }`} />
            {viewMode === 'admin' ? 'Admin View' : 'Agent View'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Sync status pill - hidden on small screens */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-full border border-slate-200/80">
          <div className={`w-2 h-2 ${getSyncDotColor()} rounded-full`} />
          <span className="text-xs text-slate-500">{getSyncLabel()}</span>
        </div>

        {/* User name - hidden on small screens */}
        <span className="text-sm text-slate-500 hidden sm:block">
          {fullName || 'Agent'}
        </span>

        {/* Avatar dropdown */}
        <UserAvatarDropdown />
      </div>
    </header>
  );
}
