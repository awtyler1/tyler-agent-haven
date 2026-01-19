import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Mail,
  User,
  Shield,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  FileText,
  Users,
  Building2,
  CreditCard,
  GitBranch,
  Hash,
  Award,
  ChevronRight,
  AlertCircle,
  Pencil,
  Plus,
  Check,
  Search,
  AlertTriangle,
  UserMinus,
  UserPlus,
  Send,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { AgentDocumentsCard } from '@/components/admin/AgentDocumentsCard';
import { useAuth } from '@/hooks/useAuth';
import { useSendEmail } from '@/hooks/useSendEmail';
import { toast } from 'sonner';

interface AgentProfile {
  id: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  npn: string | null;
  manager_id: string | null;
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

export default function AgentProfilePage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const { isAdmin, isSuperAdmin } = useAuth();

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
  interface AgentOption {
    id: string;
    full_name: string | null;
    manager_id: string | null;
  }
  const [isHierarchyModalOpen, setIsHierarchyModalOpen] = useState(false);
  const [allAgents, setAllAgents] = useState<AgentOption[]>([]);
  const [hierarchySearch, setHierarchySearch] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [hierarchySaveStatus, setHierarchySaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hierarchyError, setHierarchyError] = useState<string | null>(null);

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

        // Fetch carrier statuses if user_id exists
        if (profileData.user_id) {
          // Fetch carrier statuses (without join - FK not defined in PostgREST)
          const { data: statusData, error: statusError } = await supabase
            .from('carrier_statuses')
            .select('id, carrier_id, contracting_status, contracting_submitted_at, contracted_at')
            .eq('user_id', profileData.user_id)
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

  // Permission check for inline editing
  const canEdit = isAdmin();

  // Contracting notes handlers
  const handleNotesClick = () => {
    if (!canEdit) return;
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
    if (profile.user_id) {
      const newStatuses = selectedCarriersForRequest.map((carrierId) => ({
        user_id: profile.user_id!,
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
          .eq('user_id', profile.user_id)
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
  const handleOpenHierarchyModal = async () => {
    setIsHierarchyModalOpen(true);
    setHierarchySearch('');
    setSelectedManagerId(profile?.manager_id || null);
    setHierarchySaveStatus('idle');
    setHierarchyError(null);

    // Fetch all active agents
    const { data: agentsData, error: agentsError } = await supabase
      .from('profiles')
      .select('id, full_name, manager_id')
      .eq('is_active', true)
      .order('full_name');

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      setHierarchyError('Failed to load agents');
      return;
    }

    setAllAgents(agentsData || []);
  };

  const handleCloseHierarchyModal = () => {
    if (hierarchySaveStatus === 'saving') return;
    setIsHierarchyModalOpen(false);
  };

  // Get manager name for display in list
  const getManagerDisplayName = (managerId: string | null): string => {
    if (!managerId) return 'Direct to TIG';
    const mgr = allAgents.find((a) => a.id === managerId);
    return mgr?.full_name || 'Unknown';
  };

  // Check if assigning newManagerId would create a circular reference
  const wouldCreateCycle = (newManagerId: string | null): boolean => {
    if (!newManagerId || !profile) return false;

    // Walk up the chain from the new manager to see if we hit the current agent
    const visited = new Set<string>();
    let currentId: string | null = newManagerId;

    while (currentId) {
      if (currentId === profile.id) {
        return true; // Found the current agent in the hierarchy - cycle!
      }
      if (visited.has(currentId)) {
        break; // Already visited, prevent infinite loop
      }
      visited.add(currentId);

      const agent = allAgents.find((a) => a.id === currentId);
      currentId = agent?.manager_id || null;
    }

    return false;
  };

  // Filter agents for the list (exclude current agent and direct reports)
  const filteredAgents = allAgents.filter((agent) => {
    // Exclude self
    if (agent.id === profile?.id) return false;
    // Exclude anyone who directly reports to this agent (simple cycle prevention)
    if (agent.manager_id === profile?.id) return false;
    // Apply search filter
    if (hierarchySearch) {
      const search = hierarchySearch.toLowerCase();
      return agent.full_name?.toLowerCase().includes(search);
    }
    return true;
  });

  const handleSaveHierarchy = async () => {
    if (!profile) return;

    // Check for circular reference
    if (wouldCreateCycle(selectedManagerId)) {
      setHierarchyError('Cannot assign: this would create a circular reporting structure');
      return;
    }

    setHierarchySaveStatus('saving');
    setHierarchyError(null);

    const originalManagerId = profile.manager_id;

    // Optimistic update
    setProfile({ ...profile, manager_id: selectedManagerId });

    // Update manager display
    if (selectedManagerId) {
      const newMgr = allAgents.find((a) => a.id === selectedManagerId);
      setManager(newMgr ? { id: newMgr.id, full_name: newMgr.full_name, email: null } : null);
    } else {
      setManager(null);
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ manager_id: selectedManagerId })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setHierarchySaveStatus('saved');
      // Show success briefly before closing
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsHierarchyModalOpen(false);
    } catch (err: any) {
      // Revert on error
      setProfile({ ...profile, manager_id: originalManagerId });
      // Revert manager display
      if (originalManagerId) {
        const oldMgr = allAgents.find((a) => a.id === originalManagerId);
        setManager(oldMgr ? { id: oldMgr.id, full_name: oldMgr.full_name, email: null } : null);
      } else {
        setManager(null);
      }
      setHierarchySaveStatus('error');
      setHierarchyError(err.message || 'Failed to update manager');
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
        <Navigation />
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="text-sm text-muted-foreground">Loading agent profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
        <Navigation />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {error || 'Agent not found'}
            </h2>
            <Button variant="outline" onClick={() => navigate('/admin/agents')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const roleInfo = ROLE_LABELS[role || ''] || { label: role || 'Unknown', className: 'bg-gray-100 text-gray-700' };
  const statusInfo = ONBOARDING_STATUS_LABELS[profile.onboarding_status] || {
    label: profile.onboarding_status,
    className: 'bg-gray-100 text-gray-700',
  };

  const timelineEvents = [
    {
      label: 'Account Created',
      date: profile.created_at,
      completed: true,
      icon: User,
    },
    {
      label: 'Setup Link Sent',
      date: profile.setup_link_sent_at,
      completed: !!profile.setup_link_sent_at,
      icon: Mail,
    },
    {
      label: 'Password Created',
      date: profile.password_created_at,
      completed: !!profile.password_created_at,
      icon: Shield,
    },
    {
      label: 'First Login',
      date: profile.first_login_at,
      completed: !!profile.first_login_at,
      icon: CheckCircle2,
    },
    {
      label: 'Appointed',
      date: profile.appointed_at,
      completed: !!profile.appointed_at,
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />

      <main className="flex-1 pt-28 pb-12">
        <div className="container-narrow px-6 md:px-12 lg:px-20 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // If we have location state with a "from" path, navigate there
                // Otherwise fall back to browser history
                if (locationState?.from) {
                  navigate(locationState.from, {
                    state: { managerId: locationState.managerId }
                  });
                } else {
                  navigate(-1);
                }
              }}
              className="mb-4 hover:bg-gold/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="heading-section">{profile.full_name || 'Unnamed Agent'}</h1>
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
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                  {profile.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </span>
                  )}
                  {profile.npn && (
                    <span className="flex items-center gap-1.5">
                      <Hash className="h-4 w-4" />
                      NPN: {profile.npn}
                    </span>
                  )}
                </div>

                {/* Reports To */}
                <div className="flex items-center gap-2 mt-3 text-sm">
                  {manager ? (
                    <>
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Reports to:</span>
                      <Link
                        to={`/admin/agents/${manager.id}`}
                        className="text-gold hover:underline font-medium"
                      >
                        {manager.full_name || manager.email || 'Unknown'}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="text-muted-foreground">Reports to:</span>
                      <span className="font-medium text-blue-600">TIG (Direct)</span>
                    </>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${roleInfo.className}`}>
                  {roleInfo.label}
                </span>
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Full Name</p>
                    {isEditingName ? (
                      <div>
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
                          className="w-full text-sm font-medium px-2 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold"
                          placeholder="Full name"
                        />
                        {nameError && (
                          <p className="text-xs text-red-600 mt-1">{nameError}</p>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={handleNameClick}
                        className={canEdit ? 'group cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors' : ''}
                        title={canEdit ? 'Click to edit' : undefined}
                      >
                        <p className="font-medium inline-flex items-center">
                          {profile.full_name || '—'}
                          {canEdit && (
                            <Pencil className="h-3.5 w-3.5 ml-1.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </p>
                      </div>
                    )}
                    {nameSaveStatus === 'saved' && (
                      <p className="text-xs text-green-600 mt-0.5 animate-fade-in">Saved ✓</p>
                    )}
                    {nameSaveStatus === 'saving' && (
                      <p className="text-xs text-muted-foreground mt-0.5">Saving...</p>
                    )}
                    {nameSaveStatus === 'error' && nameError && !isEditingName && (
                      <p className="text-xs text-red-600 mt-0.5">{nameError}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    {isEditingEmail ? (
                      <div>
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
                          className="w-full text-sm font-medium px-2 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold"
                          placeholder="email@example.com"
                        />
                        {emailValidationError && (
                          <p className="text-xs text-red-600 mt-1">{emailValidationError}</p>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={handleEmailClick}
                        className={canEdit ? 'group cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors' : ''}
                        title={canEdit ? 'Click to edit' : undefined}
                      >
                        <p className="font-medium inline-flex items-center">
                          {profile.email || '—'}
                          {canEdit && (
                            <Pencil className="h-3.5 w-3.5 ml-1.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </p>
                      </div>
                    )}
                    {emailSaveStatus === 'saved' && (
                      <p className="text-xs text-green-600 mt-0.5 animate-fade-in">Saved ✓</p>
                    )}
                    {emailSaveStatus === 'saving' && (
                      <p className="text-xs text-muted-foreground mt-0.5">Saving...</p>
                    )}
                    {emailSaveStatus === 'error' && emailError && (
                      <p className="text-xs text-red-600 mt-0.5">{emailError}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">NPN</p>
                    {isEditingNpn ? (
                      <div>
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
                          className="w-24 text-sm font-medium px-2 py-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold"
                          placeholder="12345678"
                          maxLength={8}
                        />
                        {npnValidationError && (
                          <p className="text-xs text-red-600 mt-1">{npnValidationError}</p>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={handleNpnClick}
                        className={canEdit ? 'group cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors' : ''}
                        title={canEdit ? 'Click to edit' : undefined}
                      >
                        <p className="font-medium inline-flex items-center">
                          {profile.npn || '—'}
                          {canEdit && (
                            <Pencil className="h-3.5 w-3.5 ml-1.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </p>
                      </div>
                    )}
                    {npnSaveStatus === 'saved' && (
                      <p className="text-xs text-green-600 mt-0.5 animate-fade-in">Saved ✓</p>
                    )}
                    {npnSaveStatus === 'saving' && (
                      <p className="text-xs text-muted-foreground mt-0.5">Saving...</p>
                    )}
                    {npnSaveStatus === 'error' && npnError && (
                      <p className="text-xs text-red-600 mt-0.5">{npnError}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">AHIP Certification</p>
                    {profile.ahip_cert_year ? (
                      <div>
                        <p className="font-medium text-green-700 flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          AHIP {profile.ahip_cert_year} <CheckCircle2 className="h-3.5 w-3.5" />
                        </p>
                        {profile.ahip_cert_uploaded_at && (
                          <p className="text-xs text-muted-foreground">
                            Uploaded {format(new Date(profile.ahip_cert_uploaded_at), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    ) : hasInferredAhip ? (
                      <div>
                        <p className="font-medium text-green-700 flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          AHIP {CURRENT_AHIP_YEAR} <CheckCircle2 className="h-3.5 w-3.5" />
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Via carrier certifications
                        </p>
                      </div>
                    ) : (
                      <p className="font-medium text-amber-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        AHIP Required
                      </p>
                    )}
                  </div>
                </div>
                {/* Contracting Notes - Inline Editable */}
                <div className="pt-3 border-t">
                  <p className="text-muted-foreground text-sm mb-1">Contracting Notes</p>
                  {isEditingNotes ? (
                    <div>
                      <textarea
                        ref={notesTextareaRef}
                        value={draftNotes}
                        onChange={(e) => setDraftNotes(e.target.value)}
                        onKeyDown={handleNotesKeyDown}
                        onBlur={handleNotesBlur}
                        className="w-full min-h-[80px] text-sm p-2 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold resize-y"
                        placeholder="Add contracting notes..."
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Enter</kbd> to save, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to cancel
                      </p>
                    </div>
                  ) : (
                    <div
                      onClick={handleNotesClick}
                      className={canEdit ? 'group relative cursor-pointer hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors' : ''}
                      title={canEdit ? 'Click to edit' : undefined}
                    >
                      {canEdit && (
                        <Pencil className="h-3.5 w-3.5 absolute top-1 right-1 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                      {profile.contracting_notes ? (
                        <p className="text-sm whitespace-pre-wrap">{profile.contracting_notes}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground/60 italic">
                          {canEdit ? 'No notes — click to add' : 'No notes'}
                        </p>
                      )}
                    </div>
                  )}
                  {/* Save status indicator */}
                  {notesSaveStatus === 'saved' && (
                    <p className="text-xs text-green-600 mt-1 animate-fade-in">Saved ✓</p>
                  )}
                  {notesSaveStatus === 'saving' && (
                    <p className="text-xs text-muted-foreground mt-1">Saving...</p>
                  )}
                  {notesSaveStatus === 'error' && notesError && (
                    <p className="text-xs text-red-600 mt-1">{notesError}</p>
                  )}
                </div>

                {/* Role - Only show if user_id exists and canEdit */}
                {canEdit && profile.user_id && (
                  <div className="pt-3 border-t">
                    <Label className="text-muted-foreground text-sm">Role</Label>
                    {updatingRole ? (
                      <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Updating...</span>
                      </div>
                    ) : (
                      <Select
                        value={role || 'independent_agent'}
                        onValueChange={(value) => handleRoleChange(value as AppRole)}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(isSuperAdmin() ? ALL_ROLES : ADMIN_ASSIGNABLE_ROLES).map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_DROPDOWN_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Carrier Statuses Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Carrier Statuses
                  <div className="flex items-center gap-2 ml-auto">
                    {carrierStatuses.length > 0 && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {carrierStatuses.filter(s => s.contracting_status === 'contracted').length} / {carrierStatuses.length} contracted
                      </span>
                    )}
                    {canEdit && profile.user_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenCarrierRequest}
                        className="h-7 text-xs gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Request Carrier
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {carrierStatuses.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-6">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>No carrier statuses yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {carrierStatuses.map((status) => {
                      const config = CARRIER_STATUS_CONFIG[status.contracting_status] || CARRIER_STATUS_CONFIG.not_started;
                      return (
                        <div
                          key={status.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-sm">{status.carrier_name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.className}`}>
                              {config.label}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground text-right">
                            {status.contracted_at ? (
                              <span>Contracted {format(new Date(status.contracted_at), 'MMM d, yyyy')}</span>
                            ) : status.contracting_submitted_at ? (
                              <span>Submitted {format(new Date(status.contracting_submitted_at), 'MMM d, yyyy')}</span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hierarchy Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Hierarchy
                  {directReports.length > 0 && (
                    <span className="text-xs font-normal text-muted-foreground ml-auto">
                      {directReports.length} direct report{directReports.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Reports To */}
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        Reports To
                        {canEdit && (
                          <button
                            onClick={handleOpenHierarchyModal}
                            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                            title="Change manager"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </p>
                      <p className="font-medium">
                        {manager?.full_name || 'TIG (Direct)'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {manager && (
                        <Link to={`/admin/agents/${manager.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Direct Reports */}
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground mb-2">Direct Reports</p>
                    {directReports.length === 0 ? (
                      <p className="text-sm text-muted-foreground/60 italic">No direct reports</p>
                    ) : (
                      <div className="space-y-1">
                        {directReports.map((report) => (
                          <Link
                            key={report.id}
                            to={`/admin/agents/${report.id}`}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium group-hover:text-gold transition-colors">
                                {report.full_name || report.email || 'Unnamed'}
                              </span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold transition-colors" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timelineEvents.map((event, index) => {
                    const Icon = event.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 ${
                            event.completed ? 'text-green-600' : 'text-muted-foreground/40'
                          }`}
                        >
                          {event.completed ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium ${
                              event.completed ? '' : 'text-muted-foreground/60'
                            }`}
                          >
                            {event.label}
                          </p>
                          {event.date ? (
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(event.date), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground/50 italic">Not yet</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agent Documents - Only show if user_id exists */}
          {profile.user_id && (
            <div className="mt-6">
              <AgentDocumentsCard userId={profile.user_id} />
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-6 flex items-center justify-between">
            {/* Left side - Send Setup Link, Deactivate/Reactivate */}
            <div className="flex items-center gap-3">
              {/* Send Setup Link - only if user_id exists, canEdit, and password not yet set */}
              {canEdit && profile.user_id && !profile.password_created_at && (
                <Button
                  variant="outline"
                  onClick={handleSendSetupLink}
                  disabled={sendingSetupLink}
                  className="gap-2"
                >
                  {sendingSetupLink ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {profile.setup_link_sent_at ? 'Resend Setup Link' : 'Send Setup Link'}
                </Button>
              )}

              {/* Deactivate/Reactivate */}
              {canEdit && (
                profile.is_active ? (
                  <Button
                    variant="outline"
                    onClick={handleOpenDeactivateModal}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 gap-2"
                  >
                    <UserMinus className="h-4 w-4" />
                    Deactivate Agent
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleOpenDeactivateModal}
                    className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Reactivate Agent
                  </Button>
                )
              )}
            </div>

            {/* Right side - View User Details */}
            <div className="flex items-center gap-3">
              {profile.user_id && (
                <Link to={`/admin/users/${profile.user_id}`}>
                  <Button variant="outline">
                    View Full User Details
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

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
      <Dialog open={isHierarchyModalOpen} onOpenChange={(open) => !open && handleCloseHierarchyModal()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Change Reports To</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Select who {profile?.full_name || 'this agent'} reports to
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {hierarchyError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{hierarchyError}</p>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={hierarchySearch}
                onChange={(e) => setHierarchySearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Agent List */}
            <div className="border rounded-md max-h-[400px] overflow-y-auto">
              {/* TIG (Direct) Option */}
              <button
                onClick={() => setSelectedManagerId(null)}
                className={`w-full text-left p-3 border-b hover:bg-muted/50 transition-colors flex items-center justify-between ${
                  selectedManagerId === null ? 'bg-gold/10 border-l-2 border-l-gold' : ''
                }`}
              >
                <div>
                  <p className="font-medium flex items-center gap-2">
                    TIG (Direct)
                    {profile?.manager_id === null && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        current
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Reports directly to Tyler Insurance Group</p>
                </div>
                {selectedManagerId === null && (
                  <Check className="h-4 w-4 text-gold" />
                )}
              </button>

              {/* Agent Options */}
              {filteredAgents.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {hierarchySearch ? 'No agents match your search' : 'No agents available'}
                </div>
              ) : (
                filteredAgents.map((agent) => {
                  const isSelected = selectedManagerId === agent.id;
                  const isCurrent = profile?.manager_id === agent.id;
                  const managerDisplay = getManagerDisplayName(agent.manager_id);

                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedManagerId(agent.id)}
                      className={`w-full text-left p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors flex items-center justify-between ${
                        isSelected ? 'bg-gold/10 border-l-2 border-l-gold' : ''
                      }`}
                    >
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {agent.full_name || 'Unnamed Agent'}
                          {isCurrent && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              current
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          under {managerDisplay}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-gold" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseHierarchyModal}
              disabled={hierarchySaveStatus === 'saving'}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveHierarchy}
              disabled={hierarchySaveStatus === 'saving' || hierarchySaveStatus === 'saved'}
              className={`gap-2 min-w-[80px] ${hierarchySaveStatus === 'saved' ? 'bg-green-600 hover:bg-green-600' : ''}`}
            >
              {hierarchySaveStatus === 'saving' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : hierarchySaveStatus === 'saved' ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
