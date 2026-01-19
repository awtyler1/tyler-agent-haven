import { useNavigate } from 'react-router-dom';
import { User, FileText, Shield, Settings, Moon, LogOut, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity, ActivityAction } from '@/utils/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ROLE_BADGE_STYLES: Record<string, { label: string; className: string }> = {
  super_admin: { label: 'Super Admin', className: 'bg-purple-100 text-purple-700' },
  admin: { label: 'Admin', className: 'bg-blue-100 text-blue-700' },
  manager: { label: 'Manager', className: 'bg-indigo-100 text-indigo-700' },
  independent_agent: { label: 'Agent', className: 'bg-green-100 text-green-700' },
  internal_tig_agent: { label: 'TIG Agent', className: 'bg-green-100 text-green-700' },
};

export function UserAvatarDropdown() {
  const navigate = useNavigate();
  const { profile, primaryRole, loading, canAccessAdmin } = useAuth();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();

  const handleLogout = async () => {
    await logActivity(ActivityAction.LOGOUT);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Logout errors are non-critical
    }
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    toast.success("Logged out successfully");
    window.location.href = '/auth';
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const roleBadge = ROLE_BADGE_STYLES[primaryRole || ''] || { label: 'User', className: 'bg-gray-100 text-gray-600' };
  const userInitials = getInitials(profile?.full_name || null);

  if (loading) {
    return (
      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2">
          {userInitials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-xl">
        {/* User Info Header */}
        <div className="px-3 py-3">
          <p className="font-medium text-foreground truncate">{profile?.full_name || 'User'}</p>
          <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
          <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge.className}`}>
            {roleBadge.label}
          </span>
        </div>

        <DropdownMenuSeparator />

        {/* Navigation Items */}
        <DropdownMenuItem
          onClick={() => navigate('/my-profile')}
          className="cursor-pointer hover:bg-primary/10"
        >
          <User className="w-4 h-4 mr-2" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('/contracting-hub')}
          className="cursor-pointer hover:bg-primary/10"
        >
          <FileText className="w-4 h-4 mr-2" />
          My Carrier Status
        </DropdownMenuItem>

        {/* Admin Dashboard - only if user has admin access */}
        {canAccessAdmin() && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate('/admin')}
              className="cursor-pointer hover:bg-primary/10"
            >
              <Shield className="w-4 h-4 mr-2" />
              Admin Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/admin/settings')}
              className="cursor-pointer hover:bg-primary/10"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
          </>
        )}

        {/* Dark Mode Toggle */}
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center">
            <Moon className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-sm">Dark Mode</span>
          </div>
          <Switch
            checked={isDark}
            onCheckedChange={toggleDarkMode}
            className="scale-90"
          />
        </div>

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
