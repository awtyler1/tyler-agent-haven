import { supabase } from '@/integrations/supabase/client';

export interface CommissionRates {
  MA: { initial: number; renewal: number };
  PDP: { initial: number; renewal: number };
}

export interface MonthlyEarnings {
  renewals: { count: number; amount: number };
  planChanges: { count: number; amount: number };
  t65: { count: number; amount: number };
  total: number;
}

export interface Policy {
  id: string;
  effective_date: string | null;
  status: string | null;
  plan_type: string | null;
  is_t65: boolean | null;
}

/**
 * Fetch commission rates for a given year from the database.
 * Falls back to 2026 defaults if fetch fails.
 */
export async function getCommissionRates(year: number): Promise<CommissionRates> {
  const { data, error } = await supabase
    .from('commission_rates')
    .select('plan_type, rate_type, amount')
    .eq('year', year)
    .eq('region', 'national');

  if (error || !data) {
    // Fallback to 2026 defaults if fetch fails
    return {
      MA: { initial: 694, renewal: 347 },
      PDP: { initial: 114, renewal: 57 },
    };
  }

  const rates: CommissionRates = {
    MA: { initial: 694, renewal: 347 },
    PDP: { initial: 114, renewal: 57 },
  };

  for (const row of data) {
    if (row.plan_type === 'MA' || row.plan_type === 'PDP') {
      if (row.rate_type === 'initial') {
        rates[row.plan_type].initial = Number(row.amount);
      } else if (row.rate_type === 'renewal') {
        rates[row.plan_type].renewal = Number(row.amount);
      }
    }
  }

  return rates;
}

/**
 * Calculate monthly earnings for a given month.
 *
 * Commission logic:
 * - Renewals: Policies with effective_date before this year get renewal rate / 12 monthly
 * - T65: New enrollments this month where is_t65=true get initial rate
 * - Plan Changes: New enrollments this month where is_t65=false get renewal rate
 */
export function calculateMonthlyEarnings(
  policies: Policy[],
  month: Date,
  rates: CommissionRates
): MonthlyEarnings {
  const startOfYear = new Date(month.getFullYear(), 0, 1);
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const result: MonthlyEarnings = {
    renewals: { count: 0, amount: 0 },
    planChanges: { count: 0, amount: 0 },
    t65: { count: 0, amount: 0 },
    total: 0,
  };

  for (const policy of policies) {
    if (policy.status !== 'active') continue;
    if (!policy.plan_type || policy.plan_type === 'MEDIGAP' || policy.plan_type === 'OTHER') continue;
    if (!policy.effective_date) continue;

    const effectiveDate = new Date(policy.effective_date);
    const isMA = policy.plan_type === 'MA';
    const rateSet = isMA ? rates.MA : rates.PDP;

    // Renewal: effective before this year, paid monthly
    if (effectiveDate < startOfYear) {
      const monthlyRate = rateSet.renewal / 12;
      result.renewals.count++;
      result.renewals.amount += monthlyRate;
    }
    // New this month: check if T65 or plan change
    else if (effectiveDate >= monthStart && effectiveDate <= monthEnd) {
      if (policy.is_t65) {
        result.t65.count++;
        result.t65.amount += rateSet.initial;
      } else {
        // Default: plan change (renewal rate as one-time)
        result.planChanges.count++;
        result.planChanges.amount += rateSet.renewal;
      }
    }
    // Policies effective earlier this year but not this month: no commission this month
  }

  result.total = result.renewals.amount + result.planChanges.amount + result.t65.amount;

  return result;
}

/**
 * Calculate annual projection based on current book.
 *
 * - Renewing clients (effective before this year) get full year renewal
 * - New enrollments this year get initial (T65) or renewal (plan change) rate
 */
export function calculateAnnualProjection(
  policies: Policy[],
  year: number,
  rates: CommissionRates
): number {
  const startOfYear = new Date(year, 0, 1);

  let renewalBase = 0;
  let newEnrollmentTotal = 0;

  for (const policy of policies) {
    if (policy.status !== 'active') continue;
    if (!policy.plan_type || policy.plan_type === 'MEDIGAP' || policy.plan_type === 'OTHER') continue;
    if (!policy.effective_date) continue;

    const effectiveDate = new Date(policy.effective_date);
    const isMA = policy.plan_type === 'MA';
    const rateSet = isMA ? rates.MA : rates.PDP;

    if (effectiveDate < startOfYear) {
      // Renewing client - gets full year renewal
      renewalBase += rateSet.renewal;
    } else if (effectiveDate.getFullYear() === year) {
      // New enrollment this year
      if (policy.is_t65) {
        newEnrollmentTotal += rateSet.initial;
      } else {
        newEnrollmentTotal += rateSet.renewal;
      }
    }
  }

  return renewalBase + newEnrollmentTotal;
}

/**
 * Get book summary with counts by plan type and enrollment status.
 */
export function getBookSummary(policies: Policy[]): {
  total: number;
  ma: number;
  pdp: number;
  medigap: number;
  other: number;
  renewals: number;
  newThisYear: number;
} {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);

  let ma = 0, pdp = 0, medigap = 0, other = 0, renewals = 0, newThisYear = 0;

  for (const policy of policies) {
    if (policy.status !== 'active') continue;

    switch (policy.plan_type) {
      case 'MA': ma++; break;
      case 'PDP': pdp++; break;
      case 'MEDIGAP': medigap++; break;
      default: other++; break;
    }

    if (policy.effective_date) {
      const effectiveDate = new Date(policy.effective_date);
      if (effectiveDate < startOfYear) {
        renewals++;
      } else {
        newThisYear++;
      }
    }
  }

  return {
    total: ma + pdp + medigap + other,
    ma,
    pdp,
    medigap,
    other,
    renewals,
    newThisYear,
  };
}

/**
 * Derive plan_type from plan_name string.
 * Used by parser and for backfilling.
 */
export function derivePlanType(planName: string | null): 'MA' | 'PDP' | 'MEDIGAP' | 'OTHER' {
  if (!planName) return 'OTHER';
  const name = planName.toLowerCase();

  if (name.includes('pdp') || name.includes('part d') || name.includes('prescription')) {
    return 'PDP';
  }
  if (name.includes('plan g') || name.includes('plan f') || name.includes('plan n') ||
      name.includes('medigap') || name.includes('supplement') ||
      name.includes('modernized') || name.includes('innovative')) {
    return 'MEDIGAP';
  }
  if (name.includes('hmo') || name.includes('ppo') || name.includes('snp') ||
      name.includes('ma ') || name.startsWith('ma ') || name.includes('medicare advantage')) {
    return 'MA';
  }
  return 'OTHER';
}
