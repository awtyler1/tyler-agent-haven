import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PolicyWithClient {
  id: string;
  plan_name: string | null;
  effective_date: string | null;
  is_t65: boolean | null;
  carrier: {
    name: string;
  } | null;
  client: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export default function T65ReviewPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [policies, setPolicies] = useState<PolicyWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'plan_change' | 't65'>('all');

  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1).toISOString().split('T')[0];

  useEffect(() => {
    fetchPolicies();
  }, [profile?.id]);

  const fetchPolicies = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('policies')
        .select(`
          id,
          plan_name,
          effective_date,
          is_t65,
          carrier:carriers(name),
          client:clients(first_name, last_name)
        `)
        .eq('profile_id', profile.id)
        .eq('status', 'active')
        .gte('effective_date', startOfYear)
        .in('plan_type', ['MA', 'PDP'])
        .order('effective_date', { ascending: false });

      if (error) throw error;
      setPolicies((data as PolicyWithClient[]) || []);
    } catch (err) {
      console.error('Error fetching policies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleT65 = (policyId: string, currentValue: boolean | null) => {
    const currentIsT65 = isT65ById(policyId);
    setPendingChanges(prev => ({
      ...prev,
      [policyId]: !currentIsT65
    }));
  };

  const isT65ById = (policyId: string) => {
    if (policyId in pendingChanges) {
      return pendingChanges[policyId];
    }
    const policy = policies.find(p => p.id === policyId);
    return policy?.is_t65 || false;
  };

  const isT65 = (policy: PolicyWithClient) => {
    return isT65ById(policy.id);
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const saveChanges = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      const updates = Object.entries(pendingChanges).map(([id, is_t65]) =>
        supabase
          .from('policies')
          .update({ is_t65 })
          .eq('id', id)
      );

      await Promise.all(updates);

      // Refresh the list
      await fetchPolicies();
      setPendingChanges({});
    } catch (err) {
      console.error('Error saving changes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter policies based on selection
  const filteredPolicies = policies.filter(p => {
    if (filter === 'all') return true;
    if (filter === 't65') return isT65(p);
    if (filter === 'plan_change') return !isT65(p);
    return true;
  });

  const t65Count = policies.filter(p => isT65(p)).length;
  const planChangeCount = policies.length - t65Count;

  // Calculate earnings impact
  const currentEarnings = policies.reduce((sum, p) => {
    return sum + (isT65(p) ? 694 : 347);
  }, 0);

  const getInitials = (policy: PolicyWithClient) => {
    const first = policy.client?.first_name?.[0] || '';
    const last = policy.client?.last_name?.[0] || '';
    return (first + last).toUpperCase() || '??';
  };

  const getFullName = (policy: PolicyWithClient) => {
    const first = policy.client?.first_name || '';
    const last = policy.client?.last_name || '';
    return `${first} ${last}`.trim() || 'Unknown Client';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="px-6 py-5">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-stone-200 dark:border-border px-6 py-4 rounded-xl mb-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-stone-600 dark:text-muted-foreground hover:text-stone-900 dark:hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-foreground">Review T65 Enrollments</h1>
          <p className="text-stone-500 dark:text-muted-foreground mt-1">
            Mark clients who are new to Medicare to see accurate commission projections
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Summary Card */}
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-stone-200 dark:border-border p-6 mb-6">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-stone-500 dark:text-muted-foreground">Tagged T65</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{t65Count}</p>
            </div>
            <div className="w-px h-10 bg-stone-200 dark:bg-border"></div>
            <div>
              <p className="text-sm text-stone-500 dark:text-muted-foreground">Plan Changes</p>
              <p className="text-2xl font-bold text-stone-900 dark:text-foreground">{planChangeCount}</p>
            </div>
            <div className="w-px h-10 bg-stone-200 dark:bg-border"></div>
            <div>
              <p className="text-sm text-stone-500 dark:text-muted-foreground">Projected Earnings</p>
              <p className="text-2xl font-bold text-stone-900 dark:text-foreground">
                ${currentEarnings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Policy List */}
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-stone-200 dark:border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 dark:border-border flex items-center justify-between">
            <p className="font-medium text-stone-900 dark:text-foreground">
              {currentYear} Enrollments ({policies.length})
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-500 dark:text-muted-foreground">Filter:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'plan_change' | 't65')}
                className="text-sm border border-stone-200 dark:border-border dark:bg-muted rounded-lg px-2 py-1"
              >
                <option value="all">All clients</option>
                <option value="plan_change">Plan change only</option>
                <option value="t65">T65 only</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center text-stone-500 dark:text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading policies...
            </div>
          ) : policies.length === 0 ? (
            <div className="px-6 py-12 text-center text-stone-500 dark:text-muted-foreground">
              No new enrollments this year
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="px-6 py-12 text-center text-stone-500 dark:text-muted-foreground">
              No policies match this filter
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-border">
              {filteredPolicies.map(policy => {
                const tagged = isT65(policy);
                const hasChange = policy.id in pendingChanges;

                return (
                  <div
                    key={policy.id}
                    className={`px-6 py-4 flex items-center justify-between ${
                      tagged ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-stone-50 dark:hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tagged ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-stone-100 dark:bg-muted'
                      }`}>
                        <span className={`font-medium text-sm ${
                          tagged ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-600 dark:text-muted-foreground'
                        }`}>
                          {getInitials(policy)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-stone-900 dark:text-foreground">{getFullName(policy)}</p>
                        <p className="text-sm text-stone-500 dark:text-muted-foreground">
                          {policy.carrier?.name || 'Unknown'} · {policy.plan_name || 'Unknown Plan'} · Eff. {formatDate(policy.effective_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm ${tagged ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'text-stone-500 dark:text-muted-foreground'}`}>
                        {tagged ? '$694' : '$347'}
                      </span>
                      <button
                        onClick={() => toggleT65(policy.id, policy.is_t65)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          tagged
                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800'
                            : 'text-stone-600 dark:text-muted-foreground border border-stone-200 dark:border-border hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-800 hover:text-emerald-700 dark:hover:text-emerald-400'
                        } ${hasChange ? 'ring-2 ring-blue-300 dark:ring-blue-600' : ''}`}
                      >
                        {tagged ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            T65
                          </span>
                        ) : (
                          'Mark T65'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-stone-100 dark:bg-muted rounded-xl">
          <p className="text-sm text-stone-600 dark:text-muted-foreground">
            <strong className="text-stone-900 dark:text-foreground">When to mark T65:</strong> Select "T65" for clients who just turned 65 or became
            newly eligible for Medicare. These clients earn the initial commission rate ($694)
            instead of the plan change rate ($347).
          </p>
        </div>
      </div>

      {/* Sticky Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-stone-200 dark:border-border px-6 py-4 shadow-lg">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <p className="text-sm text-stone-500 dark:text-muted-foreground">
              {Object.keys(pendingChanges).length} unsaved {Object.keys(pendingChanges).length === 1 ? 'change' : 'changes'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPendingChanges({})}
                className="px-4 py-2 text-sm text-stone-600 dark:text-muted-foreground hover:text-stone-900 dark:hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={saveChanges}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom padding for sticky bar */}
      {hasChanges && <div className="h-20"></div>}
    </div>
  );
}
