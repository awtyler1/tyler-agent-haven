import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SystemStatus {
  superAdminActive: boolean;
  emailConfigured: boolean;
  welcomeTemplateExists: boolean;
  userCreationFlowReady: boolean;
  loading: boolean;
  error: string | null;
}

export interface UserStats {
  totalUsers: number;
  usersCreated: number;
  setupLinksSent: number;
  passwordsCreated: number;
  firstLogins: number;
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    superAdminActive: false,
    emailConfigured: false,
    welcomeTemplateExists: false,
    userCreationFlowReady: false,
    loading: true,
    error: null,
  });

  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    usersCreated: 0,
    setupLinksSent: 0,
    passwordsCreated: 0,
    firstLogins: 0,
  });

  const fetchStatus = async () => {
    try {
      // Check system config
      const { data: configs, error: configError } = await supabase
        .from('system_config')
        .select('config_key, config_value');

      if (configError) {
        console.error('Error fetching system config:', configError);
      }

      const configMap = configs?.reduce((acc, c) => {
        acc[c.config_key] = c.config_value;
        return acc;
      }, {} as Record<string, any>) || {};

      // Fetch user stats
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, setup_link_sent_at, password_created_at, first_login_at');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const stats: UserStats = {
        totalUsers: profiles?.length || 0,
        usersCreated: profiles?.length || 0,
        setupLinksSent: profiles?.filter(p => p.setup_link_sent_at)?.length || 0,
        passwordsCreated: profiles?.filter(p => p.password_created_at)?.length || 0,
        firstLogins: profiles?.filter(p => p.first_login_at)?.length || 0,
      };

      setUserStats(stats);
      setStatus({
        superAdminActive: true, // If we can access this, super admin is active
        emailConfigured: configMap['email_configured']?.status ?? true,
        welcomeTemplateExists: configMap['welcome_email_template']?.exists ?? true,
        userCreationFlowReady: configMap['user_creation_flow']?.ready ?? true,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return { status, userStats, refetch: fetchStatus };
}
