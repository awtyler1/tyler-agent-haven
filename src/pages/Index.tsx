import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// ── Helpers ─────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function fadeUp(delay: string): React.CSSProperties {
  return { opacity: 0, animation: `fadeUp 0.5s var(--ease) forwards ${delay}` };
}

// ── Quick action data ───────────────────────────────────────
const quickActions = [
  {
    title: 'Contracting Hub',
    description: 'View carrier status and certifications',
    path: '/contracting-hub',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
    ),
  },
  {
    title: 'Training',
    description: 'Access learning paths and resources',
    path: '/training',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
      </svg>
    ),
  },
  {
    title: 'Carrier Resources',
    description: 'Contacts, documents, and portal links',
    path: '/carrier-resources',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
    ),
  },
  {
    title: 'Compliance',
    description: 'Rules, guidelines, and required forms',
    path: '/compliance',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-dark)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
] as const;

// ── Dashboard ───────────────────────────────────────────────
export default function Index() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const firstName = profile?.full_name?.split(' ')[0] || 'Agent';
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

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
          padding: '20px 32px 0',
          ...fadeUp('0s'),
        }}
      >
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

      {/* ── Center content ── */}
      <div
        style={{
          flex: '1 1 auto', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          minHeight: 0, padding: '0 32px 20px',
        }}
      >
        {/* Welcome line */}
        <div
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--text-muted)',
            marginBottom: 28,
            ...fadeUp('0.1s'),
          }}
        >
          Welcome to your TIG hub.
        </div>

        {/* Quick-action grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 14,
            maxWidth: 560,
            width: '100%',
            ...fadeUp('0.2s'),
          }}
        >
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '18px 20px',
                background: 'var(--bg-card)',
                borderRadius: 14,
                border: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'transform var(--med) var(--ease), box-shadow var(--med) var(--ease)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
              }}
            >
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                {action.icon}
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                  color: 'var(--text-primary)',
                }}>
                  {action.title}
                </div>
                <div style={{
                  fontFamily: 'var(--font-sans)', fontSize: 12,
                  color: 'var(--text-muted)', marginTop: 3,
                }}>
                  {action.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Onboarding progress placeholder */}
        <div
          style={{
            maxWidth: 560, width: '100%', marginTop: 20,
            padding: '16px 20px',
            background: 'var(--bg-subtle)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            ...fadeUp('0.35s'),
          }}
        >
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
            color: 'var(--text-muted)',
          }}>
            Onboarding Progress
          </span>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600,
            color: '#fff',
            background: 'var(--gold)',
            padding: '3px 10px',
            borderRadius: 20,
            letterSpacing: '0.03em',
          }}>
            Coming Soon
          </span>
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
              maxWidth: 560, width: '100%',
              marginTop: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'var(--font-sans)', fontSize: 12.5,
              ...fadeUp('0.45s'),
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
    </div>
  );
}
