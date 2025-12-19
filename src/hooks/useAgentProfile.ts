import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useViewMode } from '@/contexts/ViewModeContext';

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
  const { getEffectiveUserId, impersonatedAgent } = useViewMode();
  const [profileData, setProfileData] = useState<AgentProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const effectiveUserId = user?.id ? getEffectiveUserId(user.id) : null;

  useEffect(() => {
    if (!effectiveUserId || !isAuthenticated) {
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
          .eq('user_id', effectiveUserId)
          .maybeSingle();

        // Fetch contracting application for NPN, license, state
        const { data: application } = await supabase
          .from('contracting_applications')
          .select('npn_number, resident_license_number, resident_state')
          .eq('user_id', effectiveUserId)
          .maybeSingle();

        setProfileData({
          fullName: profile?.full_name || impersonatedAgent?.fullName || null,
          email: profile?.email || impersonatedAgent?.email || user?.email || null,
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
  }, [effectiveUserId, isAuthenticated, impersonatedAgent, user?.email]);

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
