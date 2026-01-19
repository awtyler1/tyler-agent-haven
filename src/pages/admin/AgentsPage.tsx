import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2, ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { AllAgentsTab } from '@/components/admin/AllAgentsTab';
import { TeamsTab } from '@/components/admin/TeamsTab';

type TabView = 'teams' | 'all';

export default function AgentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, isAdmin, hasDownline, isAgent, loading: authLoading } = useAuth();

  // Tab state from URL or default to 'all'
  const currentTab = (searchParams.get('tab') as TabView) || 'all';
  const setCurrentTab = (tab: TabView) => {
    setSearchParams(tab === 'all' ? {} : { tab });
  };

  // Manager filter for All Agents tab (set when clicking a team)
  const [selectedManager, setSelectedManager] = useState<string | undefined>(undefined);

  // Redirect non-admin agents to their profile
  useEffect(() => {
    if (!authLoading && isAgent() && !hasDownline() && !isAdmin()) {
      navigate(`/admin/agents/${profile?.id || ''}`);
    }
  }, [authLoading, isAgent, hasDownline, isAdmin, navigate, profile]);

  // Handle team selection from TeamsTab
  const handleTeamSelect = (teamName: string | null) => {
    // Switch to All Agents tab with the manager filter
    setSelectedManager(teamName === null ? 'no-manager' : teamName);
    setCurrentTab('all');
  };

  // Clear manager filter when switching to Teams tab
  const handleTabChange = (tab: TabView) => {
    if (tab === 'teams') {
      setSelectedManager(undefined);
    }
    setCurrentTab(tab);
  };

  const canAddAgents = isAdmin();

  // Loading state (only show page-level loading for auth)
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
        <Navigation />
        <main className="flex-1 pt-28 pb-12 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold mb-3" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />

      <main className="flex-1 pt-28 pb-12">
        <div className="container-narrow px-6 md:px-12 lg:px-20">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="hover:bg-gold/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="heading-section">Agents</h1>
            </div>
            {canAddAgents && (
              <Link to="/admin/agents/new">
                <Button className="bg-gold hover:bg-gold/90 text-white">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Agent
                </Button>
              </Link>
            )}
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit mb-6">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentTab === 'all'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Agents
            </button>
            <button
              onClick={() => handleTabChange('teams')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentTab === 'teams'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Teams
            </button>
          </div>

          {/* Tab Content */}
          {currentTab === 'all' ? (
            <AllAgentsTab initialManagerFilter={selectedManager} />
          ) : (
            <TeamsTab onSelectTeam={handleTeamSelect} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
