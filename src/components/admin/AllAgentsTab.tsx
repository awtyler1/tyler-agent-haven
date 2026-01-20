import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
import { Search, Loader2, X, Phone, Mail, Building2, ChevronLeft, ChevronRight } from 'lucide-react';

type AgentStatus = 'imported' | 'invited' | 'active' | 'all';

const AGENTS_PER_PAGE = 25;

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
  password_created_at: string | null;
}

interface ManagerInfo {
  id: string;
  name: string;
}

function getAgentStatus(agent: AgentProfile): AgentStatus {
  // Active = has user_id AND has set their password
  if (agent.user_id !== null && agent.password_created_at !== null) return 'active';

  // Invited = has user_id but hasn't set password yet (link sent)
  if (agent.user_id !== null) return 'invited';

  // Also invited if setup link sent but user not created yet (edge case)
  if (agent.setup_link_sent_at !== null) return 'invited';

  // Imported = no user_id, no setup link sent
  return 'imported';
}

function StatusDot({ status }: { status: AgentStatus }) {
  const colors = {
    imported: 'bg-gray-300',
    invited: 'bg-yellow-400',
    active: 'bg-green-500',
    all: 'bg-blue-500',
  };

  const labels = {
    imported: 'Not Invited',
    invited: 'Setup Link Sent',
    active: 'Account Active',
    all: 'All',
  };

  return (
    <span
      className={`w-2.5 h-2.5 rounded-full inline-block ${colors[status]}`}
      title={labels[status]}
    />
  );
}

function getStatusLabel(status: AgentStatus): string {
  const labels = {
    imported: 'Not Invited',
    invited: 'Setup Link Sent',
    active: 'Account Active',
    all: 'All',
  };
  return labels[status];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Generate page numbers with ellipsis
function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];

  if (currentPage <= 4) {
    // Near start: [1] [2] [3] [4] [5] ... [last]
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push('ellipsis');
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 3) {
    // Near end: [1] ... [last-4] [last-3] [last-2] [last-1] [last]
    pages.push(1);
    pages.push('ellipsis');
    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
  } else {
    // Middle: [1] ... [curr-1] [curr] [curr+1] ... [last]
    pages.push(1);
    pages.push('ellipsis');
    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
    pages.push('ellipsis');
    pages.push(totalPages);
  }

  return pages;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [sendingLinks, setSendingLinks] = useState(false);

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
        .select('id, user_id, full_name, email, phone, state, npn, setup_link_sent_at, is_active, manager_id, created_at, password_created_at')
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
        password_created_at: string | null;
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
        password_created_at: row.password_created_at,
      }));

      setAgents(agentList);
    } catch (err) {
      console.error('Error fetching agents:', err);
    } finally {
      setLoading(false);
    }
  };

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

  // Filter agents and reset page when filters change
  const filteredAgents = useMemo(() => {
    const filtered = agents.filter((agent) => {
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

    return filtered;
  }, [agents, statusFilter, managerFilter, stateFilter, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, managerFilter, stateFilter, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAgents.length / AGENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * AGENTS_PER_PAGE;
  const endIndex = Math.min(startIndex + AGENTS_PER_PAGE, filteredAgents.length);
  const paginatedAgents = filteredAgents.slice(startIndex, endIndex);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  // Check if all agents on current page are selected
  const currentPageIds = paginatedAgents.map((a) => a.id);
  const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));
  const someCurrentPageSelected = currentPageIds.some((id) => selectedIds.has(id));

  // Selection handlers
  const toggleSelectAllOnPage = () => {
    const newSelected = new Set(selectedIds);
    if (allCurrentPageSelected) {
      // Deselect all on current page
      currentPageIds.forEach((id) => newSelected.delete(id));
    } else {
      // Select all on current page
      currentPageIds.forEach((id) => newSelected.add(id));
    }
    setSelectedIds(newSelected);
  };

  const selectAllAgents = () => {
    setSelectedIds(new Set(filteredAgents.map((a) => a.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
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

  // Send setup link to one or more agents
  const sendSetupLinks = async (profileIds: string[]) => {
    if (profileIds.length === 0) return;

    setSendingLinks(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const profileId of profileIds) {
      try {
        const { data, error } = await supabase.functions.invoke('send-setup-link', {
          body: { profileId }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        successCount++;
      } catch (err) {
        errorCount++;
        const agent = agents.find(a => a.id === profileId);
        const name = agent?.full_name || 'Unknown';
        errors.push(`${name}: ${err instanceof Error ? err.message : 'Failed'}`);
        console.error(`Failed to send setup link to ${profileId}:`, err);
      }
    }

    setSendingLinks(false);

    // Show results
    if (successCount > 0 && errorCount === 0) {
      toast.success(`Setup link${successCount > 1 ? 's' : ''} sent to ${successCount} agent${successCount > 1 ? 's' : ''}`);
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`Sent ${successCount}, failed ${errorCount}. Check console for details.`);
    } else {
      toast.error(`Failed to send setup links: ${errors[0]}`);
    }

    // Clear selection and refresh data
    setSelectedIds(new Set());
    fetchAgents();
  };

  const handleSendSetupLinks = () => {
    const ids = Array.from(selectedIds);
    sendSetupLinks(ids);
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
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* Search + Filters Row */}
      <div className="flex gap-3 flex-shrink-0 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={`Search ${agents.length} agents...`}
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

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex-shrink-0 mb-4 bg-primary/10 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">
                {selectedIds.size} agent{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={handleAssignManager}
              >
                Assign Manager...
              </Button>
              <Button
                size="sm"
                onClick={handleSendSetupLinks}
                disabled={sendingLinks}
              >
                {sendingLinks ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Setup Links'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Table + Quick View Panel */}
      <div className="flex-1 min-h-0 flex gap-4">
        {/* Table Container */}
        <div className="flex-1 min-h-0 flex flex-col border border-border rounded-lg bg-white overflow-hidden">
          {/* Select all banner */}
          {allCurrentPageSelected && selectedIds.size < filteredAgents.length && (
            <div className="flex-shrink-0 px-4 py-2 bg-muted/50 border-b border-border text-sm">
              All {paginatedAgents.length} agents on this page are selected.{' '}
              <button
                onClick={selectAllAgents}
                className="text-primary hover:underline font-medium"
              >
                Select all {filteredAgents.length} agents
              </button>
            </div>
          )}

          {/* Scrollable Table Area */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="w-10 px-3 py-3 bg-muted">
                    <Checkbox
                      checked={allCurrentPageSelected}
                      ref={(el) => {
                        if (el) {
                          (el as unknown as HTMLInputElement).indeterminate = someCurrentPageSelected && !allCurrentPageSelected;
                        }
                      }}
                      onCheckedChange={toggleSelectAllOnPage}
                    />
                  </TableHead>
                  <TableHead className="px-3 py-3 font-medium text-muted-foreground bg-muted">Name</TableHead>
                  <TableHead className="px-3 py-3 font-medium text-muted-foreground bg-muted">Phone</TableHead>
                  <TableHead className="px-3 py-3 font-medium text-muted-foreground bg-muted">Email</TableHead>
                  <TableHead className="px-3 py-3 font-medium text-muted-foreground bg-muted">Manager</TableHead>
                  <TableHead className="w-16 px-3 py-3 text-center font-medium text-muted-foreground bg-muted">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAgents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No agents found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAgents.map((agent) => (
                    <TableRow
                      key={agent.id}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        selectedAgent?.id === agent.id ? 'bg-primary/5' : ''
                      } ${selectedIds.has(agent.id) ? 'bg-primary/5' : ''}`}
                      onClick={() => handleRowClick(agent)}
                    >
                      <TableCell className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(agent.id)}
                          onCheckedChange={() => toggleSelect(agent.id)}
                        />
                      </TableCell>
                      <TableCell className="px-3 py-3 font-medium text-foreground">
                        {agent.full_name || '—'}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-muted-foreground">
                        {agent.phone || '—'}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-muted-foreground">
                        {agent.email || '—'}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-muted-foreground">
                        {getManagerName(agent.manager_id) || (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground/60 italic">
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
          </div>

          {/* Pagination Footer - Anchored at bottom */}
          <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-muted/50 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {filteredAgents.length === 0 ? 0 : startIndex + 1}–{endIndex} of {filteredAgents.length} agents
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
                </Button>

                {pageNumbers.map((page, idx) =>
                  page === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  )
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Quick View Panel */}
        {selectedAgent && (
          <div className="w-80 flex-shrink-0 flex flex-col border border-border rounded-lg bg-muted/30 overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-border bg-white flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{selectedAgent.full_name || 'Unnamed'}</h3>
              <button
                onClick={closeQuickView}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{selectedAgent.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{selectedAgent.email || '—'}</span>
                </div>
              </div>

              {/* Details */}
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">NPN</span>
                  <span className="text-foreground font-medium">{selectedAgent.npn || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">State</span>
                  <span className="text-foreground">{selectedAgent.resident_state || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Manager</span>
                  {getManagerName(selectedAgent.manager_id) ? (
                    <span className="text-foreground">{getManagerName(selectedAgent.manager_id)}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground/60 italic">
                      <Building2 className="w-3 h-3" />
                      Direct to TIG
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="inline-flex items-center gap-1.5">
                    <StatusDot status={getAgentStatus(selectedAgent)} />
                    <span className="text-foreground">{getStatusLabel(getAgentStatus(selectedAgent))}</span>
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-foreground">{formatDate(selectedAgent.created_at)}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t border-border pt-4 space-y-2">
                <Button
                  className="w-full"
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
                  onClick={() => sendSetupLinks([selectedAgent.id])}
                  disabled={sendingLinks}
                >
                  {sendingLinks ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Setup Link'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
