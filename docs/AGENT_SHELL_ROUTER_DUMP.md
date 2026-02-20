# Agent Shell, Dashboard, and Router — Raw File Contents

Generated: 2026-02-19

---

## 1. `src/components/shell/AgentShell.tsx`

```tsx
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

      {/* Content area — flex column so pages can fill height; scroll wrapper for normal pages */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginLeft: 0 }}>
        <div style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
```

---

## 2. `src/pages/Index.tsx`

```tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '@/hooks/useDashboardData';
import { PageLoader } from '@/components/ui/PageLoader';

// ── Carrier color maps ──────────────────────────────────────
const carrierColorMap: Record<string, string> = {
  'Humana': 'var(--carrier-humana)',
  'Aetna': 'var(--carrier-aetna)',
  'Anthem': 'var(--carrier-anthem)',
  'UHC': 'var(--carrier-uhc)',
  'United Healthcare': 'var(--carrier-uhc)',
  'UnitedHealthcare': 'var(--carrier-uhc)',
  'WellCare': 'var(--carrier-wellcare)',
  'Wellcare': 'var(--carrier-wellcare)',
  'Devoted': 'var(--carrier-devoted)',
  'Devoted Health': 'var(--carrier-devoted)',
};

const carrierHoverBgMap: Record<string, string> = {
  'Humana': 'rgba(58,154,52,0.05)',
  'Aetna': 'rgba(107,37,128,0.04)',
  'Anthem': 'rgba(0,51,160,0.04)',
  'UHC': 'rgba(0,38,119,0.04)',
  'United Healthcare': 'rgba(0,38,119,0.04)',
  'UnitedHealthcare': 'rgba(0,38,119,0.04)',
  'WellCare': 'rgba(0,122,114,0.04)',
  'Wellcare': 'rgba(0,122,114,0.04)',
  'Devoted': 'rgba(184,41,47,0.04)',
  'Devoted Health': 'rgba(184,41,47,0.04)',
};

const CANONICAL_CARRIERS = ['Humana', 'Aetna', 'Anthem', 'UHC', 'WellCare', 'Devoted'];

// ── Helpers ─────────────────────────────────────────────────
function getNextMilestone(clients: number): number {
  if (clients < 100) return Math.ceil((clients + 1) / 25) * 25;
  if (clients < 500) return Math.ceil((clients + 1) / 50) * 50;
  if (clients < 1000) return Math.ceil((clients + 1) / 100) * 100;
  return Math.ceil((clients + 1) / 250) * 250;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function fadeUp(delay: string): React.CSSProperties {
  return { opacity: 0, animation: `fadeUp 0.5s var(--ease) forwards ${delay}` };
}

// ── Dashboard ───────────────────────────────────────────────
export default function Index() {
  const { data, isLoading, error, refetch } = useDashboardData();
  const navigate = useNavigate();

  // Count-up animation
  const [displayCount, setDisplayCount] = useState(0);
  const [bounce, setBounce] = useState(false);
  const animRef = useRef(0);

  // Hover states
  const [syncHovered, setSyncHovered] = useState(false);
  const [hoveredCarrier, setHoveredCarrier] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const target = data.totalClients;
    if (target === 0) { setDisplayCount(0); return; }

    const delay = setTimeout(() => {
      const duration = 1000;
      const start = performance.now();

      const tick = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        setDisplayCount(Math.round(easeOutQuart(t) * target));

        if (t < 1) {
          animRef.current = requestAnimationFrame(tick);
        } else {
          setBounce(true);
          setTimeout(() => setBounce(false), 300);
        }
      };

      animRef.current = requestAnimationFrame(tick);
    }, 200);

    return () => { clearTimeout(delay); cancelAnimationFrame(animRef.current); };
  }, [data?.totalClients]);

  // ── Loading ──
  if (isLoading) return <PageLoader />;

  // ── Error ──
  if (error || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-muted)' }}>
          Unable to load dashboard
        </p>
        <button
          onClick={() => refetch()}
          style={{
            marginTop: 12, padding: '8px 20px', borderRadius: 8,
            background: 'var(--blue)', color: '#fff',
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
            border: 'none', cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Derived data ──
  const firstName = data.firstName || 'Agent';
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Sync badge
  const daysSinceSync = data.lastSyncAt
    ? Math.floor((Date.now() - new Date(data.lastSyncAt).getTime()) / 86_400_000)
    : null;
  const isSyncFresh = daysSinceSync !== null && daysSinceSync <= 7;
  const syncColor = isSyncFresh ? 'var(--green)' : 'var(--amber)';
  const syncText = daysSinceSync === null
    ? 'Never synced'
    : isSyncFresh
      ? `Synced ${new Date(data.lastSyncAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : `Last synced ${daysSinceSync} days ago`;

  // Milestone
  const milestoneTarget = getNextMilestone(data.totalClients);
  const remaining = milestoneTarget - data.totalClients;
  const milestoneProgress = Math.min((data.totalClients / milestoneTarget) * 100, 100);

  let notePrefix: string;
  let noteBold: string;
  if (data.totalClients === 0) {
    notePrefix = 'Start building your book — ';
    noteBold = 'every client counts.';
  } else if (remaining <= 20) {
    notePrefix = 'Almost there — just ';
    noteBold = `${remaining} to go`;
  } else {
    notePrefix = 'On your way to ';
    noteBold = `${milestoneTarget}`;
  }

  // AEP countdown
  const AEP_START_MONTH = 10;
  const AEP_START_DAY = 15;
  const AEP_END_MONTH = 12;
  const AEP_END_DAY = 7;
  const AEP_PRESEASON_DAYS = 30;

  const now = new Date();
  const currentYear = now.getFullYear();
  const aepStart = new Date(currentYear, AEP_START_MONTH - 1, AEP_START_DAY);
  const aepEnd = new Date(currentYear, AEP_END_MONTH - 1, AEP_END_DAY);
  const preseasonStart = new Date(aepStart.getTime() - AEP_PRESEASON_DAYS * 86_400_000);

  const daysUntilAep = Math.ceil((aepStart.getTime() - now.getTime()) / 86_400_000);
  const daysLeftInAep = Math.ceil((aepEnd.getTime() - now.getTime()) / 86_400_000);

  type AepPhase = 'off' | 'pre' | 'during';
  let aepPhase: AepPhase = 'off';
  if (now >= preseasonStart && now < aepStart) aepPhase = 'pre';
  else if (now >= aepStart && now <= aepEnd) aepPhase = 'during';

  const goToSync = () => navigate('/sync');

  return (
    <div
      style={{
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        background: 'radial-gradient(ellipse 50% 50% at 50% 48%, var(--bg-warm-glow) 0%, var(--bg) 70%)',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          padding: '20px 32px 0',
          ...fadeUp('0s'),
        }}
      >
        {/* Left: date + greeting */}
        <div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)' }}>
            {dateStr}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-serif)', fontSize: 25, fontWeight: 400,
              color: 'var(--text-primary)', marginTop: 2,
            }}
          >
            Good {getGreeting()},{' '}
            <em style={{ color: 'var(--gold-dark)' }}>{firstName}</em>
          </div>
        </div>

        {/* Right: sync badge */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Sync your book of business"
          onClick={goToSync}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToSync(); } }}
          onMouseEnter={() => setSyncHovered(true)}
          onMouseLeave={() => setSyncHovered(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 20,
            fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500,
            color: syncColor,
            background: syncHovered ? 'rgba(0,0,0,0.04)' : 'transparent',
            cursor: 'pointer', transition: 'background var(--fast)',
            outline: 'none',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: syncColor, flexShrink: 0 }} />
          <span>{syncText}</span>
          <span style={{ opacity: syncHovered ? 0.7 : 0, transition: 'opacity var(--fast)' }}>
            · Sync
          </span>
        </div>
      </div>

      {/* ── Center ── */}
      <div
        style={{
          flex: '1 1 auto', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          minHeight: 0, paddingBottom: 20,
        }}
      >
        {/* Hero number */}
        <div aria-live="polite" style={fadeUp('0.15s')}>
          <div
            style={{
              fontFamily: 'var(--font-serif)', fontWeight: 700,
              fontSize: 'min(134px, 14.5vh)', lineHeight: 0.85,
              letterSpacing: '-0.04em', color: 'var(--text-primary)',
              transform: bounce ? 'scale(1.012)' : 'scale(1)',
              transition: 'transform 0.3s var(--ease)',
              textAlign: 'center',
            }}
          >
            {displayCount}
          </div>
        </div>

        {/* Label */}
        <div
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 'min(17px, 2vh)',
            fontWeight: 400, color: 'var(--text-muted)',
            marginTop: 'min(8px, 1vh)',
            ...fadeUp('0.3s'),
          }}
        >
          clients in your book
        </div>

        {/* Delta badge */}
        {data.newThisMonth > 0 && (
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              marginTop: 10, padding: '5px 16px', borderRadius: 20,
              background: 'var(--green-bg)', color: 'var(--green)',
              fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600,
              ...fadeUp('0.45s'),
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 10V2M6 2L2.5 5.5M6 2L9.5 5.5"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
            {data.newThisMonth} new this month
          </div>
        )}

        {/* Milestone */}
        <div style={{ width: 'min(380px, 52%)', marginTop: 'min(24px, 2.5vh)', ...fadeUp('0.55s') }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--text-muted)',
              }}
            >
              Next Milestone
            </span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: '#8A7B68' }}>
              {data.totalClients} / {milestoneTarget}
            </span>
          </div>

          {/* Track */}
          <div style={{ height: 8, background: 'var(--bg-muted)', borderRadius: 4, marginTop: 8, overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)' }}>
            <MilestoneBar progress={milestoneProgress} />
          </div>

          {/* Note */}
          <div
            style={{
              fontFamily: 'var(--font-sans)', fontSize: 12.5,
              color: 'var(--text-muted)', textAlign: 'center', marginTop: 10,
            }}
          >
            {notePrefix}
            <span style={{ fontWeight: 700, color: 'var(--gold-dark)' }}>{noteBold}</span>
          </div>
        </div>

        {/* AEP countdown */}
        {aepPhase !== 'off' && (
          <div
            role="status"
            aria-label={
              aepPhase === 'pre'
                ? `Annual Enrollment Period opens in ${daysUntilAep} days`
                : daysLeftInAep > 0
                  ? `${daysLeftInAep} days left in Annual Enrollment Period`
                  : 'Last day of Annual Enrollment Period'
            }
            style={{
              width: 'min(380px, 52%)',
              marginTop: 'min(24px, 2.5vh)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'var(--font-sans)', fontSize: 12.5,
              ...fadeUp('0.65s'),
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {aepPhase === 'pre' ? (
              <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>
                AEP opens in{' '}
                <span style={{ fontWeight: 700, color: 'var(--gold-dark)' }}>{daysUntilAep}</span>
                {' '}days
              </span>
            ) : daysLeftInAep <= 0 ? (
              <span style={{ fontWeight: 600, color: 'var(--red)' }}>Last day of AEP</span>
            ) : (
              <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>
                <span style={{
                  fontWeight: 700,
                  color: daysLeftInAep > 10 ? 'var(--gold-dark)' : daysLeftInAep >= 4 ? 'var(--amber)' : 'var(--red)',
                }}>
                  {daysLeftInAep}
                </span>
                {' '}{daysLeftInAep === 1 ? 'day' : 'days'} left in AEP
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Portal strip ── */}
      <div
        style={{
          flexShrink: 0,
          background: 'var(--bg-subtle)',
          borderTop: '1px solid var(--bg-muted)',
          padding: '14px 32px',
          display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap',
          ...fadeUp('0.7s'),
        }}
      >
        {CANONICAL_CARRIERS.map((name) => {
          const color = carrierColorMap[name] || 'var(--text-muted)';
          const hoverBg = carrierHoverBgMap[name] || 'rgba(0,0,0,0.03)';
          const isHovered = hoveredCarrier === name;

          return (
            <a
              key={name}
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label={`Open ${name} portal`}
              onMouseEnter={() => setHoveredCarrier(name)}
              onMouseLeave={() => setHoveredCarrier(null)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '7px 14px', borderRadius: 20,
                background: isHovered ? hoverBg : '#fff',
                color,
                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                boxShadow: isHovered
                  ? '0 6px 16px rgba(0,0,0,0.08)'
                  : '0 1px 3px rgba(0,0,0,0.04)',
                transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                transition: 'transform var(--med) var(--ease), box-shadow var(--med), background var(--fast)',
                textDecoration: 'none', cursor: 'pointer',
              }}
            >
              {name}
              <span
                style={{
                  fontSize: 9,
                  opacity: isHovered ? 0.5 : 0,
                  transition: 'opacity var(--fast)',
                }}
              >
                ↗
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ── Animated milestone fill ─────────────────────────────────
function MilestoneBar({ progress }: { progress: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ref.current) ref.current.style.width = `${progress}%`;
    }, 600);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div
      ref={ref}
      style={{
        width: '0%', height: '100%', borderRadius: 4,
        background: 'linear-gradient(90deg, var(--gold-dark), var(--gold))',
        transition: 'width 1.2s var(--ease)',
      }}
    />
  );
}
```

---

## 3. `src/App.tsx`

```tsx
import { useEffect, lazy, Suspense } from "react";
import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { FeatureFlagsProvider } from "./contexts/FeatureFlagsContext";
import { ViewModeProvider } from "./contexts/ViewModeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AgentShell } from "./components/shell/AgentShell";
import { AdminShell } from "./components/shell/AdminShell";

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
    <div className="animate-pulse" style={{ color: 'var(--text-muted)' }}>Loading...</div>
  </div>
);

// ============================================================================
// ROUTE-BASED CODE SPLITTING
// Pages are lazy-loaded to reduce initial bundle size.
// Critical paths (Auth, Index) are loaded eagerly for fast initial render.
// ============================================================================

// Eager load: Critical path pages (auth flow)
import AuthPage from "./pages/AuthPage";
import SetPasswordPage from "./pages/auth/SetPasswordPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy load: Agent pages (loaded after auth)
const StartHerePage = lazy(() => import("./pages/StartHerePage"));
const IndustryUpdatesPage = lazy(() => import("./pages/IndustryUpdatesPage"));
const CompliancePage = lazy(() => import("./pages/CompliancePage"));
const CarrierResourcesPage = lazy(() => import("./pages/CarrierResourcesPage"));
const AgentToolsPage = lazy(() => import("./pages/AgentToolsPage"));
const ContractingHubPage = lazy(() => import("./pages/ContractingHubPage"));
const FormsLibraryPage = lazy(() => import("./pages/FormsLibraryPage"));
const CarrierPortalsPage = lazy(() => import("./pages/CarrierPortalsPage"));
const CarrierPlansPage = lazy(() => import("./pages/CarrierPlansPage"));
const DocumentManagementPage = lazy(() => import("./pages/DocumentManagementPage"));
const TrainingPage = lazy(() => import("./pages/TrainingPage"));
const TrainingLibrary = lazy(() => import("./pages/training/TrainingLibrary"));
const ContractingPage = lazy(() => import("./pages/ContractingPage"));
const MyProfilePage = lazy(() => import("./pages/MyProfilePage"));
const T65ReviewPage = lazy(() => import("./pages/T65ReviewPage"));
const SyncFlow = lazy(() => import("./pages/SyncFlow"));

// Lazy load: Book of Business pages
const GrowthIncome = lazy(() => import("./pages/book/GrowthIncome"));
const BookClientList = lazy(() => import("./pages/book/ClientList"));
const BookImportPage = lazy(() => import("./pages/book/BookImportPage"));

// Lazy load: Admin pages (only loaded by admins)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AgentsPage = lazy(() => import("./pages/admin/AgentsPage"));
const UserDetailPage = lazy(() => import("./pages/admin/UserDetailPage"));
const NewAgentPage = lazy(() => import("./pages/admin/NewAgentPage"));
const ContractingQueuePage = lazy(() => import("./pages/admin/ContractingQueuePage"));
const LabsPage = lazy(() => import("./pages/admin/LabsPage"));
const ActivityLogPage = lazy(() => import("./pages/admin/ActivityLogPage"));
const RTSImportPage = lazy(() => import("./pages/admin/RTSImportPage"));
const RoadmapGeneratorPage = lazy(() => import("./pages/admin/RoadmapGeneratorPage"));
const AgentProfilePage = lazy(() => import("./pages/admin/AgentProfilePage"));
const PdfBuilderPage = lazy(() => import("./pages/admin/PdfBuilderPage"));
const PlanFinderPage = lazy(() => import("./pages/PlanFinderPage"));
const AgentsBookPage = lazy(() => import("./pages/admin/AgentsBookPage"));
const AgentBookDetailPage = lazy(() => import("./pages/admin/AgentBookDetailPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // Data stays fresh for 5 minutes
      gcTime: 10 * 60 * 1000,        // Cache kept for 10 minutes
      refetchOnWindowFocus: false,   // DON'T refetch when tab regains focus
      refetchOnMount: 'always',      // But do fetch on first mount if no data
      retry: 1,                      // Only retry once on failure
    },
  },
});

// Component to handle recovery token redirects
function RecoveryRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if this is a recovery redirect (has type=recovery in hash)
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      // Redirect to set-password page while preserving the hash
      navigate('/auth/set-password' + hash, { replace: true });
    }
  }, [navigate, location]);

  return null;
}

// =============================================================================
// SENTRY ERROR BOUNDARY
// =============================================================================
// ErrorBoundary catches React errors that would crash the whole app.
// Instead of showing a white screen, it:
// 1. Reports the error to Sentry (so you know about it)
// 2. Shows a fallback UI (so users know something went wrong)
//
// This is different from try/catch - ErrorBoundary catches errors in the
// React component tree (render errors, lifecycle errors, etc.)
// =============================================================================
const SentryFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center p-8 max-w-md">
      <h1 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h1>
      <p className="text-slate-600 mb-4">
        We've been notified and are looking into it. Please refresh the page to try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

const App = () => (
  <Sentry.ErrorBoundary fallback={<SentryFallback />} showDialog>
    <QueryClientProvider client={queryClient}>
      <FeatureFlagsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <ViewModeProvider>
          <RecoveryRedirectHandler />
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ================================ */}
            {/* Public — no shell               */}
            {/* ================================ */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/set-password" element={<SetPasswordPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

            {/* ================================ */}
            {/* Agent contracting (inside shell, accessible to contracting-required agents) */}
            {/* ================================ */}
            <Route element={<ProtectedRoute requireAgent allowContractingOnly><AgentShell /></ProtectedRoute>}>
              <Route path="contracting" element={<ContractingPage />} />
            </Route>

            {/* ================================ */}
            {/* Agent shell                     */}
            {/* ================================ */}
            <Route element={<ProtectedRoute><AgentShell /></ProtectedRoute>}>
              <Route index element={<Index />} />
              <Route path="book" element={<BookClientList />} />
              <Route path="book/growth" element={<GrowthIncome />} />
              <Route path="import" element={<BookImportPage />} />
              <Route path="contracting-hub" element={<ContractingHubPage />} />
              <Route path="plan-finder" element={<PlanFinderPage />} />
              <Route path="carrier-portals" element={<CarrierPortalsPage />} />
              <Route path="carrier-resources" element={<CarrierResourcesPage />} />
              <Route path="carrier-resources/plans" element={<CarrierPlansPage />} />
              <Route path="forms-library" element={<FormsLibraryPage />} />
              <Route path="training" element={<TrainingLibrary />} />
              <Route path="training/:videoId" element={<TrainingPage />} />
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="agent-tools" element={<AgentToolsPage />} />
              <Route path="my-profile" element={<MyProfilePage />} />
              <Route path="start-here" element={<StartHerePage />} />
              <Route path="industry-updates" element={<IndustryUpdatesPage />} />
              <Route path="t65-review" element={<T65ReviewPage />} />
              <Route path="sync" element={<SyncFlow />} />
              <Route path="my-clients" element={<Navigate to="/book" replace />} />
            </Route>

            {/* ================================ */}
            {/* Admin shell                     */}
            {/* ================================ */}
            <Route element={<ProtectedRoute requireAdmin><AdminShell /></ProtectedRoute>}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/agents" element={<AgentsPage />} />
              <Route path="admin/agents/new" element={<NewAgentPage />} />
              <Route path="admin/agents/book" element={<AgentsBookPage />} />
              <Route path="admin/agents/:agentId/book" element={<AgentBookDetailPage />} />
              <Route path="admin/agents/:profileId" element={<AgentProfilePage />} />
              <Route path="admin/users/:userId" element={<UserDetailPage />} />
              <Route path="admin/contracting" element={<ContractingQueuePage />} />
              <Route path="admin/rts-import" element={<RTSImportPage />} />
              <Route path="admin/roadmaps" element={<RoadmapGeneratorPage />} />
              <Route path="admin/documents" element={<DocumentManagementPage />} />
              <Route path="admin/activity-log" element={<ProtectedRoute requireSuperAdmin><ActivityLogPage /></ProtectedRoute>} />
              <Route path="admin/labs" element={<ProtectedRoute requireSuperAdmin><LabsPage /></ProtectedRoute>} />
              <Route path="admin/pdf-builder" element={<ProtectedRoute requireSuperAdmin><PdfBuilderPage /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ViewModeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </FeatureFlagsProvider>
  </QueryClientProvider>
  </Sentry.ErrorBoundary>
);

export default App;
```
