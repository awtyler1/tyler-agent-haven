import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User, ChevronDown, FileText, Loader2 } from 'lucide-react';
import { useAgentProfile } from '@/hooks/useAgentProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function AgentProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { fullName, email, npn, licenseNumber, residentState, loading, getInitials, hasContractingData } = useAgentProfile();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.log('Logout error:', error);
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

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gold text-primary-foreground flex items-center justify-center text-sm font-semibold">
          {getInitials()}
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-background border border-border rounded-lg shadow-elevated z-50 overflow-hidden animate-fade-in">
            {/* Header with name and email */}
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold text-primary-foreground flex items-center justify-center text-base font-semibold">
                  {getInitials()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{fullName || 'Agent'}</p>
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                </div>
              </div>
            </div>

            {/* Agent Info */}
            {hasContractingData && (
              <div className="p-4 border-b border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Your Info</p>
                <div className="space-y-1.5">
                  {npn && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">NPN</span>
                      <span className="font-medium text-foreground">{npn}</span>
                    </div>
                  )}
                  {licenseNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">License #</span>
                      <span className="font-medium text-foreground">{licenseNumber}</span>
                    </div>
                  )}
                  {residentState && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Resident State</span>
                      <span className="font-medium text-foreground">{residentState}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="py-1">
              <Link
                to="/contracting-hub"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <FileText className="h-4 w-4" />
                My Contracting Status
              </Link>
            </div>

            {/* Sign Out */}
            <div className="py-1 border-t border-border">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
