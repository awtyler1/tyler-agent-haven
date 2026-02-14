import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { useNavigationContext } from '@/hooks/useNavigationContext';

export function AdminShell() {
  const { isDualRole, toggleMode, viewMode } = useNavigationContext();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Sticky header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'white',
          borderBottom: '1px solid var(--bg-muted)',
        }}
      >
        <nav
          aria-label="Admin navigation"
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
          }}
        >
          {/* Left: Logo + back link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Gold T logo */}
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
            <Link
              to="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 500,
                transition: 'color var(--fast) var(--ease)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Admin Dashboard</span>
            </Link>
          </div>

          {/* Right: Mode toggle + avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isDualRole && (
              <button
                onClick={toggleMode}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--bg-muted)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--fast) var(--ease)',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--text-muted)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bg-muted)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                Switch to {viewMode === 'admin' ? 'Agent' : 'Admin'}
              </button>
            )}
            <UserAvatarDropdown />
          </div>
        </nav>
      </header>

      {/* Content area */}
      <main style={{ flex: 1, maxWidth: 1024, width: '100%', margin: '0 auto', padding: '24px 24px' }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ padding: '32px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: 0 }}>
          Powered by Tyler Insurance Group
        </p>
      </footer>
    </div>
  );
}
