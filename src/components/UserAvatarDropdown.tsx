import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, FileText, Shield, Moon, LogOut, Loader2, Mail, UserPlus, Activity, Sparkles, ExternalLink, ArrowLeftRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity, ActivityAction } from '@/utils/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useNavigationContext } from '@/hooks/useNavigationContext';
import { Switch } from '@/components/ui/switch';
import { CreateAdminDialog } from '@/components/admin/CreateAdminDialog';
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
  const { profile, primaryRole, loading, canAccessAdmin, isSuperAdmin, isAdmin } = useAuth();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const { isDualRole, viewMode, switchMode } = useNavigationContext();

  // Outlook connection state
  const [outlookConnected, setOutlookConnected] = useState<boolean | null>(null);
  const [outlookLoading, setOutlookLoading] = useState(false);

  // Create admin dialog state
  const [createAdminOpen, setCreateAdminOpen] = useState(false);

  // Check Outlook connection status for admins
  useEffect(() => {
    async function checkOutlook() {
      if (!profile?.user_id) return;
      const { data } = await supabase
        .from('microsoft_oauth_tokens')
        .select('id')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      setOutlookConnected(!!data);
    }
    if (isAdmin()) checkOutlook();
  }, [profile?.user_id, isAdmin]);

  const handleOutlookConnect = async () => {
    setOutlookLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to connect Outlook');
        return;
      }

      const { data, error } = await supabase.functions.invoke('microsoft-oauth-start');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start OAuth');
      setOutlookLoading(false);
    }
  };

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
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-9 h-9 rounded-full bg-[#b8860b] text-white flex items-center justify-center text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#b8860b]/20 focus:ring-offset-2">
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

        {/* View Mode Switcher - only for dual-role users */}
        {isDualRole && (
          <>
            <div className="px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">View Mode</span>
                </div>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                  <button
                    onClick={() => switchMode('agent')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      viewMode === 'agent'
                        ? 'bg-white text-green-700 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Agent
                  </button>
                  <button
                    onClick={() => switchMode('admin')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      viewMode === 'admin'
                        ? 'bg-white text-purple-700 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Agent Section */}
        <div className="px-2 py-1.5">
          <span className="text-xs font-medium text-[#5c5552] uppercase tracking-wider">Agent</span>
        </div>
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
          Certifications
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open('https://fmo.kizen.com/login', '_blank')}
          className="cursor-pointer hover:bg-primary/10 flex items-center justify-between"
        >
          <span className="flex items-center">
            BOSS CRM
          </span>
          <ExternalLink className="w-3 h-3 text-[#5c5552]" />
        </DropdownMenuItem>

        {/* Admin Section - only show if user has any admin access */}
        {(canAccessAdmin() || isAdmin() || isSuperAdmin()) && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <span className="text-xs font-medium text-[#5c5552] uppercase tracking-wider">Admin</span>
            </div>
          </>
        )}

        {/* Admin Dashboard */}
        {canAccessAdmin() && (
          <DropdownMenuItem
            onClick={() => navigate('/admin')}
            className="cursor-pointer hover:bg-primary/10"
          >
            <Shield className="w-4 h-4 mr-2" />
            Admin Dashboard
          </DropdownMenuItem>
        )}

        {/* Outlook Integration - for all admins */}
        {isAdmin() && (
          <DropdownMenuItem
            onClick={handleOutlookConnect}
            disabled={outlookLoading}
            className="cursor-pointer hover:bg-primary/10"
          >
            {outlookLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            {outlookConnected ? (
              <>Outlook <span className="ml-auto text-green-600 text-xs">Connected ✓</span></>
            ) : (
              <>Connect Outlook</>
            )}
          </DropdownMenuItem>
        )}

        {/* Super Admin Only Items */}
        {isSuperAdmin() && (
          <>
            <DropdownMenuItem
              onClick={() => setCreateAdminOpen(true)}
              className="cursor-pointer hover:bg-primary/10"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create Admin
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/admin/activity-log')}
              className="cursor-pointer hover:bg-primary/10"
            >
              <Activity className="w-4 h-4 mr-2" />
              Activity Log
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/admin/labs')}
              className="cursor-pointer hover:bg-primary/10"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Labs
            </DropdownMenuItem>
          </>
        )}

        {/* Settings Section */}
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

    {/* Create Admin Dialog - rendered outside dropdown */}
    <CreateAdminDialog
      open={createAdminOpen}
      onOpenChange={setCreateAdminOpen}
    />
    </>
  );
}
