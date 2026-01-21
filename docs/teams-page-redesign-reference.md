# Teams Page Redesign Reference

## Answers to Questions

### Route for `/admin/agents/team/:id`
Handled in `src/App.tsx` at line 193-199:
```tsx
<Route
  path="/admin/agents/team/:profileId"
  element={
    <ProtectedRoute requireAdmin>
      <TeamDetailPage />
    </ProtectedRoute>
  }
/>
```

### Shared Components between TeamsTab and AllAgentsTab
**TeamsTab** does NOT share components with AllAgentsTab. It's self-contained.

**TeamDetailPage** uses these shared components:
- `AgentSearch` - search input component
- `AgentStatsLine` - stats display ("X agents · Y teams · Z direct to TIG")
- `TeamRow` - row component for displaying GAs with team size
- `AgentRow` - row component for displaying individual agents

**AllAgentsTab** is completely self-contained with inline table rendering - no shared row components.

---

## File 1: TeamsTab.tsx
**Path:** `src/components/admin/TeamsTab.tsx`

```tsx
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ChevronRight, Building2 } from 'lucide-react';

interface ProfileData {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  manager_id: string | null;
}

interface TeamData {
  id: string;
  name: string;
  email: string | null;
  agentCount: number;
}

interface TeamsTabProps {
  onSelectTeam: (teamId: string | null) => void;
}

// Generate a consistent color based on the team name
function getTeamColor(name: string): { bg: string; text: string; hoverBorder: string; hoverBg: string } {
  const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-600', hoverBorder: 'hover:border-blue-300', hoverBg: 'hover:bg-blue-50/30' },
    { bg: 'bg-green-100', text: 'text-green-600', hoverBorder: 'hover:border-green-300', hoverBg: 'hover:bg-green-50/30' },
    { bg: 'bg-purple-100', text: 'text-purple-600', hoverBorder: 'hover:border-purple-300', hoverBg: 'hover:bg-purple-50/30' },
    { bg: 'bg-amber-100', text: 'text-amber-600', hoverBorder: 'hover:border-amber-300', hoverBg: 'hover:bg-amber-50/30' },
    { bg: 'bg-rose-100', text: 'text-rose-600', hoverBorder: 'hover:border-rose-300', hoverBg: 'hover:bg-rose-50/30' },
    { bg: 'bg-cyan-100', text: 'text-cyan-600', hoverBorder: 'hover:border-cyan-300', hoverBg: 'hover:bg-cyan-50/30' },
    { bg: 'bg-indigo-100', text: 'text-indigo-600', hoverBorder: 'hover:border-indigo-300', hoverBg: 'hover:bg-indigo-50/30' },
    { bg: 'bg-teal-100', text: 'text-teal-600', hoverBorder: 'hover:border-teal-300', hoverBg: 'hover:bg-teal-50/30' },
  ];

  // Simple hash based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

export function TeamsTab({ onSelectTeam }: TeamsTabProps) {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [directToTIGCount, setDirectToTIGCount] = useState(0);
  const [totalAgents, setTotalAgents] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      // First, fetch admin user_ids to exclude from the list
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['super_admin', 'admin']);

      const adminUserIds = new Set((adminRoles || []).map((r) => r.user_id));

      // Fetch all active profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, manager_id')
        .eq('is_active', true);

      if (error) {
        console.error('Query error:', error);
        throw error;
      }

      // Filter out admin users
      const profiles = ((data || []) as ProfileData[]).filter(
        (p) => !p.user_id || !adminUserIds.has(p.user_id)
      );
      setTotalAgents(profiles.length);

      // Build set of profile IDs that have downline (someone reports to them)
      const profileIdsWithDownline = new Set<string>();
      profiles.forEach((p) => {
        if (p.manager_id) {
          profileIdsWithDownline.add(p.manager_id);
        }
      });

      // Identify MGAs: profiles with no manager_id AND has downline
      const mgaProfiles = profiles.filter(
        (p) => p.manager_id === null && profileIdsWithDownline.has(p.id)
      );

      // Calculate team size for each MGA (recursive count of all downline)
      const calculateTeamSize = (managerId: string): number => {
        let count = 0;
        const directReports = profiles.filter((p) => p.manager_id === managerId);
        count += directReports.length;
        directReports.forEach((report) => {
          count += calculateTeamSize(report.id);
        });
        return count;
      };

      const teamList: TeamData[] = mgaProfiles
        .map((p) => ({
          id: p.id,
          name: p.full_name || 'Unnamed Team',
          email: p.email,
          agentCount: calculateTeamSize(p.id),
        }))
        .sort((a, b) => b.agentCount - a.agentCount);

      setTeams(teamList);

      // Count "Direct to TIG" agents: no manager_id AND no downline
      const directCount = profiles.filter(
        (p) => p.manager_id === null && !profileIdsWithDownline.has(p.id)
      ).length;
      setDirectToTIGCount(directCount);
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter teams by search
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const query = searchQuery.toLowerCase();
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.email?.toLowerCase().includes(query)
    );
  }, [teams, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 border-gray-300"
        />
      </div>

      {/* Stats */}
      <p className="text-sm text-gray-500">
        {totalAgents} agents across {teams.length} teams
      </p>

      {/* Team List */}
      <div className="space-y-2">
        {filteredTeams.length === 0 && searchQuery.trim() ? (
          <div className="text-center py-8 text-gray-500">
            No teams found matching "{searchQuery}"
          </div>
        ) : filteredTeams.length === 0 && !searchQuery.trim() ? (
          <div className="text-center py-8 text-gray-500">
            No teams found
          </div>
        ) : (
          filteredTeams.map((team) => {
            const color = getTeamColor(team.name);
            return (
              <div
                key={team.id}
                onClick={() => onSelectTeam(team.id)}
                className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer transition-all group ${color.hoverBorder} ${color.hoverBg}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${color.bg} rounded-full flex items-center justify-center ${color.text} font-semibold`}>
                    {getInitials(team.name)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{team.name}</p>
                    <p className="text-sm text-gray-500">{team.email || 'No email'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700 group-hover:bg-opacity-80">
                    {team.agentCount} agents
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
                </div>
              </div>
            );
          })
        )}

        {/* Direct to TIG */}
        {(!searchQuery.trim() || 'direct to tig'.includes(searchQuery.toLowerCase())) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div
              onClick={() => onSelectTeam(null)}
              className="flex items-center justify-between p-4 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Direct to TIG</p>
                  <p className="text-sm text-gray-500">No manager assigned</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                  {directToTIGCount} agents
                </span>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## File 2: TeamDetailPage.tsx
**Path:** `src/pages/admin/TeamDetailPage.tsx`

```tsx
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
```

---

## File 3: TeamRow.tsx
**Path:** `src/components/admin/TeamRow.tsx`

```tsx
import { ChevronRight } from 'lucide-react';

interface TeamRowProps {
  id: string;
  name: string;
  email?: string;
  teamSize: number;
  onClick: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

export function TeamRow({ id, name, email, teamSize, onClick }: TeamRowProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-[#E5E2DB]"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gold/10 text-gold font-medium flex items-center justify-center">
          {getInitials(name)}
        </div>
        <div>
          <p className="font-medium text-foreground">{name}</p>
          {email && <p className="text-sm text-muted-foreground">{email}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{teamSize} people</span>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
}
```

---

## File 4: AgentRow.tsx
**Path:** `src/components/admin/AgentRow.tsx`

```tsx
import { ChevronRight } from 'lucide-react';

interface AgentRowProps {
  id: string;
  name: string;
  email?: string;
  onClick: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

export function AgentRow({ id, name, email, onClick }: AgentRowProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-[#E5E2DB]"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-medium flex items-center justify-center">
          {getInitials(name)}
        </div>
        <div>
          <p className="font-medium text-foreground">{name}</p>
          {email && <p className="text-sm text-muted-foreground">{email}</p>}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}
```

---

## File 5: AgentSearch.tsx
**Path:** `src/components/admin/AgentSearch.tsx`

```tsx
import { Search } from 'lucide-react';

interface AgentSearchProps {
  totalCount: number;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AgentSearch({
  totalCount,
  value,
  onChange,
  placeholder,
}: AgentSearchProps) {
  const defaultPlaceholder = `Search ${totalCount} agents...`;

  return (
    <div className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? defaultPlaceholder}
        className="w-full pl-12 pr-4 py-3 text-base bg-white border border-[#E5E2DB] rounded-lg focus:outline-none focus:border-gold focus:shadow-sm transition-colors"
      />
    </div>
  );
}
```

---

## File 6: AgentStatsLine.tsx
**Path:** `src/components/admin/AgentStatsLine.tsx`

```tsx
interface AgentStatsLineProps {
  totalAgents: number;
  teamCount: number;
  directToTIGCount: number;
}

export function AgentStatsLine({
  totalAgents,
  teamCount,
  directToTIGCount,
}: AgentStatsLineProps) {
  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-medium">{totalAgents}</span> agents ·
      <span className="font-medium">{teamCount}</span> teams ·
      <span className="font-medium">{directToTIGCount}</span> direct to TIG
    </p>
  );
}
```

---

## Summary of Component Architecture

```
TeamsTab.tsx (self-contained)
├── Uses: Input, Search, Loader2, ChevronRight, Building2
├── No shared admin components
└── Calls onSelectTeam callback → navigates to TeamDetailPage

TeamDetailPage.tsx
├── Uses shared: AgentSearch, AgentStatsLine, TeamRow, AgentRow
├── Uses: AdminLayout, Button, Loader2, Users
└── Two sections: GAs (with TeamRow) and Direct Agents (with AgentRow)

AllAgentsTab.tsx (self-contained - 772 lines)
├── Inline table rendering with checkbox selection
├── Quick View panel
├── Pagination
└── No shared row components with TeamsTab
```

## Notes for Redesign
- `TeamsTab` uses hardcoded colors (gray-*, blue-*, etc.) - should convert to design tokens
- `AgentSearch` uses hardcoded `text-gray-400` and `border-[#E5E2DB]`
- `TeamRow` uses `border-[#E5E2DB]` instead of `border-border`
- `AgentRow` uses `bg-blue-50 text-blue-600` for avatar
- `TeamDetailPage` uses `border-[#E5E2DB]` extensively
