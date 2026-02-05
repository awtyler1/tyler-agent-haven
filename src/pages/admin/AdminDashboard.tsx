import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigationContext } from '@/hooks/useNavigationContext';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import {
  Search,
  ClipboardList,
  FileText,
  Plus,
  Upload,
  Loader2,
} from 'lucide-react';

interface DashboardStats {
  totalAgents: number;
}

interface SearchResult {
  id: string;
  full_name: string | null;
  npn: string | null;
  email: string | null;
  onboarding_status: string | null;
  manager_id: string | null;
  manager_name?: string | null;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { homePath, isDualRole, viewMode, toggleMode } = useNavigationContext();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [rolesResult, profilesResult, contractingResult] = await Promise.all([
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('profiles')
          .select('id, user_id')
          .eq('is_active', true)
          .or('is_test.is.null,is_test.eq.false'),
        supabase.from('contracting_applications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'submitted')
          .not('queue_status', 'in', '("completed","sent_to_pinnacle")')
          .or('is_test.is.null,is_test.eq.false')
      ]);

      // Process roles to identify admins
      const adminUserIds = new Set(
        (rolesResult.data || [])
          .filter(r => r.role === 'admin' || r.role === 'super_admin')
          .map(r => r.user_id)
      );

      // Filter profiles to exclude admins
      if (profilesResult.data) {
        const agents = profilesResult.data.filter(p => {
          if (!p.user_id) return true;
          return !adminUserIds.has(p.user_id);
        });
        setStats({ totalAgents: agents.length });
      }

      setPendingCount(contractingResult.count || 0);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const { data: results } = await supabase
        .from('profiles')
        .select('id, full_name, npn, email, onboarding_status, manager_id')
        .or('is_test.is.null,is_test.eq.false')
        .or(`full_name.ilike.%${query}%,npn.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(8);

      if (results && results.length > 0) {
        const managerIds = [...new Set(results.filter(r => r.manager_id).map(r => r.manager_id))];

        let managerMap: Record<string, string> = {};
        if (managerIds.length > 0) {
          const { data: managers } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', managerIds);

          if (managers) {
            managerMap = managers.reduce((acc, m) => {
              acc[m.id] = m.full_name || 'Unknown';
              return acc;
            }, {} as Record<string, string>);
          }
        }

        const enrichedResults = results.map(r => ({
          ...r,
          manager_name: r.manager_id ? managerMap[r.manager_id] : null,
        }));

        setSearchResults(enrichedResults);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'APPOINTED':
        return { label: 'Appointed', className: 'bg-green-100 text-green-700' };
      case 'CONTRACTING_SUBMITTED':
        return { label: 'Submitted', className: 'bg-amber-100 text-amber-700' };
      case 'CONTRACTING_REQUIRED':
        return { label: 'Pending', className: 'bg-gray-100 text-gray-600' };
      default:
        return { label: status || 'Unknown', className: 'bg-gray-100 text-gray-600' };
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-stone-100">
      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.015) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
      />

      {/* Header */}
      <header className="relative bg-white/60 backdrop-blur-xl border-b border-white/80 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-3 px-6">
          {/* Left: Logo + Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-serif text-xl font-semibold text-stone-900">TIG</span>
            <span className="text-stone-300">|</span>
            <span className="text-sm text-stone-500">Admin</span>

            {/* Mode toggle for dual-role users */}
            {isDualRole && (
              <button
                onClick={toggleMode}
                className="ml-2 px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-100/80 rounded-lg transition-colors"
              >
                Switch to Agent View
              </button>
            )}
          </div>

          {/* Right: Avatar */}
          <UserAvatarDropdown />
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="relative flex flex-col items-center px-6 py-12">
        {/* Greeting Section */}
        <div className="text-center mb-10">
          <p className="text-amber-600/70 text-sm font-medium mb-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="font-serif text-3xl font-medium text-stone-900 mb-3">
            {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}
          </h1>

          {/* Stats with dots */}
          <div className="flex items-center justify-center gap-6 text-sm">
            {loading ? (
              <span className="text-stone-400">...</span>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-stone-500">{stats.totalAgents.toLocaleString()} agents</span>
                </div>
                {pendingCount > 0 && (
                  <Link to="/admin/contracting" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-stone-500">{pendingCount} pending review</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Search - Glass Card */}
        <div className="w-full max-w-3xl mb-10" ref={searchRef}>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-1.5 shadow-lg shadow-stone-200/40 border border-white/80">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                placeholder="Search agents by name, NPN, or email..."
                className="w-full h-12 pl-12 pr-5 text-base bg-transparent rounded-xl focus:outline-none focus:bg-amber-50/50 transition-colors placeholder:text-stone-400"
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 animate-spin" />
              )}
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute left-0 right-0 mx-6 mt-2 bg-white/95 backdrop-blur-sm border border-white/80 rounded-2xl shadow-xl overflow-hidden z-50" style={{ maxWidth: 'calc(48rem - 3rem)', marginLeft: 'auto', marginRight: 'auto' }}>
              {searchResults.length > 0 ? (
                <>
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.map((result) => {
                      const status = getStatusBadge(result.onboarding_status);
                      return (
                        <button
                          key={result.id}
                          onClick={() => {
                            navigate(`/admin/agents/${result.id}`);
                            setShowResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-amber-50/50 transition-colors text-left border-b border-stone-100 last:border-0"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {getInitials(result.full_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-900 truncate">
                              {result.full_name || 'No name'}
                            </p>
                            <p className="text-xs text-stone-500 truncate">
                              {result.npn ? `NPN: ${result.npn}` : result.email}
                              {result.manager_name && ` · ${result.manager_name}`}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${status.className}`}>
                            {status.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <Link
                    to="/admin/agents"
                    onClick={() => setShowResults(false)}
                    className="block px-4 py-3 text-sm text-amber-600 font-medium hover:bg-amber-50/50 transition-colors border-t border-stone-100 text-center"
                  >
                    View all agents
                  </Link>
                </>
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-stone-500">
                    {searchQuery.length >= 2 ? 'No agents found' : 'Type at least 2 characters'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="w-full max-w-3xl">
          <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-4 px-1">
            Quick Actions
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* All Agents */}
            <div
              onClick={() => navigate('/admin/agents')}
              className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/60 shadow-sm shadow-stone-200/30 hover:shadow-xl hover:shadow-stone-200/40 hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-1">All Agents</h3>
              <p className="text-sm text-stone-500">View and manage roster</p>
            </div>

            {/* Contracting */}
            <div
              onClick={() => navigate('/admin/contracting')}
              className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/60 shadow-sm shadow-stone-200/30 hover:shadow-xl hover:shadow-stone-200/40 hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer"
            >
              {pendingCount > 0 && (
                <span className="absolute top-4 right-4 w-5 h-5 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full shadow-md">
                  {pendingCount}
                </span>
              )}
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/25 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-1">Contracting</h3>
              <p className="text-sm text-stone-500">Review applications</p>
            </div>

            {/* New Agent */}
            <div
              onClick={() => navigate('/admin/agents/new')}
              className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/60 shadow-sm shadow-stone-200/30 hover:shadow-xl hover:shadow-stone-200/40 hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-1">New Agent</h3>
              <p className="text-sm text-stone-500">Start contracting</p>
            </div>

            {/* RTS Import */}
            <div
              onClick={() => navigate('/admin/rts-import')}
              className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/60 shadow-sm shadow-stone-200/30 hover:shadow-xl hover:shadow-stone-200/40 hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/25 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-stone-900 mb-1">RTS Import</h3>
              <p className="text-sm text-stone-500">Upload carrier data</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
