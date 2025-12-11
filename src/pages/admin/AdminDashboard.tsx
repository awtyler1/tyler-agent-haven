import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, FileText, Settings, UserCog } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface AdminCard {
  title: string;
  description: string;
  icon: typeof Users;
  href: string;
  color: string;
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
      // Fetch all profiles and roles
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
      color: 'text-blue-500',
      secondaryAction: {
        label: 'Add Agent',
        href: '/admin/agents/new',
      },
    },
    {
      title: 'Add New Agent',
      description: 'Create a new agent and send welcome email',
      icon: UserPlus,
      href: '/admin/agents/new',
      color: 'text-green-500',
    },
    {
      title: 'Contracting Queue',
      description: 'Review pending contracting submissions',
      icon: FileText,
      href: '/admin/contracting',
      color: 'text-amber-500',
    },
  ];

  if (isSuperAdmin()) {
    adminCards.unshift({
      title: 'Manage Managers',
      description: 'View and manage broker managers',
      icon: UserCog,
      href: '/admin/managers',
      color: 'text-indigo-500',
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
      color: 'text-purple-500',
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.full_name || 'Admin'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards.map((card) => (
            <Link key={card.href} to={card.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-border/50 hover:border-primary/20">
                <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                  <div className={`p-3 rounded-lg bg-muted ${card.color}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{card.description}</CardDescription>
                  {card.secondaryAction && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(card.secondaryAction!.href);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {card.secondaryAction.label}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.totalAgents}</div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-amber-500">{stats.pendingContracting}</div>
                <p className="text-sm text-muted-foreground">Pending Contracting</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-500">{stats.appointedAgents}</div>
                <p className="text-sm text-muted-foreground">Appointed Agents</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-indigo-500">{stats.brokerManagers}</div>
                <p className="text-sm text-muted-foreground">Broker Managers</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
