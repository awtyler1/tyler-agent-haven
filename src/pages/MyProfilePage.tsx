import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import AgentProfilePage from '@/pages/admin/AgentProfilePage';

/**
 * Wrapper that renders AgentProfilePage for the current user's own profile.
 * This allows agents to view their own profile at /my-profile without admin access.
 */
export default function MyProfilePage() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  // Render AgentProfilePage with the current user's profile ID
  return <AgentProfilePage selfViewProfileId={profile.id} />;
}
