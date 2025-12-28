# Handoff Files

## src/components/Navigation.tsx

```tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, Shield, LogIn, LogOut, Code } from "lucide-react";
import { AgentProfileDropdown } from "./AgentProfileDropdown";
import { AgentViewToggle } from "./AgentViewToggle";
import tylerLogo from "@/assets/tyler-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useViewMode } from "@/contexts/ViewModeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DarkModeToggle } from "@/components/DarkModeToggle";

const navLinks = [
  { name: "Dashboard", href: "/" },
  { name: "Onboarding", href: "/start-here" },
  { name: "Contracting Hub", href: "/contracting-hub" },
  { name: "Certifications", href: "/certifications" },
  { name: "Training Hub", href: "/sales-training" },
  { name: "Agent Tools", href: "/agent-tools" },
  { name: "Compliance", href: "/compliance" },
  { name: "Support", href: "/contact" },
];

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { canAccessAdmin, canAccessDeveloper, isAuthenticated, isAgent, isContractingRequired } = useAuth();
  const { isViewingAsAgent } = useViewMode();
  const navigate = useNavigate();

  // Hide navigation for agents who need to complete contracting
  const showFullNavigation = !isAgent() || !isContractingRequired;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.log('Logout error:', error);
    }
    // Force clear all Supabase auth data from localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    toast.success("Logged out successfully");
    // Force a full page reload to clear all cached state
    window.location.href = '/auth';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container-narrow mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={tylerLogo} 
              alt="Tyler Insurance Group" 
              className="h-14 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-5">
            {showFullNavigation && navLinks.map((link) => (
              <div 
                key={link.name} 
                className="relative group"
                onMouseEnter={() => (('submenu' in link && link.submenu) || ('sections' in link && link.sections)) && setOpenSubmenu(link.name)}
                onMouseLeave={() => setOpenSubmenu(null)}
              >
                <Link
                  to={link.href}
                  onClick={() => window.scrollTo(0, 0)}
                  className="text-[13px] font-medium text-muted-foreground hover:text-gold transition-smooth tracking-wide flex items-center gap-1 whitespace-nowrap"
                >
                  {link.name}
                  {(('submenu' in link && link.submenu) || ('sections' in link && link.sections)) && <ChevronDown size={12} className="transition-transform group-hover:rotate-180" />}
                </Link>
                
                {'submenu' in link && link.submenu && openSubmenu === link.name && Array.isArray(link.submenu) && (
                  <div className="absolute top-full left-0 pt-2 w-56 animate-fade-in">
                    <div className="bg-background border border-border rounded-lg shadow-elevated py-2">
                      {(link.submenu as Array<{name: string; href: string; external?: boolean}>).map((subitem) => (
                        'external' in subitem && subitem.external ? (
                          <a
                            key={subitem.name}
                            href={subitem.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:bg-muted transition-smooth"
                          >
                            {subitem.name}
                          </a>
                        ) : (
                          <Link
                            key={subitem.name}
                            to={subitem.href}
                            className="block px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:bg-muted transition-smooth"
                          >
                            {subitem.name}
                          </Link>
                        )
                      ))}
                    </div>
                  </div>
                )}
                
                {'sections' in link && link.sections && openSubmenu === link.name && Array.isArray(link.sections) && (
                  <div className="absolute top-full left-0 pt-2 w-64 animate-fade-in">
                    <div className="bg-background border border-border rounded-lg shadow-elevated py-2">
                      {link.sections.map((section, sectionIndex) => (
                        <div key={section.title}>
                          {sectionIndex > 0 && <div className="border-t border-border my-2" />}
                          <p className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold">{section.title}</p>
                          {section.items.map((item) => (
                            item.external ? (
                              <a
                                key={item.name}
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:bg-muted transition-smooth"
                              >
                                {item.name}
                              </a>
                            ) : (
                              <Link
                                key={item.name}
                                to={item.href}
                                className="block px-4 py-2 text-sm text-muted-foreground hover:text-gold hover:bg-muted transition-smooth"
                              >
                                {item.name}
                              </Link>
                            )
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Agent View Toggle - Only for admins */}
            <AgentViewToggle />

            {/* Admin Link - Only for admins, hidden in agent view */}
            {canAccessAdmin() && !isViewingAsAgent && (
              <Link
                to="/admin"
                className="text-[13px] font-medium text-primary hover:text-gold transition-smooth tracking-wide flex items-center gap-1.5 whitespace-nowrap"
              >
                <Shield size={14} />
                Admin
              </Link>
            )}

            {/* Developer Link - Only for developers */}
            {canAccessDeveloper() && (
              <Link
                to="/developer"
                className="text-[13px] font-medium text-purple-600 hover:text-purple-700 transition-smooth tracking-wide flex items-center gap-1.5 whitespace-nowrap"
              >
                <Code size={14} />
                Dev
              </Link>
            )}

            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {/* Profile Dropdown - For authenticated users */}
            {isAuthenticated ? (
              <AgentProfileDropdown />
            ) : (
              <Link
                to="/auth"
                className="text-[13px] font-medium text-primary hover:text-gold transition-smooth tracking-wide flex items-center gap-1.5 whitespace-nowrap"
              >
                <LogIn size={14} />
                Log In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-foreground hover:text-gold transition-smooth"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-6 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              {showFullNavigation && navLinks.map((link) => (
                <div key={link.name}>
                  <Link
                    to={link.href}
                    onClick={() => !('submenu' in link && link.submenu) && setIsOpen(false)}
                    className="text-base font-medium text-muted-foreground hover:text-gold transition-smooth tracking-wide uppercase py-2 block"
                  >
                    {link.name}
                  </Link>
                  {'submenu' in link && link.submenu && Array.isArray(link.submenu) && (
                    <div className="pl-4 border-l border-border ml-2">
                      {(link.submenu as Array<{name: string; href: string; external?: boolean}>).map((subitem) => (
                        'external' in subitem && subitem.external ? (
                          <a
                            key={subitem.name}
                            href={subitem.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsOpen(false)}
                            className="text-sm text-muted-foreground hover:text-gold transition-smooth py-1.5 block"
                          >
                            {subitem.name}
                          </a>
                        ) : (
                          <Link
                            key={subitem.name}
                            to={subitem.href}
                            onClick={() => setIsOpen(false)}
                            className="text-sm text-muted-foreground hover:text-gold transition-smooth py-1.5 block"
                          >
                            {subitem.name}
                          </Link>
                        )
                      ))}
                    </div>
                  )}
                  {'sections' in link && link.sections && Array.isArray(link.sections) && (
                    <div className="pl-4 border-l border-border ml-2">
                      {link.sections.map((section) => (
                        <div key={section.title} className="mt-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gold py-1">{section.title}</p>
                          {section.items.map((item) => (
                            item.external ? (
                              <a
                                key={item.name}
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-muted-foreground hover:text-gold transition-smooth py-1.5 block"
                              >
                                {item.name}
                              </a>
                            ) : (
                              <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-muted-foreground hover:text-gold transition-smooth py-1.5 block"
                              >
                                {item.name}
                              </Link>
                            )
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Admin Link - Only for admins */}
              {canAccessAdmin() && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="text-base font-medium text-primary hover:text-gold transition-smooth tracking-wide uppercase py-2 flex items-center gap-2"
                >
                  <Shield size={16} />
                  Admin
                </Link>
              )}

              {/* Developer Link - Only for developers */}
              {canAccessDeveloper() && (
                <Link
                  to="/developer"
                  onClick={() => setIsOpen(false)}
                  className="text-base font-medium text-purple-600 hover:text-purple-700 transition-smooth tracking-wide uppercase py-2 flex items-center gap-2"
                >
                  <Code size={16} />
                  Developer
                </Link>
              )}

              {/* Dark Mode Toggle */}
              <div className="py-2">
                <DarkModeToggle />
              </div>

              {/* Auth Link */}
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="text-base font-medium text-muted-foreground hover:text-gold transition-smooth tracking-wide uppercase py-2 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsOpen(false)}
                  className="text-base font-medium text-primary hover:text-gold transition-smooth tracking-wide uppercase py-2 flex items-center gap-2"
                >
                  <LogIn size={16} />
                  Log In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
```

## src/pages/developer/DeveloperDashboard.tsx

```tsx
import { Link } from 'react-router-dom';
import { 
  Code, 
  Flag, 
  Database, 
  FileText, 
  Activity,
  Settings,
  ArrowRight,
  Shield,
  TestTube,
  Map,
  UserPlus
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';

interface DevToolCard {
  title: string;
  description: string;
  icon: typeof Code;
  href: string;
  status?: 'stable' | 'beta' | 'new';
}

export default function DeveloperDashboard() {
  const { profile } = useAuth();

  const devTools: DevToolCard[] = [
    {
      title: 'Feature Flags',
      description: 'Toggle features on/off without deploying code',
      icon: Flag,
      href: '/developer/feature-flags',
      status: 'new',
    },
    {
      title: 'PDF Field Audit',
      description: 'Analyze form fields in the contracting PDF template',
      icon: FileText,
      href: '/developer/pdf-audit',
      status: 'stable',
    },
    {
      title: 'PDF Field Mapper',
      description: 'Map PDF form fields to application data',
      icon: Database,
      href: '/developer/pdf-mapper',
      status: 'stable',
    },
    {
      title: 'PDF Field Extractor',
      description: 'Extract field names from any fillable PDF',
      icon: FileText,
      href: '/developer/pdf-extractor',
      status: 'stable',
    },
    {
      title: 'System Health',
      description: 'Monitor Supabase connection, Edge Functions, storage',
      icon: Activity,
      href: '/developer/system-health',
      status: 'beta',
    },
    {
      title: 'Platform Map',
      description: 'Visual overview of all platform pages and routes',
      icon: Map,
      href: '/developer/platform-map',
      status: 'stable',
    },
    {
      title: 'Test Data Seeder',
      description: 'Create fake contracting submissions for testing',
      icon: UserPlus,
      href: '/developer/test-seeder',
      status: 'new',
    },
    {
      title: 'Platform Experience Map',
      description: 'Complete user journey across Agent, Head of Contracting, and Admin roles',
      icon: Map,
      href: '/developer/experience-map',
      status: 'new',
    },
  ];

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const styles: Record<string, string> = {
      stable: 'bg-green-100 text-green-700',
      beta: 'bg-amber-100 text-amber-700',
      new: 'bg-blue-100 text-blue-700',
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <main className="flex-1 pt-28 pb-16">
        <div className="container-narrow mx-auto px-6 md:px-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Code className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wide">Developer Mode</span>
            </div>
            <h1 className="text-4xl font-display font-bold text-foreground mb-4">
              Developer Dashboard
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Internal tools for testing, debugging, and platform configuration
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-sm text-muted-foreground">Access Level</p>
              <p className="text-lg font-semibold text-foreground">Developer</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">Environment</p>
              <p className="text-lg font-semibold text-foreground">Production</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flag className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-sm text-muted-foreground">Feature Flags</p>
              <p className="text-lg font-semibold text-foreground">5 Active</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TestTube className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-sm text-muted-foreground">Test Mode</p>
              <p className="text-lg font-semibold text-foreground">Off</p>
            </div>
          </div>

          {/* Dev Tools Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {devTools.map((tool) => (
              <Link
                key={tool.title}
                to={tool.href}
                className="group bg-card border border-border rounded-xl p-6 hover:border-purple-400 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <tool.icon className="h-6 w-6 text-purple-600" />
                    </div>
                    {getStatusBadge(tool.status)}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    {tool.description}
                  </p>
                  
                  <div className="mt-4 flex items-center text-purple-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                    <span>
                      Open <ArrowRight className="inline h-4 w-4 ml-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Back to Admin Link */}
          <div className="text-center">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
```

## src/pages/admin/AgentsPage.tsx

```tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UserPlus, Search, Loader2, ArrowLeft, ChevronRight, Users, Eye } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useViewMode } from '@/contexts/ViewModeContext';
import type { Profile } from '@/hooks/useProfile';

interface AgentWithRole extends Profile {
  role?: string;
  is_test?: boolean;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { startImpersonating } = useViewMode();
  const navigate = useNavigate();

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
      CONTRACTING_SUBMITTED: { className: 'bg-amber-100 text-amber-700', label: 'Pending Review' },
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
                <div key={agent.id} className="bg-white border border-[#E5E2DB] rounded-lg p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_20px_-3px_rgba(0,0,0,0.12)] hover:border-gold/30 hover:-translate-y-0.5 transition-all duration-150">
                  <div className="flex items-center justify-between">
                    <Link to={`/admin/users/${agent.user_id}`} className="flex-1 group">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground group-hover:text-gold transition-colors">
                          {agent.full_name || 'Unnamed Agent'}
                        </h3>
                        {agent.is_test && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                            TEST
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{agent.email}</p>
                    </Link>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(agent.onboarding_status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          startImpersonating({
                            userId: agent.user_id,
                            fullName: agent.full_name || 'Unknown',
                            email: agent.email || '',
                          });
                          navigate('/');
                        }}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                        title="View as this agent"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Link to={`/admin/users/${agent.user_id}`}>
                        <ChevronRight className="h-5 w-5 text-muted-foreground/40 hover:text-gold hover:translate-x-0.5 transition-all" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
```

## src/hooks/useAuth.ts

```tsx
import { useProfile } from './useProfile';
import { useRole } from './useRole';
import { useDeveloperAccess } from './useDeveloperAccess';

export function useAuth() {
  const profile = useProfile();
  const role = useRole();
  const developer = useDeveloperAccess(profile.user?.id);

  const loading = profile.loading || role.loading || developer.loading;

  // Determine where user should be routed after login
  const getDefaultRoute = (): string => {
    // If not authenticated, go to auth
    if (!profile.isAuthenticated) {
      return '/auth';
    }

    // If agent needs contracting, send to contracting
    if (role.isAgent() && profile.isContractingRequired) {
      return '/contracting';
    }

    // If admin, can access admin dashboard
    if (role.canAccessAdmin()) {
      return '/admin';
    }

    // Default to main dashboard
    return '/';
  };

  // Check if user can access a specific route
  const canAccessRoute = (route: string): boolean => {
    if (!profile.isAuthenticated) {
      return route === '/auth';
    }

    // Developer routes
    if (route.startsWith('/developer')) {
      return developer.hasDeveloperAccess;
    }

    // Admin routes
    if (route.startsWith('/admin')) {
      return role.canAccessAdmin();
    }

    // Agent in contracting mode can only access contracting
    if (role.isAgent() && profile.isContractingRequired) {
      return route === '/contracting' || route === '/auth';
    }

    return true;
  };

  // Check if user has developer access
  const hasDeveloperAccess = (): boolean => {
    return developer.hasDeveloperAccess;
  };

  // Check if user can access developer tools
  const canAccessDeveloper = (): boolean => {
    return profile.isAuthenticated && developer.hasDeveloperAccess;
  };

  return {
    // Profile exports
    ...profile,

    // Role exports
    ...role,

    // Developer access
    hasDeveloperAccess,
    canAccessDeveloper,

    // Combined
    loading,
    getDefaultRoute,
    canAccessRoute,
  };
}
```

## src/hooks/useUserManagement.ts

```tsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ManagedUser {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  onboarding_status: string;
  created_at: string;
  setup_link_sent_at: string | null;
  password_created_at: string | null;
  first_login_at: string | null;
  role: string | null;
  is_active: boolean;
}

export function useUserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      const roleMap = roles?.reduce((acc, r) => {
        acc[r.user_id] = r.role;
        return acc;
      }, {} as Record<string, string>) || {};

      const usersWithRoles: ManagedUser[] = (profiles || []).map(p => ({
        id: p.id,
        user_id: p.user_id,
        email: p.email,
        full_name: p.full_name,
        onboarding_status: p.onboarding_status,
        created_at: p.created_at,
        setup_link_sent_at: p.setup_link_sent_at,
        password_created_at: p.password_created_at,
        first_login_at: p.first_login_at,
        role: roleMap[p.user_id] || null,
        is_active: p.is_active ?? true,
      }));

      setUsers(usersWithRoles);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = async (data: { email: string; fullName: string; role: string; managerId?: string; sendSetupEmail?: boolean }) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('create-agent', {
        body: {
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          managerId: data.managerId || null,
          sendSetupEmail: data.sendSetupEmail ?? true,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      const message = data.sendSetupEmail 
        ? 'User created and setup email sent'
        : 'User created successfully';
      toast.success(message);
      await fetchUsers();
      return { success: true, userId: result.userId };
    } catch (err: any) {
      toast.error(`Failed to create user: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

  const sendSetupLink = async (userId: string) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-setup-link', {
        body: { userId },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      toast.success('Setup link sent successfully');
      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      toast.error(`Failed to send setup link: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

  const updateUserRole = async (userId: string, newRole: 'super_admin' | 'admin' | 'manager' | 'internal_tig_agent' | 'independent_agent') => {
    try {
      // Delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      toast.success('Role updated successfully');
      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      toast.error(`Failed to update role: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(isActive ? 'Account activated' : 'Account deactivated');
      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      toast.error(`Failed to update account status: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

  const updateUserProfile = async (userId: string, data: { full_name?: string; email?: string }) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Profile updated successfully');
      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      toast.error(`Failed to update profile: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    sendSetupLink,
    updateUserRole,
    toggleUserActive,
    updateUserProfile,
  };
}
```

## src/App.tsx

```tsx
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { TestModeBanner } from "./components/TestModeBanner";
import { ViewModeBanner } from "./components/ViewModeBanner";
import { ViewModeProvider } from "./contexts/ViewModeContext";
import { FeatureFlagsProvider } from "./contexts/FeatureFlagsContext";
import { AgentChatWidget } from "./components/AgentChatWidget";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import SetPasswordPage from "./pages/auth/SetPasswordPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import StartHerePage from "./pages/StartHerePage";
import IndustryUpdatesPage from "./pages/IndustryUpdatesPage";
import SalesTrainingPage from "./pages/SalesTrainingPage";
import SalesTrainingModulePage from "./pages/SalesTrainingModulePage";
import TrainingLibraryPage from "./pages/TrainingLibraryPage";
import MedicareFundamentalsPage from "./pages/MedicareFundamentalsPage";
import CompliancePage from "./pages/CompliancePage";
import CarrierResourcesPage from "./pages/CarrierResourcesPage";
import AgentToolsPage from "./pages/AgentToolsPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import ContractingHubPage from "./pages/ContractingHubPage";
import CertificationsPage from "./pages/CertificationsPage";
import FormsLibraryPage from "./pages/FormsLibraryPage";
import CarrierPortalsPage from "./pages/CarrierPortalsPage";
import CarrierPlansPage from "./pages/CarrierPlansPage";
import DocumentManagementPage from "./pages/DocumentManagementPage";
import NotFound from "./pages/NotFound";

// Agent-specific pages
import ContractingPage from "./pages/ContractingPage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AgentsPage from "./pages/admin/AgentsPage";
import ManagersPage from "./pages/admin/ManagersPage";
import NewManagerPage from "./pages/admin/NewManagerPage";
import UserDetailPage from "./pages/admin/UserDetailPage";
import PlatformMapPage from "./pages/admin/PlatformMapPage";
import NewAgentPage from "./pages/admin/NewAgentPage";
import PdfFieldExtractorPage from "./pages/admin/PdfFieldExtractorPage";
import PdfFieldMapperPage from "./pages/admin/PdfFieldMapperPage";
import ContractingQueuePage from "./pages/admin/ContractingQueuePage";
import PdfFieldAuditPage from "./pages/admin/PdfFieldAuditPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import HierarchyManagementPage from "./pages/admin/HierarchyManagementPage";

// Developer pages
import DeveloperDashboard from "./pages/developer/DeveloperDashboard";
import FeatureFlagsPage from "./pages/developer/FeatureFlagsPage";
import SystemHealthPage from "./pages/developer/SystemHealthPage";
import TestDataSeederPage from "./pages/developer/TestDataSeederPage";
import PlatformExperienceMapPage from "./pages/developer/PlatformExperienceMapPage";

const queryClient = new QueryClient();

// Component to handle recovery token redirects
function RecoveryRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if this is a recovery redirect (has type=recovery in hash)
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      // Redirect to set-password page while preserving the hash
      navigate('/auth/set-password' + hash, { replace: true });
    }
  }, [navigate, location]);

  return null;
}

// Conditionally show chat widget (hide during contracting flow and auth pages)
function ConditionalChatWidget() {
  const location = useLocation();
  const hiddenPaths = ['/contracting', '/auth'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));
  
  if (shouldHide) return null;
  return <AgentChatWidget />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FeatureFlagsProvider>
      <ViewModeProvider>
        <TooltipProvider>
          <ViewModeBanner />
          <TestModeBanner />
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <RecoveryRedirectHandler />
          <Routes>
            {/* Auth */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/set-password" element={<SetPasswordPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Agent contracting (accessible only to agents needing contracting) */}
            <Route 
              path="/contracting" 
              element={
                <ProtectedRoute requireAgent allowContractingOnly>
                  <ContractingPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users/:userId" 
              element={<UserDetailPage />} 
            />
            <Route 
              path="/admin/platform-map" 
              element={<PlatformMapPage />} 
            />
            <Route 
              path="/admin/pdf-extractor" 
              element={
                <ProtectedRoute requireSuperAdmin>
                  <PdfFieldExtractorPage />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/admin/agents" 
              element={
                <ProtectedRoute requireAdmin>
                  <AgentsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/managers" 
              element={
                <ProtectedRoute requireSuperAdmin>
                  <ManagersPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/managers/new" 
              element={
                <ProtectedRoute requireSuperAdmin>
                  <NewManagerPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/agents/new" 
              element={
                <ProtectedRoute requireAdmin>
                  <NewAgentPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/contracting" 
              element={
                <ProtectedRoute requireAdmin>
                  <ContractingQueuePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/pdf-mapper" 
              element={
                <ProtectedRoute requireAdmin>
                  <PdfFieldMapperPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/pdf-audit" 
              element={
                <ProtectedRoute requireAdmin>
                  <PdfFieldAuditPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/hierarchy" 
              element={
                <ProtectedRoute requireAdmin>
                  <HierarchyManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminSettingsPage />
                </ProtectedRoute>
              } 
            />

            {/* Developer routes */}
            <Route 
              path="/developer" 
              element={
                <ProtectedRoute requireDeveloper>
                  <DeveloperDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/feature-flags" 
              element={
                <ProtectedRoute requireDeveloper>
                  <FeatureFlagsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/system-health" 
              element={
                <ProtectedRoute requireDeveloper>
                  <SystemHealthPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/pdf-extractor" 
              element={
                <ProtectedRoute requireDeveloper>
                  <PdfFieldExtractorPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/pdf-mapper" 
              element={
                <ProtectedRoute requireDeveloper>
                  <PdfFieldMapperPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/pdf-audit" 
              element={
                <ProtectedRoute requireDeveloper>
                  <PdfFieldAuditPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/platform-map" 
              element={
                <ProtectedRoute requireDeveloper>
                  <PlatformMapPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/test-seeder" 
              element={
                <ProtectedRoute requireDeveloper>
                  <TestDataSeederPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/developer/experience-map" 
              element={
                <ProtectedRoute requireDeveloper>
                  <PlatformExperienceMapPage />
                </ProtectedRoute>
              } 
            />

            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/start-here" element={<ProtectedRoute><StartHerePage /></ProtectedRoute>} />
            <Route path="/contracting-hub" element={<ProtectedRoute><ContractingHubPage /></ProtectedRoute>} />
            <Route path="/industry-updates" element={<ProtectedRoute><IndustryUpdatesPage /></ProtectedRoute>} />
            <Route path="/sales-training" element={<ProtectedRoute><SalesTrainingPage /></ProtectedRoute>} />
            <Route path="/sales-training-module" element={<ProtectedRoute><SalesTrainingModulePage /></ProtectedRoute>} />
            <Route path="/training-library" element={<ProtectedRoute><TrainingLibraryPage /></ProtectedRoute>} />
            <Route path="/medicare-fundamentals" element={<ProtectedRoute><MedicareFundamentalsPage /></ProtectedRoute>} />
            <Route path="/compliance" element={<ProtectedRoute><CompliancePage /></ProtectedRoute>} />
            <Route path="/carrier-resources" element={<ProtectedRoute><CarrierResourcesPage /></ProtectedRoute>} />
            <Route path="/carrier-resources/plans" element={<ProtectedRoute><CarrierPlansPage /></ProtectedRoute>} />
            <Route path="/agent-tools" element={<ProtectedRoute><AgentToolsPage /></ProtectedRoute>} />
            <Route path="/certifications" element={<ProtectedRoute><CertificationsPage /></ProtectedRoute>} />
            <Route path="/forms-library" element={<ProtectedRoute><FormsLibraryPage /></ProtectedRoute>} />
            <Route path="/carrier-portals" element={<ProtectedRoute><CarrierPortalsPage /></ProtectedRoute>} />
            <Route path="/admin/documents" element={<ProtectedRoute requireAdmin><DocumentManagementPage /></ProtectedRoute>} />
            <Route path="/contact" element={<ProtectedRoute><ContactPage /></ProtectedRoute>} />
            <Route path="/about" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ConditionalChatWidget />
        </BrowserRouter>
      </TooltipProvider>
    </ViewModeProvider>
  </FeatureFlagsProvider>
  </QueryClientProvider>
);

export default App;
```

## src/contexts/ViewModeContext.tsx

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ImpersonatedAgent {
  userId: string;
  fullName: string;
  email: string;
}

interface ViewModeContextType {
  // Agent View Mode (simple toggle - your data, agent UI)
  isAgentViewMode: boolean;
  toggleAgentViewMode: () => void;
  
  // Impersonation (specific agent's data)
  impersonatedAgent: ImpersonatedAgent | null;
  startImpersonating: (agent: ImpersonatedAgent) => void;
  stopImpersonating: () => void;
  
  // Combined check - are we in any kind of agent view?
  isViewingAsAgent: boolean;
  
  // Get the effective user ID for queries (impersonated or real)
  getEffectiveUserId: (realUserId: string) => string;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [isAgentViewMode, setIsAgentViewMode] = useState(false);
  const [impersonatedAgent, setImpersonatedAgent] = useState<ImpersonatedAgent | null>(null);

  // Persist to localStorage so it survives page refreshes
  useEffect(() => {
    const stored = localStorage.getItem('viewMode');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setIsAgentViewMode(parsed.isAgentViewMode || false);
        setImpersonatedAgent(parsed.impersonatedAgent || null);
      } catch (e) {
        console.error('Error parsing viewMode from localStorage:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('viewMode', JSON.stringify({
      isAgentViewMode,
      impersonatedAgent,
    }));
  }, [isAgentViewMode, impersonatedAgent]);

  const toggleAgentViewMode = () => {
    setIsAgentViewMode(prev => !prev);
    // Clear impersonation when toggling simple mode
    if (!isAgentViewMode) {
      setImpersonatedAgent(null);
    }
  };

  const startImpersonating = (agent: ImpersonatedAgent) => {
    setImpersonatedAgent(agent);
    setIsAgentViewMode(false); // Impersonation takes precedence
  };

  const stopImpersonating = () => {
    setImpersonatedAgent(null);
  };

  const isViewingAsAgent = isAgentViewMode || impersonatedAgent !== null;

  const getEffectiveUserId = (realUserId: string): string => {
    if (impersonatedAgent) {
      return impersonatedAgent.userId;
    }
    return realUserId;
  };

  return (
    <ViewModeContext.Provider value={{
      isAgentViewMode,
      toggleAgentViewMode,
      impersonatedAgent,
      startImpersonating,
      stopImpersonating,
      isViewingAsAgent,
      getEffectiveUserId,
    }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
```

## src/pages/admin/NewAgentPage.tsx

```tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, UserPlus, Users, Info } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface HierarchyOption {
  id: string;
  label: string;
  type: 'team';
  entityId: string;
}

export default function NewAgentPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hierarchyOptions, setHierarchyOptions] = useState<HierarchyOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    hierarchyId: '',
    agentType: 'new' as 'new' | 'existing',
    sendSetupEmail: true,
  });

  useEffect(() => {
    fetchHierarchyOptions();
  }, []);

  const fetchHierarchyOptions = async () => {
    setLoadingOptions(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Step 1: Get entity IDs this user owns
      const { data: ownerships, error: ownerError } = await supabase
        .from('entity_owners')
        .select('entity_id')
        .eq('user_id', user.id);

      if (ownerError) throw ownerError;

      if (!ownerships || ownerships.length === 0) {
        setHierarchyOptions([]);
        return;
      }

      const entityIds = ownerships.map(o => o.entity_id);

      // Step 2: Fetch those entities that are active teams
      const { data: teams, error: teamsError } = await supabase
        .from('hierarchy_entities')
        .select('id, name')
        .in('id', entityIds)
        .eq('entity_type', 'team')
        .eq('is_active', true);

      if (teamsError) throw teamsError;

      const options: HierarchyOption[] = (teams || []).map(team => ({
        id: `team-${team.id}`,
        label: team.name,
        type: 'team' as const,
        entityId: team.id,
      }));

      setHierarchyOptions(options);
    } catch (err) {
      console.error('Error fetching hierarchy options:', err);
      toast.error('Failed to load hierarchy options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.hierarchyId) {
      toast.error('Please select a team');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user and session for upline and auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated. Please sign in again.');
      }

      // Ensure we have a valid session - supabase.functions.invoke() will use this automatically
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        console.error('Session error:', sessionError);
        // Try to refresh the session
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshedSession?.access_token) {
          throw new Error('Session expired. Please sign in again.');
        }
      }
      
      // Verify we have a valid session before proceeding
      const currentSession = await supabase.auth.getSession();
      if (!currentSession.data.session?.access_token) {
        throw new Error('No valid session. Please sign in again.');
      }

      // Verify user has admin role (optional check for better error message)
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['super_admin', 'admin']);
      
      console.log('User roles check:', { 
        userId: user.id, 
        roles: userRoles?.map(r => r.role) || [], 
        hasAdmin: (userRoles?.length || 0) > 0,
        rolesError: rolesError?.message 
      });
      
      if (rolesError) {
        console.warn('Could not verify user roles:', rolesError);
      } else if (!userRoles || userRoles.length === 0) {
        throw new Error('You do not have admin permissions. Please contact a system administrator.');
      }

      const selectedOption = hierarchyOptions.find(o => o.id === formData.hierarchyId);
      
      if (!selectedOption) {
        throw new Error('Invalid team selection');
      }

      const requestBody = {
        email: formData.email,
        fullName: formData.fullName,
        hierarchyType: 'team' as const,
        hierarchyEntityId: selectedOption.entityId,
        uplineUserId: user.id,  // Always set to current user
        isExistingAgent: formData.agentType === 'existing',
        sendSetupEmail: formData.sendSetupEmail,
      };

      console.log('Calling create-agent with body:', requestBody);
      console.log('User ID:', user.id);

      // Get current session first
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      // Check if session exists and is valid
      if (!initialSession?.access_token) {
        throw new Error('No valid session. Please sign in again.');
      }
      
      // Check if session is expired or about to expire (within 1 minute)
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = initialSession.expires_at || 0;
      const timeUntilExpiry = expiresAt - now;
      
      console.log('Current session - expires at:', new Date(expiresAt * 1000).toISOString());
      console.log('Time until expiry (seconds):', timeUntilExpiry);
      
      // Try to refresh if expired or expiring soon
      let sessionToUse = initialSession;
      if (timeUntilExpiry < 60) {
        console.log('Session expiring soon, attempting refresh...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Failed to refresh session:', refreshError);
          // Don't throw here - try with current session first
        } else if (refreshedSession?.access_token) {
          sessionToUse = refreshedSession;
          console.log('Session refreshed successfully');
        }
      }
      
      console.log('Using session token - length:', sessionToUse.access_token.length);
      console.log('Token expires at:', sessionToUse.expires_at ? new Date(sessionToUse.expires_at * 1000).toISOString() : 'N/A');

      // Use supabase.functions.invoke() which handles JWT automatically
      // It will use the current session's access token from the Supabase client
      const { data, error } = await supabase.functions.invoke('create-agent', {
        body: requestBody,
      });

      if (error) {
        console.error('Supabase function error (full):', JSON.stringify(error, null, 2));
        console.error('Error type:', typeof error);
        console.error('Error keys:', Object.keys(error || {}));
        console.error('Error message:', error?.message);
        console.error('Error context:', error?.context);
        
        // If it's a 401, try fetching directly to get the actual error message
        if (error?.message?.includes('401') || error?.message?.includes('non-2xx')) {
          console.log('Got 401 error, trying direct fetch to get error details...');
          try {
            // Get the latest session for the direct fetch
            const { data: { session: fetchSession } } = await supabase.auth.getSession();
            if (!fetchSession?.access_token) {
              throw new Error('No valid session available');
            }
            
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const directResponse = await fetch(`${supabaseUrl}/functions/v1/create-agent`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${fetchSession.access_token}`,
              },
              body: JSON.stringify(requestBody),
            });
            
            const errorText = await directResponse.text();
            console.error('Direct fetch error response:', errorText);
            
            try {
              const errorJson = JSON.parse(errorText);
              if (errorJson.message === 'Invalid JWT') {
                throw new Error('Your session token is invalid. Please sign out and sign back in, then try again.');
              }
              throw new Error(errorJson.message || errorJson.error || 'Authentication failed. Please sign in again.');
            } catch (parseError) {
              if (errorText.includes('Invalid JWT')) {
                throw new Error('Your session token is invalid. Please sign out and sign back in, then try again.');
              }
              throw new Error(errorText || 'Authentication failed. Please sign in again.');
            }
          } catch (fetchError: any) {
            // If direct fetch also fails, use the original error
            console.error('Direct fetch also failed:', fetchError);
          }
        }
        
        // Extract error message from various formats
        let errorMessage = 'Failed to create agent';
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.context?.message) {
          errorMessage = error.context.message;
        } else if (error.error) {
          errorMessage = error.error;
        }
        
        throw new Error(errorMessage);
      }

      // Check if the response contains an error (non-2xx status)
      if (data && typeof data === 'object' && 'error' in data) {
        console.error('Function returned error in response:', data.error);
        throw new Error(data.error || 'Failed to create agent');
      }

      // Check if the response contains an error
      if (data && 'error' in data) {
        console.error('Function returned error in response:', data.error);
        throw new Error(data.error || 'Failed to create agent');
      }

      const message = formData.agentType === 'existing' 
        ? 'Existing agent added successfully!' 
        : 'New agent created! They will receive a welcome email with setup instructions.';
      
      toast.success(message);
      navigate('/admin/agents');
    } catch (err: any) {
      console.error('Error creating agent:', err);
      
      // Extract error message from various possible error formats
      let errorMessage = 'Failed to create agent';
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error) {
        errorMessage = err.error;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.data?.error) {
        errorMessage = err.data.error;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />
      
      <main className="flex-1 pt-28 pb-12">
        <div className="max-w-xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/admin/agents">
              <Button variant="ghost" size="icon" className="hover:bg-gold/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="heading-section">Add Agent</h1>
              <p className="text-sm text-muted-foreground">Create a new agent account</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-[#E5E2DB] rounded-xl p-6 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-gold/8 flex items-center justify-center">
                <Users className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Agent Information</h2>
                <p className="text-xs text-muted-foreground">
                  Enter the agent's details and assign their hierarchy
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="John Smith"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                  className="border-[#E5E2DB] focus:border-gold"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="agent@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="border-[#E5E2DB] focus:border-gold"
                />
              </div>

              {/* Hierarchy Assignment */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Team Assignment *</Label>
                <Select
                  value={formData.hierarchyId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, hierarchyId: value }))}
                  disabled={loadingOptions}
                >
                  <SelectTrigger className="border-[#E5E2DB]">
                    <SelectValue placeholder={loadingOptions ? "Loading..." : "Select team"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {hierarchyOptions.length === 0 ? (
                      <SelectItem value="__empty__" disabled className="text-muted-foreground">
                        No options available
                      </SelectItem>
                    ) : (
                      hierarchyOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {hierarchyOptions.length === 0 && !loadingOptions && (
                  <div className="space-y-1">
                    <p className="text-xs text-destructive">
                      No teams found. You must own at least one team to create agents.
                    </p>
                    <Link 
                      to="/admin/hierarchy" 
                      className="text-xs text-gold hover:underline inline-block"
                    >
                      Go to Hierarchy Management →
                    </Link>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Select a team you own to assign this agent to
                </p>
              </div>

              {/* Agent Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Agent Type *</Label>
                <RadioGroup
                  value={formData.agentType}
                  onValueChange={(value: 'new' | 'existing') => setFormData(prev => ({ ...prev, agentType: value }))}
                  className="space-y-3"
                >
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-[#E5E2DB] hover:border-gold/30 transition-colors">
                    <RadioGroupItem value="new" id="new" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="new" className="font-medium cursor-pointer">New Agent</Label>
                      <p className="text-xs text-muted-foreground">
                        Must complete contracting wizard before accessing the platform
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-[#E5E2DB] hover:border-gold/30 transition-colors">
                    <RadioGroupItem value="existing" id="existing" className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor="existing" className="font-medium cursor-pointer">Existing Agent</Label>
                      <p className="text-xs text-muted-foreground">
                        Already contracted - skips wizard and gets immediate platform access
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Send Setup Email */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-[#E5E2DB]">
                <Checkbox
                  id="sendSetupEmail"
                  checked={formData.sendSetupEmail}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendSetupEmail: checked as boolean }))}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label htmlFor="sendSetupEmail" className="font-medium cursor-pointer">Send setup email</Label>
                  <p className="text-xs text-muted-foreground">
                    Agent will receive an email with instructions to set their password and access the platform
                  </p>
                </div>
              </div>

              {/* Info Box for Existing Agents */}
              {formData.agentType === 'existing' && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Existing agents will have immediate access to the platform and will not appear in the contracting queue.
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/agents')}
                  className="border-[#E5E2DB]"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 bg-gold hover:bg-gold/90 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {formData.agentType === 'existing' ? 'Add Existing Agent' : 'Create Agent'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
```

