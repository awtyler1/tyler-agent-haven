import { useEffect, useState } from 'react';
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
  MinusCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { AgentDocumentsCard } from '@/components/admin/AgentDocumentsCard';

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

interface LocationState {
  from?: string;
  managerId?: string | null;
}

export default function AgentProfilePage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [manager, setManager] = useState<ManagerInfo | null>(null);
  const [carrierStatuses, setCarrierStatuses] = useState<CarrierStatus[]>([]);
  const [directReports, setDirectReports] = useState<DirectReport[]>([]);
  const [carrierNameMap, setCarrierNameMap] = useState<Map<string, string>>(new Map());
  const [hasInferredAhip, setHasInferredAhip] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Fetch carrier names for assigned/excluded carriers
        const allCarrierIds = [
          ...(profileData.assigned_carriers || []),
          ...(profileData.excluded_carriers || []),
        ];
        if (allCarrierIds.length > 0) {
          const { data: carriersData } = await supabase
            .from('carriers')
            .select('id, name')
            .in('id', allCarrierIds);

          if (carriersData) {
            setCarrierNameMap(new Map(carriersData.map((c) => [c.id, c.name])));
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
                    <p className="font-medium">{profile.full_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">NPN</p>
                    <p className="font-medium">{profile.npn || '—'}</p>
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
                {profile.contracting_notes && (
                  <div className="pt-3 border-t">
                    <p className="text-muted-foreground text-sm mb-1">Contracting Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{profile.contracting_notes}</p>
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
                  {carrierStatuses.length > 0 && (
                    <span className="text-xs font-normal text-muted-foreground ml-auto">
                      {carrierStatuses.filter(s => s.contracting_status === 'contracted').length} / {carrierStatuses.length} contracted
                    </span>
                  )}
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
                      <p className="text-sm text-muted-foreground">Reports To</p>
                      <p className="font-medium">
                        {manager?.full_name || 'TIG (Direct)'}
                      </p>
                    </div>
                    {manager && (
                      <Link to={`/admin/agents/${manager.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    )}
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

          {/* Assigned/Excluded Carriers - Only show if either exists */}
          {((profile.assigned_carriers && profile.assigned_carriers.length > 0) ||
            (profile.excluded_carriers && profile.excluded_carriers.length > 0)) && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Carrier Assignments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.assigned_carriers && profile.assigned_carriers.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Assigned Carriers
                    </p>
                    <p className="text-sm font-medium">
                      {profile.assigned_carriers
                        .map((id) => carrierNameMap.get(id) || id)
                        .join(', ')}
                    </p>
                  </div>
                )}
                {profile.excluded_carriers && profile.excluded_carriers.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
                      <MinusCircle className="h-4 w-4 text-red-600" />
                      Excluded Carriers
                    </p>
                    <p className="text-sm font-medium">
                      {profile.excluded_carriers
                        .map((id) => carrierNameMap.get(id) || id)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Agent Documents - Only show if user_id exists */}
          {profile.user_id && (
            <div className="mt-6">
              <AgentDocumentsCard userId={profile.user_id} />
            </div>
          )}

          {/* Quick Actions - Placeholder */}
          <div className="mt-6 flex items-center justify-end gap-3">
            {profile.user_id && (
              <Link to={`/admin/users/${profile.user_id}`}>
                <Button variant="outline">
                  View Full User Details
                </Button>
              </Link>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
