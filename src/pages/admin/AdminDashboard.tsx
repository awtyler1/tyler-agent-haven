import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserPlus, 
  FileText, 
  AlertCircle,
  ArrowRight,
  Clock,
  CheckCircle,
  Settings,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

interface DashboardStats {
  totalAgents: number;
  inContracting: number;
  appointed: number;
}

interface AttentionItem {
  id: string;
  userId: string;
  name: string;
  reason: string;
  daysAgo: number;
  type: 'contracting_stale' | 'issue' | 'new_submission';
}

interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const { profile, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
    inContracting: 0,
    appointed: 0,
  });
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [newSubmissions, setNewSubmissions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resettingContracting, setResettingContracting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch profiles and roles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (!profiles || !roles) return;

      const roleMap = roles.reduce((acc, r) => {
        acc[r.user_id] = r.role;
        return acc;
      }, {} as Record<string, string>);

      // Filter to just agents
      const agentRoles = ['independent_agent', 'internal_tig_agent'];
      const agents = profiles.filter(p => agentRoles.includes(roleMap[p.user_id] || ''));

      // Calculate stats
      const inContracting = agents.filter(a => 
        a.onboarding_status === 'CONTRACTING_REQUIRED' || 
        a.onboarding_status === 'CONTRACT_SUBMITTED'
      ).length;

      const appointed = agents.filter(a => a.onboarding_status === 'APPOINTED').length;

      setStats({
        totalAgents: agents.length,
        inContracting,
        appointed,
      });

      // Fetch contracting applications for attention items and new submissions
      const { data: applications } = await supabase
        .from('contracting_applications')
        .select('id, user_id, full_legal_name, status, submitted_at, updated_at')
        .in('status', ['submitted', 'in_progress'])
        .order('submitted_at', { ascending: true });

      if (applications) {
        const now = new Date();
        const attention: AttentionItem[] = [];

        // Count new submissions
        const newSubs = applications.filter(a => a.status === 'submitted').length;
        setNewSubmissions(newSubs);

        // Find stale applications (submitted more than 3 days ago)
        applications.forEach(app => {
          if (app.submitted_at) {
            const submittedDate = new Date(app.submitted_at);
            const daysAgo = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysAgo >= 3 && app.status === 'submitted') {
              attention.push({
                id: app.id,
                userId: app.user_id,
                name: app.full_legal_name || 'Unknown',
                reason: `Submitted ${daysAgo} days ago, not yet started`,
                daysAgo,
                type: 'contracting_stale',
              });
            }
          }
        });

        // Check for carrier issues
        const { data: carrierIssues } = await supabase
          .from('carrier_statuses')
          .select(`
            id,
            user_id,
            issue_description,
            carriers (name)
          `)
          .eq('contracting_status', 'issue');

        if (carrierIssues) {
          for (const issue of carrierIssues) {
            const agent = profiles.find(p => p.user_id === issue.user_id);
            if (agent) {
              attention.push({
                id: issue.id,
                userId: issue.user_id,
                name: agent.full_name || 'Unknown',
                reason: `Issue with ${(issue.carriers as { name: string })?.name || 'carrier'}`,
                daysAgo: 0,
                type: 'issue',
              });
            }
          }
        }

        setAttentionItems(attention.slice(0, 5)); // Show max 5
      }

      // Build recent activity from recent agents
      const recentAgents = agents.slice(0, 5).map(agent => ({
        id: agent.id,
        description: `${agent.full_name || 'New agent'} added`,
        timestamp: agent.created_at,
      }));
      setRecentActivity(recentAgents);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetContractingByEmail = async (email: string) => {
    setResettingContracting(true);
    try {
      // Find user by email from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (profileError) {
        throw new Error(`Failed to find user: ${profileError.message}`);
      }

      if (!profile) {
        throw new Error(`User with email ${email} not found`);
      }

      const userId = profile.user_id;

      // Delete uploaded documents from storage (best-effort)
      try {
        const { data: files, error: listError } = await supabase.storage
          .from('contracting-documents')
          .list(userId);

        if (!listError && files && files.length > 0) {
          const filePaths = files.map((f) => `${userId}/${f.name}`);
          await supabase.storage.from('contracting-documents').remove(filePaths);

          // Also check for subdirectories (like contracting_packet/)
          for (const file of files) {
            if (!file.name.includes('.')) {
              const { data: subFiles } = await supabase.storage
                .from('contracting-documents')
                .list(`${userId}/${file.name}`);

              if (subFiles && subFiles.length > 0) {
                const subPaths = subFiles.map((sf) => `${userId}/${file.name}/${sf.name}`);
                await supabase.storage.from('contracting-documents').remove(subPaths);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Storage cleanup skipped/failed:', e);
      }

      // Delete carrier_statuses for this user
      const { error: carrierStatusError } = await supabase
        .from('carrier_statuses')
        .delete()
        .eq('user_id', userId);
      
      if (carrierStatusError) {
        console.warn('Failed to delete carrier_statuses:', carrierStatusError);
      }

      // Reset contracting_applications
      const { data: existingApp, error: fetchAppError } = await supabase
        .from('contracting_applications')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchAppError) {
        throw new Error(`Failed to fetch application: ${fetchAppError.message}`);
      }

      const resetPayload = {
        status: 'in_progress',
        submitted_at: null,
        current_step: 1,
        completed_steps: [],

        // form fields
        full_legal_name: null,
        agency_name: null,
        agency_tax_id: null,
        gender: null,
        birth_date: null,
        birth_city: null,
        birth_state: null,
        npn_number: null,
        insurance_license_number: null,
        tax_id: null,
        email_address: email,
        phone_mobile: null,
        phone_business: null,
        phone_home: null,
        fax: null,
        preferred_contact_methods: [],

        home_address: {},
        mailing_address_same_as_home: true,
        mailing_address: {},
        ups_address_same_as_home: true,
        ups_address: {},
        previous_addresses: [],

        resident_license_number: null,
        resident_state: null,
        license_expiration_date: null,
        non_resident_states: [],
        drivers_license_number: null,
        drivers_license_state: null,

        legal_questions: {},

        bank_routing_number: null,
        bank_account_number: null,
        bank_branch_name: null,
        beneficiary_name: null,
        beneficiary_relationship: null,
        beneficiary_birth_date: null,
        beneficiary_drivers_license_number: null,
        beneficiary_drivers_license_state: null,
        requesting_commission_advancing: false,

        has_aml_course: null,
        aml_course_name: null,
        aml_course_date: null,
        aml_training_provider: null,
        aml_completion_date: null,
        has_ltc_certification: false,
        state_requires_ce: false,
        eo_not_yet_covered: false,
        eo_provider: null,
        eo_policy_number: null,
        eo_expiration_date: null,
        is_finra_registered: false,
        finra_broker_dealer_name: null,
        finra_crd_number: null,

        selected_carriers: [],
        is_corporation: false,
        agreements: {},

        signature_name: null,
        signature_initials: null,
        signature_date: null,

        section_acknowledgments: {},
        uploaded_documents: {},
      };

      if (existingApp?.id) {
        const { error: resetError } = await supabase
          .from('contracting_applications')
          .update(resetPayload)
          .eq('id', existingApp.id);
        if (resetError) {
          throw new Error(`Failed to update application: ${resetError.message}`);
        }
      } else {
        const { error: createError } = await supabase
          .from('contracting_applications')
          .insert({ user_id: userId, ...resetPayload } as never);
        if (createError) {
          throw new Error(`Failed to create application: ${createError.message}`);
        }
      }

      // Reset profile onboarding status
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ onboarding_status: 'CONTRACTING_REQUIRED' })
        .eq('user_id', userId);
      
      if (profileUpdateError) {
        throw new Error(`Failed to update profile: ${profileUpdateError.message}`);
      }

      toast.success(`Contracting status reset for ${email}`);
    } catch (error) {
      console.error('Error resetting contracting status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset contracting status';
      toast.error(errorMessage);
    } finally {
      setResettingContracting(false);
    }
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />

      <main className="flex-1 pt-28 pb-12">
        <div className="container-narrow px-6 md:px-12 lg:px-20 max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-serif font-semibold text-foreground mb-1">
              Welcome back, {firstName}
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your agents
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-white rounded-xl border border-[#E5E2DB] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{stats.totalAgents}</p>
                  <p className="text-sm text-muted-foreground">Total Agents</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E2DB] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{stats.inContracting}</p>
                  <p className="text-sm text-muted-foreground">In Contracting</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E2DB] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{stats.appointed}</p>
                  <p className="text-sm text-muted-foreground">Appointed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Needs Attention */}
          {attentionItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-10">
              <h2 className="text-sm font-medium text-amber-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Needs Attention
              </h2>
              <div className="space-y-2">
                {attentionItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-amber-200 last:border-0">
                    <AlertCircle className="w-4 h-4 text-amber-600 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-900">{item.name}</p>
                      <p className="text-xs text-amber-700">{item.reason}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-600 ml-2 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-10">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Quick Actions
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <Button
                onClick={() => navigate('/admin/agents/new')}
                className="h-auto py-6 flex flex-col items-center gap-2 bg-white border border-[#E5E2DB] text-foreground hover:border-gold hover:bg-gold/5 shadow-sm"
                variant="outline"
              >
                <UserPlus className="w-6 h-6 text-gold" />
                Add Agent
              </Button>

              <Button
                onClick={() => navigate('/admin/contracting')}
                className="h-auto py-6 flex flex-col items-center gap-2 bg-white border border-[#E5E2DB] text-foreground hover:border-gold hover:bg-gold/5 shadow-sm relative"
                variant="outline"
              >
                <FileText className="w-6 h-6 text-gold" />
                Contracting Queue
                {newSubmissions > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {newSubmissions}
                  </span>
                )}
              </Button>

              <Button
                onClick={() => navigate('/admin/agents')}
                className="h-auto py-6 flex flex-col items-center gap-2 bg-white border border-[#E5E2DB] text-foreground hover:border-gold hover:bg-gold/5 shadow-sm"
                variant="outline"
              >
                <Users className="w-6 h-6 text-gold" />
                All Agents
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="mb-10">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Recent Activity
              </h2>
              <div className="bg-white rounded-xl border border-[#E5E2DB] divide-y divide-[#E5E2DB]">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className="px-4 py-3 flex items-center justify-between">
                    <p className="text-sm text-foreground">{activity.description}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Super Admin Tools */}
          {isSuperAdmin() && (
            <div className="mb-10">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Super Admin Tools
              </h2>
              <div className="bg-white rounded-xl border border-[#E5E2DB] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Reset Contracting Status</p>
                    <p className="text-xs text-muted-foreground">Reset contracting for austinwhitmertyler@gmail.com</p>
                  </div>
                  <Button
                    onClick={() => handleResetContractingByEmail('austinwhitmertyler@gmail.com')}
                    disabled={resettingContracting}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {resettingContracting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Settings Link (Super Admin Only) */}
          {isSuperAdmin() && (
            <div className="text-center">
              <Link to="/admin/settings" className="text-sm text-muted-foreground hover:text-gold inline-flex items-center gap-1">
                <Settings className="w-4 h-4" />
                System Settings
              </Link>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
