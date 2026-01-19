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
