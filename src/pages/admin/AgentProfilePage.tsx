import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AssignManagerModal } from '@/components/admin/AssignManagerModal';
import { useAuth } from '@/hooks/useAuth';
import { useNavigationContext } from '@/hooks/useNavigationContext';
import { useSendEmail } from '@/hooks/useSendEmail';
import { toast } from 'sonner';

// Import new modular components
import {
  AgentProfileHeader,
  AgentProfileTabs,
  useProfileTabs,
  OverviewTab,
  ContractingTab,
  DocumentsTab,
  AdminTab,
} from '@/components/admin/agent-profile';

// Import modals
import { CarrierRequestModal } from './modals/CarrierRequestModal';
import { DeactivateModal } from './modals/DeactivateModal';
import { DeleteAgentModal } from '@/components/admin/agent-profile/DeleteAgentModal';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AgentProfile {
  id: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  npn: string | null;
  manager_id: string | null;
  ownership_group: string | null;
  onboarding_status: string;
  is_active: boolean;
  is_test: boolean | null;
  created_at: string;
  updated_at: string;
  setup_link_sent_at: string | null;
  password_created_at: string | null;
  first_login_at: string | null;
  appointed_at: string | null;
  ahip_cert_year: number | null;
  ahip_cert_uploaded_at: string | null;
  assigned_carriers: string[] | null;
  excluded_carriers: string[] | null;
  contracting_notes: string | null;
}

interface ManagerInfo {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface CarrierStatus {
  id: string;
  carrier_id: string;
  carrier_name: string;
  contracting_status: 'not_started' | 'in_progress' | 'contracted' | 'issue';
  contracting_submitted_at: string | null;
  contracted_at: string | null;
}

interface DirectReport {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface LocationState {
  from?: string;
  managerId?: string | null;
}

interface AgentProfilePageProps {
  selfViewProfileId?: string;
}

const CURRENT_AHIP_YEAR = 2026;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function AgentProfilePage({ selfViewProfileId }: AgentProfilePageProps = {}) {
  const { profileId: urlProfileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const { profile: currentUserProfile, isAdmin, isSuperAdmin } = useAuth();
  const { homePath } = useNavigationContext();
  const { sendEmail } = useSendEmail();

  // Determine profile ID and view mode
  const profileId = selfViewProfileId || urlProfileId;
  const isSelfView = !!selfViewProfileId || currentUserProfile?.id === profileId;

  // Tab state (URL-synced)
  const { activeTab, setActiveTab } = useProfileTabs('overview');

  // Data state
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [manager, setManager] = useState<ManagerInfo | null>(null);
  const [carrierStatuses, setCarrierStatuses] = useState<CarrierStatus[]>([]);
  const [directReports, setDirectReports] = useState<DirectReport[]>([]);
  const [hasInferredAhip, setHasInferredAhip] = useState(false);
  const [hasEo, setHasEo] = useState(false);
  const [eoExpiration, setEoExpiration] = useState<string | undefined>(undefined);
  const [isLicensed, setIsLicensed] = useState(false);
  const [licensedStates, setLicensedStates] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isCarrierRequestOpen, setIsCarrierRequestOpen] = useState(false);
  const [isHierarchyModalOpen, setIsHierarchyModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Permission checks
  const canEdit = isAdmin() && !isSelfView;

  // ─────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchAgentData() {
      if (!profileId) {
        setError('No profile ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') throw new Error('Agent not found');
          throw profileError;
        }

        setProfile(profileData);

        // Fetch role if user_id exists
        if (profileData.user_id) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profileData.user_id)
            .maybeSingle();
          setRole(roleData?.role || null);
        }

        // Fetch manager info
        if (profileData.manager_id) {
          const { data: managerData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', profileData.manager_id)
            .single();
          setManager(managerData || null);
        }

        // Fetch carrier statuses
        const { data: statusData } = await supabase
          .from('carrier_statuses')
          .select('id, carrier_id, contracting_status, contracting_submitted_at, contracted_at')
          .eq('profile_id', profileData.id)
          .order('contracted_at', { ascending: false, nullsFirst: false });

        if (statusData && statusData.length > 0) {
          const carrierIds = statusData.map((s) => s.carrier_id);
          const { data: carrierData } = await supabase
            .from('carriers')
            .select('id, name')
            .in('id', carrierIds);

          const carrierMap = new Map(carrierData?.map((c) => [c.id, c.name]) || []);
          const mappedStatuses: CarrierStatus[] = statusData.map((s) => ({
            id: s.id,
            carrier_id: s.carrier_id,
            carrier_name: carrierMap.get(s.carrier_id) || 'Unknown Carrier',
            contracting_status: s.contracting_status as CarrierStatus['contracting_status'],
            contracting_submitted_at: s.contracting_submitted_at,
            contracted_at: s.contracted_at,
          }));
          setCarrierStatuses(mappedStatuses);
        }

        // Fetch direct reports
        const { data: reportsData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('manager_id', profileId)
          .eq('is_active', true)
          .order('full_name', { ascending: true });

        if (reportsData) setDirectReports(reportsData);

        // Check for inferred AHIP status
        if (!profileData.ahip_cert_year) {
          const { data: certData } = await supabase
            .from('agent_certifications')
            .select('id')
            .eq('profile_id', profileData.id)
            .eq('certification_year', CURRENT_AHIP_YEAR)
            .limit(1);

          if (certData && certData.length > 0) setHasInferredAhip(true);
        }

        // Fetch compliance documents (E&O and licenses)
        const { data: complianceDocs } = await supabase
          .from('agent_documents')
          .select('document_type, label, expires_at')
          .eq('profile_id', profileData.id)
          .in('document_type', ['eo_certificate', 'resident_license', 'non_resident_license']);

        const today = new Date();

        // E&O check - find valid (non-expired) E&O certificate
        const eoDocs = complianceDocs?.filter(d => d.document_type === 'eo_certificate') || [];
        const validEo = eoDocs.find(d => !d.expires_at || new Date(d.expires_at) > today);
        setHasEo(!!validEo);
        setEoExpiration(validEo?.expires_at ? format(new Date(validEo.expires_at), 'MMM d, yyyy') : undefined);

        // Licensing check - count valid (non-expired) licenses
        const licenseDocs = complianceDocs?.filter(d =>
          ['resident_license', 'non_resident_license'].includes(d.document_type) &&
          (!d.expires_at || new Date(d.expires_at) > today)
        ) || [];
        setIsLicensed(licenseDocs.length > 0);
        setLicensedStates(licenseDocs.length);
      } catch (err: any) {
        console.error('Error fetching agent data:', err);
        setError(err.message || 'Failed to load agent profile');
      } finally {
        setLoading(false);
      }
    }

    fetchAgentData();
  }, [profileId]);

  // ─────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────

  const handleUpdateProfile = async (field: string, value: string) => {
    if (!profile) return;
    const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', profile.id);
    if (error) throw error;
    setProfile({ ...profile, [field]: value });
  };

  const handleSendSetupLink = async () => {
    if (!profile?.user_id) return;
    const { data: result, error } = await supabase.functions.invoke('send-setup-link', {
      body: { userId: profile.user_id },
    });
    if (error) throw error;
    if (result?.error) throw new Error(result.error);
    toast.success('Setup link sent successfully');

    // Refresh profile data
    const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
    if (updatedProfile) setProfile(updatedProfile);
  };

  const handleResetContracting = async () => {
    if (!profile) return;
    const { error } = await supabase.from('profiles').update({ onboarding_status: 'CONTRACTING_REQUIRED' }).eq('id', profile.id);
    if (error) throw error;
    setProfile({ ...profile, onboarding_status: 'CONTRACTING_REQUIRED' });
    toast.success('Contracting status reset');
  };

  const handleHierarchySuccess = async () => {
    if (!profileId) return;
    const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', profileId).single();
    if (updatedProfile) {
      setProfile(updatedProfile);
      if (updatedProfile.manager_id) {
        const { data: managerData } = await supabase.from('profiles').select('id, full_name, email').eq('id', updatedProfile.manager_id).single();
        setManager(managerData || null);
      } else {
        setManager(null);
      }
    }
  };

  const refreshCarrierStatuses = async () => {
    if (!profile) return;
    const { data: statusData } = await supabase
      .from('carrier_statuses')
      .select('id, carrier_id, contracting_status, contracting_submitted_at, contracted_at')
      .eq('profile_id', profile.id)
      .order('contracted_at', { ascending: false, nullsFirst: false });

    if (statusData && statusData.length > 0) {
      const carrierIds = statusData.map((s) => s.carrier_id);
      const { data: carrierData } = await supabase.from('carriers').select('id, name').in('id', carrierIds);
      const carrierMap = new Map(carrierData?.map((c) => [c.id, c.name]) || []);
      const mappedStatuses: CarrierStatus[] = statusData.map((s) => ({
        id: s.id,
        carrier_id: s.carrier_id,
        carrier_name: carrierMap.get(s.carrier_id) || 'Unknown Carrier',
        contracting_status: s.contracting_status as CarrierStatus['contracting_status'],
        contracting_submitted_at: s.contracting_submitted_at,
        contracted_at: s.contracted_at,
      }));
      setCarrierStatuses(mappedStatuses);
    }
  };

  const handleBackNavigation = () => {
    if (isSelfView) {
      navigate(homePath);
      return;
    }
    if (locationState?.from) {
      navigate(locationState.from, { state: { managerId: locationState.managerId } });
    } else {
      navigate('/admin/agents');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Computed Values
  // ─────────────────────────────────────────────────────────────

  const hasAhip = !!(profile?.ahip_cert_year || hasInferredAhip);
  const backLabel = isSelfView ? 'Dashboard' : 'Agents';

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AdminLayout showBackButton backLabel={backLabel} onBack={handleBackNavigation}>
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <p className="text-sm text-stone-500">Loading agent profile...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !profile) {
    return (
      <AdminLayout showBackButton backLabel={backLabel} onBack={handleBackNavigation}>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-stone-900 mb-2">{error || 'Agent not found'}</h2>
            <Button variant="outline" onClick={() => navigate('/admin/agents')}>
              Back to Agents
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout showBackButton backLabel={backLabel} onBack={handleBackNavigation}>
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <AgentProfileHeader
          profile={profile}
          manager={manager}
          teamSize={directReports.length}
          hasAhip={hasAhip}
          hasEo={hasEo}
          isLicensed={isLicensed}
          onUpdateProfile={handleUpdateProfile}
          onOpenManagerModal={() => setIsHierarchyModalOpen(true)}
          onSendSetupLink={handleSendSetupLink}
          onResetContracting={handleResetContracting}
          onOpenDeactivateModal={() => setIsDeactivateModalOpen(true)}
          isAdmin={isAdmin()}
          isSelfView={isSelfView}
        />

        {/* Tabs */}
        <AgentProfileTabs activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin()} />

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab
            profile={profile}
            manager={manager}
            ownershipGroup={profile.ownership_group}
            lastLogin={profile.first_login_at || undefined}
            hasAhip={hasAhip}
            hasEo={hasEo}
            eoExpiration={eoExpiration}
            isLicensed={isLicensed}
            licensedStates={licensedStates}
          />
        )}

        {activeTab === 'contracting' && (
          <ContractingTab
            profileId={profile.id}
            userId={profile.user_id}
            carrierStatuses={carrierStatuses}
            onOpenCarrierRequestModal={() => setIsCarrierRequestOpen(true)}
            isAdmin={isAdmin()}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab profileId={profile.id} isAdmin={isAdmin()} canUpload={isAdmin() || isSelfView} />
        )}

        {activeTab === 'admin' && isAdmin() && (
          <AdminTab
            profile={profile}
            currentRole={role}
            onChangeRole={() => {
              /* TODO: Implement role change modal */
            }}
            onDeactivate={() => setIsDeactivateModalOpen(true)}
            onDelete={() => setIsDeleteModalOpen(true)}
          />
        )}
      </div>

      {/* Modals */}
      <AssignManagerModal
        open={isHierarchyModalOpen}
        onOpenChange={setIsHierarchyModalOpen}
        agentIds={[profile.id]}
        agentName={profile.full_name || undefined}
        currentManagerId={profile.manager_id}
        currentOwnershipGroup={profile.ownership_group}
        onSuccess={handleHierarchySuccess}
      />

      <CarrierRequestModal
        open={isCarrierRequestOpen}
        onOpenChange={setIsCarrierRequestOpen}
        profile={profile}
        carrierStatuses={carrierStatuses}
        sendEmail={sendEmail}
        onSuccess={refreshCarrierStatuses}
      />

      <DeactivateModal
        open={isDeactivateModalOpen}
        onOpenChange={setIsDeactivateModalOpen}
        profile={profile}
        directReports={directReports}
        onSuccess={(updatedProfile) => {
          setProfile(updatedProfile);
          if (!updatedProfile.is_active) setDirectReports([]);
        }}
      />

      {profile.user_id && (
        <DeleteAgentModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          agentName={profile.full_name || 'Unknown Agent'}
          userId={profile.user_id}
          onDeleted={() => {
            toast.success('Agent deleted successfully');
            navigate('/admin/agents');
          }}
        />
      )}
    </AdminLayout>
  );
}
