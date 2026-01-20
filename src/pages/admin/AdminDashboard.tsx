import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import {
  Search,
  ClipboardList,
  FileText,
  Plus,
  Upload,
  Loader2,
} from 'lucide-react';
import tylerLogo from '@/assets/tyler-logo.png';

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

export default function AdminDashboard() {
  const { profile } = useAuth();
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
      // Get all roles to identify admins (to exclude)
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Create set of admin user_ids
      const adminUserIds = new Set(
        (roles || [])
          .filter(r => r.role === 'admin' || r.role === 'super_admin')
          .map(r => r.user_id)
      );

      // Fetch all profiles (exclude test records)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('is_active', true)
        .or('is_test.is.null,is_test.eq.false');

      if (profiles) {
        // Filter out admin users
        const agents = profiles.filter(p => {
          if (!p.user_id) return true;
          return !adminUserIds.has(p.user_id);
        });

        setStats({
          totalAgents: agents.length,
        });
      }

      // Fetch pending contracting count
      const { count } = await supabase
        .from('contracting_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted')
        .or('is_test.is.null,is_test.eq.false');

      setPendingCount(count || 0);

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
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={tylerLogo} alt="Tyler Insurance Group" className="h-12 w-auto" />
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {profile?.full_name}
            </span>
            <UserAvatarDropdown />
          </div>
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="flex flex-col items-center px-6 py-12">
        {/* Title Section */}
        <h1 className="text-2xl font-serif font-medium text-foreground mb-2 text-center">
          Find an Agent
        </h1>
        <p className="text-muted-foreground mb-6 text-center">
          Search by name, NPN, or email
        </p>

        {/* Search Input */}
        <div className="relative w-full max-w-xl mb-4" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              placeholder="Start typing..."
              className="w-full h-12 pl-12 pr-4 text-base bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-gold transition-all"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow-lg overflow-hidden z-50">
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
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {getInitials(result.full_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {result.full_name || 'No name'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
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
                    className="block px-4 py-3 text-sm text-primary font-medium hover:bg-muted/50 transition-colors border-t border-border text-center"
                  >
                    View all agents
                  </Link>
                </>
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery.length >= 2 ? 'No agents found' : 'Type at least 2 characters'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Whisper Stats Line */}
        <p className="text-sm text-muted-foreground mb-10 text-center">
          {loading ? (
            '...'
          ) : (
            <>
              {stats.totalAgents} agents
              {pendingCount > 0 && (
                <>
                  {' · '}
                  <Link
                    to="/admin/contracting"
                    className="text-gold hover:text-gold/80 hover:underline"
                  >
                    {pendingCount} pending review
                  </Link>
                </>
              )}
            </>
          )}
        </p>

        {/* 2x2 Card Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
          {/* All Agents */}
          <Card
            className="group cursor-pointer bg-white border border-border rounded-lg hover:border-primary/30 hover:shadow-lg transition-all"
            onClick={() => navigate('/admin/agents')}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-foreground">All Agents</h3>
              </div>
              <p className="text-sm text-muted-foreground">View and manage roster</p>
            </div>
          </Card>

          {/* Contracting */}
          <Card
            className="group cursor-pointer bg-white border border-border rounded-lg hover:border-primary/30 hover:shadow-lg transition-all relative"
            onClick={() => navigate('/admin/contracting')}
          >
            {pendingCount > 0 && (
              <span className="absolute top-3 right-3 px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                {pendingCount}
              </span>
            )}
            <div className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-foreground">Contracting</h3>
              </div>
              <p className="text-sm text-muted-foreground">Review applications</p>
            </div>
          </Card>

          {/* New Agent */}
          <Card
            className="group cursor-pointer bg-white border border-border rounded-lg hover:border-primary/30 hover:shadow-lg transition-all"
            onClick={() => navigate('/admin/agents/new')}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-semibold text-foreground">New Agent</h3>
              </div>
              <p className="text-sm text-muted-foreground">Start contracting</p>
            </div>
          </Card>

          {/* RTS Import */}
          <Card
            className="group cursor-pointer bg-white border border-border rounded-lg hover:border-primary/30 hover:shadow-lg transition-all"
            onClick={() => navigate('/admin/rts-import')}
          >
            <div className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-foreground">RTS Import</h3>
              </div>
              <p className="text-sm text-muted-foreground">Upload carrier data</p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
