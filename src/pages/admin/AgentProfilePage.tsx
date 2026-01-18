import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

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
  assigned_carriers: string[] | null;
  excluded_carriers: string[] | null;
  contracting_notes: string | null;
}

interface ManagerInfo {
  id: string;
  full_name: string | null;
  email: string | null;
}

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

export default function AgentProfilePage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [manager, setManager] = useState<ManagerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              onClick={() => navigate(-1)}
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
                    <p className="text-muted-foreground">AHIP Year</p>
                    <p className="font-medium">{profile.ahip_cert_year || '—'}</p>
                  </div>
                </div>
                {profile.contracting_notes && (
                  <div className="pt-2 border-t">
                    <p className="text-muted-foreground text-sm">Notes</p>
                    <p className="text-sm mt-1">{profile.contracting_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Carrier Statuses Card - Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Carrier Statuses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground text-center py-8">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Carrier contracting statuses will appear here</p>
                  <p className="text-xs mt-1">
                    {profile.assigned_carriers?.length || 0} carriers assigned
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Hierarchy Card - Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Hierarchy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                  <div className="text-sm text-muted-foreground text-center py-4">
                    <p>Downline agents will appear here</p>
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
