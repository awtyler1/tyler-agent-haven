import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Activity,
  Search,
  ChevronDown,
  ChevronRight,
  User,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ActivityAction } from '@/utils/activityLogger';

// Types
interface ActivityLogEntry {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
}

// Action type display labels
const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  password_reset: 'Password Reset',
  contracting_started: 'Contracting Started',
  contracting_step_completed: 'Step Completed',
  contracting_submitted: 'Contracting Submitted',
  agent_approved: 'Agent Approved',
  agent_rejected: 'Agent Rejected',
  sent_to_pinnacle: 'Sent to Pinnacle',
  queue_status_changed: 'Status Changed',
  carrier_status_updated: 'Carrier Status Updated',
  setup_link_sent: 'Setup Link Sent',
  document_uploaded: 'Document Uploaded',
  document_downloaded: 'Document Downloaded',
  pdf_generated: 'PDF Generated',
};

// Get badge color based on action type
const getActionBadgeColor = (action: string): string => {
  if (action.includes('login') || action.includes('logout')) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  if (action.includes('submitted') || action.includes('approved') || action.includes('completed')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (action.includes('rejected') || action.includes('error')) {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  if (action.includes('sent') || action.includes('pinnacle')) {
    return 'bg-purple-50 text-purple-700 border-purple-200';
  }
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

// Log row component with expandable metadata
function LogRow({ log }: { log: ActivityLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  return (
    <>
      <tr
        className={cn(
          "border-b border-slate-100 hover:bg-slate-50/50 transition-colors",
          hasMetadata && "cursor-pointer"
        )}
        onClick={() => hasMetadata && setExpanded(!expanded)}
      >
        <td className="px-4 py-3 text-sm text-slate-600">
          {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {log.user_name || 'Unknown User'}
              </p>
              <p className="text-xs text-slate-500">{log.user_email}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <Badge
            variant="outline"
            className={cn('text-xs font-medium', getActionBadgeColor(log.action_type))}
          >
            {ACTION_LABELS[log.action_type] || log.action_type}
          </Badge>
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">
          {log.entity_type || '-'}
        </td>
        <td className="px-4 py-3">
          {hasMetadata ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              View Details
            </button>
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </td>
      </tr>
      {expanded && hasMetadata && (
        <tr className="bg-slate-50/80">
          <td colSpan={5} className="px-4 py-3">
            <div className="text-xs font-mono bg-white rounded border border-slate-200 p-3 overflow-x-auto">
              <pre className="text-slate-700">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  // Get unique action types for filter dropdown
  const actionTypes = Object.values(ActivityAction);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // Query activity_logs joined with profiles for user info
      let query = supabase
        .from('activity_logs')
        .select(`
          id,
          user_id,
          action_type,
          entity_type,
          entity_id,
          metadata,
          created_at,
          profiles!inner (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply action type filter
      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to flatten profile info
      const transformedLogs: ActivityLogEntry[] = (data || []).map((log) => ({
        id: log.id,
        user_id: log.user_id,
        action_type: log.action_type,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        metadata: log.metadata as Record<string, unknown> | null,
        created_at: log.created_at,
        user_name: (log.profiles as { full_name: string | null; email: string | null })?.full_name,
        user_email: (log.profiles as { full_name: string | null; email: string | null })?.email,
      }));

      setLogs(transformedLogs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filter logs by search query (user name or email)
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.user_name?.toLowerCase().includes(query) ||
      log.user_email?.toLowerCase().includes(query) ||
      log.action_type.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Activity className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Activity Log</h1>
              <p className="text-sm text-slate-500">Audit trail of system events</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by user or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes.map((action) => (
                <SelectItem key={action} value={action}>
                  {ACTION_LABELS[action] || action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-500">Loading activity logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Activity className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No activity logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Entity Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <LogRow key={log.id} log={log} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Count footer */}
        {!loading && filteredLogs.length > 0 && (
          <p className="text-xs text-slate-500 mt-3 text-right">
            Showing {filteredLogs.length} of {logs.length} entries
          </p>
        )}
      </main>
    </div>
  );
}
