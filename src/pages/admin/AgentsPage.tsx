import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  UserPlus,
  Search,
  Loader2,
  ArrowLeft,
  ChevronRight,
  Users,
  LayoutGrid,
  List,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { TeamCards } from '@/components/admin/TeamCards';
import { TeamDrilldown } from '@/components/admin/TeamDrilldown';
import type { Profile } from '@/hooks/useProfile';

interface AgentWithRole extends Profile {
  role?: string;
  is_test?: boolean;
  setup_link_sent_at?: string | null;
  password_created_at?: string | null;
}

type ViewMode = 'teams' | 'myteam' | 'list';

export default function AgentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, isAdmin, isManager, isAgent, loading: authLoading } = useAuth();

  // Determine default view based on role
  const getDefaultViewMode = (): ViewMode => {
    if (isAdmin()) return 'teams';
    if (isManager()) return 'myteam';
    return 'list';
  };

  // View mode: teams (hierarchical cards), myteam (manager's team), or list (flat)
  const [viewMode, setViewMode] = useState<ViewMode | null>(null);

  // Read drill-down state from URL params
  // ?manager=abc-123 → drilled into manager abc-123
  // ?view=direct → viewing "Direct to TIG"
  // no params → top-level team cards
  const managerParam = searchParams.get('manager');
  const viewParam = searchParams.get('view');

  // Derive selectedTeamId from URL params
  // undefined = show team cards, null = Direct to TIG, string = specific manager
  const selectedTeamId: string | null | undefined =
    viewParam === 'direct' ? null :
    managerParam ? managerParam :
    undefined;

  const [selectedTeamName, setSelectedTeamName] = useState<string>('');

  // For list view
  const [agents, setAgents] = useState<AgentWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingLinkForId, setSendingLinkForId] = useState<string | null>(null);

  // Set default view mode once auth is loaded
  useEffect(() => {
    if (!authLoading && viewMode === null) {
      setViewMode(getDefaultViewMode());
    }
  }, [authLoading]);

  // Redirect agents to their profile - they shouldn't access this page
  useEffect(() => {
    if (!authLoading && isAgent() && !isManager() && !isAdmin()) {
      navigate(`/admin/agents/${profile?.id || ''}`);
    }
  }, [authLoading, isAgent, isManager, isAdmin, navigate, profile]);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchAgents();
    }
  }, [viewMode]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      // Exclude test records from agent list
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .or('is_test.is.null,is_test.eq.false')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const roleMap =
        roles?.reduce(
          (acc, r) => {
            acc[r.user_id] = r.role;
            return acc;
          },
          {} as Record<string, string>
        ) || {};

      const agentRoles = ['independent_agent', 'internal_tig_agent'];
      const agentsOnly = (profiles || [])
        .map((p) => ({ ...p, role: roleMap[p.user_id] }))
        .filter((p) => agentRoles.includes(p.role || ''));

      setAgents(agentsOnly as AgentWithRole[]);
    } catch (err) {
      console.error('Error fetching agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      CONTRACTING_REQUIRED: {
        className: 'bg-muted text-muted-foreground',
        label: 'Needs Contracting',
      },
      CONTRACTING_SUBMITTED: {
        className: 'bg-amber-100 text-amber-700',
        label: 'Pending Review',
      },
      APPOINTED: { className: 'bg-green-100 text-green-700', label: 'Appointed' },
      SUSPENDED: { className: 'bg-red-100 text-red-700', label: 'Suspended' },
    };
    const config = variants[status] || {
      className: 'bg-muted text-muted-foreground',
      label: status,
    };
    return (
      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleSendSetupLink = async (e: React.MouseEvent, agent: AgentWithRole) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    if (!agent.user_id) return;

    setSendingLinkForId(agent.user_id);
    try {
      const { data: result, error } = await supabase.functions.invoke('send-setup-link', {
        body: { userId: agent.user_id },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      toast.success(`Setup link sent to ${agent.full_name || 'agent'}`);

      // Update the agent's setup_link_sent_at in local state
      setAgents((prev) =>
        prev.map((a) =>
          a.user_id === agent.user_id
            ? { ...a, setup_link_sent_at: new Date().toISOString() }
            : a
        )
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send setup link';
      toast.error(`Failed to send setup link: ${message}`);
    } finally {
      setSendingLinkForId(null);
    }
  };

  // Fetch team name when URL params change
  useEffect(() => {
    const fetchTeamName = async () => {
      if (selectedTeamId === undefined) {
        setSelectedTeamName('');
      } else if (selectedTeamId === null) {
        setSelectedTeamName('Direct to TIG');
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', selectedTeamId)
          .single();
        setSelectedTeamName(data?.full_name || 'Unknown Team');
      }
    };
    fetchTeamName();
  }, [selectedTeamId]);

  const handleSelectTeam = (managerId: string | null) => {
    // Update URL params instead of state
    if (managerId === null) {
      setSearchParams({ view: 'direct' });
    } else {
      setSearchParams({ manager: managerId });
    }
  };

  const handleBackToTeams = () => {
    // Clear URL params to go back to team cards
    setSearchParams({});
  };

  // Determine what to show
  const showTeamCards = viewMode === 'teams' && selectedTeamId === undefined;
  const showTeamDrilldown = viewMode === 'teams' && selectedTeamId !== undefined;
  const showMyTeam = viewMode === 'myteam';
  const showFlatList = viewMode === 'list';

  // Determine available tabs based on role
  const canViewAllTeams = isAdmin();
  const canViewMyTeam = isManager() && !isAdmin();
  const canAddAgents = isAdmin();

  // Show loading while auth is loading or viewMode hasn't been set
  if (authLoading || viewMode === null) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
        <Navigation />
        <main className="flex-1 pt-28 pb-12 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold mb-3" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />

      <main className="flex-1 pt-28 pb-12">
        <div className="container-narrow px-6 md:px-12 lg:px-20">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="hover:bg-gold/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="heading-section">
                {canViewMyTeam ? 'My Team' : 'Agents'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {canViewMyTeam
                  ? 'View and manage agents in your downline'
                  : 'Manage all agents in the system'}
              </p>
            </div>
            {canAddAgents && (
              <Link to="/admin/agents/new">
                <Button className="bg-gold hover:bg-gold/90 text-white">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Agent
                </Button>
              </Link>
            )}
          </div>

          {/* View Mode Toggle + Breadcrumbs */}
          <div className="flex items-center justify-between mb-6">
            {/* Breadcrumbs (only in teams view when drilled in) */}
            <div className="flex items-center gap-2 text-sm">
              {showTeamDrilldown ? (
                <>
                  <button
                    onClick={handleBackToTeams}
                    className="text-muted-foreground hover:text-gold transition-colors"
                  >
                    All Teams
                  </button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{selectedTeamName}</span>
                </>
              ) : showMyTeam ? (
                <span className="text-muted-foreground">
                  Your direct reports and downline
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {viewMode === 'teams' ? 'View by team hierarchy' : 'View all agents'}
                </span>
              )}
            </div>

            {/* View Mode Toggle - Role-based tabs */}
            <div className="flex rounded-lg border border-[#E5E2DB] overflow-hidden bg-white shadow-sm">
              {/* All Teams tab - Admin only */}
              {canViewAllTeams && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-none px-4 gap-2 ${
                    viewMode === 'teams'
                      ? 'bg-gold/10 text-gold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => {
                    setViewMode('teams');
                    setSearchParams({});
                  }}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">All Teams</span>
                </Button>
              )}

              {/* My Team tab - Manager only (non-admin) */}
              {canViewMyTeam && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-none px-4 gap-2 ${
                    viewMode === 'myteam'
                      ? 'bg-gold/10 text-gold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setViewMode('myteam')}
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">My Team</span>
                </Button>
              )}

              {/* All Agents tab - Always visible */}
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-none px-4 gap-2 ${canViewAllTeams || canViewMyTeam ? 'border-l border-[#E5E2DB]' : ''} ${
                  viewMode === 'list'
                    ? 'bg-gold/10 text-gold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">All Agents</span>
              </Button>
            </div>
          </div>

          {/* Content */}
          {showTeamCards && <TeamCards onSelectTeam={handleSelectTeam} />}

          {showTeamDrilldown && (
            <TeamDrilldown
              managerId={selectedTeamId}
              onBack={handleBackToTeams}
            />
          )}

          {showMyTeam && profile?.id && (
            <TeamDrilldown
              managerId={profile.id}
              onBack={() => {}} // No back button needed for own team
              hideBackButton
            />
          )}

          {showFlatList && (
            <>
              {/* Search */}
              <div className="bg-white border border-[#E5E2DB] rounded-lg p-3 mb-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-0 focus-visible:ring-0 bg-transparent"
                  />
                </div>
              </div>

              {/* Agents List */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-gold mb-3" />
                  <p className="text-sm text-muted-foreground">Loading agents...</p>
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="bg-white border border-[#E5E2DB] rounded-xl p-12 text-center shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]">
                  <div className="w-16 h-16 rounded-full bg-gold/8 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No agents found
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'Add your first agent to get started'}
                  </p>
                  {!searchQuery && (
                    <Link to="/admin/agents/new">
                      <Button className="bg-gold hover:bg-gold/90 text-white">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Agent
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] hover:border-gold/30 hover:-translate-y-0.5 transition-all duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/admin/agents/${agent.id}`}
                          className="flex-1 group"
                        >
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground group-hover:text-gold transition-colors">
                              {agent.full_name || 'Unnamed Agent'}
                            </h3>
                            {agent.is_test && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                                TEST
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{agent.email}</p>
                        </Link>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(agent.onboarding_status)}
                          {isAdmin() && agent.user_id && !agent.password_created_at && (
                            <button
                              onClick={(e) => handleSendSetupLink(e, agent)}
                              disabled={sendingLinkForId === agent.user_id}
                              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-gold transition-colors"
                              title={agent.setup_link_sent_at ? 'Resend Setup Link' : 'Send Setup Link'}
                            >
                              {sendingLinkForId === agent.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <Link to={`/admin/agents/${agent.id}`}>
                            <ChevronRight className="h-5 w-5 text-muted-foreground/40 hover:text-gold hover:translate-x-0.5 transition-all" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
