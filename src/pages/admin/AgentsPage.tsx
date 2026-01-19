import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
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

  // Loading state (only show page-level loading for auth)
  if (authLoading) {
    return (
      <AdminLayout showBackButton backLabel="Dashboard" onBack={() => navigate('/admin')}>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout showBackButton backLabel="Dashboard" onBack={() => navigate('/admin')}>
      {/* Tab Bar */}
      <div className="mb-6">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
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
      </div>

      {/* Tab Content */}
      {currentTab === 'all' ? (
        <AllAgentsTab initialManagerFilter={selectedManager} />
      ) : (
        <TeamsTab onSelectTeam={handleTeamSelect} />
      )}
    </AdminLayout>
  );
}
