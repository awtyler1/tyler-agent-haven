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
