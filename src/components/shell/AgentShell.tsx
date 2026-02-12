import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNavigationContext } from '@/hooks/useNavigationContext';
import { supabase } from '@/integrations/supabase/client';
import { logActivity, ActivityAction } from '@/utils/activityLogger';
import { toast } from 'sonner';

// ============================================================
// Sidebar Navigation Config
// ============================================================

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  external?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// 15px inline SVGs, stroke-width 1.7, Lucide-style
const Icons = {
  Home: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Search: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Flame: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  Grid: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  Shield: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v4m0 4h.01" />
    </svg>
  ),
  Book: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  Contact: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <circle cx="12" cy="11" r="3" />
      <path d="M6 20c0-2 2.5-4 6-4s6 2 6 4" />
    </svg>
  ),
  Dollar: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Pen: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Clipboard: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  ),
  Graduation: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
    </svg>
  ),
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Sell',
    items: [
      { label: 'Home', path: '/', icon: Icons.Home },
      { label: 'Plan Finder', path: '/plan-finder', icon: Icons.Search },
      { label: 'SunFire', path: 'https://www.sunfirematrix.com', icon: Icons.Flame, external: true },
      { label: 'Connecture', path: 'https://www.connecture.com', icon: Icons.Grid, external: true },
      { label: 'Carriers', path: '/carrier-resources', icon: Icons.Shield },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'My Book', path: '/book', icon: Icons.Book },
      { label: 'BOSS CRM', path: 'https://www.bosscrm.com', icon: Icons.Contact, external: true },
      { label: 'Commissions', path: '/book/growth', icon: Icons.Dollar },
      { label: 'Contracting', path: '/contracting-hub', icon: Icons.Pen },
      { label: 'Forms', path: '/forms-library', icon: Icons.Clipboard },
      { label: 'Training', path: '/training', icon: Icons.Graduation },
    ],
  },
];

// ============================================================
// UserCardDropdown
// ============================================================

function UserCardDropdown({
  profile,
  loading,
  isDualRole,
  viewMode,
  toggleMode,
}: {
  profile: { full_name: string | null; email: string | null; onboarding_status: string } | null;
  loading: boolean;
  isDualRole: boolean;
  viewMode: string;
  toggleMode: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const profileLoaded = !loading && !!profile;

  // Immediate fallback initials from email if profile not yet loaded
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email
      ? profile.email[0].toUpperCase()
      : '';

  const displayName = profile?.full_name || 'Agent';
  const roleName = profile?.onboarding_status === 'APPOINTED' ? 'Agent' : 'Onboarding';

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleSignOut = useCallback(async () => {
    setOpen(false);
    await logActivity(ActivityAction.LOGOUT);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Logout errors are non-critical
    }
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) localStorage.removeItem(key);
    });
    toast.success('Logged out successfully');
    window.location.href = '/auth';
  }, []);

  const menuItemBase: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '8px 14px',
    fontSize: 13,
    fontFamily: 'var(--font-sans)',
    fontWeight: 400,
    color: 'var(--text-primary)',
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background var(--fast) var(--ease)',
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', borderTop: '1px solid var(--sidebar-border)', padding: '8px 12px' }}>
      {/* Trigger */}
      <button
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '4px 4px',
          borderRadius: 8,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background var(--fast) var(--ease)',
          fontFamily: 'var(--font-sans)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Gold avatar — always renders immediately */}
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: 1 }}>
            {initials}
          </span>
        </div>

        {/* Name + role or skeleton */}
        <div style={{ minWidth: 0, flex: 1 }}>
          {profileLoaded ? (
            <>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--sidebar-text-active)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayName}
              </div>
              <div style={{ fontSize: 10, color: 'var(--sidebar-text)' }}>
                {roleName}
              </div>
            </>
          ) : (
            <>
              {/* Skeleton: name bar */}
              <div style={{ width: 96, height: 12, borderRadius: 4, background: 'var(--sidebar-border)' }} />
              {/* Skeleton: role bar */}
              <div style={{ width: 48, height: 9, borderRadius: 3, background: 'var(--sidebar-border)', marginTop: 4 }} />
            </>
          )}
        </div>
      </button>

      {/* Dropdown menu — opens upward */}
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: 4,
            minWidth: 180,
            background: 'var(--bg-card)',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            zIndex: 50,
          }}
        >
          <button
            role="menuitem"
            style={menuItemBase}
            onClick={() => { setOpen(false); navigate('/my-profile'); }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            My Profile
          </button>
          <button
            role="menuitem"
            style={menuItemBase}
            onClick={() => { setOpen(false); navigate('/my-profile'); }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Settings
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--bg-muted)', margin: '2px 0' }} />

          {/* Dual-role toggle */}
          {isDualRole && (
            <>
              <button
                role="menuitem"
                style={menuItemBase}
                onClick={() => { setOpen(false); toggleMode(); }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                Switch to {viewMode === 'agent' ? 'Admin' : 'Agent'}
              </button>
              <div style={{ height: 1, background: 'var(--bg-muted)', margin: '2px 0' }} />
            </>
          )}

          {/* Sign Out */}
          <button
            role="menuitem"
            style={{ ...menuItemBase, color: 'var(--red)' }}
            onClick={handleSignOut}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// AgentShell
// ============================================================

export function AgentShell() {
  const location = useLocation();
  const { profile, loading } = useAuth();
  const { isDualRole, toggleMode, viewMode } = useNavigationContext();

  // Active route matching: exact for "/" , startsWith for others
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        padding: 10,
        background: 'var(--bg)',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Sidebar */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          width: 194,
          minWidth: 194,
          background: 'var(--sidebar)',
          borderRadius: 14,
          boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Brand area — compact 12px vertical */}
        <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--sidebar-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1 }}>T</span>
            </div>
            <span
              style={{
                fontVariant: 'all-small-caps',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--sidebar-text-active)',
                letterSpacing: '0.08em',
              }}
            >
              TIG
            </span>
          </div>
        </div>

        {/* Navigation groups — overflow hidden, never scrolls */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '6px 0 0' }}>
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={group.label} style={{ marginBottom: 0 }}>
              {/* Section label */}
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--sidebar-section-label)',
                  padding: `${groupIdx === 0 ? '4px' : '12px'} 16px 4px`,
                }}
              >
                {group.label}
              </div>

              {/* Nav items */}
              {group.items.map((item) => {
                if (item.external) {
                  return (
                    <a
                      key={item.label}
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${item.label} (opens external site)`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 16px',
                        margin: '0 8px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: '#635F68',
                        textDecoration: 'none',
                        transition: 'background var(--fast) var(--ease)',
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--sidebar-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-hidden="true">
                        {item.icon}
                      </span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <span style={{ fontSize: 8, opacity: 0.7 }}>↗</span>
                    </a>
                  );
                }

                const active = isActive(item.path);
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 16px',
                      margin: '0 8px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: active ? 700 : 500,
                      color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                      textDecoration: 'none',
                      background: active ? 'var(--gold-active-bg)' : 'transparent',
                      transition: 'background var(--fast) var(--ease)',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = 'var(--sidebar-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Gold active bar */}
                    {active && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 3,
                          height: 16,
                          borderRadius: 2,
                          background: 'var(--gold)',
                        }}
                      />
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User card with dropdown (Fix 2, 3, 4) */}
        <UserCardDropdown
          profile={profile}
          loading={loading}
          isDualRole={isDualRole}
          viewMode={viewMode}
          toggleMode={toggleMode}
        />
      </nav>

      {/* Content area */}
      <main style={{ flex: 1, overflowY: 'auto', marginLeft: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
