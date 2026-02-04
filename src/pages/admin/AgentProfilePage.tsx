import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Mail,
  User,
  CheckCircle2,
  Loader2,
  Users,
  Building2,
  CreditCard,
  Hash,
  AlertCircle,
  Pencil,
  Plus,
  Check,
  Search,
  AlertTriangle,
  UserMinus,
  UserPlus,
  Send,
  MoreVertical,
  FileText,
} from 'lucide-react';
import { PageLoader } from '@/components/ui/PageLoader';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AgentDocumentsSection } from '@/components/admin/AgentDocumentsSection';
import { AssignManagerModal } from '@/components/admin/AssignManagerModal';
import { useAuth } from '@/hooks/useAuth';
import { useNavigationContext } from '@/hooks/useNavigationContext';
import { useSendEmail } from '@/hooks/useSendEmail';
import { toast } from 'sonner';

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

interface DirectReport {
  id: string;
  full_name: string | null;
  email: string | null;
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

interface Carrier {
  id: string;
  name: string;
}

type CarrierRequestStatus = 'idle' | 'sending' | 'success' | 'error';

const CARRIER_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  not_started: { label: 'Not Started', className: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'In Progress', className: 'bg-amber-100 text-amber-700' },
  contracted: { label: 'Contracted', className: 'bg-green-100 text-green-700' },
  issue: { label: 'Issue', className: 'bg-red-100 text-red-700' },
};

const ROLE_LABELS: Record<string, { label: string; className: string }> = {
  super_admin: { label: 'Super Admin', className: 'bg-purple-100 text-purple-700' },
  admin: { label: 'Admin', className: 'bg-blue-100 text-blue-700' },
  manager: { label: 'Manager', className: 'bg-indigo-100 text-indigo-700' },
  independent_agent: { label: 'Independent Agent', className: 'bg-green-100 text-green-700' },
  internal_tig_agent: { label: 'TIG Agent', className: 'bg-teal-100 text-teal-700' },
};

const ONBOARDING_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  CONTRACTING_REQUIRED: { label: 'Contracting Required', className: 'bg-red-100 text-red-700' },
  CONTRACTING_SUBMITTED: { label: 'Contract Submitted', className: 'bg-amber-100 text-amber-700' },
  APPOINTED: { label: 'Appointed', className: 'bg-green-100 text-green-700' },
  SUSPENDED: { label: 'Suspended', className: 'bg-red-100 text-red-700' },
};

type AppRole = 'super_admin' | 'admin' | 'manager' | 'internal_tig_agent' | 'independent_agent';

const ROLE_DROPDOWN_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  internal_tig_agent: 'Internal TIG Agent',
  independent_agent: 'Independent Agent',
};

// Roles that regular admins can assign (not super_admin or admin)
const ADMIN_ASSIGNABLE_ROLES: AppRole[] = ['internal_tig_agent', 'independent_agent'];

// All roles for super admins
const ALL_ROLES: AppRole[] = ['super_admin', 'admin', 'internal_tig_agent', 'independent_agent'];

interface LocationState {
  from?: string;
  managerId?: string | null;
}

interface AgentProfilePageProps {
  /** Optional profile ID for self-view mode (from /my-profile route) */
  selfViewProfileId?: string;
}

export default function AgentProfilePage({ selfViewProfileId }: AgentProfilePageProps = {}) {
  const { profileId: urlProfileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const { profile: currentUserProfile, isAdmin, isSuperAdmin } = useAuth();
  const { homePath } = useNavigationContext();

  // Use selfViewProfileId if provided (from /my-profile), otherwise use URL param
  const profileId = selfViewProfileId || urlProfileId;

  // Determine if this is a self-view (viewing own profile)
  const isSelfView = !!selfViewProfileId || currentUserProfile?.id === profileId;

  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [manager, setManager] = useState<ManagerInfo | null>(null);
  const [carrierStatuses, setCarrierStatuses] = useState<CarrierStatus[]>([]);
  const [directReports, setDirectReports] = useState<DirectReport[]>([]);
  const [hasInferredAhip, setHasInferredAhip] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrier request modal state
  const [isCarrierRequestOpen, setIsCarrierRequestOpen] = useState(false);
  const [allCarriers, setAllCarriers] = useState<Carrier[]>([]);
  const [selectedCarriersForRequest, setSelectedCarriersForRequest] = useState<string[]>([]);
  const [carrierRequestStatus, setCarrierRequestStatus] = useState<CarrierRequestStatus>('idle');
  const [carrierRequestConfirmed, setCarrierRequestConfirmed] = useState(false);
  const [carrierRequestError, setCarrierRequestError] = useState<string | null>(null);
  const [requestCarrierTo, setRequestCarrierTo] = useState('pfslicensing@pfsinsurance.com');
  const [requestCarrierSubject, setRequestCarrierSubject] = useState('');
  const [requestCarrierBody, setRequestCarrierBody] = useState('');
  const { sendEmail } = useSendEmail();

  // Hierarchy assignment modal state
  const [isHierarchyModalOpen, setIsHierarchyModalOpen] = useState(false);

  // Deactivate/Reactivate modal state
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivateConfirmed, setDeactivateConfirmed] = useState(false);
  const [deactivateAllReports, setDeactivateAllReports] = useState(false);
  // undefined = no selection, null = TIG Direct, string = specific manager
  const [reassignToManagerId, setReassignToManagerId] = useState<string | null | undefined>(undefined);
  const [deactivateStatus, setDeactivateStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [deactivateSearch, setDeactivateSearch] = useState('');
  const [availableManagers, setAvailableManagers] = useState<AgentOption[]>([]);

  // Send Setup Link state
  const [sendingSetupLink, setSendingSetupLink] = useState(false);

  // Contracting notes inline edit state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [draftNotes, setDraftNotes] = useState('');
  const [notesSaveStatus, setNotesSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [notesError, setNotesError] = useState<string | null>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isCancelingNotesRef = useRef(false);

  // NPN inline edit state
  const [isEditingNpn, setIsEditingNpn] = useState(false);
  const [draftNpn, setDraftNpn] = useState('');
  const [npnSaveStatus, setNpnSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [npnError, setNpnError] = useState<string | null>(null);
  const [npnValidationError, setNpnValidationError] = useState<string | null>(null);
  const npnInputRef = useRef<HTMLInputElement>(null);
  const isCancelingNpnRef = useRef(false);

  // Full Name inline edit state
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [nameSaveStatus, setNameSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [nameError, setNameError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const isCancelingNameRef = useRef(false);

  // Email inline edit state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [draftEmail, setDraftEmail] = useState('');
  const [emailSaveStatus, setEmailSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const isCancelingEmailRef = useRef(false);

  const CURRENT_AHIP_YEAR = 2026;

  // Helper to get initials from a name
  const getInitials = (name: string | null): string => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

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
        // Fetch profile by id (not user_id)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            throw new Error('Agent not found');
          }
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

        // Fetch manager info if manager_id exists
        if (profileData.manager_id) {
          const { data: managerData } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', profileData.manager_id)
            .single();

          setManager(managerData || null);
        }

        // Fetch carrier statuses by profile_id (works for all agents, including imported)
        const { data: statusData, error: statusError } = await supabase
          .from('carrier_statuses')
          .select('id, carrier_id, contracting_status, contracting_submitted_at, contracted_at')
          .eq('profile_id', profileData.id)
          .order('contracted_at', { ascending: false, nullsFirst: false });

        if (statusError) {
          console.error('Error fetching carrier statuses:', statusError);
        } else if (statusData && statusData.length > 0) {
          // Fetch carrier names for the carrier IDs we have
          const carrierIds = statusData.map((s) => s.carrier_id);
          const { data: carrierData } = await supabase
            .from('carriers')
            .select('id, name')
            .in('id', carrierIds);

          // Build carrier name map
          const carrierMap = new Map(carrierData?.map((c) => [c.id, c.name]) || []);

          // Combine the data
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

        // Fetch direct reports (profiles where manager_id = this profile's id)
        const { data: reportsData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('manager_id', profileId)
          .eq('is_active', true)
          .order('full_name', { ascending: true });

        if (reportsData) {
          setDirectReports(reportsData);
        }

        // Check for inferred AHIP status if no manual cert year is set
        if (!profileData.ahip_cert_year) {
          const { data: certData } = await supabase
            .from('agent_certifications')
            .select('id')
            .eq('profile_id', profileData.id)
            .eq('certification_year', CURRENT_AHIP_YEAR)
            .limit(1);

          if (certData && certData.length > 0) {
            setHasInferredAhip(true);
          }
        }

      } catch (err: any) {
        console.error('Error fetching agent data:', err);
        setError(err.message || 'Failed to load agent profile');
      } finally {
        setLoading(false);
      }
    }

    fetchAgentData();
  }, [profileId]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditingNotes && notesTextareaRef.current) {
      notesTextareaRef.current.focus();
      // Move cursor to end
      const len = notesTextareaRef.current.value.length;
      notesTextareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditingNotes]);

  // Focus NPN input when entering edit mode
  useEffect(() => {
    if (isEditingNpn && npnInputRef.current) {
      npnInputRef.current.focus();
      npnInputRef.current.select();
    }
  }, [isEditingNpn]);

  // Focus Name input when entering edit mode
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  // Focus Email input when entering edit mode
  useEffect(() => {
    if (isEditingEmail && emailInputRef.current) {
      emailInputRef.current.focus();
      emailInputRef.current.select();
    }
  }, [isEditingEmail]);

  // Permission check for inline editing - only admins can edit, even on own profile
  const canEdit = isAdmin() && !isSelfView;
  const canEditNotes = isAdmin() || isSelfView; // Agents can edit their own notes

  // Contracting notes handlers
  const handleNotesClick = () => {
    if (!canEditNotes) return;
    setDraftNotes(profile?.contracting_notes || '');
    setIsEditingNotes(true);
    setNotesSaveStatus('idle');
    setNotesError(null);
  };

  const handleNotesCancel = () => {
    isCancelingNotesRef.current = true;
    setIsEditingNotes(false);
    setDraftNotes('');
    setNotesSaveStatus('idle');
    setNotesError(null);
  };

  const handleNotesSave = async () => {
    if (!profile) return;

    const originalNotes = profile.contracting_notes;
    const newNotes = draftNotes.trim() || null;

    // Optimistic update
    setProfile({ ...profile, contracting_notes: newNotes });
    setIsEditingNotes(false);
    setNotesSaveStatus('saving');
    setNotesError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ contracting_notes: newNotes })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setNotesSaveStatus('saved');
      // Clear "Saved" message after 2 seconds
      setTimeout(() => {
        setNotesSaveStatus('idle');
      }, 2000);
    } catch (err: any) {
      // Revert on error
      setProfile({ ...profile, contracting_notes: originalNotes });
      setNotesSaveStatus('error');
      setNotesError(err.message || 'Failed to save notes');
    }
  };

  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      handleNotesCancel();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleNotesSave();
    }
  };

  const handleNotesBlur = () => {
    if (isCancelingNotesRef.current) {
      isCancelingNotesRef.current = false;
      return;
    }
    handleNotesSave();
  };

  // NPN handlers
  const handleNpnClick = () => {
    if (!canEdit) return;
    setDraftNpn(profile?.npn || '');
    setIsEditingNpn(true);
    setNpnSaveStatus('idle');
    setNpnError(null);
    setNpnValidationError(null);
  };

  const handleNpnCancel = () => {
    isCancelingNpnRef.current = true;
    setIsEditingNpn(false);
    setDraftNpn('');
    setNpnSaveStatus('idle');
    setNpnError(null);
    setNpnValidationError(null);
  };

  const validateNpn = (value: string): boolean => {
    if (value === '') return true; // Empty is allowed
    if (!/^\d{8}$/.test(value)) {
      setNpnValidationError('NPN must be exactly 8 digits');
      return false;
    }
    setNpnValidationError(null);
    return true;
  };

  const handleNpnSave = async () => {
    if (!profile) return;

    const trimmedNpn = draftNpn.trim();
    if (!validateNpn(trimmedNpn)) return;

    const originalNpn = profile.npn;
    const newNpn = trimmedNpn || null;

    // Optimistic update
    setProfile({ ...profile, npn: newNpn });
    setIsEditingNpn(false);
    setNpnSaveStatus('saving');
    setNpnError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ npn: newNpn })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setNpnSaveStatus('saved');
      setTimeout(() => {
        setNpnSaveStatus('idle');
      }, 2000);
    } catch (err: any) {
      // Revert on error
      setProfile({ ...profile, npn: originalNpn });
      setNpnSaveStatus('error');
      setNpnError(err.message || 'Failed to save NPN');
    }
  };

  const handleNpnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleNpnCancel();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleNpnSave();
    }
  };

  const handleNpnBlur = () => {
    if (isCancelingNpnRef.current) {
      isCancelingNpnRef.current = false;
      return;
    }
    handleNpnSave();
  };

  // Full Name handlers
  const handleNameClick = () => {
    if (!canEdit) return;
    setDraftName(profile?.full_name || '');
    setIsEditingName(true);
    setNameSaveStatus('idle');
    setNameError(null);
  };

  const handleNameCancel = () => {
    isCancelingNameRef.current = true;
    setIsEditingName(false);
    setDraftName('');
    setNameSaveStatus('idle');
    setNameError(null);
  };

  const handleNameSave = async () => {
    if (!profile) return;

    const trimmedName = draftName.trim();
    if (!trimmedName) {
      setNameError('Name is required');
      return;
    }

    const originalName = profile.full_name;

    // Optimistic update
    setProfile({ ...profile, full_name: trimmedName });
    setIsEditingName(false);
    setNameSaveStatus('saving');
    setNameError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: trimmedName })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setNameSaveStatus('saved');
      setTimeout(() => {
        setNameSaveStatus('idle');
      }, 2000);
    } catch (err: any) {
      // Revert on error
      setProfile({ ...profile, full_name: originalName });
      setNameSaveStatus('error');
      setNameError(err.message || 'Failed to save name');
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleNameCancel();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleNameSave();
    }
  };

  const handleNameBlur = () => {
    if (isCancelingNameRef.current) {
      isCancelingNameRef.current = false;
      return;
    }
    handleNameSave();
  };

  // Email handlers
  const handleEmailClick = () => {
    if (!canEdit) return;
    setDraftEmail(profile?.email || '');
    setIsEditingEmail(true);
    setEmailSaveStatus('idle');
    setEmailError(null);
    setEmailValidationError(null);
  };

  const handleEmailCancel = () => {
    isCancelingEmailRef.current = true;
    setIsEditingEmail(false);
    setDraftEmail('');
    setEmailSaveStatus('idle');
    setEmailError(null);
    setEmailValidationError(null);
  };

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailValidationError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setEmailValidationError('Invalid email format');
      return false;
    }
    setEmailValidationError(null);
    return true;
  };

  const handleEmailSave = async () => {
    if (!profile) return;

    const trimmedEmail = draftEmail.trim();
    if (!validateEmail(trimmedEmail)) return;

    const originalEmail = profile.email;

    // Optimistic update
    setProfile({ ...profile, email: trimmedEmail });
    setIsEditingEmail(false);
    setEmailSaveStatus('saving');
    setEmailError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ email: trimmedEmail })
        .eq('id', profile.id);

      if (updateError) {
        // Check for unique constraint violation
        if (updateError.code === '23505' ||
            updateError.message?.toLowerCase().includes('duplicate') ||
            updateError.message?.toLowerCase().includes('unique')) {
          throw new Error('This email is already in use');
        }
        throw updateError;
      }

      setEmailSaveStatus('saved');
      setTimeout(() => {
        setEmailSaveStatus('idle');
      }, 2000);
    } catch (err: any) {
      // Revert on error
      setProfile({ ...profile, email: originalEmail });
      setEmailSaveStatus('error');
      setEmailError(err.message || 'Failed to save email');
    }
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleEmailCancel();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleEmailSave();
    }
  };

  const handleEmailBlur = () => {
    if (isCancelingEmailRef.current) {
      isCancelingEmailRef.current = false;
      return;
    }
    handleEmailSave();
  };

  // Carrier request modal handlers
  const handleOpenCarrierRequest = async () => {
    setIsCarrierRequestOpen(true);
    setSelectedCarriersForRequest([]);
    setCarrierRequestConfirmed(false);
    setCarrierRequestStatus('idle');
    setCarrierRequestError(null);
    setRequestCarrierTo('pfslicensing@pfsinsurance.com');
    setRequestCarrierSubject(`Carrier Request - ${profile?.full_name || 'Agent'} (NPN: ${profile?.npn || 'N/A'})`);

    // Fetch all carriers
    const { data: carriersData, error: carriersError } = await supabase
      .from('carriers')
      .select('id, name')
      .order('name');

    if (carriersError) {
      console.error('Error fetching carriers:', carriersError);
      setCarrierRequestError('Failed to load carriers');
      return;
    }

    setAllCarriers(carriersData || []);
  };

  const handleCloseCarrierRequest = () => {
    if (carrierRequestStatus === 'sending') return;
    setIsCarrierRequestOpen(false);
  };

  const handleCarrierToggle = (carrierId: string, checked: boolean) => {
    setSelectedCarriersForRequest((prev) =>
      checked ? [...prev, carrierId] : prev.filter((id) => id !== carrierId)
    );
  };

  // Get carriers not already in carrier_statuses
  const availableCarriers = allCarriers.filter(
    (carrier) => !carrierStatuses.some((status) => status.carrier_id === carrier.id)
  );

  // Get selected carrier names for display
  const selectedCarrierNames = selectedCarriersForRequest
    .map((id) => allCarriers.find((c) => c.id === id)?.name)
    .filter(Boolean) as string[];

  // Generate carrier request email body
  const generateCarrierRequestBody = (carrierNames: string[]) => {
    const carrierList = carrierNames.length > 0
      ? carrierNames.map((name) => `- ${name}`).join('\n')
      : '(No carriers selected)';

    return `Hey Support,

Can we start contracting for our agent ${profile?.full_name || 'N/A'} with the following carriers:

${carrierList}

NPN: ${profile?.npn || 'N/A'}

Thank you,
Caroline Horn
Tyler Insurance Group`;
  };

  // Regenerate body when selected carriers change
  useEffect(() => {
    if (isCarrierRequestOpen) {
      setRequestCarrierBody(generateCarrierRequestBody(selectedCarrierNames));
    }
  }, [selectedCarriersForRequest, isCarrierRequestOpen, profile?.full_name, profile?.npn]);

  const handleSendCarrierRequest = async () => {
    if (!profile || selectedCarriersForRequest.length === 0) return;

    setCarrierRequestStatus('sending');
    setCarrierRequestError(null);

    // Convert plain text body to HTML (escape HTML chars and convert newlines to <br>)
    const bodyHtml = requestCarrierBody
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    const result = await sendEmail({
      to: requestCarrierTo,
      subject: requestCarrierSubject,
      body: bodyHtml,
      agentId: profile.user_id || undefined,
      communicationType: 'other',
      carriersIncluded: selectedCarrierNames,
    });

    if (!result.success) {
      setCarrierRequestStatus('error');
      setCarrierRequestError(result.error || 'Failed to send email');
      setTimeout(() => setCarrierRequestStatus('idle'), 2000);
      return;
    }

    // Create carrier_statuses records for each selected carrier
    const newStatuses = selectedCarriersForRequest.map((carrierId) => ({
      profile_id: profile.id,
      user_id: profile.user_id || null,
      carrier_id: carrierId,
      contracting_status: 'in_progress' as const,
      contracting_submitted_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('carrier_statuses')
      .insert(newStatuses);

    if (insertError) {
      console.warn('Email sent but failed to create carrier_statuses:', insertError);
      // Don't fail - email was already sent
    } else {
      // Refresh carrier statuses to show new "In Progress" carriers
      const { data: statusData } = await supabase
        .from('carrier_statuses')
        .select('id, carrier_id, contracting_status, contracting_submitted_at, contracted_at')
        .eq('profile_id', profile.id)
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
    }

    setCarrierRequestStatus('success');
    // Show success briefly before closing
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsCarrierRequestOpen(false);
  };

  const getCarrierRequestButtonContent = () => {
    switch (carrierRequestStatus) {
      case 'sending':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        );
      case 'success':
        return (
          <>
            <Check className="h-4 w-4" />
            Sent!
          </>
        );
      default:
        return 'Send Request';
    }
  };

  // Hierarchy modal handlers
  const handleOpenHierarchyModal = () => {
    setIsHierarchyModalOpen(true);
  };

  const handleHierarchySuccess = async () => {
    // Refresh profile and manager data after assignment
    if (!profileId) return;

    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (updatedProfile) {
      setProfile(updatedProfile);

      // Update manager display
      if (updatedProfile.manager_id) {
        const { data: managerData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', updatedProfile.manager_id)
          .single();
        setManager(managerData || null);
      } else {
        setManager(null);
      }
    }
  };

  // Send Setup Link handler
  const handleSendSetupLink = async () => {
    if (!profile?.user_id) return;
    setSendingSetupLink(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('send-setup-link', {
        body: { userId: profile.user_id },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      toast.success('Setup link sent successfully');

      // Refresh profile data to update setup_link_sent_at
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single();

      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send setup link';
      toast.error(`Failed to send setup link: ${message}`);
    } finally {
      setSendingSetupLink(false);
    }
  };

  // Role change handler
  const handleRoleChange = async (newRole: AppRole) => {
    if (!profile?.user_id) return;
    setUpdatingRole(true);
    try {
      // Delete existing role
      await supabase.from('user_roles').delete().eq('user_id', profile.user_id);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: profile.user_id, role: newRole });

      if (error) throw error;

      toast.success('Role updated successfully');
      setRole(newRole);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update role';
      toast.error(`Failed to update role: ${message}`);
    } finally {
      setUpdatingRole(false);
    }
  };

  // Deactivate/Reactivate modal handlers
  const handleOpenDeactivateModal = async () => {
    setIsDeactivateModalOpen(true);
    setDeactivateConfirmed(false);
    setDeactivateAllReports(false);
    setReassignToManagerId(undefined);
    setDeactivateStatus('idle');
    setDeactivateError(null);
    setDeactivateSearch('');

    // Fetch available managers for reassignment (exclude current agent and their direct reports)
    const { data: managersData, error: managersError } = await supabase
      .from('profiles')
      .select('id, full_name, manager_id')
      .eq('is_active', true)
      .order('full_name');

    if (managersError) {
      console.error('Error fetching managers:', managersError);
      return;
    }

    // Filter out current agent and their direct reports
    const directReportIds = new Set(directReports.map((r) => r.id));
    const filtered = (managersData || []).filter(
      (m) => m.id !== profile?.id && !directReportIds.has(m.id)
    );
    setAvailableManagers(filtered);
  };

  const handleCloseDeactivateModal = () => {
    if (deactivateStatus === 'processing') return;
    setIsDeactivateModalOpen(false);
  };

  // Filter available managers for reassignment
  const filteredManagers = availableManagers.filter((m) => {
    if (!deactivateSearch) return true;
    return m.full_name?.toLowerCase().includes(deactivateSearch.toLowerCase());
  });

  const handleDeactivate = async () => {
    if (!profile) return;

    const hasReports = directReports.length > 0;

    // Validate: if has reports, must either reassign or deactivate all
    // reassignToManagerId can be null (TIG Direct) or string (manager), but not undefined (no selection)
    if (hasReports && reassignToManagerId === undefined && !deactivateAllReports) {
      setDeactivateError('Please choose to reassign reports or deactivate all');
      return;
    }

    setDeactivateStatus('processing');
    setDeactivateError(null);

    try {
      // If reassigning reports (reassignToManagerId is null for TIG Direct or string for manager)
      if (hasReports && reassignToManagerId !== undefined && !deactivateAllReports) {
        const reportIds = directReports.map((r) => r.id);
        const { error: reassignError } = await supabase
          .from('profiles')
          .update({ manager_id: reassignToManagerId })
          .in('id', reportIds);

        if (reassignError) throw reassignError;
      }

      // If deactivating all reports
      if (hasReports && deactivateAllReports) {
        const reportIds = directReports.map((r) => r.id);
        const { error: deactivateReportsError } = await supabase
          .from('profiles')
          .update({ is_active: false })
          .in('id', reportIds);

        if (deactivateReportsError) throw deactivateReportsError;
      }

      // Deactivate the agent
      const { error: deactivateError } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', profile.id);

      if (deactivateError) throw deactivateError;

      // Update local state
      setProfile({ ...profile, is_active: false });
      setDirectReports([]); // Clear direct reports since they were reassigned or deactivated

      setDeactivateStatus('success');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsDeactivateModalOpen(false);
    } catch (err: any) {
      setDeactivateStatus('error');
      setDeactivateError(err.message || 'Failed to deactivate agent');
    }
  };

  const handleReactivate = async () => {
    if (!profile) return;

    setDeactivateStatus('processing');
    setDeactivateError(null);

    try {
      const { error: reactivateError } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', profile.id);

      if (reactivateError) throw reactivateError;

      // Update local state
      setProfile({ ...profile, is_active: true });

      setDeactivateStatus('success');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsDeactivateModalOpen(false);
    } catch (err: any) {
      setDeactivateStatus('error');
      setDeactivateError(err.message || 'Failed to reactivate agent');
    }
  };

  // Loading state
  if (loading) {
    return <PageLoader message="Loading agent profile..." />;
  }

  // Error state
  if (error || !profile) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {error || 'Agent not found'}
            </h2>
            <Button variant="outline" onClick={() => navigate('/admin/agents')}>
              Back to Agents
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statusInfo = ONBOARDING_STATUS_LABELS[profile.onboarding_status] || {
    label: profile.onboarding_status,
    className: 'bg-gray-100 text-gray-700',
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        {/* ═══════════════════════════════════════════════════════════════
            AGENT HEADER BAND
            ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden mb-4">
          {/* Main Content */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/80 to-brand text-white shadow-sm flex items-center justify-center text-lg font-semibold flex-shrink-0">
                {getInitials(profile.full_name)}
              </div>

              {/* Main Info */}
              <div className="flex-1 min-w-0">
                {/* Name Row - Inline Editable */}
                <div className="flex items-center gap-3 flex-wrap">
                  {isEditingName ? (
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={draftName}
                      onChange={(e) => {
                        setDraftName(e.target.value);
                        setNameError(null);
                      }}
                      onKeyDown={handleNameKeyDown}
                      onBlur={handleNameBlur}
                      className="text-xl font-serif font-medium px-2 py-0.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-brand/50 focus:border-brand"
                      placeholder="Full name"
                    />
                  ) : (
                    <h1
                      onClick={handleNameClick}
                      className={`text-xl font-serif font-medium text-foreground ${canEdit ? 'group cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors inline-flex items-center' : ''}`}
                      title={canEdit ? 'Click to edit' : undefined}
                    >
                      {profile.full_name || 'Unnamed Agent'}
                      {canEdit && (
                        <Pencil className="h-3.5 w-3.5 ml-2 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </h1>
                  )}
                  {nameSaveStatus === 'saved' && (
                    <span className="text-xs text-green-600 animate-fade-in">Saved ✓</span>
                  )}
                  {nameSaveStatus === 'saving' && (
                    <span className="text-xs text-muted-foreground">Saving...</span>
                  )}
                  {nameSaveStatus === 'error' && nameError && !isEditingName && (
                    <span className="text-xs text-red-600">{nameError}</span>
                  )}

                  {/* Status Badges */}
                  {!profile.is_active && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-700">
                      Inactive
                    </span>
                  )}
                  {profile.is_test && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                      Test
                    </span>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Email Row - Inline Editable */}
                <div className="mt-1">
                  {isEditingEmail ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={emailInputRef}
                        type="email"
                        value={draftEmail}
                        onChange={(e) => {
                          setDraftEmail(e.target.value);
                          setEmailValidationError(null);
                        }}
                        onKeyDown={handleEmailKeyDown}
                        onBlur={handleEmailBlur}
                        className="w-64 text-sm px-1.5 py-0.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-brand/50 focus:border-brand"
                        placeholder="email@example.com"
                      />
                      {emailValidationError && (
                        <span className="text-xs text-red-600">{emailValidationError}</span>
                      )}
                    </div>
                  ) : (
                    <p
                      onClick={handleEmailClick}
                      className={`text-sm text-muted-foreground ${canEdit ? 'group cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors inline-flex items-center' : ''}`}
                      title={canEdit ? 'Click to edit' : undefined}
                    >
                      {profile.email || '—'}
                      {canEdit && (
                        <Pencil className="h-3 w-3 ml-1.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </p>
                  )}
                  {emailSaveStatus === 'saved' && (
                    <span className="text-xs text-green-600 animate-fade-in ml-2">Saved ✓</span>
                  )}
                </div>

                {/* Meta Row */}
                <div className="flex items-center gap-6 mt-5 text-sm">
                  {/* NPN - Inline Editable */}
                  {isEditingNpn ? (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground/60 text-xs">#</span>
                      <input
                        ref={npnInputRef}
                        type="text"
                        value={draftNpn}
                        onChange={(e) => {
                          setDraftNpn(e.target.value);
                          setNpnValidationError(null);
                        }}
                        onKeyDown={handleNpnKeyDown}
                        onBlur={handleNpnBlur}
                        className="w-24 text-sm px-1.5 py-0.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-brand/50 focus:border-brand"
                        placeholder="12345678"
                        maxLength={8}
                      />
                      {npnValidationError && (
                        <span className="text-xs text-red-600">{npnValidationError}</span>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={handleNpnClick}
                      className={`flex items-center gap-1.5 text-muted-foreground/60 ${canEdit ? 'group cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors' : ''}`}
                      title={canEdit ? 'Click to edit' : undefined}
                    >
                      <span className="text-xs">#</span>
                      <span>{profile.npn || '—'}</span>
                      {canEdit && (
                        <Pencil className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  )}
                  {npnSaveStatus === 'saved' && (
                    <span className="text-xs text-green-600 animate-fade-in">Saved ✓</span>
                  )}

                  {/* Manager Link */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground/60">→</span>
                    {manager ? (
                      <>
                        <Link
                          to={`/admin/agents/${manager.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {manager.full_name || manager.email || 'Unknown'}
                        </Link>
                        {canEdit && (
                          <button
                            onClick={handleOpenHierarchyModal}
                            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                            title="Change manager"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-primary font-medium">TIG (Direct)</span>
                        {canEdit && (
                          <button
                            onClick={handleOpenHierarchyModal}
                            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                            title="Change manager"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Team Count Link (if manager) */}
                  {directReports.length > 0 && (
                    <Link
                      to={`/admin/agents?manager=${profileId}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {directReports.length} agents
                    </Link>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Primary Action Button */}
                {canEdit && profile.user_id && !profile.password_created_at && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendSetupLink}
                    disabled={sendingSetupLink}
                    className="gap-1.5"
                  >
                    {sendingSetupLink ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {profile.setup_link_sent_at ? 'Resend Link' : 'Send Setup Link'}
                  </Button>
                )}

                {/* More Actions Dropdown */}
                {canEdit && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleOpenCarrierRequest}>
                        <Plus className="h-4 w-4 mr-2" />
                        Request Carrier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleOpenHierarchyModal}>
                        <Users className="h-4 w-4 mr-2" />
                        Change Manager
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {profile.is_active ? (
                        <DropdownMenuItem
                          onClick={handleOpenDeactivateModal}
                          className="text-red-600 focus:text-red-600"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Deactivate Agent
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={handleOpenDeactivateModal}
                          className="text-green-600 focus:text-green-600"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Reactivate Agent
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>

          {/* Compliance Footer Strip */}
          <div className="border-t border-border/50 px-6 py-3 flex items-center gap-5">
            {/* AHIP */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {profile.ahip_cert_year || hasInferredAhip ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
              <span>{profile.ahip_cert_year || hasInferredAhip ? `AHIP ${profile.ahip_cert_year || CURRENT_AHIP_YEAR}` : 'AHIP Required'}</span>
            </div>
            {/* E&O */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>E&O</span>
            </div>
            {/* Licensed */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Licensed</span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            ROW 1: CARRIERS + DOCUMENTS + NOTES (3 columns)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* LEFT: Carrier Statuses Card */}
          <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden flex flex-col h-[348px]">
            <div className="px-5 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Carriers</h2>
              {carrierStatuses.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {carrierStatuses.filter(s => s.contracting_status === 'contracted').length} of {carrierStatuses.length}
                </span>
              )}
            </div>

            {carrierStatuses.length === 0 ? (
              <div className="px-5 py-12 text-center border-t border-border/50 flex-1 flex flex-col items-center justify-center">
                {profile.onboarding_status === 'CONTRACTING_SUBMITTED' ? (
                  <>
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm font-medium">All set. We're getting you contracted with your carriers.</p>
                    <p className="text-sm text-muted-foreground mt-1">This usually takes 3–4 business days.</p>
                  </>
                ) : profile.onboarding_status === 'CONTRACTING_REQUIRED' ? (
                  <>
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Ready when you are.</p>
                    <p className="text-sm text-muted-foreground mt-1">Complete contracting to start selling.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="mt-3"
                    >
                      <Link to="/contracting">Get Started</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">No carrier appointments yet</p>
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenCarrierRequest}
                        className="mt-3 gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Request Carrier
                      </Button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="border-t border-border/50 flex-1 min-h-0 overflow-y-auto">
                  {carrierStatuses.map((status) => (
                    <div
                      key={status.id}
                      className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors border-t border-border/30 first:border-t-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          status.contracting_status === 'contracted' ? 'bg-green-500' :
                          status.contracting_status === 'in_progress' ? 'bg-amber-500' :
                          status.contracting_status === 'issue' ? 'bg-red-500' : 'bg-gray-300'
                        }`} />
                        <span className="text-sm text-foreground">{status.carrier_name}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {status.contracted_at ? `Updated ${format(new Date(status.contracted_at), 'MMM d')}` :
                         status.contracting_submitted_at ? `Updated ${format(new Date(status.contracting_submitted_at), 'MMM d')}` : null}
                      </span>
                    </div>
                  ))}
                </div>
                {canEdit && (
                  <div className="px-5 py-3 border-t border-border/50 hover:bg-muted/20 transition-colors">
                    <button onClick={handleOpenCarrierRequest} className="text-sm text-primary font-medium hover:text-primary/80 transition-colors">
                      Request carrier
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* MIDDLE: Documents (always visible) */}
          <AgentDocumentsSection
            profileId={profile.id}
            canUpload={isAdmin() || isSelfView}
            isAdmin={isAdmin()}
          />

          {/* RIGHT: Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden flex flex-col h-[348px]">
            <div className="px-5 py-4">
              <h2 className="font-semibold text-foreground">Notes</h2>
            </div>
            {isEditingNotes ? (
              <div className="px-5 pb-5 border-t border-border/50 flex-1">
                <textarea
                  ref={notesTextareaRef}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  onKeyDown={handleNotesKeyDown}
                  onBlur={handleNotesBlur}
                  className="w-full min-h-[120px] text-sm p-2 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-brand/50 focus:border-brand resize-y mt-4"
                  placeholder="Add contracting notes..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Enter</kbd> to save, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to cancel
                </p>
              </div>
            ) : (
              <div className="px-5 pb-5 border-t border-border/50 flex-1 overflow-y-auto">
                <div
                  onClick={handleNotesClick}
                  className={canEditNotes ? 'group relative cursor-pointer hover:bg-muted/20 rounded-md p-2 -m-2 transition-colors mt-4' : 'mt-4'}
                  title={canEditNotes ? 'Click to edit' : undefined}
                >
                  {canEditNotes && (
                    <Pencil className="h-3.5 w-3.5 absolute top-2 right-2 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  {profile.contracting_notes ? (
                    <p className="text-sm whitespace-pre-wrap">{profile.contracting_notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No notes yet</p>
                  )}
                </div>
                {notesSaveStatus === 'saved' && (
                  <p className="text-xs text-green-600 mt-2 animate-fade-in">Saved ✓</p>
                )}
                {notesSaveStatus === 'saving' && (
                  <p className="text-xs text-muted-foreground mt-2">Saving...</p>
                )}
                {notesSaveStatus === 'error' && notesError && (
                  <p className="text-xs text-red-600 mt-2">{notesError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Carrier Request Modal */}
      <Dialog open={isCarrierRequestOpen} onOpenChange={(open) => !open && handleCloseCarrierRequest()}>
        <DialogContent className="max-w-4xl">
          {/* Subtle overlay when sending */}
          {(carrierRequestStatus === 'sending' || carrierRequestStatus === 'success') && (
            <div className="absolute inset-0 bg-background/50 z-10 rounded-lg" />
          )}

          <DialogHeader>
            <DialogTitle>Request Additional Carrier</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Select carriers to request contracting for {profile?.full_name || 'this agent'}
            </p>
          </DialogHeader>

          {carrierRequestError && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{carrierRequestError}</p>
            </div>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-2 gap-6 py-2">
            {/* Left Column: To + Carriers */}
            <div className="space-y-4">
              {/* To Field */}
              <div className="space-y-1.5">
                <Label htmlFor="carrier-request-to">To</Label>
                <Input
                  id="carrier-request-to"
                  type="email"
                  value={requestCarrierTo}
                  onChange={(e) => setRequestCarrierTo(e.target.value)}
                />
              </div>

              {/* Subject Field */}
              <div className="space-y-1.5">
                <Label htmlFor="carrier-request-subject">Subject</Label>
                <Input
                  id="carrier-request-subject"
                  value={requestCarrierSubject}
                  onChange={(e) => setRequestCarrierSubject(e.target.value)}
                />
              </div>

              {/* Carrier Checkboxes */}
              <div className="space-y-1.5">
                <Label>Select Carriers</Label>
                {availableCarriers.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border rounded-md">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">This agent has all available carriers</p>
                  </div>
                ) : (
                  <div className="border rounded-md p-3 space-y-2 bg-muted/30 max-h-[300px] overflow-y-auto">
                    {availableCarriers.map((carrier) => (
                      <label
                        key={carrier.id}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                      >
                        <Checkbox
                          checked={selectedCarriersForRequest.includes(carrier.id)}
                          onCheckedChange={(checked) => handleCarrierToggle(carrier.id, !!checked)}
                        />
                        <span>{carrier.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {selectedCarriersForRequest.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedCarriersForRequest.length} carrier{selectedCarriersForRequest.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Message */}
            <div className="space-y-1.5">
              <Label htmlFor="carrier-request-body">Message</Label>
              <Textarea
                id="carrier-request-body"
                value={requestCarrierBody}
                onChange={(e) => setRequestCarrierBody(e.target.value)}
                rows={12}
                className="font-mono text-sm h-full min-h-[300px]"
              />
            </div>
          </div>

          {/* Confirmation Section - spans full width */}
          {availableCarriers.length > 0 && (
            <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Agent:</span>
                    <span className="ml-2 font-medium">{profile?.full_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">NPN:</span>
                    <span className="ml-2 font-medium">{profile?.npn || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Recipient:</span>
                    <span className="ml-2 font-medium">{requestCarrierTo}</span>
                  </div>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-3 pt-2 border-t cursor-pointer">
                <Checkbox
                  checked={carrierRequestConfirmed}
                  onCheckedChange={(checked) => setCarrierRequestConfirmed(!!checked)}
                  className="mt-0.5"
                />
                <span className="text-sm text-slate-700">
                  I confirm this carrier request is ready to send
                </span>
              </label>
            </div>
          )}

          <DialogFooter className="relative z-20">
            <Button
              variant="outline"
              onClick={handleCloseCarrierRequest}
              disabled={carrierRequestStatus === 'sending' || carrierRequestStatus === 'success'}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendCarrierRequest}
              disabled={
                carrierRequestStatus === 'sending' ||
                carrierRequestStatus === 'success' ||
                !carrierRequestConfirmed ||
                selectedCarriersForRequest.length === 0
              }
              className={`gap-2 min-w-[120px] ${carrierRequestStatus === 'success' ? 'bg-green-600 hover:bg-green-600' : ''}`}
              title={!carrierRequestConfirmed ? 'Please confirm before sending' : undefined}
            >
              {getCarrierRequestButtonContent()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hierarchy Assignment Modal */}
      <AssignManagerModal
        open={isHierarchyModalOpen}
        onOpenChange={setIsHierarchyModalOpen}
        agentIds={profile ? [profile.id] : []}
        agentName={profile?.full_name || undefined}
        currentManagerId={profile?.manager_id}
        currentOwnershipGroup={profile?.ownership_group}
        onSuccess={handleHierarchySuccess}
      />

      {/* Deactivate/Reactivate Modal */}
      <Dialog open={isDeactivateModalOpen} onOpenChange={(open) => !open && handleCloseDeactivateModal()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {profile.is_active ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Deactivate Agent
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 text-green-500" />
                  Reactivate Agent
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {deactivateError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{deactivateError}</p>
              </div>
            )}

            {profile.is_active ? (
              // Deactivate flow
              directReports.length === 0 ? (
                // No direct reports - simple deactivation
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-800">
                      Are you sure you want to deactivate <strong>{profile.full_name}</strong>?
                      They will no longer appear in active agent lists.
                    </p>
                  </div>

                  <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30">
                    <Checkbox
                      checked={deactivateConfirmed}
                      onCheckedChange={(checked) => setDeactivateConfirmed(!!checked)}
                      className="mt-0.5"
                    />
                    <span className="text-sm">I understand this will deactivate the agent</span>
                  </label>
                </div>
              ) : (
                // Has direct reports - need to handle them
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>{profile.full_name}</strong> has <strong>{directReports.length}</strong> direct report{directReports.length !== 1 ? 's' : ''}.
                        You must reassign them before deactivating.
                      </span>
                    </p>
                  </div>

                  {/* Direct reports list */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Direct Reports</Label>
                    <div className="border rounded-md max-h-[150px] overflow-y-auto divide-y">
                      {directReports.map((report) => (
                        <div key={report.id} className="px-3 py-2 flex items-center justify-between">
                          <span className="text-sm">{report.full_name || 'Unnamed Agent'}</span>
                          <Link
                            to={`/admin/agents/${report.id}`}
                            className="text-xs text-gold hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Option A: Reassign to new manager */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Reassign all to:</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search for a manager..."
                        value={deactivateSearch}
                        onChange={(e) => setDeactivateSearch(e.target.value)}
                        className="pl-9"
                        disabled={deactivateAllReports}
                      />
                    </div>
                    <div className={`border rounded-md max-h-[150px] overflow-y-auto ${deactivateAllReports ? 'opacity-50' : ''}`}>
                      {/* TIG Direct option */}
                      <button
                        onClick={() => !deactivateAllReports && setReassignToManagerId(null)}
                        disabled={deactivateAllReports}
                        className={`w-full text-left px-3 py-2 border-b hover:bg-muted/30 transition-colors flex items-center justify-between ${
                          reassignToManagerId === null ? 'bg-gold/10' : ''
                        }`}
                      >
                        <span className="text-sm">TIG (Direct)</span>
                        {reassignToManagerId === null && (
                          <Check className="h-4 w-4 text-gold" />
                        )}
                      </button>
                      {filteredManagers.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                          {deactivateSearch ? 'No managers match your search' : 'No managers available'}
                        </div>
                      ) : (
                        filteredManagers.slice(0, 10).map((mgr) => (
                          <button
                            key={mgr.id}
                            onClick={() => !deactivateAllReports && setReassignToManagerId(mgr.id)}
                            disabled={deactivateAllReports}
                            className={`w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-muted/30 transition-colors flex items-center justify-between ${
                              reassignToManagerId === mgr.id ? 'bg-gold/10' : ''
                            }`}
                          >
                            <span className="text-sm">{mgr.full_name || 'Unnamed'}</span>
                            {reassignToManagerId === mgr.id && (
                              <Check className="h-4 w-4 text-gold" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Option B: Deactivate all */}
                  <div className="border-t pt-4">
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50/50 cursor-pointer hover:bg-red-50">
                      <Checkbox
                        checked={deactivateAllReports}
                        onCheckedChange={(checked) => {
                          setDeactivateAllReports(!!checked);
                          if (checked) setReassignToManagerId(null);
                        }}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="text-sm font-medium text-red-700">Deactivate all</span>
                        <p className="text-xs text-red-600 mt-0.5">
                          This will deactivate {profile.full_name} AND all {directReports.length} direct report{directReports.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Confirmation */}
                  <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30">
                    <Checkbox
                      checked={deactivateConfirmed}
                      onCheckedChange={(checked) => setDeactivateConfirmed(!!checked)}
                      className="mt-0.5"
                    />
                    <span className="text-sm">I understand this action</span>
                  </label>
                </div>
              )
            ) : (
              // Reactivate flow
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-800">
                    Reactivate <strong>{profile.full_name}</strong>?
                    They will appear in active agent lists again.
                  </p>
                </div>

                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/30">
                  <Checkbox
                    checked={deactivateConfirmed}
                    onCheckedChange={(checked) => setDeactivateConfirmed(!!checked)}
                    className="mt-0.5"
                  />
                  <span className="text-sm">I confirm I want to reactivate this agent</span>
                </label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDeactivateModal}
              disabled={deactivateStatus === 'processing' || deactivateStatus === 'success'}
            >
              Cancel
            </Button>
            {profile.is_active ? (
              <Button
                onClick={handleDeactivate}
                disabled={
                  deactivateStatus === 'processing' ||
                  deactivateStatus === 'success' ||
                  !deactivateConfirmed ||
                  (directReports.length > 0 && reassignToManagerId === undefined && !deactivateAllReports)
                }
                className={`gap-2 min-w-[100px] ${
                  deactivateStatus === 'success'
                    ? 'bg-green-600 hover:bg-green-600'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {deactivateStatus === 'processing' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : deactivateStatus === 'success' ? (
                  <>
                    <Check className="h-4 w-4" />
                    Done!
                  </>
                ) : (
                  'Deactivate'
                )}
              </Button>
            ) : (
              <Button
                onClick={handleReactivate}
                disabled={
                  deactivateStatus === 'processing' ||
                  deactivateStatus === 'success' ||
                  !deactivateConfirmed
                }
                className={`gap-2 min-w-[100px] ${
                  deactivateStatus === 'success'
                    ? 'bg-green-600 hover:bg-green-600'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {deactivateStatus === 'processing' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : deactivateStatus === 'success' ? (
                  <>
                    <Check className="h-4 w-4" />
                    Done!
                  </>
                ) : (
                  'Reactivate'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
