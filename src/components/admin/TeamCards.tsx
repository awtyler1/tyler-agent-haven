import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Loader2,
  Users,
  Building2,
  LayoutGrid,
  List,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

interface TeamData {
  id: string | null; // null for "Direct to TIG"
  name: string;
  email: string | null;
  totalAgents: number;
  gaCount: number;
  isDirectToTIG?: boolean;
}

interface TeamCardsProps {
  onSelectTeam: (managerId: string | null) => void; // null = "Direct to TIG"
}

type SortOption = 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc';
type ViewMode = 'cards' | 'list';

export function TeamCards({ onSelectTeam }: TeamCardsProps) {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const handleViewProfile = (profileId: string) => {
    navigate(`/admin/agents/${profileId}`);
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      // Step 1: Get all active profiles
      // TODO: Remove test data inclusion before production
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, manager_id, is_active, is_test')
        .eq('is_active', true);

      if (profilesError) throw profilesError;

      const profiles = profilesData || [];

      // Step 2: Build a Set of all manager_ids that exist (profiles that have downline)
      const managerIdsWithDownline = new Set<string>();
      profiles.forEach((p) => {
        if (p.manager_id) {
          managerIdsWithDownline.add(p.manager_id);
        }
      });

      // Step 3: Identify MGAs by hierarchy position, not role
      // MGA = manager_id is null (reports to TIG) AND has downline (someone reports to them)
      // TODO: Remove test data logic before production
      const mgas = profiles.filter(
        (p) => (p.manager_id === null && managerIdsWithDownline.has(p.id)) ||
               (p.is_test === true && p.manager_id === null && p.full_name?.startsWith('Test MGA'))
      );

      // Step 4: Identify GAs by hierarchy position
      // GA = has a manager (manager_id != null) AND has downline (someone reports to them)
      // TODO: Remove test data logic before production
      const gas = profiles.filter(
        (p) => (p.manager_id !== null && managerIdsWithDownline.has(p.id)) ||
               (p.is_test === true && p.manager_id !== null && p.full_name?.startsWith('Test GA'))
      );

      // Step 5: Identify "Direct to TIG" agents
      // Direct to TIG = manager_id is null AND no downline (no one reports to them)
      // TODO: Remove test data logic before production
      const directToTigAgents = profiles.filter(
        (p) => (p.manager_id === null && !managerIdsWithDownline.has(p.id)) ||
               (p.is_test === true && p.manager_id === null && p.full_name?.includes('Agent') && !p.full_name?.startsWith('Test MGA'))
      );

      // Step 6: Build downline counts for each MGA using recursive traversal
      const teamDataList: TeamData[] = [];

      for (const mga of mgas) {
        const downline = getFullDownline(mga.id, profiles);
        // Count GAs in downline: profiles that have their own downline (are in managerIdsWithDownline)
        // TODO: Remove test data logic before production
        const gaCount = downline.filter(
          (p) => managerIdsWithDownline.has(p.id) ||
                 (p.is_test === true && p.full_name?.startsWith('Test GA'))
        ).length;

        teamDataList.push({
          id: mga.id,
          name: mga.full_name || 'Unnamed MGA',
          email: mga.email,
          totalAgents: downline.length,
          gaCount,
        });
      }

      // Step 7: Add "Direct to TIG" card
      if (directToTigAgents.length > 0 || mgas.length === 0) {
        teamDataList.push({
          id: null,
          name: 'Direct to TIG',
          email: null,
          totalAgents: directToTigAgents.length,
          gaCount: 0,
          isDirectToTIG: true,
        });
      }

      setTeams(teamDataList);
    } catch (err) {
      console.error('Error fetching team data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Recursive function to get full downline for a manager
  const getFullDownline = (
    managerId: string,
    allProfiles: Array<{ id: string; manager_id: string | null; user_id: string }>
  ): Array<{ id: string; manager_id: string | null; user_id: string }> => {
    const directReports = allProfiles.filter((p) => p.manager_id === managerId);
    let fullDownline = [...directReports];

    for (const report of directReports) {
      const subDownline = getFullDownline(report.id, allProfiles);
      fullDownline = [...fullDownline, ...subDownline];
    }

    return fullDownline;
  };

  // Filter and sort teams
  const filteredAndSortedTeams = useMemo(() => {
    let result = teams.filter((team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    result.sort((a, b) => {
      // Always put "Direct to TIG" at the end
      if (a.isDirectToTIG) return 1;
      if (b.isDirectToTIG) return -1;

      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'size-desc':
          return b.totalAgents - a.totalAgents;
        case 'size-asc':
          return a.totalAgents - b.totalAgents;
        default:
          return 0;
      }
    });

    return result;
  }, [teams, searchQuery, sortBy]);

  // Calculate totals
  const totalAgents = teams.reduce((sum, t) => sum + t.totalAgents, 0);
  const totalMGAs = teams.filter((t) => !t.isDirectToTIG).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gold mb-3" />
        <p className="text-sm text-muted-foreground">Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Agents</p>
          <p className="text-2xl font-semibold text-foreground">{totalAgents}</p>
        </div>
        <div className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">MGAs</p>
          <p className="text-2xl font-semibold text-foreground">{totalMGAs}</p>
        </div>
        <div className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">GAs</p>
          <p className="text-2xl font-semibold text-foreground">
            {teams.reduce((sum, t) => sum + t.gaCount, 0)}
          </p>
        </div>
        <div className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Direct to TIG</p>
          <p className="text-2xl font-semibold text-foreground">
            {teams.find((t) => t.isDirectToTIG)?.totalAgents || 0}
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-[#E5E2DB]"
          />
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-44 border-[#E5E2DB]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="size-desc">Team Size (Largest)</SelectItem>
            <SelectItem value="size-asc">Team Size (Smallest)</SelectItem>
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="flex rounded-lg border border-[#E5E2DB] overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-none px-3 ${
              viewMode === 'cards'
                ? 'bg-gold/10 text-gold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setViewMode('cards')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-none px-3 border-l border-[#E5E2DB] ${
              viewMode === 'list'
                ? 'bg-gold/10 text-gold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Teams Display */}
      {filteredAndSortedTeams.length === 0 ? (
        <div className="bg-white border border-[#E5E2DB] rounded-xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gold/8 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-gold" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No teams found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'Try adjusting your search terms' : 'No MGA teams have been set up yet'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedTeams.map((team) => (
            <TeamCard
              key={team.id ?? 'direct'}
              team={team}
              onViewTeam={() => onSelectTeam(team.id)}
              onViewProfile={team.id ? () => handleViewProfile(team.id!) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAndSortedTeams.map((team) => (
            <TeamListItem
              key={team.id ?? 'direct'}
              team={team}
              onViewTeam={() => onSelectTeam(team.id)}
              onViewProfile={team.id ? () => handleViewProfile(team.id!) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Card View Component
function TeamCard({
  team,
  onViewTeam,
  onViewProfile,
}: {
  team: TeamData;
  onViewTeam: () => void;
  onViewProfile?: () => void;
}) {
  const isManager = !team.isDirectToTIG && onViewProfile;

  // For Direct to TIG, the whole card is clickable to drill in
  // For managers, only the "View Team" button drills in
  const handleCardClick = () => {
    if (team.isDirectToTIG) {
      onViewTeam();
    }
    // For managers, card click does nothing - use specific buttons
  };

  return (
    <div
      onClick={handleCardClick}
      className={`w-full text-left bg-white border border-[#E5E2DB] rounded-xl p-5 shadow-sm hover:shadow-md hover:border-gold/30 transition-all duration-150 ${
        team.isDirectToTIG ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            team.isDirectToTIG ? 'bg-blue-50' : 'bg-gold/8'
          }`}
        >
          {team.isDirectToTIG ? (
            <Building2 className="w-5 h-5 text-blue-600" />
          ) : (
            <Users className="w-5 h-5 text-gold" />
          )}
        </div>
        {team.isDirectToTIG && (
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {isManager ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile?.();
          }}
          className="font-semibold text-foreground mb-1 hover:text-gold transition-colors cursor-pointer text-left"
        >
          {team.name}
          <span className="text-xs font-normal text-muted-foreground ml-2">
            ({team.totalAgents} agents)
          </span>
        </button>
      ) : (
        <h3 className="font-semibold text-foreground mb-1">
          {team.name}
        </h3>
      )}
      {team.email && (
        <p className="text-xs text-muted-foreground mb-3 truncate">{team.email}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[#E5E2DB]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{team.totalAgents}</span>
            <span className="text-xs text-muted-foreground">agents</span>
          </div>
          {!team.isDirectToTIG && team.gaCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{team.gaCount}</span>
              <span className="text-xs text-muted-foreground">GAs</span>
            </div>
          )}
        </div>
        {isManager && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewTeam();
            }}
            className="text-xs h-7 px-2 gap-1"
          >
            View Team
            <ChevronRight className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// List View Component
function TeamListItem({
  team,
  onViewTeam,
  onViewProfile,
}: {
  team: TeamData;
  onViewTeam: () => void;
  onViewProfile?: () => void;
}) {
  const isManager = !team.isDirectToTIG && onViewProfile;

  const handleRowClick = () => {
    if (team.isDirectToTIG) {
      onViewTeam();
    }
    // For managers, row click does nothing - use specific buttons
  };

  return (
    <div
      onClick={handleRowClick}
      className={`w-full text-left bg-white border border-[#E5E2DB] rounded-lg px-4 py-3 shadow-sm hover:shadow-md hover:border-gold/30 transition-all duration-150 flex items-center gap-4 ${
        team.isDirectToTIG ? 'cursor-pointer' : ''
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          team.isDirectToTIG ? 'bg-blue-50' : 'bg-gold/8'
        }`}
      >
        {team.isDirectToTIG ? (
          <Building2 className="w-4 h-4 text-blue-600" />
        ) : (
          <Users className="w-4 h-4 text-gold" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {isManager ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile?.();
            }}
            className="font-medium text-foreground hover:text-gold transition-colors truncate cursor-pointer text-left"
          >
            {team.name}
            <span className="text-xs font-normal text-muted-foreground ml-2">
              ({team.totalAgents} agents)
            </span>
          </button>
        ) : (
          <h3 className="font-medium text-foreground truncate">
            {team.name}
          </h3>
        )}
        {team.email && (
          <p className="text-xs text-muted-foreground truncate">{team.email}</p>
        )}
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        {!isManager && (
          <>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{team.totalAgents}</p>
              <p className="text-xs text-muted-foreground">agents</p>
            </div>
            {!team.isDirectToTIG && (
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{team.gaCount}</p>
                <p className="text-xs text-muted-foreground">GAs</p>
              </div>
            )}
          </>
        )}
        {isManager ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewTeam();
            }}
            className="text-xs h-7 px-2 gap-1"
          >
            View Team
            <ChevronRight className="w-3 h-3" />
          </Button>
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
