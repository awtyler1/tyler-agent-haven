import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ArrowLeft, ChevronRight, UserCog, UserPlus } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import type { Profile } from '@/hooks/useProfile';

interface ManagerWithRole extends Profile {
  role?: string;
}

export default function ManagersPage() {
  const [managers, setManagers] = useState<ManagerWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
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

      const managersOnly = (profiles || [])
        .map(p => ({ ...p, role: roleMap[p.user_id] }))
        .filter(p => p.role === 'manager');

      setManagers(managersOnly as ManagerWithRole[]);
    } catch (err) {
      console.error('Error fetching managers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredManagers = managers.filter(manager => 
    manager.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    manager.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />
      
      <main className="flex-1 pt-28 pb-12">
        <div className="container-narrow px-6 md:px-12 lg:px-20">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="hover:bg-gold/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="heading-section">Managers</h1>
              <p className="text-sm text-muted-foreground">View and manage broker managers</p>
            </div>
            <Link to="/admin/managers/new">
              <Button className="bg-gold hover:bg-gold/90 text-white">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Manager
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="bg-white border border-[#E5E2DB] rounded-lg p-3 mb-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-0 focus-visible:ring-0 bg-transparent"
              />
            </div>
          </div>

          {/* Managers List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gold mb-3" />
              <p className="text-sm text-muted-foreground">Loading managers...</p>
            </div>
          ) : filteredManagers.length === 0 ? (
            <div className="bg-white border border-[#E5E2DB] rounded-xl p-12 text-center shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]">
              <div className="w-16 h-16 rounded-full bg-gold/8 flex items-center justify-center mx-auto mb-4">
                <UserCog className="w-7 h-7 text-gold" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No managers found</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery ? 'Try adjusting your search terms' : 'Add your first manager to get started'}
              </p>
              {!searchQuery && (
                <Link to="/admin/managers/new">
                  <Button className="bg-gold hover:bg-gold/90 text-white">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Manager
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredManagers.map((manager) => (
                <Link key={manager.id} to={`/admin/users/${manager.user_id}`} className="group block">
                  <div className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] hover:border-gold/30 hover:-translate-y-0.5 transition-all duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground group-hover:text-gold transition-colors">
                          {manager.full_name || 'Unnamed Manager'}
                        </h3>
                        <p className="text-sm text-muted-foreground">{manager.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${manager.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                          {manager.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
