import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Users, FileCheck, Clock, CheckCircle, AlertCircle, Construction, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

type FeatureStatus = 'built' | 'in-progress' | 'not-built';

interface StageData {
  id: string;
  name: string;
  status: FeatureStatus;
  agent: {
    sees: string[];
    does: string[];
    canAccess: string[];
  };
  headOfContracting: {
    sees: string[];
    does: string[];
    canAccess: string[];
  };
  admin: {
    sees: string[];
    does: string[];
    canAccess: string[];
  };
  handoff?: string;
  notes?: string;
}

// This is the living document - update status as features are built
const JOURNEY_STAGES: StageData[] = [
  {
    id: 'invitation',
    name: '1. Invitation',
    status: 'built',
    agent: {
      sees: [
        'Email from Caroline with "Activate Your Account" button',
        'Professional welcome message explaining next steps',
      ],
      does: [
        'Clicks activation link in email',
        'Sets their password',
        'Logs in for first time',
      ],
      canAccess: ['Set Password page only'],
    },
    headOfContracting: {
      sees: ['N/A - Agent not in system yet'],
      does: ['N/A'],
      canAccess: ['N/A'],
    },
    admin: {
      sees: [
        'Admin → Agents → Add Agent form',
        'Name, email, manager fields',
      ],
      does: [
        'Creates agent account',
        'Assigns manager (optional)',
        'Triggers welcome email',
      ],
      canAccess: ['Admin Dashboard', 'Agents page', 'New Agent form'],
    },
    handoff: 'Admin creates account → Email sent → Agent receives invitation',
  },
  {
    id: 'contracting',
    name: '2. Contracting',
    status: 'built',
    agent: {
      sees: [
        'Locked to contracting wizard only',
        '9-step wizard with progress indicator',
        'Auto-save confirmation',
        'Professional, guided experience',
      ],
      does: [
        'Step 1: Welcome - Enter initials',
        'Step 2: Personal Info - Name, DOB, SSN, address',
        'Step 3: Licensing - NPN, state license, upload license',
        'Step 4: Legal Questions - Background questions',
        'Step 5: Banking - Direct deposit info, upload voided check',
        'Step 6: Training - Certifications, upload E&O',
        'Step 7: Carrier Selection - Choose carriers to contract with',
        'Step 8: Agreements - Accept terms, sign',
        'Step 9: Review - Final review and submit',
      ],
      canAccess: ['/contracting only - full platform locked'],
    },
    headOfContracting: {
      sees: ['Nothing yet - waiting for submission'],
      does: ['Waiting'],
      canAccess: ['Can check queue but agent not there yet'],
    },
    admin: {
      sees: [
        'Agent appears in Agents list',
        'Status: "Needs Contracting"',
      ],
      does: ['Monitor agent list', 'Can resend setup email if needed'],
      canAccess: ['Admin Dashboard', 'Agents page'],
    },
    handoff: 'Agent completes wizard → Clicks Submit → Status changes',
  },
  {
    id: 'submitted',
    name: '3. Submitted / Under Review',
    status: 'in-progress',
    agent: {
      sees: [
        'Full platform now accessible',
        '"Under Review" status message',
        'Dashboard with platform tools',
      ],
      does: [
        'Explores platform',
        'Accesses training, carrier resources',
        'Waits for contracting to complete',
      ],
      canAccess: [
        'Full platform: Dashboard, Training, Agent Tools, Certifications, etc.',
        'Profile dropdown with their info',
      ],
    },
    headOfContracting: {
      sees: [
        'New submission in Contracting Queue',
        'Left panel: Agent list with statuses',
        'Right panel: Full submission details',
        'All uploaded documents',
        'Selected carriers',
      ],
      does: [
        'Reviews submission for completeness',
        'Selects Contract Level (Agent/Street)',
        'Selects Upline (Direct to TIG or Manager)',
        'Clicks "Send to Upline"',
      ],
      canAccess: ['Admin Dashboard', 'Contracting Queue'],
    },
    admin: {
      sees: [
        'Agent status: "Pending Review"',
        'Same queue access as Head of Contracting',
      ],
      does: ['Monitor', 'Can assist with queue if needed'],
      canAccess: ['Admin Dashboard', 'Contracting Queue', 'Agents page'],
    },
    handoff: 'Head of Contracting reviews → Sends to Upline → Upline processes',
    notes: 'GAP: Agent needs to see their carrier statuses on their dashboard',
  },
  {
    id: 'sent-to-upline',
    name: '4. Sent to Upline',
    status: 'built',
    agent: {
      sees: [
        'Status: "Processing"',
        'Same platform access',
      ],
      does: ['Continues exploring platform', 'Waits'],
      canAccess: ['Full platform'],
    },
    headOfContracting: {
      sees: [
        'Submission marked "Sent to Upline"',
        'Timestamp of when sent',
        'Which upline it was sent to',
      ],
      does: [
        'Monitors status',
        'Follows up with upline if needed',
        'Waits for carrier reports',
      ],
      canAccess: ['Contracting Queue'],
    },
    admin: {
      sees: ['Same as Head of Contracting'],
      does: ['Monitor'],
      canAccess: ['Admin Dashboard', 'Contracting Queue'],
    },
    handoff: 'Upline submits to carriers → Carriers process → Reports come back',
    notes: 'This happens outside the platform - upline works with carriers directly',
  },
  {
    id: 'carrier-processing',
    name: '5. Carrier Processing',
    status: 'built',
    agent: {
      sees: [
        'Status still shows "Processing"',
        'Per-carrier status (Pending/Appointed/Issue)',
      ],
      does: [
        'Waits for carrier appointments',
        'Checks status periodically',
      ],
      canAccess: ['Full platform'],
    },
    headOfContracting: {
      sees: [
        'Per-carrier status dropdowns',
        'Transfer checkbox for each carrier',
        'Ability to add notes',
      ],
      does: [
        'Updates carrier statuses as reports come in',
        'Pending → Appointed (when carrier confirms)',
        'Pending → Issue (if problems arise)',
        'Marks transfers vs new contracts',
        'Contacts agent if issues',
      ],
      canAccess: ['Contracting Queue with carrier status panel'],
    },
    admin: {
      sees: ['Same carrier status view'],
      does: ['Can update statuses if needed'],
      canAccess: ['Contracting Queue'],
    },
    handoff: 'Carrier confirms → Head of Contracting updates status → Agent sees update',
    notes: 'GAP: Agent should see carrier status updates on their dashboard',
  },
  {
    id: 'appointed',
    name: '6. Fully Appointed',
    status: 'not-built',
    agent: {
      sees: [
        'Status: "Fully Appointed" 🎉',
        'All carriers show green checkmarks',
        'Celebration message',
        'Reminder to check email for carrier portal logins',
      ],
      does: [
        'Receives carrier portal credentials via email',
        'Sets up carrier portal accounts',
        'Ready to sell',
      ],
      canAccess: ['Full platform', 'Carrier Portals page with login links'],
    },
    headOfContracting: {
      sees: [
        'Agent marked as "Appointed"',
        'All carriers green',
        'Completion timestamp',
      ],
      does: [
        'Confirms all carriers appointed',
        'Manually updates profile to APPOINTED status',
        'Archives or marks complete',
      ],
      canAccess: ['Contracting Queue', 'Agent detail page'],
    },
    admin: {
      sees: ['Agent status: "Appointed" in Agents list'],
      does: ['Monitor', 'Generate reports'],
      canAccess: ['Full admin access'],
    },
    handoff: 'All carriers appointed → Agent fully onboarded → Ready to sell',
    notes: 'GAP: Need celebration UI, automatic status update when all carriers appointed',
  },
  {
    id: 'ongoing',
    name: '7. Ongoing / Active Agent',
    status: 'in-progress',
    agent: {
      sees: [
        'Full platform dashboard',
        'Quoting tools',
        'Carrier resources',
        'Training materials',
        'Certifications tracker',
      ],
      does: [
        'Quotes and sells policies',
        'Completes certifications',
        'Accesses carrier portals',
        'Uses agent tools',
      ],
      canAccess: ['Everything except Admin'],
    },
    headOfContracting: {
      sees: ['Agent in "Appointed" status', 'Historical contracting data'],
      does: ['Handles any contracting updates', 'Processes carrier additions'],
      canAccess: ['Contracting Queue', 'Historical records'],
    },
    admin: {
      sees: [
        'Active agent count',
        'Performance metrics (future)',
        'Certification compliance',
      ],
      does: [
        'Manages platform',
        'Adds new carriers/resources',
        'Monitors compliance',
      ],
      canAccess: ['Full admin access'],
    },
  },
];

const StatusBadge = ({ status }: { status: FeatureStatus }) => {
  const config = {
    'built': { icon: CheckCircle, label: 'Built', className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
    'in-progress': { icon: Construction, label: 'In Progress', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
    'not-built': { icon: AlertCircle, label: 'Not Built', className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
  };
  const { icon: Icon, label, className } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};

const RoleColumn = ({ 
  title, 
  color, 
  data 
}: { 
  title: string; 
  color: string; 
  data: { sees: string[]; does: string[]; canAccess: string[] } 
}) => (
  <div className="flex-1 min-w-0">
    <div className={`h-1.5 ${color} rounded-t-lg`} />
    <div className="p-4 bg-muted/30 rounded-b-lg border border-t-0 border-border">
      <h4 className="font-semibold text-sm mb-3">{title}</h4>
      
      <div className="space-y-3 text-xs">
        <div>
          <p className="font-medium text-muted-foreground mb-1">Sees</p>
          <ul className="space-y-0.5">
            {data.sees.map((item, i) => (
              <li key={i} className="text-foreground/80">• {item}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <p className="font-medium text-muted-foreground mb-1">Does</p>
          <ul className="space-y-0.5">
            {data.does.map((item, i) => (
              <li key={i} className="text-foreground/80">• {item}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <p className="font-medium text-muted-foreground mb-1">Can Access</p>
          <ul className="space-y-0.5">
            {data.canAccess.map((item, i) => (
              <li key={i} className="text-foreground/80">• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export default function PlatformExperienceMapPage() {
  const navigate = useNavigate();
  const [expandedStages, setExpandedStages] = useState<string[]>(JOURNEY_STAGES.map(s => s.id));
  const [liveStats, setLiveStats] = useState({
    contractingRequired: 0,
    contractSubmitted: 0,
    appointed: 0,
    totalAgents: 0,
    lastSubmission: null as string | null,
  });

  // Fetch live stats
  useEffect(() => {
    const fetchStats = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('onboarding_status, user_id')
        .eq('is_test', false);

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['independent_agent', 'internal_tig_agent']);

      const agentUserIds = new Set(roles?.map(r => r.user_id) || []);
      const agentProfiles = profiles?.filter(p => agentUserIds.has(p.user_id)) || [];

      const { data: lastApp } = await supabase
        .from('contracting_applications')
        .select('submitted_at')
        .eq('is_test', false)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setLiveStats({
        contractingRequired: agentProfiles.filter(p => p.onboarding_status === 'CONTRACTING_REQUIRED').length,
        contractSubmitted: agentProfiles.filter(p => p.onboarding_status === 'CONTRACT_SUBMITTED').length,
        appointed: agentProfiles.filter(p => p.onboarding_status === 'APPOINTED').length,
        totalAgents: agentProfiles.length,
        lastSubmission: lastApp?.submitted_at || null,
      });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleStage = (id: string) => {
    setExpandedStages(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const expandAll = () => setExpandedStages(JOURNEY_STAGES.map(s => s.id));
  const collapseAll = () => setExpandedStages([]);

  const handlePrint = () => {
    window.print();
  };

  const formatTimeAgo = (date: string | null) => {
    if (!date) return 'Never';
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Less than 1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          .stage-card { page-break-inside: avoid; }
        }
      `}} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 no-print">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/developer')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Platform Experience Map</h1>
              <p className="text-muted-foreground">Complete user journey across all roles</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold">TIG Platform Experience Map</h1>
          <p className="text-muted-foreground">Generated {new Date().toLocaleDateString()}</p>
        </div>

        {/* Live Stats Bar */}
        <Card className="mb-6 no-print">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Live Data</span>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{liveStats.contractingRequired}</p>
                  <p className="text-xs text-muted-foreground">In Contracting</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{liveStats.contractSubmitted}</p>
                  <p className="text-xs text-muted-foreground">Under Review</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{liveStats.appointed}</p>
                  <p className="text-xs text-muted-foreground">Appointed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{liveStats.totalAgents}</p>
                  <p className="text-xs text-muted-foreground">Total Agents</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{formatTimeAgo(liveStats.lastSubmission)}</p>
                  <p className="text-xs text-muted-foreground">Last Submission</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-6 text-sm no-print">
          <span className="text-muted-foreground">Feature Status:</span>
          <StatusBadge status="built" />
          <StatusBadge status="in-progress" />
          <StatusBadge status="not-built" />
        </div>

        {/* Journey Stages */}
        <div className="space-y-4">
          {JOURNEY_STAGES.map((stage, index) => (
            <Card key={stage.id} className="stage-card overflow-hidden">
              {/* Stage Header */}
              <button
                onClick={() => toggleStage(stage.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{stage.name}</h3>
                  <StatusBadge status={stage.status} />
                </div>
                {expandedStages.includes(stage.id) ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {/* Stage Content */}
              {expandedStages.includes(stage.id) && (
                <CardContent className="pt-0 pb-6">
                  {/* Three Role Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <RoleColumn title="Agent" color="bg-blue-500" data={stage.agent} />
                    <RoleColumn title="Head of Contracting" color="bg-purple-500" data={stage.headOfContracting} />
                    <RoleColumn title="Admin" color="bg-amber-500" data={stage.admin} />
                  </div>

                  {/* Handoff */}
                  {stage.handoff && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
                      <p className="text-sm">
                        <span className="font-medium text-foreground">Handoff: </span>
                        <span className="text-muted-foreground">{stage.handoff}</span>
                      </p>
                    </div>
                  )}

                  {/* Notes/Gaps */}
                  {stage.notes && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-sm">
                        <span className="font-medium text-amber-800 dark:text-amber-400">📝 Note: </span>
                        <span className="text-amber-700 dark:text-amber-300">{stage.notes}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Summary Stats for Print */}
        <div className="hidden print:block mt-8 p-4 border border-border rounded-lg">
          <h3 className="font-semibold mb-2">Build Status Summary</h3>
          <div className="text-sm space-y-1">
            <p>✅ Built: {JOURNEY_STAGES.filter(s => s.status === 'built').length} stages</p>
            <p>🚧 In Progress: {JOURNEY_STAGES.filter(s => s.status === 'in-progress').length} stages</p>
            <p>❌ Not Built: {JOURNEY_STAGES.filter(s => s.status === 'not-built').length} stages</p>
          </div>
        </div>
      </div>
    </div>
  );
}
