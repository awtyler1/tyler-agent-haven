import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogIn, LogOut, User, FileText, Shield } from "lucide-react";
import { UserAvatarDropdown } from "./UserAvatarDropdown";
import { DarkModeToggle } from "./DarkModeToggle";
import tylerLogo from "@/assets/tyler-logo.webp";
import { useAuth } from "@/hooks/useAuth";
import { useNavigationContext } from "@/hooks/useNavigationContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity, ActivityAction } from "@/utils/activityLogger";

const navLinks = [
  { name: "Dashboard", href: "/" },
];

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isAgent, isContractingRequired, canAccessAdmin } = useAuth();
  const { homePath, isDualRole, viewMode, toggleMode } = useNavigationContext();

  // Hide navigation for agents who need to complete contracting
  const showFullNavigation = !isAgent() || !isContractingRequired;

  const handleLogout = async () => {
    // Log logout before signing out (need auth to log)
    await logActivity(ActivityAction.LOGOUT);

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Logout errors are non-critical - we clear localStorage anyway
    }
    // Force clear all Supabase auth data from localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    toast.success("Logged out successfully");
    // Force a full page reload to clear all cached state
    window.location.href = '/auth';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container-narrow mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo + Mode Indicator */}
          <div className="flex items-center gap-3">
            <Link to={homePath} className="flex items-center">
              <img
                src={tylerLogo}
                alt="Logo"
                className="h-14 w-auto"
              />
            </Link>
            {/* Mode indicator for dual-role users - clickable to toggle */}
            {isDualRole && isAuthenticated && (
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

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {showFullNavigation && navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => window.scrollTo(0, 0)}
                className="text-[13px] font-medium text-muted-foreground hover:text-gold transition-smooth tracking-wide whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}

            {/* Profile Dropdown - For authenticated users (includes dark mode toggle) */}
            {isAuthenticated ? (
              <UserAvatarDropdown />
            ) : (
              <Link
                to="/auth"
                className="text-[13px] font-medium text-primary hover:text-gold transition-smooth tracking-wide flex items-center gap-1.5 whitespace-nowrap"
              >
                <LogIn size={14} />
                Log In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-foreground hover:text-gold transition-smooth"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-6 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-1">
              {/* Nav Links */}
              {showFullNavigation && navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-base font-medium text-muted-foreground hover:text-gold transition-smooth tracking-wide py-2 block"
                >
                  {link.name}
                </Link>
              ))}

              {/* Authenticated User Menu Items */}
              {isAuthenticated && showFullNavigation && (
                <>
                  <div className="h-px bg-border my-2" />
                  <Link
                    to="/my-profile"
                    onClick={() => setIsOpen(false)}
                    className="text-base font-medium text-muted-foreground hover:text-gold transition-smooth py-2 flex items-center gap-2"
                  >
                    <User size={16} />
                    My Profile
                  </Link>
                  <Link
                    to="/contracting-hub"
                    onClick={() => setIsOpen(false)}
                    className="text-base font-medium text-muted-foreground hover:text-gold transition-smooth py-2 flex items-center gap-2"
                  >
                    <FileText size={16} />
                    Carrier Status
                  </Link>
                  {canAccessAdmin() && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="text-base font-medium text-muted-foreground hover:text-gold transition-smooth py-2 flex items-center gap-2"
                    >
                      <Shield size={16} />
                      Admin Dashboard
                    </Link>
                  )}
                </>
              )}

              {/* Dark Mode Toggle */}
              <div className="h-px bg-border my-2" />
              <div className="py-2">
                <DarkModeToggle />
              </div>

              {/* Auth Link */}
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="text-base font-medium text-destructive hover:text-destructive/80 transition-smooth py-2 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsOpen(false)}
                  className="text-base font-medium text-primary hover:text-gold transition-smooth py-2 flex items-center gap-2"
                >
                  <LogIn size={16} />
                  Log In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
