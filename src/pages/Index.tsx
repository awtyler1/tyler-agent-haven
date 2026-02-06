import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  FileText,
  Award,
  TrendingUp,
  Zap,
  Target,
  Flame,
  ChevronRight,
  Loader2,
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Calendar,
  RefreshCw,
  AlertCircle,
  Search,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { SyncStatusPill } from '@/components/dashboard/SyncStatusPill';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { PageLoader } from '@/components/ui/PageLoader';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

// ============================================================
// THE ONE - Beacon Dashboard
// Handles: Empty State, Stale State, Normal State
// ============================================================

export default function Index() {
  const { data, isLoading, error } = useDashboardData();
  const navigate = useNavigate();

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-2">Unable to load dashboard</p>
          <p className="text-sm text-slate-400">{error?.message || 'Please try again'}</p>
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

  const getGreeting = () => {
    if (isEmpty) return `Let's build your book, ${data.firstName}.`;
    if (data.growthStreak >= 3) return `You're on fire, ${data.firstName}.`;
    if (data.netChange > 0) return `Momentum building, ${data.firstName}.`;
    return `Welcome back, ${data.firstName}.`;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200/80 flex items-center justify-center">
              <span className="font-bold text-blue-600 text-lg">T</span>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">TIG PLATFORM</p>
              <p className="font-semibold text-slate-800 -mt-0.5">Agent Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Stale State Banner */}
        {isStale && !isEmpty && (
          <div className="mb-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Time to sync your {currentMonth.split(' ')[0]} reports</p>
                <p className="text-sm text-slate-500">
                  {data.lastSyncAt
                    ? `Last synced ${new Date(data.lastSyncAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : 'No sync yet'
                  } • Recommended by the 7th each month
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/sync')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-colors flex-shrink-0"
            >
              <Upload className="w-4 h-4" />
              Sync Now
            </button>
          </div>
        )}

        {/* Greeting */}
        <p className="text-slate-400 text-sm mb-1">{currentMonth}</p>
        <h1 className="text-2xl font-semibold text-slate-800 mb-5">
          {getGreeting()}
        </h1>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Main Card - The Beacon */}
          <div className="w-full lg:flex-[2] bg-white rounded-[2rem] p-8 shadow-2xl shadow-slate-200/60 border border-slate-100 relative overflow-hidden">
            {/* Refined glow */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: '-5%',
                left: '-5%',
                width: '65%',
                height: '65%',
                background: `radial-gradient(ellipse at center, rgba(59, 130, 246, ${isEmpty ? '0.04' : '0.08'}) 0%, rgba(99, 102, 241, ${isEmpty ? '0.02' : '0.04'}) 45%, transparent 70%)`,
              }}
            />

            <div className="relative">
              {/* Badges - Only show when not empty */}
              {!isEmpty && (
                <div className="flex items-center gap-3 mb-3">
                  {(data.newThisMonth > 0 || data.termedThisMonth > 0) && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-white shadow-lg ${
                      data.netChange > 0 ? 'bg-emerald-500 shadow-emerald-500/25' :
                      data.netChange < 0 ? 'bg-amber-500 shadow-amber-500/25' :
                      'bg-slate-500 shadow-slate-500/25'
                    }`}>
                      <TrendingUp className={`w-4 h-4 ${data.netChange < 0 ? 'rotate-180' : ''}`} />
                      <span className="font-bold">
                        net {data.netChange > 0 ? '+' : ''}{data.netChange} this month
                      </span>
                      <span className="text-sm opacity-75">
                        (+{data.newThisMonth}{data.termedThisMonth > 0 ? ` / -${data.termedThisMonth}` : ''})
                      </span>
                    </div>
                  )}
                  {data.growthStreak >= 2 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-orange-50 border border-orange-100">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold text-orange-700">{data.growthStreak} mo streak</span>
                    </div>
                  )}
                </div>
              )}

              {/* THE NUMBER */}
              <div className="mb-6">
                <span
                  className={`text-[5rem] sm:text-[7rem] lg:text-[10rem] font-bold tracking-tighter leading-[0.75] block ${isEmpty ? 'text-slate-200' : 'text-slate-900'}`}
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  {data.totalClients}
                </span>
                <p className="text-xl text-slate-400 mt-3">
                  {data.totalClients === 1 ? 'client' : 'clients'} in your book
                </p>
                {isStale && !isEmpty && (
                  <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Data may be outdated • Sync to update
                  </p>
                )}
              </div>

              {/* Empty State CTA */}
              {isEmpty ? (
                <EmptyStateCTA onStartSync={() => navigate('/sync')} />
              ) : (
                <>
                  {/* Carriers row */}
                  {data.carriers.length > 0 && (
                    <div className={`flex items-center gap-3 mb-5 pb-5 border-b border-slate-100 flex-wrap ${isStale ? 'opacity-75' : ''}`}>
                      {data.carriers.map((carrier) => (
                        <div
                          key={carrier.id}
                          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100"
                        >
                          <div
                            className={`w-3 h-3 rounded-full ${carrier.color}`}
                          />
                          <span className="text-sm font-medium text-slate-600">{carrier.name}</span>
                          <span className="text-lg font-bold text-slate-800">{carrier.count}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Goal progress */}
                  <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-5 border border-violet-100/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Next milestone</p>
                          <p className="text-2xl font-bold text-slate-800">{data.nextMilestone} clients</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-4xl font-bold text-violet-600">{toGoal > 0 ? toGoal : 0}</p>
                        <p className="text-sm text-slate-500">{toGoal > 0 ? 'to go' : 'reached!'}</p>
                      </div>
                    </div>
                    <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions Panel */}
          <div className="w-full lg:flex-[1] bg-slate-900 rounded-[2rem] p-6 flex flex-col shadow-2xl shadow-slate-400/20">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-5">Quick Actions</p>

            <div className="space-y-3 flex-1">
              {/* Sync Button - Promoted when stale or empty */}
              {(isStale || isEmpty) && (
                <ActionButton
                  icon={RefreshCw}
                  label={isEmpty ? "Sync Book" : "Sync Now"}
                  desc={isEmpty ? "Import your data" : "Update your data"}
                  color="from-amber-500 to-orange-500"
                  to="/sync"
                  highlighted
                />
              )}

              <CarrierResourcesHoverButton />
              <ActionButton
                icon={Search}
                label="Plan Finder"
                desc="Search Medicare plans"
                color="from-emerald-500 to-teal-600"
                to="/plan-finder"
              />
              <ActionButton
                icon={FileText}
                label="Forms Library"
                desc="SOA & enrollment"
                color="from-slate-500 to-slate-600"
                to="/forms-library"
              />
              {!isStale && !isEmpty && (
                <HoverActionButton
                  icon={Zap}
                  label="Quick Quote"
                  desc="SunFire & C4M"
                  color="from-orange-500 to-orange-600"
                  links={[
                    { name: 'SunFire', url: 'https://www.sunfirematrix.com/app/agent/pfs' },
                    { name: 'Connecture (C4M)', url: 'https://pinnacle7.destinationrx.com/PC/Agent/Account/Login' },
                  ]}
                />
              )}
              <ActionButton
                icon={Award}
                label="Certifications"
                desc="Ready to sell"
                color="from-emerald-500 to-emerald-600"
                to="/contracting-hub"
              />
              <ActionButton
                icon={GraduationCap}
                label="Training Library"
                desc="Videos & tutorials"
                color="from-purple-500 to-violet-600"
                to="/training"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function EmptyStateCTA({ onStartSync }: { onStartSync: () => void }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100/50">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
          <FileSpreadsheet className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-800 mb-1">Import your production reports</h3>
          <p className="text-slate-500 mb-4">
            Upload carrier reports to see your complete book of business. We'll organize everything for you.
          </p>
          <button
            onClick={onStartSync}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Start Sync
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* What you'll see */}
      <div className="mt-6 pt-5 border-t border-blue-100">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">After syncing, you'll see</p>
        <div className="flex gap-4 flex-wrap">
          {[
            { icon: '📊', label: 'Total clients' },
            { icon: '🏢', label: 'By carrier' },
            { icon: '📈', label: 'Growth trends' },
            { icon: '🎯', label: 'Milestones' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-slate-600">
              <span>{icon}</span>
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
  to: string;
  highlighted?: boolean;
}

function ActionButton({ icon: Icon, label, desc, color, to, highlighted }: ActionButtonProps) {
  return (
    <Link
      to={to}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left group border ${
        highlighted
          ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30'
          : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.05] hover:border-white/[0.1]'
      }`}
    >
      <div className={`w-11 h-11 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className={`text-xs ${highlighted ? 'text-amber-300' : 'text-slate-500'}`}>{desc}</p>
      </div>
      <ChevronRight className={`w-5 h-5 ${highlighted ? 'text-amber-400' : 'text-slate-600'} group-hover:translate-x-0.5 transition-all`} />
    </Link>
  );
}

interface HoverActionButtonProps {
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
  links: { name: string; url: string; icon?: React.ElementType }[];
}

function HoverActionButton({ icon: Icon, label, desc, color, links }: HoverActionButtonProps) {
  return (
    <HoverCard openDelay={0} closeDelay={150}>
      <HoverCardTrigger asChild>
        <button
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.1] transition-all duration-200 text-left group"
        >
          <div className={`w-11 h-11 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="text-xs text-slate-500">{desc}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors duration-200" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="left"
        sideOffset={12}
        collisionPadding={16}
        className="w-auto p-0 bg-white rounded-xl shadow-2xl shadow-slate-900/10 border border-slate-200/60"
      >
        <div className="p-2 min-w-[200px]">
          {links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-all duration-150 group/link"
            >
              {link.icon && <link.icon className="w-4 h-4 text-slate-400 group-hover/link:text-slate-600" />}
              <span className="text-sm font-medium text-slate-700 group-hover/link:text-slate-900">{link.name}</span>
              <ExternalLink className="w-3 h-3 text-slate-300 group-hover/link:text-slate-400 ml-auto" />
            </a>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// Carrier portal links with brand colors
const CARRIER_PORTALS = [
  { name: 'Aetna', url: 'https://www.aetna.com/producer_public/login.fcc', color: '#7B2D8E' },
  { name: 'Anthem', url: 'https://brokerportal.anthem.com/apps/ptb/login', color: '#0072CE' },
  { name: 'Devoted', url: 'https://agent.devoted.com/', color: '#F97316' },
  { name: 'Humana', url: 'https://account.humana.com/', color: '#4B9B4B' },
  { name: 'UHC', url: 'https://www.uhcagent.com', color: '#002677' },
  { name: 'Wellcare', url: 'https://www.wellcare.com/en/broker-resources/broker-resources', color: '#00A79D' },
];

function CarrierResourcesHoverButton() {
  const navigate = useNavigate();

  return (
    <HoverCard openDelay={0} closeDelay={150}>
      <HoverCardTrigger asChild>
        <button
          onClick={() => navigate('/carrier-resources')}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.1] transition-all duration-200 text-left group"
        >
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Carrier Resources</p>
            <p className="text-xs text-slate-500">Contacts & portals</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors duration-200" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="left"
        sideOffset={12}
        collisionPadding={16}
        className="w-auto p-0 bg-white rounded-xl shadow-2xl shadow-slate-900/10 border border-slate-200/60 overflow-hidden"
      >
        <div className="min-w-[220px]">
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Portal Quick Links</p>
          </div>

          {/* Portal Links */}
          <div className="p-2">
            {CARRIER_PORTALS.map((portal) => (
              <a
                key={portal.name}
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-all duration-150 group/link"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: portal.color }}
                />
                <span className="text-sm font-medium text-slate-700 group-hover/link:text-slate-900">{portal.name}</span>
                <ExternalLink className="w-3 h-3 text-slate-300 group-hover/link:text-slate-400 ml-auto" />
              </a>
            ))}
          </div>

          {/* Footer */}
          <Link
            to="/carrier-resources"
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 border-t border-slate-100 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            View all resources
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
