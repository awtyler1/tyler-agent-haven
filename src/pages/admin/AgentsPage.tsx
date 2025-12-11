import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UserPlus, Search, Loader2, ArrowLeft, ChevronRight, Users } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import type { Profile } from '@/hooks/useProfile';

interface AgentWithRole extends Profile {
  role?: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
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

      const agentRoles = ['independent_agent', 'internal_tig_agent'];
      const agentsOnly = (profiles || [])
        .map(p => ({ ...p, role: roleMap[p.user_id] }))
        .filter(p => agentRoles.includes(p.role || ''));

      setAgents(agentsOnly as AgentWithRole[]);
    } catch (err) {
      console.error('Error fetching agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent => 
    agent.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string, label: string }> = {
      CONTRACTING_REQUIRED: { className: 'bg-muted text-muted-foreground', label: 'Needs Contracting' },
      CONTRACT_SUBMITTED: { className: 'bg-amber-100 text-amber-700', label: 'Pending Review' },
      APPOINTED: { className: 'bg-green-100 text-green-700', label: 'Appointed' },
      SUSPENDED: { className: 'bg-red-100 text-red-700', label: 'Suspended' },
    };
    const config = variants[status] || { className: 'bg-muted text-muted-foreground', label: status };
    return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.className}`}>{config.label}</span>;
  };

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
              <h1 className="heading-section">Agents</h1>
              <p className="text-sm text-muted-foreground">Manage all agents in the system</p>
            </div>
            <Link to="/admin/agents/new">
              <Button className="bg-gold hover:bg-gold/90 text-white">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Agent
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

          {/* Agents List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gold mb-3" />
              <p className="text-sm text-muted-foreground">Loading agents...</p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="bg-white border border-[#E5E2DB] rounded-xl p-12 text-center shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]">
              <div className="w-16 h-16 rounded-full bg-gold/8 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-gold" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No agents found</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery ? 'Try adjusting your search terms' : 'Add your first agent to get started'}
              </p>
              {!searchQuery && (
                <Link to="/admin/agents/new">
                  <Button className="bg-gold hover:bg-gold/90 text-white">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Agent
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAgents.map((agent) => (
                <Link key={agent.id} to={`/admin/users/${agent.user_id}`} className="group block">
                  <div className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] hover:border-gold/30 hover:-translate-y-0.5 transition-all duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground group-hover:text-gold transition-colors">
                          {agent.full_name || 'Unnamed Agent'}
                        </h3>
                        <p className="text-sm text-muted-foreground">{agent.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(agent.onboarding_status)}
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
