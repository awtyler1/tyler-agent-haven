import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Award,
  TrendingUp,
  Sun,
  Link2,
  Target,
  Flame,
  ChevronRight,
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Calendar,
  AlertCircle,
  Search,
  GraduationCap,
  LayoutGrid,
  Lock,
} from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { SyncStatusPill } from '@/components/dashboard/SyncStatusPill';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { PageLoader } from '@/components/ui/PageLoader';

// ============================================================
// Golden Hour — Design Tokens
// ============================================================
const GH = {
  pageBg: '#F3EDE4',
  heroBg: 'linear-gradient(145deg, #1a1611, #0f0d09)',
  heroGlow: 'rgba(184,134,11,0.14)',
  heroBorder: 'rgba(184,134,11,0.08)',

  glass: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.7)',
  glassShadow: '0 2px 12px rgba(60,48,28,0.04)',
  glassBlur: '20px',

  textPrimary: 'rgba(60,48,28,0.85)',
  textSecondary: 'rgba(60,48,28,0.55)',
  textMuted: 'rgba(60,48,28,0.35)',
  textFaint: 'rgba(60,48,28,0.20)',

  heroText: 'rgba(255,245,230,0.95)',
  heroTextMuted: 'rgba(255,245,230,0.55)',

  gold: '#8B6914',
  goldGrad: 'linear-gradient(135deg, #b8860b, #d4a017)',

  border: 'rgba(60,48,28,0.06)',
  borderLight: 'rgba(60,48,28,0.04)',

  tileHover: 'rgba(60,48,28,0.03)',
  tileBg: 'rgba(60,48,28,0.015)',
};

const serif = '"Playfair Display", Georgia, serif';

// Carrier SVG icon marks (white on colored background)
const AetnaIcon = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
    <text x="0" y="12" fontFamily="'Playfair Display', Georgia, serif" fontSize="14" fontWeight="700" fill="white">Ae</text>
  </svg>
);
const AnthemIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="6.5" y="1" width="5" height="16" rx="1.2" fill="white"/>
    <rect x="1" y="6.5" width="16" height="5" rx="1.2" fill="white"/>
  </svg>
);
const DevotedIcon = () => (
  <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
    <path d="M10 17.5l-1.2-1.1C3.7 11.7 1 9.1 1 5.9 1 3.3 3.1 1.2 5.6 1.2c1.4 0 2.8.7 3.7 1.7L10 3.6l.7-.7c.9-1 2.3-1.7 3.7-1.7C16.9 1.2 19 3.3 19 5.9c0 3.2-2.7 5.8-7.8 10.5L10 17.5z" fill="white"/>
  </svg>
);
const HumanaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="4" height="14" rx="1" fill="white"/>
    <rect x="11" y="1" width="4" height="14" rx="1" fill="white"/>
    <rect x="5" y="6" width="6" height="4" rx="0.8" fill="white"/>
  </svg>
);
const UHCIcon = () => (
  <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
    <path d="M8 1L1 4.2v4.6C1 13.4 4 17 8 17.5c4-.5 7-4.1 7-8.7V4.2L8 1z" fill="white" fillOpacity="0.95"/>
  </svg>
);
const WellcareIcon = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
    <path d="M1 1l3.5 12h1.5L9 5l3 8h1.5L17 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

// Carrier portal tiles
const CARRIER_PORTALS = [
  { name: 'Aetna', letter: 'A', icon: <AetnaIcon />, url: 'https://www.aetna.com/producer_public/login.fcc', color: '#7B2D8E' },
  { name: 'Anthem', letter: 'A', icon: <AnthemIcon />, url: 'https://brokerportal.anthem.com/apps/ptb/login', color: '#0072CE' },
  { name: 'Devoted', letter: 'D', icon: <DevotedIcon />, url: 'https://agent.devoted.com/', color: '#F97316' },
  { name: 'Humana', letter: 'H', icon: <HumanaIcon />, url: 'https://account.humana.com/', color: '#4B9B4B' },
  { name: 'UHC', letter: 'U', icon: <UHCIcon />, url: 'https://www.uhcagent.com', color: '#002677' },
  { name: 'Wellcare', letter: 'W', icon: <WellcareIcon />, url: 'https://www.wellcare.com/en/broker-resources/broker-resources', color: '#00A79D' },
];

// Carrier bar colors inside the dark hero card
const HERO_CARRIER_COLORS: Record<string, string> = {
  humana: '#4ade80',
  aetna: '#c084fc',
  anthem: '#60a5fa',
  wellcare: '#f6c543',
  cigna: '#f87171',
  unitedhealthcare: '#38bdf8',
  uhc: '#38bdf8',
  centene: '#fb923c',
};

function getHeroCarrierColor(code: string): string {
  return HERO_CARRIER_COLORS[code.toLowerCase().replace(/[^a-z]/g, '')] || '#94a3b8';
}

// ============================================================
// Golden Hour — Agent Dashboard
// Handles: Loading, Error, Empty, Stale, Normal
// ============================================================
export default function Index() {
  const { data, isLoading, error } = useDashboardData();
  const navigate = useNavigate();

  if (isLoading) return <PageLoader />;

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: GH.pageBg }}>
        <div className="text-center">
          <p className="mb-2" style={{ color: GH.textSecondary }}>Unable to load dashboard</p>
          <p className="text-sm" style={{ color: GH.textMuted }}>{error?.message || 'Please try again'}</p>
        </div>
      </div>
    );
  }

  const isEmpty = data.totalClients === 0;
  const isStale = data.syncStatus === 'stale';

  const toGoal = data.nextMilestone - data.totalClients;
  const lastMilestone = data.lastMilestone || (data.nextMilestone - 100);
  const progress = data.totalClients >= data.nextMilestone
    ? 100
    : Math.max(0, ((data.totalClients - lastMilestone) / (data.nextMilestone - lastMilestone)) * 100);

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const maxCarrierCount = Math.max(...data.carriers.map(c => c.count), 1);

  return (
    <div className="min-h-screen grain-overlay" style={{ background: GH.pageBg }}>
      {/* Atmospheric blurs */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-5%',
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(184,134,11,0.04) 0%, transparent 60%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-5%',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(139,92,246,0.025) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div className="relative max-w-[1100px] mx-auto px-4 py-3 sm:px-6 sm:py-4">
        {/* ── Header ── */}
        <header className="flex items-center justify-between mb-3 relative z-10" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards' }}>
          <div className="flex items-center gap-2">
            <span className="font-bold" style={{ fontFamily: serif, fontSize: 17, color: GH.gold }}>
              TIG
            </span>
            <span
              className="uppercase font-medium"
              style={{ fontSize: 11, letterSpacing: '0.08em', color: GH.textFaint }}
            >
              Agent Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="font-medium hidden sm:inline"
              style={{ fontSize: 11, color: GH.textMuted, letterSpacing: '0.03em' }}
            >
              {currentMonth}
            </span>
            <SyncStatusPill
              status={data.syncStatus}
              lastSyncAt={data.lastSyncAt}
              totalClients={data.totalClients}
              newThisMonth={data.newThisMonth}
              termedThisMonth={data.termedThisMonth}
              netChange={data.netChange}
              carrierCount={data.carriers.length}
            />
            <UserAvatarDropdown />
          </div>
        </header>

        {/* ── Stale Banner ── */}
        {isStale && !isEmpty && (
          <div
            className="mb-6 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(184,134,11,0.06), rgba(212,160,23,0.03))',
              border: '1px solid rgba(184,134,11,0.12)',
              opacity: 0,
              animation: 'fadeInUp 0.5s ease-out forwards',
              animationDelay: '40ms',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(184,134,11,0.08)' }}
              >
                <Calendar className="w-5 h-5" style={{ color: GH.gold }} />
              </div>
              <div>
                <p className="font-medium" style={{ color: GH.textPrimary }}>
                  Time to sync your {currentMonth.split(' ')[0]} reports
                </p>
                <p className="text-sm" style={{ color: GH.textMuted }}>
                  {data.lastSyncAt
                    ? `Last synced ${new Date(data.lastSyncAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : 'No sync yet'
                  } · Recommended by the 7th each month
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/sync')}
              className="flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-xl transition-opacity hover:opacity-90 flex-shrink-0"
              style={{ background: GH.goldGrad, boxShadow: '0 2px 8px rgba(139,105,20,0.2)' }}
            >
              <Upload className="w-4 h-4" />
              Sync Now
            </button>
          </div>
        )}

        {/* ── Main Two-Column Layout ── */}
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-3.5">
          {/* Left Column */}
          <div style={{ flex: 29, opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '80ms' }} className="min-w-0">
            {/* ── Dark Hero Card ── */}
            <div
              className="relative overflow-hidden flex flex-col"
              style={{
                background: GH.heroBg,
                borderRadius: 22,
                padding: '22px 28px 20px',
                border: `1px solid ${GH.heroBorder}`,
                boxShadow: '0 4px 30px rgba(60,48,28,0.15), 0 1px 3px rgba(0,0,0,0.1)',
                height: '100%',
              }}
            >
              {/* Inner glow */}
              <div
                className="absolute pointer-events-none"
                style={{
                  top: '-15%',
                  left: '-5%',
                  width: '50%',
                  height: '65%',
                  background: `radial-gradient(ellipse at center, ${GH.heroGlow} 0%, transparent 70%)`,
                }}
              />

              <div className="relative flex flex-col flex-1">
                {/* Badges */}
                {!isEmpty && (
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    {(data.newThisMonth > 0 || data.termedThisMonth > 0) && (
                      <div
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                        style={{
                          background: data.netChange > 0
                            ? 'rgba(74,222,128,0.08)'
                            : data.netChange < 0 ? 'rgba(251,146,60,0.08)' : 'rgba(148,163,184,0.08)',
                          border: `1px solid ${
                            data.netChange > 0
                              ? 'rgba(74,222,128,0.12)'
                              : data.netChange < 0 ? 'rgba(251,146,60,0.12)' : 'rgba(148,163,184,0.12)'
                          }`,
                        }}
                      >
                        <TrendingUp
                          className={`w-3.5 h-3.5 ${data.netChange < 0 ? 'rotate-180' : ''}`}
                          style={{
                            color: data.netChange > 0 ? '#4ade80' : data.netChange < 0 ? '#fb923c' : '#94a3b8',
                          }}
                        />
                        <span
                          className="text-xs font-semibold"
                          style={{
                            color: data.netChange > 0 ? '#4ade80' : data.netChange < 0 ? '#fb923c' : '#94a3b8',
                          }}
                        >
                          {data.netChange > 0 ? '+' : ''}{data.netChange} this month
                        </span>
                      </div>
                    )}
                    {data.growthStreak >= 2 && (
                      <div
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                        style={{
                          background: 'rgba(251,146,60,0.06)',
                          border: '1px solid rgba(251,146,60,0.1)',
                        }}
                      >
                        <Flame className="w-3.5 h-3.5" style={{ color: '#fb923c' }} />
                        <span className="font-semibold" style={{ fontSize: 11, color: '#fb923c' }}>
                          {data.growthStreak} mo
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* THE NUMBER + Sparkline */}
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <span
                      className="text-[5rem] sm:text-[5.5rem] lg:text-[90px] block"
                      style={{
                        fontFamily: serif,
                        fontWeight: 400,
                        lineHeight: 0.95,
                        letterSpacing: -3,
                        background: isEmpty
                          ? 'linear-gradient(180deg, rgba(255,245,230,0.15) 20%, rgba(212,160,23,0.08) 100%)'
                          : 'linear-gradient(180deg, rgba(255,245,230,0.95) 20%, rgba(212,160,23,0.65) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {data.totalClients}
                    </span>
                    <Link
                      to="/my-clients"
                      className="mt-2 inline-flex items-center gap-1.5 group"
                      style={{ fontFamily: serif, fontSize: 14, fontStyle: 'italic', color: GH.heroTextMuted, textDecoration: 'none' }}
                    >
                      {data.totalClients === 1 ? 'client' : 'clients'} in your book
                      <ChevronRight
                        className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-70 group-hover:translate-x-0 transition-all duration-200"
                      />
                    </Link>
                    {isStale && !isEmpty && (
                      <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: '#f6c543' }}>
                        <AlertCircle className="w-3.5 h-3.5" />
                        Data may be outdated · Sync to update
                      </p>
                    )}
                  </div>
                  {!isEmpty && data.monthlyHistory.length >= 2 && (
                    <MiniSparkline data={data.monthlyHistory} />
                  )}
                </div>

                {/* Conditional content */}
                {isEmpty ? (
                  <GHEmptyStateCTA onStartSync={() => navigate('/sync')} />
                ) : (
                  <>
                    {/* Carrier bars */}
                    {data.carriers.length > 0 && (
                      <div className={isStale ? 'opacity-75' : ''} style={{ borderTop: '1px solid rgba(255,245,230,0.05)', paddingTop: 12 }}>
                        <div className="space-y-[5px]">
                          {data.carriers.map((carrier) => {
                            const barColor = getHeroCarrierColor(carrier.code);
                            const pct = (carrier.count / maxCarrierCount) * 100;
                            return (
                              <div key={carrier.id} className="flex items-center gap-3.5">
                                <span
                                  className="font-medium truncate"
                                  style={{ fontSize: 11, color: 'rgba(255,245,230,0.55)', width: 56 }}
                                >
                                  {carrier.name}
                                </span>
                                <div
                                  className="flex-1 rounded overflow-hidden"
                                  style={{ height: 10, background: 'rgba(255,245,230,0.02)' }}
                                >
                                  <div
                                    className="h-full rounded transition-all duration-700"
                                    style={{
                                      width: `${pct}%`,
                                      background: `linear-gradient(90deg, ${barColor}25, ${barColor}55)`,
                                      borderRight: `2px solid ${barColor}`,
                                    }}
                                  />
                                </div>
                                <span
                                  className="font-semibold text-right"
                                  style={{ fontSize: 13, color: 'rgba(255,245,230,0.65)', width: 30 }}
                                >
                                  {carrier.count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Inline milestone */}
                    <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,245,230,0.05)', paddingTop: 12 }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex items-center justify-center flex-shrink-0"
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              background: 'rgba(139,92,246,0.1)',
                              border: '1px solid rgba(139,92,246,0.12)',
                            }}
                          >
                            <Target className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
                          </div>
                          <div>
                            <p
                              className="uppercase"
                              style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,245,230,0.45)' }}
                            >
                              Next Milestone
                            </p>
                            <p style={{ fontFamily: serif, fontSize: 15, color: 'rgba(255,245,230,0.7)' }}>
                              {data.nextMilestone} clients
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p style={{ fontFamily: serif, fontSize: 26, color: '#a78bfa', lineHeight: 1 }}>
                            {toGoal > 0 ? toGoal : 0}
                          </p>
                          <p style={{ fontFamily: serif, fontSize: 10, fontStyle: 'italic', color: 'rgba(255,245,230,0.2)' }}>
                            {toGoal > 0 ? 'to go' : 'reached!'}
                          </p>
                        </div>
                      </div>
                      <div
                        className="rounded-full overflow-hidden"
                        style={{ height: 4, background: 'rgba(255,245,230,0.03)', marginTop: 6 }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div style={{ flex: 21, opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '160ms' }} className="min-w-0 flex flex-col">
            {/* ── Carrier Portals ── */}
            <GlassPanel className="flex flex-col flex-1" style={{ padding: '16px 14px', borderRadius: 20 }}>
              <p
                className="uppercase font-semibold mb-2.5"
                style={{ fontSize: 10, letterSpacing: '0.07em', color: GH.textMuted }}
              >
                Carrier Portals
              </p>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1"
                style={{ alignContent: 'center' }}
              >
                {CARRIER_PORTALS.map((portal) => (
                  <PortalTile key={portal.name} portal={portal} />
                ))}
              </div>
              <Link
                to="/carrier-resources"
                className="flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  marginTop: 10,
                  padding: '10px 16px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(139,105,20,0.08), rgba(139,105,20,0.03))',
                  border: '1px solid rgba(139,105,20,0.12)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139,105,20,0.20)';
                  e.currentTarget.style.background = 'rgba(139,105,20,0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139,105,20,0.12)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,105,20,0.08), rgba(139,105,20,0.03))';
                }}
              >
                <LayoutGrid style={{ width: 14, height: 14, color: '#8B6914' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#8B6914' }}>All Carrier Resources</span>
                <ChevronRight style={{ width: 13, height: 13, color: 'rgba(139,105,20,0.4)' }} />
              </Link>
            </GlassPanel>
          </div>
        </div>

        {/* ── Tools Dock ── */}
        <GlassPanel style={{ padding: '10px 16px', borderRadius: 18, marginTop: 8, opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards', animationDelay: '240ms' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
            <DockTile icon={Search} label="Plan Finder" gradient="linear-gradient(135deg, #10b981, #059669)" shadow="0 2px 8px rgba(16,185,129,0.2)" to="/plan-finder" comingSoon />
            <DockTile icon={Sun} label="SunFire" gradient="linear-gradient(135deg, #f97316, #ea580c)" shadow="0 2px 8px rgba(249,115,22,0.2)" href="https://www.sunfirematrix.com/app/agent/pfs" />
            <DockTile icon={Link2} label="C4Medicare" gradient="linear-gradient(135deg, #3b82f6, #2563eb)" shadow="0 2px 8px rgba(59,130,246,0.2)" href="https://pinnacle7.destinationrx.com/PC/Agent/Account/Login" />
            <DockTile icon={FileText} label="Forms" gradient="linear-gradient(135deg, #64748b, #475569)" shadow="0 2px 8px rgba(100,116,139,0.15)" to="/forms-library" />
            <DockTile icon={Award} label="Certifications" gradient="linear-gradient(135deg, #10b981, #059669)" shadow="0 2px 8px rgba(16,185,129,0.15)" to="/contracting-hub" />
            <DockTile icon={GraduationCap} label="Training" gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)" shadow="0 2px 8px rgba(139,92,246,0.15)" to="/training" />
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

/** Frosted glass panel wrapper */
function GlassPanel({
  children,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        background: GH.glass,
        backdropFilter: `blur(${GH.glassBlur})`,
        WebkitBackdropFilter: `blur(${GH.glassBlur})`,
        border: `1px solid ${GH.glassBorder}`,
        borderRadius: 18,
        boxShadow: GH.glassShadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Decorative sparkline SVG */
function MiniSparkline({ data }: { data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 40;
  const pad = 4;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const [lastX, lastY] = points[points.length - 1].split(',');

  return (
    <svg width={w} height={h} className="opacity-60 flex-shrink-0">
      <defs>
        <linearGradient id="ghSparkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="20%" stopColor="#4ade80" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="url(#ghSparkGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="3" fill="#4ade80" opacity="0.8" />
      <circle cx={lastX} cy={lastY} r="6" fill="#4ade80" opacity="0.15" />
    </svg>
  );
}

/** Empty state call-to-action inside the dark hero card */
function GHEmptyStateCTA({ onStartSync }: { onStartSync: () => void }) {
  return (
    <div
      className="rounded-2xl p-6 mt-2"
      style={{
        background: 'rgba(255,245,230,0.04)',
        border: '1px solid rgba(255,245,230,0.06)',
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: GH.goldGrad,
            boxShadow: '0 2px 12px rgba(139,105,20,0.25)',
          }}
        >
          <FileSpreadsheet className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1" style={{ fontSize: 16, color: GH.heroText }}>
            Import your production reports
          </h3>
          <p className="mb-4" style={{ fontSize: 14, color: GH.heroTextMuted }}>
            Upload carrier reports to see your complete book of business.
          </p>
          <button
            onClick={onStartSync}
            className="inline-flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-xl transition-opacity hover:opacity-90"
            style={{ background: GH.goldGrad, boxShadow: '0 2px 8px rgba(139,105,20,0.25)' }}
          >
            <Upload className="w-4 h-4" />
            Start Sync
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Carrier portal tile for the 3x2 grid */
function PortalTile({ portal }: { portal: typeof CARRIER_PORTALS[number] }) {
  return (
    <a
      href={portal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center justify-center gap-1.5 transition-colors"
      style={{
        padding: '10px 6px',
        borderRadius: 14,
        background: GH.tileBg,
        border: `1px solid ${GH.borderLight}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = GH.tileHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = GH.tileBg; }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${portal.color}, ${portal.color}cc)`,
          boxShadow: `0 2px 10px ${portal.color}30`,
        }}
      >
        {portal.icon}
      </div>
      <span className="font-medium" style={{ fontSize: 11, color: GH.textSecondary }}>
        {portal.name}
      </span>
    </a>
  );
}

/** Dock tile for the full-width tools dock */
interface DockTileProps {
  icon: React.ElementType;
  label: string;
  gradient: string;
  shadow: string;
  to?: string;
  href?: string;
  comingSoon?: boolean;
}

function DockTile({ icon: Icon, label, gradient, shadow, to, href, comingSoon }: DockTileProps) {
  const inner = (
    <div
      className={`flex flex-col items-center gap-1.5 transition-colors ${comingSoon ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      style={{
        padding: '10px 6px 8px',
        borderRadius: 14,
        background: GH.tileBg,
        border: `1px solid ${GH.borderLight}`,
        position: 'relative',
      }}
      onMouseEnter={(e) => { if (!comingSoon) e.currentTarget.style.background = GH.tileHover; }}
      onMouseLeave={(e) => { if (!comingSoon) e.currentTarget.style.background = GH.tileBg; }}
    >
      {comingSoon && (
        <Lock className="w-3 h-3 absolute top-1.5 right-1.5" style={{ color: GH.textFaint }} />
      )}
      <div
        className="flex items-center justify-center"
        style={{ width: 34, height: 34, borderRadius: 9, background: gradient, boxShadow: shadow }}
      >
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="font-medium" style={{ fontSize: 10, color: GH.textSecondary }}>
        {label}
      </span>
      {comingSoon && (
        <span className="uppercase tracking-wider" style={{ fontSize: 9, color: GH.textMuted, marginTop: -2 }}>
          Coming Soon
        </span>
      )}
    </div>
  );

  if (comingSoon) {
    return <div className="block">{inner}</div>;
  }
  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="block">{inner}</a>;
  }
  return <Link to={to || '/'} className="block">{inner}</Link>;
}
