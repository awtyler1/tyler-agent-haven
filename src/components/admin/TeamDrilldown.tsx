import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  Users,
  Building2,
  ChevronDown,
  ChevronRight,
  User,
  Mail,
  Shield,
} from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  manager_id: string | null;
  is_active: boolean;
  onboarding_status: string;
  is_test?: boolean;
}

interface ProfileWithRole extends Profile {
  role: string;
}

interface GAWithAgents {
  ga: ProfileWithRole;
  agents: ProfileWithRole[];
  isExpanded: boolean;
}

interface TeamDrilldownProps {
  managerId: string | null; // null = "Direct to TIG"
  onBack: () => void;
  hideBackButton?: boolean;
}

export function TeamDrilldown({ managerId, onBack, hideBackButton = false }: TeamDrilldownProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [managerProfile, setManagerProfile] = useState<ProfileWithRole | null>(null);
  const [directAgents, setDirectAgents] = useState<ProfileWithRole[]>([]);
  const [gasWithAgents, setGasWithAgents] = useState<GAWithAgents[]>([]);
  const [expandedGAs, setExpandedGAs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTeamData();
  }, [managerId]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      // Step 1: Get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const roleMap: Record<string, string> = {};
      rolesData?.forEach((r) => {
        roleMap[r.user_id] = r.role;
      });

      // Step 2: Get all active profiles
      // TODO: Remove test data inclusion before production
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, manager_id, is_active, onboarding_status, is_test')
        .eq('is_active', true);

      if (profilesError) throw profilesError;

      const profiles: ProfileWithRole[] = (profilesData || []).map((p) => ({
        ...p,
        role: roleMap[p.user_id] || 'unknown',
      }));

      if (managerId === null) {
        // "Direct to TIG" view - show agents with no manager
        // TODO: Remove test data logic before production
        const agentRoles = ['independent_agent', 'internal_tig_agent'];
        const directToTig = profiles.filter(
          (p) => p.manager_id === null && (
            agentRoles.includes(p.role) ||
            (p.is_test === true && p.full_name?.includes('Agent'))
          )
        );
        setDirectAgents(directToTig);
        setGasWithAgents([]);
        setManagerProfile(null);
      } else {
        // MGA view - show hierarchy under this manager
        const manager = profiles.find((p) => p.id === managerId);
        setManagerProfile(manager || null);

        // Get direct reports
        const directReports = profiles.filter((p) => p.manager_id === managerId);

        // Separate GAs from regular agents
        // TODO: Remove test data logic before production
        const gas = directReports.filter(
          (p) => p.role === 'manager' ||
                 (p.is_test === true && p.full_name?.startsWith('Test GA'))
        );
        const agents = directReports.filter(
          (p) => (p.role !== 'manager' && !(p.is_test === true && p.full_name?.startsWith('Test GA'))) ||
                 (p.is_test === true && p.full_name?.includes('Agent') && !p.full_name?.startsWith('Test GA'))
        );

        setDirectAgents(agents);

        // For each GA, get their agents
        const gasData: GAWithAgents[] = gas.map((ga) => {
          const gaAgents = profiles.filter((p) => p.manager_id === ga.id);
          return {
            ga,
            agents: gaAgents,
            isExpanded: false,
          };
        });

        setGasWithAgents(gasData);
      }
    } catch (err) {
      console.error('Error fetching team data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleGA = (gaId: string) => {
    setExpandedGAs((prev) => {
      const next = new Set(prev);
      if (next.has(gaId)) {
        next.delete(gaId);
      } else {
        next.add(gaId);
      }
      return next;
    });
  };

  const handleAgentClick = (profileId: string) => {
    // Pass location state so the agent profile page can navigate back to this view
    navigate(`/admin/agents/${profileId}`, {
      state: {
        from: '/admin/agents',
        managerId: managerId, // null for Direct to TIG, or the MGA's profile id
      }
    });
  };

  // Calculate totals
  const totalAgents =
    directAgents.length +
    gasWithAgents.reduce((sum, ga) => sum + ga.agents.length, 0);
  const gaCount = gasWithAgents.length;

  // Team name
  const teamName =
    managerId === null
      ? 'Direct to TIG'
      : managerProfile?.full_name || 'Loading...';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gold mb-3" />
        <p className="text-sm text-muted-foreground">Loading team details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {!hideBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-gold/10 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                managerId === null ? 'bg-blue-50' : 'bg-gold/8'
              }`}
            >
              {managerId === null ? (
                <Building2 className="w-5 h-5 text-blue-600" />
              ) : (
                <Users className="w-5 h-5 text-gold" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{teamName}</h2>
              {managerProfile?.email && (
                <p className="text-sm text-muted-foreground">{managerProfile.email}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium text-foreground">{totalAgents}</span>{' '}
                <span className="text-muted-foreground">agents</span>
              </span>
            </div>
            {managerId !== null && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-medium text-foreground">{gaCount}</span>{' '}
                  <span className="text-muted-foreground">GAs</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {totalAgents === 0 && gaCount === 0 ? (
        <div className="bg-white border border-[#E5E2DB] rounded-xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No agents found</h3>
          <p className="text-sm text-muted-foreground">
            {managerId === null
              ? 'No agents report directly to TIG'
              : 'This manager has no agents in their downline'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Direct Agents Section */}
          {directAgents.length > 0 && (
            <div className="bg-white border border-[#E5E2DB] rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-muted/30 border-b border-[#E5E2DB]">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">
                    {managerId === null ? 'Agents' : 'Direct Agents'}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold font-medium">
                    {directAgents.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-[#E5E2DB]">
                {directAgents.map((agent) => (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    onClick={() => handleAgentClick(agent.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* GA Sections */}
          {gasWithAgents.map((gaData) => (
            <div
              key={gaData.ga.id}
              className="bg-white border border-[#E5E2DB] rounded-xl shadow-sm overflow-hidden"
            >
              {/* GA Header - Expandable */}
              <button
                onClick={() => toggleGA(gaData.ga.id)}
                className="w-full px-4 py-3 bg-amber-50/50 border-b border-[#E5E2DB] hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedGAs.has(gaData.ga.id) ? (
                      <ChevronDown className="w-4 h-4 text-amber-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-amber-600" />
                    )}
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-foreground">
                        {gaData.ga.full_name || 'Unnamed GA'}
                      </h3>
                      {gaData.ga.email && (
                        <p className="text-xs text-muted-foreground">{gaData.ga.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                      GA
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                      {gaData.agents.length} agents
                    </span>
                  </div>
                </div>
              </button>

              {/* GA's Agents - Collapsible */}
              {expandedGAs.has(gaData.ga.id) && (
                <div className="divide-y divide-[#E5E2DB]">
                  {gaData.agents.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No agents under this GA
                    </div>
                  ) : (
                    gaData.agents.map((agent) => (
                      <AgentRow
                        key={agent.id}
                        agent={agent}
                        onClick={() => handleAgentClick(agent.id)}
                        indented
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Agent Row Component
function AgentRow({
  agent,
  onClick,
  indented = false,
}: {
  agent: ProfileWithRole;
  onClick: () => void;
  indented?: boolean;
}) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      CONTRACTING_REQUIRED: {
        className: 'bg-muted text-muted-foreground',
        label: 'Needs Contracting',
      },
      CONTRACTING_SUBMITTED: {
        className: 'bg-amber-100 text-amber-700',
        label: 'Pending',
      },
      APPOINTED: {
        className: 'bg-green-100 text-green-700',
        label: 'Appointed',
      },
      SUSPENDED: {
        className: 'bg-red-100 text-red-700',
        label: 'Suspended',
      },
    };
    const config = variants[status] || {
      className: 'bg-muted text-muted-foreground',
      label: status,
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const labels: Record<string, string> = {
      independent_agent: 'Independent',
      internal_tig_agent: 'Internal',
      manager: 'Manager',
    };
    return labels[role] || role;
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors group ${
        indented ? 'pl-12' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h4 className="font-medium text-foreground truncate group-hover:text-gold transition-colors">
              {agent.full_name || 'Unnamed Agent'}
            </h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{agent.email || 'No email'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {getRoleBadge(agent.role)}
          </span>
          {getStatusBadge(agent.onboarding_status)}
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
        </div>
      </div>
    </button>
  );
}
