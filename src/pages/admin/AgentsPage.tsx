import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AllAgentsTab } from '@/components/admin/AllAgentsTab';

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
      <AllAgentsTab />
    </AdminLayout>
  );
}
