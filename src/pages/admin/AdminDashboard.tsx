import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, FileText, Settings, UserCog, ArrowRight, FileType } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface AdminCard {
  title: string;
  description: string;
  icon: typeof Users;
  href: string;
  secondaryAction?: {
    label: string;
    href: string;
  };
}

interface DashboardStats {
  totalAgents: number;
  pendingContracting: number;
  appointedAgents: number;
  brokerManagers: number;
}

export default function AdminDashboard() {
  const { profile, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
    pendingContracting: 0,
    appointedAgents: 0,
    brokerManagers: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');

      if (!profiles || !roles) return;

      const roleMap = roles.reduce((acc, r) => {
        acc[r.user_id] = r.role;
        return acc;
      }, {} as Record<string, string>);

      const agentRoles = ['independent_agent', 'internal_tig_agent'];
      const agents = profiles.filter(p => agentRoles.includes(roleMap[p.user_id] || ''));
      const managers = profiles.filter(p => roleMap[p.user_id] === 'manager');

      setStats({
        totalAgents: agents.length,
        pendingContracting: agents.filter(a => a.onboarding_status === 'CONTRACT_SUBMITTED').length,
        appointedAgents: agents.filter(a => a.onboarding_status === 'APPOINTED').length,
        brokerManagers: managers.length,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const adminCards: AdminCard[] = [
    {
      title: 'Manage Agents',
      description: 'View and manage all agents in the system',
      icon: Users,
      href: '/admin/agents',
      secondaryAction: {
        label: 'Add Agent',
        href: '/admin/agents/new',
      },
    },
    {
      title: 'Contracting Queue',
      description: 'Review pending contracting submissions',
      icon: FileText,
      href: '/admin/contracting',
    },
    {
      title: 'PDF Field Mapper',
      description: 'Map PDF form fields to application data',
      icon: FileType,
      href: '/admin/pdf-mapper',
    },
  ];

  if (isSuperAdmin()) {
    adminCards.unshift({
      title: 'Manage Managers',
      description: 'View and manage broker managers',
      icon: UserCog,
      href: '/admin/managers',
      secondaryAction: {
        label: 'Add Manager',
        href: '/admin/managers/new',
      },
    });
    adminCards.unshift({
      title: 'Super Admin Dashboard',
      description: 'Full platform control center',
      icon: Settings,
      href: '/admin/super',
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />
      
      <main className="flex-1 pt-28 pb-12">
        <div className="container-narrow px-6 md:px-12 lg:px-20">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="heading-display mb-2">Admin Dashboard</h1>
            <p className="text-body max-w-xl mx-auto">
              Welcome back, {profile?.full_name || 'Admin'}
            </p>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mx-auto mt-4"></div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            <div className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] text-center">
              <div className="text-3xl font-serif font-bold text-foreground">{stats.totalAgents}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Agents</p>
            </div>
            <div className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] text-center">
              <div className="text-3xl font-serif font-bold text-amber-600">{stats.pendingContracting}</div>
              <p className="text-xs text-muted-foreground mt-1">Pending Review</p>
            </div>
            <div className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] text-center">
              <div className="text-3xl font-serif font-bold text-green-600">{stats.appointedAgents}</div>
              <p className="text-xs text-muted-foreground mt-1">Appointed</p>
            </div>
            <div className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] text-center">
              <div className="text-3xl font-serif font-bold text-gold">{stats.brokerManagers}</div>
              <p className="text-xs text-muted-foreground mt-1">Managers</p>
            </div>
          </div>

          {/* Admin Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {adminCards.map((card) => (
              <Link key={card.href} to={card.href} className="group">
                <div className="h-full bg-white border border-[#E5E2DB] rounded-xl p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.15)] hover:border-gold/30 hover:-translate-y-1 transition-all duration-200">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gold/8 flex items-center justify-center flex-shrink-0">
                      <card.icon className="w-5 h-5 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-gold transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <span className="text-xs text-gold font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      View <ArrowRight className="w-3 h-3" />
                    </span>
                    
                    {card.secondaryAction && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 border-gold/30 text-gold hover:bg-gold hover:text-white hover:border-gold"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(card.secondaryAction!.href);
                        }}
                      >
                        <UserPlus className="h-3 w-3 mr-1.5" />
                        {card.secondaryAction.label}
                      </Button>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
