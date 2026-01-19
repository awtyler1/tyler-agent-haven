import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Users } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AgentSearch } from '@/components/admin/AgentSearch';
import { AgentStatsLine } from '@/components/admin/AgentStatsLine';
import { TeamRow } from '@/components/admin/TeamRow';
import { AgentRow } from '@/components/admin/AgentRow';

interface ProfileData {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  manager_id: string | null;
  is_active: boolean;
}

interface GA extends ProfileData {
  teamSize: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

export default function TeamDetailPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // MGA/GA profile data
  const [teamLeader, setTeamLeader] = useState<ProfileData | null>(null);

  // Team data
  const [gas, setGas] = useState<GA[]>([]);
  const [directAgents, setDirectAgents] = useState<ProfileData[]>([]);
  const [allTeamMembers, setAllTeamMembers] = useState<ProfileData[]>([]);
  const [totalPeople, setTotalPeople] = useState(0);

  useEffect(() => {
    if (profileId) {
      fetchTeamData();
    }
  }, [profileId]);

  const fetchTeamData = async () => {
    if (!profileId) return;

    setLoading(true);
    try {
      // Step 1: Fetch the team leader's profile
      const { data: leaderProfile, error: leaderError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, manager_id, is_active')
        .eq('id', profileId)
        .single();

      if (leaderError) throw leaderError;
      setTeamLeader(leaderProfile as ProfileData);

      // Step 2: Fetch ALL active profiles to build hierarchy
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, manager_id, is_active')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;

      const profileList = (allProfiles || []) as ProfileData[];

      // Step 3: Build set of profile IDs that have downline
      const profileIdsWithDownline = new Set<string>();
      profileList.forEach((p) => {
        if (p.manager_id) {
          profileIdsWithDownline.add(p.manager_id);
        }
      });

      // Step 4: Get direct reports of this team leader
      const directReports = profileList.filter((p) => p.manager_id === profileId);

      // Step 5: Identify GAs (direct reports who have their own downline)
      const gaProfiles = directReports.filter((p) => profileIdsWithDownline.has(p.id));

      // Step 6: Calculate team size for each GA (recursive)
      const calculateTeamSize = (managerId: string): number => {
        let count = 0;
        const reports = profileList.filter((p) => p.manager_id === managerId);
        count += reports.length;
        reports.forEach((report) => {
          count += calculateTeamSize(report.id);
        });
        return count;
      };

      const gasWithSize: GA[] = gaProfiles.map((p) => ({
        ...p,
        teamSize: calculateTeamSize(p.id),
      }));

      setGas(gasWithSize);

      // Step 7: Direct agents = direct reports who have no downline
      const direct = directReports.filter((p) => !profileIdsWithDownline.has(p.id));
      setDirectAgents(direct);

      // Step 8: Build entire team tree for search (recursive)
      const getAllTeamMembers = (leaderId: string): ProfileData[] => {
        const members: ProfileData[] = [];
        const reports = profileList.filter((p) => p.manager_id === leaderId);
        reports.forEach((report) => {
          members.push(report);
          members.push(...getAllTeamMembers(report.id));
        });
        return members;
      };

      const teamMembers = getAllTeamMembers(profileId);
      setAllTeamMembers(teamMembers);
      setTotalPeople(teamMembers.length);
    } catch (err) {
      console.error('Error fetching team data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search filtering
  const searchLower = searchQuery.toLowerCase().trim();
  const isSearching = searchLower.length > 0;

  // When searching, filter entire team tree
  const searchResults = isSearching
    ? allTeamMembers.filter(
        (p) =>
          p.full_name?.toLowerCase().includes(searchLower) ||
          p.email?.toLowerCase().includes(searchLower)
      )
    : [];

  // Navigation handlers
  const handleGAClick = (gaId: string) => {
    navigate(`/admin/agents/team/${gaId}`);
  };

  const handleAgentClick = (agentId: string) => {
    navigate(`/admin/agents/${agentId}`);
  };

  // Get first name for "Direct to {Name}" section title
  const leaderFirstName = teamLeader?.full_name?.split(' ')[0] || 'Leader';

  // Loading state
  if (loading) {
    return (
      <AdminLayout showBackButton backLabel="Agents" onBack={() => navigate('/admin/agents')}>
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold mb-3" />
            <p className="text-sm text-muted-foreground">Loading team...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Not found state
  if (!teamLeader) {
    return (
      <AdminLayout showBackButton backLabel="Agents" onBack={() => navigate('/admin/agents')}>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">Team not found</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The team you're looking for doesn't exist.
            </p>
            <Link to="/admin/agents">
              <Button variant="outline">Back to Agents</Button>
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout showBackButton backLabel="Agents" onBack={() => navigate('/admin/agents')}>
      {/* Header Card */}
          <div className="bg-white border border-[#E5E2DB] rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gold/10 text-gold font-semibold text-xl flex items-center justify-center">
                {getInitials(teamLeader.full_name || 'U')}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-foreground">
                  {teamLeader.full_name || 'Unnamed'}
                </h1>
                {teamLeader.email && (
                  <p className="text-muted-foreground">{teamLeader.email}</p>
                )}
              </div>
              <Link to={`/admin/agents/${teamLeader.id}`}>
                <Button variant="outline">View Profile</Button>
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <AgentSearch
              totalCount={totalPeople}
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search this team..."
            />
          </div>

          {/* Stats Line */}
          <div className="mb-6">
            <AgentStatsLine
              totalAgents={totalPeople}
              teamCount={gas.length}
              directToTIGCount={directAgents.length}
            />
          </div>

          {/* Content */}
          {isSearching ? (
            // Search Results - flat list
            <div className="bg-white border border-[#E5E2DB] rounded-lg overflow-hidden">
              {searchResults.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No team members found matching "{searchQuery}"
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E2DB]">
                  {searchResults.map((member) => (
                    <AgentRow
                      key={member.id}
                      id={member.id}
                      name={member.full_name || 'Unnamed'}
                      email={member.email || undefined}
                      onClick={() => handleAgentClick(member.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Default view - sections
            <div className="space-y-6">
              {/* GAs Section */}
              {gas.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    GAs
                  </h2>
                  <div className="bg-white border border-[#E5E2DB] rounded-lg overflow-hidden">
                    <div className="divide-y divide-[#E5E2DB]">
                      {gas.map((ga) => (
                        <TeamRow
                          key={ga.id}
                          id={ga.id}
                          name={ga.full_name || 'Unnamed GA'}
                          email={ga.email || undefined}
                          teamSize={ga.teamSize}
                          onClick={() => handleGAClick(ga.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Direct Agents Section */}
              <div>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Direct to {leaderFirstName}
                </h2>
                <div className="bg-white border border-[#E5E2DB] rounded-lg overflow-hidden">
                  {directAgents.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        No direct agents
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E5E2DB]">
                      {directAgents.map((agent) => (
                        <AgentRow
                          key={agent.id}
                          id={agent.id}
                          name={agent.full_name || 'Unnamed Agent'}
                          email={agent.email || undefined}
                          onClick={() => handleAgentClick(agent.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Empty state when no team members */}
              {gas.length === 0 && directAgents.length === 0 && (
                <div className="bg-white border border-[#E5E2DB] rounded-xl p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gold/8 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No team members yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    This team doesn't have any agents assigned.
                  </p>
                </div>
              )}
            </div>
          )}
    </AdminLayout>
  );
}
