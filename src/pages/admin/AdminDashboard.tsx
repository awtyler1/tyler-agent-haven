import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown';
import {
  Users,
  UserPlus,
  FileText,
  Search,
  FileSpreadsheet,
  Building2,
  ChevronRight,
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
  const [contractingQueueCount, setContractingQueueCount] = useState(0);
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

      // Create set of admin user_ids (only those with user_id)
      const adminUserIds = new Set(
        (roles || [])
          .filter(r => r.role === 'admin' || r.role === 'super_admin')
          .map(r => r.user_id)
      );

      // Fetch all profiles (exclude test records)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, onboarding_status, manager_id')
        .or('is_test.is.null,is_test.eq.false');

      if (profiles) {
        // Count all profiles that are NOT admin/super_admin
        // Include profiles with null user_id (imported agents without auth account)
        const agents = profiles.filter(p => {
          // If user_id is null, include them (imported agent)
          if (!p.user_id) return true;
          // If user_id exists, check it's not an admin
          return !adminUserIds.has(p.user_id);
        });

        setStats({
          totalAgents: agents.length,
        });
      }

      // Fetch contracting queue count
      const { count } = await supabase
        .from('contracting_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted')
        .or('is_test.is.null,is_test.eq.false');

      setContractingQueueCount(count || 0);

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
      // Search profiles by name, NPN, or email (case insensitive)
      const { data: results } = await supabase
        .from('profiles')
        .select('id, full_name, npn, email, onboarding_status, manager_id')
        .or('is_test.is.null,is_test.eq.false')
        .or(`full_name.ilike.%${query}%,npn.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(8);

      if (results && results.length > 0) {
        // Get manager names for results that have manager_id
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

        // Attach manager names to results
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

  // Handle search input change with debounce
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

  // Get initials from name
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get status badge styling
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

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Search Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-2">
            Find an Agent
          </h1>
          <p className="text-muted-foreground mb-6">
            Search by name, NPN, or email
          </p>

          {/* Search Input */}
          <div className="relative max-w-xl mx-auto" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                placeholder="Start typing to search..."
                className="w-full h-14 pl-12 pr-4 text-base bg-white border border-border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-xl shadow-elevated overflow-hidden z-50">
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
                      to="/admin/agents?tab=all"
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
        </div>

        {/* Quick Access Grid */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-4 text-center">
            Quick Access
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Contracting */}
            <Card
              className="group cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all"
              onClick={() => navigate('/admin/contracting')}
            >
              <div className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">Contracting</p>
                    {contractingQueueCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                        {contractingQueueCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Process applications</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Card>

            {/* RTS Import */}
            <Card
              className="group cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all"
              onClick={() => navigate('/admin/rts-import')}
            >
              <div className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">RTS Import</p>
                  <p className="text-sm text-muted-foreground">Upload carrier data</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Card>

            {/* All Agents */}
            <Card
              className="group cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all"
              onClick={() => navigate('/admin/agents?tab=all')}
            >
              <div className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">All Agents</p>
                  <p className="text-sm text-muted-foreground">View full directory</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Card>

            {/* Teams */}
            <Card
              className="group cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all"
              onClick={() => navigate('/admin/agents?tab=teams')}
            >
              <div className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">Teams</p>
                  <p className="text-sm text-muted-foreground">Manager hierarchy</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Card>
          </div>
        </div>

        {/* Add New Agent Button */}
        <div className="flex justify-center mb-12">
          <Button
            onClick={() => navigate('/admin/agents/new')}
            className="gap-2"
            size="lg"
          >
            <UserPlus className="w-5 h-5" />
            Add New Agent
          </Button>
        </div>

        {/* Stats Footer */}
        <div className="border-t border-border pt-8">
          <div className="text-center">
            <p className="text-3xl font-semibold text-foreground">
              {loading ? '—' : stats.totalAgents}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Total Agents</p>
          </div>
        </div>
      </main>
    </div>
  );
}
