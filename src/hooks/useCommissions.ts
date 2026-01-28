import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getCommissionRates,
  calculateMonthlyEarnings,
  calculateAnnualProjection,
  getBookSummary,
  CommissionRates,
  MonthlyEarnings,
  Policy
} from '@/lib/commissions';

interface UseCommissionsResult {
  isLoading: boolean;
  error: string | null;
  rates: CommissionRates | null;
  monthlyEarnings: MonthlyEarnings | null;
  annualProjection: number | null;
  bookSummary: ReturnType<typeof getBookSummary> | null;
  untaggedNewPolicies: number;
  refetch: () => Promise<void>;
}

export function useCommissions(profileId: string | undefined): UseCommissionsResult {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<CommissionRates | null>(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarnings | null>(null);
  const [annualProjection, setAnnualProjection] = useState<number | null>(null);
  const [bookSummary, setBookSummary] = useState<ReturnType<typeof getBookSummary> | null>(null);
  const [untaggedNewPolicies, setUntaggedNewPolicies] = useState(0);

  const fetchData = async () => {
    if (!profileId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch policies
      const { data: policies, error: policiesError } = await supabase
        .from('policies')
        .select('id, effective_date, status, plan_type, is_t65')
        .eq('profile_id', profileId)
        .eq('status', 'active');

      if (policiesError) throw policiesError;

      const policyData = (policies || []) as Policy[];

      // Fetch rates for current year
      const currentYear = new Date().getFullYear();
      const ratesData = await getCommissionRates(currentYear);
      setRates(ratesData);

      // Calculate earnings for current month
      const currentMonth = new Date();
      const earnings = calculateMonthlyEarnings(policyData, currentMonth, ratesData);
      setMonthlyEarnings(earnings);

      // Calculate annual projection
      const annual = calculateAnnualProjection(policyData, currentYear, ratesData);
      setAnnualProjection(annual);

      // Get book summary
      const summary = getBookSummary(policyData);
      setBookSummary(summary);

      // Count untagged new policies (plan changes that could be T65)
      const startOfYear = new Date(currentYear, 0, 1);
      const untagged = policyData.filter(p => {
        if (!p.effective_date || p.is_t65) return false;
        const effDate = new Date(p.effective_date);
        return effDate >= startOfYear && (p.plan_type === 'MA' || p.plan_type === 'PDP');
      }).length;
      setUntaggedNewPolicies(untagged);

    } catch (err) {
      console.error('Error fetching commission data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load commission data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profileId]);

  return {
    isLoading,
    error,
    rates,
    monthlyEarnings,
    annualProjection,
    bookSummary,
    untaggedNewPolicies,
    refetch: fetchData,
  };
}
