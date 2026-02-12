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
