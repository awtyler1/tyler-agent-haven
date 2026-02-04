import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AllAgentsTab } from '@/components/admin/AllAgentsTab';
import { PageLoader } from '@/components/ui/PageLoader';

export default function AgentsPage() {
  const navigate = useNavigate();
  const { profile, isAdmin, hasDownline, isAgent, loading: authLoading } = useAuth();

  // Redirect non-admin agents to their profile
  useEffect(() => {
    if (!authLoading && isAgent() && !hasDownline() && !isAdmin()) {
      navigate(`/admin/agents/${profile?.id || ''}`);
    }
  }, [authLoading, isAgent, hasDownline, isAdmin, navigate, profile]);

  // Loading state (only show page-level loading for auth)
  if (authLoading) {
    return <PageLoader message="Loading agents..." />;
  }

  return (
    <AdminLayout>
      <AllAgentsTab />
    </AdminLayout>
  );
}
