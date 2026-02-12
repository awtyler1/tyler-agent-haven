import { useAuth } from '@/hooks/useAuth';
import AgentProfilePage from '@/pages/admin/AgentProfilePage';
import { PageLoader } from '@/components/ui/PageLoader';

/**
 * Wrapper that renders AgentProfilePage for the current user's own profile.
 * This allows agents to view their own profile at /my-profile without admin access.
 */
export default function MyProfilePage() {
  const { profile, loading } = useAuth();

  if (loading) {
    return <PageLoader message="Loading profile..." />;
  }

  if (!profile?.id) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  // Render AgentProfilePage with the current user's profile ID
  return <AgentProfilePage selfViewProfileId={profile.id} />;
}
