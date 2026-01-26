import { useState, useEffect } from 'react';
import { ArrowUp, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CarrierCard } from './CarrierCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardViewProps {
  profileId: string;
  refreshKey?: number;
  onUploadClick: () => void;
}

interface CarrierData {
  id: string;
  code: string;
  name: string;
  clientCount: number;
  lastUploadDate: Date | null;
}

interface RecentActivity {
  id: string;
  clientName: string;
  carrierName: string;
  planName: string;
  status: 'active' | 'termed';
  effectiveDate: string | null;
  termDate: string | null;
}

export function DashboardView({ profileId, refreshKey, onUploadClick }: DashboardViewProps) {
  const [loading, setLoading] = useState(true);
  const [totalClients, setTotalClients] = useState(0);
  const [newThisMonth, setNewThisMonth] = useState(0);
  const [activeMA, setActiveMA] = useState(0);
  const [activePDP, setActivePDP] = useState(0);
  const [carrierData, setCarrierData] = useState<CarrierData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [profileId, refreshKey]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // Fetch total clients
      const { count: clientCount } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', profileId);

      setTotalClients(clientCount || 0);

      // Fetch policies by carrier with status
      const { data: policies } = await supabase
        .from('policies')
        .select(`
          id,
          carrier_id,
          status,
          plan_name,
          effective_date,
          term_date,
          carriers (id, code, name)
        `)
        .eq('profile_id', profileId);

      // Process carrier data
      const carrierMap = new Map<string, CarrierData>();
      let maCount = 0;
      let pdpCount = 0;

      if (policies) {
        for (const policy of policies) {
          if (!policy.carriers) continue;

          const carrier = policy.carriers as { id: string; code: string; name: string };

          if (!carrierMap.has(carrier.id)) {
            carrierMap.set(carrier.id, {
              id: carrier.id,
              code: carrier.code,
              name: carrier.name,
              clientCount: 0,
              lastUploadDate: null,
            });
          }

          if (policy.status === 'active') {
            const data = carrierMap.get(carrier.id)!;
            data.clientCount++;

            const planLower = (policy.plan_name || '').toLowerCase();
            if (planLower.includes('pdp') || planLower.includes('prescription')) {
              pdpCount++;
            } else {
              maCount++;
            }
          }
        }
      }

      setActiveMA(maCount);
      setActivePDP(pdpCount);

      // Fetch last upload dates per carrier
      const { data: uploads } = await supabase
        .from('production_uploads')
        .select('carrier_id, completed_at')
        .eq('profile_id', profileId)
        .eq('status', 'complete')
        .order('completed_at', { ascending: false });

      if (uploads) {
        const seenCarriers = new Set<string>();
        for (const upload of uploads) {
          if (!seenCarriers.has(upload.carrier_id)) {
            seenCarriers.add(upload.carrier_id);
            const carrier = carrierMap.get(upload.carrier_id);
            if (carrier && upload.completed_at) {
              carrier.lastUploadDate = new Date(upload.completed_at);
            }
          }
        }
      }

      const carriers = Array.from(carrierMap.values()).filter((c) => c.clientCount > 0);
      setCarrierData(carriers);

      // Calculate new this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

      const { count: newCount } = await supabase
        .from('policies')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', profileId)
        .eq('status', 'active')
        .gte('effective_date', startOfMonthStr);

      setNewThisMonth(newCount || 0);

      // Fetch recent activity
      const { data: recentPolicies } = await supabase
        .from('policies')
        .select(`
          id,
          status,
          effective_date,
          term_date,
          plan_name,
          clients (first_name, last_name),
          carriers (name)
        `)
        .eq('profile_id', profileId)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (recentPolicies) {
        const activity: RecentActivity[] = recentPolicies.map((p) => {
          const client = p.clients as { first_name: string; last_name: string } | null;
          const carrier = p.carriers as { name: string } | null;
          const clientName = client
            ? `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unknown'
            : 'Unknown';
          return {
            id: p.id,
            clientName,
            carrierName: carrier?.name || 'Unknown',
            planName: p.plan_name || '',
            status: p.status as 'active' | 'termed',
            effectiveDate: p.effective_date,
            termDate: p.term_date,
          };
        });
        setRecentActivity(activity);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const totalActive = activeMA + activePDP;
  const retentionRate = totalClients > 0 ? Math.round((totalActive / totalClients) * 100) : 0;

  return (
    <div className="bg-white dark:bg-card">
      {/* Header */}
      <div className="px-8 py-5 flex items-center justify-between border-b border-gray-100 dark:border-border">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">Book of Business</h1>
        <Button onClick={onUploadClick} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Report
        </Button>
      </div>

      {/* Hero Section */}
      <div className="px-8 py-16 text-center">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-4">Your Book</p>
        <div className="flex items-baseline justify-center gap-4">
          <span
            className="text-8xl font-bold text-gray-900 dark:text-foreground tracking-tight"
            style={{ textShadow: '0 0 80px rgba(34, 197, 94, 0.15)' }}
          >
            {totalClients.toLocaleString()}
          </span>
          <span className="text-3xl text-gray-300 dark:text-muted-foreground font-light">clients</span>
        </div>

        {newThisMonth > 0 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
              <ArrowUp className="w-4 h-4" />
              +{newThisMonth} this month
            </div>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="px-8 py-8 border-t border-gray-100 dark:border-border">
        <div className="flex justify-center gap-16">
          <div className="text-center">
            <p className="text-4xl font-semibold text-gray-900 dark:text-foreground">{activeMA.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mt-1">Active MA</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-semibold text-gray-900 dark:text-foreground">{activePDP.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mt-1">Active PDP</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-semibold text-gray-900 dark:text-foreground">{retentionRate}%</p>
            <p className="text-sm text-gray-400 mt-1">Retention</p>
          </div>
        </div>
      </div>

      {/* Carrier Section */}
      {carrierData.length > 0 && (
        <div className="px-8 py-10 bg-gray-50/50 dark:bg-muted/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-6">By Carrier</h2>
          <div className={cn(
            'grid gap-5',
            carrierData.length === 1 ? 'grid-cols-1 max-w-xs' :
            carrierData.length === 2 ? 'grid-cols-2 max-w-xl' :
            carrierData.length === 3 ? 'grid-cols-3 max-w-3xl' : 'grid-cols-4'
          )}>
            {carrierData.map((carrier) => (
              <CarrierCard
                key={carrier.id}
                carrier={{ name: carrier.name, code: carrier.code }}
                clientCount={carrier.clientCount}
                totalClients={totalActive}
                lastUploadDate={carrier.lastUploadDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">Recent Activity</h2>
            <button className="text-sm text-primary font-medium hover:text-primary/80 transition-colors">
              View all clients →
            </button>
          </div>

          <div className="space-y-1">
            {recentActivity.map((activity, index) => (
              <div
                key={activity.id}
                className={cn(
                  'flex items-center justify-between py-4 hover:bg-gray-50 dark:hover:bg-muted/30 -mx-4 px-4 rounded-lg transition-colors cursor-pointer',
                  index < recentActivity.length - 1 && 'border-b border-gray-100 dark:border-border'
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-2.5 h-2.5 rounded-full',
                      activity.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                    )}
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-foreground">{activity.clientName}</p>
                    <p className="text-sm text-gray-500 dark:text-muted-foreground">
                      {activity.planName || activity.carrierName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      activity.status === 'active' ? 'text-green-600' : 'text-red-500'
                    )}
                  >
                    {activity.status === 'active' ? 'New' : 'Termed'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {activity.status === 'active' && activity.effectiveDate
                      ? `Effective ${formatDate(activity.effectiveDate)}`
                      : activity.termDate
                      ? formatDate(activity.termDate)
                      : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
