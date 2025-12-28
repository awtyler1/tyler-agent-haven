import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Search, 
  Loader2, 
  Eye, 
  Users,
  Shield,
  UserCog,
  User
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useViewMode } from '@/contexts/ViewModeContext';

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  onboarding_status: string;
}

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  super_admin: { label: 'Super Admin', icon: Shield, color: 'text-red-600 bg-red-50' },
  admin: { label: 'Admin', icon: Shield, color: 'text-amber-600 bg-amber-50' },
  manager: { label: 'Manager', icon: UserCog, color: 'text-blue-600 bg-blue-50' },
  internal_tig_agent: { label: 'TIG Agent', icon: User, color: 'text-green-600 bg-green-50' },
  independent_agent: { label: 'Independent', icon: User, color: 'text-purple-600 bg-purple-50' },
};

export default function ViewAsPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const { startImpersonating, impersonatedAgent } = useViewMode();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const roleMap = roles?.reduce((acc, r) => {
        acc[r.user_id] = r.role;
        return acc;
      }, {} as Record<string, string>) || {};

      const usersWithRoles: UserWithRole[] = (profiles || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        email: p.email,
        full_name: p.full_name,
        role: roleMap[p.user_id] || null,
        onboarding_status: p.onboarding_status,
      }));

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string | null) => {
    if (!role) return null;
    const config = ROLE_CONFIG[role];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const handleViewAs = (user: UserWithRole) => {
    startImpersonating({
      userId: user.user_id,
      fullName: user.full_name || 'Unknown',
      email: user.email || '',
      role: user.role,
    });
    navigate('/');
  };

  const uniqueRoles = [...new Set(users.map(u => u.role).filter(Boolean))];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 pt-28 pb-12">
        <div className="container-narrow px-6 md:px-12 lg:px-20">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/developer">
              <Button variant="ghost" size="icon" className="hover:bg-purple-100">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Eye className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Developer Tool</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">View As</h1>
              <p className="text-sm text-muted-foreground">
                Impersonate any user to test their experience
              </p>
            </div>
          </div>

          {/* Current Status */}
          {impersonatedAgent && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Currently viewing as:</strong> {impersonatedAgent.fullName} ({impersonatedAgent.email})
              </p>
            </div>
          )}

          {/* Filters */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Role Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRoleFilter(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  !roleFilter 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All ({users.length})
              </button>
              {uniqueRoles.map(role => {
                if (!role) return null;
                const config = ROLE_CONFIG[role];
                const count = users.filter(u => u.role === role).length;
                return (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      roleFilter === role 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {config?.label || role} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
              <p className="text-sm text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No users found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || roleFilter ? 'Try adjusting your filters' : 'No users in the system yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="bg-card border border-border rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-foreground truncate">
                          {user.full_name || 'Unnamed User'}
                        </h3>
                        {getRoleBadge(user.role)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewAs(user)}
                      className="shrink-0 border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View As
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results Count */}
          {!loading && filteredUsers.length > 0 && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

