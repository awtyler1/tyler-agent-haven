import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AgentProfileData {
  fullName: string | null;
  email: string | null;
  npn: string | null;
  licenseNumber: string | null;
  residentState: string | null;
  onboardingStatus: string | null;
}

export function useAgentProfile() {
  const { user, isAuthenticated } = useAuth();
  const [profileData, setProfileData] = useState<AgentProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !isAuthenticated) {
      setProfileData(null);
      setLoading(false);
      return;
    }

    const fetchAgentProfile = async () => {
      setLoading(true);
      try {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, onboarding_status')
          .eq('user_id', user.id)
          .maybeSingle();

        // Fetch contracting application for NPN, license, state
        const { data: application } = await supabase
          .from('contracting_applications')
          .select('npn_number, resident_license_number, resident_state')
          .eq('user_id', user.id)
          .maybeSingle();

        setProfileData({
          fullName: profile?.full_name || null,
          email: profile?.email || user.email || null,
          npn: application?.npn_number || null,
          licenseNumber: application?.resident_license_number || null,
          residentState: application?.resident_state || null,
          onboardingStatus: profile?.onboarding_status || null,
        });
      } catch (error) {
        console.error('Error fetching agent profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentProfile();
  }, [user?.id, isAuthenticated]);

  const getInitials = (): string => {
    if (!profileData?.fullName) return '?';
    const names = profileData.fullName.trim().split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || '?';
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return {
    ...profileData,
    loading,
    getInitials,
    hasContractingData: !!(profileData?.npn || profileData?.licenseNumber),
  };
}
