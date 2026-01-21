# All Agents Page - Complete Code Reference

This document contains all files related to the "All Agents" page/tab functionality.

---

## Core Page Components

### 1. AllAgentsTab.tsx
**Path:** `src/components/admin/AllAgentsTab.tsx`

```tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2, X, Phone, Mail, Building2 } from 'lucide-react';

type AgentStatus = 'imported' | 'invited' | 'active' | 'all';

interface AgentProfile {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  npn: string | null;
  invited_at: string | null;
  setup_link_sent_at: string | null;
  is_active: boolean;
  manager_id: string | null;
  created_at: string | null;
  resident_state: string | null;
}

interface ManagerInfo {
  id: string;
  name: string;
}

function getAgentStatus(agent: AgentProfile): AgentStatus {
  if (agent.user_id !== null) return 'active';
  if (agent.invited_at !== null || agent.setup_link_sent_at !== null) return 'invited';
  return 'imported';
}

function StatusDot({ status }: { status: AgentStatus }) {
  const colors = {
    imported: 'bg-gray-300',
    invited: 'bg-yellow-400',
    active: 'bg-green-500',
    all: 'bg-blue-500',
  };

  const titles = {
    imported: 'Imported',
    invited: 'Invited',
    active: 'Active',
    all: 'All',
  };

  return (
    <span
      className={`w-2.5 h-2.5 rounded-full inline-block ${colors[status]}`}
      title={titles[status]}
    />
  );
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface AllAgentsTabProps {
  initialManagerFilter?: string;
}

export function AllAgentsTab({ initialManagerFilter }: AllAgentsTabProps = {}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [managerMap, setManagerMap] = useState<Map<string, string>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'all'>('all');
  const [managerFilter, setManagerFilter] = useState<string>(initialManagerFilter || 'all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  // Update manager filter when initialManagerFilter prop changes
  useEffect(() => {
    if (initialManagerFilter !== undefined) {
      setManagerFilter(initialManagerFilter);
    }
  }, [initialManagerFilter]);

  const fetchAgents = async () => {
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
        .select('id, user_id, full_name, email, phone, state, npn, setup_link_sent_at, is_active, manager_id, created_at')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Query error:', error);
        throw error;
      }

      // Filter out admin users
      const profiles = ((data || []) as Array<{
        id: string;
        user_id: string | null;
        full_name: string | null;
        email: string | null;
        phone: string | null;
        state: string | null;
        npn: string | null;
        setup_link_sent_at: string | null;
        is_active: boolean;
        manager_id: string | null;
        created_at: string | null;
      }>).filter((p) => !p.user_id || !adminUserIds.has(p.user_id));

      // Build manager map (id -> name)
      const managerIds = new Set<string>();
      profiles.forEach((p) => {
        if (p.manager_id) {
          managerIds.add(p.manager_id);
        }
      });

      // Create a map from profiles
      const newManagerMap = new Map<string, string>();
      profiles.forEach((p) => {
        if (managerIds.has(p.id)) {
          newManagerMap.set(p.id, p.full_name || 'Unknown');
        }
      });
      setManagerMap(newManagerMap);

      const agentList: AgentProfile[] = profiles.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        npn: row.npn,
        invited_at: null, // Column doesn't exist yet
        setup_link_sent_at: row.setup_link_sent_at,
        is_active: row.is_active,
        manager_id: row.manager_id,
        created_at: row.created_at,
        resident_state: row.state,
      }));

      setAgents(agentList);
    } catch (err) {
      console.error('Error fetching agents:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const imported = agents.filter((a) => getAgentStatus(a) === 'imported').length;
    const invited = agents.filter((a) => getAgentStatus(a) === 'invited').length;
    const active = agents.filter((a) => getAgentStatus(a) === 'active').length;
    return { imported, invited, active, total: agents.length };
  }, [agents]);

  // Get unique managers (managers) for filter
  const uniqueManagers = useMemo((): ManagerInfo[] => {
    return Array.from(managerMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [managerMap]);

  // Get unique states for filter
  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    agents.forEach((a) => {
      if (a.resident_state) states.add(a.resident_state);
    });
    return Array.from(states).sort();
  }, [agents]);

  // Filter agents
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      // Status filter
      if (statusFilter !== 'all' && getAgentStatus(agent) !== statusFilter) {
        return false;
      }

      // Manager filter - now uses manager_id
      if (managerFilter === 'no-manager' && agent.manager_id !== null) {
        return false;
      }
      if (managerFilter !== 'all' && managerFilter !== 'no-manager' && agent.manager_id !== managerFilter) {
        return false;
      }

      // State filter
      if (stateFilter !== 'all' && agent.resident_state !== stateFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = agent.full_name?.toLowerCase().includes(query);
        const matchesEmail = agent.email?.toLowerCase().includes(query);
        const matchesNpn = agent.npn?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesNpn) {
          return false;
        }
      }

      return true;
    });
  }, [agents, statusFilter, managerFilter, stateFilter, searchQuery]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAgents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAgents.map((a) => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleRowClick = (agent: AgentProfile) => {
    setSelectedAgent(agent);
  };

  const closeQuickView = () => {
    setSelectedAgent(null);
  };

  const handleViewFullProfile = () => {
    if (selectedAgent) {
      navigate(`/admin/agents/${selectedAgent.id}`);
    }
  };

  const handleSendSetupLinks = () => {
    console.log('Send setup links to:', Array.from(selectedIds));
    // TODO: Implement bulk send
  };

  const handleAssignManager = () => {
    console.log('Assign manager to:', Array.from(selectedIds));
    // TODO: Implement bulk assign
  };

  // Helper to get manager name from ID
  const getManagerName = (managerId: string | null): string | null => {
    if (!managerId) return null;
    return managerMap.get(managerId) || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + Filters Row */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, NPN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 border-gray-300"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AgentStatus | 'all')}>
          <SelectTrigger className="w-[130px] h-10 border-gray-300">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="imported">Imported</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
        <Select value={managerFilter} onValueChange={setManagerFilter}>
          <SelectTrigger className="w-[180px] h-10 border-gray-300">
            <SelectValue placeholder="All Managers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Managers</SelectItem>
            {uniqueManagers.map((manager) => (
              <SelectItem key={manager.id} value={manager.id}>
                {manager.name}
              </SelectItem>
            ))}
            <SelectItem value="no-manager">Direct to TIG</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-[120px] h-10 border-gray-300">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {uniqueStates.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Line */}
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>{stats.total} agents</span>
        <span className="text-gray-300">·</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 bg-gray-300 rounded-full" />
          {stats.imported} imported
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 bg-yellow-400 rounded-full" />
          {stats.invited} invited
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          {stats.active} active
        </span>
      </div>

      {/* Main Content: Table + Quick View Panel */}
      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-10 px-3 py-3">
                  <Checkbox
                    checked={selectedIds.size === filteredAgents.length && filteredAgents.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="px-3 py-3 font-medium text-gray-600">Name</TableHead>
                <TableHead className="px-3 py-3 font-medium text-gray-600">Phone</TableHead>
                <TableHead className="px-3 py-3 font-medium text-gray-600">Email</TableHead>
                <TableHead className="px-3 py-3 font-medium text-gray-600">Manager</TableHead>
                <TableHead className="w-16 px-3 py-3 text-center font-medium text-gray-600">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No agents found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgents.map((agent) => (
                  <TableRow
                    key={agent.id}
                    className={`cursor-pointer hover:bg-gray-50 ${
                      selectedAgent?.id === agent.id ? 'bg-blue-50' : ''
                    } ${selectedIds.has(agent.id) ? 'bg-blue-50' : ''}`}
                    onClick={() => handleRowClick(agent)}
                  >
                    <TableCell className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(agent.id)}
                        onCheckedChange={() => toggleSelect(agent.id)}
                      />
                    </TableCell>
                    <TableCell className="px-3 py-3 font-medium text-gray-900">
                      {agent.full_name || '—'}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-gray-600">
                      {agent.phone || '—'}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-gray-600">
                      {agent.email || '—'}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-gray-600">
                      {getManagerName(agent.manager_id) || (
                        <span className="inline-flex items-center gap-1.5 text-gray-400 italic">
                          <Building2 className="w-3.5 h-3.5" />
                          Direct to TIG
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-center">
                      <StatusDot status={getAgentStatus(agent)} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {/* Table Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
            Showing {filteredAgents.length} of {agents.length} agents
          </div>
        </div>

        {/* Quick View Panel */}
        {selectedAgent && (
          <div className="w-80 border border-gray-200 rounded-lg bg-gray-50 flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{selectedAgent.full_name || 'Unnamed'}</h3>
              <button
                onClick={closeQuickView}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{selectedAgent.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{selectedAgent.email || '—'}</span>
                </div>
              </div>

              {/* Details */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">NPN</span>
                  <span className="text-gray-900 font-medium">{selectedAgent.npn || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">State</span>
                  <span className="text-gray-900">{selectedAgent.resident_state || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Manager</span>
                  {getManagerName(selectedAgent.manager_id) ? (
                    <span className="text-gray-900">{getManagerName(selectedAgent.manager_id)}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-gray-400 italic">
                      <Building2 className="w-3 h-3" />
                      Direct to TIG
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="inline-flex items-center gap-1.5">
                    <StatusDot status={getAgentStatus(selectedAgent)} />
                    <span className="text-gray-900 capitalize">{getAgentStatus(selectedAgent)}</span>
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-900">{formatDate(selectedAgent.created_at)}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleViewFullProfile}
                >
                  View Full Profile
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => console.log('Assign manager for:', selectedAgent.id)}
                >
                  Assign Manager
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => console.log('Send setup link for:', selectedAgent.id)}
                >
                  Send Setup Link
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="border-t border-gray-200 bg-blue-50 p-4 rounded-lg -mx-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.size} agent{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="bg-white"
                onClick={handleAssignManager}
              >
                Assign Manager...
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSendSetupLinks}
              >
                Send Setup Links
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 2. AgentsPage.tsx
**Path:** `src/pages/admin/AgentsPage.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AllAgentsTab } from '@/components/admin/AllAgentsTab';
import { TeamsTab } from '@/components/admin/TeamsTab';

type TabView = 'teams' | 'all';

export default function AgentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, isAdmin, hasDownline, isAgent, loading: authLoading } = useAuth();

  // Tab state from URL or default to 'all'
  const currentTab = (searchParams.get('tab') as TabView) || 'all';
  const setCurrentTab = (tab: TabView) => {
    setSearchParams(tab === 'all' ? {} : { tab });
  };

  // Manager filter for All Agents tab (set when clicking a team)
  const [selectedManager, setSelectedManager] = useState<string | undefined>(undefined);

  // Redirect non-admin agents to their profile
  useEffect(() => {
    if (!authLoading && isAgent() && !hasDownline() && !isAdmin()) {
      navigate(`/admin/agents/${profile?.id || ''}`);
    }
  }, [authLoading, isAgent, hasDownline, isAdmin, navigate, profile]);

  // Handle team selection from TeamsTab
  const handleTeamSelect = (teamName: string | null) => {
    // Switch to All Agents tab with the manager filter
    setSelectedManager(teamName === null ? 'no-manager' : teamName);
    setCurrentTab('all');
  };

  // Clear manager filter when switching to Teams tab
  const handleTabChange = (tab: TabView) => {
    if (tab === 'teams') {
      setSelectedManager(undefined);
    }
    setCurrentTab(tab);
  };

  const canAddAgents = isAdmin();

  // Loading state (only show page-level loading for auth)
  if (authLoading) {
    return (
      <AdminLayout showBackButton backLabel="Dashboard" onBack={() => navigate('/admin')}>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout showBackButton backLabel="Dashboard" onBack={() => navigate('/admin')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-medium text-foreground">Agents</h1>
        {canAddAgents && (
          <Link to="/admin/agents/new">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Agent
            </Button>
          </Link>
        )}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit mb-6">
        <button
          onClick={() => handleTabChange('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            currentTab === 'all'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All Agents
        </button>
        <button
          onClick={() => handleTabChange('teams')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            currentTab === 'teams'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Teams
        </button>
      </div>

      {/* Tab Content */}
      {currentTab === 'all' ? (
        <AllAgentsTab initialManagerFilter={selectedManager} />
      ) : (
        <TeamsTab onSelectTeam={handleTeamSelect} />
      )}
    </AdminLayout>
  );
}
```

---

### 3. TeamsTab.tsx
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

## Layout Components

### 4. AdminLayout.tsx
**Path:** `src/components/layout/AdminLayout.tsx`

```tsx
import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MaxWidth = 'narrow' | 'default' | 'wide';

interface AdminLayoutProps {
  children: ReactNode;
  /** Show back button in header */
  showBackButton?: boolean;
  /** Custom back handler (default: navigate(-1)) */
  onBack?: () => void;
  /** Back button label */
  backLabel?: string;
  /** Content max width: narrow (3xl), default (6xl), wide (7xl) */
  maxWidth?: MaxWidth;
  /** Additional className for main content area */
  className?: string;
}

const MAX_WIDTH_CLASSES: Record<MaxWidth, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
};

export function AdminLayout({
  children,
  showBackButton = false,
  onBack,
  backLabel = 'Back',
  maxWidth = 'default',
  className,
}: AdminLayoutProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      {/* Minimal Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Left: Back button (optional) + Logo */}
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-1.5 text-muted-foreground hover:text-foreground hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Button>
            )}
            <Link to="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-b from-[hsl(43,56%,45%)] to-[hsl(43,56%,38%)] rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">TIG</span>
              </div>
              <span className="font-semibold text-foreground text-sm">Admin</span>
            </Link>
          </div>

          {/* Right: Avatar Dropdown */}
          <UserAvatarDropdown />
        </div>
      </header>

      {/* Page Content */}
      <main className={cn('mx-auto px-6 py-8', MAX_WIDTH_CLASSES[maxWidth], className)}>
        {children}
      </main>
    </div>
  );
}
```

---

### 5. UserAvatarDropdown.tsx
**Path:** `src/components/UserAvatarDropdown.tsx`

```tsx
import { useNavigate } from 'react-router-dom';
import { User, FileText, Shield, Moon, LogOut, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity, ActivityAction } from '@/utils/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ROLE_BADGE_STYLES: Record<string, { label: string; className: string }> = {
  super_admin: { label: 'Super Admin', className: 'bg-purple-100 text-purple-700' },
  admin: { label: 'Admin', className: 'bg-blue-100 text-blue-700' },
  manager: { label: 'Manager', className: 'bg-indigo-100 text-indigo-700' },
  independent_agent: { label: 'Agent', className: 'bg-green-100 text-green-700' },
  internal_tig_agent: { label: 'TIG Agent', className: 'bg-green-100 text-green-700' },
};

export function UserAvatarDropdown() {
  const navigate = useNavigate();
  const { profile, primaryRole, loading, canAccessAdmin } = useAuth();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();

  const handleLogout = async () => {
    await logActivity(ActivityAction.LOGOUT);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Logout errors are non-critical
    }
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    toast.success("Logged out successfully");
    window.location.href = '/auth';
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const roleBadge = ROLE_BADGE_STYLES[primaryRole || ''] || { label: 'User', className: 'bg-gray-100 text-gray-600' };
  const userInitials = getInitials(profile?.full_name || null);

  if (loading) {
    return (
      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2">
          {userInitials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-xl">
        {/* User Info Header */}
        <div className="px-3 py-3">
          <p className="font-medium text-foreground truncate">{profile?.full_name || 'User'}</p>
          <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
          <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge.className}`}>
            {roleBadge.label}
          </span>
        </div>

        <DropdownMenuSeparator />

        {/* Navigation Items */}
        <DropdownMenuItem
          onClick={() => navigate('/my-profile')}
          className="cursor-pointer hover:bg-primary/10"
        >
          <User className="w-4 h-4 mr-2" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('/contracting-hub')}
          className="cursor-pointer hover:bg-primary/10"
        >
          <FileText className="w-4 h-4 mr-2" />
          My Carrier Status
        </DropdownMenuItem>

        {/* Admin Dashboard - only if user has admin access */}
        {canAccessAdmin() && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate('/admin')}
              className="cursor-pointer hover:bg-primary/10"
            >
              <Shield className="w-4 h-4 mr-2" />
              Admin Dashboard
            </DropdownMenuItem>
          </>
        )}

        {/* Dark Mode Toggle */}
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center">
            <Moon className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-sm">Dark Mode</span>
          </div>
          <Switch
            checked={isDark}
            onCheckedChange={toggleDarkMode}
            className="scale-90"
          />
        </div>

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Queue Components (Related AgentPanel)

### 6. AgentPanel.tsx
**Path:** `src/components/admin/queue/AgentPanel.tsx`

```tsx
import { formatDistanceToNow } from 'date-fns';
import { X, FileText, ExternalLink, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QueueAgent, QueueStatus } from './AgentList';

interface AgentPanelProps {
  agent: QueueAgent;
  onClose: () => void;
  onStatusChange: (agentId: string, status: QueueStatus) => void;
  onCarriersChange: (agentId: string, carriers: string[]) => void;
  onSendToPinnacle: (agent: QueueAgent) => void;
}

const statusOptions: { value: QueueStatus; label: string }[] = [
  { value: 'needs_action', label: 'Needs Action' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'sent_to_pinnacle', label: 'Sent to Pinnacle' },
  { value: 'completed', label: 'Completed' },
];

const AVAILABLE_CARRIERS = [
  { code: 'aetna', name: 'Aetna' },
  { code: 'humana', name: 'Humana' },
  { code: 'anthem', name: 'Anthem' },
  { code: 'cigna', name: 'Cigna' },
  { code: 'uhc', name: 'UHC' },
  { code: 'wellcare', name: 'Wellcare' },
  { code: 'devoted', name: 'Devoted' },
  { code: 'molina', name: 'Molina' },
  { code: 'bcbs', name: 'BCBS' },
  { code: 'essence', name: 'Essence' },
];

const KY_CARRIER_CODES = ['aetna', 'anthem', 'devoted', 'humana', 'uhc', 'wellcare', 'essence'];

const DOCUMENT_LABELS: Record<string, string> = {
  contracting_packet: 'Packet',
  eo_certificate: 'E&O',
  insurance_license: 'License',
  voided_check: 'Check',
  government_id: 'ID',
  aml_training: 'AML',
  aml_certificate: 'AML',
  ce_certificate: 'CE',
  ltc_certificate: 'LTC',
  corporate_resolution: 'Corp Res',
  background_explanation: 'Background',
};

export function AgentPanel({
  agent,
  onClose,
  onStatusChange,
  onCarriersChange,
  onSendToPinnacle,
}: AgentPanelProps) {
  const documents = agent.uploaded_documents || {};
  const docEntries = Object.entries(documents).filter(
    ([key, value]) => value && DOCUMENT_LABELS[key]
  );

  const handleCarrierToggle = (carrierCode: string, checked: boolean) => {
    const newCarriers = checked
      ? [...agent.requested_carriers, carrierCode]
      : agent.requested_carriers.filter((c) => c !== carrierCode);
    onCarriersChange(agent.id, newCarriers);
  };

  const canSendToPinnacle = agent.queue_status === 'needs_action' || agent.queue_status === 'in_progress';

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header - Compact */}
      <div className="px-4 py-3 border-b border-[#E5E2DB]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground truncate">
              {agent.full_legal_name || 'Unnamed Agent'}
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              NPN: {agent.npn_number || 'N/A'} · {agent.resident_state || 'N/A'}
              {agent.email_address && ` · ${agent.email_address}`}
              {agent.phone_mobile && ` · ${agent.phone_mobile}`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Row */}
      <div className="px-4 py-3 border-b border-[#E5E2DB] flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Status:</span>
          <Select
            value={agent.queue_status}
            onValueChange={(value) => onStatusChange(agent.id, value as QueueStatus)}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs bg-white border-[#E5E2DB]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Submitted:</span>{' '}
          {agent.submitted_at
            ? formatDistanceToNow(new Date(agent.submitted_at), { addSuffix: true })
            : 'Not submitted'}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Documents Section */}
        <div className="px-4 py-3 border-b border-[#E5E2DB]">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Documents
          </h3>
          {docEntries.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {docEntries.map(([docType]) => (
                <button
                  key={docType}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border border-[#E5E2DB] hover:border-gold hover:bg-gold/5 transition-colors group"
                >
                  <FileText className="h-5 w-5 text-muted-foreground group-hover:text-gold" />
                  <span className="text-[10px] text-muted-foreground font-medium truncate w-full text-center">
                    {DOCUMENT_LABELS[docType]}
                  </span>
                  <span className="text-[10px] text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                    View
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No documents uploaded</p>
          )}
        </div>

        {/* Carriers Section */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Carriers to Request
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => onCarriersChange(agent.id, KY_CARRIER_CODES)}
            >
              KY Default
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-x-2 gap-y-1">
            {AVAILABLE_CARRIERS.map((carrier) => {
              const isChecked = agent.requested_carriers.includes(carrier.code);
              return (
                <label
                  key={carrier.code}
                  className="inline-flex items-center gap-1.5 cursor-pointer group w-fit py-0.5"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleCarrierToggle(carrier.code, checked as boolean)
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-foreground group-hover:text-gold transition-colors">
                    {carrier.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-[#E5E2DB] space-y-2">
        <Button
          className="w-full bg-gold hover:bg-gold/90 text-white"
          disabled={!canSendToPinnacle}
          onClick={() => onSendToPinnacle(agent)}
        >
          <Send className="h-4 w-4 mr-2" />
          Send to Pinnacle
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground hover:text-gold"
          onClick={() => agent.profile_id && (window.location.href = `/admin/agents/${agent.profile_id}`)}
          disabled={!agent.profile_id}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Full Profile
        </Button>
      </div>
    </div>
  );
}
```

---

## Hooks

### 7. useAuth.ts
**Path:** `src/hooks/useAuth.ts`

```ts
import { useProfile } from './useProfile';
import { useRole } from './useRole';

export function useAuth() {
  const profile = useProfile();
  const role = useRole();

  const loading = profile.loading || role.loading;

  // Determine where user should be routed after login
  const getDefaultRoute = (): string => {
    // If not authenticated, go to auth
    if (!profile.isAuthenticated) {
      return '/auth';
    }

    // If agent needs contracting, send to contracting
    if (role.isAgent() && profile.isContractingRequired) {
      return '/contracting';
    }

    // If admin, can access admin dashboard
    if (role.canAccessAdmin()) {
      return '/admin';
    }

    // Default to main dashboard
    return '/';
  };

  // Check if user can access a specific route
  const canAccessRoute = (route: string): boolean => {
    if (!profile.isAuthenticated) {
      return route === '/auth';
    }

    // Admin routes
    if (route.startsWith('/admin')) {
      return role.canAccessAdmin();
    }

    // Agent in contracting mode can only access contracting
    if (role.isAgent() && profile.isContractingRequired) {
      return route === '/contracting' || route === '/auth';
    }

    return true;
  };

  return {
    // Profile exports
    ...profile,

    // Role exports
    ...role,

    // Combined
    loading,
    getDefaultRoute,
    canAccessRoute,
  };
}
```

---

### 8. useProfile.ts
**Path:** `src/hooks/useProfile.ts`

```ts
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export type OnboardingStatus =
  | 'CONTRACTING_REQUIRED'
  | 'CONTRACTING_SUBMITTED'
  | 'APPOINTED'
  | 'SUSPENDED';

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  onboarding_status: OnboardingStatus;
  appointed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // AHIP certification fields
  ahip_cert_year: number | null;
  ahip_cert_uploaded_at: string | null;
  ahip_cert_file_path: string | null;
}

export function useProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Prevent multiple deactivation sign-out attempts
  const isSigningOutRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid Supabase auth deadlock, catch any errors
          setTimeout(() => {
            fetchProfile(session.user.id).catch((err) => {
              console.error('Failed to fetch profile on auth change:', err);
            });
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id).catch((err) => {
            console.error('Failed to fetch profile on init:', err);
          });
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to get auth session:', err);
        setError(err instanceof Error ? err : new Error('Failed to get session'));
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      // Check if account is deactivated
      if (data && data.is_active === false && !isSigningOutRef.current) {
        isSigningOutRef.current = true;
        console.log('Account deactivated, signing out...');

        // Sign out the user
        await supabase.auth.signOut();

        // Show toast message
        toast.error('Your account has been deactivated. Please contact support.', {
          duration: 6000,
        });

        // Redirect to login page
        window.location.href = '/auth';
        return;
      }

      setProfile(data as Profile);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    if (user?.id) {
      fetchProfile(user.id).catch((err) => {
        console.error('Failed to refetch profile:', err);
      });
    }
  };

  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    isActive: profile?.is_active ?? true,
    onboardingStatus: profile?.onboarding_status ?? null,
    isAppointed: profile?.onboarding_status === 'APPOINTED',
    isContractingRequired: profile?.onboarding_status === 'CONTRACTING_REQUIRED',
    isContractSubmitted: profile?.onboarding_status === 'CONTRACTING_SUBMITTED',
    isSuspended: profile?.onboarding_status === 'SUSPENDED',
    refetch,
  };
}
```

---

### 9. useRole.ts
**Path:** `src/hooks/useRole.ts`

```ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type AppRole = 'super_admin' | 'admin' | 'manager' | 'internal_tig_agent' | 'independent_agent';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export function useRole() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [primaryRole, setPrimaryRole] = useState<AppRole | null>(null);
  const [hasDownlineValue, setHasDownlineValue] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchRoles(session.user.id);
            fetchDownlineStatus();
          }, 0);
        } else {
          setRoles([]);
          setPrimaryRole(null);
          setHasDownlineValue(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id);
        fetchDownlineStatus();
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRoles = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const userRoles = (data as UserRole[]).map(r => r.role);
      setRoles(userRoles);

      // Determine primary role by hierarchy
      const roleHierarchy: AppRole[] = ['super_admin', 'admin', 'manager', 'internal_tig_agent', 'independent_agent'];
      const primary = roleHierarchy.find(role => userRoles.includes(role)) ?? null;
      setPrimaryRole(primary);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDownlineStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('current_user_has_downline');
      if (error) {
        console.error('Error checking downline status:', error);
        setHasDownlineValue(false);
        return;
      }
      setHasDownlineValue(data === true);
    } catch (err) {
      console.error('Error checking downline status:', err);
      setHasDownlineValue(false);
    }
  };

  const hasRole = (role: AppRole): boolean => roles.includes(role);

  const isAdmin = (): boolean =>
    hasRole('super_admin') || hasRole('admin');

  const isSuperAdmin = (): boolean => hasRole('super_admin');

  const isAdminRole = (): boolean => hasRole('admin');

  const isManager = (): boolean => hasRole('manager');

  const isAgent = (): boolean => hasRole('independent_agent') || hasRole('internal_tig_agent');

  const isIndependentAgent = (): boolean => hasRole('independent_agent');

  const isInternalTigAgent = (): boolean => hasRole('internal_tig_agent');

  const hasDownline = (): boolean => hasDownlineValue;

  const canAccessAdmin = (): boolean => isAdmin();

  const canManageAgents = (): boolean => isAdmin();

  const canViewTeam = (): boolean => hasDownline() || isAdmin();

  const refetch = () => {
    if (user?.id) {
      fetchRoles(user.id);
      fetchDownlineStatus();
    }
  };

  return {
    user,
    roles,
    primaryRole,
    loading,
    error,
    hasRole,
    isAdmin,
    isSuperAdmin,
    isAdminRole,
    isManager,
    isAgent,
    isIndependentAgent,
    isInternalTigAgent,
    hasDownline,
    canAccessAdmin,
    canManageAgents,
    canViewTeam,
    refetch,
  };
}
```

---

## UI Components

### 10. button.tsx
**Path:** `src/components/ui/button.tsx`

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-[hsl(43,56%,45%)] to-[hsl(43,56%,38%)] text-primary-foreground shadow-[0_2px_8px_-2px_rgba(163,133,41,0.4)] hover:shadow-[0_4px_12px_-2px_rgba(163,133,41,0.5)] hover:from-[hsl(43,56%,42%)] hover:to-[hsl(43,56%,35%)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

---

### 11. input.tsx
**Path:** `src/components/ui/input.tsx`

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base leading-normal ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
```

---

### 12. select.tsx
**Path:** `src/components/ui/select.tsx`

```tsx
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label ref={ref} className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...props} />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
```

---

### 13. table.tsx
**Path:** `src/components/ui/table.tsx`

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />,
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
  ),
);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50", className)}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  ),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
```

---

### 14. checkbox.tsx
**Path:** `src/components/ui/checkbox.tsx`

```tsx
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
```

---

### 15. dropdown-menu.tsx
**Path:** `src/components/ui/dropdown-menu.tsx`

```tsx
import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[state=open]:bg-accent focus:bg-accent",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />;
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
```

---

### 16. switch.tsx
**Path:** `src/components/ui/switch.tsx`

```tsx
import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
```

---

## Utilities

### 17. utils.ts
**Path:** `src/lib/utils.ts`

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

### 18. Supabase Client
**Path:** `src/integrations/supabase/client.ts`

```ts
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

---

## File Structure Summary

```
src/
├── components/
│   ├── admin/
│   │   ├── AllAgentsTab.tsx          # Main All Agents tab component
│   │   ├── TeamsTab.tsx              # Teams tab component
│   │   └── queue/
│   │       └── AgentPanel.tsx        # Agent panel for contracting queue
│   ├── layout/
│   │   └── AdminLayout.tsx           # Admin page layout wrapper
│   ├── ui/
│   │   ├── button.tsx                # Button component
│   │   ├── checkbox.tsx              # Checkbox component
│   │   ├── dropdown-menu.tsx         # Dropdown menu component
│   │   ├── input.tsx                 # Input component
│   │   ├── select.tsx                # Select component
│   │   ├── switch.tsx                # Switch component
│   │   └── table.tsx                 # Table component
│   └── UserAvatarDropdown.tsx        # User avatar dropdown component
├── hooks/
│   ├── useAuth.ts                    # Combined auth hook
│   ├── useProfile.ts                 # Profile hook
│   └── useRole.ts                    # Role hook
├── integrations/
│   └── supabase/
│       └── client.ts                 # Supabase client
├── lib/
│   └── utils.ts                      # Utility functions
└── pages/
    └── admin/
        └── AgentsPage.tsx            # Main Agents page with tabs
```
